import { authorizeWorker } from '../_shared/workerAuth.ts';
import { createServiceClient, corsHeaders } from '../_shared/automation.ts';

interface AutomationEvent {
  id: string;
  event_type: string;
  user_id: string;
  event_data: Record<string, unknown>;
}

Deno.serve(async (req) => {
  const denied = authorizeWorker(req);
  if (denied) return denied;

  try {
    const supabase = createServiceClient();

    const cutoff = Deno.env.get('AUTOMATION_EVENT_PROCESSING_START_AT');
    if (!cutoff || !Number.isFinite(Date.parse(cutoff))) return Response.json({ success: false, error: 'Event processing cutoff is not configured' }, { status: 503 });
    const { count: workflowCount, error: workflowError } = await supabase.from('automation_workflows').select('id', { count: 'exact', head: true }).eq('status', 'active');
    if (workflowError) throw workflowError;
    if (!workflowCount) return Response.json({ success: true, processed: 0, held: 'no_active_workflows' });

    const { data: events, error } = await supabase
      .from('automation_events')
      .select('id, event_type, user_id, event_data')
      .eq('processed', false)
      .gte('created_at', new Date(cutoff).toISOString())
      .order('created_at', { ascending: true })
      .limit(100);
    if (error) throw error;

    const rows = Array.isArray(events) ? (events as AutomationEvent[]) : [];
    let processed = 0;
    let failed = 0;

    for (const event of rows) {
      try {
        const { error: processError } = await supabase.rpc('process_automation_event', {
          p_event_type: event.event_type,
          p_user_id: event.user_id,
          p_event_data: event.event_data,
        });
        if (processError) throw processError;
        const { error: updateError } = await supabase.from('automation_events').update({ processed: true }).eq('id', event.id).eq('processed', false);
        if (updateError) throw updateError;
        processed += 1;
      } catch (e) {
        console.error('Failed to process event', event.id, e);
        failed += 1;
      }
    }

    return new Response(JSON.stringify({ success: true, processed, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('automation-event-processor error:', message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
