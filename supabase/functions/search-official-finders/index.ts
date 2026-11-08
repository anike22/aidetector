import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = new Set([
  Deno.env.get("APP_ORIGIN") || "https://www.aidetector.cx",
  "https://aidetector.cx",
  "https://www.aidetector.cx"
]);

function headers(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://www.aidetector.cx",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json"
  };
}

function reply(req: Request, payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: headers(req) });
}

function textOf(value: any): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textOf).filter(Boolean).join(", ") || null;
  if (value && typeof value === "object") {
    return textOf(value.en || value.English || value.value || value.text || value.content || value.title);
  }
  return null;
}

function normalizeEuDocument(item: any, finder: string) {
  const doc = item?.content || item?.document || item;
  const get = (...keys: string[]) => {
    for (const key of keys) {
      const value = doc?.[key] ?? item?.[key];
      const parsed = textOf(value);
      if (parsed) return parsed;
    }
    return null;
  };
  const title = get("title", "title_en", "name", "callTitle", "topicTitle");
  if (!title) return null;
  const identifier = get("callIdentifier", "identifier", "reference", "id", "topicId");
  const link = get("url", "webUrl", "link", "topicUrl") ||
    (identifier ? `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${encodeURIComponent(identifier)}` : "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/home");
  return {
    id: identifier || crypto.randomUUID(),
    title,
    description: get("description", "description_en", "objective", "content") || null,
    organization: get("programme", "frameworkProgramme", "organisation", "organization") || null,
    location: get("country", "placeOfPerformance", "geographicalZone") || "European Union / associated countries",
    deadline: get("deadlineDate", "deadline", "endDate", "submissionDeadline") || null,
    amount: get("budget", "totalBudget", "maximumGrantAmount") || null,
    status: get("status") || "See official notice",
    source_provider: "EU Funding & Tenders Portal",
    source_url: link,
    retrieved_at: new Date().toISOString(),
    finder
  };
}

async function searchEuPortal(finder: string, keyword: string) {
  const typeCodes = finder === "tender" ? ["0"] : ["1", "2", "8"];
  const query = {
    bool: {
      must: [
        { terms: { type: typeCodes } },
        { terms: { status: ["31094501", "31094502", "31094503"] } }
      ]
    }
  };
  const url = new URL("https://api.tech.ec.europa.eu/search-api/prod/rest/search");
  url.searchParams.set("apiKey", "SEDIA");
  url.searchParams.set("text", keyword);
  url.searchParams.set("pageSize", "25");
  url.searchParams.set("language", "en");
  const form = new FormData();
  form.set("query", JSON.stringify(query));
  const response = await fetch(url, { method: "POST", body: form });
  if (!response.ok) throw new Error(`EU Funding & Tenders returned HTTP ${response.status}.`);
  const data = await response.json();
  const rows = data?.results || data?.items || data?.data || data?.documents || [];
  return (Array.isArray(rows) ? rows : [])
    .map((row: any) => normalizeEuDocument(row, finder))
    .filter(Boolean);
}

async function searchUsGrants(keyword: string) {
  const response = await fetch("https://api.grants.gov/v1/api/search2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword })
  });
  if (!response.ok) throw new Error(`Grants.gov returned HTTP ${response.status}.`);
  const data = await response.json();
  const rows = data?.oppHits || data?.data || data?.opportunities || data?.hits || [];
  return (Array.isArray(rows) ? rows : []).map((row: any) => {
    const id = row.id || row.opportunityId || row.opportunity_id || row.number || row.opportunityNumber;
    const title = row.title || row.opportunityTitle || row.opportunity_title || row.name;
    if (!title) return null;
    const number = row.number || row.opportunityNumber || row.opportunity_number || id;
    return {
      id: String(id || number || crypto.randomUUID()),
      title: textOf(title),
      description: textOf(row.description || row.synopsis || row.opportunityDescription),
      organization: textOf(row.agency || row.agencyName || row.agency_name),
      location: "United States",
      deadline: textOf(row.closeDate || row.close_date || row.responseDate || row.archiveDate),
      amount: textOf(row.awardCeiling || row.award_ceiling || row.estimatedFunding),
      status: textOf(row.oppStatus || row.opportunity_status || row.status) || "See official notice",
      source_provider: "Grants.gov",
      source_url: number ? `https://www.grants.gov/search-results-detail/${encodeURIComponent(String(number))}` : "https://www.grants.gov/search-grants",
      retrieved_at: new Date().toISOString(),
      finder: "grant"
    };
  }).filter(Boolean);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: headers(req) });
  if (req.method !== "POST") return reply(req, { error: "Method not allowed." }, 405);
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const authorization = req.headers.get("Authorization") || "";
    const token = authorization.replace(/^Bearer\s+/i, "");
    if (!supabaseUrl || !anonKey || !token) return reply(req, { error: "Sign-in is required." }, 401);

    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: auth, error: authError } = await client.auth.getUser(token);
    if (authError || !auth.user) return reply(req, { error: "Your session is invalid. Please sign in again." }, 401);

    const body = await req.json().catch(() => ({}));
    const finder = String(body?.finder || "");
    const keyword = String(body?.query || "").trim().slice(0, 120);
    if (!["tender", "grant"].includes(finder) || keyword.length < 2) {
      return reply(req, { error: "Choose tenders or grants and enter a keyword (at least 2 characters)." }, 400);
    }

    const euPromise = searchEuPortal(finder, keyword).catch((error) => {
      console.error("EU Funding & Tenders provider error", error);
      return [];
    });

    let rows: any[] = [];
    const providers: string[] = [];
    if (finder === "grant") {
      const [euRows, usRows] = await Promise.all([
        euPromise,
        searchUsGrants(keyword).catch((error) => {
          console.error("Grants.gov provider error", error);
          return [];
        })
      ]);
      rows = [...euRows, ...usRows];
      if (euRows.length) providers.push("EU Funding & Tenders Portal");
      if (usRows.length) providers.push("Grants.gov");
    } else {
      rows = await euPromise;
      if (rows.length) providers.push("EU Funding & Tenders Portal");
    }

    const unique = new Map<string, any>();
    for (const row of rows) unique.set(`${row.source_provider}:${row.id}`, row);
    const results = [...unique.values()];
    return reply(req, {
      results,
      count: results.length,
      providers,
      coverage: finder === "grant"
        ? "European Union and United States public funding notices; other jurisdictions are not yet connected."
        : "European Union public procurement notices; other jurisdictions are not yet connected.",
      notice: results.length ? null : "No matching records were returned by the connected official sources. Try broader keywords."
    });
  } catch (error) {
    console.error("Official finder search failed", error);
    return reply(req, { error: error instanceof Error ? error.message : "Search failed." }, 500);
  }
});
