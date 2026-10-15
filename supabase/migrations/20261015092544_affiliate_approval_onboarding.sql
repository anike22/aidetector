-- Approval is an atomic grant + durable transactional-email event.
CREATE SCHEMA IF NOT EXISTS affiliate_private;
REVOKE ALL ON SCHEMA affiliate_private FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA affiliate_private TO service_role;
CREATE TABLE public.affiliate_onboarding_outbox (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id),
 application_id uuid NOT NULL REFERENCES public.affiliate_applications(id),
 recipient text NOT NULL, snapshot jsonb NOT NULL,
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','sending','sent','failed','uncertain','cancelled')),
 attempts int NOT NULL DEFAULT 0, next_attempt_at timestamptz NOT NULL DEFAULT now(),
 first_attempt_at timestamptz, claimed_at timestamptz, provider_message_id text,
 message_json jsonb, last_error text, created_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz
);
ALTER TABLE public.affiliate_onboarding_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.affiliate_onboarding_outbox FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.affiliate_onboarding_outbox TO authenticated;
GRANT ALL ON public.affiliate_onboarding_outbox TO service_role;
CREATE POLICY admin_read ON public.affiliate_onboarding_outbox FOR SELECT TO authenticated
 USING(EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role='admin'));
CREATE TABLE affiliate_private.worker_config(id boolean PRIMARY KEY DEFAULT true CHECK(id),token_hash text NOT NULL);
ALTER TABLE affiliate_private.worker_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_clients ON affiliate_private.worker_config AS RESTRICTIVE FOR ALL TO anon,authenticated USING(false) WITH CHECK(false);
GRANT SELECT ON affiliate_private.worker_config TO service_role;

CREATE OR REPLACE FUNCTION affiliate_private.has_testing_grant(p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,auth AS $$
 SELECT (auth.uid()=p_user_id OR auth.role()='service_role' OR current_setting('role',true) IN ('postgres','supabase_admin','service_role','none'))
 AND EXISTS(SELECT 1 FROM profiles p WHERE p.id=p_user_id AND p.affiliate_status='active')
 AND EXISTS(SELECT 1 FROM affiliate_applications a WHERE a.user_id=p_user_id AND a.status='Approved')
 AND EXISTS(SELECT 1 FROM usage_ledger l WHERE l.user_id=p_user_id AND l.operation='affiliate_testing_credit_grant' AND l.outcome='success' AND l.credits_amount>0);
$$;
REVOKE ALL ON FUNCTION affiliate_private.has_testing_grant(uuid) FROM PUBLIC;
GRANT USAGE ON SCHEMA affiliate_private TO authenticated;
GRANT EXECUTE ON FUNCTION affiliate_private.has_testing_grant(uuid) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.has_affiliate_testing_grant(p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$SELECT affiliate_private.has_testing_grant(p_user_id)$$;
REVOKE ALL ON FUNCTION public.has_affiliate_testing_grant(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_affiliate_testing_grant(uuid) TO authenticated,service_role;

