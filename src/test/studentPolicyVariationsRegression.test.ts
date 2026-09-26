import { describe, it, expect } from 'vitest';
import {
  interpretAcademicPolicy,
  evaluateStudentDeclaration,
  computeContentHash,
} from '@/lib/studentPolicy/policyInterpreter';
import { synthesizeAcademicPolicyGuidance } from '@/lib/studentPolicy/policyAdapter';

describe('Student Policy Variations Regression Suite (Section 12)', () => {
  // 1. Brainstorming allowed while rewriting is prohibited
  it('handles brainstorming allowed while rewriting is prohibited', async () => {
    const text = `
      Permitted:
      Students may use AI for brainstorming research topics.
      Prohibited:
      AI rewriting or paraphrasing is strictly prohibited.
    `;
    const interp = await interpretAcademicPolicy({
      rawPolicyText: text,
      sourceType: 'user-provided',
      sourceIdentifier: 'Variant 1',
    });
    expect(interp.activityRules.brainstorming.status).toBe('permitted');
    expect(interp.activityRules['rewriting-paraphrasing'].status).toBe('prohibited');
    expect(interp.activityRules.outlining.status).toBe('not-specified');
  });

  // 2. Translation prohibited
  it('handles explicit translation prohibition without inventing permissions', async () => {
    const text = `
      Prohibited:
      AI translation tools are prohibited for this language course.
    `;
    const interp = await interpretAcademicPolicy({
      rawPolicyText: text,
      sourceType: 'user-provided',
      sourceIdentifier: 'Variant 2',
    });
    expect(interp.activityRules.translation.status).toBe('prohibited');
    expect(interp.allowedActivities.some((a) => a.activity.toLowerCase().includes('translation'))).toBe(false);
  });

  // 3. Translation permitted with disclosure
  it('handles translation permitted with disclosure requirement', async () => {
    const text = `
      Permitted:
      Students may use AI for language translation to assist reading.
      Disclosure:
      Any translation assistance must be declared.
    `;
    const interp = await interpretAcademicPolicy({
      rawPolicyText: text,
      sourceType: 'user-provided',
      sourceIdentifier: 'Variant 3',
    });
    expect(interp.activityRules.translation.status).toBe('permitted');
    expect(interp.disclosureRequirement.required).toBe(true);
  });

  // 4. General prohibition with an explicit limited exception
  it('handles general prohibition with explicit limited exception (e.g. grammar checking)', async () => {
    const text = `
      All AI text generation is prohibited, except for automated grammar and spelling checks.
    `;
    const interp = await interpretAcademicPolicy({
      rawPolicyText: text,
      sourceType: 'user-provided',
      sourceIdentifier: 'Variant 4',
    });
    expect(interp.activityRules['grammar-spelling'].status).toBe('permitted');
    expect(interp.activityRules['generated-sentences'].status).toBe('prohibited');
  });

  // 5. Mandatory disclosure without a specified location
  it('handles mandatory disclosure without a specified location', async () => {
    const text = `
      Students must declare any permitted AI assistance.
    `;
    const interp = await interpretAcademicPolicy({
      rawPolicyText: text,
      sourceType: 'user-provided',
      sourceIdentifier: 'Variant 5',
    });
    expect(interp.disclosureRequirement.required).toBe(true);
    expect(interp.disclosureRequirement.details).toContain('must declare');
  });

  // 6. Recommended versus mandatory record retention
  it('distinguishes recommended vs mandatory record retention', async () => {
    const mandatoryText = `Keep relevant prompts and outputs.`;
    const interpMandatory = await interpretAcademicPolicy({
      rawPolicyText: mandatoryText,
      sourceType: 'user-provided',
      sourceIdentifier: 'Mandatory Records',
    });
    expect(interpMandatory.recordRetentionRequirement.required).toBe(true);
    expect(interpMandatory.recordRetentionRequirement.rawPromptsRequired).toBe(true);
    expect(interpMandatory.recordRetentionRequirement.draftingHistoryRequired).toBe(false);
  });

  // 7. No numerical threshold
  it('strictly identifies absence of numerical threshold with non-interchangeability disclaimer', async () => {
    const text = `This assignment has no numerical AI detection threshold.`;
    const interp = await interpretAcademicPolicy({
      rawPolicyText: text,
      sourceType: 'user-provided',
      sourceIdentifier: 'No Threshold',
    });
    expect(interp.numericalThreshold.type).toBe('none');
    expect(interp.numericalThreshold.exactDescription).toBe(
      'Accepted detection percentage: Not specified in the supplied policy.'
    );
  });

  // 8. External-provider threshold
  it('identifies external provider threshold and provides strict compatibility warning', async () => {
    const text = `The university uses Turnitin AI Detection with a 20% similarity threshold.`;
    const interp = await interpretAcademicPolicy({
      rawPolicyText: text,
      sourceType: 'user-provided',
      sourceIdentifier: 'External Turnitin',
    });
    expect(interp.numericalThreshold.type).toBe('external-detector');
    expect(interp.numericalThreshold.targetDetectorName).toBe('Turnitin');
    expect(interp.numericalThreshold.percentageValue).toBe(20);
    expect(interp.numericalThreshold.isInterchangeableWithAIDetector).toBe(false);
    expect(interp.ambiguities.some((a) => a.includes('not directly interchangeable'))).toBe(true);
  });

  // 9. Conflicting instructions
  it('detects conflicting policy instructions and displays warning without guessing', async () => {
    const text = `
      All generative AI is strictly prohibited in this department.
      However, for this assignment, AI use is encouraged and permitted for brainstorming.
    `;
    const interp = await interpretAcademicPolicy({
      rawPolicyText: text,
      sourceType: 'user-provided',
      sourceIdentifier: 'Conflicting',
    });
    expect(interp.conflictsDetected).toBe(true);
    expect(interp.conflictDetails).toContain('These instructions appear to conflict');
  });

  // 10. Unknown or unaddressed activities
  it('evaluates unknown or unaddressed activities as not-specified', async () => {
    const text = `
      Permitted AI assistance:
      Brainstorming ideas.
    `;
    const interp = await interpretAcademicPolicy({
      rawPolicyText: text,
      sourceType: 'user-provided',
      sourceIdentifier: 'Unaddressed',
    });
    const evals = evaluateStudentDeclaration(['outlining'], interp);
    expect(evals[0].verdict).toBe('unaddressed-by-policy');
    expect(evals[0].explanation).toContain('do not explicitly address outlining');
  });

  // 11. Content hashing and revision tracking
  it('computes deterministic SHA-256 content hashes for policy revisions', async () => {
    const textA = 'Policy version 1';
    const textB = 'Policy version 2';
    const hashA1 = await computeContentHash(textA);
    const hashA2 = await computeContentHash(textA);
    const hashB = await computeContentHash(textB);

    expect(hashA1).toBe(hashA2);
    expect(hashA1).not.toBe(hashB);
  });

  // 12. Pure Read-Only Synthesis without detector score tampering
  it('synthesizes guidance alongside detection scores without altering detector output', async () => {
    const policyText = `
      Permitted: AI brainstorming.
      Prohibited: AI text generation.
    `;
    const interp = await interpretAcademicPolicy({
      rawPolicyText: policyText,
      sourceType: 'user-provided',
      sourceIdentifier: 'ReadOnlyTest',
    });

    const mockBalancedResult = {
      ai: 42,
      human: 58,
      mixed: 0,
      confidence: 0.95,
      verdict: 'mixed',
      sentences: [],
      timestamp: Date.now(),
      characterCount: 150,
      wordCount: 25,
      paragraphs: [],
    };

    const guidance = synthesizeAcademicPolicyGuidance({
      balancedResult: mockBalancedResult as any,
      interpretation: interp,
      declaration: {
        declaredActivities: ['brainstorming'],
        specificToolsUsed: 'ChatGPT',
        purposeDescription: 'Brainstorming preliminary topics',
        hasKeptPromptsAndOutputs: true,
      },
    });

    expect(guidance.balancedAiScore).toBe(42);
    expect(guidance.balancedVerdict).toBe('mixed');
    expect(guidance.declaredActivitiesCount).toBe(1);
    expect(guidance.declarationEvaluations[0].activityId).toBe('brainstorming');
  });
});

