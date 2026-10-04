-- These legacy/internal Customer Intelligence RPCs have no current repository
-- callers or database dependencies and accept arbitrary user/profile identifiers.
-- Keep them available only to trusted server execution.
REVOKE EXECUTE ON FUNCTION public.get_or_create_customer_profile(text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_customer_profile(text,uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.merge_visitor_to_customer_profile(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.merge_visitor_to_customer_profile(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.record_behavior_event(uuid,text,text,jsonb,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_behavior_event(uuid,text,text,jsonb,text,jsonb) TO service_role;
REVOKE EXECUTE ON FUNCTION public.record_enterprise_event(uuid,uuid,text,text,uuid,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_enterprise_event(uuid,uuid,text,text,uuid,jsonb) TO service_role;
REVOKE EXECUTE ON FUNCTION public.record_recommendation_event(uuid,text,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_recommendation_event(uuid,text,uuid,text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.record_recommendation_event(uuid,uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_recommendation_event(uuid,uuid,text,text) TO service_role;
