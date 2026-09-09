DO $$
DECLARE v_guest TEXT := 'test_guest_regression_3'; v_res RECORD; v_profile RECORD; v_i INT; v_ok BOOLEAN;
BEGIN
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(
    p_guest_id := v_guest, p_feature_slug := 'ai_detector', p_credits_cost := 1, p_timezone := 'UTC');
  IF NOT v_res.allowed THEN RAISE EXCEPTION 'TEST 3 FAIL: guest check should be allowed'; END IF;
  PERFORM settle_client_reservation(v_res.reservation_id, 'success', '{}'::jsonb);
  SELECT trial_checks_remaining, trial_checks_used INTO v_profile FROM server_guest_sessions WHERE guest_id = v_guest;
  IF v_profile.trial_checks_remaining <> 0 OR v_profile.trial_checks_used <> 1 THEN
    RAISE EXCEPTION 'TEST 3 FAIL: guest should have 0 remaining/1 used, got %/%', v_profile.trial_checks_remaining, v_profile.trial_checks_used; END IF;
  RAISE NOTICE 'TEST 3 PASS: guest check spent and settled';
END $$; SET LOCAL role TO service_role; RESET role;