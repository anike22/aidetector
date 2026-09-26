DO $$
DECLARE
  v_guest TEXT := 'test_guest_regression_1';
  v_res RECORD;
BEGIN
  DELETE FROM credit_reservations WHERE guest_id = v_guest;
  DELETE FROM usage_ledger WHERE guest_id = v_guest;
  DELETE FROM server_guest_sessions WHERE guest_id = v_guest;
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(
    p_guest_id := v_guest, p_feature_slug := 'ai_humanizer', p_credits_cost := 1, p_timezone := 'UTC'
  );
  IF NOT v_res.allowed THEN RAISE EXCEPTION 'TEST 1 FAIL: first guest check should be allowed'; END IF;
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(
    p_guest_id := v_guest, p_feature_slug := 'ai_humanizer', p_credits_cost := 1, p_timezone := 'UTC'
  );
  IF v_res.allowed THEN RAISE EXCEPTION 'TEST 1 FAIL: second guest check must be blocked'; END IF;
  IF v_res.error_code <> 'TRIAL_EXHAUSTED' THEN RAISE EXCEPTION 'TEST 1 FAIL: expected TRIAL_EXHAUSTED, got %', v_res.error_code; END IF;
  RAISE NOTICE 'TEST 1 PASS: guest allowed once, blocked after';
END $$;