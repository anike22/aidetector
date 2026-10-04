/**
 * Blogger Keyword Metrics & Evaluation Engine.
 *
 * IMPORTANT: This module must never invent authoritative SEO metrics.
 * Provider-backed values can be supplied when Google Ads / SERP data is connected.
 * Until then, unavailable metrics are labelled explicitly.
 */

export type SearchIntent = 'Informational' | 'Commercial' | 'Transactional' | 'Navigational';
export type DifficultyLabel = 'Easy' | 'Moderate' | 'Challenging' | 'Competitive' | 'Unavailable';

export interface LiveKeywordMetric {
  keyword: string;
  searchVolume?: number | null;
  difficulty?: number | null;
  cpc?: number | string | null;
  intent?: SearchIntent | null;
  source?: string;
  country?: string;
  period?: string;
}

export interface CompetitorPageMetric {
  url: string;
  wordCount: number;
}

export interface BloggerMetricsEvidence {
  keywords?: LiveKeywordMetric[];
  competitors?: CompetitorPageMetric[];
  serpFeatures?: string[];
}

export interface KeywordEvaluationItem {
  keyword: string;
  difficulty: number | null;
  difficultyLabel: DifficultyLabel;
  difficultyColor: string;
  searchVolume: number | null;
  searchVolumeFormatted: string;
  intent: SearchIntent;
  cpc: string;
  source: string;
}

export interface RecommendedWordCount {
  minWords: number | null;
  maxWords: number | null;
  targetWords: number | null;
  rangeText: string;
  rationale: string;
  competitorCount: number;
}

export interface BloggerKeywordEvaluationResult {
  primary: KeywordEvaluationItem;
  related: KeywordEvaluationItem[];
  recommendedWordCount: RecommendedWordCount;
  competitiveDepth: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Unavailable';
  serpFeatures: string[];
  evaluatedAt: number;
  dataSource: string;
  isLiveData: boolean;
}

function determineIntent(keyword: string): SearchIntent {
  const lower = keyword.toLowerCase();
  if (/\b(buy|order|discount|coupon|deal|price|pricing|cheap|hire|shop)\b/.test(lower)) return 'Transactional';
  if (/\b(best|top|review|vs|comparison|alternative|features|worth|checker|detector|tool)\b/.test(lower)) return 'Commercial';
  if (/\b(login|portal|signin|official|app|website|download)\b/.test(lower)) return 'Navigational';
  return 'Informational';
}

function difficultyPresentation(value: number | null): {
  label: DifficultyLabel;
  color: string;
} {
  if (value == null || !Number.isFinite(value)) return { label: 'Unavailable', color: 'text-muted-foreground' };
  if (value < 35) return { label: 'Easy', color: 'text-success' };
  if (value < 60) return { label: 'Moderate', color: 'text-sky-500' };
  if (value < 80) return { label: 'Challenging', color: 'text-warning' };
  return { label: 'Competitive', color: 'text-destructive' };
}

function formatVolume(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return 'Unavailable';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M/mo`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K/mo`;
  return `${Math.round(value).toLocaleString()}/mo`;
}

function formatCpc(value: number | string | null | undefined): string {
  if (value == null || value === '') return 'Unavailable';
  if (typeof value === 'number') return Number.isFinite(value) ? `$${value.toFixed(2)}` : 'Unavailable';
  const numeric = Number(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) ? `$${numeric.toFixed(2)}` : 'Unavailable';
}

function evaluateSingleKeyword(keyword: string, evidence?: LiveKeywordMetric): KeywordEvaluationItem {
  const clean = keyword.trim();
  const rawDifficulty = evidence?.difficulty;
  const difficulty = typeof rawDifficulty === 'number' && Number.isFinite(rawDifficulty)
    ? Math.max(0, Math.min(100, rawDifficulty))
    : null;
  const rawVolume = evidence?.searchVolume;
  const searchVolume = typeof rawVolume === 'number' && Number.isFinite(rawVolume) && rawVolume >= 0
    ? rawVolume
    : null;
  const presentation = difficultyPresentation(difficulty);

  return {
    keyword: clean,
    difficulty,
    difficultyLabel: presentation.label,
    difficultyColor: presentation.color,
    searchVolume,
    searchVolumeFormatted: formatVolume(searchVolume),
    intent: evidence?.intent || determineIntent(clean),
    cpc: formatCpc(evidence?.cpc),
    source: evidence?.source || 'Live provider not connected',
  };
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

/**
 * Derive the content target only from measured ranking-page word counts.
 * A minimum of three valid competitor pages prevents false precision.
 * IQR filtering removes extreme thin/long outliers before P25/P75 targeting.
 */
function calculateRecommendedWordCount(competitors: CompetitorPageMetric[] = []): RecommendedWordCount {
  const measured = competitors
    .map(item => Number(item.wordCount))
    .filter(value => Number.isFinite(value) && value >= 250 && value <= 25_000)
    .sort((a, b) => a - b);

  if (measured.length < 3) {
    return {
      minWords: null,
      maxWords: null,
      targetWords: null,
      rangeText: 'Awaiting live SERP data',
      rationale: 'Connect live SERP competitor data to calculate this target from measured ranking-page content. No synthetic word-count target is shown.',
      competitorCount: measured.length,
    };
  }

  const q1 = percentile(measured, 0.25);
  const q3 = percentile(measured, 0.75);
  const iqr = q3 - q1;
  const lowerFence = Math.max(250, q1 - (1.5 * iqr));
  const upperFence = q3 + (1.5 * iqr);
  const filtered = measured.filter(value => value >= lowerFence && value <= upperFence);
  const sample = filtered.length >= 3 ? filtered : measured;

  const minWords = Math.round(percentile(sample, 0.25) / 50) * 50;
  const targetWords = Math.round(percentile(sample, 0.5) / 50) * 50;
  const maxWords = Math.round(percentile(sample, 0.75) / 50) * 50;

  return {
    minWords,
    maxWords,
    targetWords,
    rangeText: `${minWords.toLocaleString()} – ${maxWords.toLocaleString()} words`,
    rationale: `Based on measured main-content word counts from ${sample.length} ranking competitor pages (25th–75th percentile after outlier filtering).`,
    competitorCount: sample.length,
  };
}

export function evaluateBloggerKeywords(
  primaryKeyword: string,
  relatedKeywords: string[] = [],
  evidence: BloggerMetricsEvidence = {}
): BloggerKeywordEvaluationResult {
  const lookup = new Map(
    (evidence.keywords || []).map(item => [item.keyword.trim().toLowerCase(), item])
  );

  const primary = evaluateSingleKeyword(primaryKeyword, lookup.get(primaryKeyword.trim().toLowerCase()));
  const related = (relatedKeywords || [])
    .slice(0, 3)
    .map(keyword => evaluateSingleKeyword(keyword, lookup.get(keyword.trim().toLowerCase())));

  const recommendedWordCount = calculateRecommendedWordCount(evidence.competitors || []);

  let competitiveDepth: BloggerKeywordEvaluationResult['competitiveDepth'] = 'Unavailable';
  if (primary.difficulty != null) {
    competitiveDepth = primary.difficulty >= 75
      ? 'Very High'
      : primary.difficulty >= 55
        ? 'High'
        : primary.difficulty < 35
          ? 'Low'
          : 'Moderate';
  }

  const sources = new Set(
    [primary, ...related]
      .map(item => item.source)
      .filter(source => source && source !== 'Live provider not connected')
  );

  return {
    primary,
    related,
    recommendedWordCount,
    competitiveDepth,
    serpFeatures: evidence.serpFeatures || [],
    evaluatedAt: Date.now(),
    dataSource: sources.size ? Array.from(sources).join(', ') : 'Live provider not connected',
    isLiveData: primary.searchVolume != null || primary.difficulty != null || recommendedWordCount.targetWords != null,
  };
}
