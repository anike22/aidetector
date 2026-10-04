BEGIN;

-- Secure, canonical affiliate attribution. Affiliate dashboard links may use
-- affiliate_links.id; the canonical referral journey is stored in referral_links.
ALTER TABLE public.referral_links
  ADD COLUMN IF NOT EXISTS affiliate_link_id uuid REFERENCES public.affiliate_links(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_links_affiliate_link_id
  ON public.referral_links(affiliate_link_id)
  WHERE affiliate_link_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_referral_journeys_visitor
  ON public.referral_journeys(visitor_id, occurred_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_commissions_transaction_unique
  ON public.commissions(transaction_id)
  WHERE transaction_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.resolve_affiliate_tracking_link(p_affiliate_link_id uuid)
RETURNS TABLE(referral_code text, affiliate_user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_user uuid;
  v_code text;
BEGIN
  SELECT al.affiliate_user_id INTO v_affiliate_user
  FROM public.affiliate_links al
  JOIN public.profiles p ON p.id = al.affiliate_user_id
  WHERE al.id = p_affiliate_link_id AND p.affiliate_status = 'active';

  IF v_affiliate_user IS NULL THEN RETURN; END IF;

  SELECT rl.code INTO v_code
  FROM public.referral_links rl
  WHERE rl.affiliate_link_id = p_affiliate_link_id
  LIMIT 1;

  IF v_code IS NULL THEN
    LOOP
      v_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.referral_links WHERE code = v_code);
    END LOOP;
    INSERT INTO public.referral_links(user_id, code, link_type, attribution_window_days, affiliate_link_id)
    VALUES (v_affiliate_user, v_code, 'direct', 30, p_affiliate_link_id)
    ON CONFLICT (affiliate_link_id) WHERE affiliate_link_id IS NOT NULL
    DO UPDATE SET user_id = EXCLUDED.user_id
    RETURNING code INTO v_code;
  END IF;

  RETURN QUERY SELECT v_code, v_affiliate_user;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_affiliate_tracking_link(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.capture_affiliate_attribution(
  p_affiliate_link_id uuid,
  p_visitor_id text,
  p_referred_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_user uuid;
  v_referral_link uuid;
  v_window integer;
  v_journey uuid;
BEGIN
  IF p_visitor_id IS NULL OR length(trim(p_visitor_id)) < 8 OR length(p_visitor_id) > 200 THEN
    RETURN jsonb_build_object('captured', false, 'reason', 'invalid_visitor');
  END IF;

  SELECT al.affiliate_user_id INTO v_affiliate_user
  FROM public.affiliate_links al
  JOIN public.profiles p ON p.id = al.affiliate_user_id
  WHERE al.id = p_affiliate_link_id AND p.affiliate_status = 'active';

  IF v_affiliate_user IS NULL THEN
    RETURN jsonb_build_object('captured', false, 'reason', 'invalid_affiliate');
  END IF;
  IF p_referred_user_id IS NOT NULL AND p_referred_user_id = v_affiliate_user THEN
    RETURN jsonb_build_object('captured', false, 'reason', 'self_referral');
  END IF;

  PERFORM public.resolve_affiliate_tracking_link(p_affiliate_link_id);
  SELECT id, attribution_window_days INTO v_referral_link, v_window
  FROM public.referral_links WHERE affiliate_link_id = p_affiliate_link_id LIMIT 1;

  SELECT rj.id INTO v_journey
  FROM public.referral_journeys rj
  JOIN public.referral_links rl ON rl.id = rj.referral_link_id
  WHERE rj.visitor_id = p_visitor_id
    AND rj.occurred_at >= now() - make_interval(days => rl.attribution_window_days)
  ORDER BY rj.occurred_at ASC LIMIT 1;

  IF v_journey IS NULL THEN
    INSERT INTO public.referral_journeys(referral_link_id, visitor_id, referred_user_id, stage, metadata)
    VALUES (v_referral_link, p_visitor_id, p_referred_user_id, 'visitor',
      jsonb_build_object('source', 'affiliate_link', 'affiliate_link_id', p_affiliate_link_id))
    RETURNING id INTO v_journey;
  ELSIF p_referred_user_id IS NOT NULL THEN
    UPDATE public.referral_journeys
       SET referred_user_id = COALESCE(referred_user_id, p_referred_user_id),
           stage = CASE WHEN stage = 'visitor' THEN 'signup'::referral_journey_stage ELSE stage END
     WHERE id = v_journey
       AND (referred_user_id IS NULL OR referred_user_id = p_referred_user_id);
  END IF;

  RETURN jsonb_build_object('captured', true, 'journey_id', v_journey);
END;
$$;

GRANT EXECUTE ON FUNCTION public.capture_affiliate_attribution(uuid,text,uuid) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS referral_journeys_insert_public ON public.referral_journeys;
DROP POLICY IF EXISTS referral_journeys_insert_service ON public.referral_journeys;

CREATE OR REPLACE FUNCTION public.link_affiliate_signup(
  p_affiliate_link_id uuid,
  p_visitor_id text,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_affiliate uuid;
BEGIN
  IF auth.role() <> 'service_role' AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT affiliate_user_id INTO v_affiliate FROM public.affiliate_links WHERE id = p_affiliate_link_id;
  IF v_affiliate IS NULL OR v_affiliate = p_user_id THEN
    RETURN jsonb_build_object('linked', false, 'reason',
      CASE WHEN v_affiliate = p_user_id THEN 'self_referral' ELSE 'invalid_affiliate' END);
  END IF;

  PERFORM public.capture_affiliate_attribution(p_affiliate_link_id, p_visitor_id, p_user_id);
  UPDATE public.referral_journeys rj
     SET referred_user_id = p_user_id, stage = 'signup'
   WHERE rj.id = (
     SELECT rj2.id FROM public.referral_journeys rj2
     JOIN public.referral_links rl2 ON rl2.id = rj2.referral_link_id
     WHERE rj2.visitor_id = p_visitor_id AND rl2.user_id = v_affiliate
       AND rj2.occurred_at >= now() - make_interval(days => rl2.attribution_window_days)
     ORDER BY rj2.occurred_at ASC LIMIT 1
   )
   AND (rj.referred_user_id IS NULL OR rj.referred_user_id = p_user_id);

  RETURN jsonb_build_object('linked', FOUND, 'affiliate_user_id', v_affiliate);
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_affiliate_signup(uuid,text,uuid) TO authenticated, service_role;

COMMIT;
