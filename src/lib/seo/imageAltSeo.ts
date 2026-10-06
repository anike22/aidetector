export type ImageAltStatus = 'optimized' | 'missing' | 'empty' | 'decorative' | 'generic' | 'stuffed' | 'weak';

export interface ImageAltItem {
  index: number;
  source: string;
  alt: string | null;
  status: ImageAltStatus;
  score: number;
  issue: string;
  suggestion: string;
  raw: string;
  start: number;
  end: number;
  replacement: string;
  format: 'markdown' | 'html';
}

export interface ImageAltSeoResult {
  score: number;
  total: number;
  optimized: number;
  missing: number;
  decorative: number;
  needsWork: number;
  images: ImageAltItem[];
}

const GENERIC_ALT = /^(image|photo|picture|graphic|screenshot|img|photo\s*\d*|image\s*\d*)$/i;

function cleanFilename(src: string): string {
  try {
    const pathname = src.split('?')[0].split('#')[0];
    const file = pathname.split('/').pop() || '';
    return decodeURIComponent(file)
      .replace(/\.[a-z0-9]{2,5}$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\d{3,}\b/g, '')
      .trim();
  } catch {
    return '';
  }
}

function suggestionFor(src: string, keyword: string, existingAlt?: string | null): string {
  const filename = cleanFilename(src);
  const base = filename && !/^(image|img|photo|picture|screenshot)$/i.test(filename)
    ? filename
    : keyword.trim();
  const existing = (existingAlt || '').trim();
  const normalizedKeyword = keyword.trim().toLowerCase();
  const existingKeywordOccurrences = normalizedKeyword
    ? existing.toLowerCase().split(normalizedKeyword).length - 1
    : 0;
  if (
    existing &&
    !GENERIC_ALT.test(existing) &&
    existing.split(/\s+/).length >= 3 &&
    existing.length <= 125 &&
    existingKeywordOccurrences <= 1
  ) {
    return existing;
  }
  if (base) {
    const normalized = base.replace(/\s+/g, ' ').trim();
    const candidate = keyword.trim() && !normalized.toLowerCase().includes(keyword.trim().toLowerCase())
      ? `${normalized} related to ${keyword.trim()}`
      : normalized;
    return candidate.charAt(0).toUpperCase() + candidate.slice(1, 125);
  }
  return 'Describe the image clearly and concisely for readers using assistive technology';
}

function classifyAlt(alt: string | null, keyword: string) {
  if (alt === null) return { status: 'missing' as const, score: 0, issue: 'ALT attribute is missing.' };
  const trimmed = alt.trim();
  if (!trimmed) return { status: 'empty' as const, score: 55, issue: 'ALT text is empty. Keep it empty only if the image is purely decorative.' };
  if (GENERIC_ALT.test(trimmed)) return { status: 'generic' as const, score: 30, issue: 'ALT text is too generic to describe the image.' };
  if (trimmed.length < 8 || trimmed.split(/\s+/).length < 2) return { status: 'weak' as const, score: 50, issue: 'ALT text is too short to be descriptive.' };
  if (trimmed.length > 160) {
    return { status: 'stuffed' as const, score: 45, issue: 'ALT text looks over-optimized or excessively long.' };
  }
  const kw = keyword.trim().toLowerCase();
  if (kw) {
    const hay = trimmed.toLowerCase();
    const occurrences = hay.split(kw).length - 1;
    if (occurrences > 1) {
      return { status: 'stuffed' as const, score: 45, issue: 'ALT text looks over-optimized or excessively long.' };
    }
  }
  return { status: 'optimized' as const, score: 100, issue: 'ALT text is descriptive and usable.' };
}

function markdownReplacement(raw: string, alt: string) {
  return raw.replace(/^!\[[^\]]*\]/, `![${alt}]`);
}

function htmlReplacement(raw: string, alt: string) {
  const escaped = alt.replace(/"/g, '&quot;');
  if (/\salt\s*=\s*["'][^"']*["']/i.test(raw)) {
    return raw.replace(/\salt\s*=\s*(["'])[^"']*\1/i, ` alt="${escaped}"`);
  }
  return raw.replace(/<img\b/i, `<img alt="${escaped}"`);
}

export function analyzeImageAltSeo(content: string, keyword = ''): ImageAltSeoResult {
  const items: ImageAltItem[] = [];
  const occupied: Array<[number, number]> = [];

  const markdown = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  let md: RegExpExecArray | null;
  while ((md = markdown.exec(content))) {
    const alt = md[1];
    const src = md[2];
    const c = classifyAlt(alt, keyword);
    const suggestion = suggestionFor(src, keyword, alt);
    items.push({
      index: items.length,
      source: src,
      alt,
      status: c.status,
      score: c.score,
      issue: c.issue,
      suggestion,
      raw: md[0],
      start: md.index,
      end: md.index + md[0].length,
      replacement: markdownReplacement(md[0], suggestion),
      format: 'markdown',
    });
    occupied.push([md.index, md.index + md[0].length]);
  }

  const html = /<img\b[^>]*>/gi;
  let hm: RegExpExecArray | null;
  while ((hm = html.exec(content))) {
    if (occupied.some(([start, end]) => hm!.index >= start && hm!.index < end)) continue;
    const raw = hm[0];
    const srcMatch = raw.match(/\ssrc\s*=\s*(["'])(.*?)\1/i);
    const altMatch = raw.match(/\salt\s*=\s*(["'])(.*?)\1/i);
    const src = srcMatch?.[2] || '';
    const alt = altMatch ? altMatch[2] : null;
    let c = classifyAlt(alt, keyword);
    if (alt === '' && (/\srole\s*=\s*(["'])presentation\1/i.test(raw) || /\saria-hidden\s*=\s*(["'])true\1/i.test(raw))) {
      c = { status: 'decorative' as const, score: 100, issue: 'Image is explicitly marked decorative and correctly uses empty ALT text.' };
    }
    const suggestion = suggestionFor(src, keyword, alt);
    items.push({
      index: items.length,
      source: src,
      alt,
      status: c.status,
      score: c.score,
      issue: c.issue,
      suggestion,
      raw,
      start: hm.index,
      end: hm.index + raw.length,
      replacement: htmlReplacement(raw, suggestion),
      format: 'html',
    });
  }

  const total = items.length;
  const optimized = items.filter(i => i.status === 'optimized').length;
  const decorative = items.filter(i => i.status === 'decorative').length;
  const missing = items.filter(i => i.status === 'missing').length;
  const needsWork = items.filter(i => !['optimized', 'decorative'].includes(i.status)).length;
  const score = total === 0 ? 100 : Math.round(items.reduce((sum, item) => sum + item.score, 0) / total);

  return { score, total, optimized, missing, decorative, needsWork, images: items };
}
