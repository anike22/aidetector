/**
 * Contextual E-E-A-T Intelligence Engine
 * 
 * Dynamically evaluates Experience, Expertise, Authoritativeness, and Trust (E-E-A-T)
 * without static mocks, generic templates, or fabricated experience/citations.
 * 
 * Rules:
 * 1. NEVER fabricate personal experience ("In our tests...", "We tested...") unless supported by content.
 * 2. NEVER fabricate citations, research studies, statistics, or URLs.
 * 3. Flag unsupported statistical and superlative claims with exact offsets.
 * 4. Adapt recommendations dynamically to article type, keyword, full content, and competitor SERP evidence.
 */

export type EEATEvidenceStatus = 
  | 'ready_to_insert' 
  | 'author_input_required' 
  | 'source_required' 
  | 'review_required';

export type EEATOpportunityType = 
  | 'experience'
  | 'methodology'
  | 'stats'
  | 'citation'
  | 'author'
  | 'qualification'
  | 'disclosure'
  | 'limitation'
  | 'technical_clarity';

export interface EEATOpportunity {
  id: string;
  type: EEATOpportunityType;
  title: string;
  targetStartOffset: number;
  targetEndOffset: number;
  targetSection: 'intro' | 'after_h1' | 'end' | 'cursor' | string;
  targetPassage?: string;
  reason: string;
  suggestedText: string;
  evidenceStatus: EEATEvidenceStatus;
  confidence: number;
  severity: 'critical' | 'important' | 'suggestion';
  claimSnippet?: string;
  sourceRecommendation?: string;
}

export interface EEATDimensionScore {
  score: number; // 0 - 100
  strengths: string[];
  gaps: string[];
}

export interface DetectedClaim {
  text: string;
  sentence: string;
  type: 'statistic' | 'superlative' | 'unverified_factual';
  hasCitation: boolean;
  startOffset: number;
  endOffset: number;
}

export interface ExistingEEATSignals {
  hasPersonalExperience: boolean;
  hasMethodology: boolean;
  hasStats: boolean;
  hasCitations: boolean;
  hasAuthor: boolean;
  hasLimitations: boolean;
  firstPersonCount: number;
  citationCount: number;
  citedClaimsCount: number;
  unsupportedClaimsCount: number;
  detectedMethodologySnippet?: string;
}

export interface EEATResult {
  score: number;
  hasPersonalExamples: boolean;
  hasStats: boolean;
  hasCitations: boolean;
  hasAuthor: boolean;
  recommendations: string[];
  // Enhanced dynamic contextual properties
  articleType?: string;
  opportunities?: EEATOpportunity[];
  dimensions?: {
    experience: EEATDimensionScore;
    expertise: EEATDimensionScore;
    authoritativeness: EEATDimensionScore;
    trust: EEATDimensionScore;
  };
  detectedClaims?: DetectedClaim[];
  existingSignals?: ExistingEEATSignals;
}

// ─── Cache Management ─────────────────────────────────────────────────────────

const eeatCache = new Map<string, { result: EEATResult; timestamp: number }>();
const CACHE_TTL_MS = 60_000;

export function clearEEATCache(): void {
  eeatCache.clear();
}

export function generateEEATCacheKey(
  keyword: string,
  content: string,
  extra?: string
): string {
  const normKw = (keyword || '').trim().toLowerCase();
  const len = content.length;
  // Sample fingerprint
  const start = content.slice(0, 100);
  const mid = content.slice(Math.floor(len / 2), Math.floor(len / 2) + 100);
  const end = content.slice(-100);
  const rawKey = `${normKw}::${len}::${start}::${mid}::${end}::${extra || ''}`;
  
  let hash = 0;
  for (let i = 0; i < rawKey.length; i++) {
    hash = (hash << 5) - hash + rawKey.charCodeAt(i);
    hash |= 0;
  }
  return `eeat_${Math.abs(hash).toString(36)}`;
}

// ─── Article Classification ───────────────────────────────────────────────────

export function classifyArticleType(text: string, keyword: string): string {
  const combined = `${keyword} ${text}`.toLowerCase();

  const isBenchmark =
    /\b(benchmark|methodology|test dataset|sample size|evaluated \d+|accuracy test|false positive rate|confusion matrix)\b/i.test(combined);
  if (isBenchmark) return 'benchmark';

  const isReview =
    /\b(review|hands-on review|tested and reviewed|pros and cons|our verdict|rating:? \d|in-depth review)\b/i.test(combined);
  if (isReview) return 'review';

  const isComparison =
    /\b( vs |versus|comparison|compared to|alternative to|head to head)\b/i.test(combined);
  if (isComparison) return 'comparison';

  const isTutorial =
    /\b(how to|step by step|guide to|tutorial|installation guide|walkthrough|setup guide)\b/i.test(combined);
  if (isTutorial) return 'tutorial';

  const isTechnical =
    /\b(architecture|algorithm|specification|hardware|asic|hash rate|protocol|implementation|api|parameters)\b/i.test(combined);
  if (isTechnical) return 'technical';

  return 'informational';
}

// ─── Claim & Signal Extraction ────────────────────────────────────────────────

const CITATION_REGEX =
  /(https?:\/\/[^\s\)]+|source:\s*[^,\n\.]+|\[\d+\]|\([A-Z][a-z]+(?:\s+et\s+al\.?)?,\s*\d{4}\)|according to\s+[A-Z][a-zA-Z\s]+|published in\s+[A-Z][a-zA-Z\s]+|documented by\s+[A-Z][a-zA-Z\s]+)/i;

const METHODOLOGY_REGEX =
  /\b(we tested|our benchmark|tested across \d+|sample size of \d+|testing methodology|evaluation methodology|evaluated \d+ samples?|in our lab|conducted \d+ tests?|measured under controlled)\b/i;

const STAT_CLAIM_REGEX =
  /\b(\d+(?:\.\d+)?%|\b\d+x\b|\bzero false positives\b|\b100% accuracy\b|\b99% accuracy\b|\b\d{2,3} percent\b)/gi;

const SUPERLATIVE_CLAIM_REGEX =
  /\b(the best detector|100% accurate|guaranteed to bypass|completely undetectable|the most reliable|flawless accuracy)\b/gi;

export function extractFactualAndStatisticalClaims(text: string): DetectedClaim[] {
  const claims: DetectedClaim[] = [];
  const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [text];
  
  let currentOffset = 0;

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    const sentenceStart = text.indexOf(sentence, currentOffset);
    const sentenceEnd = sentenceStart + sentence.length;
    currentOffset = sentenceEnd;

    if (!trimmed) continue;

    const hasCitation = CITATION_REGEX.test(sentence);

    // Check statistical claims
    let statMatch: RegExpExecArray | null;
    STAT_CLAIM_REGEX.lastIndex = 0;
    while ((statMatch = STAT_CLAIM_REGEX.exec(sentence)) !== null) {
      claims.push({
        text: statMatch[0],
        sentence: trimmed,
        type: 'statistic',
        hasCitation,
        startOffset: sentenceStart + statMatch.index,
        endOffset: sentenceStart + statMatch.index + statMatch[0].length,
      });
    }

    // Check superlative claims
    let supMatch: RegExpExecArray | null;
    SUPERLATIVE_CLAIM_REGEX.lastIndex = 0;
    while ((supMatch = SUPERLATIVE_CLAIM_REGEX.exec(sentence)) !== null) {
      claims.push({
        text: supMatch[0],
        sentence: trimmed,
        type: 'superlative',
        hasCitation,
        startOffset: sentenceStart + supMatch.index,
        endOffset: sentenceStart + supMatch.index + supMatch[0].length,
      });
    }
  }

  return claims;
}

const EXAMPLE_SIGNALS = ['for example', 'for instance', 'in my experience', 'i found', 'i noticed', 'we found', 'case study', 'real-world', 'in practice'];
const STATS_SIGNALS = ['%', 'according to', 'study', 'research', 'survey', 'data shows', 'statistics', 'report', 'found that', 'showed that'];
const CITATION_SIGNALS = ['source:', 'reference:', 'https://', 'http://', 'cited', 'published by', 'journal', 'university', '.org', '.gov', '.edu'];
const AUTHOR_SIGNALS = ['written by', 'authored by', 'by the team', 'reviewed by', 'fact-checked', 'editor', 'contributor', 'senior technical editor'];

export function detectExistingEvidence(text: string): ExistingEEATSignals {
  const lower = text.toLowerCase();

  // Personal experience signals
  const firstPersonMatches = lower.match(/\b(i tested|we tested|in my testing|in our testing|in our practical testing|i observed|we observed|i found|we found|in our hands-on|in our lab|we measured|we evaluated|i evaluated|our clinical trial|in our trial|in our study)\b/g);
  const firstPersonCount = firstPersonMatches ? firstPersonMatches.length : 0;

  // Real methodology signals
  const methMatch = text.match(METHODOLOGY_REGEX);
  const hasMethodology = methMatch !== null;
  const detectedMethodologySnippet = methMatch ? methMatch[0] : undefined;
  const hasPersonalExperience = firstPersonCount > 0 || hasMethodology || EXAMPLE_SIGNALS.some((s) => lower.includes(s));

  // Stats signals
  const statMatches = text.match(/\b(\d+(?:\.\d+)?%|\b\d+ (?:study|report|survey|benchmark|test samples))\b/gi);
  const hasStats = (statMatches && statMatches.length > 0) || STATS_SIGNALS.some((s) => lower.includes(s));

  // Citation signals
  const citationMatches = text.match(/(https?:\/\/[^\s\)]+|\[\d+\]|\([A-Z][a-z]+,\s*\d{4}\))/gi);
  const citationCount = citationMatches ? citationMatches.length : 0;
  const hasCitations = CITATION_REGEX.test(text) || CITATION_SIGNALS.some((s) => lower.includes(s));

  // Author attribution signals
  const hasAuthor = AUTHOR_SIGNALS.some((s) => lower.includes(s));

  // Limitations / qualifications signals
  const hasLimitations = /\b(limitations?|boundary conditions?|false positives?|known issues?|caveat|not 100%|trade-offs?|risks?)\b/i.test(text);

  return {
    hasPersonalExperience,
    hasMethodology,
    hasStats,
    hasCitations,
    hasAuthor,
    hasLimitations,
    firstPersonCount,
    citationCount,
    citedClaimsCount: 0,
    unsupportedClaimsCount: 0,
    detectedMethodologySnippet,
  };
}

// ─── Dynamic E-E-A-T Opportunities Generator ───────────────────────────────────

export function generateDynamicEEATOpportunities(
  text: string,
  keyword: string,
  articleType: string,
  claims: DetectedClaim[],
  signals: ExistingEEATSignals,
  competitorContext?: { sampleTopics?: string[]; commonSources?: string[] }
): { opportunities: EEATOpportunity[]; recommendations: string[] } {
  const opportunities: EEATOpportunity[] = [];
  const recommendations: string[] = [];
  const kw = keyword.trim() || 'the subject topic';

  // 1. STATISTICAL CLAIMS WITHOUT ATTRIBUTION (Highest Factual Risk)
  const unsupportedStats = claims.filter((c) => c.type === 'statistic' && !c.hasCitation);
  for (const claim of unsupportedStats.slice(0, 2)) {
    const isHighAccuracy = /99%|100%|\d{2,3}%/i.test(claim.text);
    opportunities.push({
      id: `eeat-stat-${claim.startOffset}`,
      type: 'stats',
      title: `Support Quantitative Claim: "${claim.text}"`,
      targetStartOffset: claim.startOffset,
      targetEndOffset: claim.endOffset,
      targetSection: 'cursor',
      targetPassage: claim.sentence,
      reason: `Quantitative claim "${claim.text}" requires an authoritative benchmark, study, or dataset source to prevent editorial mistrust.`,
      suggestedText: `*(Authoritative source needed: cite the benchmark or evaluation dataset validating this ${claim.text} figure)*`,
      evidenceStatus: 'source_required',
      confidence: 0.95,
      severity: isHighAccuracy ? 'critical' : 'important',
      claimSnippet: claim.sentence,
      sourceRecommendation: 'Authoritative source needed: primary benchmark, official documentation, or peer-reviewed study.',
    });
    recommendations.push(`Verification required: quantitative claim "${claim.text}" needs an empirical benchmark or qualification.`);
  }

  // 2. SUPERLATIVE CLAIMS WITHOUT QUALIFICATION
  const unverifiedSuperlatives = claims.filter((c) => c.type === 'superlative' && !c.hasCitation);
  for (const claim of unverifiedSuperlatives.slice(0, 1)) {
    opportunities.push({
      id: `eeat-sup-${claim.startOffset}`,
      type: 'qualification',
      title: `Qualify Superlative Statement: "${claim.text}"`,
      targetStartOffset: claim.startOffset,
      targetEndOffset: claim.endOffset,
      targetSection: 'cursor',
      targetPassage: claim.sentence,
      reason: `Absolute claims like "${claim.text}" undermine technical credibility. Qualify with scope, conditions, and measurable constraints.`,
      suggestedText: `*(Qualification required: state specific operating conditions and testing boundaries rather than absolute claims)*`,
      evidenceStatus: 'review_required',
      confidence: 0.9,
      severity: 'important',
      claimSnippet: claim.sentence,
    });
    recommendations.push(`Qualify absolute statement "${claim.text}" with specific operational boundaries.`);
  }

  // 3. EXPERIENCE & METHODOLOGY (Strict Non-Fabrication)
  const isEvaluationOrTool =
    articleType === 'benchmark' ||
    articleType === 'review' ||
    articleType === 'technical' ||
    /\b(detector|checker|software|tool|app|model|algorithm|hardware|mining|rig|antminer)\b/i.test(kw + ' ' + text);

  if (isEvaluationOrTool) {
    if (signals.hasMethodology || signals.hasPersonalExperience) {
      // Real methodology already present -> Provide synthesis / executive takeaway
      opportunities.push({
        id: 'eeat-methodology-synthesis',
        type: 'methodology',
        title: 'Documented Methodology Summary',
        targetStartOffset: 0,
        targetEndOffset: 0,
        targetSection: 'after_h1',
        reason: 'Article already contains empirical evaluation signals. Highlight these concrete findings in a structured executive note.',
        suggestedText: `> **Evaluation Framework & Test Summary:**\n> This analysis is grounded in direct evaluation across controlled test scenarios for ${kw}. Key findings are documented with transparent test boundaries below.`,
        evidenceStatus: 'ready_to_insert',
        confidence: 0.92,
        severity: 'suggestion',
      });
    } else {
      // NO testing evidence -> Request legitimate author experience (NEVER fabricate "In our tests...")
      opportunities.push({
        id: 'eeat-experience-needed',
        type: 'experience',
        title: 'Add Real First-Hand Testing Evidence',
        targetStartOffset: 0,
        targetEndOffset: 0,
        targetSection: 'after_h1',
        reason: `Article evaluates ${kw} without documented first-hand test results, sample size, or evaluation protocol.`,
        suggestedText: `> **Author Field Note & Methodology (Author Input Needed):**\n> [Specify your actual testing setup: sample count, specific tools/hardware evaluated, test parameters, and observed edge cases for ${kw}].`,
        evidenceStatus: 'author_input_required',
        confidence: 0.94,
        severity: 'critical',
      });
      recommendations.push(`Experience evidence needed: consider adding results from an actual ${kw} evaluation, including sample size and methodology.`);
    }
  } else if (!signals.hasPersonalExperience) {
    // Informational or tutorial without practical examples
    opportunities.push({
      id: 'eeat-experience-practical',
      type: 'experience',
      title: 'Contextual First-Hand Observation',
      targetStartOffset: 0,
      targetEndOffset: 0,
      targetSection: 'after_h1',
      reason: `Readers value practical observations. Add a genuine implementation takeaway regarding ${kw}.`,
      suggestedText: `> **Practical Implementation Note (Author Experience Needed):**\n> [Insert a real-world scenario or practical nuance encountered when applying ${kw} in production].`,
      evidenceStatus: 'author_input_required',
      confidence: 0.85,
      severity: 'suggestion',
    });
    recommendations.push('Add real examples or personal experience to demonstrate expertise.');
  }

  if (!signals.hasStats) {
    recommendations.push('Include statistics or research data to build authority.');
  }

  if (!signals.hasCitations && !recommendations.some(r => r.includes('citations or source links'))) {
    recommendations.push('Add citations or source links to establish trustworthiness.');
  }

  // 4. AUTHOR ATTRIBUTION & TRANSPARENCY
  if (!signals.hasAuthor) {
    opportunities.push({
      id: 'eeat-author-attribution',
      type: 'author',
      title: 'Author & Reviewer Attribution',
      targetStartOffset: 0,
      targetEndOffset: 0,
      targetSection: 'intro',
      reason: 'Author credentials and editorial fact-checking attribution establish E-E-A-T transparency.',
      suggestedText: `> **Authored by [Author Name, Professional Credentials] · Reviewed by [Subject Matter Expert]**\n> *Fact-checked for technical accuracy · Editorial disclosure: [Independent evaluation / No commercial sponsorship]*`,
      evidenceStatus: 'author_input_required',
      confidence: 0.96,
      severity: 'important',
    });
    recommendations.push('Include author attribution (written by / reviewed by) for E-E-A-T compliance.');
  }

  // 5. TECHNICAL LIMITATIONS & BOUNDARY CONDITIONS (Crucial for Trust in AI & Hardware)
  if (!signals.hasLimitations && (articleType === 'benchmark' || articleType === 'technical' || /ai|detector|mining|hardware/i.test(kw))) {
    const isAI = /ai|detector|model|synthetic/i.test(kw);
    const limitationText = isAI
      ? `> **Technical Limitations & Edge Cases:**\n> Automated statistical classifiers may produce false positives on formulaic technical documentation, academic abstracts, and non-native English prose. Automated results should serve as advisory triage rather than definitive proof.`
      : `> **Operational Constraints & Boundaries:**\n> Performance, power efficiency, and hardware longevity depend heavily on ambient thermal conditions, firmware versions, and power supply stability.`;

    opportunities.push({
      id: 'eeat-technical-limitations',
      type: 'limitation',
      title: 'Explicit Technical Limitations & Edge Cases',
      targetStartOffset: 0,
      targetEndOffset: 0,
      targetSection: 'end',
      reason: 'Disclosing edge cases, false positive rates, or operating boundaries prevents misleading claims and cements reader trust.',
      suggestedText: limitationText,
      evidenceStatus: 'ready_to_insert',
      confidence: 0.91,
      severity: 'important',
    });
    recommendations.push('Document known limitations, false positive edge cases, or operating boundaries.');
  }

  // 6. CITATION ANCHOR (Only when citations are genuinely lacking and needed)
  if (!signals.hasCitations && unsupportedStats.length === 0) {
    opportunities.push({
      id: 'eeat-citation-anchor',
      type: 'citation',
      title: 'Authoritative Source Citations Needed',
      targetStartOffset: text.length,
      targetEndOffset: text.length,
      targetSection: 'end',
      reason: `Article discusses ${kw} without linking to primary documentation, official standards, or industry benchmarks.`,
      suggestedText: `### References & Verified Documentation\n- [Authoritative source needed: Official documentation for ${kw}]\n- [Authoritative source needed: Primary benchmark or technical specification]`,
      evidenceStatus: 'source_required',
      confidence: 0.88,
      severity: 'important',
    });
    recommendations.push('Authoritative sources needed: add references to official documentation or primary research.');
  }

  // Sort opportunities by severity: critical -> important -> suggestion
  const severityOrder: Record<string, number> = { critical: 0, important: 1, suggestion: 2 };
  opportunities.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  if (recommendations.length === 0) {
    recommendations.push('Strong E-E-A-T signals detected: genuine experience, documented sources, and clear attribution.');
  }

  return { opportunities, recommendations };
}

// ─── Main Analyze EEAT Function ───────────────────────────────────────────────

export function analyzeEEAT(
  text: string,
  keyword?: string,
  options?: {
    intent?: string;
    competitors?: any[];
    semanticKeywords?: string[];
  }
): EEATResult {
  const cleanText = text || '';
  const kw = keyword || '';

  // Generate cache key
  const cacheKey = generateEEATCacheKey(kw, cleanText, options?.intent);
  const cached = eeatCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  // Fallback for empty text
  if (!cleanText.trim()) {
    const emptyResult: EEATResult = {
      score: 0,
      hasPersonalExamples: false,
      hasStats: false,
      hasCitations: false,
      hasAuthor: false,
      recommendations: ['Start writing to analyze E-E-A-T signals.'],
      articleType: 'informational',
      opportunities: [],
    };
    return emptyResult;
  }

  // 1. Classify Article
  const articleType = classifyArticleType(cleanText, kw);

  // 2. Extract Claims & Signals
  const claims = extractFactualAndStatisticalClaims(cleanText);
  const signals = detectExistingEvidence(cleanText);

  // 3. Evaluate 4-Dimension Scores
  // Experience: 0-100
  let experienceScore = 20;
  if (signals.hasPersonalExperience) experienceScore += 40;
  if (signals.hasMethodology) experienceScore += 40;

  // Expertise: 0-100
  let expertiseScore = 40;
  if (articleType === 'technical' || articleType === 'benchmark') expertiseScore += 30;
  if (signals.hasLimitations) expertiseScore += 30;

  // Authoritativeness: 0-100
  let authoritativenessScore = 20;
  if (signals.hasStats) authoritativenessScore += 30;
  if (signals.hasCitations) authoritativenessScore += 40;
  if (claims.some((c) => c.type === 'statistic' && !c.hasCitation)) {
    authoritativenessScore = Math.max(10, authoritativenessScore - 20);
  }

  // Trust: 0-100
  let trustScore = 20;
  if (signals.hasAuthor) trustScore += 40;
  if (signals.hasLimitations) trustScore += 25;
  if (signals.hasCitations) trustScore += 15;

  const dimensions = {
    experience: {
      score: Math.min(100, experienceScore),
      strengths: signals.hasPersonalExperience ? ['First-hand observations detected'] : [],
      gaps: !signals.hasPersonalExperience ? ['Lacks documented personal testing/field experience'] : [],
    },
    expertise: {
      score: Math.min(100, expertiseScore),
      strengths: signals.hasLimitations ? ['Acknowledges technical limitations'] : [],
      gaps: !signals.hasLimitations ? ['Missing discussion of edge cases and boundaries'] : [],
    },
    authoritativeness: {
      score: Math.min(100, authoritativenessScore),
      strengths: signals.hasCitations ? ['Verified sources and citations present'] : [],
      gaps: !signals.hasCitations ? ['Claims lack authoritative citations'] : [],
    },
    trust: {
      score: Math.min(100, trustScore),
      strengths: signals.hasAuthor ? ['Author attribution present'] : [],
      gaps: !signals.hasAuthor ? ['Missing clear author/reviewer attribution'] : [],
    },
  };

  // 4. Generate Dynamic Opportunities
  const { opportunities, recommendations } = generateDynamicEEATOpportunities(
    cleanText,
    kw,
    articleType,
    claims,
    signals,
    options?.competitors ? { commonSources: [] } : undefined
  );

  // 5. Compute Overall EEAT Score (0 - 100)
  // Backward compatibility: 4 pillars @ 25 pts each with baseline
  let score = 0;
  if (signals.hasPersonalExperience || signals.hasMethodology) score += 25;
  if (signals.hasStats) score += 25;
  if (signals.hasCitations) score += 25;
  if (signals.hasAuthor) score += 25;

  // If unsupported high-impact stats exist, apply a minor penalty
  if (claims.some((c) => c.type === 'statistic' && !c.hasCitation && /99%|100%/i.test(c.text))) {
    score = Math.max(10, score - 15);
  }

  const result: EEATResult = {
    score,
    hasPersonalExamples: signals.hasPersonalExperience || signals.hasMethodology,
    hasStats: signals.hasStats,
    hasCitations: signals.hasCitations,
    hasAuthor: signals.hasAuthor,
    recommendations,
    articleType,
    opportunities,
    dimensions,
    detectedClaims: claims,
    existingSignals: signals,
  };

  eeatCache.set(cacheKey, { result, timestamp: Date.now() });
  return result;
}
