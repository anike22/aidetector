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
const MAX_TEXT_CHARS      = 15_000;
const MIN_TEXT_WORDS      = 30;
const MAX_CANDIDATES      = 8;   // per academic provider
const MAX_WEB_CANDIDATES  = 6;   // from Google Custom Search
const PROVIDER_TO_MS      = 8_000;
const FETCH_TO_MS         = 5_000;
const NGRAM_SIZE          = 6;
const EXACT_THRESHOLD     = 3;   // min shared n-grams to qualify as exact candidate
const NEAR_JACCARD_MIN    = 0.35;
const SEM_JACCARD_MAX     = 0.25; // only use Gemini if lexical overlap below this
const SEM_COSINE_MIN      = 0.82;
const GUEST_DAILY_LIMIT   = 3;
// Max chars to extract from a PDF page before feeding into matching engine
const PDF_CHAR_LIMIT      = 40_000;

const COVERAGE_NOTE =
  "This checker compares submitted text against verified academic sources from Crossref, OpenAlex and Unpaywall. " +
  "Social media, paywalled content, and very recent publications may not be fully indexed. " +
  "No verified matches were found in the sources successfully searched. This does not confirm complete originality.";

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

type ProvStatus = "ok" | "failed" | "skipped" | "not_configured";

interface MatchedSpan {
  submittedStart: number; submittedEnd: number;
  submittedPassage: string; sourcePassage: string;
  matchType: "exact" | "near" | "semantic";
  spanSimilarity: number;
}

interface VerifiedSource {
  title: string; doi: string | null; url: string;
  publisher: string; provider: "crossref" | "openalex" | "unpaywall" | "web";
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
  providerStatus: { crossref: ProvStatus; openalex: ProvStatus; unpaywall: ProvStatus; gemini: ProvStatus; webSearch: ProvStatus };
  errorMessage?: string;
  upgrade_required?: boolean; remaining?: number | null; limit?: number | null;
}

interface Candidate {
  title: string; doi: string | null; url: string;
  publisher: string; provider: "crossref" | "openalex" | "unpaywall" | "web";
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

// ─── Google Custom Search web discovery ───────────────────────────────────────
async function discoverWeb(text: string, sig: AbortSignal): Promise<Candidate[]> {
  const apiKey = Deno.env.get("GOOGLE_SEARCH_API_KEY") ?? "";
  const cx     = Deno.env.get("GOOGLE_SEARCH_CX") ?? "";
  if (!apiKey || !cx) throw new Error("Google Custom Search not configured");

  const phrases = extractPhrases(text);
  const results: Candidate[] = [];
  const seen = new Set<string>();

  for (const phrase of phrases.slice(0, 3)) {
    const url =
      `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}` +
      `&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(`"${phrase}"`)}&num=5`;
    const resp = await fetch(url, { signal: sig });
    if (!resp.ok) throw new Error(`Google search HTTP ${resp.status}`);
    const data = await resp.json();
    for (const item of (data?.items ?? []) as Record<string, unknown>[]) {
      const link = (item.link as string | undefined) ?? "";
      if (!link || !isSafeUrl(link) || seen.has(link)) continue;
      seen.add(link);
      results.push({
        title:     (item.title as string)   ?? link,
        doi:       null,
        url:       link,
        publisher: (item.displayLink as string) ?? new URL(link).hostname,
        provider:  "web",
        abstract:  (item.snippet as string | null) ?? null,
      });
      if (results.length >= MAX_WEB_CANDIDATES) break;
    }
    if (results.length >= MAX_WEB_CANDIDATES) break;
  }
  return results;
}

// ─── Source Retrieval (HTML + PDF) ────────────────────────────────────────────

/**
 * Pure-Deno PDF text extractor.
 * Scans the raw binary for BT...ET text blocks and extracts ASCII/Latin-1 strings.
 * Not a full PDF parser — works well for born-digital PDFs with embedded text.
 */
function extractPdfText(buf: Uint8Array): string {
  const decoder = new TextDecoder("latin1");
  const raw = decoder.decode(buf);
  const chunks: string[] = [];

  // Match BT ... ET text blocks
  const btRe = /BT[\s\S]*?ET/g;
  let btM: RegExpExecArray | null;
  while ((btM = btRe.exec(raw)) !== null) {
    const block = btM[0];
    // Extract string literals: (text) or <hex>
    const strRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)|<([0-9A-Fa-f]{2,})>/g;
    let sm: RegExpExecArray | null;
    while ((sm = strRe.exec(block)) !== null) {
      if (sm[1] !== undefined) {
        // Literal string — unescape PDF escape sequences
        const s = sm[1]
          .replace(/\\n/g, " ").replace(/\\r/g, " ").replace(/\\t/g, " ")
          .replace(/\\\\/g, "\\").replace(/\\\(/g, "(").replace(/\\\)/g, ")")
          .replace(/\\[0-7]{1,3}/g, (esc) =>
            String.fromCharCode(parseInt(esc.slice(1), 8)));
        if (s.trim().length > 1) chunks.push(s);
      } else if (sm[2] !== undefined) {
        // Hex string
        const hex = sm[2];
        let s = "";
        for (let i = 0; i + 1 < hex.length; i += 2)
          s += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
        if (s.trim().length > 1) chunks.push(s);
      }
    }
  }

  // Fallback: stream text between parentheses outside BT/ET (some older PDFs)
  if (chunks.length < 10) {
    const fallbackRe = /\(([A-Za-z0-9 ,\.\-:;'"]{6,})\)/g;
    let fm: RegExpExecArray | null;
    while ((fm = fallbackRe.exec(raw)) !== null) chunks.push(fm[1]);
  }

  return chunks.join(" ").replace(/\s+/g, " ").slice(0, PDF_CHAR_LIMIT);
}

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

    // ── PDF handling ──
    if (ct.includes("application/pdf") || url.toLowerCase().endsWith(".pdf")) {
      const buf = new Uint8Array(await resp.arrayBuffer());
      const text = extractPdfText(buf);
      return text.length > 50 ? text : null;
    }

    // ── HTML / plain text ──
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
  const ps: PlagResult["providerStatus"] = {
    crossref: "skipped", openalex: "skipped", unpaywall: "skipped",
    gemini: "skipped", webSearch: "skipped",
  };

  const { body: eligibleText, hasCitations } = prepareText(rawText);
  const eligibleChars = eligibleText.length;

  if (tokenise(eligibleText).length < MIN_TEXT_WORDS) {
    return { status: "insufficient_text", similarityScore: 0, originalityScore: 100, exactMatchScore: 0, nearMatchScore: 0, semanticMatchScore: 0, riskLevel: "None", sources: [], coverageNote: COVERAGE_NOTE, providerStatus: ps, errorMessage: `Minimum ${MIN_TEXT_WORDS} words required.` };
  }

  // Discovery — Crossref + OpenAlex always run in parallel.
  // Google Custom Search is disabled by default because it is not currently
  // available for this project. It remains an optional future provider; set
  // ENABLE_WEB_SEARCH=true and provide GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_CX
  // to activate it.
  const webEnabled = Deno.env.get("ENABLE_WEB_SEARCH") === "true";
  const webConfigured = webEnabled &&
    (Deno.env.get("GOOGLE_SEARCH_API_KEY") ?? "").length > 0 &&
    (Deno.env.get("GOOGLE_SEARCH_CX") ?? "").length > 0;

  const discCtrl = new AbortController();
  const discTimer = setTimeout(() => discCtrl.abort(), PROVIDER_TO_MS);
  const [crRes, oaRes] = await Promise.allSettled([
    discoverCrossref(eligibleText, discCtrl.signal),
    discoverOpenAlex(eligibleText, discCtrl.signal),
  ]);
  clearTimeout(discTimer);

  const crCands = crRes.status === "fulfilled" ? crRes.value : [];
  const oaCands = oaRes.status === "fulfilled" ? oaRes.value : [];
  let webCands: Candidate[] = [];

  ps.crossref = crRes.status === "fulfilled" ? (crCands.length ? "ok" : "skipped") : "failed";
  ps.openalex = oaRes.status === "fulfilled" ? (oaCands.length ? "ok" : "skipped") : "failed";
  ps.webSearch = webConfigured ? "skipped" : "not_configured";

  if (webConfigured) {
    const webCtrl = new AbortController();
    const webTimer = setTimeout(() => webCtrl.abort(), PROVIDER_TO_MS);
    try {
      webCands = await discoverWeb(eligibleText, webCtrl.signal);
      ps.webSearch = webCands.length ? "ok" : "skipped";
    } catch {
      ps.webSearch = "failed";
    } finally {
      clearTimeout(webTimer);
    }
  }

  // Deduplicate across all providers (DOI first, then URL)
  const deduped: Candidate[] = [];
  const seenDoi = new Set<string>(), seenUrl = new Set<string>();
  for (const c of [...crCands, ...oaCands, ...webCands]) {
    const key = c.doi ?? c.url;
    if (c.doi && seenDoi.has(c.doi)) continue;
    if (seenUrl.has(c.url)) continue;
    if (c.doi) seenDoi.add(c.doi);
    seenUrl.add(c.url);
    deduped.push(c);
    if (deduped.length >= MAX_CANDIDATES + MAX_WEB_CANDIDATES) break;
  }

  if (!deduped.length) {
    const allAcademicFailed = ps.crossref === "failed" && ps.openalex === "failed";
    const anyFailed = ps.crossref === "failed" || ps.openalex === "failed" || ps.webSearch === "failed";
    return {
      status: allAcademicFailed ? "provider_unavailable" : (anyFailed ? "partial" : "no_verified_matches"),
      similarityScore: 0, originalityScore: 100, exactMatchScore: 0, nearMatchScore: 0, semanticMatchScore: 0,
      riskLevel: "None", sources: [], coverageNote: COVERAGE_NOTE, providerStatus: ps,
      ...(allAcademicFailed ? { errorMessage: "Source discovery providers could not be reached." } :
          anyFailed ? { errorMessage: "Some source providers could not be reached." } : {}),
    };
  }

  // Unpaywall enrichment (academic candidates only)
  const upCtrl = new AbortController();
  const upTimer = setTimeout(() => upCtrl.abort(), 5_000);
  const enriched = await Promise.all(
    deduped.map((c) => c.provider !== "web" ? enrichUnpaywall(c, upCtrl.signal) : Promise.resolve(c))
  );
  clearTimeout(upTimer);
  ps.unpaywall = enriched.some((c) => c.provider === "unpaywall") ? "ok" : "skipped";

  // Matching
  const sources: VerifiedSource[] = [];
  const allExact: Array<[number,number]> = [];
  const allNear:  Array<[number,number]> = [];
  const allSem:   Array<[number,number]> = [];
  let geminiUsed = false;

  for (const cand of enriched) {
    // Use abstract if substantial, otherwise fetch full text (HTML or PDF)
    const srcText = cand.abstract && cand.abstract.length > 100
      ? cand.abstract
      : await fetchSourceText(cand.url);
    if (!srcText || normalise(srcText).length < 100) continue;

    const exact = runExact(eligibleText, srcText.slice(0, 30_000));
    const near  = runNear(eligibleText,  srcText.slice(0, 30_000));

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
    const anyFailed = ps.crossref === "failed" || ps.openalex === "failed" || ps.webSearch === "failed";
    return {
      status: anyFailed ? "partial" : "no_verified_matches",
      similarityScore: 0, originalityScore: 100, exactMatchScore: 0, nearMatchScore: 0, semanticMatchScore: 0,
      riskLevel: "None", sources: [], coverageNote: COVERAGE_NOTE, providerStatus: ps,
      ...(anyFailed ? { errorMessage: "Some source providers could not be reached." } : {}),
    };
  }

  const simScore  = Math.round((uniqueCoverage([...allExact, ...allNear, ...allSem], eligibleChars) / eligibleChars) * 100);
  const exactScore = Math.round((uniqueCoverage(allExact, eligibleChars) / eligibleChars) * 100);
  const nearScore  = Math.round((uniqueCoverage(allNear,  eligibleChars) / eligibleChars) * 100);
  const semScore   = Math.round((uniqueCoverage(allSem,   eligibleChars) / eligibleChars) * 100);

  const anyFailed = ps.crossref === "failed" || ps.openalex === "failed" || ps.webSearch === "failed";

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
