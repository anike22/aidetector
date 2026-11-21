import { createClient } from "npm:@supabase/supabase-js@2.103.1";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const queueTables = {
  partnerships: { queue: "admin_outreach_queue", settings: "admin_outreach_settings", cap: 70 },
  growth: { queue: "growth_outreach_queue", settings: "growth_outreach_settings", cap: 20 },
  clients: { queue: "clients_outreach_queue", settings: "clients_outreach_settings", cap: 10 },
  outreach: { queue: "outreach_mail_queue", settings: "outreach_mail_settings", cap: 10 },
} as const;
type Channel = keyof typeof queueTables;
const categories: Record<Channel, string> = {
  partnerships: "AI software reviewers, AI tool directories, independent technology publishers",
  growth: "content marketing agencies, SEO agencies, digital marketing companies",
  clients: "professional blogging agencies, editorial service agencies, content production firms",
  outreach: "marketing newsletters, blogging communities, content creators and digital publications",
};
const cors = {
  "Access-Control-Allow-Origin": "https://www.aidetector.cx",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};
const reply = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { ...cors, "Content-Type": "application/json" } });
const emailPattern = /^[a-z0-9.!#$%&'*+/=?^`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,63}$/;
function cleanEmail(input: unknown): string | null {
  const email = String(input ?? "").trim().toLowerCase();
  return email.length <= 254 && emailPattern.test(email) ? email : null;
}
function safeText(value: unknown, limit: number): string {
  return String(value ?? "").replace(/[\r\n<>]/g, " ").trim().slice(0, limit);
}
function validSource(value: unknown, email: string): string | null {
  try {
    const url = new URL(String(value));
    if (url.protocol !== "https:" || !url.hostname.includes(".") || /^(localhost|127\.|10\.|192\.168\.)/.test(url.hostname)) return null;
    // The cited page must be a plausible public business-source page; email delivery still needs independent verification.
    if (!email.includes("@")) return null;
    return url.toString();
  } catch { return null; }
}
async function queryEmails(table: string): Promise<Set<string>> {
  const emails = new Set<string>();
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select("email").range(offset, offset + 999);
    if (error) throw new Error("Failed to read duplicate history");
    for (const row of data || []) { const e = cleanEmail(row.email); if (e) emails.add(e); }
    if (!data || data.length < 1000) return emails;
    offset += 1000;
    if (offset > 100000) throw new Error("Duplicate history requires server-side index");
  }
}
async function existingEmails(): Promise<Set<string>> {
  const tables = [
    "admin_outreach_queue", "growth_outreach_queue", "clients_outreach_queue", "outreach_mail_queue",
    "admin_outreach_contacts", "growth_outreach_contacts", "clients_outreach_contacts", "outreach_mail_contacts",
    "admin_outreach_suppressions",
  ];
  const results = await Promise.all(tables.map(queryEmails));
  return new Set(results.flatMap(v => [...v]));
}
async function research(channel: Channel, count: number, key: string) {
  const prompt = `Find ${Math.min(count * 3, 100)} different real organizations worldwide relevant to ${categories[channel]}. Only return business email addresses literally published on the organization's official site or verified public contact page. Never guess addresses or infer patterns. For each prospect include: email, organization, source_url pointing to the page publishing that exact email, website, and a concise factual relevance. Exclude generic example addresses. Return ONLY JSON as an array of objects with these five keys. If no publicly published email is findable, omit that organization.`;
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
    method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], tools: [{ google_search: {} }], generationConfig: { temperature: 0.1 } }),
    signal: AbortSignal.timeout(110000),
  });
  if (!response.ok) throw new Error("Prospect research provider failed (" + response.status + ")");
  const result = await response.json();
  const body = (result.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || "").join("");
  const start = body.indexOf("["); const end = body.lastIndexOf("]");
  if (start < 0 || end < start) throw new Error("Research provider returned no usable prospect list");
  const parsed = JSON.parse(body.slice(start, end + 1));
  if (!Array.isArray(parsed)) throw new Error("Unexpected research response");
  return parsed as Record<string, unknown>[];
}
Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  if (request.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  try {
    const bearer = request.headers.get("Authorization")?.match(/^Bearer (.+)$/i)?.[1];
    if (!bearer) return reply({ error: "Unauthorized" }, 401);
    const { data: account, error: authError } = await supabase.auth.getUser(bearer);
    if (authError || !account.user) return reply({ error: "Unauthorized" }, 401);
    const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", account.user.id).single();
    if (profileError || profile?.role !== "admin") return reply({ error: "Forbidden" }, 403);
    const payload = await request.json();
    const channel = payload?.channel as Channel;
    if (!Object.prototype.hasOwnProperty.call(queueTables, channel)) return reply({ error: "Invalid outreach account" }, 400);
    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) return reply({ error: "Configure GEMINI_API_KEY server-side to enable discovery" }, 503);
    const config = queueTables[channel];
    const { data: settings, error: settingsError } = await supabase.from(config.settings).select("daily_cap,enabled").eq("id", true).single();
    if (settingsError || !settings?.enabled) return reply({ error: "Outreach account is disabled" }, 409);
    const cap = Math.min(config.cap, settings.daily_cap || config.cap);
    const start = new Date(); start.setUTCHours(0, 0, 0, 0);
    const { data: queue, error: queueError } = await supabase.from(config.queue).select("status, due_at, sent_at");
    if (queueError) throw new Error("Cannot read queue capacity");
    const lagosDay = (x: string) => new Date(x).toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
    const today = lagosDay(new Date().toISOString());
    const allocated = (queue || []).filter((row: any) =>
      (row.sent_at && lagosDay(row.sent_at) === today) ||
      (row.due_at && lagosDay(row.due_at) === today && ["approved", "sending", "sent"].includes(row.status))
    ).length;
    const remaining = Math.max(0, cap - allocated);
    if (!remaining) return reply({ channel, cap, added: 0, remaining: 0, message: "Daily cap already covered" });
    const requested = Math.max(1, Math.min(remaining, Number(payload.limit) || remaining, 70));
    const existing = await existingEmails();
    const raw = await research(channel, requested, key);
    const eligible: any[] = [];
    const skipped = { duplicate: 0, invalid: 0 };
    for (const prospect of raw) {
      if (eligible.length >= requested) break;
      const email = cleanEmail(prospect.email);
      const url = email && validSource(prospect.source_url, email);
      const name = safeText(prospect.organization, 120);
      if (!email || !url || !name || /@(example\.|test\.|localhost)/.test(email)) { skipped.invalid++; continue; }
      if (existing.has(email)) { skipped.duplicate++; continue; }
      existing.add(email);
      eligible.push({
        email, organization: name, source_url: url,
        greeting: `Hi ${name} team,`,
        intro: `I came across ${name} and thought AIDETECTOR.CX might be relevant to your ${channel === "partnerships" ? "AI tools audience" : "content and editorial workflows"}.`,
        subject: channel === "partnerships" ? "AIDetector.cx affiliate partnership inquiry" : "AIDETECTOR.CX: Content quality collaboration",
        kind: "initial", status: "draft", due_at: null,
      });
    }
    // Research output is untrusted: draft stage avoids automatically sending unverified or mistaken addresses.
    if (!eligible.length) return reply({ channel, cap, added: 0, skipped, message: "No new verifiable candidates" });
    const { data: inserted, error: insertError } = await supabase.from(config.queue).insert(eligible).select("id,email,organization");
    if (insertError) throw new Error("Could not insert researched leads");
    return reply({ channel, cap, added: inserted?.length || 0, review_required: true, skipped, prospects: inserted });
  } catch (error) {
    return reply({ error: error instanceof Error ? error.message : "Research failed" }, 500);
  }
});
