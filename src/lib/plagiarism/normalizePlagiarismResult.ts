import type { PlagiarismAnalysisResult, VerifiedSource } from '@/pages/detector/detectionEngine';

type UnknownRecord = Record<string, unknown>;

const VALID_STATUSES = new Set([
  'completed',
  'partial',
  'no_verified_matches',
  'insufficient_text',
  'provider_unavailable',
  'analysis_failed',
]);

const numberOr = (value: unknown, fallback = 0): number => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : fallback;
};

const providerState = (value: unknown): 'ok' | 'failed' | 'skipped' | 'not_configured' =>
  value === 'ok' || value === 'failed' || value === 'skipped' || value === 'not_configured'
    ? value
    : 'skipped';

/**
 * Compatibility boundary for plagiarism-checker responses.
 *
 * Older deployed Edge Function versions can omit fields introduced by newer
 * clients (notably paraphraseMatchScore and Exa-aware metadata). UI code must
 * never render undefined/NaN and analytics must never receive non-finite scores.
 * This normalizer does NOT invent plagiarism evidence: absent evidence scores
 * become 0 and similarity is only preserved when the server supplied a finite
 * value.
 */
export function normalizePlagiarismResult(raw: unknown): PlagiarismAnalysisResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('PLAGIARISM_CHECK_UNAVAILABLE');
  }

  const data = raw as UnknownRecord;
  const status = typeof data.status === 'string' && VALID_STATUSES.has(data.status)
    ? data.status as PlagiarismAnalysisResult['status']
    : null;

  if (!status) throw new Error('PLAGIARISM_CHECK_UNAVAILABLE');

  const similarityScore = numberOr(data.similarityScore);
  const suppliedOriginality = numberOr(data.originalityScore, Number.NaN);
  const originalityScore = Number.isFinite(suppliedOriginality)
    ? suppliedOriginality
    : Math.max(0, 100 - similarityScore);

  const providerStatus = (data.providerStatus && typeof data.providerStatus === 'object')
    ? data.providerStatus as UnknownRecord
    : {};

  const rawSources = Array.isArray(data.sources) ? data.sources : [];
  const sources = rawSources.filter((source): source is VerifiedSource => Boolean(
    source && typeof source === 'object' && typeof (source as UnknownRecord).url === 'string'
  ));

  return {
    status,
    similarityScore,
    originalityScore,
    exactMatchScore: numberOr(data.exactMatchScore),
    nearMatchScore: numberOr(data.nearMatchScore),
    paraphraseMatchScore: numberOr(data.paraphraseMatchScore),
    semanticMatchScore: numberOr(data.semanticMatchScore),
    riskLevel: data.riskLevel === 'None' || data.riskLevel === 'Low' || data.riskLevel === 'Medium' || data.riskLevel === 'High' || data.riskLevel === 'Critical'
      ? data.riskLevel
      : similarityScore >= 60 ? 'Critical' : similarityScore >= 40 ? 'High' : similarityScore >= 20 ? 'Medium' : similarityScore > 0 ? 'Low' : 'None',
    sources,
    coverageNote: typeof data.coverageNote === 'string' && data.coverageNote.trim()
      ? data.coverageNote
      : 'Coverage information was not returned by the analysis service. No missing field is treated as evidence of originality.',
    providerStatus: {
      crossref: providerState(providerStatus.crossref) as 'ok' | 'failed' | 'skipped',
      openalex: providerState(providerStatus.openalex) as 'ok' | 'failed' | 'skipped',
      unpaywall: providerState(providerStatus.unpaywall) as 'ok' | 'failed' | 'skipped',
      gemini: providerState(providerStatus.gemini) as 'ok' | 'failed' | 'skipped',
      webSearch: providerState(providerStatus.webSearch),
    },
    errorMessage: typeof data.errorMessage === 'string' ? data.errorMessage : undefined,
    upgrade_required: data.upgrade_required === true,
    remaining: typeof data.remaining === 'number' ? data.remaining : null,
    limit: typeof data.limit === 'number' ? data.limit : null,
  };
}
