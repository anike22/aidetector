CREATE OR REPLACE FUNCTION public.upsert_communication_preferences(
  p_user_id uuid,
  p_product_tips boolean DEFAULT NULL,
  p_feature_updates boolean DEFAULT NULL,
  p_security_notifications boolean DEFAULT NULL,
  p_billing_notifications boolean DEFAULT NULL,
  p_marketing_communications boolean DEFAULT NULL,
  p_weekly_summaries boolean DEFAULT NULL,
  p_email boolean DEFAULT NULL,
  p_in_app boolean DEFAULT NULL,
  p_dashboard_announcements boolean DEFAULT NULL,
  p_max_messages_per_day integer DEFAULT NULL,
  p_timezone text DEFAULT NULL,
  p_quiet_hours_start text DEFAULT NULL,
  p_quiet_hours_end text DEFAULT NULL
)
RETURNS public.communication_preferences
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_result public.communication_preferences;
BEGIN
  IF p_user_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'User ID does not match authenticated user';
  END IF;

  INSERT INTO public.communication_preferences (
    user_id, product_tips, feature_updates, security_notifications, billing_notifications,
    marketing_communications, weekly_summaries, email_enabled, in_app_enabled, dashboard_announcements_enabled,
    max_messages_per_day, timezone, quiet_hours_start, quiet_hours_end
  ) VALUES (
    v_user_id,
    COALESCE(p_product_tips, true),
    COALESCE(p_feature_updates, true),
    COALESCE(p_security_notifications, true),
    COALESCE(p_billing_notifications, true),
    COALESCE(p_marketing_communications, true),
    COALESCE(p_weekly_summaries, true),
    COALESCE(p_email, true),
    COALESCE(p_in_app, true),
    COALESCE(p_dashboard_announcements, true),
    COALESCE(p_max_messages_per_day, 5),
    NULLIF(p_timezone, ''),
    NULLIF(p_quiet_hours_start, '')::time without time zone,
    NULLIF(p_quiet_hours_end, '')::time without time zone
  )
  ON CONFLICT (user_id) DO UPDATE SET
    product_tips = EXCLUDED.product_tips,
    feature_updates = EXCLUDED.feature_updates,
    security_notifications = EXCLUDED.security_notifications,
    billing_notifications = EXCLUDED.billing_notifications,
    marketing_communications = EXCLUDED.marketing_communications,
    weekly_summaries = EXCLUDED.weekly_summaries,
    email_enabled = EXCLUDED.email_enabled,
    in_app_enabled = EXCLUDED.in_app_enabled,
    dashboard_announcements_enabled = EXCLUDED.dashboard_announcements_enabled,
    max_messages_per_day = EXCLUDED.max_messages_per_day,
    timezone = EXCLUDED.timezone,
    quiet_hours_start = EXCLUDED.quiet_hours_start,
    quiet_hours_end = EXCLUDED.quiet_hours_end,
    updated_at = now()
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$function$;