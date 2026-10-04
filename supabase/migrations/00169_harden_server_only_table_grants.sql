-- Defense in depth for server-only billing, affiliate, and guest-session state.
-- RLS already blocks browser roles because these tables intentionally have no
-- client policies; remove table privileges as well so a future policy cannot
-- accidentally expose write/read access.
REVOKE ALL ON TABLE
  public.affiliate_program_config,
  public.affiliate_referrals,
  public.billing_payments,
  public.guest_usage,
  public.server_guest_sessions
FROM anon, authenticated;

-- Canonical plan pricing is also server-managed.
REVOKE ALL ON TABLE public.plan_prices FROM anon, authenticated;
