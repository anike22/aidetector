import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";
import { withBillingGuard } from "../_shared/billing.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return withBillingGuard(req, { featureSlug: (body) => body.billing_feature === 'ai_checker_for_bloggers' ? 'ai_checker_for_bloggers' : 'seo_assistant', corsHeaders }, async (ctx) => {

  try {
    const { seed_keyword, country, language, project_id, billing_feature } = ctx.body;
    if (billing_feature && !['ai_checker_for_bloggers', 'seo_assistant'].includes(billing_feature)) throw new Error('Invalid billing feature');
    if (!seed_keyword || !country || !language) throw new Error('Missing required fields');

    const authHeader = req.headers.get('Authorization')!;
    const serviceClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id || null;

    // Check for real API keys
    const { data: keysData } = await serviceClient.from('system_api_keys').select('provider, key_value').in('provider', ['dataforseo_login', 'dataforseo_password']);
    const keysMap = (keysData || []).reduce((acc: any, k: any) => {
      acc[k.provider] = k.key_value;
      return acc;
    }, {});
    
    let dfsLogin = Deno.env.get('DATAFORSEO_LOGIN') || keysMap['dataforseo_login'];
    let dfsPassword = Deno.env.get('DATAFORSEO_PASSWORD') || keysMap['dataforseo_password'];
    
    if (!dfsLogin || !dfsPassword) {
      return new Response(JSON.stringify({
        success: false,
        error: "DataForSEO API credentials not configured"
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let dataSourceLabel = "DataForSEO";
    let realKeywords: any[] = [];
    let competitors: Array<{ url: string; wordCount: number }> = [];
    let serpFeatures: string[] = [];
    try {
      const dfsUrl = 'https://api.dataforseo.com/v3/dataforseo_labs/google/related_keywords/live';
      const postData = [{
          "keyword": seed_keyword,
          "location_name": country,
          "language_code": language,
          "limit": 50
      }];
      
      const auth = btoa(`${dfsLogin}:${dfsPassword}`);
      const res = await fetch(dfsUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });
      
      if (res.ok) {
        const dfsData = await res.json();
        if (dfsData.status_code && dfsData.status_code !== 20000) {
          dataSourceLabel = `DataForSEO unavailable (API Error: ${dfsData.status_message})`;
        } else {
          const items = dfsData.tasks?.[0]?.result?.[0]?.items;
          if (items && Array.isArray(items)) {
            realKeywords = items.map((item: any) => ({
              keyword: item.keyword_data?.keyword || '',
              search_volume: item.keyword_data?.keyword_info?.search_volume ?? null,
              difficulty: item.keyword_data?.keyword_properties?.keyword_difficulty ?? null,
              cpc: item.keyword_data?.keyword_info?.cpc ?? null,
              intent: item.keyword_data?.keyword_intent?.label || null
            }));
          }
        }
      } else {
        dataSourceLabel = `DataForSEO unavailable (HTTP ${res.status})`;
      }
    } catch (e: any) {
      console.error("DataForSEO Fetch Error:", e);
      dataSourceLabel = `DataForSEO unavailable (${e.message})`;
    }

    // Blogger competitor evidence: real Google organic SERP + measured page word counts.
    if (billing_feature === 'ai_checker_for_bloggers') {
      const auth = btoa(`${dfsLogin}:${dfsPassword}`);
      const serpRes = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([{ keyword: seed_keyword, location_name: country, language_code: language, depth: 10, device: 'desktop' }])
      });
      if (!serpRes.ok) throw new Error(`DataForSEO SERP HTTP ${serpRes.status}`);
      const serpData = await serpRes.json();
      if (serpData.status_code !== 20000 || serpData.tasks?.[0]?.status_code !== 20000) {
        throw new Error(`DataForSEO SERP unavailable: ${serpData.tasks?.[0]?.status_message || serpData.status_message || 'unknown error'}`);
      }
      const serpItems = serpData.tasks?.[0]?.result?.[0]?.items || [];
      serpFeatures = [...new Set(serpItems.map((item: any) => item?.type).filter((type: any) => type && type !== 'organic'))];
      const urls = serpItems
        .filter((item: any) => item?.type === 'organic' && typeof item?.url === 'string' && /^https?:\\/\\//i.test(item.url))
        .map((item: any) => item.url)
        .filter((url: string) => !/\\.(pdf|jpg|jpeg|png|gif|webp)(?:[?#]|$)/i.test(url))
        .slice(0, 10);

      if (urls.length) {
        const pageRes = await fetch('https://api.dataforseo.com/v3/on_page/instant_pages', {
          method: 'POST',
          headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(urls.map((url: string) => ({ url })))
        });
        if (!pageRes.ok) throw new Error(`DataForSEO OnPage HTTP ${pageRes.status}`);
        const pageData = await pageRes.json();
        if (pageData.status_code !== 20000) throw new Error(`DataForSEO OnPage unavailable: ${pageData.status_message || 'unknown error'}`);
        competitors = (pageData.tasks || []).flatMap((task: any) => task?.result?.[0]?.items || [])
          .map((item: any) => ({ url: item?.url || '', wordCount: Number(item?.meta?.content?.plain_text_word_count) }))
          .filter((item: any) => item.url && Number.isFinite(item.wordCount) && item.wordCount >= 250 && item.wordCount <= 25000);
      }
    }

    if (realKeywords.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: "DataForSEO returned no verified keyword data",
        data_source: dataSourceLabel
      }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const byIntent = (label: string, limit: number) => realKeywords
      .filter((item: any) => String(item.intent || '').toLowerCase() === label.toLowerCase())
      .slice(0, limit);

    const keywordData = {
      primary: realKeywords.slice(0, 5),
      secondary: realKeywords.slice(5, 15),
      long_tail: realKeywords.filter((item: any) => item.keyword.split(/\\s+/).length >= 4).slice(0, 15),
      questions: realKeywords.filter((item: any) => /^(who|what|when|where|why|how|can|does|is|are)\\b/i.test(item.keyword)).slice(0, 8),
      commercial: byIntent('commercial', 5),
      transactional: byIntent('transactional', 5),
      informational: byIntent('informational', 5),
      aeo: [],
      data_source: "DataForSEO",
      competitors,
      serp_features: serpFeatures
    };

    const { data, error: insertError } = await serviceClient
      .from('keyword_research')
      .insert({
        user_id: userId,
        project_id: project_id || null,
        seed_keyword,
        country,
        language,
        status: 'Completed',
        processing_time: null,
        total_keywords: realKeywords.length,
        keyword_data: keywordData
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ ...data, competitors, serp_features: serpFeatures, data_source: 'DataForSEO' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
  });
});
