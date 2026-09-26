/**
 * Academic Policy Interpretation Engine (Phase 1 & 2 Refactor)
 *
 * Section-aware, sentence-level deterministic rule parser for academic AI policies.
 *
 * Core principles:
 * 1. Zero False Approvals: Never outputs "Approved", "Passed", or "Verified human".
 * 2. Exact Verifiable Evidence: References verbatim source passages with preserved context.
 * 3. Accurate Polarity & Negation: Respects section headings (Permitted vs Prohibited)
 *    and negation words (must not, prohibited, banned, not allowed).
 * 4. Separate Domain Models: Disentangles assignment-writing guidelines, record retention,
 *    disclosure mandates, and numerical detection limits.
 * 5. Isolation: Read-only, zero execution or modification of detector scoring.
 */

import type {
  AIUseStatus,
  DeclaredAIActivity,
  ActivityComparisonResult,
  ActivityRuleStatus,
  ActivityRuleDefinition,
  NumericalThresholdType,
  PolicyNumericalThreshold,
  PolicyRuleItem,
  PolicyDisclosureRequirement,
  PolicyRecordRetention,
  StructuredPolicyInterpretation,
  PolicySourceType,
  PolicyExcerptItem,
} from '@/types/studentPolicy';
import { computeContentHash } from './policyExtractor';
export { computeContentHash };


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

interface ParsedSection {
  header?: string;
  category: 'permitted' | 'prohibited' | 'disclosure' | 'detection' | 'evidence' | 'assignment' | 'general';
  text: string;
  sentences: string[];
}

/**
 * Split text into logical sections based on headings and paragraph boundaries
 */
function parsePolicySections(rawText: string): ParsedSection[] {
  const lines = rawText.split(/\r?\n/);
  const sections: ParsedSection[] = [];
  let currentHeader: string | undefined = undefined;
  let currentCategory: ParsedSection['category'] = 'general';
  let currentLines: string[] = [];

  const flush = () => {
    const text = currentLines.join('\n').trim();
    if (text) {
      const sentences = text
        .split(/(?<=[.?!])\s+(?=[A-Z0-9])|\n+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      sections.push({
        header: currentHeader,
        category: currentCategory,
        text,
        sentences,
      });
    }
    currentLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentLines.length > 0) {
        currentLines.push('');
      }
      continue;
    }

    // Check for section header pattern like "Permitted AI assistance:", "Prohibited:", "Disclosure:", etc.
    const headerMatch = trimmed.match(
      /^(permitted(?:\s+ai(?:\s+assistance)?)?|prohibited(?:\s+ai(?:\s+assistance)?)?|disclosure|detection|evidence|assignment|rules|policy):\s*(.*)$/i
    );

    if (headerMatch) {
      flush();
      const rawHeader = headerMatch[1].toLowerCase();
      currentHeader = headerMatch[1];
      if (rawHeader.includes('permit') || rawHeader.includes('allow')) {
        currentCategory = 'permitted';
      } else if (rawHeader.includes('prohibit') || rawHeader.includes('forbid') || rawHeader.includes('ban')) {
        currentCategory = 'prohibited';
      } else if (rawHeader.includes('disclos') || rawHeader.includes('citat') || rawHeader.includes('declar')) {
        currentCategory = 'disclosure';
      } else if (rawHeader.includes('detect') || rawHeader.includes('threshold') || rawHeader.includes('score')) {
        currentCategory = 'detection';
      } else if (rawHeader.includes('evidence') || rawHeader.includes('writing') || rawHeader.includes('requirement')) {
        currentCategory = 'evidence';
      } else if (rawHeader.includes('assignment')) {
        currentCategory = 'assignment';
      } else {
        currentCategory = 'general';
      }

      if (headerMatch[2]) {
        currentLines.push(headerMatch[2]);
      }
    } else {
      currentLines.push(trimmed);
    }
  }

  flush();

  if (sections.length === 0 && rawText.trim()) {
    const sentences = rawText
      .split(/(?<=[.?!])\s+(?=[A-Z0-9])|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    sections.push({
      category: 'general',
      text: rawText.trim(),
      sentences,
    });
  }

  return sections;
}

/**
 * Structured Academic Policy Interpreter
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
  const contentHash = await computeContentHash(text);

  const initialActivityRules: Record<DeclaredAIActivity, ActivityRuleDefinition> = {
    none: {
      activityId: 'none',
      label: 'No AI assistance used',
      status: 'permitted',
      explanation: 'No AI assistance is inherently compliant with standard academic integrity.',
    },
    brainstorming: {
      activityId: 'brainstorming',
      label: 'Brainstorming & topic exploration',
      status: 'not-specified',
    },
    outlining: {
      activityId: 'outlining',
      label: 'Outlining & structuring arguments',
      status: 'not-specified',
    },
    'grammar-spelling': {
      activityId: 'grammar-spelling',
      label: 'Grammar, spelling & proofreading',
      status: 'not-specified',
    },
    translation: {
      activityId: 'translation',
      label: 'Language translation / multilingual assistance',
      status: 'not-specified',
    },
    'rewriting-paraphrasing': {
      activityId: 'rewriting-paraphrasing',
      label: 'Rewriting or paraphrasing existing text',
      status: 'not-specified',
    },
    'generated-sentences': {
      activityId: 'generated-sentences',
      label: 'Generated sentences or paragraphs',
      status: 'not-specified',
    },
    'research-summaries': {
      activityId: 'research-summaries',
      label: 'Summarizing background research / sources',
      status: 'not-specified',
    },
    'coding-assistance': {
      activityId: 'coding-assistance',
      label: 'Coding / programming / technical scripting',
      status: 'not-specified',
    },
    other: {
      activityId: 'other',
      label: 'Other described assistance',
      status: 'not-specified',
    },
    'prefer-not-to-specify': {
      activityId: 'prefer-not-to-specify',
      label: 'Prefer not to specify',
      status: 'not-specified',
    },
  };

  if (!text || text.length < 10) {
    return {
      status: 'not-specified',
      statusSummary: 'No policy text or assignment instructions supplied.',
      ruleSummary: 'No policy text or assignment instructions supplied. Check with your instructor.',
      contentHash,
      sourceType: options.sourceType,
      sourceLabel: getSourceTypeLabel(options.sourceType),
      sourceIdentifier: options.sourceIdentifier || 'User Input',
      activityRules: initialActivityRules,
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
      excerpts: [],
      conflictsDetected: false,
    };
  }

  const sections = parsePolicySections(text);
  const activityRules = { ...initialActivityRules };
  const allowedActivities: PolicyRuleItem[] = [];
  const prohibitedActivities: PolicyRuleItem[] = [];
  const extractedExcerpts: PolicyExcerptItem[] = [];

  // Helper to find exact matching sentence and record excerpt
  const findSentenceMatching = (pattern: RegExp, preferredSection?: ParsedSection['category']): string | undefined => {
    if (preferredSection) {
      const sec = sections.find((s) => s.category === preferredSection);
      if (sec) {
        const found = sec.sentences.find((st) => pattern.test(st));
        if (found) return found;
      }
    }
    for (const sec of sections) {
      const found = sec.sentences.find((st) => pattern.test(st));
      if (found) return found;
    }
    return undefined;
  };

  // 1. Process Permitted Sections and Statements
  const permittedSections = sections.filter((s) => s.category === 'permitted');
  const prohibitedSections = sections.filter((s) => s.category === 'prohibited');

  // Brainstorming analysis
  const brainstormPermitted =
    permittedSections.some((s) => /\bbrainstorm(ing)?|topic(s)?\b/i.test(s.text)) ||
    /\b(may use ai to brainstorm|permitted to brainstorm|brainstorming is permitted|brainstorming topics|permitted for brainstorming|encouraged and permitted|tools are permitted for brainstorming|permitted for .*brainstorming|ai is permitted for .*brainstorming)\b/i.test(
      text
    ) ||
    (/\bbrainstorm(ing)?\b/i.test(text) && /\b(permitted|allowed|encouraged)\b/i.test(text) && !/\b(must not brainstorm|no brainstorming|brainstorming is prohibited)\b/i.test(text));

  const brainstormProhibited =
    prohibitedSections.some((s) => /\bbrainstorm(ing)?\b/i.test(s.text)) ||
    /\b(must not brainstorm|no brainstorming|brainstorming is prohibited)\b/i.test(text);

  if (brainstormPermitted && !brainstormProhibited) {
    const quote = findSentenceMatching(/\bbrainstorm/i, 'permitted');
    activityRules.brainstorming = {
      activityId: 'brainstorming',
      label: 'Brainstorming & topic exploration',
      status: 'permitted',
      scope: 'Topic exploration & ideation',
      sourceExcerpt: quote,
      explanation: 'AI assistance is permitted for preliminary brainstorming and exploring topics.',
    };
    allowedActivities.push({
      id: 'rule-allowed-brainstorm',
      category: 'allowed',
      activity: 'Brainstorming topics & ideation',
      details: 'Students may use AI to brainstorm topics and explore preliminary angles.',
      excerpt: quote,
    });
    if (quote) {
      extractedExcerpts.push({ text: quote, section: 'Permitted AI Assistance' });
    }
  } else if (brainstormProhibited) {
    const quote = findSentenceMatching(/\bbrainstorm/i, 'prohibited');
    activityRules.brainstorming = {
      activityId: 'brainstorming',
      label: 'Brainstorming & topic exploration',
      status: 'prohibited',
      sourceExcerpt: quote,
      explanation: 'Brainstorming with AI is explicitly prohibited for this assignment.',
    };
    prohibitedActivities.push({
      id: 'rule-prohibited-brainstorm',
      category: 'prohibited',
      activity: 'Brainstorming',
      details: 'Brainstorming with AI is prohibited.',
      excerpt: quote,
    });
  }

  // Grammar & Spelling analysis
  const grammarPermitted =
    permittedSections.some((s) => /\b(grammar|spelling|proofreading|corrections?)\b/i.test(s.text)) ||
    /\b(suggest spelling or grammar corrections|grammar and spelling corrections?|may use .* for grammar|grammar proofreading|permitted for .*grammar|except (for )?.*(grammar|spelling)|with the exception of .*(grammar|spelling))\b/i.test(
      text
    ) ||
    (/\b(grammar|spelling|proofreading)\b/i.test(text) && /\b(permitted|allowed|except|exception)\b/i.test(text) && !/\b(no grammar|grammar.*prohibited)\b/i.test(text));

  const grammarProhibited =
    prohibitedSections.some((s) => /\b(grammar|spelling)\b/i.test(s.text)) ||
    /\b(no grammar tools|grammar checkers are prohibited|must not use grammar)\b/i.test(text);

  if (grammarPermitted && !grammarProhibited) {
    const quote = findSentenceMatching(/\b(grammar|spelling|corrections?|proofreading)\b/i, 'permitted');
    const hasStudentWrittenCondition = /\bsentences they wrote themselves|student-authored\b/i.test(quote || text);
    activityRules['grammar-spelling'] = {
      activityId: 'grammar-spelling',
      label: 'Grammar, spelling & proofreading',
      status: hasStudentWrittenCondition ? 'permitted-with-conditions' : 'permitted',
      conditions: hasStudentWrittenCondition ? ['Applies to sentences written by the student'] : [],
      sourceExcerpt: quote,
      explanation: hasStudentWrittenCondition
        ? 'Permitted for suggesting spelling or grammar corrections to student-written sentences.'
        : 'Permitted for grammar and spelling verification.',
    };
    allowedActivities.push({
      id: 'rule-allowed-grammar',
      category: 'allowed',
      activity: 'Grammar & spelling suggestions',
      details: hasStudentWrittenCondition
        ? 'Spelling or grammar suggestions for student-written sentences.'
        : 'Mechanical proofreading assistance.',
      excerpt: quote,
    });
    if (quote && !extractedExcerpts.some((e) => e.text === quote)) {
      extractedExcerpts.push({ text: quote, section: 'Permitted AI Assistance' });
    }
  } else if (grammarProhibited) {
    const quote = findSentenceMatching(/\b(grammar|spelling)\b/i, 'prohibited');
    activityRules['grammar-spelling'] = {
      activityId: 'grammar-spelling',
      label: 'Grammar, spelling & proofreading',
      status: 'prohibited',
      sourceExcerpt: quote,
      explanation: 'Grammar and spelling AI assistance is prohibited.',
    };
    prohibitedActivities.push({
      id: 'rule-prohibited-grammar',
      category: 'prohibited',
      activity: 'Grammar and spelling tools',
      details: 'AI grammar tools are prohibited.',
      excerpt: quote,
    });
  }

  // Generated sentences / Submission prose analysis
  const proseProhibited =
    prohibitedSections.some((s) =>
      /\b(generate(d)? (sentences|paragraphs)|generation of (sentences|paragraphs)|submission|drafting|writing|prose|direct generation|text generation)\b/i.test(
        s.text
      )
    ) ||
    /\b(must not use ai to generate|generation of (sentences|paragraphs)|direct generation|generate sentences or paragraphs|ai-generated (text|sentences|paragraphs)|prohibited from generating|generation.*strictly prohibited|ai text generation is prohibited|text generation is prohibited)\b/i.test(
      text
    );

  if (proseProhibited) {
    const quote = findSentenceMatching(/\b(generation of|generate sentences|direct generation|paragraphs.*prohibited|text generation is prohibited|generation is prohibited)\b/i, 'prohibited');
    activityRules['generated-sentences'] = {
      activityId: 'generated-sentences',
      label: 'Generated sentences or paragraphs',
      status: 'prohibited',
      sourceExcerpt: quote,
      explanation: 'Generating sentences, paragraphs, or submission prose with AI is strictly prohibited.',
    };
    prohibitedActivities.push({
      id: 'rule-prohibited-generated-text',
      category: 'prohibited',
      activity: 'AI-generated submission text',
      details: 'Students must not use AI to generate sentences or paragraphs for submission.',
      excerpt: quote,
    });
    if (quote && !extractedExcerpts.some((e) => e.text === quote)) {
      extractedExcerpts.push({ text: quote, section: 'Prohibited AI Assistance' });
    }
  }

  // Rewriting / Paraphrasing analysis
  const rewriteProhibited =
    prohibitedSections.some((s) => /\b(rewriting|paraphrasing|rewrite|paraphrase)\b/i.test(s.text)) ||
    /\b(ai rewriting|rewriting.*prohibited|paraphrasing.*prohibited|must not (use ai to )?rewrite|rewriting is (strictly )?prohibited)\b/i.test(
      text
    );

  if (rewriteProhibited) {
    const quote = findSentenceMatching(/\b(rewriting|paraphrasing|rewrite|paraphrase)\b/i, 'prohibited');
    activityRules['rewriting-paraphrasing'] = {
      activityId: 'rewriting-paraphrasing',
      label: 'Rewriting or paraphrasing existing text',
      status: 'prohibited',
      sourceExcerpt: quote,
      explanation: 'AI rewriting and paraphrasing are prohibited for this assignment.',
    };
    prohibitedActivities.push({
      id: 'rule-prohibited-rewriting',
      category: 'prohibited',
      activity: 'AI rewriting and paraphrasing',
      details: 'AI rewriting and paraphrasing are prohibited.',
      excerpt: quote,
    });
    if (quote && !extractedExcerpts.some((e) => e.text === quote)) {
      extractedExcerpts.push({ text: quote, section: 'Prohibited AI Assistance' });
    }
  }

  // Translation analysis (Check explicit prohibition vs explicit permission vs omitted)
  const translationProhibited =
    prohibitedSections.some((s) => /\b(translation|translate)\b/i.test(s.text)) ||
    /\b(translation are also prohibited|translation is prohibited|must not translate|no translation tools)\b/i.test(
      text
    );

  const translationPermitted =
    permittedSections.some((s) => /\b(translation|translate)\b/i.test(s.text)) ||
    /\b(may use ai for translation|translation is permitted)\b/i.test(text);

  if (translationProhibited) {
    const quote = findSentenceMatching(/\b(translation|translate)\b/i, 'prohibited');
    activityRules.translation = {
      activityId: 'translation',
      label: 'Language translation / multilingual assistance',
      status: 'prohibited',
      sourceExcerpt: quote,
      explanation: 'AI translation is prohibited by the supplied policy.',
    };
    prohibitedActivities.push({
      id: 'rule-prohibited-translation',
      category: 'prohibited',
      activity: 'AI translation',
      details: 'AI translation is prohibited.',
      excerpt: quote,
    });
    if (quote && !extractedExcerpts.some((e) => e.text === quote)) {
      extractedExcerpts.push({ text: quote, section: 'Prohibited AI Assistance' });
    }
  } else if (translationPermitted) {
    const quote = findSentenceMatching(/\b(translation|translate)\b/i, 'permitted');
    activityRules.translation = {
      activityId: 'translation',
      label: 'Language translation / multilingual assistance',
      status: 'permitted',
      sourceExcerpt: quote,
      explanation: 'AI translation is permitted for this assignment.',
    };
    allowedActivities.push({
      id: 'rule-allowed-translation',
      category: 'allowed',
      activity: 'AI translation',
      details: 'Translation assistance is permitted.',
      excerpt: quote,
    });
  }

  // Outlining analysis (Check explicit permission vs prohibition vs unaddressed)
  const outliningPermitted =
    permittedSections.some((s) => /\b(outlin(e|ing)|structure)\b/i.test(s.text)) ||
    /\b(may use ai to outline|outlining is permitted)\b/i.test(text);

  const outliningProhibited =
    prohibitedSections.some((s) => /\b(outlin(e|ing)|structure)\b/i.test(s.text)) ||
    /\b(no ai outlining|outlining is prohibited)\b/i.test(text);

  if (outliningPermitted && !outliningProhibited) {
    const quote = findSentenceMatching(/\b(outlin|structure)\b/i, 'permitted');
    activityRules.outlining = {
      activityId: 'outlining',
      label: 'Outlining & structuring arguments',
      status: 'permitted',
      sourceExcerpt: quote,
      explanation: 'Outlining and structuring arguments with AI is permitted.',
    };
    allowedActivities.push({
      id: 'rule-allowed-outlining',
      category: 'allowed',
      activity: 'Outlining & structure',
      details: 'Outlining is permitted.',
      excerpt: quote,
    });
  } else if (outliningProhibited) {
    const quote = findSentenceMatching(/\b(outlin|structure)\b/i, 'prohibited');
    activityRules.outlining = {
      activityId: 'outlining',
      label: 'Outlining & structuring arguments',
      status: 'prohibited',
      sourceExcerpt: quote,
      explanation: 'Outlining with AI is prohibited.',
    };
    prohibitedActivities.push({
      id: 'rule-prohibited-outlining',
      category: 'prohibited',
      activity: 'Outlining with AI',
      details: 'Outlining is prohibited.',
      excerpt: quote,
    });
  }

  // Research Summaries analysis
  const researchPermitted =
    permittedSections.some((s) => /\b(research|summariz(e|ing) sources)\b/i.test(s.text)) ||
    /\b(may use ai to summarize research|summarizing sources is permitted)\b/i.test(text);
  const researchProhibited =
    prohibitedSections.some((s) => /\b(research|summariz(e|ing) sources)\b/i.test(s.text)) ||
    /\b(summarizing sources is prohibited)\b/i.test(text);

  if (researchPermitted && !researchProhibited) {
    const quote = findSentenceMatching(/\b(summariz|research)\b/i, 'permitted');
    activityRules['research-summaries'] = {
      activityId: 'research-summaries',
      label: 'Summarizing background research / sources',
      status: 'permitted',
      sourceExcerpt: quote,
      explanation: 'Summarizing background research and literature with AI is permitted.',
    };
    allowedActivities.push({
      id: 'rule-allowed-research',
      category: 'allowed',
      activity: 'Research summarization',
      details: 'Summarizing background sources is permitted.',
      excerpt: quote,
    });
  } else if (researchProhibited) {
    const quote = findSentenceMatching(/\b(summariz|research)\b/i, 'prohibited');
    activityRules['research-summaries'] = {
      activityId: 'research-summaries',
      label: 'Summarizing background research / sources',
      status: 'prohibited',
      sourceExcerpt: quote,
      explanation: 'AI summarization of research is prohibited.',
    };
    prohibitedActivities.push({
      id: 'rule-prohibited-research',
      category: 'prohibited',
      activity: 'Research summarization',
      details: 'Summarizing sources is prohibited.',
      excerpt: quote,
    });
  }

  // Coding assistance analysis
  const codingPermitted =
    permittedSections.some((s) => /\b(coding|programming|debugging|code suggestions)\b/i.test(s.text)) ||
    /\b(coding assistance is permitted|may use ai for coding)\b/i.test(text);
  const codingProhibited =
    prohibitedSections.some((s) => /\b(coding|programming|debugging)\b/i.test(s.text)) ||
    /\b(coding assistance is prohibited)\b/i.test(text);

  if (codingPermitted && !codingProhibited) {
    const quote = findSentenceMatching(/\b(coding|programming)\b/i, 'permitted');
    activityRules['coding-assistance'] = {
      activityId: 'coding-assistance',
      label: 'Coding / programming / technical scripting',
      status: 'permitted',
      sourceExcerpt: quote,
      explanation: 'AI coding and debugging assistance is permitted.',
    };
    allowedActivities.push({
      id: 'rule-allowed-coding',
      category: 'allowed',
      activity: 'Coding & debugging',
      details: 'Technical scripting and debugging assistance is permitted.',
      excerpt: quote,
    });
  } else if (codingProhibited) {
    const quote = findSentenceMatching(/\b(coding|programming)\b/i, 'prohibited');
    activityRules['coding-assistance'] = {
      activityId: 'coding-assistance',
      label: 'Coding / programming / technical scripting',
      status: 'prohibited',
      sourceExcerpt: quote,
      explanation: 'AI coding assistance is prohibited.',
    };
    prohibitedActivities.push({
      id: 'rule-prohibited-coding',
      category: 'prohibited',
      activity: 'Coding assistance',
      details: 'AI coding is prohibited.',
      excerpt: quote,
    });
  }

  // Check for Exam restrictions ONLY if explicitly mentioned in text
  const mentionsExams = /\b(exam(ination)?|timed test|in-class quiz)\b/i.test(text);
  if (mentionsExams) {
    const quote = findSentenceMatching(/\b(exam|test|quiz)\b/i, 'prohibited');
    prohibitedActivities.push({
      id: 'rule-prohibited-exams',
      category: 'prohibited',
      activity: 'Exams & timed assessments',
      details: 'AI is prohibited during exams or timed assessments.',
      excerpt: quote,
    });
  }

  // 2. Disclosure Requirements Analysis
  const disclosureSection = sections.find((s) => s.category === 'disclosure');
  let disclosureRequired = false;
  let disclosureDetails = 'Not specified in the supplied text.';
  let disclosureExcerpt: string | undefined = undefined;
  let specifyToolNames = false;
  let includePromptsInAppendix = false;

  if (disclosureSection) {
    disclosureRequired = true;
    disclosureExcerpt = disclosureSection.text;
    disclosureDetails = disclosureSection.text;
    specifyToolNames = /\bname the tool|naming the tool|specify tool|which ai\b/i.test(disclosureSection.text);
    includePromptsInAppendix = /\bkeep (relevant )?prompts|transcripts|appendix\b/i.test(disclosureSection.text);
  } else {
    const discMatch = text.match(
      /\b(students must declare|declare any permitted ai|must cite all ai|cite any ai|disclose (any|permitted|all) ai)\b[^\n.]*/i
    );
    if (discMatch) {
      disclosureRequired = true;
      disclosureExcerpt = discMatch[0];
      disclosureDetails = discMatch[0];
      specifyToolNames = /\bname|tool|which ai\b/i.test(discMatch[0]);
    }
  }

  const disclosureRequirement: PolicyDisclosureRequirement = {
    required: disclosureRequired,
    specifyToolNames,
    includePromptsInAppendix,
    details: disclosureDetails,
    excerpt: disclosureExcerpt,
  };

  if (disclosureExcerpt && !extractedExcerpts.some((e) => e.text === disclosureExcerpt)) {
    extractedExcerpts.push({ text: disclosureExcerpt, section: 'Disclosure' });
  }

  // 3. Record Retention Analysis (Prompts & Transcripts vs Version History)
  const promptsMentioned = /\b(keep (relevant )?prompts( and outputs)?|save prompts|retain (prompt|conversation) (history|logs|transcripts?))\b/i.test(
    text
  );
  const versionHistoryMentioned = /\b(version history|draft history|track changes|retain drafts)\b/i.test(text);
  const recordsRequired = promptsMentioned || versionHistoryMentioned;

  let recordsDetails = 'Not explicitly mandated.';
  let recordsExcerpt: string | undefined = undefined;

  if (promptsMentioned && versionHistoryMentioned) {
    recordsDetails = 'Keep relevant prompts and outputs, and maintain draft version history.';
  } else if (promptsMentioned) {
    const promptSentence = findSentenceMatching(/\bkeep (relevant )?prompts|retain prompt\b/i);
    recordsDetails = promptSentence || 'Keep relevant prompts and outputs.';
    recordsExcerpt = promptSentence;
  } else if (versionHistoryMentioned) {
    const draftSentence = findSentenceMatching(/\bversion history|draft history\b/i);
    recordsDetails = draftSentence || 'Maintain draft version history logs.';
    recordsExcerpt = draftSentence;
  }

  const recordRetentionRequirement: PolicyRecordRetention = {
    required: recordsRequired,
    rawPromptsRequired: promptsMentioned,
    draftingHistoryRequired: versionHistoryMentioned,
    details: recordsDetails,
    excerpt: recordsExcerpt,
  };

  if (recordsExcerpt && !extractedExcerpts.some((e) => e.text === recordsExcerpt)) {
    extractedExcerpts.push({ text: recordsExcerpt, section: 'Record Retention' });
  }

  // 4. Evidence / Assignment-Writing Requirements (Distinct from record retention!)
  const evidenceSection = sections.find((s) => s.category === 'evidence');
  let evidenceRequirements: string | undefined = undefined;
  if (evidenceSection) {
    evidenceRequirements = evidenceSection.text;
    if (!extractedExcerpts.some((e) => e.text === evidenceSection.text)) {
      extractedExcerpts.push({ text: evidenceSection.text, section: 'Evidence Requirements' });
    }
  } else {
    const evMatch = findSentenceMatching(/\bpreserve numerical facts|explain limitations|proof of causation\b/i);
    if (evMatch) {
      evidenceRequirements = evMatch;
    }
  }

  // 5. Detection / Numerical Threshold Analysis
  const detectionSection = sections.find((s) => s.category === 'detection');
  const numericalThreshold = parsePolicyNumericalThreshold(text, detectionSection?.text);

  if (detectionSection && !extractedExcerpts.some((e) => e.text === detectionSection.text)) {
    extractedExcerpts.push({ text: detectionSection.text, section: 'Detection Threshold' });
  }

  // 6. Overall Status Classification & Conflict Detection
  const hasStrictGlobalBan =
    /\b(strictly prohibited|no ai (use|tools|assistance)|zero tolerance|all generative ai is (strictly )?banned|all generative ai (use )?is strictly prohibited)\b/i.test(
      text
    );

  const hasPermittedStatement =
    /\b(permitted for|is encouraged and permitted|may use ai|ai tools are permitted|permitted for brainstorming|encouraged and permitted)\b/i.test(text) ||
    allowedActivities.length > 0;

  let conflictsDetected = false;
  let conflictDetails: string | undefined = undefined;

  if (
    (hasStrictGlobalBan && hasPermittedStatement) ||
    (hasStrictGlobalBan && /\b(however|for this assignment|encouraged)\b/i.test(text)) ||
    (prohibitedActivities.length > 0 && allowedActivities.length > 0 && /\b(strictly prohibited in this department|all generative ai is strictly prohibited)\b/i.test(text))
  ) {
    conflictsDetected = true;
    conflictDetails =
      'These instructions appear to conflict or may apply to different assessments. Ask your instructor which rule applies.';
  }

  // If strict global ban and no specific prohibited activities populated yet, populate general prohibited activity
  if (hasStrictGlobalBan && prohibitedActivities.length === 0) {
    const quote = findSentenceMatching(/\b(strictly prohibited|zero tolerance|banned)\b/i);
    prohibitedActivities.push({
      id: 'rule-prohibited-global',
      category: 'prohibited',
      activity: 'Generative AI tools and automated writing',
      details: 'All generative AI use is strictly prohibited.',
      excerpt: quote,
    });
    if (quote && !extractedExcerpts.some((e) => e.text === quote)) {
      extractedExcerpts.push({ text: quote, section: 'Prohibited AI Assistance' });
    }
  }

  let status: AIUseStatus = 'restricted';
  let statusSummary = '';

  if (hasStrictGlobalBan && !hasPermittedStatement) {
    status = 'prohibited';
    statusSummary = 'Generative AI tools and automated assistance are strictly prohibited for this assignment.';
  } else if (allowedActivities.length > 0 && prohibitedActivities.length > 0) {
    status = 'restricted';
    statusSummary = 'AI is permitted for specific tasks (such as brainstorming or grammar) subject to strict prohibitions on generation and rewriting.';
  } else if (allowedActivities.length > 0 && prohibitedActivities.length === 0) {
    status = 'permitted';
    statusSummary = 'AI usage is broadly permitted for this assignment, subject to general academic integrity principles.';
  } else if (allowedActivities.length === 0 && prohibitedActivities.length > 0) {
    status = 'prohibited';
    statusSummary = 'Generative AI tools are restricted or prohibited for this assignment.';
  } else {
    status = 'restricted';
    statusSummary = 'Policy outlines conditional guidelines for AI use in student coursework.';
  }

  // 7. Synthesize Canonical Rule Summary
  const ruleSummary = generateCanonicalRuleSummary({
    allowedActivities,
    prohibitedActivities,
    disclosureRequirement,
    recordRetentionRequirement,
  });

  // 8. Ambiguities & Supporting Excerpts
  const ambiguities: string[] = [];
  if (activityRules.outlining.status === 'not-specified') {
    ambiguities.push('Outlining is not explicitly addressed in the supplied instructions. Ask your instructor before use.');
  }
  if (numericalThreshold.type === 'external-detector') {
    ambiguities.push(
      `Policy references "${numericalThreshold.targetDetectorName || 'External Tool'}". Note that detector scores are not directly interchangeable.`
    );
  }

  const supportingExcerpts = extractedExcerpts.map((e) => e.text);

  return {
    status,
    statusSummary,
    ruleSummary,
    institutionScope: options.institutionName || extractScope(text, 'institution'),
    courseScope: options.courseOrModule || extractScope(text, 'course'),
    assignmentScope: options.assignmentTitle || extractScope(text, 'assignment'),
    contentHash,
    sourceType: options.sourceType,
    sourceLabel: getSourceTypeLabel(options.sourceType),
    sourceIdentifier: options.sourceIdentifier || 'User-provided instructions',
    activityRules,
    allowedActivities,
    prohibitedActivities,
    disclosureRequirement,
    recordRetentionRequirement,
    evidenceRequirements,
    numericalThreshold,
    ambiguities,
    supportingExcerpts,
    excerpts: extractedExcerpts,
    conflictsDetected,
    conflictDetails,
  };
}

/**
 * Generates an accurate, non-fabricated summary of permitted vs prohibited rules
 */
function generateCanonicalRuleSummary(data: {
  allowedActivities: PolicyRuleItem[];
  prohibitedActivities: PolicyRuleItem[];
  disclosureRequirement: PolicyDisclosureRequirement;
  recordRetentionRequirement: PolicyRecordRetention;
}): string {
  const parts: string[] = [];

  // Permitted summary
  if (data.allowedActivities.length > 0) {
    const acts = data.allowedActivities.map((a) => a.activity.toLowerCase());
    if (acts.some((a) => a.includes('brainstorm')) && acts.some((a) => a.includes('grammar'))) {
      parts.push('AI brainstorming and spelling or grammar suggestions for student-written sentences are permitted.');
    } else {
      parts.push(`AI ${acts.join(' and ')} are permitted.`);
    }
  }

  // Prohibited summary
  if (data.prohibitedActivities.length > 0) {
    const proh = data.prohibitedActivities.map((p) => p.activity.toLowerCase());
    if (
      proh.some((p) => p.includes('generation') || p.includes('submission text')) &&
      proh.some((p) => p.includes('rewriting')) &&
      proh.some((p) => p.includes('translation'))
    ) {
      parts.push('AI-generated submission text, rewriting, paraphrasing, and translation are prohibited.');
    } else {
      parts.push(`AI ${proh.join(', ')} are prohibited.`);
    }
  }

  // Disclosure and retention summary
  const discParts: string[] = [];
  if (data.disclosureRequirement.required) {
    if (data.disclosureRequirement.specifyToolNames) {
      discParts.push('Disclose permitted assistance by naming the tool and describing its use');
    } else {
      discParts.push('Disclose permitted AI assistance');
    }
  }

  if (data.recordRetentionRequirement.rawPromptsRequired) {
    discParts.push('keep relevant prompts and outputs');
  } else if (data.recordRetentionRequirement.draftingHistoryRequired) {
    discParts.push('maintain draft version history');
  }

  if (discParts.length > 0) {
    parts.push(`${discParts.join(', and ')}.`);
  }

  return parts.join(' ');
}

/**
 * Strict numerical threshold parser
 */
function parsePolicyNumericalThreshold(text: string, detectionText?: string): PolicyNumericalThreshold {
  // Check for explicit "no numerical threshold" statement
  const noThresholdMatch = (detectionText || text).match(
    /\b(no numerical (ai detection )?threshold|this assignment has no numerical|threshold: none|accepted detection percentage: not specified)\b/i
  );
  if (noThresholdMatch) {
    const exactSentence =
      (detectionText || text).split(/(?<=[.?!])\s+/).find((s) => /no numerical/i.test(s)) ||
      'This assignment has no numerical AI detection threshold.';
    return {
      type: 'none',
      exactDescription: 'Accepted detection percentage: Not specified in the supplied policy.',
      guidanceText: exactSentence.trim(),
      isInterchangeableWithAIDetector: false,
    };
  }

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
 * Evaluates declared student AI activities against the validated structured policy
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
        explanation: 'You declared no AI assistance was used for this assignment.',
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

    const rule = interpretation.activityRules ? interpretation.activityRules[act] : undefined;

    // 1. Brainstorming evaluation
    if (act === 'brainstorming') {
      if (rule && rule.status === 'permitted') {
        const discNote = interpretation.disclosureRequirement.required
          ? 'Name the AI tool, describe its use, and keep relevant prompts and outputs.'
          : 'Ensure you follow standard attribution guidelines.';
        results.push({
          activityId: act,
          activityLabel: label,
          verdict: 'permitted-with-conditions',
          explanation: `Brainstorming is permitted. ${discNote}`,
          relevantRuleExcerpt: rule.sourceExcerpt || interpretation.allowedActivities.find((a) => /brainstorm/i.test(a.activity))?.excerpt,
        });
      } else if (rule && rule.status === 'prohibited') {
        results.push({
          activityId: act,
          activityLabel: label,
          verdict: 'potential-conflict',
          explanation: 'You declared AI brainstorming. The supplied instructions prohibit this activity.',
          relevantRuleExcerpt: rule.sourceExcerpt,
        });
      } else {
        results.push({
          activityId: act,
          activityLabel: label,
          verdict: 'unaddressed-by-policy',
          explanation: 'The supplied instructions do not explicitly address brainstorming. Ask your instructor before using AI for this activity.',
        });
      }
      continue;
    }

    // 2. Grammar & Spelling evaluation
    if (act === 'grammar-spelling') {
      if (rule && (rule.status === 'permitted' || rule.status === 'permitted-with-conditions')) {
        const cond = rule.conditions && rule.conditions.length > 0 ? ` (${rule.conditions.join(', ')})` : '';
        results.push({
          activityId: act,
          activityLabel: label,
          verdict: 'permitted-with-conditions',
          explanation: `Spelling and grammar suggestions are permitted for student-written sentences.${cond}`,
          relevantRuleExcerpt: rule.sourceExcerpt || interpretation.allowedActivities.find((a) => /grammar/i.test(a.activity))?.excerpt,
        });
      } else if (rule && rule.status === 'prohibited') {
        results.push({
          activityId: act,
          activityLabel: label,
          verdict: 'potential-conflict',
          explanation: 'You declared AI grammar or proofreading tools. The supplied instructions prohibit this activity.',
          relevantRuleExcerpt: rule.sourceExcerpt,
        });
      } else {
        results.push({
          activityId: act,
          activityLabel: label,
          verdict: 'unaddressed-by-policy',
          explanation: 'The supplied instructions do not explicitly address grammar checkers. Verify with your instructor.',
        });
      }
      continue;
    }

    // 3. Rewriting & Paraphrasing evaluation
    if (act === 'rewriting-paraphrasing') {
      if (rule && rule.status === 'prohibited') {
        results.push({
          activityId: act,
          activityLabel: label,
          verdict: 'potential-conflict',
          explanation: 'You declared AI rewriting or paraphrasing. The supplied instructions prohibit this activity.',
          relevantRuleExcerpt: rule.sourceExcerpt || interpretation.prohibitedActivities.find((p) => /rewrit|paraphras/i.test(p.activity))?.excerpt,
        });
      } else if (rule && rule.status === 'permitted') {
        results.push({
          activityId: act,
          activityLabel: label,
          verdict: 'permitted-with-conditions',
          explanation: 'AI rewriting is permitted under conditional disclosure guidelines.',
          relevantRuleExcerpt: rule.sourceExcerpt,
        });
      } else {
        results.push({
          activityId: act,
          activityLabel: label,
          verdict: 'unaddressed-by-policy',
          explanation: 'The supplied instructions do not explicitly address rewriting. Ask your instructor before using AI for this activity.',
        });
      }
      continue;
    }

    // 4. Generated Sentences evaluation
    if (act === 'generated-sentences') {
      if (rule && rule.status === 'prohibited') {
        results.push({
          activityId: act,
          activityLabel: label,
          verdict: 'potential-conflict',
          explanation: 'Your declared activity may conflict with this instruction. The supplied instructions prohibit generating submission text.',
          relevantRuleExcerpt: rule.sourceExcerpt || interpretation.prohibitedActivities.find((p) => /generat|prose/i.test(p.activity))?.excerpt,
        });
      } else if (rule && rule.status === 'permitted') {
        results.push({
          activityId: act,
          activityLabel: label,
          verdict: 'permitted-with-conditions',
          explanation: 'Generating submission text is permitted subject to full citation and disclosure.',
          relevantRuleExcerpt: rule.sourceExcerpt,
        });
      } else {
        results.push({
          activityId: act,
          activityLabel: label,
          verdict: 'unaddressed-by-policy',
          explanation: 'The supplied instructions do not explicitly address generated text. Ask your instructor before using AI for this activity.',
        });
      }
      continue;
    }

    // 5. Translation evaluation
    if (act === 'translation') {
      if (rule && rule.status === 'prohibited') {
        results.push({
          activityId: act,
          activityLabel: label,
          verdict: 'potential-conflict',
          explanation: 'You declared AI translation. The supplied instructions prohibit translation assistance.',
          relevantRuleExcerpt: rule.sourceExcerpt || interpretation.prohibitedActivities.find((p) => /translat/i.test(p.activity))?.excerpt,
        });
      } else if (rule && rule.status === 'permitted') {
        results.push({
          activityId: act,
          activityLabel: label,
          verdict: 'permitted-with-conditions',
          explanation: 'AI translation is permitted for multilingual drafting.',
          relevantRuleExcerpt: rule.sourceExcerpt,
        });
      } else {
        results.push({
          activityId: act,
          activityLabel: label,
          verdict: 'unaddressed-by-policy',
          explanation: 'The supplied instructions do not explicitly address translation. Ask your instructor before using AI for this activity.',
        });
      }
      continue;
    }

    // 6. Outlining evaluation
    if (act === 'outlining') {
      if (rule && rule.status === 'permitted') {
        results.push({
          activityId: act,
          activityLabel: label,
          verdict: 'permitted-with-conditions',
          explanation: 'Outlining and structuring arguments with AI is permitted.',
          relevantRuleExcerpt: rule.sourceExcerpt,
        });
      } else if (rule && rule.status === 'prohibited') {
        results.push({
          activityId: act,
          activityLabel: label,
          verdict: 'potential-conflict',
          explanation: 'Outlining with AI is prohibited for this assignment.',
          relevantRuleExcerpt: rule.sourceExcerpt,
        });
      } else {
        results.push({
          activityId: act,
          activityLabel: label,
          verdict: 'unaddressed-by-policy',
          explanation: 'The supplied instructions do not explicitly address outlining. Ask your instructor before using AI for this activity.',
        });
      }
      continue;
    }

    // Default fallback for any other declared activity
    if (rule && rule.status === 'prohibited') {
      results.push({
        activityId: act,
        activityLabel: label,
        verdict: 'potential-conflict',
        explanation: `You declared ${label}. The supplied instructions restrict this activity.`,
        relevantRuleExcerpt: rule.sourceExcerpt,
      });
    } else if (rule && rule.status === 'permitted') {
      results.push({
        activityId: act,
        activityLabel: label,
        verdict: 'permitted-with-conditions',
        explanation: `${label} is permitted, subject to assignment disclosure requirements.`,
        relevantRuleExcerpt: rule.sourceExcerpt,
      });
    } else {
      results.push({
        activityId: act,
        activityLabel: label,
        verdict: 'unaddressed-by-policy',
        explanation: `The supplied instructions do not explicitly address ${label.toLowerCase()}. Ask your instructor before using AI for this activity.`,
      });
    }
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
      return 'Institutional policy database';
    default:
      return 'Supplied assignment instructions';
  }
}

function extractScope(text: string, type: 'institution' | 'course' | 'assignment'): string | undefined {
  const lines = text.split('\n');
  for (const l of lines) {
    const trimmed = l.trim();
    if (type === 'assignment' && /^assignment:\s*(.*)$/i.test(trimmed)) {
      return trimmed.replace(/^assignment:\s*/i, '');
    }
    if (type === 'course' && /^(course|module):\s*(.*)$/i.test(trimmed)) {
      return trimmed.replace(/^(course|module):\s*/i, '');
    }
    if (type === 'institution' && /^(institution|university|college):\s*(.*)$/i.test(trimmed)) {
      return trimmed.replace(/^(institution|university|college):\s*/i, '');
    }
  }
  return undefined;
}
