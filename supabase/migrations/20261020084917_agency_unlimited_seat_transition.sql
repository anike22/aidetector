-- Upgrading an existing six-user Business team must respect five total Agency seats.
DO $migration$
DECLARE definition text; marker text := '   UPDATE team_credit_allocations SET consumed_credits=0,updated_at=now() WHERE owner_id=p_user_id;';
BEGIN
 SELECT pg_get_functiondef('public.apply_verified_subscription_payment(text,text,uuid,text,text,bigint,text,timestamptz,uuid)'::regprocedure) INTO definition;
 IF position(marker in definition)=0 THEN RAISE EXCEPTION 'Verified payment function changed; review seat transition'; END IF;
 definition:=replace(definition,marker,marker||$patch$
   IF p_plan='agency_unlimited' THEN
     UPDATE team_credit_allocations SET status='suspended',updated_at=now()
     WHERE id IN (SELECT id FROM team_credit_allocations
       WHERE owner_id=p_user_id AND status='active' ORDER BY created_at,id OFFSET 4);
   END IF;
$patch$);
 EXECUTE definition;
END;
$migration$;
