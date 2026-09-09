-- Enterprise dashboard executive summary RPC and supporting schema changes

-- Add is_active flag to api_keys for consistent revoked/ active queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'api_keys' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.api_keys ADD COLUMN is_active boolean NOT NULL DEFAULT true;
  END IF;
END
$$;

UPDATE public.api_keys SET is_active = false WHERE revoked_at IS NOT NULL AND is_active = true;

-- Add display_name alias to profiles for enterprise UI consistency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN display_name text;
  END IF;
END
$$;

-- Extend security_event_type enum for invitation abuse tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'security_event_type' AND e.enumlabel = 'invitation_abuse'
  ) THEN
    ALTER TYPE public.security_event_type ADD VALUE 'invitation_abuse';
  END IF;
END
$$;

-- Indexes for dashboard and security analytics
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_feeds_org_created') THEN
    CREATE INDEX idx_activity_feeds_org_created ON public.activity_feeds (organization_id, created_at DESC);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_security_events_org_detected') THEN
    CREATE INDEX idx_security_events_org_detected ON public.security_events (organization_id, detected_at DESC);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_security_alerts_org_status') THEN
    CREATE INDEX idx_security_alerts_org_status ON public.security_alerts (organization_id, status);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_logs_org_created') THEN
    CREATE INDEX idx_audit_logs_org_created ON public.audit_logs (organization_id, created_at DESC);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_login_history_user_created') THEN
    CREATE INDEX idx_login_history_user_created ON public.login_history (user_id, created_at DESC);
  END IF;
END
$$;

-- Storage quota mapping by plan (bytes)
CREATE OR REPLACE FUNCTION public.organization_storage_quota(p_plan text)
RETURNS bigint AS $$
BEGIN
  RETURN CASE lower(coalesce(p_plan, 'team'))
    WHEN 'enterprise' THEN 1099511627776::bigint
    WHEN 'business' THEN 549755813888::bigint
    WHEN 'team' THEN 10737418240::bigint
    WHEN 'personal' THEN 1073741824::bigint
    ELSE 10737418240::bigint
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;

-- Comprehensive executive dashboard summary for an organization
CREATE OR REPLACE FUNCTION public.get_organization_dashboard_summary(p_org_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_org jsonb;
  v_metrics public.enterprise_dashboard_metrics;
  v_owner jsonb;
  v_billing jsonb;

  v_total_members bigint;
  v_active_users_30d bigint;
  v_mfa_enabled_count bigint;

  v_failed_logins bigint;
  v_suspicious_logins bigint;
  v_password_resets bigint;
  v_role_changes bigint;
  v_api_key_creations bigint;
  v_invitation_abuse bigint;
  v_open_alerts bigint;

  v_security_score int;
  v_seats_total int;

  v_api_quota bigint;
  v_api_used bigint;
  v_storage_quota bigint;

  v_start_date timestamptz;
BEGIN
  v_start_date := date_trunc('day', now() - interval '29 days');

  SELECT jsonb_build_object(
    'id', o.id,
    'name', o.name,
    'logo_url', o.logo_url,
    'plan', o.plan,
    'status', o.status,
    'created_at', o.created_at,
    'owner_id', o.owner_id,
    'max_members', o.max_members,
    'mfa_required', o.mfa_required
  ) INTO v_org
  FROM public.organizations o
  WHERE o.id = p_org_id;

  SELECT * INTO v_metrics FROM public.get_enterprise_dashboard_metrics(p_org_id);

  SELECT jsonb_build_object(
    'id', p.id,
    'display_name', COALESCE(p.display_name, p.full_name, ''),
    'email', p.email,
    'avatar_url', p.avatar_url
  ) INTO v_owner
  FROM public.profiles p
  WHERE p.id = (v_org->>'owner_id')::uuid;

  SELECT jsonb_build_object(
    'plan', b.plan,
    'status', b.status,
    'next_billing_date', b.next_billing_date
  ) INTO v_billing
  FROM public.organization_billing b
  WHERE b.organization_id = p_org_id;

  SELECT count(*) FILTER (WHERE m.status = 'active'),
         count(*) FILTER (WHERE m.status = 'active' AND p.last_login_at > now() - interval '30 days')
  INTO v_total_members, v_active_users_30d
  FROM public.organization_members m
  JOIN public.profiles p ON p.id = m.user_id
  WHERE m.organization_id = p_org_id;

  SELECT count(*) INTO v_mfa_enabled_count
  FROM public.organization_members m
  JOIN public.profiles p ON p.id = m.user_id
  WHERE m.organization_id = p_org_id AND m.status = 'active' AND p.mfa_enabled = true;

  SELECT count(*) FILTER (WHERE event_type = 'login_failure'),
         count(*) FILTER (WHERE event_type = 'suspicious_login'),
         count(*) FILTER (WHERE event_type = 'password_changed'),
         count(*) FILTER (WHERE event_type = 'permission_changed'),
         count(*) FILTER (WHERE event_type = 'api_key_created'),
         count(*) FILTER (WHERE event_type = 'invitation_abuse')
  INTO v_failed_logins, v_suspicious_logins, v_password_resets, v_role_changes, v_api_key_creations, v_invitation_abuse
  FROM public.security_events
  WHERE organization_id = p_org_id AND detected_at > now() - interval '30 days';

  SELECT count(*) INTO v_open_alerts
  FROM public.security_alerts
  WHERE organization_id = p_org_id AND status = 'open';

  v_seats_total := COALESCE((v_org->>'max_members')::int, 10);

  v_security_score := 100;
  IF v_total_members > 0 THEN
    v_security_score := v_security_score - ((v_total_members - v_mfa_enabled_count) * 20 / v_total_members);
  END IF;
  v_security_score := v_security_score
    - LEAST(v_failed_logins * 2, 20)
    - LEAST(v_suspicious_logins * 5, 25)
    - LEAST(v_open_alerts * 5, 20)
    - LEAST(v_invitation_abuse * 10, 20);
  IF v_security_score < 0 THEN v_security_score := 0; END IF;
  IF v_security_score > 100 THEN v_security_score := 100; END IF;

  SELECT COALESCE(SUM(q.quota), 0), COALESCE(SUM(q.used), 0)
  INTO v_api_quota, v_api_used
  FROM public.workspace_api_quotas q
  JOIN public.workspaces w ON q.workspace_id = w.id
  WHERE w.organization_id = p_org_id;

  v_storage_quota := public.organization_storage_quota(v_org->>'plan');

  RETURN jsonb_build_object(
    'organization', v_org,
    'owner', v_owner,
    'billing', v_billing,
    'metrics', to_jsonb(v_metrics),

    'total_members', v_total_members,
    'active_users_30d', v_active_users_30d,
    'pending_invitations', (v_metrics).pending_invitations,
    'departments_count', (v_metrics).departments_count,
    'teams_count', (v_metrics).teams_count,
    'workspaces_count', (v_metrics).workspaces_count,
    'api_calls_30d', (v_metrics).api_calls_30d,
    'api_quota', v_api_quota,
    'api_used', v_api_used,
    'storage_bytes', (v_metrics).storage_bytes,
    'storage_quota', v_storage_quota,
    'new_members_this_month', (v_metrics).new_members_this_month,
    'seats_used', v_total_members,
    'seats_total', v_seats_total,

    'security_score', v_security_score,
    'mfa_adoption', jsonb_build_object('enabled', v_mfa_enabled_count, 'total', v_total_members),
    'failed_logins_30d', v_failed_logins,
    'suspicious_logins_30d', v_suspicious_logins,
    'password_resets_30d', v_password_resets,
    'role_changes_30d', v_role_changes,
    'api_key_creations_30d', v_api_key_creations,
    'invitation_abuse_30d', v_invitation_abuse,
    'open_security_alerts', v_open_alerts,

    'recent_logins', (v_metrics).recent_logins,
    'recent_security_events', (v_metrics).recent_security_events,
    'recent_activity', (v_metrics).recent_activity,

    'charts', jsonb_build_object(
      'member_growth', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('date', d::date, 'members', c) ORDER BY d), '[]'::jsonb)
        FROM generate_series(v_start_date, now(), interval '1 day') d
        LEFT JOIN LATERAL (
          SELECT count(*)::int c
          FROM public.organization_members
          WHERE organization_id = p_org_id AND status = 'active' AND joined_at <= d
        ) m ON true
      ),
      'api_usage', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('date', d::date, 'calls', c) ORDER BY d), '[]'::jsonb)
        FROM generate_series(v_start_date, now(), interval '1 day') d
        LEFT JOIN LATERAL (
          SELECT count(*)::int c
          FROM public.api_usage_logs u
          JOIN public.organization_members m ON m.user_id = u.user_id
          WHERE m.organization_id = p_org_id AND date_trunc('day', u.created_at) = d
        ) u ON true
      ),
      'login_activity', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('date', d::date, 'logins', c) ORDER BY d), '[]'::jsonb)
        FROM generate_series(v_start_date, now(), interval '1 day') d
        LEFT JOIN LATERAL (
          SELECT count(*)::int c
          FROM public.login_history lh
          JOIN public.organization_members m ON m.user_id = lh.user_id AND m.organization_id = p_org_id
          WHERE lh.success = true AND date_trunc('day', lh.created_at) = d
        ) l ON true
      ),
      'workspace_growth', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('date', d::date, 'workspaces', c) ORDER BY d), '[]'::jsonb)
        FROM generate_series(v_start_date, now(), interval '1 day') d
        LEFT JOIN LATERAL (
          SELECT count(*)::int c
          FROM public.workspaces
          WHERE organization_id = p_org_id AND status = 'active' AND created_at <= d
        ) w ON true
      ),
      'storage_growth', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('date', d::date, 'bytes', c) ORDER BY d), '[]'::jsonb)
        FROM generate_series(v_start_date, now(), interval '1 day') d
        LEFT JOIN LATERAL (
          SELECT COALESCE(SUM(((so.metadata->>'size')::bigint)), 0)::bigint c
          FROM storage.objects so
          JOIN public.organization_members m ON m.user_id = so.owner::uuid
          WHERE m.organization_id = p_org_id AND so.metadata ? 'size' AND so.created_at <= d
        ) s ON true
      ),
      'invitations', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('date', d::date, 'sent', s.c, 'accepted', a.c) ORDER BY d), '[]'::jsonb)
        FROM generate_series(v_start_date, now(), interval '1 day') d
        LEFT JOIN LATERAL (
          SELECT count(*)::int c FROM public.organization_invitations
          WHERE organization_id = p_org_id AND date_trunc('day', created_at) = d
        ) s ON true
        LEFT JOIN LATERAL (
          SELECT count(*)::int c FROM public.organization_invitations
          WHERE organization_id = p_org_id AND status = 'accepted' AND date_trunc('day', accepted_at) = d
        ) a ON true
      )
    )
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;