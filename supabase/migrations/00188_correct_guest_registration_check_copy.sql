-- Copy-only correction. Billing behavior and calculations are unchanged.
-- Guard against applying to an unexpected future function version.
DO $$
DECLARE v_def text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND p.proname='reserve_entitlement_and_credits'
    AND pg_get_function_identity_arguments(p.oid)='p_user_id uuid, p_guest_id text, p_feature_slug text, p_credits_cost numeric, p_timezone text, p_idempotency_key text, p_metadata jsonb, p_unit_quantity integer';

  IF v_def IS NULL THEN RAISE EXCEPTION 'Reservation function not found'; END IF;
  IF position('Register for 4 additional free checks.' in v_def)=0 THEN
    RAISE EXCEPTION 'Expected stale copy not found; refusing to alter function';
  END IF;

  v_def := replace(v_def,
    'Register for 4 additional free checks.',
    'Create a free account to get 5 free checks.');
  EXECUTE v_def;
END $$;
