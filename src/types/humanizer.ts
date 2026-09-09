export type HumanizationStatus = 'analyzing' | 'planning' | 'protecting' | 'rewriting' | 'validating' | 'verifying' | 'completed' | 'partial' | 'failed' | 'cancelled';
export type AlternativeStatus = 'Pending' | 'Generating' | 'Completed' | 'Validation Failed' | 'Provider Failed' | 'Retrying';
export type HumanizationLevel = 'light' | 'balanced' | 'strong' | 'advanced' | 'custom';
export type WritingStyle = 'standard' | 'academic' | 'professional' | 'conversational' | 'technical' | 'marketing';

export interface ProtectedEntity {
  type: 'number' | 'date' | 'citation' | 'url' | 'code' | 'term' | 'locked' | 'name' | 'unit' | 'email' | 'locked_term' | 'quotation';
  value: string;
  count: number;
  preserved: boolean;
}

export interface ValidationReport {
  passed: boolean;
  isValid?: boolean;
  omissionsCount?: number;
  formattingPreserved?: boolean;
  negationIntegrity?: boolean;
  issues?: string[];
  omission_issues: string[];
  negation_issues: string[];
  protected_entity_issues: string[];
  formatting_issues: string[];
  repair_attempted: boolean;
  repair_succeeded: boolean;
  factual_integrity_status: 'High' | 'Verified' | 'Warning' | 'Manual Check Needed';
  warning_flags: string[];
}

export interface SubstantiveChangeSummary {
  sentences_modified: number;
  total_sentences: number;
  sentences_preserved?: number;
  change_percentage: number;
  protected_entities_count?: number;
  protected_entities_preserved: number;
  structural_elements_maintained?: number;
  vocabulary_diversity_delta?: number;
  burstiness_improvement?: string;
  vocabulary_expansion?: string;
  flow_improvements: string[];
}

export interface HumanizerSettings {
  level: HumanizationLevel;
  style?: WritingStyle;
  tone: string;
  audience: string;
  readingLevel: string;
  styleReferenceSample?: string;
  lockedTerms?: string[];
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
  pipelineVersion?: string;
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
  balanced_detector_score?: number;
  aggressive_detector_score?: number;
  text_hash?: string;
  is_stale?: boolean;
  repaired?: boolean;
  integrity_warnings?: string[];
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
  validation_report?: ValidationReport;
  text_hash?: string;
  created_at?: string;
  completed_at?: string;
}

export interface HumanizationJob {
  job_id: string;
  user_id: string;
  original_text: string;
  humanized_text?: string;
  original_text_hash?: string;
  humanized_text_hash?: string;
  settings: HumanizerSettings | Record<string, any>;
  protected_facts?: Record<string, any>;
  protected_entities?: ProtectedEntity[];
  validation_report?: ValidationReport;
  substantive_summary?: SubstantiveChangeSummary;
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
  pipeline_version?: string;
}

export interface HumanizationVersion {
  version_id: string;
  job_id: string;
  version_number: number;
  humanized_text: string;
  humanized_text_hash?: string;
  settings: HumanizerSettings | Record<string, any>;
  scores: HumanizerScores | Record<string, any>;
  sentence_changes: SentenceChange[] | any[];
  verification_results?: Record<string, any>;
  validation_report?: ValidationReport;
  substantive_summary?: SubstantiveChangeSummary;
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


