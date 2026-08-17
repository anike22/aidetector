import { createServiceClient, corsHeaders } from '../_shared/automation.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { organization_id, action, resource_type, resource_id, details } = body;
    if (!organization_id || !action) throw new Error('organization_id and action are required');

    const supabase = createServiceClient();
    const { error } = await supabase.rpc('log_audit_event', {
      p_organization_id: organization_id,
      p_action: action,
      p_resource_type: resource_type || null,
      p_resource_id: resource_id || null,
      p_details: details || null,
    });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('team-audit-logger error:', message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
