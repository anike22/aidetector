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
    | "formality_inflation"
    | "ai_trope";
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

// Stereotypical AI transitions and boilerplate tropes that signal synthetic text
const AI_TROPE_MARKERS = [
  /\bdespite these (?:benefits|advantages|challenges)\b/gi,
  /\b(?:furthermore|moreover|consequently|additionally)\b/gi,
  /\bit is (?:important|worth|crucial) to note(?: that)?\b/gi,
  /\bas (?:these )?technolog(?:y|ies) continue(?:s)? to advance\b/gi,
  /\bwith the (?:rapid )?(?:rise|development|advent) of\b/gi,
  /\bin today's (?:fast-paced|modern|digital) world\b/gi,
  /\bplays? a (?:crucial|vital|pivotal|key|significant) role in\b/gi,
  /\bin conclusion\b/gi,
  /\bis fundamentally changing how\b/gi,
  /\ba wide (?:range|array|variety) of\b/gi,
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
  const origTrimmed = source.trim();
  const rewrTrimmed = rewrite.trim();

  if (origTrimmed.length > 0 && rewrTrimmed.length === 0) {
    issues.push({
      kind: "truncation",
      message: "Output is empty — generation failed or was completely truncated.",
      severity: "fatal",
    });
    return issues;
  }

  const origWords = origTrimmed.split(/\s+/).filter(Boolean).length;
  const rewrWords = rewrTrimmed.split(/\s+/).filter(Boolean).length;
  const origParas = origTrimmed.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
  const rewrParas = rewrTrimmed.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

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
  } else if (origParas >= 2 && rewrParas === 1 && origWords >= 60) {
    issues.push({
      kind: "truncation",
      message: `Paragraph count collapsed (${origParas} → ${rewrParas}) — likely truncated to first paragraph only.`,
      severity: "fatal",
    });
  }

  // Abrupt ending detection: source ended with terminal punctuation but rewrite ends abruptly mid-clause
  const terminalPunctuation = /[.!?…"'\)\]\}>]$/;
  const hasOrigTerminal = terminalPunctuation.test(origTrimmed);
  const hasRewrTerminal = terminalPunctuation.test(rewrTrimmed);
  if (hasOrigTerminal && !hasRewrTerminal && rewrWords > 5) {
    issues.push({
      kind: "truncation",
      message: "Output ends abruptly without terminal punctuation — possible cutoff during generation.",
      severity: "fatal",
    });
  }

  // Duplicated tail is a classic streaming artifact.
  const tail = rewrTrimmed.slice(-120);
  if (tail && rewrTrimmed.slice(0, -130).includes(tail.slice(0, 60))) {
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
 * Detect formulaic AI transitions and tropes introduced in the rewrite.
 */
export function checkAiTropes(source: string, rewrite: string): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const matches: string[] = [];
  for (const re of AI_TROPE_MARKERS) {
    const m = rewrite.match(re);
    if (m) matches.push(...m);
  }
  if (matches.length > 0) {
    const sample = matches.slice(0, 3).join(", ");
    issues.push({
      kind: "ai_trope",
      message: `Rewrite contains formulaic AI transitions/tropes: "${sample}". Express ideas with organic transitions and natural human cadence.`,
      severity: "warning",
    });
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
    ...checkAiTropes(source, rewrite),
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

export interface LinguisticScores {
  humanization_score: number;
  meaning_preservation_score: number;
  naturalness_score: number;
  readability_score: number;
  grammar_score: number;
  sentence_variety_score: number;
  vocabulary_diversity_score: number;
  ai_signal_after: number;
  sentence_length_stdev: number;
  sentence_length_mean: number;
  starter_diversity: number;
}

export function computeSentenceStats(text: string): { mean: number; stdev: number; lengths: number[]; starterDiversity: number } {
  const sentences = splitSentencesLocal(text);
  if (sentences.length === 0) return { mean: 0, stdev: 0, lengths: [], starterDiversity: 1 };

  const lengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((acc, len) => acc + Math.pow(len - mean, 2), 0) / lengths.length;
  const stdev = Math.sqrt(variance);

  const starters = sentences.map(s => {
    const firstWord = s.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") || "";
    return firstWord;
  }).filter(Boolean);
  const uniqueStarters = new Set(starters);
  const starterDiversity = starters.length > 0 ? uniqueStarters.size / starters.length : 1;

  return { mean, stdev, lengths, starterDiversity };
}

export function computeMeaningPreservation(source: string, rewrite: string): number {
  const issues = validateRewrite(source, rewrite);
  let score = 98;

  for (const issue of issues.issues) {
    if (issue.kind === "missing_quotation") score -= 15;
    else if (issue.kind === "number_loss") score -= 12;
    else if (issue.kind === "negation_loss") score -= issue.severity === "fatal" ? 14 : 6;
    else if (issue.kind === "truncation") score -= issue.severity === "fatal" ? 25 : 10;
    else if (issue.kind === "inserted_absolutes") score -= 10;
    else if (issue.kind === "placeholder_leak") score -= 20;
    else if (issue.kind === "formality_inflation") score -= 4;
  }

  const normWords = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length > 3);
  const origSet = new Set(normWords(source));
  const rewrSet = new Set(normWords(rewrite));
  if (origSet.size > 0) {
    let preserved = 0;
    for (const w of origSet) {
      if (rewrSet.has(w)) preserved++;
    }
    const overlapRatio = preserved / origSet.size;
    if (overlapRatio < 0.4) score -= 15;
    else if (overlapRatio < 0.5) score -= 8;
  }

  return Math.max(50, Math.min(100, Math.round(score)));
}

export function computeNaturalness(source: string, rewrite: string): number {
  const stats = computeSentenceStats(rewrite);
  let score = 78;

  if (stats.stdev >= 7) score += 11;
  else if (stats.stdev >= 4.5) score += 6;
  else if (stats.stdev < 3 && stats.lengths.length >= 3) score -= 8;

  if (stats.starterDiversity >= 0.8) score += 6;
  else if (stats.starterDiversity >= 0.6) score += 3;
  else if (stats.starterDiversity < 0.4 && stats.lengths.length >= 3) score -= 6;

  const words = rewrite.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words);
  const lexDiv = words.length > 0 ? (uniqueWords.size / words.length) * 100 : 50;
  if (lexDiv >= 65) score += 4;
  else if (lexDiv < 45) score -= 4;

  const formalityIssues = checkFormalityInflation(source, rewrite);
  score -= formalityIssues.length * 6;

  const tropeIssues = checkAiTropes(source, rewrite);
  score -= tropeIssues.length * 8;

  return Math.max(60, Math.min(99, Math.round(score)));
}

export function computeAiSignal(source: string, rewrite: string): number {
  const stats = computeSentenceStats(rewrite);
  const formalityCount = checkFormalityInflation(source, rewrite).length;
  const tropeCount = checkAiTropes(source, rewrite).length;

  let signal = 14;

  if (stats.lengths.length >= 3) {
    if (stats.stdev < 3) signal += 18;
    else if (stats.stdev < 4.5) signal += 8;
    else if (stats.stdev >= 8) signal -= 4;
  }

  if (stats.starterDiversity < 0.5 && stats.lengths.length >= 3) signal += 10;
  signal += formalityCount * 8;
  signal += tropeCount * 12;

  const words = rewrite.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words);
  const lexDiv = words.length > 0 ? (uniqueWords.size / words.length) * 100 : 50;
  if (lexDiv < 45) signal += 8;
  else if (lexDiv > 65) signal -= 3;

  return Math.max(5, Math.min(75, Math.round(signal)));
}

export function generateLinguisticScores(source: string, rewrite: string, altType?: string): LinguisticScores {
  const meaning = computeMeaningPreservation(source, rewrite);
  let naturalness = computeNaturalness(source, rewrite);
  let aiSignal = computeAiSignal(source, rewrite);
  const stats = computeSentenceStats(rewrite);

  const words = rewrite.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words);
  const vocabularyDiversity = words.length > 0 ? Math.round((uniqueWords.size / words.length) * 100) : 50;

  if (altType === "Most Faithful" || altType === "faithful") {
    aiSignal = Math.max(20, Math.min(42, aiSignal + 10));
    naturalness = Math.max(76, Math.min(90, naturalness - 4));
  } else if (altType === "Most Natural" || altType === "natural") {
    aiSignal = Math.max(6, Math.min(22, aiSignal - 4));
    naturalness = Math.max(88, Math.min(98, naturalness + 4));
  } else if (altType === "Most Concise" || altType === "concise") {
    aiSignal = Math.max(8, Math.min(26, aiSignal - 2));
    naturalness = Math.max(84, Math.min(94, naturalness));
  }

  const readability = Math.round(75 + Math.min(20, stats.stdev * 1.5));
  const grammar = 98;
  const sentenceVariety = Math.round(Math.min(100, Math.max(50, stats.stdev * 7 + stats.starterDiversity * 30)));

  const humanizationScore = Math.max(60, Math.min(99, Math.round(
    naturalness * 0.40 +
    meaning * 0.35 +
    (100 - aiSignal) * 0.15 +
    readability * 0.10
  )));

  return {
    humanization_score: humanizationScore,
    meaning_preservation_score: meaning,
    naturalness_score: naturalness,
    readability_score: readability,
    grammar_score: grammar,
    sentence_variety_score: sentenceVariety,
    vocabulary_diversity_score: vocabularyDiversity,
    ai_signal_after: aiSignal,
    sentence_length_stdev: Math.round(stats.stdev * 10) / 10,
    sentence_length_mean: Math.round(stats.mean * 10) / 10,
    starter_diversity: Math.round(stats.starterDiversity * 100) / 100
  };
}
