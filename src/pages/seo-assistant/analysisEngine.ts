// SEO Writing Assistant — Client-side analysis engine
// All functions are pure and run in-browser with no backend calls

export interface KeywordUsageResult {
  density: number;
  count: number;
  inH1: boolean;
  inIntro: boolean;
  inHeadings: boolean;
  inConclusion: boolean;
  inTitle?: boolean;
  recommendations: string[];
}

export interface ReadabilityResult {
  score: number; // Flesch Reading Ease 0-100
  label: 'Excellent' | 'Good' | 'Average' | 'Difficult';
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
}

export interface SentenceLocationItem {
  type: 'long_sentence' | 'very_long_sentence' | 'passive_voice';
  text: string;
  start: number;
  end: number;
  sentenceIndex: number;
  wordCount: number;
}

export interface SentenceAnalysisResult {
  longSentenceCount: number;
  passiveVoiceCount: number;
  totalSentences: number;
  longSentences: string[];
  veryLongSentences: string[];
  sentenceItems?: SentenceLocationItem[];
  passiveItems?: SentenceLocationItem[];
  recommendations: string[];
}

export interface ParagraphLocationItem {
  type: 'long_paragraph' | 'very_long_paragraph';
  text: string;
  start: number;
  end: number;
  paragraphIndex: number;
  wordCount: number;
}

export interface ParagraphAnalysisResult {
  longParagraphCount: number;
  veryLongParagraphCount: number;
  totalParagraphs: number;
  paragraphItems?: ParagraphLocationItem[];
  recommendations: string[];
}

export interface TransitionWordsResult {
  count: number;
  totalSentences: number;
  percentage: number;
  found: string[];
  missing: string[];
  recommendations: string[];
}

export interface HeadingItem {
  level: number;
  text: string;
  start: number;
  end: number;
}

export interface HeadingStructureResult {
  h1Count: number;
  h2Count: number;
  h3Count: number;
  headings: HeadingItem[];
  issues: string[];
  score: number;
}

// EEATResult interface imported from @/lib/seo/eeatIntelligenceEngine

export interface EngagementResult {
  score: number;
  questionCount: number;
  exampleCount: number;
  dataCount: number;
  recommendations: string[];
}

export interface SnippetResult {
  score: number;
  hasDefinition: boolean;
  hasList: boolean;
  hasTable: boolean;
  hasFAQ: boolean;
  recommendations: string[];
}

export interface AIRiskResult {
  humanScore: number;
  aiScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  recommendations: string[];
}

export interface WordOccurrenceItem {
  word: string;
  count: number;
  occurrences: { start: number; end: number; text: string; index: number }[];
}

export interface PhraseOccurrenceItem {
  phrase: string;
  count: number;
  occurrences: { start: number; end: number; text: string; index: number }[];
}

export interface UniquenessResult {
  score: number;
  duplicatePhrases: string[];
  overusedWords: string[];
  recommendations: string[];
  wordOccurrences?: WordOccurrenceItem[];
  phraseOccurrences?: PhraseOccurrenceItem[];
}

export interface CompetitorResult {
  url: string;
  title: string;
  wordCount: string;
}

export interface CompetitorKeywordCoverageItem {
  keyword: string;
  foundInPost: boolean;
  frequencyInPost: number;
  importance?: 'high' | 'medium' | 'low';
}

export interface ContentGapResult {
  missingKeywords: string[];
  missingHeadings: string[];
  missingFAQs: string[];
  competitorKeywords?: CompetitorKeywordCoverageItem[];
  coveragePercent?: number;
  coveredCount?: number;
  missingCount?: number;
  totalCompetitorKeywords?: number;
  targetWordCountRange?: string;
  recommendations?: string[];
}

export function computeCompetitorKeywordCoverage(
  content: string,
  rawMissingKeywords: string[] = [],
  rawAllCompetitorKeywords: string[] = [],
  rawHeadings: string[] = [],
  rawFAQs: string[] = []
): ContentGapResult {
  const normalizedContent = (content || '').toLowerCase();
  
  // Combine all candidate competitor keywords
  const candidateKeywords = Array.from(new Set([
    ...rawAllCompetitorKeywords,
    ...rawMissingKeywords,
  ])).filter(kw => kw && typeof kw === 'string' && kw.trim().length > 1);

  const competitorKeywords: CompetitorKeywordCoverageItem[] = candidateKeywords.map(kw => {
    const trimmed = kw.trim();
    const regex = new RegExp(`\\b${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = normalizedContent.match(regex);
    const frequencyInPost = matches ? matches.length : 0;
    const foundInPost = frequencyInPost > 0;
    return {
      keyword: trimmed,
      foundInPost,
      frequencyInPost,
      importance: trimmed.split(' ').length > 2 ? 'high' : 'medium',
    };
  });

  const coveredCount = competitorKeywords.filter(k => k.foundInPost).length;
  const totalCount = competitorKeywords.length;
  const coveragePercent = totalCount > 0 ? Math.round((coveredCount / totalCount) * 100) : 100;

  const missingKeywords = competitorKeywords.filter(k => !k.foundInPost).map(k => k.keyword);
  const missingCount = missingKeywords.length;

  const recommendations: string[] = [];
  if (missingKeywords.length > 0) {
    recommendations.push(`Incorporate high-value competitor keywords: ${missingKeywords.slice(0, 3).join(', ')}.`);
  }
  if (totalCount > 0 && coveragePercent < 70) {
    recommendations.push(`Competitor keyword coverage is currently ${coveragePercent}%. Target at least 70% to match top search competitors.`);
  } else if (totalCount > 0) {
    recommendations.push(`Strong competitor coverage (${coveragePercent}%). Maintain topical depth across sections.`);
  }

  return {
    missingKeywords,
    missingHeadings: rawHeadings,
    missingFAQs: rawFAQs,
    competitorKeywords,
    coveragePercent,
    coveredCount,
    missingCount,
    totalCompetitorKeywords: totalCount,
    recommendations,
  };
}

export interface MetaResult {
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedSlug: string;
  titleLength: number;
  descLength: number;
  titleOk: boolean;
  descOk: boolean;
}

import type { GrammarIssueItem, GrammarResult } from '@/lib/grammar/grammarEngine';
export type { GrammarIssueItem, GrammarResult };

import {
  type SemanticKeywordItem,
  type SemanticKeywordsResult,
  type SemanticCoverageStatus,
  type SemanticSourceType,
  type CompetitorEvidence,
  type CompetitorInput,
  analyzeSemanticKeywords as analyzeSemanticKeywordsCore,
  INITIAL_SEMANTIC_RESULT,
} from '@/lib/seo/semanticKeywordsEngine';

import {
  type EEATResult,
  type EEATOpportunity,
  type EEATEvidenceStatus,
  type EEATOpportunityType,
  type EEATDimensionScore,
  type DetectedClaim,
  type ExistingEEATSignals,
  analyzeEEAT as analyzeEEATCore,
} from '@/lib/seo/eeatIntelligenceEngine';

export type {
  SemanticKeywordItem,
  SemanticKeywordsResult,
  SemanticCoverageStatus,
  SemanticSourceType,
  CompetitorEvidence,
  CompetitorInput,
  EEATResult,
  EEATOpportunity,
  EEATEvidenceStatus,
  EEATOpportunityType,
  EEATDimensionScore,
  DetectedClaim,
  ExistingEEATSignals,
};
export { INITIAL_SEMANTIC_RESULT };

export interface SearchIntentResult {
  informational: number;
  commercial: number;
  transactional: number;
  navigational: number;
  dominant: string;
  matchPercent: number;
  recommendation: string;
}

export interface OverallScores {
  seo: number;
  readability: number;
  grammar: number;
  eeat: number;
  structure: number;
  engagement: number;
  overall: number;
  readyToPublish: boolean;
  publishingScore: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const m = word.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

export interface ParsedSentenceInfo {
  text: string;
  start: number;
  end: number;
  index: number;
  words: string[];
  isPassive: boolean;
}

export function getSentencesWithPositions(text: string): ParsedSentenceInfo[] {
  const sentences: ParsedSentenceInfo[] = [];
  const regex = /[^.!?]+(?:[.!?]+|$)/g;
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const leadingOffset = raw.indexOf(trimmed);
    const start = match.index + (leadingOffset !== -1 ? leadingOffset : 0);
    const end = start + trimmed.length;
    const words = trimmed.split(/\s+/).filter(Boolean);
    
    let isPassive = false;
    for (const p of PASSIVE_PATTERNS) {
      if (p.test(trimmed)) { isPassive = true; break; }
    }

    sentences.push({
      text: trimmed,
      start,
      end,
      index: idx++,
      words,
      isPassive,
    });
  }
  return sentences;
}

export interface ParsedParagraphInfo {
  text: string;
  start: number;
  end: number;
  index: number;
  words: string[];
}

export function getParagraphsWithPositions(text: string): ParsedParagraphInfo[] {
  const paragraphs: ParsedParagraphInfo[] = [];
  const parts = text.split(/\n{2,}/);
  let currentPos = 0;
  let idx = 0;
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed) {
      const matchIndex = text.indexOf(part, currentPos);
      const start = matchIndex !== -1 ? matchIndex + part.indexOf(trimmed) : currentPos;
      const end = start + trimmed.length;
      const words = trimmed.split(/\s+/).filter(Boolean);
      paragraphs.push({ text: trimmed, start, end, index: idx++, words });
      currentPos = end;
    }
  }
  return paragraphs;
}

export function getHeadingsWithPositions(text: string): { level: number; text: string; start: number; end: number }[] {
  const headings: { level: number; text: string; start: number; end: number }[] = [];
  const regex = /^(#{1,6})\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const level = match[1].length;
    const textContent = match[2].trim();
    const start = match.index;
    const end = match.index + match[0].length;
    headings.push({ level, text: textContent, start, end });
  }
  return headings;
}

function getSentences(text: string): string[] {
  return text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 0);
}

function getWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function getParagraphs(text: string): string[] {
  return text.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 0);
}

function getHeadings(text: string): { level: number; text: string; start: number; end: number }[] {
  return getHeadingsWithPositions(text);
}

function getIntroText(text: string): string {
  const paras = getParagraphs(text);
  return paras.slice(0, 2).join(' ').toLowerCase();
}

function getConclusionText(text: string): string {
  const paras = getParagraphs(text);
  return paras.slice(-2).join(' ').toLowerCase();
}

// ─── Keyword Usage ───────────────────────────────────────────────────────

export function analyzeKeywordUsage(text: string, keyword: string, title?: string): KeywordUsageResult {
  if (!keyword.trim()) {
    return { density: 0, count: 0, inH1: false, inIntro: false, inHeadings: false, inConclusion: false, inTitle: false, recommendations: ['Enter a primary keyword to analyze usage.'] };
  }
  const lower = text.toLowerCase();
  const kw = keyword.toLowerCase().trim();
  const words = getWords(text);
  const totalWords = words.length || 1;

  let count = 0;
  let idx = 0;
  while ((idx = lower.indexOf(kw, idx)) !== -1) { count++; idx += kw.length; }

  const density = parseFloat(((count / totalWords) * 100).toFixed(2));

  const headings = getHeadings(text);
  const h1 = headings.find((h) => h.level === 1);
  const inH1 = h1 ? h1.text.toLowerCase().includes(kw) : false;
  const inIntro = getIntroText(text).includes(kw);
  const inHeadings = headings.some((h) => h.level >= 2 && h.text.toLowerCase().includes(kw));
  const inConclusion = getConclusionText(text).includes(kw);
  const inTitle = title ? title.toLowerCase().includes(kw) : inH1;

  const recommendations: string[] = [];
  // H1 is not compulsory, but primary keyword must appear in content title
  if (title) {
    if (!inTitle) {
      recommendations.push('Add primary keyword to your content title.');
    }
  } else if (!inH1) {
    recommendations.push('Include primary keyword in your article title or main heading.');
  }

  if (!inIntro) recommendations.push('Primary keyword not found in first two paragraphs — add it early.');
  if (!inHeadings) recommendations.push('Include keyword in at least one H2 or H3 heading.');
  if (!inConclusion) recommendations.push('Mention keyword in your conclusion for reinforcement.');
  if (density < 0.8) recommendations.push(`Keyword density is ${density}% — below 0.8% target. Use keyword more naturally.`);
  if (density > 1.5) recommendations.push(`Keyword density is ${density}% — above 1.5% target. Reduce usage to avoid over-optimization.`);
  if (recommendations.length === 0) recommendations.push('Keyword usage is well optimized.');

  return { density, count, inH1, inIntro, inHeadings, inConclusion, inTitle, recommendations };
}

// ─── Semantic Keywords ───────────────────────────────────────────────────

export function analyzeSemanticKeywords(
  text: string,
  keyword: string,
  competitors?: CompetitorResult[] | null
): SemanticKeywordsResult {
  return analyzeSemanticKeywordsCore(text, keyword, competitors);
}

// ─── Search Intent ────────────────────────────────────────────────────────

const INTENT_SIGNALS = {
  informational: ['what is', 'how to', 'why', 'when', 'guide', 'tutorial', 'explained', 'definition', 'meaning', 'learn', 'understand'],
  commercial: ['best', 'top', 'review', 'compare', 'vs', 'versus', 'alternative', 'pros and cons', 'worth it', 'should i'],
  transactional: ['buy', 'price', 'cost', 'discount', 'deal', 'purchase', 'order', 'free trial', 'sign up', 'subscribe'],
  navigational: ['login', 'official', 'website', 'homepage', 'app', 'download', 'support', 'contact'],
};

export function analyzeSearchIntent(text: string): SearchIntentResult {
  const lower = text.toLowerCase();
  const scores = { informational: 0, commercial: 0, transactional: 0, navigational: 0 };
  for (const [intent, signals] of Object.entries(INTENT_SIGNALS)) {
    for (const s of signals) {
      if (lower.includes(s)) scores[intent as keyof typeof scores] += 10;
    }
  }
  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const normalized = {
    informational: Math.round((scores.informational / total) * 100),
    commercial: Math.round((scores.commercial / total) * 100),
    transactional: Math.round((scores.transactional / total) * 100),
    navigational: Math.round((scores.navigational / total) * 100),
  };
  const dominant = Object.entries(normalized).sort((a, b) => b[1] - a[1])[0][0];
  const matchPercent = normalized[dominant as keyof typeof normalized];
  const recommendation = matchPercent < 60
    ? `Content intent signals are scattered. Focus more on ${dominant} intent signals.`
    : `Content well-aligned with ${dominant} intent (${matchPercent}% match).`;
  return { ...normalized, dominant, matchPercent, recommendation };
}

// ─── Readability ──────────────────────────────────────────────────────────

export function analyzeReadability(text: string): ReadabilityResult {
  const sentences = getSentences(text);
  const words = getWords(text);
  if (!sentences.length || !words.length) {
    return { score: 0, label: 'Difficult', avgWordsPerSentence: 0, avgSyllablesPerWord: 0 };
  }
  const avgWordsPerSentence = words.length / sentences.length;
  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgSyllablesPerWord = totalSyllables / words.length;

  // Flesch Reading Ease: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
  const raw = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  let label: ReadabilityResult['label'] = 'Difficult';
  if (score >= 70) label = 'Excellent';
  else if (score >= 60) label = 'Good';
  else if (score >= 40) label = 'Average';

  return {
    score,
    label,
    avgWordsPerSentence: parseFloat(avgWordsPerSentence.toFixed(1)),
    avgSyllablesPerWord: parseFloat(avgSyllablesPerWord.toFixed(2)),
  };
}

// ─── Sentence Analysis ────────────────────────────────────────────────────

const PASSIVE_PATTERNS = [/\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi];

export function analyzeSentences(text: string): SentenceAnalysisResult {
  const parsedSentences = getSentencesWithPositions(text);
  const sentenceItems: SentenceLocationItem[] = [];
  const passiveItems: SentenceLocationItem[] = [];

  const longSentences: string[] = [];
  const veryLongSentences: string[] = [];

  for (const s of parsedSentences) {
    const wordCount = s.words.length;
    // Sentence length recommended is 25 to 30 words. Sentences > 30 words exceed recommended range.
    if (wordCount > 30) {
      veryLongSentences.push(s.text);
      sentenceItems.push({
        type: 'very_long_sentence',
        text: s.text,
        start: s.start,
        end: s.end,
        sentenceIndex: s.index,
        wordCount,
      });
    } else if (wordCount >= 21) {
      longSentences.push(s.text);
      sentenceItems.push({
        type: 'long_sentence',
        text: s.text,
        start: s.start,
        end: s.end,
        sentenceIndex: s.index,
        wordCount,
      });
    }

    if (s.isPassive) {
      passiveItems.push({
        type: 'passive_voice',
        text: s.text,
        start: s.start,
        end: s.end,
        sentenceIndex: s.index,
        wordCount,
      });
    }
  }

  const recommendations: string[] = [];
  if (veryLongSentences.length > 0) {
    recommendations.push(`${veryLongSentences.length} sentence(s) exceed 30 words (recommended 25–30 words). Split them for better readability.`);
  }
  if (longSentences.length > 0) {
    recommendations.push(`${longSentences.length} sentence(s) are 21–30 words (recommended 25–30 words).`);
  }

  // Passive voice: All passive voice should not be removed, it needs an acceptable minimum required baseline.
  if (passiveItems.length > 4 && (passiveItems.length / Math.max(1, parsedSentences.length)) > 0.3) {
    recommendations.push(`${passiveItems.length} passive voice sentences detected — maintain a natural minimum baseline while prioritizing active voice.`);
  }

  if (recommendations.length === 0 || (!veryLongSentences.length && passiveItems.length <= 4)) {
    if (!recommendations.includes('Sentence structure looks good.')) {
      recommendations.push('Sentence structure looks good.');
    }
  }

  return {
    longSentenceCount: longSentences.length,
    passiveVoiceCount: passiveItems.length,
    totalSentences: parsedSentences.length,
    longSentences: longSentences.slice(0, 5),
    veryLongSentences: veryLongSentences.slice(0, 5),
    sentenceItems,
    passiveItems,
    recommendations,
  };
}

// ─── Paragraph Analysis ───────────────────────────────────────────────────

export function analyzeParagraphs(text: string): ParagraphAnalysisResult {
  const parsedParas = getParagraphsWithPositions(text);
  const paragraphItems: ParagraphLocationItem[] = [];
  let longCount = 0;
  let veryLongCount = 0;

  for (const p of parsedParas) {
    const wordCount = p.words.length;
    // Paragraph length recommended is 250 to 300 words
    if (wordCount > 360) {
      veryLongCount++;
      paragraphItems.push({
        type: 'very_long_paragraph',
        text: p.text,
        start: p.start,
        end: p.end,
        paragraphIndex: p.index,
        wordCount,
      });
    } else if (wordCount > 300) {
      longCount++;
      paragraphItems.push({
        type: 'long_paragraph',
        text: p.text,
        start: p.start,
        end: p.end,
        paragraphIndex: p.index,
        wordCount,
      });
    }
  }

  const recommendations: string[] = [];
  if (veryLongCount > 0) {
    recommendations.push(`${veryLongCount} paragraph(s) exceed 360 words — split into focused sections to target the recommended 250–300 words.`);
  }
  if (longCount > 0) {
    recommendations.push(`${longCount} paragraph(s) exceed 300 words — consider trimming to the recommended 250–300 words.`);
  }
  if (recommendations.length === 0) {
    recommendations.push('Paragraph lengths are well-structured (recommended 250–300 words).');
  }
  return {
    longParagraphCount: longCount,
    veryLongParagraphCount: veryLongCount,
    totalParagraphs: parsedParas.length,
    paragraphItems,
    recommendations,
  };
}

// ─── Transition Words ─────────────────────────────────────────────────────

const TRANSITION_WORDS = [
  'however', 'therefore', 'additionally', 'furthermore', 'moreover', 'meanwhile', 'consequently',
  'nevertheless', 'nonetheless', 'in addition', 'as a result', 'for example', 'for instance',
  'in contrast', 'on the other hand', 'in conclusion', 'to summarize', 'in other words',
  'specifically', 'notably', 'importantly', 'finally', 'first', 'second', 'third', 'next',
  'also', 'similarly', 'likewise', 'although', 'despite', 'indeed', 'thus', 'hence',
];

export function analyzeTransitionWords(text: string): TransitionWordsResult {
  const lower = text.toLowerCase();
  const sentences = getSentences(text);
  const found = TRANSITION_WORDS.filter((w) => lower.includes(w));
  const missing = TRANSITION_WORDS.filter((w) => !lower.includes(w));
  const count = found.length;
  const percentage = sentences.length > 0 ? Math.round((count / sentences.length) * 100) : 0;
  const recommendations: string[] = [];

  // Requirement 9: It must not force all transition words into the content, it should accept minimum required.
  const meetsMinimum = percentage >= 15 || count >= 2;
  if (!meetsMinimum && sentences.length >= 4) {
    recommendations.push(`Transition word usage is below the minimum baseline (${percentage}%). Consider adding a few connectors (e.g., ${missing.slice(0, 3).join(', ')}).`);
  } else {
    recommendations.push(`Meets minimum required transition words (${count} found, ${percentage}% of sentences) — content flows naturally.`);
  }
  return { count, totalSentences: sentences.length, percentage, found: found.slice(0, 10), missing: missing.slice(0, 5), recommendations };
}

// ─── Grammar, Spacing & Agreement Engine (High-Accuracy & Context-Aware) ──

export { analyzeGrammar } from '@/lib/grammar/grammarEngine';

// ─── Heading Structure ────────────────────────────────────────────────────

export function analyzeHeadingStructure(text: string): HeadingStructureResult {
  const headings = getHeadingsWithPositions(text);
  const h1Count = headings.filter((h) => h.level === 1).length;
  const h2Count = headings.filter((h) => h.level === 2).length;
  const h3Count = headings.filter((h) => h.level === 3).length;

  const issues: string[] = [];
  // H1 is not compulsory in body (content title carries the primary keyword), but if multiple H1s are present, flag hierarchy
  if (h1Count > 1) {
    issues.push(`Multiple H1s found (${h1Count}) — prefer using subheadings (## H2) for sections.`);
  }
  if (h2Count < 2) {
    issues.push(`Only ${h2Count} H2 section(s) — add at least 2 ## H2 subheadings to structure content.`);
  }

  // Check H3 before H2 (incorrect hierarchy)
  let lastLevel = 0;
  for (const h of headings) {
    if (h.level === 3 && lastLevel < 2) issues.push('H3 used without a preceding H2 — fix heading hierarchy.');
    lastLevel = h.level;
  }

  let score = 100;
  if (h1Count > 1) score -= 10;
  if (h2Count < 2) score -= 20;

  return {
    h1Count,
    h2Count,
    h3Count,
    headings,
    issues,
    score: Math.max(0, score),
  };
}

// ─── EEAT Analysis ────────────────────────────────────────────────────────

export function analyzeEEAT(
  text: string,
  keyword?: string,
  options?: {
    intent?: string;
    competitors?: any[];
    semanticKeywords?: string[];
  }
): EEATResult {
  return analyzeEEATCore(text, keyword, options);
}

// ─── Engagement Analysis ─────────────────────────────────────────────────

export function analyzeEngagement(text: string): EngagementResult {
  const sentences = getSentences(text);
  const lower = text.toLowerCase();
  const questionCount = (text.match(/\?/g) || []).length;
  const exampleCount = (lower.match(/\b(for example|for instance|such as|like)\b/g) || []).length;
  const dataCount = (lower.match(/\d+%|\d+ (study|report|survey|research)/g) || []).length;

  const score = Math.min(100, questionCount * 10 + exampleCount * 15 + dataCount * 15);
  const recommendations: string[] = [];
  if (questionCount === 0) recommendations.push('Add rhetorical questions to engage readers.');
  if (exampleCount === 0) recommendations.push('Include concrete examples to illustrate key points.');
  if (dataCount === 0) recommendations.push('Add data-backed statements (statistics, studies) to increase credibility.');
  if (recommendations.length === 0) recommendations.push('Good engagement signals present.');

  return { score: Math.min(100, score), questionCount, exampleCount, dataCount, recommendations };
}

// ─── Featured Snippet ─────────────────────────────────────────────────────

export function analyzeSnippetPotential(text: string): SnippetResult {
  const lower = text.toLowerCase();
  const hasDefinition = /(is a|is an|refers to|means|defined as)/i.test(text);
  const hasList = /^[-*•]\s|\d+\.\s/m.test(text);
  const hasTable = /\|.*\|/.test(text);
  const hasFAQ = /(faq|frequently asked|q:|q\.|question:)/i.test(text);

  let score = 0;
  if (hasDefinition) score += 25;
  if (hasList) score += 30;
  if (hasTable) score += 25;
  if (hasFAQ) score += 20;

  const recommendations: string[] = [];
  if (!hasDefinition) recommendations.push('Add a concise definition or explanation at the start to target definition snippets.');
  if (!hasList) recommendations.push('Add bullet or numbered lists to target list snippets.');
  if (!hasTable) recommendations.push('Include a comparison table to target table snippets.');
  if (!hasFAQ) recommendations.push('Add an FAQ section to target PAA (People Also Ask) snippets.');

  return { score, hasDefinition, hasList, hasTable, hasFAQ, recommendations };
}

// ─── AI Detection Risk (High-Sensitivity Strict Inspection Filter) ─────────

const AI_MARKER_PATTERNS = [
  /\bdelv(?:e|es|ed|ing)\s+(?:in|into)\b/i,
  /\bserves?\s+as\s+a\s+testament\b/i,
  /\ba\s+testament\s+to\b/i,
  /\b(?:rich|vibrant)\s+tapestry\b/i,
  /\ba\s+beacon\s+of\b/i,
  /\bplays?\s+a\s+(?:crucial|pivotal|vital|significant|key)\s+role\b/i,
  /\bit\s+is\s+worth\s+noting\b/i,
  /\bit\s+is\s+important\s+to\s+note\b/i,
  /\bit\s+is\s+crucial\s+to\s+(?:understand|remember|note)\b/i,
  /\bit\s+is\s+(?:essential|imperative)\s+to\b/i,
  /\bneedless\s+to\s+say\b/i,
  /\bas\s+previously\s+mentioned\b/i,
  /\bwithout\s+further\s+ado\b/i,
  /\bnavigat(?:e|ing)\s+(?:this|the)\s+(?:landscape|realm|complexities)\b/i,
  /\bin\s+(?:this\s+)?summary\b/i,
  /\bin\s+conclusion\b/i,
  /\bto\s+summarize\b/i,
  /\ball\s+in\s+all\b/i,
  /\bgame[- ]changer\b/i,
  /\bseamlessly\s+integrat(?:e|ed|ing|es)\b/i,
  /\bseamless\s+integration\b/i,
  /\bfosters?\s+a\s+sense\b/i,
  /\bsheds?\s+light\s+on\b/i,
  /\bharness(?:ing)?\s+the\s+power\s+of\b/i,
  /\bunlock(?:ing)?\s+the\s+potential\b/i,
  /\bembark(?:ing)?\s+on\s+a\s+journey\b/i,
  /\bin\s+today's\s+(?:fast-paced|digital|interconnected)\s+world\b/i,
  /\bat\s+the\s+forefront\s+of\b/i,
  /\bfurthermore\b/i,
  /\bmoreover\b/i,
  /\badditionally\b/i,
  /\bin\s+addition\b/i,
  /\bconsequently\b/i,
  /\bultimately\b/i,
  /\bnotably\b/i,
  /\bimportantly\b/i,
  /\bin\s+essence\b/i,
  /\bby\s+(?:understanding|embracing|leveraging|incorporating)\b/i,
  /\ba\s+wide\s+(?:array|range|variety)\s+of\b/i,
  /\bnot\s+only\b.+?\bbut\s+also\b/i,
  /\bkey\s+takeaways?\b/i,
  /\bprofound\s+impact\b/i,
  /\bever-evolving\b/i,
  /\blooking\s+ahead\b/i,
  /\bfirst\s+and\s+foremost\b/i,
  /\bin\s+the\s+realm\s+of\b/i,
  /\ba\s+plethora\s+of\b/i,
  /\bcornerstone\s+of\b/i,
];

export function analyzeAIRisk(text: string): AIRiskResult {
  if (!text.trim()) return { humanScore: 0, aiScore: 0, riskLevel: 'Low', recommendations: [] };

  const sentences = getSentences(text);
  const words = getWords(text);
  const totalWords = words.length;

  if (totalWords < 6) {
    return {
      humanScore: 80,
      aiScore: 20,
      riskLevel: 'Low',
      recommendations: ['Provide a longer sample (at least 25 words) for in-depth AI risk inspection.'],
    };
  }

  const lengths = sentences.map((s) => getWords(s).length).filter((l) => l > 0);
  const count = lengths.length || 1;
  const avgLen = lengths.reduce((a, b) => a + b, 0) / count;

  // 1. Sentence length variance and Coefficient of Variation (Burstiness)
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLen, 2), 0) / count;
  const stdDev = Math.sqrt(variance);
  const cv = avgLen > 0 ? stdDev / avgLen : 0;

  // Consecutive sentence length difference (human prose has dynamic rhythm)
  let consecutiveDeltaSum = 0;
  for (let i = 1; i < lengths.length; i++) {
    consecutiveDeltaSum += Math.abs(lengths[i] - lengths[i - 1]);
  }
  const avgConsecutiveDelta = lengths.length > 1 ? consecutiveDeltaSum / (lengths.length - 1) : 0;

  // 2. Lexical diversity (Type-Token Ratio)
  const cleanWords = words
    .map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter((w) => w.length > 1);
  const uniqueWordCount = new Set(cleanWords).size;
  const ttr = cleanWords.length > 0 ? uniqueWordCount / cleanWords.length : 0.5;

  // 3. Conversational / human punctuation (question marks, exclamation marks)
  const questionCount = (text.match(/\?/g) || []).length;
  const exclamationCount = (text.match(/!/g) || []).length;
  const humanPunctuation = questionCount + exclamationCount;

  // 4. Personal voice / pronouns (direct human perspective)
  const pronounMatches = (text.match(/\b(I|my|me|mine|myself|we|our|ours|us|you|your|yours)\b/gi) || []).length;
  const pronounRate = pronounMatches / (totalWords || 1);

  // 5. Detection of formulaic AI transition markers & clichés
  const foundAiPatterns: string[] = [];
  for (const pattern of AI_MARKER_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      foundAiPatterns.push(match[0].toLowerCase());
    }
  }
  const aiMarkerHits = foundAiPatterns.length;

  // 6. Formulaic sentence openers (common in ChatGPT / LLM prose)
  const formulaicOpeners = sentences.filter((s) =>
    /^\s*(?:Furthermore|Moreover|Additionally|In addition|Consequently|Ultimately|Notably|Importantly|In essence|Specifically|To begin with|In conclusion|Overall),/i.test(s)
  ).length;

  // Calibrated High-Sensitivity Risk Scoring (stricter screen while respecting genuine human prose)
  let score = 32; // Baseline neutral anchor for strict analysis

  // Burstiness scoring (reliable sample size requires >= 2 sentences)
  if (lengths.length >= 2) {
    if (avgConsecutiveDelta >= 6 || (cv >= 0.40 && avgConsecutiveDelta >= 4)) {
      score -= 14; // Dynamic human burstiness & varied pacing
    } else if (avgConsecutiveDelta >= 4 || cv >= 0.28) {
      score -= 8; // Moderate human burstiness
    } else if (cv < 0.16 && lengths.length >= 4) {
      score += 20; // Statistically significant robotic uniformity across multiple sentences
    } else if (cv < 0.22 && lengths.length >= 4) {
      score += 10; // Constrained variance across multiple sentences
    }

    if (lengths.length >= 3 && avgConsecutiveDelta < 2.0 && lengths.length >= 4) {
      score += 12; // Repetitive pacing
    }
  }

  // Lexical diversity scoring (Type-Token Ratio)
  // Low TTR indicates robotic repetition, while moderate/high TTR is normal across both human & AI.
  if (cleanWords.length >= 30) {
    if (ttr < 0.38 && cleanWords.length >= 40) {
      score += 16; // Repetitive token distribution
    } else if (ttr < 0.44 && cleanWords.length >= 50) {
      score += 8;
    }
  }

  // Conversational/direct human punctuation bonus
  if (humanPunctuation >= 2) {
    score -= 6;
  } else if (humanPunctuation >= 1) {
    score -= 3;
  }

  // Personal voice / direct perspective bonus
  if (pronounRate >= 0.04) {
    score -= 16;
  } else if (pronounRate >= 0.02) {
    score -= 10;
  } else if (pronounRate >= 0.01) {
    score -= 5;
  }

  // AI transition markers and formulaic openers penalty
  if (aiMarkerHits > 0) {
    score += Math.min(54, aiMarkerHits * 16);
  }
  if (formulaicOpeners > 0) {
    score += Math.min(24, formulaicOpeners * 12);
  }

  const aiScore = Math.max(6, Math.min(96, Math.round(score)));
  const humanScore = 100 - aiScore;
  const riskLevel: AIRiskResult['riskLevel'] = aiScore >= 65 ? 'High' : aiScore >= 35 ? 'Medium' : 'Low';

  const recommendations: string[] = [];
  if (aiScore >= 65) {
    if (cv < 0.25 && lengths.length >= 3) {
      recommendations.push('Vary sentence lengths more — uniform sentence length is a strong AI hallmark.');
    }
    if (aiMarkerHits > 0) {
      recommendations.push(`Remove formulaic transition phrases (${foundAiPatterns.slice(0, 3).map((p) => `"${p}"`).join(', ')}).`);
    }
    if (cleanWords.length >= 30 && ttr < 0.45) {
      recommendations.push('Incorporate more diverse domain-specific vocabulary to break repetitive patterns.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Add personal examples, varied syntax, and direct insights to lower AI risk score.');
    }
  } else if (aiScore >= 35) {
    recommendations.push('Pacing and vocabulary are largely natural, with minor uniformities.');
    if (aiMarkerHits > 0) {
      recommendations.push(`Consider replacing transition phrases like "${foundAiPatterns[0]}".`);
    }
  } else {
    recommendations.push('Sentence rhythm, burstiness, and vocabulary variation align with natural human writing.');
    if (aiMarkerHits === 0) {
      recommendations.push('No formulaic AI transition markers or robotic length patterns detected.');
    }
  }

  return { humanScore, aiScore, riskLevel, recommendations };
}

// ─── Content Uniqueness ───────────────────────────────────────────────────

export function analyzeUniqueness(text: string): UniquenessResult {
  const words = getWords(text.toLowerCase());
  const totalWords = words.length || 1;
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (w.length > 4) freq[w] = (freq[w] || 0) + 1;
  }

  // Requirement 1: Overused Words measured by 1% to 2% of entire content (max 10 to 20 times per 1000 words)
  const overusedThreshold = Math.max(4, Math.round(totalWords * 0.018));
  const overusedWords = Object.entries(freq)
    .filter(([, count]) => count > overusedThreshold)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);

  // Detect duplicate 4-gram phrases
  const bigrams: string[] = [];
  for (let i = 0; i < words.length - 3; i++) {
    bigrams.push(words.slice(i, i + 4).join(' '));
  }
  const bigramFreq: Record<string, number> = {};
  for (const b of bigrams) { bigramFreq[b] = (bigramFreq[b] || 0) + 1; }
  const duplicatePhrases = Object.entries(bigramFreq)
    .filter(([, c]) => c > 2)
    .map(([phrase]) => phrase)
    .slice(0, 4);

  // Calculate detailed occurrences with start/end offsets
  const wordOccurrences: WordOccurrenceItem[] = [];
  for (const word of overusedWords) {
    const occurrences: { start: number; end: number; text: string; index: number }[] = [];
    try {
      const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      let match: RegExpExecArray | null;
      let idx = 0;
      while ((match = regex.exec(text)) !== null) {
        occurrences.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          index: idx++
        });
      }
    } catch {}
    wordOccurrences.push({
      word,
      count: occurrences.length || freq[word] || 0,
      occurrences
    });
  }

  const phraseOccurrences: PhraseOccurrenceItem[] = [];
  for (const phrase of duplicatePhrases) {
    const occurrences: { start: number; end: number; text: string; index: number }[] = [];
    try {
      const wordsInPhrase = phrase.split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
      const regex = new RegExp(`\\b${wordsInPhrase}\\b`, 'gi');
      let match: RegExpExecArray | null;
      let idx = 0;
      while ((match = regex.exec(text)) !== null) {
        occurrences.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          index: idx++
        });
      }
    } catch {}
    phraseOccurrences.push({
      phrase,
      count: occurrences.length || bigramFreq[phrase] || 0,
      occurrences
    });
  }

  const score = Math.max(0, 100 - overusedWords.length * 8 - duplicatePhrases.length * 10);
  const recommendations: string[] = [];
  if (overusedWords.length > 0) {
    recommendations.push(
      `Overused words: "${overusedWords.slice(0, 3).join('", "')}" exceed 1%–2% frequency threshold (max 10–20 per 1,000 words) — replace with synonyms.`
    );
  }
  if (duplicatePhrases.length > 0) recommendations.push('Repeated phrases detected — vary your language for originality.');
  if (recommendations.length === 0) recommendations.push('Content appears unique with varied vocabulary.');

  return { 
    score, 
    duplicatePhrases, 
    overusedWords, 
    recommendations,
    wordOccurrences,
    phraseOccurrences
  };
}

// ─── Meta Generation ─────────────────────────────────────────────────────

export function generateMeta(text: string, keyword: string): MetaResult {
  const headings = getHeadings(text);
  const h1 = headings.find((h) => h.level === 1);
  const year = new Date().getFullYear();

  const baseTitle = h1 ? h1.text : keyword || 'Untitled Article';
  const suggestedTitle = baseTitle.length > 60
    ? `${baseTitle.slice(0, 50)}… | Guide ${year}`
    : `${baseTitle} | Complete Guide ${year}`;

  const paras = getParagraphs(text);
  const firstPara = paras[0] || '';
  const words = getWords(firstPara);
  const descBase = words.slice(0, 24).join(' ');
  const suggestedDescription = descBase.length > 30
    ? `${descBase}…`
    : `Comprehensive guide on ${keyword || baseTitle}. Learn everything you need to know with expert tips and real examples.`;

  const suggestedSlug = (keyword || baseTitle)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);

  const titleLength = suggestedTitle.length;
  const descLength = suggestedDescription.length;

  return {
    suggestedTitle,
    suggestedDescription,
    suggestedSlug,
    titleLength,
    descLength,
    titleOk: titleLength >= 50 && titleLength <= 60,
    descOk: descLength >= 140 && descLength <= 160,
  };
}

// ─── Overall Scores ───────────────────────────────────────────────────────

export function computeOverallScores(params: {
  kwResult: KeywordUsageResult;
  readability: ReadabilityResult;
  grammar: GrammarResult;
  eeat: EEATResult;
  headings: HeadingStructureResult;
  engagement: EngagementResult;
  snippet: SnippetResult;
  uniqueness: UniquenessResult;
}): OverallScores {
  const { kwResult, readability, grammar, eeat, headings, engagement, snippet, uniqueness } = params;

  const densityScore = kwResult.density >= 0.8 && kwResult.density <= 1.5 ? 100 :
    kwResult.density < 0.8 ? Math.round(kwResult.density / 0.8 * 70) :
    Math.max(0, 100 - (kwResult.density - 1.5) * 50);
  const placementBonus = [(kwResult.inTitle ?? kwResult.inH1), kwResult.inIntro, kwResult.inHeadings, kwResult.inConclusion].filter(Boolean).length * 5;
  const seo = Math.min(100, Math.round((densityScore + placementBonus + snippet.score) / 2));

  const readabilityScore = readability.score;

  const structure = headings.score;

  // Publishing readiness: SEO 25%, Readability 20%, Grammar 15%, EEAT 20%, Structure 10%, Engagement 10%
  const publishingScore = Math.round(
    seo * 0.25 +
    readabilityScore * 0.20 +
    grammar.score * 0.15 +
    eeat.score * 0.20 +
    structure * 0.10 +
    engagement.score * 0.10
  );

  const overall = Math.round(
    (seo + readabilityScore + grammar.score + eeat.score + structure + engagement.score + uniqueness.score) / 7
  );

  return {
    seo,
    readability: readabilityScore,
    grammar: grammar.score,
    eeat: eeat.score,
    structure,
    engagement: engagement.score,
    overall,
    publishingScore,
    readyToPublish: publishingScore >= 70,
  };
}

// ─── Internal Link Suggestions (static based on content topics) ──────────

const SITE_PAGES = [
  { url: '/detector', title: 'AI Content Detector', keywords: ['ai detection', 'detect ai', 'ai content', 'checker', 'probability'] },
  { url: '/tools', title: 'AI Tools Directory', keywords: ['ai tools', 'tools', 'software', 'apps', 'platforms'] },
  { url: '/content-studio', title: 'Content Studio', keywords: ['article', 'generate', 'seo content', 'blog post', 'writing'] },
  { url: '/seo-assistant', title: 'SEO Writing Assistant', keywords: ['seo', 'optimization', 'keyword', 'readability', 'ranking'] },
  { url: '/community', title: 'Community Forum', keywords: ['community', 'discuss', 'forum', 'question', 'feedback'] },
  { url: '/pricing', title: 'Pricing Plans', keywords: ['pricing', 'plan', 'subscription', 'cost', 'free'] },
  { url: '/blog', title: 'Blog & Guides', keywords: ['blog', 'guide', 'tutorial', 'how to', 'learn', 'tips'] },
  { url: '/marketplace', title: 'Marketplace', keywords: ['marketplace', 'template', 'prompt', 'product', 'resource'] },
];

export function suggestInternalLinks(text: string): { url: string; title: string; anchorText: string; reason: string }[] {
  const lower = text.toLowerCase();
  const suggestions: ReturnType<typeof suggestInternalLinks> = [];
  for (const page of SITE_PAGES) {
    const matchedKeyword = page.keywords.find((kw) => lower.includes(kw));
    if (matchedKeyword) {
      suggestions.push({
        url: page.url,
        title: page.title,
        anchorText: matchedKeyword,
        reason: `Content mentions "${matchedKeyword}" — link to ${page.title}`,
      });
    }
    if (suggestions.length >= 5) break;
  }
  return suggestions;
}
