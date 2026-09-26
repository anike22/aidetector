DROP FUNCTION IF EXISTS get_user_entitlement_summary(uuid,text,text);
DROP FUNCTION IF EXISTS reserve_entitlement_and_credits(uuid,text,text,integer,text,text,jsonb);
DROP FUNCTION IF EXISTS issue_or_validate_guest_session(text,text,text,text);

-- 1. Issue or validate guest session
CREATE OR REPLACE FUNCTION issue_or_validate_guest_session(
  p_guest_id TEXT,
  p_ip TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_timezone TEXT DEFAULT 'UTC'
)
RETURNS TABLE (
  guest_id TEXT,
  daily_limit INTEGER,
  daily_used INTEGER,
  daily_remaining INTEGER,
  reset_at TIMESTAMPTZ,
  is_blocked BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today_date DATE;
  v_reset_at TIMESTAMPTZ;
  v_session RECORD;
  v_daily_limit INT := 3;
  v_daily_used INT := 0;
BEGIN
  -- Look up configured guest daily limit from feature_limits
  SELECT COALESCE(fl.daily_limit, 3) INTO v_daily_limit
  FROM feature_limits fl
  WHERE fl.feature_slug = 'ai_detector' AND fl.plan = 'guest'
  LIMIT 1;
  IF v_daily_limit IS NULL THEN v_daily_limit := 3; END IF;

  v_today_date := (CURRENT_TIMESTAMP AT TIME ZONE COALESCE(p_timezone, 'UTC'))::DATE;
  v_reset_at := ((v_today_date + 1)::TEXT || ' 00:00:00')::TIMESTAMP AT TIME ZONE COALESCE(p_timezone, 'UTC');

  -- Upsert guest session
  INSERT INTO server_guest_sessions (
    guest_id, daily_allowance, used_today, usage_date, total_used, ip_address, user_agent, created_at, updated_at, last_active_at
  ) VALUES (
    p_guest_id, v_daily_limit, 0, v_today_date, 0, p_ip, p_user_agent, NOW(), NOW(), NOW()
  )
  ON CONFLICT (guest_id) DO UPDATE
  SET last_active_at = NOW(),
      ip_address = COALESCE(EXCLUDED.ip_address, server_guest_sessions.ip_address),
      user_agent = COALESCE(EXCLUDED.user_agent, server_guest_sessions.user_agent),
      daily_allowance = v_daily_limit,
      used_today = CASE WHEN server_guest_sessions.usage_date < v_today_date THEN 0 ELSE server_guest_sessions.used_today END,
      usage_date = v_today_date,
      updated_at = NOW()
  RETURNING * INTO v_session;

  v_daily_used := COALESCE(v_session.used_today, 0);

  RETURN QUERY
  SELECT
    p_guest_id,
    v_daily_limit,
    v_daily_used,
    GREATEST(0, v_daily_limit - v_daily_used),
    v_reset_at,
    FALSE;
END;
$$;

-- 2. Reserve entitlement and credits
CREATE OR REPLACE FUNCTION reserve_entitlement_and_credits(
  p_user_id UUID DEFAULT NULL,
  p_guest_id TEXT DEFAULT NULL,
  p_feature_slug TEXT DEFAULT 'ai_detector',
  p_credits_cost INTEGER DEFAULT 1,
  p_timezone TEXT DEFAULT 'UTC',
  p_idempotency_key TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  allowed BOOLEAN,
  reservation_id UUID,
  reason TEXT,
  error_code TEXT,
  plan TEXT,
  remaining_credits INTEGER,
  daily_remaining INTEGER,
  daily_limit INTEGER,
  reset_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT := 'guest';
  v_status TEXT := 'Active';
  v_plan_end TIMESTAMPTZ;
  v_credits_bal INTEGER := 0;
  v_is_paid_active BOOLEAN := FALSE;
  v_daily_limit INTEGER := NULL;
  v_daily_used INTEGER := 0;
  v_today DATE;
  v_reset_at TIMESTAMPTZ;
  v_res_id UUID := NULL;
  v_existing_res public.credit_reservations%ROWTYPE;
  v_guest public.server_guest_sessions%ROWTYPE;
  v_cost INTEGER := GREATEST(p_credits_cost, 1);
BEGIN
  v_today := (CURRENT_TIMESTAMP AT TIME ZONE COALESCE(p_timezone, 'UTC'))::DATE;
  v_reset_at := ((v_today + 1)::TEXT || ' 00:00:00')::TIMESTAMP AT TIME ZONE COALESCE(p_timezone, 'UTC');

  -- Check idempotency
  IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) > 0 THEN
    SELECT * INTO v_existing_res FROM public.credit_reservations WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
      IF v_existing_res.status IN ('reserved', 'committed') THEN
        RETURN QUERY SELECT
          TRUE,
          v_existing_res.id,
          'Idempotent request recognized'::TEXT,
          NULL::TEXT,
          'active'::TEXT,
          0::INTEGER,
          0::INTEGER,
          0::INTEGER,
          v_reset_at;
        RETURN;
      END IF;
    END IF;
  END IF;

  -- 1. AUTHENTICATED USER PATH
  IF p_user_id IS NOT NULL THEN
    SELECT
      COALESCE(subscription_plan, 'free'),
      COALESCE(subscription_status, 'Active'),
      plan_end_date,
      COALESCE(credits_balance, 0)
    INTO v_plan, v_status, v_plan_end, v_credits_bal
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN QUERY SELECT FALSE, NULL::UUID, 'User profile not found'::TEXT, 'USER_NOT_FOUND'::TEXT, 'free'::TEXT, 0, 0, 0, v_reset_at;
      RETURN;
    END IF;

    -- Check subscription validity
    IF lower(v_plan) IN ('pro', 'business', 'enterprise') THEN
      IF v_status IN ('Active', 'trialing', 'Cancelled', 'canceled') AND (v_plan_end IS NULL OR v_plan_end > NOW()) THEN
        v_is_paid_active := TRUE;
      ELSE
        v_is_paid_active := FALSE;
        v_plan := 'free';
      END IF;
    END IF;

    -- Check feature limits for this plan
    SELECT feature_limits.daily_limit INTO v_daily_limit
    FROM public.feature_limits
    WHERE feature_limits.feature_slug = p_feature_slug
      AND feature_limits.plan = lower(v_plan);

    IF v_plan = 'free' AND v_daily_limit IS NULL THEN
      v_daily_limit := 10;
    END IF;

    -- If feature is unavailable on Free tier
    IF (NOT FOUND OR v_daily_limit = 0) AND NOT v_is_paid_active THEN
      RETURN QUERY SELECT
        FALSE,
        NULL::UUID,
        'This feature is exclusive to Pro and Enterprise plans. Upgrade to access.'::TEXT,
        'FEATURE_PLAN_LOCKED'::TEXT,
        v_plan,
        v_credits_bal,
        0,
        0,
        v_reset_at;
      RETURN;
    END IF;

    -- Check daily limit if configured
    IF v_daily_limit IS NOT NULL AND v_daily_limit > 0 THEN
      SELECT COALESCE(used_count, 0) INTO v_daily_used
      FROM public.user_feature_usage
      WHERE user_id = p_user_id
        AND feature_slug = p_feature_slug
        AND usage_date = v_today;

      IF v_daily_used >= v_daily_limit THEN
        RETURN QUERY SELECT
          FALSE,
          NULL::UUID,
          ('Daily free allowance of ' || v_daily_limit || ' scans reached. Resets at ' || to_char(v_reset_at, 'HH24:MI OF') || '. Upgrade for more access.')::TEXT,
          'DAILY_LIMIT_REACHED'::TEXT,
          v_plan,
          v_credits_bal,
          0,
          v_daily_limit,
          v_reset_at;
        RETURN;
      END IF;
    END IF;

    -- Check credit consumption if required
    IF NOT v_is_paid_active AND v_daily_limit IS NULL THEN
      IF v_credits_bal < v_cost THEN
        RETURN QUERY SELECT
          FALSE,
          NULL::UUID,
          ('Credits exhausted. This operation requires ' || v_cost || ' credits, but your balance is ' || v_credits_bal || '.')::TEXT,
          'CREDITS_EXHAUSTED'::TEXT,
          v_plan,
          v_credits_bal,
          0,
          COALESCE(v_daily_limit, 0),
          v_reset_at;
        RETURN;
      END IF;
    END IF;

    -- Deduct/reserve credits if user uses credit balance
    IF v_credits_bal >= v_cost THEN
      UPDATE public.profiles
      SET credits_balance = credits_balance - v_cost,
          updated_at = NOW()
      WHERE id = p_user_id;
      v_credits_bal := v_credits_bal - v_cost;
    END IF;

    -- Create reservation record
    INSERT INTO public.credit_reservations (
      user_id, guest_id, feature_slug, credits_reserved, status, idempotency_key, metadata, created_at, expires_at
    ) VALUES (
      p_user_id, p_guest_id, p_feature_slug, v_cost, 'reserved', p_idempotency_key, p_metadata, NOW(), NOW() + INTERVAL '10 minutes'
    ) RETURNING id INTO v_res_id;

    RETURN QUERY SELECT
      TRUE,
      v_res_id,
      NULL::TEXT,
      NULL::TEXT,
      v_plan,
      v_credits_bal,
      CASE WHEN v_daily_limit IS NOT NULL THEN GREATEST(v_daily_limit - v_daily_used, 0)::INTEGER ELSE NULL::INTEGER END,
      v_daily_limit,
      v_reset_at;
    RETURN;

  -- 2. GUEST / VISITOR PATH
  ELSE
    IF p_guest_id IS NULL OR length(trim(p_guest_id)) < 4 THEN
      RETURN QUERY SELECT
        FALSE,
        NULL::UUID,
        'Server guest identity required. Please refresh or create a free account.'::TEXT,
        'GUEST_IDENTITY_MISSING'::TEXT,
        'guest'::TEXT,
        0, 0, 0, v_reset_at;
      RETURN;
    END IF;

    -- Fetch guest daily limit from feature_limits
    SELECT COALESCE(fl.daily_limit, 3) INTO v_daily_limit
    FROM public.feature_limits fl
    WHERE fl.feature_slug = 'ai_detector' AND fl.plan = 'guest'
    LIMIT 1;
    IF v_daily_limit IS NULL THEN v_daily_limit := 3; END IF;

    SELECT * INTO v_guest FROM public.server_guest_sessions WHERE guest_id = p_guest_id FOR UPDATE;

    IF NOT FOUND THEN
      INSERT INTO public.server_guest_sessions (
        guest_id, daily_allowance, used_today, usage_date, total_used, created_at, updated_at, last_active_at
      ) VALUES (
        p_guest_id, v_daily_limit, 0, v_today, 0, NOW(), NOW(), NOW()
      ) RETURNING * INTO v_guest;
    ELSE
      -- Check reset date or update daily allowance
      IF v_guest.usage_date < v_today THEN
        UPDATE public.server_guest_sessions
        SET used_today = 0,
            usage_date = v_today,
            daily_allowance = v_daily_limit,
            updated_at = NOW(),
            last_active_at = NOW()
        WHERE guest_id = p_guest_id
        RETURNING * INTO v_guest;
      ELSIF v_guest.daily_allowance != v_daily_limit THEN
        UPDATE public.server_guest_sessions
        SET daily_allowance = v_daily_limit,
            updated_at = NOW(),
            last_active_at = NOW()
        WHERE guest_id = p_guest_id
        RETURNING * INTO v_guest;
      END IF;
    END IF;

    -- Check if feature is allowed for guests
    IF p_feature_slug NOT IN ('ai_detector', 'detector') THEN
      RETURN QUERY SELECT
        FALSE,
        NULL::UUID,
        'This tool requires a free or Pro account. Create a free account to continue.'::TEXT,
        'FEATURE_REQUIRES_LOGIN'::TEXT,
        'guest'::TEXT,
        0,
        GREATEST(v_guest.daily_allowance - v_guest.used_today, 0)::INTEGER,
        v_guest.daily_allowance,
        v_reset_at;
      RETURN;
    END IF;

    -- Check guest daily allowance
    IF v_guest.used_today >= v_guest.daily_allowance THEN
      RETURN QUERY SELECT
        FALSE,
        NULL::UUID,
        ('Guest daily scan limit reached (' || v_guest.used_today || '/' || v_guest.daily_allowance || ' used). Create a free account for 10 scans/day, or upgrade to Pro.')::TEXT,
        'DAILY_LIMIT_REACHED'::TEXT,
        'guest'::TEXT,
        0,
        0,
        v_guest.daily_allowance,
        v_reset_at;
      RETURN;
    END IF;

    -- Create guest reservation
    INSERT INTO public.credit_reservations (
      user_id, guest_id, feature_slug, credits_reserved, status, idempotency_key, metadata, created_at, expires_at
    ) VALUES (
      NULL, p_guest_id, p_feature_slug, 1, 'reserved', p_idempotency_key, p_metadata, NOW(), NOW() + INTERVAL '10 minutes'
    ) RETURNING id INTO v_res_id;

    RETURN QUERY SELECT
      TRUE,
      v_res_id,
      NULL::TEXT,
      NULL::TEXT,
      'guest'::TEXT,
      0,
      GREATEST(v_guest.daily_allowance - v_guest.used_today, 0)::INTEGER,
      v_guest.daily_allowance,
      v_reset_at;
    RETURN;
  END IF;
END;
$$;

-- 3. Get user entitlement summary
CREATE OR REPLACE FUNCTION get_user_entitlement_summary(
  p_user_id UUID DEFAULT NULL,
  p_guest_id TEXT DEFAULT NULL,
  p_timezone TEXT DEFAULT 'UTC'
)
RETURNS TABLE (
  plan TEXT,
  status TEXT,
  is_paid_active BOOLEAN,
  credits_balance INT,
  credits_used_total INT,
  daily_limit INT,
  daily_used INT,
  daily_remaining INT,
  reset_at TIMESTAMPTZ,
  warning_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT := 'guest';
  v_status TEXT := 'Active';
  v_is_paid BOOLEAN := FALSE;
  v_credits_balance INT := 0;
  v_credits_used INT := 0;
  v_daily_limit INT := 3;
  v_daily_used INT := 0;
  v_daily_remaining INT := 3;
  v_today_date DATE;
  v_reset_at TIMESTAMPTZ;
  v_warning_level TEXT := 'normal';
  v_profile RECORD;
  v_guest RECORD;
  v_usage_pct NUMERIC := 0;
BEGIN
  v_today_date := (CURRENT_TIMESTAMP AT TIME ZONE COALESCE(p_timezone, 'UTC'))::DATE;
  v_reset_at := ((v_today_date + 1)::TEXT || ' 00:00:00')::TIMESTAMP AT TIME ZONE COALESCE(p_timezone, 'UTC');

  IF p_user_id IS NOT NULL THEN
    SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
    IF FOUND THEN
      v_plan := COALESCE(v_profile.subscription_plan, 'free');
      v_status := COALESCE(v_profile.subscription_status, 'Active');
      v_is_paid := (v_plan IN ('pro', 'enterprise', 'business') AND (v_status IN ('Active', 'active', 'trialing') OR (v_profile.plan_end_date IS NOT NULL AND v_profile.plan_end_date > NOW())));
      v_credits_balance := COALESCE(v_profile.credits_balance, 0);

      SELECT fl.daily_limit INTO v_daily_limit
      FROM feature_limits fl
      WHERE fl.feature_slug = 'ai_detector' AND fl.plan = v_plan
      LIMIT 1;

      IF v_plan = 'free' AND v_daily_limit IS NULL THEN
        v_daily_limit := 10;
      END IF;

      SELECT COALESCE(used_count, 0) INTO v_daily_used
      FROM user_feature_usage
      WHERE user_id = p_user_id AND feature_slug = 'ai_detector' AND usage_date = v_today_date
      LIMIT 1;

      SELECT COALESCE(SUM(credits_amount), 0) INTO v_credits_used
      FROM usage_ledger
      WHERE user_id = p_user_id AND outcome = 'success';
    END IF;
  ELSIF p_guest_id IS NOT NULL AND length(trim(p_guest_id)) > 0 THEN
    v_plan := 'guest';
    v_status := 'Active';
    v_is_paid := FALSE;

    SELECT COALESCE(fl.daily_limit, 3) INTO v_daily_limit
    FROM feature_limits fl
    WHERE fl.feature_slug = 'ai_detector' AND fl.plan = 'guest'
    LIMIT 1;
    IF v_daily_limit IS NULL THEN v_daily_limit := 3; END IF;

    SELECT * INTO v_guest
    FROM server_guest_sessions
    WHERE guest_id = p_guest_id
    LIMIT 1;

    IF FOUND THEN
      IF v_guest.usage_date = v_today_date THEN
        v_daily_used := COALESCE(v_guest.used_today, 0);
      ELSE
        v_daily_used := 0;
      END IF;
    ELSE
      v_daily_used := 0;
    END IF;
  ELSE
    -- Default guest fallback
    v_plan := 'guest';
    v_status := 'Active';
    v_is_paid := FALSE;
    v_daily_limit := 3;
    v_daily_used := 0;
  END IF;

  IF v_daily_limit IS NOT NULL THEN
    v_daily_remaining := GREATEST(0, v_daily_limit - v_daily_used);
    IF v_daily_limit > 0 THEN
      v_usage_pct := (v_daily_used::NUMERIC / v_daily_limit::NUMERIC);
      IF v_daily_used >= v_daily_limit THEN
        v_warning_level := 'exhausted';
      ELSIF v_usage_pct >= 0.95 THEN
        v_warning_level := 'warning_95';
      ELSIF v_usage_pct >= 0.80 THEN
        v_warning_level := 'warning_80';
      ELSE
        v_warning_level := 'normal';
      END IF;
    END IF;
  ELSE
    v_daily_remaining := 999999;
    v_warning_level := 'normal';
  END IF;

  RETURN QUERY
  SELECT
    v_plan,
    v_status,
    v_is_paid,
    v_credits_balance,
    v_credits_used,
    v_daily_limit,
    v_daily_used,
    v_daily_remaining,
    v_reset_at,
    v_warning_level;
END;
$$;
