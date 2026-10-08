import { authorizeWorker } from '../_shared/workerAuth.ts';
import { createServiceClient, corsHeaders } from '../_shared/automation.ts';

Deno.serve(async (req) => {
  const denied = authorizeWorker(req);
  if (denied) return denied;

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.rpc('aggregate_organization_analytics_daily');
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('team-analytics-aggregator error:', message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
