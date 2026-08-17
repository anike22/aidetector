export type HumanizationStatus = 'analyzing' | 'planning' | 'rewriting' | 'verifying' | 'completed' | 'partial' | 'failed' | 'cancelled';
export type AlternativeStatus = 'Pending' | 'Generating' | 'Completed' | 'Validation Failed' | 'Provider Failed' | 'Retrying';
export type HumanizationLevel = 'light' | 'balanced' | 'strong' | 'advanced' | 'custom';

export interface HumanizerSettings {
  level: HumanizationLevel;
  tone: string;
  audience: string;
  readingLevel: string;
  preserveFacts: boolean;
  preserveKeywords: boolean;
  preserveCitations: boolean;
  preserveFormatting: boolean;
  preserveParagraphStructure: boolean;
  preserveTechnicalTerminology: boolean;
  shortenText: boolean;
  expandExplanations: boolean;
  reducePassiveVoice: boolean;
  increaseSentenceVariation: boolean;
  improveTransitions: boolean;
  removeRepetition: boolean;
  improveClarity: boolean;
  increaseEmotionalWarmth: boolean;
  reduceFormality: boolean;
  preserveBrandVoice: boolean;
  avoidContractions: boolean;
  allowContractions: boolean;
  useBritishEnglish: boolean;
  useAmericanEnglish: boolean;
  wordsToPreserve: string;
  wordsToAvoid: string;
  preferredTerminology: string;
  brandVoiceInstructions: string;
  additionalInstructions: string;
}

export interface HumanizerScores {
  humanization_score?: number;
  meaning_preservation_score?: number;
  naturalness_score?: number;
  readability_score?: number;
  grammar_score?: number;
  coherence_score?: number;
  sentence_variety_score?: number;
  vocabulary_diversity_score?: number;
  tone_consistency_score?: number;
  originality_score?: number;
  ai_signal_before?: number;
  ai_signal_after?: number;
  confidence_level?: string;
  transformation_strength_used?: string;
}

export interface SentenceChange {
  original_sentence: string;
  humanized_sentence: string;
  change_type: string;
  reason: string;
  confidence: string;
  naturalness_improvement?: string;
  readability_change?: string;
  grammar_issues_fixed?: number;
  ai_signals_reduced?: string[];
}

export interface RewriteAlternative {
  alternative_id?: string;
  alternative_type: string;
  status: AlternativeStatus;
  text?: string;
  summary?: string;
  scores?: HumanizerScores;
  similarity_to_original?: number;
  meaning_integrity?: number;
  provider?: string;
  model?: string;
  attempt_count?: number;
  error_code?: string;
  error_message?: string;
  processing_time?: number;
  warnings?: any[];
  created_at?: string;
  completed_at?: string;
}

export interface HumanizationJob {
  job_id: string;
  user_id: string;
  original_text: string;
  humanized_text?: string;
  settings: HumanizerSettings | Record<string, any>;
  protected_facts?: Record<string, any>;
  transformation_plan?: Record<string, any>;
  verification_results?: Record<string, any>;
  scores: HumanizerScores | Record<string, any>;
  sentence_changes: SentenceChange[] | any[];
  alternatives?: RewriteAlternative[];
  selected_alternative?: string;
  domain_type?: string;
  warnings?: any[];
  version_number: number;
  status: HumanizationStatus;
  error_message?: string;
  created_at: string;
  completed_at?: string;
  saved?: boolean;
  expected_alternatives?: number;
  completed_alternatives?: number;
  failed_alternatives?: number;
  request_id?: string;
  usage_charged?: boolean;
}

export interface HumanizationVersion {
  version_id: string;
  job_id: string;
  version_number: number;
  humanized_text: string;
  settings: HumanizerSettings | Record<string, any>;
  scores: HumanizerScores | Record<string, any>;
  sentence_changes: SentenceChange[] | any[];
  verification_results?: Record<string, any>;
  word_count: number;
  change_percentage: number;
  user_rating?: number;
  created_at: string;
}

export interface HumanizationFeedback {
  overall_quality: number;
  meaning_preservation: number;
  naturalness: number;
  usefulness: number;
  issue_type?: string;
  issue_description?: string;
}
