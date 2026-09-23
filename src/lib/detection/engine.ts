import type {
  AdvancedTextAnalysisResult,
  AnalysisOptions,
  AnalysisMetadata,
  ContentType,
  DetectedLanguage,
  DevDiagnostics,
  Explanation,
  LanguageSegment,
  ParagraphVerdict,
  PassageHighlight,
  SentenceVerdict,
  Verdict,
  DetectionWarning,
} from './types';
import { analyzeLanguage, getLanguageName, isLanguageSupported } from './languageLayer';
import { analyzeLinguistic, splitSentences, splitParagraphs, tokenizeWords } from './linguisticLayer';
import { analyzeStatistical } from './statisticalLayer';
import { runEnsemble } from './ensemble';
import { getLanguageCalibration, languageReliabilityFactor } from './calibration';
import { classifyWithClassifier, CLASSIFIER_VERSION } from './classifier';
import { preprocessDocument } from './layers/documentPreprocessing';
import { segmentPassages, type Passage } from './layers/passageSegmentation';
import { analyzeSemanticConsistency } from './layers/semanticConsistency';
import { detectHumanEdits, type PassageScore } from './layers/humanEditDetection';
import { analyzeDocumentConsistency } from './layers/documentConsistency';

export const DETECTOR_VERSION = '2.5.1';
export const MODEL_VERSION = 'ensemble-v4-classifier-v2';
export const LANGUAGE_PIPELINE_VERSION = 'lang-v3';
export const CALIBRATION_VERSION = 'cal-v3-five-class';

function generateRequestId(): string {
  return `det-${Date.now()}-${Math.floor(Math.random() * 1_000_000).toString(36).padStart(4, '0')}`;
}

const MIN_RECOMMENDED_WORDS = 80;

export function verdictLabel(verdict: Verdict): string {
  switch (verdict) {
    case 'likely-human':
      return 'Likely Human';
    case 'mostly-human-ai-assisted':
      return 'Mostly Human with AI Assistance';
    case 'mixed':
      return 'Mixed Human & AI';
    case 'mostly-ai-human-edited':
      return 'Mostly AI Generated';
    case 'likely-ai':
      return 'Likely AI Generated';
    case 'inconclusive':
      return 'Inconclusive';
    case 'insufficient-text':
      return 'Insufficient Text';
    default:
      return verdict;
  }
}

// ---------------------------------------------------------------------------
// computeAdjustedAiRisk
//
// Computes a single "adjusted AI risk" score that is used ONLY for verdict
// classification. It is never returned as a replacement for the displayed
// aiProbability / humanProbability / mixedProbability — those raw calibrated
// scores remain unchanged.
//
// Rationale: Mixed is not a neutral bucket. Research-grade mixed content
// (AI paragraphs + human paragraphs) still carries substantial AI risk.
// A document with AI=45, Mixed=35, Human=20 has an adjusted AI risk of ~66
// (with mixedAiContribution=0.6) and must NOT be labelled Human.
//
// mixedAiContribution is calibrated at 0.6 — validated against samples where:
//   AI-generated text lightly edited  → Mixed 30-50%, AI 40-55%  → adjusted ≥65% → correctly AI
//   True mixed (half/half paragraphs) → Mixed 30-45%, AI 25-40%  → adjusted 40-65% → correctly Mixed
//   Human text polished by AI         → Mixed 20-35%, AI 15-30%  → adjusted 25-50% → correctly Human/Mixed
// ---------------------------------------------------------------------------
const MIXED_AI_CONTRIBUTION = 0.6;

function computeAdjustedAiRisk(
  ai: number,
  mixed: number,
  sentenceAiCount: number,
  totalSentences: number,
  documentConsistencyScore: number,
): number {
  // Mixed contribution to AI risk is discounted when the document is consistent
  // (high consistencyScore means the document reads as a single-author work).
  // A consistent document with high mixed% is low-confidence, not mixed-authored:
  //   consistencyScore=0.8 → mixedContrib = 0.6 * (1 - 0.8*0.5) = 0.6 * 0.6 = 0.36
  //   consistencyScore=0.3 → mixedContrib = 0.6 * (1 - 0.3*0.5) = 0.6 * 0.85 = 0.51
  // Balanced-mode false-positive guard: Mixed is uncertainty unless the
  // document-consistency layer independently corroborates section-level shifts.
  // Consistent single-author documents must not have ambiguous Mixed mass
  // converted into strong AI evidence.
  const hasStructuralMixedEvidence = documentConsistencyScore < 0.55;
  const mixedContrib = hasStructuralMixedEvidence
    ? MIXED_AI_CONTRIBUTION * (1 - documentConsistencyScore * 0.5)
    : 0.10;
  let risk = ai + mixed * mixedContrib;

  // Sentence-level corroboration: if the majority of sentences are AI-like,
  // boost by up to 8 points.
  if (totalSentences > 0) {
    const sentenceAiRatio = sentenceAiCount / totalSentences;
    risk += sentenceAiRatio * 8;
  }

  // Document consistency penalty: genuinely inconsistent docs (low score)
  // reduce risk slightly to avoid over-calling AI on mixed-authored text.
  risk -= (1 - documentConsistencyScore) * 4;

  return Math.min(100, Math.max(0, risk));
}

// ---------------------------------------------------------------------------
// aggregateSentenceSignals
//
// Counts how many sentences in the verdict list are AI-like vs human-like
// and returns a continuity score (fraction of consecutive AI-like runs of
// length ≥ 2, weighted by run length). This is the primary sentence-level
// signal fed into classifyVerdict.
// ---------------------------------------------------------------------------
function aggregateSentenceSignals(sentenceVerdicts: SentenceVerdict[]): {
  aiSentenceCount: number;
  humanSentenceCount: number;
  mixedSentenceCount: number;
  totalSentences: number;
  aiContinuityScore: number; // 0-100: how many AI sentences appear in consecutive runs
  dominantSentenceLabel: 'ai' | 'human' | 'mixed' | 'uncertain';
} {
  const total = sentenceVerdicts.length;
  if (total === 0) {
    return { aiSentenceCount: 0, humanSentenceCount: 0, mixedSentenceCount: 0, totalSentences: 0, aiContinuityScore: 0, dominantSentenceLabel: 'uncertain' };
  }

  let aiCount = 0;
  let humanCount = 0;
  let mixedCount = 0;
  let runLength = 0;
  let runScore = 0;

  for (const sv of sentenceVerdicts) {
    if (sv.verdict === 'likely-ai' || sv.verdict === 'mostly-ai-human-edited') {
      aiCount++;
      runLength++;
      // Consecutive AI runs contribute more: run of 3 = 3*1.2, run of 5 = 5*1.5
      if (runLength >= 2) runScore += runLength * 0.2;
    } else {
      if (sv.verdict === 'likely-human' || sv.verdict === 'mostly-human-ai-assisted') humanCount++;
      else mixedCount++;
      runLength = 0;
    }
  }

  const aiContinuityScore = Math.min(100, Math.round((aiCount / total) * 60 + (runScore / total) * 40));

  const dominantSentenceLabel: 'ai' | 'human' | 'mixed' | 'uncertain' =
    aiCount > total * 0.55 ? 'ai'
    : humanCount > total * 0.55 ? 'human'
    : mixedCount + aiCount > total * 0.55 ? 'mixed'
    : 'uncertain';

  return {
    aiSentenceCount: aiCount,
    humanSentenceCount: humanCount,
    mixedSentenceCount: mixedCount,
    totalSentences: total,
    aiContinuityScore,
    dominantSentenceLabel,
  };
}

// ---------------------------------------------------------------------------
// classifyVerdict
//
// Revised verdict logic that operates on the ADJUSTED AI RISK score rather
// than the raw renormalized probability. This decouples the display scores
// (AI%, Human%, Mixed%) from the classification decision.
//
// Key principles:
//  1. adjustedAiRisk is the primary signal — it already accounts for mixed
//     AI contribution so a high Mixed score cannot hide strong AI evidence.
//  2. Sentence-level continuity is a tie-breaker: consistent AI sentences
//     confirm AI verdict even when raw probabilities are ambiguous.
//  3. Mixed is returned only when there is real section-level evidence:
//     genuine inconsistency + moderate AI risk + notable human probability.
//  4. Inconclusive is returned when evidence is genuinely insufficient or
//     contradictory — not as a fallthrough.
// ---------------------------------------------------------------------------
function classifyVerdict(
  ai: number,
  human: number,
  mixed: number,
  sufficient: boolean,
  languageCode: string,
  confidenceScore: number,
  adjustedAiRisk: number,
  sentenceSignals: ReturnType<typeof aggregateSentenceSignals>,
  documentConsistencyScore: number,
  humanization: { detected: boolean; confidence: number },
  classifierAiProbability?: number,
): Verdict {
  // Evidence required before claiming a text has been human-edited or is a mix
  // of human and AI authorship. Small mixed probability (likely noise) or
  // non-zero human probability alone does not justify an edited/mixed label.
  const hasHumanEditingEvidence =
    humanization.detected && humanization.confidence >= 0.35;

  if (!sufficient) return 'insufficient-text';

  // Absolute minimum evidence threshold.
  const maxRaw = Math.max(ai, human, mixed);
  if (maxRaw < 30 && adjustedAiRisk < 35) return 'inconclusive';

  const thresholds = getLanguageCalibration(languageCode).thresholds;

  function editingVerdict(): Verdict {
    if (hasHumanEditingEvidence) return 'mostly-ai-human-edited';
    if (adjustedAiRisk >= thresholds.mostlyAi) return 'likely-ai';
    if (human >= thresholds.mostlyHuman) return 'mostly-human-ai-assisted';
    return 'mixed';
  }

  // Inconclusive guard: fire only when evidence is genuinely insufficient.
  // Skip when human leads the raw three-way distribution — a human-dominant
  // document with near-equal adjustedAiRisk is low-certainty human, not
  // inconclusive. Also skip when genuine mixed evidence exists (low consistency
  // + notable mixed mass): that is ambiguous authorship, not absence of signal.
  const sorted = [adjustedAiRisk, human].sort((a, b) => b - a);
  const riskMargin = sorted[0] - sorted[1];
  const humanLeadsRaw = human >= ai - 3 && human > mixed;
  const genuineAmbiguity = documentConsistencyScore < 0.45 && mixed >= thresholds.mixed;
  const classifierCorroboratesAi =
    (classifierAiProbability ?? 0) >= 80 &&
    ai >= human + 8 &&
    adjustedAiRisk >= 45;
  if (riskMargin < thresholds.margin && confidenceScore < 50 && !humanLeadsRaw && !genuineAmbiguity) {
    // Preserve a meaningful AI lead even when adjusted risk and Human are close.
    // The ensemble has already applied classifier reliability / corroborated-human
    // safeguards, so this guard should only collapse truly weak evidence.
    if (classifierCorroboratesAi || (ai >= human + thresholds.margin && adjustedAiRisk >= 45)) {
      return editingVerdict();
    }
    return 'inconclusive';
  }

  // Balanced-mode evidence floor: low-confidence results may not be promoted
  // to an AI-side verdict solely because Mixed mass or sentence aggregation
  // lifted adjustedAiRisk. Strong raw AI probability still passes through.
  if (
    confidenceScore < 50 &&
    ai < thresholds.mostlyAi &&
    adjustedAiRisk < thresholds.likelyAi &&
    !genuineAmbiguity
  ) {
    // Low confidence alone must not erase a meaningful AI lead. After the
    // ensemble's corroborated-human guard has already reduced known false
    // positives, an AI-leading distribution with moderate adjusted risk is
    // evidence-bearing rather than purely inconclusive.
    if (classifierCorroboratesAi || (ai >= human + thresholds.margin && adjustedAiRisk >= 45)) {
      return editingVerdict();
    }
    return humanLeadsRaw ? 'mostly-human-ai-assisted' : 'inconclusive';
  }

  // --- AI verdicts (driven by adjustedAiRisk) ---

  // Strong AI: adjusted risk above likelyAi threshold.
  if (adjustedAiRisk >= thresholds.likelyAi) {
    // Very low document consistency + substantial human = genuinely mixed, not pure AI.
    if (documentConsistencyScore < 0.35 && human >= 25 && mixed >= 25) {
      return 'mostly-ai-human-edited';
    }
    return 'likely-ai';
  }

  // Mostly AI: moderate adjusted risk confirmed by sentence continuity.
  if (adjustedAiRisk >= thresholds.mostlyAi) {
    if (sentenceSignals.dominantSentenceLabel === 'ai' || sentenceSignals.aiContinuityScore >= 50) {
      if (documentConsistencyScore < 0.3 && human >= 20) return 'mixed';
      return editingVerdict();
    }
    // Genuine structural boundary (low consistency + real mixed mass) overrides AI verdict.
    if (documentConsistencyScore < 0.40 && mixed >= 18 && human >= 20) return 'mixed';
    if (mixed >= thresholds.mixed && human >= 20 && documentConsistencyScore < 0.45) return 'mixed';
    return editingVerdict();
  }

  // --- Mixed verdict: requires REAL section-level evidence ---
  // Primary condition: genuine document inconsistency detected by the consistency
  // layer (paragraph AI-probability deltas > 40 were observed) OR sentence-dominant
  // mixed signal, combined with moderate adjusted AI risk and human presence.
  // The mixed threshold is lowered from thresholds.mixed to 18 when docConsistency
  // is very low (< 0.40), because the consistency layer has already confirmed
  // structural boundaries — the ensemble mixed mass just needs to be non-trivial.
  const mixedMassRequired = documentConsistencyScore < 0.40 ? 18 : thresholds.mixed;
  const genuineMixedEvidence =
    (documentConsistencyScore < 0.45 && mixed >= mixedMassRequired) ||
    (sentenceSignals.dominantSentenceLabel === 'mixed' && mixed >= mixedMassRequired);

  if (genuineMixedEvidence && adjustedAiRisk >= 30 && adjustedAiRisk < thresholds.mostlyAi && human >= 20) {
    return 'mixed';
  }

  // --- Human verdicts ---

  if (human >= thresholds.mostlyHuman) {
    // Sentence signals are AI-heavy: override toward AI-assisted.
    if (sentenceSignals.dominantSentenceLabel === 'ai' && adjustedAiRisk >= 40) {
      return editingVerdict();
    }
    // Promote to likely-human when mixed mass is negligible and adjusted risk is low.
    // Threshold: mixed < 10 AND adjustedAiRisk < 38 (slightly relaxed from 30 to
    // handle the case where a near-zero mixed ensemble still produces adjRisk~33).
    if (mixed < 10 && adjustedAiRisk < 38) return 'likely-human';
    return 'mostly-human-ai-assisted';
  }

  if (human >= thresholds.likelyHuman && adjustedAiRisk < 30) {
    return 'likely-human';
  }

  // --- Final fallthrough ---
  if (adjustedAiRisk >= thresholds.mostlyAi) return editingVerdict();
  // Human leads raw distribution (human ≈ ai after semantic boost) with no strong
  // AI signal: classify as human-assisted rather than AI. This prevents the
  // fallthrough from returning AI-side verdicts on genuinely human-dominant text
  // that simply has moderate uncertainty.
  if (humanLeadsRaw && adjustedAiRisk < thresholds.mostlyAi) return 'mostly-human-ai-assisted';
  if (human > adjustedAiRisk + 5) return 'likely-human';
  if (adjustedAiRisk >= 40) return editingVerdict();
  return 'inconclusive';
}

function confidenceLevel(score: number): 'Low' | 'Medium' | 'High' | 'Very High' {
  if (score >= 85) return 'Very High';
  if (score >= 65) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

function riskLevel(verdict: Verdict, aiProbability: number): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (verdict === 'likely-ai') return aiProbability >= 85 ? 'Critical' : 'High';
  if (verdict === 'mostly-ai-human-edited') return 'High';
  if (verdict === 'mixed' || verdict === 'mostly-human-ai-assisted') return 'Medium';
  if (verdict === 'insufficient-text' || verdict === 'inconclusive') return 'Low';
  return 'Low';
}

function inferContentType(text: string, manual: ContentType): ContentType {
  if (manual !== 'auto') return manual;
  const lower = text.toLowerCase();
  if (lower.includes('@') && lower.includes('dear') || lower.includes('sincerely') || lower.includes('regards')) return 'email';
  if (lower.includes('abstract') || lower.includes('methodology') || lower.includes('references')) return 'research';
  if (lower.includes('introduction') && lower.includes('conclusion') && text.length > 400) return 'academic';
  if (lower.includes('job description') || lower.includes('cover letter')) return 'job';
  if (lower.includes('product') && lower.includes('buy')) return 'product';
  if (text.length < 150) return 'social';
  if (lower.includes('#') || lower.includes('follow')) return 'social';
  // Unknown long-form prose is not automatically a blog. Treating every
  // unmatched document as blog injected a positive AI prior before evidence.
  return 'auto';
}

function classifyLocalVerdict(
  ai: number,
  human: number,
  mixed: number,
  thresholds: ReturnType<typeof getLanguageCalibration>['thresholds'],
): Verdict {
  // Note: Mixed at sentence/paragraph level should be rare. It must NOT be
  // used as an uncertainty fallback. A sentence where AI=40, Human=38, Mixed=22
  // is a low-confidence AI sentence — not a mixed sentence.
  // Mixed requires: mixed is genuinely the dominant signal (> 45) AND the
  // margin between AI and Human is very tight (< 10 points).
  const max = Math.max(ai, human, mixed);
  if (ai >= thresholds.likelyAi && mixed < 25) return 'likely-ai';
  if (human >= thresholds.likelyHuman && ai < 25) return 'likely-human';
  if (ai >= thresholds.mostlyAi && human >= 15) return 'mostly-ai-human-edited';
  if (human >= thresholds.mostlyHuman && ai >= 15) return 'mostly-human-ai-assisted';
  // Mixed threshold raised to 45 (from 30–35) and margin tightened to 10.
  // This prevents uncertainty from being classified as mixed authorship.
  if (mixed >= 45 && Math.abs(ai - human) < 10) return 'mixed';

  // Do not manufacture certainty from a plurality. When neither AI nor Human
  // reaches a calibrated threshold, a narrow lead is uncertainty, not evidence.
  const sorted = [ai, human, mixed].sort((a, b) => b - a);
  const margin = sorted[0] - sorted[1];
  if (margin < thresholds.margin) return 'inconclusive';
  if (max === ai && ai >= thresholds.mixed) return 'likely-ai';
  if (max === human && human >= thresholds.mixed) return 'likely-human';
  return 'inconclusive';
}

function buildSentenceVerdicts(
  text: string,
  segments: LanguageSegment[],
  sentenceAiSignals: number[],
  sentenceHumanSignals: number[],
  sentenceMixedSignals: number[],
  overallAi: number,
  overallHuman: number,
  overallMixed: number,
  languageCode: string,
): SentenceVerdict[] {
  const sentences = splitSentences(text);
  const offsetMap: { start: number; text: string }[] = [];
  let cursor = 0;
  for (const s of sentences) {
    const idx = text.indexOf(s, cursor);
    const start = idx >= 0 ? idx : cursor;
    offsetMap.push({ start, text: s });
    cursor = start + s.length;
  }

  const thresholds = getLanguageCalibration(languageCode).thresholds;

  return sentences.map((s, i) => {
    const aiSig = sentenceAiSignals[i] ?? 0;
    const humanSig = sentenceHumanSignals[i] ?? 0;
    const mixedSig = sentenceMixedSignals[i] ?? 0;

    // Combine local signals with a prior from the document to stabilize short sentences.
    const aiLocal = Math.round((aiSig * 0.65 + overallAi / 100 * 0.35) * 100);
    const humanLocal = Math.round((humanSig * 0.65 + overallHuman / 100 * 0.35) * 100);
    const mixedLocal = Math.round(Math.min(100, mixedSig * 100 * 0.65 + overallMixed * 0.35 + Math.abs(aiLocal - humanLocal) / 3));

    const verdict = classifyLocalVerdict(aiLocal, humanLocal, mixedLocal, thresholds);
    const max = Math.max(aiLocal, humanLocal, mixedLocal);
    const sorted = [aiLocal, humanLocal, mixedLocal].sort((a, b) => b - a);
    const margin = sorted[0] - sorted[1];
    const baseConfidence = max * (0.5 + 0.5 * Math.min(1, margin / 30));
    // Reduce confidence for very short sentences and mixed signals.
    const shortPenalty = s.split(/\s+/).length < 6 ? 0.85 : 1;
    const confidence = Math.round(Math.min(100, baseConfidence * shortPenalty));

    const segment = segments.find((seg) => {
      const pos = offsetMap[i].start;
      return pos >= seg.start && pos < seg.end;
    });

    let explanation = '';
    if (verdict === 'likely-ai') explanation = 'Sentence structure, transitions, or vocabulary show strong AI-like patterns.';
    else if (verdict === 'likely-human') explanation = 'Personal markers, variation, or unique phrasing are consistent with human writing.';
    else if (verdict === 'mixed') explanation = 'Mixed signals: some AI-like patterns are present alongside human-like variation.';
    else if (verdict === 'mostly-ai-human-edited') explanation = 'Underlying patterns resemble AI output, but editing has introduced variation.';
    else if (verdict === 'mostly-human-ai-assisted') explanation = 'Mostly human writing with possible AI-assisted polish.';
    else explanation = 'Insufficient or conflicting evidence for this sentence.';

    return {
      text: s,
      start: offsetMap[i].start,
      end: offsetMap[i].start + s.length,
      aiProbability: aiLocal,
      humanProbability: humanLocal,
      mixedProbability: mixedLocal,
      verdict,
      confidence,
      explanation,
      languageCode: segment?.languageCode || 'unknown',
    };
  });
}

function buildParagraphVerdicts(
  text: string,
  sentenceVerdicts: SentenceVerdict[],
  paragraphAiSignals: number[],
  paragraphHumanSignals: number[],
  paragraphMixedSignals: number[],
  languageCode: string,
): ParagraphVerdict[] {
  const paragraphs = splitParagraphs(text);
  const offsets: { start: number; end: number }[] = [];
  let cursor = 0;
  for (const p of paragraphs) {
    const idx = text.indexOf(p, cursor);
    const start = idx >= 0 ? idx : cursor;
    const end = start + p.length;
    offsets.push({ start, end });
    cursor = end;
  }

  const thresholds = getLanguageCalibration(languageCode).thresholds;

  return paragraphs.map((_, i) => {
    const range = offsets[i];
    const sents = sentenceVerdicts.filter((s) => s.start >= range.start && s.end <= range.end);
    const ai = paragraphAiSignals[i] ?? 0;
    const human = paragraphHumanSignals[i] ?? 0;
    const mixed = paragraphMixedSignals[i] ?? 0;

    const sentStart = sents.length ? sentenceVerdicts.indexOf(sents[0]) : 0;
    const sentEnd = sents.length ? sentStart + sents.length - 1 : sentStart;

    const aiP = Math.round((ai * 0.6 + (sents.length ? sents.reduce((sum, s) => sum + s.aiProbability, 0) / sents.length : 0) * 0.4));
    const humanP = Math.round((human * 0.6 + (sents.length ? sents.reduce((sum, s) => sum + s.humanProbability, 0) / sents.length : 0) * 0.4));
    const mixedP = Math.round(Math.min(100, mixed * 100 + (sents.length ? sents.reduce((sum, s) => sum + s.mixedProbability, 0) / sents.length : 0) * 0.4));

    const verdict = classifyLocalVerdict(aiP, humanP, mixedP, thresholds);
    const max = Math.max(aiP, humanP, mixedP);
    const sorted = [aiP, humanP, mixedP].sort((a, b) => b - a);
    const margin = sorted[0] - sorted[1];
    const confidence = Math.round(Math.min(100, max * (0.55 + 0.45 * Math.min(1, margin / 30))));

    return {
      index: i,
      aiProbability: aiP,
      humanProbability: humanP,
      mixedProbability: mixedP,
      verdict,
      confidence,
      sentenceRange: [sentStart, sentEnd],
    };
  });
}

function buildHighlights(sentenceVerdicts: SentenceVerdict[], paragraphs: ParagraphVerdict[], minRun = 2): PassageHighlight[] {
  const highlights: PassageHighlight[] = [];
  let run: SentenceVerdict[] = [];

  const pushRun = () => {
    if (run.length >= minRun) {
      const start = run[0].start;
      const end = run[run.length - 1].end;
      const text = run.map((s) => s.text).join(' ');
      const avgAi = run.reduce((sum, s) => sum + s.aiProbability, 0) / run.length;
      const verdict = avgAi >= 70 ? 'likely-ai' : avgAi >= 40 ? 'mixed' : 'likely-human';
      highlights.push({
        start,
        end,
        text,
        verdict,
        confidence: Math.round(run.reduce((sum, s) => sum + s.confidence, 0) / run.length),
        reason: `${run.length} consecutive ${verdict.replace(/-/g, ' ')} sentences.`,
      });
    }
    run = [];
  };

  for (const s of sentenceVerdicts) {
    if (s.verdict === 'likely-ai' || s.verdict === 'mostly-ai-human-edited') {
      run.push(s);
    } else {
      pushRun();
    }
  }
  pushRun();

  // Add paragraph-level highlights where the whole paragraph strongly matches one verdict.
  for (const p of paragraphs) {
    if (p.confidence >= 80 && (p.verdict === 'likely-ai' || p.verdict === 'likely-human')) {
      const sents = sentenceVerdicts.slice(p.sentenceRange[0], p.sentenceRange[1] + 1);
      if (sents.length > 0) {
        highlights.push({
          start: sents[0].start,
          end: sents[sents.length - 1].end,
          text: sents.map((s) => s.text).join(' '),
          verdict: p.verdict,
          confidence: p.confidence,
          reason: `Paragraph ${p.index + 1} shows consistent ${p.verdict.replace(/-/g, ' ')} patterns.`,
        });
      }
    }
  }

  return highlights.sort((a, b) => a.start - b.start);
}

function buildPassageScores(
  passages: Passage[],
  classifierResult: Awaited<ReturnType<typeof classifyWithClassifier>>,
): PassageScore[] {
  if (!classifierResult.available || classifierResult.chunkScores.length === 0) {
    return passages.map((p) => ({
      text: p.text,
      start: p.start,
      end: p.end,
      aiProbability: 50,
      humanProbability: 50,
      mixedProbability: 0,
    }));
  }
  const chunks = classifierResult.chunkScores;
  return passages.map((p) => {
    // Find classifier chunks that overlap this passage and average them.
    const overlapping = chunks.filter((c) => c.end > p.start && c.start < p.end);
    let ai = 50;
    let human = 50;
    let mixed = 0;
    if (overlapping.length) {
      const avgAi = overlapping.reduce((sum, c) => sum + c.aiProbability, 0) / overlapping.length;
      ai = avgAi;
      human = 100 - avgAi;
    }
    return {
      text: p.text,
      start: p.start,
      end: p.end,
      aiProbability: ai,
      humanProbability: human,
      mixedProbability: mixed,
    };
  });
}

function applyLayerAdjustments(
  ai: number,
  human: number,
  mixed: number,
  semantic: ReturnType<typeof analyzeSemanticConsistency>,
  humanEdit: ReturnType<typeof detectHumanEdits>,
  documentConsistency: ReturnType<typeof analyzeDocumentConsistency>,
): { ai: number; human: number; mixed: number; uncertainty: number } {
  // -----------------------------------------------------------------------
  // Mixed vs Uncertainty separation.
  //
  // Previous logic added mixedAuthorshipProbability * 25 + humanEditProbability * 20
  // as raw points directly to the Mixed display value.  This caused Mixed to
  // inflate by 20–45 points regardless of whether sections were structurally
  // distinct — treating low confidence as mixed authorship evidence.
  //
  // New logic:
  //   - Mixed display value is only boosted when there is hard structural
  //     evidence: documentConsistency.inconsistencyLocations.length > 0
  //     (paragraph-level AI probability delta > 40 was actually detected).
  //   - The boost is small (max ~8 points) and requires that the base mixed
  //     value already has some signal (> 5).
  //   - uncertainty is computed separately and used only by the confidence
  //     calibration and DevDiagnostics — it does NOT appear in Mixed%.
  // -----------------------------------------------------------------------

  // Uncertainty: captures epistemic model doubt, short text, and boundary
  // signals that indicate low confidence rather than genuine mixed authorship.
  const uncertainty = Math.min(100, Math.round(
    documentConsistency.mixedAuthorshipProbability * 40 +
    humanEdit.humanEditProbability * 25 +
    semantic.topicDrift * 15,
  ));

  // Mixed boost: only when inconsistency locations were physically detected
  // (adjacent paragraphs with > 40-point AI probability delta).
  const hasStructuralBoundary = documentConsistency.inconsistencyLocations.length > 0;
  const mixedBoost = hasStructuralBoundary && mixed > 5
    ? Math.min(8, documentConsistency.mixedAuthorshipProbability * 8)
    : 0;

  // Semantic repetition increases AI probability slightly.
  const aiBoost = semantic.semanticRepetitionScore * 10;

  let newMixed = Math.min(100, mixed + mixedBoost);
  let newAi = Math.min(100, ai + aiBoost);
  let newHuman = human;

  const total = newAi + newHuman + newMixed;
  if (total > 100) {
    const scale = 100 / total;
    newAi *= scale;
    newHuman *= scale;
    newMixed *= scale;
  }
  return {
    ai: Math.round(newAi),
    human: Math.round(newHuman),
    mixed: Math.round(newMixed),
    uncertainty,
  };
}

function estimateAuthorshipClasses(
  ai: number,
  human: number,
  mixed: number,
  humanEditProbability: number,
  mixedAuthorshipProbability: number,
  translationLikelihood: number,
): Record<string, number> {
  // Decompose the calibrated AI probability into pure AI, human-edited AI, and translated AI.
  const translatedFactor = 0.2 + 0.8 * translationLikelihood;
  const editFactor = 0.15 + 0.85 * humanEditProbability;
  const rawAi = Math.max(0, ai / 100);
  const translatedAi = rawAi * translatedFactor * 0.35;
  const humanEditedAi = rawAi * editFactor * 0.45;
  const pureAi = Math.max(0, rawAi - translatedAi - humanEditedAi);

  // Mixed is supported both by the explicit mixed probability and boundary evidence.
  const mixedClass = Math.max(0, (mixed / 100) * 0.7 + mixedAuthorshipProbability * 0.3);

  const classes = {
    human: Math.max(0, human / 100),
    ai: pureAi,
    'human-edited-ai': humanEditedAi,
    mixed: mixedClass,
    'translated-ai': translatedAi,
  };

  // Normalize to a probability distribution.
  const total = Object.values(classes).reduce((sum, v) => sum + v, 0);
  if (total > 0) {
    for (const key of Object.keys(classes)) {
      classes[key as keyof typeof classes] = Math.round((classes[key as keyof typeof classes] / total) * 1000) / 1000;
    }
  }
  return classes;
}

function buildLimitations(
  wordCount: number,
  confidence: number,
  translationLikelihood: number,
  language?: DetectedLanguage,
  isSupported = true
): string[] {
  const limitations: string[] = [];
  limitations.push('Results reflect linguistic and statistical patterns, not direct model access or proof of authorship.');
  if (wordCount < 80) limitations.push('Short input reduces confidence and can cause over- or under-detection.');
  if (confidence < 50) limitations.push('Confidence is low; consider a longer, representative sample.');
  if (translationLikelihood > 30) limitations.push('Translation-like phrasing can mask or distort authorship signals.');
  if (!language || language.confidence < 50) limitations.push('Language could not be confidently identified, so language-specific baselines may not apply.');
  if (!isSupported && language) {
    limitations.push(`${language.name} is not in the supported calibration set; results use conservative defaults.`);
  }
  return limitations;
}

function buildExplanation(
  verdict: Verdict,
  ai: number,
  human: number,
  mixed: number,
  linguistic: ReturnType<typeof analyzeLinguistic>['profile'],
  statistical: ReturnType<typeof analyzeStatistical>['profile'],
  language?: DetectedLanguage,
  semantic?: ReturnType<typeof analyzeSemanticConsistency>,
  humanEdit?: ReturnType<typeof detectHumanEdits>,
  documentConsistency?: ReturnType<typeof analyzeDocumentConsistency>,
): Explanation {
  const simpleParts: string[] = [];
  const technicalParts: string[] = [];
  const factors: { label: string; impact: 'strong' | 'moderate' | 'weak'; direction: 'human' | 'ai' | 'mixed' }[] = [];

  if (verdict === 'likely-human') {
    simpleParts.push('The text shows natural variation in sentence length, personal markers, and vocabulary.');
  } else if (verdict === 'likely-ai') {
    simpleParts.push('The text contains predictable transitions, consistent structure, and formulaic phrasing often seen in AI output.');
  } else if (verdict === 'mixed') {
    simpleParts.push('The text mixes human-like variation with AI-like consistency, suggesting collaboration or heavy editing.');
  } else if (verdict === 'mostly-human-ai-assisted') {
    simpleParts.push('Most of the writing looks human, but some sections show signs of AI assistance or polishing.');
  } else if (verdict === 'mostly-ai-human-edited') {
    simpleParts.push('The underlying patterns resemble AI output, but a person edited the text significantly.');
  } else {
    simpleParts.push('The available text is too short or ambiguous to reach a confident conclusion.');
  }

  if (statistical.burstiness > 0.6) {
    simpleParts.push('Sentence lengths vary a lot, which is typical of human writers.');
    technicalParts.push(`Burstiness coefficient is ${statistical.burstiness.toFixed(2)} (>0.6), indicating high sentence-length variation.`);
    factors.push({ label: 'High burstiness', impact: 'strong', direction: 'human' });
  } else if (statistical.burstiness < 0.35) {
    simpleParts.push('Sentence lengths are unusually uniform, a pattern common in AI-generated text.');
    technicalParts.push(`Burstiness coefficient is ${statistical.burstiness.toFixed(2)} (<0.35), suggesting machine-like regularity.`);
    factors.push({ label: 'Low burstiness', impact: 'strong', direction: 'ai' });
  }

  if (linguistic.lexicalDiversity > 0.55) {
    simpleParts.push('The vocabulary is diverse and avoids repetitive phrasing.');
    technicalParts.push(`Lexical diversity is ${linguistic.lexicalDiversity.toFixed(2)} (>0.55), above the typical AI baseline.`);
    factors.push({ label: 'High lexical diversity', impact: 'moderate', direction: 'human' });
  } else if (linguistic.lexicalDiversity < 0.35) {
    simpleParts.push('Word choice is more repetitive than expected for this length.');
    technicalParts.push(`Lexical diversity is ${linguistic.lexicalDiversity.toFixed(2)} (<0.35), indicating possible repetitive generation.`);
    factors.push({ label: 'Low lexical diversity', impact: 'moderate', direction: 'ai' });
  }

  if (linguistic.transitionPredictability > 0.2) {
    simpleParts.push('The text relies on common AI-style transitions.');
    technicalParts.push(`Transition predictability score is ${linguistic.transitionPredictability.toFixed(2)}, above the human baseline.`);
    factors.push({ label: 'Predictable transitions', impact: 'strong', direction: 'ai' });
  }

  if (linguistic.formulaicStartScore + linguistic.formulaicEndScore > 0.3) {
    simpleParts.push('Formulaic openings or closings were detected.');
    technicalParts.push(`Formulaic start/end scores are ${linguistic.formulaicStartScore.toFixed(2)} / ${linguistic.formulaicEndScore.toFixed(2)}.`);
    factors.push({ label: 'Formulaic structure', impact: 'moderate', direction: 'ai' });
  }

  if (language) {
    technicalParts.push(`Detected primary language: ${language.name} (${language.code}, ${language.confidence}% confidence).`);
  }

  if (linguistic.contextualCoherence > 0.55) {
    simpleParts.push('Adjacent sentences share a lot of vocabulary, suggesting strong contextual coherence.');
    technicalParts.push(`Contextual coherence is ${linguistic.contextualCoherence.toFixed(2)}.`);
    factors.push({ label: 'High contextual coherence', impact: 'moderate', direction: 'mixed' });
  }

  if (linguistic.phraseReuseScore > 0.4) {
    simpleParts.push('Repeated four-word sequences suggest formulaic generation or heavy reuse.');
    technicalParts.push(`Phrase reuse score is ${linguistic.phraseReuseScore.toFixed(2)}.`);
    factors.push({ label: 'Repeated phrases', impact: 'moderate', direction: 'ai' });
  }

  if (linguistic.humanEditingScore > 0.5) {
    simpleParts.push('Uneven style across the text may indicate human editing of an AI draft.');
    technicalParts.push(`Human-editing signal score is ${linguistic.humanEditingScore.toFixed(2)}.`);
    factors.push({ label: 'Uneven editing signals', impact: 'moderate', direction: 'mixed' });
  }

  if (linguistic.aiBoilerplateScore > 0.3) {
    simpleParts.push('Some common AI-style phrases were detected.');
    technicalParts.push(`AI boilerplate score is ${linguistic.aiBoilerplateScore.toFixed(2)}.`);
    factors.push({ label: 'AI boilerplate phrases', impact: 'moderate', direction: 'ai' });
  }

  if (semantic && semantic.semanticRepetitionScore > 0.4) {
    simpleParts.push('Several passages repeat similar vocabulary and ideas.');
    technicalParts.push(`Semantic repetition score is ${semantic.semanticRepetitionScore.toFixed(2)}.`);
    factors.push({ label: 'Semantic repetition', impact: 'moderate', direction: 'ai' });
  }

  if (humanEdit && humanEdit.humanEditProbability > 0.3) {
    simpleParts.push('Some sections show signs of human editing on top of machine-generated text.');
    technicalParts.push(`Human-edit probability is ${(humanEdit.humanEditProbability * 100).toFixed(0)}%.`);
    factors.push({ label: 'Human-editing signals', impact: 'strong', direction: 'mixed' });
  }

  if (documentConsistency && documentConsistency.mixedAuthorshipProbability > 0.3) {
    simpleParts.push('The document shifts in style and authorship signals between passages.');
    technicalParts.push(`Mixed-authorship probability is ${(documentConsistency.mixedAuthorshipProbability * 100).toFixed(0)}%.`);
    factors.push({ label: 'Mixed authorship', impact: 'strong', direction: 'mixed' });
  }

  return {
    simple: simpleParts.join(' '),
    technical: technicalParts.join(' '),
    factors,
  };
}

export async function analyzeAdvancedText(
  text: string,
  options: AnalysisOptions = {}
): Promise<AdvancedTextAnalysisResult> {
  const trimmed = text.trim();
  const contentType = inferContentType(trimmed, options.contentType || 'auto');

  const languageResult = analyzeLanguage(trimmed, options.languageHint);
  const primaryLanguage = languageResult.primary;

  // Use token-based word counts for most scripts; for CJK languages where spaces
  // are not used, fall back to character count for sufficiency checks.
  const tokenCount = tokenizeWords(trimmed).length;
  const isCjk = ['zh', 'ja', 'ko'].includes(primaryLanguage?.code || '');
  const wordCount = isCjk
    ? Math.max(tokenCount, trimmed.replace(/\s/g, '').length)
    : tokenCount;

  const linguisticResult = analyzeLinguistic(trimmed);
  const statisticalResult = analyzeStatistical(trimmed, primaryLanguage?.code || 'en');

  const languageCode = primaryLanguage?.code || 'en';
  const languageConfidence = primaryLanguage?.confidence ?? 0;
  const isSupported = isLanguageSupported(languageCode);

  const classifierResult = await classifyWithClassifier(trimmed, languageCode);

  // New modular layers (Layers 2, 3, 7, 8, 9).
  const detectedLanguage: DetectedLanguage = primaryLanguage || {
    code: 'en',
    name: 'English',
    confidence: 0,
    script: 'latin',
    isPrimary: true,
  };
  const segmented = segmentPassages(preprocessDocument(trimmed, detectedLanguage).cleanedText, detectedLanguage);
  const passageScores = buildPassageScores(segmented.passages, classifierResult);
  const semantic = analyzeSemanticConsistency(segmented.passages);
  const humanEdit = detectHumanEdits(
    segmented.passages,
    passageScores,
    linguisticResult.profile,
    statisticalResult.profile,
  );
  const documentConsistency = analyzeDocumentConsistency(
    segmented.passages,
    passageScores,
    semantic,
    humanEdit.humanEditProbability,
  );

  const ensemble = runEnsemble(
    languageCode,
    contentType,
    linguisticResult.profile,
    statisticalResult.profile,
    linguisticResult.sentenceFeatures.map((f) => f.aiSignal),
    linguisticResult.paragraphFeatures.map((f) => f.aiSignal),
    languageConfidence,
    isSupported,
    wordCount,
    classifierResult.available
      ? { aiProbability: classifierResult.aiProbability / 100, confidence: classifierResult.confidence / 100 }
      : undefined,
  );

  const adjusted = applyLayerAdjustments(
    ensemble.scores.ai,
    ensemble.scores.human,
    ensemble.scores.mixed,
    semantic,
    humanEdit,
    documentConsistency,
  );
  // uncertainty is kept separate from adjusted.mixed — it feeds confidence
  // calibration only and must never inflate the displayed Mixed probability.
  const uncertaintyScore = adjusted.uncertainty;

  const classProbabilities = classifierResult.available
    ? classifierResult.classProbabilities
    : estimateAuthorshipClasses(
        adjusted.ai,
        adjusted.human,
        adjusted.mixed,
        humanEdit.humanEditProbability,
        documentConsistency.mixedAuthorshipProbability,
        languageResult.translationLikelihood,
      );

  const sufficient = wordCount >= 20;

  // Build sentence and paragraph verdicts before classifying the document-level
  // verdict — they feed directly into the adjusted AI risk and sentence signals.
  const sentenceVerdicts = buildSentenceVerdicts(
    trimmed,
    languageResult.segments,
    linguisticResult.sentenceFeatures.map((f) => f.aiSignal),
    linguisticResult.sentenceFeatures.map((f) => f.humanSignal),
    linguisticResult.sentenceFeatures.map((f) => f.mixedSignal),
    adjusted.ai,
    adjusted.human,
    adjusted.mixed,
    languageCode,
  );

  const paragraphVerdicts = buildParagraphVerdicts(
    trimmed,
    sentenceVerdicts,
    linguisticResult.paragraphFeatures.map((f) => f.aiSignal),
    linguisticResult.paragraphFeatures.map((f) => f.humanSignal),
    linguisticResult.paragraphFeatures.map((f) => f.mixedSignal),
    languageCode,
  );

  // Sentence-level aggregation: provides continuity evidence for verdict.
  const sentenceSignals = aggregateSentenceSignals(sentenceVerdicts);

  // Adjusted AI risk: combines raw AI probability with fractional mixed contribution
  // and sentence-level corroboration. Used for verdict classification ONLY —
  // the displayed probabilities (adjusted.ai/human/mixed) remain unchanged.
  const adjustedAiRisk = computeAdjustedAiRisk(
    adjusted.ai,
    adjusted.mixed,
    sentenceSignals.aiSentenceCount,
    sentenceSignals.totalSentences,
    documentConsistency.consistencyScore,
  );

  const verdict = classifyVerdict(
    adjusted.ai,
    adjusted.human,
    adjusted.mixed,
    sufficient,
    languageCode,
    ensemble.scores.confidence,
    adjustedAiRisk,
    sentenceSignals,
    documentConsistency.consistencyScore,
    ensemble.humanization,
    classifier?.aiProbability,
  );
  const confidenceLevelVal = confidenceLevel(ensemble.scores.confidence);
  const riskLevelVal = riskLevel(verdict, adjusted.ai);

  // Apply uncertainty penalty to confidence: high epistemic uncertainty (short
  // text, feature disagreement, boundary ambiguity) reduces displayed confidence
  // without affecting Mixed probability. Max penalty is 12 points at uncertainty=100.
  const uncertaintyPenalty = Math.round(uncertaintyScore * 0.12);
  const calibratedConfidence = Math.max(0, ensemble.scores.confidence - uncertaintyPenalty);

  const highlights = buildHighlights(sentenceVerdicts, paragraphVerdicts);

  const explanation = buildExplanation(
    verdict,
    adjusted.ai,
    adjusted.human,
    adjusted.mixed,
    linguisticResult.profile,
    statisticalResult.profile,
    primaryLanguage,
    semantic,
    humanEdit,
    documentConsistency,
  );

  const limitations = buildLimitations(
    wordCount,
    ensemble.scores.confidence,
    languageResult.translationLikelihood,
    primaryLanguage,
    isSupported,
  );

  const metadata: AnalysisMetadata = {
    detectorVersion: DETECTOR_VERSION,
    modelVersion: MODEL_VERSION,
    languagePipelineVersion: LANGUAGE_PIPELINE_VERSION,
    calibrationVersion: CALIBRATION_VERSION,
    classifierVersion: classifierResult.available ? CLASSIFIER_VERSION : undefined,
    requestId: generateRequestId(),
    contentType,
    inputLength: trimmed.length,
    wordCount,
    languageCode: primaryLanguage?.code,
    analyzedAt: new Date().toISOString(),
    classProbabilities,
  };

  const warnings: DetectionWarning[] = [
    ...languageResult.warnings,
    ...statisticalResult.warnings,
  ];
  if (wordCount < 40) {
    if (!warnings.some((w) => w.type === 'short-text')) {
      warnings.push({
        type: 'short-text',
        severity: 'warning',
        message: 'Short input reduces confidence. Longer text improves detection reliability.',
      });
    }
  }
  if (languageResult.translationLikelihood > 40) {
    warnings.push({
      type: 'translation',
      severity: 'info',
      message: 'Translation-like phrasing was detected, which can alter or mask authorship signals.',
    });
  }

  let status: 'ok' | 'short' | 'very-short' | 'insufficient' = 'ok';
  if (wordCount < 20) status = 'insufficient';
  else if (wordCount < 40) status = 'very-short';
  else if (wordCount < MIN_RECOMMENDED_WORDS) status = 'short';

  // Dev-only diagnostics: included only when DETECTOR_DEV_MODE=true.
  // Never present in production responses. SEO Assistant does not use this.
  const devMode = typeof process !== 'undefined' && process.env?.VITEST === 'true';
  const devDiagnostics: DevDiagnostics | undefined = devMode ? {
    rawEnsembleScores: {
      ai: ensemble.scores.ai,
      human: ensemble.scores.human,
      mixed: ensemble.scores.mixed,
      confidence: ensemble.scores.confidence,
    },
    adjustedScores: { ai: adjusted.ai, human: adjusted.human, mixed: adjusted.mixed },
    adjustedAiRisk,
    mixedAiContribution: MIXED_AI_CONTRIBUTION,
    uncertainty: uncertaintyScore,
    sentenceSignals: {
      aiSentenceCount: sentenceSignals.aiSentenceCount,
      humanSentenceCount: sentenceSignals.humanSentenceCount,
      mixedSentenceCount: sentenceSignals.mixedSentenceCount,
      totalSentences: sentenceSignals.totalSentences,
      aiContinuityScore: sentenceSignals.aiContinuityScore,
      dominantSentenceLabel: sentenceSignals.dominantSentenceLabel,
    },
    documentConsistencyScore: documentConsistency.consistencyScore,
    structuralBoundariesDetected: documentConsistency.inconsistencyLocations.length,
    mixedAuthorshipProbability: documentConsistency.mixedAuthorshipProbability,
    humanEditProbability: humanEdit.humanEditProbability,
    verdictReason: buildVerdictReason(verdict, adjustedAiRisk, adjusted.ai, adjusted.mixed, sentenceSignals, documentConsistency.consistencyScore),
    calibrationVersion: CALIBRATION_VERSION,
    engineVersion: DETECTOR_VERSION,
  } : undefined;

  return {
    overall: {
      aiProbability: adjusted.ai,
      humanProbability: adjusted.human,
      mixedProbability: adjusted.mixed,
      verdict,
      verdictLabel: verdictLabel(verdict),
      confidence: calibratedConfidence,
      confidenceLevel: confidenceLevelVal,
      riskLevel: riskLevelVal,
      adjustedAiRisk: Math.round(adjustedAiRisk),
    },
    language: {
      primary: primaryLanguage,
      secondary: languageResult.secondary,
      segments: languageResult.segments,
      regionalVariant: languageResult.regionalVariant,
      codeSwitched: languageResult.codeSwitched,
      translationLikelihood: languageResult.translationLikelihood,
    },
    contentType,
    textSufficiency: {
      sufficient: status === 'ok' || status === 'short',
      wordCount,
      minRecommended: MIN_RECOMMENDED_WORDS,
      status,
    },
    sentences: sentenceVerdicts,
    paragraphs: paragraphVerdicts,
    highlights,
    modelFamilies: ensemble.modelFamilies,
    humanization: ensemble.humanization,
    linguisticProfile: linguisticResult.profile,
    statisticalProfile: statisticalResult.profile,
    warnings,
    explanation,
    limitations,
    metadata,
    scanDate: new Date().toISOString(),
    ...(devDiagnostics ? { diagnostics: devDiagnostics } : {}),
  };
}

function buildVerdictReason(
  verdict: Verdict,
  adjustedAiRisk: number,
  ai: number,
  mixed: number,
  sentenceSignals: ReturnType<typeof aggregateSentenceSignals>,
  consistencyScore: number,
): string {
  const parts: string[] = [
    `verdict=${verdict}`,
    `adjustedAiRisk=${adjustedAiRisk.toFixed(1)}`,
    `rawAi=${ai}`,
    `rawMixed=${mixed}`,
    `sentenceDominant=${sentenceSignals.dominantSentenceLabel}`,
    `aiContinuity=${sentenceSignals.aiContinuityScore}`,
    `docConsistency=${consistencyScore.toFixed(2)}`,
  ];
  return parts.join(' | ');
}

export { getLanguageName };
