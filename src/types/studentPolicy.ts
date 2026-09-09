/**
 * Student Mode and Academic Policy Guidance - Type Definitions (Phase 1)
 *
 * Strict separation: This module does NOT modify, calibrate, or wrap detector engines.
 * It provides additive policy analysis, declarations, and factual guidance.
 */

export type AIUseStatus = 'prohibited' | 'restricted' | 'permitted' | 'required' | 'unclear' | 'not-specified';

export type PolicySourceType = 'user-provided' | 'retrieved-url' | 'admin-reviewed';

export type NumericalThresholdType =
  | 'none'
  | 'actual-ai-usage'
  | 'external-detector'
  | 'aidetector-compatible'
  | 'unclear-applicability';

export interface PolicyNumericalThreshold {
  type: NumericalThresholdType;
  rawValue?: string;
  percentageValue?: number;
  comparisonOperator?: '<' | '<=' | '=' | '>=' | '>';
  targetDetectorName?: string; // e.g. "Turnitin", "GPTZero", "AIDetector.cx", "General"
  exactDescription: string;
  guidanceText: string;
  isInterchangeableWithAIDetector: boolean;
}

export interface PolicyRuleItem {
  id: string;
  category: 'allowed' | 'prohibited' | 'conditional' | 'disclosure' | 'record-retention' | 'general';
  activity: string;
  details?: string;
  conditions?: string[];
  excerpt?: string;
}

export interface PolicyDisclosureRequirement {
  required: boolean;
  citationStyle?: string;
  includePromptsInAppendix?: boolean;
  specifyToolNames?: boolean;
  details: string;
  excerpt?: string;
}

export interface PolicyRecordRetention {
  required: boolean;
  draftingHistoryRequired?: boolean;
  rawPromptsRequired?: boolean;
  aiOutputsRequired?: boolean;
  details: string;
  excerpt?: string;
}

export interface PolicyExcerptItem {
  text: string;
  section?: string;
  confidenceNote?: string;
}

export interface StructuredPolicyInterpretation {
  status: AIUseStatus;
  statusSummary: string;
  institutionScope?: string;
  courseScope?: string;
  assignmentScope?: string;
  effectiveDate?: string;
  publicationDate?: string;
  retrievalDate?: string;
  contentHash: string;
  sourceType: PolicySourceType;
  sourceLabel: string;
  sourceIdentifier: string; // URL, file name, or "Pasted Text"
  allowedActivities: PolicyRuleItem[];
  prohibitedActivities: PolicyRuleItem[];
  disclosureRequirement: PolicyDisclosureRequirement;
  recordRetentionRequirement: PolicyRecordRetention;
  numericalThreshold: PolicyNumericalThreshold;
  ambiguities: string[];
  supportingExcerpts: string[];
  excerpts?: PolicyExcerptItem[];
  conflictsDetected: boolean;
  conflictDetails?: string;
}

export type DeclaredAIActivity =
  | 'none'
  | 'brainstorming'
  | 'outlining'
  | 'grammar-spelling'
  | 'translation'
  | 'rewriting-paraphrasing'
  | 'generated-sentences'
  | 'research-summaries'
  | 'coding-assistance'
  | 'other'
  | 'prefer-not-to-specify';

export interface StudentDeclarationItem {
  id: DeclaredAIActivity;
  label: string;
  description: string;
  customDetails?: string;
}

export interface StudentDeclarationState {
  declaredActivities: DeclaredAIActivity[];
  customDescription?: string;
  customOtherText?: string;
  toolsUsed?: string[];
  promptsRetained?: boolean;
  draftsRetained?: boolean;
  declaredAt?: string;
}

export type StudentAIUsageDeclaration = StudentDeclarationState;

export interface SynthesizedAcademicGuidance {
  detectorAvailable: boolean;
  balancedAiScore: number | null;
  balancedVerdict: string | null;
  aggressiveAiScore: number | null;
  aggressiveVerdict: string | null;
  interpretation: StructuredPolicyInterpretation | null;
  policyStatus: AIUseStatus;
  policyStatusSummary: string;
  thresholdComparison: {
    isComparable: boolean;
    thresholdDescription: string;
    comparisonStatusText: string;
    balancedComparisonNote?: string;
    aggressiveComparisonNote?: string;
    disclaimer: string;
  };
  declarationEvaluations?: ActivityComparisonResult[];
}

export type DeclarationComparisonVerdict =
  | 'permitted-with-conditions'
  | 'potential-conflict'
  | 'unaddressed-by-policy'
  | 'not-assessed';

export interface ActivityComparisonResult {
  activityId: DeclaredAIActivity;
  activityLabel: string;
  verdict: DeclarationComparisonVerdict;
  explanation: string;
  relevantRuleExcerpt?: string;
}

export interface StudentPolicyState {
  isEnabled: boolean;
  institutionName: string;
  courseOrModule: string;
  assignmentTitle: string;
  academicTermOrDate: string;
  rawPolicyText: string;
  policyUrl: string;
  uploadedDocumentName?: string;
  extractedDocumentText?: string;
  documentExtractionError?: string;
  isExtractingDocument: boolean;
  isRetrievingUrl: boolean;
  retrievalError?: string;
  interpretation: StructuredPolicyInterpretation | null;
  declaration: StudentDeclarationState;
}

export interface DetectorScoreContext {
  balancedAiScore?: number;
  balancedVerdict?: string;
  aggressiveAiScore?: number;
  aggressiveVerdict?: string;
  language?: string;
  wordCount?: number;
}
