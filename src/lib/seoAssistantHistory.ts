import type {
  OverallScores, KeywordUsageResult, SemanticKeywordsResult, SearchIntentResult,
  ReadabilityResult, SentenceAnalysisResult, ParagraphAnalysisResult,
  TransitionWordsResult, GrammarResult, HeadingStructureResult,
  EEATResult, EngagementResult, SnippetResult,
  AIRiskResult, UniquenessResult, MetaResult,
} from '@/pages/seo-assistant/analysisEngine';
import type { BalancedDetectorResult } from '@/lib/detection/balancedDetectorService';
import type { PlagiarismAnalysisResult } from '@/pages/detector/detectionEngine';
import type { RegisterResult } from '@/lib/verifiedAuthorship/authorshipService';

export interface SEOAnalysisSnapshot {
  kwResult: KeywordUsageResult;
  semanticResult: SemanticKeywordsResult;
  intentResult: SearchIntentResult;
  readabilityResult: ReadabilityResult;
  sentenceResult: SentenceAnalysisResult;
  paraResult: ParagraphAnalysisResult;
  transitionResult: TransitionWordsResult;
  grammarResult: GrammarResult;
  headingResult: HeadingStructureResult;
  eeatResult: EEATResult;
  engagementResult: EngagementResult;
  snippetResult: SnippetResult;
  aiRiskResult: AIRiskResult;
  uniquenessResult: UniquenessResult;
  metaResult: MetaResult;
  balancedResult?: BalancedDetectorResult | null;
  plagiarismResult?: PlagiarismAnalysisResult | null;
  authorshipResult?: RegisterResult | null;
}

export interface SEOAnalysisHistoryItem {
  id: string;
  title: string;
  keyword: string;
  wordCount: number;
  creditCost: number;
  content: string;
  scores: OverallScores;
  snapshot: SEOAnalysisSnapshot;
  createdAt: number;
  contentHash: string;
}

const STORAGE_KEY = 'aidetector_seo_history';
const MAX_HISTORY_ITEMS = 40;

/**
 * Fast deterministic content hash for duplicate-analysis detection.
 */
export function generateContentHash(text: string, keyword: string = ''): string {
  const normText = text.trim().replace(/\s+/g, ' ');
  const normKw = keyword.trim().toLowerCase();
  const raw = `${normKw}:::${normText}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `hash_${Math.abs(hash).toString(36)}_${raw.length}`;
}

/**
 * Extract clean title from Markdown or first line.
 */
export function extractArticleTitle(content: string, keyword?: string): string {
  if (!content.trim()) return keyword ? `Analysis for "${keyword}"` : 'Untitled Article';
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match && h1Match[1]?.trim()) {
    return h1Match[1].trim();
  }
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    const firstLine = lines[0].replace(/^[#*\-_\s]+/, '').slice(0, 70);
    return firstLine.trim() || (keyword ? `Analysis for "${keyword}"` : 'Untitled Article');
  }
  return keyword ? `Analysis for "${keyword}"` : 'Untitled Article';
}

/**
 * Retrieve saved SEO analyses from localStorage.
 */
export function getSEOAssistantHistory(): SEOAnalysisHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load SEO history:', e);
  }
  return [];
}

/**
 * Save a newly completed SEO analysis to history.
 */
export function saveSEOAssistantHistoryItem(item: SEOAnalysisHistoryItem): void {
  try {
    const current = getSEOAssistantHistory();
    // Filter out existing exact duplicate hash if present to update to latest
    const filtered = current.filter(h => h.id !== item.id && h.contentHash !== item.contentHash);
    const updated = [item, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save SEO history item:', e);
  }
}

/**
 * Delete a specific history item.
 */
export function deleteSEOAssistantHistoryItem(id: string): SEOAnalysisHistoryItem[] {
  try {
    const current = getSEOAssistantHistory();
    const updated = current.filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete SEO history item:', e);
    return getSEOAssistantHistory();
  }
}

/**
 * Clear all SEO analyses history.
 */
export function clearSEOAssistantHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear SEO history:', e);
  }
}
