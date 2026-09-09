/**
 * Utility functions for generating student drafts, instructor inquiry questions,
 * records retention checklists, policy summaries, and export attachments.
 *
 * CRITICAL SAFETY RULES:
 * 1. Generated declarations must describe ONLY information the student supplied.
 * 2. Never invent tool names, dates, prompts, review steps, or claims of independent authorship.
 * 3. Never suggest rewriting solely to pass a detector threshold.
 * 4. Never automatically email instructors or submit assignments.
 */

import {
  type StructuredPolicyInterpretation,
  type StudentAIUsageDeclaration,
  type SynthesizedAcademicGuidance,
  type DeclaredAIActivity,
  type PolicyRuleItem,
} from '@/types/studentPolicy';
import { DECLARED_ACTIVITIES_METADATA } from './policyInterpreter';

export interface DraftDeclarationOptions {
  institutionName?: string;
  courseName?: string;
  assignmentTitle?: string;
  studentName?: string;
  declaration: StudentAIUsageDeclaration;
  interpretation?: StructuredPolicyInterpretation | null;
}

/**
 * Generates an honest, student-reviewed AI assistance disclosure statement.
 */
export function generateStudentDeclarationDraft(options: DraftDeclarationOptions): string {
  const { institutionName, courseName, assignmentTitle, declaration, interpretation } = options;
  const declaredList = declaration.declaredActivities || [];

  const activityLabels = declaredList
    .map((id: DeclaredAIActivity) => {
      const meta = DECLARED_ACTIVITIES_METADATA[id];
      if (id === 'other' && declaration.customDescription) {
        return `Other assistance: ${declaration.customDescription.trim()}`;
      }
      return meta ? meta.label : id;
    })
    .filter(Boolean);

  const lines: string[] = [
    '═══════════════════════════════════════════════════════════════════',
    '        STUDENT DECLARATION OF AI ASSISTANCE (DRAFT)',
    '  [Important: Review and adjust this draft before official submission]',
    '═══════════════════════════════════════════════════════════════════',
    '',
    `Assignment: ${assignmentTitle || '[Specify Assignment Title]'}`,
    `Course:     ${courseName || '[Specify Course / Module]'}`,
    `Institution:${institutionName || '[Specify Institution]'}`,
    `Date:       ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    '',
    '─── DECLARED AI USAGE ───',
  ];

  if (
    declaredList.length === 0 ||
    declaredList.includes('none') ||
    (declaredList as string[]).includes('no-ai')
  ) {
    lines.push('• No artificial intelligence tools or generative AI assistance were used in the preparation or writing of this submission.');
  } else if (declaredList.includes('prefer-not-to-specify')) {
    lines.push('• AI assistance details were withheld in this draft declaration. [Please specify actual assistance before submitting].');
  } else {
    lines.push('The student declares having utilized AI tools for the following specific task(s):');
    activityLabels.forEach((label: string) => {
      lines.push(`  • ${label}`);
    });
  }

  if (declaration.customDescription && !declaredList.includes('other')) {
    lines.push(`\nAdditional Notes: ${declaration.customDescription.trim()}`);
  }

  lines.push('\n─── RECORDS & PROMPTS RETENTION ───');
  if (declaration.promptsRetained) {
    lines.push('• The student has retained prompt transcripts and conversation logs used during this assignment.');
  } else {
    lines.push('• Prompt transcripts retention status: Not specified.');
  }

  if (declaration.draftsRetained) {
    lines.push('• The student has maintained draft version histories and intermediate notes.');
  } else {
    lines.push('• Draft version history retention status: Not specified.');
  }

  lines.push('\n─── APPLICABLE POLICY REFERENCE ───');
  if (interpretation && interpretation.status !== 'not-specified') {
    lines.push(`• Policy Status: ${interpretation.status.toUpperCase()}`);
    lines.push(`• Policy Source: ${interpretation.sourceType} (${interpretation.sourceIdentifier || 'User provided'})`);
    if (interpretation.numericalThreshold.type !== 'none') {
      lines.push(`• Threshold Note: ${interpretation.numericalThreshold.exactDescription}`);
    }
  } else {
    lines.push('• Policy Reference: No specific institutional policy attached.');
  }

  lines.push('\n─── STUDENT SIGN-OFF ───');
  lines.push('I confirm that the above declaration accurately reflects the AI assistance used for this assignment.');
  lines.push('Signature: ___________________________   Date: _______________');

  return lines.join('\n');
}

export interface DraftInstructorQuestionOptions {
  institutionName?: string;
  courseName?: string;
  assignmentTitle?: string;
  declaredActivities: DeclaredAIActivity[];
  interpretation?: StructuredPolicyInterpretation | null;
  specificDoubt?: string;
}

/**
 * Generates a polite, respectful inquiry to an instructor asking for syllabus rule clarification.
 */
export function generateInstructorQuestionDraft(options: DraftInstructorQuestionOptions): string {
  const { courseName, assignmentTitle, declaredActivities, interpretation, specificDoubt } = options;

  const activityNames = declaredActivities
    .map((id: DeclaredAIActivity) => DECLARED_ACTIVITIES_METADATA[id]?.label)
    .filter(Boolean)
    .join(', ');

  const subject = `Question regarding AI use guidelines for ${assignmentTitle || 'Assignment'} - ${courseName || 'Course'}`;

  const lines = [
    `Subject: ${subject}`,
    '',
    'Dear Professor / Instructor,',
    '',
    `I am currently working on ${assignmentTitle || 'our upcoming assignment'}${courseName ? ` for ${courseName}` : ''} and wanted to respectfully clarify the course policy regarding artificial intelligence assistance to ensure I remain in full compliance with your academic integrity standards.`,
    '',
  ];

  if (activityNames) {
    lines.push(
      `Specifically, I am considering using AI tools solely for the following purpose(s):`,
      `• ${activityNames}`,
      ''
    );
  }

  if (interpretation?.conflictsDetected) {
    lines.push(
      `I reviewed the available syllabus guidelines, but noted that there may be different instructions across materials regarding permitted AI use. Could you please confirm if this specific type of assistance is permissible for this assignment?`,
      ''
    );
  } else if (interpretation?.numericalThreshold.type === 'external-detector') {
    lines.push(
      `The syllabus mentions an automated detection score threshold (${interpretation.numericalThreshold.targetDetectorName}). I want to ensure my planned drafting methods and disclosure notes follow your preferred guidelines.`,
      ''
    );
  } else if (specificDoubt) {
    lines.push(`Specifically: ${specificDoubt}`, '');
  } else {
    lines.push(
      'Could you kindly clarify whether this level of assistance is permitted, and if any specific citation or disclosure format is required upon submission?',
      ''
    );
  }

  lines.push(
    'I appreciate your time and guidance.',
    '',
    'Sincerely,',
    '[Your Name]',
    '[Your Student ID]'
  );

  return lines.join('\n');
}

/**
 * Returns structured checklist items of records students should retain.
 */
export function getWritingRecordsChecklist(interpretation?: StructuredPolicyInterpretation | null) {
  const isStrict = interpretation?.recordRetentionRequirement.required;

  return [
    {
      id: 'google-docs-history',
      title: 'Drafting Version History',
      description:
        'Maintain version history in Google Docs, Word Track Changes, or Git to prove organic time-stamped writing progression.',
      recommended: true,
      priority: isStrict ? 'Mandatory per policy' : 'Strongly Recommended',
    },
    {
      id: 'prompt-logs',
      title: 'Raw Prompt & Response Transcripts',
      description:
        'Save conversation transcripts, export chat logs, or screenshot prompts if generative tools were consulted for outlining or brainstorming.',
      recommended: true,
      priority: interpretation?.recordRetentionRequirement.rawPromptsRequired ? 'Required by Policy' : 'Recommended',
    },
    {
      id: 'outline-notes',
      title: 'Handwritten / Initial Research Notes',
      description:
        'Keep original scratchpads, brainstorming diagrams, bibliography source PDFs, and voice notes.',
      recommended: true,
      priority: 'Best Practice',
    },
    {
      id: 'sources-cross-check',
      title: 'Direct Source Citation Records',
      description:
        'Verify that all cited quotes and statistics originate from primary peer-reviewed sources rather than hallucinated model outputs.',
      recommended: true,
      priority: 'Essential',
    },
  ];
}

/**
 * Generates formatted copy-able policy summary.
 */
export function generatePolicySummaryText(guidance: SynthesizedAcademicGuidance): string {
  const interp = guidance.interpretation;
  const lines: string[] = [
    '═══════════════════════════════════════════════════════════════════',
    '              ACADEMIC POLICY GUIDANCE SUMMARY',
    '═══════════════════════════════════════════════════════════════════',
    '',
    `Policy Status: ${guidance.policyStatus.toUpperCase()}`,
    `Overview:      ${guidance.policyStatusSummary}`,
    `Source:        ${interp?.sourceType || 'User-provided'} (${interp?.sourceIdentifier || 'Direct input'})`,
    `Content Hash:  ${interp?.contentHash || 'N/A'}`,
    `Retrieval Date:${interp?.retrievalDate ? new Date(interp.retrievalDate).toLocaleDateString() : 'N/A'}`,
    '',
    '─── PERMISSIONS & RESTRICTIONS ───',
  ];

  if (interp?.allowedActivities && interp.allowedActivities.length > 0) {
    lines.push('Permitted Activities:');
    interp.allowedActivities.forEach((a: PolicyRuleItem) => lines.push(`  • ${a.activity}: ${a.details || ''}`));
  } else {
    lines.push('Permitted Activities: None explicitly listed.');
  }

  if (interp?.prohibitedActivities && interp.prohibitedActivities.length > 0) {
    lines.push('\nProhibited Activities:');
    interp.prohibitedActivities.forEach((a: PolicyRuleItem) => lines.push(`  • ${a.activity}: ${a.details || ''}`));
  }

  lines.push('\n─── NUMERICAL THRESHOLD EVALUATION ───');
  lines.push(`Threshold Specification: ${interp?.numericalThreshold.exactDescription || 'Not specified'}`);
  lines.push(`Comparability Note:       ${interp?.numericalThreshold.guidanceText || 'N/A'}`);

  if (guidance.thresholdComparison.balancedComparisonNote) {
    lines.push(`Balanced Detector Check:  ${guidance.thresholdComparison.balancedComparisonNote}`);
  }
  if (guidance.thresholdComparison.aggressiveComparisonNote) {
    lines.push(`High-Sensitivity Check:   ${guidance.thresholdComparison.aggressiveComparisonNote}`);
  }

  lines.push('\n─── DISCLOSURE & RETENTION ───');
  lines.push(`Disclosure Mandated: ${interp?.disclosureRequirement.required ? 'YES' : 'No explicit mandate'}`);
  if (interp?.disclosureRequirement.details) {
    lines.push(`Disclosure Details:  ${interp.disclosureRequirement.details}`);
  }
  lines.push(`Records Retention:   ${interp?.recordRetentionRequirement.required ? 'YES' : 'Not explicitly mandated'}`);

  lines.push('\n─── DISCLAIMER ───');
  lines.push('AI detection is an estimate. Assignment compliance depends on the applicable rules and how you used AI.');
  lines.push('AIDetector.cx never certifies academic approval, cheating confirmation, or compliance guarantees.');

  return lines.join('\n');
}

/**
 * Builds a clean JSON export structure for the Academic Policy Guidance Attachment.
 */
export function buildAcademicPolicyExportAttachment(guidance: SynthesizedAcademicGuidance) {
  return {
    exportType: 'AIDetector.cx Academic Policy Guidance Attachment',
    exportedAt: new Date().toISOString(),
    policyProvenance: {
      sourceType: guidance.interpretation?.sourceType || 'user-provided',
      sourceIdentifier: guidance.interpretation?.sourceIdentifier || null,
      contentHash: guidance.interpretation?.contentHash || null,
      retrievalDate: guidance.interpretation?.retrievalDate || null,
      institutionScope: guidance.interpretation?.institutionScope || null,
      courseScope: guidance.interpretation?.courseScope || null,
      assignmentScope: guidance.interpretation?.assignmentScope || null,
    },
    policyInterpretation: {
      status: guidance.policyStatus,
      statusSummary: guidance.policyStatusSummary,
      allowedActivities: guidance.interpretation?.allowedActivities || [],
      prohibitedActivities: guidance.interpretation?.prohibitedActivities || [],
      numericalThreshold: guidance.interpretation?.numericalThreshold || null,
      disclosureRequirement: guidance.interpretation?.disclosureRequirement || null,
      recordRetentionRequirement: guidance.interpretation?.recordRetentionRequirement || null,
      conflictsDetected: guidance.interpretation?.conflictsDetected || false,
      conflictDetails: guidance.interpretation?.conflictDetails || null,
      excerpts: guidance.interpretation?.excerpts || [],
    },
    studentDeclarationEvaluations: guidance.declarationEvaluations || [],
    detectorSynthesis: {
      balancedAiScore: guidance.balancedAiScore,
      balancedVerdict: guidance.balancedVerdict,
      aggressiveAiScore: guidance.aggressiveAiScore,
      aggressiveVerdict: guidance.aggressiveVerdict,
      thresholdComparison: guidance.thresholdComparison,
    },
    disclaimer:
      'AI detection is an estimate. Assignment compliance depends on the applicable rules and how you used AI. This attachment does not constitute academic approval or verification of human authorship.',
  };
}
