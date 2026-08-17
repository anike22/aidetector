import { createServiceClient, corsHeaders } from '../_shared/automation.ts';

interface AutomationEvent {
  id: string;
  event_type: string;
  user_id: string;
  event_data: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createServiceClient();

    const { data: events, error } = await supabase
      .from('automation_events')
      .select('id, event_type, user_id, event_data')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(100);
    if (error) throw error;

    const rows = Array.isArray(events) ? (events as AutomationEvent[]) : [];
    let processed = 0;
    let failed = 0;

    for (const event of rows) {
      try {
        await supabase.rpc('process_automation_event', {
          p_event_type: event.event_type,
          p_user_id: event.user_id,
          p_event_data: event.event_data,
        });
        await supabase.from('automation_events').delete().eq('id', event.id);
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
