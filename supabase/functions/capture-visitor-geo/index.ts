import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COUNTRY_NAMES = new Intl.DisplayNames(['en'], { type: 'region' });

function validCountryCode(value: string | null): string | null {
  const code = value?.trim().toUpperCase() || '';
  return /^[A-Z]{2}$/.test(code) && code !== 'XX' ? code : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const body = await req.json().catch(() => ({}));
    const visitorId = typeof body?.visitor_id === 'string' ? body.visitor_id.trim() : '';
    if (!visitorId) return new Response(JSON.stringify({ success: false, error: 'visitor_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Supabase's gateway supplies this value. Never accept country from the browser.
    const countryCode = validCountryCode(req.headers.get('cf-ipcountry'));
    if (!countryCode) return new Response(JSON.stringify({ success: true, verified: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const country = COUNTRY_NAMES.of(countryCode) || countryCode;
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase env vars');

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { error: visitorError } = await admin.from('anonymous_visitors').update({ country }).eq('visitor_id', visitorId);
    if (visitorError) throw visitorError;
    const { error: profileError } = await admin.from('customer_profiles').update({ country, updated_at: new Date().toISOString() }).eq('visitor_id', visitorId);
    if (profileError) throw profileError;

    // Record provenance separately from the legacy country column. Geographic
    // Intelligence only trusts countries backed by this server-generated event.
    const { error: provenanceError } = await admin.from('lead_events').insert({
      visitor_id: visitorId,
      event_type: 'geo_verified',
      page: null,
      metadata: { country, country_code: countryCode, source: 'supabase_gateway_cf_ipcountry' },
    });
    if (provenanceError) throw provenanceError;

    return new Response(JSON.stringify({ success: true, verified: true, country, countryCode }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[capture-visitor-geo]', error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ success: false, error: 'Unable to capture geography' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
