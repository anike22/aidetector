CREATE SCHEMA IF NOT EXISTS growth_private;
CREATE TABLE growth_private.offers(user_id uuid PRIMARY KEY REFERENCES public.profiles(id), redeemed integer NOT NULL DEFAULT 0 CHECK(redeemed BETWEEN 0 AND 3));
CREATE TABLE growth_private.quotes(reference text PRIMARY KEY,user_id uuid NOT NULL REFERENCES public.profiles(id),plan text NOT NULL,currency text NOT NULL,amount_minor bigint NOT NULL,discounted boolean NOT NULL,expires_at timestamptz NOT NULL DEFAULT now()+interval '24 hours',access_url text,consumed boolean NOT NULL DEFAULT false);
CREATE TABLE growth_private.campaign(id boolean PRIMARY KEY DEFAULT true CHECK(id),redeem_until timestamptz NOT NULL DEFAULT now()+interval '30 days');
INSERT INTO growth_private.campaign(id) VALUES(true);
ALTER TABLE growth_private.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_private.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_private.campaign ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA growth_private FROM PUBLIC,anon,authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA growth_private TO service_role;
CREATE FUNCTION public.growth_checkout_quote(p_user_id uuid,p_plan text,p_interval text,p_code text DEFAULT '') RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE price record; o record; q record; discounted boolean:=false; ref text;
BEGIN
 IF current_setting('role',true)<>'service_role' THEN RAISE EXCEPTION 'Service only'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=p_user_id FOR UPDATE;
 SELECT * INTO price FROM public.plan_prices WHERE plan=p_plan AND billing_interval=p_interval AND is_active;
 IF price IS NULL THEN RAISE EXCEPTION 'No active plan price'; END IF;
 SELECT * INTO o FROM growth_private.offers WHERE user_id=p_user_id;
 IF upper(p_code)='GROWTH10' AND o IS NULL THEN
  IF p_interval<>'month' THEN RAISE EXCEPTION 'GROWTH10 is for monthly plans only'; END IF;
  IF now()>(SELECT redeem_until FROM growth_private.campaign WHERE id=true) THEN RAISE EXCEPTION 'Introductory offer has expired'; END IF;
  IF EXISTS(SELECT 1 FROM public.billing_payments WHERE user_id=p_user_id) OR EXISTS(SELECT 1 FROM public.profiles WHERE id=p_user_id AND subscription_plan NOT IN ('free','guest') AND subscription_plan IS NOT NULL) THEN RAISE EXCEPTION 'Offer is for first-time paying customers'; END IF;
  INSERT INTO growth_private.offers(user_id) VALUES(p_user_id) RETURNING * INTO o;
 ELSIF p_code<>'' AND upper(p_code)<>'GROWTH10' THEN RAISE EXCEPTION 'Unknown offer code'; END IF;
 discounted:=p_interval='month' AND o IS NOT NULL AND o.redeemed<3;
 IF NOT discounted THEN RETURN jsonb_build_object('amount_minor',price.amount_cents,'discounted',false); END IF;
 SELECT * INTO q FROM growth_private.quotes WHERE user_id=p_user_id AND NOT consumed AND expires_at>now() ORDER BY expires_at DESC LIMIT 1;
 IF q.reference IS NOT NULL THEN
  IF q.plan<>p_plan THEN RAISE EXCEPTION 'Finish your open discounted checkout or wait for it to expire before changing plans'; END IF;
  RETURN to_jsonb(q);
 END IF;
 ref:='growth-'||gen_random_uuid()::text;
 INSERT INTO growth_private.quotes(reference,user_id,plan,currency,amount_minor,discounted) VALUES(ref,p_user_id,p_plan,price.currency,round(price.amount_cents*0.9)::bigint,true) RETURNING * INTO q;
 RETURN to_jsonb(q);
END $$;
REVOKE ALL ON FUNCTION public.growth_checkout_quote(uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.growth_checkout_quote(uuid,text,text,text) TO service_role;
CREATE FUNCTION public.growth_save_checkout(p_reference text,p_url text) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 IF current_setting('role',true)<>'service_role' OR p_url !~ '^https://checkout[.]paystack[.]com/' THEN RAISE EXCEPTION 'Invalid checkout'; END IF;
 UPDATE growth_private.quotes SET access_url=p_url WHERE reference=p_reference AND NOT consumed;
END $$;
REVOKE ALL ON FUNCTION public.growth_save_checkout(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.growth_save_checkout(text,text) TO service_role;

