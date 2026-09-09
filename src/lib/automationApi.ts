import { supabase } from '@/db/supabase';
import type {
  AutomationAnalyticsRow,
  AutomationEvent,
  AutomationEventInput,
  AutomationExecution,
  AutomationExecutionLog,
  AutomationTemplate,
  AutomationWorkflow,
  AutomationWorkflowVersion,
  UserCommunicationPreferences,
  WorkflowDefinition,
} from '@/types/automation';

export async function listWorkflows(): Promise<AutomationWorkflow[]> {
  const { data, error } = await supabase
    .from('automation_workflows')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return Array.isArray(data) ? (data as AutomationWorkflow[]) : [];
}

export async function getWorkflow(id: string): Promise<AutomationWorkflow | null> {
  const { data, error } = await supabase
    .from('automation_workflows')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as AutomationWorkflow | null) ?? null;
}

export async function createWorkflow(payload: {
  name: string;
  description?: string;
  trigger_type: string;
  trigger_config?: Record<string, unknown>;
  workflow_definition: WorkflowDefinition;
  status?: AutomationWorkflow['status'];
}): Promise<AutomationWorkflow> {
  const { data, error } = await supabase
    .from('automation_workflows')
    .insert({
      name: payload.name,
      description: payload.description ?? null,
      trigger_type: payload.trigger_type,
      trigger_config: payload.trigger_config ?? {},
      workflow_definition: payload.workflow_definition,
      status: payload.status ?? 'draft',
    })
    .select()
    .single();
  if (error || !data) throw error ?? new Error('Failed to create workflow');
  return data as AutomationWorkflow;
}

export async function updateWorkflow(
  id: string,
  payload: Partial<Pick<AutomationWorkflow, 'name' | 'description' | 'status' | 'trigger_type' | 'trigger_config' | 'workflow_definition'>>
): Promise<AutomationWorkflow> {
  const update: Record<string, unknown> = {};
  if (payload.name !== undefined) update.name = payload.name;
  if (payload.description !== undefined) update.description = payload.description;
  if (payload.status !== undefined) update.status = payload.status;
  if (payload.trigger_type !== undefined) update.trigger_type = payload.trigger_type;
  if (payload.trigger_config !== undefined) update.trigger_config = payload.trigger_config;
  if (payload.workflow_definition !== undefined) {
    update.workflow_definition = payload.workflow_definition;
    update.version = 0; // trigger in DB will handle versioning if added later; otherwise use separate call
  }

  const { data, error } = await supabase
    .from('automation_workflows')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error || !data) throw error ?? new Error('Failed to update workflow');
  return data as AutomationWorkflow;
}

export async function publishWorkflowVersion(
  id: string,
  workflowDefinition: WorkflowDefinition,
  versionNote?: string
): Promise<AutomationWorkflowVersion> {
  const current = await getWorkflow(id);
  if (!current) throw new Error('Workflow not found');

  const nextVersion = current.version + 1;
  const { data: updated, error: updateError } = await supabase
    .from('automation_workflows')
    .update({
      workflow_definition: workflowDefinition,
      version: nextVersion,
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (updateError || !updated) throw updateError ?? new Error('Failed to publish workflow');

  const { data: versionRow, error: versionError } = await supabase
    .from('automation_workflow_versions')
    .insert({
      workflow_id: id,
      version: nextVersion,
      workflow_definition: workflowDefinition,
    })
    .select()
    .single();
  if (versionError || !versionRow) throw versionError ?? new Error('Failed to save version');
  void versionNote;
  return versionRow as AutomationWorkflowVersion;
}

export async function deleteWorkflow(id: string): Promise<void> {
  const { error } = await supabase.from('automation_workflows').delete().eq('id', id);
  if (error) throw error;
}

export async function listTemplates(): Promise<AutomationTemplate[]> {
  const { data, error } = await supabase
    .from('automation_templates')
    .select('*')
    .eq('enabled', true)
    .order('category', { ascending: true });
  if (error) throw error;
  return Array.isArray(data) ? (data as AutomationTemplate[]) : [];
}

export async function createWorkflowFromTemplate(
  templateId: string,
  name: string
): Promise<AutomationWorkflow> {
  const { data: template, error: templateError } = await supabase
    .from('automation_templates')
    .select('*')
    .eq('id', templateId)
    .maybeSingle();
  if (templateError || !template) throw templateError ?? new Error('Template not found');

  const t = template as AutomationTemplate;
  return createWorkflow({
    name,
    description: t.description ?? undefined,
    trigger_type: t.workflow_definition.nodes.find((n) => n.type === 'trigger')?.data?.eventType ?? 'manual',
    workflow_definition: t.workflow_definition,
  });
}

export async function listExecutions(options: {
  workflowId?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ data: AutomationExecution[]; count: number }> {
  let q = supabase
    .from('automation_executions')
    .select('*, workflow:automation_workflows(*)', { count: 'exact' })
    .order('created_at', { ascending: false });
  if (options.workflowId) q = q.eq('workflow_id', options.workflowId);
  if (options.limit) q = q.limit(options.limit);
  const { data, error, count } = await q;
  if (error) throw error;
  return { data: Array.isArray(data) ? (data as AutomationExecution[]) : [], count: count ?? 0 };
}

export async function getExecutionLogs(executionId: string): Promise<AutomationExecutionLog[]> {
  const { data, error } = await supabase
    .from('automation_execution_logs')
    .select('*')
    .eq('execution_id', executionId)
    .order('timestamp', { ascending: true });
  if (error) throw error;
  return Array.isArray(data) ? (data as AutomationExecutionLog[]) : [];
}

export async function getAutomationAnalytics(params: {
  workflowId?: string;
  startDate?: string;
  endDate?: string;
} = {}): Promise<AutomationAnalyticsRow[]> {
  const { data, error } = await supabase.rpc('get_automation_analytics', {
    p_workflow_id: params.workflowId ?? null,
    p_start_date: params.startDate ?? null,
    p_end_date: params.endDate ?? null,
  });
  if (error) throw error;
  return Array.isArray(data) ? (data as AutomationAnalyticsRow[]) : [];
}

const inflightGets = new Map<string, Promise<UserCommunicationPreferences | null>>();
const inflightUpserts = new Map<string, Promise<UserCommunicationPreferences>>();

export async function getUserCommunicationPreferences(
  userId: string
): Promise<UserCommunicationPreferences | null> {
  const existing = inflightGets.get(userId);
  if (existing) return existing;

  const promise = (async () => {
    const { data, error } = await supabase.rpc('get_user_communication_preferences', {
      p_user_id: userId,
    });
    if (error) throw error;
    return (data as UserCommunicationPreferences | null) ?? null;
  })();

  inflightGets.set(userId, promise);
  promise.finally(() => inflightGets.delete(userId));
  return promise;
}

export async function upsertCommunicationPreferences(
  userId: string,
  preferences: Partial<Omit<UserCommunicationPreferences, 'user_id' | 'updated_at'>>
): Promise<UserCommunicationPreferences> {
  const existing = inflightUpserts.get(userId);
  if (existing) return existing;

  const promise = (async () => {
    const { data, error } = await supabase.rpc('upsert_communication_preferences', {
      p_user_id: userId,
      p_product_tips: preferences.product_tips ?? null,
      p_feature_updates: preferences.feature_updates ?? null,
      p_security_notifications: preferences.security_notifications ?? null,
      p_billing_notifications: preferences.billing_notifications ?? null,
      p_marketing_communications: preferences.marketing_communications ?? null,
      p_weekly_summaries: preferences.weekly_summaries ?? null,
      p_email: preferences.email_enabled ?? null,
      p_in_app: preferences.in_app_enabled ?? null,
      p_dashboard_announcements: preferences.dashboard_announcements_enabled ?? null,
      p_max_messages_per_day: preferences.max_messages_per_day ?? null,
      p_timezone: preferences.timezone ?? null,
      p_quiet_hours_start: preferences.quiet_hours_start ?? null,
      p_quiet_hours_end: preferences.quiet_hours_end ?? null,
    });
    if (error) throw error;
    return data as UserCommunicationPreferences;
  })();

  inflightUpserts.set(userId, promise);
  promise.finally(() => inflightUpserts.delete(userId));
  return promise;
}

export async function trackAutomationEvent(input: AutomationEventInput): Promise<AutomationEvent | null> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from('automation_events')
    .insert({
      event_type: input.eventType,
      user_id: user.id,
      event_data: input.metadata ?? {},
      processed: false,
    })
    .select()
    .single();
  if (error) {
    console.error('trackAutomationEvent error:', error);
    return null;
  }
  return (data as AutomationEvent | null) ?? null;
}

export async function processAutomationEvent(
  eventType: string,
  userId: string,
  eventData: Record<string, unknown> = {}
): Promise<string[]> {
  const { data, error } = await supabase.rpc('process_automation_event', {
    p_event_type: eventType,
    p_user_id: userId,
    p_event_data: eventData,
  });
  if (error) throw error;
  return Array.isArray(data) ? (data as string[]) : [];
}
