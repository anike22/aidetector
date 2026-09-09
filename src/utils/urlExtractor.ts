/**
 * Safe Web URL Content Extractor for AI Summarizer
 *
 * Implements safe extraction of clean text content from web URLs:
 * - Scheme & host validation (HTTP/HTTPS only; blocks localhost, internal/private IPs, link-local)
 * - Safe HTML parsing and extraction of main article body (stripping script/style/nav/header/footer/ads)
 * - Word count validation
 * - Clear, user-friendly error messages for paywalls, invalid content types, or network failures
 */

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/, // Link-local / metadata
  /^::1$/,
  /^fe80:/i,
  /^fc00:/i,
  /^fd00:/i,
  /\.local$/i,
  /\.internal$/i,
];

export function validateWebUrl(rawUrl: string): { valid: boolean; error?: string; cleanUrl?: string } {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, error: 'Please enter a web URL.' };
  }

  // Reject unsupported URI schemes immediately
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    return { valid: false, error: 'Only HTTP and HTTPS web URLs are supported.' };
  }

  let parsed: URL;
  try {
    // Add https:// prefix if missing
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    parsed = new URL(withProtocol);
  } catch {
    return { valid: false, error: 'The provided URL is invalid. Please enter a valid web address (e.g. https://example.com/article).' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTP and HTTPS web URLs are supported.' };
  }

  const hostname = parsed.hostname.toLowerCase();
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { valid: false, error: 'Internal, private, or local network URLs cannot be summarized.' };
    }
  }

  return { valid: true, cleanUrl: parsed.toString() };
}

/**
 * Extracts clean readable text from HTML markup without external heavy dependencies.
 */
export function extractCleanArticleTextFromHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  // 1. Remove scripts, styles, iframes, SVGs, audio, video, nav, footer, header, aside, forms
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  // 2. Try to isolate <article> or <main> if present and contains substantive text
  const articleMatch = cleaned.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = cleaned.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  
  let targetHtml = cleaned;
  if (articleMatch && articleMatch[1].length > 400) {
    targetHtml = articleMatch[1];
  } else if (mainMatch && mainMatch[1].length > 400) {
    targetHtml = mainMatch[1];
  }

  // 3. Convert block tags to newlines
  targetHtml = targetHtml
    .replace(/<(?:p|div|h[1-6]|li|blockquote|section|tr)\b[^>]*>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n');

  // 4. Strip all remaining HTML tags
  let text = targetHtml.replace(/<[^>]+>/g, ' ');

  // 5. Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&#\d+;/g, (match) => {
      const num = parseInt(match.slice(2, -1), 10);
      return Number.isFinite(num) ? String.fromCharCode(num) : ' ';
    });

  // 6. Clean up whitespace
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/[ \t]+/g, ' ').trim())
    .filter((p) => {
      // Filter out boilerplate navigation lines, cookie notices, share links
      if (p.length < 20) return false;
      if (/^(share this|click here|cookie policy|terms of service|all rights reserved|subscribe now|sign up)/i.test(p)) {
        return false;
      }
      return true;
    });

  return paragraphs.join('\n\n');
}

/**
 * Fetches and safely extracts article text from a public web URL.
 */
export async function extractTextFromWebUrl(rawUrl: string, options: { timeoutMs?: number } = {}): Promise<string> {
  const validation = validateWebUrl(rawUrl);
  if (!validation.valid || !validation.cleanUrl) {
    throw new Error(validation.error || 'Invalid web URL provided.');
  }

  const { timeoutMs = 15000 } = options;
  const targetUrl = validation.cleanUrl;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Use standard fetch (if direct fetch blocked by CORS, try public proxy fallback)
    let response: Response;
    try {
      response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
    } catch (fetchErr: any) {
      // If direct fetch failed (likely browser CORS), attempt with a public CORS reader bridge
      const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      response = await fetch(corsProxyUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'text/html,text/plain',
        },
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        throw new Error('This web page requires a login or subscription (paywall) and cannot be extracted.');
      }
      if (response.status === 404) {
        throw new Error('The web page could not be found (404 Not Found). Please check the URL.');
      }
      throw new Error(`The web server returned HTTP error ${response.status}.`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/pdf')) {
      throw new Error('The provided URL points directly to a PDF file. Please download the PDF and use the File Upload tab.');
    }

    const html = await response.text();
    const extracted = extractCleanArticleTextFromHtml(html);

    if (!extracted || extracted.length < 100) {
      throw new Error('Could not extract readable article text from this web page. It may rely on client-side JavaScript rendering or be blocked by a paywall.');
    }

    return extracted;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Connecting to the web page timed out. The website may be slow or unreachable.');
    }
    throw err;
  }
}
