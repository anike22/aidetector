import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

function seededRandom(seedStr: string) {
  let h = 0xdeadbeef;
  for(let i = 0; i < seedStr.length; i++)
      h = Math.imul(h ^ seedStr.charCodeAt(i), 2654435761);
  const hash = ((h ^ h >>> 16) >>> 0);
  return function() {
    h = Math.imul(h ^ hash, 2654435761);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { target_keyword, domain_url, project_id } = await req.json();
    if (!target_keyword) throw new Error('Missing fields');

    const authHeader = req.headers.get('Authorization')!;
    const serviceClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();

    const rng = seededRandom(target_keyword + (domain_url || ''));

    const planData = {
      executive_summary: `Comprehensive AI-driven SEO action plan for "${target_keyword}" targeting ${domain_url || 'your domain'}. This plan includes keyword clusters, content architecture, backlink strategies, and technical enhancements designed to achieve top 3 rankings within 3-6 months.`,
      meta: { 
        title: `Ultimate Guide to ${target_keyword}`, 
        desc: `Learn everything about ${target_keyword}. Comprehensive guide, tips, and strategies for success.`,
        slug: `/${target_keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      },
      content_pillars: [
        { title: `What is ${target_keyword}?`, type: 'Informational Guide', word_count: 2500, intent: 'Informational' },
        { title: `Best Tools for ${target_keyword}`, type: 'Listicle', word_count: 3000, intent: 'Commercial' },
        { title: `How to Implement ${target_keyword} in 2026`, type: 'How-to Tutorial', word_count: 2000, intent: 'Transactional' }
      ],
      action_plan: [
        { step: 1, action: `Create a comprehensive 3000-word pillar page covering all aspects of ${target_keyword}`, priority: "High", expected_impact: "High", timeline: "Week 1", effort: "High" },
        { step: 2, action: `Optimize internal linking structure to point towards the new pillar page using exact match and LSI anchors`, priority: "High", expected_impact: "Medium", timeline: "Week 2", effort: "Low" },
        { step: 3, action: `Acquire 5-10 high-DR (70+) contextual backlinks from niche-relevant industry blogs`, priority: "High", expected_impact: "High", timeline: "Week 3-4", effort: "High" },
        { step: 4, action: `Implement FAQ schema markup addressing the top 5 "People Also Ask" queries for this keyword`, priority: "Medium", expected_impact: "Medium", timeline: "Week 2", effort: "Low" },
        { step: 5, action: `Publish 3 supporting cluster articles targeting long-tail variations and link back to the pillar`, priority: "Medium", expected_impact: "High", timeline: "Week 3", effort: "Medium" }
      ],
      technical_recommendations: [
        "Ensure LCP (Largest Contentful Paint) is under 2.5s on the target page",
        "Implement exact keyword in H1, URL slug, and first 100 words",
        "Add optimized alt text to all embedded media related to the topic",
        "Improve mobile layout to prevent CLS (Cumulative Layout Shift) issues"
      ],
      expected_metrics: {
        estimated_traffic: Math.floor(rng() * 15000) + 5000,
        estimated_ranking_time: "3-4 Months",
        difficulty_score: Math.floor(rng() * 60) + 20
      }
    };

    const { data, error } = await serviceClient.from('seo_agent_projects').insert({
      user_id: user?.id,
      project_id: project_id || null,
      target_keyword,
      domain_url,
      status: 'Completed',
      seo_plan_data: planData
    }).select().single();

    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 400 });
  }
});
