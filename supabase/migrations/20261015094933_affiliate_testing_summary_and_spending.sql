-- Replace old individual allowlists and align summary/feature checks with the ledger.
DO $patch$
DECLARE d text; original text;
BEGIN
 SELECT pg_get_functiondef(oid) INTO d FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='get_user_entitlement_summary';
 original:=d;
 d:=regexp_replace(d,'IF p_user_id IN [^\n]* THEN v_plan := ''pro''; v_is_paid := true; END IF;',
 'IF public.has_affiliate_testing_grant(p_user_id) AND NOT v_is_paid THEN v_plan := ''pro''; v_is_paid := true; END IF;');
 IF d=original THEN RAISE EXCEPTION 'Expected summary affiliate clause missing'; END IF;
 d:=replace(d,'v_trial_total := COALESCE(v_profile.trial_checks_total, 5);',
 'v_trial_total := COALESCE(v_profile.trial_checks_total, 5);
      IF public.has_affiliate_testing_grant(p_user_id) THEN
        v_trial_remaining:=0; v_trial_total:=0;
        IF NOT billing_paid_active(v_profile.subscription_plan,v_profile.subscription_status,v_profile.plan_end_date) THEN
          v_monthly_alloc:=300; v_refill_date:=NULL;
        END IF;
      END IF;');
 EXECUTE d;
 SELECT pg_get_functiondef(oid) INTO d FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='reserve_entitlement_and_credits';
 original:=d;
 d:=regexp_replace(d,'IF (p_user_id IN \([^\)]*\) AND )?COALESCE\(v_profile.credits_balance,0\)>0 AND EXISTS [^\n]* AND NOT v_is_api_key AND billing_plan_rank\(v_rate.min_plan\)<=billing_plan_rank\(''pro''\) THEN',
 'IF NOT v_paid AND public.has_affiliate_testing_grant(p_user_id) AND NOT v_is_api_key AND billing_plan_rank(v_rate.min_plan)<=billing_plan_rank(''pro'') THEN');
 IF d=original THEN RAISE EXCEPTION 'Expected reservation affiliate clause missing'; END IF;
 EXECUTE d;
END $patch$;

