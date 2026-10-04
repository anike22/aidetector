-- Enterprise dashboard security hardening.
-- Applied to owned test Supabase as two migration steps:
-- 1. protect_enterprise_dashboard_and_internal_helpers
-- 2. protect_organization_dashboard_summary
--
-- Required security contract:
-- * get_enterprise_dashboard_metrics(uuid), get_organization_analytics(uuid),
--   and get_organization_dashboard_summary(uuid) reject callers that are neither
--   service_role nor authenticated members of the requested organization.
-- * PUBLIC/anon EXECUTE is revoked on all three dashboard functions.
-- * authenticated and service_role retain EXECUTE.
-- * sync_customer_profile_to_intelligence(), update_seller_products_updated_at(),
--   and the retired process_subscription_refill(...) stub are service-role-only
--   as direct RPC endpoints.
--
-- The exact CREATE OR REPLACE definitions are intentionally maintained in the
-- database migration history for the owned test project. This repository marker
-- records the authorization contract for merge reconciliation.
REVOKE EXECUTE ON FUNCTION public.get_enterprise_dashboard_metrics(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_enterprise_dashboard_metrics(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_organization_analytics(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_organization_analytics(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_organization_dashboard_summary(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_organization_dashboard_summary(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.sync_customer_profile_to_intelligence() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_customer_profile_to_intelligence() TO service_role;
REVOKE EXECUTE ON FUNCTION public.update_seller_products_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_seller_products_updated_at() TO service_role;
REVOKE EXECUTE ON FUNCTION public.process_subscription_refill(text,text,text,text,text,timestamptz,timestamptz,integer,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_subscription_refill(text,text,text,text,text,timestamptz,timestamptz,integer,jsonb) TO service_role;
