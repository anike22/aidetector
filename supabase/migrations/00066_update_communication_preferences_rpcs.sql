CREATE OR REPLACE FUNCTION public.get_user_communication_preferences(p_user_id uuid)
RETURNS public.communication_preferences
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
STABLE
AS $function$
  SELECT *
  FROM public.communication_preferences
  WHERE user_id = p_user_id;
$function$;

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
  p_quiet_hours_start time without time zone DEFAULT NULL,
  p_quiet_hours_end time without time zone DEFAULT NULL
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
    NULLIF(p_quiet_hours_start, ''),
    NULLIF(p_quiet_hours_end, '')
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

CREATE OR REPLACE FUNCTION public.check_frequency_limit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
STABLE
AS $function$
DECLARE
  v_limit integer;
  v_count integer;
BEGIN
  SELECT COALESCE(max_messages_per_day, 5) INTO v_limit
  FROM public.communication_preferences
  WHERE user_id = p_user_id;

  IF v_limit IS NULL THEN
    v_limit := 5;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.automation_execution_logs l
  JOIN public.automation_executions e ON l.execution_id = e.id
  WHERE e.user_id = p_user_id
    AND l.step_type = 'action'
    AND l.status = 'completed'
    AND l.timestamp >= now() - interval '1 day';

  RETURN v_count < v_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.execute_workflow_action(p_user_id uuid, p_action jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
DECLARE
  v_action_type text := p_action->>'type';
  v_category text := p_action->>'category';
  v_profile public.customer_profiles%ROWTYPE;
  v_preferences public.communication_preferences%ROWTYPE;
  v_result jsonb := jsonb_build_object('success', true);
  v_allowed boolean := true;
  v_tag_id uuid;
  v_segment_id uuid;
BEGIN
  SELECT * INTO v_profile FROM public.customer_profiles WHERE user_id = p_user_id LIMIT 1;

  SELECT * INTO v_preferences FROM (
    SELECT * FROM public.communication_preferences WHERE user_id = p_user_id
    UNION ALL
    SELECT
      gen_random_uuid() AS id,
      p_user_id AS user_id,
      true AS product_tips,
      true AS feature_updates,
      true AS security_notifications,
      true AS billing_notifications,
      true AS marketing_communications,
      true AS weekly_summaries,
      true AS email_enabled,
      true AS in_app_enabled,
      true AS dashboard_announcements_enabled,
      5 AS max_messages_per_day,
      'UTC' AS timezone,
      '22:00'::time without time zone AS quiet_hours_start,
      '08:00'::time without time zone AS quiet_hours_end,
      now() AS created_at,
      now() AS updated_at
  ) defaults;

  IF v_category IN ('product_tips','feature_updates','marketing_communications','weekly_summaries') THEN
    v_allowed := CASE v_category
      WHEN 'product_tips' THEN v_preferences.product_tips
      WHEN 'feature_updates' THEN v_preferences.feature_updates
      WHEN 'marketing_communications' THEN v_preferences.marketing_communications
      WHEN 'weekly_summaries' THEN v_preferences.weekly_summaries
      ELSE true
    END;
  ELSIF v_category IN ('security_notifications','billing_notifications') THEN
    v_allowed := true;
  END IF;

  IF NOT v_allowed THEN
    RETURN jsonb_build_object('success', true, 'skipped', true, 'reason', 'preference_disabled');
  END IF;

  IF NOT check_frequency_limit(p_user_id) THEN
    RETURN jsonb_build_object('success', true, 'skipped', true, 'reason', 'frequency_limit');
  END IF;

  CASE v_action_type
    WHEN 'in_app_notification' THEN
      IF v_preferences.in_app_enabled THEN
        INSERT INTO public.user_notifications (customer_profile_id, notification_type, title, message, link, metadata, read, created_at)
        VALUES (
          v_profile.id,
          COALESCE(v_category, 'automation'),
          p_action->>'title',
          p_action->>'message',
          p_action->>'link',
          p_action->'metadata',
          false,
          now()
        );
      ELSE
        v_result := jsonb_build_object('success', true, 'skipped', true, 'reason', 'in_app_disabled');
      END IF;
    WHEN 'dashboard_announcement' THEN
      IF v_preferences.dashboard_announcements_enabled THEN
        INSERT INTO public.feature_announcements (title, description, cta_text, cta_url, target_segments, priority, enabled, start_date, end_date, created_at)
        VALUES (
          p_action->>'title',
          p_action->>'message',
          p_action->>'cta_text',
          p_action->>'link',
          p_action->'target_segments',
          COALESCE((p_action->>'priority')::int, 1),
          true,
          now(),
          now() + interval '30 days',
          now()
        );
      ELSE
        v_result := jsonb_build_object('success', true, 'skipped', true, 'reason', 'dashboard_announcements_disabled');
      END IF;
    WHEN 'add_tag' THEN
      SELECT id INTO v_tag_id FROM public.customer_tags WHERE name = p_action->>'value' LIMIT 1;
      IF v_tag_id IS NULL THEN
        INSERT INTO public.customer_tags (name, is_system, created_at)
        VALUES (p_action->>'value', false, now())
        RETURNING id INTO v_tag_id;
      END IF;
      INSERT INTO public.customer_tag_assignments (customer_profile_id, tag_id, assigned_by, created_at)
      VALUES (v_profile.id, v_tag_id, 'automation', now())
      ON CONFLICT DO NOTHING;
    WHEN 'remove_tag' THEN
      DELETE FROM public.customer_tag_assignments
      WHERE customer_profile_id = v_profile.id
        AND tag_id = (SELECT id FROM public.customer_tags WHERE name = p_action->>'value' LIMIT 1);
    WHEN 'add_to_segment' THEN
      SELECT id INTO v_segment_id FROM public.customer_segments WHERE name = p_action->>'value' LIMIT 1;
      IF v_segment_id IS NOT NULL THEN
        INSERT INTO public.customer_segment_memberships (customer_profile_id, segment_id, created_at)
        VALUES (v_profile.id, v_segment_id, now())
        ON CONFLICT DO NOTHING;
      END IF;
    WHEN 'remove_from_segment' THEN
      DELETE FROM public.customer_segment_memberships
      WHERE customer_profile_id = v_profile.id
        AND segment_id = (SELECT id FROM public.customer_segments WHERE name = p_action->>'value' LIMIT 1);
    WHEN 'update_lifecycle_stage' THEN
      UPDATE public.customer_profiles
      SET lifecycle_stage = p_action->>'value',
          previous_stage = lifecycle_stage,
          stage_updated_at = now()
      WHERE id = v_profile.id;
    WHEN 'mark_milestone' THEN
      INSERT INTO public.user_milestones (customer_profile_id, milestone_key, unlocked_at)
      VALUES (v_profile.id, p_action->>'value', now())
      ON CONFLICT (customer_profile_id, milestone_key) DO NOTHING;
    WHEN 'recommendation' THEN
      INSERT INTO public.user_recommendations (user_id, recommendation_key, context, created_at)
      VALUES (p_user_id, p_action->>'value', p_action->'context', now());
    WHEN 'admin_notification' THEN
      INSERT INTO public.admin_user_notes (user_id, admin_id, note, created_at)
      VALUES (p_user_id, null, p_action->>'message', now());
    WHEN 'internal_note' THEN
      INSERT INTO public.admin_user_notes (user_id, admin_id, note, created_at)
      VALUES (p_user_id, null, p_action->>'message', now());
    WHEN 'webhook' THEN
      v_result := jsonb_build_object('success', true, 'queued', true, 'url', p_action->>'url');
    ELSE
      v_result := jsonb_build_object('success', true, 'noop', true);
  END CASE;

  RETURN v_result;
END;
$function$;