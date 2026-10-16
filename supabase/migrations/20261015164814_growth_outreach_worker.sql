-- Install only when an administrator enables an authenticated, reconciled mailbox.
CREATE FUNCTION growth_private.setup_worker(p_url text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $worker$
DECLARE token text; sid uuid; command text;
BEGIN
 IF current_setting('role',true)<>'service_role' THEN RAISE EXCEPTION 'Service only'; END IF;
 IF p_url !~ '^https://[a-z0-9]+[.]supabase[.]co/functions/v1/growth-outreach$' THEN RAISE EXCEPTION 'Invalid worker URL'; END IF;
 SELECT id INTO sid FROM vault.secrets WHERE name='aidetector_growth_worker' LIMIT 1;
 IF sid IS NULL THEN
  token:=gen_random_uuid()::text||gen_random_uuid()::text;
  SELECT vault.create_secret(token,'aidetector_growth_worker') INTO sid;
  UPDATE growth_outreach_settings SET worker_token_hash=encode(sha256(convert_to(token,'UTF8')),'hex') WHERE id=true;
 END IF;
 IF EXISTS(SELECT 1 FROM cron.job WHERE jobname='aidetector-growth-outreach') THEN PERFORM cron.unschedule('aidetector-growth-outreach'); END IF;
 command:=format($cmd$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-outreach-worker-token',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE id=%L::uuid)),body:='{"action":"run"}'::jsonb,timeout_milliseconds:=60000);$cmd$,p_url,sid);
 PERFORM cron.schedule('aidetector-growth-outreach','*/15 * * * *',command);
END $worker$;
REVOKE ALL ON FUNCTION growth_private.setup_worker(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION growth_private.setup_worker(text) TO service_role;
CREATE FUNCTION public.growth_setup_worker(p_url text) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog AS $$SELECT growth_private.setup_worker(p_url)$$;
REVOKE ALL ON FUNCTION public.growth_setup_worker(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.growth_setup_worker(text) TO service_role;

ALTER TABLE public.growth_outreach_settings ADD COLUMN gmail_history_id text, ADD COLUMN history_snapshot text, ADD COLUMN delta_cursor text;
UPDATE public.growth_outreach_settings SET daily_cap=10,template_source='Growth client draft awaiting owner approval';
REVOKE ALL ON ALL TABLES IN SCHEMA growth_private FROM PUBLIC,anon,authenticated;

