SET LOCAL role TO service_role; DO $$
DECLARE v_guest TEXT := 'test_guest_regression_3'; v_res RECORD; v_profile RECORD; v_i INT;
BEGIN
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(
    p_guest_id := v_guest, p_feature_slug := 'ai_detector', p_credits_cost := 1, p_timezone := 'UTC');
  IF NOT v_res.allowed THEN RAISE EXCEPTION 'TEST 3 FAIL: guest check should be allowed'; END IF;
  INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
  VALUES ('11111111-1111-4111-8111-111111111111', 'billing-test-3@aicx-test.local', '{"full_name":"Billing Test 3"}'::jsonb, now(), now());
  INSERT INTO auth.identities (id, user_id, provider, identity_data, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), '11111111-1111-4111-8111-111111111111', 'email',
    jsonb_build_object('sub','11111111-1111-4111-8111-111111111111','email','billing-test-3@aicx-test.local','email_verified',true),
    '11111111-1111-4111-8111-111111111111', now(), now(), now());
  UPDATE profiles SET trial_checks_remaining = 5, trial_checks_used = 0
  WHERE id = '11111111-1111-4111-8111-111111111111';
  SELECT trial_checks_remaining INTO v_profile FROM profiles WHERE id = '11111111-1111-4111-8111-111111111111';
  IF v_profile.trial_checks_remaining IS DISTINCT FROM 5 THEN
    RAISE EXCEPTION 'TEST 3 SETUP FAIL: profile not aligned to 5 checks (got %)', v_profile.trial_checks_remaining; END IF;
  SELECT * FROM link_guest_to_registered_user(p_guest_id := v_guest, p_user_id := '11111111-1111-4111-8111-111111111111'::uuid);
  SELECT trial_checks_remaining, trial_checks_used INTO v_profile FROM profiles WHERE id = '11111111-1111-4111-8111-111111111111';
  IF v_profile.trial_checks_remaining <> 4 OR v_profile.trial_checks_used <> 1 THEN
    RAISE EXCEPTION 'TEST 3 FAIL: expected 4 remaining/1 used, got %/%', v_profile.trial_checks_remaining, v_profile.trial_checks_used; END IF;
  SELECT * FROM link_guest_to_registered_user(p_guest_id := v_guest, p_user_id := '11111111-1111-4111-8111-111111111111'::uuid);
  SELECT trial_checks_remaining INTO v_profile FROM profiles WHERE id = '11111111-1111-4111-8111-111111111111';
  IF v_profile.trial_checks_remaining <> 4 THEN
    RAISE EXCEPTION 'TEST 3 FAIL: second link must not grant more checks (remaining=%)', v_profile.trial_checks_remaining; END IF;
  FOR v_i IN 1..4 LOOP
    SELECT * INTO v_res FROM reserve_entitlement_and_credits(
      p_user_id := '11111111-1111-4111-8111-111111111111'::uuid, p_feature_slug := 'ai_detector', p_credits_cost := 1, p_timezone := 'UTC');
    IF NOT v_res.allowed THEN RAISE EXCEPTION 'TEST 3 FAIL: check % of 4 should be allowed', v_i; END IF;
    PERFORM settle_client_reservation(v_res.reservation_id, 'success', '{}'::jsonb);
  END LOOP;
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(
    p_user_id := '11111111-1111-4111-8111-111111111111'::uuid, p_feature_slug := 'ai_detector', p_credits_cost := 1, p_timezone := 'UTC');
  IF v_res.allowed THEN RAISE EXCEPTION 'TEST 3 FAIL: 6th check (5 total) must be blocked'; END IF;
  RAISE NOTICE 'TEST 3 PASS: +4 granted exactly once, exhausted at 5 total';
END $$;