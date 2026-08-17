import { createClient } from 'npm:@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay' | 'end';
  data: Record<string, unknown>;
}

export interface WorkflowEdge {
  source: string;
  target: string;
  sourceHandle?: 'yes' | 'no';
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface ExecutionRow {
  id: string;
  workflow_id: string;
  user_id: string;
  current_node_id: string | null;
  status: string;
  context: Record<string, unknown>;
  workflow_definition?: WorkflowDefinition;
}

export function createServiceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export function getTriggerNode(nodes: WorkflowNode[]) {
  return nodes.find((n) => n.type === 'trigger');
}

export function getNode(nodes: WorkflowNode[], id: string | null) {
  if (!id) return undefined;
  return nodes.find((n) => n.id === id);
}

export function getNextNode(nodes: WorkflowNode[], edges: WorkflowEdge[], currentId: string, branch?: 'yes' | 'no') {
  const edge = edges.find((e) => e.source === currentId && (e.sourceHandle ?? 'yes') === (branch ?? 'yes'));
  if (!edge) return undefined;
  return getNode(nodes, edge.target);
}

export async function logStep(
  supabase: ReturnType<typeof createClient>,
  executionId: string,
  stepId: string | null,
  stepType: WorkflowNode['type'],
  stepConfig: Record<string, unknown> | null,
  status: 'completed' | 'skipped' | 'failed',
  result: Record<string, unknown> | null = null,
  errorMessage?: string
) {
  await supabase.rpc('log_execution_step', {
    p_execution_id: executionId,
    p_step_id: stepId,
    p_step_type: stepType,
    p_step_config: stepConfig ?? {},
    p_status: status,
    p_result: result ?? {},
    p_error_message: errorMessage ?? null,
  });
}

export async function executeSingleExecution(
  supabase: ReturnType<typeof createClient>,
  execution: ExecutionRow
): Promise<void> {
  const def = execution.workflow_definition;
  if (!def || !def.nodes?.length) {
    await supabase.rpc('mark_execution_status', {
      p_execution_id: execution.id,
      p_status: 'failed',
      p_error_message: 'Missing workflow definition',
    });
    return;
  }

  const nodes = def.nodes;
  const edges = def.edges ?? [];
  let current = execution.current_node_id ? getNode(nodes, execution.current_node_id) : getTriggerNode(nodes);
  if (!current) current = getTriggerNode(nodes);
  if (!current) {
    await supabase.rpc('mark_execution_status', { p_execution_id: execution.id, p_status: 'failed', p_error_message: 'No trigger node' });
    return;
  }

  let stepCount = 0;
  const maxSteps = 50;

  while (current && stepCount < maxSteps) {
    stepCount += 1;

    if (current.type === 'trigger') {
      await logStep(supabase, execution.id, current.id, 'trigger', current.data, 'completed', {});
      const next = getNextNode(nodes, edges, current.id, 'yes');
      current = next;
      continue;
    }

    if (current.type === 'condition') {
      let result: Record<string, unknown> = {};
      let passed = false;
      let errorMessage: string | undefined;
      try {
        const { data, error } = await supabase.rpc('evaluate_workflow_condition', {
          p_condition: current.data,
          p_user_id: execution.user_id,
        });
        if (error) throw error;
        passed = Boolean(data);
        result = { passed };
      } catch (err) {
        errorMessage = err instanceof Error ? err.message : String(err);
      }

      await logStep(supabase, execution.id, current.id, 'condition', current.data, errorMessage ? 'failed' : 'completed', result, errorMessage);

      if (errorMessage) {
        await supabase.rpc('mark_execution_status', { p_execution_id: execution.id, p_status: 'failed', p_error_message: errorMessage });
        return;
      }

      const branch: 'yes' | 'no' = passed ? 'yes' : 'no';
      const next = getNextNode(nodes, edges, current.id, branch);
      current = next;
      continue;
    }

    if (current.type === 'action') {
      let result: Record<string, unknown> = {};
      let status: 'completed' | 'failed' = 'completed';
      let errorMessage: string | undefined;
      try {
        const { data, error } = await supabase.rpc('execute_workflow_action', {
          p_action: current.data,
          p_user_id: execution.user_id,
          p_execution_id: execution.id,
        });
        if (error) throw error;
        result = (data as Record<string, unknown>) ?? {};
      } catch (err) {
        status = 'failed';
        errorMessage = err instanceof Error ? err.message : String(err);
      }

      await logStep(supabase, execution.id, current.id, 'action', current.data, status, result, errorMessage);

      if (status === 'failed') {
        await supabase.rpc('mark_execution_status', { p_execution_id: execution.id, p_status: 'failed', p_error_message: errorMessage });
        return;
      }

      const next = getNextNode(nodes, edges, current.id, 'yes');
      current = next;
      continue;
    }

    if (current.type === 'delay') {
      const delayMinutes = Number(current.data.delayMinutes ?? 0);
      const resumeAt = new Date(Date.now() + delayMinutes * 60_000).toISOString();
      await logStep(supabase, execution.id, current.id, 'delay', current.data, 'completed', { resume_at: resumeAt });
      await supabase.rpc('queue_delayed_execution', {
        p_execution_id: execution.id,
        p_resume_at: resumeAt,
      });
      await supabase.rpc('mark_execution_status', { p_execution_id: execution.id, p_status: 'delayed' });
      return;
    }

    if (current.type === 'end') {
      await logStep(supabase, execution.id, current.id, 'end', current.data, 'completed', {});
      await supabase.rpc('mark_execution_status', { p_execution_id: execution.id, p_status: 'completed' });
      return;
    }

    // Unknown node type
    await logStep(supabase, execution.id, current.id, current.type, current.data, 'failed', {}, 'Unknown node type');
    await supabase.rpc('mark_execution_status', { p_execution_id: execution.id, p_status: 'failed', p_error_message: 'Unknown node type' });
    return;
  }

  // Exceeded max steps
  await supabase.rpc('mark_execution_status', { p_execution_id: execution.id, p_status: 'failed', p_error_message: 'Exceeded max execution steps' });
}
