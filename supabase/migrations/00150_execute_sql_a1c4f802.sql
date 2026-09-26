DO $$
DECLARE
  v_test_uid uuid := '11111111-2222-3333-4444-555555555555'::uuid;
  v_res record;
BEGIN
  -- Insert or update a test profile with 100 credits and pro plan
  INSERT INTO profiles (id, email, subscription_plan, subscription_status, credits_balance)
  VALUES (v_test_uid, 'test_blogger_billing@example.com', 'pro', 'active', 100)
  ON CONFLICT (id) DO UPDATE SET subscription_plan = 'pro', subscription_status = 'active', credits_balance = 100;

  -- Test reserve with p_credits_cost = 30 and words = 1
  SELECT * INTO v_res FROM public.reserve_entitlement_and_credits(
    p_user_id => v_test_uid,
    p_feature_slug => 'ai_checker_for_bloggers',
    p_credits_cost => 30,
    p_unit_quantity => 1
  );

  RAISE NOTICE 'Reservation result: allowed=%, reserved=%, balance=%', v_res.allowed, v_res.credits_reserved, v_res.credits_balance;
  IF v_res.credits_reserved <> 30 THEN
    RAISE EXCEPTION 'Expected 30 credits reserved, got %', v_res.credits_reserved;
  END IF;

  -- Clean up
  DELETE FROM credit_reservations WHERE user_id = v_test_uid;
  DELETE FROM profiles WHERE id = v_test_uid;
END $$;