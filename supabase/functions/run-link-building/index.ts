import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { domain_url, project_id } = await req.json();
    if (!domain_url) throw new Error('Missing fields');

    const authHeader = req.headers.get('Authorization')!;
    const serviceClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();

    const linkData = {
      gap_analysis: [
        { competitor: "comp1.com", backlinks: 500, authority: 60, gap: 120 }
      ],
      opportunities: [
        { domain: "partner.com", authority: 75, relevance: 88, type: "Guest Post", email: "contact@partner.com" }
      ]
    };

    const { data, error } = await serviceClient.from('link_building_reports').insert({
      user_id: user?.id,
      project_id: project_id || null,
      domain_url,
      status: 'Completed',
      total_opportunities: 15,
      outreach_campaigns_count: 0,
      links_acquired_count: 0,
      link_building_data: linkData
    }).select().single();

    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 400 });
  }
});
