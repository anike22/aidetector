-- Critical privilege boundary: admin promotion is server-only.
REVOKE EXECUTE ON FUNCTION public.promote_to_admin(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.promote_to_admin(text) TO service_role;

-- Verified subscription grants already enforce service_role internally; also enforce it at the GRANT layer.
REVOKE EXECUTE ON FUNCTION public.apply_verified_subscription_payment(text,text,uuid,text,text,bigint,text,timestamptz,uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_verified_subscription_payment(text,text,uuid,text,text,bigint,text,timestamptz,uuid)
  TO service_role;
