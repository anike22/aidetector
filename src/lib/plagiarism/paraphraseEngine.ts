/**
 * Deep Paraphrase Detection Engine
 *
 * Detects synonym substitution, active/passive voice transformation,
 * sentence restructuring, and clause reordering.
 */

// Common synonym mapping pairs for heuristic detection
const SYNONYM_PAIRS: Array<[string, string]> = [
  ['utilize', 'use'], ['demonstrate', 'show'], ['significant', 'important'],
  ['fundamental', 'essential'], ['alter', 'change'], ['commence', 'begin'],
  ['conclude', 'finish'], ['investigate', 'examine'], ['obtain', 'acquire'],
  ['illustrate', 'depict'], ['enhance', 'improve'], ['determine', 'establish'],
  ['comprehend', 'understand'], ['construct', 'build'], ['evaluate', 'assess'],
  ['indicate', 'suggest'], ['transform', 'convert'], ['decrease', 'reduce'],
  ['increase', 'expand'], ['facilitate', 'enable'],
];

export interface ParaphraseAnalysis {
  isParaphrase: boolean;
  confidence: number; // 60-90%
  transformations: string[];
  calibratedVerdict: string;
}

export function analyzeParaphraseShift(
  submittedSentence: string,
  sourceSentence: string
): ParaphraseAnalysis {
  const subTokens = submittedSentence.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
  const srcTokens = sourceSentence.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);

  if (subTokens.length < 5 || srcTokens.length < 5) {
    return {
      isParaphrase: false,
      confidence: 0,
      transformations: [],
      calibratedVerdict: 'Insufficient text length for paraphrase determination.',
    };
  }

  const transformations: string[] = [];
  let synonymHits = 0;

  // 1. Detect synonym swaps
  for (const [w1, w2] of SYNONYM_PAIRS) {
    if ((subTokens.includes(w1) && srcTokens.includes(w2)) ||
        (subTokens.includes(w2) && srcTokens.includes(w1))) {
      synonymHits++;
      transformations.push(`Synonym substitution: "${w1}" ↔ "${w2}"`);
    }
  }

  // 2. Active vs Passive voice heuristic
  const subPassive = /\b(was|were|is|are|been|being)\s+\w+ed\b/i.test(submittedSentence);
  const srcPassive = /\b(was|were|is|are|been|being)\s+\w+ed\b/i.test(sourceSentence);
  if (subPassive !== srcPassive) {
    transformations.push('Active / passive voice structural transformation');
  }

  // 3. Clause reordering heuristic (check conjunctions like 'although', 'because', 'while', 'whereas')
  const clauses = ['although', 'because', 'while', 'whereas', 'since', 'however'];
  const subHasClause = clauses.some((c) => submittedSentence.toLowerCase().startsWith(c));
  const srcHasClause = clauses.some((c) => sourceSentence.toLowerCase().includes(c));
  if (subHasClause && srcHasClause) {
    transformations.push('Clause reordering / dependent clause repositioning');
  }

  // Token intersection (Jaccard similarity)
  const setA = new Set(subTokens);
  const setB = new Set(srcTokens);
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  const union = new Set([...subTokens, ...srcTokens]).size;
  const jaccard = union > 0 ? intersection / union : 0;

  // If there are shared words + detected structural changes or synonym substitutions
  if (jaccard >= 0.25 || synonymHits >= 1 || transformations.length >= 2) {
    const baseConf = 60 + Math.min(25, Math.round(jaccard * 30 + synonymHits * 8 + transformations.length * 5));
    const confidence = Math.min(90, Math.max(60, baseConf));

    let calibratedVerdict = 'Similar meaning and structural alignment detected';
    if (confidence >= 80) calibratedVerdict = 'Likely paraphrased with synonym substitution and restructuring';
    else if (confidence >= 70) calibratedVerdict = 'Possibly paraphrased source material with modified phrasing';

    return {
      isParaphrase: true,
      confidence,
      transformations,
      calibratedVerdict,
    };
  }

  return {
    isParaphrase: false,
    confidence: Math.round(jaccard * 40),
    transformations,
    calibratedVerdict: 'No conclusive paraphrase pattern identified.',
  };
}
