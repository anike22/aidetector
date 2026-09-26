import DOMPurify from 'dompurify';

function getSanitizer() {
  if (typeof window !== 'undefined') {
    if (typeof (DOMPurify as any)?.sanitize === 'function') {
      return DOMPurify;
    }
    if (typeof DOMPurify === 'function') {
      return (DOMPurify as any)(window);
    }
  }
  if (typeof (DOMPurify as any)?.sanitize === 'function') {
    return DOMPurify;
  }
  return null;
}

/**
 * Sanitize HTML content safely while preserving all supported rich-text elements:
 * headings (h2-h6), paragraphs, blockquotes, lists, links, images, figures,
 * figcaptions, tables, code blocks, inline formatting, etc.
 *
 * Strips dangerous scripts, event handlers (onclick, onerror, etc.),
 * unsafe protocols (javascript:, data: [for non-images], vbscript:).
 */
export function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml) return '';

  const sanitizer = getSanitizer();
  if (!sanitizer) {
    // In headless Node environment without window, safely strip dangerous tags & handlers
    return dirtyHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '')
      .replace(/href\s*=\s*["']\s*javascript:[^"']*["']/gi, 'href="#"');
  }

  return sanitizer.sanitize(dirtyHtml, {
    ALLOWED_TAGS: [
      'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'span', 'div', 'br', 'hr',
      'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'sub', 'sup', 'mark',
      'a',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
      'figure', 'figcaption', 'img',
      'iframe', 'video', 'source', 'details', 'summary',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'title',
      'src', 'alt', 'width', 'height', 'loading',
      'class', 'className', 'style', 'id',
      'data-align', 'data-size', 'data-caption',
      'colspan', 'rowspan', 'scope', 'align',
      'frameborder', 'allow', 'allowfullscreen',
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'style', 'input', 'button', 'form', 'textarea', 'select'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onkeydown', 'onkeyup'],
  });
}

/**
 * Validates whether a URL is safe for linking or embedding (rejects javascript:, vbscript:, etc.).
 */
export function isValidSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Allow relative URLs starting with / or #
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return true;

  // Reject dangerous schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol);
  } catch {
    // Relative or protocol-relative if valid
    return /^https?:\/\//i.test(trimmed) || /^\//.test(trimmed);
  }
}
