/**
 * Text normalisation and tokenisation utilities for the plagiarism engine.
 * Pure functions — no external dependencies.
 */

const PRIVATE_IP_RE =
  /^(10\.|127\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1|localhost)/i;

const CITATION_RE =
  /(\([\w\s,\.]+\d{4}[a-z]?\)|\[[\d,\s]+\]|"[^"]{10,200}"|'\s*\((?:ibid|op\.?\s*cit)\))/gi;

const BIBLIOGRAPHY_RE =
  /^(references|bibliography|works\s+cited|sources)\s*$/im;

// ── URL / SSRF validation ──────────────────────────────────────────────────

/**
 * Returns true if the URL is safe to fetch (https, public host, not private range).
 */
export function isSafeUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return false;
    if (PRIVATE_IP_RE.test(u.hostname)) return false;
    if (!u.hostname.includes('.')) return false; // bare hostnames
    return true;
  } catch {
    return false;
  }
}

// ── Normalisation ──────────────────────────────────────────────────────────

/**
 * Normalise Unicode, collapse whitespace, lowercase.
 * Used for matching comparisons — NOT for display.
 */
export function normalise(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Tokenise into words (letters + digits only).
 */
export function tokenise(text: string): string[] {
  return normalise(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

// ── Citation / reference stripping ────────────────────────────────────────

/**
 * Mark citation-like spans so they can be excluded from originality scoring.
 * Returns { clean: string; hasCitations: boolean }.
 */
export function stripCitations(text: string): { clean: string; hasCitations: boolean } {
  let hasCitations = false;
  const clean = text.replace(CITATION_RE, (m) => {
    hasCitations = true;
    return ' '.repeat(m.length); // preserve offsets
  });
  return { clean, hasCitations };
}

/**
 * Split text at bibliography section — return [bodyText, bibliographyText | null].
 */
export function splitBibliography(text: string): [string, string | null] {
  const match = BIBLIOGRAPHY_RE.exec(text);
  if (!match) return [text, null];
  return [text.slice(0, match.index).trim(), text.slice(match.index).trim()];
}

// ── N-gram fingerprinting ──────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by',
  'from','is','was','are','were','be','been','being','have','has','had','do',
  'does','did','will','would','could','should','may','might','shall','that',
  'this','these','those','it','its','as','if','so','not','no','nor','yet',
  'both','either','neither','such','than','then','when','where','while',
]);

/** Build normalised n-grams from tokens, skipping all-stopword grams. */
export function buildNgrams(tokens: string[], n: number): Map<string, number[]> {
  const map = new Map<string, number[]>();
  for (let i = 0; i <= tokens.length - n; i++) {
    const gram = tokens.slice(i, i + n);
    if (gram.every((t) => STOP_WORDS.has(t))) continue;
    const key = gram.join(' ');
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(i);
  }
  return map;
}

/** Compute Jaccard similarity between two token-sets (0–1). */
export function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const t of setA) if (setB.has(t)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Levenshtein edit distance (character level, bounded at maxDist). */
export function editDistance(a: string, b: string, maxDist = 50): number {
  if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;
  const prev: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    prev.splice(0, prev.length, ...curr);
  }
  return prev[b.length];
}

// ── Sentence splitting ─────────────────────────────────────────────────────

/**
 * Split text into sentences with start offsets.
 */
export function splitSentences(text: string): Array<{ text: string; start: number }> {
  const sentences: Array<{ text: string; start: number }> = [];
  const re = /[^.!?]+[.!?]*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const s = m[0].trim();
    if (s.length > 15) sentences.push({ text: s, start: m.index });
  }
  return sentences;
}

// ── Boilerplate removal ────────────────────────────────────────────────────

const BOILERPLATE_RE =
  /^(cookie\s+policy|privacy\s+policy|terms\s+of\s+(use|service)|all\s+rights\s+reserved|copyright\s+©|skip\s+to\s+(main\s+)?content|navigation|search|menu|sidebar)/im;

/** Remove obvious boilerplate lines from fetched source text. */
export function removeBoilerplate(text: string): string {
  return text
    .split('\n')
    .filter((line) => !BOILERPLATE_RE.test(line.trim()))
    .join('\n');
}

// ── Unique-coverage calculation ────────────────────────────────────────────

/**
 * Given a list of [start, end) span pairs and total eligible character count,
 * return the number of unique characters covered (no double-counting).
 */
export function uniqueCoverage(spans: Array<[number, number]>, totalChars: number): number {
  if (spans.length === 0 || totalChars === 0) return 0;
  // Sort by start, merge overlapping ranges
  const sorted = [...spans].sort((a, b) => a[0] - b[0]);
  let covered = 0;
  let curStart = sorted[0][0];
  let curEnd = sorted[0][1];
  for (let i = 1; i < sorted.length; i++) {
    const [s, e] = sorted[i];
    if (s <= curEnd) {
      curEnd = Math.max(curEnd, e);
    } else {
      covered += curEnd - curStart;
      curStart = s;
      curEnd = e;
    }
  }
  covered += curEnd - curStart;
  return Math.min(covered, totalChars);
}
