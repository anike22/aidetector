import type {
  ContentType,
  FeatureScores,
  LinguisticProfile,
  StatisticalProfile,
  ModelFamilySignal,
  HumanizationSignal,
} from './types';
import {
  getLanguageCalibration,
  calibrateProbability,
  confidenceFromDistribution,
  languageReliabilityFactor,
} from './calibration';
import {
  SPANISH_CALIBRATION,
  getSpanishContentWeights,
  calibrateSpanishProbability,
  spanishConfidenceFromDistribution,
  spanishLanguageReliability,
  normalize,
} from './spanishCalibration';
import {
  ARABIC_CALIBRATION,
  getArabicContentWeights,
  calibrateArabicProbability,
  arabicConfidenceFromDistribution,
  arabicLanguageReliability,
} from './arabicCalibration';

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

const CONTENT_TYPE_CONFIG: Record<Exclude<ContentType, 'auto'>, ContentTypeWeights> = {
  academic: { aiSensitivity: 1.05, humanTolerance: 1, formalPenalty: 0.15 },
  research: { aiSensitivity: 1.05, humanTolerance: 1, formalPenalty: 0.15 },
  blog: { aiSensitivity: 1, humanTolerance: 1.1, formalPenalty: 0.05 },
  seo: { aiSensitivity: 1.2, humanTolerance: 0.9, formalPenalty: 0.05 },
  news: { aiSensitivity: 1, humanTolerance: 1, formalPenalty: 0.1 },
  business: { aiSensitivity: 1.05, humanTolerance: 1, formalPenalty: 0.1 },
  email: { aiSensitivity: 0.9, humanTolerance: 1.1, formalPenalty: 0 },
  job: { aiSensitivity: 1.05, humanTolerance: 1, formalPenalty: 0.1 },
  legal: { aiSensitivity: 1.1, humanTolerance: 0.95, formalPenalty: 0.2 },
  technical: { aiSensitivity: 1.1, humanTolerance: 0.95, formalPenalty: 0.15 },
  creative: { aiSensitivity: 0.85, humanTolerance: 1.2, formalPenalty: 0 },
  social: { aiSensitivity: 0.85, humanTolerance: 1.2, formalPenalty: 0 },
  product: { aiSensitivity: 1.15, humanTolerance: 0.9, formalPenalty: 0.05 },
  student: { aiSensitivity: 1.05, humanTolerance: 1.05, formalPenalty: 0.05 },
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

    const aiFeatures = [
      normalize(linguistic.transitionPredictability, 0, 0.3) * (1.0 + calibration.transitionSensitivity) * weights.aiSensitivity,
      normalize(linguistic.syntacticRegularity, 0, 0.5) * 0.9,
      normalize(linguistic.semanticRedundancy, 0, 0.4) * 0.8,
      normalize(linguistic.formulaicStartScore + linguistic.formulaicEndScore, 0, 1.0) * 1.8,
      normalize(linguistic.balancedPhrasingScore, 0, 0.5) * 0.6,
      normalize(linguistic.vocabularyDistributionScore, 0, 0.6) * 0.6,
      normalize(linguistic.paragraphSymmetry, 0, 0.7) * 0.4,
      (1 - linguistic.lexicalDiversity) * 0.9 * weights.aiSensitivity,
      normalize(linguistic.discourseFlowScore, 0, 0.6) * 0.5,
      normalize(linguistic.aiBoilerplateScore, 0, 0.8) * 0.8,
      normalize(linguistic.phraseReuseScore, 0, 0.7) * 0.4,
    ];

    const diversityBaseline = calibration.lexicalDiversityBaseline;
    const humanFeatures = [
      Math.min(1, Math.max(0, (linguistic.lexicalDiversity - diversityBaseline) * 2.5)) * 0.6 * weights.humanTolerance,
      Math.min(1, linguistic.sentenceLengthVariance / 50) * 0.7 * weights.humanTolerance,
      (1 - normalize(linguistic.transitionPredictability, 0, 0.3)) * 0.5,
      (1 - normalize(linguistic.formulaicStartScore + linguistic.formulaicEndScore, 0, 1.0)) * 0.6,
      normalize(linguistic.stylisticVariationScore, 0, 1.0) * 0.7,
      (1 - normalize(linguistic.humanEditingScore, 0, 0.8)) * 0.3,
    ];

    const statAiFeatures = [
      normalize(statistical.tokenPredictability, 0, 0.25) * 0.8,
      normalize(statistical.repetitionDensity, 0, 0.35) * 0.6,
      (1 - statistical.burstiness) * (0.7 + calibration.burstinessWeight),
      (1 - statistical.ngramUniqueness) * 0.5,
      normalize(statistical.vocabularyCompression, 0, 0.8) * 0.4,
      normalize(statistical.phraseReuseScore, 0, 0.7) * 0.4,
    ];

    const statHumanFeatures = [
      statistical.burstiness * 0.7,
      statistical.ngramUniqueness * 0.5,
      Math.min(1, statistical.sentenceVariance / 0.6) * 0.5,
      (1 - statistical.repetitionDensity) * 0.4,
      normalize(statistical.coherenceScore, 0, 1.0) * 0.3,
    ];

    aiScore =
      (mean(aiFeatures) * 1.2 + mean(statAiFeatures) * 1.0 + avgSentenceAi * 1.2 + avgParagraphAi * 0.8) /
      (1.2 + 1.0 + 1.2 + 0.8);
    humanScore =
      (mean(humanFeatures) * 1.0 + mean(statHumanFeatures) * 0.9) / (1.0 + 0.9);
    humanScore *= Math.max(0.4, 1 - weights.formalPenalty);

    if (humanization.detected) {
      aiScore = Math.min(1, aiScore * 1.45 + 0.05);
      humanScore *= 0.85;
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
    const weight = baseWeight * shortTextFactor * reliability * stabilityFactor;
    calibratedAi = calibratedAi * (1 - weight) + classifierAiProbability * weight;
    calibratedAi = Math.min(1, Math.max(0, calibratedAi));
  }

  // Mixed probability reflects model disagreement / editing signals.
  // It is then normalised together with AI and Human so the three probabilities sum to ~100%.
  // When the classifier is available, high chunk-score variance (disagreement across the text)
  // is a strong signal for mixed/edited authorship.
  const mixedMultiplier = isSpanish ? SPANISH_CALIBRATION.featureWeights.mixed.conflict : 1.4;
  const heuristicConflict = Math.min(aiScore, humanScore) * (1 - Math.abs(calibratedAi - 0.5) * 2);
  const classifierConflict = classifierChunkStdDev * (1 - Math.abs((classifierAiProbability ?? calibratedAi) - 0.5) * 2);
  const mixedRaw = Math.max(heuristicConflict, classifierConflict) * mixedMultiplier;

  const aiMass = calibratedAi;
  const humanMass = 1 - calibratedAi;
  const mixedMass = Math.min(1, mixedRaw);
  const totalMass = aiMass + humanMass + mixedMass;

  const ai = Math.min(1, Math.max(0, aiMass / totalMass));
  const human = Math.min(1, Math.max(0, humanMass / totalMass));
  const mixed = Math.min(1, Math.max(0, mixedMass / totalMass));

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
