DO $$
DECLARE
  v_uid uuid := '206372b2-7075-4838-8777-a11ef50cf29b'::uuid;
  v_res record;
  v_orig_plan text;
  v_orig_status text;
  v_orig_credits numeric;
BEGIN
  SET LOCAL ROLE service_role;

  SELECT subscription_plan, subscription_status, credits_balance
  INTO v_orig_plan, v_orig_status, v_orig_credits
  FROM profiles WHERE id = v_uid;

  UPDATE profiles SET subscription_plan = 'pro', subscription_status = 'active', credits_balance = 100 WHERE id = v_uid;

  SELECT * INTO v_res FROM public.reserve_entitlement_and_credits(
    p_user_id => v_uid,
    p_feature_slug => 'ai_checker_for_bloggers',
    p_credits_cost => 30,
    p_unit_quantity => 1
  );

  IF v_res.allowed <> true THEN
    RAISE EXCEPTION 'Reservation should be allowed, got: %', v_res.reason;
  END IF;

  IF v_res.credits_reserved <> 30 THEN
    RAISE EXCEPTION 'Expected 30 credits reserved, got: %', v_res.credits_reserved;
  END IF;

  IF v_res.credits_balance <> 70 THEN
    RAISE EXCEPTION 'Expected 70 credits balance, got: %', v_res.credits_balance;
  END IF;

  -- Test settle
  PERFORM settle_client_reservation(v_res.reservation_id, 'success', '{}'::jsonb);

  -- Clean up reservation and restore original profile
  DELETE FROM usage_ledger WHERE reservation_id = v_res.reservation_id;
  DELETE FROM credit_reservations WHERE id = v_res.reservation_id;
  UPDATE profiles
  SET subscription_plan = v_orig_plan, subscription_status = v_orig_status, credits_balance = v_orig_credits
  WHERE id = v_uid;
END $$;