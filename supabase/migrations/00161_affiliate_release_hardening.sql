-- Persist the tested affiliate release state from the owned Supabase repair environment.
-- Production is not modified by this migration until this branch is deliberately promoted.

-- Canonical landing-page-aware attribution path.
CREATE OR REPLACE FUNCTION public.capture_affiliate_attribution(
  p_affiliate_link_id uuid,
  p_visitor_id text,
  p_referred_user_id uuid DEFAULT NULL::uuid,
  p_landing_page text DEFAULT NULL::text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_affiliate_user uuid; v_referral_link uuid; v_window integer; v_journey uuid;
BEGIN
 IF p_visitor_id IS NULL OR length(trim(p_visitor_id))<8 OR length(p_visitor_id)>200 THEN
   RETURN jsonb_build_object('captured',false,'reason','invalid_visitor');
 END IF;
 SELECT al.affiliate_user_id INTO v_affiliate_user
 FROM public.affiliate_links al JOIN public.profiles p ON p.id=al.affiliate_user_id
 WHERE al.id=p_affiliate_link_id AND p.affiliate_status='active';
 IF v_affiliate_user IS NULL THEN RETURN jsonb_build_object('captured',false,'reason','invalid_affiliate'); END IF;
 IF p_referred_user_id IS NOT NULL AND p_referred_user_id=v_affiliate_user THEN
   RETURN jsonb_build_object('captured',false,'reason','self_referral');
 END IF;
 PERFORM public.resolve_affiliate_tracking_link(p_affiliate_link_id);
 SELECT id,attribution_window_days INTO v_referral_link,v_window
 FROM public.referral_links WHERE affiliate_link_id=p_affiliate_link_id LIMIT 1;
 SELECT rj.id INTO v_journey
 FROM public.referral_journeys rj JOIN public.referral_links rl ON rl.id=rj.referral_link_id
 WHERE rj.visitor_id=p_visitor_id
   AND rj.occurred_at>=now()-make_interval(days=>rl.attribution_window_days)
 ORDER BY rj.occurred_at ASC LIMIT 1;
 IF v_journey IS NULL THEN
   INSERT INTO public.referral_journeys(referral_link_id,visitor_id,referred_user_id,stage,metadata)
   VALUES(v_referral_link,p_visitor_id,p_referred_user_id,'visitor',
     jsonb_strip_nulls(jsonb_build_object('source','affiliate_link','affiliate_link_id',p_affiliate_link_id,'landing_page',nullif(p_landing_page,''))))
   RETURNING id INTO v_journey;
 ELSIF p_referred_user_id IS NOT NULL THEN
   UPDATE public.referral_journeys
   SET referred_user_id=coalesce(referred_user_id,p_referred_user_id),
       stage=CASE WHEN stage='visitor' THEN 'signup'::referral_journey_stage ELSE stage END
   WHERE id=v_journey AND (referred_user_id IS NULL OR referred_user_id=p_referred_user_id);
 END IF;
 RETURN jsonb_build_object('captured',true,'journey_id',v_journey);
END $function$;

CREATE OR REPLACE FUNCTION public.link_affiliate_signup(p_affiliate_link_id uuid,p_visitor_id text,p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $function$
DECLARE v_affiliate uuid;
BEGIN
 IF auth.role()<>'service_role' AND auth.uid() IS DISTINCT FROM p_user_id THEN RAISE EXCEPTION 'Not authorized'; END IF;
 SELECT affiliate_user_id INTO v_affiliate FROM public.affiliate_links WHERE id=p_affiliate_link_id;
 IF v_affiliate IS NULL OR v_affiliate=p_user_id THEN
   RETURN jsonb_build_object('linked',false,'reason',CASE WHEN v_affiliate=p_user_id THEN 'self_referral' ELSE 'invalid_affiliate' END);
 END IF;
 PERFORM public.capture_affiliate_attribution(p_affiliate_link_id,p_visitor_id,p_user_id,NULL);
 UPDATE public.referral_journeys rj SET referred_user_id=p_user_id,stage='signup'
 WHERE rj.id=(
   SELECT rj2.id FROM public.referral_journeys rj2
   JOIN public.referral_links rl2 ON rl2.id=rj2.referral_link_id
   WHERE rj2.visitor_id=p_visitor_id AND rl2.user_id=v_affiliate
     AND rj2.occurred_at>=now()-make_interval(days=>rl2.attribution_window_days)
   ORDER BY rj2.occurred_at ASC LIMIT 1
 ) AND (rj.referred_user_id IS NULL OR rj.referred_user_id=p_user_id);
 RETURN jsonb_build_object('linked',found,'affiliate_user_id',v_affiliate);
END $function$;

-- Correct referral-code generation (avoid ambiguous code = code).
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $function$
DECLARE v_code text;
BEGIN
 LOOP
   v_code:=upper(substring(md5(random()::text||clock_timestamp()::text) from 1 for 8));
   IF NOT EXISTS (SELECT 1 FROM public.referral_links rl WHERE rl.code=v_code) THEN RETURN v_code; END IF;
 END LOOP;
END $function$;

-- Product analytics: count unique journeys/users and attach commission money once to first touch.
CREATE OR REPLACE FUNCTION public.get_affiliate_product_analytics()
RETURNS TABLE(destination text,clicks bigint,signups bigint,conversions bigint,revenue numeric,commission numeric)
LANGUAGE sql SECURITY DEFINER SET search_path='public' AS $function$
WITH owned AS (
 SELECT al.id affiliate_link_id FROM public.affiliate_links al WHERE al.affiliate_user_id=auth.uid()
), journeys AS (
 SELECT rj.id,rj.referred_user_id,rj.stage,rj.occurred_at,
        coalesce(nullif(rj.metadata->>'landing_page',''),'Unknown') destination,rj.referral_link_id
 FROM public.referral_journeys rj JOIN public.referral_links rl ON rl.id=rj.referral_link_id
 JOIN owned o ON o.affiliate_link_id=rl.affiliate_link_id
), roll AS (
 SELECT destination,count(DISTINCT id)::bigint clicks,
 count(DISTINCT referred_user_id) FILTER(WHERE referred_user_id IS NOT NULL)::bigint signups,
 count(DISTINCT referred_user_id) FILTER(WHERE stage IN('subscription','renewal'))::bigint conversions
 FROM journeys GROUP BY destination
), attributed_users AS (
 SELECT DISTINCT ON(referred_user_id) referred_user_id,referral_link_id,destination
 FROM journeys WHERE referred_user_id IS NOT NULL
 ORDER BY referred_user_id,occurred_at ASC,id ASC
), money AS (
 SELECT au.destination,
 coalesce(sum(c.gross_amount) FILTER(WHERE c.reversed_at IS NULL),0)::numeric revenue,
 coalesce(sum(c.amount) FILTER(WHERE c.reversed_at IS NULL),0)::numeric commission
 FROM attributed_users au JOIN public.commissions c
 ON c.referral_link_id=au.referral_link_id AND c.referred_user_id=au.referred_user_id
 GROUP BY au.destination
)
SELECT r.destination,r.clicks,r.signups,r.conversions,coalesce(m.revenue,0),coalesce(m.commission,0)
FROM roll r LEFT JOIN money m USING(destination) ORDER BY r.clicks DESC,r.destination
$function$;

-- Financial RPCs remain service/admin gated; preserve explicit grants.
REVOKE ALL ON FUNCTION public.capture_affiliate_attribution(uuid,text,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.capture_affiliate_attribution(uuid,text,uuid,text) TO anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.link_affiliate_signup(uuid,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_affiliate_signup(uuid,text,uuid) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.get_affiliate_product_analytics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_affiliate_product_analytics() TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.create_verified_affiliate_commission(text,text,uuid,text,bigint,text,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_verified_affiliate_commission(text,text,uuid,text,bigint,text,timestamptz) TO service_role;
REVOKE ALL ON FUNCTION public.refresh_affiliate_commissions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_affiliate_commissions() TO service_role;
REVOKE ALL ON FUNCTION public.reverse_affiliate_commission(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reverse_affiliate_commission(text,text,text) TO service_role;

-- Defense in depth: status mutation remains admin/service-role checked inside the function.
REVOKE ALL ON FUNCTION public.set_affiliate_payout_status(uuid,payout_status,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_affiliate_payout_status(uuid,payout_status,text) TO authenticated,service_role;
