SET LOCAL role TO service_role; DO $$
DECLARE v_guest TEXT := 'test_guest_regression_4'; v_res_a RECORD; v_res_b RECORD;
BEGIN
  DELETE FROM credit_reservations WHERE guest_id = v_guest;
  DELETE FROM usage_ledger WHERE guest_id = v_guest;
  DELETE FROM server_guest_sessions WHERE guest_id = v_guest;
  SELECT * INTO v_res_a FROM reserve_entitlement_and_credits(
    p_guest_id := v_guest, p_feature_slug := 'ai_humanizer', p_credits_cost := 1, p_timezone := 'UTC');
  SELECT * INTO v_res_b FROM reserve_entitlement_and_credits(
    p_guest_id := v_guest, p_feature_slug := 'ai_humanizer', p_credits_cost := 1, p_timezone := 'UTC');
  IF v_res_a.allowed = v_res_b.allowed THEN
    RAISE EXCEPTION 'TEST 4 FAIL: both concurrent reserves allowed=%', v_res_a.allowed; END IF;
  RAISE NOTICE 'TEST 4 PASS: concurrency single-winner (a=%, b=%)', v_res_a.allowed, v_res_b.allowed;
END $$; DO $$
DECLARE
  v_user_id UUID := '22222222-2222-4222-8222-222222222222';
  v_res RECORD; v_res2 RECORD; v_balance NUMERIC;
BEGIN
  DELETE FROM credit_reservations WHERE user_id = v_user_id;
  DELETE FROM usage_ledger WHERE user_id = v_user_id;
  DELETE FROM profiles WHERE id = v_user_id;
  DELETE FROM auth.identities WHERE user_id = v_user_id;
  DELETE FROM auth.users WHERE id = v_user_id;
  INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
  VALUES (v_user_id, 'billing-test-5@aicx-test.local', '{"full_name":"Billing Test 5"}'::jsonb, now(), now());
  INSERT INTO auth.identities (id, user_id, provider, identity_data, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_user_id, 'email',
    jsonb_build_object('sub',v_user_id::text,'email','billing-test-5@aicx-test.local','email_verified',true),
    v_user_id::text, now(), now(), now());
  UPDATE profiles SET subscription_plan = 'pro', credits_balance = 3, trial_checks_remaining = 0, trial_checks_used = 5
  WHERE id = v_user_id;
  SELECT credits_balance INTO v_balance FROM profiles WHERE id = v_user_id;
  IF v_balance IS DISTINCT FROM 3 THEN RAISE EXCEPTION 'TEST 5 SETUP FAIL: expected 3 credits, got %', v_balance; END IF;

  SELECT * INTO v_res FROM reserve_entitlement_and_credits(
    p_user_id := v_user_id, p_feature_slug := 'ai_humanizer', p_credits_cost := 1, p_timezone := 'UTC');
  IF NOT v_res.allowed THEN RAISE EXCEPTION 'TEST 5 FAIL: reserve should be allowed (%)', v_res.reason; END IF;
  PERFORM finalize_credit_reservation(v_res.reservation_id, 'failed', '{}'::jsonb, 'provider_error', 'UTC');
  SELECT credits_balance INTO v_balance FROM profiles WHERE id = v_user_id;
  IF v_balance <> 3 THEN RAISE EXCEPTION 'TEST 5 FAIL: failure should restore balance to 3, got %', v_balance; END IF;
  RAISE NOTICE 'TEST 5a PASS: failure releases credit';

  SELECT * INTO v_res FROM reserve_entitlement_and_credits(
    p_user_id := v_user_id, p_feature_slug := 'ai_humanizer', p_credits_cost := 1, p_timezone := 'UTC',
    p_idempotency_key := 'test_idem_5a');
  SELECT * INTO v_res2 FROM reserve_entitlement_and_credits(
    p_user_id := v_user_id, p_feature_slug := 'ai_humanizer', p_credits_cost := 1, p_timezone := 'UTC',
    p_idempotency_key := 'test_idem_5a');
  SELECT credits_balance INTO v_balance FROM profiles WHERE id = v_user_id;
  IF v_balance <> 2 THEN RAISE EXCEPTION 'TEST 5 FAIL: idempotent retry must not double-charge (balance=%)', v_balance; END IF;
  RAISE NOTICE 'TEST 5b PASS: idempotent retry single charge';

  SELECT * INTO v_res FROM reserve_entitlement_and_credits(
    p_user_id := v_user_id, p_feature_slug := 'ai_humanizer', p_credits_cost := 2, p_timezone := 'UTC');
  IF NOT v_res.allowed THEN RAISE EXCEPTION 'TEST 5 FAIL: final reserve should be allowed'; END IF;
  SELECT credits_balance INTO v_balance FROM profiles WHERE id = v_user_id;
  IF v_balance <> 0 THEN RAISE EXCEPTION 'TEST 5 FAIL: balance should be 0 after final reserve, got %', v_balance; END IF;
  PERFORM settle_client_reservation(v_res.reservation_id, 'success', '{}'::jsonb);
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(
    p_user_id := v_user_id, p_feature_slug := 'ai_humanizer', p_credits_cost := 1, p_timezone := 'UTC');
  IF v_res.allowed THEN RAISE EXCEPTION 'TEST 5 FAIL: new job at 0 balance must be blocked'; END IF;
  RAISE NOTICE 'TEST 5c PASS: final check completes, new job blocked at 0';
END $$; RESET role;