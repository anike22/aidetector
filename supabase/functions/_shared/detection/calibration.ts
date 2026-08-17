import type { ContentType } from './types.ts';

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
    // Reduced from 0.55 → 0.48: formal human writing has lexDiv ~0.52-0.65,
    // which was previously scoring barely above baseline and generating almost
    // no human signal. AI writing clusters at ~0.40-0.45, well below 0.48.
    lexicalDiversityBaseline: 0.48,
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

// Content-type prior bias applied to log-odds before sigmoid calibration.
// IMPORTANT: These biases encode the PRIOR probability that a given content
// type was AI-generated, not a sensitivity multiplier.
//
// v2.5.1 changes — removed positive bias for formal content types:
//   academic/research: 0.35 → -0.20  (formal writing is NOT an AI prior;
//     academic papers are predominantly human; positive bias caused the
//     77%-AI false positive on the formal-human validation sample)
//   legal/technical:   0.25 → -0.15  (same reasoning)
//   business:          0.15 → 0.05   (slight reduction)
//   blog:              0.20 unchanged (default prior for general web text)
//   seo:               0.45 → 0.40   (SEO content is disproportionately AI)
export const CONTENT_TYPE_BIAS: Record<ContentType, number> = {
  auto:      0,
  academic: -0.20,
  research: -0.20,
  business:  0.05,
  technical: -0.15,
  legal:     -0.15,
  seo:        0.40,
  product:    0.15,
  blog:       0.20,
  news:       0,
  email:     -0.20,
  job:        0,
  creative:  -0.35,
  social:    -0.35,
  student:    0.10,
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

// ---------------------------------------------------------------------------
// Spanish-specific calibration constants (inlined here to avoid a separate
// edge-function module that the bundler may not resolve).
// ---------------------------------------------------------------------------

export interface SpanishThresholds {
  likelyAi: number;
  mostlyAi: number;
  mixed: number;
  mostlyHuman: number;
  likelyHuman: number;
  margin: number;
}

export interface SpanishFeatureWeights {
  ai: {
    transition: number;
    syntacticRegularity: number;
    semanticRedundancy: number;
    formulaicStartEnd: number;
    balancedPhrasing: number;
    vocabularyDistribution: number;
    paragraphSymmetry: number;
    lexicalRepetition: number;
    discourseFlow: number;
    boilerplate: number;
    phraseReuse: number;
    tokenPredictability: number;
    repetitionDensity: number;
    lowBurstiness: number;
    ngramRepetition: number;
    vocabularyCompression: number;
    statPhraseReuse: number;
    sentenceSignal: number;
    paragraphSignal: number;
  };
  human: {
    lexicalDiversity: number;
    sentenceLengthVariance: number;
    transitionUnpredictability: number;
    unformulaic: number;
    stylisticVariation: number;
    editingCoherence: number;
    burstiness: number;
    ngramUniqueness: number;
    sentenceVariance: number;
    coherence: number;
  };
  mixed: {
    conflict: number;
  };
}

export const SPANISH_CALIBRATION = {
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
  featureWeights: {
    ai: {
      transition: 1.2,
      syntacticRegularity: 0.9,
      semanticRedundancy: 0.85,
      formulaicStartEnd: 2.0,
      balancedPhrasing: 0.7,
      vocabularyDistribution: 0.6,
      paragraphSymmetry: 0.6,
      lexicalRepetition: 1.0,
      discourseFlow: 0.65,
      boilerplate: 1.1,
      phraseReuse: 0.65,
      tokenPredictability: 0.85,
      repetitionDensity: 0.7,
      lowBurstiness: 0.9,
      ngramRepetition: 0.6,
      vocabularyCompression: 0.5,
      statPhraseReuse: 0.55,
      sentenceSignal: 1.25,
      paragraphSignal: 0.85,
    },
    human: {
      lexicalDiversity: 0.75,
      sentenceLengthVariance: 0.85,
      transitionUnpredictability: 0.65,
      unformulaic: 0.85,
      stylisticVariation: 0.9,
      editingCoherence: 0.45,
      burstiness: 0.85,
      ngramUniqueness: 0.65,
      sentenceVariance: 0.6,
      coherence: 0.45,
    },
    mixed: {
      conflict: 1.3,
    },
  },
};

export interface SpanishContentWeights {
  aiSensitivity: number;
  humanTolerance: number;
  formalPenalty: number;
}

export const SPANISH_CONTENT_WEIGHTS: Record<Exclude<ContentType, 'auto'>, SpanishContentWeights> = {
  academic: { aiSensitivity: 1.1, humanTolerance: 0.95, formalPenalty: 0.2 },
  research: { aiSensitivity: 1.1, humanTolerance: 0.95, formalPenalty: 0.2 },
  blog: { aiSensitivity: 1, humanTolerance: 1.05, formalPenalty: 0.08 },
  seo: { aiSensitivity: 1.25, humanTolerance: 0.85, formalPenalty: 0.08 },
  news: { aiSensitivity: 0.95, humanTolerance: 1.05, formalPenalty: 0.08 },
  business: { aiSensitivity: 1.05, humanTolerance: 1, formalPenalty: 0.12 },
  email: { aiSensitivity: 0.85, humanTolerance: 1.15, formalPenalty: 0 },
  job: { aiSensitivity: 1.05, humanTolerance: 1, formalPenalty: 0.1 },
  legal: { aiSensitivity: 1.15, humanTolerance: 0.9, formalPenalty: 0.25 },
  technical: { aiSensitivity: 1.1, humanTolerance: 0.95, formalPenalty: 0.18 },
  creative: { aiSensitivity: 0.8, humanTolerance: 1.3, formalPenalty: 0 },
  social: { aiSensitivity: 0.8, humanTolerance: 1.3, formalPenalty: 0 },
  product: { aiSensitivity: 1.15, humanTolerance: 0.9, formalPenalty: 0.08 },
  student: { aiSensitivity: 1.05, humanTolerance: 1.05, formalPenalty: 0.08 },
};

export const SPANISH_AI_TRANSITIONS = [
  'además', 'por lo tanto', 'en consecuencia', 'por consiguiente', 'en conclusión', 'en resumen',
  'en definitiva', 'es importante destacar', 'es fundamental señalar', 'es relevante mencionar',
  'por ejemplo', 'por otro lado', 'a su vez', 'asimismo', 'en última instancia', 'en síntesis',
  'en este sentido', 'en el ámbito de', 'en el contexto de', 'en primer lugar', 'en segundo lugar',
  'en tercer lugar', 'finalmente', 'para empezar', 'de igual manera', 'de manera similar',
  'no obstante', 'sin embargo', 'a modo de conclusión', 'como se ha mencionado', 'como se puede observar',
  'vale la pena destacar', 'cabe señalar', 'es importante resaltar', 'resulta evidente que',
  'no cabe duda de que', 'en términos generales', 'desde esta perspectiva', 'en líneas generales',
];

export const SPANISH_FORMULAIC_STARTS = [
  'en la actualidad', 'en los últimos años', 'en el siglo', 'en el contexto actual',
  'la inteligencia artificial', 'la tecnología', 'el desarrollo de', 'el presente trabajo',
  'en el ámbito de', 'en este ensayo', 'el objetivo de este', 'es importante señalar',
  'el rápido desarrollo de', 'este artículo explora', 'en este artículo se analiza',
  'a lo largo de la historia', 'en la sociedad actual', 'dado el contexto',
  'en las últimas décadas', 'con el avance de',
];

export const SPANISH_FORMULAIC_ENDS = [
  'en conclusión', 'en resumen', 'en definitiva', 'en última instancia', 'en síntesis',
  'este ensayo ha demostrado', 'estos hallazgos sugieren', 'en conclusión, se puede afirmar',
  'para concluir', 'como conclusión final', 'a modo de cierre',
];

export const SPANISH_AI_BOILERPLATE = [
  'desempeña un papel crucial', 'desempeña un papel importante', 'desempeña un papel fundamental',
  'juega un papel crucial', 'juega un papel importante', 'juega un papel fundamental',
  'una amplia gama de', 'una gran variedad de', 'un gran número de', 'en orden de',
  'debido a que', 'en la era de', 'con la llegada de', 'en el marco de',
  'tiene como objetivo', 'tiene por finalidad', 'se hace necesario', 'resulta fundamental',
  'representa un desafío', 'plantea un reto', 'constituye una oportunidad',
  'resulta imprescindible', 'resulta necesario', 'se hace imprescindible',
];

export const SPANISH_HUMAN_MARKERS = [
  'la verdad', 'o sea', 'entonces', 'bueno', 'pues', 'vamos', 'mira', 'oye',
  'qué sé yo', 'ni idea', 'a ver', 'total', 'de verdad', 'en serio', 'vale',
  'coño', 'joder', 'carajo', 'chido', 'padre', 'chévere', 'guay', 'mola',
  'me parece', 'yo creo que', 'pienso que', 'siento que', 'me da la impresión',
  'a mi parecer', 'en mi opinión', 'desde mi punto de vista',
];

function spanishSigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function calibrateSpanishProbability(rawLogOdds: number, contentType: ContentType): number {
  const contentBias: Record<ContentType, number> = {
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
    creative: -0.45,
    social: -0.45,
    student: 0.1,
  };
  const scaled = rawLogOdds / SPANISH_CALIBRATION.temperature;
  const biased = scaled + SPANISH_CALIBRATION.bias + (contentBias[contentType] ?? 0);
  return Math.min(1, Math.max(0, spanishSigmoid(biased)));
}

export function spanishConfidenceFromDistribution(
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
  const runnerUp = sorted[1];
  const conflictPenalty = runnerUp > 30 ? 0.6 + 0.4 * (1 - runnerUp / 100) : 1;
  const base = (max / 100) * (0.45 + 0.55 * Math.min(1, margin / 30));
  return Math.min(1, base * languageReliability * textLengthFactor * (0.5 + 0.5 * layerAgreement) * conflictPenalty);
}

export function spanishLanguageReliability(languageConfidence: number, isSupported: boolean): number {
  if (!isSupported) return 0.55;
  if (languageConfidence >= 80) return 1;
  if (languageConfidence >= 50) return 0.88;
  return 0.72;
}

export function getSpanishContentWeights(contentType: ContentType): SpanishContentWeights {
  if (contentType === 'auto') return SPANISH_CONTENT_WEIGHTS.blog;
  return SPANISH_CONTENT_WEIGHTS[contentType] ?? SPANISH_CONTENT_WEIGHTS.blog;
}


// ---------------------------------------------------------------------------
// Arabic-specific calibration and feature lists (inlined for Deno bundler)
// ---------------------------------------------------------------------------

export interface ArabicThresholds {
  likelyAi: number;
  mostlyAi: number;
  mixed: number;
  mostlyHuman: number;
  likelyHuman: number;
  margin: number;
}

export interface ArabicContentWeights {
  aiSensitivity: number;
  humanTolerance: number;
  formalPenalty: number;
}

export interface ArabicFeatureWeights {
  ai: {
    transition: number;
    syntacticRegularity: number;
    semanticRedundancy: number;
    formulaicStartEnd: number;
    balancedPhrasing: number;
    vocabularyDistribution: number;
    paragraphSymmetry: number;
    lexicalRepetition: number;
    discourseFlow: number;
    boilerplate: number;
    phraseReuse: number;
    tokenPredictability: number;
    repetitionDensity: number;
    lowBurstiness: number;
    ngramRepetition: number;
    vocabularyCompression: number;
    statPhraseReuse: number;
    sentenceSignal: number;
    paragraphSignal: number;
  };
  human: {
    lexicalDiversity: number;
    sentenceLengthVariance: number;
    transitionUnpredictability: number;
    unformulaic: number;
    stylisticVariation: number;
    editingCoherence: number;
    burstiness: number;
    ngramUniqueness: number;
    sentenceVariance: number;
    coherence: number;
    informalMarker: number;
  };
  mixed: {
    conflict: number;
  };
}

export const ARABIC_CALIBRATION = {
  temperature: 0.82,
  bias: 0.15,
  aiSensitivityMultiplier: 1.22,
  humanToleranceMultiplier: 0.82,
  formalPenaltyAdd: 0.12,
  transitionSensitivity: 0.32,
  burstinessWeight: 0.22,
  lexicalDiversityBaseline: 0.55,
  sentenceLengthBaseline: 23,
  thresholds: {
    likelyAi: 67,
    mostlyAi: 47,
    mixed: 30,
    mostlyHuman: 47,
    likelyHuman: 62,
    margin: 12,
  } satisfies ArabicThresholds,
  featureWeights: {
    ai: {
      transition: 1.35,
      syntacticRegularity: 0.9,
      semanticRedundancy: 0.85,
      formulaicStartEnd: 2.1,
      balancedPhrasing: 0.7,
      vocabularyDistribution: 0.6,
      paragraphSymmetry: 0.6,
      lexicalRepetition: 1.05,
      discourseFlow: 0.65,
      boilerplate: 1.15,
      phraseReuse: 0.65,
      tokenPredictability: 0.85,
      repetitionDensity: 0.7,
      lowBurstiness: 0.95,
      ngramRepetition: 0.6,
      vocabularyCompression: 0.5,
      statPhraseReuse: 0.55,
      sentenceSignal: 1.25,
      paragraphSignal: 0.85,
    },
    human: {
      lexicalDiversity: 0.75,
      sentenceLengthVariance: 0.85,
      transitionUnpredictability: 0.65,
      unformulaic: 0.85,
      stylisticVariation: 0.9,
      editingCoherence: 0.45,
      burstiness: 0.9,
      ngramUniqueness: 0.65,
      sentenceVariance: 0.6,
      coherence: 0.45,
      informalMarker: 0.9,
    },
    mixed: {
      conflict: 1.25,
    },
  } satisfies ArabicFeatureWeights,
};

const ARABIC_CONTENT_WEIGHTS: Record<Exclude<ContentType, 'auto'>, ArabicContentWeights> = {
  academic: { aiSensitivity: 1.08, humanTolerance: 1, formalPenalty: 0.18 },
  research: { aiSensitivity: 1.08, humanTolerance: 1, formalPenalty: 0.18 },
  business: { aiSensitivity: 1.05, humanTolerance: 1, formalPenalty: 0.12 },
  technical: { aiSensitivity: 1.08, humanTolerance: 0.95, formalPenalty: 0.17 },
  legal: { aiSensitivity: 1.08, humanTolerance: 0.95, formalPenalty: 0.18 },
  seo: { aiSensitivity: 1.22, humanTolerance: 0.9, formalPenalty: 0.05 },
  product: { aiSensitivity: 1.15, humanTolerance: 0.9, formalPenalty: 0.08 },
  blog: { aiSensitivity: 1, humanTolerance: 1.1, formalPenalty: 0.05 },
  news: { aiSensitivity: 1, humanTolerance: 1.05, formalPenalty: 0.1 },
  email: { aiSensitivity: 0.9, humanTolerance: 1.1, formalPenalty: 0 },
  job: { aiSensitivity: 1.05, humanTolerance: 1, formalPenalty: 0.1 },
  creative: { aiSensitivity: 0.85, humanTolerance: 1.2, formalPenalty: 0 },
  social: { aiSensitivity: 0.85, humanTolerance: 1.25, formalPenalty: 0 },
  student: { aiSensitivity: 1.05, humanTolerance: 1.05, formalPenalty: 0.05 },
};

export const ARABIC_AI_TRANSITIONS = [
  'بالإضافة إلى ذلك', 'علاوة على ذلك', 'فضلاً عن ذلك', 'لذلك', 'وبالتالي', 'من ثم',
  'من ناحية أخرى', 'على الجانب الآخر', 'على سبيل المثال', 'كمثال على ذلك', 'في الختام',
  'إلى ذلك من أمور', 'في هذا السياق', 'في إطار', 'في ظل', 'بناءً على ما تقدم',
  'كما هو مذكور', 'كما يتضح', 'يجدر بالذكر', 'من الجدير بالذكر', 'لا شك أن',
  'من المهم التأكيد على', 'في النهاية', 'باختصار', 'على الرغم من ذلك',
];

export const ARABIC_FORMULAIC_STARTS = [
  'يعد', 'تعد', 'يعتبر', 'تعتبر', 'في عصر', 'في ظل', 'في إطار', 'في ظل التطور',
  'في ظل التقدم', 'مع التطور', 'مع التقدم', 'شهد العالم', 'شهدت', 'في الوقت الحاضر',
  'في العصر الحديث', 'في القرن', 'لقد أصبح', 'أصبح', 'لقد أصبحت', 'لا يمكن إنكار',
  'لا يمكن تجاهل', 'من المعروف أن', 'من المعلوم أن', 'يلعب', 'تؤدي', 'تعتبر من',
];

export const ARABIC_FORMULAIC_ENDS = [
  'في الختام', 'إلى جانب ما سبق', 'وبناءً على ما تقدم', 'يمكن القول', 'خلاصة القول',
  'في النهاية', 'ختاماً', 'في الإجمال', 'على المستوى', 'من المتوقع أن', 'تظل',
  'مما يؤكد على', 'مما يعزز', 'وهذا ما يدعو',
];

export const ARABIC_AI_BOILERPLATE = [
  'يلعب دوراً محورياً', 'يلعب دوراً هاماً', 'يلعب دوراً كبيراً', 'يؤدي دوراً حيوياً',
  'أدى إلى', 'نتج عنه', 'لهذا السبب', 'نظراً لأن', 'بفضل', 'من خلال', 'باستخدام',
  'في مجال', 'على صعيد', 'على مستوى', 'في ظل التطور التكنولوجي', 'مع التقدم التكنولوجي',
  'في عالم يشهد', 'لا يمكن الاستغناء عن', 'من أهم التحديات', 'من أبرز التحديات', 'من الأمور التي',
];

export const ARABIC_HUMAN_MARKERS = [
  'والله', 'صراحة', 'يعني', 'كده', 'يعني كده', 'بجد', 'فعلاً', 'أصلاً', 'أنا مش',
  'مش عارف', 'مش فاهم', 'يا ريت', 'يا سلام', 'يا جدعان', 'اللي', 'الناس دي', 'كله',
  'أي حاجة', 'أي شي', 'حصل', 'حصلي', 'كنت', 'بقول', 'بافكر', 'ممكن', 'كأن', 'كأني',
  'بص', 'شوفت', 'سمعت',
];

export function calibrateArabicProbability(rawLogOdds: number, contentType: ContentType): number {
  const contentBias: Record<ContentType, number> = {
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
    creative: -0.45,
    social: -0.45,
    student: 0.1,
  };
  const sensitivityPenalty = ((ARABIC_CONTENT_WEIGHTS[contentType]?.aiSensitivity ?? 1) - 1) * 0.05;
  const scaled = rawLogOdds / ARABIC_CALIBRATION.temperature;
  const biased = scaled + ARABIC_CALIBRATION.bias + ARABIC_CALIBRATION.formalPenaltyAdd + (contentBias[contentType] ?? 0) + sensitivityPenalty;
  return Math.min(1, Math.max(0, 1 / (1 + Math.exp(-biased))));
}

export function arabicConfidenceFromDistribution(
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
  const adjusted = (max / 100) * (0.6 + 0.4 * Math.min(1, margin / 30));
  return Math.min(1, Math.max(0, adjusted * languageReliability * textLengthFactor * (0.5 + 0.5 * layerAgreement)));
}

export function arabicLanguageReliability(languageConfidence: number, isSupported: boolean): number {
  if (!isSupported) return 0.6;
  if (languageConfidence >= 80) return 1;
  if (languageConfidence >= 50) return 0.9;
  return 0.75;
}

export function getArabicContentWeights(contentType: ContentType): ArabicContentWeights {
  return contentType === 'auto'
    ? ARABIC_CONTENT_WEIGHTS.blog
    : (ARABIC_CONTENT_WEIGHTS[contentType] ?? ARABIC_CONTENT_WEIGHTS.blog);
}

export function normalize(value: number, min: number, max: number): number {
  if (max === min) return value > max ? 1 : 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}
