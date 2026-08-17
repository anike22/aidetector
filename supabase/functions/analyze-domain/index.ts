import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// Deterministic random number generator based on a seed string (domain)
function seededRandom(seedStr: string) {
  let h = 0xdeadbeef;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 2654435761);
  }
  let seed = ((h ^ h >>> 16) >>> 0);
  
  return function() {
    seed = (seed * 1664525 + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const serviceClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id || null;

    const { domain, project_id } = await req.json();
    if (!domain) throw new Error('Domain is required');

    // Create report entry
    const { data: report, error: reportError } = await serviceClient
      .from('domain_overview_reports')
      .insert({
        project_id: project_id || null,
        user_id: userId,
        domain: domain,
        report_type: 'Domain Overview',
        status: 'In Progress'
      })
      .select()
      .single();

    if (reportError || !report) throw new Error('Failed to create report');

    const rng = seededRandom(domain);
    const start_time = Date.now();

    // Data generation logic using RNG
    const da = Math.floor(rng() * 60) + 10;
    const dr = Math.floor(rng() * 60) + 10;
    const trust = Math.floor(rng() * 70) + 20;

    const organic_traffic = Math.floor(rng() * 100000);
    
    // Generates a simple trend array
    const generateTrend = (base: number, length: number = 6) => {
      return Array.from({ length }).map((_, i) => ({
        date: new Date(Date.now() - (length - 1 - i) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: Math.max(0, Math.floor(base * (0.8 + rng() * 0.4)))
      }));
    };

    // 1. Authority Data
    await serviceClient.from('domain_authority_data').insert({
      report_id: report.report_id,
      domain,
      domain_authority: da,
      domain_rating: dr,
      trust_score: trust,
      authority_trend: generateTrend(da, 12)
    });

    // 2. Traffic Data
    await serviceClient.from('domain_traffic_data').insert({
      report_id: report.report_id,
      domain,
      organic_traffic,
      traffic_trend: generateTrend(organic_traffic, 12),
      geographic_distribution: [
        { country: 'US', percentage: Math.floor(rng() * 40) + 20 },
        { country: 'UK', percentage: Math.floor(rng() * 20) + 10 },
        { country: 'CA', percentage: Math.floor(rng() * 15) + 5 },
        { country: 'AU', percentage: Math.floor(rng() * 10) + 5 },
        { country: 'Other', percentage: 10 }
      ],
      device_distribution: { desktop: 55, mobile: 40, tablet: 5 }
    });

    // 3. Keyword Rankings
    const totalKeywords = Math.floor(rng() * 10000);
    await serviceClient.from('domain_keyword_rankings').insert({
      report_id: report.report_id,
      domain,
      total_ranking_keywords: totalKeywords,
      top_10_keywords: Math.floor(totalKeywords * 0.05),
      top_50_keywords: Math.floor(totalKeywords * 0.2),
      keyword_opportunities: Math.floor(totalKeywords * 0.15),
      keyword_trend: generateTrend(totalKeywords, 6),
      top_keywords: [
        { keyword: `${domain.split('.')[0]} login`, position: 1, volume: 5000, traffic: 1500, trend: 'up' },
        { keyword: `what is ${domain.split('.')[0]}`, position: 2, volume: 3200, traffic: 800, trend: 'flat' },
        { keyword: `${domain.split('.')[0]} alternative`, position: 5, volume: 2100, traffic: 300, trend: 'down' }
      ]
    });

    // 4. Backlinks
    const totalBacklinks = Math.floor(rng() * 50000);
    const dofollow = Math.floor(totalBacklinks * 0.6);
    await serviceClient.from('domain_backlinks').insert({
      report_id: report.report_id,
      domain,
      total_backlinks: totalBacklinks,
      referring_domains: Math.floor(totalBacklinks / 10),
      dofollow_backlinks: dofollow,
      nofollow_backlinks: totalBacklinks - dofollow,
      toxic_backlinks: Math.floor(totalBacklinks * 0.02),
      backlink_trend: generateTrend(totalBacklinks, 12),
      top_referring_domains: [
        { domain: 'medium.com', count: 120, da: 95, dr: 94, type: 'dofollow' },
        { domain: 'github.com', count: 85, da: 96, dr: 96, type: 'nofollow' }
      ]
    });

    // 5. Competitors
    await serviceClient.from('domain_competitors').insert({
      report_id: report.report_id,
      domain,
      organic_competitors: [
        { domain: 'competitor1.com', overlap: 45 },
        { domain: 'competitor2.com', overlap: 30 }
      ],
      keyword_competitors: [
        { domain: 'competitor1.com', overlap: 40, common: 500 },
        { domain: 'competitor3.com', overlap: 25, common: 300 }
      ],
      content_competitors: [
        { domain: 'content-comp.com', overlap: 55 }
      ]
    });

    // 6. AI Visibility
    const aiScore = Math.floor(rng() * 70) + 10;
    await serviceClient.from('domain_ai_visibility').insert({
      report_id: report.report_id,
      domain,
      overall_ai_visibility_score: aiScore,
      chatgpt_visibility_score: Math.floor(rng() * 80) + 10,
      chatgpt_mention_count: Math.floor(rng() * 100),
      chatgpt_trend: generateTrend(aiScore),
      google_ai_overviews_visibility_score: Math.floor(rng() * 80) + 10,
      google_ai_overviews_featured_count: Math.floor(rng() * 50),
      google_ai_overviews_trend: generateTrend(aiScore),
      gemini_visibility_score: Math.floor(rng() * 80) + 10,
      gemini_mention_count: Math.floor(rng() * 80),
      gemini_trend: generateTrend(aiScore),
      claude_visibility_score: Math.floor(rng() * 80) + 10,
      claude_mention_count: Math.floor(rng() * 60),
      claude_trend: generateTrend(aiScore),
      perplexity_visibility_score: Math.floor(rng() * 80) + 10,
      perplexity_citation_count: Math.floor(rng() * 40),
      perplexity_trend: generateTrend(aiScore),
      ai_visibility_trend: generateTrend(aiScore, 6),
      top_ai_visible_content: [
        { url: `https://${domain}/about`, mentions: 45, platform: 'ChatGPT', score: 85 }
      ]
    });

    // 7. AEO Scores
    const aeoScore = Math.floor(rng() * 60) + 20;
    await serviceClient.from('domain_aeo_scores').insert({
      report_id: report.report_id,
      domain,
      overall_aeo_score: aeoScore,
      faq_coverage_score: Math.floor(rng() * 80) + 10,
      faq_pages_count: Math.floor(rng() * 30),
      questions_answered_count: Math.floor(rng() * 150),
      entity_recognition_score: Math.floor(rng() * 80) + 10,
      recognized_entities_count: Math.floor(rng() * 500),
      entity_density: 0.05 + rng() * 0.1,
      eeat_score: Math.floor(rng() * 80) + 10,
      expertise_signals: Math.floor(rng() * 100),
      authoritativeness_signals: Math.floor(rng() * 100),
      trustworthiness_signals: Math.floor(rng() * 100),
      structured_data_score: Math.floor(rng() * 80) + 10,
      schema_types_implemented: ['Organization', 'WebSite', 'FAQPage'],
      coverage_percentage: 20 + rng() * 50,
      question_optimization_score: Math.floor(rng() * 80) + 10,
      question_format_content_count: Math.floor(rng() * 40),
      answer_quality_score: Math.floor(rng() * 80) + 10,
      aeo_opportunities: [
        { description: 'Add FAQ schema to top 5 traffic pages' },
        { description: 'Implement Organization schema on homepage' }
      ]
    });

    // 8. Site Audit
    await serviceClient.from('domain_site_audit').insert({
      report_id: report.report_id,
      domain,
      critical_issues_count: Math.floor(rng() * 10),
      warnings_count: Math.floor(rng() * 50),
      opportunities_count: Math.floor(rng() * 100),
      quick_wins_count: Math.floor(rng() * 20),
      issues_breakdown: [
        { type: '404 Errors', severity: 'Critical', affected: 3, impact: 'High' },
        { type: 'Missing Meta Descriptions', severity: 'Warning', affected: 45, impact: 'Medium' }
      ]
    });

    // Update Report Status
    const processing_time = Math.floor((Date.now() - start_time) / 1000) + 2; // Simulate a few seconds

    const { data: completedReport, error: updateError } = await serviceClient
      .from('domain_overview_reports')
      .update({
        status: 'Completed',
        processing_time,
        // compute basic summary scores directly into report_data for easy listing
        report_data: {
          seo_score: Math.floor(rng() * 60) + 20,
          health_score: Math.floor(rng() * 70) + 20,
          organic_traffic: organic_traffic,
          da: da,
        }
      })
      .eq('report_id', report.report_id)
      .select()
      .single();

    if (updateError) throw new Error('Failed to update report status');

    return new Response(JSON.stringify({ success: true, report: completedReport }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});