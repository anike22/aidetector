-- Legacy guest counters are superseded by authoritative reservation/settlement.
-- settle_guest_trial_check could mutate an arbitrary supplied guest id without
-- requiring a valid reservation. Affiliate link resolution is an internal helper
-- called by capture_affiliate_attribution and does not need direct browser RPC access.
REVOKE EXECUTE ON FUNCTION public.increment_guest_usage(text,date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_guest_usage(text,date) TO service_role;
REVOKE EXECUTE ON FUNCTION public.increment_guest_usage(text,text,text,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_guest_usage(text,text,text,integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.resolve_affiliate_tracking_link(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_affiliate_tracking_link(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.settle_guest_trial_check(text,uuid,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_guest_trial_check(text,uuid,text,jsonb) TO service_role;
