-- Close unrestricted PostgREST exposure on operational and sensitive tables.
-- No broad client policies are added here; service_role continues to bypass RLS.
ALTER TABLE public.credit_rate_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_automation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.humanizer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_development_requests ENABLE ROW LEVEL SECURITY;
