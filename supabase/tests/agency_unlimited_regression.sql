-- Transactional verification against deployed functions. All test rows roll back.
BEGIN;
DO $$
DECLARE owner_id uuid:=gen_random_uuid(); member_id uuid:=gen_random_uuid(); r record; s record; g jsonb; slug text;
BEGIN
 INSERT INTO auth.users(id,email,raw_user_meta_data,raw_app_meta_data)
 VALUES(owner_id,'agency-owner-'||owner_id||'@example.invalid','{}','{}'),
 (member_id,'agency-member-'||member_id||'@example.invalid','{}','{}');
 INSERT INTO profiles(id,email,subscription_plan,subscription_status,credits_balance)
 VALUES(owner_id,'agency-owner-'||owner_id||'@example.invalid','free','active',0),
 (member_id,'agency-member-'||member_id||'@example.invalid','free','active',0)
 ON CONFLICT(id) DO NOTHING;
 PERFORM set_config('role','service_role',true);
 g:=apply_verified_subscription_payment('paystack','agency-test-'||owner_id,owner_id,'agency_unlimited','year',250000,'usd',now());
 IF (g->>'granted')::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION 'Agency grant failed'; END IF;
 PERFORM allocate_team_member_credits(owner_id,'agency-member-'||member_id||'@example.invalid',1);
 FOREACH slug IN ARRAY ARRAY['ai_checker_for_bloggers','seo_assistant','ai_detector','ai_humanizer','plagiarism_checker','ai_image_detector','ai_video_detector','citation_verifier','hallucination_detector'] LOOP
  SELECT * INTO r FROM reserve_entitlement_and_credits(p_user_id:=member_id,p_feature_slug:=slug,p_unit_quantity:=1000,p_idempotency_key:=slug||owner_id);
  IF NOT r.allowed OR r.credits_reserved<>0 THEN RAISE EXCEPTION 'Agency member denied or charged: %',slug; END IF;
  PERFORM finalize_credit_reservation(r.reservation_id,'success');
 END LOOP;
 SELECT * INTO s FROM get_user_entitlement_summary(p_user_id:=member_id);
 IF s.plan<>'agency_unlimited' OR NOT s.is_paid_active OR s.warning_level<>'normal' THEN RAISE EXCEPTION 'Wrong member summary'; END IF;
 SELECT * INTO r FROM reserve_entitlement_and_credits(p_user_id:=owner_id,p_feature_slug:='ai_detector',p_unit_quantity:=100,p_metadata:='{"is_api_key":true}');
 IF r.allowed THEN RAISE EXCEPTION 'API must be excluded'; END IF;
 UPDATE profiles SET plan_end_date=now()-interval '1 second' WHERE id=owner_id;
 SELECT * INTO r FROM reserve_entitlement_and_credits(p_user_id:=member_id,p_feature_slug:='ai_checker_for_bloggers',p_unit_quantity:=1000);
 IF r.allowed THEN RAISE EXCEPTION 'Expired agency member still allowed'; END IF;
END $$;
ROLLBACK;
