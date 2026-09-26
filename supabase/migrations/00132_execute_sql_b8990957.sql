SET LOCAL role TO service_role; DO $$
DECLARE
  v_user_id UUID := '22222222-2222-4222-8222-222222222222';
  v_res RECORD; v_res2 RECORD; v_balance NUMERIC;
BEGIN
  -- 5a: failure releases the credit
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(
    p_user_id := v_user_id, p_feature_slug := 'ai_humanizer', p_credits_cost := 1, p_timezone := 'UTC');
  IF NOT v_res.allowed THEN RAISE EXCEPTION 'TEST 5a FAIL: reserve should be allowed (%)', v_res.reason; END IF;
  PERFORM finalize_credit_reservation(v_res.reservation_id, 'failed', '{}'::jsonb, 'provider_error', 'UTC');
  SELECT credits_balance INTO v_balance FROM profiles WHERE id = v_user_id;
  IF v_balance <> 3 THEN RAISE EXCEPTION 'TEST 5a FAIL: failure should restore balance to 3, got %', v_balance; END IF;
  RAISE NOTICE 'TEST 5a PASS: failure releases credit';

  -- 5b: idempotent retry = one charge
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(
    p_user_id := v_user_id, p_feature_slug := 'ai_humanizer', p_credits_cost := 1, p_timezone := 'UTC',
    p_idempotency_key := 'test_idem_5a');
  SELECT * INTO v_res2 FROM reserve_entitlement_and_credits(
    p_user_id := v_user_id, p_feature_slug := 'ai_humanizer', p_credits_cost := 1, p_timezone := 'UTC',
    p_idempotency_key := 'test_idem_5a');
  SELECT credits_balance INTO v_balance FROM profiles WHERE id = v_user_id;
  IF v_balance <> 2 THEN RAISE EXCEPTION 'TEST 5b FAIL: idempotent retry must not double-charge (balance=%)', v_balance; END IF;
  IF v_res.reservation_id IS DISTINCT FROM v_res2.reservation_id THEN
    RAISE EXCEPTION 'TEST 5b FAIL: idempotent retry should return same reservation'; END IF;
  RAISE NOTICE 'TEST 5b PASS: idempotent retry single charge, same reservation';

  -- 5c: reserved FINAL check stays authorized; new job blocked after
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(
    p_user_id := v_user_id, p_feature_slug := 'ai_humanizer', p_credits_cost := 2, p_timezone := 'UTC');
  IF NOT v_res.allowed THEN RAISE EXCEPTION 'TEST 5c FAIL: final reserve should be allowed'; END IF;
  SELECT credits_balance INTO v_balance FROM profiles WHERE id = v_user_id;
  IF v_balance <> 0 THEN RAISE EXCEPTION 'TEST 5c FAIL: balance should be 0 after final reserve, got %', v_balance; END IF;
  PERFORM settle_client_reservation(v_res.reservation_id, 'success', '{}'::jsonb);
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(
    p_user_id := v_user_id, p_feature_slug := 'ai_humanizer', p_credits_cost := 1, p_timezone := 'UTC');
  IF v_res.allowed THEN RAISE EXCEPTION 'TEST 5c FAIL: new job at 0 balance must be blocked'; END IF;
  RAISE NOTICE 'TEST 5c PASS: final check completes after exhaustion; new job blocked at 0';
END $$; RESET role;