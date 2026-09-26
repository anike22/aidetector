DO $$
DECLARE
  v_res_id uuid;
BEGIN
  SELECT reservation_id INTO v_res_id 
  FROM public.reserve_entitlement_and_credits(NULL::uuid, 'test_guest_3scans_sim'::text, 'ai_detector'::text, 1::integer, 'UTC'::text, NULL::text, '{}'::jsonb);
  
  PERFORM public.finalize_credit_reservation(v_res_id, 'success', '{}'::jsonb, NULL, 'UTC');
END $$; DO $$
DECLARE
  v_res_id uuid;
BEGIN
  SELECT reservation_id INTO v_res_id 
  FROM public.reserve_entitlement_and_credits(NULL::uuid, 'test_guest_3scans_sim'::text, 'ai_detector'::text, 1::integer, 'UTC'::text, NULL::text, '{}'::jsonb);
  
  PERFORM public.finalize_credit_reservation(v_res_id, 'success', '{}'::jsonb, NULL, 'UTC');
END $$; DO $$
DECLARE
  v_res_id uuid;
BEGIN
  SELECT reservation_id INTO v_res_id 
  FROM public.reserve_entitlement_and_credits(NULL::uuid, 'test_guest_3scans_sim'::text, 'ai_detector'::text, 1::integer, 'UTC'::text, NULL::text, '{}'::jsonb);
  
  PERFORM public.finalize_credit_reservation(v_res_id, 'success', '{}'::jsonb, NULL, 'UTC');
END $$;