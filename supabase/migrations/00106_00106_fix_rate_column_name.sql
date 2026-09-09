CREATE OR REPLACE FUNCTION public.reserve_entitlement_and_credits(
  p_user_id UUID DEFAULT NULL,
  p_guest_id TEXT DEFAULT NULL,
  p_feature_slug TEXT DEFAULT 'text_detect_balanced',
  p_credits_cost NUMERIC DEFAULT 1,
  p_timezone TEXT DEFAULT 'UTC',
  p_idempotency_key TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  allowed BOOLEAN,
  reservation_id UUID,
  plan TEXT,
  credits_balance NUMERIC,
  credits_reserved NUMERIC,
  daily_remaining NUMERIC,
  daily_limit NUMERIC,
  is_trial_check BOOLEAN,
  trial_checks_remaining INTEGER,
  trial_checks_total INTEGER,
  reason TEXT,
  error_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_rate RECORD;
  v_effective_cost NUMERIC;
  v_is_trial_eligible BOOLEAN;
  v_res_id UUID;
  v_existing_res RECORD;
  v_guest RECORD;
  v_profile RECORD;
  v_team_alloc RECORD;
  v_user_balance NUMERIC;
  v_canonical_slug TEXT;
BEGIN
  v_canonical_slug := p_feature_slug;

  -- 1. Resolve feature rate and trial eligibility
  SELECT * INTO v_rate
  FROM credit_rate_table
  WHERE feature_slug = v_canonical_slug;

  IF NOT FOUND THEN
    v_canonical_slug := CASE
      WHEN p_feature_slug LIKE 'image_%' OR p_feature_slug = 'ai_image_detector' THEN 'ai_image_detector'
      WHEN p_feature_slug LIKE 'video_%' OR p_feature_slug = 'ai_video_detector' THEN 'ai_video_detector'
      ELSE 'ai_detector'
    END;

    SELECT * INTO v_rate
    FROM credit_rate_table
    WHERE feature_slug = v_canonical_slug;
  END IF;

  IF FOUND THEN
    v_effective_cost := COALESCE(v_rate.base_credit_cost, p_credits_cost);
    v_is_trial_eligible := COALESCE(v_rate.trial_eligible, false);
  ELSE
    v_effective_cost := p_credits_cost;
    v_is_trial_eligible := (p_feature_slug IN ('ai_detector', 'text_detect_balanced', 'image_detect_standard', 'ai_image_detector', 'ai_video_detector', 'video_detect_balanced'));
  END IF;

  -- 2. Idempotency Check: if existing reservation is found, return it
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing_res
    FROM credit_reservations
    WHERE idempotency_key = p_idempotency_key
      AND status IN ('reserved', 'committed');

    IF FOUND THEN
      RETURN QUERY SELECT
        TRUE,
        v_existing_res.id,
        'cached'::TEXT,
        0::NUMERIC,
        v_existing_res.credits_reserved,
        1::NUMERIC,
        1::NUMERIC,
        (v_existing_res.deduction_type = 'trial_check'),
        0::INTEGER,
        1::INTEGER,
        'Existing reservation recovered'::TEXT,
        NULL::TEXT;
      RETURN;
    END IF;
  END IF;

  -- 3. GUEST TRIAL FLOW (Unauthenticated visitor)
  IF p_user_id IS NULL THEN
    IF p_guest_id IS NULL OR p_guest_id = '' THEN
      RETURN QUERY SELECT
        FALSE, NULL::UUID, 'guest'::TEXT, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 1::NUMERIC,
        FALSE, 0::INTEGER, 1::INTEGER,
        'Guest session identifier required'::TEXT, 'MISSING_GUEST_ID'::TEXT;
      RETURN;
    END IF;

    IF NOT v_is_trial_eligible THEN
      RETURN QUERY SELECT
        FALSE, NULL::UUID, 'guest'::TEXT, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 1::NUMERIC,
        FALSE, 0::INTEGER, 1::INTEGER,
        'This feature requires a paid subscription or registered free trial.'::TEXT, 'PAID_ONLY_FEATURE'::TEXT;
      RETURN;
    END IF;

    -- Look up or create server-backed guest session
    SELECT * INTO v_guest
    FROM server_guest_sessions
    WHERE guest_id = p_guest_id
    FOR UPDATE;

    IF NOT FOUND THEN
      INSERT INTO server_guest_sessions (guest_id, trial_checks_remaining, trial_checks_total, trial_checks_used, last_active_at)
      VALUES (p_guest_id, 1, 1, 0, now())
      RETURNING * INTO v_guest;
    END IF;

    IF v_guest.trial_checks_remaining <= 0 THEN
      RETURN QUERY SELECT
        FALSE, NULL::UUID, 'guest'::TEXT, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 1::NUMERIC,
        FALSE, 0::INTEGER, 1::INTEGER,
        'Guest trial check used. Create a free account to get 4 additional trial checks.'::TEXT, 'TRIAL_EXHAUSTED'::TEXT;
      RETURN;
    END IF;

    -- Create reservation with status 'reserved'
    v_res_id := gen_random_uuid();
    INSERT INTO credit_reservations (
      id, user_id, guest_id, feature_slug, credits_reserved, status, idempotency_key, metadata,
      deduction_type, trial_checks_deducted, expires_at
    ) VALUES (
      v_res_id, NULL, p_guest_id, v_canonical_slug, 0, 'reserved', p_idempotency_key, p_metadata,
      'trial_check', 1, now() + interval '15 minutes'
    );

    RETURN QUERY SELECT
      TRUE,
      v_res_id,
      'guest'::TEXT,
      0::NUMERIC,
      0::NUMERIC,
      1::NUMERIC,
      1::NUMERIC,
      TRUE,
      v_guest.trial_checks_remaining,
      v_guest.trial_checks_total,
      'Guest trial check reserved.'::TEXT,
      NULL::TEXT;
    RETURN;
  END IF;

  -- 4. REGISTERED USER FLOW
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      FALSE, NULL::UUID, 'unknown'::TEXT, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
      FALSE, 0::INTEGER, 0::INTEGER,
      'User profile not found'::TEXT, 'PROFILE_NOT_FOUND'::TEXT;
    RETURN;
  END IF;

  -- Registered Free Trial
  IF v_profile.subscription_plan = 'free' AND v_is_trial_eligible AND COALESCE(v_profile.trial_checks_remaining, 0) > 0 THEN
    v_res_id := gen_random_uuid();
    INSERT INTO credit_reservations (
      id, user_id, guest_id, feature_slug, credits_reserved, status, idempotency_key, metadata,
      deduction_type, trial_checks_deducted, expires_at
    ) VALUES (
      v_res_id, p_user_id, p_guest_id, v_canonical_slug, 0, 'reserved', p_idempotency_key, p_metadata,
      'trial_check', 1, now() + interval '15 minutes'
    );

    RETURN QUERY SELECT
      TRUE,
      v_res_id,
      'free'::TEXT,
      COALESCE(v_profile.credits_balance, 0)::NUMERIC,
      0::NUMERIC,
      COALESCE(v_profile.trial_checks_remaining, 0)::NUMERIC,
      COALESCE(v_profile.trial_checks_total, 5)::NUMERIC,
      TRUE,
      COALESCE(v_profile.trial_checks_remaining, 0)::INTEGER,
      COALESCE(v_profile.trial_checks_total, 5)::INTEGER,
      'Free trial check reserved.'::TEXT,
      NULL::TEXT;
    RETURN;
  END IF;

  -- Paid / Credit Balance Check
  v_user_balance := COALESCE(v_profile.credits_balance, 0);

  IF v_user_balance < v_effective_cost THEN
    SELECT * INTO v_team_alloc
    FROM team_credit_allocations
    WHERE member_user_id = p_user_id AND is_active = true
    LIMIT 1;

    IF FOUND AND (v_team_alloc.allocated_credits - v_team_alloc.used_credits) >= v_effective_cost THEN
      v_res_id := gen_random_uuid();
      INSERT INTO credit_reservations (
        id, user_id, guest_id, feature_slug, credits_reserved, status, idempotency_key, metadata,
        deduction_type, team_allocation_id, team_owner_id, expires_at
      ) VALUES (
        v_res_id, p_user_id, p_guest_id, v_canonical_slug, v_effective_cost, 'reserved', p_idempotency_key, p_metadata,
        'team_credit', v_team_alloc.id, v_team_alloc.owner_user_id, now() + interval '15 minutes'
      );

      RETURN QUERY SELECT
        TRUE,
        v_res_id,
        'team_member'::TEXT,
        (v_team_alloc.allocated_credits - v_team_alloc.used_credits)::NUMERIC,
        v_effective_cost,
        (v_team_alloc.allocated_credits - v_team_alloc.used_credits)::NUMERIC,
        v_team_alloc.allocated_credits::NUMERIC,
        FALSE,
        0::INTEGER,
        0::INTEGER,
        'Team credit reserved'::TEXT,
        NULL::TEXT;
      RETURN;
    END IF;

    RETURN QUERY SELECT
      FALSE,
      NULL::UUID,
      COALESCE(v_profile.subscription_plan, 'free')::TEXT,
      v_user_balance,
      0::NUMERIC,
      0::NUMERIC,
      0::NUMERIC,
      FALSE,
      COALESCE(v_profile.trial_checks_remaining, 0)::INTEGER,
      COALESCE(v_profile.trial_checks_total, 5)::INTEGER,
      CASE
        WHEN v_profile.subscription_plan = 'free' THEN 'Free trial checks exhausted. Upgrade to a paid plan to continue.'
        ELSE 'Insufficient credits for this operation. Please refill or upgrade.'
      END::TEXT,
      'INSUFFICIENT_CREDITS'::TEXT;
    RETURN;
  END IF;

  -- Direct user balance reservation
  v_res_id := gen_random_uuid();
  INSERT INTO credit_reservations (
    id, user_id, guest_id, feature_slug, credits_reserved, status, idempotency_key, metadata,
    deduction_type, expires_at
  ) VALUES (
    v_res_id, p_user_id, p_guest_id, v_canonical_slug, v_effective_cost, 'reserved', p_idempotency_key, p_metadata,
    'user_credit', now() + interval '15 minutes'
  );

  RETURN QUERY SELECT
    TRUE,
    v_res_id,
    COALESCE(v_profile.subscription_plan, 'pro')::TEXT,
    (v_user_balance - v_effective_cost)::NUMERIC,
    v_effective_cost,
    (v_user_balance - v_effective_cost)::NUMERIC,
    v_user_balance,
    FALSE,
    0::INTEGER,
    0::INTEGER,
    'Credits reserved successfully.'::TEXT,
    NULL::TEXT;
END;
$$;