/**
 * Pure, dependency-free core for the AI Summarizer.
 * Shared between the ai-summarizer Edge Function and the vitest suite.
 * MUST NOT import Deno, Node, or browser APIs.
 */

export type SummaryLength = 'short' | 'medium' | 'detailed';
export type SummaryFormat = 'paragraphs' | 'bullets' | 'takeaways';

export const MIN_INPUT_WORDS = 60;
export const MAX_INPUT_WORDS = 10000;
export const TRIAL_MAX_WORDS = 2000;
export const CHUNK_THRESHOLD_WORDS = 6000;
export const CHUNK_MAX_WORDS = 3200;
export const CREDITS_PER_1000_WORDS = 2;

export const SUPPORTED_LANGUAGES: string[] = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch',
  'Polish', 'Russian', 'Turkish', 'Arabic', 'Hindi', 'Indonesian', 'Japanese',
  'Korean', 'Chinese (Simplified)', 'Chinese (Traditional)', 'Vietnamese',
  'Thai', 'Ukrainian',
];

export interface SourceSection {
  index: number; // 1-based referenceable unit
  text: string;
  words: number;
}

export interface SourceChunk {
  text: string;
  sectionStart: number;
  sectionEnd: number;
  /** Index of the first non-overlap section (overlap section precedes it). */
  coreStart: number;
}

export interface CandidateReference {
  claim: string;
  section_start: number;
  section_end: number;
  quote?: string;
}

export interface ValidatedReference {
  claim: string;
  section_start: number;
  section_end: number;
  quote?: string;
  verified: 'exact' | 'range' | 'unverified';
}

export interface ValidationProblem {
  check: string;
  detail: string;
}

export interface ExactValidation {
  passed: boolean;
  problems: ValidationProblem[];
  warnings: string[];
  stats: { items: number; outputWords: number };
}

export function countWords(text: string): number {
  const t = (text || '').trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

export function computeCreditCost(words: number): number {
  const w = Math.max(1, words || 0);
  return CREDITS_PER_1000_WORDS * Math.max(1, Math.ceil(w / 1000));
}

/** Normalizes text for case-insensitive, whitespace-insensitive comparison. */
export function normalizeForCompare(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Collapses whitespace but preserves case+punctuation for quote matching. */
export function normalizeSpacing(text: string): string {
  return (text || '').replace(/\s+/g, ' ').trim();
}

export function splitIntoSentences(text: string): string[] {
  return (text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Splits a very long paragraph into sentence-group sub-sections. */
export function splitLongParagraph(text: string, maxWords = 400): string[] {
  const sentences = splitIntoSentences(text);
  const groups: string[] = [];
  let current: string[] = [];
  let currentWords = 0;
  for (const sentence of sentences) {
    const sw = countWords(sentence);
    if (currentWords > 0 && currentWords + sw > maxWords) {
      groups.push(current.join(' '));
      current = [sentence];
      currentWords = sw;
    } else {
      current.push(sentence);
      currentWords += sw;
    }
  }
  if (current.length) groups.push(current.join(' '));
  return groups.length ? groups : [text];
}

/**
 * Builds the 1-based referenceable sections of a document. Paragraphs are
 * split on blank lines (or single newlines when no blank lines exist); any
 * paragraph longer than 600 words is split into sentence groups so that
 * section references stay useful.
 */
export function buildSections(text: string): SourceSection[] {
  const raw = (text || '').trim();
  if (!raw) return [];
  let paragraphs = raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length <= 1) {
    paragraphs = raw.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  }
  const sections: SourceSection[] = [];
  for (const paragraph of paragraphs) {
    if (countWords(paragraph) > 600) {
      for (const group of splitLongParagraph(paragraph)) {
        sections.push({ index: sections.length + 1, text: group, words: countWords(group) });
      }
    } else {
      sections.push({ index: sections.length + 1, text: paragraph, words: countWords(paragraph) });
    }
  }
  return sections;
}

/**
 * Groups sections into chunks of at most maxChunkWords. The last section of
 * each chunk is repeated as overlap at the start of the next chunk so
 * cross-boundary context is preserved; `coreStart` marks where non-overlap
 * content begins for evidence-deduplication.
 */
export function chunkSections(
  sections: SourceSection[],
  maxChunkWords = CHUNK_MAX_WORDS
): SourceChunk[] {
  const chunks: SourceChunk[] = [];
  let current: SourceSection[] = [];
  let currentWords = 0;
  let overlap: SourceSection | null = null;
  let coreStart = sections.length ? sections[0].index : 1;

  const flush = () => {
    if (!current.length) return;
    const ordered = overlap ? [overlap, ...current] : [...current];
    chunks.push({
      text: ordered.map((s) => `[Section ${s.index}]\n${s.text}`).join('\n\n'),
      sectionStart: ordered[0].index,
      sectionEnd: ordered[ordered.length - 1].index,
      coreStart,
    });
    overlap = current[current.length - 1];
    coreStart = current[current.length - 1].index + 1;
    current = [];
    currentWords = 0;
  };

  for (const section of sections) {
    if (current.length > 0 && currentWords + section.words > maxChunkWords) {
      flush();
    }
    if (!current.length && overlap) currentWords += overlap!.words;
    current.push(section);
    currentWords += section.words;
  }
  flush();
  return chunks;
}

export interface TargetRange {
  min: number;
  max: number;
  label: string;
}

/** Length targets relative to source size (honest targets, not promises). */
export function estimateTargetWordRange(sourceWords: number, length: SummaryLength): TargetRange {
  const w = Math.max(1, sourceWords);
  if (length === 'short') {
    const min = Math.max(30, Math.round(w * 0.05));
    const max = Math.max(60, Math.round(w * 0.12));
    return { min, max, label: `about ${min}–${max} words` };
  }
  if (length === 'detailed') {
    const min = Math.max(120, Math.round(w * 0.2));
    const max = Math.max(300, Math.round(w * 0.45));
    return { min, max, label: `about ${min}–${max} words` };
  }
  const min = Math.max(60, Math.round(w * 0.1));
  const max = Math.max(150, Math.round(w * 0.25));
  return { min, max, label: `about ${min}–${max} words` };
}

export function outputWithinTarget(outputWords: number, target: TargetRange): boolean {
  return outputWords >= Math.round(target.min * 0.5) && outputWords <= Math.round(target.max * 1.8);
}

/**
 * Extracts checkable numeric tokens: numbers with a numeric value >= 10,
 * decimals, and 4-digit years. Single digits 1–9 are excluded because they
 * appear too often in ordinary phrasing ("two main reasons").
 */
export function extractCheckableNumbers(text: string): string[] {
  const raw = text || '';
  const tokens = raw.match(/\d[\d,]*(?:\.\d+)?/g) || [];
  const out = new Set<string>();
  for (const token of tokens) {
    const cleaned = token.replace(/,/g, '');
    const value = parseFloat(cleaned);
    if (isNaN(value)) continue;
    const isDecimal = cleaned.includes('.');
    const isYear = /^\d{4}$/.test(cleaned);
    if (value >= 10 || isDecimal || isYear) {
      out.add(cleaned);
    }
  }
  return Array.from(out);
}

/** Numbers present in the summary but absent from the source. */
export function findUnsupportedNumbers(summary: string, source: string): string[] {
  const sourceSet = new Set(extractCheckableNumbers(source));
  return extractCheckableNumbers(summary).filter((n) => !sourceSet.has(n));
}

const NAME_STOP_LIST = new Set([
  'key takeaways', 'main points', 'in summary', 'the following', 'according to',
  'the source', 'the author', 'the study', 'the report', 'the article',
  'the paper', 'the text', 'the document', 'in addition', 'as well',
  'in contrast', 'for example', 'these include', 'this means', 'in particular',
  'the summary', 'the researchers', 'the company', 'the team', 'first',
  'second', 'third', 'finally', 'however', 'meanwhile', 'overall',
]);

const ACRONYM_STOP_LIST = new Set([
  'AI', 'US', 'UK', 'EU', 'UN', 'FAQ', 'PDF', 'API', 'CEO', 'COVID', 'LLM',
  'URL', 'ID', 'OK', 'TLDR', 'USA',
]);

/** Candidate proper names: capitalized 2+ word sequences and acronyms. */
export function extractNameCandidates(text: string): string[] {
  const out = new Set<string>();
  const acronyms = text.match(/\b[A-Z]{2,6}\b/g) || [];
  for (const a of acronyms) {
    if (!ACRONYM_STOP_LIST.has(a)) out.add(a);
  }
  const sequences = text.match(/\b([A-Z][a-z]+(?:\s+(?:of|the|and|for|de|van|von))?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g) || [];
  for (let seq of sequences) {
    seq = seq.trim();
    const lower = seq.toLowerCase();
    if (NAME_STOP_LIST.has(lower)) continue;
    // Strip a leading determiner/preposition noise word
    const cleaned = seq.replace(/^(The|This|These|Those|In|On|At|By|For|From|According)\s+/i, '');
    if (countWords(cleaned) >= 2) out.add(cleaned);
  }
  return Array.from(out);
}

/** Named entities in the summary that never appear in the source. */
export function findUnsupportedNames(summary: string, source: string): string[] {
  const sourceNorm = normalizeForCompare(source);
  return extractNameCandidates(summary).filter((name) => {
    let nameNorm = normalizeForCompare(name);
    if (!nameNorm) return false;
    // Possessive/derivative/demonym forms ("Harvard's" vs "Harvard", "North American" vs "North America")
    if (sourceNorm.includes(nameNorm)) return false;
    
    // Check possessive
    const basePossessive = nameNorm.replace(/'s$/, '');
    if (sourceNorm.includes(basePossessive)) return false;

    // Check demonym / adjective suffixes (-n, -an, -ian)
    const baseDemonym = nameNorm.replace(/i?an$/, 'a').replace(/n$/, '');
    if (sourceNorm.includes(baseDemonym)) return false;

    // Check if every constituent token (>= 3 chars) appears in source
    const tokens = nameNorm.split(/\s+/).filter((t) => t.length >= 3);
    if (tokens.length >= 2 && tokens.every((t) => sourceNorm.includes(t.replace(/i?an$/, 'a').replace(/n$/, '')))) {
      return false;
    }

    return true;
  });
}

const NEGATION_CUES = [
  // English
  'not', 'no ', 'never', 'cannot', "can't", "don't", "doesn't", "didn't",
  "won't", 'without', 'unlikely', 'lacks', 'lacked', 'fails to', 'failed to',
  'refused', 'rejects', 'rejected', 'absent', 'excludes', 'excluded', 'neither', 'nor',
  // Spanish
  'no', 'nunca', 'jamas', 'sin', 'tampoco', 'ningun', 'ninguna', 'nada',
  // French
  'ne ', "n'", 'pas', 'aucun', 'aucune', 'jamais', 'sans', 'rien', 'non',
  // German
  'nicht', 'kein', 'keine', 'nie', 'ohne',
];

export function containsNegationCue(text: string): boolean {
  const lower = ` ${normalizeForCompare(text)} `;
  return NEGATION_CUES.some((cue) => lower.includes(` ${cue.trim()} `) || lower.includes(` ${cue}`));
}

/**
 * A summary containing negation cues while the source contains none is a
 * suspected meaning flip (exact, coarse check — the contextual reviewer does
 * the real semantic validation).
 */
export function suspectedNegationFlip(summary: string, source: string): boolean {
  return containsNegationCue(summary) && !containsNegationCue(source);
}

export function endsWithTerminalPunctuation(text: string): boolean {
  const t = (text || '').trim();
  return /[.!?…"”)]$/.test(t);
}

export function dedupeItems(items: string[]): { items: string[]; removed: number } {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = normalizeForCompare(item).replace(/[^a-z0-9 ]/g, '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
  }
  return { items: out, removed: items.length - out.length };
}

export interface ReferenceValidation {
  references: ValidatedReference[];
  droppedCount: number;
  unverifiedQuotes: number;
}

/**
 * Validates model-produced references against the real section list:
 * - Section ranges must exist inside the document.
 * - Quotes must appear (whitespace/case-insensitive) inside the cited range;
 *   a non-matching quote is kept but marked `unverified` (never presented as
 *   an exact quotation).
 */
export function validateReferences(
  refs: CandidateReference[],
  sections: SourceSection[]
): ReferenceValidation {
  const out: ValidatedReference[] = [];
  let dropped = 0;
  let unverified = 0;
  const total = sections.length;
  for (const ref of refs || []) {
    const start = Math.round(Number(ref.section_start));
    const end = Math.round(Number(ref.section_end));
    if (
      !Number.isFinite(start) || !Number.isFinite(end) ||
      start < 1 || end < start || end > total || start > total
    ) {
      dropped++;
      continue;
    }
    const claim = (ref.claim || '').trim();
    if (!claim) {
      dropped++;
      continue;
    }
    const spanText = sections.slice(start - 1, end).map((s) => s.text).join(' ');
    let verified: ValidatedReference['verified'] = 'range';
    let quote: string | undefined;
    if (ref.quote && ref.quote.trim()) {
      quote = normalizeSpacing(ref.quote).slice(0, 600);
      const spanNorm = normalizeForCompare(spanText);
      const quoteNorm = normalizeForCompare(quote);
      if (quoteNorm && spanNorm.includes(quoteNorm)) {
        verified = 'exact';
      } else {
        verified = 'unverified';
        unverified++;
      }
    }
    out.push({ claim, section_start: start, section_end: end, quote, verified });
  }
  return { references: out, droppedCount: dropped, unverifiedQuotes: unverified };
}

export interface CandidateSummary {
  items: string[];
  references: CandidateReference[];
  notes?: string;
}

export interface ExactValidationInput {
  candidate: CandidateSummary;
  sections: SourceSection[];
  sourceText: string;
  target: TargetRange;
  format: SummaryFormat;
}

/** Runs all exact, mechanical validation checks over a candidate summary. */
export function exactValidate(input: ExactValidationInput): ExactValidation {
  const problems: ValidationProblem[] = [];
  const warnings: string[] = [];
  const { candidate, sections, sourceText, target, format } = input;

  const deduped = dedupeItems(candidate.items || []);
  if (deduped.removed > 0) {
    warnings.push(`${deduped.removed} duplicate line(s) removed.`);
  }
  const items = deduped.items;
  if (items.length === 0) {
    problems.push({ check: 'empty', detail: 'The summary contained no content.' });
    return { passed: false, problems, warnings, stats: { items: 0, outputWords: 0 } };
  }

  const joined = items.join(' ');
  const outputWords = countWords(joined);
  if (outputWords < Math.round(target.min * 0.5)) {
    problems.push({
      check: 'too_short',
      detail: `Output was ${outputWords} words; target is ${target.label}. Add the missing main points.`,
    });
  }
  if (outputWords > Math.round(target.max * 1.8)) {
    problems.push({
      check: 'too_long',
      detail: `Output was ${outputWords} words; target is ${target.label}. Condense secondary detail.`,
    });
  }

  const truncated = items.filter((item) => !endsWithTerminalPunctuation(item));
  if (truncated.length > 0 && items.length > 1) {
    problems.push({
      check: 'truncated',
      detail: 'Some summary lines appear cut off mid-sentence. Rewrite every line as a complete sentence.',
    });
  }

  const missingNumbers = findUnsupportedNumbers(joined, sourceText);
  if (missingNumbers.length) {
    problems.push({
      check: 'unsupported_numbers',
      detail: `These numbers are not in the source and must be removed or corrected: ${missingNumbers.slice(0, 10).join(', ')}.`,
    });
  }

  const missingNames = findUnsupportedNames(joined, sourceText);
  if (missingNames.length) {
    problems.push({
      check: 'unsupported_names',
      detail: `These names/entities are not in the source and must be removed or corrected: ${missingNames.slice(0, 10).join(', ')}.`,
    });
  }

  if (suspectedNegationFlip(joined, sourceText)) {
    problems.push({
      check: 'negation_flip',
      detail: 'The summary contains negation but the source contains none. Restore the source\u2019s affirmative meaning.',
    });
  }

  if (format === 'bullets' || format === 'takeaways') {
    if (items.length < 3) {
      problems.push({
        check: 'format',
        detail: `The ${format} format needs at least 3 distinct lines.`,
      });
    }
  }

  const refValidation = validateReferences(candidate.references, sections);
  if (refValidation.droppedCount > 0) {
    warnings.push(`${refValidation.droppedCount} source reference(s) pointed outside the document and were removed.`);
  }

  return {
    passed: problems.length === 0,
    problems,
    warnings,
    stats: { items: items.length, outputWords },
  };
}

export function reductionPercent(inputWords: number, outputWords: number): number {
  if (inputWords <= 0) return 0;
  const pct = Math.round((1 - outputWords / inputWords) * 100);
  return pct < 0 ? 0 : pct;
}

/** Extracts the first balanced JSON object from model output, tolerating fences. */
export function parseModelJson<T>(raw: string): T | null {
  if (!raw) return null;
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') inString = !inString;
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1)) as T;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/** Sanitizes user focus text for inclusion in prompts (no control chars). */
export function sanitizeFocus(focus: string | undefined | null): string {
  if (!focus) return '';
  return focus
    .replace(/[\u0000-\u001f\u007f<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
}
