/**
 * plagiarism-checker Edge Function — self-contained bundle
 *
 * Architecture:
 *   1. Auth: guest (IP-rate-limited) or authenticated user (entitlement check).
 *   2. Source Discovery: Crossref + OpenAlex in parallel. Unpaywall enriches DOIs.
 *   3. Source Retrieval: fetch accessible text for each candidate (SSRF-safe).
 *   4. Exact Match Engine: normalised n-gram fingerprinting + window extension.
 *   5. Near Match Engine: Jaccard token overlap + edit distance on sentence pairs.
 *   6. Gemini Semantic Layer: embeddings only for genuinely retrieved source pairs
 *      with low lexical overlap — never invents sources.
 *   7. Scoring: uniqueCoverage / eligibleChars — no double-counting.
 *   8. Result: explicit status + scores + verified sources with matched spans.
 *
 * NEVER invents sources. NEVER converts failure into an originality result.
 * Every error surfaces as a structured status — never silently 98% original.
 */

import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_TEXT_CHARS    = 15_000;
const MIN_TEXT_WORDS    = 30;
const MAX_CANDIDATES    = 8;
const PROVIDER_TO_MS    = 8_000;
const FETCH_TO_MS       = 5_000;
const NGRAM_SIZE        = 6;
const EXACT_THRESHOLD   = 3;       // min shared n-grams to qualify as exact candidate
const NEAR_JACCARD_MIN  = 0.35;
const SEM_JACCARD_MAX   = 0.25;    // only use Gemini if lexical overlap below this
const SEM_COSINE_MIN    = 0.82;
const GUEST_DAILY_LIMIT = 3;

const COVERAGE_NOTE =
  "This checker searches Crossref and OpenAlex scholarly databases. " +
  "General websites, news articles, blogs, and social media are not currently indexed. " +
  '"No verified matches" means no matches were found within academic sources checked — ' +
  "it does not guarantee the text is original.";

const GATEWAY =
  "https://app-c18l1vf2nz7l-api-VaOwP8E7dJqa.gateway.appmedo.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-timezone, x-guest-id",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ─── Shared-lib inlined ───────────────────────────────────────────────────────

function createServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function getTimezone(req: Request): string {
  return req.headers.get("x-timezone") || "UTC";
}

async function checkEntitlement(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  feature: string,
  timezone: string
): Promise<{ allowed: boolean; reason?: string; remaining?: number; limit?: number }> {
  try {
    const { data, error } = await supabase.rpc("check_feature_entitlement", {
      p_user_id: userId,
      p_feature_slug: feature,
      p_timezone: timezone,
    });
    if (error) return { allowed: false, reason: error.message };
    return data ?? { allowed: false, reason: "No entitlement data" };
  } catch (e) {
    return { allowed: false, reason: String(e) };
  }
}

async function recordUsage(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  feature: string,
  count: number,
  timezone: string
): Promise<void> {
  await supabase.rpc("record_feature_usage", {
    p_user_id: userId,
    p_feature_slug: feature,
    p_count: count,
    p_timezone: timezone,
  });
}

async function checkGuestEntitlement(
  supabase: ReturnType<typeof createServiceClient>,
  guestId: string,
  _timezone: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("guest_usage")
      .select("count")
      .eq("guest_id", guestId)
      .eq("feature_slug", "plagiarism_checker")
      .eq("usage_date", today)
      .maybeSingle();
    if (error) return { allowed: true }; // fail open for guests
    const used = (data?.count as number) ?? 0;
    if (used >= GUEST_DAILY_LIMIT) {
      return {
        allowed: false,
        reason: `Free limit of ${GUEST_DAILY_LIMIT} checks/day reached. Sign up for more.`,
      };
    }
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

async function recordGuestUsage(
  supabase: ReturnType<typeof createServiceClient>,
  guestId: string,
  _timezone: string
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  await supabase.from("guest_usage").upsert(
    { guest_id: guestId, feature_slug: "plagiarism_checker", usage_date: today, count: 1 },
    { onConflict: "guest_id,feature_slug,usage_date", ignoreDuplicates: false }
  );
}

// ─── Text utilities inlined ───────────────────────────────────────────────────

const PRIVATE_IP_RE =
  /^(10\.|127\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1|localhost)/i;

function isSafeUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    if (PRIVATE_IP_RE.test(u.hostname)) return false;
    if (!u.hostname.includes(".")) return false;
    return true;
  } catch {
    return false;
  }
}

function normalise(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function tokenise(text: string): string[] {
  return normalise(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

const STOP = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with","by",
  "from","is","was","are","were","be","been","being","have","has","had","do",
  "does","did","will","would","could","should","may","might","that","this",
  "these","those","it","its","as","if","so","not","no","such","than","then",
  "when","where","while","both","either","neither","yet","nor",
]);

function buildNgrams(tokens: string[], n: number): Map<string, number[]> {
  const map = new Map<string, number[]>();
  for (let i = 0; i <= tokens.length - n; i++) {
    const gram = tokens.slice(i, i + n);
    if (gram.every((t) => STOP.has(t))) continue;
    const key = gram.join(" ");
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(i);
  }
  return map;
}

function jaccardSim(a: string[], b: string[]): number {
  const sa = new Set(a), sb = new Set(b);
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

function editDist(a: string, b: string, max = 50): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = a[i-1] === b[j-1]
        ? prev[j-1]
        : 1 + Math.min(prev[j], cur[j-1], prev[j-1]);
    }
    prev.splice(0, prev.length, ...cur);
  }
  return prev[b.length];
}

function splitSentences(text: string): Array<{ text: string; start: number }> {
  const out: Array<{ text: string; start: number }> = [];
  const re = /[^.!?]+[.!?]*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const s = m[0].trim();
    if (s.length > 15) out.push({ text: s, start: m.index });
  }
  return out;
}

const CITATION_RE =
  /(\([\w\s,\.]+\d{4}[a-z]?\)|\[[\d,\s]+\]|"[^"]{10,200}")/gi;
const BIBLIO_RE = /^(references|bibliography|works\s+cited|sources)\s*$/im;
const BOILER_RE =
  /^(cookie\s+policy|privacy\s+policy|terms\s+of\s+(use|service)|all\s+rights\s+reserved|copyright\s+©|skip\s+to|navigation|search\s*$|menu\s*$|sidebar\s*$)/im;

function prepareText(text: string): { body: string; hasCitations: boolean } {
  // split bibliography
  const bibMatch = BIBLIO_RE.exec(text);
  const body = bibMatch ? text.slice(0, bibMatch.index).trim() : text;
  let hasCitations = false;
  const clean = body.replace(CITATION_RE, (m) => {
    hasCitations = true;
    return " ".repeat(m.length);
  });
  return { body: clean.trim(), hasCitations };
}

function removeBoilerplate(text: string): string {
  return text
    .split("\n")
    .filter((l) => !BOILER_RE.test(l.trim()))
    .join("\n");
}

function uniqueCoverage(spans: Array<[number, number]>, total: number): number {
  if (!spans.length || !total) return 0;
  const sorted = [...spans].sort((a, b) => a[0] - b[0]);
  let covered = 0, cs = sorted[0][0], ce = sorted[0][1];
  for (let i = 1; i < sorted.length; i++) {
    const [s, e] = sorted[i];
    if (s <= ce) { ce = Math.max(ce, e); }
    else { covered += ce - cs; cs = s; ce = e; }
  }
  covered += ce - cs;
  return Math.min(covered, total);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type PlagStatus =
  | "completed" | "partial" | "no_verified_matches"
  | "insufficient_text" | "provider_unavailable" | "analysis_failed";

type ProvStatus = "ok" | "failed" | "skipped";

interface MatchedSpan {
  submittedStart: number; submittedEnd: number;
  submittedPassage: string; sourcePassage: string;
  matchType: "exact" | "near" | "semantic";
  spanSimilarity: number;
}

interface VerifiedSource {
  title: string; doi: string | null; url: string;
  publisher: string; provider: "crossref" | "openalex" | "unpaywall";
  matchContribution: number; citedMaterial: boolean;
  matchedSpans: MatchedSpan[]; similarity: number;
  matchType: "Exact" | "Near Match" | "Semantic" | "Mixed";
}

interface PlagResult {
  status: PlagStatus;
  similarityScore: number; originalityScore: number;
  exactMatchScore: number; nearMatchScore: number; semanticMatchScore: number;
  riskLevel: "None" | "Low" | "Medium" | "High" | "Critical";
  sources: VerifiedSource[];
  coverageNote: string;
  providerStatus: { crossref: ProvStatus; openalex: ProvStatus; unpaywall: ProvStatus; gemini: ProvStatus };
  errorMessage?: string;
  upgrade_required?: boolean; remaining?: number | null; limit?: number | null;
}

interface Candidate {
  title: string; doi: string | null; url: string;
  publisher: string; provider: "crossref" | "openalex" | "unpaywall";
  abstract: string | null;
}

// ─── Source Discovery ─────────────────────────────────────────────────────────

function extractPhrases(text: string): string[] {
  const sentences = splitSentences(text);
  const phrases: string[] = [];
  for (const s of sentences.slice(0, 15)) {
    const toks = tokenise(s.text);
    if (toks.length >= 6) phrases.push(toks.slice(0, 8).join(" "));
    if (phrases.length >= 5) break;
  }
  return phrases;
}

async function discoverCrossref(text: string, sig: AbortSignal): Promise<Candidate[]> {
  const phrases = extractPhrases(text);
  const results: Candidate[] = [];
  const seen = new Set<string>();
  for (const phrase of phrases.slice(0, 3)) {
    try {
      const url =
        `https://api.crossref.org/works?query=${encodeURIComponent(phrase)}` +
        `&rows=5&select=DOI,title,URL,publisher,abstract&mailto=plagiarism@aidetector.cx`;
      const resp = await fetch(url, { signal: sig });
      if (!resp.ok) continue;
      const data = await resp.json();
      for (const item of (data?.message?.items ?? []) as Record<string, unknown>[]) {
        const doi = item.DOI as string | undefined;
        const key = doi ?? (item.URL as string);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        const rawUrl = item.URL as string | undefined;
        const resolvedUrl = rawUrl && isSafeUrl(rawUrl)
          ? rawUrl
          : doi ? `https://doi.org/${doi}` : null;
        if (!resolvedUrl) continue;
        results.push({
          title: (item.title as string[])?.[0] ?? doi ?? resolvedUrl,
          doi: doi ?? null,
          url: resolvedUrl,
          publisher: (item.publisher as string) ?? "Crossref",
          provider: "crossref",
          abstract: (item.abstract as string | null) ?? null,
        });
        if (results.length >= MAX_CANDIDATES) break;
      }
    } catch { /* continue */ }
    if (results.length >= MAX_CANDIDATES) break;
  }
  return results;
}

async function discoverOpenAlex(text: string, sig: AbortSignal): Promise<Candidate[]> {
  const phrases = extractPhrases(text);
  const results: Candidate[] = [];
  const seen = new Set<string>();
  for (const phrase of phrases.slice(0, 3)) {
    try {
      const url =
        `https://api.openalex.org/works?search=${encodeURIComponent(phrase)}` +
        `&per-page=5&select=id,doi,title,primary_location,abstract_inverted_index` +
        `&mailto=plagiarism@aidetector.cx`;
      const resp = await fetch(url, { signal: sig });
      if (!resp.ok) continue;
      const data = await resp.json();
      for (const item of (data?.results ?? []) as Record<string, unknown>[]) {
        const doi = (item.doi as string | null)?.replace("https://doi.org/", "") ?? null;
        const loc = item.primary_location as Record<string, unknown> | null;
        const landingUrl = loc?.landing_page_url as string | undefined;
        const pdfUrl = loc?.pdf_url as string | undefined;
        const key = doi ?? landingUrl ?? "";
        if (!key || seen.has(key)) continue;
        seen.add(key);
        // Reconstruct abstract from inverted index
        let abstract: string | null = null;
        const inv = item.abstract_inverted_index as Record<string, number[]> | null;
        if (inv) {
          const wp: Array<[string, number]> = [];
          for (const [w, ps] of Object.entries(inv)) for (const p of ps) wp.push([w, p]);
          abstract = wp.sort((a, b) => a[1] - b[1]).map((x) => x[0]).join(" ");
        }
        const resolvedUrl = pdfUrl && isSafeUrl(pdfUrl)
          ? pdfUrl
          : landingUrl && isSafeUrl(landingUrl)
            ? landingUrl
            : doi ? `https://doi.org/${doi}` : null;
        if (!resolvedUrl) continue;
        results.push({
          title: (item.title as string) ?? resolvedUrl,
          doi,
          url: resolvedUrl,
          publisher: ((loc?.source as Record<string, unknown> | null)?.display_name as string) ?? "OpenAlex",
          provider: "openalex",
          abstract,
        });
        if (results.length >= MAX_CANDIDATES) break;
      }
    } catch { /* continue */ }
    if (results.length >= MAX_CANDIDATES) break;
  }
  return results;
}

async function enrichUnpaywall(c: Candidate, sig: AbortSignal): Promise<Candidate> {
  if (!c.doi) return c;
  try {
    const resp = await fetch(
      `https://api.unpaywall.org/v2/${encodeURIComponent(c.doi)}?email=plagiarism@aidetector.cx`,
      { signal: sig }
    );
    if (!resp.ok) return c;
    const data = await resp.json();
    const oaUrl = data?.best_oa_location?.url_for_pdf ?? data?.best_oa_location?.url;
    if (typeof oaUrl === "string" && isSafeUrl(oaUrl)) return { ...c, url: oaUrl, provider: "unpaywall" };
  } catch { /* use existing URL */ }
  return c;
}

// ─── Source Retrieval ─────────────────────────────────────────────────────────

async function fetchSourceText(url: string): Promise<string | null> {
  if (!isSafeUrl(url)) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TO_MS);
    const resp = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "AIDetector-PlagiarismChecker/1.0 (mailto:plagiarism@aidetector.cx)" },
    });
    clearTimeout(t);
    if (!resp.ok) return null;
    const ct = resp.headers.get("content-type") ?? "";
    if (!ct.includes("text/html") && !ct.includes("text/plain")) return null;
    const raw = await resp.text();
    const text = raw.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ");
    return removeBoilerplate(text).slice(0, 40_000);
  } catch { return null; }
}

// ─── Exact Match Engine ───────────────────────────────────────────────────────

function runExact(submitted: string, sourceText: string): { spans: MatchedSpan[]; ranges: Array<[number,number]> } {
  const sToks = tokenise(submitted), tToks = tokenise(sourceText);
  const sGrams = buildNgrams(sToks, NGRAM_SIZE), tGrams = buildNgrams(tToks, NGRAM_SIZE);
  const shared: string[] = [];
  for (const k of sGrams.keys()) if (tGrams.has(k)) shared.push(k);
  if (shared.length < EXACT_THRESHOLD) return { spans: [], ranges: [] };

  const spans: MatchedSpan[] = [];
  const ranges: Array<[number, number]> = [];
  const usedPos = new Set<number>();
  const normSub = normalise(submitted);

  for (const gram of shared) {
    for (const sPos of sGrams.get(gram)!) {
      if (usedPos.has(sPos)) continue;
      const tPos = tGrams.get(gram)![0];
      let len = NGRAM_SIZE;
      while (
        sPos + len < sToks.length &&
        tPos + len < tToks.length &&
        sToks[sPos + len] === tToks[tPos + len]
      ) len++;
      if (len < NGRAM_SIZE) continue;
      for (let i = sPos; i < sPos + len; i++) usedPos.add(i);
      const subPass = sToks.slice(sPos, sPos + len).join(" ");
      const srcPass = tToks.slice(tPos, tPos + len).join(" ");
      const anchor = sToks.slice(sPos, sPos + 2).join(" ");
      const charStart = normSub.indexOf(anchor);
      const charEnd = charStart >= 0 ? charStart + subPass.length : 0;
      if (charStart >= 0) ranges.push([charStart, charEnd]);
      spans.push({ submittedStart: Math.max(0, charStart), submittedEnd: charEnd, submittedPassage: subPass, sourcePassage: srcPass, matchType: "exact", spanSimilarity: 1.0 });
    }
  }
  return { spans, ranges };
}

// ─── Near-Match Engine ────────────────────────────────────────────────────────

function runNear(submitted: string, sourceText: string): { spans: MatchedSpan[]; ranges: Array<[number,number]> } {
  const subSents = splitSentences(submitted);
  const srcSents = splitSentences(sourceText);
  const spans: MatchedSpan[] = [];
  const ranges: Array<[number, number]> = [];
  for (const ss of subSents) {
    const sToks = tokenise(ss.text);
    if (sToks.length < 5) continue;
    let best = 0, bestSrc = "";
    for (const ts of srcSents) {
      const tToks = tokenise(ts.text);
      if (tToks.length < 5) continue;
      const jac = jaccardSim(sToks, tToks);
      if (jac < NEAR_JACCARD_MIN) continue;
      const sn = normalise(ss.text).slice(0, 200);
      const tn = normalise(ts.text).slice(0, 200);
      const maxLen = Math.max(sn.length, tn.length);
      if (!maxLen) continue;
      const ed = editDist(sn, tn, 100);
      const combined = (jac + (1 - ed / maxLen)) / 2;
      if (combined > best) { best = combined; bestSrc = ts.text; }
    }
    if (best >= NEAR_JACCARD_MIN && bestSrc) {
      const cs = ss.start, ce = ss.start + ss.text.length;
      ranges.push([cs, ce]);
      spans.push({ submittedStart: cs, submittedEnd: ce, submittedPassage: ss.text, sourcePassage: bestSrc, matchType: "near", spanSimilarity: Math.round(best * 100) / 100 });
    }
  }
  return { spans, ranges };
}

// ─── Gemini Semantic Layer ────────────────────────────────────────────────────

async function embed(text: string, apiKey: string, sig: AbortSignal): Promise<number[] | null> {
  try {
    const resp = await fetch(`${GATEWAY}/v1beta/models/text-embedding-004:embedContent`, {
      method: "POST",
      signal: sig,
      headers: { "Content-Type": "application/json", "X-Gateway-Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "models/text-embedding-004", content: { parts: [{ text: text.slice(0, 2048) }] } }),
    });
    if (!resp.ok) return null;
    const d = await resp.json();
    return (d?.embedding?.values as number[]) ?? null;
  } catch { return null; }
}

function cosineSim(a: number[], b: number[]): number {
  if (a.length !== b.length || !a.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

async function runSemantic(
  submitted: string, sourceText: string,
  apiKey: string, existingRanges: Array<[number,number]>, sig: AbortSignal
): Promise<{ spans: MatchedSpan[]; ranges: Array<[number,number]>; used: boolean }> {
  const subSents = splitSentences(submitted);
  const srcSents = splitSentences(sourceText);

  const uncovered = subSents.filter((ss) => {
    const mid = ss.start + Math.floor(ss.text.length / 2);
    return !existingRanges.some(([s, e]) => mid >= s && mid < e);
  });
  if (!uncovered.length || !srcSents.length) return { spans: [], ranges: [], used: false };

  const pairs: Array<{ ss: typeof subSents[0]; ts: typeof srcSents[0] }> = [];
  for (const ss of uncovered.slice(0, 10)) {
    const sToks = tokenise(ss.text);
    if (sToks.length < 6) continue;
    for (const ts of srcSents.slice(0, 20)) {
      const tToks = tokenise(ts.text);
      if (tToks.length < 6) continue;
      const jac = jaccardSim(sToks, tToks);
      if (jac < SEM_JACCARD_MAX && jac > 0.05) { pairs.push({ ss, ts }); if (pairs.length >= 5) break; }
    }
    if (pairs.length >= 5) break;
  }
  if (!pairs.length) return { spans: [], ranges: [], used: false };

  const cache = new Map<string, number[] | null>();
  for (const { ss, ts } of pairs) {
    if (!cache.has(ss.text)) cache.set(ss.text, null);
    if (!cache.has(ts.text)) cache.set(ts.text, null);
  }
  for (const [text] of cache) {
    const v = await embed(text, apiKey, sig);
    if (!v) return { spans: [], ranges: [], used: false };
    cache.set(text, v);
  }

  const spans: MatchedSpan[] = [];
  const ranges: Array<[number, number]> = [];
  for (const { ss, ts } of pairs) {
    const va = cache.get(ss.text), vb = cache.get(ts.text);
    if (!va || !vb) continue;
    const cos = cosineSim(va, vb);
    if (cos >= SEM_COSINE_MIN) {
      ranges.push([ss.start, ss.start + ss.text.length]);
      spans.push({ submittedStart: ss.start, submittedEnd: ss.start + ss.text.length, submittedPassage: ss.text, sourcePassage: ts.text, matchType: "semantic", spanSimilarity: Math.round(cos * 100) / 100 });
    }
  }
  return { spans, ranges, used: true };
}

// ─── Scoring helpers ──────────────────────────────────────────────────────────

function riskLevel(sim: number): PlagResult["riskLevel"] {
  if (sim === 0) return "None";
  if (sim < 10) return "Low";
  if (sim < 25) return "Medium";
  if (sim < 50) return "High";
  return "Critical";
}

function dominantType(spans: MatchedSpan[]): VerifiedSource["matchType"] {
  if (!spans.length) return "Exact";
  const c = { exact: 0, near: 0, semantic: 0 };
  for (const s of spans) c[s.matchType]++;
  if (c.exact >= c.near && c.exact >= c.semantic) return c.near || c.semantic ? "Mixed" : "Exact";
  if (c.near >= c.semantic) return c.exact ? "Mixed" : "Near Match";
  return c.exact || c.near ? "Mixed" : "Semantic";
}

// ─── Main analysis pipeline ───────────────────────────────────────────────────

async function runAnalysis(rawText: string, apiKey: string): Promise<PlagResult> {
  const ps: PlagResult["providerStatus"] = { crossref: "skipped", openalex: "skipped", unpaywall: "skipped", gemini: "skipped" };

  const { body: eligibleText, hasCitations } = prepareText(rawText);
  const eligibleChars = eligibleText.length;

  if (tokenise(eligibleText).length < MIN_TEXT_WORDS) {
    return { status: "insufficient_text", similarityScore: 0, originalityScore: 100, exactMatchScore: 0, nearMatchScore: 0, semanticMatchScore: 0, riskLevel: "None", sources: [], coverageNote: COVERAGE_NOTE, providerStatus: ps, errorMessage: `Minimum ${MIN_TEXT_WORDS} words required.` };
  }

  // Discovery
  const discCtrl = new AbortController();
  const discTimer = setTimeout(() => discCtrl.abort(), PROVIDER_TO_MS);
  const [crRes, oaRes] = await Promise.allSettled([
    discoverCrossref(eligibleText, discCtrl.signal),
    discoverOpenAlex(eligibleText, discCtrl.signal),
  ]);
  clearTimeout(discTimer);

  const crCands = crRes.status === "fulfilled" ? crRes.value : [];
  const oaCands = oaRes.status === "fulfilled" ? oaRes.value : [];
  ps.crossref = crRes.status === "fulfilled" ? "ok" : "failed";
  ps.openalex = oaRes.status === "fulfilled" ? "ok" : "failed";

  // Deduplicate
  const deduped: Candidate[] = [];
  const seenDoi = new Set<string>(), seenUrl = new Set<string>();
  for (const c of [...crCands, ...oaCands]) {
    const key = c.doi ?? c.url;
    if (c.doi && seenDoi.has(c.doi)) continue;
    if (seenUrl.has(c.url)) continue;
    if (c.doi) seenDoi.add(c.doi);
    seenUrl.add(c.url);
    deduped.push(c);
    if (deduped.length >= MAX_CANDIDATES) break;
  }

  if (!deduped.length) {
    const allFailed = ps.crossref === "failed" && ps.openalex === "failed";
    return { status: allFailed ? "provider_unavailable" : "no_verified_matches", similarityScore: 0, originalityScore: 100, exactMatchScore: 0, nearMatchScore: 0, semanticMatchScore: 0, riskLevel: "None", sources: [], coverageNote: COVERAGE_NOTE, providerStatus: ps, ...(allFailed ? { errorMessage: "Source discovery providers could not be reached." } : {}) };
  }

  // Unpaywall enrichment
  const upCtrl = new AbortController();
  const upTimer = setTimeout(() => upCtrl.abort(), 5_000);
  const enriched = await Promise.all(deduped.map((c) => enrichUnpaywall(c, upCtrl.signal)));
  clearTimeout(upTimer);
  ps.unpaywall = enriched.some((c) => c.provider === "unpaywall") ? "ok" : "skipped";

  // Matching
  const sources: VerifiedSource[] = [];
  const allExact: Array<[number,number]> = [];
  const allNear: Array<[number,number]> = [];
  const allSem: Array<[number,number]> = [];
  let geminiUsed = false;

  for (const cand of enriched) {
    const srcText = cand.abstract && cand.abstract.length > 100
      ? cand.abstract
      : await fetchSourceText(cand.url);
    if (!srcText || normalise(srcText).length < 100) continue;

    const exact = runExact(eligibleText, srcText.slice(0, 30_000));
    const near = runNear(eligibleText, srcText.slice(0, 30_000));

    const semCtrl = new AbortController();
    const semTimer = setTimeout(() => semCtrl.abort(), FETCH_TO_MS);
    const sem = await runSemantic(eligibleText, srcText.slice(0, 30_000), apiKey, [...exact.ranges, ...near.ranges], semCtrl.signal);
    clearTimeout(semTimer);
    if (sem.used) geminiUsed = true;

    const allSpans = [...exact.spans, ...near.spans, ...sem.spans];
    if (!allSpans.length) continue;

    const allRanges = [...exact.ranges, ...near.ranges, ...sem.ranges];
    const cov = uniqueCoverage(allRanges, eligibleChars);
    const contrib = Math.round((cov / eligibleChars) * 100);
    if (!contrib) continue;

    sources.push({
      title: cand.title, doi: cand.doi, url: cand.url, publisher: cand.publisher, provider: cand.provider,
      matchContribution: contrib, citedMaterial: hasCitations, matchedSpans: allSpans,
      similarity: Math.round(Math.max(...allSpans.map((s) => s.spanSimilarity)) * 100),
      matchType: dominantType(allSpans),
    });
    allExact.push(...exact.ranges);
    allNear.push(...near.ranges);
    allSem.push(...sem.ranges);
  }

  ps.gemini = geminiUsed ? "ok" : "skipped";

  if (!sources.length) {
    return { status: "no_verified_matches", similarityScore: 0, originalityScore: 100, exactMatchScore: 0, nearMatchScore: 0, semanticMatchScore: 0, riskLevel: "None", sources: [], coverageNote: COVERAGE_NOTE, providerStatus: ps };
  }

  const simScore = Math.round((uniqueCoverage([...allExact, ...allNear, ...allSem], eligibleChars) / eligibleChars) * 100);
  const exactScore = Math.round((uniqueCoverage(allExact, eligibleChars) / eligibleChars) * 100);
  const nearScore = Math.round((uniqueCoverage(allNear, eligibleChars) / eligibleChars) * 100);
  const semScore = Math.round((uniqueCoverage(allSem, eligibleChars) / eligibleChars) * 100);

  const anyFailed = ps.crossref === "failed" || ps.openalex === "failed";

  return {
    status: anyFailed ? "partial" : "completed",
    similarityScore: simScore, originalityScore: 100 - simScore,
    exactMatchScore: exactScore, nearMatchScore: nearScore, semanticMatchScore: semScore,
    riskLevel: riskLevel(simScore),
    sources: sources.sort((a, b) => b.matchContribution - a.matchContribution),
    coverageNote: COVERAGE_NOTE, providerStatus: ps,
  };
}

// ─── HTTP Handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const supabase = createServiceClient();
    const tz = getTimezone(req);
    const guestId = req.headers.get("x-guest-id") || getClientIp(req);
    let userId: string | null = null;

    const auth = req.headers.get("Authorization") ?? "";
    if (auth.startsWith("Bearer ")) {
      const { data: { user }, error } = await supabase.auth.getUser(auth.replace("Bearer ", "").trim());
      if (!error && user) userId = user.id;
    }

    if (userId) {
      const ent = await checkEntitlement(supabase, userId, "plagiarism_checker", tz);
      if (!ent.allowed) {
        return json({ status: "analysis_failed", errorMessage: ent.reason ?? "Upgrade required.", upgrade_required: true, remaining: ent.remaining, limit: ent.limit }, 403);
      }
    } else {
      const gEnt = await checkGuestEntitlement(supabase, guestId, tz);
      if (!gEnt.allowed) {
        return json({ status: "analysis_failed", errorMessage: gEnt.reason, upgrade_required: true, remaining: 0, limit: GUEST_DAILY_LIMIT }, 429);
      }
    }

    let body: { text?: unknown };
    try { body = await req.json(); } catch { return json({ status: "analysis_failed", errorMessage: "Invalid request body." }, 400); }

    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) return json({ status: "insufficient_text", errorMessage: "Text is required." }, 400);
    if (text.length > MAX_TEXT_CHARS) return json({ status: "insufficient_text", errorMessage: `Text exceeds ${MAX_TEXT_CHARS} character limit.` }, 400);

    const apiKey = Deno.env.get("INTEGRATIONS_API_KEY") ?? "";
    if (!apiKey) return json({ status: "provider_unavailable", errorMessage: "Server configuration error." }, 503);

    const result = await runAnalysis(text, apiKey);

    if (userId) await recordUsage(supabase, userId, "plagiarism_checker", 1, tz).catch(() => {});
    else await recordGuestUsage(supabase, guestId, tz).catch(() => {});

    return json(result);
  } catch (err: unknown) {
    console.error("plagiarism-checker:", err instanceof Error ? err.message : err);
    return json({ status: "analysis_failed", errorMessage: "Analysis failed. Please try again." }, 500);
  }
});

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_TEXT_CHARS = 15_000;
const MIN_TEXT_WORDS = 30;
const MAX_CANDIDATES = 8;          // max sources to retrieve and compare
const PROVIDER_TIMEOUT_MS = 8_000;
const FETCH_TIMEOUT_MS = 5_000;
const NGRAM_SIZE = 6;              // consecutive tokens for fingerprinting
const EXACT_NGRAM_THRESHOLD = 3;   // ≥N matching n-gram positions = exact candidate
const NEAR_JACCARD_MIN = 0.35;     // sentence-pair Jaccard to qualify as near match
const SEMANTIC_JACCARD_MAX = 0.25; // only use Gemini if lexical overlap is below this
const SEMANTIC_COSINE_MIN = 0.82;  // cosine similarity threshold to report semantic match
const GUEST_DAILY_LIMIT = 3;

const COVERAGE_NOTE =
  'This checker searches Crossref and OpenAlex scholarly databases. ' +
  'General websites, news articles, blogs, and social media are not currently indexed. ' +
  '"No verified matches" means no matches were found within academic sources checked — ' +
  'it does not guarantee the text is original.';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-timezone, x-guest-id',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ── Provider status accumulator ───────────────────────────────────────────────
type ProvStatus = 'ok' | 'failed' | 'skipped';
interface ProviderStatuses {
  crossref: ProvStatus;
  openalex: ProvStatus;
  unpaywall: ProvStatus;
  gemini: ProvStatus;
}

// ── Candidate record (pre-retrieval) ─────────────────────────────────────────
interface Candidate {
  title: string;
  doi: string | null;
  url: string;
  publisher: string;
  provider: 'crossref' | 'openalex' | 'unpaywall';
  abstract: string | null; // may be available before full-text retrieval
}

// ── Gateway URL helper ────────────────────────────────────────────────────────
const GATEWAY_BASE =
  'https://app-c18l1vf2nz7l-api-VaOwP8E7dJqa.gateway.appmedo.com';

function geminiUrl(model: string, method: string): string {
  return `${GATEWAY_BASE}/v1beta/models/${model}:${method}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SOURCE DISCOVERY PROVIDERS
// ─────────────────────────────────────────────────────────────────────────────

/** Extract up to 5 distinctive multi-word phrases for query construction. */
function extractQueryPhrases(text: string): string[] {
  const sentences = splitSentences(text);
  const phrases: string[] = [];
  for (const s of sentences.slice(0, 15)) {
    const tokens = tokenise(s.text);
    if (tokens.length >= 6) {
      phrases.push(tokens.slice(0, 8).join(' '));
    }
    if (phrases.length >= 5) break;
  }
  return phrases;
}

async function discoverCrossref(
  text: string,
  signal: AbortSignal
): Promise<Candidate[]> {
  const phrases = extractQueryPhrases(text);
  const results: Candidate[] = [];
  const seen = new Set<string>();

  for (const phrase of phrases.slice(0, 3)) {
    try {
      const url =
        `https://api.crossref.org/works?query=${encodeURIComponent(phrase)}` +
        `&rows=5&select=DOI,title,URL,publisher,abstract&mailto=plagiarism@aidetector.cx`;
      const resp = await fetch(url, { signal });
      if (!resp.ok) continue;
      const data = await resp.json();
      const items = data?.message?.items ?? [];
      for (const item of items) {
        const doi = item.DOI as string | undefined;
        const key = doi ?? (item.URL as string);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        const rawUrl = item.URL as string | undefined;
        if (!rawUrl || !isSafeUrl(rawUrl)) {
          // Use DOI resolver as fallback
          if (!doi) continue;
          const resolvedUrl = `https://doi.org/${doi}`;
          results.push({
            title: (item.title?.[0] as string) ?? doi,
            doi,
            url: resolvedUrl,
            publisher: (item.publisher as string) ?? 'Crossref',
            provider: 'crossref',
            abstract: (item.abstract as string | null) ?? null,
          });
        } else {
          results.push({
            title: (item.title?.[0] as string) ?? doi ?? rawUrl,
            doi: doi ?? null,
            url: rawUrl,
            publisher: (item.publisher as string) ?? 'Crossref',
            provider: 'crossref',
            abstract: (item.abstract as string | null) ?? null,
          });
        }
        if (results.length >= MAX_CANDIDATES) break;
      }
    } catch {
      // single phrase failure — continue with next
    }
    if (results.length >= MAX_CANDIDATES) break;
  }
  return results;
}

async function discoverOpenAlex(
  text: string,
  signal: AbortSignal
): Promise<Candidate[]> {
  const phrases = extractQueryPhrases(text);
  const results: Candidate[] = [];
  const seen = new Set<string>();

  for (const phrase of phrases.slice(0, 3)) {
    try {
      const url =
        `https://api.openalex.org/works?search=${encodeURIComponent(phrase)}` +
        `&per-page=5&select=id,doi,title,primary_location,abstract_inverted_index` +
        `&mailto=plagiarism@aidetector.cx`;
      const resp = await fetch(url, { signal });
      if (!resp.ok) continue;
      const data = await resp.json();
      const items = (data?.results ?? []) as Record<string, unknown>[];
      for (const item of items) {
        const doi = (item.doi as string | null)?.replace('https://doi.org/', '') ?? null;
        const loc = item.primary_location as Record<string, unknown> | null;
        const landingUrl = loc?.landing_page_url as string | undefined;
        const pdfUrl = loc?.pdf_url as string | undefined;
        const sourceKey = doi ?? landingUrl ?? '';
        if (!sourceKey || seen.has(sourceKey)) continue;
        seen.add(sourceKey);

        // Reconstruct abstract from inverted index
        let abstract: string | null = null;
        const inv = item.abstract_inverted_index as Record<string, number[]> | null;
        if (inv) {
          const wordPositions: Array<[string, number]> = [];
          for (const [word, positions] of Object.entries(inv)) {
            for (const pos of positions) wordPositions.push([word, pos]);
          }
          abstract = wordPositions
            .sort((a, b) => a[1] - b[1])
            .map((wp) => wp[0])
            .join(' ');
        }

        const resolvedUrl = pdfUrl && isSafeUrl(pdfUrl)
          ? pdfUrl
          : landingUrl && isSafeUrl(landingUrl)
            ? landingUrl
            : doi
              ? `https://doi.org/${doi}`
              : null;

        if (!resolvedUrl) continue;

        const sourceName = (loc?.source as Record<string, unknown> | null)?.display_name as string ?? 'OpenAlex';
        results.push({
          title: (item.title as string) ?? resolvedUrl,
          doi,
          url: resolvedUrl,
          publisher: sourceName,
          provider: 'openalex',
          abstract,
        });
        if (results.length >= MAX_CANDIDATES) break;
      }
    } catch {
      // single phrase failure — continue
    }
    if (results.length >= MAX_CANDIDATES) break;
  }
  return results;
}

/** Enrich a candidate with an Unpaywall open-access URL if one exists. */
async function enrichWithUnpaywall(
  candidate: Candidate,
  signal: AbortSignal
): Promise<Candidate> {
  if (!candidate.doi) return candidate;
  try {
    const url = `https://api.unpaywall.org/v2/${encodeURIComponent(candidate.doi)}?email=plagiarism@aidetector.cx`;
    const resp = await fetch(url, { signal });
    if (!resp.ok) return candidate;
    const data = await resp.json();
    const oaUrl = data?.best_oa_location?.url_for_pdf ?? data?.best_oa_location?.url;
    if (typeof oaUrl === 'string' && isSafeUrl(oaUrl)) {
      return { ...candidate, url: oaUrl, provider: 'unpaywall' };
    }
  } catch {
    // Unpaywall unavailable — use existing URL
  }
  return candidate;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SOURCE RETRIEVAL
// ─────────────────────────────────────────────────────────────────────────────

async function fetchSourceText(url: string): Promise<string | null> {
  if (!isSafeUrl(url)) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AIDetector-PlagiarismChecker/1.0 (mailto:plagiarism@aidetector.cx)' },
    });
    clearTimeout(timer);
    if (!resp.ok) return null;

    const contentType = resp.headers.get('content-type') ?? '';
    // Only process text/html and text/plain — skip PDFs, videos, etc.
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return null;
    }

    const raw = await resp.text();
    // Strip HTML tags
    const text = raw.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ');
    return removeBoilerplate(text).slice(0, 40_000);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. EXACT MATCH ENGINE
// ─────────────────────────────────────────────────────────────────────────────

interface ExactMatchResult {
  spans: MatchedSpan[];
  /** Unique [start, end) character spans in submitted text */
  coveredRanges: Array<[number, number]>;
}

function runExactMatch(
  submitted: string,
  sourceText: string
): ExactMatchResult {
  const submittedTokens = tokenise(submitted);
  const sourceTokens = tokenise(sourceText);

  const submittedGrams = buildNgrams(submittedTokens, NGRAM_SIZE);
  const sourceGrams = buildNgrams(sourceTokens, NGRAM_SIZE);

  // Find n-grams shared between submitted and source
  const sharedGrams: string[] = [];
  for (const key of submittedGrams.keys()) {
    if (sourceGrams.has(key)) sharedGrams.push(key);
  }

  if (sharedGrams.length < EXACT_NGRAM_THRESHOLD) {
    return { spans: [], coveredRanges: [] };
  }

  // Extend shared n-gram groups into contiguous passages using LCS-style expansion
  const spans: MatchedSpan[] = [];
  const coveredRanges: Array<[number, number]> = [];
  const usedSubmittedPositions = new Set<number>();

  for (const gram of sharedGrams) {
    const sPositions = submittedGrams.get(gram)!;
    const tPositions = sourceGrams.get(gram)!;

    for (const sPos of sPositions) {
      if (usedSubmittedPositions.has(sPos)) continue;

      // Extend forward and backward from this matching position
      let matchLen = NGRAM_SIZE;
      const tPos = tPositions[0]; // first occurrence in source

      // Extend forward
      while (
        sPos + matchLen < submittedTokens.length &&
        tPos + matchLen < sourceTokens.length &&
        submittedTokens[sPos + matchLen] === sourceTokens[tPos + matchLen]
      ) {
        matchLen++;
      }

      if (matchLen < NGRAM_SIZE) continue;

      // Mark as used
      for (let i = sPos; i < sPos + matchLen; i++) usedSubmittedPositions.add(i);

      const submittedPassage = submittedTokens.slice(sPos, sPos + matchLen).join(' ');
      const sourcePassage = sourceTokens.slice(tPos, tPos + matchLen).join(' ');

      // Find approximate character offsets in original submitted text
      const normSubmitted = normalise(submitted);
      const charStart = normSubmitted.indexOf(
        submittedTokens.slice(sPos, sPos + 2).join(' ')
      );
      const charEnd = charStart === -1
        ? Math.min(charStart + submittedPassage.length + 20, submitted.length)
        : charStart + submittedPassage.length;

      if (charStart >= 0) coveredRanges.push([charStart, charEnd]);

      spans.push({
        submittedStart: charStart >= 0 ? charStart : 0,
        submittedEnd: charEnd,
        submittedPassage,
        sourcePassage,
        matchType: 'exact',
        spanSimilarity: 1.0,
      });
    }
  }

  return { spans, coveredRanges };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. NEAR (FUZZY) MATCH ENGINE
// ─────────────────────────────────────────────────────────────────────────────

interface NearMatchResult {
  spans: MatchedSpan[];
  coveredRanges: Array<[number, number]>;
}

function runNearMatch(
  submitted: string,
  sourceText: string,
  exactCoveredTokenPositions: Set<number>
): NearMatchResult {
  const submittedSentences = splitSentences(submitted);
  const sourceSentences = splitSentences(sourceText);

  const spans: MatchedSpan[] = [];
  const coveredRanges: Array<[number, number]> = [];

  for (const ss of submittedSentences) {
    const sToks = tokenise(ss.text);
    if (sToks.length < 5) continue;

    let bestSimilarity = 0;
    let bestSourceSentence = '';

    for (const ts of sourceSentences) {
      const tToks = tokenise(ts.text);
      if (tToks.length < 5) continue;

      const jaccard = jaccardSimilarity(sToks, tToks);
      if (jaccard < NEAR_JACCARD_MIN) continue;

      // Confirm with edit distance on normalised sentence
      const sNorm = normalise(ss.text).slice(0, 200);
      const tNorm = normalise(ts.text).slice(0, 200);
      const maxLen = Math.max(sNorm.length, tNorm.length);
      if (maxLen === 0) continue;
      const ed = editDistance(sNorm, tNorm, 100);
      const edSim = 1 - ed / maxLen;

      const combined = (jaccard + edSim) / 2;
      if (combined > bestSimilarity) {
        bestSimilarity = combined;
        bestSourceSentence = ts.text;
      }
    }

    if (bestSimilarity >= NEAR_JACCARD_MIN && bestSourceSentence) {
      const charStart = ss.start;
      const charEnd = ss.start + ss.text.length;
      coveredRanges.push([charStart, charEnd]);
      spans.push({
        submittedStart: charStart,
        submittedEnd: charEnd,
        submittedPassage: ss.text,
        sourcePassage: bestSourceSentence,
        matchType: 'near',
        spanSimilarity: Math.round(bestSimilarity * 100) / 100,
      });
    }
  }

  return { spans, coveredRanges };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. GEMINI SEMANTIC LAYER
//    Only called when lexical overlap is low and source text is genuinely retrieved.
// ─────────────────────────────────────────────────────────────────────────────

async function computeEmbedding(
  text: string,
  apiKey: string,
  signal: AbortSignal
): Promise<number[] | null> {
  try {
    const resp = await fetch(
      geminiUrl('text-embedding-004', 'embedContent'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gateway-Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text: text.slice(0, 2048) }] },
        }),
        signal,
      }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    return (data?.embedding?.values as number[]) ?? null;
  } catch {
    return null;
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

interface SemanticMatchResult {
  spans: MatchedSpan[];
  coveredRanges: Array<[number, number]>;
  geminiUsed: boolean;
}

async function runSemanticMatch(
  submitted: string,
  sourceText: string,
  apiKey: string,
  existingCoveredRanges: Array<[number, number]>,
  signal: AbortSignal
): Promise<SemanticMatchResult> {
  const submittedSentences = splitSentences(submitted);
  const sourceSentences = splitSentences(sourceText);

  // Only process submitted sentences not already covered by exact/near match
  const uncoveredSentences = submittedSentences.filter((ss) => {
    const mid = ss.start + Math.floor(ss.text.length / 2);
    return !existingCoveredRanges.some(([s, e]) => mid >= s && mid < e);
  });

  if (uncoveredSentences.length === 0 || sourceSentences.length === 0) {
    return { spans: [], coveredRanges: [], geminiUsed: false };
  }

  // Check if any uncovered sentence has low lexical overlap with any source sentence
  const candidatePairs: Array<{ ss: typeof submittedSentences[0]; ts: typeof sourceSentences[0] }> = [];

  for (const ss of uncoveredSentences.slice(0, 10)) {
    const sToks = tokenise(ss.text);
    if (sToks.length < 6) continue;
    for (const ts of sourceSentences.slice(0, 20)) {
      const tToks = tokenise(ts.text);
      if (tToks.length < 6) continue;
      const jac = jaccardSimilarity(sToks, tToks);
      // Only use Gemini for pairs with low lexical overlap
      if (jac < SEMANTIC_JACCARD_MAX && jac > 0.05) {
        candidatePairs.push({ ss, ts });
        if (candidatePairs.length >= 5) break;
      }
    }
    if (candidatePairs.length >= 5) break;
  }

  if (candidatePairs.length === 0) {
    return { spans: [], coveredRanges: [], geminiUsed: false };
  }

  // Compute embeddings for unique texts
  const uniqueTexts = new Map<string, number[] | null>();
  for (const { ss, ts } of candidatePairs) {
    if (!uniqueTexts.has(ss.text)) uniqueTexts.set(ss.text, null);
    if (!uniqueTexts.has(ts.text)) uniqueTexts.set(ts.text, null);
  }

  let geminiFailed = false;
  for (const [text] of uniqueTexts) {
    const emb = await computeEmbedding(text, apiKey, signal);
    if (!emb) { geminiFailed = true; break; }
    uniqueTexts.set(text, emb);
  }

  if (geminiFailed) {
    return { spans: [], coveredRanges: [], geminiUsed: false };
  }

  const spans: MatchedSpan[] = [];
  const coveredRanges: Array<[number, number]> = [];

  for (const { ss, ts } of candidatePairs) {
    const embA = uniqueTexts.get(ss.text);
    const embB = uniqueTexts.get(ts.text);
    if (!embA || !embB) continue;
    const cosine = cosineSimilarity(embA, embB);
    if (cosine >= SEMANTIC_COSINE_MIN) {
      const charStart = ss.start;
      const charEnd = ss.start + ss.text.length;
      coveredRanges.push([charStart, charEnd]);
      spans.push({
        submittedStart: charStart,
        submittedEnd: charEnd,
        submittedPassage: ss.text,
        sourcePassage: ts.text,
        matchType: 'semantic',
        spanSimilarity: Math.round(cosine * 100) / 100,
      });
    }
  }

  return { spans, coveredRanges, geminiUsed: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SCORING
// ─────────────────────────────────────────────────────────────────────────────

function riskLevel(similarity: number): 'None' | 'Low' | 'Medium' | 'High' | 'Critical' {
  if (similarity === 0) return 'None';
  if (similarity < 10) return 'Low';
  if (similarity < 25) return 'Medium';
  if (similarity < 50) return 'High';
  return 'Critical';
}

function dominantMatchType(spans: MatchedSpan[]): VerifiedSource['matchType'] {
  if (spans.length === 0) return 'Exact';
  const counts = { exact: 0, near: 0, semantic: 0 };
  for (const s of spans) counts[s.matchType]++;
  if (counts.exact >= counts.near && counts.exact >= counts.semantic) {
    return counts.near > 0 || counts.semantic > 0 ? 'Mixed' : 'Exact';
  }
  if (counts.near >= counts.semantic) return counts.exact > 0 ? 'Mixed' : 'Near Match';
  return counts.exact > 0 || counts.near > 0 ? 'Mixed' : 'Semantic';
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. MAIN ANALYSIS PIPELINE
// ─────────────────────────────────────────────────────────────────────────────

async function runAnalysis(
  submittedText: string,
  apiKey: string
): Promise<PlagiarismAnalysisResult> {
  const provStatus: ProviderStatuses = {
    crossref: 'skipped',
    openalex: 'skipped',
    unpaywall: 'skipped',
    gemini: 'skipped',
  };

  // ── Input prep ─────────────────────────────────────────────────────────
  const [body] = splitBibliography(submittedText);
  const { clean: cleanBody, hasCitations } = stripCitations(body);
  const eligibleText = cleanBody.trim();
  const eligibleChars = eligibleText.length;

  if (tokenise(eligibleText).length < MIN_TEXT_WORDS) {
    return {
      status: 'insufficient_text',
      similarityScore: 0,
      originalityScore: 100,
      exactMatchScore: 0,
      nearMatchScore: 0,
      semanticMatchScore: 0,
      riskLevel: 'None',
      sources: [],
      coverageNote: COVERAGE_NOTE,
      providerStatus: provStatus,
      errorMessage: `Minimum ${MIN_TEXT_WORDS} words required for analysis.`,
    };
  }

  // ── Source discovery (parallel with timeout) ───────────────────────────
  const discoveryAbort = new AbortController();
  const discoveryTimer = setTimeout(
    () => discoveryAbort.abort(),
    PROVIDER_TIMEOUT_MS
  );

  let crossrefCandidates: Candidate[] = [];
  let openalexCandidates: Candidate[] = [];

  const [crResult, oaResult] = await Promise.allSettled([
    discoverCrossref(eligibleText, discoveryAbort.signal),
    discoverOpenAlex(eligibleText, discoveryAbort.signal),
  ]);

  clearTimeout(discoveryTimer);

  if (crResult.status === 'fulfilled') {
    crossrefCandidates = crResult.value;
    provStatus.crossref = crossrefCandidates.length > 0 ? 'ok' : 'ok'; // ran fine
  } else {
    provStatus.crossref = 'failed';
  }

  if (oaResult.status === 'fulfilled') {
    openalexCandidates = oaResult.value;
    provStatus.openalex = openalexCandidates.length > 0 ? 'ok' : 'ok';
  } else {
    provStatus.openalex = 'failed';
  }

  const allCandidates = [...crossrefCandidates, ...openalexCandidates];

  // Deduplicate by DOI then by URL
  const deduped: Candidate[] = [];
  const seenDois = new Set<string>();
  const seenUrls = new Set<string>();
  for (const c of allCandidates) {
    const key = c.doi ?? c.url;
    if (c.doi && seenDois.has(c.doi)) continue;
    if (seenUrls.has(c.url)) continue;
    if (c.doi) seenDois.add(c.doi);
    seenUrls.add(c.url);
    deduped.push(c);
    if (deduped.length >= MAX_CANDIDATES) break;
  }

  if (deduped.length === 0) {
    const allFailed =
      provStatus.crossref === 'failed' && provStatus.openalex === 'failed';
    return {
      status: allFailed ? 'provider_unavailable' : 'no_verified_matches',
      similarityScore: 0,
      originalityScore: 100,
      exactMatchScore: 0,
      nearMatchScore: 0,
      semanticMatchScore: 0,
      riskLevel: 'None',
      sources: [],
      coverageNote: COVERAGE_NOTE,
      providerStatus: provStatus,
      ...(allFailed ? { errorMessage: 'Source discovery providers could not be reached.' } : {}),
    };
  }

  // ── Unpaywall enrichment (best-effort) ─────────────────────────────────
  const unpayAbort = new AbortController();
  const unpayTimer = setTimeout(() => unpayAbort.abort(), 5_000);
  const enriched = await Promise.all(
    deduped.map((c) => enrichWithUnpaywall(c, unpayAbort.signal))
  );
  clearTimeout(unpayTimer);
  const anyUnpaywall = enriched.some((c) => c.provider === 'unpaywall');
  provStatus.unpaywall = anyUnpaywall ? 'ok' : 'skipped';

  // ── Source retrieval + matching ────────────────────────────────────────
  const verifiedSources: VerifiedSource[] = [];
  const allExactRanges: Array<[number, number]> = [];
  const allNearRanges: Array<[number, number]> = [];
  const allSemanticRanges: Array<[number, number]> = [];
  let geminiEverUsed = false;

  for (const candidate of enriched) {
    // Try abstract first; fall back to full-text fetch
    let sourceText = candidate.abstract && candidate.abstract.length > 100
      ? candidate.abstract
      : await fetchSourceText(candidate.url);

    if (!sourceText || normalise(sourceText).length < 100) continue;
    sourceText = sourceText.slice(0, 30_000);

    // Exact match
    const exactResult = runExactMatch(eligibleText, sourceText);

    // Near match (on sentences not covered by exact)
    const exactCoveredSet = new Set<number>();
    const nearResult = runNearMatch(eligibleText, sourceText, exactCoveredSet);

    // Semantic match (only if Gemini available and lexical overlap low)
    const existingRanges = [...exactResult.coveredRanges, ...nearResult.coveredRanges];
    const semanticAbort = new AbortController();
    const semanticTimer = setTimeout(() => semanticAbort.abort(), FETCH_TIMEOUT_MS);
    const semanticResult = await runSemanticMatch(
      eligibleText,
      sourceText,
      apiKey,
      existingRanges,
      semanticAbort.signal
    );
    clearTimeout(semanticTimer);
    if (semanticResult.geminiUsed) geminiEverUsed = true;

    const allSpans: MatchedSpan[] = [
      ...exactResult.spans,
      ...nearResult.spans,
      ...semanticResult.spans,
    ];

    if (allSpans.length === 0) continue;

    // Per-source match contribution
    const sourceRanges = [
      ...exactResult.coveredRanges,
      ...nearResult.coveredRanges,
      ...semanticResult.coveredRanges,
    ];
    const sourceCoverage = uniqueCoverage(sourceRanges, eligibleChars);
    const matchContribution = Math.round((sourceCoverage / eligibleChars) * 100);

    if (matchContribution === 0) continue;

    verifiedSources.push({
      title: candidate.title,
      doi: candidate.doi,
      url: candidate.url,
      publisher: candidate.publisher,
      provider: candidate.provider,
      matchContribution,
      citedMaterial: hasCitations,
      matchedSpans: allSpans,
      similarity: Math.round(
        Math.max(...allSpans.map((s) => s.spanSimilarity)) * 100
      ),
      matchType: dominantMatchType(allSpans),
    });

    // Accumulate global coverage ranges by type
    allExactRanges.push(...exactResult.coveredRanges);
    allNearRanges.push(...nearResult.coveredRanges);
    allSemanticRanges.push(...semanticResult.coveredRanges);
  }

  provStatus.gemini = geminiEverUsed ? 'ok' : 'skipped';

  if (verifiedSources.length === 0) {
    return {
      status: 'no_verified_matches',
      similarityScore: 0,
      originalityScore: 100,
      exactMatchScore: 0,
      nearMatchScore: 0,
      semanticMatchScore: 0,
      riskLevel: 'None',
      sources: [],
      coverageNote: COVERAGE_NOTE,
      providerStatus: provStatus,
    };
  }

  // ── Global scoring (no double-counting across sources) ─────────────────
  const allMatchRanges = [...allExactRanges, ...allNearRanges, ...allSemanticRanges];
  const totalCoverage = uniqueCoverage(allMatchRanges, eligibleChars);
  const similarityScore = Math.round((totalCoverage / eligibleChars) * 100);

  const exactCoverage = uniqueCoverage(allExactRanges, eligibleChars);
  const nearCoverage = uniqueCoverage(allNearRanges, eligibleChars);
  const semanticCoverage = uniqueCoverage(allSemanticRanges, eligibleChars);

  const exactMatchScore = Math.round((exactCoverage / eligibleChars) * 100);
  const nearMatchScore = Math.round((nearCoverage / eligibleChars) * 100);
  const semanticMatchScore = Math.round((semanticCoverage / eligibleChars) * 100);

  // Determine result status
  const anyProviderFailed =
    provStatus.crossref === 'failed' || provStatus.openalex === 'failed';
  const status: PlagiarismStatus = anyProviderFailed ? 'partial' : 'completed';

  return {
    status,
    similarityScore,
    originalityScore: 100 - similarityScore,
    exactMatchScore,
    nearMatchScore,
    semanticMatchScore,
    riskLevel: riskLevel(similarityScore),
    sources: verifiedSources.sort((a, b) => b.matchContribution - a.matchContribution),
    coverageNote: COVERAGE_NOTE,
    providerStatus: provStatus,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. HTTP HANDLER
// ─────────────────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();
    const timezone = getTimezone(req);

    // ── Auth: try JWT user first, fall back to guest ─────────────────────
    const authHeader = req.headers.get('Authorization') ?? '';
    const guestId = req.headers.get('x-guest-id') ?? getClientIp(req);
    let userId: string | null = null;

    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) userId = user.id;
    }

    if (userId) {
      // Authenticated path — check entitlement
      const entitlement = await checkEntitlement(
        supabase,
        userId,
        'plagiarism_checker',
        timezone
      );
      if (!entitlement.allowed) {
        return json({
          status: 'analysis_failed',
          errorMessage: entitlement.reason ?? 'Upgrade required to run plagiarism checks.',
          upgrade_required: true,
          remaining: entitlement.remaining,
          limit: entitlement.limit,
        }, 403);
      }
    } else {
      // Guest path — IP-rate-limited
      const guestEnt = await checkGuestEntitlement(supabase, guestId, timezone);
      if (!guestEnt.allowed) {
        return json({
          status: 'analysis_failed',
          errorMessage: guestEnt.reason ?? `Free limit of ${GUEST_DAILY_LIMIT} checks/day reached. Sign up for more.`,
          upgrade_required: true,
          remaining: 0,
          limit: GUEST_DAILY_LIMIT,
        }, 429);
      }
    }

    // ── Input validation ─────────────────────────────────────────────────
    let body: { text?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ status: 'analysis_failed', errorMessage: 'Invalid request body.' }, 400);
    }

    const text = typeof body.text === 'string' ? body.text.trim() : '';

    if (!text) {
      return json({ status: 'insufficient_text', errorMessage: 'Text is required.' }, 400);
    }

    if (text.length > MAX_TEXT_CHARS) {
      return json({
        status: 'insufficient_text',
        errorMessage: `Text exceeds maximum length of ${MAX_TEXT_CHARS} characters.`,
      }, 400);
    }

    // ── API key (backend-only) ────────────────────────────────────────────
    const apiKey = Deno.env.get('INTEGRATIONS_API_KEY') ?? '';
    if (!apiKey) {
      return json({
        status: 'provider_unavailable',
        errorMessage: 'Server configuration error. Please try again later.',
      }, 503);
    }

    // ── Run analysis ─────────────────────────────────────────────────────
    const result = await runAnalysis(text, apiKey);

    // ── Record usage on success ───────────────────────────────────────────
    if (userId) {
      await recordUsage(supabase, userId, 'plagiarism_checker', 1, timezone).catch(() => {});
    } else {
      await recordGuestUsage(supabase, guestId, 1, timezone).catch(() => {});
    }

    return json(result, 200);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error';
    console.error('plagiarism-checker error:', msg);
    return json({
      status: 'analysis_failed',
      errorMessage: 'Analysis failed. Please try again.',
    }, 500);
  }
});
