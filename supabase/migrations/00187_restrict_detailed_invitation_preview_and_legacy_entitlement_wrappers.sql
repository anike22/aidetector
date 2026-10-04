-- Minimize exposure from legacy browser RPCs.
-- The invitation preview includes inviter/invitee emails, so anonymous execution
-- is removed. Invitation acceptance separately requires auth + invited-email match.
REVOKE EXECUTE ON FUNCTION public.get_organization_invitation_by_token(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_organization_invitation_by_token(text) TO authenticated, service_role;

-- No current repository callers. Authoritative billing uses the identity-enforcing
-- get_user_entitlement_summary and reserve/finalize RPC path.
REVOKE EXECUTE ON FUNCTION public.check_entitlement(uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_entitlement(uuid,text,text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.get_feature_remaining(uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_feature_remaining(uuid,text,text) TO service_role;
