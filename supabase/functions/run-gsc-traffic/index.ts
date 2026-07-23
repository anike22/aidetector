import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SignJWT, importPKCS8 } from "https://deno.land/x/jose@v4.14.4/index.ts";
import { corsHeaders } from "../_shared/cors.ts";

async function getGoogleToken(serviceAccountJson: any) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;

  const privateKey = await importPKCS8(serviceAccountJson.private_key, 'RS256');

  const jwt = await new SignJWT({
    iss: serviceAccountJson.client_email,
    sub: serviceAccountJson.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(privateKey);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || 'Failed to get token');
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  
  try {
    const { domain, startDate, endDate } = await req.json();
    if (!domain) throw new Error('Domain is required');

    const authHeader = req.headers.get('Authorization')!;
    const serviceClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // Get Google Service Account JSON from DB
    const { data: keysData } = await serviceClient
      .from('system_api_keys')
      .select('key_value')
      .eq('provider', 'google_search_console_json')
      .single();

    if (!keysData || !keysData.key_value) {
      return new Response(JSON.stringify({
        success: false,
        error: "Google Search Console Service Account JSON not configured"
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let saJson;
    try {
      saJson = JSON.parse(keysData.key_value);
    } catch (e) {
      throw new Error("Invalid Google Service Account JSON format");
    }

    const token = await getGoogleToken(saJson);
    const siteUrl = domain.startsWith('http') ? domain : `sc-domain:${domain}`;

    // Default to last 30 days if dates not provided
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Query GSC Search Analytics
    const gscUrl = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
    const gscRes = await fetch(gscUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        startDate: start,
        endDate: end,
        dimensions: ['date']
      })
    });

    const gscData = await gscRes.json();
    if (!gscRes.ok) {
      throw new Error(gscData.error?.message || 'Failed to fetch GSC data');
    }

    // Process data to match traffic trends
    const rows = gscData.rows || [];
    const totalClicks = rows.reduce((acc: number, row: any) => acc + (row.clicks || 0), 0);
    const totalImpressions = rows.reduce((acc: number, row: any) => acc + (row.impressions || 0), 0);

    return new Response(JSON.stringify({
      success: true,
      domain,
      source: "Google Search Console",
      totals: {
        clicks: totalClicks,
        impressions: totalImpressions,
      },
      trend: rows.map((row: any) => ({
        date: row.keys?.[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position
      }))
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
});