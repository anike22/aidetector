CREATE OR REPLACE FUNCTION public.growth_checkout_quote(p_user_id uuid,p_plan text,p_interval text,p_code text DEFAULT '') RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
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

DO $$ DECLARE d text; BEGIN SELECT pg_get_functiondef('public.apply_verified_subscription_payment(text,text,uuid,text,text,bigint,text,timestamptz,uuid)'::regprocedure) INTO d; d:=replace(replace(d,'growth_quote IS NOT NULL','growth_quote.reference IS NOT NULL'),'growth_quote IS NULL','growth_quote.reference IS NULL'); EXECUTE d; END $$;
