-- Backend Customer Intelligence/personalization and billing-maintenance RPCs
-- accept arbitrary user/profile IDs and have no caller ownership guard.
-- Keep them available to trusted server execution only.
REVOKE EXECUTE ON FUNCTION public.complete_checklist_item(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_checklist_item(uuid,text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.record_journey_stage(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_journey_stage(uuid,text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.refresh_billing_account(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_billing_account(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.refresh_intelligence_profile(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_intelligence_profile(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.set_user_goal(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_goal(uuid,text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.unlock_milestone(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_milestone(uuid,text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.update_behavioral_signals(uuid,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_behavioral_signals(uuid,jsonb) TO service_role;
REVOKE EXECUTE ON FUNCTION public.update_goal_progress(uuid,text,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_goal_progress(uuid,text,integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.upsert_customer_device(uuid,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_customer_device(uuid,text,text,text,text,text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.upsert_prediction(uuid,text,integer,numeric,integer,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_prediction(uuid,text,integer,numeric,integer,jsonb) TO service_role;
