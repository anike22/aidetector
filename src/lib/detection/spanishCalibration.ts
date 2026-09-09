import type { ContentType } from './types';

export interface SpanishThresholds {
  likelyAi: number;
  mostlyAi: number;
  mixed: number;
  mostlyHuman: number;
  likelyHuman: number;
  margin: number;
}

export interface SpanishContentWeights {
  aiSensitivity: number;
  humanTolerance: number;
  formalPenalty: number;
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

/**
 * Independent Spanish calibration profile.
 * Derived from the observation that formal Spanish AI text tends to use a
 * narrower set of academic transitions, symmetrical paragraphs and balanced
 * conclusions, while human Spanish shows higher burstiness, richer idiomatic
 * usage and less predictable paragraph boundaries.
 */
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
  } satisfies SpanishThresholds,
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
  } satisfies SpanishFeatureWeights,
};

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
  // Colloquial / regional / affective markers that are rare in formal AI output
  'la verdad', 'o sea', 'entonces', 'bueno', 'pues', 'vamos', 'mira', 'oye',
  'qué sé yo', 'ni idea', 'a ver', 'total', 'de verdad', 'en serio', 'vale',
  'coño', 'joder', 'carajo', 'chido', 'padre', 'chévere', 'guay', 'mola',
  'me parece', 'yo creo que', 'pienso que', 'siento que', 'me da la impresión',
  'a mi parecer', 'en mi opinión', 'desde mi punto de vista',
];

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function normalize(value: number, min: number, max: number): number {
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

export function calibrateSpanishProbability(
  rawLogOdds: number,
  contentType: ContentType,
): number {
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
  return Math.min(1, Math.max(0, sigmoid(biased)));
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
  // Strongly penalise close two-way or three-way splits.
  const conflictPenalty = runnerUp > 30 ? 0.6 + 0.4 * (1 - runnerUp / 100) : 1;
  const base = (max / 100) * (0.45 + 0.55 * Math.min(1, margin / 30));
  return Math.min(1, base * languageReliability * textLengthFactor * (0.5 + 0.5 * layerAgreement) * conflictPenalty);
}

export function spanishLanguageReliability(
  languageConfidence: number,
  isSupported: boolean,
): number {
  if (!isSupported) return 0.55;
  if (languageConfidence >= 80) return 1;
  if (languageConfidence >= 50) return 0.88;
  return 0.72;
}

export function getSpanishContentWeights(contentType: ContentType): SpanishContentWeights {
  if (contentType === 'auto') return SPANISH_CONTENT_WEIGHTS.blog;
  return SPANISH_CONTENT_WEIGHTS[contentType] ?? SPANISH_CONTENT_WEIGHTS.blog;
}

export { normalize, sigmoid };
