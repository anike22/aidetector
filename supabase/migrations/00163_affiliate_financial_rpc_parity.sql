-- Complete production-safe affiliate financial/admin RPC parity with the owned repair database.

CREATE OR REPLACE FUNCTION public.create_verified_affiliate_commission(
 p_provider text,p_payment_reference text,p_referred_user_id uuid,p_plan text,
 p_amount_minor bigint,p_currency text,p_paid_at timestamptz DEFAULT now()
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $function$
DECLARE v_journey public.referral_journeys%rowtype; v_affiliate uuid; v_rate numeric;
v_hold integer; v_gross numeric; v_amount numeric; v_id uuid;
BEGIN
 IF auth.role()<>'service_role' THEN RAISE EXCEPTION 'service role required'; END IF;
 IF lower(coalesce(p_provider,''))<>'paystack' THEN RETURN jsonb_build_object('created',false,'reason','unsupported_provider'); END IF;
 IF p_payment_reference IS NULL OR p_referred_user_id IS NULL OR p_amount_minor IS NULL OR p_amount_minor<=0 THEN
   RETURN jsonb_build_object('created',false,'reason','invalid_payment');
 END IF;
 SELECT rj.* INTO v_journey
 FROM public.referral_journeys rj JOIN public.referral_links rl ON rl.id=rj.referral_link_id
 WHERE rj.referred_user_id=p_referred_user_id
   AND rj.occurred_at<=coalesce(p_paid_at,now())
   AND rj.occurred_at>=coalesce(p_paid_at,now())-make_interval(days=>rl.attribution_window_days)
 ORDER BY rj.occurred_at ASC LIMIT 1;
 IF v_journey.id IS NULL THEN RETURN jsonb_build_object('created',false,'reason','no_attribution'); END IF;
 SELECT user_id INTO v_affiliate FROM public.referral_links WHERE id=v_journey.referral_link_id;
 IF v_affiliate IS NULL OR v_affiliate=p_referred_user_id THEN
   RETURN jsonb_build_object('created',false,'reason','invalid_affiliate');
 END IF;
 SELECT commission_rate,hold_days INTO v_rate,v_hold FROM public.affiliate_program_config WHERE id=true;
 v_gross:=round((p_amount_minor::numeric/100),2);
 v_amount:=round(v_gross*(v_rate/100),2);
 INSERT INTO public.commissions(
   affiliate_user_id,referred_user_id,referral_link_id,commission_type,amount,status,
   eligible_plan,payment_reference,gross_amount,currency,commission_rate,eligible_at
 ) VALUES(
   v_affiliate,p_referred_user_id,v_journey.referral_link_id,'Percentage',v_amount,'Pending',
   p_plan,p_payment_reference,v_gross,upper(p_currency),v_rate,
   coalesce(p_paid_at,now())+make_interval(days=>v_hold)
 )
 ON CONFLICT(payment_reference) WHERE payment_reference IS NOT NULL DO NOTHING RETURNING id INTO v_id;
 IF v_id IS NULL THEN
   SELECT id INTO v_id FROM public.commissions WHERE payment_reference=p_payment_reference;
   RETURN jsonb_build_object('created',false,'reason','duplicate','commission_id',v_id);
 END IF;
 UPDATE public.referral_journeys SET stage='subscription' WHERE id=v_journey.id AND stage<>'renewal';
 RETURN jsonb_build_object('created',true,'commission_id',v_id,'amount',v_amount,'currency',upper(p_currency),'rate',v_rate);
END $function$;

CREATE OR REPLACE FUNCTION public.admin_set_affiliate_application_status(
 p_application_id uuid,p_status affiliate_application_status,p_tier affiliate_tier DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $function$
DECLARE v_role text; v_app public.affiliate_applications%rowtype; v_profile_status text;
BEGIN
 SELECT role::text INTO v_role FROM public.profiles WHERE id=auth.uid();
 IF auth.role()<>'service_role' AND coalesce(v_role,'')<>'admin' THEN RAISE EXCEPTION 'Admin access required'; END IF;
 SELECT * INTO v_app FROM public.affiliate_applications WHERE id=p_application_id FOR UPDATE;
 IF v_app.id IS NULL THEN RAISE EXCEPTION 'Application not found'; END IF;
 UPDATE public.affiliate_applications SET status=p_status,tier=coalesce(p_tier,tier),
   reviewed_at=CASE WHEN p_status IN ('Approved','Rejected','Suspended','Terminated') THEN now() ELSE reviewed_at END,
   reviewed_by=CASE WHEN auth.uid() IS NOT NULL THEN auth.uid() ELSE reviewed_by END,updated_at=now()
 WHERE id=p_application_id RETURNING * INTO v_app;
 v_profile_status:=CASE p_status WHEN 'Approved' THEN 'active' WHEN 'Rejected' THEN 'none'
   WHEN 'Suspended' THEN 'suspended' WHEN 'Terminated' THEN 'terminated' ELSE NULL END;
 IF v_profile_status IS NOT NULL THEN
   UPDATE public.profiles SET affiliate_status=v_profile_status,affiliate_tier=v_app.tier WHERE id=v_app.user_id;
 END IF;
 RETURN jsonb_build_object('updated',true,'application_id',v_app.id,'user_id',v_app.user_id,'status',v_app.status,'tier',v_app.tier);
END $function$;

CREATE OR REPLACE FUNCTION public.admin_set_commission_status(p_commission_id uuid,p_status commission_status)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $function$
DECLARE v_role text; v public.commissions%rowtype;
BEGIN
 SELECT role::text INTO v_role FROM public.profiles WHERE id=auth.uid();
 IF auth.role()<>'service_role' AND coalesce(v_role,'')<>'admin' THEN RAISE EXCEPTION 'Admin access required'; END IF;
 SELECT * INTO v FROM public.commissions WHERE id=p_commission_id FOR UPDATE;
 IF v.id IS NULL THEN RAISE EXCEPTION 'Commission not found'; END IF;
 IF p_status='Approved' AND v.status='Pending' THEN
   UPDATE public.commissions SET status='Approved',approved_at=coalesce(approved_at,now()) WHERE id=v.id;
 ELSIF p_status='Expired' AND v.status IN ('Pending','Approved') AND v.payout_id IS NULL THEN
   UPDATE public.commissions SET status='Expired' WHERE id=v.id;
 ELSE
   RAISE EXCEPTION 'Invalid commission status transition from % to %',v.status,p_status;
 END IF;
 RETURN jsonb_build_object('updated',true,'commission_id',v.id,'status',p_status);
END $function$;

REVOKE ALL ON FUNCTION public.create_verified_affiliate_commission(text,text,uuid,text,bigint,text,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_verified_affiliate_commission(text,text,uuid,text,bigint,text,timestamptz) TO service_role;

REVOKE ALL ON FUNCTION public.admin_set_affiliate_application_status(uuid,affiliate_application_status,affiliate_tier) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_affiliate_application_status(uuid,affiliate_application_status,affiliate_tier) TO authenticated,service_role;

REVOKE ALL ON FUNCTION public.admin_set_commission_status(uuid,commission_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_commission_status(uuid,commission_status) TO authenticated,service_role;
