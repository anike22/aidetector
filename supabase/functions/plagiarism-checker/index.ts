/**
 * plagiarism-checker Edge Function — self-contained bundle
 *
 * Architecture:
 *   1. Auth & Billing: Atomic server-side entitlement & trial guard (self-contained).
 *   2. Source Discovery: Multi-Zone Document Sampling (5 zones) + Distinctiveness Scoring
 *      + 5-tier Query Fallback Ladder + Parallel Registries (Crossref + OpenAlex + Exa/Web).
 *   3. Source Retrieval: Direct HTML body extraction + Pure Deno PDF parser +
 *      Reconstructed Inverted Abstracts & Exa Highlights (never discard candidate text).
 *   4. Calibrated Multi-Tier Match Engine:
 *      - Exact Match: 6+ identical token run with n-gram seeding & token-level offset alignment.
 *      - Near Match: Jaccard >= 0.48 or (Jaccard >= 0.40 & LCS >= 0.35) sliding window.
 *      - Verified Paraphrase: Gemini semantic embedding + lexical/entity/factual evidence.
 *      - Candidate Similarity: Semantic similarity without lexical anchor (informative only).
 *   5. Scoring: Non-overlapping unique character coverage calculation over eligible text.
 *   6. Transparency: 16-point diagnostic telemetry + honest provider execution metrics.
 */

import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.1";
import Exa from "https://esm.sh/exa-js@2.14.0";

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_TEXT_CHARS      = 25_000;
const MIN_TEXT_WORDS      = 25;
const MAX_CANDIDATES      = 12;  // per academic provider
const MAX_WEB_CANDIDATES  = 8;   // from Google Custom Search
const MAX_EXA_CANDIDATES  = 10;  // from Exa search
const PROVIDER_TO_MS      = 12_000;
const FETCH_TO_MS         = 6_000;
const PDF_CHAR_LIMIT      = 50_000;

// Evidence-first matching thresholds (calibrated for high sensitivity & zero hallucination)
const EXACT_MIN_RUN_TOKENS = 5;    // min identical token run to be considered exact (5, 8, 10, 12 windows)
const EXACT_NGRAM_SIZE     = 5;    // n-gram size for exact-match seeding
const NEAR_JACCARD_MIN     = 0.48; // calibrated to capture realistic student rewrites & synonym swaps
const NEAR_LCS_MIN         = 0.35; // at least 35% of tokens must be in same order
const NEAR_MIN_TOKENS      = 5;
const NEAR_MAX_WINDOW_TOKENS = 45; // source window size for near matching
const SEM_JACCARD_MAX      = 0.35; // evaluate Gemini semantic layer if lexical overlap below this
const SEM_COSINE_MIN       = 0.84; // high bar for candidate paraphrase detection
const SEM_MIN_TOKENS       = 6;

const COVERAGE_NOTE =
  "This scan queried Crossref, OpenAlex, Unpaywall, and available web registries using multi-zone query fallback ladders. " +
  "Verified matches represent confirmed text overlap against successfully retrieved source bodies and abstracts.";

// Paraphrase thresholds — semantic evidence supported by lexical, entity, or factual overlap
const PARA_SEM_COSINE_MIN = 0.80;
const PARA_RARE_OVERLAP_MIN = 0.30;
const PARA_ENTITY_OVERLAP_MIN = 0.40;
const PARA_LEX_JACCARD_MIN = 0.18;

const GATEWAY =
  "https://app-c18l1vf2nz7l-api-VaOwP8E7dJqa.gateway.appmedo.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-timezone, x-guest-id, x-visitor-id, x-idempotency-key",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ─── Self-Contained Billing & Entitlement Guard ───────────────────────────────

function createServiceClient() {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getTimezone(req: Request): string {
  return req.headers.get('x-timezone') || 'UTC';
}

function getClientIp(req: Request): string {
  const xForwardedFor = req.headers.get('x-forwarded-for');
  const xRealIp = req.headers.get('x-real-ip');
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  if (xRealIp) return xRealIp.trim();
  return 'unknown';
}

async function resolveAuthUserOrGuest(
  supabase: ReturnType<typeof createServiceClient>,
  req: Request
): Promise<{ user: { id: string } | null; guestId: string | null; isApiKey: boolean }> {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const guestHeader = req.headers.get('x-guest-id') || req.headers.get('x-visitor-id') || '';

  if (token.startsWith('aid_')) {
    const { data: keyData } = await supabase
      .from('api_keys')
      .select('user_id, owner_user_id, is_active, revoked_at')
      .eq('api_key', token)
      .maybeSingle();

    const keyOwnerId = keyData?.owner_user_id || keyData?.user_id;
    if (keyOwnerId && keyData?.is_active === true && !keyData?.revoked_at) {
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('api_key', token);
      return { user: { id: keyOwnerId }, guestId: null, isApiKey: true };
    }
  }

  if (token.startsWith('aid_')) throw new Error('Invalid or revoked API key');

  if (token && token.startsWith('eyJ')) {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user?.id) {
      return { user: { id: user.id }, guestId: null, isApiKey: false };
    }
  }

  let validGuestId = guestHeader ? guestHeader.trim() : null;
  const ip = getClientIp(req);
  const ua = req.headers.get('user-agent') || 'unknown';

  if (validGuestId) {
    const { data: issued, error } = await supabase.rpc('issue_or_validate_guest_session', {
      p_guest_id: validGuestId,
      p_ip: ip,
      p_user_agent: ua,
      p_timezone: getTimezone(req),
    });
    if (error) throw new Error('Guest identity verification failed');
    const row = (issued || [])[0];
    if (!row?.guest_id) throw new Error('Guest identity unavailable');
    return { user: null, guestId: row?.guest_id || validGuestId, isApiKey: false };
  }

  const { data, error } = await supabase.rpc('issue_or_validate_guest_session', {
    p_guest_id: null,
    p_ip: ip,
    p_user_agent: ua,
    p_timezone: getTimezone(req),
  });
  const row = (data || [])[0];
  if (error || !row?.guest_id || row.is_blocked) throw new Error('Guest session unavailable');
  return { user: null, guestId: row.guest_id, isApiKey: false };
}

async function reserveEntitlement(
  supabase: ReturnType<typeof createServiceClient>,
  params: {
    userId?: string | null;
    guestId?: string | null;
    featureSlug: string;
    creditsCost?: number;
    timezone?: string;
    idempotencyKey?: string | null;
    metadata?: Record<string, unknown>;
    unitQuantity?: number | null;
  }
) {
  const { data, error } = await supabase.rpc('reserve_entitlement_and_credits', {
    p_user_id: params.userId || null,
    p_guest_id: params.guestId || null,
    p_feature_slug: params.featureSlug,
    p_credits_cost: params.creditsCost || 1,
    p_timezone: params.timezone || 'UTC',
    p_idempotency_key: params.idempotencyKey || null,
    p_metadata: params.metadata || {},
    p_unit_quantity: params.unitQuantity ?? null,
  });

  if (error) {
    console.error('reserve_entitlement_and_credits RPC error:', error);
    throw new Error(`Entitlement reservation failed: ${error.message}`);
  }

  const row = (data || [])[0];
  if (!row || (row.allowed === true && !row.reservation_id)) throw new Error('Invalid billing authorization response');
  return {
    allowed: row.allowed === true,
    reservationId: (row.reservation_id as string) ?? null,
    reason: (row.reason as string) ?? null,
    errorCode: (row.error_code as string) ?? null,
    plan: (row.plan as string) ?? 'guest',
    remainingCredits: Number(row.credits_balance ?? 0),
    dailyRemaining: row.daily_remaining == null ? null : Number(row.daily_remaining),
    dailyLimit: row.daily_limit == null ? null : Number(row.daily_limit),
    trialChecksRemaining: Number(row.trial_checks_remaining ?? 0),
    trialChecksTotal: Number(row.trial_checks_total ?? 1),
    resetAt: (row.reset_at as string) ?? null,
    isTrialCheck: row.is_trial_check === true,
  };
}

async function finalizeReservation(
  supabase: ReturnType<typeof createServiceClient>,
  params: {
    reservationId: string;
    outcome: 'success' | 'failed';
    metadata?: Record<string, unknown>;
    errorReason?: string | null;
    timezone?: string;
  }
) {
  const { data, error } = await supabase.rpc('finalize_credit_reservation', {
    p_reservation_id: params.reservationId,
    p_outcome: params.outcome,
    p_metadata: params.metadata || {},
    p_error_reason: params.errorReason || null,
    p_timezone: params.timezone || 'UTC',
  });

  if (error) {
    console.error('finalize_credit_reservation RPC error:', error);
    return { finalized: false, status: 'error', creditsRefunded: 0, newBalance: 0 };
  }

  const row = typeof data === 'boolean' ? { finalized: data, status: data ? 'settled' : 'already_settled' } : (data || [])[0] || {};
  return {
    finalized: row.finalized === true,
    status: (row.status as string) ?? 'unknown',
    creditsRefunded: Number(row.credits_refunded ?? 0),
    newBalance: Number(row.new_balance ?? 0),
  };
}

// ─── Text utilities ───────────────────────────────────────────────────────────

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
    .replace(/[\u2018\u2019\u0060\u00B4]/g, "'")
    .replace(/[\u201C\u201D\u00AB\u00BB\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2015\u2212]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function tokenise(text: string): string[] {
  return normalise(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0);
}

export interface TokenOffset {
  token: string;
  start: number;
  end: number;
}

export function tokeniseWithOffsets(text: string): TokenOffset[] {
  // Offsets point INTO the provided text (raw). Tokens are NFC-normalised and
  // lowercased so they compare equal to source tokens produced by tokenise().
  // This keeps every matched span in the SAME coordinate space as the raw
  // submitted document (critical: coverage scoring divides by raw char count).
  const offsets: TokenOffset[] = [];
  const re = /[A-Za-z0-9]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const t = m[0].normalize("NFC").toLowerCase();
    if (t.length > 0) offsets.push({ token: t, start: m.index, end: m.index + m[0].length });
  }
  return offsets;
}

export function tokenStrings(offsets: TokenOffset[]): string[] {
  return offsets.map((o) => o.token);
}

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

const COMMON_ACADEMIC = new Set([
  "abstract","introduction","method","methods","results","discussion","conclusion",
  "study","paper","article","research","analysis","data","model","models","system",
  "systems","approach","proposed","using","used","show","shows","shown","result",
  "based","new","novel","performance","accuracy","task","tasks","dataset","datasets",
  "training","test","validation","experiment","experiments","evaluation",
  "architecture","framework","algorithm","algorithms","network","networks",
]);

export function jaccardSim(a: string[], b: string[]): number {
  const sa = new Set(a), sb = new Set(b);
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function splitSentences(text: string): Array<{ text: string; start: number }> {
  const out: Array<{ text: string; start: number }> = [];
  // Match sentence chunks ending in [.!?] followed by whitespace or end of string,
  // without breaking on decimal points (e.g. 28.4, 3.5) or intra-word dots.
  const re = /(?:[^\r\n.!?]|(?<=\d)\.(?=\d)|(?<=[a-zA-Z])\.(?=[a-zA-Z]))+?(?:[.!?]+(?=\s+[A-Z0-9]|\s*$|\n\n)|\n\n|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const s = m[0].trim();
    if (s.length > 12) out.push({ text: s, start: m.index });
  }
  return out;
}

const CITATION_RE =
  /(\([\w\s,\.]+\d{4}[a-z]?\)|\[[\d,\s]+\]|"[^"]{10,200}")/gi;
const BIBLIO_RE = /^(references|bibliography|works\s+cited|sources)\s*$/im;
const BOILER_RE =
  /^(cookie\s+policy|privacy\s+policy|terms\s+of\s+(use|service)|all\s+rights\s+reserved|copyright\s+©|skip\s+to|navigation|search\s*$|menu\s*$|sidebar\s*$)/im;

function prepareText(text: string): { body: string; hasCitations: boolean } {
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

interface MatchedSpan {
  submittedStart: number; submittedEnd: number;
  submittedPassage: string; sourcePassage: string;
  matchType: "exact" | "near" | "paraphrase" | "candidate";
  spanSimilarity: number;
}

interface VerifiedSource {
  title: string; doi: string | null; url: string;
  publisher: string; provider: "crossref" | "openalex" | "unpaywall" | "web" | "exa";
  matchContribution: number;
  uniqueContribution?: number;
  citedMaterial: boolean;
  matchedSpans: MatchedSpan[]; similarity: number;
  matchType: "Exact" | "Near Match" | "Verified Paraphrase" | "Candidate Similarity" | "Mixed";
  verified: boolean;
  queryRecovery?: number;
  discoveryScore?: number;
  verificationSource?: "full_text" | "reconstructed_abstract" | "snippet";
}

export type ProviderState =
  | "operational"
  | "no_results"
  | "timeout"
  | "authentication_error"
  | "quota_exceeded"
  | "unavailable"
  | "not_checked";

interface ProviderTelemetry {
  status: "ok" | "failed" | "skipped" | "not_configured";
  state?: ProviderState;
  queriesSent: number;
  candidatesReturned: number;
  verifiedSources: number;
  httpStatus?: number | null;
  failureReason?: string | null;
}

interface PlagResult {
  status: PlagStatus;
  similarityScore: number; originalityScore: number;
  exactMatchScore: number; nearMatchScore: number; paraphraseMatchScore: number; semanticMatchScore: number;
  riskLevel: "None" | "Low" | "Medium" | "High" | "Critical" | "Limited Coverage";
  sources: VerifiedSource[];
  coverageNote: string;
  providerStatus: {
    crossref: ProviderTelemetry;
    openalex: ProviderTelemetry;
    unpaywall: ProviderTelemetry;
    gemini: ProviderTelemetry;
    webSearch: ProviderTelemetry;
    exa: ProviderTelemetry;
  };
  diagnostics?: {
    submittedChars: number;
    submittedWords: number;
    sentenceCount: number;
    passagesGenerated: number;
    passagesSearched: number;
    queriesGenerated: number;
    providerRequestsCompleted: number;
    queryStrategy: string;
    queriesSentByProvider: Record<string, string[]>;
    providersResponded: Record<string, boolean>;
    providerStates: Record<string, ProviderState>;
    candidatesReturnedByProvider: Record<string, number>;
    retrievedUrls: string[];
    fullTextRetrievedCount: number;
    abstractSnippetFallbackCount: number;
    failedRetrievalsCount: number;
    candidatePassagesReachingMatcher: number;
    exactMatchesFound: number;
    nearMatchesFound: number;
    verifiedParaphrasesFound: number;
    candidateSimilaritiesFound: number;
    uniqueMatchedWords: number;
    uniqueMatchedWordsPercentage: number;
    actualCoveragePercentage: number;
    calculatedSimilarityPercentage: number;
    scoringFormula: string;
  };
  errorMessage?: string;
  upgrade_required?: boolean; remaining?: number | null; limit?: number | null;
}

interface Candidate {
  title: string; doi: string | null; url: string;
  publisher: string; provider: "crossref" | "openalex" | "unpaywall" | "web" | "exa";
  abstract: string | null;
  fullText?: string | null;
  snippet?: string | null;
  queryRecovery: number;
  discoveryScore: number;
  recoveredQueries: string[];
}

// ─── Distinctiveness Scoring & Fallback Query Ladders ─────────────────────────

export function rareTokenSet(text: string): Set<string> {
  const toks = tokenise(text);
  const freq = new Map<string, number>();
  for (const t of toks) freq.set(t, (freq.get(t) ?? 0) + 1);
  const rare: string[] = [];
  for (const t of toks) {
    if (t.length > 2 && !STOP.has(t) && !COMMON_ACADEMIC.has(t)) {
      if ((freq.get(t) ?? 0) <= 2 || /^\d+$/.test(t)) rare.push(t);
    }
  }
  const capRe = /\b[A-Z][a-z]+(?:-[A-Za-z]+)?\b/g;
  let m: RegExpExecArray | null;
  while ((m = capRe.exec(text)) !== null) {
    const w = normalise(m[0]);
    if (w.length > 2 && !COMMON_ACADEMIC.has(w) && !STOP.has(w)) rare.push(w);
  }
  return new Set(rare);
}

export function entityAndFactTokens(text: string): string[] {
  const found: string[] = [];
  const numRe = /\b\d+(?:\.\d+)?%?\b/g;
  let m: RegExpExecArray | null;
  while ((m = numRe.exec(text)) !== null) found.push(m[0]);
  const hyphenRe = /\b[a-z]+-[a-z]+(?:-[a-z]+)?\b/gi;
  while ((m = hyphenRe.exec(text)) !== null) found.push(m[0]);
  const acroRe = /\b[A-Z]{2,}\b/g;
  while ((m = acroRe.exec(text)) !== null) found.push(m[0]);
  const capRe = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g;
  while ((m = capRe.exec(text)) !== null) {
    const w = m[0].toLowerCase();
    if (!COMMON_ACADEMIC.has(w) && !STOP.has(w)) found.push(m[0]);
  }
  return [...new Set(found.map((x) => normalise(x)))];
}

export function computeDistinctiveness(passage: string): number {
  const words = passage.split(/\s+/).filter(Boolean);
  if (words.length < 5) return 0.1;
  const numbers = passage.match(/\b\d+(?:\.\d+)?%?\b/g) || [];
  const entities = entityAndFactTokens(passage);
  const rare = [...rareTokenSet(passage)];
  const numScore = Math.min(numbers.length * 0.15, 0.35);
  const entityScore = Math.min(entities.length * 0.15, 0.35);
  const rareScore = Math.min(rare.length * 0.08, 0.30);
  return Math.min(1.0, Math.round((0.15 + numScore + entityScore + rareScore) * 100) / 100);
}

export interface ZonedQueryLadder {
  query: string;
  ladderLevel: number;
  zone: string;
  distinctiveness: number;
  strategy: "exact_phrase" | "short_phrase" | "dual_fragments" | "rare_ngrams" | "entity_terminology" | "academic_concept";
  cleanKeywords?: string;
}

export function buildZonedQueryPlan(text: string, maxQueries = 20): ZonedQueryLadder[] {
  const sentences = splitSentences(text);
  if (!sentences.length) return [];
  const total = sentences.length;
  const queries: ZonedQueryLadder[] = [];
  const seen = new Set<string>();

  const zones = [
    { name: "beginning", start: 0, end: Math.max(1, Math.floor(total * 0.2)) },
    { name: "early_middle", start: Math.floor(total * 0.2), end: Math.max(2, Math.floor(total * 0.4)) },
    { name: "middle", start: Math.floor(total * 0.4), end: Math.max(3, Math.floor(total * 0.6)) },
    { name: "late_middle", start: Math.floor(total * 0.6), end: Math.max(4, Math.floor(total * 0.8)) },
    { name: "ending", start: Math.floor(total * 0.8), end: total },
  ];

  for (let zoneIdx = 0; zoneIdx < zones.length; zoneIdx++) {
    const zone = zones[zoneIdx];
    const zSentences = sentences.slice(zone.start, zone.end);
    if (!zSentences.length) continue;

    const passages: Array<{ text: string; score: number }> = [];
    for (const s of zSentences) passages.push({ text: s.text, score: computeDistinctiveness(s.text) });
    for (let i = 0; i < zSentences.length - 1; i++) {
      const pair = `${zSentences[i].text} ${zSentences[i+1].text}`;
      passages.push({ text: pair, score: computeDistinctiveness(pair) });
    }

    passages.sort((a, b) => b.score - a.score);
    const top = passages[0];
    if (!top) continue;

    const words = top.text.split(/\s+/).map((w) => w.replace(/^[^\w]+|[^\w]+$/g, "")).filter(Boolean);

    // Strategy 1: High-precision Exact Phrase Query (6–9 words)
    // 6-9 words is the empirical sweet spot for web & publication search engines
    if (words.length >= 6) {
      const phraseLen = Math.min(9, words.length);
      const q1 = `"${words.slice(0, phraseLen).join(" ")}"`;
      if (!seen.has(q1)) {
        seen.add(q1);
        queries.push({
          query: q1,
          ladderLevel: 1,
          zone: zone.name,
          distinctiveness: top.score,
          strategy: "exact_phrase",
          cleanKeywords: words.slice(0, phraseLen).filter((w) => !STOP.has(w.toLowerCase())).join(" "),
        });
      }
    } else if (words.length >= 4) {
      const q1 = `"${words.join(" ")}"`;
      if (!seen.has(q1)) {
        seen.add(q1);
        queries.push({
          query: q1,
          ladderLevel: 1,
          zone: zone.name,
          distinctiveness: top.score,
          strategy: "exact_phrase",
          cleanKeywords: words.filter((w) => !STOP.has(w.toLowerCase())).join(" "),
        });
      }
    }

    // Strategy 2: Distinctive Dual Sentence Fragments (e.g. "rapid expansion of" "written assignments")
    if (words.length >= 9) {
      const frag1 = words.slice(0, 4).join(" ");
      const frag2 = words.slice(-4).join(" ");
      const q2 = `"${frag1}" "${frag2}"`;
      if (!seen.has(q2)) {
        seen.add(q2);
        queries.push({
          query: q2,
          ladderLevel: 2,
          zone: zone.name,
          distinctiveness: top.score,
          strategy: "dual_fragments",
          cleanKeywords: `${frag1} ${frag2}`,
        });
      }
    }

    // Strategy 3: Entity + Technical Terminology Combinations
    const rare = [...rareTokenSet(top.text)].slice(0, 4);
    const ent = entityAndFactTokens(top.text).slice(0, 4);
    const terms = [...new Set([...ent, ...rare])].slice(0, 6);
    if (terms.length >= 2) {
      const q3 = terms.join(" ");
      if (!seen.has(q3)) {
        seen.add(q3);
        queries.push({
          query: q3,
          ladderLevel: 3,
          zone: zone.name,
          distinctiveness: top.score,
          strategy: "entity_terminology",
          cleanKeywords: q3,
        });
      }
    }

    // Strategy 4: Rare n-grams (3-gram or 4-gram of distinctive content tokens)
    const contentTokens = words.filter((w) => !STOP.has(w.toLowerCase()) && w.length > 2);
    if (contentTokens.length >= 3) {
      const ngram = contentTokens.slice(0, 4).join(" ");
      const q4 = `"${ngram}"`;
      if (!seen.has(q4)) {
        seen.add(q4);
        queries.push({
          query: q4,
          ladderLevel: 4,
          zone: zone.name,
          distinctiveness: top.score,
          strategy: "rare_ngrams",
          cleanKeywords: ngram,
        });
      }
    }

    // Strategy 5: Scholarly Concept Query (unquoted 4-8 core topical terms for Crossref & OpenAlex)
    const scholarlyTerms = words
      .filter((w) => !STOP.has(w.toLowerCase()) && !COMMON_ACADEMIC.has(w.toLowerCase()) && w.length > 2)
      .slice(0, 7);
    if (scholarlyTerms.length >= 3) {
      const q5 = scholarlyTerms.join(" ");
      if (!seen.has(q5)) {
        seen.add(q5);
        queries.push({
          query: q5,
          ladderLevel: 5,
          zone: zone.name,
          distinctiveness: top.score,
          strategy: "academic_concept",
          cleanKeywords: q5,
        });
      }
    }
  }

  // Interleave queries across document zones so any subset samples beginning, middle, and end.
  // Order priority: Level 1 (exact phrase), Level 3 (entities/terms), Level 2 (dual fragments), Level 5 (academic), Level 4 (rare n-grams).
  const zoneOrder = ["beginning", "early_middle", "middle", "late_middle", "ending"];
  const levelPriority: Record<number, number> = { 1: 0, 3: 1, 2: 2, 5: 3, 4: 4 };

  const ordered = queries.slice().sort((a, b) => {
    const pA = levelPriority[a.ladderLevel] ?? 9;
    const pB = levelPriority[b.ladderLevel] ?? 9;
    if (pA !== pB) return pA - pB;
    const dz = zoneOrder.indexOf(a.zone) - zoneOrder.indexOf(b.zone);
    return dz !== 0 ? dz : b.distinctiveness - a.distinctiveness;
  });

  return ordered.slice(0, maxQueries);
}

// ─── Provider Discovery Handlers ──────────────────────────────────────────────

async function discoverCrossref(
  queryPlan: ZonedQueryLadder[],
  sig: AbortSignal,
  telemetry: ProviderTelemetry,
  queriesSentMap: string[]
): Promise<Candidate[]> {
  const results = new Map<string, Candidate>();
  const seen = new Set<string>();
  const queriesToRun = queryPlan.slice(0, 8);
  const BATCH_SIZE = 2;

  for (let b = 0; b < queriesToRun.length; b += BATCH_SIZE) {
    if (sig.aborted || results.size >= MAX_CANDIDATES) break;
    const batch = queriesToRun.slice(b, b + BATCH_SIZE);

    await Promise.all(
      batch.map(async (item) => {
        if (sig.aborted) return;
        try {
          const cleanQ = item.cleanKeywords || item.query.replace(/"/g, "");
          const url =
            `https://api.crossref.org/works?query=${encodeURIComponent(cleanQ.slice(0, 120))}` +
            `&rows=5&select=DOI,title,URL,publisher,abstract&mailto=plagiarism@aidetector.cx`;
          queriesSentMap.push(item.query);
          telemetry.queriesSent++;

          const resp = await fetch(url, { signal: sig });
          telemetry.httpStatus = resp.status;
          if (!resp.ok) {
            if (resp.status === 401 || resp.status === 403) {
              telemetry.status = "failed";
              telemetry.state = "authentication_error";
              telemetry.failureReason = `Crossref HTTP ${resp.status}`;
            } else if (resp.status === 429) {
              telemetry.status = "failed";
              telemetry.state = "quota_exceeded";
              telemetry.failureReason = "Crossref rate limit exceeded";
            }
            return;
          }

          const data = await resp.json();
          for (const rawItem of (data?.message?.items ?? []) as Record<string, unknown>[]) {
            const doi = rawItem.DOI as string | undefined;
            const key = doi ?? (rawItem.URL as string);
            if (!key || seen.has(key)) continue;
            seen.add(key);

            const rawUrl = rawItem.URL as string | undefined;
            const resolvedUrl = rawUrl && isSafeUrl(rawUrl)
              ? rawUrl
              : doi ? `https://doi.org/${doi}` : null;
            if (!resolvedUrl) continue;

            const title = (rawItem.title as string[])?.[0] ?? doi ?? resolvedUrl;
            const existing = results.get(key);
            if (existing) {
              existing.queryRecovery += 1;
              existing.recoveredQueries.push(item.query);
              continue;
            }

            results.set(key, {
              title,
              doi: doi ?? null,
              url: resolvedUrl,
              publisher: (rawItem.publisher as string) ?? "Crossref",
              provider: "crossref",
              abstract: (rawItem.abstract as string | null) ?? null,
              queryRecovery: 1,
              discoveryScore: 0,
              recoveredQueries: [item.query],
            });
            if (results.size >= MAX_CANDIDATES) break;
          }
        } catch {
          // Handled per batch
        }
      })
    );
  }

  telemetry.candidatesReturned = results.size;
  if (results.size > 0) {
    telemetry.status = "ok";
    telemetry.state = "operational";
  } else if (sig.aborted) {
    telemetry.status = "failed";
    telemetry.state = "timeout";
    telemetry.failureReason = "Crossref request timed out";
  } else if (telemetry.queriesSent > 0) {
    telemetry.status = "ok";
    telemetry.state = "no_results";
  } else {
    telemetry.status = "skipped";
    telemetry.state = "not_checked";
  }
  return Array.from(results.values());
}

async function discoverOpenAlex(
  queryPlan: ZonedQueryLadder[],
  sig: AbortSignal,
  telemetry: ProviderTelemetry,
  queriesSentMap: string[]
): Promise<Candidate[]> {
  const results = new Map<string, Candidate>();
  const seen = new Set<string>();
  const queriesToRun = queryPlan.slice(0, 8);
  const BATCH_SIZE = 2;

  for (let b = 0; b < queriesToRun.length; b += BATCH_SIZE) {
    if (sig.aborted || results.size >= MAX_CANDIDATES) break;
    const batch = queriesToRun.slice(b, b + BATCH_SIZE);

    await Promise.all(
      batch.map(async (item) => {
        if (sig.aborted) return;
        try {
          const cleanQ = item.cleanKeywords || item.query.replace(/"/g, "");
          const url =
            `https://api.openalex.org/works?search=${encodeURIComponent(cleanQ.slice(0, 120))}` +
            `&per-page=5&select=id,doi,title,primary_location,best_oa_location,open_access,abstract_inverted_index` +
            `&mailto=plagiarism@aidetector.cx`;
          queriesSentMap.push(item.query);
          telemetry.queriesSent++;

          const resp = await fetch(url, { signal: sig });
          telemetry.httpStatus = resp.status;
          if (!resp.ok) {
            if (resp.status === 401 || resp.status === 403) {
              telemetry.status = "failed";
              telemetry.state = "authentication_error";
              telemetry.failureReason = `OpenAlex HTTP ${resp.status}`;
            } else if (resp.status === 429) {
              telemetry.status = "failed";
              telemetry.state = "quota_exceeded";
              telemetry.failureReason = "OpenAlex rate limit exceeded";
            }
            return;
          }

          const data = await resp.json();
          for (const rawItem of (data?.results ?? []) as Record<string, unknown>[]) {
            const doi = (rawItem.doi as string | null)?.replace("https://doi.org/", "") ?? null;
            const loc = rawItem.primary_location as Record<string, unknown> | null;
            const bestOa = rawItem.best_oa_location as Record<string, unknown> | null;
            const oaObj = rawItem.open_access as Record<string, unknown> | null;

            const pdfUrl = ((loc?.pdf_url as string | undefined) || (bestOa?.pdf_url as string | undefined)) ?? undefined;
            const landingUrl = ((loc?.landing_page_url as string | undefined) || (bestOa?.landing_page_url as string | undefined) || ((oaObj?.oa_url as string | undefined))) ?? undefined;
            const key = doi ?? landingUrl ?? pdfUrl ?? "";
            if (!key || seen.has(key)) continue;
            seen.add(key);

            let abstract: string | null = null;
            const inv = rawItem.abstract_inverted_index as Record<string, number[]> | null;
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

            const title = (rawItem.title as string) ?? resolvedUrl;
            const existing = results.get(key);
            if (existing) {
              existing.queryRecovery += 1;
              existing.recoveredQueries.push(item.query);
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
              recoveredQueries: [item.query],
            });
            if (results.size >= MAX_CANDIDATES) break;
          }
        } catch {
          // Handled per batch
        }
      })
    );
  }

  telemetry.candidatesReturned = results.size;
  if (results.size > 0) {
    telemetry.status = "ok";
    telemetry.state = "operational";
  } else if (sig.aborted) {
    telemetry.status = "failed";
    telemetry.state = "timeout";
    telemetry.failureReason = "OpenAlex request timed out";
  } else if (telemetry.queriesSent > 0) {
    telemetry.status = "ok";
    telemetry.state = "no_results";
  } else {
    telemetry.status = "skipped";
    telemetry.state = "not_checked";
  }
  return Array.from(results.values());
}

async function discoverExa(
  queryPlan: ZonedQueryLadder[],
  sig: AbortSignal,
  telemetry: ProviderTelemetry,
  queriesSentMap: string[]
): Promise<Candidate[]> {
  const apiKey = Deno.env.get("EXA_API_KEY") ?? "";
  if (!apiKey) {
    telemetry.status = "not_configured";
    telemetry.state = "not_checked";
    telemetry.failureReason = "EXA_API_KEY not configured";
    return [];
  }

  const exa = new Exa(apiKey);
  const results = new Map<string, Candidate>();
  const seen = new Set<string>();
  const queriesToRun = queryPlan.slice(0, 8);

  for (const item of queriesToRun) {
    if (sig.aborted) break;
    try {
      queriesSentMap.push(item.query);
      telemetry.queriesSent++;

      // Use keyword search when exact phrases are requested, auto for general search
      const searchType = item.strategy === "exact_phrase" ? "keyword" : "auto";
      const res = await exa.search(item.query, {
        type: searchType,
        numResults: 6,
        // Free broad web search: do NOT restrict to publications so open articles,
        // news, Wikipedia, and institution repos are found
        contents: {
          text: { maxCharacters: 5000 },
          highlights: { query: item.query },
        },
      });

      for (const rawItem of (res.results ?? []) as Record<string, unknown>[]) {
        const link = (rawItem.url as string | undefined) ?? "";
        if (!link || !isSafeUrl(link) || seen.has(link)) continue;
        seen.add(link);

        const title = (rawItem.title as string) ?? link;
        const highlight = (rawItem.highlights as string[] | undefined)?.[0] ?? null;
        const textContent = (rawItem.text as string | undefined) ?? null;
        const author = (rawItem.author as string | null) ?? null;
        let publisher = "Web";
        try {
          publisher = author ? `${author}` : new URL(link).hostname.replace(/^www\./, "");
        } catch {
          publisher = author || "Web Source";
        }

        results.set(link, {
          title,
          doi: null,
          url: link,
          publisher,
          provider: "exa",
          abstract: highlight || (textContent ? textContent.slice(0, 400) : null),
          fullText: textContent,
          snippet: highlight,
          queryRecovery: 1,
          discoveryScore: 0,
          recoveredQueries: [item.query],
        });
        if (results.size >= MAX_EXA_CANDIDATES) break;
      }
    } catch (err: any) {
      if (sig.aborted || err?.name === "AbortError") {
        telemetry.state = "timeout";
        break;
      }
      telemetry.failureReason = err?.message || "Exa query failed";
    }
  }

  telemetry.candidatesReturned = results.size;
  if (!telemetry.state || telemetry.state === "not_checked") {
    if (results.size > 0) {
      telemetry.status = "ok";
      telemetry.state = "operational";
    } else if (telemetry.queriesSent > 0) {
      telemetry.status = "ok";
      telemetry.state = "no_results";
    } else {
      telemetry.status = "skipped";
      telemetry.state = "not_checked";
    }
  }
  return Array.from(results.values());
}

async function discoverGoogleWeb(
  queryPlan: ZonedQueryLadder[],
  sig: AbortSignal,
  telemetry: ProviderTelemetry,
  queriesSentMap: string[]
): Promise<Candidate[]> {
  const apiKey = Deno.env.get("GOOGLE_SEARCH_API_KEY") || Deno.env.get("GOOGLE_API_KEY") || "";
  const cx = Deno.env.get("GOOGLE_SEARCH_CX") || Deno.env.get("GOOGLE_CX") || "";
  if (!apiKey || !cx) {
    telemetry.status = "not_configured";
    telemetry.state = "not_checked";
    telemetry.failureReason = !apiKey && !cx ? "Missing API Key & CX" : (!apiKey ? "Missing API Key" : "Missing CX");
    return [];
  }

  const results = new Map<string, Candidate>();
  const seen = new Set<string>();
  const queriesToRun = queryPlan.slice(0, 6);

  for (const item of queriesToRun) {
    if (sig.aborted) break;
    try {
      const cleanQ = item.query.replace(/"/g, "");
      const url =
        `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}` +
        `&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(cleanQ)}&num=5`;
      queriesSentMap.push(item.query);
      telemetry.queriesSent++;

      const resp = await fetch(url, { signal: sig });
      telemetry.httpStatus = resp.status;
      if (!resp.ok) {
        if (resp.status === 401 || resp.status === 403) {
          telemetry.status = "failed";
          telemetry.state = "authentication_error";
          const errText = await resp.text().catch(() => "");
          telemetry.failureReason = `Google search HTTP ${resp.status}: ${errText.slice(0, 150)}`;
          break; // Don't burn requests if auth is blocked
        } else if (resp.status === 429) {
          telemetry.status = "failed";
          telemetry.state = "quota_exceeded";
          telemetry.failureReason = "Google Custom Search daily query quota exceeded";
          break;
        } else {
          telemetry.status = "failed";
          telemetry.state = "unavailable";
          telemetry.failureReason = `Google search HTTP ${resp.status}`;
          continue;
        }
      }

      const data = await resp.json();
      const items = (data?.items ?? []) as Record<string, unknown>[];
      for (const rawItem of items) {
        const link = (rawItem.link as string | undefined) ?? "";
        if (!link || !isSafeUrl(link) || seen.has(link)) continue;
        seen.add(link);

        const title = (rawItem.title as string) ?? link;
        const snippet = (rawItem.snippet as string | null) ?? null;
        const existing = results.get(link);
        if (existing) {
          existing.queryRecovery += 1;
          existing.recoveredQueries.push(item.query);
          continue;
        }

        results.set(link, {
          title,
          doi: null,
          url: link,
          publisher: (rawItem.displayLink as string) ?? new URL(link).hostname,
          provider: "web",
          abstract: snippet,
          queryRecovery: 1,
          discoveryScore: 0,
          recoveredQueries: [item.query],
        });
        if (results.size >= MAX_WEB_CANDIDATES) break;
      }
    } catch (err: any) {
      if (sig.aborted || err?.name === "AbortError") {
        telemetry.state = "timeout";
        break;
      }
      telemetry.status = "failed";
      telemetry.state = "unavailable";
      telemetry.failureReason = err?.message || "Network error";
    }
  }

  telemetry.candidatesReturned = results.size;
  if (!telemetry.state || telemetry.state === "not_checked") {
    if (results.size > 0) {
      telemetry.status = "ok";
      telemetry.state = "operational";
    } else if (telemetry.queriesSent > 0) {
      telemetry.status = "ok";
      telemetry.state = "no_results";
    } else {
      telemetry.status = "skipped";
      telemetry.state = "not_checked";
    }
  }
  return Array.from(results.values());
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
  } catch { /* use existing */ }
  return c;
}

// ─── Source Retrieval Engine ──────────────────────────────────────────────────

// Inflate all FlateDecode-compressed stream objects and extract showable text.
// Memory-safe design: each decompressed content stream is parsed IMMEDIATELY
// and only its extracted human text is retained — no full-document joins or
// re-encoding round-trips (those blew the edge worker resource limit).
const PDF_MAX_BYTES = 1_000_000; // skip gigantic PDFs (books/scans)

async function extractPdfText(buf: Uint8Array): Promise<string | null> {
  if (buf.length > PDF_MAX_BYTES) return null;
  const raw = new TextDecoder("latin1").decode(buf);
  if (!raw.includes("FlateDecode")) {
    const t = extractPdfShowText(raw);
    return t.length > 50 ? t : null;
  }

  // Negative lookbehind: "endstream" contains the substring "stream" — matching it
  // desynchronises the scan and silently skips every second stream in the file.
  const streamRe = /(?<!end)stream\r?\n?/g;
  const texts: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = streamRe.exec(raw)) !== null) {
    const start = m.index + m[0].length;
    const end = raw.indexOf("endstream", start);
    if (end < 0) continue;
    const slice = buf.subarray(start, end);
    // Trim trailing EOL before endstream marker
    const trimmed = slice[ slice.length - 1 ] === 10 ? slice.subarray(0, slice.length - 1) : slice;
    try {
      // Deno ships DecompressionStream("deflate") — zlib wrapped (RFC1950).
      const ds = new DecompressionStream("deflate");
      const stream = new Blob([trimmed as unknown as BlobPart]).stream().pipeThrough(ds);
      const content = await new Response(stream).text();
      if (content.length > 20 && content.includes("BT")) {
        texts.push(extractPdfShowText(content));
        if (texts.reduce((acc, t) => acc + t.length, 0) >= 8000) break;
      }
    } catch { /* not a zlib stream (maybe raw or image data) — skip */ }
    streamRe.lastIndex = end + 9;
    if (texts.length >= 8) break;
  }
  const joined = texts.join(" ").replace(/\s+/g, " ").slice(0, PDF_CHAR_LIMIT);
  return joined.length > 50 ? joined : null;
}

function decodePdfLiteral(s: string): string {
  return s
    .replace(/\\n/g, " ").replace(/\\r/g, " ").replace(/\\t/g, " ")
    .replace(/\\\\/g, "\\").replace(/\\\(/g, "(").replace(/\\\)/g, ")")
    // TeX Type-1 (CM/TeXBase1) ligature glyphs in the octal control range.
    .replace(/\\002/g, "fi").replace(/\\003/g, "fl")
    .replace(/\\013/g, "ff").replace(/\\014/g, "ffi").replace(/\\015/g, "ffl")
    .replace(/\\([0-7]{1,3})/g, (esc, oct) => String.fromCharCode(parseInt(oct, 8)));
}

// Walk a PDF text-showing construct and append its text to out[].
//   [ ... ]TJ  — array form: strings interleaved with displacement numbers.
//                A number <= -100 (thousandths of text-space unit) is a WORD
//                SPACE advance; small numbers (positive or tiny negative) are
//                intra-word kerning and must be joined with NO separator.
//   ( ... ) Tj  — single string show.
function appendPdfShowOp(source: string, out: string[]): void {
  const elemRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)|<([0-9A-Fa-f]{2,})>|(-?\d+(?:\.\d+)?)/g;
  let em: RegExpExecArray | null;
  let run = "";
  while ((em = elemRe.exec(source)) !== null) {
    if (em[1] !== undefined) {
      run += decodePdfLiteral(em[1]);
    } else if (em[2] !== undefined) {
      const hex = em[2];
      for (let i = 0; i + 1 < hex.length; i += 2)
        run += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
    } else if (em[3] !== undefined) {
      const n = parseFloat(em[3]);
      if (n <= -100) run += " "; // word-space displacement
      // else: kerning — join fragments directly
    }
  }
  if (run.trim().length > 0) out.push(run);
}

// Extract showable text from one PDF content stream (or raw buffer).
function extractPdfShowText(content: string): string {
  const chunks: string[] = [];

  // Content-stream aware extraction, preserving word boundaries.
  // pdfTeX/LaTeX PDFs split words across kerned TJ fragments and encode word
  // spaces as displacement numbers between fragments. Positioning operators
  // (Td/TD/Tm/T*) start new text runs.
  const btRe = /BT([\s\S]*?)ET/g;
  let btM: RegExpExecArray | null;
  while ((btM = btRe.exec(content)) !== null) {
    const block = btM[1];
    const runs = block.split(/(?:\bT\*|[\d.\-]+\s+(?:Td|TD)|\bTm\b)/g);
    for (const run of runs) {
      // Match either a [ ... ]TJ array or a ( ... ) Tj single show, in order.
      const showRe = /\[([^\]]*)\]\s*TJ|\(((?:[^)\\]|\\.)*)\)\s*Tj/g;
      let sm: RegExpExecArray | null;
      while ((sm = showRe.exec(run)) !== null) {
        appendPdfShowOp(sm[1] ?? sm[2] ?? "", chunks);
      }
    }
  }

  if (chunks.length < 10) {
    const fallbackRe = /\(([A-Za-z0-9 ,\.\-:;'"]{6,})\)/g;
    let fm: RegExpExecArray | null;
    while ((fm = fallbackRe.exec(content)) !== null) chunks.push(fm[1]);
  }

  return chunks.join(" ").replace(/\s+/g, " ").slice(0, PDF_CHAR_LIMIT);
}

async function fetchSourceText(url: string): Promise<string | null> {
  if (!isSafeUrl(url)) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4_000);
    const resp = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "AIDetector-PlagiarismChecker/1.0 (mailto:plagiarism@aidetector.cx)" },
    });
    clearTimeout(t);
    if (!resp.ok) return null;

    const ct = (resp.headers.get("content-type") ?? "").toLowerCase();

    if (ct.includes("application/pdf") || url.toLowerCase().endsWith(".pdf")) {
      // Memory protection: Stream up to 500KB max to avoid Edge Worker OOM / 546 limits
      const reader = resp.body?.getReader();
      if (!reader) return null;
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;
      try {
        while (totalBytes < 250_000) {
          const { done, value } = await reader.read();
          if (done || !value) break;
          chunks.push(value);
          totalBytes += value.length;
        }
      } finally {
        reader.cancel().catch(() => {});
      }
      const merged = new Uint8Array(totalBytes);
      let offset = 0;
      for (const c of chunks) {
        merged.set(c, offset);
        offset += c.length;
      }
      return await extractPdfText(merged);
    }

    if (!ct.includes("text/html") && !ct.includes("text/plain")) return null;
    const raw = await resp.text();
    const cleanHtml = raw
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<header[\s\S]*?<\/header>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
      .replace(/<form[\s\S]*?<\/form>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&#\d+;/g, " ")
      .replace(/&[a-z]+;/gi, " ");
    return removeBoilerplate(cleanHtml).slice(0, 50_000);
  } catch { return null; }
}

// ─── Matching Engine ──────────────────────────────────────────────────────────

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

export function runExact(submitted: string, sourceText: string): MatchResult {
  // Raw-text offsets: subOff indices address the original submitted document.
  const subOff = tokeniseWithOffsets(submitted);
  const srcToks = tokenise(sourceText).slice(0, 15000);
  if (subOff.length < EXACT_MIN_RUN_TOKENS || srcToks.length < EXACT_MIN_RUN_TOKENS) {
    return { spans: [], ranges: [] };
  }

  const subToks = tokenStrings(subOff);
  const usedSub = new Set<number>();
  const spans: MatchedSpan[] = [];
  const ranges: Array<[number, number]> = [];

  // Multi-window evaluation: 8 and 5 tokens with bi-directional exact expansion.
  // Window 8 rapidly locks onto substantial matching runs and expands left/right to arbitrary length.
  // Window 5 subsequently captures remaining shorter exact phrases down to EXACT_MIN_RUN_TOKENS (5 tokens).
  const windowSizes = [8, 5];

  for (const n of windowSizes) {
    if (subToks.length < n || srcToks.length < n) continue;
    const subGrams = new Map<string, number[]>();
    for (let i = 0; i <= subToks.length - n; i++) {
      if (usedSub.has(i)) continue;
      const gram = subToks.slice(i, i + n).join(" ");
      let pos = subGrams.get(gram);
      if (!pos) { pos = []; subGrams.set(gram, pos); }
      pos.push(i);
    }
    if (subGrams.size === 0) continue;

    for (let tPos = 0; tPos <= srcToks.length - n; tPos++) {
      const gram = srcToks.slice(tPos, tPos + n).join(" ");
      const subPositions = subGrams.get(gram);
      if (!subPositions) continue;

      for (const sPos of subPositions) {
        if (usedSub.has(sPos)) continue;

        // Extend left as far as consecutive tokens match
        let runStart = sPos;
        let tStart = tPos;
        while (
          runStart > 0 &&
          tStart > 0 &&
          !usedSub.has(runStart - 1) &&
          subToks[runStart - 1] === srcToks[tStart - 1]
        ) {
          runStart--;
          tStart--;
        }

        // Extend right as far as consecutive tokens match
        let runEnd = sPos + n;
        let tEnd = tPos + n;
        while (
          runEnd < subToks.length &&
          tEnd < srcToks.length &&
          !usedSub.has(runEnd) &&
          subToks[runEnd] === srcToks[tEnd]
        ) {
          runEnd++;
          tEnd++;
        }

        if (runEnd - runStart < EXACT_MIN_RUN_TOKENS) continue;
        if (usedSub.has(runStart)) continue;

        for (let i = runStart; i < runEnd; i++) usedSub.add(i);
        const startChar = subOff[runStart].start;
        const endChar = subOff[runEnd - 1].end;
        // Evidence fidelity: quote the original (raw) submitted text, not normalised tokens.
        const subPass = submitted.slice(startChar, endChar);
        const srcPass = srcToks.slice(tStart, tEnd).join(" ");
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
  }
  return { spans, ranges };
}

export function runNear(submitted: string, sourceText: string, existingExactRanges?: Array<[number, number]>): MatchResult {
  const subSents = splitSentences(submitted);
  const srcToks = tokenise(sourceText).slice(0, 15000);
  if (srcToks.length < NEAR_MIN_TOKENS) return { spans: [], ranges: [] };

  const spans: MatchedSpan[] = [];
  const ranges: Array<[number, number]> = [];
  const srcWordSet = new Set(srcToks);

  for (const ss of subSents) {
    // If this sentence is already covered by an exact match, skip expensive near-match scan
    if (existingExactRanges && existingExactRanges.some(([s, e]) => ss.start >= s && (ss.start + ss.text.length) <= e)) {
      continue;
    }
    const sToks = tokenise(ss.text);
    if (sToks.length < NEAR_MIN_TOKENS) continue;

    // Fast pruning: does sentence share at least 4 tokens with the entire source text?
    let shared = 0;
    for (const t of sToks) {
      if (srcWordSet.has(t)) {
        shared++;
        if (shared >= 4) break;
      }
    }
    if (shared < 4) continue;

    let best = 0, bestSrc = "";
    const step = 15;
    for (let start = 0; start < srcToks.length; start += step) {
      const end = Math.min(start + NEAR_MAX_WINDOW_TOKENS, srcToks.length);
      const window = srcToks.slice(start, end);
      if (window.length < NEAR_MIN_TOKENS) continue;
      const jac = jaccardSim(sToks, window);
      if (jac < 0.35) continue; // Early prune before expensive O(N*M) LCS calculation

      const lcs = longestCommonSubsequenceRatio(sToks, window);

      if (jac >= NEAR_JACCARD_MIN || (jac >= 0.38 && lcs >= NEAR_LCS_MIN)) {
        const combined = (jac + lcs) / 2;
        if (combined > best) {
          best = combined;
          bestSrc = window.join(" ");
        }
      }
    }

    if (best >= NEAR_JACCARD_MIN || best >= 0.45) {
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
  for (const ss of uncovered.slice(0, 12)) {
    const sToks = tokenise(ss.text);
    if (sToks.length < SEM_MIN_TOKENS) continue;
    const rareSub = rareTokenSet(ss.text);
    const entitySub = new Set(entityAndFactTokens(ss.text));

    for (const ts of srcSents.slice(0, 35)) {
      const tToks = tokenise(ts.text);
      if (tToks.length < SEM_MIN_TOKENS) continue;
      const lexJaccard = jaccardSim(sToks, tToks);
      const rareSrc = rareTokenSet(ts.text);
      const entitySrc = new Set(entityAndFactTokens(ts.text));
      const rareOverlap = rareSub.size ? [...rareSub].filter((t) => rareSrc.has(t)).length / rareSub.size : 0;
      const entityOverlap = entitySub.size ? [...entitySub].filter((t) => entitySrc.has(t)).length / entitySub.size : 0;

      if (lexJaccard > SEM_JACCARD_MAX) {
        if (rareOverlap < 0.08 && entityOverlap < 0.08) continue;
      } else if (lexJaccard <= 0.03 && rareOverlap === 0 && entityOverlap === 0) {
        continue;
      }
      pairs.push({ ss, ts, lexJaccard, rareOverlap, entityOverlap });
      if (pairs.length >= 8) break;
    }
    if (pairs.length >= 8) break;
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
      ranges.push([ss.start, ss.start + ss.text.length]);
      spans.push({
        submittedStart: ss.start,
        submittedEnd: ss.start + ss.text.length,
        submittedPassage: ss.text,
        sourcePassage: ts.text,
        matchType: "paraphrase",
        spanSimilarity: Math.round(cos * 100) / 100,
      });
    } else if (cos >= SEM_COSINE_MIN) {
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

// ─── Scoring & Diagnostics ───────────────────────────────────────────────────

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

// ─── Main Pipeline Execution ──────────────────────────────────────────────────

async function runAnalysis(rawText: string, apiKey: string, options?: { fastMode?: boolean }): Promise<PlagResult> {
  const providerStatus: PlagResult["providerStatus"] = {
    crossref: { status: "skipped", state: "not_checked", queriesSent: 0, candidatesReturned: 0, verifiedSources: 0 },
    openalex: { status: "skipped", state: "not_checked", queriesSent: 0, candidatesReturned: 0, verifiedSources: 0 },
    unpaywall: { status: "skipped", state: "not_checked", queriesSent: 0, candidatesReturned: 0, verifiedSources: 0 },
    gemini: { status: "skipped", state: "not_checked", queriesSent: 0, candidatesReturned: 0, verifiedSources: 0 },
    webSearch: { status: "skipped", state: "not_checked", queriesSent: 0, candidatesReturned: 0, verifiedSources: 0 },
    exa: { status: "skipped", state: "not_checked", queriesSent: 0, candidatesReturned: 0, verifiedSources: 0 },
  };

  const { body: eligibleText, hasCitations } = prepareText(rawText);
  const eligibleChars = eligibleText.length;
  const words = tokenise(eligibleText);
  const sentences = splitSentences(eligibleText);

  if (words.length < MIN_TEXT_WORDS) {
    return {
      status: "insufficient_text",
      similarityScore: 0,
      originalityScore: 100,
      exactMatchScore: 0,
      nearMatchScore: 0,
      paraphraseMatchScore: 0,
      semanticMatchScore: 0,
      riskLevel: "None",
      sources: [],
      coverageNote: COVERAGE_NOTE,
      providerStatus,
      errorMessage: `Minimum ${MIN_TEXT_WORDS} words required.`,
    };
  }

  // STAGE A: DISCOVERY (Multi-Zone Document Sampling & Query Ladders)
  const queryPlan = buildZonedQueryPlan(eligibleText, 16);
  const queriesSentByProvider: Record<string, string[]> = {
    crossref: [],
    openalex: [],
    exa: [],
    webSearch: [],
  };

  const discCtrl = new AbortController();
  const discTimer = setTimeout(() => discCtrl.abort(), PROVIDER_TO_MS);

  const exaConfigured = (Deno.env.get("EXA_API_KEY") ?? "").length > 0;

  const [crRes, oaRes, exaRes, webRes] = await Promise.allSettled([
    discoverCrossref(queryPlan, discCtrl.signal, providerStatus.crossref, queriesSentByProvider.crossref),
    discoverOpenAlex(queryPlan, discCtrl.signal, providerStatus.openalex, queriesSentByProvider.openalex),
    exaConfigured
      ? discoverExa(queryPlan, discCtrl.signal, providerStatus.exa, queriesSentByProvider.exa)
      : Promise.resolve([]),
    discoverGoogleWeb(queryPlan, discCtrl.signal, providerStatus.webSearch, queriesSentByProvider.webSearch),
  ]);
  clearTimeout(discTimer);

  const crCands = crRes.status === "fulfilled" ? crRes.value : [];
  const oaCands = oaRes.status === "fulfilled" ? oaRes.value : [];
  const exaCands = exaRes.status === "fulfilled" ? exaRes.value : [];
  const webCands = webRes.status === "fulfilled" ? webRes.value : [];

  if (crRes.status === "rejected") {
    providerStatus.crossref.status = "failed";
    providerStatus.crossref.state = "unavailable";
  }
  if (oaRes.status === "rejected") {
    providerStatus.openalex.status = "failed";
    providerStatus.openalex.state = "unavailable";
  }
  if (exaConfigured && exaRes.status === "rejected") {
    providerStatus.exa.status = "failed";
    providerStatus.exa.state = "unavailable";
  }
  if (webRes.status === "rejected") {
    providerStatus.webSearch.status = "failed";
    providerStatus.webSearch.state = "unavailable";
  }

  const searchProviders = [
    providerStatus.crossref,
    providerStatus.openalex,
    providerStatus.exa,
    providerStatus.webSearch,
  ];
  const operationalSearchProviders = searchProviders.filter(
    (p) => p.state === "operational" || p.state === "no_results" || p.status === "ok" || (p.candidatesReturned || 0) > 0
  );
  const failedProviders = searchProviders.filter(
    (p) => p.state === "authentication_error" || p.state === "timeout" || p.state === "quota_exceeded" || p.state === "unavailable"
  );
  const anyFailed = failedProviders.length > 0;

  // Abort scan ONLY if all configured search providers failed (Requirement 5)
  const checkedProviders = searchProviders.filter((p) => p.state !== "not_checked" && p.status !== "not_configured");
  if (checkedProviders.length > 0 && operationalSearchProviders.length === 0) {
    return {
      status: "provider_unavailable",
      similarityScore: 0,
      originalityScore: 100,
      exactMatchScore: 0,
      nearMatchScore: 0,
      paraphraseMatchScore: 0,
      semanticMatchScore: 0,
      riskLevel: "None",
      sources: [],
      coverageNote: "Could not reach source databases. Please check your connection and try again.",
      providerStatus,
      errorMessage: "Could not reach source databases. Please check your connection and try again.",
    };
  }

  // Deduplicate candidates — when the same DOI/URL is returned by multiple
  // registries, MERGE their metadata so an OpenAlex abstract is never thrown
  // away just because Crossref listed the same work first.
  const deduped: Candidate[] = [];
  const byDoi = new Map<string, Candidate>(), byUrl = new Map<string, Candidate>();
  const pushOrMerge = (c: Candidate) => {
    let existing: Candidate | undefined;
    if (c.doi) existing = byDoi.get(c.doi);
    if (!existing) existing = byUrl.get(c.url);
    if (existing) {
      existing.queryRecovery += 1;
      if (c.recoveredQueries?.length) existing.recoveredQueries.push(...c.recoveredQueries);
      if (!existing.abstract && c.abstract) {
        existing.abstract = c.abstract;
        existing.provider = existing.provider === "crossref" ? "openalex" : existing.provider;
      }
      return;
    }
    if (c.doi) byDoi.set(c.doi, c);
    byUrl.set(c.url, c);
    deduped.push(c);
  };
  for (const c of [...webCands, ...crCands, ...oaCands, ...exaCands]) {
    if (c.doi && byDoi.has(c.doi)) { pushOrMerge(c); continue; }
    if (byUrl.has(c.url)) { pushOrMerge(c); continue; }
    pushOrMerge(c);
  }

  // STAGE B: RETRIEVAL & UNPAYWALL ENRICHMENT
  const upCtrl = new AbortController();
  const upTimer = setTimeout(() => upCtrl.abort(), 4_000);
  const candidatesForUnpaywall = deduped.slice(0, 8);
  const unpaywallEnriched = await Promise.all(
    candidatesForUnpaywall.map((c) => enrichUnpaywall(c, upCtrl.signal))
  );
  clearTimeout(upTimer);
  const enriched = [...unpaywallEnriched, ...deduped.slice(12)];
  const unpaywallCount = unpaywallEnriched.filter((c) => c.provider === "unpaywall").length;
  providerStatus.unpaywall.status = unpaywallCount > 0 ? "ok" : "skipped";
  providerStatus.unpaywall.state = unpaywallCount > 0 ? "operational" : "no_results";
  providerStatus.unpaywall.candidatesReturned = unpaywallCount;

  // STAGE C: MATCHING — bounded-parallel retrieval & matching
  // Sort and pick top candidates by recovery and abstract availability
  const prioritized = enriched.slice().sort((a, b) => {
    const aScore = (a.queryRecovery || 1) * 3 + (a.abstract ? 2 : 0) + (a.discoveryScore || 0);
    const bScore = (b.queryRecovery || 1) * 3 + (b.abstract ? 2 : 0) + (b.discoveryScore || 0);
    return bScore - aScore;
  });
  const candidatesToRetrieve = prioritized.slice(0, 6);

  const sources: VerifiedSource[] = [];
  const allExact: Array<[number,number]> = [];
  const allNear:  Array<[number,number]> = [];
  const allParaphrase: Array<[number,number]> = [];
  const allSem:   Array<[number,number]> = [];
  let geminiUsed = false;
  let fullTextCount = 0;
  let abstractFallbackCount = 0;
  let failedRetrievalCount = 0;
  const retrievedUrls: string[] = [];
  const matchEvaluations: Array<{
    passageSearched: string;
    provider: string;
    candidateUrl: string;
    sourceRetrieved: boolean;
    lexicalScore: number;
    semanticScore: number;
    exactOverlap: number;
    status: "accepted" | "rejected";
    rejectionReason?: string;
  }> = [];
  const unverifiedCandidates: Array<{
    title: string;
    url: string;
    provider: string;
    reason: string;
  }> = [];

  interface RetrievedCandidate {
    cand: Candidate;
    srcText: string | null;
    verificationSource: "full_text" | "reconstructed_abstract" | "snippet";
  }

  const retrievalQueue: RetrievedCandidate[] = [];
  const RETRIEVAL_CONCURRENCY = 2;

  const retrieveOne = async (cand: Candidate): Promise<RetrievedCandidate> => {
    // 1. Direct full text or highlight content provided by discovery avoids redundant scrape
    if (cand.fullText && normalise(cand.fullText).length >= 80) {
      return { cand, srcText: cand.fullText, verificationSource: "full_text" };
    }
    let srcText: string | null = null;
    if (cand.url && isSafeUrl(cand.url)) {
      srcText = await fetchSourceText(cand.url);
      if (srcText && normalise(srcText).length >= 80) {
        return { cand, srcText, verificationSource: "full_text" };
      }
    }
    if (cand.abstract && normalise(cand.abstract).length >= 40) {
      return { cand, srcText: cand.abstract, verificationSource: "reconstructed_abstract" };
    }
    if (cand.snippet && normalise(cand.snippet).length >= 40) {
      return { cand, srcText: cand.snippet, verificationSource: "snippet" };
    }
    return { cand, srcText: null, verificationSource: "snippet" };
  };

  for (let i = 0; i < candidatesToRetrieve.length; i += RETRIEVAL_CONCURRENCY) {
    const batch = candidatesToRetrieve.slice(i, i + RETRIEVAL_CONCURRENCY);
    const settled = await Promise.all(batch.map(retrieveOne));
    for (const r of settled) retrievalQueue.push(r);
  }

  for (const { cand, srcText, verificationSource } of retrievalQueue) {
    if (!srcText || normalise(srcText).length < 40) {
      failedRetrievalCount++;
      unverifiedCandidates.push({
        title: cand.title,
        url: cand.url,
        provider: cand.provider,
        reason: "Candidate discovered — source verification unavailable",
      });
      matchEvaluations.push({
        passageSearched: cand.recoveredQueries?.[0] ?? "unknown",
        provider: cand.provider,
        candidateUrl: cand.url,
        sourceRetrieved: false,
        lexicalScore: 0,
        semanticScore: 0,
        exactOverlap: 0,
        status: "rejected",
        rejectionReason: "Candidate discovered — source verification unavailable",
      });
      continue;
    }
    if (verificationSource === "full_text") {
      fullTextCount++;
      retrievedUrls.push(cand.url);
    } else {
      abstractFallbackCount++;
      retrievedUrls.push(`${cand.url} [abstract]`);
    }

    const srcSlice = srcText.slice(0, 25_000);
    const exact = runExact(eligibleText, srcSlice);
    const near  = runNear(eligibleText, srcSlice, exact.ranges);

    // Run semantic model only when needed and on uncovered sections
    let sem = { spans: [] as MatchedSpan[], ranges: [] as Array<[number, number]>, used: false };
    if (!options?.fastMode && exact.ranges.length === 0 && near.ranges.length === 0) {
      const semCtrl = new AbortController();
      const semTimer = setTimeout(() => semCtrl.abort(), FETCH_TO_MS);
      sem = await runSemantic(eligibleText, srcSlice, apiKey, [...exact.ranges, ...near.ranges], semCtrl.signal);
      clearTimeout(semTimer);
      if (sem.used) {
        geminiUsed = true;
        providerStatus.gemini.status = "ok";
        providerStatus.gemini.state = "operational";
        providerStatus.gemini.queriesSent++;
      }
    }

    const verifiedSpans = [...exact.spans, ...near.spans, ...sem.spans.filter((s) => s.matchType === "paraphrase")];
    const candidateSpans = sem.spans.filter((s) => s.matchType === "candidate");
    const allSpans = [...verifiedSpans, ...candidateSpans];

    const isAccepted = verifiedSpans.length > 0 || candidateSpans.length > 0;
    matchEvaluations.push({
      passageSearched: cand.recoveredQueries?.[0] ?? "document passage",
      provider: cand.provider,
      candidateUrl: cand.url,
      sourceRetrieved: true,
      lexicalScore: exact.spans.length ? 1.0 : (near.spans.length ? near.spans[0].spanSimilarity : 0),
      semanticScore: sem.spans.length ? sem.spans[0].spanSimilarity : 0,
      exactOverlap: exact.ranges.length,
      status: isAccepted ? "accepted" : "rejected",
      rejectionReason: isAccepted ? undefined : "Lexical and semantic similarity below threshold",
    });

    if (!allSpans.length) continue;

    const verifiedRanges = [
      ...exact.ranges,
      ...near.ranges,
      ...sem.spans.filter((s) => s.matchType === "paraphrase").map((s) => [s.submittedStart, s.submittedEnd] as [number, number]),
    ];
    const verifiedCoverage = uniqueCoverage(verifiedRanges, eligibleChars);
    const sourceCov = Math.round((verifiedCoverage / eligibleChars) * 100);

    if (!sourceCov && !candidateSpans.length) continue;

    const priorAllRanges = [...allExact, ...allNear, ...allParaphrase];
    const priorCoverage = uniqueCoverage(priorAllRanges, eligibleChars);
    const postCoverage = uniqueCoverage([...priorAllRanges, ...verifiedRanges], eligibleChars);
    const sourceUniqueCov = Math.max(0, Math.round(((postCoverage - priorCoverage) / eligibleChars) * 100));

    if (cand.provider === "crossref") providerStatus.crossref.verifiedSources++;
    if (cand.provider === "openalex") providerStatus.openalex.verifiedSources++;
    if (cand.provider === "exa") providerStatus.exa.verifiedSources++;
    if (cand.provider === "web") providerStatus.webSearch.verifiedSources++;

    sources.push({
      title: cand.title,
      doi: cand.doi,
      url: cand.url,
      publisher: cand.publisher,
      provider: cand.provider,
      matchContribution: sourceCov,
      uniqueContribution: sourceUniqueCov,
      citedMaterial: hasCitations,
      matchedSpans: allSpans,
      similarity: Math.round(Math.max(...allSpans.map((s) => s.spanSimilarity)) * 100),
      matchType: dominantType(allSpans),
      verified: verifiedSpans.length > 0,
      queryRecovery: cand.queryRecovery,
      discoveryScore: cand.discoveryScore,
      verificationSource,
    });

    allExact.push(...exact.ranges);
    allNear.push(...near.ranges);
    allParaphrase.push(...sem.spans.filter((s) => s.matchType === "paraphrase").map((s) => [s.submittedStart, s.submittedEnd] as [number, number]));
    allSem.push(...sem.spans.filter((s) => s.matchType === "candidate").map((s) => [s.submittedStart, s.submittedEnd] as [number, number]));
  }

  // STAGE D: SCORING & TRANSPARENCY TELEMETRY
  // Requirement 10: Plagiarism similarity primarily uses UNIQUE VERIFIED MATCHED COVERAGE
  const verifiedRanges = [...allExact, ...allNear, ...allParaphrase];
  const tokenOffsets = tokeniseWithOffsets(eligibleText);
  const matchedWordIndices = new Set<number>();

  for (let i = 0; i < tokenOffsets.length; i++) {
    const { start, end } = tokenOffsets[i];
    const isCovered = verifiedRanges.some(([s, e]) => start >= s && end <= e);
    if (isCovered) {
      matchedWordIndices.add(i);
    }
  }

  const uniqueMatchedWords = matchedWordIndices.size;
  const totalWords = tokenOffsets.length || words.length || 1;
  const uniqueWordSimilarityPercentage = Math.min(100, Math.round((uniqueMatchedWords / totalWords) * 100));

  const exactCoveredWords = new Set<number>();
  for (let i = 0; i < tokenOffsets.length; i++) {
    const { start, end } = tokenOffsets[i];
    if (allExact.some(([s, e]) => start >= s && end <= e)) exactCoveredWords.add(i);
  }
  const nearCoveredWords = new Set<number>();
  for (let i = 0; i < tokenOffsets.length; i++) {
    const { start, end } = tokenOffsets[i];
    if (allNear.some(([s, e]) => start >= s && end <= e)) nearCoveredWords.add(i);
  }
  const paraCoveredWords = new Set<number>();
  for (let i = 0; i < tokenOffsets.length; i++) {
    const { start, end } = tokenOffsets[i];
    if (allParaphrase.some(([s, e]) => start >= s && end <= e)) paraCoveredWords.add(i);
  }

  const simScore = uniqueWordSimilarityPercentage;
  const exactScore = Math.min(100, Math.round((exactCoveredWords.size / totalWords) * 100));
  const nearScore = Math.min(100, Math.round((nearCoveredWords.size / totalWords) * 100));
  const paraphraseScore = Math.min(100, Math.round((paraCoveredWords.size / totalWords) * 100));
  const semScore = Math.round((uniqueCoverage(allSem, eligibleChars) / eligibleChars) * 100);

  // Requirement 7: Honest Coverage Tracking
  const totalZones = 5;
  const zonesSearched = new Set(queryPlan.map((q) => q.zone)).size;
  const passagesGenerated = totalZones * 3;
  const passagesSearched = zonesSearched * 3;
  const providerRequestsCompleted =
    providerStatus.crossref.queriesSent +
    providerStatus.openalex.queriesSent +
    providerStatus.exa.queriesSent +
    providerStatus.webSearch.queriesSent;

  const totalEvaluatedProviders = 4;
  const operationalSearchRatio = operationalSearchProviders.length / totalEvaluatedProviders;
  const passageRatio = passagesGenerated > 0 ? passagesSearched / passagesGenerated : 1;
  const actualCoveragePercentage = Math.min(100, Math.round(passageRatio * operationalSearchRatio * 100));

  const diagnostics = {
    submittedChars: eligibleChars,
    submittedWords: words.length,
    sentenceCount: sentences.length,
    passagesGenerated,
    passagesSearched,
    queriesGenerated: queryPlan.length,
    providerRequestsCompleted,
    queryStrategy: "5-Zone Document Sampling + Sentence-Pair Distinctiveness + 5-Tier Fallback Ladder",
    queriesSentByProvider,
    providersResponded: {
      crossref: providerStatus.crossref.status === "ok",
      openalex: providerStatus.openalex.status === "ok",
      exa: providerStatus.exa.status === "ok",
      webSearch: providerStatus.webSearch.status === "ok",
    },
    providerStates: {
      crossref: providerStatus.crossref.state ?? "not_checked",
      openalex: providerStatus.openalex.state ?? "not_checked",
      exa: providerStatus.exa.state ?? "not_checked",
      webSearch: providerStatus.webSearch.state ?? "not_checked",
    },
    candidatesReturnedByProvider: {
      crossref: providerStatus.crossref.candidatesReturned,
      openalex: providerStatus.openalex.candidatesReturned,
      exa: providerStatus.exa.candidatesReturned,
      webSearch: providerStatus.webSearch.candidatesReturned,
    },
    retrievedUrls,
    fullTextRetrievedCount: fullTextCount,
    abstractSnippetFallbackCount: abstractFallbackCount,
    failedRetrievalsCount: failedRetrievalCount,
    candidatePassagesReachingMatcher: candidatesToRetrieve.length,
    exactMatchesFound: allExact.length,
    nearMatchesFound: allNear.length,
    verifiedParaphrasesFound: allParaphrase.length,
    candidateSimilaritiesFound: allSem.length,
    uniqueMatchedWords,
    uniqueMatchedWordsPercentage: uniqueWordSimilarityPercentage,
    actualCoveragePercentage,
    calculatedSimilarityPercentage: simScore,
    scoringFormula: "uniqueMatchedWords(Exact + Near + VerifiedParaphrase) / totalWords * 100",
    matchEvaluations,
    unverifiedCandidates,
  };

  // Requirement 6: Do not confuse failure with zero results
  if (!sources.length) {
    const isLimited = anyFailed || actualCoveragePercentage < 60;
    return {
      status: anyFailed ? "partial" : "no_verified_matches",
      similarityScore: 0,
      originalityScore: isLimited ? 0 : 100,
      exactMatchScore: 0,
      nearMatchScore: 0,
      paraphraseMatchScore: 0,
      semanticMatchScore: 0,
      riskLevel: isLimited ? "Limited Coverage" : "None",
      sources: [],
      coverageNote: isLimited
        ? "No verified matches found in completed searches. Assessment confidence is limited by partial source coverage."
        : "No overlapping passages detected in verified sources.",
      providerStatus,
      diagnostics,
      ...(anyFailed ? { errorMessage: "Analysis incomplete: Some source databases could not be reached." } : {}),
    };
  }

  // Merge sources describing the same underlying work
  const mergedSources: VerifiedSource[] = [];
  const seenTitles = new Map<string, number>();
  for (const s of sources.sort((a, b) => b.matchContribution - a.matchContribution)) {
    const key = normalise(s.title ?? "").replace(/[^a-z0-9]+/g, "").slice(0, 80);
    const prior = key ? seenTitles.get(key) : undefined;
    if (prior !== undefined) {
      const keeper = mergedSources[prior];
      if (keeper.verificationSource !== "full_text" && s.verificationSource === "full_text") {
        keeper.url = s.url;
        keeper.verificationSource = "full_text";
      }
      continue;
    }
    if (key) seenTitles.set(key, mergedSources.length);
    mergedSources.push(s);
  }

  return {
    status: anyFailed ? "partial" : "completed",
    similarityScore: simScore,
    originalityScore: 100 - simScore,
    exactMatchScore: exactScore,
    nearMatchScore: nearScore,
    paraphraseMatchScore: paraphraseScore,
    semanticMatchScore: semScore,
    riskLevel: riskLevel(simScore),
    sources: mergedSources,
    coverageNote: anyFailed
      ? "Analysis partial: Some secondary registries were unreachable, but verified matches were confirmed in operational databases."
      : COVERAGE_NOTE,
    providerStatus,
    diagnostics,
    ...(anyFailed ? { errorMessage: "Some source providers could not be reached, but verified matches were recovered from active registries." } : {}),
  };
}

// ─── HTTP Handler ─────────────────────────────────────────────────────────────

if (import.meta.main) {
  serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

    try {
      const supabase = createServiceClient();
      const timezone = getTimezone(req);

      let body: Record<string, any> = {};
      const hasBody = req.method === "POST" || req.method === "PUT" || req.method === "PATCH";
      if (hasBody) {
        try {
          const raw = await req.text();
          body = raw ? JSON.parse(raw) : {};
        } catch {
          body = {};
        }
      }

      // DIAGNOSTIC AUDIT ACTION: Test all providers from the deployed runtime
      if (body.action === "audit_providers") {
        const env = Deno.env.toObject();
        const safeEnvKeys = Object.keys(env).map(k => ({
          key: k,
          present: Boolean(env[k]),
          length: env[k] ? env[k].length : 0,
        }));

        // 1. Audit Google/Web
        const googleKey = Deno.env.get("GOOGLE_SEARCH_API_KEY") || Deno.env.get("GOOGLE_API_KEY") || Deno.env.get("GOOGLE_CSE_KEY") || "";
        const googleCx = Deno.env.get("GOOGLE_SEARCH_CX") || Deno.env.get("GOOGLE_CX") || Deno.env.get("GOOGLE_CSE_CX") || "";
        let googleAudit: any = {
          operational: false,
          hasApiKey: Boolean(googleKey),
          hasCx: Boolean(googleCx),
          keyName: Deno.env.get("GOOGLE_SEARCH_API_KEY") ? "GOOGLE_SEARCH_API_KEY" : (Deno.env.get("GOOGLE_API_KEY") ? "GOOGLE_API_KEY" : null),
          cxName: Deno.env.get("GOOGLE_SEARCH_CX") ? "GOOGLE_SEARCH_CX" : (Deno.env.get("GOOGLE_CX") ? "GOOGLE_CX" : null),
          httpStatus: null,
          resultsCount: 0,
          failureReason: null,
          sampleResult: null,
        };
        if (!googleKey || !googleCx) {
          googleAudit.failureReason = !googleKey && !googleCx
            ? "Missing both GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_CX"
            : (!googleKey ? "Missing GOOGLE_SEARCH_API_KEY" : "Missing GOOGLE_SEARCH_CX");
        } else {
          try {
            const gUrl = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(googleKey)}&cx=${encodeURIComponent(googleCx)}&q=Attention+Is+All+You+Need&num=3`;
            const gResp = await fetch(gUrl);
            googleAudit.httpStatus = gResp.status;
            if (gResp.ok) {
              const gData = await gResp.json();
              const items = gData?.items || [];
              googleAudit.operational = true;
              googleAudit.resultsCount = items.length;
              googleAudit.sampleResult = items[0] ? { title: items[0].title, link: items[0].link } : null;
            } else {
              const errBody = await gResp.text();
              googleAudit.failureReason = `Google search returned HTTP ${gResp.status}: ${errBody.slice(0, 200)}`;
            }
          } catch (e: any) {
            googleAudit.failureReason = e?.message || "Outbound fetch error";
          }
        }

        // 2. Audit Crossref
        let crossrefAudit: any = {
          operational: false,
          httpStatus: null,
          candidatesReturned: 0,
          failureReason: null,
          sampleResult: null,
        };
        try {
          const crUrl = `https://api.crossref.org/works?query=Attention+Is+All+You+Need&rows=3&select=DOI,title,URL,publisher,abstract&mailto=plagiarism@aidetector.cx`;
          const crResp = await fetch(crUrl);
          crossrefAudit.httpStatus = crResp.status;
          if (crResp.ok) {
            const crData = await crResp.json();
            const items = crData?.message?.items || [];
            crossrefAudit.operational = true;
            crossrefAudit.candidatesReturned = items.length;
            crossrefAudit.sampleResult = items[0] ? { title: items[0].title?.[0], doi: items[0].DOI } : null;
          } else {
            crossrefAudit.failureReason = `Crossref HTTP ${crResp.status}`;
          }
        } catch (e: any) {
          crossrefAudit.failureReason = e?.message || "Crossref fetch error";
        }

        // 3. Audit OpenAlex
        let openalexAudit: any = {
          operational: false,
          httpStatus: null,
          candidatesReturned: 0,
          failureReason: null,
          sampleResult: null,
        };
        try {
          const oaUrl = `https://api.openalex.org/works?search=Attention+Is+All+You+Need&per-page=3&select=id,doi,title,primary_location,abstract_inverted_index&mailto=plagiarism@aidetector.cx`;
          const oaResp = await fetch(oaUrl);
          openalexAudit.httpStatus = oaResp.status;
          if (oaResp.ok) {
            const oaData = await oaResp.json();
            const items = oaData?.results || [];
            openalexAudit.operational = true;
            openalexAudit.candidatesReturned = items.length;
            openalexAudit.sampleResult = items[0] ? { title: items[0].title, doi: items[0].doi } : null;
          } else {
            openalexAudit.failureReason = `OpenAlex HTTP ${oaResp.status}`;
          }
        } catch (e: any) {
          openalexAudit.failureReason = e?.message || "OpenAlex fetch error";
        }

        // 4. Audit Exa
        const exaKey = Deno.env.get("EXA_API_KEY") || "";
        let exaAudit: any = {
          operational: false,
          hasApiKey: Boolean(exaKey),
          httpStatus: null,
          candidatesReturned: 0,
          failureReason: null,
        };
        if (exaKey) {
          try {
            const exa = new Exa(exaKey);
            const exaRes = await exa.search("Attention Is All You Need", { numResults: 3 });
            exaAudit.operational = true;
            exaAudit.candidatesReturned = exaRes.results?.length || 0;
          } catch (e: any) {
            exaAudit.failureReason = e?.message || "Exa query error";
          }
        } else {
          exaAudit.failureReason = "Missing EXA_API_KEY";
        }

        return jsonResponse({
          envKeys: safeEnvKeys,
          google: googleAudit,
          crossref: crossrefAudit,
          openalex: openalexAudit,
          exa: exaAudit,
        });
      }

      let userId: string | null = null;
      let guestId: string | null = null;
      let isApiKey = false;
      try {
        const identity = await resolveAuthUserOrGuest(supabase, req);
        userId = identity.user?.id ?? null;
        guestId = identity.guestId ?? null;
        isApiKey = identity.isApiKey;
      } catch (err: any) {
        console.error("[plagiarism-checker] identity resolution failed:", err?.message);
        return jsonResponse(
          { success: false, error: "Authorization could not be established. Please retry.", retryable: true },
          503
        );
      }

      const featureSlug = "plagiarism_checker";
      const idempotencyKey = req.headers.get("x-idempotency-key") || null;
      let reservation;
      try {
        reservation = await reserveEntitlement(supabase, {
          userId,
          guestId,
          featureSlug,
          creditsCost: 10,
          unitQuantity: Math.max(1, String(body.text ?? '').trim().split(/\s+/).filter(Boolean).length),
          timezone,
          idempotencyKey,
          metadata: { is_api_key: isApiKey },
        });
      } catch (err: any) {
        console.error("[plagiarism-checker] reservation failed:", err?.message);
        return jsonResponse(
          { success: false, error: "Billing authorization temporarily unavailable. Please retry.", retryable: true },
          503
        );
      }

      if (!reservation.allowed) {
        const isInsufficientCredits = reservation.errorCode === 'INSUFFICIENT_CREDITS';
        return jsonResponse(
          {
            success: false,
            error: reservation.reason || (isInsufficientCredits
              ? "Insufficient credits for this operation. Please top up or renew your plan to continue."
              : "This feature requires an active subscription or credits."),
            error_code: reservation.errorCode || (isInsufficientCredits ? "INSUFFICIENT_CREDITS" : "UPGRADE_REQUIRED"),
            errorCode: reservation.errorCode || (isInsufficientCredits ? "INSUFFICIENT_CREDITS" : "UPGRADE_REQUIRED"),
            upgrade_required: !isInsufficientCredits,
            remaining: reservation.trialChecksRemaining,
            limit: reservation.trialChecksTotal,
            plan: reservation.plan,
            credits_balance: reservation.remainingCredits,
          },
          403
        );
      }

      const text = typeof body.text === "string" ? body.text.trim() : "";
      if (!text) {
        if (reservation.reservationId) {
          await finalizeReservation(supabase, { reservationId: reservation.reservationId, outcome: "failed", errorReason: "text_required", timezone }).catch(() => {});
        }
        return jsonResponse({ status: "insufficient_text", errorMessage: "Text is required." }, 400);
      }

      if (text.length > MAX_TEXT_CHARS) {
        if (reservation.reservationId) {
          await finalizeReservation(supabase, { reservationId: reservation.reservationId, outcome: "failed", errorReason: "length_exceeded", timezone }).catch(() => {});
        }
        return jsonResponse({ status: "insufficient_text", errorMessage: `Text exceeds ${MAX_TEXT_CHARS} character limit.` }, 400);
      }

      const apiKey = Deno.env.get("INTEGRATIONS_API_KEY") ?? "";
      if (!apiKey) {
        if (reservation.reservationId) {
          await finalizeReservation(supabase, { reservationId: reservation.reservationId, outcome: "failed", errorReason: "missing_api_key", timezone }).catch(() => {});
        }
        return jsonResponse({ status: "provider_unavailable", errorMessage: "Server configuration error." }, 503);
      }

      const result = await runAnalysis(text, apiKey, body.options);

      if (reservation.reservationId) {
        await finalizeReservation(supabase, { reservationId: reservation.reservationId, outcome: "success", timezone }).catch(() => {});
      }

      return jsonResponse(result);
    } catch (err: unknown) {
      console.error("plagiarism-checker error:", err instanceof Error ? err.message : err);
      return jsonResponse({ status: "analysis_failed", errorMessage: "Analysis failed. Please try again." }, 500);
    }
  });
}
