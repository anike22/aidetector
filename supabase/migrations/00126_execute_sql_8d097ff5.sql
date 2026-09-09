SET LOCAL role TO service_role; RESET role; DO $$
DECLARE v_res RECORD; v_i INT;
BEGIN
  FOR v_i IN 1..4 LOOP
    SELECT * INTO v_res FROM reserve_entitlement_and_credits(
      p_user_id := '11111111-1111-4111-8111-111111111111'::uuid, p_feature_slug := 'ai_detector', p_credits_cost := 1, p_timezone := 'UTC');
    IF NOT v_res.allowed THEN RAISE EXCEPTION 'TEST 3 FAIL: check % of 4 should be allowed', v_i; END IF;
    PERFORM settle_client_reservation(v_res.reservation_id, 'success', '{}'::jsonb);
  END LOOP;
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(
    p_user_id := '11111111-1111-4111-8111-111111111111'::uuid, p_feature_slug := 'ai_detector', p_credits_cost := 1, p_timezone := 'UTC');
  IF v_res.allowed THEN RAISE EXCEPTION 'TEST 3 FAIL: 6th check (5 total) must be blocked'; END IF;
  IF v_res.error_code IS DISTINCT FROM 'INSUFFICIENT_CREDITS' AND v_res.error_code IS DISTINCT FROM 'TRIAL_EXHAUSTED' THEN
    RAISE EXCEPTION 'TEST 3 FAIL: unexpected error code %', v_res.error_code; END IF;
  RAISE NOTICE 'TEST 3 PASS: +4 granted exactly once, exhausted at 5 total';
END $$;