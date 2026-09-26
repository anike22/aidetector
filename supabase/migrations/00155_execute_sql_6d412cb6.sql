DO $$
DECLARE
  v_test_uid uuid := '07a02b64-9779-46ea-8db7-63cfbfdb8df8';
  v_res record;
  v_bal numeric;
  v_orig_plan text;
  v_orig_status text;
  v_orig_bal numeric;
BEGIN
  SELECT subscription_plan, subscription_status, credits_balance INTO v_orig_plan, v_orig_status, v_orig_bal
  FROM profiles WHERE id = v_test_uid;

  -- Put in temporary active pro status for test
  UPDATE profiles SET subscription_plan='pro', subscription_status='active', credits_balance=100,
    plan_start_date=now(), plan_end_date=now()+interval '30 days'
  WHERE id = v_test_uid;

  -- 1. AI Detector: 1 credit (10 -> 9)
  UPDATE profiles SET credits_balance = 10 WHERE id = v_test_uid;
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(v_test_uid, NULL, 'ai_detector', 1, 'UTC', NULL, '{"engines":1}'::jsonb, 500);
  PERFORM finalize_credit_reservation(v_res.reservation_id, 'success');
  SELECT credits_balance INTO v_bal FROM profiles WHERE id = v_test_uid;
  IF v_bal <> 9 THEN RAISE EXCEPTION 'AI Detector deduction failed: expected 9, got %', v_bal; END IF;

  -- 2. Humanizer: 10 credits (20 -> 10)
  UPDATE profiles SET credits_balance = 20 WHERE id = v_test_uid;
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(v_test_uid, NULL, 'ai_humanizer', 10, 'UTC', NULL, '{}'::jsonb, 500);
  PERFORM finalize_credit_reservation(v_res.reservation_id, 'success');
  SELECT credits_balance INTO v_bal FROM profiles WHERE id = v_test_uid;
  IF v_bal <> 10 THEN RAISE EXCEPTION 'Humanizer deduction failed: expected 10, got %', v_bal; END IF;

  -- 3. Plagiarism: 10 credits (20 -> 10)
  UPDATE profiles SET credits_balance = 20 WHERE id = v_test_uid;
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(v_test_uid, NULL, 'plagiarism_check', 10, 'UTC', NULL, '{}'::jsonb, 800);
  PERFORM finalize_credit_reservation(v_res.reservation_id, 'success');
  SELECT credits_balance INTO v_bal FROM profiles WHERE id = v_test_uid;
  IF v_bal <> 10 THEN RAISE EXCEPTION 'Plagiarism deduction failed: expected 10, got %', v_bal; END IF;

  -- 4. Image Detector: 5 credits (10 -> 5)
  UPDATE profiles SET credits_balance = 10 WHERE id = v_test_uid;
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(v_test_uid, NULL, 'image_detect_standard', 5, 'UTC', NULL, '{}'::jsonb, 1);
  PERFORM finalize_credit_reservation(v_res.reservation_id, 'success');
  SELECT credits_balance INTO v_bal FROM profiles WHERE id = v_test_uid;
  IF v_bal <> 5 THEN RAISE EXCEPTION 'Image Detector deduction failed: expected 5, got %', v_bal; END IF;

  -- 5. Voice Detector: 5 credits (10 -> 5)
  UPDATE profiles SET credits_balance = 10 WHERE id = v_test_uid;
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(v_test_uid, NULL, 'voice_analysis', 5, 'UTC', NULL, '{}'::jsonb, 30);
  PERFORM finalize_credit_reservation(v_res.reservation_id, 'success');
  SELECT credits_balance INTO v_bal FROM profiles WHERE id = v_test_uid;
  IF v_bal <> 5 THEN RAISE EXCEPTION 'Voice Detector deduction failed: expected 5, got %', v_bal; END IF;

  -- 6. Deepfake Detector: 10 credits (20 -> 10)
  UPDATE profiles SET credits_balance = 20 WHERE id = v_test_uid;
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(v_test_uid, NULL, 'deepfake_detector', 10, 'UTC', NULL, '{}'::jsonb, 1);
  PERFORM finalize_credit_reservation(v_res.reservation_id, 'success');
  SELECT credits_balance INTO v_bal FROM profiles WHERE id = v_test_uid;
  IF v_bal <> 10 THEN RAISE EXCEPTION 'Deepfake Detector deduction failed: expected 10, got %', v_bal; END IF;

  -- 7. Video Detector: 15 credits (20 -> 5)
  UPDATE profiles SET credits_balance = 20 WHERE id = v_test_uid;
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(v_test_uid, NULL, 'video_detect_balanced', 15, 'UTC', NULL, '{}'::jsonb, 25);
  PERFORM finalize_credit_reservation(v_res.reservation_id, 'success');
  SELECT credits_balance INTO v_bal FROM profiles WHERE id = v_test_uid;
  IF v_bal <> 5 THEN RAISE EXCEPTION 'Video Detector deduction failed: expected 5, got %', v_bal; END IF;

  -- 8. Citation / Hallucination: 5 credits (10 -> 5)
  UPDATE profiles SET credits_balance = 10 WHERE id = v_test_uid;
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(v_test_uid, NULL, 'citation_verify', 5, 'UTC', NULL, '{}'::jsonb, 5);
  PERFORM finalize_credit_reservation(v_res.reservation_id, 'success');
  SELECT credits_balance INTO v_bal FROM profiles WHERE id = v_test_uid;
  IF v_bal <> 5 THEN RAISE EXCEPTION 'Citation Verifier deduction failed: expected 5, got %', v_bal; END IF;

  -- 9. Insufficient Balance Check: Balance 9, Humanizer requires 10 -> BLOCKED, Balance unchanged at 9
  UPDATE profiles SET credits_balance = 9 WHERE id = v_test_uid;
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(v_test_uid, NULL, 'ai_humanizer', 10, 'UTC', NULL, '{}'::jsonb, 500);
  IF v_res.allowed = true THEN RAISE EXCEPTION 'Insufficient balance was allowed unexpectedly!'; END IF;
  SELECT credits_balance INTO v_bal FROM profiles WHERE id = v_test_uid;
  IF v_bal <> 9 THEN RAISE EXCEPTION 'Balance mutated on rejected reservation: expected 9, got %', v_bal; END IF;

  -- 10. Failed Operation & Single Refund: Balance 20 -> Reserve 10 -> Failure -> Refund -> 20; Second refund returns false
  UPDATE profiles SET credits_balance = 20 WHERE id = v_test_uid;
  SELECT * INTO v_res FROM reserve_entitlement_and_credits(v_test_uid, NULL, 'ai_humanizer', 10, 'UTC', NULL, '{}'::jsonb, 500);
  SELECT credits_balance INTO v_bal FROM profiles WHERE id = v_test_uid;
  IF v_bal <> 10 THEN RAISE EXCEPTION 'Balance after reserve expected 10, got %', v_bal; END IF;
  PERFORM finalize_credit_reservation(v_res.reservation_id, 'failed', '{}'::jsonb, 'provider_timeout');
  SELECT credits_balance INTO v_bal FROM profiles WHERE id = v_test_uid;
  IF v_bal <> 20 THEN RAISE EXCEPTION 'Balance after refund expected 20, got %', v_bal; END IF;
  -- Attempt double refund
  IF finalize_credit_reservation(v_res.reservation_id, 'failed', '{}'::jsonb, 'retry_timeout') = true THEN
    RAISE EXCEPTION 'Double refund succeeded unexpectedly!';
  END IF;

  -- Restore original user state
  UPDATE profiles SET subscription_plan = v_orig_plan, subscription_status = v_orig_status, credits_balance = v_orig_bal
  WHERE id = v_test_uid;
END $$;