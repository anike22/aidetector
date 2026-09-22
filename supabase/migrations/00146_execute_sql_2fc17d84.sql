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
  v_existing_res RECORD;
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
    IF v_effective_cost IS NULL OR v_effective_cost<=0 THEN RAISE EXCEPTION 'Invalid billing rate'; END IF;
    v_qty := p_unit_quantity;
    IF v_qty IS NOT NULL AND (v_qty<=0 OR v_qty>10000000) THEN RAISE EXCEPTION 'Invalid billing quantity'; END IF;
    IF v_rate.billing_unit='words_1000' AND v_qty IS NULL THEN RAISE EXCEPTION 'Input word count required for billing'; END IF;
    IF v_rate.billing_unit IN ('video_30s','audio_min','references_5') AND v_qty IS NULL THEN RAISE EXCEPTION 'Input quantity required for billing'; END IF;
    v_effective_cost := v_effective_cost * CASE v_rate.billing_unit
      WHEN 'video_30s' THEN GREATEST(1,ceil(v_qty::numeric/30)::int)
      WHEN 'audio_min' THEN GREATEST(1,ceil(v_qty::numeric/60)::int)
      WHEN 'references_5' THEN GREATEST(1,ceil(v_qty::numeric/5)::int)
      WHEN 'image' THEN COALESCE(v_qty,1) ELSE 1 END;
    IF p_feature_slug IN ('ai_detector','text_detect_balanced') THEN
      v_engines:=COALESCE((p_metadata->>'engines')::integer,1);
      IF v_engines NOT IN (1,2) THEN RAISE EXCEPTION 'Invalid engine count'; END IF;
    END IF;
    v_is_trial_eligible := COALESCE(v_rate.trial_eligible, false);
    IF COALESCE(p_unit_quantity, 0) > 0 AND v_rate.billing_unit = 'words_1000' THEN
      v_effective_cost := v_rate.base_credit_cost * GREATEST(1, CEIL(p_unit_quantity::NUMERIC / 1000))::INTEGER;
    END IF;
    v_effective_cost := v_effective_cost*v_engines;
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
    IF length(p_idempotency_key)>200 THEN RAISE EXCEPTION 'Idempotency key too long'; END IF;
    p_idempotency_key := md5(COALESCE(p_user_id::text,'guest:'||p_guest_id)||':'||v_canonical_slug||':'||p_idempotency_key);
    PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key,0));
    IF EXISTS(SELECT 1 FROM credit_reservations cr WHERE cr.idempotency_key=p_idempotency_key) THEN
      RETURN QUERY SELECT false,NULL::uuid,'unknown'::text,0::numeric,0::numeric,0::numeric,0::numeric,false,0,0,
        'This operation was already submitted. Retrieve its existing result.'::text,'OPERATION_ALREADY_SUBMITTED'::text;
      RETURN;
    END IF;
  END IF;

  IF p_user_id IS NULL THEN
    IF p_guest_id IS NULL OR trim(p_guest_id) = '' THEN
      RETURN QUERY SELECT
        FALSE, NULL::UUID, 'guest'::TEXT, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 1::NUMERIC,
        FALSE, 0::INTEGER, 1::INTEGER,
        'Guest session identifier required'::TEXT, 'MISSING_GUEST_ID'::TEXT;
      RETURN;
    END IF;

    IF NOT v_is_trial_eligible OR billing_plan_rank(v_rate.min_plan)>1 THEN
      RETURN QUERY SELECT
        FALSE, NULL::UUID, 'guest'::TEXT, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 1::NUMERIC,
        FALSE, 0::INTEGER, 1::INTEGER,
        'This feature requires a paid subscription or registered free trial.'::TEXT, 'PAID_ONLY_FEATURE'::TEXT;
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
      RETURN QUERY SELECT false,NULL::uuid,'guest'::text,0::numeric,0::numeric,0::numeric,1::numeric,false,0,1,
        'A valid guest session is required. Please sign in.'::text,'MISSING_GUEST_ID'::text;
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

    -- Per-feature trial input cap (words). Blocks BEFORE consuming the check.
    IF v_trial_max_words IS NOT NULL AND COALESCE(p_unit_quantity, 0) > v_trial_max_words THEN
      RETURN QUERY SELECT
        FALSE, NULL::UUID, 'guest'::TEXT, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 1::NUMERIC,
        FALSE, 0::INTEGER, 1::INTEGER,
        'Free trial checks cover up to ' || v_trial_max_words || ' words. Create a free account and use plan credits to summarize longer text.'::TEXT,
        'TRIAL_INPUT_LIMIT_EXCEEDED'::TEXT;
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

  v_paid := billing_paid_active(v_profile.subscription_plan,v_profile.subscription_status,v_profile.plan_end_date);
  v_period := COALESCE(v_profile.billing_credit_period_start,v_profile.plan_start_date);
  p_metadata := COALESCE(p_metadata,'{}'::jsonb)||jsonb_build_object('billing_period',v_period);
  IF v_paid AND billing_plan_rank(v_profile.subscription_plan)<billing_plan_rank(v_rate.min_plan) THEN
    RETURN QUERY SELECT false,NULL::uuid,v_profile.subscription_plan::text,COALESCE(v_profile.credits_balance,0)::numeric,0::numeric,0::numeric,0::numeric,false,0,0,
      'Your plan does not include this feature.'::text,'UPGRADE_REQUIRED'::text;
    RETURN;
  END IF;
  IF NOT v_paid AND NOT v_is_api_key AND billing_plan_rank(v_profile.subscription_plan)<2 AND billing_plan_rank(v_rate.min_plan)<=1 AND v_is_trial_eligible AND COALESCE(v_profile.trial_checks_remaining, 0) > 0 THEN
    -- Per-feature trial input cap (words). Blocks BEFORE consuming the check.
    IF v_trial_max_words IS NOT NULL AND COALESCE(p_unit_quantity, 0) > v_trial_max_words THEN
      RETURN QUERY SELECT
        FALSE, NULL::UUID,
        COALESCE(v_profile.subscription_plan, 'free')::TEXT,
        COALESCE(v_profile.credits_balance, 0)::NUMERIC,
        0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
        FALSE,
        COALESCE(v_profile.trial_checks_remaining, 0)::INTEGER,
        v_intro_total,
        'Free trial checks cover up to ' || v_trial_max_words || ' words. This input is longer — upgrade or top up credits to summarize it.'::TEXT,
        'TRIAL_INPUT_LIMIT_EXCEEDED'::TEXT;
      RETURN;
    END IF;

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

  SELECT * INTO v_team_alloc FROM team_credit_allocations
    WHERE member_user_id=p_user_id AND status='active' ORDER BY owner_id LIMIT 1;
  IF FOUND THEN
    PERFORM refresh_billing_account(v_team_alloc.owner_id);
    SELECT * INTO v_owner FROM profiles WHERE id=v_team_alloc.owner_id FOR UPDATE;
    SELECT * INTO v_team_alloc FROM team_credit_allocations WHERE id=v_team_alloc.id FOR UPDATE;
    IF v_team_alloc.status='active' AND billing_paid_active(v_owner.subscription_plan,v_owner.subscription_status,v_owner.plan_end_date)
      AND billing_plan_rank(v_owner.subscription_plan)>=GREATEST(4,billing_plan_rank(v_rate.min_plan))
      AND v_owner.credits_balance>=v_effective_cost
      AND v_team_alloc.allocated_credits-v_team_alloc.consumed_credits>=v_effective_cost THEN
      UPDATE profiles owner_profile SET credits_balance=owner_profile.credits_balance-v_effective_cost,updated_at=now() WHERE owner_profile.id=v_owner.id;
      UPDATE team_credit_allocations SET consumed_credits=consumed_credits+v_effective_cost,updated_at=now() WHERE id=v_team_alloc.id;
      v_res_id:=gen_random_uuid();
      INSERT INTO credit_reservations(id,user_id,feature_slug,credits_reserved,status,idempotency_key,metadata,reservation_type,team_allocation_id,team_owner_id,expires_at)
      VALUES(v_res_id,p_user_id,v_canonical_slug,v_effective_cost,'reserved',p_idempotency_key,
        p_metadata||jsonb_build_object('billing_period',COALESCE(v_owner.billing_credit_period_start,v_owner.plan_start_date)),
        'team_credit',v_team_alloc.id,v_owner.id,now()+interval '15 minutes');
      RETURN QUERY SELECT true,v_res_id,v_owner.subscription_plan::text,
        LEAST(v_owner.credits_balance-v_effective_cost,v_team_alloc.allocated_credits-v_team_alloc.consumed_credits-v_effective_cost)::numeric,
        v_effective_cost::numeric,0::numeric,0::numeric,false,0,0,'Team credits reserved.'::text,NULL::text;
      RETURN;
    END IF;
  END IF;

  RETURN QUERY SELECT
    FALSE, NULL::UUID,
    COALESCE(v_profile.subscription_plan, 'free')::TEXT,
    v_user_balance, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
    FALSE,
    COALESCE(v_profile.trial_checks_remaining, 0)::INTEGER,
    v_intro_total,
    CASE
      WHEN v_is_api_key AND (NOT v_paid OR billing_plan_rank(v_profile.subscription_plan) < 4)
        THEN 'API access requires an active Business or Enterprise subscription.'
      WHEN v_profile.subscription_plan = 'free' THEN 'You''ve used your free checks. Choose a plan to continue.'
      ELSE 'Insufficient credits for this operation. Please top up or renew your plan to continue.'
    END::TEXT,
    CASE WHEN v_is_api_key AND (NOT v_paid OR billing_plan_rank(v_profile.subscription_plan) < 4)
      THEN 'UPGRADE_REQUIRED' ELSE 'INSUFFICIENT_CREDITS' END::TEXT;
END;
$$;