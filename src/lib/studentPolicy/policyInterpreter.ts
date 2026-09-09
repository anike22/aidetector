/**
 * Academic Policy Interpretation Engine (Phase 1)
 *
 * Deterministic, rule-based structured interpretation of academic AI policies and assignment instructions.
 *
 * Core principles:
 * 1. Strictly isolated: Never alters or executes detector prompts or scoring.
 * 2. Strict numerical threshold semantics:
 *    - No threshold: "Accepted detection percentage: Not specified in the supplied policy."
 *    - Actual AI limits: Identifies rules regarding actual student AI use (not detector score).
 *    - External detector: Explains non-interchangeability with Turnitin / GPTZero.
 *    - AIDetector.cx specific: Applies strict operator comparison (<, <=, >, >=) + factual disclaimer.
 * 3. Prohibited false compliance labels (Zero False Approvals):
 *    - No "College approved", "Safe to submit", "Passed academic integrity", "Verified human", "Cheating confirmed".
 * 4. Conflict detection: Flags contradictory rules across assignment prompts vs general policies.
 */

import type {
  AIUseStatus,
  DeclaredAIActivity,
  ActivityComparisonResult,
  NumericalThresholdType,
  PolicyNumericalThreshold,
  PolicyRuleItem,
  PolicyDisclosureRequirement,
  PolicyRecordRetention,
  StructuredPolicyInterpretation,
  PolicySourceType,
} from '@/types/studentPolicy';
import { computeContentHash } from './policyExtractor';

export const DECLARED_ACTIVITIES_METADATA: Record<
  DeclaredAIActivity,
  { label: string; description: string; typicalCategory: 'ideation' | 'editing' | 'generation' | 'other' }
> = {
  none: {
    label: 'No AI assistance used',
    description: 'All brainstorming, drafting, structuring, and editing were completed entirely without AI tools.',
    typicalCategory: 'ideation',
  },
  brainstorming: {
    label: 'Brainstorming & topic exploration',
    description: 'Using AI to generate initial ideas, angles, or research questions before drafting.',
    typicalCategory: 'ideation',
  },
  outlining: {
    label: 'Outlining & structuring arguments',
    description: 'Using AI to organize essay sections, thesis flow, or headings.',
    typicalCategory: 'ideation',
  },
  'grammar-spelling': {
    label: 'Grammar, spelling & proofreading',
    description: 'Using tools (e.g. Grammarly, spell-checkers) for mechanical polishing of human-written text.',
    typicalCategory: 'editing',
  },
  translation: {
    label: 'Language translation / multilingual assistance',
    description: 'Translating notes or concepts into English or refining second-language phrasing.',
    typicalCategory: 'editing',
  },
  'rewriting-paraphrasing': {
    label: 'Rewriting or paraphrasing existing text',
    description: 'Asking AI to rewrite, simplify, or rephrase student-authored paragraphs.',
    typicalCategory: 'editing',
  },
  'generated-sentences': {
    label: 'Generated sentences or paragraphs',
    description: 'Incorporating AI-generated prose, conclusions, or narrative sections directly into the draft.',
    typicalCategory: 'generation',
  },
  'research-summaries': {
    label: 'Summarizing background research / sources',
    description: 'Using AI to condense long articles, papers, or background documentation.',
    typicalCategory: 'ideation',
  },
  'coding-assistance': {
    label: 'Coding / programming / technical scripting',
    description: 'Using AI for code generation, debugging, or syntax suggestions in technical assignments.',
    typicalCategory: 'generation',
  },
  other: {
    label: 'Other described assistance',
    description: 'Custom AI assistance described in the accompanying notes.',
    typicalCategory: 'other',
  },
  'prefer-not-to-specify': {
    label: 'Prefer not to specify',
    description: 'Exploring policy rules without declaring specific AI usage.',
    typicalCategory: 'other',
  },
};

/**
 * Structured Policy Interpreter
 */
export async function interpretAcademicPolicy(options: {
  rawPolicyText: string;
  sourceType: PolicySourceType;
  sourceIdentifier: string;
  institutionName?: string;
  courseOrModule?: string;
  assignmentTitle?: string;
}): Promise<StructuredPolicyInterpretation> {
  const text = (options.rawPolicyText || '').trim();
  const lower = text.toLowerCase();
  const contentHash = await computeContentHash(text);

  if (!text || text.length < 10) {
    return {
      status: 'not-specified',
      statusSummary: 'No policy text or assignment instructions supplied.',
      contentHash,
      sourceType: options.sourceType,
      sourceLabel: getSourceTypeLabel(options.sourceType),
      sourceIdentifier: options.sourceIdentifier || 'User Input',
      allowedActivities: [],
      prohibitedActivities: [],
      disclosureRequirement: {
        required: false,
        details: 'Not specified in the supplied text.',
      },
      recordRetentionRequirement: {
        required: false,
        details: 'Not specified in the supplied text.',
      },
      numericalThreshold: {
        type: 'none',
        exactDescription: 'Accepted detection percentage: Not specified in the supplied policy.',
        guidanceText: 'A missing numerical threshold does not imply 0% or unlimited permission.',
        isInterchangeableWithAIDetector: false,
      },
      ambiguities: ['No substantive instructions were provided to analyze.'],
      supportingExcerpts: [],
      conflictsDetected: false,
    };
  }

  // 1. Detect Conflicts & Contradictions
  const hasStrictProhibition =
    /\b(strict(ly)? prohibited|no ai (use|tools|assistance)|zero tolerance|ai is (not allowed|forbidden)|ai tools are (prohibited|banned)|all generative ai is banned)\b/i.test(
      text
    );
  const hasBroadPermission =
    /\b(ai (use|tools) (is|are) (encouraged|permitted|allowed|welcome)|feel free to use (chatgpt|ai)|ai assistance is acceptable)\b/i.test(
      text
    );
  const mentionsAssignmentSpecific =
    /\b(for this assignment|in this specific assessment|unless otherwise specified by your instructor|check with your instructor|instructor discretion)\b/i.test(
      text
    );

  const conflictsDetected = hasStrictProhibition && (hasBroadPermission || mentionsAssignmentSpecific);
  const conflictDetails = conflictsDetected
    ? 'These instructions appear to conflict or may apply to different assessments. Ask your instructor which rule applies.'
    : undefined;

  // 2. Classify Overall AI Status
  let status: AIUseStatus = 'unclear';
  let statusSummary = '';

  if (hasStrictProhibition && !hasBroadPermission) {
    status = 'prohibited';
    statusSummary = 'Generative AI tools and automated assistance are strictly prohibited for this assignment.';
  } else if (
    /\b(ai is required|must use (chatgpt|ai)|mandatory ai component|evaluate the ai output)\b/i.test(text)
  ) {
    status = 'required';
    statusSummary = 'AI usage is an explicit requirement or core component of this assignment.';
  } else if (
    /\b(permitted with (attribution|disclosure|citation)|conditional|restricted use|only for brainstorming|grammar checking only|permitted for specific tasks)\b/i.test(
      text
    ) ||
    (hasBroadPermission && (/\b(must cite|must disclose|prohibit|not for drafting)\b/i.test(text) || hasStrictProhibition))
  ) {
    status = 'restricted';
    statusSummary = 'AI is permitted for specific tasks (such as brainstorming or proofreading) subject to explicit conditions.';
  } else if (hasBroadPermission && !hasStrictProhibition) {
    status = 'permitted';
    statusSummary = 'AI usage is broadly permitted for this assignment, subject to general academic integrity principles.';
  } else if (
    /\b(ask your instructor|discretion of the instructor|syllabus details|see course guidelines)\b/i.test(text)
  ) {
    status = 'unclear';
    statusSummary = 'AI permissions are delegated to individual instructors or not fully specified in this excerpt.';
  } else {
    status = 'restricted';
    statusSummary = 'Policy outlines conditional guidelines for AI use in student coursework.';
  }

  // 3. Extract Allowed Activities
  const allowedActivities: PolicyRuleItem[] = [];
  if (/\b(brainstorm(ing)?|idea generation|explore topics|generating ideas)\b/i.test(text)) {
    allowedActivities.push({
      id: 'rule-allowed-brainstorm',
      category: 'allowed',
      activity: 'Brainstorming and Ideation',
      details: 'Using AI to generate preliminary ideas, research questions, or topic angles.',
      excerpt: extractMatchingSentence(text, /brainstorm|idea generation/i),
    });
  }
  if (/\b(outlin(e|ing)|structure|structural suggestions|organizing arguments)\b/i.test(text)) {
    allowedActivities.push({
      id: 'rule-allowed-outline',
      category: 'allowed',
      activity: 'Outlining and Document Structure',
      details: 'Organizing headings, thesis structure, or logical progression.',
      excerpt: extractMatchingSentence(text, /outlin|structure/i),
    });
  }
  if (/\b(grammar|spelling|proofreading|grammarly|mechanics|typo)\b/i.test(text) && !/\bno grammar tools\b/i.test(text)) {
    allowedActivities.push({
      id: 'rule-allowed-grammar',
      category: 'allowed',
      activity: 'Grammar and Mechanical Editing',
      details: 'Proofreading student-authored text for spelling, punctuation, and mechanics.',
      excerpt: extractMatchingSentence(text, /grammar|spelling|proofreading/i),
    });
  }
  if (/\b(translat(e|ion)|multilingual|language assistance|second language)\b/i.test(text)) {
    allowedActivities.push({
      id: 'rule-allowed-translation',
      category: 'allowed',
      activity: 'Language Translation',
      details: 'Assistance with translating or polishing non-native language phrasing.',
      excerpt: extractMatchingSentence(text, /translat|multilingual/i),
    });
  }
  if (/\b(research|literature search|summariz(e|ing) sources|find articles)\b/i.test(text)) {
    allowedActivities.push({
      id: 'rule-allowed-research',
      category: 'allowed',
      activity: 'Background Research Summarization',
      details: 'Summarizing literature or finding contextual background material.',
      excerpt: extractMatchingSentence(text, /research|summariz/i),
    });
  }
  if (/\b(coding|programming|debugging|code suggestions|scripting)\b/i.test(text) && !/\bno ai code\b/i.test(text)) {
    allowedActivities.push({
      id: 'rule-allowed-coding',
      category: 'allowed',
      activity: 'Coding & Syntax Assistance',
      details: 'Assistance with debugging, syntax lookup, or code explanations.',
      excerpt: extractMatchingSentence(text, /coding|programming|debugging/i),
    });
  }

  // 4. Extract Prohibited Activities
  const prohibitedActivities: PolicyRuleItem[] = [];
  if (
    /\b(direct(ly)? (generat(e|ed|ing)|cop(y|ied)|insert(ed)?)|uncredited text|generating (entire|whole) (essays?|paragraphs?|sections?)|ai-generated prose)\b/i.test(
      text
    ) ||
    status === 'prohibited'
  ) {
    prohibitedActivities.push({
      id: 'rule-prohibited-prose',
      category: 'prohibited',
      activity: 'Direct AI Text Generation as Student Work',
      details: 'Submitting AI-generated sentences, paragraphs, or essays as student-authored prose.',
      excerpt: extractMatchingSentence(text, /direct|generat|copy|submit/i),
    });
  }
  if (/\b(paraphras(e|ing)|rewrit(e|ing)|humaniz(e|ing|er)|spin(ning)? text)\b/i.test(text)) {
    prohibitedActivities.push({
      id: 'rule-prohibited-paraphrase',
      category: 'prohibited',
      activity: 'Automated Paraphrasing & Spinners',
      details: 'Using tools to disguise or rewrite sources without intellectual synthesis.',
      excerpt: extractMatchingSentence(text, /paraphras|rewrit|humaniz/i),
    });
  }
  if (/\b(exam|test|quiz|in-class assessment|timed assessment)\b/i.test(text)) {
    prohibitedActivities.push({
      id: 'rule-prohibited-exams',
      category: 'prohibited',
      activity: 'Exams & Timed Assessments',
      details: 'Using AI tools during examinations or unmonitored tests.',
      excerpt: extractMatchingSentence(text, /exam|test|quiz/i),
    });
  }

  // 5. Disclosure Requirements
  const requiresCitation = /\b(must cite|citation required|acknowledge (use|ai)|disclose (use|ai)|declaration required|apa|mla|chicago)\b/i.test(
    text
  );
  const requiresAppendix = /\b(appendix|include prompts|submit prompt(s)?|chat history|transcripts?)\b/i.test(text);
  const requiresToolName = /\b(tool name|which ai|model used|version (used|specified))\b/i.test(text);

  const disclosureRequirement: PolicyDisclosureRequirement = {
    required: requiresCitation || requiresAppendix || requiresToolName,
    citationStyle: extractCitationStyle(text),
    includePromptsInAppendix: requiresAppendix,
    specifyToolNames: requiresToolName,
    details: requiresCitation
      ? 'Students must explicitly cite AI tools used in their methodology or bibliography.'
      : requiresAppendix
      ? 'Students must submit prompts and raw AI transcripts in an appendix.'
      : 'No mandatory disclosure format was explicitly specified in this text.',
    excerpt: extractMatchingSentence(text, /cite|citation|disclose|acknowledge|appendix/i),
  };

  // 6. Record Retention Requirements
  const requiresDraftingHistory = /\b(version history|draft history|track changes|retain drafts|google doc history)\b/i.test(
    text
  );
  const requiresPromptLogs = /\b(save prompts|keep prompt logs|retain (prompt|conversation) (history|logs|transcripts?)|export chat)\b/i.test(text);

  const recordRetentionRequirement: PolicyRecordRetention = {
    required: requiresDraftingHistory || requiresPromptLogs,
    draftingHistoryRequired: requiresDraftingHistory,
    rawPromptsRequired: requiresPromptLogs,
    details: requiresDraftingHistory
      ? 'Students should maintain verifiable drafting histories, version logs, and notes to demonstrate authentic authorship.'
      : requiresPromptLogs
      ? 'Students must retain raw prompt-and-response transcripts for verification.'
      : 'No explicit record retention requirement was stated.',
    excerpt: extractMatchingSentence(text, /draft|history|prompts?|log|retain/i),
  };

  // 7. Numerical Threshold Interpretation (Strict Semantics)
  const numericalThreshold = parsePolicyNumericalThreshold(text);

  // 8. Ambiguities & Supporting Excerpts
  const ambiguities: string[] = [];
  if (!text.includes('cite') && !text.includes('prohibit') && !text.includes('allow')) {
    ambiguities.push('The supplied text does not clearly state whether AI tools are permitted or restricted.');
  }
  if (text.includes('discretion') || text.includes('varies by instructor')) {
    ambiguities.push('Rules may vary by individual course or instructor. Confirm requirements before submission.');
  }
  if (numericalThreshold.type === 'external-detector') {
    ambiguities.push(
      `Policy references "${numericalThreshold.targetDetectorName || 'External Tool'}". Note that detector scores are not directly interchangeable.`
    );
  }

  // Collect key excerpts
  const sentences = text.split(/(?<=[.?!])\s+/).filter((s) => s.length > 20 && s.length < 240);
  const supportingExcerpts = sentences.slice(0, 4);

  return {
    status,
    statusSummary,
    institutionScope: options.institutionName || extractScope(text, 'institution'),
    courseScope: options.courseOrModule || extractScope(text, 'course'),
    assignmentScope: options.assignmentTitle || extractScope(text, 'assignment'),
    contentHash,
    sourceType: options.sourceType,
    sourceLabel: getSourceTypeLabel(options.sourceType),
    sourceIdentifier: options.sourceIdentifier || 'User-provided instructions',
    allowedActivities,
    prohibitedActivities,
    disclosureRequirement,
    recordRetentionRequirement,
    numericalThreshold,
    ambiguities,
    supportingExcerpts,
    conflictsDetected,
    conflictDetails,
  };
}

/**
 * Strict numerical threshold parser
 */
function parsePolicyNumericalThreshold(text: string): PolicyNumericalThreshold {
  // Check for Turnitin / external detector references with percentage
  const turnitinMatch = text.match(/\b(turnitin|gptzero|copyleaks|zerogpt)\b.*?(\d{1,3})%/i);
  if (turnitinMatch) {
    const detectorName = turnitinMatch[1];
    const pct = parseInt(turnitinMatch[2], 10);
    return {
      type: 'external-detector',
      rawValue: `${pct}%`,
      percentageValue: pct,
      targetDetectorName: detectorName.charAt(0).toUpperCase() + detectorName.slice(1),
      exactDescription: `Policy references a ${pct}% threshold using ${detectorName}.`,
      guidanceText: `This threshold refers to ${detectorName}. AIDetector.cx scores are not directly interchangeable with that measurement.`,
      isInterchangeableWithAIDetector: false,
    };
  }

  // Check for AIDetector.cx explicit mention with threshold
  const aidetectorMatch = text.match(/\baidetector(\.cx)?\b.*?(\b(below|under|at most|less than|above|exceeding)\b)?.*?(\d{1,3})%/i);
  if (aidetectorMatch) {
    const opWord = (aidetectorMatch[2] || 'below').toLowerCase();
    const pct = parseInt(aidetectorMatch[4], 10);
    const op: '<' | '<=' | '>' | '>=' = opWord.includes('most') ? '<=' : opWord.includes('above') || opWord.includes('exceed') ? '>' : '<';
    return {
      type: 'aidetector-compatible',
      rawValue: `${pct}%`,
      percentageValue: pct,
      comparisonOperator: op,
      targetDetectorName: 'AIDetector.cx',
      exactDescription: `Policy explicitly specifies AIDetector.cx score must be ${opWord} ${pct}%.`,
      guidanceText: `This numerical comparison does not establish compliance with every assignment rule.`,
      isInterchangeableWithAIDetector: true,
    };
  }

  // Check for rule about actual AI usage (e.g. "AI-generated text must not exceed 20% of the essay")
  const actualUsageMatch = text.match(/\b(ai[- ]generated (writing|text|content|work)|actual ai (use|usage)|no more than|must not exceed)\b.*?(\d{1,3})%/i);
  if (actualUsageMatch) {
    const pct = parseInt(actualUsageMatch[4], 10);
    return {
      type: 'actual-ai-usage',
      rawValue: `${pct}%`,
      percentageValue: pct,
      exactDescription: `Policy restricts actual AI-generated content to ${pct}% of the assignment.`,
      guidanceText: `This is a rule about actual student AI use, not a detector probability score. Detection scores estimate statistical likelihood and do not measure precise text percentages.`,
      isInterchangeableWithAIDetector: false,
    };
  }

  // Default: No numerical threshold specified
  return {
    type: 'none',
    exactDescription: 'Accepted detection percentage: Not specified in the supplied policy.',
    guidanceText: 'A missing numerical threshold does not mean 0% or an automatic pass. Review qualitative requirements such as citations and authentic drafting.',
    isInterchangeableWithAIDetector: false,
  };
}

/**
 * Compares declared student AI activities against the structured policy
 */
export function evaluateStudentDeclaration(
  declaredActivities: DeclaredAIActivity[],
  interpretation: StructuredPolicyInterpretation | null
): ActivityComparisonResult[] {
  if (!declaredActivities || declaredActivities.length === 0) {
    return [];
  }

  if (!interpretation) {
    return declaredActivities.map((act) => ({
      activityId: act,
      activityLabel: DECLARED_ACTIVITIES_METADATA[act]?.label || act,
      verdict: 'not-assessed',
      explanation: 'No policy text has been provided yet to compare against your declaration.',
    }));
  }

  const results: ActivityComparisonResult[] = [];

  for (const act of declaredActivities) {
    const meta = DECLARED_ACTIVITIES_METADATA[act];
    const label = meta ? meta.label : act;

    if (act === 'none') {
      results.push({
        activityId: act,
        activityLabel: label,
        verdict: 'permitted-with-conditions',
        explanation: 'Your declared activity (no AI assistance) aligns with standard independent student authorship.',
      });
      continue;
    }

    if (act === 'prefer-not-to-specify') {
      results.push({
        activityId: act,
        activityLabel: label,
        verdict: 'not-assessed',
        explanation: 'Review the policy rules above to verify whether your intended AI workflow is permitted.',
      });
      continue;
    }

    // Prohibited policy override
    if (interpretation.status === 'prohibited') {
      results.push({
        activityId: act,
        activityLabel: label,
        verdict: 'potential-conflict',
        explanation: `Your declared activity may conflict with this instruction. The supplied policy indicates all AI assistance is prohibited.`,
        relevantRuleExcerpt: interpretation.supportingExcerpts[0],
      });
      continue;
    }

    // Direct generation evaluation
    if (act === 'generated-sentences' || act === 'rewriting-paraphrasing') {
      const hasProhibition = interpretation.prohibitedActivities.some(
        (p) => p.activity.toLowerCase().includes('generation') || p.activity.toLowerCase().includes('paraphras')
      );
      if (hasProhibition) {
        results.push({
          activityId: act,
          activityLabel: label,
          verdict: 'potential-conflict',
          explanation: `Your declared activity may conflict with this instruction. Direct text generation or automated paraphrasing is restricted.`,
          relevantRuleExcerpt: interpretation.prohibitedActivities[0]?.excerpt,
        });
      } else {
        results.push({
          activityId: act,
          activityLabel: label,
          verdict: 'permitted-with-conditions',
          explanation: `Your declared activity is subject to disclosure conditions. Ensure you cite the tool and retain your prompt transcripts if required.`,
        });
      }
      continue;
    }

    // Ideation & Editing evaluation
    if (act === 'brainstorming' || act === 'outlining' || act === 'grammar-spelling' || act === 'translation' || act === 'research-summaries') {
      const isAllowed = interpretation.allowedActivities.some((a) =>
        a.activity.toLowerCase().includes(act.replace('-spelling', '').replace('-summaries', ''))
      );

      if (isAllowed || interpretation.status === 'permitted' || interpretation.status === 'restricted') {
        results.push({
          activityId: act,
          activityLabel: label,
          verdict: 'permitted-with-conditions',
          explanation: `Your declared activity is listed as permitted, subject to general citation and academic integrity guidelines.`,
          relevantRuleExcerpt: interpretation.allowedActivities.find((a) =>
            a.activity.toLowerCase().includes(act.replace('-spelling', ''))
          )?.excerpt,
        });
      } else {
        results.push({
          activityId: act,
          activityLabel: label,
          verdict: 'unaddressed-by-policy',
          explanation: `The policy does not clearly address this activity. Ask your instructor if ${label.toLowerCase()} is permitted.`,
        });
      }
      continue;
    }

    // Other / Coding
    results.push({
      activityId: act,
      activityLabel: label,
      verdict: 'unaddressed-by-policy',
      explanation: `The policy does not explicitly mention this activity. Verify permission with your instructor.`,
    });
  }

  return results;
}

function getSourceTypeLabel(type: PolicySourceType): string {
  switch (type) {
    case 'user-provided':
      return 'User-provided instructions (institutional authenticity not independently verified)';
    case 'retrieved-url':
      return 'Retrieved policy (confirm applicability to your specific assessment)';
    case 'admin-reviewed':
      return 'Administrator-reviewed institutional policy';
    default:
      return 'User-provided text';
  }
}

function extractMatchingSentence(text: string, pattern: RegExp): string | undefined {
  const sentences = text.split(/(?<=[.?!])\s+/);
  for (const s of sentences) {
    if (pattern.test(s) && s.length > 15) {
      return s.trim();
    }
  }
  return undefined;
}

function extractCitationStyle(text: string): string | undefined {
  if (/\bapa\b/i.test(text)) return 'APA Style';
  if (/\bmla\b/i.test(text)) return 'MLA Style';
  if (/\bchicago\b/i.test(text)) return 'Chicago Style';
  if (/\bharvard\b/i.test(text)) return 'Harvard Style';
  if (/\bieee\b/i.test(text)) return 'IEEE Style';
  return undefined;
}

function extractScope(text: string, kind: 'institution' | 'course' | 'assignment'): string | undefined {
  if (kind === 'institution') {
    const match = text.match(/\b(university|college|institute|school|academy)\s+of\s+[A-Za-z\s]+/i);
    return match ? match[0] : undefined;
  }
  return undefined;
}
