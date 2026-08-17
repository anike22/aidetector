import { createServiceClient, executeSingleExecution, corsHeaders } from '../_shared/automation.ts';

interface ExecutionRow {
  id: string;
  workflow_id: string;
  user_id: string;
  current_node_id: string | null;
  status: string;
  context: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createServiceClient();

    const now = new Date().toISOString();
    const { data: dueRows, error } = await supabase
      .from('automation_executions')
      .select('id, workflow_id, user_id, current_node_id, status, context')
      .or(`and(status.eq.delayed,scheduled_resume_at.lte.${now}),status.eq.running`)
      .order('created_at', { ascending: true })
      .limit(100);
    if (error) throw error;

    const executions = Array.isArray(dueRows) ? (dueRows as ExecutionRow[]) : [];
    let processed = 0;
    let failed = 0;

    for (const execution of executions) {
      try {
        if (execution.status === 'delayed') {
          await supabase.rpc('resume_execution', { p_execution_id: execution.id });
        }

        const { data: wfData, error: wfError } = await supabase
          .from('automation_workflows')
          .select('workflow_definition')
          .eq('id', execution.workflow_id)
          .maybeSingle();
        if (wfError) throw wfError;

        const workflowDefinition = (wfData as { workflow_definition: Record<string, unknown> } | null)?.workflow_definition;

        await executeSingleExecution(supabase, {
          ...execution,
          workflow_definition: workflowDefinition as {
            nodes: { id: string; type: 'trigger' | 'condition' | 'action' | 'delay' | 'end'; data: Record<string, unknown> }[];
            edges: { source: string; target: string; sourceHandle?: 'yes' | 'no' }[];
          },
        });
        processed += 1;
      } catch (e) {
        console.error('Failed to execute', execution.id, e);
        failed += 1;
        try {
          await supabase.rpc('mark_execution_status', {
            p_execution_id: execution.id,
            p_status: 'failed',
            p_error_message: e instanceof Error ? e.message : String(e),
          });
        } catch {
          // ignore
        }
      }
    }

    return new Response(JSON.stringify({ success: true, processed, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('automation-scheduler error:', message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
