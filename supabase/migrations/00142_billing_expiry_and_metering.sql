-- Billing v5: expiry is enforced inside every authorization, not by the UI.
BEGIN;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS billing_credit_period_start timestamptz;

CREATE OR REPLACE FUNCTION public.billing_plan_rank(p_plan text) RETURNS integer
LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT CASE lower(p_plan) WHEN 'guest' THEN 0 WHEN 'free' THEN 1 WHEN 'pro' THEN 2
 WHEN 'pro_plus' THEN 3 WHEN 'pro+' THEN 3 WHEN 'business' THEN 4 WHEN 'enterprise' THEN 5 ELSE -1 END;
$$;
CREATE OR REPLACE FUNCTION public.billing_paid_active(p_plan text,p_status text,p_end timestamptz) RETURNS boolean
LANGUAGE sql STABLE SET search_path=public AS $$
 SELECT COALESCE(public.billing_plan_rank(p_plan)>=2 AND lower(p_status) IN ('active','trialing','cancelled','canceled') AND p_end>now(),false);
$$;

-- SECURITY INVOKER distinguishes direct profile writes from trusted definer RPCs.
-- Do not use session_user membership: PostgREST's authenticator can assume all API roles.
CREATE OR REPLACE FUNCTION public.protect_billing_columns() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,auth AS $$
BEGIN
 IF current_user IN ('postgres','supabase_admin','service_role') THEN RETURN NEW; END IF;
 IF public.is_admin() THEN RETURN NEW; END IF;
 IF (to_jsonb(NEW)-ARRAY['full_name','avatar_url','phone','display_name','updated_at','security_preferences','developer_profile','detector_zero_retention','detector_data_retention_days','allow_feedback_training','active_organization_id','active_workspace_id'])
 IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['full_name','avatar_url','phone','display_name','updated_at','security_preferences','developer_profile','detector_zero_retention','detector_data_retention_days','allow_feedback_training','active_organization_id','active_workspace_id']) THEN
   RAISE EXCEPTION 'Billing and account fields can only be modified by the billing system';
 END IF;
 RETURN NEW;
END;
$$;

-- Internal only; public summaries and reservations enforce caller identity first.
CREATE OR REPLACE FUNCTION public.refresh_billing_account(p_user_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE p profiles%ROWTYPE; cycle_start timestamptz; next_cycle timestamptz;
BEGIN
 SELECT * INTO p FROM profiles WHERE id=p_user_id FOR UPDATE;
 IF NOT FOUND OR billing_plan_rank(p.subscription_plan)<2 THEN RETURN; END IF;
 IF NOT billing_paid_active(p.subscription_plan,p.subscription_status,p.plan_end_date) THEN
   -- Keep the purchased plan and dates for audit, but revoke its spendable allowance.
   UPDATE profiles SET subscription_status=CASE WHEN plan_end_date IS NULL OR plan_end_date<=now() THEN 'expired' ELSE subscription_status END,
     credits_balance=0, updated_at=now() WHERE id=p_user_id AND (credits_balance<>0 OR (plan_end_date IS NULL OR plan_end_date<=now()) AND subscription_status<>'expired');
   RETURN;
 END IF;
 IF p.billing_cycle IN ('annual','year') AND p.plan_start_date IS NOT NULL
    AND p.billing_credit_period_start IS NOT NULL THEN
   SELECT max(p.plan_start_date+make_interval(months=>n)) INTO cycle_start
   FROM generate_series(0,11) n WHERE p.plan_start_date+make_interval(months=>n)<=now();
   SELECT min(p.plan_start_date+make_interval(months=>n)) INTO next_cycle
   FROM generate_series(1,12) n WHERE p.plan_start_date+make_interval(months=>n)>now();
   IF cycle_start>p.billing_credit_period_start THEN
     UPDATE profiles SET credits_balance=monthly_credit_allocation,
       billing_credit_period_start=cycle_start,credits_refill_date=LEAST(next_cycle,plan_end_date),updated_at=now() WHERE id=p_user_id;
     UPDATE team_credit_allocations SET consumed_credits=0,updated_at=now() WHERE owner_id=p_user_id;
     INSERT INTO usage_ledger(user_id,feature_slug,operation,credits_amount,outcome,ledger_type,metadata)
     VALUES(p_user_id,'subscription_refill','annual_monthly_grant',p.monthly_credit_allocation,'success','subscription',jsonb_build_object('period_start',cycle_start));
   END IF;
 END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.refresh_billing_account(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_billing_account(uuid) TO service_role;

CREATE OR REPLACE FUNCTION "public"."reserve_entitlement_and_credits"("p_user_id" "uuid" DEFAULT NULL::"uuid", "p_guest_id" "text" DEFAULT NULL::"text", "p_feature_slug" "text" DEFAULT 'text_detect_balanced'::"text", "p_credits_cost" numeric DEFAULT 1, "p_timezone" "text" DEFAULT 'UTC'::"text", "p_idempotency_key" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb", "p_unit_quantity" integer DEFAULT NULL::integer) RETURNS TABLE("allowed" boolean, "reservation_id" "uuid", "plan" "text", "credits_balance" numeric, "credits_reserved" numeric, "daily_remaining" numeric, "daily_limit" numeric, "is_trial_check" boolean, "trial_checks_remaining" integer, "trial_checks_total" integer, "reason" "text", "error_code" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
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
    -- Opt-in unit-scaled billing: when a caller supplies a unit quantity
    -- (e.g. input words) for a words_1000 feature, charge the base rate
    -- multiplied by started 1,000-word units instead of the flat base rate.
    IF COALESCE(p_unit_quantity, 0) > 0 AND v_rate.billing_unit = 'words_1000' THEN
      v_effective_cost := v_rate.base_credit_cost * GREATEST(1, CEIL(p_unit_quantity::NUMERIC / 1000))::INTEGER;
    END IF;
    v_effective_cost := v_effective_cost*v_engines;
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

    IF NOT FOUND OR v_guest.linked_user_id IS NOT NULL THEN
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

  -- The owner pool and the member quota must both cover this operation.
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
CREATE OR REPLACE FUNCTION "public"."get_user_entitlement_summary"("p_user_id" "uuid" DEFAULT NULL::"uuid", "p_guest_id" "text" DEFAULT NULL::"text", "p_timezone" "text" DEFAULT 'UTC'::"text") RETURNS TABLE("plan" "text", "status" "text", "is_paid_active" boolean, "credits_balance" integer, "credits_used_total" integer, "trial_checks_remaining" integer, "trial_checks_used" integer, "trial_checks_total" integer, "monthly_credit_allocation" integer, "credits_refill_date" timestamp with time zone, "plan_end_date" timestamp with time zone, "warning_level" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
DECLARE
  v_role TEXT := COALESCE(current_setting('role', true), 'anon');
  v_auth_uid UUID := auth.uid();
  v_plan TEXT := 'guest';
  v_status TEXT := 'Active';
  v_is_paid BOOLEAN := FALSE;
  v_credits_balance INT := 0;
  v_credits_used INT := 0;
  v_trial_remaining INT := 1;
  v_trial_used INT := 0;
  v_trial_total INT := 1;
  v_monthly_alloc INT := 0;
  v_refill_date TIMESTAMPTZ := NULL;
  v_plan_end_date TIMESTAMPTZ := NULL;
  v_warning_level TEXT := 'normal';
  v_profile RECORD;
  v_guest RECORD;
  v_team RECORD;
  v_owner RECORD;
BEGIN
  -- Identity enforcement
  IF v_role <> 'service_role' THEN
    IF v_auth_uid IS NOT NULL THEN
      IF p_user_id IS NOT NULL AND p_user_id <> v_auth_uid THEN
        RAISE EXCEPTION 'Not authorized to view this entitlement summary';
      END IF;
      p_user_id := v_auth_uid;
    ELSE
      p_user_id := NULL;
    END IF;
  END IF;

  IF p_user_id IS NOT NULL THEN
    PERFORM refresh_billing_account(p_user_id);
    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
    IF FOUND THEN
      v_plan := COALESCE(v_profile.subscription_plan, 'free');
      v_status := COALESCE(v_profile.subscription_status, 'Active');
      v_plan_end_date := v_profile.plan_end_date;
      v_is_paid := billing_paid_active(v_plan,v_status,v_plan_end_date);
      v_credits_balance := COALESCE(v_profile.credits_balance, 0);
      v_monthly_alloc := COALESCE(v_profile.monthly_credit_allocation, 0);
      v_refill_date := v_profile.credits_refill_date;
      v_trial_remaining := COALESCE(v_profile.trial_checks_remaining, 5);
      v_trial_used := COALESCE(v_profile.trial_checks_used, 0);
      v_trial_total := COALESCE(v_profile.trial_checks_total, 5);

      SELECT COALESCE(SUM(credits_amount), 0) INTO v_credits_used
      FROM public.usage_ledger
      WHERE (user_id = p_user_id OR team_owner_id = p_user_id) AND outcome = 'success'
        AND reservation_id IS NOT NULL AND ledger_type IN ('usage','team','deduction')
        AND (v_profile.billing_credit_period_start IS NULL OR created_at>=v_profile.billing_credit_period_start);

      IF NOT v_is_paid THEN
        SELECT * INTO v_team FROM team_credit_allocations t WHERE t.member_user_id=p_user_id AND t.status='active' ORDER BY t.owner_id LIMIT 1;
        IF FOUND THEN
          PERFORM refresh_billing_account(v_team.owner_id);
          SELECT * INTO v_owner FROM profiles WHERE id=v_team.owner_id;
          IF billing_paid_active(v_owner.subscription_plan,v_owner.subscription_status,v_owner.plan_end_date) AND billing_plan_rank(v_owner.subscription_plan)>=4 THEN
            v_is_paid:=true; v_plan:=v_owner.subscription_plan; v_status:=v_owner.subscription_status;
            v_plan_end_date:=v_owner.plan_end_date; v_refill_date:=v_owner.credits_refill_date;
            v_credits_balance:=GREATEST(0,LEAST(v_owner.credits_balance,v_team.allocated_credits-v_team.consumed_credits));
            v_monthly_alloc:=v_team.allocated_credits; v_trial_remaining:=0;
          END IF;
        END IF;
      END IF;
      IF v_is_paid THEN
        IF v_credits_balance <= 0 THEN
          v_warning_level := 'exhausted';
        ELSIF v_monthly_alloc > 0 AND (v_credits_balance::NUMERIC / v_monthly_alloc::NUMERIC) <= 0.05 THEN
          v_warning_level := 'warning_95';
        ELSIF v_monthly_alloc > 0 AND (v_credits_balance::NUMERIC / v_monthly_alloc::NUMERIC) <= 0.20 THEN
          v_warning_level := 'warning_80';
        ELSE
          v_warning_level := 'normal';
        END IF;
      ELSE
        IF v_trial_remaining <= 0 AND v_credits_balance <= 0 THEN
          v_warning_level := 'exhausted';
        ELSIF v_trial_remaining = 1 AND v_credits_balance <= 0 THEN
          v_warning_level := 'warning_80';
        ELSE
          v_warning_level := 'normal';
        END IF;
      END IF;
    END IF;
  ELSIF p_guest_id IS NOT NULL AND length(trim(p_guest_id)) > 0 THEN
    v_plan := 'guest';
    v_trial_total := 1;
    SELECT * INTO v_guest FROM public.server_guest_sessions WHERE guest_id = p_guest_id;
    IF FOUND THEN
      v_trial_remaining := COALESCE(v_guest.trial_checks_remaining, 0);
      v_trial_used := COALESCE(v_guest.trial_checks_used, 0);
    ELSE
      v_trial_remaining := 1;
      v_trial_used := 0;
    END IF;
    v_warning_level := CASE WHEN v_trial_remaining <= 0 THEN 'exhausted' ELSE 'normal' END;
  ELSE
    v_trial_remaining := 1;
    v_trial_total := 1;
  END IF;

  RETURN QUERY
  SELECT v_plan, v_status, v_is_paid, v_credits_balance, v_credits_used,
    v_trial_remaining, v_trial_used, v_trial_total, v_monthly_alloc,
    v_refill_date, v_plan_end_date, v_warning_level;
END;
$$;
CREATE OR REPLACE FUNCTION "public"."finalize_credit_reservation"("p_reservation_id" "uuid" DEFAULT NULL::"uuid", "p_outcome" "text" DEFAULT 'success'::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb", "p_error_reason" "text" DEFAULT NULL::"text", "p_timezone" "text" DEFAULT 'UTC'::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
DECLARE
  v_role TEXT := COALESCE(current_setting('role', true), 'anon');
  v_auth_uid UUID := auth.uid();
  v_res RECORD;
  v_billable boolean;
  v_owner_id uuid;
BEGIN
  IF p_outcome NOT IN ('success','failed') THEN RAISE EXCEPTION 'Invalid outcome'; END IF;
  SELECT * INTO v_res FROM public.credit_reservations WHERE id = p_reservation_id FOR UPDATE;

  IF v_res IS NULL OR v_res.status NOT IN ('reserved', 'pending') THEN
    RETURN false;
  END IF;

  -- Caller authorization
  IF v_role = 'service_role' THEN
    NULL;
  ELSIF v_auth_uid IS NOT NULL THEN
    IF v_res.user_id IS NOT NULL AND v_res.user_id <> v_auth_uid THEN
      RAISE EXCEPTION 'Not authorized to settle this reservation';
    END IF;
  ELSE
    IF v_res.user_id IS NOT NULL THEN
      RAISE EXCEPTION 'Not authorized to settle this reservation';
    END IF;
  END IF;

  v_owner_id:=COALESCE(v_res.team_owner_id,v_res.user_id);
  SELECT billing_paid_active(subscription_plan,subscription_status,plan_end_date)
    AND (v_res.metadata->>'billing_period') IS NOT DISTINCT FROM to_jsonb(COALESCE(billing_credit_period_start,plan_start_date))#>>'{}'
    INTO v_billable FROM profiles WHERE id=v_owner_id FOR UPDATE;
  IF p_outcome = 'success' THEN
    -- Deduction already happened at reserve time; settle the ledger.
    IF v_res.reservation_type = 'trial_check' THEN
      INSERT INTO public.usage_ledger (
        user_id, guest_id, feature_slug, operation, credits_amount, trial_checks_amount,
        outcome, reservation_id, ledger_type, metadata
      ) VALUES (
        v_res.user_id, v_res.guest_id, v_res.feature_slug, 'trial_check_settled', 0, 1,
        'success', p_reservation_id, 'trial', p_metadata
      );
    ELSIF v_res.reservation_type = 'team_credit' AND v_res.team_owner_id IS NOT NULL THEN
      INSERT INTO public.usage_ledger (
        user_id, team_owner_id, feature_slug, operation, credits_amount,
        outcome, reservation_id, ledger_type, metadata
      ) VALUES (
        v_res.user_id, v_res.team_owner_id, v_res.feature_slug, 'team_credit_deducted', COALESCE(v_res.credits_reserved, 0),
        'success', p_reservation_id, 'team', p_metadata
      );
    ELSE
      INSERT INTO public.usage_ledger (
        user_id, feature_slug, operation, credits_amount,
        outcome, reservation_id, ledger_type, metadata
      ) VALUES (
        v_res.user_id, v_res.feature_slug, 'credit_deducted', COALESCE(v_res.credits_reserved, 0),
        'success', p_reservation_id, 'usage', p_metadata
      );
    END IF;

    UPDATE public.credit_reservations
    SET status = 'committed', finalized_at = now()
    WHERE id = p_reservation_id;
  ELSE
    -- GENUINE FAILURE: restore what was deducted at reserve time.
    IF v_res.reservation_type = 'trial_check' THEN
      IF v_res.user_id IS NOT NULL THEN
        UPDATE public.profiles
        SET trial_checks_remaining = LEAST(COALESCE(trial_checks_total, 5), COALESCE(trial_checks_remaining, 0) + 1),
            trial_checks_used = GREATEST(0, COALESCE(trial_checks_used, 0) - 1),
            updated_at = now()
        WHERE id = v_res.user_id;
      ELSIF v_res.guest_id IS NOT NULL THEN
        UPDATE public.server_guest_sessions
        SET trial_checks_remaining = LEAST(COALESCE(trial_checks_total, 1), COALESCE(trial_checks_remaining, 0) + 1),
            trial_checks_used = GREATEST(0, COALESCE(trial_checks_used, 0) - 1),
            updated_at = now()
        WHERE guest_id = v_res.guest_id;
      END IF;
    ELSIF COALESCE(v_billable,false) THEN
      UPDATE profiles SET credits_balance=credits_balance+v_res.credits_reserved,updated_at=now() WHERE id=v_owner_id;
      IF v_res.reservation_type='team_credit' THEN
        UPDATE team_credit_allocations SET consumed_credits=GREATEST(0,consumed_credits-v_res.credits_reserved),updated_at=now() WHERE id=v_res.team_allocation_id;
      END IF;
    END IF;

    UPDATE public.credit_reservations
    SET status = 'released', finalized_at = now()
    WHERE id = p_reservation_id;

    INSERT INTO public.usage_ledger (
      user_id, guest_id, team_owner_id, feature_slug, operation, credits_amount,
      outcome, reservation_id, error_reason, ledger_type, metadata
    ) VALUES (
      v_res.user_id, v_res.guest_id, v_res.team_owner_id, v_res.feature_slug, 'reservation_released',
      COALESCE(v_res.credits_reserved, 0), 'failed', p_reservation_id, p_error_reason, 'refund', p_metadata
    );
  END IF;

  RETURN true;
END;
$$;
DROP FUNCTION IF EXISTS public.settle_client_reservation(uuid,text,jsonb);
CREATE OR REPLACE FUNCTION "public"."settle_client_reservation"("p_reservation_id" "uuid", "p_outcome" "text" DEFAULT 'success'::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb", "p_guest_id" "text" DEFAULT NULL::"text") RETURNS TABLE("settled" boolean, "refunded" boolean, "reason" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
DECLARE
  v_role TEXT := COALESCE(current_setting('role', true), 'anon');
  v_auth_uid UUID := auth.uid();
  v_res RECORD;
  v_identity_key TEXT;
  v_recent_releases INT;
  v_refund_cap INT := 3;
  v_age_limit INTERVAL := interval '10 minutes';
BEGIN
  IF p_outcome NOT IN ('success', 'failed') THEN
    RETURN QUERY SELECT FALSE, FALSE, 'invalid_outcome'::TEXT;
    RETURN;
  END IF;

  SELECT * INTO v_res FROM public.credit_reservations
  WHERE id = p_reservation_id AND status IN ('reserved', 'pending')
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Already settled or unknown: idempotent success no-op.
    RETURN QUERY SELECT TRUE, FALSE, 'already_settled'::TEXT;
    RETURN;
  END IF;

  -- Authorization: the caller must own the reservation.
  IF v_role <> 'service_role' THEN
    IF v_auth_uid IS NOT NULL THEN
      IF v_res.user_id IS NOT NULL AND v_res.user_id <> v_auth_uid THEN
        RETURN QUERY SELECT FALSE, FALSE, 'not_authorized'::TEXT;
        RETURN;
      END IF;
      v_identity_key := 'user:' || v_auth_uid::TEXT;
    ELSE
      IF v_res.user_id IS NOT NULL OR p_guest_id IS NULL OR p_guest_id IS DISTINCT FROM v_res.guest_id THEN
        RETURN QUERY SELECT FALSE, FALSE, 'not_authorized'::TEXT;
        RETURN;
      END IF;
      v_identity_key := 'guest:' || p_guest_id;
    END IF;
  ELSE
    v_identity_key := 'user:' || COALESCE(v_res.user_id::TEXT, v_res.guest_id);
  END IF;

  -- Serialize each identity's refund budget; client claims never bypass the cap.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_identity_key,0));
  IF p_outcome='success' THEN
    PERFORM finalize_credit_reservation(p_reservation_id,'success',p_metadata);
    RETURN QUERY SELECT true,false,NULL::text; RETURN;
  END IF;
  SELECT COUNT(*) INTO v_recent_releases
  FROM public.usage_ledger
  WHERE operation = 'client_release'
    AND metadata->>'identity' = v_identity_key
    AND created_at > now() - interval '24 hours';

  IF now() - v_res.created_at <= v_age_limit AND v_recent_releases < v_refund_cap THEN
    PERFORM finalize_credit_reservation(p_reservation_id,'failed',p_metadata,'client_reported_failure');
    INSERT INTO public.usage_ledger (
      user_id, guest_id, feature_slug, operation, credits_amount,
      outcome, reservation_id, ledger_type, metadata
    ) VALUES (
      v_res.user_id, v_res.guest_id, v_res.feature_slug, 'client_release',
      COALESCE(v_res.credits_reserved, 0), 'failed', p_reservation_id, 'refund',
      p_metadata || jsonb_build_object('identity', v_identity_key, 'refunded', true)
    );

    RETURN QUERY SELECT TRUE, TRUE, NULL::TEXT;
    RETURN;
  END IF;

  -- Outside window or over the cap: release WITHOUT restoration.
  UPDATE public.credit_reservations
  SET status = 'released', finalized_at = now()
  WHERE id = p_reservation_id;

  INSERT INTO public.usage_ledger (
    user_id, guest_id, feature_slug, operation, credits_amount,
    outcome, reservation_id, ledger_type, metadata
  ) VALUES (
    v_res.user_id, v_res.guest_id, v_res.feature_slug, 'client_release',
    0, 'failed', p_reservation_id, 'refund',
    p_metadata || jsonb_build_object('identity', v_identity_key, 'refunded', false,
      'reason', CASE WHEN now() - v_res.created_at > v_age_limit THEN 'window_expired' ELSE 'cap_exceeded' END)
  );

  RETURN QUERY SELECT TRUE, FALSE,
    CASE WHEN now() - v_res.created_at > v_age_limit THEN 'refund_window_expired' ELSE 'refund_cap_exceeded' END::TEXT;
END;
$$;
CREATE OR REPLACE FUNCTION public.check_entitlement(p_user_id uuid,p_feature_slug text,p_timezone text DEFAULT 'UTC')
RETURNS TABLE(allowed boolean,reason text,remaining bigint,limit_value bigint,plan text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE s record; r record; ok boolean;
BEGIN
 SELECT * INTO s FROM get_user_entitlement_summary(p_user_id,NULL,p_timezone);
 SELECT * INTO r FROM credit_rate_table WHERE feature_slug=p_feature_slug;
 IF NOT FOUND THEN RETURN QUERY SELECT false,'Billing rate missing.'::text,0::bigint,0::bigint,s.plan; RETURN; END IF;
 ok:=CASE WHEN s.is_paid_active THEN billing_plan_rank(s.plan)>=billing_plan_rank(r.min_plan) AND s.credits_balance>=r.base_credit_cost
 ELSE billing_plan_rank(s.plan)<2 AND r.trial_eligible AND billing_plan_rank(r.min_plan)<=1 AND s.trial_checks_remaining>0 END;
 RETURN QUERY SELECT ok,CASE WHEN ok THEN NULL::text ELSE 'An active plan and sufficient credits are required.' END,
 CASE WHEN s.is_paid_active THEN s.credits_balance ELSE s.trial_checks_remaining END::bigint,
 CASE WHEN s.is_paid_active THEN s.monthly_credit_allocation ELSE s.trial_checks_total END::bigint,s.plan;
END;
$$;

-- Team quotas are managed through owner-authorized RPCs. Direct table mutation
-- remains readable for dashboards but cannot bypass plan, seat, or pool limits.
CREATE OR REPLACE FUNCTION public.allocate_team_member_credits(
  p_owner_id uuid, p_member_email text, p_allocated_credits integer,
  p_seat_name text DEFAULT NULL, p_role text DEFAULT 'member'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE
  v_owner profiles%ROWTYPE;
  v_member_id uuid;
  v_existing team_credit_allocations%ROWTYPE;
  v_other_allocated integer;
  v_active_seats integer;
  v_email text := lower(trim(p_member_email));
  v_result team_credit_allocations%ROWTYPE;
BEGIN
  IF current_setting('role',true) NOT IN ('service_role','postgres')
    AND auth.uid() IS DISTINCT FROM p_owner_id THEN
    RAISE EXCEPTION 'Not authorized to manage this team';
  END IF;
  IF v_email = '' OR position('@' in v_email) <= 1 OR p_allocated_credits <= 0
    OR p_role NOT IN ('member','admin') THEN
    RAISE EXCEPTION 'Invalid team allocation';
  END IF;

  PERFORM refresh_billing_account(p_owner_id);
  SELECT * INTO v_owner FROM profiles WHERE id=p_owner_id FOR UPDATE;
  IF NOT FOUND OR NOT billing_paid_active(v_owner.subscription_plan,v_owner.subscription_status,v_owner.plan_end_date)
    OR billing_plan_rank(v_owner.subscription_plan)<4 THEN
    RAISE EXCEPTION 'An active Business or Enterprise plan is required';
  END IF;
  IF lower(COALESCE(v_owner.email,''))=v_email THEN
    RAISE EXCEPTION 'The account owner cannot also be a team seat';
  END IF;

  SELECT id INTO v_member_id FROM profiles WHERE lower(email)=v_email ORDER BY created_at LIMIT 1;
  IF v_member_id IS NOT NULL AND EXISTS(
    SELECT 1 FROM team_credit_allocations
    WHERE member_user_id=v_member_id AND owner_id<>p_owner_id AND status='active'
  ) THEN
    RAISE EXCEPTION 'This member already belongs to another active team';
  END IF;

  SELECT * INTO v_existing FROM team_credit_allocations
  WHERE owner_id=p_owner_id AND lower(member_email)=v_email FOR UPDATE;
  SELECT count(*) INTO v_active_seats FROM team_credit_allocations
  WHERE owner_id=p_owner_id AND status='active'
    AND (v_existing.id IS NULL OR id<>v_existing.id);
  IF lower(v_owner.subscription_plan)='business' AND v_active_seats>=5 THEN
    RAISE EXCEPTION 'Business plans support at most 5 active team seats';
  END IF;
  SELECT COALESCE(sum(allocated_credits),0) INTO v_other_allocated
  FROM team_credit_allocations WHERE owner_id=p_owner_id AND status='active'
    AND (v_existing.id IS NULL OR id<>v_existing.id);
  IF v_other_allocated + GREATEST(p_allocated_credits,COALESCE(v_existing.consumed_credits,0))
    > COALESCE(v_owner.monthly_credit_allocation,0) THEN
    RAISE EXCEPTION 'Team allocations exceed the plan credit entitlement';
  END IF;

  INSERT INTO team_credit_allocations(owner_id,member_email,member_user_id,seat_name,role,allocated_credits,consumed_credits,status,updated_at)
  VALUES(p_owner_id,v_email,v_member_id,p_seat_name,p_role,
    GREATEST(p_allocated_credits,COALESCE(v_existing.consumed_credits,0)),
    COALESCE(v_existing.consumed_credits,0),'active',now())
  ON CONFLICT(owner_id,member_email) DO UPDATE SET
    member_user_id=COALESCE(EXCLUDED.member_user_id,team_credit_allocations.member_user_id),
    seat_name=EXCLUDED.seat_name, role=EXCLUDED.role,
    allocated_credits=GREATEST(EXCLUDED.allocated_credits,team_credit_allocations.consumed_credits),
    status='active',updated_at=now()
  RETURNING * INTO v_result;
  RETURN jsonb_build_object('success',true,'allocation',to_jsonb(v_result));
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_team_member(p_allocation_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE v_allocation team_credit_allocations%ROWTYPE;
BEGIN
  SELECT * INTO v_allocation FROM team_credit_allocations WHERE id=p_allocation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Team allocation not found'; END IF;
  IF current_setting('role',true) NOT IN ('service_role','postgres')
    AND auth.uid() IS DISTINCT FROM v_allocation.owner_id THEN
    RAISE EXCEPTION 'Not authorized to manage this team';
  END IF;
  UPDATE team_credit_allocations SET status='removed',
    allocated_credits=consumed_credits,updated_at=now() WHERE id=p_allocation_id;
  RETURN jsonb_build_object('success',true);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_team_credit_summary(p_user_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_owner profiles%ROWTYPE;
  v_member team_credit_allocations%ROWTYPE;
  v_allocations jsonb := '[]'::jsonb;
  v_allocated integer := 0;
  v_consumed integer := 0;
BEGIN
  IF current_setting('role',true) NOT IN ('service_role','postgres')
    AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized to view this team';
  END IF;
  PERFORM refresh_billing_account(p_user_id);
  SELECT * INTO v_profile FROM profiles WHERE id=p_user_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('is_team_account',false,'is_owner',false,'plan','free'); END IF;

  IF billing_paid_active(v_profile.subscription_plan,v_profile.subscription_status,v_profile.plan_end_date)
    AND billing_plan_rank(v_profile.subscription_plan)>=4 THEN
    SELECT COALESCE(sum(allocated_credits),0),COALESCE(sum(consumed_credits),0),
      COALESCE(jsonb_agg(to_jsonb(t.*) ORDER BY created_at),'[]'::jsonb)
    INTO v_allocated,v_consumed,v_allocations
    FROM team_credit_allocations t WHERE owner_id=p_user_id AND status='active';
    RETURN jsonb_build_object('is_team_account',true,'is_owner',true,
      'plan',v_profile.subscription_plan,'status',v_profile.subscription_status,
      'total_pool',COALESCE(v_profile.monthly_credit_allocation,0),
      'remaining_pool',COALESCE(v_profile.credits_balance,0),
      'total_allocated',v_allocated,'total_consumed',v_consumed,
      'unallocated_pool',GREATEST(0,COALESCE(v_profile.monthly_credit_allocation,0)-v_allocated),
      'credits_refill_date',v_profile.credits_refill_date,'plan_end_date',v_profile.plan_end_date,
      'allocations',v_allocations);
  END IF;

  UPDATE team_credit_allocations SET member_user_id=p_user_id,updated_at=now()
  WHERE member_user_id IS NULL AND status='active'
    AND lower(member_email)=lower(COALESCE(v_profile.email,''));
  SELECT * INTO v_member FROM team_credit_allocations
  WHERE member_user_id=p_user_id AND status='active' ORDER BY owner_id LIMIT 1;
  IF FOUND THEN
    PERFORM refresh_billing_account(v_member.owner_id);
    SELECT * INTO v_owner FROM profiles WHERE id=v_member.owner_id;
    IF billing_paid_active(v_owner.subscription_plan,v_owner.subscription_status,v_owner.plan_end_date)
      AND billing_plan_rank(v_owner.subscription_plan)>=4 THEN
      RETURN jsonb_build_object('is_team_account',true,'is_owner',false,
        'owner_id',v_member.owner_id,'seat_name',v_member.seat_name,'role',v_member.role,
        'allocated_credits',v_member.allocated_credits,'consumed_credits',v_member.consumed_credits,
        'remaining_credits',GREATEST(0,LEAST(COALESCE(v_owner.credits_balance,0),v_member.allocated_credits-v_member.consumed_credits)),
        'owner_shared_pool',COALESCE(v_owner.credits_balance,0),'plan',v_owner.subscription_plan,
        'status',v_owner.subscription_status,'credits_refill_date',v_owner.credits_refill_date,
        'plan_end_date',v_owner.plan_end_date);
    END IF;
  END IF;
  RETURN jsonb_build_object('is_team_account',false,'is_owner',false,
    'plan',COALESCE(v_profile.subscription_plan,'free'),'credits_balance',COALESCE(v_profile.credits_balance,0));
END;
$$;

DROP POLICY IF EXISTS "Team owners can manage allocations" ON public.team_credit_allocations;
CREATE POLICY "Team owners can view allocations" ON public.team_credit_allocations
  FOR SELECT TO authenticated USING(owner_id=auth.uid());
REVOKE ALL ON FUNCTION public.allocate_team_member_credits(uuid,text,integer,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.allocate_team_member_credits(uuid,text,integer,text,text) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.remove_team_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_team_member(uuid) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.get_team_credit_summary(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_credit_summary(uuid) TO authenticated,service_role;

-- API access is a Business entitlement and API-key usage is accounted by the
-- same reservation ledger. The legacy counter no longer performs billing.
INSERT INTO credit_rate_table(feature_slug,feature_name,trial_eligible,base_credit_cost,billing_unit,min_plan,details)
VALUES('api_access','REST API Request',false,1,'operation','business',
  '{"description":"1 credit per API request; active Business plan required"}'::jsonb)
ON CONFLICT(feature_slug) DO UPDATE SET trial_eligible=false,base_credit_cost=1,
  billing_unit='operation',min_plan='business',details=EXCLUDED.details,updated_at=now();
INSERT INTO credit_rate_table(feature_slug,feature_name,trial_eligible,base_credit_cost,billing_unit,min_plan,details)
VALUES('automation_run','Automation Workflow Run',false,1,'operation','business',
  '{"description":"1 credit per scheduled automation execution"}'::jsonb)
ON CONFLICT(feature_slug) DO UPDATE SET trial_eligible=false,base_credit_cost=1,
  billing_unit='operation',min_plan='business',details=EXCLUDED.details,updated_at=now();
CREATE OR REPLACE FUNCTION public.increment_api_key_usage(key_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF current_setting('role',true) NOT IN ('service_role','postgres') THEN
    RAISE EXCEPTION 'Service role required';
  END IF;
  UPDATE api_keys SET last_used_at=now() WHERE id=key_id AND is_active AND revoked_at IS NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.increment_api_key_usage(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.increment_api_key_usage(uuid) TO service_role;

DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can insert own api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can view own api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete own api keys" ON public.api_keys;
CREATE POLICY "Users can view own api keys" ON public.api_keys FOR SELECT TO authenticated
  USING(user_id=auth.uid() OR owner_user_id=auth.uid());
CREATE POLICY "Business users can create own api keys" ON public.api_keys FOR INSERT TO authenticated
  WITH CHECK((user_id=auth.uid() OR owner_user_id=auth.uid()) AND EXISTS(
    SELECT 1 FROM profiles p WHERE p.id=auth.uid()
      AND billing_paid_active(p.subscription_plan,p.subscription_status,p.plan_end_date)
      AND billing_plan_rank(p.subscription_plan)>=4));
CREATE POLICY "Users can delete own api keys" ON public.api_keys FOR DELETE TO authenticated
  USING(user_id=auth.uid() OR owner_user_id=auth.uid());

-- Exact aliases only: unknown feature names fail closed.
INSERT INTO credit_rate_table(feature_slug,feature_name,trial_eligible,base_credit_cost,billing_unit,min_plan,details)
SELECT alias, r.feature_name,r.trial_eligible,r.base_credit_cost,r.billing_unit,r.min_plan,r.details
FROM (VALUES ('plagiarism_checker','plagiarism_check'),('ai_detection','text_detect_balanced'),('run_humanizer','humanizer_rewrite'),('text_summarizer','ai_summarizer')) a(alias,canonical)
JOIN credit_rate_table r ON r.feature_slug=a.canonical ON CONFLICT(feature_slug) DO NOTHING;

REVOKE ALL ON FUNCTION public.finalize_credit_reservation(uuid,text,jsonb,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_credit_reservation(uuid,text,jsonb,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.reserve_entitlement_and_credits(uuid,text,text,numeric,text,text,jsonb,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_entitlement_and_credits(uuid,text,text,numeric,text,text,jsonb,integer) TO anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.settle_client_reservation(uuid,text,jsonb,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.settle_client_reservation(uuid,text,jsonb,text) TO anon,authenticated,service_role;
COMMIT;
