DO $$
DECLARE v_id uuid;
BEGIN
  -- 1
  SELECT reservation_id INTO v_id FROM public.reserve_entitlement_and_credits(NULL::uuid, 'test_guest_e2e_flow', 'ai_detector', 1, 'UTC', NULL, '{}'::jsonb);
  PERFORM public.finalize_credit_reservation(v_id, 'success', '{}'::jsonb, NULL, 'UTC');
  -- 2
  SELECT reservation_id INTO v_id FROM public.reserve_entitlement_and_credits(NULL::uuid, 'test_guest_e2e_flow', 'ai_detector', 1, 'UTC', NULL, '{}'::jsonb);
  PERFORM public.finalize_credit_reservation(v_id, 'success', '{}'::jsonb, NULL, 'UTC');
  -- 3
  SELECT reservation_id INTO v_id FROM public.reserve_entitlement_and_credits(NULL::uuid, 'test_guest_e2e_flow', 'ai_detector', 1, 'UTC', NULL, '{}'::jsonb);
  PERFORM public.finalize_credit_reservation(v_id, 'success', '{}'::jsonb, NULL, 'UTC');
END $$; DO $$
DECLARE v_id uuid;
BEGIN
  SELECT reservation_id INTO v_id FROM public.reserve_entitlement_and_credits('82b13fcc-d93b-4fa4-a28d-d4fd445986ab', NULL, 'ai_detector', 1, 'UTC', NULL, '{}'::jsonb);
  PERFORM public.finalize_credit_reservation(v_id, 'success', '{}'::jsonb, NULL, 'UTC');
END $$; DO $$
DECLARE v_id uuid;
BEGIN
  SELECT reservation_id INTO v_id FROM public.reserve_entitlement_and_credits('82b13fcc-d93b-4fa4-a28d-d4fd445986ab', NULL, 'ai_detector', 1, 'UTC', NULL, '{}'::jsonb);
  PERFORM public.finalize_credit_reservation(v_id, 'success', '{}'::jsonb, NULL, 'UTC');
END $$;