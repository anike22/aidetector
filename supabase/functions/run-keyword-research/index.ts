import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders as sharedCorsHeaders } from "../_shared/cors.ts";

// This endpoint receives the browser's idempotency and timezone headers.
// Keep this CORS expansion local so other product endpoints are unchanged.
const corsHeaders = {
  ...sharedCorsHeaders,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-idempotency-key, x-timezone",
};
import { withBillingGuard } from "../_shared/billing.ts";

serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const preview = await req.clone().json().catch(() => ({}));
  if (preview?.billing_feature === "ai_checker_for_bloggers" && preview?.analyze_only === true) return runResearch(preview, null, false);
  return withBillingGuard(req, {
    featureSlug: body => body.billing_feature === "ai_checker_for_bloggers" ? "ai_checker_for_bloggers" : "seo_assistant",
    corsHeaders
  }, async ctx => {
    if (ctx.body?.billing_feature === "ai_checker_for_bloggers" && ctx.body?.commit_only === true)
      return new Response(JSON.stringify({ success: true, locked: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    return runResearch(ctx.body, ctx.userId, true);
  });
});

function builtInIdeas(seed: string) {
  const s = seed.trim().replace(/\s+/g, " ");
  const phrases = [`what is ${s}`, `how to use ${s}`, `how does ${s} work`, `benefits of ${s}`, `types of ${s}`,
    `best ${s}`, `${s} for beginners`, `${s} guide`, `${s} examples`, `${s} alternatives`, `${s} vs competitors`,
    `${s} cost`, `${s} pricing`, `${s} tools`, `how to choose ${s}`, `common ${s} mistakes`, `${s} checklist`, `${s} tips`, `${s} features`];
  return [...new Set(phrases.map(x => x.toLowerCase()))].map(keyword => ({
    keyword, search_volume: null, difficulty: null, cpc: null,
    intent: /best|alternatives|cost|pricing|tools/i.test(keyword) ? "Commercial" : /buy|purchase|hire/i.test(keyword) ? "Transactional" : "Informational"
  }));
}
async function runResearch(body: Record<string, any>, userId: string | null, persist: boolean) {
  try {
    const { seed_keyword, country, language, project_id, billing_feature } = body;
    if (billing_feature && !["ai_checker_for_bloggers", "seo_assistant"].includes(billing_feature)) throw new Error("Invalid billing feature");
    if (!seed_keyword || !country || !language) throw new Error("Missing required fields");
    const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const { data: rows } = await db.from("system_api_keys").select("provider, key_value").in("provider", ["dataforseo_login", "dataforseo_password"]);
    const keys = Object.fromEntries((rows || []).map((r: any) => [r.provider, r.key_value]));
    const login = Deno.env.get("DATAFORSEO_LOGIN") || keys.dataforseo_login;
    const password = Deno.env.get("DATAFORSEO_PASSWORD") || keys.dataforseo_password;
    let source = "Built-in", keywords: any[] = [], competitors: any[] = [], serpFeatures: string[] = [], serpWarning: string | null = null;
    const warnings: string[] = [];
    if (login && password) {
      const auth = btoa(`${login}:${password}`);
      try {
        const res = await fetch("https://api.dataforseo.com/v3/dataforseo_labs/google/related_keywords/live", {
          method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
          body: JSON.stringify([{ keyword: seed_keyword, location_name: country, language_code: language, limit: 50 }]),
          signal: AbortSignal.timeout(9000)
        });
        if (!res.ok) throw new Error(`DataForSEO HTTP ${res.status}`);
        const payload = await res.json(), task = payload?.tasks?.[0];
        if (payload?.status_code !== 20000 || task?.status_code !== 20000) throw new Error("DataForSEO keyword lookup failed");
        keywords = (task?.result?.[0]?.items || []).map((item: any) => {
          const d = item?.keyword_data || item;
          return { keyword: d?.keyword || item?.keyword || "", search_volume: d?.keyword_info?.search_volume ?? null,
            difficulty: d?.keyword_properties?.keyword_difficulty ?? null, cpc: d?.keyword_info?.cpc ?? null,
            intent: d?.keyword_intent?.label || null };
        }).filter((x: any) => x.keyword);
        if (keywords.length) source = "DataForSEO";
      } catch (e: any) { warnings.push(e?.message || "DataForSEO keyword lookup failed"); }
      if (billing_feature === "ai_checker_for_bloggers") {
        try {
          const res = await fetch("https://api.dataforseo.com/v3/serp/google/organic/live/advanced", {
            method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
            body: JSON.stringify([{ keyword: seed_keyword, location_name: country, language_code: language, depth: 10, device: "desktop" }]),
            signal: AbortSignal.timeout(9000)
          });
          if (!res.ok) throw new Error(`DataForSEO SERP HTTP ${res.status}`);
          const payload = await res.json();
          if (payload?.status_code !== 20000 || payload?.tasks?.[0]?.status_code !== 20000) throw new Error("DataForSEO SERP lookup failed");
          const items = payload?.tasks?.[0]?.result?.[0]?.items || [];
          serpFeatures = [...new Set(items.map((x: any) => x?.type).filter((x: any) => x && x !== "organic"))] as string[];
          const urls = items.filter((x: any) => x?.type === "organic" && typeof x?.url === "string" && /^https?:\/\//i.test(x.url))
            .map((x: any) => x.url).filter((x: string) => !/\.(pdf|jpg|jpeg|png|gif|webp)(?:[?#]|$)/i.test(x)).slice(0, 10);
          if (urls.length) {
            const pages = await fetch("https://api.dataforseo.com/v3/on_page/instant_pages", {
              method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
              body: JSON.stringify(urls.map((url: string) => ({ url }))), signal: AbortSignal.timeout(9000)
            });
            if (!pages.ok) throw new Error(`DataForSEO OnPage HTTP ${pages.status}`);
            const pageData = await pages.json();
            if (pageData?.status_code !== 20000) throw new Error("DataForSEO OnPage lookup failed");
            competitors = (pageData.tasks || []).flatMap((t: any) => t?.result?.[0]?.items || [])
              .map((x: any) => ({ url: x?.url || "", wordCount: Number(x?.meta?.content?.plain_text_word_count) }))
              .filter((x: any) => x.url && Number.isFinite(x.wordCount) && x.wordCount >= 250 && x.wordCount <= 25000);
          }
        } catch (e: any) { serpWarning = e?.message || "SERP competitor evidence unavailable"; warnings.push(serpWarning); }
      }
    } else warnings.push("DataForSEO credentials unavailable");
    if (!keywords.length) { keywords = builtInIdeas(seed_keyword); source = "Built-in"; }
    const byIntent = (name: string, n: number) => keywords.filter((x: any) => String(x.intent || "").toLowerCase() === name.toLowerCase()).slice(0, n);
    const keywordData = {
      primary: keywords.slice(0, 5), secondary: keywords.slice(5, 15),
      long_tail: keywords.filter((x: any) => x.keyword.split(/\s+/).length >= 4).slice(0, 15),
      questions: keywords.filter((x: any) => /^(who|what|when|where|why|how|can|does|is|are)\b/i.test(x.keyword)).slice(0, 8),
      commercial: byIntent("commercial", 5), transactional: byIntent("transactional", 5), informational: byIntent("informational", 5),
      aeo: [], data_source: source, competitors, serp_features: serpFeatures,
      serp_warning: serpWarning, keyword_warning: warnings.length ? warnings.join("; ") : null
    };
    let saved: Record<string, any> = {};
    if (persist) {
      const result = await db.from("keyword_research").insert({
        user_id: userId, project_id: project_id || null, seed_keyword, country, language,
        status: "Completed", processing_time: null, total_keywords: keywords.length, keyword_data: keywordData
      }).select().single();
      if (result.error) throw result.error;
      saved = result.data || {};
    }
    return new Response(JSON.stringify({ ...saved, success: true, keyword_data: keywordData, competitors, serp_features: serpFeatures,
      serp_warning: serpWarning, data_source: source }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || "Keyword research failed" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
}
