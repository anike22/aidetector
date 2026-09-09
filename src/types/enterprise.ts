export type ApiKeyEnvironment = 'production' | 'staging' | 'development';
export type BillingContractType = 'seat_based' | 'usage_based' | 'hybrid';
export type BillingCycle = 'monthly' | 'annual';
export type NotificationType = 'comment' | 'mention' | 'task' | 'approval' | 'activity' | 'system' | 'invitation' | 'member';
export type InvitationStatus =
  | 'pending'
  | 'delivered'
  | 'opened'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'revoked'
  | 'failed'
  | 'resent';
export type IntegrationProvider =
  | 'microsoft_365'
  | 'google_workspace'
  | 'slack'
  | 'teams'
  | 'discord'
  | 'notion'
  | 'jira'
  | 'confluence'
  | 'canvas'
  | 'moodle'
  | 'blackboard';

export type PermissionCategory =
  | 'user_management'
  | 'workspace_settings'
  | 'billing'
  | 'ai_tools'
  | 'reports'
  | 'api'
  | 'security'
  | 'audit_logs'
  | 'integrations'
  | 'automation'
  | 'analytics'
  | 'content';

export type PermissionLevel = 'none' | 'view' | 'edit' | 'full';

export interface RolePermissions {
  id: string;
  role_name: string;
  is_default: boolean;
  permissions: Record<PermissionCategory, PermissionLevel>;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  parent_department_id?: string;
  manager_user_id?: string;
  created_at: string;
  updated_at: string;
  manager?: { display_name?: string; email: string };
  parent?: Department;
}

export interface Team {
  id: string;
  organization_id: string;
  department_id?: string;
  name: string;
  description?: string;
  lead_user_id?: string;
  created_at: string;
  updated_at: string;
  lead?: { display_name?: string; email: string };
  department?: Department;
}

export interface WorkspaceFolder {
  id: string;
  workspace_id: string;
  parent_folder_id?: string;
  name: string;
  shared_department_ids: string[];
  shared_team_ids: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceDocument {
  id: string;
  workspace_id: string;
  folder_id?: string;
  name: string;
  content?: string;
  current_version: number;
  tags: string[];
  is_favorite: boolean;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  author?: { display_name?: string; email: string };
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  content?: string;
  change_summary?: string;
  author_user_id: string;
  created_at: string;
  author?: { display_name?: string; email: string };
}

export interface DocumentComment {
  id: string;
  document_id: string;
  user_id: string;
  content: string;
  mentions: string[];
  parent_comment_id?: string;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
  user?: { display_name?: string; email: string; avatar_url?: string };
  replies?: DocumentComment[];
}

export interface DocumentTask {
  id: string;
  document_id: string;
  assigned_to: string;
  assigned_by: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  created_at: string;
  updated_at: string;
  assignee?: { display_name?: string; email: string };
}

export interface Classroom {
  id: string;
  organization_id: string;
  name: string;
  teacher_user_id: string;
  enrollment_code?: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
  teacher?: { display_name?: string; email: string };
}

export interface ClassroomEnrollment {
  id: string;
  classroom_id: string;
  student_user_id: string;
  enrolled_at: string;
  student?: { display_name?: string; email: string };
}

export interface Assignment {
  id: string;
  classroom_id: string;
  title: string;
  description?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_user_id: string;
  content?: string;
  ai_detection_score?: number;
  plagiarism_score?: number;
  feedback?: string;
  grade?: string;
  submitted_at: string;
  updated_at: string;
  student?: { display_name?: string; email: string };
}

export interface ClientWorkspace {
  id: string;
  agency_organization_id: string;
  client_name: string;
  branding: { logo_url?: string; primary_color?: string; custom_domain?: string };
  allocated_team_ids: string[];
  notes?: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillingContract {
  id: string;
  organization_id: string;
  contract_type: BillingContractType;
  billing_cycle: BillingCycle;
  seats_purchased?: number;
  price_per_seat?: number;
  start_date?: string;
  end_date?: string;
  purchase_order_number?: string;
  created_at: string;
  updated_at: string;
}

export interface CostCenter {
  id: string;
  organization_id: string;
  name: string;
  department_id?: string;
  budget?: number;
  created_at: string;
  updated_at: string;
  department?: Department;
}

export interface IntegrationConfig {
  id: string;
  organization_id: string;
  provider: IntegrationProvider;
  enabled: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationApiKey {
  id: string;
  organization_id: string;
  name: string;
  key_value?: string;
  environment: ApiKeyEnvironment;
  quota?: number;
  owner_user_id?: string;
  is_active: boolean;
  last_rotated_at?: string;
  revoked_at?: string;
  created_at: string;
  owner?: { display_name?: string; full_name?: string; email: string; avatar_url?: string };
}

export interface Notification {
  id: string;
  user_id: string;
  organization_id?: string;
  type: NotificationType;
  content: string;
  resource_type?: string;
  resource_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface ActivityFeed {
  id: string;
  organization_id?: string;
  workspace_id?: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  user?: { display_name?: string; full_name?: string; email?: string; avatar_url?: string };
}

export interface SecurityEvent {
  id: string;
  user_id?: string;
  organization_id?: string;
  event_type: string;
  severity: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, unknown>;
  detected_at: string;
  user?: { display_name?: string; full_name?: string; email?: string; avatar_url?: string };
}

export interface SecurityAlert {
  id: string;
  user_id?: string;
  organization_id?: string;
  alert_type: string;
  severity: string;
  status: string;
  message: string;
  evidence?: Record<string, unknown>;
  created_at: string;
  resolved_at?: string;
  user?: { display_name?: string; full_name?: string; email?: string; avatar_url?: string };
}

export interface DashboardChartPoint {
  date: string;
  members?: number;
  calls?: number;
  logins?: number;
  workspaces?: number;
  bytes?: number;
  sent?: number;
  accepted?: number;
}

export interface DashboardCharts {
  member_growth: DashboardChartPoint[];
  api_usage: DashboardChartPoint[];
  login_activity: DashboardChartPoint[];
  workspace_growth: DashboardChartPoint[];
  storage_growth: DashboardChartPoint[];
  invitations: DashboardChartPoint[];
}

export interface OrganizationDashboardSummary {
  organization: {
    id: string;
    name: string;
    logo_url?: string;
    plan: string;
    status: string;
    created_at: string;
    owner_id: string;
    max_members?: number;
    mfa_required: boolean;
  };
  owner: {
    id: string;
    display_name: string;
    email?: string;
    avatar_url?: string;
  };
  billing: {
    plan: string;
    status: string;
    next_billing_date?: string;
  };
  metrics: EnterpriseDashboardMetrics;

  total_members: number;
  active_users_30d: number;
  pending_invitations: number;
  departments_count: number;
  teams_count: number;
  workspaces_count: number;
  api_calls_30d: number;
  api_quota: number;
  api_used: number;
  storage_bytes: number;
  storage_quota: number;
  new_members_this_month: number;
  seats_used: number;
  seats_total: number;

  security_score: number;
  mfa_adoption: { enabled: number; total: number };
  failed_logins_30d: number;
  suspicious_logins_30d: number;
  password_resets_30d: number;
  role_changes_30d: number;
  api_key_creations_30d: number;
  invitation_abuse_30d: number;
  open_security_alerts: number;

  recent_logins: { email?: string; display_name?: string; last_login_at?: string }[];
  recent_security_events: { event_type: string; severity: string; detected_at: string; details?: Record<string, unknown> }[];
  recent_activity: { action: string; resource_type?: string; metadata?: Record<string, unknown>; created_at: string; email?: string; display_name?: string }[];

  charts: DashboardCharts;
}

export interface EnterpriseSearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  organization_id?: string;
  workspace_id?: string;
  resource_id?: string;
  created_at?: string;
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  org_name?: string;
  org_logo_url?: string;
  inviter_name?: string;
  inviter_email?: string;
  email: string;
  role: string;
  department_id?: string;
  department_name?: string;
  team_id?: string;
  team_name?: string;
  workspace_id?: string;
  workspace_name?: string;
  message?: string;
  status: InvitationStatus;
  token?: string;
  invited_by?: string;
  invited_at?: string;
  created_at: string;
  expires_at: string;
  accepted_at?: string;
  opened_at?: string;
  resent_at?: string;
  revoked_at?: string;
  declined_at?: string;
  failed_at?: string;
  delivery_history?: DeliveryHistoryEvent[];
  audit_info?: Record<string, unknown>;
}

export interface DeliveryHistoryEvent {
  status: string;
  timestamp: string;
  provider_message_id?: string;
  error?: string;
}

export interface EnterpriseDashboardMetrics {
  total_members: number;
  active_users: number;
  pending_invitations: number;
  departments_count: number;
  teams_count: number;
  workspaces_count: number;
  api_calls_30d: number;
  new_members_this_month: number;
  storage_objects: number;
  storage_bytes: number;
  recent_logins: { email?: string; display_name?: string; last_login_at?: string }[];
  recent_security_events: { event_type: string; severity: string; detected_at: string; details?: Record<string, unknown> }[];
  recent_activity: { action: string; resource_type?: string; metadata?: Record<string, unknown>; created_at: string; email?: string; display_name?: string }[];
}
