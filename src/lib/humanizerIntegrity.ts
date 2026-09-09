// Humanizer rewrite-integrity validation.
// Pure functions, no external imports — safe to run in Edge Functions and
// to unit-test under both Vitest and Deno.

export interface QuotedSpan {
  text: string;
  start: number;
  end: number;
}

export interface IntegrityIssue {
  kind:
    | "missing_quotation"
    | "placeholder_leak"
    | "number_loss"
    | "negation_loss"
    | "truncation"
    | "inserted_absolutes"
    | "formality_inflation";
  message: string;
  severity: "fatal" | "warning";
}

export interface IntegrityReport {
  passed: boolean;           // true when no fatal issues
  issues: IntegrityIssue[];  // fatal + warning
  fatalCount: number;
  warningCount: number;
}

// Formal-register markers that indicate synonym inflation when the rewrite
// is much more formal than the source.
const FORMAL_MARKERS = [
  /\butiliz(?:e[sd]?|ing|ation)\b/gi,
  /\bpersist(?:ed|s|ing)? in\b/gi,
  /\bconstitut(?:es?|ed|ing)\b/gi,
  /\binclud(?:ing|es) but not limited to\b/gi,
  /\bendeavou?r(?:ed|s|ing)?\b/gi,
  /\baforementioned\b/gi,
  /\bcommence[sd]?|commencing\b/gi,
  /\bfacilitat(?:es?|ed|ing)\b/gi,
  /\bcircumvent(?:s?|ed|ing)\b/gi,
  /\bin order to\b/gi,
  /\bsubsequent to\b/gi,
];

// Words that strengthen a causal/quantitative claim beyond the source.
const ABSOLUTE_MARKERS = [
  /\bsolely\b/gi,
  /\bentirely\b/gi,
  /\bdefinitively\b/gi,
  /\bundeniably\b/gi,
  /\bcategorically\b/gi,
  /\bconclusively (?:prov|demonstrat|establish)/gi,
  /\ball ?proof that\b/gi,
];

const NEGATION_WORDS = /\b(?:not|no|never|none|nothing|nowhere|neither|nor|cannot|without|unless|except)\b/gi;

/**
 * Split text into sentences (used for sentence-level negation tracking).
 */
function splitSentencesLocal(text: string): string[] {
  return text
    .replace(/([.!?])\s+/g, "$1\n")
    .split("\n")
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function wordOverlap(a: string, b: string): number {
  const wa = new Set(a.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter(w => w.length > 3));
  const wb = new Set(b.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter(w => w.length > 3));
  if (wa.size === 0) return 0;
  let common = 0;
  for (const w of wa) if (wb.has(w)) common++;
  return common / wa.size;
}

/**
 * Extract spans of text enclosed in double quotation marks (straight or curly).
 * Only spans between 2 and 400 chars are treated as quotations.
 */
export function extractQuotedSpans(text: string): QuotedSpan[] {
  const spans: QuotedSpan[] = [];
  const patterns = [
    /"([^"\n]{2,400})"/g,
    /\u201C([^\u201D\n]{2,400})\u201D/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      spans.push({ text: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  return spans.sort((a, b) => a.start - b.start);
}

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Verify every quotation from the source appears verbatim (modulo whitespace
 * normalization) in the rewrite.
 */
export function checkQuotationPreservation(source: string, rewrite: string): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const quotedSpans = extractQuotedSpans(source);

  if (quotedSpans.length === 0) return issues;

  // Build a whitespace-normalized haystack for robust matching.
  const normRewrite = normalizeWhitespace(rewrite);

  for (const span of quotedSpans) {
    const needle = normalizeWhitespace(span.text);
    if (!normRewrite.includes(needle)) {
      issues.push({
        kind: "missing_quotation",
        message: `Direct quotation was not preserved verbatim: ${span.text.slice(0, 80)}`,
        severity: "fatal",
      });
    }
  }
  return issues;
}

/**
 * Detect leaked placeholder tokens from failed protected-span mechanisms.
 */
export function checkPlaceholderLeaks(rewrite: string): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const placeholderPatterns = [
    /\u00AB[A-Z_0-9]+\u00BB/g,   // «PROTECTED_1» style
    /\[\[PROTECTED[^\]]*\]\]/gi,
    /<<PROTECTED[^>]*>>/gi,
    /__PROTECTED_[A-Z0-9_]+__/gi,
    /\u27E8[A-Z_0-9]+\u27E9/g,   // ⟨PROTECTED_1⟩ style
  ];
  for (const re of placeholderPatterns) {
    const m = rewrite.match(re);
    if (m) {
      issues.push({
        kind: "placeholder_leak",
        message: `Unrestored placeholder token leaked into output: ${m[0]}`,
        severity: "fatal",
      });
    }
  }
  return issues;
}

/**
 * Every number in the source must appear in the rewrite (same values, same
 * units — relationships are checked by exact-value presence).
 */
/**
 * Unit families: a source number captured with a short unit (e.g. "12 min")
 * passes when the bare value appears AND the unit (or its long/localized
 * form, e.g. "minutos") appears anywhere in the rewrite. This accepts
 * legitimate rewrites like "de 12 a 8 minutos" without weakening detection
 * of genuinely dropped numbers or unit conversions.
 */
const UNIT_FAMILIES: string[][] = [
  ["min", "mins", "minute", "minutes", "minuto", "minutos"],
  ["sec", "secs", "second", "seconds", "segundo", "segundos"],
  ["hrs", "hr", "hour", "hours", "hora", "horas"],
  ["days", "day", "día", "días", "dia", "dias"],
  ["years", "year", "año", "años"],
  ["%", "percent", "percentage", "porcentaje"],
  ["puntos", "punto", "points", "point", "pp"],
  ["km", "kilometers", "kilómetros"],
  ["kg", "kilograms", "kilogramos"],
  ["USD", "$"],
  ["EUR", "€"],
  ["GBP", "£"],
];

function unitPresentInText(unit: string, text: string): boolean {
  const lower = text.toLowerCase();
  const family = UNIT_FAMILIES.find(f => f.some(a => a.toLowerCase() === unit.toLowerCase()));
  if (!family) return lower.includes(unit.toLowerCase());
  return family.some(a => lower.includes(a.toLowerCase()));
}

export function checkNumberPreservation(source: string, rewrite: string): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const numberRe = /\$?\d[\d,]*(?:\.\d+)?\s?(?:%|percent|USD|EUR|GBP|km\/h|mph|kg|lbs|MB|GB|TB|ms|sec|min|hrs|days|years|k|M|B|°C|°F)?/g;

  const extract = (text: string) => {
    const out: { token: string; value: string; unit: string }[] = [];
    numberRe.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = numberRe.exec(text)) !== null) {
      const token = m[0].trim();
      if (!token || /^\d$/.test(token)) continue;
      const valueMatch = token.match(/^\$?\d[\d,]*(?:\.\d+)?/);
      const value = valueMatch ? valueMatch[0] : token;
      const unit = token.slice(value.length).trim().toLowerCase();
      out.push({ token, value, unit });
    }
    return out;
  };

  const srcNumbers = extract(source);
  const rwNumbers = extract(rewrite);
  if (srcNumbers.length === 0) return issues;

  const rwTokens = new Set(rwNumbers.map(n => n.token.toLowerCase()));
  const rwTokensNorm = new Set(rwNumbers.map(n => n.token.replace(/,/g, "").toLowerCase()));
  const rwValues = new Set(rwNumbers.map(n => n.value.replace(/,/g, "").toLowerCase()));

  for (const n of srcNumbers) {
    const norm = n.token.replace(/,/g, "").toLowerCase();
    if (rwTokens.has(n.token.toLowerCase()) || rwTokensNorm.has(norm)) continue;
    const valuePresent = rwValues.has(n.value.replace(/,/g, "").toLowerCase());
    const unitOk = !n.unit || unitPresentInText(n.unit, rewrite);
    if (!(valuePresent && unitOk)) {
      issues.push({
        kind: "number_loss",
        message: `Number "${n.token}" from the source is missing in the rewrite.`,
        severity: "fatal",
      });
    }
  }
  return issues;
}

/**
 * A source with negation markers must keep at least one; large drops suggest
 * meaning inversion.
 */
export function checkNegationPreservation(source: string, rewrite: string): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const srcCount = (source.match(NEGATION_WORDS) || []).length;
  const rwCount = (rewrite.match(NEGATION_WORDS) || []).length;

  if (srcCount > 0 && rwCount === 0) {
    issues.push({
      kind: "negation_loss",
      message: "All negation markers were removed — risk of meaning inversion.",
      severity: "fatal",
    });
    return issues;
  }
  if (srcCount > rwCount + 2 || rwCount > srcCount + 2) {
    issues.push({
      kind: "negation_loss",
      message: `Negation count shifted significantly (source ${srcCount} → rewrite ${rwCount}).`,
      severity: "warning",
    });
  }

  // Sentence-level tracking: every source sentence containing a negation word
  // must correspond to a rewrite sentence that also contains one. This catches
  // a single "not X" being flipped to "X" while other negations survive.
  const srcSentences = splitSentencesLocal(source);
  const rwSentences = splitSentencesLocal(rewrite);
  for (const srcSent of srcSentences) {
    if (!NEGATION_WORDS.test(srcSent)) continue;
    NEGATION_WORDS.lastIndex = 0;

    // Find the best-matching rewrite sentence for this source sentence.
    let best: { sent: string; overlap: number } | null = null;
    for (const rwSent of rwSentences) {
      const overlap = wordOverlap(srcSent, rwSent);
      if (!best || overlap > best.overlap) best = { sent: rwSent, overlap };
    }
    if (!best || best.overlap < 0.4) continue; // no confident match; skip

    NEGATION_WORDS.lastIndex = 0;
    const hasNegation = NEGATION_WORDS.test(best.sent);
    NEGATION_WORDS.lastIndex = 0;
    if (!hasNegation) {
      issues.push({
        kind: "negation_loss",
        message: `A negated statement lost its negation in the rewrite: "${srcSent.slice(0, 90)}..."`,
        severity: "fatal",
      });
    }
  }
  return issues;
}

/**
 * Detect truncation: a rewrite far shorter than source, or a much smaller
 * paragraph count.
 */
export function checkTruncation(source: string, rewrite: string): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const origWords = source.trim().split(/\s+/).filter(Boolean).length;
  const rewrWords = rewrite.trim().split(/\s+/).filter(Boolean).length;
  const origParas = source.trim().split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
  const rewrParas = rewrite.trim().split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

  if (origWords >= 30 && rewrWords < origWords * 0.45) {
    issues.push({
      kind: "truncation",
      message: `Output is ${rewrWords}/${origWords} words — likely truncated.`,
      severity: "fatal",
    });
  }
  if (origParas >= 3 && rewrParas <= 1) {
    issues.push({
      kind: "truncation",
      message: `Paragraph count collapsed (${origParas} → ${rewrParas}) — likely truncated.`,
      severity: "fatal",
    });
  }
  // Duplicated tail is a classic streaming artifact.
  const tail = rewrite.trim().slice(-120);
  if (tail && rewrite.trim().slice(0, -130).includes(tail.slice(0, 60))) {
    issues.push({
      kind: "truncation",
      message: "Output contains duplicated content — possible generation artifact.",
      severity: "warning",
    });
  }
  return issues;
}

/**
 * Detect absolutes introduced by the rewrite that are absent from the source
 * — e.g. the "solely" failure case.
 */
export function checkInsertedAbsolutes(source: string, rewrite: string): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  for (const re of ABSOLUTE_MARKERS) {
    const inRewrite = (rewrite.match(re) || []).length;
    if (inRewrite === 0) continue;
    const inSource = (source.match(re) || []).length;
    if (inRewrite > inSource) {
      const sample = rewrite.match(re)![0];
      issues.push({
        kind: "inserted_absolutes",
        message: `Rewrite introduces claim-strengthening word "${sample}" that is not in the source.`,
        severity: "fatal",
      });
    }
  }
  return issues;
}

/**
 * Formality inflation: when the rewrite contains notably more formal markers
 * than the source, flag it (this produced the "persist in utilizing" output).
 */
export function checkFormalityInflation(source: string, rewrite: string): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const countMarkers = (text: string) =>
    FORMAL_MARKERS.reduce((acc, re) => acc + (text.match(re) || []).length, 0);

  const srcFormal = countMarkers(source);
  const rwFormal = countMarkers(rewrite);

  if (rwFormal > srcFormal) {
    const excess = rwFormal - srcFormal;
    if (excess >= 1) {
      issues.push({
        kind: "formality_inflation",
        message: `Rewrite uses ${excess} more formal-inflation pattern(s) than the source (e.g. "utilize", "constitute", "persist in"). Register should match the source.`,
        severity: excess >= 2 ? "fatal" : "warning",
      });
    }
  }
  return issues;
}

/**
 * Full integrity validation of a rewrite against its source.
 * Deterministic checks only — no model self-assessment.
 */
export function validateRewrite(source: string, rewrite: string): IntegrityReport {
  const issues: IntegrityIssue[] = [
    ...checkQuotationPreservation(source, rewrite),
    ...checkPlaceholderLeaks(rewrite),
    ...checkNumberPreservation(source, rewrite),
    ...checkNegationPreservation(source, rewrite),
    ...checkTruncation(source, rewrite),
    ...checkInsertedAbsolutes(source, rewrite),
    ...checkFormalityInflation(source, rewrite),
  ];

  const fatalCount = issues.filter(i => i.severity === "fatal").length;
  const warningCount = issues.filter(i => i.severity === "warning").length;

  return { passed: fatalCount === 0, issues, fatalCount, warningCount };
}

/**
 * Build a targeted repair prompt for the issues found. The repair model sees
 * the original source, its flawed rewrite, and a precise list of what went
 * wrong, and must return a corrected rewrite only.
 */
export function buildRepairPrompt(source: string, flawedRewrite: string, report: IntegrityReport): string {
  const issueLines = report.issues.map((i, idx) => `${idx + 1}. [${i.severity.toUpperCase()}] ${i.message}`);
  const quotedSpans = extractQuotedSpans(source);
  const quotesBlock = quotedSpans.length
    ? `\nThe source contains these direct quotations which MUST appear verbatim:\n${quotedSpans.map(s => s.text).join("\n")}\n`
    : "";

  return `You are the AIDetector.cx Repair Engine. A rewrite was produced but failed integrity validation. Fix ONLY the listed problems and return the corrected full rewrite.

SOURCE TEXT (authoritative):
<<<BEGIN_SOURCE_TEXT>>>
${source}
<<<END_SOURCE_TEXT>>>

FLAWED REWRITE:
<<<BEGIN_FLAWED_REWRITE>>>
${flawedRewrite}
<<<END_FLAWED_REWRITE>>>

VALIDATION FAILURES:
${issueLines.join("\n")}${quotesBlock}
RULES:
- Direct quotations must be reproduced character-for-character.
- Keep everything else about the flawed rewrite that was fine (naturalness, structure, length).
- Do not introduce new formal synonyms ("utilize", "constitute", "persist in"); match the source's register.
- Do not add intensifiers or causal claims beyond the source.
- Preserve all numbers, dates, URLs, citations, and negations exactly.
- Return ONLY the corrected rewrite text, nothing else.`;
}
