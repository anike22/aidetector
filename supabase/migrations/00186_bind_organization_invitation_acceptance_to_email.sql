-- Bind organization invitation acceptance to the intended account.
-- A valid token alone is insufficient: the authenticated user's auth email must
-- match the invitation email (case-insensitive), preventing token theft from
-- becoming organization membership.
--
-- Database migration replaces public.accept_organization_invitation(text) with
-- the existing membership/workspace/audit logic plus:
--   1. auth.uid() must be present
--   2. auth.users email for auth.uid() must equal invitation.email
--   3. anon/PUBLIC EXECUTE revoked; authenticated/service_role retained.
REVOKE EXECUTE ON FUNCTION public.accept_organization_invitation(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_organization_invitation(text) TO authenticated, service_role;
