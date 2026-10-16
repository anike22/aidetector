DO $migration$ DECLARE d text; BEGIN
 SELECT pg_get_functiondef('public.apply_verified_subscription_payment(text,text,uuid,text,text,bigint,text,timestamptz,uuid)'::regprocedure) INTO d;
 IF position('price.amount_cents<>p_amount_minor' IN d)=0 THEN RAISE EXCEPTION 'Unexpected payment verifier version'; END IF;
 d:=replace(d,'old_grant boolean;','old_grant boolean; growth_quote record;');
 d:=replace(d,'IF price IS NULL OR monthly IS NULL OR price.amount_cents<>p_amount_minor THEN',
 $replace$SELECT * INTO growth_quote FROM growth_private.quotes WHERE reference=p_payment_reference FOR UPDATE;
 IF growth_quote.reference IS NOT NULL THEN
  IF p_provider<>'paystack' OR p_interval<>'month' OR growth_quote.user_id<>p_user_id OR growth_quote.plan<>p_plan OR growth_quote.currency<>lower(p_currency) OR growth_quote.amount_minor<>p_amount_minor OR growth_quote.consumed OR p_paid_at>growth_quote.expires_at OR (SELECT redeemed FROM growth_private.offers WHERE user_id=p_user_id)>=3 THEN RAISE EXCEPTION 'Discounted payment does not match authorized checkout'; END IF;
 END IF;
 IF price IS NULL OR monthly IS NULL OR (growth_quote.reference IS NULL AND price.amount_cents<>p_amount_minor) THEN$replace$);
 d:=replace(d,'IF NOT old_grant THEN', $replace$IF growth_quote.reference IS NOT NULL THEN
 UPDATE growth_private.quotes SET consumed=true WHERE reference=p_payment_reference;
 UPDATE growth_private.offers SET redeemed=redeemed+1 WHERE user_id=p_user_id;
 END IF;
 IF NOT old_grant THEN$replace$);
 EXECUTE d;
END $migration$;
