DROP FUNCTION IF EXISTS issue_or_validate_guest_session(text,text,text,text);
DROP FUNCTION IF EXISTS get_user_entitlement_summary(uuid,text,text);

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
  v_daily_used INT := 0;
  v_guest_limit INT := 3;
BEGIN
  -- Look up configured guest daily limit from feature_limits
  SELECT COALESCE(fl.daily_limit, 3) INTO v_guest_limit
  FROM feature_limits fl
  WHERE fl.feature_slug = 'ai_detector' AND fl.plan = 'guest'
  LIMIT 1;
  IF v_guest_limit IS NULL THEN v_guest_limit := 3; END IF;

  v_today_date := (CURRENT_TIMESTAMP AT TIME ZONE COALESCE(p_timezone, 'UTC'))::DATE;
  v_reset_at := ((v_today_date + 1)::TEXT || ' 00:00:00')::TIMESTAMP AT TIME ZONE COALESCE(p_timezone, 'UTC');

  -- Upsert guest session
  INSERT INTO server_guest_sessions (guest_id, ip_address, user_agent, last_seen_at)
  VALUES (p_guest_id, p_ip, p_user_agent, NOW())
  ON CONFLICT (guest_id) DO UPDATE
  SET last_seen_at = NOW(),
      ip_address = COALESCE(EXCLUDED.ip_address, server_guest_sessions.ip_address),
      user_agent = COALESCE(EXCLUDED.user_agent, server_guest_sessions.user_agent)
  RETURNING * INTO v_session;

  -- Count guest usage today
  SELECT COALESCE(count, 0) INTO v_daily_used
  FROM guest_usage
  WHERE (guest_id = p_guest_id OR visitor_id = p_guest_id)
    AND date = v_today_date
  LIMIT 1;

  RETURN QUERY
  SELECT
    p_guest_id,
    v_guest_limit,
    COALESCE(v_daily_used, 0),
    GREATEST(0, v_guest_limit - COALESCE(v_daily_used, 0)),
    v_reset_at,
    COALESCE(v_session.is_blocked, FALSE);
END;
$$;

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

      -- Fetch daily limit from feature_limits for this plan
      SELECT fl.daily_limit INTO v_daily_limit
      FROM feature_limits fl
      WHERE fl.feature_slug = 'ai_detector' AND fl.plan = v_plan
      LIMIT 1;

      -- If free plan has no row or row is null, default to 10
      IF v_plan = 'free' AND v_daily_limit IS NULL THEN
        v_daily_limit := 10;
      END IF;

      -- Fetch user daily usage
      SELECT COALESCE(usage_count, 0) INTO v_daily_used
      FROM user_feature_usage
      WHERE user_id = p_user_id AND feature_slug = 'ai_detector' AND usage_date = v_today_date
      LIMIT 1;

      -- Total credits used
      SELECT COALESCE(SUM(credits_amount), 0) INTO v_credits_used
      FROM usage_ledger
      WHERE user_id = p_user_id AND outcome = 'success';
    END IF;
  ELSIF p_guest_id IS NOT NULL THEN
    v_plan := 'guest';
    v_status := 'Active';
    v_is_paid := FALSE;
    
    SELECT COALESCE(fl.daily_limit, 3) INTO v_daily_limit
    FROM feature_limits fl
    WHERE fl.feature_slug = 'ai_detector' AND fl.plan = 'guest'
    LIMIT 1;
    IF v_daily_limit IS NULL THEN v_daily_limit := 3; END IF;

    SELECT COALESCE(count, 0) INTO v_daily_used
    FROM guest_usage
    WHERE (guest_id = p_guest_id OR visitor_id = p_guest_id) AND date = v_today_date
    LIMIT 1;
  END IF;

  IF v_daily_limit IS NOT NULL THEN
    v_daily_remaining := GREATEST(0, v_daily_limit - v_daily_used);
    IF v_daily_limit > 0 THEN
      v_usage_pct := (v_daily_used::NUMERIC / v_daily_limit::NUMERIC);
      IF v_usage_pct >= 1.0 THEN
        v_warning_level := 'exhausted';
      ELSIF v_usage_pct >= 0.95 THEN
        v_warning_level := 'critical';
      ELSIF v_usage_pct >= 0.80 THEN
        v_warning_level := 'warning';
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
