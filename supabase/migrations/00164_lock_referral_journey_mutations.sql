-- Prevent affiliates/clients from directly mutating attribution and conversion state.
-- Journey creation/progression is handled by SECURITY DEFINER RPCs and service-role payment reconciliation.

DROP POLICY IF EXISTS referral_journeys_update_owner ON public.referral_journeys;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.referral_journeys FROM anon;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.referral_journeys FROM authenticated;

-- Keep read access governed by the existing owner/admin SELECT RLS policy.
GRANT SELECT ON TABLE public.referral_journeys TO authenticated;

-- Service role retains backend mutation access.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.referral_journeys TO service_role;

-- Attribution capture is intentionally callable before login, but performs validation
-- and writes through SECURITY DEFINER rather than direct table INSERT.
REVOKE ALL ON FUNCTION public.capture_affiliate_attribution(uuid,text,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.capture_affiliate_attribution(uuid,text,uuid,text)
TO anon,authenticated,service_role;

REVOKE ALL ON FUNCTION public.link_affiliate_signup(uuid,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_affiliate_signup(uuid,text,uuid)
TO authenticated,service_role;
