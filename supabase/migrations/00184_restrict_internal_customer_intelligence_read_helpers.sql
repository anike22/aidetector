-- Internal Customer Intelligence scoring/workflow helpers.
-- They have no current browser callers or RLS dependencies and can expose
-- behavioral/usage intelligence for arbitrary supplied user/profile identifiers.
REVOKE EXECUTE ON FUNCTION public.calculate_activation_score(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_activation_score(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.calculate_health_score(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_health_score(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.calculate_upgrade_readiness(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_upgrade_readiness(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.get_usage_stats(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_usage_stats(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.evaluate_workflow_condition(jsonb,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.evaluate_workflow_condition(jsonb,uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.resolve_customer_profile_id(text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_customer_profile_id(text,uuid) TO service_role;
