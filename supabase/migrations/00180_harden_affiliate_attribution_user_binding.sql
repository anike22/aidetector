-- Harden affiliate attribution while preserving anonymous click capture.
-- Anonymous callers may capture a visitor click, but may not bind that click
-- to an arbitrary registered user. User binding is permitted only for the
-- authenticated user or trusted service role.

CREATE OR REPLACE FUNCTION public.capture_affiliate_attribution(
  p_affiliate_link_id uuid, p_visitor_id text, p_referred_user_id uuid DEFAULT NULL::uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','auth' AS $function$
DECLARE v_affiliate_user uuid; v_referral_link uuid; v_window integer; v_journey uuid;
BEGIN
  IF p_visitor_id IS NULL OR length(trim(p_visitor_id)) < 8 OR length(p_visitor_id) > 200 THEN RETURN jsonb_build_object('captured',false,'reason','invalid_visitor'); END IF;
  IF p_referred_user_id IS NOT NULL AND auth.role()<>'service_role' AND auth.uid() IS DISTINCT FROM p_referred_user_id THEN RAISE EXCEPTION 'Not authorized to bind referral to this user'; END IF;
  SELECT al.affiliate_user_id INTO v_affiliate_user FROM public.affiliate_links al JOIN public.profiles p ON p.id=al.affiliate_user_id WHERE al.id=p_affiliate_link_id AND p.affiliate_status='active';
  IF v_affiliate_user IS NULL THEN RETURN jsonb_build_object('captured',false,'reason','invalid_affiliate'); END IF;
  IF p_referred_user_id IS NOT NULL AND p_referred_user_id=v_affiliate_user THEN RETURN jsonb_build_object('captured',false,'reason','self_referral'); END IF;
  PERFORM public.resolve_affiliate_tracking_link(p_affiliate_link_id);
  SELECT id,attribution_window_days INTO v_referral_link,v_window FROM public.referral_links WHERE affiliate_link_id=p_affiliate_link_id LIMIT 1;
  SELECT rj.id INTO v_journey FROM public.referral_journeys rj JOIN public.referral_links rl ON rl.id=rj.referral_link_id WHERE rj.visitor_id=p_visitor_id AND rj.occurred_at>=now()-make_interval(days=>rl.attribution_window_days) ORDER BY rj.occurred_at ASC LIMIT 1;
  IF v_journey IS NULL THEN
    INSERT INTO public.referral_journeys(referral_link_id,visitor_id,referred_user_id,stage,metadata) VALUES(v_referral_link,p_visitor_id,p_referred_user_id,'visitor',jsonb_build_object('source','affiliate_link','affiliate_link_id',p_affiliate_link_id)) RETURNING id INTO v_journey;
  ELSIF p_referred_user_id IS NOT NULL THEN
    UPDATE public.referral_journeys SET referred_user_id=COALESCE(referred_user_id,p_referred_user_id),stage=CASE WHEN stage='visitor' THEN 'signup'::referral_journey_stage ELSE stage END WHERE id=v_journey AND (referred_user_id IS NULL OR referred_user_id=p_referred_user_id);
  END IF;
  RETURN jsonb_build_object('captured',true,'journey_id',v_journey);
END $function$;

CREATE OR REPLACE FUNCTION public.capture_affiliate_attribution(
  p_affiliate_link_id uuid, p_visitor_id text, p_referred_user_id uuid DEFAULT NULL::uuid, p_landing_page text DEFAULT NULL::text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','auth' AS $function$
DECLARE v_affiliate_user uuid; v_referral_link uuid; v_window integer; v_journey uuid;
BEGIN
  IF p_visitor_id IS NULL OR length(trim(p_visitor_id))<8 OR length(p_visitor_id)>200 THEN RETURN jsonb_build_object('captured',false,'reason','invalid_visitor'); END IF;
  IF p_referred_user_id IS NOT NULL AND auth.role()<>'service_role' AND auth.uid() IS DISTINCT FROM p_referred_user_id THEN RAISE EXCEPTION 'Not authorized to bind referral to this user'; END IF;
  SELECT al.affiliate_user_id INTO v_affiliate_user FROM public.affiliate_links al JOIN public.profiles p ON p.id=al.affiliate_user_id WHERE al.id=p_affiliate_link_id AND p.affiliate_status='active';
  IF v_affiliate_user IS NULL THEN RETURN jsonb_build_object('captured',false,'reason','invalid_affiliate'); END IF;
  IF p_referred_user_id IS NOT NULL AND p_referred_user_id=v_affiliate_user THEN RETURN jsonb_build_object('captured',false,'reason','self_referral'); END IF;
  PERFORM public.resolve_affiliate_tracking_link(p_affiliate_link_id);
  SELECT id,attribution_window_days INTO v_referral_link,v_window FROM public.referral_links WHERE affiliate_link_id=p_affiliate_link_id LIMIT 1;
  SELECT rj.id INTO v_journey FROM public.referral_journeys rj JOIN public.referral_links rl ON rl.id=rj.referral_link_id WHERE rj.visitor_id=p_visitor_id AND rj.occurred_at>=now()-make_interval(days=>rl.attribution_window_days) ORDER BY rj.occurred_at ASC LIMIT 1;
  IF v_journey IS NULL THEN
    INSERT INTO public.referral_journeys(referral_link_id,visitor_id,referred_user_id,stage,metadata) VALUES(v_referral_link,p_visitor_id,p_referred_user_id,'visitor',jsonb_strip_nulls(jsonb_build_object('source','affiliate_link','affiliate_link_id',p_affiliate_link_id,'landing_page',NULLIF(p_landing_page,'')))) RETURNING id INTO v_journey;
  ELSIF p_referred_user_id IS NOT NULL THEN
    UPDATE public.referral_journeys SET referred_user_id=COALESCE(referred_user_id,p_referred_user_id),stage=CASE WHEN stage='visitor' THEN 'signup'::referral_journey_stage ELSE stage END WHERE id=v_journey AND (referred_user_id IS NULL OR referred_user_id=p_referred_user_id);
  END IF;
  RETURN jsonb_build_object('captured',true,'journey_id',v_journey);
END $function$;
