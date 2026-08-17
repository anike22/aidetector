import { supabase } from '@/db/supabase';
import type {
  Organization,
  OrganizationMember,
  OrganizationType,
  Workspace,
  WorkspaceMember,
  WorkspaceProject,
  CollaborationReport,
  SharedTemplate,
  BrandGuideline,
  ApprovalWorkflow,
  ReportApproval,
  ReportComment,
  ReportCollection,
  SsoConfiguration,
  ComplianceRecord,
  AuditLogEntry,
  OrganizationBilling,
  WorkspaceApiQuota,
  OrganizationAnalytics,
  OrganizationPlan,
  OrganizationRole,
  WorkspaceRole,
} from '@/types/team';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Organizations
export async function getMyOrganizations(): Promise<Organization[]> {
  const { data, error } = await supabase.from('organizations').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getOrganization(id: string): Promise<Organization | null> {
  const { data, error } = await supabase.from('organizations').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createOrganization(payload: {
  name: string;
  type?: OrganizationType;
  plan?: OrganizationPlan;
  domain?: string;
  logo_url?: string;
  industry?: string;
  country?: string;
  timezone?: string;
  language?: string;
  max_members?: number;
}): Promise<Organization> {
  const { data: userData } = await supabase.auth.getUser();
  const name = payload.name;
  const slug = slugify(name);
  const type = payload.type || 'business';
  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name,
      slug,
      owner_id: userData.user!.id,
      type,
      plan: payload.plan || 'team',
      domain: payload.domain,
      logo_url: payload.logo_url,
      industry: payload.industry,
      country: payload.country,
      timezone: payload.timezone || 'UTC',
      language: payload.language || 'en',
      max_members: payload.max_members,
      departments_enabled: type === 'enterprise' || type === 'school' || type === 'university' || type === 'agency',
      teams_enabled: type !== 'personal',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization> {
  const { data, error } = await supabase.from('organizations').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// Organization members
export async function getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
  const [membersRes, departmentsRes, teamsRes] = await Promise.all([
    supabase
      .from('organization_members')
      .select('*, user:profiles!user_id(email, full_name, avatar_url)')
      .eq('organization_id', orgId)
      .not('status', 'eq', 'removed')
      .order('created_at', { ascending: false }),
    supabase.from('departments').select('id, name').eq('organization_id', orgId),
    supabase.from('teams').select('id, name').eq('organization_id', orgId),
  ]);
  if (membersRes.error) throw membersRes.error;
  const deptMap = new Map((departmentsRes.data || []).map((d: any) => [d.id, d.name]));
  const teamMap = new Map((teamsRes.data || []).map((t: any) => [t.id, t.name]));
  return (membersRes.data || []).map((d: any) => ({
    ...d,
    user: d.user,
    department_names: (d.department_ids || []).map((id: string) => deptMap.get(id)).filter(Boolean),
    team_names: (d.team_ids || []).map((id: string) => teamMap.get(id)).filter(Boolean),
  }));
}

export async function getOrganizationMemberById(memberId: string): Promise<OrganizationMember | null> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('*, user:profiles!user_id(email, full_name, avatar_url)')
    .eq('id', memberId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return data;
}

export async function inviteOrganizationMember(orgId: string, email: string, role: OrganizationRole = 'member', options?: {
  department_id?: string;
  team_id?: string;
  workspace_id?: string;
  message?: string;
}): Promise<{ success: boolean; invitation_id?: string; status?: string }> {
  const { data, error } = await supabase.functions.invoke('enterprise-invitation', {
    body: {
      action: 'send',
      organization_id: orgId,
      invitee_email: email,
      role,
      department_id: options?.department_id,
      team_id: options?.team_id,
      workspace_id: options?.workspace_id,
      message: options?.message,
    },
  });
  if (error) {
    const msg = await error?.context?.text();
    throw new Error(msg || error.message);
  }
  if (!data?.success) throw new Error(data?.error || 'Failed to send invitation');
  return data;
}

export async function acceptOrganizationInvitation(token: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('enterprise-invitation', {
    body: { action: 'accept', token },
  });
  if (error) {
    const msg = await error?.context?.text();
    throw new Error(msg || error.message);
  }
  return data?.organization_id;
}

export async function updateOrganizationMember(memberId: string, updates: Partial<OrganizationMember>): Promise<void> {
  const { error } = await supabase.from('organization_members').update(updates).eq('id', memberId);
  if (error) throw error;
}

export async function getOrganizationDepartments(orgId: string): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase.from('departments').select('id, name').eq('organization_id', orgId).order('name');
  if (error) throw error;
  return data || [];
}

export async function getOrganizationTeams(orgId: string): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase.from('teams').select('id, name').eq('organization_id', orgId).order('name');
  if (error) throw error;
  return data || [];
}

export async function changeMemberDepartment(memberId: string, departmentId?: string): Promise<void> {
  const ids = departmentId ? [departmentId] : [];
  const { error } = await supabase
    .from('organization_members')
    .update({ department_ids: ids })
    .eq('id', memberId);
  if (error) throw error;
}

export async function changeMemberTeam(memberId: string, teamId?: string): Promise<void> {
  const ids = teamId ? [teamId] : [];
  const { error } = await supabase
    .from('organization_members')
    .update({ team_ids: ids })
    .eq('id', memberId);
  if (error) throw error;
}

export async function removeOrganizationMember(memberId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('organization_members')
    .update({ status: 'removed', removed_at: new Date().toISOString(), removed_by: userData.user?.id })
    .eq('id', memberId);
  if (error) throw error;
}

export async function suspendOrganizationMember(memberId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('organization_members')
    .update({ status: 'suspended', suspended_at: new Date().toISOString(), suspended_by: userData.user?.id })
    .eq('id', memberId);
  if (error) throw error;
}

export async function restoreOrganizationMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('organization_members')
    .update({ status: 'active', suspended_at: null, suspended_by: null })
    .eq('id', memberId);
  if (error) throw error;
}

export async function transferOrganizationOwnership(orgId: string, newOwnerUserId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const { error: memberError } = await supabase
    .from('organization_members')
    .update({ role: 'member' })
    .eq('organization_id', orgId)
    .eq('user_id', userData.user!.id);
  if (memberError) throw memberError;
  const { error: newOwnerError } = await supabase
    .from('organization_members')
    .update({ role: 'owner', transferred_from: userData.user!.id })
    .eq('organization_id', orgId)
    .eq('user_id', newOwnerUserId);
  if (newOwnerError) throw newOwnerError;
  const { error: orgError } = await supabase.from('organizations').update({ owner_id: newOwnerUserId }).eq('id', orgId);
  if (orgError) throw orgError;
}

export async function bulkInviteOrganizationMembers(orgId: string, invitations: { email: string; role: OrganizationRole; department_id?: string; team_id?: string; workspace_id?: string }[]): Promise<{ results: { email: string; success: boolean; error?: string }[] }> {
  const results: { email: string; success: boolean; error?: string }[] = [];
  for (const inv of invitations) {
    try {
      await inviteOrganizationMember(orgId, inv.email, inv.role, {
        department_id: inv.department_id,
        team_id: inv.team_id,
        workspace_id: inv.workspace_id,
      });
      results.push({ email: inv.email, success: true });
    } catch (err: any) {
      results.push({ email: inv.email, success: false, error: err.message });
    }
  }
  return { results };
}

// Workspaces
export async function getOrganizationWorkspaces(orgId: string): Promise<Workspace[]> {
  const { data, error } = await supabase.from('workspaces').select('*').eq('organization_id', orgId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getWorkspace(id: string): Promise<Workspace | null> {
  const { data, error } = await supabase.from('workspaces').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createWorkspace(orgId: string, payload: { name: string; description?: string }): Promise<Workspace> {
  const { data: userData } = await supabase.auth.getUser();
  const slug = slugify(payload.name);
  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      organization_id: orgId,
      name: payload.name,
      slug,
      description: payload.description,
      created_by: userData.user!.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace> {
  const { data, error } = await supabase.from('workspaces').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// Workspace members
export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('*, user:profiles(email, display_name, avatar_url)')
    .eq('workspace_id', workspaceId)
    .order('added_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, user: d.user }));
}

export async function addWorkspaceMember(workspaceId: string, userId: string, role: WorkspaceRole = 'contributor', permissions: string[] = []): Promise<void> {
  const { error } = await supabase.from('workspace_members').insert({
    workspace_id: workspaceId,
    user_id: userId,
    role,
    permissions,
  });
  if (error) throw error;
}

export async function updateWorkspaceMember(memberId: string, updates: Partial<WorkspaceMember>): Promise<void> {
  const { error } = await supabase.from('workspace_members').update(updates).eq('id', memberId);
  if (error) throw error;
}

export async function removeWorkspaceMember(memberId: string): Promise<void> {
  const { error } = await supabase.from('workspace_members').delete().eq('id', memberId);
  if (error) throw error;
}

// Projects
export async function getWorkspaceProjects(workspaceId: string): Promise<WorkspaceProject[]> {
  const { data, error } = await supabase
    .from('workspace_projects')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createProject(workspaceId: string, payload: { name: string; description?: string }): Promise<WorkspaceProject> {
  const { data, error } = await supabase
    .from('workspace_projects')
    .insert({ workspace_id: workspaceId, name: payload.name, description: payload.description })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(id: string, updates: Partial<WorkspaceProject>): Promise<WorkspaceProject> {
  const { data, error } = await supabase.from('workspace_projects').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// Reports
export async function getReport(id: string): Promise<CollaborationReport | null> {
  const { data, error } = await supabase
    .from('collaboration_reports')
    .select('*, project:workspace_projects(id, name)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? { ...data, project: data.project } : null;
}

export async function getWorkspaceReports(workspaceId: string): Promise<CollaborationReport[]> {
  const { data, error } = await supabase
    .from('collaboration_reports')
    .select('*, project:workspace_projects(id, name)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, project: d.project }));
}

export async function createReport(workspaceId: string, payload: { title: string; project_id?: string; tool_type?: string }): Promise<CollaborationReport> {
  const { data, error } = await supabase
    .from('collaboration_reports')
    .insert({ workspace_id: workspaceId, title: payload.title, project_id: payload.project_id, tool_type: payload.tool_type || 'detector' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateReport(id: string, updates: Partial<CollaborationReport>): Promise<CollaborationReport> {
  const { data, error } = await supabase.from('collaboration_reports').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteReport(id: string): Promise<void> {
  const { error } = await supabase.from('collaboration_reports').delete().eq('id', id);
  if (error) throw error;
}

// Templates
export async function getWorkspaceTemplates(workspaceId: string): Promise<SharedTemplate[]> {
  const { data, error } = await supabase
    .from('shared_templates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createTemplate(workspaceId: string, payload: Partial<SharedTemplate>): Promise<SharedTemplate> {
  const { data, error } = await supabase.from('shared_templates').insert({ ...payload, workspace_id: workspaceId }).select().single();
  if (error) throw error;
  return data;
}

export async function updateTemplate(id: string, updates: Partial<SharedTemplate>): Promise<SharedTemplate> {
  const { data, error } = await supabase.from('shared_templates').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('shared_templates').delete().eq('id', id);
  if (error) throw error;
}

// Guidelines
export async function getWorkspaceGuidelines(workspaceId: string): Promise<BrandGuideline[]> {
  const { data, error } = await supabase
    .from('brand_guidelines')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createGuideline(workspaceId: string, payload: Partial<BrandGuideline>): Promise<BrandGuideline> {
  const { data, error } = await supabase.from('brand_guidelines').insert({ ...payload, workspace_id: workspaceId }).select().single();
  if (error) throw error;
  return data;
}

export async function updateGuideline(id: string, updates: Partial<BrandGuideline>): Promise<BrandGuideline> {
  const { data, error } = await supabase.from('brand_guidelines').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteGuideline(id: string): Promise<void> {
  const { error } = await supabase.from('brand_guidelines').delete().eq('id', id);
  if (error) throw error;
}

// Approval workflows
export async function getWorkspaceWorkflows(workspaceId: string): Promise<ApprovalWorkflow[]> {
  const { data, error } = await supabase
    .from('approval_workflows')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, steps: d.steps || [] }));
}

export async function createWorkflow(workspaceId: string, payload: Partial<ApprovalWorkflow>): Promise<ApprovalWorkflow> {
  const { data, error } = await supabase.from('approval_workflows').insert({ ...payload, workspace_id: workspaceId }).select().single();
  if (error) throw error;
  return { ...data, steps: data.steps || [] };
}

export async function updateWorkflow(id: string, updates: Partial<ApprovalWorkflow>): Promise<ApprovalWorkflow> {
  const { data, error } = await supabase.from('approval_workflows').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return { ...data, steps: data.steps || [] };
}

export async function deleteWorkflow(id: string): Promise<void> {
  const { error } = await supabase.from('approval_workflows').delete().eq('id', id);
  if (error) throw error;
}

// Approvals
export async function submitReportForApproval(reportId: string, workflowId: string): Promise<string> {
  const { data, error } = await supabase.rpc('submit_report_for_approval', { p_report_id: reportId, p_workflow_id: workflowId });
  if (error) throw error;
  return data;
}

export async function decideApprovalStep(approvalId: string, stepOrder: number, action: 'approved' | 'rejected', comments?: string): Promise<void> {
  const { error } = await supabase.rpc('decide_approval_step', {
    p_approval_id: approvalId,
    p_step_order: stepOrder,
    p_action: action,
    p_comments: comments || null,
  });
  if (error) throw error;
}

export async function getReportApprovals(reportId: string): Promise<ReportApproval[]> {
  const { data, error } = await supabase
    .from('report_approvals')
    .select('*, steps:approval_steps(*, approver:profiles(display_name, email))')
    .eq('report_id', reportId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, steps: d.steps || [] }));
}

// Comments
export async function getReportComments(reportId: string): Promise<ReportComment[]> {
  const { data, error } = await supabase
    .from('report_comments')
    .select('*, user:profiles(display_name, email, avatar_url)')
    .eq('report_id', reportId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, user: d.user }));
}

export async function createReportComment(reportId: string, content: string, parentCommentId?: string): Promise<ReportComment> {
  const { data, error } = await supabase
    .from('report_comments')
    .insert({ report_id: reportId, content, parent_comment_id: parentCommentId })
    .select('*, user:profiles(display_name, email, avatar_url)')
    .single();
  if (error) throw error;
  return { ...data, user: data.user };
}

// Collections
export async function getWorkspaceCollections(workspaceId: string): Promise<ReportCollection[]> {
  const { data, error } = await supabase
    .from('report_collections')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createCollection(workspaceId: string, payload: { name: string; description?: string }): Promise<ReportCollection> {
  const { data, error } = await supabase
    .from('report_collections')
    .insert({ workspace_id: workspaceId, name: payload.name, description: payload.description })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// SSO
export async function getOrganizationSso(orgId: string): Promise<SsoConfiguration[]> {
  const { data, error } = await supabase.from('sso_configurations').select('*').eq('organization_id', orgId);
  if (error) throw error;
  return data || [];
}

export async function upsertSsoConfig(payload: Partial<SsoConfiguration>): Promise<SsoConfiguration> {
  const { data, error } = await supabase.from('sso_configurations').upsert(payload).select().single();
  if (error) throw error;
  return data;
}

// Compliance
export async function getOrganizationCompliance(orgId: string): Promise<ComplianceRecord[]> {
  const { data, error } = await supabase.from('compliance_records').select('*').eq('organization_id', orgId);
  if (error) throw error;
  return data || [];
}

export async function updateComplianceRecord(id: string, updates: Partial<ComplianceRecord>): Promise<ComplianceRecord> {
  const { data, error } = await supabase.from('compliance_records').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// Audit logs
export async function getOrganizationAuditLogs(orgId: string, limit = 100): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*, user:profiles(display_name, email)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, user: d.user }));
}

export async function logAuditEvent(
  organizationId: string,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.rpc('log_audit_event', {
    p_organization_id: organizationId,
    p_action: action,
    p_resource_type: resourceType || null,
    p_resource_id: resourceId || null,
    p_details: details || null,
  });
  if (error) throw error;
}

// Billing
export async function getOrganizationBilling(orgId: string): Promise<OrganizationBilling | null> {
  const { data, error } = await supabase.from('organization_billing').select('*').eq('organization_id', orgId).maybeSingle();
  if (error) throw error;
  return data;
}

// API quotas
export async function getWorkspaceApiQuota(workspaceId: string): Promise<WorkspaceApiQuota | null> {
  const { data, error } = await supabase.from('workspace_api_quotas').select('*').eq('workspace_id', workspaceId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateWorkspaceApiQuota(workspaceId: string, quota: number): Promise<WorkspaceApiQuota> {
  const { data, error } = await supabase
    .from('workspace_api_quotas')
    .upsert({ workspace_id: workspaceId, quota })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Analytics
export async function getOrganizationAnalytics(orgId: string): Promise<OrganizationAnalytics> {
  const { data, error } = await supabase.rpc('get_organization_analytics', { p_org_id: orgId });
  if (error) throw error;
  return data as OrganizationAnalytics;
}

// Search users by email
export async function searchUsersByEmail(email: string): Promise<{ id: string; email: string; display_name?: string }[]> {
  const { data, error } = await supabase.from('profiles').select('id, email, display_name').ilike('email', `%${email}%`).limit(10);
  if (error) throw error;
  return data || [];
}

export async function getOrganizationMembership(orgId: string, userId: string): Promise<OrganizationMember | null> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('*, user:profiles!user_id(email, full_name, avatar_url)')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .not('status', 'eq', 'removed')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateUserActiveOrganization(
  orgId: string | null,
  workspaceId?: string | null
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;
  const { error } = await supabase
    .from('profiles')
    .update({ active_organization_id: orgId, active_workspace_id: workspaceId ?? null })
    .eq('id', userId);
  if (error) throw error;
}

export async function getUserActiveOrganization(userId: string): Promise<{ active_organization_id?: string | null; active_workspace_id?: string | null } | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('active_organization_id, active_workspace_id')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
