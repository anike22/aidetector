-- Pin search_path on the remaining functions reported by the Supabase security advisor.
ALTER FUNCTION public.handle_updated_at() SET search_path = public, auth;
ALTER FUNCTION public.set_mining_assessments_updated_at() SET search_path = public, auth;
ALTER FUNCTION public.articles_set_updated_at() SET search_path = public, auth;
ALTER FUNCTION public.classify_traffic_channel(text,text,text) SET search_path = public, auth;
ALTER FUNCTION public.set_updated_at() SET search_path = public, auth;
ALTER FUNCTION public.get_user_risk_level(integer) SET search_path = public, auth;
ALTER FUNCTION public.increment_guest_usage(text,text,integer) SET search_path = public, auth;
ALTER FUNCTION public.invoke_email_automation_worker() SET search_path = public, auth;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, auth;
