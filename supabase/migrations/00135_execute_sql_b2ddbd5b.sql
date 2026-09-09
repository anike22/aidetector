SET LOCAL role TO service_role; DO $$
DECLARE
  v_user_id UUID := '22222222-2222-4222-8222-222222222222';
  v_res RECORD; v_res2 RECORD; v_balance NUMERIC;
BEGIN
  -- 5a: genuine processing failure releases the full charge
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(
    p_user_id := v_user_id, p_feature_slug := 'ai_humanizer', p_credits_cost := 3, p_timezone := 'UTC');
  IF NOT v_res.allowed THEN RAISE EXCEPTION 'TEST 5a FAIL: reserve should be allowed (%)', v_res.reason; END IF;
  IF v_res.credits_reserved <> 3 THEN RAISE EXCEPTION 'TEST 5a FAIL: registry cost should be 3, got %', v_res.credits_reserved; END IF;
  PERFORM finalize_credit_reservation(v_res.reservation_id, 'failed', '{}'::jsonb, 'provider_error', 'UTC');
  SELECT credits_balance INTO v_balance FROM profiles WHERE id = v_user_id;
  IF v_balance <> 3 THEN RAISE EXCEPTION 'TEST 5a FAIL: failure should restore balance to 3, got %', v_balance; END IF;
  RAISE NOTICE 'TEST 5a PASS: failure releases registry-cost charge (3cr)';

  -- 5b: idempotent retry = exactly one charge, same reservation
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(
    p_user_id := v_user_id, p_feature_slug := 'ai_humanizer', p_credits_cost := 3, p_timezone := 'UTC',
    p_idempotency_key := 'test_idem_5b');
  SELECT * INTO v_res2 FROM reserve_entitlement_and_credits(
    p_user_id := v_user_id, p_feature_slug := 'ai_humanizer', p_credits_cost := 3, p_timezone := 'UTC',
    p_idempotency_key := 'test_idem_5b');
  SELECT credits_balance INTO v_balance FROM profiles WHERE id = v_user_id;
  IF v_balance <> 0 THEN RAISE EXCEPTION 'TEST 5b FAIL: exactly one 3cr charge expected (balance=%)', v_balance; END IF;
  IF v_res.reservation_id IS DISTINCT FROM v_res2.reservation_id THEN
    RAISE EXCEPTION 'TEST 5b FAIL: retry should return same reservation'; END IF;
  PERFORM settle_client_reservation(v_res.reservation_id, 'success', '{}'::jsonb);
  RAISE NOTICE 'TEST 5b PASS: idempotent retry single charge, same reservation id';

  -- 5c: reserved FINAL check stays authorized to finish; new job blocked at 0
  UPDATE profiles SET credits_balance = 1 WHERE id = v_user_id;
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(
    p_user_id := v_user_id, p_feature_slug := 'ai_detector', p_credits_cost := 1, p_timezone := 'UTC');
  IF NOT v_res.allowed THEN RAISE EXCEPTION 'TEST 5c FAIL: final check must be allowed at balance 1 (%)', v_res.reason; END IF;
  SELECT credits_balance INTO v_balance FROM profiles WHERE id = v_user_id;
  IF v_balance <> 0 THEN RAISE EXCEPTION 'TEST 5c FAIL: balance should be 0 after final reserve, got %', v_balance; END IF;
  PERFORM settle_client_reservation(v_res.reservation_id, 'success', '{}'::jsonb);
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(
    p_user_id := v_user_id, p_feature_slug := 'ai_detector', p_credits_cost := 1, p_timezone := 'UTC');
  IF v_res.allowed THEN RAISE EXCEPTION 'TEST 5c FAIL: new job at 0 balance must be blocked'; END IF;
  IF v_res.error_code IS DISTINCT FROM 'INSUFFICIENT_CREDITS' THEN
    RAISE EXCEPTION 'TEST 5c FAIL: expected INSUFFICIENT_CREDITS, got %', v_res.error_code; END IF;
  RAISE NOTICE 'TEST 5c PASS: final check completes after exhaustion; new job blocked';
END $$; RESET role;