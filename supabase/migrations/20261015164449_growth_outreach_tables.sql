CREATE SCHEMA IF NOT EXISTS growth_private;
REVOKE ALL ON SCHEMA growth_private FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA growth_private TO service_role;
CREATE TABLE public.growth_outreach_settings (
 id boolean PRIMARY KEY DEFAULT true CHECK(id), sender_email text NOT NULL DEFAULT 'growth@aidetector.cx',
 enabled boolean NOT NULL DEFAULT false, history_ready boolean NOT NULL DEFAULT false,
 sync_cursor text, last_synced_at timestamptz, mailbox_email text, template_html text NOT NULL DEFAULT '',
 template_source text NOT NULL DEFAULT 'Gmail 1a12f1ddfc7268d2', worker_token_hash text,
 daily_cap integer NOT NULL DEFAULT 50 CHECK(daily_cap BETWEEN 1 AND 50)
);
INSERT INTO public.growth_outreach_settings(id) VALUES(true);
CREATE TABLE public.growth_outreach_queue (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL CHECK(email=lower(btrim(email))),
 organization text NOT NULL, source_url text NOT NULL CHECK(source_url ~ '^https://'), greeting text NOT NULL,
 intro text NOT NULL, subject text NOT NULL CHECK(length(subject) BETWEEN 1 AND 200 AND subject !~ '[\r\n]'),
 kind text NOT NULL DEFAULT 'initial' CHECK(kind IN ('initial','reply')), reply_body text, gmail_thread_id text, reply_message_id text,
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','sending','sent','failed','uncertain','blocked','needs_reply','closed')),
 approved_by uuid REFERENCES auth.users(id), approved_at timestamptz, due_at timestamptz NOT NULL DEFAULT now(),
 gmail_message_id text, rfc_message_id text, last_error text, claimed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz
);
CREATE UNIQUE INDEX growth_one_initial_per_address ON public.growth_outreach_queue(email) WHERE kind='initial';
CREATE TABLE public.growth_outreach_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), queue_id uuid REFERENCES public.growth_outreach_queue(id), email text NOT NULL,
 status text NOT NULL DEFAULT 'reserved', gmail_message_id text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.growth_outreach_contacts(email text PRIMARY KEY, prior_sent integer NOT NULL DEFAULT 0, prior_draft boolean NOT NULL DEFAULT false);

CREATE TABLE public.growth_outreach_mail (
 id text PRIMARY KEY, thread_id text NOT NULL, sender text NOT NULL, recipients text[] NOT NULL DEFAULT '{}',
 subject text NOT NULL, body_text text NOT NULL DEFAULT '', labels text[] NOT NULL DEFAULT '{}',
 rfc_message_id text, received_at timestamptz NOT NULL, category text NOT NULL DEFAULT 'message', handled boolean NOT NULL DEFAULT false
);
CREATE INDEX growth_mail_thread ON public.growth_outreach_mail(thread_id,received_at);
CREATE TABLE growth_private.mailbox(id boolean PRIMARY KEY DEFAULT true CHECK(id),secret_id uuid NOT NULL);
CREATE TABLE growth_private.oauth_states(state_hash text PRIMARY KEY, user_id uuid NOT NULL, verifier text NOT NULL, expires_at timestamptz NOT NULL);
ALTER TABLE growth_private.mailbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_private.oauth_states ENABLE ROW LEVEL SECURITY;
GRANT ALL ON ALL TABLES IN SCHEMA growth_private TO service_role;
-- Only authenticated administrators may view campaign data. All writes go through the checked edge service.
DO $policies$ DECLARE t text; BEGIN
FOREACH t IN ARRAY ARRAY['growth_outreach_settings','growth_outreach_queue','growth_outreach_attempts','growth_outreach_contacts','growth_outreach_mail'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
 EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t);
 EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
 EXECUTE format('CREATE POLICY admin_read ON public.%I FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()) AND role=''admin''))',t);
END LOOP; END $policies$;
