import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface DiscoveredPage {
  url: string;
  title: string;
  slug: string;
  keywords: string[];
}

function isIpOrLocalhost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower.endsWith('.localhost') || lower.endsWith('.local') || lower.endsWith('.internal')) {
    return true;
  }
  // IPv4 checks (private, loopback, link-local, cloud metadata)
  const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [_, a, b] = ipv4Match.map(Number);
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
  }
  // IPv6 checks
  if (lower.startsWith('[') || lower.includes(':')) {
    return true;
  }
  return false;
}

function normalizeDomain(input: string): { valid: boolean; domain?: string; origin?: string; error?: string } {
  let cleaned = input.trim();
  if (!cleaned) return { valid: false, error: 'Please enter a website domain (e.g. example.com).' };
  
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = 'https://' + cleaned;
  }
  
  try {
    const parsed = new URL(cleaned);
    const hostname = parsed.hostname.toLowerCase();
    
    if (!hostname || !hostname.includes('.') || isIpOrLocalhost(hostname)) {
      return { valid: false, error: 'Invalid domain name. Please enter a valid public website (e.g. yoursite.com).' };
    }
    
    // Validate character set
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(hostname)) {
      return { valid: false, error: 'Domain contains invalid characters. Please enter a valid hostname.' };
    }

    return {
      valid: true,
      domain: hostname,
      origin: `https://${hostname}`,
    };
  } catch {
    return { valid: false, error: 'Invalid URL or domain format. Please check your input.' };
  }
}

function slugToTitle(slug: string): string {
  const words = slug
    .replace(/\.[a-z0-9]+$/i, '')
    .split(/[-_]+/)
    .filter(Boolean);
  if (words.length === 0) return 'Home';
  return words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function extractKeywordsFromUrl(urlStr: string): { slug: string; title: string; keywords: string[] } {
  try {
    const parsed = new URL(urlStr);
    const pathSegments = parsed.pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1] || '';
    const title = slugToTitle(lastSegment);
    
    const keywords: string[] = [];
    if (lastSegment) {
      const cleanWords = lastSegment.replace(/[-_]+/g, ' ').trim().toLowerCase();
      if (cleanWords.length > 2) keywords.push(cleanWords);
      
      const parts = lastSegment.split(/[-_]+/).filter(w => w.length > 3);
      for (const p of parts) {
        keywords.push(p.toLowerCase());
      }
    }
    
    for (const seg of pathSegments.slice(0, -1)) {
      if (seg.length > 3 && !['blog', 'article', 'post', 'news', 'category', 'tag', 'pages'].includes(seg.toLowerCase())) {
        keywords.push(seg.replace(/[-_]+/g, ' ').toLowerCase());
      }
    }

    return {
      slug: lastSegment,
      title: title || 'Page',
      keywords: Array.from(new Set(keywords)),
    };
  } catch {
    return { slug: '', title: 'Page', keywords: [] };
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 7000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (compatible; SEOAssistantBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...(options.headers || {})
      }
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function parseSitemapXml(xmlText: string): string[] {
  const urls: string[] = [];
  const locRegex = /<loc>\s*(https?:\/\/[^\s<]+)\s*<\/loc>/gi;
  let match;
  while ((match = locRegex.exec(xmlText)) !== null) {
    const u = match[1].trim();
    if (u) urls.push(u);
  }
  return urls;
}

function parseHtmlLinks(htmlText: string, origin: string, domain: string): string[] {
  const urls: string[] = [];
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = hrefRegex.exec(htmlText)) !== null) {
    const rawHref = match[1].trim();
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
      continue;
    }
    try {
      const resolved = new URL(rawHref, origin);
      if (resolved.hostname.toLowerCase() === domain.toLowerCase() || resolved.hostname.toLowerCase() === `www.${domain.toLowerCase()}`) {
        const clean = `${resolved.origin}${resolved.pathname}`.replace(/\/$/, '');
        if (clean && !urls.includes(clean)) {
          urls.push(clean);
        }
      }
    } catch {
      // ignore invalid URLs
    }
  }
  return urls;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { domain: rawDomain, articleText = '', primaryKeyword = '', relatedKeywords = [] } = body;

    const norm = normalizeDomain(rawDomain || '');
    if (!norm.valid || !norm.domain || !norm.origin) {
      return new Response(JSON.stringify({
        status: 'invalid_domain',
        message: norm.error || 'Invalid domain',
        links: [],
        discoveredCount: 0
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { domain, origin } = norm;
    const discoveredUrls: Set<string> = new Set();
    let crawlBlockReason: string | null = null;

    // 1. Check sitemaps
    const sitemapCandidates = [
      `${origin}/sitemap.xml`,
      `${origin}/sitemap_index.xml`,
      `${origin}/wp-sitemap.xml`,
    ];

    // Try robots.txt for custom Sitemap directives
    try {
      const robotsRes = await fetchWithTimeout(`${origin}/robots.txt`, {}, 4000);
      if (robotsRes.ok) {
        const robotsText = await robotsRes.text();
        const smMatches = robotsText.match(/^Sitemap:\s*(https?:\/\/\S+)/gim);
        if (smMatches) {
          for (const sm of smMatches) {
            const smUrl = sm.replace(/^Sitemap:\s*/i, '').trim();
            if (smUrl && !sitemapCandidates.includes(smUrl)) {
              sitemapCandidates.unshift(smUrl);
            }
          }
        }
      }
    } catch (e) {
      // Non-fatal, continue to standard sitemaps
    }

    // Attempt sitemap fetches
    for (const smUrl of sitemapCandidates) {
      try {
        const res = await fetchWithTimeout(smUrl, {}, 5000);
        if (res.ok) {
          const xml = await res.text();
          const locs = parseSitemapXml(xml);
          
          for (const loc of locs) {
            // Check if it's a child sitemap (e.g. post-sitemap.xml)
            if (loc.endsWith('.xml') || loc.includes('sitemap')) {
              try {
                const subRes = await fetchWithTimeout(loc, {}, 4000);
                if (subRes.ok) {
                  const subXml = await subRes.text();
                  const subLocs = parseSitemapXml(subXml);
                  for (const sl of subLocs) {
                    if (!sl.endsWith('.xml')) discoveredUrls.add(sl);
                  }
                }
              } catch {
                // ignore child sitemap failure
              }
            } else {
              discoveredUrls.add(loc);
            }
            if (discoveredUrls.size >= 100) break;
          }
          if (discoveredUrls.size > 0) break;
        } else if (res.status === 403 || res.status === 429) {
          crawlBlockReason = `Website returned HTTP ${res.status} (Access Protected).`;
        }
      } catch (err: any) {
        // Continue to next sitemap candidate
      }
    }

    // 2. Fallback: If sitemaps yielded no URLs, crawl homepage
    if (discoveredUrls.size === 0) {
      try {
        const homeRes = await fetchWithTimeout(origin, {}, 6000);
        if (homeRes.ok) {
          const html = await homeRes.text();
          const links = parseHtmlLinks(html, origin, domain);
          for (const l of links) {
            discoveredUrls.add(l);
          }
        } else if (homeRes.status === 403 || homeRes.status === 429 || homeRes.status === 503) {
          crawlBlockReason = `Website returned HTTP ${homeRes.status} (Protected by Cloudflare/Anti-bot).`;
        }
      } catch (e: any) {
        if (!crawlBlockReason) {
          crawlBlockReason = `Could not connect to ${origin} (${e.name === 'AbortError' ? 'Timeout' : 'Network error'}).`;
        }
      }
    }

    // Filter out asset, feed, login, admin, cart, and foreign language localized duplicates if base exists
    const filteredUrls = Array.from(discoveredUrls).filter(u => {
      try {
        const p = new URL(u);
        const path = p.pathname.toLowerCase();
        if (path === '/' || path === '') return false; // skip root homepage as internal link suggestion
        if (/\.(jpg|jpeg|png|gif|svg|webp|css|js|pdf|zip|xml|json|txt|woff2?)$/i.test(path)) return false;
        if (path.includes('/wp-content/') || path.includes('/wp-includes/') || path.includes('/wp-admin/')) return false;
        if (path.includes('/tag/') || path.includes('/category/') || path.includes('/author/')) return false;
        if (path.includes('/login') || path.includes('/signup') || path.includes('/cart') || path.includes('/checkout')) return false;
        if (path.includes('/feed') || path.includes('/trackback')) return false;
        // If non-English prefix exists (e.g. /fr/, /de/, /es/, /it/, /ja/, /zh/, /ru/, /pt/) and base path exists in discoveredUrls, prefer base
        const langPrefixMatch = path.match(/^\/([a-z]{2}(?:-[a-z]{2})?)\/(.*)/);
        if (langPrefixMatch) {
          const basePath = `/${langPrefixMatch[2]}`;
          const baseFull = `${p.origin}${basePath}`;
          if (discoveredUrls.has(baseFull)) return false;
        }
        return true;
      } catch {
        return false;
      }
    });

    // Parse discovered pages
    const discoveredPages: DiscoveredPage[] = filteredUrls.map(u => {
      const { slug, title, keywords } = extractKeywordsFromUrl(u);
      return { url: u, title, slug, keywords };
    });

    if (discoveredPages.length === 0) {
      if (crawlBlockReason) {
        return new Response(JSON.stringify({
          status: 'site_blocked_or_unreachable',
          message: `Could not retrieve pages from ${domain}: ${crawlBlockReason}`,
          links: [],
          discoveredCount: 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        status: 'no_pages_found',
        message: `No public indexable subpages or sitemaps were found on ${domain}.`,
        links: [],
        discoveredCount: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Match Discovered Pages against Current Article Text with Multi-Signal Relevance
    const articleLower = (articleText || '').toLowerCase();
    const sentences = (articleText || '').match(/[^.!?\n]+[.!?\n]*/g) || [];
    const suggestions: any[] = [];
    const usedUrls = new Set<string>();
    const usedOffsets = new Set<number>();

    const pkClean = (primaryKeyword || '').trim().toLowerCase();
    const rkCleans = (relatedKeywords || []).map((k: string) => (k || '').trim().toLowerCase()).filter(Boolean);

    const BROAD_STOPWORDS = new Set([
      'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'more', 'about',
      'what', 'when', 'where', 'which', 'their', 'there', 'they', 'your', 'you',
      'click', 'here', 'read', 'link', 'page', 'site', 'post', 'view', 'online',
      'tool', 'tools', 'free', 'best', 'app', 'article', 'check', 'checker', 'website'
    ]);

    const TECHNICAL_PROPER_NOUNS = new Set([
      'chatgpt', 'bert', 'gpt-4', 'gpt', 'claude', 'openai', 'gemini', 'llama',
      'stylometry', 'perplexity', 'burstiness', 'tokenization', 'tokenizer',
      'lemmatization', 'plagiarism', 'watermarking', 'paraphrasing', 'ngram',
      'n-gram', 'roberta', 't5', 'transformer', 'transformers'
    ]);

    const GENERIC_SINGLE_WORDS = new Set([
      'word', 'words', 'history', 'content', 'tool', 'tools', 'article', 'articles',
      'page', 'pages', 'text', 'texts', 'information', 'data', 'ai', 'click', 'here',
      'more', 'link', 'links', 'site', 'sites', 'read', 'free', 'best', 'check',
      'checker', 'software', 'guide', 'online', 'service', 'system', 'post', 'posts',
      'web', 'app', 'apps', 'blog', 'blogs', 'topic', 'topics', 'item', 'items',
      'unit', 'units', 'part', 'parts', 'type', 'types'
    ]);

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

    for (const page of discoveredPages) {
      if (usedUrls.has(page.url)) continue;

      let matchedAnchor: string | null = null;
      let matchedSentenceIndex = -1;
      let matchedStart = -1;
      let matchedEnd = -1;
      let isExistingAnchor = false;
      let relevanceScore = 0;
      let reason = '';

      // Multi-token meaningful keywords from page
      const pageTokens = page.keywords.filter(k => k.length >= 3 && !BROAD_STOPWORDS.has(k));

      // Check Strategy 1: Locked primary keyword full search intent match
      // Multi-word and long-tail queries must match complete query or majority of core concepts (>= 60%), never an isolated token
      const pkTokens = pkClean.split(/\s+/).filter(w => w.length >= 3 && !BROAD_STOPWORDS.has(w));
      if (pkTokens.length > 0) {
        const pageSlugLower = page.slug.toLowerCase();
        const pageTitleLower = page.title.toLowerCase();
        const matchedPkTokens = pkTokens.filter(t => pageSlugLower.includes(t) || pageTitleLower.includes(t));

        const isFullPkMatch = (pkTokens.length > 1 && matchedPkTokens.length === pkTokens.length) ||
          pageSlugLower.includes(pkTokens.join('-')) ||
          pageTitleLower.includes(pkClean);

        const isIntentPkMatch = pkTokens.length >= 3 && matchedPkTokens.length >= 2 && (matchedPkTokens.length / pkTokens.length) >= 0.6;
        const isShortPkMatch = pkTokens.length <= 2 && matchedPkTokens.length === pkTokens.length && !GENERIC_SINGLE_WORDS.has(pkClean);

        if (isFullPkMatch || isIntentPkMatch || isShortPkMatch) {
          // Look for matching anchor in article text
          const targetAnchorQuery = isFullPkMatch ? pkClean : matchedPkTokens.join(' ');
          const regex = new RegExp(`\\b${targetAnchorQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          let m: RegExpExecArray | null;
          while ((m = regex.exec(articleText)) !== null) {
            if (!usedOffsets.has(m.index)) {
              matchedAnchor = m[0];
              matchedStart = m.index;
              matchedEnd = m.index + m[0].length;
              isExistingAnchor = true;
              relevanceScore = 95;
              reason = `Directly targets primary search intent "${primaryKeyword}" with verified guide "${page.title}"`;
              break;
            }
          }
        }
      }

      // Check Strategy 2: Locked related keywords match
      if (!matchedAnchor) {
        for (const rk of rkCleans) {
          if (rk.length >= 4 && !GENERIC_SINGLE_WORDS.has(rk) && (page.slug.toLowerCase().includes(rk) || page.title.toLowerCase().includes(rk))) {
            const regex = new RegExp(`\\b${rk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            let m: RegExpExecArray | null;
            while ((m = regex.exec(articleText)) !== null) {
              if (!usedOffsets.has(m.index)) {
                matchedAnchor = m[0];
                matchedStart = m.index;
                matchedEnd = m.index + m[0].length;
                isExistingAnchor = true;
                relevanceScore = 88;
                reason = `Supports related target keyword "${matchedAnchor}" with resource "${page.title}"`;
                break;
              }
            }
            if (matchedAnchor) break;
          }
        }
      }

      // Check Strategy 3: Multi-word phrase or compound page keywords in article
      if (!matchedAnchor && pageTokens.length >= 2) {
        const compoundSlug = pageTokens.slice(0, 3).join(' ');
        const regex = new RegExp(`\\b${compoundSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        let m: RegExpExecArray | null;
        while ((m = regex.exec(articleText)) !== null) {
          if (!usedOffsets.has(m.index)) {
            matchedAnchor = m[0];
            matchedStart = m.index;
            matchedEnd = m.index + m[0].length;
            isExistingAnchor = true;
            relevanceScore = 80;
            reason = `Article passage discusses "${matchedAnchor}" — links to verified page "${page.title}"`;
            break;
          }
        }
      }

      // Check Strategy 4: Individual token with phrase expansion if generic, or direct match if technical proper noun
      if (!matchedAnchor && pageTokens.length > 0) {
        for (const token of pageTokens) {
          if (token.length >= 3 && !BROAD_STOPWORDS.has(token)) {
            const regex = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            let m: RegExpExecArray | null;
            while ((m = regex.exec(articleText)) !== null) {
              if (!usedOffsets.has(m.index)) {
                // Check if technical proper noun (e.g. ChatGPT, BERT)
                if (TECHNICAL_PROPER_NOUNS.has(token.toLowerCase())) {
                  matchedAnchor = m[0];
                  matchedStart = m.index;
                  matchedEnd = m.index + m[0].length;
                  isExistingAnchor = true;
                  relevanceScore = 75;
                  reason = `Contextual mention of "${matchedAnchor}" matches verified destination "${page.title}"`;
                  break;
                }

                // If single word is generic (e.g. 'word', 'history'), expand to surrounding noun phrase
                const beforeSlice = articleText.slice(Math.max(0, m.index - 30), m.index).trim();
                const afterSlice = articleText.slice(m.index + m[0].length, m.index + m[0].length + 30).trim();

                const wordsBefore = beforeSlice.split(/\s+/);
                const wordsAfter = afterSlice.split(/\s+/);

                let expandedPhrase: string | null = null;
                let expStart = m.index;

                if (wordsBefore.length > 0) {
                  const lastBefore = wordsBefore[wordsBefore.length - 1].toLowerCase().replace(/[^a-z0-9-]/g, '');
                  if (lastBefore.length >= 3 && !FUNCTION_WORDS.has(lastBefore)) {
                    const rawModifier = wordsBefore[wordsBefore.length - 1];
                    expandedPhrase = `${rawModifier} ${m[0]}`;
                    expStart = m.index - rawModifier.length - 1;
                  }
                }

                if (!expandedPhrase && wordsAfter.length > 0) {
                  const firstAfter = wordsAfter[0].toLowerCase().replace(/[^a-z0-9-]/g, '');
                  if (firstAfter.length >= 3 && !FUNCTION_WORDS.has(firstAfter) && !BROAD_STOPWORDS.has(firstAfter)) {
                    const rawAfter = wordsAfter[0].replace(/[,;:.!?].*$/, '');
                    if (rawAfter) {
                      expandedPhrase = `${m[0]} ${rawAfter}`;
                    }
                  }
                }

                if (expandedPhrase && !usedOffsets.has(expStart)) {
                  matchedAnchor = expandedPhrase;
                  matchedStart = expStart;
                  matchedEnd = expStart + expandedPhrase.length;
                  isExistingAnchor = true;
                  relevanceScore = 72;
                  reason = `Contextual mention of "${matchedAnchor}" matches verified destination "${page.title}"`;
                  break;
                } else if (!GENERIC_SINGLE_WORDS.has(token.toLowerCase()) && token.length >= 6) {
                  // Specific non-generic single word (e.g., 'benchmark', 'paraphrase')
                  matchedAnchor = m[0];
                  matchedStart = m.index;
                  matchedEnd = m.index + m[0].length;
                  isExistingAnchor = true;
                  relevanceScore = 65;
                  reason = `Contextual mention of "${matchedAnchor}" matches verified destination "${page.title}"`;
                  break;
                }
              }
            }
            if (matchedAnchor) break;
          }
        }
      }

      // Calculate sentence index
      if (matchedAnchor && matchedStart >= 0) {
        usedOffsets.add(matchedStart);
        let runningLength = 0;
        for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
          const sLen = sentences[sIdx].length;
          if (matchedStart >= runningLength && matchedStart < runningLength + sLen) {
            matchedSentenceIndex = sIdx;
            break;
          }
          runningLength += sLen;
        }
      }

      // Record recommendation ONLY if quality threshold passed (relevanceScore >= 50)
      if (matchedAnchor && relevanceScore >= 50) {
        usedUrls.add(page.url);
        const contextSentence = matchedSentenceIndex >= 0 && sentences[matchedSentenceIndex]
          ? sentences[matchedSentenceIndex].trim()
          : undefined;

        suggestions.push({
          url: page.url,
          title: page.title,
          anchorText: matchedAnchor,
          reason,
          isExistingAnchor,
          relevanceScore,
          relevanceTier: relevanceScore >= 75 ? 'high' : 'medium',
          start: matchedStart >= 0 ? matchedStart : undefined,
          end: matchedEnd >= 0 ? matchedEnd : undefined,
          contextSnippet: contextSentence,
          sentenceIndex: matchedSentenceIndex >= 0 ? matchedSentenceIndex : undefined,
        });

        if (suggestions.length >= 6) break;
      }
    }

    // Strict: Do NOT dump arbitrary unmatched pages if relevance is zero
    suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return new Response(JSON.stringify({
      status: suggestions.length > 0 ? 'success' : 'no_opportunities',
      domain,
      discoveredCount: discoveredPages.length,
      links: suggestions,
      message: suggestions.length > 0 
        ? `Found ${suggestions.length} internal link opportunities from ${discoveredPages.length} discovered pages on ${domain}.`
        : `Discovered ${discoveredPages.length} pages on ${domain}, but no relevant internal link matches were found for this article.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      status: 'error',
      message: error?.message || 'An unexpected error occurred while fetching internal links.',
      links: [],
      discoveredCount: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
