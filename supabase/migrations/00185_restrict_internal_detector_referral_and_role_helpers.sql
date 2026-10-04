-- Internal telemetry, referral generation and arbitrary membership-role helpers.
-- None are current browser/RLS dependencies. Keep RLS-critical get_user_role and
-- get_essay_user_id unchanged.
REVOKE EXECUTE ON FUNCTION public.detector_perf_by_language() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.detector_perf_by_language() TO service_role;
REVOKE EXECUTE ON FUNCTION public.detector_perf_by_version() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.detector_perf_by_version() TO service_role;
REVOKE EXECUTE ON FUNCTION public.detector_problematic_content_types() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.detector_problematic_content_types() TO service_role;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO service_role;
REVOKE EXECUTE ON FUNCTION public.generate_unique_referral_code_for_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_unique_referral_code_for_user() TO service_role;
REVOKE EXECUTE ON FUNCTION public.get_org_role(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_org_role(uuid,uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.get_workspace_role(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_workspace_role(uuid,uuid) TO service_role;
