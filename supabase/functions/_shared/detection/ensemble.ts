import type {
  ContentType,
  FeatureScores,
  LinguisticProfile,
  StatisticalProfile,
  ModelFamilySignal,
  HumanizationSignal,
} from './types.ts';
import {
  getLanguageCalibration,
  calibrateProbability,
  confidenceFromDistribution,
  languageReliabilityFactor,
  normalize,
  SPANISH_CALIBRATION,
  getSpanishContentWeights,
  calibrateSpanishProbability,
  spanishConfidenceFromDistribution,
  spanishLanguageReliability,
  ARABIC_CALIBRATION,
  getArabicContentWeights,
  calibrateArabicProbability,
  arabicConfidenceFromDistribution,
  arabicLanguageReliability,
} from './calibration.ts';

const CLASSIFIER_LANGUAGE_WEIGHT: Record<string, number> = {
  en: 0.55,
  es: 0.45,
  ar: 0.5,
};

export interface EnsembleResult {
  scores: FeatureScores;
  modelFamilies: ModelFamilySignal[];
  humanization: HumanizationSignal;
  confidence: number;
}

interface ContentTypeWeights {
  aiSensitivity: number; // higher means more likely to flag AI patterns
  humanTolerance: number; // higher means human signals weigh more
  formalPenalty: number;
}

// formalPenalty is removed from humanScore multiplication — formal writing alone is
// not evidence of AI authorship. It now acts only as a minor sensitivity reducer and
// has no direct negative effect on the human signal.
const CONTENT_TYPE_CONFIG: Record<Exclude<ContentType, 'auto'>, ContentTypeWeights> = {
  academic:  { aiSensitivity: 0.90, humanTolerance: 1.15, formalPenalty: 0 },
  research:  { aiSensitivity: 0.90, humanTolerance: 1.15, formalPenalty: 0 },
  blog:      { aiSensitivity: 1.00, humanTolerance: 1.10, formalPenalty: 0 },
  seo:       { aiSensitivity: 1.20, humanTolerance: 0.90, formalPenalty: 0 },
  news:      { aiSensitivity: 0.95, humanTolerance: 1.05, formalPenalty: 0 },
  business:  { aiSensitivity: 1.00, humanTolerance: 1.05, formalPenalty: 0 },
  email:     { aiSensitivity: 0.90, humanTolerance: 1.10, formalPenalty: 0 },
  job:       { aiSensitivity: 1.05, humanTolerance: 1.00, formalPenalty: 0 },
  legal:     { aiSensitivity: 0.90, humanTolerance: 1.15, formalPenalty: 0 },
  technical: { aiSensitivity: 0.90, humanTolerance: 1.10, formalPenalty: 0 },
  creative:  { aiSensitivity: 0.85, humanTolerance: 1.20, formalPenalty: 0 },
  social:    { aiSensitivity: 0.85, humanTolerance: 1.20, formalPenalty: 0 },
  product:   { aiSensitivity: 1.10, humanTolerance: 0.95, formalPenalty: 0 },
  student:   { aiSensitivity: 1.00, humanTolerance: 1.05, formalPenalty: 0 },
};

const AUTO_CONTENT_WEIGHTS: ContentTypeWeights = {
  aiSensitivity: 1,
  humanTolerance: 1,
  formalPenalty: 0,
};

function resolvedContentWeights(contentType: ContentType): ContentTypeWeights {
  return contentType === 'auto' ? AUTO_CONTENT_WEIGHTS : CONTENT_TYPE_CONFIG[contentType];
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// normalize is imported from spanishCalibration for shared use.

export interface ClassifierInput {
  aiProbability: number; // 0-1
  confidence: number; // classifier chunk standard deviation, 0-1
}

export function runEnsemble(
  languageCode: string,
  contentType: ContentType,
  linguistic: LinguisticProfile,
  statistical: StatisticalProfile,
  sentenceAiSignals: number[],
  paragraphAiSignals: number[],
  languageConfidence: number,
  isSupportedLanguage: boolean,
  wordCount: number,
  classifierInput?: ClassifierInput, // undefined when unavailable
): EnsembleResult {
  const isSpanish = languageCode === 'es';
  const isArabic = languageCode === 'ar';

  const avgSentenceAi = sentenceAiSignals.length ? sentenceAiSignals.reduce((a, b) => a + b, 0) / sentenceAiSignals.length : 0;
  const avgParagraphAi = paragraphAiSignals.length ? paragraphAiSignals.reduce((a, b) => a + b, 0) / paragraphAiSignals.length : 0;

  const humanization = detectHumanizationSignals(linguistic, statistical, sentenceAiSignals, paragraphAiSignals);

  let aiScore: number;
  let humanScore: number;
  let calibratedAi: number;
  let reliability: number;

  if (isSpanish) {
    const sc = SPANISH_CALIBRATION;
    const contentWeights = getSpanishContentWeights(contentType);
    const weights: ContentTypeWeights = {
      aiSensitivity: contentWeights.aiSensitivity * sc.aiSensitivityMultiplier,
      humanTolerance: contentWeights.humanTolerance * sc.humanToleranceMultiplier,
      formalPenalty: Math.min(1, contentWeights.formalPenalty + sc.formalPenaltyAdd),
    };
    const fw = sc.featureWeights;

    const aiFeatures = [
      normalize(linguistic.transitionPredictability, 0, 0.28) * fw.ai.transition * (1 + sc.transitionSensitivity) * weights.aiSensitivity,
      normalize(linguistic.syntacticRegularity, 0, 0.5) * fw.ai.syntacticRegularity,
      normalize(linguistic.semanticRedundancy, 0, 0.4) * fw.ai.semanticRedundancy,
      normalize(linguistic.formulaicStartScore + linguistic.formulaicEndScore, 0, 1.0) * fw.ai.formulaicStartEnd,
      normalize(linguistic.balancedPhrasingScore, 0, 0.5) * fw.ai.balancedPhrasing,
      normalize(linguistic.vocabularyDistributionScore, 0, 0.6) * fw.ai.vocabularyDistribution,
      normalize(linguistic.paragraphSymmetry, 0, 0.7) * fw.ai.paragraphSymmetry,
      (1 - linguistic.lexicalDiversity) * fw.ai.lexicalRepetition * weights.aiSensitivity,
      normalize(linguistic.discourseFlowScore, 0, 0.6) * fw.ai.discourseFlow,
      normalize(linguistic.aiBoilerplateScore, 0, 0.8) * fw.ai.boilerplate,
      normalize(linguistic.phraseReuseScore, 0, 0.7) * fw.ai.phraseReuse,
    ];

    const humanFeatures = [
      Math.min(1, Math.max(0, (linguistic.lexicalDiversity - sc.lexicalDiversityBaseline) * 2.5)) * fw.human.lexicalDiversity * weights.humanTolerance,
      Math.min(1, linguistic.sentenceLengthVariance / 50) * fw.human.sentenceLengthVariance * weights.humanTolerance,
      (1 - normalize(linguistic.transitionPredictability, 0, 0.28)) * fw.human.transitionUnpredictability,
      (1 - normalize(linguistic.formulaicStartScore + linguistic.formulaicEndScore, 0, 1.0)) * fw.human.unformulaic,
      normalize(linguistic.stylisticVariationScore, 0, 1.0) * fw.human.stylisticVariation,
      (1 - normalize(linguistic.humanEditingScore, 0, 0.8)) * fw.human.editingCoherence,
    ];

    const statAiFeatures = [
      normalize(statistical.tokenPredictability, 0, 0.25) * fw.ai.tokenPredictability,
      normalize(statistical.repetitionDensity, 0, 0.35) * fw.ai.repetitionDensity,
      (1 - statistical.burstiness) * (fw.ai.lowBurstiness + sc.burstinessWeight),
      (1 - statistical.ngramUniqueness) * fw.ai.ngramRepetition,
      normalize(statistical.vocabularyCompression, 0, 0.8) * fw.ai.vocabularyCompression,
      normalize(statistical.phraseReuseScore, 0, 0.7) * fw.ai.statPhraseReuse,
    ];

    const statHumanFeatures = [
      statistical.burstiness * fw.human.burstiness,
      statistical.ngramUniqueness * fw.human.ngramUniqueness,
      Math.min(1, statistical.sentenceVariance / 0.6) * fw.human.sentenceVariance,
      (1 - statistical.repetitionDensity) * fw.human.coherence,
      normalize(statistical.coherenceScore, 0, 1.0) * fw.human.coherence,
    ];

    const aiMean = weightedMean([
      [mean(aiFeatures), 1.3],
      [mean(statAiFeatures), 1.0],
      [avgSentenceAi, 1.3],
      [avgParagraphAi, 0.85],
    ]);
    const humanMean = weightedMean([
      [mean(humanFeatures), 1.0],
      [mean(statHumanFeatures), 0.9],
    ]);

    aiScore = aiMean;
    humanScore = humanMean * Math.max(0.35, 1 - weights.formalPenalty);

    if (humanization.detected) {
      aiScore = Math.min(1, aiScore * 1.45 + 0.05);
      humanScore *= 0.85;
    }

    const logOddsAi = Math.log(aiScore + 0.01) - Math.log(humanScore + 0.01);
    calibratedAi = calibrateSpanishProbability(logOddsAi, contentType);
    reliability = spanishLanguageReliability(languageConfidence, isSupportedLanguage);
  } else if (isArabic) {
    const ac = ARABIC_CALIBRATION;
    const contentWeights = getArabicContentWeights(contentType);
    const weights: ContentTypeWeights = {
      aiSensitivity: contentWeights.aiSensitivity * ac.aiSensitivityMultiplier,
      humanTolerance: contentWeights.humanTolerance * ac.humanToleranceMultiplier,
      formalPenalty: Math.min(1, contentWeights.formalPenalty + ac.formalPenaltyAdd),
    };
    const fw = ac.featureWeights;

    const aiFeatures = [
      normalize(linguistic.transitionPredictability, 0, 0.28) * fw.ai.transition * (1 + ac.transitionSensitivity) * weights.aiSensitivity,
      normalize(linguistic.syntacticRegularity, 0, 0.5) * fw.ai.syntacticRegularity,
      normalize(linguistic.semanticRedundancy, 0, 0.4) * fw.ai.semanticRedundancy,
      normalize(linguistic.formulaicStartScore + linguistic.formulaicEndScore, 0, 1.0) * fw.ai.formulaicStartEnd,
      normalize(linguistic.balancedPhrasingScore, 0, 0.5) * fw.ai.balancedPhrasing,
      normalize(linguistic.vocabularyDistributionScore, 0, 0.6) * fw.ai.vocabularyDistribution,
      normalize(linguistic.paragraphSymmetry, 0, 0.7) * fw.ai.paragraphSymmetry,
      (1 - linguistic.lexicalDiversity) * fw.ai.lexicalRepetition * weights.aiSensitivity,
      normalize(linguistic.discourseFlowScore, 0, 0.6) * fw.ai.discourseFlow,
      normalize(linguistic.aiBoilerplateScore, 0, 0.8) * fw.ai.boilerplate,
      normalize(linguistic.phraseReuseScore, 0, 0.7) * fw.ai.phraseReuse,
    ];

    const humanFeatures = [
      Math.min(1, Math.max(0, (linguistic.lexicalDiversity - ac.lexicalDiversityBaseline) * 2.5)) * fw.human.lexicalDiversity * weights.humanTolerance,
      Math.min(1, linguistic.sentenceLengthVariance / 50) * fw.human.sentenceLengthVariance * weights.humanTolerance,
      (1 - normalize(linguistic.transitionPredictability, 0, 0.28)) * fw.human.transitionUnpredictability,
      (1 - normalize(linguistic.formulaicStartScore + linguistic.formulaicEndScore, 0, 1.0)) * fw.human.unformulaic,
      normalize(linguistic.stylisticVariationScore, 0, 1.0) * fw.human.stylisticVariation,
      (1 - normalize(linguistic.humanEditingScore, 0, 0.8)) * fw.human.editingCoherence,
    ];

    const statAiFeatures = [
      normalize(statistical.tokenPredictability, 0, 0.25) * fw.ai.tokenPredictability,
      normalize(statistical.repetitionDensity, 0, 0.35) * fw.ai.repetitionDensity,
      (1 - statistical.burstiness) * (fw.ai.lowBurstiness + ac.burstinessWeight),
      (1 - statistical.ngramUniqueness) * fw.ai.ngramRepetition,
      normalize(statistical.vocabularyCompression, 0, 0.8) * fw.ai.vocabularyCompression,
      normalize(statistical.phraseReuseScore, 0, 0.7) * fw.ai.statPhraseReuse,
    ];

    const statHumanFeatures = [
      statistical.burstiness * fw.human.burstiness,
      statistical.ngramUniqueness * fw.human.ngramUniqueness,
      Math.min(1, statistical.sentenceVariance / 0.6) * fw.human.sentenceVariance,
      (1 - statistical.repetitionDensity) * fw.human.coherence,
      normalize(statistical.coherenceScore, 0, 1.0) * fw.human.coherence,
    ];

    const aiMean = weightedMean([
      [mean(aiFeatures), 1.3],
      [mean(statAiFeatures), 1.0],
      [avgSentenceAi, 1.3],
      [avgParagraphAi, 0.85],
    ]);
    const humanMean = weightedMean([
      [mean(humanFeatures), 1.0],
      [mean(statHumanFeatures), 0.9],
    ]);

    aiScore = aiMean;
    humanScore = humanMean * Math.max(0.35, 1 - weights.formalPenalty);

    if (humanization.detected) {
      aiScore = Math.min(1, aiScore * 1.45 + 0.05);
      humanScore *= 0.85;
    }

    const logOddsAi = Math.log(aiScore + 0.01) - Math.log(humanScore + 0.01);
    calibratedAi = calibrateArabicProbability(logOddsAi, contentType);
    reliability = arabicLanguageReliability(languageConfidence, isSupportedLanguage);
  } else {
    const rawWeights = resolvedContentWeights(contentType);
    const calibration = getLanguageCalibration(languageCode);

    const weights: ContentTypeWeights = {
      aiSensitivity: rawWeights.aiSensitivity * calibration.aiSensitivityMultiplier,
      humanTolerance: rawWeights.humanTolerance * calibration.humanToleranceMultiplier,
      formalPenalty: Math.min(1, rawWeights.formalPenalty + calibration.formalPenaltyAdd),
    };

    // -----------------------------------------------------------------
    // AI feature weights — recalibrated to prevent formal-writing bias.
    //
    // Key changes vs. previous version:
    //   • formulaicStartEnd: 1.8 → 0.8  (was single largest contributor;
    //     academic writing uses "In this paper..." legitimately)
    //   • transitionPredictability: 1.0 → 0.7, ceiling 0.3 → 0.55
    //     (formal humans also use "therefore", "moreover")
    //   • syntacticTemplateRepetition 0.9 (NEW): detects true syntactic
    //     copy-paste patterns, not just structural regularity
    //   • aiBoilerplateScore: 0.8 → 1.0 (strongest true AI signal)
    //   • semanticRedundancy: 0.8 → 0.7
    //   • paragraphSymmetry: 0.4 → 0.3  (human academic writing is also symmetric)
    //
    // Multi-signal gate (see below): aiScore is attenuated when fewer
    // than 3 of 5 independent AI signals are elevated, preventing
    // correlated formal-writing features from stacking into a high AI score.
    // -----------------------------------------------------------------
    const aiFeatures = [
      normalize(linguistic.transitionPredictability, 0, 0.55) * 0.7 * (1.0 + calibration.transitionSensitivity) * weights.aiSensitivity,
      normalize(linguistic.syntacticRegularity, 0, 0.5) * 0.9,
      normalize(linguistic.semanticRedundancy, 0, 0.4) * 0.7,
      normalize(linguistic.formulaicStartScore + linguistic.formulaicEndScore, 0, 1.0) * 0.8,
      normalize(linguistic.balancedPhrasingScore, 0, 0.5) * 0.5,
      normalize(linguistic.vocabularyDistributionScore, 0, 0.6) * 0.5,
      normalize(linguistic.paragraphSymmetry, 0, 0.7) * 0.3,
      (1 - linguistic.lexicalDiversity) * 0.8 * weights.aiSensitivity,
      normalize(linguistic.discourseFlowScore, 0, 0.6) * 0.5,
      normalize(linguistic.aiBoilerplateScore, 0, 0.8) * 1.0,
      normalize(linguistic.phraseReuseScore, 0, 0.7) * 0.5,
    ];

    // -----------------------------------------------------------------
    // Human feature weights — recalibrated to boost formal-writing signals.
    //
    // Key changes vs. previous version:
    //   • lexicalDiversity: 0.6 → 0.8, no longer penalised by formalPenalty
    //   • sentenceLengthVariance: 0.7 → 0.8 (strong human indicator)
    //   • stylisticVariation: 0.7 → 0.9 (formal human writers vary style)
    //   • burstiness (from stat layer): 0.7 → 0.9 (key human signal)
    //   • ngramUniqueness: 0.5 → 0.7 (human writers produce unique phrases)
    //   • specificitySignal 0.6 (NEW): proper nouns, numbers, dates
    //   • formalPenalty multiplication REMOVED — formal writing is not AI evidence
    // -----------------------------------------------------------------
    const diversityBaseline = calibration.lexicalDiversityBaseline;
    const humanFeatures = [
      Math.min(1, Math.max(0, (linguistic.lexicalDiversity - diversityBaseline) * 3.0)) * 0.8 * weights.humanTolerance,
      Math.min(1, linguistic.sentenceLengthVariance / 45) * 0.8 * weights.humanTolerance,
      (1 - normalize(linguistic.transitionPredictability, 0, 0.55)) * 0.5,
      (1 - normalize(linguistic.formulaicStartScore + linguistic.formulaicEndScore, 0, 1.0)) * 0.5,
      normalize(linguistic.stylisticVariationScore, 0, 1.0) * 0.9 * weights.humanTolerance,
      normalize(linguistic.humanEditingScore, 0, 0.8) * 0.4,
      // specificityScore and personalVoiceScore are the primary human signals for
      // formal writing — they are unaffected by AI editing style
      normalize(linguistic.specificityScore ?? 0, 0, 1.0) * 0.6 * weights.humanTolerance,
      normalize(linguistic.personalVoiceScore ?? 0, 0, 1.0) * 0.5 * weights.humanTolerance,
    ];
    // Note: humanEditingScore is intentionally given low weight (0.4) here.
    // A document that is 80% AI but has been edited by a human should NOT score
    // high on the human side — it should have a moderate AI score and be flagged
    // as "Mostly AI, Human-edited" by classifyVerdict, not classified as "Human".

    const statAiFeatures = [
      normalize(statistical.tokenPredictability, 0, 0.25) * 0.8,
      normalize(statistical.repetitionDensity, 0, 0.35) * 0.6,
      (1 - statistical.burstiness) * (0.7 + calibration.burstinessWeight),
      (1 - statistical.ngramUniqueness) * 0.5,
      normalize(statistical.vocabularyCompression, 0, 0.8) * 0.4,
      normalize(statistical.phraseReuseScore, 0, 0.7) * 0.4,
    ];

    const statHumanFeatures = [
      statistical.burstiness * 0.9,
      statistical.ngramUniqueness * 0.7,
      Math.min(1, statistical.sentenceVariance / 0.5) * 0.6,
      (1 - statistical.repetitionDensity) * 0.4,
      normalize(statistical.coherenceScore, 0, 1.0) * 0.3,
    ];

    // Raw score aggregation.
    // - avgSentenceAi weight raised to 1.2 (matches Spanish/Arabic) — sentence-level
    //   AI signals (boilerplate, formulaic starts, transition density per sentence) are
    //   the most granular evidence and deserve higher weight than document-level heuristics.
    // - humanEditingScore is removed from the human feature vector here and kept only
    //   as a mixed-authorship indicator; high editing on an AI base should NOT push the
    //   document toward "Human" — it should push toward "Mostly AI, Human-edited".
    // - formalPenalty is NOT applied (removed in v2.5.1).
    aiScore =
      (mean(aiFeatures) * 1.2 + mean(statAiFeatures) * 1.0 + avgSentenceAi * 1.2 + avgParagraphAi * 0.8) /
      (1.2 + 1.0 + 1.2 + 0.8);
    humanScore =
      (mean(humanFeatures) * 1.1 + mean(statHumanFeatures) * 1.0) / (1.1 + 1.0);

    // Multi-signal agreement gate: attenuate aiScore when fewer than 3 of the
    // 7 most independent AI signals are elevated. This prevents a single
    // correlated family of features (e.g. all formal-writing signals) from
    // producing a high AI score. The expanded list includes syntactic regularity,
    // repetitive density, and formulaic start/end patterns so generic AI output
    // (which often lacks heavy boilerplate or phrase reuse) is not under-scored.
    const independentAiSignals = [
      normalize(linguistic.aiBoilerplateScore, 0, 0.8) > 0.15 ? 1 : 0,
      normalize(linguistic.phraseReuseScore, 0, 0.7) > 0.15 ? 1 : 0,
      (1 - statistical.burstiness) > 0.55 ? 1 : 0,
      normalize(statistical.tokenPredictability, 0, 0.25) > 0.25 ? 1 : 0,
      normalize(linguistic.semanticRedundancy, 0, 0.4) > 0.3 ? 1 : 0,
      normalize(linguistic.syntacticRegularity, 0, 0.5) > 0.35 ? 1 : 0,
      normalize(statistical.repetitionDensity, 0, 0.35) > 0.35 ? 1 : 0,
      normalize(linguistic.formulaicStartScore + linguistic.formulaicEndScore, 0, 1.0) > 0.55 ? 1 : 0,
    ] as number[];
    const elevatedAiSignalCount = independentAiSignals.reduce((a, b) => a + b, 0);
    if (elevatedAiSignalCount < 3) {
      aiScore *= 0.65; // strong attenuation: almost no independent AI signals
    } else if (elevatedAiSignalCount < 5) {
      aiScore *= 0.82; // moderate attenuation: only 3-4 independent signals
    }

    if (humanization.detected) {
      aiScore = Math.min(1, aiScore * 1.35 + 0.05);
      humanScore *= 0.88;
    }

    // Direct AI-pattern bonus.
    // This component is intentionally computed OUTSIDE the feature-mean to prevent
    // dilution across the feature array. It fires when multiple independent AI signals
    // are present: boilerplate + phrase-reuse, or strong formulaic start/end patterns.
    // Formal human writing — which has low boilerplate and no formulaic conclusions —
    // receives zero bonus, while real AI text with predictable openings and closings gets
    // a meaningful boost.
    const boilerplateDirect = linguistic.aiBoilerplateScore;
    const phraseReuseDirect = linguistic.phraseReuseScore;
    const formulaicScore = linguistic.formulaicStartScore + linguistic.formulaicEndScore;
    const hasBoilerplatePhrase = boilerplateDirect >= 0.12 && phraseReuseDirect >= 0.10;
    const hasFormulaicStartEnd = formulaicScore >= 1.0;
    if (hasBoilerplatePhrase || hasFormulaicStartEnd) {
      const component1 = hasBoilerplatePhrase
        ? (normalize(boilerplateDirect, 0.12, 0.60) + normalize(phraseReuseDirect, 0.10, 0.50)) / 2
        : 0;
      const component2 = hasFormulaicStartEnd
        ? normalize(formulaicScore, 1.0, 2.0)
        : 0;
      // When both conditions are met, use the stronger signal to avoid double-counting.
      const combined = Math.max(component1, component2);
      aiScore = Math.min(1, aiScore + combined * 0.18);
    }

    const logOddsAi = Math.log(aiScore + 0.01) - Math.log(humanScore + 0.01);
    calibratedAi = calibrateProbability(logOddsAi, languageCode, contentType);
    reliability = languageReliabilityFactor(languageCode, languageConfidence, isSupportedLanguage);
  }

  // Blend in trained classifier probability when available. Weight is tuned per language.
  // Short text reduces classifier influence because chunking is unreliable.
  let classifierAiProbability: number | undefined;
  let classifierChunkStdDev = 0;
  if (classifierInput && classifierInput.aiProbability >= 0 && classifierInput.aiProbability <= 1) {
    classifierAiProbability = classifierInput.aiProbability;
    classifierChunkStdDev = Math.min(1, classifierInput.confidence);
    const baseWeight = CLASSIFIER_LANGUAGE_WEIGHT[languageCode] ?? 0;
    const shortTextFactor = wordCount < 40 ? 0.5 : wordCount < 80 ? 0.9 : 1;
    // classifierInput.confidence is chunk-score standard deviation (disagreement), not confidence.
    // Reduce classifier influence when chunk predictions are unstable so one polarized
    // character-ngram model cannot dominate otherwise contradictory document evidence.
    const stabilityFactor = Math.max(0.35, 1 - classifierChunkStdDev);

    // Cross-layer false-positive guard. A low heuristic AI score alone is not
    // enough to suppress the classifier: some genuine AI prose is lexically diverse.
    // Require several independent human-style signals before reducing an AI-heavy
    // character-ngram prediction.
    const strongHumanSignalCount = [
      statistical.burstiness >= 0.68,
      statistical.ngramUniqueness >= 0.90,
      linguistic.stylisticVariationScore >= 0.75,
      linguistic.transitionPredictability <= 0.08,
      linguistic.sentenceLengthVariance >= 60,
    ].filter(Boolean).length;
    const classifierHumanContradiction =
      classifierAiProbability >= 0.70 &&
      calibratedAi <= 0.35 &&
      strongHumanSignalCount >= 4;
    const contradictionFactor = classifierHumanContradiction ? 0.35 : 1;

    const weight = baseWeight * shortTextFactor * reliability * stabilityFactor * contradictionFactor;
    calibratedAi = calibratedAi * (1 - weight) + classifierAiProbability * weight;
    calibratedAi = Math.min(1, Math.max(0, calibratedAi));
  }

  // -------------------------------------------------------------------------
  // Mixed probability: represents genuine section-level mixed authorship ONLY.
  //
  // Design principle: Mixed ≠ uncertainty.
  //
  // Mixed must only be non-zero when there is structural evidence that
  // different sections of the document were written by different authors.
  // It must never act as a residual uncertainty bucket.
  //
  // Three required conditions for any mixed mass to be produced:
  //   1. STRUCTURAL EVIDENCE GATE: either the classifier disagreed strongly
  //      across chunks (classifierChunkStdDev > 0.25, indicating paragraph-level
  //      authorship shifts) OR feature scores are very close (featureGap < 0.08,
  //      indicating the two signals are genuinely ambiguous at feature level).
  //      Without this gate, close scores just mean low confidence — not mixed.
  //
  //   2. CERTAINTY SUPPRESSION: calibratedAi must be near 0.5.  A squared
  //      falloff ensures that even moderate dominance (e.g., 0.65) sharply
  //      suppresses mixed mass.  A clearly one-sided document is not mixed.
  //
  //   3. HARD CAP: Mixed mass is capped at 40% of the minority class mass.
  //      This limits mixed to at most ~20% of a 50/50 document, preventing
  //      it from dominating the distribution.
  //
  // Mixed mass is CARVED OUT of existing AI+Human proportionally, never added.
  // This preserves the AI-vs-Human ordering from calibratedAi.
  // -------------------------------------------------------------------------

  // Gate: structural evidence is required before any mixed mass is computed.
  // Without this, near-equal feature scores on purely human or AI documents
  // would incorrectly produce ~35-40% mixed just from proximity.
  const featureGap = Math.abs(aiScore - humanScore);
  const hasStructuralEvidence = classifierChunkStdDev > 0.25 || featureGap < 0.08;

  // Certainty factor: 0 when calibratedAi is strongly one-sided, 1 when near 0.5.
  // Squared falloff: calibratedAi=0.60 → certaintyFactor=0.80 → sq=0.64 (strong suppression).
  const certaintyFactor = 1 - Math.min(1, Math.abs(calibratedAi - 0.5) * 2);
  const certaintyFactorSq = certaintyFactor * certaintyFactor;

  let mixedMassCapped = 0;
  if (hasStructuralEvidence) {
    // Reduced multipliers vs. previous version (0.7 vs 1.4) to prevent even
    // genuine uncertainty from over-contributing to the mixed mass.
    const mixedMultiplier = isSpanish
      ? Math.min(0.7, SPANISH_CALIBRATION.featureWeights.mixed.conflict * 0.5)
      : isArabic
        ? Math.min(0.7, ARABIC_CALIBRATION.featureWeights.mixed.conflict * 0.5)
        : 0.7;

    // Heuristic conflict: requires feature-level overlap AND genuine uncertainty.
    const featureOverlap = Math.max(0, 1 - featureGap * 2);
    const heuristicConflict = featureOverlap * Math.min(aiScore, humanScore) * certaintyFactorSq;

    // Classifier conflict: chunk-level std-dev weighted by uncertainty.
    // Only meaningful when classifierChunkStdDev > 0.25 (already gated above).
    const classifierConflict = classifierChunkStdDev * certaintyFactorSq;

    const mixedRaw = Math.max(heuristicConflict, classifierConflict) * mixedMultiplier;

    // Cap at 40% of minority class — limits mixed to at most ~20% on 50/50 docs,
    // and proportionally less as the document becomes more one-sided.
    const minorityMass = Math.min(calibratedAi, 1 - calibratedAi);
    mixedMassCapped = Math.min(mixedRaw, minorityMass * 0.40);
  }

  // Carve mixed out of AI and Human proportionally rather than adding new mass.
  // This preserves the AI-vs-Human ordering that calibratedAi encodes.
  const aiMass = Math.max(0, calibratedAi - mixedMassCapped * calibratedAi);
  const humanMass = Math.max(0, (1 - calibratedAi) - mixedMassCapped * (1 - calibratedAi));
  const mixedMass = mixedMassCapped;
  const totalMass = aiMass + humanMass + mixedMass;

  const ai = totalMass > 0 ? Math.min(1, Math.max(0, aiMass / totalMass)) : calibratedAi;
  const human = totalMass > 0 ? Math.min(1, Math.max(0, humanMass / totalMass)) : 1 - calibratedAi;
  const mixed = totalMass > 0 ? Math.min(1, Math.max(0, mixedMass / totalMass)) : 0;

  const layerAgreement = 1 - Math.abs(aiScore - humanScore);
  const textLengthFactor = wordCount >= 150 ? 1 : wordCount >= 80 ? 0.95 : wordCount >= 40 ? 0.85 : wordCount >= 20 ? 0.7 : 0.5;

  const confidence = isSpanish
    ? spanishConfidenceFromDistribution(
        Math.round(ai * 100),
        Math.round(human * 100),
        Math.round(mixed * 100),
        reliability,
        textLengthFactor,
        1 - Math.abs(aiScore - humanScore),
      )
    : isArabic
      ? arabicConfidenceFromDistribution(
          Math.round(ai * 100),
          Math.round(human * 100),
          Math.round(mixed * 100),
          reliability,
          textLengthFactor,
          1 - Math.abs(aiScore - humanScore),
        )
      : confidenceFromDistribution(
          Math.round(ai * 100),
          Math.round(human * 100),
          Math.round(mixed * 100),
          reliability,
          textLengthFactor,
          1 - Math.abs(aiScore - humanScore),
        );

  return {
    scores: {
      ai: Math.round(ai * 100),
      human: Math.round(human * 100),
      mixed: Math.round(mixed * 100),
      confidence: Math.round(confidence * 100),
    },
    modelFamilies: inferModelFamilies(linguistic, statistical, aiScore),
    humanization,
    confidence: Math.round(confidence * 100),
  };
}

function weightedMean(pairs: [number, number][]): number {
  if (pairs.length === 0) return 0;
  const totalWeight = pairs.reduce((sum, [, weight]) => sum + weight, 0);
  const weightedSum = pairs.reduce((sum, [value, weight]) => sum + value * weight, 0);
  return totalWeight === 0 ? 0 : weightedSum / totalWeight;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function inferModelFamilies(
  linguistic: LinguisticProfile,
  statistical: StatisticalProfile,
  aiScore: number
): ModelFamilySignal[] {
  if (aiScore < 0.35) return [];

  const families: ModelFamilySignal[] = [];

  // Generic pattern profiles derived from observable linguistic signals.
  // Provider names are intentionally omitted from public-facing output.
  if (linguistic.transitionPredictability > 0.15 && linguistic.balancedPhrasingScore > 0.1) {
    families.push({
      family: 'Predictable-transition pattern',
      probability: Math.round(Math.min(100, aiScore * 100 * 0.8 + 10)),
      confidence: Math.round(Math.min(100, linguistic.transitionPredictability * 200 + 30)),
      signals: ['Predictable transitions', 'Balanced phrasing', 'Conversational hedging'],
    });
  }

  if (linguistic.avgSentenceLength > 18 && linguistic.lexicalDiversity > 0.45) {
    families.push({
      family: 'Formal-long-sentence pattern',
      probability: Math.round(Math.min(100, aiScore * 100 * 0.6 + 10)),
      confidence: Math.round(Math.min(100, linguistic.lexicalDiversity * 150 + 20)),
      signals: ['Formal vocabulary', 'Longer sentence structures', 'Nuanced phrasing'],
    });
  }

  if (linguistic.semanticRedundancy > 0.15 && statistical.burstiness > 0.25) {
    families.push({
      family: 'Semantic-repetition pattern',
      probability: Math.round(Math.min(100, aiScore * 100 * 0.6 + 10)),
      confidence: Math.round(Math.min(100, linguistic.semanticRedundancy * 200 + 20)),
      signals: ['Semantic redundancy', 'Moderate burstiness', 'Repetitive topic framing'],
    });
  }

  return families.sort((a, b) => b.probability - a.probability);
}

function detectHumanizationSignals(
  linguistic: LinguisticProfile,
  statistical: StatisticalProfile,
  sentenceAiSignals: number[],
  paragraphAiSignals: number[]
): HumanizationSignal {
  const signals: string[] = [];
  let confidence = 0;

  // Artificial variation: high sentence variance but low lexical diversity can indicate synonym-swapping.
  if (statistical.sentenceVariance > 0.4 && linguistic.lexicalDiversity < 0.4) {
    signals.push('Sentence-length variation inconsistent with vocabulary reuse');
    confidence += 0.2;
  }

  // Low n-gram uniqueness with high AI sentence signals suggests restructuring of AI source.
  if (statistical.ngramUniqueness < 0.4 && sentenceAiSignals.some((s) => s > 0.5)) {
    signals.push('Common phrase patterns after structural editing');
    confidence += 0.2;
  }

  // Paragraphs differ more than sentences, indicating targeted rewriting.
  const avgSentence = sentenceAiSignals.length ? sentenceAiSignals.reduce((a, b) => a + b, 0) / sentenceAiSignals.length : 0;
  const avgParagraph = paragraphAiSignals.length ? paragraphAiSignals.reduce((a, b) => a + b, 0) / paragraphAiSignals.length : 0;
  if (Math.abs(avgParagraph - avgSentence) > 0.3) {
    signals.push('Mismatch between sentence and paragraph-level signals');
    confidence += 0.15;
  }

  // New humanization indicators based on expanded feature set.
  if (linguistic.humanEditingScore > 0.5 && statistical.editingSignalScore > 0.4) {
    signals.push('Localized style shifts consistent with human editing of AI source');
    confidence += 0.2;
  }
  if (linguistic.phraseReuseScore > 0.4 && statistical.phraseReuseScore < 0.2) {
    signals.push('Reused phrases distributed unevenly, suggesting partial rewriting');
    confidence += 0.15;
  }
  if (linguistic.aiBoilerplateScore > 0.4 && linguistic.stylisticVariationScore > 0.5) {
    signals.push('AI boilerplate mixed with uneven stylistic variation');
    confidence += 0.15;
  }
  // Casual rewrites of AI source often show high lexical diversity but weak coherence
  // without the abrupt local edits typical of native human drafting.
  if (
    linguistic.lexicalDiversity > 0.75 &&
    linguistic.contextualCoherence < 0.08 &&
    statistical.editingSignalScore < 0.25
  ) {
    signals.push('High vocabulary diversity without natural inter-sentence coherence');
    confidence += 0.2;
  }

  return {
    detected: signals.length > 0,
    confidence: Math.round(Math.min(1, confidence) * 100),
    signals,
    explanation:
      signals.length > 0
        ? 'Some patterns are consistent with automated paraphrasing or humanization, but this is not definitive proof.'
        : 'No strong humanization or paraphrase signals detected.',
  };
}
