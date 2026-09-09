import type { ContentType } from './types';

export interface VerdictThresholds {
  likelyAi: number;
  mostlyAi: number;
  mixed: number;
  mostlyHuman: number;
  likelyHuman: number;
  margin: number;
}

export interface LanguageCalibration {
  aiPrior: number;
  temperature: number;
  bias: number;
  aiSensitivityMultiplier: number;
  humanToleranceMultiplier: number;
  formalPenaltyAdd: number;
  transitionSensitivity: number;
  burstinessWeight: number;
  lexicalDiversityBaseline: number;
  sentenceLengthBaseline: number;
  thresholds: VerdictThresholds;
}

// Language-specific calibrations derived from multilingual evaluation benchmarks.
// Temperature > 1 spreads probabilities (reduces overconfidence); < 1 sharpens.
// Bias shifts the log-odds toward AI (positive) or human (negative).
export const LANGUAGE_CALIBRATION: Record<string, LanguageCalibration> = {
  en: {
    aiPrior: 0.5,
    temperature: 1.0,
    bias: 0,
    aiSensitivityMultiplier: 1.0,
    humanToleranceMultiplier: 1.0,
    formalPenaltyAdd: 0,
    transitionSensitivity: 0.0,
    burstinessWeight: 0.0,
    lexicalDiversityBaseline: 0.55,
    sentenceLengthBaseline: 18,
    thresholds: {
      likelyAi: 75,
      mostlyAi: 55,
      mixed: 35,
      mostlyHuman: 55,
      likelyHuman: 70,
      margin: 15,
    },
  },
  es: {
    aiPrior: 0.5,
    temperature: 0.85,
    bias: 0.12,
    aiSensitivityMultiplier: 1.25,
    humanToleranceMultiplier: 0.78,
    formalPenaltyAdd: 0.1,
    transitionSensitivity: 0.28,
    burstinessWeight: 0.18,
    lexicalDiversityBaseline: 0.62,
    sentenceLengthBaseline: 22,
    thresholds: {
      likelyAi: 68,
      mostlyAi: 48,
      mixed: 30,
      mostlyHuman: 48,
      likelyHuman: 62,
      margin: 12,
    },
  },
  fr: {
    aiPrior: 0.5,
    temperature: 0.97,
    bias: 0.05,
    aiSensitivityMultiplier: 1.1,
    humanToleranceMultiplier: 0.9,
    formalPenaltyAdd: 0.05,
    transitionSensitivity: 0.12,
    burstinessWeight: 0.05,
    lexicalDiversityBaseline: 0.58,
    sentenceLengthBaseline: 19,
    thresholds: {
      likelyAi: 72,
      mostlyAi: 52,
      mixed: 33,
      mostlyHuman: 52,
      likelyHuman: 67,
      margin: 13,
    },
  },
  de: {
    aiPrior: 0.5,
    temperature: 0.98,
    bias: 0.05,
    aiSensitivityMultiplier: 1.08,
    humanToleranceMultiplier: 0.92,
    formalPenaltyAdd: 0.05,
    transitionSensitivity: 0.1,
    burstinessWeight: 0.05,
    lexicalDiversityBaseline: 0.57,
    sentenceLengthBaseline: 19,
    thresholds: {
      likelyAi: 72,
      mostlyAi: 52,
      mixed: 33,
      mostlyHuman: 52,
      likelyHuman: 67,
      margin: 13,
    },
  },
  pt: {
    aiPrior: 0.5,
    temperature: 0.96,
    bias: 0.06,
    aiSensitivityMultiplier: 1.12,
    humanToleranceMultiplier: 0.88,
    formalPenaltyAdd: 0.06,
    transitionSensitivity: 0.14,
    burstinessWeight: 0.08,
    lexicalDiversityBaseline: 0.59,
    sentenceLengthBaseline: 20,
    thresholds: {
      likelyAi: 71,
      mostlyAi: 51,
      mixed: 32,
      mostlyHuman: 51,
      likelyHuman: 66,
      margin: 12,
    },
  },
  it: {
    aiPrior: 0.5,
    temperature: 0.97,
    bias: 0.05,
    aiSensitivityMultiplier: 1.1,
    humanToleranceMultiplier: 0.9,
    formalPenaltyAdd: 0.05,
    transitionSensitivity: 0.12,
    burstinessWeight: 0.05,
    lexicalDiversityBaseline: 0.58,
    sentenceLengthBaseline: 19,
    thresholds: {
      likelyAi: 72,
      mostlyAi: 52,
      mixed: 33,
      mostlyHuman: 52,
      likelyHuman: 67,
      margin: 13,
    },
  },
  zh: {
    aiPrior: 0.5,
    temperature: 1.05,
    bias: 0.04,
    aiSensitivityMultiplier: 1.05,
    humanToleranceMultiplier: 0.95,
    formalPenaltyAdd: 0.04,
    transitionSensitivity: 0.1,
    burstinessWeight: 0.05,
    lexicalDiversityBaseline: 0.62,
    sentenceLengthBaseline: 22,
    thresholds: {
      likelyAi: 73,
      mostlyAi: 53,
      mixed: 34,
      mostlyHuman: 53,
      likelyHuman: 68,
      margin: 14,
    },
  },
  ja: {
    aiPrior: 0.5,
    temperature: 1.05,
    bias: 0.04,
    aiSensitivityMultiplier: 1.05,
    humanToleranceMultiplier: 0.95,
    formalPenaltyAdd: 0.04,
    transitionSensitivity: 0.08,
    burstinessWeight: 0.05,
    lexicalDiversityBaseline: 0.6,
    sentenceLengthBaseline: 21,
    thresholds: {
      likelyAi: 73,
      mostlyAi: 53,
      mixed: 34,
      mostlyHuman: 53,
      likelyHuman: 68,
      margin: 14,
    },
  },
  ko: {
    aiPrior: 0.5,
    temperature: 1.05,
    bias: 0.04,
    aiSensitivityMultiplier: 1.05,
    humanToleranceMultiplier: 0.95,
    formalPenaltyAdd: 0.04,
    transitionSensitivity: 0.08,
    burstinessWeight: 0.05,
    lexicalDiversityBaseline: 0.6,
    sentenceLengthBaseline: 21,
    thresholds: {
      likelyAi: 73,
      mostlyAi: 53,
      mixed: 34,
      mostlyHuman: 53,
      likelyHuman: 68,
      margin: 14,
    },
  },
  ar: {
    aiPrior: 0.5,
    temperature: 0.98,
    bias: 0.05,
    aiSensitivityMultiplier: 1.08,
    humanToleranceMultiplier: 0.92,
    formalPenaltyAdd: 0.05,
    transitionSensitivity: 0.1,
    burstinessWeight: 0.05,
    lexicalDiversityBaseline: 0.57,
    sentenceLengthBaseline: 19,
    thresholds: {
      likelyAi: 72,
      mostlyAi: 52,
      mixed: 33,
      mostlyHuman: 52,
      likelyHuman: 67,
      margin: 13,
    },
  },
  hi: {
    aiPrior: 0.5,
    temperature: 1.02,
    bias: 0.04,
    aiSensitivityMultiplier: 1.05,
    humanToleranceMultiplier: 0.95,
    formalPenaltyAdd: 0.04,
    transitionSensitivity: 0.08,
    burstinessWeight: 0.05,
    lexicalDiversityBaseline: 0.58,
    sentenceLengthBaseline: 20,
    thresholds: {
      likelyAi: 72,
      mostlyAi: 52,
      mixed: 33,
      mostlyHuman: 52,
      likelyHuman: 67,
      margin: 13,
    },
  },
  ru: {
    aiPrior: 0.5,
    temperature: 0.98,
    bias: 0.05,
    aiSensitivityMultiplier: 1.08,
    humanToleranceMultiplier: 0.92,
    formalPenaltyAdd: 0.05,
    transitionSensitivity: 0.1,
    burstinessWeight: 0.05,
    lexicalDiversityBaseline: 0.57,
    sentenceLengthBaseline: 19,
    thresholds: {
      likelyAi: 72,
      mostlyAi: 52,
      mixed: 33,
      mostlyHuman: 52,
      likelyHuman: 67,
      margin: 13,
    },
  },
  yo: {
    aiPrior: 0.5,
    temperature: 1.0,
    bias: 0,
    aiSensitivityMultiplier: 1.0,
    humanToleranceMultiplier: 1.0,
    formalPenaltyAdd: 0,
    transitionSensitivity: 0,
    burstinessWeight: 0,
    lexicalDiversityBaseline: 0.55,
    sentenceLengthBaseline: 17,
    thresholds: {
      likelyAi: 75,
      mostlyAi: 55,
      mixed: 35,
      mostlyHuman: 55,
      likelyHuman: 70,
      margin: 15,
    },
  },
  ha: {
    aiPrior: 0.5,
    temperature: 1.0,
    bias: 0,
    aiSensitivityMultiplier: 1.0,
    humanToleranceMultiplier: 1.0,
    formalPenaltyAdd: 0,
    transitionSensitivity: 0,
    burstinessWeight: 0,
    lexicalDiversityBaseline: 0.55,
    sentenceLengthBaseline: 17,
    thresholds: {
      likelyAi: 75,
      mostlyAi: 55,
      mixed: 35,
      mostlyHuman: 55,
      likelyHuman: 70,
      margin: 15,
    },
  },
  ig: {
    aiPrior: 0.5,
    temperature: 1.0,
    bias: 0,
    aiSensitivityMultiplier: 1.0,
    humanToleranceMultiplier: 1.0,
    formalPenaltyAdd: 0,
    transitionSensitivity: 0,
    burstinessWeight: 0,
    lexicalDiversityBaseline: 0.55,
    sentenceLengthBaseline: 17,
    thresholds: {
      likelyAi: 75,
      mostlyAi: 55,
      mixed: 35,
      mostlyHuman: 55,
      likelyHuman: 70,
      margin: 15,
    },
  },
  // Conservative defaults for any unsupported or low-resource language.
  default: {
    aiPrior: 0.5,
    temperature: 1.1,
    bias: 0,
    aiSensitivityMultiplier: 1.0,
    humanToleranceMultiplier: 1.0,
    formalPenaltyAdd: 0,
    transitionSensitivity: 0,
    burstinessWeight: 0,
    lexicalDiversityBaseline: 0.55,
    sentenceLengthBaseline: 18,
    thresholds: {
      likelyAi: 75,
      mostlyAi: 55,
      mixed: 35,
      mostlyHuman: 55,
      likelyHuman: 70,
      margin: 15,
    },
  },
};

export const CONTENT_TYPE_BIAS: Record<ContentType, number> = {
  auto: 0,
  academic: 0.35,
  research: 0.35,
  business: 0.15,
  technical: 0.25,
  legal: 0.25,
  seo: 0.45,
  product: 0.15,
  blog: 0.2,
  news: 0,
  email: -0.2,
  job: 0,
  creative: -0.35,
  social: -0.35,
  student: 0.1,
};

export function getLanguageCalibration(languageCode: string): LanguageCalibration {
  return LANGUAGE_CALIBRATION[languageCode] || LANGUAGE_CALIBRATION.default;
}

export function calibrateProbability(
  rawLogOdds: number,
  languageCode: string,
  contentType: ContentType,
): number {
  const cal = getLanguageCalibration(languageCode);
  const contentBias = CONTENT_TYPE_BIAS[contentType] ?? 0;
  const scaled = rawLogOdds / cal.temperature;
  const biased = scaled + cal.bias + contentBias;
  const p = 1 / (1 + Math.exp(-biased));
  return Math.min(1, Math.max(0, p));
}

export function confidenceFromDistribution(
  ai: number,
  human: number,
  mixed: number,
  languageReliability: number,
  textLengthFactor: number,
  layerAgreement: number,
): number {
  const sorted = [ai, human, mixed].sort((a, b) => b - a);
  const max = sorted[0];
  const margin = sorted[0] - sorted[1];
  // Confidence is driven by the top-class probability and the margin over the runner-up.
  // A small entropy-like penalty is applied through the margin term rather than full
  // three-way entropy so that a clear leading class is not undermined by residual mixed mass.
  const adjusted = (max / 100) * (0.6 + 0.4 * Math.min(1, margin / 30));
  return Math.min(1, Math.max(0, adjusted * languageReliability * textLengthFactor * (0.5 + 0.5 * layerAgreement)));
}

// Helper to reduce overconfidence when language support is limited or text is short.
export function languageReliabilityFactor(
  languageCode: string,
  languageConfidence: number,
  isSupported: boolean,
): number {
  if (!isSupported) return 0.6;
  if (languageConfidence >= 80) return 1;
  if (languageConfidence >= 50) return 0.9;
  return 0.75;
}
