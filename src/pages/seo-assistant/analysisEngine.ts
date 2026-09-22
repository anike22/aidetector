// SEO Writing Assistant — Client-side analysis engine
// All functions are pure and run in-browser with no backend calls

export interface KeywordUsageResult {
  density: number;
  count: number;
  inH1: boolean;
  inIntro: boolean;
  inHeadings: boolean;
  inConclusion: boolean;
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

export interface EEATResult {
  score: number;
  hasPersonalExamples: boolean;
  hasStats: boolean;
  hasCitations: boolean;
  hasAuthor: boolean;
  recommendations: string[];
}

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

export interface ContentGapResult {
  missingKeywords: string[];
  missingHeadings: string[];
  missingFAQs: string[];
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

export interface GrammarIssueItem {
  text: string;
  suggestion: string;
  type: string;
  start: number;
  end: number;
  sentenceIndex?: number;
  paragraphIndex?: number;
  contextSnippet?: string;
}

export interface GrammarResult {
  score: number;
  issues: GrammarIssueItem[];
}

export interface SemanticKeywordsResult {
  recommended: string[];
  found: string[];
  missing: string[];
  coveragePercent: number;
}

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

export function analyzeKeywordUsage(text: string, keyword: string): KeywordUsageResult {
  if (!keyword.trim()) {
    return { density: 0, count: 0, inH1: false, inIntro: false, inHeadings: false, inConclusion: false, recommendations: ['Enter a primary keyword to analyze usage.'] };
  }
  const lower = text.toLowerCase();
  const kw = keyword.toLowerCase();
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

  const recommendations: string[] = [];
  if (!inH1) recommendations.push('Add primary keyword to your H1 heading.');
  if (!inIntro) recommendations.push('Primary keyword not found in first two paragraphs — add it early.');
  if (!inHeadings) recommendations.push('Include keyword in at least one H2 or H3 heading.');
  if (!inConclusion) recommendations.push('Mention keyword in your conclusion for reinforcement.');
  if (density < 0.8) recommendations.push(`Keyword density is ${density}% — below 0.8% target. Use keyword more naturally.`);
  if (density > 1.5) recommendations.push(`Keyword density is ${density}% — above 1.5% target. Reduce usage to avoid over-optimization.`);
  if (recommendations.length === 0) recommendations.push('Keyword usage is well optimized.');

  return { density, count, inH1, inIntro, inHeadings, inConclusion, recommendations };
}

// ─── Semantic Keywords ───────────────────────────────────────────────────

const NLP_BANKS: Record<string, string[]> = {
  default: ['expert insights', 'best practices', 'comprehensive guide', 'step by step', 'research shows', 'according to', 'for example', 'in conclusion', 'furthermore', 'however'],
  ai: ['machine learning', 'neural network', 'natural language processing', 'large language model', 'generative ai', 'deep learning', 'ai model', 'training data', 'inference', 'prompt engineering'],
  seo: ['search engine optimization', 'keyword research', 'backlinks', 'organic traffic', 'meta description', 'page rank', 'serp', 'anchor text', 'crawlability', 'on-page seo'],
  content: ['readability', 'engagement', 'call to action', 'target audience', 'content strategy', 'editorial calendar', 'content marketing', 'storytelling', 'copywriting', 'tone of voice'],
};

export function analyzeSemanticKeywords(text: string, keyword: string): SemanticKeywordsResult {
  const lower = text.toLowerCase();
  const kwLower = keyword.toLowerCase();

  let bank = NLP_BANKS.default;
  if (kwLower.includes('ai') || kwLower.includes('gpt') || kwLower.includes('gemini') || kwLower.includes('claude') || kwLower.includes('llm')) bank = NLP_BANKS.ai;
  else if (kwLower.includes('seo') || kwLower.includes('rank') || kwLower.includes('keyword')) bank = NLP_BANKS.seo;
  else if (kwLower.includes('content') || kwLower.includes('write') || kwLower.includes('blog')) bank = NLP_BANKS.content;

  const found = bank.filter((term) => lower.includes(term));
  const missing = bank.filter((term) => !lower.includes(term));
  const coveragePercent = Math.round((found.length / bank.length) * 100);

  return { recommended: bank, found, missing, coveragePercent };
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
    if (wordCount >= 26) {
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
  if (veryLongSentences.length > 0) recommendations.push(`${veryLongSentences.length} sentences exceed 25 words (red). Split them for better readability.`);
  if (longSentences.length > 0) recommendations.push(`${longSentences.length} sentences are 21-25 words (yellow). Consider shortening.`);
  if (passiveItems.length > 3) recommendations.push(`${passiveItems.length} passive voice sentences detected — use active voice for clarity.`);
  if (recommendations.length === 0) recommendations.push('Sentence structure looks good.');

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
    if (wordCount >= 201) {
      veryLongCount++;
      paragraphItems.push({
        type: 'very_long_paragraph',
        text: p.text,
        start: p.start,
        end: p.end,
        paragraphIndex: p.index,
        wordCount,
      });
    } else if (wordCount >= 121) {
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
  if (veryLongCount > 0) recommendations.push(`${veryLongCount} paragraph(s) exceed 200 words (red) — split into smaller sections for readability.`);
  if (longCount > 0) recommendations.push(`${longCount} paragraph(s) are 121-200 words (yellow) — consider shortening.`);
  if (recommendations.length === 0) recommendations.push('Paragraph lengths are well-balanced.');
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
  if (percentage < 25) recommendations.push(`Transition word usage is ${percentage}% — target 25%+ to improve flow. Consider adding: ${missing.slice(0, 5).join(', ')}.`);
  else recommendations.push('Good use of transition words — content flows well.');
  return { count, totalSentences: sentences.length, percentage, found: found.slice(0, 10), missing: missing.slice(0, 10), recommendations };
}

// ─── Grammar (heuristic) ──────────────────────────────────────────────────

const GRAMMAR_RULES: { pattern: RegExp; suggestion: string; type: string }[] = [
  { pattern: /\b(i)\b(?!\.)/g, suggestion: 'Capitalize "I"', type: 'Capitalization' },
  { pattern: /\s{2,}/g, suggestion: 'Remove extra spaces', type: 'Spacing' },
  { pattern: /[.!?]{2,}/g, suggestion: 'Use single punctuation', type: 'Punctuation' },
  { pattern: /\b(its|it's)\b/gi, suggestion: "Check its vs it's usage", type: 'Grammar' },
  { pattern: /\b(your|you're)\b/gi, suggestion: "Check your vs you're usage", type: 'Grammar' },
  { pattern: /\b(their|there|they're)\b/gi, suggestion: "Check their/there/they're usage", type: 'Grammar' },
  { pattern: /\b(a)\s+[aeiou]/gi, suggestion: 'Use "an" before vowel sounds', type: 'Grammar' },
  { pattern: /[a-z]\.[A-Z]/g, suggestion: 'Add space after sentence-ending period', type: 'Punctuation' },
];

export function analyzeGrammar(text: string): GrammarResult {
  const issues: GrammarResult['issues'] = [];
  for (const rule of GRAMMAR_RULES) {
    const rx = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = rx.exec(text)) !== null) {
      if (match.index !== undefined) {
        const start = match.index;
        const end = match.index + match[0].length;
        // Extract 15 characters of surrounding context for robust exact locating
        const contextStart = Math.max(0, start - 15);
        const contextEnd = Math.min(text.length, end + 15);
        const contextSnippet = text.slice(contextStart, contextEnd);

        issues.push({
          text: match[0],
          suggestion: rule.suggestion,
          type: rule.type,
          start,
          end,
          contextSnippet,
        });
      }
    }
  }
  // Sort issues deterministically by position in reading order
  issues.sort((a, b) => a.start - b.start);
  const score = Math.max(0, 100 - issues.length * 8);
  return { score, issues };
}

// ─── Heading Structure ────────────────────────────────────────────────────

export function analyzeHeadingStructure(text: string): HeadingStructureResult {
  const headings = getHeadingsWithPositions(text);
  const h1Count = headings.filter((h) => h.level === 1).length;
  const h2Count = headings.filter((h) => h.level === 2).length;
  const h3Count = headings.filter((h) => h.level === 3).length;

  const issues: string[] = [];
  if (h1Count === 0) issues.push('Missing H1 title — add a main # Heading at the top.');
  else if (h1Count > 1) issues.push(`Multiple H1s found (${h1Count}) — use only one primary # H1.`);
  if (h2Count < 2) issues.push(`Only ${h2Count} H2 section(s) — add at least 2 ## H2 subheadings to structure content.`);

  // Check H3 before H2 (incorrect hierarchy)
  let lastLevel = 0;
  for (const h of headings) {
    if (h.level === 3 && lastLevel < 2) issues.push('H3 used without a preceding H2 — fix heading hierarchy.');
    lastLevel = h.level;
  }

  let score = 100;
  if (h1Count !== 1) score -= 30;
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

const EXAMPLE_SIGNALS = ['for example', 'for instance', 'in my experience', 'i found', 'i noticed', 'we found', 'case study', 'real-world', 'in practice'];
const STATS_SIGNALS = ['%', 'according to', 'study', 'research', 'survey', 'data shows', 'statistics', 'report', 'found that', 'showed that'];
const CITATION_SIGNALS = ['source:', 'reference:', 'https://', 'http://', 'cited', 'published by', 'journal', 'university', '.org', '.gov', '.edu'];
const AUTHOR_SIGNALS = ['written by', 'authored by', 'by the team', 'reviewed by', 'fact-checked', 'editor', 'contributor'];

export function analyzeEEAT(text: string): EEATResult {
  const lower = text.toLowerCase();
  const hasPersonalExamples = EXAMPLE_SIGNALS.some((s) => lower.includes(s));
  const hasStats = STATS_SIGNALS.some((s) => lower.includes(s));
  const hasCitations = CITATION_SIGNALS.some((s) => lower.includes(s));
  const hasAuthor = AUTHOR_SIGNALS.some((s) => lower.includes(s));

  let score = 0;
  if (hasPersonalExamples) score += 25;
  if (hasStats) score += 25;
  if (hasCitations) score += 25;
  if (hasAuthor) score += 25;

  const recommendations: string[] = [];
  if (!hasPersonalExamples) recommendations.push('Add real examples or personal experience to demonstrate expertise.');
  if (!hasStats) recommendations.push('Include statistics or research data to build authority.');
  if (!hasCitations) recommendations.push('Add citations or source links to establish trustworthiness.');
  if (!hasAuthor) recommendations.push('Include author attribution (written by / reviewed by) for EEAT compliance.');
  if (recommendations.length === 0) recommendations.push('Strong EEAT signals detected.');

  return { score, hasPersonalExamples, hasStats, hasCitations, hasAuthor, recommendations };
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

// ─── AI Detection Risk ────────────────────────────────────────────────────

export function analyzeAIRisk(text: string): AIRiskResult {
  if (!text.trim()) return { humanScore: 0, aiScore: 0, riskLevel: 'Low', recommendations: [] };

  const sentences = getSentences(text);
  const lengths = sentences.map((s) => getWords(s).length);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / (lengths.length || 1);

  // Variance in sentence length — humans vary more
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLen, 2), 0) / (lengths.length || 1);
  const stdDev = Math.sqrt(variance);

  // Personal pronouns — humans use more
  const pronounMatches = (text.match(/\b(I|my|me|we|our|you|your)\b/g) || []).length;
  const pronounRate = pronounMatches / (getWords(text).length || 1);

  // Filler/AI phrases
  const aiPhrases = ['in conclusion', 'it is worth noting', 'it is important to note', 'needless to say', 'as previously mentioned', 'in this article', 'in this guide', 'without further ado', 'as we can see', 'this comprehensive'];
  const lower = text.toLowerCase();
  const aiPhraseCount = aiPhrases.filter((p) => lower.includes(p)).length;

  // Heuristic: high variance + pronouns = more human
  let humanScore = Math.min(100, Math.round(stdDev * 3 + pronounRate * 200));
  humanScore = Math.max(10, humanScore - aiPhraseCount * 10);
  const aiScore = 100 - humanScore;

  const riskLevel: AIRiskResult['riskLevel'] = aiScore > 70 ? 'High' : aiScore > 40 ? 'Medium' : 'Low';

  const recommendations: string[] = [];
  if (aiScore > 50) recommendations.push('Add personal anecdotes and first-person perspective to reduce AI risk.');
  if (stdDev < 3) recommendations.push('Vary sentence lengths more — uniform sentences are an AI signal.');
  if (aiPhraseCount > 1) recommendations.push('Remove generic AI phrases like "it is worth noting" and "in this article".');
  if (recommendations.length === 0) recommendations.push('Content reads as human-written.');

  return { humanScore, aiScore, riskLevel, recommendations };
}

// ─── Content Uniqueness ───────────────────────────────────────────────────

export function analyzeUniqueness(text: string): UniquenessResult {
  const words = getWords(text.toLowerCase());
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (w.length > 4) freq[w] = (freq[w] || 0) + 1;
  }
  const overusedWords = Object.entries(freq)
    .filter(([, count]) => count > 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
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
  if (overusedWords.length > 0) recommendations.push(`Overused words: "${overusedWords.slice(0, 3).join('", "')}" — replace with synonyms.`);
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
  const placementBonus = [kwResult.inH1, kwResult.inIntro, kwResult.inHeadings, kwResult.inConclusion].filter(Boolean).length * 5;
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
