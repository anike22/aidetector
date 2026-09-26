export type OrganizationPlan = 'team' | 'business' | 'enterprise';
export type OrganizationStatus = 'active' | 'suspended' | 'deleted';
export type OrganizationType = 'personal' | 'business' | 'enterprise' | 'school' | 'university' | 'agency';
export type OrganizationRole =
  | 'owner'
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'team_lead'
  | 'editor'
  | 'reviewer'
  | 'analyst'
  | 'billing_manager'
  | 'api_manager'
  | 'support'
  | 'viewer'
  | 'guest'
  | 'member';
export type WorkspaceRole = 'admin' | 'manager' | 'editor' | 'contributor' | 'viewer';
export type ProjectStatus = 'active' | 'completed' | 'archived' | 'deleted';
export type TemplateType = 'detection' | 'humanization' | 'grammar' | 'plagiarism' | 'api';
export type GuidelineCategory = 'tone' | 'style' | 'terminology' | 'formatting' | 'reading_level' | 'ai_risk';
export type WorkflowTrigger = 'manual' | 'auto_high_ai_score' | 'auto_public_content';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type StepStatus = 'pending' | 'approved' | 'rejected';
export type ComplianceStandard = 'gdpr' | 'ccpa' | 'ferpa' | 'soc2' | 'iso27001';
export type ComplianceStatus = 'compliant' | 'non_compliant' | 'in_progress';
export type SsoProvider = 'google_workspace' | 'microsoft_entra_id' | 'okta' | 'onelogin' | 'saml' | 'oidc';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  type: OrganizationType;
  plan: OrganizationPlan;
  status: OrganizationStatus;
  domain?: string;
  logo_url?: string;
  industry?: string;
  country?: string;
  timezone?: string;
  language?: string;
  max_members?: number;
  departments_enabled: boolean;
  teams_enabled: boolean;
  custom_roles_enabled: boolean;
  sso_enabled: boolean;
  mfa_required: boolean;
  ip_restrictions: string[];
  settings: Record<string, unknown>;
  invitation_settings?: {
    default_expiration_days?: number;
    require_email_verification?: boolean;
    allow_self_service_role_changes?: boolean;
    enable_invitation_resend?: boolean;
    max_pending_invitations?: number;
  };
  billing_email?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  status: 'active' | 'invited' | 'suspended' | 'transferred' | 'removed';
  joined_at?: string;
  suspended_at?: string;
  removed_at?: string;
  last_login_at?: string;
  department_ids: string[];
  team_ids: string[];
  created_at: string;
  user?: { email: string; full_name?: string; display_name?: string; avatar_url?: string };
  department_names?: string[];
  team_names?: string[];
}

export interface Workspace {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  status: OrganizationStatus;
  settings: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  permissions: string[];
  status: 'active' | 'invited' | 'suspended' | 'inactive';
  added_at: string;
  user?: { email: string; display_name?: string; avatar_url?: string };
}

export interface WorkspaceProject {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CollaborationReport {
  id: string;
  workspace_id: string;
  project_id?: string;
  created_by: string;
  title: string;
  tool_type: string;
  external_report_id?: string;
  content_snapshot?: Record<string, unknown>;
  result_snapshot?: Record<string, unknown>;
  brand_compliance?: Record<string, unknown>;
  status: string;
  approval_status: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  project?: WorkspaceProject;
}

export interface SharedTemplate {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  template_type: TemplateType;
  settings: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BrandGuideline {
  id: string;
  workspace_id: string;
  name: string;
  category: GuidelineCategory;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalWorkflow {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  levels: WorkflowLevel[];
  trigger_condition: WorkflowTrigger;
  enabled: boolean;
  auto_escalation: boolean;
  escalation_hours?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  step_order: number;
  approver_user_id?: string;
  approver_role?: WorkspaceRole;
}

export interface WorkflowLevel {
  level_order: number;
  approver_user_ids?: string[];
  approver_role_ids?: string[];
  require_all: boolean;
}

export interface ReportApproval {
  id: string;
  report_id: string;
  workflow_id: string;
  current_step: number;
  status: ApprovalStatus;
  submitted_by: string;
  submitted_at: string;
  completed_at?: string;
  steps?: ApprovalStep[];
}

export interface ApprovalStep {
  id: string;
  approval_id: string;
  step_order: number;
  approver_user_id?: string;
  approver_role?: WorkspaceRole;
  status: StepStatus;
  comments?: string;
  decided_at?: string;
  approver?: { display_name?: string; email: string };
}

export interface ReportComment {
  id: string;
  report_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  resolved: boolean;
  created_at: string;
  updated_at: string;
  user?: { display_name?: string; email: string; avatar_url?: string };
}

export interface ReportCollection {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SsoConfiguration {
  id: string;
  organization_id: string;
  provider: SsoProvider;
  enabled: boolean;
  domain?: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ComplianceRecord {
  id: string;
  organization_id: string;
  compliance_type: ComplianceStandard;
  status: ComplianceStatus;
  findings: Record<string, unknown>[];
  last_audit_date?: string;
  next_audit_date?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  organization_id?: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  category?: string;
  severity?: 'info' | 'warning' | 'critical';
  details?: Record<string, unknown>;
  created_at: string;
  user?: { display_name?: string; email: string };
}

export interface OrganizationBilling {
  id: string;
  organization_id: string;
  plan: OrganizationPlan;
  billing_email?: string;
  next_billing_date?: string;
  status: string;
}

export interface WorkspaceApiQuota {
  id: string;
  workspace_id: string;
  quota: number;
  used: number;
  reset_at: string;
}

export interface OrganizationAnalytics {
  workspace_count: number;
  member_count: number;
  report_count: number;
  project_count: number;
  api_used: number;
  api_quota: number;
}
