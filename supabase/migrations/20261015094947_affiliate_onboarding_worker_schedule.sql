CREATE OR REPLACE FUNCTION affiliate_private.dispatch_onboarding() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE token text;
BEGIN
 SELECT decrypted_secret INTO token FROM vault.decrypted_secrets WHERE name='affiliate_onboarding_worker' LIMIT 1;
 IF token IS NOT NULL THEN
   PERFORM net.http_post(url:='https://opivtrfgurwndilnbfmm.supabase.co/functions/v1/affiliate-onboarding',
    headers:=jsonb_build_object('Content-Type','application/json','x-onboarding-worker',token),body:='{}'::jsonb,timeout_milliseconds:=30000);
 END IF;
END $$;
REVOKE ALL ON FUNCTION affiliate_private.dispatch_onboarding() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.claim_affiliate_onboarding(p_application_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE item affiliate_onboarding_outbox%ROWTYPE;
BEGIN
 IF current_setting('role',true)<>'service_role' THEN RAISE EXCEPTION 'Service access required'; END IF;
 UPDATE affiliate_onboarding_outbox SET state='uncertain',last_error='Retry window expired; review provider delivery records'
 WHERE state IN ('pending','sending') AND first_attempt_at<now()-interval '20 hours';
 SELECT o.* INTO item FROM affiliate_onboarding_outbox o
 JOIN affiliate_applications a ON a.id=o.application_id
 JOIN profiles p ON p.id=o.user_id
 WHERE (p_application_id IS NULL OR o.application_id=p_application_id)
 AND a.status='Approved' AND p.affiliate_status='active'
 AND ((o.state='pending' AND o.next_attempt_at<=now()) OR (o.state='sending' AND o.claimed_at<now()-interval '5 minutes'))
 AND o.attempts<3 ORDER BY o.created_at LIMIT 1 FOR UPDATE OF o SKIP LOCKED;
 IF item.user_id IS NULL THEN RETURN NULL; END IF;
 UPDATE affiliate_onboarding_outbox SET state='sending',attempts=attempts+1,claimed_at=now(),first_attempt_at=coalesce(first_attempt_at,now()) WHERE user_id=item.user_id RETURNING * INTO item;
 RETURN to_jsonb(item);
END $$;
REVOKE ALL ON FUNCTION public.claim_affiliate_onboarding(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_affiliate_onboarding(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.affiliate_onboarding_worker_authorized(p_token text)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path=public,extensions AS $$
 SELECT EXISTS(SELECT 1 FROM affiliate_private.worker_config WHERE token_hash=encode(extensions.digest(p_token,'sha256'),'hex'));
$$;
REVOKE ALL ON FUNCTION public.affiliate_onboarding_worker_authorized(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.affiliate_onboarding_worker_authorized(text) TO service_role;

-- Separate scheduler credential, stored encrypted; never expose it to clients.
DO $setup$
DECLARE token text;
BEGIN
 token:=encode(extensions.gen_random_bytes(32),'hex');
 PERFORM vault.create_secret(token,'affiliate_onboarding_worker','Private affiliate activation worker');
 INSERT INTO affiliate_private.worker_config(id,token_hash) VALUES(true,encode(extensions.digest(token,'sha256'),'hex'));
 PERFORM cron.schedule('affiliate-onboarding','*/5 * * * *','select affiliate_private.dispatch_onboarding()');
END $setup$;
