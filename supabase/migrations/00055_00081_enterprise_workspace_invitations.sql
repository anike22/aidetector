-- 00081: Enterprise Workspace Invitation & Member Enhancements
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Invitation lifecycle status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invitation_status') THEN
    CREATE TYPE invitation_status AS ENUM (
      'pending','delivered','opened','accepted','declined','expired','revoked','failed','resent'
    );
  END IF;
END$$;

-- Extend member status enum to support removal
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'organization_member_status' AND e.enumlabel = 'removed'
  ) THEN
    ALTER TYPE organization_member_status ADD VALUE 'removed';
  END IF;
END$$;

-- Enhance organization_invitations with full lifecycle tracking
ALTER TABLE public.organization_invitations
  ADD COLUMN status invitation_status NOT NULL DEFAULT 'pending',
  ADD COLUMN department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  ADD COLUMN message text,
  ADD COLUMN delivery_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN audit_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN opened_at timestamptz,
  ADD COLUMN resent_at timestamptz,
  ADD COLUMN revoked_at timestamptz,
  ADD COLUMN declined_at timestamptz,
  ADD COLUMN failed_at timestamptz;

-- Backfill existing invitations and drop the default to enforce explicit inserts
UPDATE public.organization_invitations
SET status = CASE
  WHEN accepted_at IS NOT NULL THEN 'accepted'::invitation_status
  WHEN expires_at < now() THEN 'expired'::invitation_status
  ELSE 'pending'::invitation_status
END
WHERE status = 'pending';

ALTER TABLE public.organization_invitations ALTER COLUMN status DROP DEFAULT;

-- Indexes for invitation lifecycle performance
CREATE INDEX IF NOT EXISTS idx_org_invitations_org_status ON public.organization_invitations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_org_invitations_email_lower ON public.organization_invitations USING btree (lower(email));
CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON public.organization_invitations(token);
CREATE INDEX IF NOT EXISTS idx_org_invitations_expires ON public.organization_invitations(expires_at);

-- Enhance organization_members for audit and login tracking
ALTER TABLE public.organization_members
  ADD COLUMN removed_at timestamptz,
  ADD COLUMN removed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN last_login_at timestamptz;

-- Organization-level invitation settings
ALTER TABLE public.organizations
  ADD COLUMN invitation_settings jsonb NOT NULL DEFAULT '{
    "default_expiration_days": 7,
    "require_email_verification": false,
    "allow_self_service_role_changes": false,
    "enable_invitation_resend": true,
    "max_pending_invitations": 100
  }'::jsonb;

-- Backfill from existing settings JSON if present
UPDATE public.organizations
SET invitation_settings = COALESCE(settings->'invitation_settings', invitation_settings)
WHERE settings ? 'invitation_settings';

-- Return type for public invitation lookup
CREATE OR REPLACE FUNCTION public.get_organization_invitation_by_token(p_token text)
RETURNS TABLE (
  id uuid,
  organization_id uuid,
  org_name text,
  org_logo_url text,
  inviter_name text,
  inviter_email text,
  invitee_email text,
  role text,
  department_id uuid,
  department_name text,
  team_id uuid,
  team_name text,
  workspace_id uuid,
  workspace_name text,
  message text,
  status invitation_status,
  expires_at timestamptz,
  created_at timestamptz,
  accepted_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.organization_id,
    o.name,
    o.logo_url,
    COALESCE(p.full_name, p.display_name, '')::text,
    p.email::text,
    i.email,
    i.role::text,
    i.department_id,
    d.name,
    i.team_id,
    t.name,
    i.workspace_id,
    w.name,
    i.message,
    i.status,
    i.expires_at,
    i.created_at,
    i.accepted_at
  FROM public.organization_invitations i
  JOIN public.organizations o ON o.id = i.organization_id
  LEFT JOIN public.profiles p ON p.id = i.invited_by
  LEFT JOIN public.departments d ON d.id = i.department_id
  LEFT JOIN public.teams t ON t.id = i.team_id
  LEFT JOIN public.workspaces w ON w.id = i.workspace_id
  WHERE i.token = p_token;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Improved invitation acceptance: validate status, assign department/team/workspace, audit
CREATE OR REPLACE FUNCTION public.accept_organization_invitation(p_token text)
RETURNS uuid AS $$
DECLARE
  v_invite public.organization_invitations%ROWTYPE;
  v_membership public.organization_members%ROWTYPE;
BEGIN
  SELECT * INTO v_invite FROM public.organization_invitations WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;
  IF v_invite.status = 'accepted' THEN
    RAISE EXCEPTION 'Invitation already accepted';
  END IF;
  IF v_invite.status IN ('revoked','expired','declined','failed') THEN
    RAISE EXCEPTION 'Invitation is no longer valid';
  END IF;
  IF v_invite.expires_at < now() THEN
    UPDATE public.organization_invitations SET status = 'expired' WHERE id = v_invite.id;
    RAISE EXCEPTION 'Invitation expired';
  END IF;

  INSERT INTO public.organization_members (
    organization_id, user_id, role, status, invited_by, invited_at, joined_at,
    department_ids, team_ids, last_login_at
  )
  VALUES (
    v_invite.organization_id, auth.uid(), v_invite.role, 'active', v_invite.invited_by,
    v_invite.created_at, now(),
    CASE WHEN v_invite.department_id IS NOT NULL THEN jsonb_build_array(v_invite.department_id) ELSE '[]'::jsonb END,
    CASE WHEN v_invite.team_id IS NOT NULL THEN jsonb_build_array(v_invite.team_id) ELSE '[]'::jsonb END,
    now()
  )
  ON CONFLICT (organization_id, user_id) DO UPDATE SET
    status = 'active',
    role = v_invite.role,
    department_ids = CASE WHEN v_invite.department_id IS NOT NULL THEN jsonb_build_array(v_invite.department_id) ELSE EXCLUDED.department_ids END,
    team_ids = CASE WHEN v_invite.team_id IS NOT NULL THEN jsonb_build_array(v_invite.team_id) ELSE EXCLUDED.team_ids END,
    invited_by = COALESCE(organization_members.invited_by, v_invite.invited_by),
    invited_at = COALESCE(organization_members.invited_at, v_invite.created_at),
    joined_at = COALESCE(organization_members.joined_at, now()),
    removed_at = NULL,
    removed_by = NULL,
    updated_at = now();

  SELECT * INTO v_membership FROM public.organization_members
  WHERE organization_id = v_invite.organization_id AND user_id = auth.uid();

  -- Add to workspace if specified
  IF v_invite.workspace_id IS NOT NULL THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role, status, added_by, added_at)
    VALUES (v_invite.workspace_id, auth.uid(), 'contributor', 'active', v_invite.invited_by, now())
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
  END IF;

  UPDATE public.organization_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = v_invite.id;

  INSERT INTO public.audit_logs (organization_id, user_id, action, resource_type, resource_id, details, category, severity)
  VALUES (
    v_invite.organization_id, auth.uid(), 'invitation_accepted', 'organization_invitation', v_invite.id,
    jsonb_build_object('email', v_invite.email, 'role', v_invite.role, 'department_id', v_invite.department_id, 'team_id', v_invite.team_id),
    'user_management', 'info'
  );

  INSERT INTO public.activity_feeds (organization_id, user_id, action, resource_type, resource_id, metadata)
  VALUES (
    v_invite.organization_id, auth.uid(), 'member_joined', 'organization_member', v_membership.id,
    jsonb_build_object('email', v_invite.email, 'role', v_invite.role)
  );

  RETURN v_invite.organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Audit trigger for organization member changes
CREATE OR REPLACE FUNCTION public.handle_organization_member_change()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      INSERT INTO public.audit_logs (organization_id, user_id, action, resource_type, resource_id, details, category, severity)
      VALUES (
        NEW.organization_id, auth.uid(), 'role_changed', 'organization_member', NEW.id,
        jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role),
        'user_management', 'info'
      );
    END IF;
    IF NEW.department_ids IS DISTINCT FROM OLD.department_ids THEN
      INSERT INTO public.audit_logs (organization_id, user_id, action, resource_type, resource_id, details, category, severity)
      VALUES (
        NEW.organization_id, auth.uid(), 'department_changed', 'organization_member', NEW.id,
        jsonb_build_object('old_department_ids', OLD.department_ids, 'new_department_ids', NEW.department_ids),
        'user_management', 'info'
      );
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.audit_logs (organization_id, user_id, action, resource_type, resource_id, details, category, severity)
      VALUES (
        NEW.organization_id, auth.uid(), 'member_status_changed', 'organization_member', NEW.id,
        jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status),
        'user_management', CASE WHEN NEW.status = 'suspended' THEN 'warning' ELSE 'info' END
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_organization_member_audit ON public.organization_members;
CREATE TRIGGER trg_organization_member_audit
  AFTER UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_organization_member_change();

-- Update member + profile last login timestamps on successful login history entry
CREATE OR REPLACE FUNCTION public.handle_login_history_insert()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles SET last_login_at = NEW.created_at, last_login_date = NEW.created_at WHERE id = NEW.user_id;
  UPDATE public.organization_members SET last_login_at = NEW.created_at
  WHERE user_id = NEW.user_id AND status = 'active';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_login_history_member ON public.login_history;
CREATE TRIGGER trg_login_history_member
  AFTER INSERT ON public.login_history
  FOR EACH ROW
  WHEN (NEW.success = true)
  EXECUTE FUNCTION public.handle_login_history_insert();

-- Expire stale invitations
CREATE OR REPLACE FUNCTION public.expire_organization_invitations()
RETURNS void AS $$
BEGIN
  UPDATE public.organization_invitations
  SET status = 'expired'::invitation_status
  WHERE status IN ('pending','delivered','opened','resent') AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

SELECT cron.schedule(
  'expire-organization-invitations',
  '0 * * * *',
  'SELECT public.expire_organization_invitations();'
);

-- Enterprise dashboard metrics return type and RPC
DROP TYPE IF EXISTS public.enterprise_dashboard_metrics CASCADE;
CREATE TYPE public.enterprise_dashboard_metrics AS (
  total_members bigint,
  active_users bigint,
  pending_invitations bigint,
  departments_count bigint,
  teams_count bigint,
  workspaces_count bigint,
  api_calls_30d bigint,
  new_members_this_month bigint,
  storage_objects bigint,
  storage_bytes bigint,
  recent_logins jsonb,
  recent_security_events jsonb,
  recent_activity jsonb
);

CREATE OR REPLACE FUNCTION public.get_enterprise_dashboard_metrics(p_org_id uuid)
RETURNS public.enterprise_dashboard_metrics AS $$
DECLARE
  v_result public.enterprise_dashboard_metrics;
BEGIN
  SELECT
    COALESCE((SELECT count(*) FROM public.organization_members WHERE organization_id = p_org_id AND status = 'active'), 0),
    COALESCE((SELECT count(*) FROM public.organization_members m
      JOIN public.profiles p ON p.id = m.user_id
      WHERE m.organization_id = p_org_id AND m.status = 'active' AND p.last_login_at > now() - interval '30 days'), 0),
    COALESCE((SELECT count(*) FROM public.organization_invitations
      WHERE organization_id = p_org_id AND status IN ('pending','delivered','opened','resent')), 0),
    COALESCE((SELECT count(*) FROM public.departments WHERE organization_id = p_org_id), 0),
    COALESCE((SELECT count(*) FROM public.teams WHERE organization_id = p_org_id), 0),
    COALESCE((SELECT count(*) FROM public.workspaces WHERE organization_id = p_org_id), 0),
    COALESCE((SELECT count(*) FROM public.api_usage_logs u
      JOIN public.organization_members m ON m.user_id = u.user_id
      WHERE m.organization_id = p_org_id AND u.created_at > now() - interval '30 days'), 0),
    COALESCE((SELECT count(*) FROM public.organization_members
      WHERE organization_id = p_org_id AND status = 'active' AND joined_at >= date_trunc('month', now())), 0),
    COALESCE((SELECT count(*) FROM storage.objects so
      JOIN public.organization_members m ON m.user_id = so.owner::uuid
      WHERE m.organization_id = p_org_id), 0),
    COALESCE((SELECT sum(((so.metadata->>'size')::bigint)) FROM storage.objects so
      JOIN public.organization_members m ON m.user_id = so.owner::uuid
      WHERE m.organization_id = p_org_id AND so.metadata ? 'size'), 0),
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object('email', p.email, 'display_name', COALESCE(p.display_name, p.full_name, ''), 'last_login_at', p.last_login_at) ORDER BY p.last_login_at DESC NULLS LAST)
      FROM public.organization_members m
      JOIN public.profiles p ON p.id = m.user_id
      WHERE m.organization_id = p_org_id AND m.status = 'active'
      ORDER BY p.last_login_at DESC NULLS LAST LIMIT 10
    ), '[]'::jsonb),
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object('event_type', se.event_type, 'severity', se.severity, 'detected_at', se.detected_at, 'details', se.details) ORDER BY se.detected_at DESC)
      FROM public.security_events se
      WHERE se.organization_id = p_org_id
      ORDER BY se.detected_at DESC LIMIT 5
    ), '[]'::jsonb),
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object('action', af.action, 'resource_type', af.resource_type, 'metadata', af.metadata, 'created_at', af.created_at, 'email', p.email, 'display_name', COALESCE(p.display_name, p.full_name, '')) ORDER BY af.created_at DESC)
      FROM public.activity_feeds af
      LEFT JOIN public.profiles p ON p.id = af.user_id
      WHERE af.organization_id = p_org_id
      ORDER BY af.created_at DESC LIMIT 10
    ), '[]'::jsonb)
  INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Helper to record enterprise activities and notifications
CREATE OR REPLACE FUNCTION public.record_enterprise_event(
  p_organization_id uuid,
  p_user_id uuid,
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.activity_feeds (organization_id, user_id, action, resource_type, resource_id, metadata)
  VALUES (p_organization_id, p_user_id, p_action, p_resource_type, p_resource_id, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
