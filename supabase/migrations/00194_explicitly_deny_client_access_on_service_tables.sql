-- Make service/RPC-only intent explicit for tables that had RLS enabled but no policy.
-- This preserves their existing client-inaccessible behavior while preventing accidental
-- future exposure if table grants remain broad. service_role continues to bypass RLS.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'admin_audit_logs','admin_user_notes','affiliate_program_config','affiliate_referrals',
    'billing_payments','credit_rate_table','feature_limits','guest_usage','humanizer_logs',
    'meetings','plan_prices','plugin_downloads','server_guest_sessions','test_automation',
    'user_activities','user_custom_limits','user_error_logs','user_transactions',
    'website_development_requests'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'deny_client_access', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
      'deny_client_access', t
    );
  END LOOP;
END $$;
