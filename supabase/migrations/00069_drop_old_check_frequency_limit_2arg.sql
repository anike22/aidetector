DROP FUNCTION IF EXISTS public.check_frequency_limit(uuid, text);

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
  v_result jsonb := jsonb_build_object('success', true);
  v_allowed boolean := true;
  v_tag_id uuid;
  v_segment_id uuid;
  v_product_tips boolean := true;
  v_feature_updates boolean := true;
  v_security_notifications boolean := true;
  v_billing_notifications boolean := true;
  v_marketing_communications boolean := true;
  v_weekly_summaries boolean := true;
  v_email_enabled boolean := true;
  v_in_app_enabled boolean := true;
  v_dashboard_announcements_enabled boolean := true;
BEGIN
  SELECT * INTO v_profile FROM public.customer_profiles WHERE user_id = p_user_id LIMIT 1;

  SELECT
    product_tips,
    feature_updates,
    security_notifications,
    billing_notifications,
    marketing_communications,
    weekly_summaries,
    email_enabled,
    in_app_enabled,
    dashboard_announcements_enabled
  INTO
    v_product_tips,
    v_feature_updates,
    v_security_notifications,
    v_billing_notifications,
    v_marketing_communications,
    v_weekly_summaries,
    v_email_enabled,
    v_in_app_enabled,
    v_dashboard_announcements_enabled
  FROM public.communication_preferences
  WHERE user_id = p_user_id;

  IF v_category IN ('product_tips','feature_updates','marketing_communications','weekly_summaries') THEN
    v_allowed := CASE v_category
      WHEN 'product_tips' THEN v_product_tips
      WHEN 'feature_updates' THEN v_feature_updates
      WHEN 'marketing_communications' THEN v_marketing_communications
      WHEN 'weekly_summaries' THEN v_weekly_summaries
      ELSE true
    END;
  ELSIF v_category IN ('security_notifications','billing_notifications') THEN
    v_allowed := true;
  END IF;

  IF NOT v_allowed THEN
    RETURN jsonb_build_object('success', true, 'skipped', true, 'reason', 'preference_disabled');
  END IF;

  IF NOT public.check_frequency_limit(p_user_id) THEN
    RETURN jsonb_build_object('success', true, 'skipped', true, 'reason', 'frequency_limit');
  END IF;

  CASE v_action_type
    WHEN 'in_app_notification' THEN
      IF v_in_app_enabled THEN
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
      IF v_dashboard_announcements_enabled THEN
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