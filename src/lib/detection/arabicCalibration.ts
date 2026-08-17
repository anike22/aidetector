import type { ContentType } from './types';

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

/**
 * Independent Arabic calibration profile.
 * Arabic AI-generated formal text tends to rely on heavy connector phrases,
 * symmetrical paragraph openings, and boilerplate academic expressions.
 * Human Arabic (especially dialect or informal writing) shows higher burstiness,
 * idiomatic markers, and irregular paragraph boundaries.
 */
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

export const ARABIC_AI_TRANSITIONS = [
  'بالإضافة إلى ذلك',
  'علاوة على ذلك',
  'فضلاً عن ذلك',
  'لذلك',
  'وبالتالي',
  'من ثم',
  'من ناحية أخرى',
  'على الجانب الآخر',
  'على سبيل المثال',
  'كمثال على ذلك',
  'في الختام',
  'إلى ذلك من أمور',
  'في هذا السياق',
  'في إطار',
  'في ظل',
  'بناءً على ما تقدم',
  'كما هو مذكور',
  'كما يتضح',
  'يجدر بالذكر',
  'من الجدير بالذكر',
  'لا شك أن',
  'من المهم التأكيد على',
  'في النهاية',
  'باختصار',
  'على الرغم من ذلك',
];

export const ARABIC_FORMULAIC_STARTS = [
  'يعد',
  'تعد',
  'يعتبر',
  'تعتبر',
  'في عصر',
  'في ظل',
  'في إطار',
  'في ظل التطور',
  'في ظل التقدم',
  'مع التطور',
  'مع التقدم',
  'شهد العالم',
  'شهدت',
  'في الوقت الحاضر',
  'في العصر الحديث',
  'في القرن',
  'لقد أصبح',
  'أصبح',
  'لقد أصبحت',
  'لا يمكن إنكار',
  'لا يمكن تجاهل',
  'من المعروف أن',
  'من المعلوم أن',
  'يلعب',
  'تؤدي',
  'تعتبر من',
];

export const ARABIC_FORMULAIC_ENDS = [
  'في الختام',
  'إلى جانب ما سبق',
  'وبناءً على ما تقدم',
  'يمكن القول',
  'خلاصة القول',
  'في النهاية',
  'ختاماً',
  'في الإجمال',
  'على المستوى',
  'من المتوقع أن',
  'تظل',
  'مما يؤكد على',
  'مما يعزز',
  'وهذا ما يدعو',
];

export const ARABIC_AI_BOILERPLATE = [
  'يلعب دوراً محورياً',
  'يلعب دوراً هاماً',
  'يلعب دوراً كبيراً',
  'يؤدي دوراً حيوياً',
  'أدى إلى',
  'نتج عنه',
  'لهذا السبب',
  'نظراً لأن',
  'بفضل',
  'من خلال',
  'باستخدام',
  'في مجال',
  'على صعيد',
  'على مستوى',
  'في ظل التطور التكنولوجي',
  'مع التقدم التكنولوجي',
  'في عالم يشهد',
  'لا يمكن الاستغناء عن',
  'من أهم التحديات',
  'من أبرز التحديات',
  'من الأمور التي',
];

export const ARABIC_HUMAN_MARKERS = [
  'والله',
  'صراحة',
  'يعني',
  'كده',
  'يعني كده',
  'بجد',
  'فعلاً',
  'أصلاً',
  'أنا مش',
  'مش عارف',
  'مش فاهم',
  'يا ريت',
  'يا سلام',
  'يا جدعان',
  'اللي',
  'الناس دي',
  'كله',
  'أي حاجة',
  'أي شي',
  'حصل',
  'حصلي',
  'كنت',
  'بقول',
  'بافكر',
  'ممكن',
  'كأن',
  'كأني',
  'بص',
  'شوفت',
  'سمعت',
];

const CONTENT_TYPE_WEIGHTS: Record<Exclude<ContentType, 'auto'>, ArabicContentWeights> = {
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

export function getArabicContentWeights(contentType: ContentType): ArabicContentWeights {
  return contentType === 'auto' ? CONTENT_TYPE_WEIGHTS.blog : CONTENT_TYPE_WEIGHTS[contentType];
}

export function normalize(value: number, min: number, max: number): number {
  if (max <= min) return value >= max ? 1 : 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

export function calibrateArabicProbability(logOddsAi: number, contentType: ContentType = 'auto'): number {
  const cal = ARABIC_CALIBRATION;
  const weights = getArabicContentWeights(contentType);
  const sensitivityPenalty = (weights.aiSensitivity - 1) * 0.05;
  const scaled = logOddsAi / cal.temperature;
  const biased = scaled + cal.bias + cal.formalPenaltyAdd + sensitivityPenalty;
  const p = 1 / (1 + Math.exp(-biased));
  return Math.min(1, Math.max(0, p));
}

export function arabicLanguageReliability(languageConfidence: number, isSupported: boolean): number {
  if (!isSupported) return 0.6;
  if (languageConfidence >= 80) return 1;
  if (languageConfidence >= 50) return 0.9;
  return 0.75;
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
