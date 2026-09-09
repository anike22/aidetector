-- Phase 6: Team Workspace, Collaboration & Enterprise Platform
-- Multi-tenant schema with role-based access control

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_plan') THEN
    CREATE TYPE organization_plan AS ENUM ('team', 'business', 'enterprise');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_status') THEN
    CREATE TYPE organization_status AS ENUM ('active', 'suspended', 'deleted');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_role') THEN
    CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'member');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_member_status') THEN
    CREATE TYPE organization_member_status AS ENUM ('active', 'invited', 'suspended');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workspace_role') THEN
    CREATE TYPE workspace_role AS ENUM ('admin', 'manager', 'editor', 'contributor', 'viewer');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workspace_member_status') THEN
    CREATE TYPE workspace_member_status AS ENUM ('active', 'invited', 'suspended', 'inactive');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
    CREATE TYPE project_status AS ENUM ('active', 'completed', 'archived', 'deleted');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'template_type') THEN
    CREATE TYPE template_type AS ENUM ('detection', 'humanization', 'grammar', 'plagiarism', 'api');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'guideline_category') THEN
    CREATE TYPE guideline_category AS ENUM ('tone', 'style', 'terminology', 'formatting', 'reading_level', 'ai_risk');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_trigger') THEN
    CREATE TYPE workflow_trigger AS ENUM ('manual', 'auto_high_ai_score', 'auto_public_content');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
    CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'step_status') THEN
    CREATE TYPE step_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sso_provider') THEN
    CREATE TYPE sso_provider AS ENUM ('google_workspace', 'microsoft_entra_id', 'okta', 'onelogin', 'saml', 'oidc');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_type') THEN
    CREATE TYPE compliance_type AS ENUM ('gdpr', 'ccpa', 'ferpa', 'soc2', 'iso27001');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_status') THEN
    CREATE TYPE compliance_status AS ENUM ('compliant', 'non_compliant', 'in_progress');
  END IF;
END$$;

-- Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plan organization_plan NOT NULL DEFAULT 'team',
  status organization_status NOT NULL DEFAULT 'active',
  domain text,
  industry text,
  country text,
  timezone text DEFAULT 'UTC',
  settings jsonb NOT NULL DEFAULT '{}',
  billing_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Organization invitations
CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role organization_role NOT NULL DEFAULT 'member',
  token text NOT NULL UNIQUE,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  UNIQUE (organization_id, email)
);

-- Organization members
CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role organization_role NOT NULL DEFAULT 'member',
  status organization_member_status NOT NULL DEFAULT 'active',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at timestamptz,
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

-- Workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  status organization_status NOT NULL DEFAULT 'active',
  settings jsonb NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

-- Workspace members
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role workspace_role NOT NULL DEFAULT 'contributor',
  permissions jsonb NOT NULL DEFAULT '[]',
  status workspace_member_status NOT NULL DEFAULT 'active',
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

-- Workspace projects
CREATE TABLE IF NOT EXISTS public.workspace_projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status project_status NOT NULL DEFAULT 'active',
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Collaboration reports (generic shared artifacts across tools)
CREATE TABLE IF NOT EXISTS public.collaboration_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.workspace_projects(id) ON DELETE SET NULL,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  tool_type text NOT NULL DEFAULT 'detector',
  external_report_id text,
  content_snapshot jsonb,
  result_snapshot jsonb,
  brand_compliance jsonb,
  status text NOT NULL DEFAULT 'active',
  approval_status text NOT NULL DEFAULT 'none',
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Project reports junction
CREATE TABLE IF NOT EXISTS public.project_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.workspace_projects(id) ON DELETE CASCADE,
  report_id uuid NOT NULL REFERENCES public.collaboration_reports(id) ON DELETE CASCADE,
  added_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, report_id)
);

-- Shared templates
CREATE TABLE IF NOT EXISTS public.shared_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  template_type template_type NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Brand guidelines
CREATE TABLE IF NOT EXISTS public.brand_guidelines (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  category guideline_category NOT NULL,
  content text NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Approval workflows
CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  steps jsonb NOT NULL DEFAULT '[]',
  trigger_condition workflow_trigger NOT NULL DEFAULT 'manual',
  enabled boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Report approvals
CREATE TABLE IF NOT EXISTS public.report_approvals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id uuid NOT NULL REFERENCES public.collaboration_reports(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
  current_step integer NOT NULL DEFAULT 0,
  status approval_status NOT NULL DEFAULT 'pending',
  submitted_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, workflow_id)
);

-- Approval steps
CREATE TABLE IF NOT EXISTS public.approval_steps (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  approval_id uuid NOT NULL REFERENCES public.report_approvals(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  approver_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approver_role workspace_role,
  status step_status NOT NULL DEFAULT 'pending',
  comments text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (approval_id, step_order)
);

-- Report comments
CREATE TABLE IF NOT EXISTS public.report_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id uuid NOT NULL REFERENCES public.collaboration_reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_comment_id uuid REFERENCES public.report_comments(id) ON DELETE CASCADE,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Report mentions
CREATE TABLE IF NOT EXISTS public.report_mentions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id uuid NOT NULL REFERENCES public.report_comments(id) ON DELETE CASCADE,
  mentioned_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, mentioned_user_id)
);

-- Report shares
CREATE TABLE IF NOT EXISTS public.report_shares (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id uuid NOT NULL REFERENCES public.collaboration_reports(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  permission text NOT NULL DEFAULT 'view',
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Report collections
CREATE TABLE IF NOT EXISTS public.report_collections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Collection items
CREATE TABLE IF NOT EXISTS public.collection_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id uuid NOT NULL REFERENCES public.report_collections(id) ON DELETE CASCADE,
  report_id uuid NOT NULL REFERENCES public.collaboration_reports(id) ON DELETE CASCADE,
  added_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (collection_id, report_id)
);

-- SSO configurations
CREATE TABLE IF NOT EXISTS public.sso_configurations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider sso_provider NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  domain text,
  settings jsonb NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider)
);

-- Compliance records
CREATE TABLE IF NOT EXISTS public.compliance_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  compliance_type compliance_type NOT NULL,
  status compliance_status NOT NULL DEFAULT 'in_progress',
  findings jsonb NOT NULL DEFAULT '[]',
  last_audit_date timestamptz,
  next_audit_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, compliance_type)
);

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  ip_address text,
  user_agent text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Organization billing
CREATE TABLE IF NOT EXISTS public.organization_billing (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan organization_plan NOT NULL DEFAULT 'team',
  billing_email text,
  billing_contact jsonb,
  tax_info jsonb,
  invoice_history jsonb NOT NULL DEFAULT '[]',
  payment_method jsonb,
  next_billing_date date,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Workspace API quotas
CREATE TABLE IF NOT EXISTS public.workspace_api_quotas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
  quota bigint NOT NULL DEFAULT 0,
  used bigint NOT NULL DEFAULT 0,
  reset_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_org ON public.workspaces(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON public.workspace_projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_reports_workspace ON public.collaboration_reports(workspace_id);
CREATE INDEX IF NOT EXISTS idx_reports_project ON public.collaboration_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON public.collaboration_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_project_reports_project ON public.project_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_workspace ON public.approval_workflows(workspace_id);
CREATE INDEX IF NOT EXISTS idx_report_approvals_report ON public.report_approvals(report_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_approval ON public.approval_steps(approval_id);
CREATE INDEX IF NOT EXISTS idx_report_comments_report ON public.report_comments(report_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);

-- Helper functions for role/permission checks (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_org_role(p_org_id uuid, p_user_id uuid)
RETURNS text AS $$
  SELECT role::text
  FROM public.organization_members
  WHERE organization_id = p_org_id AND user_id = p_user_id AND status = 'active'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(public.get_org_role(p_org_id, p_user_id), '') IN ('owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id AND user_id = p_user_id AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_workspace_role(p_workspace_id uuid, p_user_id uuid)
RETURNS text AS $$
  SELECT role::text
  FROM public.workspace_members
  WHERE workspace_id = p_workspace_id AND user_id = p_user_id AND status = 'active'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_workspace_admin(p_workspace_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(public.get_workspace_role(p_workspace_id, p_user_id), '') IN ('admin', 'owner');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id AND user_id = p_user_id AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_view_report(p_report_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.collaboration_reports r
    WHERE r.id = p_report_id
      AND (
        public.is_workspace_member(r.workspace_id, p_user_id)
        OR EXISTS (
          SELECT 1 FROM public.report_shares s
          WHERE s.report_id = p_report_id AND s.user_id = p_user_id
        )
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers to auto-add creators as members
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role, status, joined_at)
  VALUES (NEW.id, NEW.owner_id, 'owner', 'active', now());
  INSERT INTO public.organization_billing (organization_id, plan)
  VALUES (NEW.id, NEW.plan)
  ON CONFLICT (organization_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_new_organization ON public.organizations;
CREATE TRIGGER trg_new_organization
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization();

CREATE OR REPLACE FUNCTION public.handle_new_workspace()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role, status, added_by, added_at)
  VALUES (NEW.id, NEW.created_by, 'admin', 'active', NEW.created_by, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_new_workspace ON public.workspaces;
CREATE TRIGGER trg_new_workspace
  AFTER INSERT ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_workspace();

-- RPC: accept organization invitation
CREATE OR REPLACE FUNCTION public.accept_organization_invitation(p_token text)
RETURNS uuid AS $$
DECLARE
  v_invite public.organization_invitations%ROWTYPE;
  v_org_id uuid;
BEGIN
  SELECT * INTO v_invite FROM public.organization_invitations WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;
  IF v_invite.accepted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Invitation already accepted';
  END IF;
  IF v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'Invitation expired';
  END IF;
  INSERT INTO public.organization_members (organization_id, user_id, role, status, joined_at)
  VALUES (v_invite.organization_id, auth.uid(), v_invite.role, 'active', now())
  ON CONFLICT (organization_id, user_id) DO UPDATE SET status = 'active', role = v_invite.role, updated_at = now();
  UPDATE public.organization_invitations SET accepted_at = now() WHERE id = v_invite.id;
  INSERT INTO public.audit_logs (organization_id, user_id, action, resource_type, resource_id, details)
  VALUES (v_invite.organization_id, auth.uid(), 'invitation_accepted', 'organization_invitation', v_invite.id, jsonb_build_object('email', v_invite.email));
  RETURN v_invite.organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: log audit event
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_organization_id uuid,
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.audit_logs (organization_id, user_id, action, resource_type, resource_id, details)
  VALUES (p_organization_id, auth.uid(), p_action, p_resource_type, p_resource_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: submit report for approval
CREATE OR REPLACE FUNCTION public.submit_report_for_approval(p_report_id uuid, p_workflow_id uuid)
RETURNS uuid AS $$
DECLARE
  v_approval_id uuid;
  v_step jsonb;
BEGIN
  IF NOT public.can_view_report(p_report_id) THEN
    RAISE EXCEPTION 'Not allowed to submit report for approval';
  END IF;
  INSERT INTO public.report_approvals (report_id, workflow_id, status, submitted_by, submitted_at)
  VALUES (p_report_id, p_workflow_id, 'pending', auth.uid(), now())
  RETURNING id INTO v_approval_id;
  FOR v_step IN SELECT jsonb_array_elements(steps) FROM public.approval_workflows WHERE id = p_workflow_id LOOP
    INSERT INTO public.approval_steps (approval_id, step_order, approver_user_id, approver_role)
    VALUES (
      v_approval_id,
      (v_step->>'step_order')::int,
      (v_step->>'approver_user_id')::uuid,
      (v_step->>'approver_role')::workspace_role
    );
  END LOOP;
  UPDATE public.collaboration_reports SET approval_status = 'pending' WHERE id = p_report_id;
  RETURN v_approval_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: decide approval step
CREATE OR REPLACE FUNCTION public.decide_approval_step(p_approval_id uuid, p_step_order integer, p_action text, p_comments text DEFAULT NULL)
RETURNS void AS $$
DECLARE
  v_report_id uuid;
  v_workspace_id uuid;
  v_workflow_id uuid;
  v_current integer;
  v_status approval_status;
  v_total integer;
BEGIN
  SELECT ra.report_id, ra.workflow_id, ra.current_step, ra.status INTO v_report_id, v_workflow_id, v_current, v_status
  FROM public.report_approvals ra WHERE ra.id = p_approval_id;
  IF v_status != 'pending' THEN
    RAISE EXCEPTION 'Approval already decided';
  END IF;
  SELECT workspace_id INTO v_workspace_id FROM public.collaboration_reports WHERE id = v_report_id;
  IF NOT public.is_workspace_admin(v_workspace_id) AND NOT EXISTS (
    SELECT 1 FROM public.approval_steps WHERE approval_id = p_approval_id AND step_order = p_step_order AND approver_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to decide this approval step';
  END IF;
  UPDATE public.approval_steps SET status = p_action::step_status, comments = p_comments, decided_at = now()
  WHERE approval_id = p_approval_id AND step_order = p_step_order;
  IF p_action = 'rejected' THEN
    UPDATE public.report_approvals SET status = 'rejected', completed_at = now() WHERE id = p_approval_id;
    UPDATE public.collaboration_reports SET approval_status = 'rejected' WHERE id = v_report_id;
  ELSE
    SELECT COUNT(*) INTO v_total FROM public.approval_steps WHERE approval_id = p_approval_id;
    IF p_step_order >= v_total THEN
      UPDATE public.report_approvals SET status = 'approved', current_step = p_step_order, completed_at = now() WHERE id = p_approval_id;
      UPDATE public.collaboration_reports SET approval_status = 'approved' WHERE id = v_report_id;
    ELSE
      UPDATE public.report_approvals SET current_step = p_step_order + 1 WHERE id = p_approval_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: organization analytics aggregation
CREATE OR REPLACE FUNCTION public.get_organization_analytics(p_org_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'workspace_count', (SELECT COUNT(*) FROM public.workspaces WHERE organization_id = p_org_id AND status = 'active'),
    'member_count', (SELECT COUNT(*) FROM public.organization_members WHERE organization_id = p_org_id AND status = 'active'),
    'report_count', (SELECT COUNT(*) FROM public.collaboration_reports r JOIN public.workspaces w ON r.workspace_id = w.id WHERE w.organization_id = p_org_id AND r.status = 'active'),
    'project_count', (SELECT COUNT(*) FROM public.workspace_projects p JOIN public.workspaces w ON p.workspace_id = w.id WHERE w.organization_id = p_org_id AND p.status = 'active'),
    'api_used', COALESCE((SELECT SUM(used) FROM public.workspace_api_quotas q JOIN public.workspaces w ON q.workspace_id = w.id WHERE w.organization_id = p_org_id), 0),
    'api_quota', COALESCE((SELECT SUM(quota) FROM public.workspace_api_quotas q JOIN public.workspaces w ON q.workspace_id = w.id WHERE w.organization_id = p_org_id), 0)
  ) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RLS enable
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_api_quotas ENABLE ROW LEVEL SECURITY;

-- Drop old policies if re-running
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN (
      'organizations','organization_invitations','organization_members','workspaces','workspace_members',
      'workspace_projects','collaboration_reports','project_reports','shared_templates','brand_guidelines',
      'approval_workflows','report_approvals','approval_steps','report_comments','report_mentions','report_shares',
      'report_collections','collection_items','sso_configurations','compliance_records','audit_logs',
      'organization_billing','workspace_api_quotas'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END$$;

-- Organizations policies
CREATE POLICY orgs_select_members ON public.organizations FOR SELECT TO authenticated
  USING (public.is_org_member(id) OR public.is_app_admin());
CREATE POLICY orgs_insert ON public.organizations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY orgs_update_admins ON public.organizations FOR UPDATE TO authenticated
  USING (public.is_org_admin(id)) WITH CHECK (public.is_org_admin(id));
CREATE POLICY orgs_delete_owner ON public.organizations FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Organization invitations policies
CREATE POLICY org_inv_select_admins ON public.organization_invitations FOR SELECT TO authenticated
  USING (public.is_org_admin(organization_id));
CREATE POLICY org_inv_insert_admins ON public.organization_invitations FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(organization_id));
CREATE POLICY org_inv_update_admins ON public.organization_invitations FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id)) WITH CHECK (public.is_org_admin(organization_id));
CREATE POLICY org_inv_delete_admins ON public.organization_invitations FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id));

-- Organization members policies
CREATE POLICY org_mem_select_members ON public.organization_members FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));
CREATE POLICY org_mem_insert_admins ON public.organization_members FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(organization_id));
CREATE POLICY org_mem_update_admins ON public.organization_members FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id)) WITH CHECK (public.is_org_admin(organization_id));
CREATE POLICY org_mem_delete_admins ON public.organization_members FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id));

-- Workspaces policies
CREATE POLICY ws_select_members ON public.workspaces FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));
CREATE POLICY ws_insert_admins ON public.workspaces FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(organization_id));
CREATE POLICY ws_update_admins ON public.workspaces FOR UPDATE TO authenticated
  USING (public.is_workspace_admin(id) OR public.is_org_admin(organization_id))
  WITH CHECK (public.is_workspace_admin(id) OR public.is_org_admin(organization_id));
CREATE POLICY ws_delete_admins ON public.workspaces FOR DELETE TO authenticated
  USING (public.is_workspace_admin(id) OR public.is_org_admin(organization_id));

-- Workspace members policies
CREATE POLICY ws_mem_select ON public.workspace_members FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));
CREATE POLICY ws_mem_insert ON public.workspace_members FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_admin(workspace_id));
CREATE POLICY ws_mem_update ON public.workspace_members FOR UPDATE TO authenticated
  USING (public.is_workspace_admin(workspace_id)) WITH CHECK (public.is_workspace_admin(workspace_id));
CREATE POLICY ws_mem_delete ON public.workspace_members FOR DELETE TO authenticated
  USING (public.is_workspace_admin(workspace_id));

-- Workspace projects policies
CREATE POLICY proj_select ON public.workspace_projects FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));
CREATE POLICY proj_insert ON public.workspace_projects FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY proj_update ON public.workspace_projects FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY proj_delete ON public.workspace_projects FOR DELETE TO authenticated
  USING (public.is_workspace_admin(workspace_id) OR created_by = auth.uid());

-- Collaboration reports policies
CREATE POLICY reports_select ON public.collaboration_reports FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id) OR public.can_view_report(id));
CREATE POLICY reports_insert ON public.collaboration_reports FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY reports_update ON public.collaboration_reports FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id) AND (created_by = auth.uid() OR public.is_workspace_admin(workspace_id)))
  WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY reports_delete ON public.collaboration_reports FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_workspace_admin(workspace_id));

-- Project reports
CREATE POLICY proj_reports_select ON public.project_reports FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workspace_projects p WHERE p.id = project_id AND public.is_workspace_member(p.workspace_id)));
CREATE POLICY proj_reports_insert ON public.project_reports FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_projects p WHERE p.id = project_id AND public.is_workspace_member(p.workspace_id)));
CREATE POLICY proj_reports_delete ON public.project_reports FOR DELETE TO authenticated
  USING (added_by = auth.uid() OR public.is_workspace_admin((SELECT workspace_id FROM public.workspace_projects WHERE id = project_id)));

-- Shared templates
CREATE POLICY templates_select ON public.shared_templates FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));
CREATE POLICY templates_insert ON public.shared_templates FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY templates_update ON public.shared_templates FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id) AND (created_by = auth.uid() OR public.is_workspace_admin(workspace_id)))
  WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY templates_delete ON public.shared_templates FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_workspace_admin(workspace_id));

-- Brand guidelines
CREATE POLICY guidelines_select ON public.brand_guidelines FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));
CREATE POLICY guidelines_insert ON public.brand_guidelines FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY guidelines_update ON public.brand_guidelines FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id) AND (created_by = auth.uid() OR public.is_workspace_admin(workspace_id)))
  WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY guidelines_delete ON public.brand_guidelines FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_workspace_admin(workspace_id));

-- Approval workflows
CREATE POLICY workflows_select ON public.approval_workflows FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));
CREATE POLICY workflows_insert ON public.approval_workflows FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_admin(workspace_id));
CREATE POLICY workflows_update ON public.approval_workflows FOR UPDATE TO authenticated
  USING (public.is_workspace_admin(workspace_id)) WITH CHECK (public.is_workspace_admin(workspace_id));
CREATE POLICY workflows_delete ON public.approval_workflows FOR DELETE TO authenticated
  USING (public.is_workspace_admin(workspace_id));

-- Report approvals
CREATE POLICY approvals_select ON public.report_approvals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.collaboration_reports r WHERE r.id = report_id AND public.can_view_report(r.id)));
CREATE POLICY approvals_insert ON public.report_approvals FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.collaboration_reports r WHERE r.id = report_id AND public.can_view_report(r.id)));

-- Approval steps
CREATE POLICY approval_steps_select ON public.approval_steps FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.report_approvals a JOIN public.collaboration_reports r ON a.report_id = r.id WHERE a.id = approval_id AND public.can_view_report(r.id)));

-- Report comments
CREATE POLICY comments_select ON public.report_comments FOR SELECT TO authenticated
  USING (public.can_view_report(report_id));
CREATE POLICY comments_insert ON public.report_comments FOR INSERT TO authenticated
  WITH CHECK (public.can_view_report(report_id));
CREATE POLICY comments_update ON public.report_comments FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY comments_delete ON public.report_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_workspace_admin((SELECT workspace_id FROM public.collaboration_reports WHERE id = report_id)));

-- Report mentions
CREATE POLICY mentions_select ON public.report_mentions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.report_comments c WHERE c.id = comment_id AND public.can_view_report(c.report_id)));

-- Report shares
CREATE POLICY shares_select ON public.report_shares FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.can_view_report(report_id));
CREATE POLICY shares_insert ON public.report_shares FOR INSERT TO authenticated
  WITH CHECK (public.can_view_report(report_id));
CREATE POLICY shares_delete ON public.report_shares FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_workspace_admin((SELECT workspace_id FROM public.collaboration_reports WHERE id = report_id)));

-- Report collections
CREATE POLICY collections_select ON public.report_collections FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));
CREATE POLICY collections_insert ON public.report_collections FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY collections_update ON public.report_collections FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id) AND (created_by = auth.uid() OR public.is_workspace_admin(workspace_id)))
  WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY collections_delete ON public.report_collections FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_workspace_admin(workspace_id));

-- Collection items
CREATE POLICY collection_items_select ON public.collection_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.report_collections c WHERE c.id = collection_id AND public.is_workspace_member(c.workspace_id)));
CREATE POLICY collection_items_insert ON public.collection_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.report_collections c WHERE c.id = collection_id AND public.is_workspace_member(c.workspace_id)));
CREATE POLICY collection_items_delete ON public.collection_items FOR DELETE TO authenticated
  USING (added_by = auth.uid() OR public.is_workspace_admin((SELECT workspace_id FROM public.report_collections WHERE id = collection_id)));

-- SSO configurations
CREATE POLICY sso_select ON public.sso_configurations FOR SELECT TO authenticated
  USING (public.is_org_admin(organization_id));
CREATE POLICY sso_insert ON public.sso_configurations FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(organization_id));
CREATE POLICY sso_update ON public.sso_configurations FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id)) WITH CHECK (public.is_org_admin(organization_id));
CREATE POLICY sso_delete ON public.sso_configurations FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id));

-- Compliance records
CREATE POLICY compliance_select ON public.compliance_records FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));
CREATE POLICY compliance_insert ON public.compliance_records FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(organization_id));
CREATE POLICY compliance_update ON public.compliance_records FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id)) WITH CHECK (public.is_org_admin(organization_id));
CREATE POLICY compliance_delete ON public.compliance_records FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id));

-- Audit logs
CREATE POLICY audit_select_own ON public.audit_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_org_admin(organization_id) OR public.is_app_admin());

-- Organization billing
CREATE POLICY billing_select_admins ON public.organization_billing FOR SELECT TO authenticated
  USING (public.is_org_admin(organization_id));
CREATE POLICY billing_update_admins ON public.organization_billing FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id)) WITH CHECK (public.is_org_admin(organization_id));

-- Workspace API quotas
CREATE POLICY quota_select_members ON public.workspace_api_quotas FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id) OR public.is_org_admin((SELECT organization_id FROM public.workspaces WHERE id = workspace_id)));
CREATE POLICY quota_update_org_admins ON public.workspace_api_quotas FOR UPDATE TO authenticated
  USING (public.is_org_admin((SELECT organization_id FROM public.workspaces WHERE id = workspace_id)))
  WITH CHECK (public.is_org_admin((SELECT organization_id FROM public.workspaces WHERE id = workspace_id)));

-- Seed compliance records for existing organizations
INSERT INTO public.compliance_records (organization_id, compliance_type, status)
SELECT o.id, ct, 'in_progress'
FROM public.organizations o
CROSS JOIN (SELECT unnest(enum_range(NULL::compliance_type)) AS ct) t
ON CONFLICT (organization_id, compliance_type) DO NOTHING;
