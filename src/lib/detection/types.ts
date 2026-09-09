export type ContentType =
  | 'academic'
  | 'research'
  | 'blog'
  | 'seo'
  | 'news'
  | 'business'
  | 'email'
  | 'job'
  | 'legal'
  | 'technical'
  | 'creative'
  | 'social'
  | 'product'
  | 'student'
  | 'auto';

export type Verdict =
  | 'likely-human'
  | 'mostly-human-ai-assisted'
  | 'mixed'
  | 'mostly-ai-human-edited'
  | 'likely-ai'
  | 'inconclusive'
  | 'insufficient-text';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type ConfidenceLevel = 'Low' | 'Medium' | 'High' | 'Very High';

export interface DetectedLanguage {
  code: string;
  name: string;
  confidence: number;
  script: string;
  isPrimary: boolean;
}

export interface RegionalVariant {
  variant: string;
  confidence: number;
  signals: string[];
}

export interface LanguageSegment {
  start: number;
  end: number;
  text: string;
  languageCode: string;
  languageName: string;
  script: string;
  isReliable: boolean;
}

export interface SentenceVerdict {
  text: string;
  start: number;
  end: number;
  aiProbability: number;
  humanProbability: number;
  mixedProbability: number;
  verdict: Verdict;
  confidence: number;
  explanation: string;
  languageCode: string;
}

export interface ParagraphVerdict {
  index: number;
  aiProbability: number;
  humanProbability: number;
  mixedProbability: number;
  verdict: Verdict;
  confidence: number;
  sentenceRange: [number, number];
}

export interface PassageHighlight {
  start: number;
  end: number;
  text: string;
  verdict: Verdict;
  confidence: number;
  reason: string;
}

export interface ModelFamilySignal {
  family: string;
  probability: number;
  confidence: number;
  signals: string[];
}

export interface HumanizationSignal {
  detected: boolean;
  confidence: number;
  signals: string[];
  explanation: string;
}

export interface LinguisticProfile {
  avgSentenceLength: number;
  sentenceLengthVariance: number;
  lexicalDiversity: number;
  repetitionScore: number;
  transitionPredictability: number;
  syntacticRegularity: number;
  semanticRedundancy: number;
  punctuationConsistency: number;
  paragraphSymmetry: number;
  formulaicStartScore: number;
  formulaicEndScore: number;
  balancedPhrasingScore: number;
  vocabularyDistributionScore: number;
  discourseStructureScore: number;
  contextualCoherence: number;
  phraseReuseScore: number;
  discourseFlowScore: number;
  stylisticVariationScore: number;
  humanEditingScore: number;
  aiBoilerplateScore: number;
}

export interface StatisticalProfile {
  entropy: number;
  burstiness: number;
  tokenPredictability: number;
  ngramUniqueness: number;
  repetitionDensity: number;
  vocabularyCompression: number;
  sentenceVariance: number;
  shortTextPenalty: number;
  coherenceScore: number;
  phraseReuseScore: number;
  editingSignalScore: number;
}

export interface FeatureScores {
  ai: number;
  human: number;
  mixed: number;
  confidence: number;
}

export interface DetectionWarning {
  type: 'short-text' | 'translation' | 'technical' | 'low-context' | 'unsupported-language' | 'mixed-language' | 'humanization';
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

export interface Explanation {
  simple: string;
  technical: string;
  factors: { label: string; impact: 'strong' | 'moderate' | 'weak'; direction: 'human' | 'ai' | 'mixed' }[];
}

export interface AnalysisMetadata {
  detectorVersion: string;
  modelVersion: string;
  languagePipelineVersion: string;
  calibrationVersion: string;
  classifierVersion?: string;
  requestId: string;
  contentType: string;
  inputLength: number;
  wordCount: number;
  languageCode?: string;
  analyzedAt: string;
  processingTimeMs?: number;
  classProbabilities?: Record<string, number>;
}

export interface DevDiagnostics {
  rawEnsembleScores: {
    ai: number;
    human: number;
    mixed: number;
    confidence: number;
  };
  adjustedScores: { ai: number; human: number; mixed: number };
  adjustedAiRisk: number;
  mixedAiContribution: number;
  uncertainty: number;
  sentenceSignals: {
    aiSentenceCount: number;
    humanSentenceCount: number;
    mixedSentenceCount: number;
    totalSentences: number;
    aiContinuityScore: number;
    dominantSentenceLabel: string;
  };
  documentConsistencyScore: number;
  structuralBoundariesDetected: number;
  mixedAuthorshipProbability: number;
  humanEditProbability: number;
  verdictReason: string;
  calibrationVersion: string;
  engineVersion: string;
}

export interface AdvancedTextAnalysisResult {
  overall: {
    aiProbability: number;
    humanProbability: number;
    mixedProbability: number;
    verdict: Verdict;
    verdictLabel: string;
    confidence: number;
    confidenceLevel: ConfidenceLevel;
    riskLevel: RiskLevel;
    adjustedAiRisk?: number;
  };
  language: {
    primary?: DetectedLanguage;
    secondary: DetectedLanguage[];
    segments: LanguageSegment[];
    regionalVariant?: RegionalVariant;
    codeSwitched: boolean;
    translationLikelihood: number;
  };
  contentType: ContentType;
  textSufficiency: {
    sufficient: boolean;
    wordCount: number;
    minRecommended: number;
    status: 'ok' | 'short' | 'very-short' | 'insufficient';
  };
  sentences: SentenceVerdict[];
  paragraphs: ParagraphVerdict[];
  highlights: PassageHighlight[];
  modelFamilies: ModelFamilySignal[];
  humanization: HumanizationSignal;
  linguisticProfile: LinguisticProfile;
  statisticalProfile: StatisticalProfile;
  warnings: DetectionWarning[];
  explanation: Explanation;
  limitations: string[];
  metadata: AnalysisMetadata;
  scanDate: string;
  diagnostics?: DevDiagnostics;
}

export interface AnalysisOptions {
  contentType?: ContentType;
  languageHint?: string;
  manualContentType?: boolean;
  sentenceLevel?: boolean;
  paragraphLevel?: boolean;
}
