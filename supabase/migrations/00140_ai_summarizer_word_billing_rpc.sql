-- 1) AI Summarizer: word-based billing (2 credits per started 1,000 input words)
--    + trial input cap (2,000 words per free trial check).
UPDATE public.credit_rate_table
SET base_credit_cost = 2,
    billing_unit = 'words_1000',
    min_plan = 'free',
    trial_eligible = true,
    details = jsonb_build_object(
      'description', '2 credits per started 1,000 input words',
      'trial_max_words', 2000
    ),
    updated_at = now()
WHERE feature_slug IN ('ai_summarizer', 'text_summarizer');

-- 2) Extend reserve_entitlement_and_credits with an optional unit quantity
--    (word-scaled billing for words_1000 features) and an optional per-feature
--    trial input cap read from credit_rate_table.details->trial_max_words.
--    Existing callers that do not pass p_unit_quantity keep the exact previous
--    behaviour (flat base_credit_cost, no trial input cap).
DROP FUNCTION public.reserve_entitlement_and_credits(uuid, text, text, numeric, text, text, jsonb);

CREATE FUNCTION public.reserve_entitlement_and_credits(
  p_user_id uuid DEFAULT NULL::uuid,
  p_guest_id text DEFAULT NULL::text,
  p_feature_slug text DEFAULT 'text_detect_balanced'::text,
  p_credits_cost numeric DEFAULT 1,
  p_timezone text DEFAULT 'UTC'::text,
  p_idempotency_key text DEFAULT NULL::text,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_unit_quantity integer DEFAULT NULL::integer
)
RETURNS TABLE(
  allowed boolean,
  reservation_id uuid,
  plan text,
  credits_balance numeric,
  credits_reserved numeric,
  daily_remaining numeric,
  daily_limit numeric,
  is_trial_check boolean,
  trial_checks_remaining integer,
  trial_checks_total integer,
  reason text,
  error_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $function$
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

  IF NOT FOUND THEN
    v_canonical_slug := CASE
      WHEN p_feature_slug LIKE 'image_%' OR p_feature_slug = 'ai_image_detector' THEN 'ai_image_detector'
      WHEN p_feature_slug LIKE 'video_%' OR p_feature_slug = 'ai_video_detector' THEN 'ai_video_detector'
      WHEN p_feature_slug IN ('citation_verifier', 'citation_check') THEN 'citation_verify'
      WHEN p_feature_slug IN ('hallucination_detector', 'hallucination_check') THEN 'hallucination_check'
      WHEN p_feature_slug IN ('humanizer_rewrite', 'run_humanizer') THEN 'ai_humanizer'
      WHEN p_feature_slug IN ('seo_content_studio', 'essay_studio') THEN 'seo_content_studio'
      WHEN p_feature_slug IN ('seo_assistant', 'seo_audit', 'seo_agent', 'keyword_research', 'keyword_intelligence', 'link_building', 'link_intelligence', 'semrush_report', 'technical_audit', 'aeo_optimizer', 'content_strategy', 'gsc_traffic', 'domain_analysis', 'seo_analyzer') THEN 'seo_assistant'
      WHEN p_feature_slug IN ('summarizer', 'text_summarizer') THEN 'ai_summarizer'
      ELSE 'ai_detector'
    END;
    SELECT * INTO v_rate FROM credit_rate_table WHERE feature_slug = v_canonical_slug;
  END IF;

  IF FOUND THEN
    v_effective_cost := COALESCE(v_rate.base_credit_cost, GREATEST(p_credits_cost::INTEGER, 1));
    v_is_trial_eligible := COALESCE(v_rate.trial_eligible, false);
    -- Opt-in unit-scaled billing: when a caller supplies a unit quantity
    -- (e.g. input words) for a words_1000 feature, charge the base rate
    -- multiplied by started 1,000-word units instead of the flat base rate.
    IF COALESCE(p_unit_quantity, 0) > 0 AND v_rate.billing_unit = 'words_1000' THEN
      v_effective_cost := v_rate.base_credit_cost * GREATEST(1, CEIL(p_unit_quantity::NUMERIC / 1000))::INTEGER;
    END IF;
    -- Optional per-feature free-trial input cap (in words), stored in the
    -- rate details JSONB. NULL when not configured (previous behaviour).
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

  IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) > 0 THEN
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
        v_existing_res.credits_reserved::NUMERIC,
        1::NUMERIC,
        1::NUMERIC,
        (v_existing_res.reservation_type = 'trial_check'),
        0::INTEGER,
        1::INTEGER,
        'Existing reservation recovered'::TEXT,
        NULL::TEXT;
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

    IF NOT v_is_trial_eligible THEN
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
        SELECT COUNT(*) INTO v_ip_new_sessions
        FROM server_guest_sessions
        WHERE ip_address = COALESCE(v_client_ip, 'unknown')
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

      INSERT INTO server_guest_sessions
        (guest_id, trial_checks_remaining, trial_checks_total, trial_checks_used, total_used, last_active_at)
      VALUES (p_guest_id, 1, 1, 0, 0, now())
      RETURNING * INTO v_guest;
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

  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      FALSE, NULL::UUID, 'unknown'::TEXT, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
      FALSE, 0::INTEGER, 0::INTEGER,
      'User profile not found'::TEXT, 'PROFILE_NOT_FOUND'::TEXT;
    RETURN;
  END IF;

  IF v_is_trial_eligible AND COALESCE(v_profile.trial_checks_remaining, 0) > 0 THEN
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

  IF v_user_balance >= v_effective_cost THEN
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

  SELECT * INTO v_team_alloc
  FROM team_credit_allocations
  WHERE member_user_id = p_user_id
    AND status = 'active'
  LIMIT 1
  FOR UPDATE;

  IF FOUND AND (v_team_alloc.allocated_credits - v_team_alloc.consumed_credits) >= v_effective_cost THEN
    UPDATE team_credit_allocations tca
    SET consumed_credits = tca.consumed_credits + v_effective_cost,
        updated_at = now()
    WHERE tca.id = v_team_alloc.id;

    v_res_id := gen_random_uuid();
    INSERT INTO credit_reservations (
      id, user_id, guest_id, feature_slug, credits_reserved, status, idempotency_key, metadata,
      reservation_type, team_allocation_id, team_owner_id, expires_at
    ) VALUES (
      v_res_id, p_user_id, p_guest_id, v_canonical_slug, v_effective_cost, 'reserved', p_idempotency_key, p_metadata,
      'team_credit', v_team_alloc.id, v_team_alloc.owner_id, now() + interval '15 minutes'
    );

    RETURN QUERY SELECT
      TRUE, v_res_id, 'team_member'::TEXT,
      (v_team_alloc.allocated_credits - v_team_alloc.consumed_credits)::NUMERIC,
      v_effective_cost::NUMERIC,
      (v_team_alloc.allocated_credits - v_team_alloc.consumed_credits)::NUMERIC,
      v_team_alloc.allocated_credits::NUMERIC,
      FALSE, 0::INTEGER, 0::INTEGER,
      'Team credit reserved'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    FALSE, NULL::UUID,
    COALESCE(v_profile.subscription_plan, 'free')::TEXT,
    v_user_balance, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
    FALSE,
    COALESCE(v_profile.trial_checks_remaining, 0)::INTEGER,
    v_intro_total,
    CASE
      WHEN v_profile.subscription_plan = 'free' THEN 'You''ve used your free checks. Choose a plan to continue.'
      ELSE 'Insufficient credits for this operation. Please top up or renew your plan to continue.'
    END::TEXT,
    'INSUFFICIENT_CREDITS'::TEXT;
END;
$function$;

-- 3) Grant execute to anon/authenticated/service_role (restore prior grants)
GRANT EXECUTE ON FUNCTION public.reserve_entitlement_and_credits(uuid, text, text, numeric, text, text, jsonb, integer) TO anon, authenticated, service_role;