-- Phase 7: Enterprise Workspace schema additions (enums, tables, base policies)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_type') THEN
    CREATE TYPE organization_type AS ENUM ('personal', 'business', 'enterprise', 'school', 'university', 'agency');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'organization_role' AND e.enumlabel = 'super_admin') THEN
    ALTER TYPE organization_role ADD VALUE 'super_admin';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'organization_role' AND e.enumlabel = 'manager') THEN
    ALTER TYPE organization_role ADD VALUE 'manager';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'organization_role' AND e.enumlabel = 'team_lead') THEN
    ALTER TYPE organization_role ADD VALUE 'team_lead';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'organization_role' AND e.enumlabel = 'editor') THEN
    ALTER TYPE organization_role ADD VALUE 'editor';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'organization_role' AND e.enumlabel = 'reviewer') THEN
    ALTER TYPE organization_role ADD VALUE 'reviewer';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'organization_role' AND e.enumlabel = 'analyst') THEN
    ALTER TYPE organization_role ADD VALUE 'analyst';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'organization_role' AND e.enumlabel = 'billing_manager') THEN
    ALTER TYPE organization_role ADD VALUE 'billing_manager';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'organization_role' AND e.enumlabel = 'api_manager') THEN
    ALTER TYPE organization_role ADD VALUE 'api_manager';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'organization_role' AND e.enumlabel = 'support') THEN
    ALTER TYPE organization_role ADD VALUE 'support';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'organization_role' AND e.enumlabel = 'guest') THEN
    ALTER TYPE organization_role ADD VALUE 'guest';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'organization_member_status' AND e.enumlabel = 'transferred') THEN
    ALTER TYPE organization_member_status ADD VALUE 'transferred';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'api_key_environment') THEN
    CREATE TYPE api_key_environment AS ENUM ('production', 'staging', 'development');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_contract_type') THEN
    CREATE TYPE billing_contract_type AS ENUM ('seat_based', 'usage_based', 'hybrid');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_cycle') THEN
    CREATE TYPE billing_cycle AS ENUM ('monthly', 'annual');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM ('comment', 'mention', 'task', 'approval', 'activity', 'system');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_category') THEN
    CREATE TYPE audit_category AS ENUM ('user_management', 'workspace', 'billing', 'api', 'security', 'compliance', 'integration', 'automation');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_severity') THEN
    CREATE TYPE audit_severity AS ENUM ('info', 'warning', 'critical');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_provider') THEN
    CREATE TYPE integration_provider AS ENUM ('microsoft_365', 'google_workspace', 'slack', 'teams', 'discord', 'notion', 'jira', 'confluence', 'canvas', 'moodle', 'blackboard');
  END IF;
END$$;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS type organization_type NOT NULL DEFAULT 'business',
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS max_members integer,
  ADD COLUMN IF NOT EXISTS departments_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS teams_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_roles_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sso_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mfa_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ip_restrictions jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';

ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS department_ids jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS team_ids jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transferred_from uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_name text NOT NULL UNIQUE,
  is_default boolean NOT NULL DEFAULT false,
  permissions jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS role_permissions_read ON public.role_permissions;
CREATE POLICY role_permissions_read ON public.role_permissions FOR SELECT TO authenticated USING (true);

INSERT INTO public.role_permissions (role_name, is_default, permissions) VALUES
('owner', true, '{"user_management":"full","workspace_settings":"full","billing":"full","ai_tools":"full","reports":"full","api":"full","security":"full","audit_logs":"full","integrations":"full","automation":"full","analytics":"full","content":"full"}'),
('super_admin', true, '{"user_management":"full","workspace_settings":"full","billing":"full","ai_tools":"full","reports":"full","api":"full","security":"full","audit_logs":"full","integrations":"full","automation":"full","analytics":"full","content":"full"}'),
('admin', true, '{"user_management":"edit","workspace_settings":"full","billing":"view","ai_tools":"full","reports":"full","api":"edit","security":"edit","audit_logs":"view","integrations":"edit","automation":"edit","analytics":"full","content":"full"}'),
('manager', true, '{"user_management":"view","workspace_settings":"edit","billing":"view","ai_tools":"full","reports":"full","api":"view","security":"view","audit_logs":"view","integrations":"view","automation":"edit","analytics":"edit","content":"full"}'),
('team_lead', true, '{"user_management":"view","workspace_settings":"edit","billing":"none","ai_tools":"full","reports":"full","api":"none","security":"none","audit_logs":"none","integrations":"none","automation":"view","analytics":"view","content":"full"}'),
('editor', true, '{"user_management":"none","workspace_settings":"view","billing":"none","ai_tools":"full","reports":"edit","api":"none","security":"none","audit_logs":"none","integrations":"none","automation":"none","analytics":"view","content":"full"}'),
('reviewer', true, '{"user_management":"none","workspace_settings":"view","billing":"none","ai_tools":"full","reports":"view","api":"none","security":"none","audit_logs":"none","integrations":"none","automation":"none","analytics":"view","content":"view"}'),
('analyst', true, '{"user_management":"none","workspace_settings":"view","billing":"none","ai_tools":"view","reports":"view","api":"none","security":"none","audit_logs":"view","integrations":"none","automation":"none","analytics":"full","content":"view"}'),
('billing_manager', true, '{"user_management":"none","workspace_settings":"none","billing":"full","ai_tools":"none","reports":"none","api":"none","security":"none","audit_logs":"view","integrations":"none","automation":"none","analytics":"view","content":"none"}'),
('api_manager', true, '{"user_management":"none","workspace_settings":"none","billing":"none","ai_tools":"none","reports":"none","api":"full","security":"view","audit_logs":"view","integrations":"none","automation":"none","analytics":"view","content":"none"}'),
('support', true, '{"user_management":"view","workspace_settings":"view","billing":"none","ai_tools":"view","reports":"view","api":"none","security":"none","audit_logs":"view","integrations":"none","automation":"none","analytics":"view","content":"view"}'),
('viewer', true, '{"user_management":"none","workspace_settings":"view","billing":"none","ai_tools":"view","reports":"view","api":"none","security":"none","audit_logs":"none","integrations":"none","automation":"none","analytics":"view","content":"view"}'),
('guest', true, '{"user_management":"none","workspace_settings":"none","billing":"none","ai_tools":"view","reports":"view","api":"none","security":"none","audit_logs":"none","integrations":"none","automation":"none","analytics":"none","content":"view"}'),
('member', true, '{"user_management":"none","workspace_settings":"view","billing":"none","ai_tools":"view","reports":"view","api":"none","security":"none","audit_logs":"none","integrations":"none","automation":"none","analytics":"view","content":"view"}')
ON CONFLICT (role_name) DO UPDATE SET permissions = EXCLUDED.permissions, updated_at = now();

CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  parent_department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  manager_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  lead_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS shared_department_ids jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS shared_team_ids jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.workspace_folders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  parent_folder_id uuid REFERENCES public.workspace_folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  shared_department_ids jsonb NOT NULL DEFAULT '[]',
  shared_team_ids jsonb NOT NULL DEFAULT '[]',
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workspace_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.workspace_folders(id) ON DELETE SET NULL,
  name text NOT NULL,
  content text,
  current_version integer NOT NULL DEFAULT 1,
  tags jsonb NOT NULL DEFAULT '[]',
  is_favorite boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES public.workspace_documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  content text,
  change_summary text,
  author_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.document_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES public.workspace_documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  mentions jsonb NOT NULL DEFAULT '[]',
  parent_comment_id uuid REFERENCES public.document_comments(id) ON DELETE CASCADE,
  is_resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES public.workspace_documents(id) ON DELETE CASCADE,
  assigned_to uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  due_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.approval_workflows
  ADD COLUMN IF NOT EXISTS levels jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS auto_escalation boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS escalation_hours integer;

CREATE TABLE IF NOT EXISTS public.classrooms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  teacher_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_code text UNIQUE,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.classroom_enrollments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (classroom_id, student_user_id)
);

CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text,
  ai_detection_score real,
  plagiarism_score real,
  feedback text,
  grade text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_user_id)
);

CREATE TABLE IF NOT EXISTS public.client_workspaces (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  branding jsonb NOT NULL DEFAULT '{}',
  allocated_team_ids jsonb NOT NULL DEFAULT '[]',
  notes text,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.billing_contracts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contract_type billing_contract_type NOT NULL DEFAULT 'seat_based',
  billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
  seats_purchased integer,
  price_per_seat numeric(12,4),
  start_date date,
  end_date date,
  purchase_order_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cost_centers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  budget numeric(14,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integrations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider integration_provider NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  settings jsonb NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  type notification_type NOT NULL DEFAULT 'activity',
  content text NOT NULL,
  resource_type text,
  resource_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_feeds (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS environment api_key_environment NOT NULL DEFAULT 'production',
  ADD COLUMN IF NOT EXISTS quota integer,
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_rotated_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_api_keys_organization_id ON public.api_keys(organization_id);

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS category audit_category,
  ADD COLUMN IF NOT EXISTS severity audit_severity NOT NULL DEFAULT 'info';

CREATE OR REPLACE FUNCTION public.can_access_workspace_document(p_document_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_documents d
    JOIN public.workspaces w ON d.workspace_id = w.id
    LEFT JOIN public.workspace_members wm ON wm.workspace_id = w.id AND wm.user_id = p_user_id AND wm.status = 'active'
    LEFT JOIN public.organization_members om ON om.organization_id = w.organization_id AND om.user_id = p_user_id AND om.status = 'active'
    WHERE d.id = p_document_id
      AND (
        w.created_by = p_user_id
        OR wm.id IS NOT NULL
        OR (om.id IS NOT NULL AND (w.shared_department_ids = '[]'::jsonb OR om.department_ids ?| ARRAY(SELECT jsonb_array_elements_text(w.shared_department_ids))))
        OR (om.id IS NOT NULL AND (w.shared_team_ids = '[]'::jsonb OR om.team_ids ?| ARRAY(SELECT jsonb_array_elements_text(w.shared_team_ids))))
      )
  );
$$;

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feeds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS departments_org_member ON public.departments;
CREATE POLICY departments_org_member ON public.departments FOR SELECT TO authenticated USING (is_org_member(organization_id));
DROP POLICY IF EXISTS departments_org_manager_insert ON public.departments;
CREATE POLICY departments_org_manager_insert ON public.departments FOR INSERT TO authenticated WITH CHECK (is_org_admin(organization_id));
DROP POLICY IF EXISTS departments_org_manager_update ON public.departments;
CREATE POLICY departments_org_manager_update ON public.departments FOR UPDATE TO authenticated USING (is_org_admin(organization_id));
DROP POLICY IF EXISTS departments_org_admin_delete ON public.departments;
CREATE POLICY departments_org_admin_delete ON public.departments FOR DELETE TO authenticated USING (is_org_admin(organization_id));

DROP POLICY IF EXISTS teams_org_member ON public.teams;
CREATE POLICY teams_org_member ON public.teams FOR SELECT TO authenticated USING (is_org_member(organization_id));
DROP POLICY IF EXISTS teams_org_manager_insert ON public.teams;
CREATE POLICY teams_org_manager_insert ON public.teams FOR INSERT TO authenticated WITH CHECK (is_org_admin(organization_id));
DROP POLICY IF EXISTS teams_org_manager_update ON public.teams;
CREATE POLICY teams_org_manager_update ON public.teams FOR UPDATE TO authenticated USING (is_org_admin(organization_id));
DROP POLICY IF EXISTS teams_org_admin_delete ON public.teams;
CREATE POLICY teams_org_admin_delete ON public.teams FOR DELETE TO authenticated USING (is_org_admin(organization_id));

DROP POLICY IF EXISTS workspace_folders_member ON public.workspace_folders;
CREATE POLICY workspace_folders_member ON public.workspace_folders FOR ALL TO authenticated USING (is_workspace_member(workspace_id)) WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS workspace_documents_member ON public.workspace_documents;
CREATE POLICY workspace_documents_member ON public.workspace_documents FOR ALL TO authenticated USING (can_access_workspace_document(id)) WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS document_versions_member ON public.document_versions;
CREATE POLICY document_versions_member ON public.document_versions FOR ALL TO authenticated USING (can_access_workspace_document(document_id));

DROP POLICY IF EXISTS document_comments_member ON public.document_comments;
CREATE POLICY document_comments_member ON public.document_comments FOR ALL TO authenticated USING (can_access_workspace_document(document_id));

DROP POLICY IF EXISTS document_tasks_member ON public.document_tasks;
CREATE POLICY document_tasks_member ON public.document_tasks FOR ALL TO authenticated USING (can_access_workspace_document(document_id));

DROP POLICY IF EXISTS classrooms_org_member ON public.classrooms;
CREATE POLICY classrooms_org_member ON public.classrooms FOR SELECT TO authenticated USING (is_org_member(organization_id));
DROP POLICY IF EXISTS classrooms_teacher ON public.classrooms;
CREATE POLICY classrooms_teacher ON public.classrooms FOR ALL TO authenticated USING (is_org_admin(organization_id) OR teacher_user_id = auth.uid()) WITH CHECK (is_org_admin(organization_id) OR teacher_user_id = auth.uid());

DROP POLICY IF EXISTS classroom_enrollments_org_member ON public.classroom_enrollments;
CREATE POLICY classroom_enrollments_org_member ON public.classroom_enrollments FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.classrooms c WHERE c.id = classroom_id AND is_org_member(c.organization_id)));
DROP POLICY IF EXISTS classroom_enrollments_teacher_insert ON public.classroom_enrollments;
CREATE POLICY classroom_enrollments_teacher_insert ON public.classroom_enrollments FOR INSERT TO authenticated WITH CHECK (EXISTS(SELECT 1 FROM public.classrooms c WHERE c.id = classroom_id AND (is_org_admin(c.organization_id) OR c.teacher_user_id = auth.uid())));
DROP POLICY IF EXISTS classroom_enrollments_teacher_delete ON public.classroom_enrollments;
CREATE POLICY classroom_enrollments_teacher_delete ON public.classroom_enrollments FOR DELETE TO authenticated USING (EXISTS(SELECT 1 FROM public.classrooms c WHERE c.id = classroom_id AND (is_org_admin(c.organization_id) OR c.teacher_user_id = auth.uid())));

DROP POLICY IF EXISTS assignments_classroom_member ON public.assignments;
CREATE POLICY assignments_classroom_member ON public.assignments FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.classrooms c WHERE c.id = classroom_id AND is_org_member(c.organization_id)));
DROP POLICY IF EXISTS assignments_teacher ON public.assignments;
CREATE POLICY assignments_teacher ON public.assignments FOR ALL TO authenticated USING (EXISTS(SELECT 1 FROM public.classrooms c WHERE c.id = classroom_id AND (is_org_admin(c.organization_id) OR c.teacher_user_id = auth.uid()))) WITH CHECK (EXISTS(SELECT 1 FROM public.classrooms c WHERE c.id = classroom_id AND (is_org_admin(c.organization_id) OR c.teacher_user_id = auth.uid())));

DROP POLICY IF EXISTS submissions_select ON public.submissions;
CREATE POLICY submissions_select ON public.submissions FOR SELECT TO authenticated USING (student_user_id = auth.uid() OR EXISTS(SELECT 1 FROM public.assignments a JOIN public.classrooms c ON a.classroom_id = c.id WHERE a.id = assignment_id AND (is_org_admin(c.organization_id) OR c.teacher_user_id = auth.uid())));
DROP POLICY IF EXISTS submissions_student_insert ON public.submissions;
CREATE POLICY submissions_student_insert ON public.submissions FOR INSERT TO authenticated WITH CHECK (EXISTS(SELECT 1 FROM public.classroom_enrollments e WHERE e.student_user_id = auth.uid() AND e.classroom_id = (SELECT classroom_id FROM public.assignments a WHERE a.id = assignment_id)));
DROP POLICY IF EXISTS submissions_teacher_update ON public.submissions;
CREATE POLICY submissions_teacher_update ON public.submissions FOR UPDATE TO authenticated USING (EXISTS(SELECT 1 FROM public.assignments a JOIN public.classrooms c ON a.classroom_id = c.id WHERE a.id = assignment_id AND (is_org_admin(c.organization_id) OR c.teacher_user_id = auth.uid())));

DROP POLICY IF EXISTS client_workspaces_org_member ON public.client_workspaces;
CREATE POLICY client_workspaces_org_member ON public.client_workspaces FOR SELECT TO authenticated USING (is_org_member(agency_organization_id));
DROP POLICY IF EXISTS client_workspaces_admin ON public.client_workspaces;
CREATE POLICY client_workspaces_admin ON public.client_workspaces FOR ALL TO authenticated USING (is_org_admin(agency_organization_id)) WITH CHECK (is_org_admin(agency_organization_id));

DROP POLICY IF EXISTS billing_contracts_org_admin ON public.billing_contracts;
CREATE POLICY billing_contracts_org_admin ON public.billing_contracts FOR ALL TO authenticated USING (is_org_admin(organization_id));
DROP POLICY IF EXISTS cost_centers_org_admin ON public.cost_centers;
CREATE POLICY cost_centers_org_admin ON public.cost_centers FOR ALL TO authenticated USING (is_org_admin(organization_id));

DROP POLICY IF EXISTS integrations_org_admin ON public.integrations;
CREATE POLICY integrations_org_admin ON public.integrations FOR ALL TO authenticated USING (is_org_admin(organization_id));

DROP POLICY IF EXISTS notifications_user ON public.notifications;
CREATE POLICY notifications_user ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS activity_feeds_org_member ON public.activity_feeds;
CREATE POLICY activity_feeds_org_member ON public.activity_feeds FOR SELECT TO authenticated USING (organization_id IS NULL OR is_org_member(organization_id));
DROP POLICY IF EXISTS activity_feeds_workspace_member ON public.activity_feeds;
CREATE POLICY activity_feeds_workspace_member ON public.activity_feeds FOR ALL TO authenticated USING (workspace_id IS NULL OR is_workspace_member(workspace_id)) WITH CHECK (workspace_id IS NULL OR is_workspace_member(workspace_id));

DROP POLICY IF EXISTS api_keys_org_admin ON public.api_keys;
CREATE POLICY api_keys_org_admin ON public.api_keys FOR ALL TO authenticated USING (is_org_admin(organization_id)) WITH CHECK (is_org_admin(organization_id));
DROP POLICY IF EXISTS api_keys_user_personal ON public.api_keys;
CREATE POLICY api_keys_user_personal ON public.api_keys FOR ALL TO authenticated USING (user_id = auth.uid() AND organization_id IS NULL);

DROP POLICY IF EXISTS audit_logs_org_viewer ON public.audit_logs;
CREATE POLICY audit_logs_org_viewer ON public.audit_logs FOR SELECT TO authenticated USING (organization_id IS NULL OR is_org_member(organization_id));
DROP POLICY IF EXISTS audit_logs_org_admin ON public.audit_logs;
CREATE POLICY audit_logs_org_admin ON public.audit_logs FOR ALL TO authenticated USING (organization_id IS NULL OR is_org_admin(organization_id));
