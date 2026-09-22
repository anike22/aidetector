-- Ensure credit_rate_table has exact rates and plan restrictions
INSERT INTO public.credit_rate_table (feature_slug, feature_name, trial_eligible, base_credit_cost, billing_unit, min_plan, details)
VALUES
  ('ai_checker_for_bloggers', 'AI Checker for Bloggers (SEO Analysis)', false, 5, 'words_500', 'pro', '{"description":"5 credits per started 500 words, Pro plan required"}'::jsonb),
  ('seo_assistant', 'SEO Assistant Report', false, 3, 'words_1000', 'pro', '{"description":"3 credits per started 1000 words, Pro plan required"}'::jsonb),
  ('generate_article', 'Generate Article / With AI', false, 5, 'fixed', 'pro', '{"description":"5 credits per AI article generation, Pro plan required"}'::jsonb)
ON CONFLICT (feature_slug) DO UPDATE SET
  feature_name = EXCLUDED.feature_name,
  trial_eligible = EXCLUDED.trial_eligible,
  base_credit_cost = EXCLUDED.base_credit_cost,
  billing_unit = EXCLUDED.billing_unit,
  min_plan = EXCLUDED.min_plan,
  details = EXCLUDED.details,
  updated_at = now();

-- Update reserve_entitlement_and_credits to properly calculate words_500 and enforce min_plan
CREATE OR REPLACE FUNCTION public.reserve_entitlement_and_credits(
  p_user_id uuid DEFAULT NULL::uuid,
  p_guest_id text DEFAULT NULL::text,
  p_feature_slug text DEFAULT 'text_detect_balanced'::text,
  p_credits_cost numeric DEFAULT 1,
  p_timezone text DEFAULT 'UTC'::text,
  p_idempotency_key text DEFAULT NULL::text,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_unit_quantity int DEFAULT NULL::int
) RETURNS TABLE (
  allowed boolean,
  reservation_id uuid,
  plan text,
  credits_balance numeric,
  credits_reserved numeric,
  daily_remaining numeric,
  daily_limit numeric,
  is_trial_check boolean,
  trial_checks_remaining int,
  trial_checks_total int,
  reason text,
  error_code text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, auth AS $$
DECLARE
  v_role TEXT := COALESCE(current_setting('role', true), 'anon');
  v_auth_uid UUID := auth.uid();
  v_rate RECORD;
  v_effective_cost INTEGER;
  v_is_trial_eligible BOOLEAN;
  v_res_id UUID;
  v_guest RECORD;
  v_profile RECORD;
  v_team_alloc RECORD;
  v_user_balance NUMERIC;
  v_canonical_slug TEXT;
  v_client_ip TEXT;
  v_ip_new_sessions INT;
  v_trial_remaining_after INT;
  v_trial_max_words INT;
  v_intro_total INT := 5;
  v_owner RECORD;
  v_paid boolean;
  v_is_api_key boolean := false;
  v_user_email text;
  v_engines integer := 1;
  v_qty integer;
  v_period timestamptz;
BEGIN
  IF v_role = 'service_role' THEN
    NULL;
  ELSIF v_auth_uid IS NOT NULL THEN
    p_user_id := v_auth_uid;
  ELSE
    p_user_id := NULL;
  END IF;

  v_canonical_slug := p_feature_slug;

  SELECT * INTO v_rate FROM credit_rate_table WHERE feature_slug = v_canonical_slug;

  IF FOUND THEN
    v_effective_cost := v_rate.base_credit_cost;
    IF v_effective_cost IS NULL OR v_effective_cost <= 0 THEN RAISE EXCEPTION 'Invalid billing rate'; END IF;
    v_qty := p_unit_quantity;
    IF v_qty IS NOT NULL AND (v_qty <= 0 OR v_qty > 10000000) THEN RAISE EXCEPTION 'Invalid billing quantity'; END IF;
    IF v_rate.billing_unit IN ('words_1000', 'words_500') AND v_qty IS NULL THEN RAISE EXCEPTION 'Input word count required for billing'; END IF;
    IF v_rate.billing_unit IN ('video_30s','audio_min','references_5') AND v_qty IS NULL THEN RAISE EXCEPTION 'Input quantity required for billing'; END IF;

    v_effective_cost := v_effective_cost * CASE v_rate.billing_unit
      WHEN 'words_500' THEN GREATEST(1, ceil(v_qty::numeric / 500)::int)
      WHEN 'words_1000' THEN GREATEST(1, ceil(v_qty::numeric / 1000)::int)
      WHEN 'video_30s' THEN GREATEST(1, ceil(v_qty::numeric / 30)::int)
      WHEN 'audio_min' THEN GREATEST(1, ceil(v_qty::numeric / 60)::int)
      WHEN 'references_5' THEN GREATEST(1, ceil(v_qty::numeric / 5)::int)
      WHEN 'image' THEN COALESCE(v_qty, 1)
      ELSE 1
    END;

    IF p_feature_slug IN ('ai_detector','text_detect_balanced') THEN
      v_engines := COALESCE((p_metadata->>'engines')::integer, 1);
      IF v_engines NOT IN (1,2) THEN RAISE EXCEPTION 'Invalid engine count'; END IF;
      v_effective_cost := v_effective_cost * v_engines;
    END IF;

    v_is_trial_eligible := COALESCE(v_rate.trial_eligible, false);

    BEGIN
      v_trial_max_words := NULLIF(COALESCE((v_rate.details->>'trial_max_words')::INT, 0), 0);
    EXCEPTION WHEN OTHERS THEN
      v_trial_max_words := NULL;
    END;
  ELSE
    RETURN QUERY SELECT
      FALSE, NULL::UUID, 'unknown'::TEXT, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
      FALSE, 0::INTEGER, 0::INTEGER,
      'This feature has no billing configuration and cannot run. Please contact support.'::TEXT,
      'MISSING_RATE_CONFIG'::TEXT;
    RETURN;
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    IF length(p_idempotency_key) > 200 THEN RAISE EXCEPTION 'Idempotency key too long'; END IF;
    p_idempotency_key := md5(COALESCE(p_user_id::text, 'guest:' || p_guest_id) || ':' || v_canonical_slug || ':' || p_idempotency_key);
    PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key, 0));
    IF EXISTS(SELECT 1 FROM credit_reservations cr WHERE cr.idempotency_key = p_idempotency_key) THEN
      RETURN QUERY SELECT false, NULL::uuid, 'unknown'::text, 0::numeric, 0::numeric, 0::numeric, 0::numeric, false, 0, 0,
        'This operation was already submitted. Retrieve its existing result.'::text, 'OPERATION_ALREADY_SUBMITTED'::text;
      RETURN;
    END IF;
  END IF;

  -- 1. Guest Handling
  IF p_user_id IS NULL THEN
    IF p_guest_id IS NULL OR trim(p_guest_id) = '' THEN
      RETURN QUERY SELECT
        FALSE, NULL::UUID, 'guest'::TEXT, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 1::NUMERIC,
        FALSE, 0::INTEGER, 1::INTEGER,
        'Guest session identifier required'::TEXT, 'MISSING_GUEST_ID'::TEXT;
      RETURN;
    END IF;

    -- Pro or subscription-only feature for guests
    IF NOT v_is_trial_eligible OR billing_plan_rank(v_rate.min_plan) > 1 THEN
      RETURN QUERY SELECT
        FALSE, NULL::UUID, 'guest'::TEXT, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 1::NUMERIC,
        FALSE, 0::INTEGER, 1::INTEGER,
        'This feature requires a paid subscription or registered free account.'::TEXT, 'PAID_ONLY_FEATURE'::TEXT;
      RETURN;
    END IF;

    SELECT * INTO v_guest FROM server_guest_sessions WHERE guest_id = p_guest_id FOR UPDATE;

    IF NOT FOUND THEN
      IF v_role <> 'service_role' THEN
        v_client_ip := NULLIF(trim(split_part(
          COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', ''),
          ',', 1)), '');
        IF v_client_ip IS NOT NULL AND v_client_ip <> '' THEN
          SELECT COUNT(*) INTO v_ip_new_sessions
          FROM server_guest_sessions
          WHERE ip_address = v_client_ip
            AND created_at > now() - interval '24 hours';
          IF v_ip_new_sessions >= 10 THEN
            RETURN QUERY SELECT
              FALSE, NULL::UUID, 'guest'::TEXT, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 1::NUMERIC,
              FALSE, 0::INTEGER, 1::INTEGER,
              'Too many new guest sessions from this network. Please create a free account to continue.'::TEXT,
              'GUEST_SESSION_RATE_LIMITED'::TEXT;
            RETURN;
          END IF;
        END IF;
      END IF;

      INSERT INTO server_guest_sessions
        (guest_id, trial_checks_remaining, trial_checks_total, trial_checks_used, total_used, last_active_at)
      VALUES (p_guest_id, 1, 1, 0, 0, now())
      RETURNING * INTO v_guest;
    ELSIF v_guest.linked_user_id IS NOT NULL THEN
      RETURN QUERY SELECT false, NULL::uuid, 'guest'::text, 0::numeric, 0::numeric, 0::numeric, 1::numeric, false, 0, 1,
        'A valid guest session is required. Please sign in.'::text, 'MISSING_GUEST_ID'::text;
      RETURN;
    END IF;

    IF COALESCE(v_guest.trial_checks_remaining, 0) <= 0 THEN
      RETURN QUERY SELECT
        FALSE, NULL::UUID, 'guest'::TEXT, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 1::NUMERIC,
        FALSE, 0::INTEGER, 1::INTEGER,
        'You''ve used your free check. Register for 4 additional free checks.'::TEXT,
        'TRIAL_EXHAUSTED'::TEXT;
      RETURN;
    END IF;

    UPDATE server_guest_sessions sgs
    SET trial_checks_remaining = sgs.trial_checks_remaining - 1,
        trial_checks_used = sgs.trial_checks_used + 1,
        total_used = COALESCE(sgs.total_used, 0) + 1,
        last_active_at = now(),
        updated_at = now()
    WHERE sgs.guest_id = p_guest_id
    RETURNING sgs.trial_checks_remaining INTO v_trial_remaining_after;

    v_res_id := gen_random_uuid();
    INSERT INTO credit_reservations (
      id, user_id, guest_id, feature_slug, credits_reserved, status, idempotency_key, metadata,
      reservation_type, trial_checks_reserved, expires_at
    ) VALUES (
      v_res_id, NULL, p_guest_id, v_canonical_slug, 0, 'reserved', p_idempotency_key, p_metadata,
      'trial_check', 1, now() + interval '15 minutes'
    );

    RETURN QUERY SELECT
      TRUE, v_res_id, 'guest'::TEXT, 0::NUMERIC, 0::NUMERIC, 1::NUMERIC, 1::NUMERIC,
      TRUE, COALESCE(v_trial_remaining_after, 0), 1,
      'Guest trial check reserved.'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- 2. Authenticated User Handling
  PERFORM refresh_billing_account(p_user_id);
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      FALSE, NULL::UUID, 'unknown'::TEXT, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
      FALSE, 0::INTEGER, 0::INTEGER,
      'User profile not found'::TEXT, 'PROFILE_NOT_FOUND'::TEXT;
    RETURN;
  END IF;

  v_user_email := lower(COALESCE(v_profile.email, ''));
  IF v_user_email <> '' THEN
    UPDATE team_credit_allocations
    SET member_user_id = p_user_id, updated_at = now()
    WHERE member_user_id IS NULL AND status = 'active'
      AND lower(member_email) = v_user_email;
  END IF;

  BEGIN
    v_is_api_key := COALESCE((p_metadata->>'is_api_key')::boolean,
      (p_metadata->>'isApiKey')::boolean, false);
  EXCEPTION WHEN invalid_text_representation THEN
    v_is_api_key := false;
  END;

  v_paid := billing_paid_active(v_profile.subscription_plan, v_profile.subscription_status, v_profile.plan_end_date);
  v_period := COALESCE(v_profile.billing_credit_period_start, v_profile.plan_start_date);
  p_metadata := COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object('billing_period', v_period);

  -- Strict Feature Plan Gating for Paid Users: If plan rank is less than feature requirement
  IF v_paid AND billing_plan_rank(v_profile.subscription_plan) < billing_plan_rank(v_rate.min_plan) THEN
    RETURN QUERY SELECT false, NULL::uuid, v_profile.subscription_plan::text, COALESCE(v_profile.credits_balance, 0)::numeric, 0::numeric, 0::numeric, 0::numeric, false, 0, 0,
      'Your plan does not include this feature. Please upgrade to ' || v_rate.min_plan || ' to access it.'::text, 'UPGRADE_REQUIRED'::text;
    RETURN;
  END IF;

  -- Feature Plan Gating for Non-Paid Users: If feature requires Pro (min_plan > 1), block immediately!
  IF NOT v_paid AND billing_plan_rank(v_rate.min_plan) > 1 THEN
    RETURN QUERY SELECT false, NULL::uuid, COALESCE(v_profile.subscription_plan, 'free')::text, COALESCE(v_profile.credits_balance, 0)::numeric, 0::numeric, 0::numeric, 0::numeric, false, COALESCE(v_profile.trial_checks_remaining, 0)::int, v_intro_total,
      'This feature requires an active Pro subscription. Please upgrade to access full analysis.'::text, 'UPGRADE_REQUIRED'::text;
    RETURN;
  END IF;

  -- Free Trial check consumption for free-tier eligible features
  IF NOT v_paid AND NOT v_is_api_key AND billing_plan_rank(v_profile.subscription_plan) < 2 AND billing_plan_rank(v_rate.min_plan) <= 1 AND v_is_trial_eligible AND COALESCE(v_profile.trial_checks_remaining, 0) > 0 THEN
    UPDATE profiles up
    SET trial_checks_remaining = up.trial_checks_remaining - 1,
        trial_checks_used = up.trial_checks_used + 1,
        updated_at = now()
    WHERE up.id = p_user_id
    RETURNING up.trial_checks_remaining INTO v_trial_remaining_after;

    v_res_id := gen_random_uuid();
    INSERT INTO credit_reservations (
      id, user_id, guest_id, feature_slug, credits_reserved, status, idempotency_key, metadata,
      reservation_type, trial_checks_reserved, expires_at
    ) VALUES (
      v_res_id, p_user_id, p_guest_id, v_canonical_slug, 0, 'reserved', p_idempotency_key, p_metadata,
      'trial_check', 1, now() + interval '15 minutes'
    );

    RETURN QUERY SELECT
      TRUE, v_res_id,
      COALESCE(v_profile.subscription_plan, 'free')::TEXT,
      COALESCE(v_profile.credits_balance, 0)::NUMERIC,
      0::NUMERIC,
      COALESCE(v_trial_remaining_after, 0)::NUMERIC,
      v_intro_total::NUMERIC,
      TRUE,
      COALESCE(v_trial_remaining_after, 0)::INTEGER,
      v_intro_total,
      'Free trial check reserved.'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Paid User Credit Reservation
  v_user_balance := COALESCE(v_profile.credits_balance, 0);

  IF v_paid AND (NOT v_is_api_key OR billing_plan_rank(v_profile.subscription_plan) >= 4)
    AND v_user_balance >= v_effective_cost THEN
    UPDATE profiles up
    SET credits_balance = up.credits_balance - v_effective_cost,
        updated_at = now()
    WHERE up.id = p_user_id;

    v_res_id := gen_random_uuid();
    INSERT INTO credit_reservations (
      id, user_id, guest_id, feature_slug, credits_reserved, status, idempotency_key, metadata,
      reservation_type, expires_at
    ) VALUES (
      v_res_id, p_user_id, p_guest_id, v_canonical_slug, v_effective_cost, 'reserved', p_idempotency_key, p_metadata,
      'user_credit', now() + interval '15 minutes'
    );

    RETURN QUERY SELECT
      TRUE, v_res_id,
      COALESCE(v_profile.subscription_plan, 'pro')::TEXT,
      (v_user_balance - v_effective_cost)::NUMERIC,
      v_effective_cost::NUMERIC,
      (v_user_balance - v_effective_cost)::NUMERIC,
      v_user_balance,
      FALSE, 0::INTEGER, 0::INTEGER,
      'Credits reserved successfully.'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Team shared allocation fallback for Business/Enterprise team members
  SELECT * INTO v_team_alloc FROM team_credit_allocations
    WHERE member_user_id = p_user_id AND status = 'active' ORDER BY owner_id LIMIT 1;
  IF FOUND THEN
    PERFORM refresh_billing_account(v_team_alloc.owner_id);
    SELECT * INTO v_owner FROM profiles WHERE id = v_team_alloc.owner_id FOR UPDATE;
    SELECT * INTO v_team_alloc FROM team_credit_allocations WHERE id = v_team_alloc.id FOR UPDATE;
    IF v_team_alloc.status = 'active' AND billing_paid_active(v_owner.subscription_plan, v_owner.subscription_status, v_owner.plan_end_date)
      AND billing_plan_rank(v_owner.subscription_plan) >= GREATEST(4, billing_plan_rank(v_rate.min_plan))
      AND v_owner.credits_balance >= v_effective_cost
      AND v_team_alloc.allocated_credits - v_team_alloc.consumed_credits >= v_effective_cost THEN
      UPDATE profiles SET credits_balance = credits_balance - v_effective_cost, updated_at = now() WHERE id = v_owner.id;
      UPDATE team_credit_allocations SET consumed_credits = consumed_credits + v_effective_cost, updated_at = now() WHERE id = v_team_alloc.id;
      v_res_id := gen_random_uuid();
      INSERT INTO credit_reservations (
        id, user_id, guest_id, feature_slug, credits_reserved, status, idempotency_key, metadata,
        reservation_type, expires_at
      ) VALUES (
        v_res_id, p_user_id, p_guest_id, v_canonical_slug, v_effective_cost, 'reserved', p_idempotency_key,
        p_metadata || jsonb_build_object('team_owner_id', v_owner.id, 'team_alloc_id', v_team_alloc.id),
        'team_credit', now() + interval '15 minutes'
      );
      RETURN QUERY SELECT
        TRUE, v_res_id,
        COALESCE(v_profile.subscription_plan, 'business')::TEXT,
        (v_team_alloc.allocated_credits - v_team_alloc.consumed_credits)::NUMERIC,
        v_effective_cost::NUMERIC,
        (v_team_alloc.allocated_credits - v_team_alloc.consumed_credits)::NUMERIC,
        v_team_alloc.allocated_credits::NUMERIC,
        FALSE, 0::INTEGER, 0::INTEGER,
        'Team pool credits reserved successfully.'::TEXT, NULL::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Default Failure Return: Clear distinction between insufficient credits vs subscription upgrade needed
  RETURN QUERY SELECT
    FALSE, NULL::UUID,
    COALESCE(v_profile.subscription_plan, 'free')::TEXT,
    COALESCE(v_profile.credits_balance, 0)::NUMERIC,
    0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
    FALSE,
    COALESCE(v_profile.trial_checks_remaining, 0)::INTEGER,
    v_intro_total,
    CASE
      WHEN NOT v_paid THEN 'This feature requires an active Pro subscription. Upgrade to continue.'
      WHEN v_is_api_key AND (NOT v_paid OR billing_plan_rank(v_profile.subscription_plan) < 4)
        THEN 'API access requires an active Business or Enterprise subscription.'
      ELSE 'Insufficient credits for this operation (' || v_effective_cost || ' credits needed, balance: ' || v_user_balance || '). Please top up or renew your plan to continue.'
    END::TEXT,
    CASE
      WHEN NOT v_paid THEN 'UPGRADE_REQUIRED'
      WHEN v_is_api_key AND (NOT v_paid OR billing_plan_rank(v_profile.subscription_plan) < 4) THEN 'UPGRADE_REQUIRED'
      ELSE 'INSUFFICIENT_CREDITS'
    END::TEXT;
END;
$$;
