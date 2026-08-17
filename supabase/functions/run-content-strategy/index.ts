import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { domain_url, target_keywords, project_id } = await req.json();
    if (!domain_url || !target_keywords) throw new Error('Missing fields');

    const authHeader = req.headers.get('Authorization')!;
    const serviceClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();

    const strategyData = {
      pillars: [
        { name: "Core Guide", target_keyword: target_keywords.split(',')[0] || 'Main', traffic_score: 85, competition: 'Medium' }
      ],
      clusters: [
        { name: "Beginner Topics", pieces: 5, traffic_score: 70 }
      ],
      calendar: [
        { title: "Definitive Guide to " + domain_url, date: new Date().toISOString(), status: "Planned" }
      ]
    };

    const { data, error } = await serviceClient.from('content_strategies').insert({
      user_id: user?.id,
      project_id: project_id || null,
      domain_url,
      target_keywords,
      status: 'Completed',
      content_pillars_count: 1,
      topic_clusters_count: 1,
      content_pieces_count: 5,
      strategy_data: strategyData
    }).select().single();

    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 400 });
  }
});
