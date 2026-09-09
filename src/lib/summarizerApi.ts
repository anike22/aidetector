/**
 * Frontend API client for the AI Summarizer.
 * Mirrors the backend limits in supabase/functions/_shared/summarizerCore.ts
 * (parity is covered by src/__tests__/aiSummarizerCore.test.ts).
 */
import { supabase } from '@/db/supabase';
import { ensureGuestSession } from './visitorId';
import { checkEntitlement } from './entitlementsApi';

export type SummaryLength = 'short' | 'medium' | 'detailed';
export type SummaryFormat = 'paragraphs' | 'bullets' | 'takeaways';

export const MIN_INPUT_WORDS = 60;
export const MAX_INPUT_WORDS = 10000;
export const TRIAL_MAX_WORDS = 2000;
export const CREDITS_PER_1000_WORDS = 2;

export const SUPPORTED_LANGUAGES: string[] = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch',
  'Polish', 'Russian', 'Turkish', 'Arabic', 'Hindi', 'Indonesian', 'Japanese',
  'Korean', 'Chinese (Simplified)', 'Chinese (Traditional)', 'Vietnamese',
  'Thai', 'Ukrainian',
];

export const LENGTH_OPTIONS: { value: SummaryLength; label: string; description: string }[] = [
  { value: 'short', label: 'Short', description: 'A very condensed overview — roughly 5–12% of the source length.' },
  { value: 'medium', label: 'Medium', description: 'A balanced summary — roughly 10–25% of the source length.' },
  { value: 'detailed', label: 'Detailed', description: 'A thorough summary — roughly 20–45% of the source length.' },
];

export const FORMAT_OPTIONS: { value: SummaryFormat; label: string }[] = [
  { value: 'paragraphs', label: 'Paragraphs' },
  { value: 'bullets', label: 'Bullet Points' },
  { value: 'takeaways', label: 'Key Takeaways' },
];

export interface SummaryReference {
  claim: string;
  section_start: number;
  section_end: number;
  quote?: string;
  verified: 'exact' | 'range' | 'unverified';
}

export interface SummarizeResult {
  success: boolean;
  summary: {
    items: string[];
    format: SummaryFormat;
    label: string;
  };
  references: SummaryReference[];
  references_note?: string;
  stats: {
    input_words: number;
    output_words: number;
    reduction_pct: number;
  };
  settings: {
    length: SummaryLength;
    format: SummaryFormat;
    focus: string | null;
    language: string;
  };
  target_words: string;
  coverage: {
    mode: 'single-pass' | 'chunked';
    chunks: number;
    processed_chunks: number;
    full: boolean;
    note?: string;
  };
  notes?: string;
  validation: {
    passed: boolean;
    checks_run: string[];
    warnings: string[];
  };
  usage: {
    is_trial_check: boolean;
    credits_charged: number;
    trial_checks_remaining: number;
    remaining_credits: number;
  };
}

export interface SummarizeError {
  success: false;
  error: string;
  error_code?: string;
  upgrade_required?: boolean;
  retryable?: boolean;
  remaining?: number | null;
  limit?: number | null;
  plan?: string;
  trial_max_words?: number;
}

/** Runtime payload shape: success may be either literal depending on outcome. */
type SummarizePayload = Omit<Partial<SummarizeResult>, 'success'> &
  Omit<Partial<SummarizeError>, 'success'> & { success?: boolean };

export function countSummaryWords(text: string): number {
  const t = (text || '').trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

export function computeSummaryCreditCost(words: number): number {
  const w = Math.max(1, words || 0);
  return CREDITS_PER_1000_WORDS * Math.max(1, Math.ceil(w / 1000));
}

export interface CostPreview {
  isTrial: boolean;
  cost: number;
  trialBlockedByLength: boolean;
  allowed: boolean;
  reason: string | null;
  errorCode: string | null;
}

/** Preflight cost preview (exact charge shown before submission). */
export async function previewSummarizeCost(words: number): Promise<CostPreview> {
  if (words < MIN_INPUT_WORDS) {
    return { isTrial: false, cost: 0, trialBlockedByLength: false, allowed: false, reason: null, errorCode: null };
  }
  const cost = computeSummaryCreditCost(words);
  const check = await checkEntitlement('ai_summarizer', cost, { words });
  const trialBlockedByLength = words > TRIAL_MAX_WORDS && check.isTrialCheck;
  return {
    isTrial: check.isTrialCheck && !trialBlockedByLength,
    cost,
    trialBlockedByLength,
    allowed: check.allowed && !trialBlockedByLength,
    reason: check.reason,
    errorCode: check.errorCode ?? null,
  };
}

async function buildHeaders(): Promise<Record<string, string>> {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
  if (!session?.session?.access_token) {
    const guestId = await ensureGuestSession();
    if (guestId) headers['x-guest-id'] = guestId;
  }
  return headers;
}

export async function runSummarizer(params: {
  text: string;
  length: SummaryLength;
  format: SummaryFormat;
  focus?: string;
  language?: string;
  idempotencyKey: string;
}): Promise<SummarizeResult> {
  const headers = await buildHeaders();
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-summarizer`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text: params.text,
        length: params.length,
        format: params.format,
        focus: params.focus || undefined,
        language: params.language || 'English',
        idempotency_key: params.idempotencyKey,
      }),
    }
  );
  let payload: SummarizePayload | null = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (response.ok && payload?.success === true) {
    return payload as unknown as SummarizeResult;
  }
  const err = new Error(payload?.error || 'Summarization failed. Please try again.') as Error & SummarizeError;
  err.error_code = payload?.error_code || 'SUMMARIZATION_FAILED';
  err.upgrade_required = payload?.upgrade_required ?? false;
  err.retryable = payload?.retryable ?? true;
  err.remaining = payload?.remaining ?? null;
  err.limit = payload?.limit ?? null;
  err.plan = payload?.plan;
  err.trial_max_words = payload?.trial_max_words;
  throw err;
}

/** Builds the plain-text export of a completed summary. */
export function buildSummaryTxt(result: SummarizeResult): string {
  const lines: string[] = [];
  lines.push('AI-Generated Summary — AIDetector.cx');
  lines.push('');
  if (result.summary.format === 'paragraphs') {
    result.summary.items.forEach((item) => {
      lines.push(item);
      lines.push('');
    });
  } else {
    result.summary.items.forEach((item) => {
      lines.push(`• ${item}`);
    });
    lines.push('');
  }
  lines.push('---');
  lines.push(`Input: ${result.stats.input_words.toLocaleString('en-US')} words`);
  lines.push(`Output: ${result.stats.output_words.toLocaleString('en-US')} words (${result.stats.reduction_pct}% shorter)`);
  lines.push(`Length: ${result.settings.length} | Format: ${result.settings.format} | Language: ${result.settings.language}`);
  if (result.settings.focus) lines.push(`Focus: ${result.settings.focus}`);
  lines.push(`Coverage: ${result.coverage.mode}${result.coverage.full ? ' (full document)' : ' (partial)'}`);
  lines.push('');
  lines.push('Source references');
  result.references.forEach((ref, i) => {
    lines.push(`${i + 1}. ${ref.claim} [Section ${ref.section_start}${ref.section_end !== ref.section_start ? `–${ref.section_end}` : ''}]`);
    if (ref.quote) lines.push(`   Quote: "${ref.quote}"${ref.verified === 'unverified' ? ' (could not be matched exactly)' : ''}`);
  });
  lines.push('');
  lines.push('This summary was AI-generated from the supplied material. Source references show where a statement came from; they do not independently verify the source.');
  return lines.join('\n');
}
