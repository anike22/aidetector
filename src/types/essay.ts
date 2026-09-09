// Essay Studio — shared TypeScript types matching the DB schema exactly.
// Do not import from here in detection engine files.

export type EssayType =
  | 'argumentative' | 'persuasive' | 'expository' | 'analytical'
  | 'compare_contrast' | 'research' | 'literature_review' | 'critical_analysis'
  | 'reflective' | 'scholarship' | 'admission' | 'custom';

export type AcademicLevel = 'high_school' | 'undergraduate' | 'masters' | 'doctoral' | 'custom';
export type CitationStyle = 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee';
export type EssayStatus = 'draft' | 'planning' | 'writing' | 'verifying' | 'improving' | 'submitting' | 'archived';
export type EssayPhase = 'plan' | 'outline' | 'write' | 'verify' | 'improve' | 'cite' | 'sources' | 'history' | 'submit';
export type SourceStatus = 'supported' | 'partially_supported' | 'unsupported' | 'contradicted' | 'citation_required' | 'unanalyzed';
export type EventType =
  | 'essay_created' | 'outline_created' | 'writing_session_start' | 'writing_session_end'
  | 'edit' | 'source_added' | 'citation_added' | 'ai_assist' | 'detector_analysis'
  | 'final_verification' | 'phase_change' | 'version_saved' | 'export';

export interface Essay {
  id: string;
  user_id: string;
  title: string;
  essay_type: EssayType;
  academic_level: AcademicLevel;
  status: EssayStatus;
  current_phase: EssayPhase;
  topic: string | null;
  assignment_instructions: string | null;
  research_question: string | null;
  target_word_count: number;
  citation_style: CitationStyle;
  language: string;
  deadline: string | null;
  required_sources: number;
  content: string;
  word_count: number;
  character_count: number;
  assignment_id: string | null;
  overall_progress: number;
  created_at: string;
  updated_at: string;
  last_edited_at: string;
}

export interface EssayOutlineSection {
  id: string;
  essay_id: string;
  parent_id: string | null;
  title: string;
  description: string;
  notes: string;
  position: number;
  depth: number;
  created_at: string;
  updated_at: string;
  children?: EssayOutlineSection[];
}

export interface EssayVersion {
  id: string;
  essay_id: string;
  content: string;
  word_count: number;
  version_number: number;
  label: string;
  created_at: string;
}

export interface EssaySource {
  id: string;
  essay_id: string;
  user_id: string;
  title: string;
  authors: string;
  publication_date: string;
  publisher: string;
  url: string;
  doi: string;
  source_type: string;
  notes: string;
  is_analyzed: boolean;
  status: SourceStatus;
  created_at: string;
  updated_at: string;
}

export interface EssayCitation {
  id: string;
  essay_id: string;
  source_id: string | null;
  citation_key: string;
  in_text_format: string;
  bibliography_format: string;
  citation_style: CitationStyle;
  needs_verification: boolean;
  is_verified: boolean;
  position_hint: string;
  created_at: string;
  updated_at: string;
}

export interface EssayEvent {
  id: string;
  essay_id: string;
  user_id: string;
  event_type: EventType;
  description: string;
  metadata: Record<string, unknown>;
  words_at_event: number;
  created_at: string;
}

export interface QualityScoreBreakdown {
  overall_score: number;
  thesis_score: number;
  argument_score: number;
  evidence_score: number;
  organization_score: number;
  coherence_score: number;
  critical_thinking_score: number;
  grammar_score: number;
  readability_score: number;
  academic_tone_score: number;
  citation_quality_score: number;
  originality_score: number;
}

export interface QualityIssue {
  category: string;
  score: number;
  title: string;
  description: string;
  location?: string;
  recommendation: string;
  severity: 'low' | 'medium' | 'high';
}

export interface EssayQualityScore extends QualityScoreBreakdown {
  id: string;
  essay_id: string;
  issues: QualityIssue[];
  analyzed_at: string;
}

export interface EssayDetectorResult {
  id: string;
  essay_id: string;
  balanced_result: Record<string, unknown> | null;
  aggressive_result: Record<string, unknown> | null;
  additional_analysis: Record<string, unknown>;
  analyzed_at: string;
}

export interface TeacherAssignment {
  id: string;
  teacher_id: string;
  title: string;
  instructions: string;
  essay_type: EssayType;
  min_word_count: number;
  max_word_count: number;
  citation_style: CitationStyle;
  required_sources: number;
  rubric: string;
  ai_use_policy: string;
  deadline: string | null;
  assignment_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EssayTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  essay_type: EssayType;
  academic_level: AcademicLevel;
  citation_style: CitationStyle;
  outline_structure: OutlineTemplateSection[];
  seo_title: string;
  seo_description: string;
  is_published: boolean;
  created_at: string;
}

export interface OutlineTemplateSection {
  title: string;
  description: string;
  position: number;
}

export const PHASE_ORDER: EssayPhase[] = [
  'plan', 'outline', 'write', 'verify', 'improve', 'cite', 'sources', 'history', 'submit',
];

export const PHASE_LABELS: Record<EssayPhase, string> = {
  plan: 'Plan',
  outline: 'Outline',
  write: 'Write',
  verify: 'Verify',
  improve: 'Improve',
  cite: 'Cite',
  sources: 'Sources',
  history: 'History',
  submit: 'Submit',
};

// ─── Submission types ──────────────────────────────────────────────────────────

export type SubmissionStatus = 'submitted' | 'under_review' | 'reviewed' | 'returned' | 'accepted';
export type AIUseVerdict = 'not_reviewed' | 'compliant' | 'minor_concern' | 'major_concern' | 'violation';

export interface StudentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  essay_id: string | null;
  title: string;
  content: string;
  word_count: number;
  status: SubmissionStatus;
  submitted_at: string;
  updated_at: string;
  student_note: string;
  balanced_ai_score: number | null;
  aggressive_ai_score: number | null;
  quality_score: number | null;
}

export interface InlineComment {
  offset: number;
  length: number;
  text: string;
}

export interface SubmissionReview {
  id: string;
  submission_id: string;
  teacher_id: string;
  grade: string | null;
  overall_comment: string;
  rubric_scores: Record<string, number>;
  inline_comments: InlineComment[];
  ai_use_verdict: AIUseVerdict;
  reviewed_at: string;
  updated_at: string;
}

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  reviewed: 'Reviewed',
  returned: 'Returned',
  accepted: 'Accepted',
};

export const AI_VERDICT_LABELS: Record<AIUseVerdict, string> = {
  not_reviewed: 'Not Reviewed',
  compliant: 'Compliant',
  minor_concern: 'Minor Concern',
  major_concern: 'Major Concern',
  violation: 'Policy Violation',
};

// UI-only helpers
export const ESSAY_TYPE_LABELS: Record<EssayType, string> = {
  argumentative: 'Argumentative',
  persuasive: 'Persuasive',
  expository: 'Expository',
  analytical: 'Analytical',
  compare_contrast: 'Compare & Contrast',
  research: 'Research Paper',
  literature_review: 'Literature Review',
  critical_analysis: 'Critical Analysis',
  reflective: 'Reflective',
  scholarship: 'Scholarship',
  admission: 'Admission / College',
  custom: 'Custom',
};

export const ACADEMIC_LEVEL_LABELS: Record<AcademicLevel, string> = {
  high_school: 'High School',
  undergraduate: 'Undergraduate',
  masters: "Master's",
  doctoral: 'Doctoral',
  custom: 'Custom',
};

export const CITATION_STYLE_LABELS: Record<CitationStyle, string> = {
  apa: 'APA',
  mla: 'MLA',
  chicago: 'Chicago',
  harvard: 'Harvard',
  ieee: 'IEEE',
};

