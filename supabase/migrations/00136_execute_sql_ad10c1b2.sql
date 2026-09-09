SET LOCAL role TO service_role; DO $$
DECLARE v_guest TEXT := 'test_guest_regression_2'; v_res RECORD;
BEGIN
  DELETE FROM credit_reservations WHERE guest_id = v_guest;
  DELETE FROM usage_ledger WHERE guest_id = v_guest;
  DELETE FROM server_guest_sessions WHERE guest_id = v_guest;
  -- Spend the single guest check on the DETECTOR
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(
    p_guest_id := v_guest, p_feature_slug := 'ai_detector', p_credits_cost := 1, p_timezone := 'UTC');
  IF NOT v_res.allowed THEN RAISE EXCEPTION 'TEST 2 FAIL: detector check should be allowed'; END IF;
  PERFORM settle_client_reservation(v_res.reservation_id, 'success', '{}'::jsonb);
  -- Humanizer must NOT grant another free check
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(
    p_guest_id := v_guest, p_feature_slug := 'ai_humanizer', p_credits_cost := 3, p_timezone := 'UTC');
  IF v_res.allowed THEN RAISE EXCEPTION 'TEST 2 FAIL: humanizer granted second free check across tools'; END IF;
  IF v_res.error_code IS DISTINCT FROM 'TRIAL_EXHAUSTED' THEN
    RAISE EXCEPTION 'TEST 2 FAIL: expected TRIAL_EXHAUSTED, got %', v_res.error_code; END IF;
  IF position('Register for 4 additional free checks' in v_res.reason) = 0 THEN
    RAISE EXCEPTION 'TEST 2 FAIL: spec message missing: %', v_res.reason; END IF;
  RAISE NOTICE 'TEST 2 PASS: cross-tool shared allowance enforced';
END $$; RESET role; SET LOCAL role TO anon; DO $$
DECLARE v_denied INT := 0;
BEGIN
  BEGIN PERFORM count(*) FROM server_guest_sessions; EXCEPTION WHEN insufficient_privilege OR insufficient_privilege THEN v_denied := v_denied + 1; END;
  BEGIN PERFORM count(*) FROM credit_reservations; EXCEPTION WHEN insufficient_privilege THEN v_denied := v_denied + 1; END;
  BEGIN PERFORM count(*) FROM usage_ledger; EXCEPTION WHEN insufficient_privilege THEN v_denied := v_denied + 1; END;
  BEGIN PERFORM count(*) FROM plan_prices; EXCEPTION WHEN insufficient_privilege THEN v_denied := v_denied + 1; END;
  IF v_denied <> 4 THEN RAISE EXCEPTION 'RLS TEST FAIL: only %/4 billing tables blocked for anon', v_denied; END IF;
  RAISE NOTICE 'RLS TEST PASS: all 4 billing tables service-only for anon';
END $$; RESET role;