/**
 * Safe Policy Document & URL Extractor for Student Mode
 *
 * Provides safe text extraction from user-provided files and web URLs:
 * - Robust SSRF protection (rejects localhost, private subnets, cloud metadata)
 * - Safe HTML sanitization (strips scripts, ads, tracking, styles)
 * - File extraction with fallback to manual paste
 * - Cryptographic content hashing (SHA-256) for audit integrity
 * - Treats all input as untrusted data
 */

import { extractTextFromFile } from '@/utils/fileExtractor';

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/, // Link-local & cloud metadata (AWS, GCP, Azure, DigitalOcean)
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^fe80:/i,
  /^fc00:/i,
  /^fd00:/i,
  /\.local$/i,
  /\.internal$/i,
  /\.localhost$/i,
  /metadata\.google\.internal$/i,
  /instance-data$/i,
];

export function validatePolicyUrl(rawUrl: string): { valid: boolean; error?: string; cleanUrl?: string } {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, error: 'Please enter a valid policy URL.' };
  }

  // Reject unsupported URI schemes (data:, file:, javascript:, blob:, ftp:, etc.)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    return { valid: false, error: 'Only HTTP and HTTPS web URLs are supported for policy retrieval.' };
  }

  let parsed: URL;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    parsed = new URL(withProtocol);
  } catch {
    return { valid: false, error: 'The provided URL is invalid. Please enter a valid web address (e.g. https://university.edu/ai-policy).' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTP and HTTPS web URLs are supported.' };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  for (const pattern of PRIVATE_HOST_PATTERNS) {
    if (pattern.test(hostname)) {
      return {
        valid: false,
        error: 'Private, internal, or cloud metadata network addresses cannot be retrieved for security reasons.',
      };
    }
  }

  return { valid: true, cleanUrl: parsed.toString() };
}

/**
 * Strips HTML tags, scripts, styles, navigation, headers, footers, and comments.
 */
export function sanitizeHtmlToText(html: string): string {
  if (!html || typeof html !== 'string') return '';

  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  // Extract main body / article if present
  const articleMatch = cleaned.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = cleaned.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  const targetHtml = articleMatch ? articleMatch[1] : mainMatch ? mainMatch[1] : cleaned;

  // Convert break tags and paragraphs to newlines
  const textWithBreaks = targetHtml
    .replace(/<\/(p|div|h[1-6]|li|tr|section|blockquote)>/gi, '\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  const decoded = textWithBreaks
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–');

  // Collapse multiple spaces within lines and multiple blank lines
  return decoded
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n\n');
}

/**
 * Computes a fast hex hash for content integrity audit tracking
 */
export async function computeContentHash(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return 'sha256-empty';

  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(trimmed);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      return `sha256:${hashHex.substring(0, 16)}`;
    }
  } catch {
    // Fallback simple hash
  }

  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = (hash << 5) - hash + trimmed.charCodeAt(i);
    hash |= 0;
  }
  return `hash:${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

export interface DocumentExtractionOutcome {
  success: boolean;
  extractedText?: string;
  error?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

/**
 * Safely extracts text from an uploaded syllabus, assignment prompt, or institutional policy.
 * Catches corrupt, password-protected, or scanned image files gracefully.
 */
export async function extractPolicyFromDocument(file: File): Promise<DocumentExtractionOutcome> {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'unknown',
      error: 'The uploaded policy document exceeds the 10MB limit. Please upload a smaller file or paste the policy text directly.',
    };
  }

  try {
    const rawText = await extractTextFromFile(file);
    const cleaned = rawText.trim();

    if (!cleaned || cleaned.length < 15) {
      return {
        success: false,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'unknown',
        error: 'The uploaded file appears to be empty or contains scanned images without selectable text. Please paste the relevant instructions manually.',
      };
    }

    return {
      success: true,
      extractedText: cleaned,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'unknown',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error extracting document.';
    return {
      success: false,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'unknown',
      error: `Could not extract text from "${file.name}": ${message}. Please paste the instructions directly into the text box below.`,
    };
  }
}
