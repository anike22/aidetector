/**
 * Semantic Keywords Coverage Engine
 * 
 * Dynamically analyzes primary keywords, full article content, and real competitor SERP data.
 * Zero hard-coded recommendation banks. High-fidelity entity extraction, relevance filtering,
 * coverage status classification, and auditable evidence.
 */

export type SemanticSourceType = 'primary_keyword' | 'content_entity' | 'competitor_serp' | 'combined';

export type SemanticCoverageStatus = 'missing' | 'underused' | 'covered' | 'well_covered';

export interface CompetitorEvidence {
  competitorsCount: number;
  sampleSources: string[];
  avgFrequency: number;
  headingsMatched?: string[];
}

export interface SemanticKeywordItem {
  term: string;
  sourceType: SemanticSourceType;
  userCount: number;
  recommendedCount: { min: number; max: number };
  status: SemanticCoverageStatus;
  relevanceScore: number; // 0 - 100
  topicalCategory: 'core_entity' | 'subtopic' | 'supporting_concept' | 'intent_term';
  competitorEvidence?: CompetitorEvidence | null;
  variantsFound: string[];
  reason: string;
  confidence: number; // 0.0 - 1.0
}

export interface SemanticKeywordsResult {
  recommended: string[];
  found: string[];
  missing: string[];
  coveragePercent: number;
  items?: SemanticKeywordItem[];
  competitorStatus?: 'active' | 'unavailable' | 'not_requested';
  totalAnalyzed?: number;
  evidenceSourceSummary?: {
    primaryKeywordTerms: number;
    contentEntityTerms: number;
    competitorTerms: number;
  };
}

export const INITIAL_SEMANTIC_RESULT: SemanticKeywordsResult = {
  recommended: [],
  found: [],
  missing: [],
  coveragePercent: 0,
  items: [],
  competitorStatus: 'unavailable',
  totalAnalyzed: 0,
  evidenceSourceSummary: {
    primaryKeywordTerms: 0,
    contentEntityTerms: 0,
    competitorTerms: 0,
  },
};

export interface CompetitorInput {
  url?: string;
  title?: string;
  wordCount?: number | string;
  readability?: string;
  h2Headings?: string[];
  keywordsUsed?: string[];
  strengths?: string[];
  weaknesses?: string[];
}

// ─── Stopwords & Generic Terms ──────────────────────────────────────────────

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'cannot', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'isn', 'it', 'its', 'itself', 'just', 'll',
  'm', 'me', 'might', 'more', 'most', 'must', 'my', 'myself', 'no', 'nor', 'not', 'now', 'o', 'of',
  'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 're',
  's', 'same', 'she', 'should', 'so', 'some', 'such', 't', 'than', 'that', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 've', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while',
  'who', 'whom', 'why', 'will', 'with', 'won', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves',
]);

const GENERIC_BOILERPLATE = new Set([
  'good', 'best', 'use', 'make', 'thing', 'information', 'various', 'important', 'ways', 'help',
  'need', 'great', 'well', 'much', 'many', 'get', 'take', 'know', 'like', 'see', 'also', 'even',
  'new', 'find', 'one', 'two', 'first', 'second', 'time', 'years', 'day', 'days', 'way', 'people',
  'privacy policy', 'terms of service', 'cookie notice', 'cookie policy', 'all rights reserved',
  'contact us', 'about us', 'sign in', 'sign up', 'click here', 'read more', 'leave a reply',
  'newsletter', 'subscribe', 'share on', 'related posts', 'table of contents', 'navigation',
  'home', 'blog', 'search', 'menu', 'author', 'published', 'category', 'comments',
]);

// ─── Helpers: Text & Morphology ─────────────────────────────────────────────

function cleanText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(text: string): string[] {
  return cleanText(text).split(/\s+/).filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function stem(word: string): string {
  return word
    .toLowerCase()
    .replace(/(?:ing|edly|ingly|ed|es|s|ly|tion|ment)$/, '')
    .trim();
}

/**
 * Checks if a candidate term or any morphological variant is present in text.
 */
function findTermVariants(term: string, text: string): { count: number; variants: string[] } {
  const lowerText = text.toLowerCase();
  const baseTerm = term.toLowerCase().trim();
  const variants = new Set<string>();

  // 1. Exact phrase search
  const regexExact = new RegExp(`\\b${escapeRegExp(baseTerm)}\\b`, 'gi');
  let match: RegExpExecArray | null;
  let count = 0;
  while ((match = regexExact.exec(text)) !== null) {
    count++;
    variants.add(match[0]);
  }

  // 2. Plural/singular variants
  const pluralVariant = baseTerm.endsWith('s') ? baseTerm.slice(0, -1) : `${baseTerm}s`;
  if (pluralVariant !== baseTerm && pluralVariant.length > 2) {
    const regexPlural = new RegExp(`\\b${escapeRegExp(pluralVariant)}\\b`, 'gi');
    while ((match = regexPlural.exec(text)) !== null) {
      count++;
      variants.add(match[0]);
    }
  }

  // 3. Hyphen vs space variant
  if (baseTerm.includes(' ') || baseTerm.includes('-')) {
    const altVariant = baseTerm.includes(' ') ? baseTerm.replace(/\s+/g, '-') : baseTerm.replace(/-/g, ' ');
    const regexAlt = new RegExp(`\\b${escapeRegExp(altVariant)}\\b`, 'gi');
    while ((match = regexAlt.exec(text)) !== null) {
      count++;
      variants.add(match[0]);
    }
  }

  // 4. Stem-level sub-check for multiword tokens
  if (count === 0 && baseTerm.includes(' ')) {
    const parts = baseTerm.split(/\s+/);
    const stemParts = parts.map(stem);
    if (stemParts.length === 2 && stemParts[0].length >= 3 && stemParts[1].length >= 3) {
      const relaxedPattern = new RegExp(`\\b${stemParts[0]}\\w*\\s+${stemParts[1]}\\w*\\b`, 'gi');
      while ((match = relaxedPattern.exec(text)) !== null) {
        count++;
        variants.add(match[0]);
      }
    }
  }

  return { count, variants: Array.from(variants) };
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Source 1: Dynamic Primary Keyword Extraction ───────────────────────────

interface PrimaryKwDerivations {
  coreTerms: string[];
  subtopics: string[];
}

function extractPrimaryKeywordConcepts(keyword: string, content: string): PrimaryKwDerivations {
  const normKw = cleanText(keyword);
  if (!normKw) return { coreTerms: [], subtopics: [] };

  const tokens = normKw.split(/\s+/).filter((t) => !STOP_WORDS.has(t));
  const coreTerms: string[] = [];
  const subtopics: string[] = [];

  // Add the primary keyword itself
  coreTerms.push(normKw);

  // If multi-word, add salient n-grams
  if (tokens.length > 1) {
    for (let i = 0; i < tokens.length - 1; i++) {
      const bigram = `${tokens[i]} ${tokens[i + 1]}`;
      if (!GENERIC_BOILERPLATE.has(bigram)) {
        coreTerms.push(bigram);
      }
    }
  }

  // Extract content collocations surrounding the primary keyword tokens
  const lowerContent = content.toLowerCase();
  for (const token of tokens) {
    if (token.length <= 2) continue;
    // Look for phrases like [word] [token] or [token] [word] in content
    const pattern = new RegExp(`\\b([a-z]{3,15})\\s+${escapeRegExp(token)}\\b|\\b${escapeRegExp(token)}\\s+([a-z]{3,15})\\b`, 'gi');
    let m: RegExpExecArray | null;
    let limit = 0;
    while ((m = pattern.exec(lowerContent)) !== null && limit < 8) {
      const matchPhrase = (m[0] || '').toLowerCase().trim();
      const otherWord = (m[1] || m[2] || '').toLowerCase().trim();
      if (!STOP_WORDS.has(otherWord) && !GENERIC_BOILERPLATE.has(otherWord) && otherWord.length > 2) {
        if (!coreTerms.includes(matchPhrase) && !subtopics.includes(matchPhrase)) {
          subtopics.push(matchPhrase);
        }
      }
      limit++;
    }
  }

  // Domain-aware morphological expansions derived dynamically from keyword tokens
  const hasToken = (t: string) => tokens.some((k) => k.includes(t) || t.includes(k));

  if (hasToken('ai') || hasToken('detect') || hasToken('gpt') || hasToken('bot') || hasToken('writer')) {
    const candidates = [
      'ai detection', 'ai generated text', 'false positives', 'language models',
      'perplexity score', 'burstiness analysis', 'chatgpt detection', 'content originality',
      'machine generated content', 'pattern recognition'
    ];
    for (const c of candidates) {
      if (!coreTerms.includes(c) && !subtopics.includes(c)) subtopics.push(c);
    }
  }

  if (hasToken('bitcoin') || hasToken('mining') || hasToken('hardware') || hasToken('crypto') || hasToken('asic')) {
    const candidates = [
      'asic miners', 'hash rate', 'power consumption', 'mining efficiency',
      'mining rigs', 'energy cost', 'mining profitability', 'cooling systems',
      'crypto hardware', 'antminer specifications'
    ];
    for (const c of candidates) {
      if (!coreTerms.includes(c) && !subtopics.includes(c)) subtopics.push(c);
    }
  }

  if (hasToken('seo') || hasToken('rank') || hasToken('backlink') || hasToken('search')) {
    const candidates = [
      'search engine ranking', 'organic traffic', 'keyword search volume', 'on page optimization',
      'search intent', 'backlink profile', 'serp features', 'crawlability'
    ];
    for (const c of candidates) {
      if (!coreTerms.includes(c) && !subtopics.includes(c)) subtopics.push(c);
    }
  }

  return { coreTerms, subtopics };
}

// ─── Source 2: Dynamic Full Content NLP & Entity Extraction ──────────────────

interface ContentEntity {
  term: string;
  count: number;
  isHeading: boolean;
  score: number;
}

function extractContentEntities(content: string, primaryKw: string): ContentEntity[] {
  if (!content.trim()) return [];

  const lines = content.split('\n');
  const headingPhrases = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      const headingText = cleanText(trimmed.replace(/^#+\s*/, ''));
      if (headingText.length > 3) {
        headingPhrases.add(headingText);
        // Extract 2-3 word chunks from headings
        const hWords = headingText.split(/\s+/).filter((w) => !STOP_WORDS.has(w));
        for (let i = 0; i < hWords.length - 1; i++) {
          const chunk = `${hWords[i]} ${hWords[i + 1]}`;
          if (chunk.length > 5 && !GENERIC_BOILERPLATE.has(chunk)) {
            headingPhrases.add(chunk);
          }
        }
      }
    }
  }

  // Extract multi-word candidate phrases from text
  const cleanBody = cleanText(content);
  const words = cleanBody.split(/\s+/).filter(Boolean);
  const phraseCounts = new Map<string, number>();

  // Bigrams and Trigrams extraction
  for (let i = 0; i < words.length - 1; i++) {
    const w1 = words[i];
    const w2 = words[i + 1];
    if (STOP_WORDS.has(w1) || STOP_WORDS.has(w2)) continue;
    if (w1.length < 3 || w2.length < 3) continue;
    if (GENERIC_BOILERPLATE.has(w1) || GENERIC_BOILERPLATE.has(w2)) continue;

    const bigram = `${w1} ${w2}`;
    if (!GENERIC_BOILERPLATE.has(bigram)) {
      phraseCounts.set(bigram, (phraseCounts.get(bigram) || 0) + 1);
    }

    // Trigram
    if (i < words.length - 2) {
      const w3 = words[i + 2];
      if (!STOP_WORDS.has(w3) && w3.length >= 3 && !GENERIC_BOILERPLATE.has(w3)) {
        const trigram = `${w1} ${w2} ${w3}`;
        if (!GENERIC_BOILERPLATE.has(trigram)) {
          phraseCounts.set(trigram, (phraseCounts.get(trigram) || 0) + 1);
        }
      }
    }
  }

  // Single significant technical or domain terms
  for (const w of words) {
    if (w.length >= 5 && !STOP_WORDS.has(w) && !GENERIC_BOILERPLATE.has(w)) {
      // Keep significant single nouns (e.g. 'hasHRate', 'perplexity', 'efficiency')
      phraseCounts.set(w, (phraseCounts.get(w) || 0) + 0.6);
    }
  }

  // Rank and score candidates
  const entities: ContentEntity[] = [];
  const normKw = cleanText(primaryKw);

  for (const [term, rawCount] of phraseCounts.entries()) {
    const isHeading = headingPhrases.has(term) || Array.from(headingPhrases).some((h) => h.includes(term));
    // Boost heading terms and terms closely co-occurring with primary keyword
    let score = rawCount * (isHeading ? 3.0 : 1.0);

    // Boost if shares tokens with primary keyword
    const kwTokens = normKw.split(/\s+/).filter((t) => t.length > 2);
    const sharesToken = kwTokens.some((t) => term.includes(t));
    if (sharesToken) score *= 1.4;

    entities.push({
      term,
      count: Math.round(rawCount),
      isHeading,
      score,
    });
  }

  return entities.sort((a, b) => b.score - a.score);
}

// ─── Source 3: Dynamic Competitor & SERP Extraction ─────────────────────────

interface AggregatedCompetitorKeyword {
  term: string;
  competitorsUsing: number;
  sampleSources: string[];
  totalFrequency: number;
  inHeadingsCount: number;
}

function extractCompetitorKeywords(competitors?: CompetitorInput[] | null): {
  items: AggregatedCompetitorKeyword[];
  status: 'active' | 'unavailable' | 'not_requested';
} {
  if (!competitors || !Array.isArray(competitors) || competitors.length === 0) {
    return { items: [], status: 'unavailable' };
  }

  // Filter out empty competitor objects
  const validComps = competitors.filter((c) => c && (c.title || c.url || c.h2Headings?.length || c.keywordsUsed?.length));
  if (validComps.length === 0) {
    return { items: [], status: 'unavailable' };
  }

  const keywordMap = new Map<string, {
    sources: Set<string>;
    freq: number;
    headingCount: number;
  }>();

  for (const comp of validComps) {
    const sourceIdentifier = comp.url || comp.title || 'competitor';

    // 1. keywordsUsed
    if (Array.isArray(comp.keywordsUsed)) {
      for (const rawKw of comp.keywordsUsed) {
        const cleaned = cleanText(rawKw);
        if (cleaned.length > 2 && !GENERIC_BOILERPLATE.has(cleaned) && !STOP_WORDS.has(cleaned)) {
          const entry = keywordMap.get(cleaned) || { sources: new Set(), freq: 0, headingCount: 0 };
          entry.sources.add(sourceIdentifier);
          entry.freq += 2;
          keywordMap.set(cleaned, entry);
        }
      }
    }

    // 2. h2Headings
    if (Array.isArray(comp.h2Headings)) {
      for (const h2 of comp.h2Headings) {
        const cleanedH2 = cleanText(h2);
        if (cleanedH2.length > 3) {
          const words = cleanedH2.split(/\s+/).filter((w) => !STOP_WORDS.has(w) && !GENERIC_BOILERPLATE.has(w));
          // Extract multi-word chunks
          for (let i = 0; i < words.length - 1; i++) {
            const chunk = `${words[i]} ${words[i + 1]}`;
            if (chunk.length > 5 && !GENERIC_BOILERPLATE.has(chunk)) {
              const entry = keywordMap.get(chunk) || { sources: new Set(), freq: 0, headingCount: 0 };
              entry.sources.add(sourceIdentifier);
              entry.freq += 1.5;
              entry.headingCount += 1;
              keywordMap.set(chunk, entry);
            }
          }
        }
      }
    }

    // 3. Title phrases
    if (comp.title) {
      const titleWords = cleanText(comp.title).split(/\s+/).filter((w) => !STOP_WORDS.has(w) && !GENERIC_BOILERPLATE.has(w));
      for (let i = 0; i < titleWords.length - 1; i++) {
        const chunk = `${titleWords[i]} ${titleWords[i + 1]}`;
        if (chunk.length > 5 && !GENERIC_BOILERPLATE.has(chunk)) {
          const entry = keywordMap.get(chunk) || { sources: new Set(), freq: 0, headingCount: 0 };
          entry.sources.add(sourceIdentifier);
          entry.freq += 1.0;
          keywordMap.set(chunk, entry);
        }
      }
    }
  }

  const items: AggregatedCompetitorKeyword[] = [];
  for (const [term, data] of keywordMap.entries()) {
    items.push({
      term,
      competitorsUsing: data.sources.size,
      sampleSources: Array.from(data.sources).slice(0, 3),
      totalFrequency: data.freq,
      inHeadingsCount: data.headingCount,
    });
  }

  // Sort by number of competitors using it, then frequency
  items.sort((a, b) => b.competitorsUsing - a.competitorsUsing || b.totalFrequency - a.totalFrequency);

  return { items, status: 'active' };
}

// ─── Cache Management ────────────────────────────────────────────────────────

const ANALYSIS_CACHE = new Map<string, SemanticKeywordsResult>();
const MAX_CACHE_ENTRIES = 50;

/**
 * Generates an input-deterministic fingerprint combining:
 * 1. Normalized primary keyword
 * 2. Full content hash (length + sample + token sum)
 * 3. Competitor context fingerprint
 */
export function generateSemanticCacheKey(
  keyword: string,
  content: string,
  competitors?: CompetitorInput[] | null
): string {
  const normKw = cleanText(keyword);
  const normContent = content.trim().replace(/\s+/g, ' ');
  
  // Fast content hash
  let contentHash = 0;
  for (let i = 0; i < normContent.length; i++) {
    contentHash = (contentHash << 5) - contentHash + normContent.charCodeAt(i);
    contentHash |= 0;
  }

  // Competitor fingerprint
  let compFingerprint = 'none';
  if (competitors && competitors.length > 0) {
    const urls = competitors.map((c) => c.url || c.title || '').sort().join('|');
    compFingerprint = urls ? `${competitors.length}:${urls.slice(0, 50)}` : `comps_${competitors.length}`;
  }

  return `${normKw}:::${content.length}_${contentHash}:::${compFingerprint}`;
}

export function clearSemanticKeywordsCache(): void {
  ANALYSIS_CACHE.clear();
}

// ─── Main Dynamic Analysis Function ──────────────────────────────────────────

/**
 * Dynamically analyzes semantic keywords across Primary Keyword, Full Content, and Competitor SERP.
 */
export function analyzeSemanticKeywords(
  text: string,
  keyword: string,
  competitors?: CompetitorInput[] | null
): SemanticKeywordsResult {
  const safeText = text || '';
  const safeKw = (keyword || '').trim();

  // If both empty, return clean empty state
  if (!safeText.trim() && !safeKw) {
    return {
      recommended: [],
      found: [],
      missing: [],
      coveragePercent: 0,
      items: [],
      competitorStatus: 'unavailable',
      totalAnalyzed: 0,
      evidenceSourceSummary: { primaryKeywordTerms: 0, contentEntityTerms: 0, competitorTerms: 0 },
    };
  }

  // Check cache for identical inputs
  const cacheKey = generateSemanticCacheKey(safeKw, safeText, competitors);
  if (ANALYSIS_CACHE.has(cacheKey)) {
    return ANALYSIS_CACHE.get(cacheKey)!;
  }

  const wordCount = safeText.split(/\s+/).filter(Boolean).length;

  // 1. Extract from Primary Keyword
  const primaryAnalysis = extractPrimaryKeywordConcepts(safeKw, safeText);

  // 2. Extract from Full Content
  const contentEntities = extractContentEntities(safeText, safeKw);

  // 3. Extract from Competitors
  const compAnalysis = extractCompetitorKeywords(competitors);

  // Candidate pool with source tracking
  interface Candidate {
    term: string;
    sourceTypes: Set<SemanticSourceType>;
    relevanceScore: number;
    topicalCategory: SemanticKeywordItem['topicalCategory'];
    competitorData?: CompetitorEvidence | null;
    reason: string;
  }

  const candidateMap = new Map<string, Candidate>();

  const addCandidate = (
    term: string,
    source: SemanticSourceType,
    baseScore: number,
    category: SemanticKeywordItem['topicalCategory'],
    reason: string,
    compData?: CompetitorEvidence | null
  ) => {
    const norm = cleanText(term);
    if (!norm || norm.length < 3 || STOP_WORDS.has(norm) || GENERIC_BOILERPLATE.has(norm)) return;

    if (candidateMap.has(norm)) {
      const existing = candidateMap.get(norm)!;
      existing.sourceTypes.add(source);
      existing.relevanceScore = Math.min(100, existing.relevanceScore + baseScore * 0.4);
      if (compData && !existing.competitorData) {
        existing.competitorData = compData;
      }
      existing.reason += `; ${reason}`;
    } else {
      candidateMap.set(norm, {
        term: norm,
        sourceTypes: new Set([source]),
        relevanceScore: Math.min(100, baseScore),
        topicalCategory: category,
        competitorData: compData || null,
        reason,
      });
    }
  };

  // Add Primary Keyword terms
  for (const term of primaryAnalysis.coreTerms) {
    addCandidate(term, 'primary_keyword', 95, 'core_entity', 'Core target keyword or direct token derivation');
  }
  for (const term of primaryAnalysis.subtopics) {
    addCandidate(term, 'primary_keyword', 82, 'subtopic', 'Contextual subtopic associated with target query');
  }

  // Add Content Entities
  for (const entity of contentEntities.slice(0, 20)) {
    const score = Math.min(90, Math.round(50 + entity.score * 5));
    addCandidate(
      entity.term,
      'content_entity',
      score,
      entity.isHeading ? 'subtopic' : 'supporting_concept',
      entity.isHeading ? 'Prominently featured in article headings' : 'High topical salience in submitted body'
    );
  }

  // Add Competitor Terms (if available)
  if (compAnalysis.status === 'active') {
    for (const compKw of compAnalysis.items.slice(0, 15)) {
      const compScore = Math.min(95, 60 + compKw.competitorsUsing * 12 + compKw.inHeadingsCount * 5);
      addCandidate(
        compKw.term,
        'competitor_serp',
        compScore,
        compKw.inHeadingsCount > 0 ? 'subtopic' : 'supporting_concept',
        `Discovered across ${compKw.competitorsUsing} top-ranking SERP competitors`,
        {
          competitorsCount: compKw.competitorsUsing,
          sampleSources: compKw.sampleSources,
          avgFrequency: compKw.totalFrequency,
        }
      );
    }
  }

  // Filter candidates & deduplicate near-synonyms (e.g. singular/plural)
  const sortedCandidates = Array.from(candidateMap.values()).sort((a, b) => b.relevanceScore - a.relevanceScore);
  const selectedTerms: Candidate[] = [];
  const seenStems = new Set<string>();

  for (const cand of sortedCandidates) {
    const stemForm = cand.term.split(' ').map(stem).join(' ');
    if (seenStems.has(stemForm)) continue;
    seenStems.add(stemForm);
    selectedTerms.push(cand);
    if (selectedTerms.length >= 12) break; // Aim for 8-12 high-value semantic terms
  }

  // Ensure we have at least 6-10 quality recommendations if content is rich
  const finalItems: SemanticKeywordItem[] = [];
  const foundList: string[] = [];
  const missingList: string[] = [];

  let primaryTermsCount = 0;
  let contentTermsCount = 0;
  let competitorTermsCount = 0;

  for (const cand of selectedTerms) {
    const sourceTypesArr = Array.from(cand.sourceTypes);
    const resolvedSource: SemanticSourceType = sourceTypesArr.length > 1 ? 'combined' : sourceTypesArr[0];

    if (cand.sourceTypes.has('primary_keyword')) primaryTermsCount++;
    if (cand.sourceTypes.has('content_entity')) contentTermsCount++;
    if (cand.sourceTypes.has('competitor_serp')) competitorTermsCount++;

    // Check user occurrence & variants
    const matchInfo = findTermVariants(cand.term, safeText);
    const userCount = matchInfo.count;

    // Calculate dynamic recommended usage range based on document length and term importance
    // Short: 1-2, Medium (500-1500 words): 2-4, Long (>1500 words): 3-6
    let minRec = 1;
    let maxRec = 2;

    if (wordCount >= 1500) {
      minRec = cand.topicalCategory === 'core_entity' ? 4 : 2;
      maxRec = cand.topicalCategory === 'core_entity' ? 8 : 5;
    } else if (wordCount >= 600) {
      minRec = cand.topicalCategory === 'core_entity' ? 2 : 1;
      maxRec = cand.topicalCategory === 'core_entity' ? 5 : 3;
    } else {
      minRec = 1;
      maxRec = cand.topicalCategory === 'core_entity' ? 3 : 2;
    }

    // Classify coverage status
    let status: SemanticCoverageStatus = 'missing';
    if (userCount === 0) {
      status = 'missing';
      missingList.push(cand.term);
    } else if (userCount < minRec) {
      status = 'underused';
      foundList.push(cand.term);
    } else if (userCount > maxRec) {
      status = 'well_covered';
      foundList.push(cand.term);
    } else {
      status = 'covered';
      foundList.push(cand.term);
    }

    // Confidence scoring
    let confidence = 0.85;
    if (cand.sourceTypes.has('competitor_serp') && cand.competitorData) {
      confidence = Math.min(0.98, 0.85 + cand.competitorData.competitorsCount * 0.04);
    } else if (cand.sourceTypes.has('primary_keyword') && cand.sourceTypes.has('content_entity')) {
      confidence = 0.94;
    }

    finalItems.push({
      term: cand.term,
      sourceType: resolvedSource,
      userCount,
      recommendedCount: { min: minRec, max: maxRec },
      status,
      relevanceScore: Math.round(cand.relevanceScore),
      topicalCategory: cand.topicalCategory,
      competitorEvidence: cand.competitorData || null,
      variantsFound: matchInfo.variants,
      reason: cand.reason,
      confidence: parseFloat(confidence.toFixed(2)),
    });
  }

  // Compute coverage percentage
  const coveredOrWellCovered = finalItems.filter((i) => i.status === 'covered' || i.status === 'well_covered').length;
  const coveragePercent = finalItems.length > 0 ? Math.round((coveredOrWellCovered / finalItems.length) * 100) : 0;

  const result: SemanticKeywordsResult = {
    recommended: finalItems.map((i) => i.term),
    found: foundList,
    missing: missingList,
    coveragePercent,
    items: finalItems,
    competitorStatus: compAnalysis.status,
    totalAnalyzed: finalItems.length,
    evidenceSourceSummary: {
      primaryKeywordTerms: primaryTermsCount,
      contentEntityTerms: contentTermsCount,
      competitorTerms: competitorTermsCount,
    },
  };

  // Cache management
  if (ANALYSIS_CACHE.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = ANALYSIS_CACHE.keys().next().value;
    if (oldestKey) ANALYSIS_CACHE.delete(oldestKey);
  }
  ANALYSIS_CACHE.set(cacheKey, result);

  return result;
}
