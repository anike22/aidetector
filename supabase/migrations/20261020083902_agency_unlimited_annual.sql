-- Agency Unlimited is a separate annual entitlement; existing plans remain metered.
BEGIN;
CREATE OR REPLACE FUNCTION public.billing_plan_rank(p_plan text) RETURNS integer
LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT CASE lower(p_plan) WHEN 'guest' THEN 0 WHEN 'free' THEN 1 WHEN 'pro' THEN 2
 WHEN 'pro_plus' THEN 3 WHEN 'pro+' THEN 3 WHEN 'business' THEN 4 WHEN 'enterprise' THEN 5 WHEN 'agency_unlimited' THEN 5 ELSE -1 END;
$$;
INSERT INTO public.plan_prices(plan,billing_interval,currency,amount_cents,credits,is_active)
VALUES('agency_unlimited','year','usd',250000,0,true)
ON CONFLICT(plan,billing_interval,currency) DO UPDATE SET amount_cents=250000,credits=0,is_active=true;
-- Internal invoker helper: callable only by service role or the existing authorized RPCs.
CREATE OR REPLACE FUNCTION public.agency_entitlement_owner(p_user_id uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
 SELECT p.id FROM profiles p WHERE p.id=p_user_id AND p.subscription_plan='agency_unlimited'
 AND billing_paid_active(p.subscription_plan,p.subscription_status,p.plan_end_date)
 UNION ALL
 SELECT p.id FROM profiles p JOIN team_credit_allocations t ON t.owner_id=p.id
 JOIN profiles m ON m.id=p_user_id
 WHERE t.status='active' AND (t.member_user_id=p_user_id OR (t.member_user_id IS NULL AND lower(t.member_email)=lower(m.email)))
 AND p.subscription_plan='agency_unlimited' AND billing_paid_active(p.subscription_plan,p.subscription_status,p.plan_end_date)
 LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.agency_entitlement_owner(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.agency_entitlement_owner(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.apply_verified_subscription_payment(p_provider text, p_payment_reference text, p_user_id uuid, p_plan text, p_interval text, p_amount_minor bigint, p_currency text, p_paid_at timestamp with time zone, p_order_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE price record; monthly record; prior record; p record; period_end timestamptz; old_grant boolean; growth_quote record;
BEGIN
 IF current_setting('role',true)<>'service_role' AND session_user<>'postgres' THEN RAISE EXCEPTION 'Service role required'; END IF;
 IF p_provider NOT IN ('stripe','paystack') OR p_payment_reference IS NULL OR length(p_payment_reference) NOT BETWEEN 1 AND 200
 OR p_interval NOT IN ('month','year') OR p_paid_at IS NULL OR p_paid_at>now()+interval '5 minutes' THEN
   RAISE EXCEPTION 'Invalid verified payment';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_provider||':'||p_payment_reference,0));
 SELECT * INTO prior FROM billing_payments WHERE provider=p_provider AND payment_reference=p_payment_reference;
 IF FOUND THEN
   IF prior.user_id<>p_user_id OR prior.plan<>p_plan OR prior.billing_interval<>p_interval OR prior.amount_minor<>p_amount_minor OR prior.currency<>lower(p_currency) THEN
     RAISE EXCEPTION 'Payment identity or amount mismatch';
   END IF;
   RETURN jsonb_build_object('success',true,'granted',true,'idempotent_replay',true,'plan',prior.plan,'period_end',prior.period_end);
 END IF;
 SELECT * INTO p FROM profiles WHERE id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Billing account not found'; END IF;
 IF billing_paid_active(p.subscription_plan,p.subscription_status,p.plan_end_date)
   AND billing_plan_rank(p_plan)<billing_plan_rank(p.subscription_plan) THEN
   RAISE EXCEPTION 'Downgrades can take effect only after the current paid period ends';
 END IF;
 SELECT * INTO price FROM plan_prices WHERE plan=p_plan AND billing_interval=p_interval AND currency=lower(p_currency) AND is_active;
 IF p_plan='agency_unlimited' AND (p_interval<>'year' OR p_provider<>'paystack') THEN RAISE EXCEPTION 'Agency Unlimited requires annual Paystack payment'; END IF;
 SELECT * INTO monthly FROM plan_prices WHERE plan=p_plan AND billing_interval='month' AND currency=lower(p_currency) AND is_active;
 SELECT * INTO growth_quote FROM growth_private.quotes WHERE reference=p_payment_reference FOR UPDATE;
 IF growth_quote.reference IS NOT NULL THEN
  IF p_provider<>'paystack' OR p_interval<>'month' OR growth_quote.user_id<>p_user_id OR growth_quote.plan<>p_plan OR growth_quote.currency<>lower(p_currency) OR growth_quote.amount_minor<>p_amount_minor OR growth_quote.consumed OR p_paid_at>growth_quote.expires_at OR (SELECT redeemed FROM growth_private.offers WHERE user_id=p_user_id)>=3 THEN RAISE EXCEPTION 'Discounted payment does not match authorized checkout'; END IF;
 END IF;
 IF p_plan='agency_unlimited' THEN monthly:=price; END IF;
 IF price IS NULL OR monthly IS NULL OR (growth_quote.reference IS NULL AND price.amount_cents<>p_amount_minor) THEN RAISE EXCEPTION 'Paid amount or currency does not match plan'; END IF;
 period_end:=CASE WHEN p_interval='year' THEN p_paid_at+interval '1 year' ELSE p_paid_at+interval '30 days' END;
 -- Do not issue new credits for an old payment that was already fulfilled before this migration.
 SELECT EXISTS(SELECT 1 FROM usage_ledger WHERE user_id=p_user_id AND outcome='success'
   AND (ledger_type='subscription' OR operation='grant') AND (
     metadata->>'reference'=p_payment_reference OR metadata->>'session_id'=p_payment_reference
     OR metadata->>'event_id'=p_payment_reference
     OR (p_order_id IS NOT NULL AND metadata->>'order_id'=p_order_id::text))) INTO old_grant;
 IF NOT old_grant AND period_end<=now() THEN RAISE EXCEPTION 'Paid period has already ended; manual reconciliation required'; END IF;
 INSERT INTO billing_payments(provider,payment_reference,user_id,plan,billing_interval,amount_minor,currency,paid_at,period_end)
 VALUES(p_provider,p_payment_reference,p_user_id,p_plan,p_interval,p_amount_minor,lower(p_currency),p_paid_at,period_end);
 IF growth_quote.reference IS NOT NULL THEN
 UPDATE growth_private.quotes SET consumed=true WHERE reference=p_payment_reference;
 UPDATE growth_private.offers SET redeemed=redeemed+1 WHERE user_id=p_user_id;
 END IF;
 IF NOT old_grant THEN
   -- Older deliveries never overwrite a more recent paid period.
   IF p.plan_start_date IS NOT NULL AND p.plan_start_date>p_paid_at THEN RAISE EXCEPTION 'Out-of-order payment requires reconciliation'; END IF;
   UPDATE profiles SET subscription_plan=p_plan,subscription_status='active',
     billing_cycle=CASE WHEN p_interval='year' THEN 'annual' ELSE 'monthly' END,
     plan_start_date=p_paid_at,plan_end_date=period_end,
     billing_credit_period_start=p_paid_at,
     credits_refill_date=CASE WHEN p_plan='agency_unlimited' THEN NULL WHEN p_interval='year' THEN p_paid_at+interval '1 month' ELSE period_end END,
     monthly_credit_allocation=monthly.credits,credits_balance=monthly.credits,
     trial_checks_remaining=0,updated_at=now() WHERE id=p_user_id;
   UPDATE team_credit_allocations SET consumed_credits=0,updated_at=now() WHERE owner_id=p_user_id;
   INSERT INTO usage_ledger(user_id,feature_slug,operation,credits_amount,outcome,ledger_type,metadata)
   VALUES(p_user_id,'subscription_refill','verified_payment_grant',monthly.credits,'success','subscription',
     jsonb_build_object('provider',p_provider,'payment_reference',p_payment_reference,'period_start',p_paid_at,'period_end',period_end,'plan',p_plan));
 END IF;
 -- Order completion and entitlement grant commit together. Never mark an ungranted payment fulfilled.
 IF p_order_id IS NOT NULL THEN
   UPDATE orders SET status='completed',completed_at=now() WHERE id=p_order_id AND user_id=p_user_id;
   IF NOT FOUND THEN RAISE EXCEPTION 'Payment order ownership mismatch'; END IF;
 ELSIF p_provider='paystack' THEN
   INSERT INTO orders(user_id,items,total_amount,currency,status,paystack_reference,completed_at,metadata)
   VALUES(p_user_id,jsonb_build_array(jsonb_build_object('plan',p_plan,'interval',p_interval)),p_amount_minor/100.0,
     upper(p_currency),'completed',p_payment_reference,now(),jsonb_build_object('plan',p_plan,'interval',p_interval,'type','subscription'))
   ON CONFLICT (paystack_reference) WHERE paystack_reference IS NOT NULL AND status='completed' DO NOTHING;
 END IF;
 RETURN jsonb_build_object('success',true,'granted',true,'plan',p_plan,'period_end',period_end,'legacy_payment',old_grant);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.refresh_billing_account(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
 IF p.subscription_plan='agency_unlimited' THEN RETURN; END IF;
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
$function$
;

CREATE OR REPLACE FUNCTION public.allocate_team_member_credits(p_owner_id uuid, p_member_email text, p_allocated_credits integer, p_seat_name text DEFAULT NULL::text, p_role text DEFAULT 'member'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
  IF v_owner.subscription_plan='agency_unlimited' AND v_active_seats>=4 THEN
    RAISE EXCEPTION 'Agency Unlimited supports five users total, including the owner';
  END IF;
  IF lower(v_owner.subscription_plan)='business' AND v_active_seats>=5 THEN
    RAISE EXCEPTION 'Business plans support at most 5 active team seats';
  END IF;
  SELECT COALESCE(sum(allocated_credits),0) INTO v_other_allocated
  FROM team_credit_allocations WHERE owner_id=p_owner_id AND status='active'
    AND (v_existing.id IS NULL OR id<>v_existing.id);
  IF v_owner.subscription_plan<>'agency_unlimited' AND v_other_allocated + GREATEST(p_allocated_credits,COALESCE(v_existing.consumed_credits,0))
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
$function$
;

CREATE OR REPLACE FUNCTION public.reserve_entitlement_and_credits(p_user_id uuid DEFAULT NULL::uuid, p_guest_id text DEFAULT NULL::text, p_feature_slug text DEFAULT 'text_detect_balanced'::text, p_credits_cost numeric DEFAULT 1, p_timezone text DEFAULT 'UTC'::text, p_idempotency_key text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb, p_unit_quantity integer DEFAULT NULL::integer)
 RETURNS TABLE(allowed boolean, reservation_id uuid, plan text, credits_balance numeric, credits_reserved numeric, daily_remaining numeric, daily_limit numeric, is_trial_check boolean, trial_checks_remaining integer, trial_checks_total integer, reason text, error_code text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
  v_agency_owner uuid;
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

  IF NOT FOUND AND p_user_id IS NOT NULL AND public.agency_entitlement_owner(p_user_id) IS NOT NULL
    AND p_feature_slug IN ('text_detect_balanced','text_detect_aggressive','ai_detection','humanizer_rewrite','humanizer','plagiarism_checker','plagiarism_deep','ai_video_detector','video_detect_high_sensitivity','video_detect_forensic','ai_voice_detector','citation_verifier','hallucination_detector','hallucination_check','verified_authorship_register','seo_content_studio','blogger_seo_check','ai_checker_blogger','blogger_checker','seo_assistant_blogger','seo_generate_article') THEN
    -- Agency-only aliases for existing website operations. Unknown features still fail closed.
    SELECT * INTO v_rate FROM credit_rate_table WHERE feature_slug='ai_detector';
    v_rate.billing_unit:='fixed'; v_rate.min_plan:='pro';
  END IF;
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
        'You''ve used your free check. Create a free account to get 5 free checks.'::TEXT,
        'TRIAL_EXHAUSTED'::TEXT;
      RETURN;
    END IF;

    -- Enforce per-feature trial input caps before consuming the one guest check.
    IF v_trial_max_words IS NOT NULL AND COALESCE(p_unit_quantity, 0) > v_trial_max_words THEN
      RETURN QUERY SELECT
        FALSE, NULL::UUID, 'guest'::TEXT, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 1::NUMERIC,
        FALSE, COALESCE(v_guest.trial_checks_remaining, 0)::INTEGER, 1::INTEGER,
        'Free trial checks cover up to ' || v_trial_max_words || ' words. Create a free account or upgrade for longer input.'::TEXT,
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

  v_agency_owner := public.agency_entitlement_owner(p_user_id);
  IF v_agency_owner IS NOT NULL THEN
    -- API classification is server supplied. Direct website RPCs cannot execute API handlers.
    IF v_is_api_key OR p_feature_slug IN ('api_access','bulk_processing','automation_run') THEN
      RETURN QUERY SELECT false,NULL::uuid,'agency_unlimited'::text,0::numeric,0::numeric,0::numeric,0::numeric,false,0,0,
        'Agency Unlimited excludes API access and automated bulk processing.'::text,'AGENCY_FEATURE_EXCLUDED'::text;
      RETURN;
    END IF;
    SELECT * INTO v_owner FROM profiles WHERE id=v_agency_owner FOR UPDATE;
    -- Recheck after locking so expiry/refund cannot race an authorization.
    IF NOT billing_paid_active(v_owner.subscription_plan,v_owner.subscription_status,v_owner.plan_end_date) THEN
      RETURN QUERY SELECT false,NULL::uuid,'agency_unlimited'::text,0::numeric,0::numeric,0::numeric,0::numeric,false,0,0,
        'Agency access has ended.'::text,'SUBSCRIPTION_EXPIRED'::text;
      RETURN;
    END IF;
    IF v_agency_owner<>p_user_id THEN
      SELECT * INTO v_team_alloc FROM team_credit_allocations WHERE owner_id=v_agency_owner AND member_user_id=p_user_id AND status='active' FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Agency team membership is no longer active'; END IF;
    END IF;
    v_res_id:=gen_random_uuid();
    INSERT INTO credit_reservations(id,user_id,feature_slug,credits_reserved,status,idempotency_key,metadata,reservation_type,expires_at,team_owner_id)
    VALUES(v_res_id,p_user_id,p_feature_slug,0,'reserved',p_idempotency_key,
      COALESCE(p_metadata,'{}'::jsonb)||jsonb_build_object('agency_unlimited',true,'billing_period',v_owner.plan_start_date),
      'user_credit',now()+interval '15 minutes',CASE WHEN v_agency_owner<>p_user_id THEN v_agency_owner ELSE NULL END);
    RETURN QUERY SELECT true,v_res_id,'agency_unlimited'::text,0::numeric,0::numeric,0::numeric,0::numeric,false,0,0,
      'Included in Agency Unlimited; no credits deducted.'::text,NULL::text;
    RETURN;
  END IF;
  v_paid := billing_paid_active(v_profile.subscription_plan, v_profile.subscription_status, v_profile.plan_end_date);
  IF NOT v_paid AND public.has_affiliate_testing_grant(p_user_id) AND NOT v_is_api_key AND billing_plan_rank(v_rate.min_plan)<=billing_plan_rank('pro') THEN
    v_paid := true;
    v_profile.subscription_plan := 'pro';
  END IF;
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
    -- Enforce per-feature trial input caps before consuming any registered free check.
    IF v_trial_max_words IS NOT NULL AND COALESCE(p_unit_quantity, 0) > v_trial_max_words THEN
      RETURN QUERY SELECT
        FALSE, NULL::UUID,
        COALESCE(v_profile.subscription_plan, 'free')::TEXT,
        COALESCE(v_profile.credits_balance, 0)::NUMERIC,
        0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
        FALSE,
        COALESCE(v_profile.trial_checks_remaining, 0)::INTEGER,
        v_intro_total,
        'Free trial checks cover up to ' || v_trial_max_words || ' words. Upgrade or top up credits for longer input.'::TEXT,
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_entitlement_summary(p_user_id uuid DEFAULT NULL::uuid, p_guest_id text DEFAULT NULL::text, p_timezone text DEFAULT 'UTC'::text)
 RETURNS TABLE(plan text, status text, is_paid_active boolean, credits_balance integer, credits_used_total integer, trial_checks_remaining integer, trial_checks_used integer, trial_checks_total integer, monthly_credit_allocation integer, credits_refill_date timestamp with time zone, plan_end_date timestamp with time zone, warning_level text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
      IF public.has_affiliate_testing_grant(p_user_id) AND NOT v_is_paid THEN v_plan := 'pro'; v_is_paid := true; END IF;
      v_credits_balance := COALESCE(v_profile.credits_balance, 0);
      v_monthly_alloc := COALESCE(v_profile.monthly_credit_allocation, 0);
      v_refill_date := v_profile.credits_refill_date;
      v_trial_remaining := COALESCE(v_profile.trial_checks_remaining, 5);
      v_trial_used := COALESCE(v_profile.trial_checks_used, 0);
      v_trial_total := COALESCE(v_profile.trial_checks_total, 5);
      IF public.has_affiliate_testing_grant(p_user_id) THEN
        v_trial_remaining:=0; v_trial_total:=0;
        IF NOT billing_paid_active(v_profile.subscription_plan,v_profile.subscription_status,v_profile.plan_end_date) THEN
          v_monthly_alloc:=300; v_refill_date:=NULL;
        END IF;
      END IF;

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

  IF p_user_id IS NOT NULL AND public.agency_entitlement_owner(p_user_id) IS NOT NULL THEN
    SELECT * INTO v_owner FROM profiles WHERE id=public.agency_entitlement_owner(p_user_id);
    v_plan:='agency_unlimited'; v_status:=v_owner.subscription_status; v_is_paid:=true;
    v_plan_end_date:=v_owner.plan_end_date; v_refill_date:=NULL; v_credits_balance:=0;
    v_monthly_alloc:=0; v_trial_remaining:=0; v_trial_total:=0; v_warning_level:='normal';
  END IF;
  RETURN QUERY
  SELECT v_plan, v_status, v_is_paid, v_credits_balance, v_credits_used,
    v_trial_remaining, v_trial_used, v_trial_total, v_monthly_alloc,
    v_refill_date, v_plan_end_date, v_warning_level;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.growth_checkout_quote(p_user_id uuid, p_plan text, p_interval text, p_code text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE price record; o record; q record; discounted boolean:=false; ref text;
BEGIN
 IF current_setting('role',true)<>'service_role' THEN RAISE EXCEPTION 'Service only'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=p_user_id FOR UPDATE;
 SELECT * INTO price FROM public.plan_prices WHERE plan=p_plan AND billing_interval=p_interval AND is_active;
 IF price IS NULL THEN RAISE EXCEPTION 'No active plan price'; END IF;
 IF p_plan='agency_unlimited' THEN
  IF p_interval<>'year' THEN RAISE EXCEPTION 'Agency Unlimited is annual only'; END IF;
  RETURN jsonb_build_object('amount_minor',price.amount_cents,'discounted',false);
 END IF;
 SELECT * INTO o FROM growth_private.offers WHERE user_id=p_user_id;
 IF upper(p_code)='GROWTH10' AND o IS NULL THEN
  IF p_interval<>'month' THEN RAISE EXCEPTION 'GROWTH10 is for monthly plans only'; END IF;
  IF now()>(SELECT redeem_until FROM growth_private.campaign WHERE id=true) THEN RAISE EXCEPTION 'Introductory offer has expired'; END IF;
  IF EXISTS(SELECT 1 FROM public.billing_payments WHERE user_id=p_user_id) OR EXISTS(SELECT 1 FROM public.profiles WHERE id=p_user_id AND subscription_plan NOT IN ('free','guest') AND subscription_plan IS NOT NULL) THEN RAISE EXCEPTION 'Offer is for first-time paying customers'; END IF;
  INSERT INTO growth_private.offers(user_id) VALUES(p_user_id) RETURNING * INTO o;
 ELSIF p_code<>'' AND upper(p_code)<>'GROWTH10' THEN RAISE EXCEPTION 'Unknown offer code'; END IF;
 discounted:=p_interval='month' AND o IS NOT NULL AND o.redeemed<3;
 IF NOT discounted THEN RETURN jsonb_build_object('amount_minor',price.amount_cents,'discounted',false); END IF;
 SELECT * INTO q FROM growth_private.quotes WHERE user_id=p_user_id AND NOT consumed AND expires_at>now() ORDER BY expires_at DESC LIMIT 1;
 IF q.reference IS NOT NULL THEN
  IF q.plan<>p_plan THEN RAISE EXCEPTION 'Finish your open discounted checkout or wait for it to expire before changing plans'; END IF;
  RETURN to_jsonb(q);
 END IF;
 ref:='growth-'||gen_random_uuid()::text;
 INSERT INTO growth_private.quotes(reference,user_id,plan,currency,amount_minor,discounted) VALUES(ref,p_user_id,p_plan,price.currency,round(price.amount_cents*0.9)::bigint,true) RETURNING * INTO q;
 RETURN to_jsonb(q);
END $function$
;
-- Replacements keep their existing grants. Explicitly deny public execution on financial/internal RPCs.
REVOKE ALL ON FUNCTION public.apply_verified_subscription_payment(text,text,uuid,text,text,bigint,text,timestamptz,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_verified_subscription_payment(text,text,uuid,text,text,bigint,text,timestamptz,uuid) TO service_role;
COMMIT;
