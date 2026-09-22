/**
 * Internal Link Discovery & Matching Engine
 * 
 * Provides:
 * 1. Safe domain normalization and SSRF validation
 * 2. Search grounding & real site page discovery
 * 3. Exact matching of discovered pages against current article text
 * 4. Identification of existing anchor text vs suggested new insertions
 * 5. Structured result states (not_fetched, loading, success, no_opportunities, error, blocked)
 */

export interface DiscoveredInternalLink {
  url: string;
  title: string;
  anchorText: string;
  reason: string;
  isExistingAnchor: boolean;
  relevanceScore?: number;
  relevanceTier?: 'high' | 'medium' | 'low';
  recommendationBasis?: 'Contextual Match' | 'Topic Match' | 'Keyword/Intent Match' | 'Supporting Resource';
  start?: number;
  end?: number;
  contextSnippet?: string;
  sentenceIndex?: number;
  paragraphIndex?: number;
  isApplied?: boolean;
}

const GENERIC_ANCHOR_PATTERNS = [
  /^(click\s+here|read\s+more|learn\s+more|this\s+link|this\s+page|this\s+article|website|here|link|page|post|url|view|check\s+out|see\s+more|continue\s+reading)$/i,
  /^(ai|tool|tools|content|online|free|best|app|software|guide|blog|site|word|words|history|text|texts|information|data|post|posts)$/i
];

export const GENERIC_SINGLE_WORDS = new Set([
  'word', 'words', 'history', 'content', 'tool', 'tools', 'article', 'articles',
  'page', 'pages', 'text', 'texts', 'information', 'data', 'ai', 'click', 'here',
  'more', 'link', 'links', 'site', 'sites', 'read', 'free', 'best', 'check',
  'checker', 'software', 'guide', 'online', 'service', 'system', 'post', 'posts',
  'web', 'app', 'apps', 'blog', 'blogs', 'topic', 'topics', 'item', 'items',
  'unit', 'units', 'part', 'parts', 'type', 'types', 'use', 'uses', 'feature', 'features',
  'case', 'cases', 'way', 'ways', 'help', 'need', 'good', 'simple', 'easy'
]);

export const TECHNICAL_PROPER_NOUNS = new Set([
  'chatgpt', 'bert', 'gpt-4', 'gpt', 'claude', 'openai', 'gemini', 'llama',
  'stylometry', 'perplexity', 'burstiness', 'tokenization', 'tokenizer',
  'lemmatization', 'plagiarism', 'watermarking', 'paraphrasing', 'ngram',
  'n-gram', 'roberta', 't5', 'transformer', 'transformers', 'syntactic',
  'classifier', 'embeddings', 'backtranslation', 'hallucination'
]);

const BROAD_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'more', 'about',
  'what', 'when', 'where', 'which', 'their', 'there', 'they', 'your', 'you',
  'into', 'some', 'other', 'than', 'then', 'also', 'just', 'only', 'very',
  'will', 'would', 'should', 'could', 'been', 'were', 'being', 'having',
  'click', 'here', 'read', 'link', 'page', 'site', 'post', 'view', 'online',
  'tool', 'tools', 'free', 'best', 'app', 'article', 'check', 'checker', 'website'
]);

/**
 * Validates if a proposed anchor text is descriptive and acceptable for internal linking.
 * Reject isolated generic single words unless they are recognized technical entities or proper nouns.
 */
export function validateAnchorQuality(anchor: string): { valid: boolean; reason?: string } {
  const clean = (anchor || '').trim();
  if (!clean || clean.length < 2) {
    return { valid: false, reason: 'Anchor text is too short.' };
  }

  const lower = clean.toLowerCase();
  for (const pattern of GENERIC_ANCHOR_PATTERNS) {
    if (pattern.test(lower)) {
      return { valid: false, reason: `Anchor "${clean}" is a generic navigational phrase.` };
    }
  }

  // Single word checks
  if (!clean.includes(' ')) {
    if (TECHNICAL_PROPER_NOUNS.has(lower) || /^[A-Z][a-zA-Z0-9-]*[0-9A-Z]/.test(clean)) {
      return { valid: true }; // Specific entity / product / technical noun
    }
    if (GENERIC_SINGLE_WORDS.has(lower) || BROAD_STOPWORDS.has(lower) || clean.length <= 4) {
      return { valid: false, reason: `Single word "${clean}" is too generic for a descriptive anchor.` };
    }
  }

  const wordCount = clean.split(/\s+/).length;
  if (wordCount > 7) {
    return { valid: false, reason: 'Anchor text is too long (over 7 words).' };
  }

  return { valid: true };
}

const FUNCTION_WORDS = new Set([
  'before', 'after', 'during', 'while', 'into', 'onto', 'under', 'above', 'from',
  'with', 'without', 'between', 'against', 'among', 'then', 'when', 'where', 'how',
  'why', 'because', 'although', 'since', 'unless', 'until', 'the', 'a', 'an',
  'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could', 'should',
  'would', 'may', 'might', 'must', 'will', 'shall', 'to', 'of', 'in', 'for',
  'on', 'by', 'at', 'about', 'as', 'than', 'over', 'through', 'and', 'or',
  'but', 'nor', 'so', 'yet', 'if', 'not', 'no', 'your', 'my', 'their', 'our', 'his', 'her', 'its'
]);

/**
 * Attempts to expand a matching keyword or token in a sentence into a natural, descriptive noun phrase
 * (e.g. "word" -> "complete word", "history" -> "analysis history", "detection" -> "AI detection accuracy").
 */
export function expandToDescriptivePhraseInSentence(
  sentence: string,
  token: string,
  destTokens: string[] = []
): string | null {
  if (!sentence || !token) return null;

  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tokenRegex = new RegExp(`\\b${escaped}\\b`, 'i');
  const match = tokenRegex.exec(sentence);
  if (!match) return null;

  const tokenIdx = match.index;
  const tokenLen = match[0].length;

  // Find clause boundaries (commas, semicolons, parentheses, dashes)
  const beforeText = sentence.slice(0, tokenIdx);
  const afterText = sentence.slice(tokenIdx + tokenLen);

  const clauseStart = Math.max(
    beforeText.lastIndexOf(','),
    beforeText.lastIndexOf(';'),
    beforeText.lastIndexOf(':'),
    beforeText.lastIndexOf('('),
    beforeText.lastIndexOf(' - '),
    beforeText.lastIndexOf('—'),
    0
  );
  const clauseBefore = beforeText.slice(clauseStart === 0 ? 0 : clauseStart + 1).trim();

  const clauseEndMatch = afterText.match(/[,;:()\n]| - |—/);
  const clauseAfter = clauseEndMatch && clauseEndMatch.index !== undefined 
    ? afterText.slice(0, clauseEndMatch.index).trim() 
    : afterText.trim();

  // Words immediately preceding the token in the clause
  const wordsBefore = clauseBefore ? clauseBefore.split(/\s+/) : [];
  const wordsAfter = clauseAfter ? clauseAfter.split(/\s+/) : [];

  // Check 1: 1-2 words before + token (e.g. "complete word", "analysis history", "version history", "natural language")
  if (wordsBefore.length > 0) {
    const lastWordBefore = wordsBefore[wordsBefore.length - 1].toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (lastWordBefore.length >= 3 && !FUNCTION_WORDS.has(lastWordBefore)) {
      const phrase = `${wordsBefore[wordsBefore.length - 1]} ${match[0]}`.trim();
      if (validateAnchorQuality(phrase).valid) {
        return phrase;
      }
    }
  }

  // Check 2: token + 1-2 words after (e.g. "word counter", "detection accuracy", "history log")
  if (wordsAfter.length > 0) {
    const firstWordAfter = wordsAfter[0].toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (firstWordAfter.length >= 3 && !FUNCTION_WORDS.has(firstWordAfter) && !BROAD_STOPWORDS.has(firstWordAfter)) {
      const phrase = `${match[0]} ${wordsAfter[0]}`.trim();
      if (validateAnchorQuality(phrase).valid) {
        return phrase;
      }
    }
  }

  // Check 3: Check if the whole noun chunk (before + token + after) matches destination
  if (wordsBefore.length > 0 && wordsAfter.length > 0) {
    const lastWordBefore = wordsBefore[wordsBefore.length - 1].toLowerCase().replace(/[^a-z0-9-]/g, '');
    const firstWordAfter = wordsAfter[0].toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (
      lastWordBefore.length >= 3 && !FUNCTION_WORDS.has(lastWordBefore) &&
      firstWordAfter.length >= 3 && !FUNCTION_WORDS.has(firstWordAfter) && !BROAD_STOPWORDS.has(firstWordAfter)
    ) {
      const phrase = `${wordsBefore[wordsBefore.length - 1]} ${match[0]} ${wordsAfter[0]}`.trim();
      if (validateAnchorQuality(phrase).valid) {
        return phrase;
      }
    }
  }

  return null;
}

/**
 * Extracts meaningful keyword tokens (filtering generic stopwords and single characters)
 */
export function extractMeaningfulTokens(text: string): string[] {
  if (!text) return [];
  const words = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/);
  return words.filter(w => w.length >= 3 && !BROAD_STOPWORDS.has(w));
}

/**
 * Multi-signal relevance scoring algorithm for internal links:
 * - Signal 1: Primary & Related Keywords alignment or Article Topic Fit (max 35 pts)
 * - Signal 2: Passage / Section Contextual Fit (max 30 pts)
 * - Signal 3: Destination Specificity & Topic Alignment (max 25 pts)
 * - Signal 4: Anchor Quality & Naturalness (max 10 pts)
 * 
 * Quality Threshold: >= 50 pts (calibrated to ensure strong contextual opportunities pass, while rejecting weak/irrelevant noise)
 */
export function calculateLinkRelevance(
  link: { url: string; title: string; anchorText?: string; reason?: string },
  articleText: string,
  primaryKeyword = '',
  relatedKeywords: string[] = [],
  contextPassage = ''
): { 
  score: number; 
  tier: 'high' | 'medium' | 'low'; 
  passedThreshold: boolean; 
  recommendationBasis: 'Contextual Match' | 'Topic Match' | 'Keyword/Intent Match' | 'Supporting Resource';
  matchReason: string;
} {
  let score = 0;
  const reasons: string[] = [];

  const urlLower = (link.url || '').toLowerCase();
  const titleLower = (link.title || '').toLowerCase();
  const anchorLower = (link.anchorText || '').toLowerCase().trim();
  const articleLower = (articleText || '').toLowerCase();
  const passageLower = (contextPassage || articleText.slice(0, 500) || '').toLowerCase();

  const urlPath = urlLower.replace(/^https?:\/\/[^/]+/i, '');
  const destTokens = Array.from(new Set([
    ...extractMeaningfulTokens(titleLower),
    ...extractMeaningfulTokens(urlPath)
  ]));

  // 1. Primary Keyword & Search Intent Alignment (Max 35)
  // CRITICAL: The user's locked Primary Keyword remains authoritative throughout the system.
  // We evaluate the search intent of the COMPLETE query (including long-tail queries/questions like
  // "How Do AI Detectors Detect ChatGPT-Generated Text").
  // Never slice or misrepresent an individual token (like "detect", "college", "writing") as the "Primary Keyword".
  const pk = primaryKeyword.trim();
  const pkLower = pk.toLowerCase();
  const pkTokens = extractMeaningfulTokens(pkLower);
  let kwScore = 0;

  if (pkTokens.length > 0) {
    const pkSlug = pkTokens.join('-');
    const pkPhrase = pkTokens.join(' ');
    const isFullExactMatch = 
      titleLower.includes(pkLower) || 
      urlPath.includes(pkSlug) || 
      (pkTokens.length > 1 && titleLower.includes(pkPhrase));

    const matchedPkTokens = pkTokens.filter(t => destTokens.includes(t));

    if (isFullExactMatch || (pkTokens.length > 1 && matchedPkTokens.length === pkTokens.length)) {
      // 100% full match for the complete Primary Keyword search intent
      kwScore = 35;
      reasons.push(`Directly targets primary search intent "${pk}"`);
    } else if (pkTokens.length >= 3 && matchedPkTokens.length >= 2 && (matchedPkTokens.length / pkTokens.length) >= 0.5) {
      // High search intent alignment for long-tail query (e.g. matching 2+ core concepts representing >= 50% of query)
      kwScore = 28;
      reasons.push(`Directly supports primary search intent "${pk}"`);
    } else if (pkTokens.length <= 2 && matchedPkTokens.length === pkTokens.length) {
      // Short 1-2 word primary keyword exact match
      kwScore = 30;
      reasons.push(`Directly targets primary search intent "${pk}"`);
    }
    // Note: If only 1 isolated token matches out of 3+ words (e.g. 'detect' in 'How Do AI Detectors Detect ChatGPT-Generated Text'),
    // kwScore remains 0, and NO keyword-intent claim is made. The token is NEVER labeled as the primary keyword.
  }

  // Related Keywords check
  for (const rk of relatedKeywords) {
    const rkClean = (rk || '').trim();
    if (!rkClean) continue;
    const rkLower = rkClean.toLowerCase();
    const rkTokens = extractMeaningfulTokens(rkLower);
    if (rkTokens.length === 0) continue;

    const matchedRkTokens = rkTokens.filter(t => destTokens.includes(t));
    if (rkTokens.length > 1 && matchedRkTokens.length === rkTokens.length) {
      kwScore = Math.max(kwScore, 28);
      reasons.push(`Supports related target keyword "${rkClean}"`);
    } else if (rkTokens.length >= 3 && matchedRkTokens.length >= 2 && (matchedRkTokens.length / rkTokens.length) >= 0.6) {
      kwScore = Math.max(kwScore, 22);
      reasons.push(`Supports related target keyword "${rkClean}"`);
    } else if (rkTokens.length <= 2 && matchedRkTokens.length === rkTokens.length) {
      kwScore = Math.max(kwScore, 25);
      reasons.push(`Supports related target keyword "${rkClean}"`);
    }
  }

  // If no primary keyword is specified, evaluate article-wide topical alignment
  if (kwScore === 0 && destTokens.length > 0) {
    const matchedArticleTokens = destTokens.filter(t => articleLower.includes(t));
    if (matchedArticleTokens.length >= 2) {
      kwScore = 20;
      reasons.push(`Topical alignment with article concepts (${matchedArticleTokens.slice(0, 2).join(', ')})`);
    } else if (matchedArticleTokens.length === 1) {
      kwScore = 10;
    }
  }
  score += Math.min(35, kwScore);

  // 2. Passage / Section Contextual Fit (Max 30)
  let passageScore = 0;
  if (destTokens.length > 0) {
    const matchedPassageTokens = destTokens.filter(t => passageLower.includes(t));
    if (matchedPassageTokens.length >= 2) {
      passageScore = 30;
      reasons.push(`Expands on the concept discussed in this section (${matchedPassageTokens.slice(0, 3).join(', ')})`);
    } else if (matchedPassageTokens.length === 1) {
      passageScore = 20;
      reasons.push(`Contextual reference to ${link.title}`);
    } else if (articleLower.includes(titleLower)) {
      passageScore = 15;
    }
  }
  score += passageScore;

  // 3. Destination Specificity & Topic Alignment (Max 25)
  let destScore = 0;
  const pathParts = urlLower.replace(/https?:\/\/[^/]+/i, '').split('/').filter(Boolean);
  if (pathParts.length >= 1 && !pathParts[0].startsWith('tag') && !pathParts[0].startsWith('category')) {
    destScore += 15;
  }
  if (destTokens.length >= 2) {
    destScore += 10;
  }
  score += destScore;

  // 4. Anchor Naturalness & Quality (Max 10)
  let anchorScore = 10;
  if (anchorLower) {
    for (const pattern of GENERIC_ANCHOR_PATTERNS) {
      if (pattern.test(anchorLower)) {
        anchorScore = -25; // Heavily penalize generic anchors
        break;
      }
    }
    const anchorTokens = anchorLower.split(/\s+/);
    if (anchorTokens.length >= 2 && anchorTokens.length <= 5) {
      anchorScore += 5;
    }
  }
  score += anchorScore;

  // Cap score 0-100
  const finalScore = Math.max(0, Math.min(100, score));
  const passedThreshold = finalScore >= 50;
  const tier: 'high' | 'medium' | 'low' = finalScore >= 75 ? 'high' : finalScore >= 50 ? 'medium' : 'low';

  // Determine truthful recommendation basis without claiming unverified authority
  let recommendationBasis: 'Contextual Match' | 'Topic Match' | 'Keyword/Intent Match' | 'Supporting Resource' = 'Topic Match';
  if (kwScore >= 20) {
    recommendationBasis = 'Keyword/Intent Match';
  } else if (passageScore >= 20) {
    recommendationBasis = 'Contextual Match';
  } else if (destScore >= 20) {
    recommendationBasis = 'Supporting Resource';
  }

  const defaultReason = reasons.length > 0 
    ? reasons.join('. ') 
    : `Contextual internal reference to ${link.title}`;

  return {
    score: finalScore,
    tier,
    passedThreshold,
    recommendationBasis,
    matchReason: defaultReason
  };
}

export interface InternalLinkDiscoveryResult {
  status: 'not_fetched' | 'loading' | 'success' | 'no_opportunities' | 'site_blocked' | 'invalid_domain' | 'error';
  domain: string;
  normalizedDomain: string;
  canonicalOrigin: string;
  message?: string;
  links: DiscoveredInternalLink[];
  discoveredPageCount?: number;
  errorDetail?: string;
}

export function isIpOrPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase().trim();
  if (!lower) return true;
  if (
    lower === 'localhost' ||
    lower.endsWith('.localhost') ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal') ||
    lower.endsWith('.test') ||
    lower.endsWith('.invalid') ||
    lower.endsWith('.onion')
  ) {
    return true;
  }

  // IPv4 check
  const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, aStr, bStr, cStr, dStr] = ipv4Match;
    const a = Number(aStr);
    const b = Number(bStr);
    const c = Number(cStr);
    const d = Number(dStr);
    if (a > 255 || b > 255 || c > 255 || d > 255) return true;
    
    // 0.0.0.0/8 (Broadcast/This host)
    if (a === 0) return true;
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;
    // 10.0.0.0/8 (Private RFC 1918)
    if (a === 10) return true;
    // 172.16.0.0/12 (Private RFC 1918)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16 (Private RFC 1918)
    if (a === 192 && b === 168) return true;
    // 169.254.0.0/16 (Link-local / AWS / GCP metadata)
    if (a === 169 && b === 254) return true;
    // 100.64.0.0/10 (Carrier grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return true;
    // 224.0.0.0/4 (Multicast)
    if (a >= 224) return true;
  }

  // IPv6 check
  if (lower.startsWith('[') || lower.includes(':')) {
    return true;
  }

  return false;
}

export function normalizeAndValidateDomain(input: string): {
  valid: boolean;
  domain?: string;
  origin?: string;
  error?: string;
} {
  let cleaned = input.trim();
  if (!cleaned) {
    return { valid: false, error: 'Please enter your website domain (e.g. yoursite.com).' };
  }

  // Strip leading/trailing slashes and spaces
  cleaned = cleaned.replace(/^[/\s]+|[/\s]+$/g, '');

  // If no scheme provided, prepend https://
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = 'https://' + cleaned;
  }

  try {
    const parsed = new URL(cleaned);
    let hostname = parsed.hostname.toLowerCase();

    // Remove any trailing dot
    hostname = hostname.replace(/\.$/, '');

    if (!hostname || isIpOrPrivateHost(hostname)) {
      return {
        valid: false,
        error: 'Invalid or restricted domain. Please enter a valid public domain name (e.g. example.com).'
      };
    }

    // Must contain at least one dot separating domain and valid TLD
    const parts = hostname.split('.');
    if (parts.length < 2) {
      return {
        valid: false,
        error: 'Domain must include a valid extension like .com, .org, or .io (e.g. example.com).'
      };
    }

    const tld = parts[parts.length - 1];
    if (tld.length < 2 || !/^[a-z]{2,}$/i.test(tld)) {
      return {
        valid: false,
        error: `".${tld}" is not a recognized top-level domain. Please check your domain name.`
      };
    }

    // Check each label
    for (const part of parts) {
      if (!part || part.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(part)) {
        return {
          valid: false,
          error: 'Domain contains invalid characters. Use letters, numbers, and hyphens only.'
        };
      }
    }

    return {
      valid: true,
      domain: hostname,
      origin: `https://${hostname}`
    };
  } catch {
    return {
      valid: false,
      error: 'Invalid domain format. Please enter a standard domain (e.g. example.com).'
    };
  }
}

/**
 * Robustly parses JSON response from LLM search grounding, handling markdown code blocks,
 * extra text, unescaped characters, or partial streaming artifacts.
 */
export function extractLinksFromJsonResponse(
  rawText: string,
  canonicalDomain: string
): Array<{ url: string; title: string; anchorText: string; reason: string }> {
  if (!rawText?.trim()) return [];

  // 1. Try direct JSON parsing
  try {
    const trimmed = rawText.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed.links)) {
        return sanitizeLinksArray(parsed.links, canonicalDomain);
      }
    }
  } catch {}

  // 2. Try regex extraction of JSON object
  const jsonMatch = rawText.match(/\{[\s\S]*"links"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed.links)) {
        return sanitizeLinksArray(parsed.links, canonicalDomain);
      }
    } catch {
      // Clean trailing commas and retry
      try {
        const cleaned = jsonMatch[0].replace(/,\s*([\]}])/g, '$1');
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed.links)) {
          return sanitizeLinksArray(parsed.links, canonicalDomain);
        }
      } catch {}
    }
  }

  // 3. Fallback: Parse individual link objects from text
  const individualMatches = rawText.match(/\{[^{}]*"url"\s*:[^{}]*\}/g);
  if (individualMatches && individualMatches.length > 0) {
    const recovered: any[] = [];
    for (const item of individualMatches) {
      try {
        const p = JSON.parse(item);
        if (p.url) recovered.push(p);
      } catch {}
    }
    if (recovered.length > 0) {
      return sanitizeLinksArray(recovered, canonicalDomain);
    }
  }

  return [];
}

function sanitizeLinksArray(
  rawItems: any[],
  canonicalDomain: string
): Array<{ url: string; title: string; anchorText: string; reason: string }> {
  const cleanDomain = canonicalDomain.toLowerCase().replace(/^www\./, '');
  const results: Array<{ url: string; title: string; anchorText: string; reason: string }> = [];
  const seenUrls = new Set<string>();

  for (const item of rawItems) {
    if (!item || typeof item !== 'object') continue;
    let url = String(item.url || '').trim();
    if (!url) continue;

    // Ensure valid URL
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${canonicalDomain}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
      
      // Ensure the URL belongs to the supplied website domain
      if (host !== cleanDomain && !host.endsWith(`.${cleanDomain}`)) {
        continue;
      }

      const cleanUrl = `${parsed.origin}${parsed.pathname}`;
      if (seenUrls.has(cleanUrl)) continue;
      seenUrls.add(cleanUrl);

      const title = String(item.title || '').trim() || slugToTitle(parsed.pathname);
      const anchorText = String(item.anchorText || item.anchor || '').trim();
      const reason = String(item.reason || '').trim();

      results.push({
        url: cleanUrl,
        title,
        anchorText: anchorText || title,
        reason: reason || `Relevant internal link to ${title}`,
      });
    } catch {
      // Ignore invalid URL
    }
  }

  return results;
}

function slugToTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1] || '';
  if (!last) return 'Home Page';
  return last
    .replace(/\.[a-z0-9]+$/i, '')
    .split(/[-_]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'Site Page';
}

/**
 * Matches candidate internal links against the current article text to determine:
 * 1. Exact existing anchor text occurrences and their start/end offsets
 * 2. Sentence and paragraph indices
 * 3. Context snippets for navigation and highlighting
 * 4. Genuine distinction between existing anchor opportunities vs suggested new insertions
 * 5. Strict multi-signal relevance scoring with quality threshold (>= 60)
 */
export function matchInternalLinksToArticle(
  candidateLinks: Array<{ url: string; title: string; anchorText?: string; reason?: string }>,
  articleText: string,
  primaryKeyword = '',
  relatedKeywords: string[] = []
): DiscoveredInternalLink[] {
  if (!candidateLinks || candidateLinks.length === 0 || !articleText?.trim()) return [];

  const textLower = articleText.toLowerCase();
  const sentences = articleText.match(/[^.!?\n]+[.!?\n]*/g) || [];
  const paragraphs = articleText.split(/\n\s*\n/).filter(Boolean);

  const matchedSuggestions: DiscoveredInternalLink[] = [];
  const usedOffsets = new Set<number>();
  const usedUrls = new Set<string>();

  // Pre-calculate sentence offset ranges
  const sentenceOffsets: Array<{ text: string; start: number; end: number; index: number }> = [];
  let sOffset = 0;
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    const sStart = articleText.indexOf(s, sOffset);
    const startPos = sStart !== -1 ? sStart : sOffset;
    sentenceOffsets.push({
      text: s.trim(),
      start: startPos,
      end: startPos + s.length,
      index: i
    });
    sOffset = startPos + s.length;
  }

  // Pre-calculate paragraph offset ranges
  const paragraphOffsets: Array<{ text: string; start: number; end: number; index: number }> = [];
  let pOffset = 0;
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const pStart = articleText.indexOf(p, pOffset);
    const startPos = pStart !== -1 ? pStart : pOffset;
    paragraphOffsets.push({
      text: p.trim(),
      start: startPos,
      end: startPos + p.length,
      index: i
    });
    pOffset = startPos + p.length;
  }

  for (const link of candidateLinks) {
    if (!link.url || usedUrls.has(link.url)) continue;

    let exactAnchor = (link.anchorText || '').trim();
    let isExisting = false;
    let matchStart = -1;
    let matchEnd = -1;
    let matchedSentenceIdx = -1;
    let matchedParagraphIdx = -1;
    let contextSnippet: string | undefined;

    const destTokens = extractMeaningfulTokens(`${link.title} ${link.url}`);

    // Search Strategy A: Test if proposed anchor exists verbatim in article (with phrase expansion for generic words)
    if (exactAnchor && exactAnchor.length >= 2) {
      const quality = validateAnchorQuality(exactAnchor);

      // If proposed anchor is generic single word, attempt phrase expansion in surrounding sentence
      if (!quality.valid && !exactAnchor.includes(' ')) {
        const escaped = exactAnchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
        let m: RegExpExecArray | null;
        while ((m = regex.exec(articleText)) !== null) {
          if (!usedOffsets.has(m.index)) {
            // Find containing sentence
            const sObj = sentenceOffsets.find(s => m!.index >= s.start && m!.index < s.end);
            if (sObj) {
              const expanded = expandToDescriptivePhraseInSentence(sObj.text, m[0], destTokens);
              if (expanded) {
                const expEscaped = expanded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const expRegex = new RegExp(`\\b${expEscaped}\\b`, 'i');
                const expMatch = expRegex.exec(sObj.text);
                if (expMatch) {
                  const expStart = sObj.start + expMatch.index;
                  if (!usedOffsets.has(expStart)) {
                    isExisting = true;
                    matchStart = expStart;
                    matchEnd = expStart + expMatch[0].length;
                    exactAnchor = expMatch[0];
                    usedOffsets.add(matchStart);
                    break;
                  }
                }
              }
            }
          }
        }
      } else if (quality.valid) {
        // Descriptive multi-word phrase or valid technical proper noun
        const escaped = exactAnchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
        let m: RegExpExecArray | null;
        while ((m = regex.exec(articleText)) !== null) {
          if (!usedOffsets.has(m.index)) {
            isExisting = true;
            matchStart = m.index;
            matchEnd = m.index + m[0].length;
            exactAnchor = m[0]; // Preserve exact article casing
            usedOffsets.add(matchStart);
            break;
          }
        }
      }
    }

    // Search Strategy B: Check if destination page title phrase exists verbatim in article
    if (!isExisting && link.title && link.title.length >= 4) {
      const titleClean = link.title.replace(/\s*[-|]\s*.*$/, '').trim(); // Strip site suffix
      if (validateAnchorQuality(titleClean).valid) {
        const escaped = titleClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
        let m: RegExpExecArray | null;
        while ((m = regex.exec(articleText)) !== null) {
          if (!usedOffsets.has(m.index)) {
            isExisting = true;
            matchStart = m.index;
            matchEnd = m.index + m[0].length;
            exactAnchor = m[0];
            usedOffsets.add(matchStart);
            break;
          }
        }
      }
    }

    // Search Strategy C: Check locked primary keyword if relevant to destination
    if (!isExisting && primaryKeyword?.trim() && primaryKeyword.length >= 4) {
      const pk = primaryKeyword.trim();
      if (validateAnchorQuality(pk).valid) {
        const destCombined = `${link.title} ${link.url}`.toLowerCase();
        if (destCombined.includes(pk.toLowerCase())) {
          const escaped = pk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
          let m: RegExpExecArray | null;
          while ((m = regex.exec(articleText)) !== null) {
            if (!usedOffsets.has(m.index)) {
              isExisting = true;
              matchStart = m.index;
              matchEnd = m.index + m[0].length;
              exactAnchor = m[0];
              usedOffsets.add(matchStart);
              break;
            }
          }
        }
      }
    }

    // Search Strategy D: Check locked related keywords
    if (!isExisting && Array.isArray(relatedKeywords)) {
      for (const rk of relatedKeywords) {
        const rkClean = (rk || '').trim();
        if (rkClean.length >= 4 && validateAnchorQuality(rkClean).valid) {
          const destCombined = `${link.title} ${link.url}`.toLowerCase();
          if (destCombined.includes(rkClean.toLowerCase())) {
            const escaped = rkClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
            let m: RegExpExecArray | null;
            while ((m = regex.exec(articleText)) !== null) {
              if (!usedOffsets.has(m.index)) {
                isExisting = true;
                matchStart = m.index;
                matchEnd = m.index + m[0].length;
                exactAnchor = m[0];
                usedOffsets.add(matchStart);
                break;
              }
            }
            if (isExisting) break;
          }
        }
      }
    }

    // If existing anchor was located, compute exact containing sentence and paragraph
    if (isExisting && matchStart >= 0) {
      for (const s of sentenceOffsets) {
        if (matchStart >= s.start && matchStart < s.end) {
          matchedSentenceIdx = s.index;
          contextSnippet = s.text;
          break;
        }
      }
      for (const p of paragraphOffsets) {
        if (matchStart >= p.start && matchStart < p.end + 4) {
          matchedParagraphIdx = p.index;
          break;
        }
      }
    } else {
      // Suggested-new anchor: Ensure a descriptive phrase is suggested (not an isolated generic single word)
      isExisting = false;
      matchStart = -1;
      matchEnd = -1;

      let suggestedPhrase = link.anchorText || link.title.replace(/\s*[-|]\s*.*$/, '').trim();
      if (!validateAnchorQuality(suggestedPhrase).valid) {
        // Expand title or use descriptive slug representation
        const slugTitle = slugToTitle(new URL(link.url).pathname);
        suggestedPhrase = validateAnchorQuality(slugTitle).valid ? slugTitle : `${link.title} guide`;
      }
      exactAnchor = suggestedPhrase;

      let bestSentenceScore = -1;
      let bestSIdx = 0;

      for (let sIdx = 0; sIdx < sentenceOffsets.length; sIdx++) {
        const s = sentenceOffsets[sIdx];
        const sLower = s.text.toLowerCase();
        let sScore = 0;
        for (const tok of destTokens) {
          if (sLower.includes(tok)) sScore += 1;
        }
        if (primaryKeyword && sLower.includes(primaryKeyword.toLowerCase())) {
          sScore += 2;
        }
        if (sScore > bestSentenceScore) {
          bestSentenceScore = sScore;
          bestSIdx = sIdx;
        }
      }

      if (sentenceOffsets.length > 0) {
        matchedSentenceIdx = bestSIdx;
        contextSnippet = sentenceOffsets[bestSIdx]?.text;
        // Find paragraph for this sentence
        const targetSentenceOffset = sentenceOffsets[bestSIdx]?.start || 0;
        for (const p of paragraphOffsets) {
          if (targetSentenceOffset >= p.start && targetSentenceOffset < p.end + 4) {
            matchedParagraphIdx = p.index;
            break;
          }
        }
      }
    }

    // Multi-signal relevance evaluation
    const passageContext = contextSnippet || articleText.slice(0, 400);
    const relevance = calculateLinkRelevance(
      { url: link.url, title: link.title, anchorText: exactAnchor, reason: link.reason },
      articleText,
      primaryKeyword,
      relatedKeywords,
      passageContext
    );

    // Enforce strict Quality Threshold (Score >= 60)
    if (!relevance.passedThreshold) {
      continue;
    }

    usedUrls.add(link.url);
    matchedSuggestions.push({
      url: link.url,
      title: link.title,
      anchorText: exactAnchor,
      reason: relevance.matchReason || link.reason || `Relevant resource for ${link.title}`,
      isExistingAnchor: isExisting,
      relevanceScore: relevance.score,
      relevanceTier: relevance.tier,
      recommendationBasis: relevance.recommendationBasis,
      start: isExisting && matchStart >= 0 ? matchStart : undefined,
      end: isExisting && matchEnd >= 0 ? matchEnd : undefined,
      contextSnippet,
      sentenceIndex: matchedSentenceIdx >= 0 ? matchedSentenceIdx : undefined,
      paragraphIndex: matchedParagraphIdx >= 0 ? matchedParagraphIdx : undefined,
      isApplied: false,
    });

    if (matchedSuggestions.length >= 6) break;
  }

  // Rank by relevance score descending (existing anchors prioritized on equal scores)
  matchedSuggestions.sort((a, b) => {
    const scoreA = (a.relevanceScore || 50) + (a.isExistingAnchor ? 5 : 0);
    const scoreB = (b.relevanceScore || 50) + (b.isExistingAnchor ? 5 : 0);
    return scoreB - scoreA;
  });

  return matchedSuggestions;
}
