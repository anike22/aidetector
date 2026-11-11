import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";
import { withBillingGuard } from "../_shared/billing.ts";

function ideasFor(seed: string) {
  const s = seed.trim().replace(/\s+/g, " ");
  const phrases = ["how to", "what is", "best", "benefits of", "types of", "examples of", "guide to", "ways to", "tips for"].map(x => `${x} ${s}`).concat(
    ["for beginners", " explained", " guide", " benefits", " examples", " tips", " alternatives", " checklist", " cost", " pricing", " tools"].map(x => `${s}${x}`)
  );
  return [...new Set(phrases.map(x => x.toLowerCase()))].slice(0, 25).map(keyword => ({
    keyword, intent: /best|alternatives|cost|pricing|tools/i.test(keyword) ? "Commercial" : "Informational",
    volume: null, kd: null, cpc: null, trend: null, traffic_potential: null,
    serp_features: [], competition: null, ai_opportunity: null
  }));
}
function questionsFor(seed: string) {
  return ["what is", "how does", "how to use", "why use", "when to use", "what are the benefits of", "what are the types of", "how much does"].map(p => ({
    question: `${p} ${seed.trim()}?`, volume: null, kd: null, intent: "Informational",
    ai_citation_opportunity: null, featured_snippet_prob: null
  }));
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  return withBillingGuard(req, { featureSlug: "seo_assistant", corsHeaders }, async ctx => {
    try {
      const { keyword, country = "US", language = "en" } = ctx.body;
      if (!keyword || typeof keyword !== "string" || !keyword.trim()) throw new Error("Keyword is required");
      const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
      const { data: rows } = await db.from("system_api_keys").select("provider, key_value").in("provider", ["dataforseo_login", "dataforseo_password"]);
      const keys = Object.fromEntries((rows || []).map((r: any) => [r.provider, r.key_value]));
      const login = Deno.env.get("DATAFORSEO_LOGIN") || keys.dataforseo_login;
      const password = Deno.env.get("DATAFORSEO_PASSWORD") || keys.dataforseo_password;
      let ideas: any[] = [];
      let source = "Built-in";
      if (login && password) {
        try {
          const res = await fetch("https://api.dataforseo.com/v3/dataforseo_labs/google/related_keywords/live", {
            method: "POST", headers: { Authorization: `Basic ${btoa(`${login}:${password}`)}`, "Content-Type": "application/json" },
            body: JSON.stringify([{ keyword: keyword.trim(), location_name: country, language_code: language, limit: 50 }]),
            signal: AbortSignal.timeout(9000)
          });
          if (!res.ok) throw new Error(`DataForSEO HTTP ${res.status}`);
          const payload = await res.json(), task = payload?.tasks?.[0];
          if (payload?.status_code !== 20000 || task?.status_code !== 20000) throw new Error("DataForSEO keyword request failed");
          ideas = (task?.result?.[0]?.items || []).map((item: any) => {
            const d = item?.keyword_data || item;
            return { keyword: d?.keyword || item?.keyword || "", intent: d?.keyword_intent?.label || null,
              volume: d?.keyword_info?.search_volume ?? null, kd: d?.keyword_properties?.keyword_difficulty ?? null,
              cpc: d?.keyword_info?.cpc ?? null, trend: null, traffic_potential: null, serp_features: [], competition: null, ai_opportunity: null };
          }).filter((x: any) => x.keyword);
          if (ideas.length) source = "DataForSEO";
        } catch (e) { console.warn("[keyword-intelligence] DataForSEO unavailable; using built-in fallback", e); }
      }
      if (!ideas.length) ideas = ideasFor(keyword);
      const questions = questionsFor(keyword);
      const data = {
        overview: { total_keywords: ideas.length, total_volume: null, avg_kd: null, avg_cpc: null, avg_opportunity: null,
          intent_distribution: ideas.reduce((a: any, x: any) => { if (x.intent) a[x.intent] = (a[x.intent] || 0) + 1; return a; }, {}),
          trend_score: null, trend_data: [] },
        keyword_ideas: ideas, questions, competitors: [], serp_analysis: [],
        clusters: [{ name: keyword.trim(), keywords_count: ideas.length, volume: null, avg_kd: null, keywords: ideas.map((x: any) => x.keyword) }],
        ai_search_opportunity: { overall_score: null, chatgpt_opp: null, gemini_opp: null, perplexity_opp: null,
          missing_entities: [], suggested_faqs: questions.map((x: any) => x.question) }
      };
      const { data: saved, error } = await db.from("keyword_intelligence_reports").insert({
        user_id: ctx.userId, seed_keyword: keyword.trim(), country, language, data_source: source, status: "completed", data
      }).select().single();
      if (error) throw error;
      return json({ success: true, keyword: saved.seed_keyword, data_source: saved.data_source, data: saved.data, errors: [] });
    } catch (e: any) { return json({ success: false, errors: [e?.message || "Keyword intelligence failed"] }, 400); }
  });
});
