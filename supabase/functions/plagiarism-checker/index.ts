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
import Exa from "https://esm.sh/exa-js@2.14.0";

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_TEXT_CHARS      = 15_000;
const MIN_TEXT_WORDS      = 30;
const MAX_CANDIDATES      = 8;   // per academic provider
const MAX_WEB_CANDIDATES  = 6;   // from Google Custom Search
const MAX_EXA_CANDIDATES  = 8;   // from Exa search
const PROVIDER_TO_MS      = 8_000;
const FETCH_TO_MS         = 5_000;
const GUEST_DAILY_LIMIT   = 3;
// Max chars to extract from a PDF page before feeding into matching engine
const PDF_CHAR_LIMIT      = 40_000;

// Evidence-first matching thresholds
const EXACT_MIN_RUN_TOKENS = 8;   // min identical token run to be considered exact
const EXACT_NGRAM_SIZE     = 5;   // n-gram size for exact-match seeding
const EXACT_MIN_NGRAMS     = 2;   // min shared n-grams to start a run
const NEAR_JACCARD_MIN     = 0.65; // high bar to avoid topic-level false positives
const NEAR_LCS_MIN         = 0.40; // at least 40% of tokens must be in same order
const NEAR_MIN_TOKENS      = 6;
const NEAR_MAX_WINDOW_TOKENS = 40; // source window size for near matching
const SEM_JACCARD_MAX      = 0.25; // only use Gemini if lexical overlap below this
const SEM_COSINE_MIN       = 0.86; // higher bar for candidate paraphrase detection
const SEM_MIN_TOKENS       = 7;

const COVERAGE_NOTE =
  "This checker compares submitted text against verified academic sources from Crossref, OpenAlex and Unpaywall. " +
  "Social media, paywalled content, and very recent publications may not be fully indexed. " +
  "No verified matches were found in the sources successfully searched. This does not confirm complete originality.";

// Discovery query generation limits
const MAX_DISCOVERY_QUERIES = 6;
const MAX_QUERY_TERMS = 6;
const MIN_QUERY_TERM_LEN = 2;

// Verified paraphrase thresholds — semantic evidence must be supported by
// lexical, entity, or factual overlap so topic similarity alone is insufficient.
const PARA_SEM_COSINE_MIN = 0.82;
const PARA_RARE_OVERLAP_MIN = 0.40;
const PARA_ENTITY_OVERLAP_MIN = 0.55;
const PARA_LEX_JACCARD_MIN = 0.20;
const PARA_MIN_TOKENS = 6;
const PARA_MAX_WINDOW_TOKENS = 50;

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

export function normalise(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function tokenise(text: string): string[] {
  return normalise(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

interface TokenOffset {
  token: string;
  start: number;
  end: number;
}

/**
 * Tokenise while keeping each token's start/end character offsets in the
 * *normalised* text. Offsets are used to build precise matched spans.
 */
export function tokeniseWithOffsets(normText: string): TokenOffset[] {
  const offsets: TokenOffset[] = [];
  const re = /[a-z0-9]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(normText)) !== null) {
    const t = m[0];
    if (t.length > 1) offsets.push({ token: t, start: m.index, end: m.index + t.length });
  }
  return offsets;
}

export function tokenStrings(offsets: TokenOffset[]): string[] {
  return offsets.map((o) => o.token);
}

/** Fraction of tokens in a that appear in b in the same order. */
export function longestCommonSubsequenceRatio(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const min = Math.min(a.length, b.length);
  const prev = Array(min + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const cur = Array(min + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(cur[j - 1], prev[j]);
    }
    prev.splice(0, prev.length, ...cur);
  }
  return prev[min] / min;
}

const STOP = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with","by",
  "from","is","was","are","were","be","been","being","have","has","had","do",
  "does","did","will","would","could","should","may","might","that","this",
  "these","those","it","its","as","if","so","not","no","such","than","then",
  "when","where","while","both","either","neither","yet","nor",
]);

export function jaccardSim(a: string[], b: string[]): number {
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

export function splitSentences(text: string): Array<{ text: string; start: number }> {
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

export function uniqueCoverage(spans: Array<[number, number]>, total: number): number {
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
  matchType: "exact" | "near" | "paraphrase" | "candidate";
  spanSimilarity: number;
}

interface VerifiedSource {
  title: string; doi: string | null; url: string;
  publisher: string; provider: "crossref" | "openalex" | "unpaywall" | "web" | "exa";
  matchContribution: number; citedMaterial: boolean;
  matchedSpans: MatchedSpan[]; similarity: number;
  matchType: "Exact" | "Near Match" | "Verified Paraphrase" | "Candidate Similarity" | "Mixed";
  verified: boolean;
  /** Discovery metadata: how many independent queries recovered this source. */
  queryRecovery?: number;
  /** Optional discovery score for ranking only. */
  discoveryScore?: number;
}

interface PlagResult {
  status: PlagStatus;
  similarityScore: number; originalityScore: number;
  exactMatchScore: number; nearMatchScore: number; paraphraseMatchScore: number; semanticMatchScore: number;
  riskLevel: "None" | "Low" | "Medium" | "High" | "Critical";
  sources: VerifiedSource[];
  coverageNote: string;
  providerStatus: { crossref: ProvStatus; openalex: ProvStatus; unpaywall: ProvStatus; gemini: ProvStatus; webSearch: ProvStatus; exa: ProvStatus };
  errorMessage?: string;
  upgrade_required?: boolean; remaining?: number | null; limit?: number | null;
}

interface Candidate {
  title: string; doi: string | null; url: string;
  publisher: string; provider: "crossref" | "openalex" | "unpaywall" | "web" | "exa";
  abstract: string | null;
  /** Number of independent discovery queries that returned this candidate. */
  queryRecovery: number;
  /** Optional discovery score used only for ranking; never plagiarism scoring. */
  discoveryScore: number;
  /** Query strings that recovered this candidate. */
  recoveredQueries: string[];
}

// ─── Source Discovery ─────────────────────────────────────────────────────────

function contentWordRatio(tokens: string[]): number {
  if (!tokens.length) return 0;
  return tokens.filter((t) => !STOP.has(t)).length / tokens.length;
}

const COMMON_ACADEMIC = new Set([
  "abstract","introduction","method","methods","results","discussion","conclusion",
  "study","paper","article","research","analysis","data","model","models","system",
  "systems","approach","proposed","using","used","show","shows","shown","result",
  "based","new","novel","performance","accuracy","task","tasks","dataset","datasets",
  "training","test","validation","experiment","experiments","evaluation","proposed",
  "architecture","framework","algorithm","algorithms","network","networks","deep",
  "learning","machine","artificial","intelligence","language","natural","text","word",
  "words","sentence","sentences","document","documents","feature","features","input",
  "output","function","functions","parameter","parameters","layer","layers","state",
  "neural","attention","gpt","bert","llm","llms",
]);

function isRareToken(t: string, freq = new Map<string, number>()): boolean {
  if (t.length <= MIN_QUERY_TERM_LEN) return false;
  if (STOP.has(t)) return false;
  if (COMMON_ACADEMIC.has(t)) return false;
  // numbers, hyphenated technical terms, all-caps acronyms, capitalised proper nouns
  if (/^\d+(?:\.\d+)?$/.test(t)) return true;
  if (/^[a-z]+-[a-z]+$/.test(t)) return true;
  if (/^[A-Z]{2,}$/.test(t)) return true;
  if (/^[A-Z][a-z]+(?:-[A-Za-z]+)?$/.test(t) && !COMMON_ACADEMIC.has(t.toLowerCase())) return true;
  // short technical acronyms that appear in lowercase after normalisation (e.g., wmt, bleu, gpu)
  if (/^[a-z]{2,5}$/.test(t) && !COMMON_ACADEMIC.has(t)) return true;
  // infrequent content tokens (model names, proper nouns) are distinctive
  if (t.length > 3 && (freq.get(t) ?? 0) <= 2 && !COMMON_ACADEMIC.has(t)) return true;
  return false;
}

export function rareTokenSet(text: string): Set<string> {
  const toks = tokenise(text);
  const freq = new Map<string, number>();
  for (const t of toks) freq.set(t, (freq.get(t) ?? 0) + 1);
  const rare = toks.filter((t) => isRareToken(t, freq));
  // Also include capitalised proper nouns / model names from the original text
  const capRe = /\b[A-Z][a-z]+(?:-[A-Za-z]+)?\b/g;
  let m: RegExpExecArray | null;
  while ((m = capRe.exec(text)) !== null) {
    const w = normalise(m[0]);
    if (w.length > 2 && !COMMON_ACADEMIC.has(w)) rare.push(w);
  }
  return new Set(rare);
}

export function entityAndFactTokens(text: string): string[] {
  const found: string[] = [];
  // numbers with optional units (e.g., 28.4 BLEU, eight GPUs)
  const numRe = /\b\d+(?:\.\d+)?\b/g;
  let m: RegExpExecArray | null;
  while ((m = numRe.exec(text)) !== null) found.push(m[0]);
  // hyphenated technical terms: English-to-German, English-to-French
  const hyphenRe = /\b[a-z]+-[a-z]+(?:-[a-z]+)?\b/gi;
  while ((m = hyphenRe.exec(text)) !== null) found.push(m[0]);
  // all-caps acronyms (WMT, BLEU, GPUs)
  const acroRe = /\b[A-Z]{2,}\b/g;
  while ((m = acroRe.exec(text)) !== null) found.push(m[0]);
  // capitalised proper nouns / model names
  const capRe = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g;
  while ((m = capRe.exec(text)) !== null) {
    const w = m[0].toLowerCase();
    if (!COMMON_ACADEMIC.has(w)) found.push(m[0]);
  }
  return [...new Set(found.map((x) => normalise(x)))];
}

function extractDistinctivePhrases(text: string): string[] {
  const sentences = splitSentences(text);
  const scored: Array<{ phrase: string; contentRatio: number; rareCount: number }> = [];
  const allToks = tokenise(text);
  const freq = new Map<string, number>();
  for (const t of allToks) freq.set(t, (freq.get(t) ?? 0) + 1);
  for (const s of sentences.slice(0, 24)) {
    const toks = tokenise(s.text);
    if (toks.length < 8) continue;
    for (let start = 0; start <= Math.min(toks.length - 6, 8); start++) {
      const len = Math.min(6, toks.length - start);
      const phrase = toks.slice(start, start + len).join(" ");
      const ratio = contentWordRatio(toks.slice(start, start + len));
      const rareCount = toks.slice(start, start + len).filter((t) => isRareToken(t, freq)).length;
      if (ratio < 0.45) continue;
      if (rareCount < 2) continue;
      scored.push({ phrase, contentRatio: ratio, rareCount });
    }
  }
  scored.sort((a, b) => b.rareCount - a.rareCount || b.contentRatio - a.contentRatio);
  return scored.slice(0, 3).map((s) => s.phrase);
}

function extractEntityFactQueries(text: string): string[] {
  const facts = entityAndFactTokens(text);
  if (facts.length < 3) return [];
  const queries: string[] = [];
  // Build compact query combinations from discriminative tokens.
  const rare = [...rareTokenSet(text)].slice(0, 12);
  for (let i = 0; i < rare.length && queries.length < 3; i++) {
    for (let j = i + 1; j < rare.length && queries.length < 3; j++) {
      const q = [rare[i], rare[j]].filter((x) => x.length > 1).slice(0, MAX_QUERY_TERMS).join(" ");
      if (q.split(" ").length >= 2) queries.push(q);
    }
  }
  // Add explicit rare-token-only queries (best for retrieving specific papers).
  const top = rare.slice(0, Math.min(4, rare.length));
  if (top.length >= 2) queries.push(top.join(" "));
  return [...new Set(queries)].slice(0, 3);
}

function extractRareTokenQueries(text: string): string[] {
  const rare = [...rareTokenSet(text)].slice(0, 10);
  if (rare.length < 4) return [];
  return [
    rare.slice(0, Math.min(4, rare.length)).join(" "),
    rare.slice(0, Math.min(6, rare.length)).join(" "),
  ].filter((q) => q.split(" ").length >= 2);
}

export function buildDiscoveryQueries(text: string): string[] {
  const phrases = extractDistinctivePhrases(text);
  const entity = extractEntityFactQueries(text);
  const rare = extractRareTokenQueries(text);
  const all = [...phrases, ...entity, ...rare];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of all) {
    const key = q.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
    if (out.length >= MAX_DISCOVERY_QUERIES) break;
  }
  return out;
}

export function extractPhrases(text: string): string[] {
  const sentences = splitSentences(text);
  const scored: Array<{ phrase: string; contentRatio: number }> = [];
  for (const s of sentences.slice(0, 20)) {
    const toks = tokenise(s.text);
    if (toks.length < 10) continue;
    const phrase = toks.slice(0, 14).join(" ");
    const ratio = contentWordRatio(toks.slice(0, 14));
    // Skip phrases that are mostly stopwords/generic
    if (ratio < 0.35) continue;
    scored.push({ phrase, contentRatio: ratio });
  }
  scored.sort((a, b) => b.contentRatio - a.contentRatio);
  return scored.slice(0, 4).map((s) => s.phrase);
}

async function discoverCrossref(text: string, sig: AbortSignal): Promise<Candidate[]> {
  const queries = buildDiscoveryQueries(text);
  const results = new Map<string, Candidate>();
  const seen = new Set<string>();
  for (const phrase of queries) {
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
        const title = (item.title as string[])?.[0] ?? doi ?? resolvedUrl;
        const existing = results.get(key);
        if (existing) {
          existing.queryRecovery += 1;
          existing.recoveredQueries.push(phrase);
          continue;
        }
        results.set(key, {
          title,
          doi: doi ?? null,
          url: resolvedUrl,
          publisher: (item.publisher as string) ?? "Crossref",
          provider: "crossref",
          abstract: (item.abstract as string | null) ?? null,
          queryRecovery: 1,
          discoveryScore: 0,
          recoveredQueries: [phrase],
        });
        if (results.size >= MAX_CANDIDATES) break;
      }
    } catch { /* continue */ }
    if (results.size >= MAX_CANDIDATES) break;
  }
  return Array.from(results.values());
}

async function discoverOpenAlex(text: string, sig: AbortSignal): Promise<Candidate[]> {
  const queries = buildDiscoveryQueries(text);
  const results = new Map<string, Candidate>();
  const seen = new Set<string>();
  for (const phrase of queries) {
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
        const title = (item.title as string) ?? resolvedUrl;
        const existing = results.get(key);
        if (existing) {
          existing.queryRecovery += 1;
          existing.recoveredQueries.push(phrase);
          continue;
        }
        results.set(key, {
          title,
          doi,
          url: resolvedUrl,
          publisher: ((loc?.source as Record<string, unknown> | null)?.display_name as string) ?? "OpenAlex",
          provider: "openalex",
          abstract,
          queryRecovery: 1,
          discoveryScore: 0,
          recoveredQueries: [phrase],
        });
        if (results.size >= MAX_CANDIDATES) break;
      }
    } catch { /* continue */ }
    if (results.size >= MAX_CANDIDATES) break;
  }
  return Array.from(results.values());
}

// ─── Exa web discovery ───────────────────────────────────────────────────────
export async function discoverExa(text: string, sig: AbortSignal): Promise<Candidate[]> {
  const apiKey = Deno.env.get("EXA_API_KEY") ?? "";
  if (!apiKey) throw new Error("Exa API key not configured");

  const exa = new Exa(apiKey);
  const queries = buildDiscoveryQueries(text);
  const results = new Map<string, Candidate>();
  const seen = new Set<string>();

  for (const phrase of queries) {
    try {
      const searchPromise = exa.search(phrase, {
        type: "auto",
        numResults: 6,
        // Exa docs canonical category is "publication" for scholarly papers;
        // the exa-js@2.14.0 type declarations still say "research paper".
        category: "publication" as any,
        contents: { highlights: { query: phrase } },
      });
      const res = await (sig.aborted
        ? Promise.reject(new Error("aborted"))
        : Promise.race([
          searchPromise,
          new Promise<never>((_, reject) => {
            sig.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
          }),
        ]));

      for (const item of (res.results ?? []) as Record<string, unknown>[]) {
        const link = (item.url as string | undefined) ?? "";
        if (!link || !isSafeUrl(link) || seen.has(link)) continue;
        seen.add(link);
        const title = (item.title as string) ?? link;
        const highlight = (item.highlights as string[] | undefined)?.[0] ?? null;
        const author = (item.author as string | null) ?? null;
        const publisher = author ? `${author}` : (new URL(link).hostname);

        const existing = results.get(link);
        if (existing) {
          existing.queryRecovery += 1;
          existing.recoveredQueries.push(phrase);
          continue;
        }
        results.set(link, {
          title,
          doi: null,
          url: link,
          publisher,
          provider: "exa",
          abstract: highlight,
          queryRecovery: 1,
          discoveryScore: 0,
          recoveredQueries: [phrase],
        });
        if (results.size >= MAX_EXA_CANDIDATES) break;
      }
    } catch { /* continue to next query */ }
    if (results.size >= MAX_EXA_CANDIDATES) break;
  }
  return Array.from(results.values());
}

function candidateDiscoveryScore(cand: Candidate, submitted: string): number {
  // Score is used ONLY for ranking which candidates to investigate; it never
  // contributes to plagiarism percentage.
  const rare = rareTokenSet(submitted);
  const titleToks = new Set(tokenise(cand.title));
  const abstractToks = cand.abstract ? new Set(tokenise(cand.abstract)) : new Set<string>();
  let overlap = 0;
  for (const t of rare) {
    if (titleToks.has(t) || abstractToks.has(t)) overlap += 1;
  }
  const rareOverlap = rare.size ? overlap / rare.size : 0;
  const entityOverlap = cand.recoveredQueries.some((q) => entityAndFactTokens(q).length > 0) ? 0.15 : 0;
  return Math.min(1, cand.queryRecovery * 0.12 + rareOverlap * 0.6 + entityOverlap + (cand.abstract ? 0.05 : 0));
}

function rankCandidates(candidates: Candidate[], submitted: string): Candidate[] {
  return candidates
    .map((c) => ({ ...c, discoveryScore: candidateDiscoveryScore(c, submitted) }))
    .sort((a, b) => b.discoveryScore - a.discoveryScore || b.queryRecovery - a.queryRecovery);
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

  const queries = buildDiscoveryQueries(text);
  const results = new Map<string, Candidate>();
  const seen = new Set<string>();

  for (const phrase of queries) {
    const url =
      `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}` +
      `&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(phrase)}&num=5`;
    const resp = await fetch(url, { signal: sig });
    if (!resp.ok) throw new Error(`Google search HTTP ${resp.status}`);
    const data = await resp.json();
    for (const item of (data?.items ?? []) as Record<string, unknown>[]) {
      const link = (item.link as string | undefined) ?? "";
      if (!link || !isSafeUrl(link) || seen.has(link)) continue;
      seen.add(link);
      const title = (item.title as string) ?? link;
      const existing = results.get(link);
      if (existing) {
        existing.queryRecovery += 1;
        existing.recoveredQueries.push(phrase);
        continue;
      }
      results.set(link, {
        title,
        doi: null,
        url: link,
        publisher: (item.displayLink as string) ?? new URL(link).hostname,
        provider:  "web",
        abstract:  (item.snippet as string | null) ?? null,
        queryRecovery: 1,
        discoveryScore: 0,
        recoveredQueries: [phrase],
      });
      if (results.size >= MAX_WEB_CANDIDATES) break;
    }
    if (results.size >= MAX_WEB_CANDIDATES) break;
  }
  return Array.from(results.values());
}

// ─── Exa content retrieval (fallback/supplement for known URLs) ──────────────
async function fetchExaContents(url: string, sig: AbortSignal): Promise<string | null> {
  const apiKey = Deno.env.get("EXA_API_KEY") ?? "";
  if (!apiKey) return null;
  try {
    const exa = new Exa(apiKey);
    const promise = exa.getContents([url], {
      text: { maxCharacters: 15000 },
      maxAgeHours: 24,
    });
    const res = await (sig.aborted
      ? Promise.reject(new Error("aborted"))
      : Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          sig.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
        }),
      ]));
    const item = (res.results ?? [])[0] as Record<string, unknown> | undefined;
    const text = (item?.text as string | undefined) ?? "";
    return text.length > 100 ? text : null;
  } catch { return null; }
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

interface MatchResult { spans: MatchedSpan[]; ranges: Array<[number, number]>; }

export function buildNgramMap(tokens: string[], n: number): Map<string, number[]> {
  const map = new Map<string, number[]>();
  for (let i = 0; i <= tokens.length - n; i++) {
    const gram = tokens.slice(i, i + n).join(" ");
    if (!map.has(gram)) map.set(gram, []);
    map.get(gram)!.push(i);
  }
  return map;
}

/**
 * Exact match requires a maximal run of at least EXACT_MIN_RUN_TOKENS identical
 * tokens in the same order. Shared n-grams are used only as seeds; the run is
 * extended token-by-token. Character offsets are derived from the normalised
 * submitted text, so highlighted spans align with submitted text.
 */
export function runExact(submitted: string, sourceText: string): MatchResult {
  const normSub = normalise(submitted);
  const subOff = tokeniseWithOffsets(normSub);
  const srcToks = tokenise(sourceText);
  if (subOff.length < EXACT_MIN_RUN_TOKENS || srcToks.length < EXACT_MIN_RUN_TOKENS) {
    return { spans: [], ranges: [] };
  }

  const subToks = tokenStrings(subOff);
  const subGrams = buildNgramMap(subToks, EXACT_NGRAM_SIZE);
  const srcGrams = buildNgramMap(srcToks, EXACT_NGRAM_SIZE);

  const usedSub = new Set<number>();
  const spans: MatchedSpan[] = [];
  const ranges: Array<[number, number]> = [];

  for (const [gram, srcPositions] of srcGrams) {
    const subPositions = subGrams.get(gram);
    if (!subPositions) continue;
    for (const tPos of srcPositions) {
      // Find an unused sub position that matches the seed
      let sPos = -1;
      for (const candidate of subPositions) {
        if (!usedSub.has(candidate)) { sPos = candidate; break; }
      }
      if (sPos < 0) continue;

      // Extend run both forwards and backwards
      let runStart = sPos;
      while (
        runStart > 0 &&
        tPos - (sPos - runStart) > 0 &&
        subToks[runStart - 1] === srcToks[tPos - (sPos - runStart)]
      ) runStart--;
      let runEnd = sPos + EXACT_NGRAM_SIZE;
      let tEnd = tPos + EXACT_NGRAM_SIZE;
      while (
        runEnd < subToks.length &&
        tEnd < srcToks.length &&
        subToks[runEnd] === srcToks[tEnd]
      ) { runEnd++; tEnd++; }

      if (runEnd - runStart < EXACT_MIN_RUN_TOKENS) continue;
      if (usedSub.has(runStart)) continue;

      for (let i = runStart; i < runEnd; i++) usedSub.add(i);
      const startChar = subOff[runStart].start;
      const endChar = subOff[runEnd - 1].end;
      const subPass = subToks.slice(runStart, runEnd).join(" ");
      const srcPass = srcToks.slice(tPos - (sPos - runStart), tEnd).join(" ");
      ranges.push([startChar, endChar]);
      spans.push({
        submittedStart: startChar,
        submittedEnd: endChar,
        submittedPassage: subPass,
        sourcePassage: srcPass,
        matchType: "exact",
        spanSimilarity: 1.0,
      });
    }
  }
  return { spans, ranges };
}

// ─── Near-Match Engine ────────────────────────────────────────────────────────

/**
 * Near match requires a submitted sentence to share a high proportion of tokens
 * AND a long common subsequence with a contiguous source window. This prevents
 * topic-level similarity from being classified as near/plagiarism.
 */
export function runNear(submitted: string, sourceText: string): MatchResult {
  const subSents = splitSentences(submitted);
  const srcToks = tokenise(sourceText);
  if (srcToks.length < NEAR_MIN_TOKENS) return { spans: [], ranges: [] };

  const spans: MatchedSpan[] = [];
  const ranges: Array<[number, number]> = [];

  for (const ss of subSents) {
    const sToks = tokenise(ss.text);
    if (sToks.length < NEAR_MIN_TOKENS) continue;

    let best = 0, bestSrc = "";
    // Slide a source token window across the source text
    for (let start = 0; start < srcToks.length; start += Math.max(1, Math.floor(NEAR_MAX_WINDOW_TOKENS / 2))) {
      const end = Math.min(start + NEAR_MAX_WINDOW_TOKENS, srcToks.length);
      const window = srcToks.slice(start, end);
      if (window.length < NEAR_MIN_TOKENS) continue;
      const jac = jaccardSim(sToks, window);
      if (jac < NEAR_JACCARD_MIN) continue;
      const lcs = longestCommonSubsequenceRatio(sToks, window);
      if (lcs < NEAR_LCS_MIN) continue;
      const combined = (jac + lcs) / 2;
      if (combined > best) {
        best = combined;
        bestSrc = window.join(" ");
      }
    }
    if (best >= NEAR_JACCARD_MIN && bestSrc) {
      const cs = ss.start, ce = ss.start + ss.text.length;
      ranges.push([cs, ce]);
      spans.push({
        submittedStart: cs,
        submittedEnd: ce,
        submittedPassage: ss.text,
        sourcePassage: bestSrc,
        matchType: "near",
        spanSimilarity: Math.round(best * 100) / 100,
      });
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

/**
 * Semantic/paraphrase layer. Returns two classes of span:
 *  - Verified Paraphrase: high semantic similarity AND additional lexical,
 *    entity, or factual evidence (e.g., rare token overlap).
 *  - Candidate Similarity: high semantic similarity but insufficient additional
 *    evidence. Does NOT count toward plagiarism percentage.
 *
 * Embeddings are only computed for candidate pairs that already share some
 * lexical/entity signal, keeping API calls focused and bounded.
 */
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

  const pairs: Array<{ ss: typeof subSents[0]; ts: typeof srcSents[0]; lexJaccard: number; rareOverlap: number; entityOverlap: number }> = [];
  for (const ss of uncovered.slice(0, 10)) {
    const sToks = tokenise(ss.text);
    if (sToks.length < SEM_MIN_TOKENS) continue;
    const rareSub = rareTokenSet(ss.text);
    const entitySub = new Set(entityAndFactTokens(ss.text));
    for (const ts of srcSents.slice(0, 30)) {
      const tToks = tokenise(ts.text);
      if (tToks.length < SEM_MIN_TOKENS) continue;
      const lexJaccard = jaccardSim(sToks, tToks);
      const rareSrc = rareTokenSet(ts.text);
      const entitySrc = new Set(entityAndFactTokens(ts.text));
      const rareOverlap = rareSub.size ? [...rareSub].filter((t) => rareSrc.has(t)).length / rareSub.size : 0;
      const entityOverlap = entitySub.size ? [...entitySub].filter((t) => entitySrc.has(t)).length / entitySub.size : 0;
      // Accept pairs with some evidence, or very low lexical overlap for pure candidate similarity
      if (lexJaccard > SEM_JACCARD_MAX) {
        if (rareOverlap < 0.08 && entityOverlap < 0.08) continue;
      } else if (lexJaccard <= 0.03) {
        continue;
      }
      pairs.push({ ss, ts, lexJaccard, rareOverlap, entityOverlap });
      if (pairs.length >= 6) break;
    }
    if (pairs.length >= 6) break;
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
  for (const { ss, ts, lexJaccard, rareOverlap, entityOverlap } of pairs) {
    const va = cache.get(ss.text), vb = cache.get(ts.text);
    if (!va || !vb) continue;
    const cos = cosineSim(va, vb);

    const hasEvidence = rareOverlap >= PARA_RARE_OVERLAP_MIN || entityOverlap >= PARA_ENTITY_OVERLAP_MIN || lexJaccard >= PARA_LEX_JACCARD_MIN;
    if (cos >= PARA_SEM_COSINE_MIN && hasEvidence) {
      // Verified Paraphrase: strong semantic + additional lexical/entity/factual evidence
      ranges.push([ss.start, ss.start + ss.text.length]);
      spans.push({
        submittedStart: ss.start,
        submittedEnd: ss.start + ss.text.length,
        submittedPassage: ss.text,
        sourcePassage: ts.text,
        matchType: "paraphrase",
        spanSimilarity: Math.round(cos * 100) / 100,
      });
    } else if (cos >= SEM_COSINE_MIN && lexJaccard < SEM_JACCARD_MAX) {
      // Candidate Similarity: semantic-only signal, not counted as verified plagiarism
      ranges.push([ss.start, ss.start + ss.text.length]);
      spans.push({
        submittedStart: ss.start,
        submittedEnd: ss.start + ss.text.length,
        submittedPassage: ss.text,
        sourcePassage: ts.text,
        matchType: "candidate",
        spanSimilarity: Math.round(cos * 100) / 100,
      });
    }
  }
  return { spans, ranges, used: true };
}

// ─── Scoring helpers ──────────────────────────────────────────────────────────

function riskLevel(sim: number): PlagResult["riskLevel"] {
  if (sim === 0) return "None";
  if (sim < 5) return "Low";
  if (sim < 15) return "Medium";
  if (sim < 35) return "High";
  return "Critical";
}

function dominantType(spans: MatchedSpan[]): VerifiedSource["matchType"] {
  if (!spans.length) return "Exact";
  const c = { exact: 0, near: 0, paraphrase: 0, candidate: 0 };
  for (const s of spans) c[s.matchType]++;
  const hasVerified = c.exact > 0 || c.near > 0 || c.paraphrase > 0;
  const max = Math.max(c.exact, c.near, c.paraphrase, c.candidate);
  if (c.exact === max) return (c.near || c.paraphrase || c.candidate) && hasVerified ? "Mixed" : "Exact";
  if (c.near === max) return (c.exact || c.paraphrase || c.candidate) && hasVerified ? "Mixed" : "Near Match";
  if (c.paraphrase === max) return (c.exact || c.near || c.candidate) && hasVerified ? "Mixed" : "Verified Paraphrase";
  if (!hasVerified) return "Candidate Similarity";
  return "Mixed";
}

// ─── Main analysis pipeline ───────────────────────────────────────────────────

async function runAnalysis(rawText: string, apiKey: string): Promise<PlagResult> {
  const ps: PlagResult["providerStatus"] = {
    crossref: "skipped", openalex: "skipped", unpaywall: "skipped",
    gemini: "skipped", webSearch: "skipped", exa: "skipped",
  };

  const { body: eligibleText, hasCitations } = prepareText(rawText);
  const eligibleChars = eligibleText.length;

  if (tokenise(eligibleText).length < MIN_TEXT_WORDS) {
    return { status: "insufficient_text", similarityScore: 0, originalityScore: 100, exactMatchScore: 0, nearMatchScore: 0, paraphraseMatchScore: 0, semanticMatchScore: 0, riskLevel: "None", sources: [], coverageNote: COVERAGE_NOTE, providerStatus: ps, errorMessage: `Minimum ${MIN_TEXT_WORDS} words required.` };
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

  const exaEnabled = (Deno.env.get("EXA_API_KEY") ?? "").length > 0;

  const discCtrl = new AbortController();
  const discTimer = setTimeout(() => discCtrl.abort(), PROVIDER_TO_MS);
  const [crRes, oaRes, exaRes] = await Promise.allSettled([
    discoverCrossref(eligibleText, discCtrl.signal),
    discoverOpenAlex(eligibleText, discCtrl.signal),
    exaEnabled ? discoverExa(eligibleText, discCtrl.signal) : Promise.resolve([]),
  ]);
  clearTimeout(discTimer);

  const crCands = crRes.status === "fulfilled" ? crRes.value : [];
  const oaCands = oaRes.status === "fulfilled" ? oaRes.value : [];
  const exaCands = exaRes.status === "fulfilled" ? exaRes.value : [];
  let webCands: Candidate[] = [];

  ps.crossref = crRes.status === "fulfilled" ? (crCands.length ? "ok" : "skipped") : "failed";
  ps.openalex = oaRes.status === "fulfilled" ? (oaCands.length ? "ok" : "skipped") : "failed";
  ps.exa = exaRes.status === "fulfilled" ? (exaCands.length ? "ok" : "skipped") : "failed";
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
  for (const c of [...crCands, ...oaCands, ...exaCands, ...webCands]) {
    const key = c.doi ?? c.url;
    if (c.doi && seenDoi.has(c.doi)) continue;
    if (seenUrl.has(c.url)) continue;
    if (c.doi) seenDoi.add(c.doi);
    seenUrl.add(c.url);
    deduped.push(c);
    if (deduped.length >= MAX_CANDIDATES + MAX_WEB_CANDIDATES) break;
  }

  if (!deduped.length) {
    const allAcademicFailed = ps.crossref === "failed" && ps.openalex === "failed" && ps.exa === "failed";
    const anyFailed = ps.crossref === "failed" || ps.openalex === "failed" || ps.exa === "failed" || ps.webSearch === "failed";
    return {
      status: allAcademicFailed ? "provider_unavailable" : (anyFailed ? "partial" : "no_verified_matches"),
      similarityScore: 0, originalityScore: 100, exactMatchScore: 0, nearMatchScore: 0, paraphraseMatchScore: 0, semanticMatchScore: 0,
      riskLevel: "None", sources: [], coverageNote: COVERAGE_NOTE, providerStatus: ps,
      ...(allAcademicFailed ? { errorMessage: "Source discovery providers could not be reached." } :
          anyFailed ? { errorMessage: "Some source providers could not be reached." } : {}),
    };
  }

  // Rank candidates by discovery-only score before spending retrieval budget.
  const ranked = rankCandidates(deduped, eligibleText);

  // Unpaywall enrichment (academic candidates only)
  const upCtrl = new AbortController();
  const upTimer = setTimeout(() => upCtrl.abort(), 5_000);
  const enriched = await Promise.all(
    ranked.map((c) => c.provider !== "web" ? enrichUnpaywall(c, upCtrl.signal) : Promise.resolve(c))
  );
  clearTimeout(upTimer);
  ps.unpaywall = enriched.some((c) => c.provider === "unpaywall") ? "ok" : "skipped";

  // Matching
  const sources: VerifiedSource[] = [];
  const allExact: Array<[number,number]> = [];
  const allNear:  Array<[number,number]> = [];
  const allParaphrase: Array<[number,number]> = [];
  const allSem:   Array<[number,number]> = [];
  let geminiUsed = false;

  for (const cand of enriched) {
    let retrievalStatus: "ok" | "failed" = "failed";
    let srcText: string | null = null;

    // Prefer direct full text retrieval; fall back to Exa /contents for known URLs.
    if (cand.url && isSafeUrl(cand.url)) {
      srcText = await fetchSourceText(cand.url);
      if (srcText && normalise(srcText).length >= 100) retrievalStatus = "ok";
      if (retrievalStatus === "failed") {
        const fetchCtrl = new AbortController();
        const fetchTimer = setTimeout(() => fetchCtrl.abort(), FETCH_TO_MS);
        srcText = await fetchExaContents(cand.url, fetchCtrl.signal);
        clearTimeout(fetchTimer);
        if (srcText && normalise(srcText).length >= 100) retrievalStatus = "ok";
      }
    }
    if (retrievalStatus === "failed" && cand.abstract && cand.abstract.length > 150) {
      srcText = cand.abstract;
      retrievalStatus = "ok";
    }

    if (!srcText || normalise(srcText).length < 100) {
      // Source could not be verified; do not let it contribute to scoring.
      continue;
    }

    const srcSlice = srcText.slice(0, 30_000);
    const exact = runExact(eligibleText, srcSlice);
    const near  = runNear(eligibleText, srcSlice);

    const semCtrl = new AbortController();
    const semTimer = setTimeout(() => semCtrl.abort(), FETCH_TO_MS);
    const sem = await runSemantic(eligibleText, srcSlice, apiKey, [...exact.ranges, ...near.ranges], semCtrl.signal);
    clearTimeout(semTimer);
    if (sem.used) geminiUsed = true;

    const verifiedSpans = [...exact.spans, ...near.spans, ...sem.spans.filter((s) => s.matchType === "paraphrase")];
    const verifiedRanges = [...exact.ranges, ...near.ranges, ...sem.spans.filter((s) => s.matchType === "paraphrase").map((s) => [s.submittedStart, s.submittedEnd] as [number, number])];
    const candidateSpans = sem.spans.filter((s) => s.matchType === "candidate");
    const allSpans = [...verifiedSpans, ...candidateSpans];
    if (!allSpans.length) continue;

    const verifiedCoverage = uniqueCoverage(verifiedRanges, eligibleChars);
    const sourceCov = Math.round((verifiedCoverage / eligibleChars) * 100);
    if (!sourceCov && !candidateSpans.length) continue;

    sources.push({
      title: cand.title, doi: cand.doi, url: cand.url, publisher: cand.publisher, provider: cand.provider,
      matchContribution: sourceCov, citedMaterial: hasCitations, matchedSpans: allSpans,
      similarity: Math.round(Math.max(...allSpans.map((s) => s.spanSimilarity)) * 100),
      matchType: dominantType(allSpans),
      verified: retrievalStatus === "ok" && verifiedSpans.length > 0,
      queryRecovery: cand.queryRecovery,
      discoveryScore: cand.discoveryScore,
    });
    allExact.push(...exact.ranges);
    allNear.push(...near.ranges);
    allParaphrase.push(...sem.spans.filter((s) => s.matchType === "paraphrase").map((s) => [s.submittedStart, s.submittedEnd] as [number, number]));
    allSem.push(...sem.spans.filter((s) => s.matchType === "candidate").map((s) => [s.submittedStart, s.submittedEnd] as [number, number]));
  }

  ps.gemini = geminiUsed ? "ok" : "skipped";

  // Overall scores are computed from verified exact/near/paraphrase spans ONLY.
  const verifiedRanges = [...allExact, ...allNear, ...allParaphrase];
  const simScore  = Math.round((uniqueCoverage(verifiedRanges, eligibleChars) / eligibleChars) * 100);
  const exactScore = Math.round((uniqueCoverage(allExact, eligibleChars) / eligibleChars) * 100);
  const nearScore  = Math.round((uniqueCoverage(allNear,  eligibleChars) / eligibleChars) * 100);
  const paraphraseScore = Math.round((uniqueCoverage(allParaphrase, eligibleChars) / eligibleChars) * 100);
  const semScore   = Math.round((uniqueCoverage(allSem,   eligibleChars) / eligibleChars) * 100);

  const anyFailed = ps.crossref === "failed" || ps.openalex === "failed" || ps.exa === "failed" || ps.webSearch === "failed";

  if (!sources.length) {
    return {
      status: anyFailed ? "partial" : "no_verified_matches",
      similarityScore: simScore, originalityScore: 100 - simScore,
      exactMatchScore: exactScore, nearMatchScore: nearScore, paraphraseMatchScore: paraphraseScore, semanticMatchScore: semScore,
      riskLevel: riskLevel(simScore), sources: [], coverageNote: COVERAGE_NOTE, providerStatus: ps,
      ...(anyFailed ? { errorMessage: "Some source providers could not be reached." } : {}),
    };
  }

  return {
    status: anyFailed ? "partial" : "completed",
    similarityScore: simScore, originalityScore: 100 - simScore,
    exactMatchScore: exactScore, nearMatchScore: nearScore, paraphraseMatchScore: paraphraseScore, semanticMatchScore: semScore,
    riskLevel: riskLevel(simScore),
    sources: sources.sort((a, b) => b.matchContribution - a.matchContribution),
    coverageNote: COVERAGE_NOTE, providerStatus: ps,
  };
}

// ─── HTTP Handler ─────────────────────────────────────────────────────────────

if (import.meta.main) {
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
}
