CREATE SCHEMA IF NOT EXISTS outreach_private;
REVOKE ALL ON SCHEMA outreach_private FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA outreach_private TO service_role;
CREATE TABLE public.admin_outreach_settings (
 id boolean PRIMARY KEY DEFAULT true CHECK(id), sender_email text NOT NULL DEFAULT 'partnerships@aidetector.cx',
 enabled boolean NOT NULL DEFAULT false, history_ready boolean NOT NULL DEFAULT false,
 sync_cursor text, last_synced_at timestamptz, mailbox_email text, template_html text NOT NULL DEFAULT '',
 template_source text NOT NULL DEFAULT 'Gmail 1a12f1ddfc7268d2', worker_token_hash text,
 daily_cap integer NOT NULL DEFAULT 50 CHECK(daily_cap BETWEEN 1 AND 50)
);
INSERT INTO public.admin_outreach_settings(id) VALUES(true);
CREATE TABLE public.admin_outreach_queue (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL CHECK(email=lower(btrim(email))),
 organization text NOT NULL, source_url text NOT NULL CHECK(source_url ~ '^https://'), greeting text NOT NULL,
 intro text NOT NULL, subject text NOT NULL CHECK(length(subject) BETWEEN 1 AND 200 AND subject !~ '[\r\n]'),
 kind text NOT NULL DEFAULT 'initial' CHECK(kind IN ('initial','reply')), reply_body text, gmail_thread_id text, reply_message_id text,
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','sending','sent','failed','uncertain','blocked','needs_reply','closed')),
 approved_by uuid REFERENCES auth.users(id), approved_at timestamptz, due_at timestamptz NOT NULL DEFAULT now(),
 gmail_message_id text, rfc_message_id text, last_error text, claimed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz
);
CREATE UNIQUE INDEX outreach_one_initial_per_address ON public.admin_outreach_queue(email) WHERE kind='initial';
CREATE TABLE public.admin_outreach_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), queue_id uuid REFERENCES public.admin_outreach_queue(id), email text NOT NULL,
 status text NOT NULL DEFAULT 'reserved', gmail_message_id text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.admin_outreach_contacts(email text PRIMARY KEY, prior_sent integer NOT NULL DEFAULT 0, prior_draft boolean NOT NULL DEFAULT false);
CREATE TABLE public.admin_outreach_suppressions(email text PRIMARY KEY, reason text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.admin_outreach_mail (
 id text PRIMARY KEY, thread_id text NOT NULL, sender text NOT NULL, recipients text[] NOT NULL DEFAULT '{}',
 subject text NOT NULL, body_text text NOT NULL DEFAULT '', labels text[] NOT NULL DEFAULT '{}',
 rfc_message_id text, received_at timestamptz NOT NULL, category text NOT NULL DEFAULT 'message', handled boolean NOT NULL DEFAULT false
);
CREATE INDEX outreach_mail_thread ON public.admin_outreach_mail(thread_id,received_at);
CREATE TABLE outreach_private.mailbox(id boolean PRIMARY KEY DEFAULT true CHECK(id),secret_id uuid NOT NULL);
CREATE TABLE outreach_private.oauth_states(state_hash text PRIMARY KEY, user_id uuid NOT NULL, verifier text NOT NULL, expires_at timestamptz NOT NULL);
ALTER TABLE outreach_private.mailbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_private.oauth_states ENABLE ROW LEVEL SECURITY;
GRANT ALL ON ALL TABLES IN SCHEMA outreach_private TO service_role;
-- Only authenticated administrators may view campaign data. All writes go through the checked edge service.
DO $policies$ DECLARE t text; BEGIN
FOREACH t IN ARRAY ARRAY['admin_outreach_settings','admin_outreach_queue','admin_outreach_attempts','admin_outreach_contacts','admin_outreach_suppressions','admin_outreach_mail'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
 EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t);
 EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
 EXECUTE format('CREATE POLICY admin_read ON public.%I FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()) AND role=''admin''))',t);
END LOOP; END $policies$;
-- Vault secrets are never returned to a browser; these RPCs are service-only.
CREATE FUNCTION outreach_private.credentials(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE sid uuid; result jsonb;
BEGIN
 IF current_setting('role',true)<>'service_role' THEN RAISE EXCEPTION 'Service only'; END IF;
 IF p_action='get' THEN
  SELECT decrypted_secret::jsonb INTO result FROM vault.decrypted_secrets WHERE id=(SELECT secret_id FROM outreach_private.mailbox WHERE id=true);
  RETURN result;
 ELSIF p_action='set' THEN
  SELECT secret_id INTO sid FROM outreach_private.mailbox WHERE id=true FOR UPDATE;
  IF sid IS NULL THEN SELECT vault.create_secret(p_data::text,'aidetector_outreach_mailbox') INTO sid; INSERT INTO outreach_private.mailbox(id,secret_id) VALUES(true,sid);
  ELSE PERFORM vault.update_secret(sid,p_data::text); END IF;
  RETURN '{"saved":true}';
 ELSIF p_action='state' THEN
  DELETE FROM outreach_private.oauth_states WHERE expires_at<now();
  INSERT INTO outreach_private.oauth_states VALUES(p_data->>'hash',(p_data->>'user_id')::uuid,p_data->>'verifier',now()+interval '10 minutes'); RETURN '{}';
 ELSIF p_action='consume_state' THEN
  DELETE FROM outreach_private.oauth_states WHERE state_hash=p_data->>'hash' AND expires_at>now() RETURNING jsonb_build_object('user_id',user_id,'verifier',verifier) INTO result; RETURN result;
 END IF;
 RAISE EXCEPTION 'Unknown action';
END $$;
REVOKE ALL ON FUNCTION outreach_private.credentials(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION outreach_private.credentials(text,jsonb) TO service_role;
CREATE FUNCTION public.outreach_credentials(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog AS $$SELECT outreach_private.credentials(p_action,p_data)$$;
REVOKE ALL ON FUNCTION public.outreach_credentials(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.outreach_credentials(text,jsonb) TO service_role;

CREATE FUNCTION public.outreach_claim() RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE s admin_outreach_settings%ROWTYPE; q admin_outreach_queue%ROWTYPE; day_start timestamptz; attempts integer; local_hour integer;
BEGIN
 IF current_setting('role',true)<>'service_role' THEN RAISE EXCEPTION 'Service only'; END IF;
 PERFORM pg_advisory_xact_lock(83419354);
 SELECT * INTO s FROM admin_outreach_settings WHERE id=true;
 IF NOT s.enabled OR NOT s.history_ready OR s.mailbox_email IS DISTINCT FROM s.sender_email OR s.last_synced_at IS NULL OR s.last_synced_at<now()-interval '30 minutes' THEN RETURN NULL; END IF;
 local_hour:=extract(hour FROM now() AT TIME ZONE 'Africa/Lagos');
 IF local_hour<8 OR local_hour>=21 THEN RETURN NULL; END IF;
 -- Never automatically reclaim a send whose provider outcome might be unknown.
 UPDATE admin_outreach_queue SET status='uncertain',last_error='Interrupted send; reconcile Gmail Sent before any further action' WHERE status='sending' AND claimed_at<now()-interval '30 minutes';
 SELECT * INTO q FROM admin_outreach_queue WHERE status='approved' AND due_at<=now() ORDER BY due_at,created_at LIMIT 1 FOR UPDATE;
 IF q.id IS NULL THEN RETURN NULL; END IF;
 IF EXISTS(SELECT 1 FROM admin_outreach_suppressions WHERE email=q.email) THEN UPDATE admin_outreach_queue SET status='blocked',last_error='Suppressed address' WHERE id=q.id; RETURN NULL; END IF;
 SELECT count(*) INTO attempts FROM admin_outreach_attempts a WHERE email=q.email AND NOT EXISTS(SELECT 1 FROM admin_outreach_mail m WHERE m.id=a.gmail_message_id);
 attempts:=attempts+coalesce((SELECT prior_sent FROM admin_outreach_contacts WHERE email=q.email),0);
 IF attempts>=3 OR (q.kind='initial' AND (attempts>0 OR coalesce((SELECT prior_draft FROM admin_outreach_contacts WHERE email=q.email),false))) THEN UPDATE admin_outreach_queue SET status='blocked',last_error='Prior contact or attempt limit' WHERE id=q.id; RETURN NULL; END IF;
 day_start:=date_trunc('day',now() AT TIME ZONE 'Africa/Lagos') AT TIME ZONE 'Africa/Lagos';
 IF q.kind='initial' AND (SELECT count(*) FROM admin_outreach_attempts a JOIN admin_outreach_queue x ON x.id=a.queue_id WHERE a.created_at>=day_start AND x.kind='initial')>=s.daily_cap THEN RETURN NULL; END IF;
 UPDATE admin_outreach_queue SET status='sending',claimed_at=now(),rfc_message_id=coalesce(rfc_message_id,gen_random_uuid()::text||'@aidetector.cx') WHERE id=q.id RETURNING * INTO q;
 INSERT INTO admin_outreach_attempts(queue_id,email) VALUES(q.id,q.email);
 RETURN to_jsonb(q);
END $$;
REVOKE ALL ON FUNCTION public.outreach_claim() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.outreach_claim() TO service_role;

-- Install only when an administrator enables an authenticated, reconciled mailbox.
CREATE FUNCTION outreach_private.setup_worker(p_url text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $worker$
DECLARE token text; sid uuid; command text;
BEGIN
 IF current_setting('role',true)<>'service_role' THEN RAISE EXCEPTION 'Service only'; END IF;
 IF p_url !~ '^https://[a-z0-9]+[.]supabase[.]co/functions/v1/admin-outreach$' THEN RAISE EXCEPTION 'Invalid worker URL'; END IF;
 SELECT id INTO sid FROM vault.secrets WHERE name='aidetector_outreach_worker' LIMIT 1;
 IF sid IS NULL THEN
  token:=gen_random_uuid()::text||gen_random_uuid()::text;
  SELECT vault.create_secret(token,'aidetector_outreach_worker') INTO sid;
  UPDATE admin_outreach_settings SET worker_token_hash=encode(sha256(convert_to(token,'UTF8')),'hex') WHERE id=true;
 END IF;
 IF EXISTS(SELECT 1 FROM cron.job WHERE jobname='aidetector-affiliate-outreach') THEN PERFORM cron.unschedule('aidetector-affiliate-outreach'); END IF;
 command:=format($cmd$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-outreach-worker-token',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE id=%L::uuid)),body:='{"action":"run"}'::jsonb,timeout_milliseconds:=60000);$cmd$,p_url,sid);
 PERFORM cron.schedule('aidetector-affiliate-outreach','*/15 * * * *',command);
END $worker$;
REVOKE ALL ON FUNCTION outreach_private.setup_worker(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION outreach_private.setup_worker(text) TO service_role;
CREATE FUNCTION public.outreach_setup_worker(p_url text) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog AS $$SELECT outreach_private.setup_worker(p_url)$$;
REVOKE ALL ON FUNCTION public.outreach_setup_worker(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.outreach_setup_worker(text) TO service_role;
