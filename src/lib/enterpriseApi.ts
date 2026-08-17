import { supabase } from '@/db/supabase';
import type {
  RolePermissions,
  Department,
  Team,
  WorkspaceFolder,
  WorkspaceDocument,
  DocumentVersion,
  DocumentComment,
  DocumentTask,
  Classroom,
  ClassroomEnrollment,
  Assignment,
  Submission,
  ClientWorkspace,
  BillingContract,
  CostCenter,
  IntegrationConfig,
  OrganizationApiKey,
  Notification,
  ActivityFeed,
  EnterpriseSearchResult,
  OrganizationInvitation,
  EnterpriseDashboardMetrics,
  OrganizationDashboardSummary,
  SecurityEvent,
  SecurityAlert,
} from '@/types/enterprise';
import type { WorkspaceMember } from '@/types/team';

// Role permissions
export async function getRolePermissions(): Promise<RolePermissions[]> {
  const { data, error } = await supabase.from('role_permissions').select('*').order('role_name');
  if (error) throw error;
  return data || [];
}

export async function getRolePermission(roleName: string): Promise<RolePermissions | null> {
  const { data, error } = await supabase.from('role_permissions').select('*').eq('role_name', roleName).maybeSingle();
  if (error) throw error;
  return data;
}

// Departments
export async function getDepartments(orgId: string): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('*, manager:profiles(email, display_name), parent:departments(id, name)')
    .eq('organization_id', orgId)
    .order('name');
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, manager: d.manager, parent: d.parent }));
}

export async function createDepartment(orgId: string, payload: Partial<Department>): Promise<Department> {
  const { data, error } = await supabase.from('departments').insert({ ...payload, organization_id: orgId }).select().single();
  if (error) throw error;
  return data;
}

export async function updateDepartment(id: string, updates: Partial<Department>): Promise<Department> {
  const { data, error } = await supabase.from('departments').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteDepartment(id: string): Promise<void> {
  const { error } = await supabase.from('departments').delete().eq('id', id);
  if (error) throw error;
}

// Teams
export async function getTeams(orgId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*, lead:profiles(email, display_name), department:departments(id, name)')
    .eq('organization_id', orgId)
    .order('name');
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, lead: d.lead, department: d.department }));
}

export async function createTeam(orgId: string, payload: Partial<Team>): Promise<Team> {
  const { data, error } = await supabase.from('teams').insert({ ...payload, organization_id: orgId }).select().single();
  if (error) throw error;
  return data;
}

export async function updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
  const { data, error } = await supabase.from('teams').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTeam(id: string): Promise<void> {
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) throw error;
}

// Folders
export async function getWorkspaceFolders(workspaceId: string): Promise<WorkspaceFolder[]> {
  const { data, error } = await supabase.from('workspace_folders').select('*').eq('workspace_id', workspaceId).order('name');
  if (error) throw error;
  return data || [];
}

export async function createWorkspaceFolder(workspaceId: string, payload: Partial<WorkspaceFolder>): Promise<WorkspaceFolder> {
  const { data, error } = await supabase.from('workspace_folders').insert({ ...payload, workspace_id: workspaceId }).select().single();
  if (error) throw error;
  return data;
}

export async function updateWorkspaceFolder(id: string, updates: Partial<WorkspaceFolder>): Promise<WorkspaceFolder> {
  const { data, error } = await supabase.from('workspace_folders').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteWorkspaceFolder(id: string): Promise<void> {
  const { error } = await supabase.from('workspace_folders').delete().eq('id', id);
  if (error) throw error;
}

// Documents
export async function getWorkspaceDocuments(workspaceId: string, folderId?: string): Promise<WorkspaceDocument[]> {
  let q = supabase.from('workspace_documents').select('*, author:profiles(email, display_name)').eq('workspace_id', workspaceId);
  if (folderId === undefined) {
    q = q.is('folder_id', null);
  } else {
    q = q.eq('folder_id', folderId);
  }
  const { data, error } = await q.order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, author: d.author }));
}

export async function createWorkspaceDocument(workspaceId: string, payload: Partial<WorkspaceDocument>): Promise<WorkspaceDocument> {
  const { data, error } = await supabase.from('workspace_documents').insert({ ...payload, workspace_id: workspaceId }).select().single();
  if (error) throw error;
  return data;
}

export async function updateWorkspaceDocument(id: string, updates: Partial<WorkspaceDocument>): Promise<WorkspaceDocument> {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('workspace_documents')
    .update({ ...updates, updated_by: userData.user?.id, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWorkspaceDocument(id: string): Promise<void> {
  const { error } = await supabase.from('workspace_documents').delete().eq('id', id);
  if (error) throw error;
}

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('*, user:profiles(email, display_name, avatar_url)')
    .eq('workspace_id', workspaceId)
    .order('role');
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, user: d.user }));
}

// Document versions
export async function getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  const { data, error } = await supabase
    .from('document_versions')
    .select('*, author:profiles(email, display_name)')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, author: d.author }));
}

export async function createDocumentVersion(documentId: string, payload: Partial<DocumentVersion>): Promise<DocumentVersion> {
  const { data, error } = await supabase.from('document_versions').insert({ ...payload, document_id: documentId }).select().single();
  if (error) throw error;
  return data;
}

export async function restoreDocumentVersion(documentId: string, versionId: string): Promise<WorkspaceDocument> {
  const { data: version, error: vError } = await supabase.from('document_versions').select('*').eq('id', versionId).single();
  if (vError) throw vError;
  const { data, error } = await supabase
    .from('workspace_documents')
    .update({ content: version.content, current_version: version.version_number, updated_at: new Date().toISOString() })
    .eq('id', documentId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Document comments
export async function getDocumentComments(documentId: string): Promise<DocumentComment[]> {
  const { data, error } = await supabase
    .from('document_comments')
    .select('*, user:profiles(email, display_name, avatar_url)')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, user: d.user }));
}

export async function createDocumentComment(documentId: string, payload: Partial<DocumentComment>): Promise<DocumentComment> {
  const { data, error } = await supabase.from('document_comments').insert({ ...payload, document_id: documentId }).select().single();
  if (error) throw error;
  return data;
}

export async function updateDocumentComment(id: string, updates: Partial<DocumentComment>): Promise<DocumentComment> {
  const { data, error } = await supabase.from('document_comments').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteDocumentComment(id: string): Promise<void> {
  const { error } = await supabase.from('document_comments').delete().eq('id', id);
  if (error) throw error;
}

// Document tasks
export async function getDocumentTasks(documentId: string): Promise<DocumentTask[]> {
  const { data, error } = await supabase
    .from('document_tasks')
    .select('*, assignee:profiles(email, display_name)')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, assignee: d.assignee }));
}

export async function createDocumentTask(documentId: string, payload: Partial<DocumentTask>): Promise<DocumentTask> {
  const { data, error } = await supabase.from('document_tasks').insert({ ...payload, document_id: documentId }).select().single();
  if (error) throw error;
  return data;
}

export async function updateDocumentTask(id: string, updates: Partial<DocumentTask>): Promise<DocumentTask> {
  const { data, error } = await supabase.from('document_tasks').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteDocumentTask(id: string): Promise<void> {
  const { error } = await supabase.from('document_tasks').delete().eq('id', id);
  if (error) throw error;
}

// Classrooms
export async function getClassroom(id: string): Promise<Classroom | null> {
  const { data, error } = await supabase
    .from('classrooms')
    .select('*, teacher:profiles(email, display_name)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? { ...data, teacher: data.teacher } : null;
}

export async function getClassrooms(orgId: string): Promise<Classroom[]> {
  const { data, error } = await supabase
    .from('classrooms')
    .select('*, teacher:profiles(email, display_name)')
    .eq('organization_id', orgId)
    .eq('archived', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, teacher: d.teacher }));
}

export async function createClassroom(orgId: string, payload: Partial<Classroom>): Promise<Classroom> {
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  const { data, error } = await supabase
    .from('classrooms')
    .insert({ ...payload, organization_id: orgId, enrollment_code: code })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClassroom(id: string, updates: Partial<Classroom>): Promise<Classroom> {
  const { data, error } = await supabase.from('classrooms').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function getClassroomEnrollments(classroomId: string): Promise<ClassroomEnrollment[]> {
  const { data, error } = await supabase
    .from('classroom_enrollments')
    .select('*, student:profiles(email, display_name)')
    .eq('classroom_id', classroomId)
    .order('enrolled_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, student: d.student }));
}

export async function enrollStudent(classroomId: string, studentUserId: string): Promise<ClassroomEnrollment> {
  const { data, error } = await supabase.from('classroom_enrollments').insert({ classroom_id: classroomId, student_user_id: studentUserId }).select().single();
  if (error) throw error;
  return data;
}

export async function removeEnrollment(id: string): Promise<void> {
  const { error } = await supabase.from('classroom_enrollments').delete().eq('id', id);
  if (error) throw error;
}

// Assignments & submissions
export async function getClassroomAssignments(classroomId: string): Promise<Assignment[]> {
  const { data, error } = await supabase.from('assignments').select('*').eq('classroom_id', classroomId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createAssignment(classroomId: string, payload: Partial<Assignment>): Promise<Assignment> {
  const { data, error } = await supabase.from('assignments').insert({ ...payload, classroom_id: classroomId }).select().single();
  if (error) throw error;
  return data;
}

export async function getSubmissions(assignmentId: string): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*, student:profiles(email, display_name)')
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, student: d.student }));
}

export async function createSubmission(assignmentId: string, payload: Partial<Submission>): Promise<Submission> {
  const { data, error } = await supabase.from('submissions').insert({ ...payload, assignment_id: assignmentId }).select().single();
  if (error) throw error;
  return data;
}

export async function updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission> {
  const { data, error } = await supabase.from('submissions').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// Client workspaces
export async function getClientWorkspaces(orgId: string): Promise<ClientWorkspace[]> {
  const { data, error } = await supabase
    .from('client_workspaces')
    .select('*')
    .eq('agency_organization_id', orgId)
    .eq('archived', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createClientWorkspace(orgId: string, payload: Partial<ClientWorkspace>): Promise<ClientWorkspace> {
  const { data, error } = await supabase.from('client_workspaces').insert({ ...payload, agency_organization_id: orgId }).select().single();
  if (error) throw error;
  return data;
}

export async function updateClientWorkspace(id: string, updates: Partial<ClientWorkspace>): Promise<ClientWorkspace> {
  const { data, error } = await supabase.from('client_workspaces').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteClientWorkspace(id: string): Promise<void> {
  const { error } = await supabase.from('client_workspaces').delete().eq('id', id);
  if (error) throw error;
}

// Billing contracts & cost centers
export async function getBillingContracts(orgId: string): Promise<BillingContract[]> {
  const { data, error } = await supabase.from('billing_contracts').select('*').eq('organization_id', orgId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createBillingContract(orgId: string, payload: Partial<BillingContract>): Promise<BillingContract> {
  const { data, error } = await supabase.from('billing_contracts').insert({ ...payload, organization_id: orgId }).select().single();
  if (error) throw error;
  return data;
}

export async function updateBillingContract(id: string, updates: Partial<BillingContract>): Promise<BillingContract> {
  const { data, error } = await supabase.from('billing_contracts').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function getCostCenters(orgId: string): Promise<CostCenter[]> {
  const { data, error } = await supabase
    .from('cost_centers')
    .select('*, department:departments(id, name)')
    .eq('organization_id', orgId)
    .order('name');
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, department: d.department }));
}

export async function createCostCenter(orgId: string, payload: Partial<CostCenter>): Promise<CostCenter> {
  const { data, error } = await supabase.from('cost_centers').insert({ ...payload, organization_id: orgId }).select().single();
  if (error) throw error;
  return data;
}

export async function updateCostCenter(id: string, updates: Partial<CostCenter>): Promise<CostCenter> {
  const { data, error } = await supabase.from('cost_centers').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCostCenter(id: string): Promise<void> {
  const { error } = await supabase.from('cost_centers').delete().eq('id', id);
  if (error) throw error;
}

// Integrations
export async function getIntegrations(orgId: string): Promise<IntegrationConfig[]> {
  const { data, error } = await supabase.from('integrations').select('*').eq('organization_id', orgId).order('provider');
  if (error) throw error;
  return data || [];
}

export async function upsertIntegration(payload: Partial<IntegrationConfig>): Promise<IntegrationConfig> {
  const { data, error } = await supabase.from('integrations').upsert(payload).select().single();
  if (error) throw error;
  return data;
}

// Organization API keys
export async function getOrganizationApiKeys(orgId: string): Promise<OrganizationApiKey[]> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*, owner:profiles!owner_user_id(email, full_name, display_name, avatar_url)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, is_active: d.revoked_at ? false : d.is_active ?? true, owner: d.owner }));
}

export async function createOrganizationApiKey(orgId: string, payload: Partial<OrganizationApiKey>): Promise<OrganizationApiKey> {
  const { data: userData } = await supabase.auth.getUser();
  const value = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      organization_id: orgId,
      user_id: userData.user?.id,
      name: payload.name,
      key_value: value,
      environment: payload.environment || 'production',
      quota: payload.quota,
      owner_user_id: payload.owner_user_id || userData.user?.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateOrganizationApiKey(id: string, updates: Partial<OrganizationApiKey>): Promise<OrganizationApiKey> {
  const { data, error } = await supabase.from('api_keys').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function revokeOrganizationApiKey(id: string): Promise<void> {
  const { error } = await supabase.from('api_keys').update({ revoked_at: new Date().toISOString(), is_active: false }).eq('id', id);
  if (error) throw error;
}

export async function getOrganizationDashboardSummary(orgId: string): Promise<OrganizationDashboardSummary> {
  const { data, error } = await supabase.rpc('get_organization_dashboard_summary', { p_org_id: orgId });
  if (error) throw error;
  return data as OrganizationDashboardSummary;
}

export async function getOrganizationSecurityEvents(
  orgId: string,
  options: { event_type?: string; severity?: string; limit?: number } = {}
): Promise<SecurityEvent[]> {
  let q = supabase
    .from('security_events')
    .select('*, user:profiles!user_id(email, full_name, avatar_url)')
    .eq('organization_id', orgId)
    .order('detected_at', { ascending: false })
    .limit(options.limit || 100);
  if (options.event_type) q = q.eq('event_type', options.event_type);
  if (options.severity) q = q.eq('severity', options.severity);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, user: d.user }));
}

export async function getOrganizationSecurityAlerts(
  orgId: string,
  options: { status?: string; limit?: number } = {}
): Promise<SecurityAlert[]> {
  let q = supabase
    .from('security_alerts')
    .select('*, user:profiles!user_id(email, full_name, avatar_url)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(options.limit || 100);
  if (options.status) q = q.eq('status', options.status);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, user: d.user }));
}

// Notifications
export async function getMyNotifications(): Promise<Notification[]> {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userData.user!.id)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data || [];
}

export async function markNotificationRead(id: string, read = true): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: read }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userData.user!.id).eq('is_read', false);
  if (error) throw error;
}

// Activity feed
export async function getActivityFeed(filters?: { organization_id?: string; workspace_id?: string }): Promise<ActivityFeed[]> {
  let q = supabase.from('activity_feeds').select('*, user:profiles(email, display_name)').order('created_at', { ascending: false }).limit(200);
  if (filters?.organization_id) q = q.eq('organization_id', filters.organization_id);
  if (filters?.workspace_id) q = q.eq('workspace_id', filters.workspace_id);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, user: d.user }));
}

// Enterprise search (basic)
export async function enterpriseSearch(orgId: string, query: string): Promise<EnterpriseSearchResult[]> {
  const results: EnterpriseSearchResult[] = [];

  const [docs, reports, users] = await Promise.all([
    supabase
      .from('workspace_documents')
      .select('id, name, workspace_id, created_at')
      .or(`name.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(10),
    supabase
      .from('collaboration_reports')
      .select('id, title, workspace_id, created_at')
      .ilike('title', `%${query}%`)
      .limit(10),
    supabase
      .from('organization_members')
      .select('user_id, organization_id, user:profiles(email, display_name)')
      .eq('organization_id', orgId)
      .or(`user.email.ilike.%${query}%,user.display_name.ilike.%${query}%`)
      .limit(10),
  ]);

  if (docs.data) {
    results.push(...docs.data.map((d: any) => ({ id: d.id, type: 'document', title: d.name, workspace_id: d.workspace_id, created_at: d.created_at })));
  }
  if (reports.data) {
    results.push(...reports.data.map((d: any) => ({ id: d.id, type: 'report', title: d.title, workspace_id: d.workspace_id, created_at: d.created_at })));
  }
  if (users.data) {
    results.push(
      ...users.data.map((d: any) => ({
        id: d.user_id,
        type: 'user',
        title: d.user?.display_name || d.user?.email || 'User',
        subtitle: d.user?.email,
        organization_id: d.organization_id,
        created_at: d.created_at,
      }))
    );
  }

  return results;
}

// Activity logging helper
export async function logActivity(payload: Partial<ActivityFeed>): Promise<ActivityFeed> {
  const { data, error } = await supabase.from('activity_feeds').insert(payload).select().single();
  if (error) throw error;
  return data;
}

// Invitations
export async function getOrganizationInvitations(
  orgId: string,
  status?: string
): Promise<OrganizationInvitation[]> {
  let q = supabase
    .from('organization_invitations')
    .select(
      '*, inviter:profiles!invited_by(email, full_name), department:departments(id, name), team:teams(id, name), workspace:workspaces(id, name)'
    )
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((d: any) => ({
    ...d,
    inviter_name: d.inviter?.full_name,
    inviter_email: d.inviter?.email,
    department_name: d.department?.name,
    team_name: d.team?.name,
    workspace_name: d.workspace?.name,
  }));
}

export async function sendOrganizationInvitation(payload: {
  organization_id: string;
  invitee_email: string;
  role: string;
  department_id?: string;
  team_id?: string;
  workspace_id?: string;
  message?: string;
}): Promise<{ success: boolean; invitation_id?: string; status?: string }> {
  const { data, error } = await supabase.functions.invoke('enterprise-invitation', {
    body: { action: 'send', ...payload },
  });
  if (error) {
    const msg = await error?.context?.text();
    throw new Error(msg || error.message);
  }
  if (!data?.success) throw new Error(data?.error || 'Failed to send invitation');
  return data;
}

export async function resendOrganizationInvitation(
  organization_id: string,
  invitation_id: string
): Promise<{ success: boolean; status?: string }> {
  const { data, error } = await supabase.functions.invoke('enterprise-invitation', {
    body: { action: 'resend', organization_id, invitation_id },
  });
  if (error) {
    const msg = await error?.context?.text();
    throw new Error(msg || error.message);
  }
  if (!data?.success) throw new Error(data?.error || 'Failed to resend invitation');
  return data;
}

export async function revokeOrganizationInvitation(
  organization_id: string,
  invitation_id: string
): Promise<{ success: boolean; status?: string }> {
  const { data, error } = await supabase.functions.invoke('enterprise-invitation', {
    body: { action: 'revoke', organization_id, invitation_id },
  });
  if (error) {
    const msg = await error?.context?.text();
    throw new Error(msg || error.message);
  }
  if (!data?.success) throw new Error(data?.error || 'Failed to revoke invitation');
  return data;
}

export async function extendOrganizationInvitation(
  organization_id: string,
  invitation_id: string,
  days = 7
): Promise<{ success: boolean; expires_at?: string }> {
  const { data, error } = await supabase.functions.invoke('enterprise-invitation', {
    body: { action: 'extend', organization_id, invitation_id, days },
  });
  if (error) {
    const msg = await error?.context?.text();
    throw new Error(msg || error.message);
  }
  if (!data?.success) throw new Error(data?.error || 'Failed to extend invitation');
  return data;
}

export async function getInvitationByToken(token: string): Promise<OrganizationInvitation> {
  const { data, error } = await supabase.functions.invoke('enterprise-invitation', {
    body: { action: 'get', token },
  });
  if (error) {
    let body: Record<string, unknown> | undefined;
    try {
      body = await error?.context?.json();
    } catch {
      body = undefined;
    }
    const message = (body?.error as string) || (await error?.context?.text()) || error.message;
    throw new InvitationError(message, body?.error_code as string | undefined, body);
  }
  if (!data?.success || !data?.invitation) throw new InvitationError(data?.error || 'Invitation not found');
  return data.invitation;
}

export async function declineInvitation(token: string): Promise<{ success: boolean; status?: string }> {
  const { data, error } = await supabase.functions.invoke('enterprise-invitation', {
    body: { action: 'decline', token },
  });
  if (error) {
    const msg = await error?.context?.text();
    throw new Error(msg || error.message);
  }
  if (!data?.success) throw new Error(data?.error || 'Failed to decline invitation');
  return data;
}

export class InvitationError extends Error {
  code?: string;
  details?: Record<string, unknown>;
  constructor(message: string, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'InvitationError';
    this.code = code;
    this.details = details;
  }
}

export async function acceptInvitation(token: string): Promise<{ success: boolean; organization_id?: string; already_joined?: boolean }> {
  const { data, error } = await supabase.functions.invoke('enterprise-invitation', {
    body: { action: 'accept', token },
  });
  if (error) {
    let body: Record<string, unknown> | undefined;
    try {
      body = await error?.context?.json();
    } catch {
      body = undefined;
    }
    const message = (body?.error as string) || (await error?.context?.text()) || error.message;
    throw new InvitationError(message, body?.error_code as string | undefined, body);
  }
  if (!data?.success) throw new InvitationError(data?.error || 'Failed to accept invitation');
  return data;
}

export async function completeInvitation(token: string): Promise<{ success: boolean; organization_id?: string }> {
  const { data, error } = await supabase.functions.invoke('enterprise-invitation', {
    body: { action: 'complete', token },
  });
  if (error) {
    const msg = await error?.context?.text();
    throw new Error(msg || error.message);
  }
  if (!data?.success) throw new Error(data?.error || 'Failed to complete invitation');
  return data;
}

// Dashboard
export async function getEnterpriseDashboardMetrics(orgId: string): Promise<EnterpriseDashboardMetrics> {
  const { data, error } = await supabase.rpc('get_enterprise_dashboard_metrics', { p_org_id: orgId }).single();
  if (error) throw error;
  return (data || {
    total_members: 0,
    active_users: 0,
    pending_invitations: 0,
    departments_count: 0,
    teams_count: 0,
    workspaces_count: 0,
    api_calls_30d: 0,
    new_members_this_month: 0,
    storage_objects: 0,
    storage_bytes: 0,
    recent_logins: [],
    recent_security_events: [],
    recent_activity: [],
  }) as EnterpriseDashboardMetrics;
}

// Organization activity feed with filtering
export async function getOrganizationActivity(
  orgId: string,
  filters: {
    user_id?: string;
    team_id?: string;
    department_id?: string;
    event_type?: string;
    start_date?: string;
    end_date?: string;
  } = {}
): Promise<ActivityFeed[]> {
  let q = supabase
    .from('activity_feeds')
    .select('*, user:profiles!user_id(email, full_name, avatar_url)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (filters.user_id) q = q.eq('user_id', filters.user_id);
  if (filters.event_type) q = q.eq('action', filters.event_type);
  if (filters.start_date) q = q.gte('created_at', filters.start_date);
  if (filters.end_date) q = q.lte('created_at', filters.end_date);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, user: d.user }));
}

// Audit logs for an organization
export async function getOrganizationAuditLogs(orgId: string, limit = 100): Promise<any[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*, user:profiles!user_id(email, full_name)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, user: d.user }));
}

// Member login history
export async function getMemberLoginHistory(userId: string, limit = 20): Promise<any[]> {
  const { data, error } = await supabase
    .from('login_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// Force logout via Edge Function
export async function forceLogoutMember(userId: string): Promise<{ success: boolean }> {
  const { data, error } = await supabase.functions.invoke('auth-admin-actions', {
    body: { action: 'force_logout', user_id: userId },
  });
  if (error) {
    const msg = await error?.context?.text();
    throw new Error(msg || error.message);
  }
  return data || { success: false };
}
