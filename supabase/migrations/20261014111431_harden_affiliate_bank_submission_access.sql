-- Do not include approved commissions whose holding period has not elapsed.
DO $patch$
DECLARE definition text;
BEGIN
 definition:=pg_get_functiondef('public.get_affiliate_payout_setup()'::regprocedure);
 definition:=replace(definition, $$status='Approved' AND payout_id IS NULL$$, $$status='Approved' AND payout_id IS NULL AND coalesce(eligible_at,created_at+make_interval(days=>holding))<=now()$$);
 EXECUTE definition;
 definition:=pg_get_functiondef('public.request_affiliate_payout(text)'::regprocedure);
 definition:=replace(definition, $$status='Approved' and payout_id is null$$, $$status='Approved' and payout_id is null and coalesce(eligible_at,created_at+make_interval(days=>(select hold_days from public.affiliate_program_config where id=true)))<=now()$$);
 EXECUTE definition;
END $patch$;
-- Explicit deny policy documents that only the checked functions access this table.
CREATE POLICY bank_details_no_direct_client_access ON affiliate_private.payout_bank_details
 AS RESTRICTIVE FOR ALL TO authenticated USING(false) WITH CHECK(false);
-- Keep privileged implementations outside the exposed API schema.
ALTER FUNCTION public.get_affiliate_payout_setup() SET SCHEMA affiliate_private;
ALTER FUNCTION public.submit_usd_affiliate_payout(jsonb) SET SCHEMA affiliate_private;
ALTER FUNCTION public.admin_get_payout_bank_details(uuid) SET SCHEMA affiliate_private;
GRANT USAGE ON SCHEMA affiliate_private TO authenticated;
CREATE FUNCTION public.get_affiliate_payout_setup() RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog AS $$SELECT affiliate_private.get_affiliate_payout_setup()$$;
CREATE FUNCTION public.submit_usd_affiliate_payout(p_details jsonb) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog AS $$SELECT affiliate_private.submit_usd_affiliate_payout(p_details)$$;
CREATE FUNCTION public.admin_get_payout_bank_details(p_payout_id uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog AS $$SELECT affiliate_private.admin_get_payout_bank_details(p_payout_id)$$;
REVOKE ALL ON FUNCTION public.get_affiliate_payout_setup(),public.submit_usd_affiliate_payout(jsonb),public.admin_get_payout_bank_details(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_affiliate_payout_setup(),public.submit_usd_affiliate_payout(jsonb),public.admin_get_payout_bank_details(uuid) TO authenticated;
