-- 1. Create server_guest_sessions table
CREATE TABLE IF NOT EXISTS public.server_guest_sessions (
  guest_id text PRIMARY KEY,
  ip_address text,
  user_agent text,
  daily_allowance integer NOT NULL DEFAULT 5,
  used_today integer NOT NULL DEFAULT 0,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  total_used integer NOT NULL DEFAULT 0,
  linked_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_sessions_ip ON public.server_guest_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_linked_user ON public.server_guest_sessions(linked_user_id);

-- 2. Create credit_reservations table
CREATE TABLE IF NOT EXISTS public.credit_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id text,
  feature_slug text NOT NULL,
  credits_reserved integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'committed', 'released', 'expired')),
  idempotency_key text UNIQUE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  finalized_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_credit_reservations_user ON public.credit_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_reservations_guest ON public.credit_reservations(guest_id);
CREATE INDEX IF NOT EXISTS idx_credit_reservations_status ON public.credit_reservations(status);

-- 3. Create usage_ledger table
CREATE TABLE IF NOT EXISTS public.usage_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_id text,
  feature_slug text NOT NULL,
  operation text NOT NULL,
  credits_amount integer NOT NULL DEFAULT 1,
  outcome text NOT NULL CHECK (outcome IN ('success', 'failed', 'refunded', 'rejected')),
  reservation_id uuid REFERENCES public.credit_reservations(id) ON DELETE SET NULL,
  error_reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_ledger_user ON public.usage_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_ledger_guest ON public.usage_ledger(guest_id);
CREATE INDEX IF NOT EXISTS idx_usage_ledger_created_at ON public.usage_ledger(created_at DESC);

-- Enable RLS on all new tables
ALTER TABLE public.server_guest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_ledger ENABLE ROW LEVEL SECURITY;

-- Server Guest Sessions RLS
CREATE POLICY "Allow server/admins to manage guest sessions"
  ON public.server_guest_sessions FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Credit Reservations RLS
CREATE POLICY "Users can view their own reservations"
  ON public.credit_reservations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service and functions can manage reservations"
  ON public.credit_reservations FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Usage Ledger RLS
CREATE POLICY "Users can view their own usage ledger"
  ON public.usage_ledger FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service and functions can manage ledger"
  ON public.usage_ledger FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- 4. RPC: issue_or_validate_guest_session
CREATE OR REPLACE FUNCTION public.issue_or_validate_guest_session(
  p_guest_id text,
  p_ip text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_timezone text DEFAULT 'UTC'
)
RETURNS TABLE (
  guest_id text,
  daily_allowance integer,
  used_today integer,
  remaining_today integer,
  reset_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_gid text;
  v_today date;
  v_session public.server_guest_sessions%ROWTYPE;
  v_reset_at timestamptz;
BEGIN
  v_today := (current_timestamp AT TIME ZONE p_timezone)::date;
  v_reset_at := ((v_today + interval '1 day') AT TIME ZONE p_timezone);

  IF p_guest_id IS NOT NULL AND length(trim(p_guest_id)) > 8 THEN
    v_gid := trim(p_guest_id);
  ELSE
    v_gid := 'gst_' || encode(gen_random_bytes(16), 'hex');
  END IF;

  SELECT * INTO v_session FROM public.server_guest_sessions WHERE server_guest_sessions.guest_id = v_gid FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.server_guest_sessions (
      guest_id, ip_address, user_agent, daily_allowance, used_today, usage_date, total_used, created_at, updated_at, last_active_at
    ) VALUES (
      v_gid, p_ip, p_user_agent, 5, 0, v_today, 0, now(), now(), now()
    ) RETURNING * INTO v_session;
  ELSE
    -- Check if daily reset is due
    IF v_session.usage_date < v_today THEN
      UPDATE public.server_guest_sessions
      SET used_today = 0,
          usage_date = v_today,
          last_active_at = now(),
          updated_at = now()
      WHERE server_guest_sessions.guest_id = v_gid
      RETURNING * INTO v_session;
    ELSE
      UPDATE public.server_guest_sessions
      SET last_active_at = now(),
          ip_address = COALESCE(p_ip, v_session.ip_address),
          user_agent = COALESCE(p_user_agent, v_session.user_agent)
      WHERE server_guest_sessions.guest_id = v_gid
      RETURNING * INTO v_session;
    END IF;
  END IF;

  RETURN QUERY SELECT
    v_session.guest_id,
    v_session.daily_allowance,
    v_session.used_today,
    GREATEST(v_session.daily_allowance - v_session.used_today, 0)::integer,
    v_reset_at;
END;
$$;

-- 5. RPC: link_guest_to_registered_user
CREATE OR REPLACE FUNCTION public.link_guest_to_registered_user(
  p_guest_id text,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session public.server_guest_sessions%ROWTYPE;
BEGIN
  IF p_guest_id IS NULL OR p_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO v_session FROM public.server_guest_sessions WHERE guest_id = p_guest_id FOR UPDATE;
  IF FOUND THEN
    UPDATE public.server_guest_sessions
    SET linked_user_id = p_user_id,
        updated_at = now()
    WHERE guest_id = p_guest_id;

    -- Update any ledger and reservations
    UPDATE public.credit_reservations
    SET user_id = p_user_id
    WHERE guest_id = p_guest_id AND user_id IS NULL;

    UPDATE public.usage_ledger
    SET user_id = p_user_id
    WHERE guest_id = p_guest_id AND user_id IS NULL;

    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 6. RPC: reserve_entitlement_and_credits (Authoritative Server Check)
CREATE OR REPLACE FUNCTION public.reserve_entitlement_and_credits(
  p_user_id uuid,
  p_guest_id text,
  p_feature_slug text,
  p_credits_cost integer DEFAULT 1,
  p_timezone text DEFAULT 'UTC',
  p_idempotency_key text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  allowed boolean,
  reservation_id uuid,
  reason text,
  error_code text,
  plan text,
  remaining_credits integer,
  daily_remaining integer,
  daily_limit integer,
  reset_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan text := 'guest';
  v_status text := 'Active';
  v_plan_end timestamptz;
  v_credits_bal integer := 0;
  v_is_paid_active boolean := false;
  v_daily_limit integer := NULL;
  v_daily_used integer := 0;
  v_today date;
  v_reset_at timestamptz;
  v_res_id uuid := NULL;
  v_existing_res public.credit_reservations%ROWTYPE;
  v_guest public.server_guest_sessions%ROWTYPE;
  v_cost integer := GREATEST(p_credits_cost, 1);
BEGIN
  v_today := (current_timestamp AT TIME ZONE p_timezone)::date;
  v_reset_at := ((v_today + interval '1 day') AT TIME ZONE p_timezone);

  -- Check idempotency
  IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) > 0 THEN
    SELECT * INTO v_existing_res FROM public.credit_reservations WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
      IF v_existing_res.status IN ('reserved', 'committed') THEN
        RETURN QUERY SELECT
          true,
          v_existing_res.id,
          'Idempotent request recognized'::text,
          NULL::text,
          'active'::text,
          0::integer,
          0::integer,
          0::integer,
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
      RETURN QUERY SELECT false, NULL::uuid, 'User profile not found'::text, 'USER_NOT_FOUND'::text, 'free'::text, 0, 0, 0, v_reset_at;
      RETURN;
    END IF;

    -- Check subscription validity
    IF lower(v_plan) IN ('pro', 'business', 'enterprise') THEN
      IF v_status IN ('Active', 'trialing', 'Cancelled', 'canceled') AND (v_plan_end IS NULL OR v_plan_end > now()) THEN
        v_is_paid_active := true;
      ELSE
        -- Paid plan expired or cancelled past end date -> revert to free
        v_is_paid_active := false;
        v_plan := 'free';
      END IF;
    END IF;

    -- Check feature limits for this plan
    SELECT feature_limits.daily_limit INTO v_daily_limit
    FROM public.feature_limits
    WHERE feature_limits.feature_slug = p_feature_slug
      AND feature_limits.plan = lower(v_plan);

    -- If feature is not in table or daily_limit = 0 on free plan, check if feature is locked
    IF (NOT FOUND OR v_daily_limit = 0) AND NOT v_is_paid_active THEN
      -- Feature unavailable on Free tier
      RETURN QUERY SELECT
        false,
        NULL::uuid,
        'This feature is exclusive to Pro and Business plans. Upgrade to access.'::text,
        'FEATURE_PLAN_LOCKED'::text,
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
          false,
          NULL::uuid,
          ('Daily limit of ' || v_daily_limit || ' reached. Resets at ' || to_char(v_reset_at, 'YYYY-MM-DD HH24:MI OF') || '. Upgrade for unlimited access.')::text,
          'DAILY_LIMIT_REACHED'::text,
          v_plan,
          v_credits_bal,
          0,
          v_daily_limit,
          v_reset_at;
        RETURN;
      END IF;
    END IF;

    -- For credit consumption on paid plans or operations costing credits
    IF NOT v_is_paid_active AND v_daily_limit IS NULL THEN
      -- Free tier with credit check
      IF v_credits_bal < v_cost THEN
        RETURN QUERY SELECT
          false,
          NULL::uuid,
          ('Credits exhausted. This operation requires ' || v_cost || ' credits, but your balance is ' || v_credits_bal || '.')::text,
          'CREDITS_EXHAUSTED'::text,
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
          updated_at = now()
      WHERE id = p_user_id;
      v_credits_bal := v_credits_bal - v_cost;
    END IF;

    -- Create reservation record
    INSERT INTO public.credit_reservations (
      user_id, guest_id, feature_slug, credits_reserved, status, idempotency_key, metadata, created_at, expires_at
    ) VALUES (
      p_user_id, p_guest_id, p_feature_slug, v_cost, 'reserved', p_idempotency_key, p_metadata, now(), now() + interval '10 minutes'
    ) RETURNING id INTO v_res_id;

    RETURN QUERY SELECT
      true,
      v_res_id,
      NULL::text,
      NULL::text,
      v_plan,
      v_credits_bal,
      CASE WHEN v_daily_limit IS NOT NULL THEN GREATEST(v_daily_limit - v_daily_used, 0)::integer ELSE NULL::integer END,
      v_daily_limit,
      v_reset_at;
    RETURN;

  -- 2. GUEST / VISITOR PATH
  ELSE
    IF p_guest_id IS NULL OR length(trim(p_guest_id)) < 4 THEN
      RETURN QUERY SELECT
        false,
        NULL::uuid,
        'Server guest identity required. Please refresh or create a free account.'::text,
        'GUEST_IDENTITY_MISSING'::text,
        'guest'::text,
        0, 0, 0, v_reset_at;
      RETURN;
    END IF;

    SELECT * INTO v_guest FROM public.server_guest_sessions WHERE guest_id = p_guest_id FOR UPDATE;

    IF NOT FOUND THEN
      -- Initialize guest session
      INSERT INTO public.server_guest_sessions (
        guest_id, daily_allowance, used_today, usage_date, total_used, created_at, updated_at, last_active_at
      ) VALUES (
        p_guest_id, 5, 0, v_today, 0, now(), now(), now()
      ) RETURNING * INTO v_guest;
    ELSE
      -- Check reset date
      IF v_guest.usage_date < v_today THEN
        UPDATE public.server_guest_sessions
        SET used_today = 0,
            usage_date = v_today,
            updated_at = now()
        WHERE guest_id = p_guest_id
        RETURNING * INTO v_guest;
      END IF;
    END IF;

    -- Check if feature is allowed for guests (only ai_detector is free for guests)
    IF p_feature_slug NOT IN ('ai_detector', 'detector') THEN
      RETURN QUERY SELECT
        false,
        NULL::uuid,
        'This tool requires a free or Pro account. Create a free account to continue.'::text,
        'FEATURE_REQUIRES_LOGIN'::text,
        'guest'::text,
        0,
        GREATEST(v_guest.daily_allowance - v_guest.used_today, 0)::integer,
        v_guest.daily_allowance,
        v_reset_at;
      RETURN;
    END IF;

    -- Check guest daily allowance
    IF v_guest.used_today >= v_guest.daily_allowance THEN
      RETURN QUERY SELECT
        false,
        NULL::uuid,
        ('Free trial daily limit reached (5/5 checks used). Resets at ' || to_char(v_reset_at, 'HH24:MI OF') || '. Create a free account for more access.')::text,
        'DAILY_LIMIT_REACHED'::text,
        'guest'::text,
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
      NULL, p_guest_id, p_feature_slug, 1, 'reserved', p_idempotency_key, p_metadata, now(), now() + interval '10 minutes'
    ) RETURNING id INTO v_res_id;

    RETURN QUERY SELECT
      true,
      v_res_id,
      NULL::text,
      NULL::text,
      'guest'::text,
      0,
      GREATEST(v_guest.daily_allowance - v_guest.used_today, 0)::integer,
      v_guest.daily_allowance,
      v_reset_at;
    RETURN;
  END IF;
END;
$$;

-- 7. RPC: finalize_credit_reservation
CREATE OR REPLACE FUNCTION public.finalize_credit_reservation(
  p_reservation_id uuid,
  p_outcome text, -- 'success' or 'failed'
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_error_reason text DEFAULT NULL,
  p_timezone text DEFAULT 'UTC'
)
RETURNS TABLE (
  finalized boolean,
  status text,
  credits_refunded integer,
  new_balance integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_res public.credit_reservations%ROWTYPE;
  v_today date;
  v_refunded integer := 0;
  v_balance integer := 0;
BEGIN
  v_today := (current_timestamp AT TIME ZONE p_timezone)::date;

  SELECT * INTO v_res FROM public.credit_reservations WHERE id = p_reservation_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'NOT_FOUND'::text, 0, 0;
    RETURN;
  END IF;

  IF v_res.status IN ('committed', 'released') THEN
    -- Already finalized
    RETURN QUERY SELECT true, v_res.status, 0, 0;
    RETURN;
  END IF;

  IF p_outcome = 'success' THEN
    -- Mark committed
    UPDATE public.credit_reservations
    SET status = 'committed',
        finalized_at = now(),
        metadata = COALESCE(v_res.metadata, '{}'::jsonb) || p_metadata
    WHERE id = p_reservation_id;

    -- Increment usage tracking
    IF v_res.user_id IS NOT NULL THEN
      INSERT INTO public.user_feature_usage (
        user_id, feature_slug, usage_date, used_count, created_at, updated_at
      ) VALUES (
        v_res.user_id, v_res.feature_slug, v_today, 1, now(), now()
      ) ON CONFLICT (user_id, feature_slug, usage_date) DO UPDATE
      SET used_count = user_feature_usage.used_count + 1,
          updated_at = now();

      SELECT COALESCE(credits_balance, 0) INTO v_balance FROM public.profiles WHERE id = v_res.user_id;
    ELSIF v_res.guest_id IS NOT NULL THEN
      UPDATE public.server_guest_sessions
      SET used_today = used_today + 1,
          total_used = total_used + 1,
          last_active_at = now(),
          updated_at = now()
      WHERE guest_id = v_res.guest_id;
    END IF;

    -- Record in usage ledger
    INSERT INTO public.usage_ledger (
      user_id, guest_id, feature_slug, operation, credits_amount, outcome, reservation_id, metadata, created_at
    ) VALUES (
      v_res.user_id, v_res.guest_id, v_res.feature_slug, 'execute', v_res.credits_reserved, 'success', p_reservation_id, p_metadata, now()
    );

    RETURN QUERY SELECT true, 'committed'::text, 0, v_balance;
    RETURN;

  ELSE
    -- Mark released and refund credits
    UPDATE public.credit_reservations
    SET status = 'released',
        finalized_at = now(),
        metadata = COALESCE(v_res.metadata, '{}'::jsonb) || p_metadata
    WHERE id = p_reservation_id;

    IF v_res.user_id IS NOT NULL AND v_res.credits_reserved > 0 THEN
      UPDATE public.profiles
      SET credits_balance = credits_balance + v_res.credits_reserved,
          updated_at = now()
      WHERE id = v_res.user_id
      RETURNING credits_balance INTO v_balance;

      v_refunded := v_res.credits_reserved;
    END IF;

    -- Record in usage ledger as refunded/failed
    INSERT INTO public.usage_ledger (
      user_id, guest_id, feature_slug, operation, credits_amount, outcome, reservation_id, error_reason, metadata, created_at
    ) VALUES (
      v_res.user_id, v_res.guest_id, v_res.feature_slug, 'execute', v_res.credits_reserved, 'refunded', p_reservation_id, p_error_reason, p_metadata, now()
    );

    RETURN QUERY SELECT true, 'released'::text, v_refunded, v_balance;
    RETURN;
  END IF;
END;
$$;

-- 8. RPC: get_user_entitlement_summary
CREATE OR REPLACE FUNCTION public.get_user_entitlement_summary(
  p_user_id uuid DEFAULT NULL,
  p_guest_id text DEFAULT NULL,
  p_timezone text DEFAULT 'UTC'
)
RETURNS TABLE (
  plan text,
  status text,
  is_paid_active boolean,
  credits_balance integer,
  credits_used_total integer,
  daily_limit integer,
  daily_used integer,
  daily_remaining integer,
  reset_at timestamptz,
  plan_end_date timestamptz,
  warning_level text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan text := 'guest';
  v_status text := 'Active';
  v_plan_end timestamptz := NULL;
  v_credits_bal integer := 0;
  v_credits_used integer := 0;
  v_daily_limit integer := 5;
  v_daily_used integer := 0;
  v_daily_remaining integer := 5;
  v_is_paid boolean := false;
  v_today date;
  v_reset_at timestamptz;
  v_warning text := 'normal';
  v_guest public.server_guest_sessions%ROWTYPE;
BEGIN
  v_today := (current_timestamp AT TIME ZONE p_timezone)::date;
  v_reset_at := ((v_today + interval '1 day') AT TIME ZONE p_timezone);

  IF p_user_id IS NOT NULL THEN
    SELECT
      COALESCE(subscription_plan, 'free'),
      COALESCE(subscription_status, 'Active'),
      plan_end_date,
      COALESCE(credits_balance, 0)
    INTO v_plan, v_status, v_plan_end, v_credits_bal
    FROM public.profiles
    WHERE id = p_user_id;

    IF NOT FOUND THEN
      v_plan := 'free';
      v_status := 'Active';
      v_credits_bal := 0;
    END IF;

    -- Check active status
    IF lower(v_plan) IN ('pro', 'business', 'enterprise') THEN
      IF v_status IN ('Active', 'trialing', 'Cancelled', 'canceled') AND (v_plan_end IS NULL OR v_plan_end > now()) THEN
        v_is_paid := true;
      ELSE
        v_is_paid := false;
        v_plan := 'free';
      END IF;
    END IF;

    -- Calculate total credits used from ledger
    SELECT COALESCE(SUM(credits_amount), 0)::integer INTO v_credits_used
    FROM public.usage_ledger
    WHERE user_id = p_user_id AND outcome = 'success';

    -- Calculate daily limit & used
    SELECT feature_limits.daily_limit INTO v_daily_limit
    FROM public.feature_limits
    WHERE feature_limits.feature_slug = 'ai_detector'
      AND feature_limits.plan = lower(v_plan);

    IF v_daily_limit IS NOT NULL AND v_daily_limit > 0 THEN
      SELECT COALESCE(SUM(used_count), 0)::integer INTO v_daily_used
      FROM public.user_feature_usage
      WHERE user_id = p_user_id AND usage_date = v_today;

      v_daily_remaining := GREATEST(v_daily_limit - v_daily_used, 0);
    ELSE
      v_daily_remaining := NULL;
    END IF;

    -- Determine warning level
    IF v_daily_limit IS NOT NULL AND v_daily_limit > 0 THEN
      IF v_daily_remaining = 0 THEN
        v_warning := 'exhausted';
      ELSIF v_daily_used >= (v_daily_limit * 0.95) THEN
        v_warning := 'warning_95';
      ELSIF v_daily_used >= (v_daily_limit * 0.80) THEN
        v_warning := 'warning_80';
      END IF;
    ELSIF NOT v_is_paid AND v_credits_bal <= 0 THEN
      v_warning := 'exhausted';
    ELSIF NOT v_is_paid AND v_credits_bal <= 5 THEN
      v_warning := 'warning_95';
    ELSIF NOT v_is_paid AND v_credits_bal <= 20 THEN
      v_warning := 'warning_80';
    END IF;

    RETURN QUERY SELECT
      v_plan,
      v_status,
      v_is_paid,
      v_credits_bal,
      v_credits_used,
      v_daily_limit,
      v_daily_used,
      v_daily_remaining,
      v_reset_at,
      v_plan_end,
      v_warning;
    RETURN;

  ELSE
    -- GUEST SUMMARY
    IF p_guest_id IS NOT NULL THEN
      SELECT * INTO v_guest FROM public.server_guest_sessions WHERE guest_id = p_guest_id;
      IF FOUND THEN
        IF v_guest.usage_date < v_today THEN
          v_daily_used := 0;
        ELSE
          v_daily_used := v_guest.used_today;
        END IF;
        v_daily_limit := v_guest.daily_allowance;
        v_daily_remaining := GREATEST(v_daily_limit - v_daily_used, 0);
      END IF;
    END IF;

    IF v_daily_remaining = 0 THEN
      v_warning := 'exhausted';
    ELSIF v_daily_used >= (v_daily_limit * 0.95) THEN
      v_warning := 'warning_95';
    ELSIF v_daily_used >= (v_daily_limit * 0.80) THEN
      v_warning := 'warning_80';
    END IF;

    RETURN QUERY SELECT
      'guest'::text,
      'Active'::text,
      false,
      0::integer,
      v_daily_used,
      v_daily_limit,
      v_daily_used,
      v_daily_remaining,
      v_reset_at,
      NULL::timestamptz,
      v_warning;
    RETURN;
  END IF;
END;
$$;
