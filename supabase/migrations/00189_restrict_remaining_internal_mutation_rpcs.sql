-- Repair/test security hardening: remove anonymous execution from
-- internal/account-mutating SECURITY DEFINER RPCs. Public guest/referral
-- attribution and public verification flows are intentionally not changed.

REVOKE EXECUTE ON FUNCTION public.allocate_team_member_credits(uuid, text, integer, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.finalize_credit_reservation(uuid, text, jsonb, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_api_key_usage(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_feature_usage(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_feature_usage(uuid, text, text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decide_approval_step(uuid, integer, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_organization_member_change() FROM anon;
