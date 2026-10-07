-- Reduce unnecessary anonymous access to privileged SECURITY DEFINER RPCs.
-- This migration intentionally does NOT change guest/public flows such as:
-- issue_or_validate_guest_session, reserve_entitlement_and_credits,
-- settle_client_reservation, get_user_entitlement_summary,
-- capture_affiliate_attribution, compare_authorship_content,
-- verify_authorship_content_hash, or submit_video_appeal.
--
-- Authenticated RLS helper functions are also left unchanged here where direct
-- permission changes could affect existing policies. Those require a separate
-- policy-aware hardening pass.

-- Authenticated-only account/team operations.
REVOKE EXECUTE ON FUNCTION public.allocate_team_member_credits(uuid,text,integer,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.allocate_team_member_credits(uuid,text,integer,text,text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.remove_team_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_team_member(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_effective_plan(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_effective_plan(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_team_credit_summary(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_team_credit_summary(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.link_guest_to_registered_user(text,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_guest_to_registered_user(text,uuid,text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.link_affiliate_signup(uuid,text,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_affiliate_signup(uuid,text,uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.upsert_communication_preferences(
  uuid,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,integer,text,text,text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_communication_preferences(
  uuid,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,integer,text,text,text
) TO authenticated, service_role;

-- Authenticated-only collaboration approval operations.
REVOKE EXECUTE ON FUNCTION public.submit_report_for_approval(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_report_for_approval(uuid,uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.decide_approval_step(uuid,integer,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decide_approval_step(uuid,integer,text,text) TO authenticated, service_role;

-- Legacy feature-usage summary RPCs are identity-bound internally and have no
-- guest-side mutation role. Keep signed-in compatibility while closing anon RPC access.
REVOKE EXECUTE ON FUNCTION public.increment_feature_usage(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_feature_usage(uuid,text,text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.increment_feature_usage(uuid,text,text,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_feature_usage(uuid,text,text,integer) TO authenticated, service_role;

-- Internal/service-only helper. Its body already rejects non-service callers;
-- remove unnecessary REST exposure as defense in depth.
REVOKE EXECUTE ON FUNCTION public.increment_api_key_usage(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_api_key_usage(uuid) TO service_role;

-- Trigger function: should not be a directly callable client RPC.
REVOKE EXECUTE ON FUNCTION public.handle_organization_member_change() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_organization_member_change() TO service_role;

-- NOTE: log_audit_event and role/membership helper functions are intentionally
-- not changed in this migration. They need a policy-aware follow-up because
-- several are referenced directly by current RLS policies.
