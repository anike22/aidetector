import { describe, it, expect } from 'vitest';
import {
  interpretAcademicPolicy,
  evaluateStudentDeclaration,
} from '@/lib/studentPolicy/policyInterpreter';
import { synthesizeAcademicPolicyGuidance } from '@/lib/studentPolicy/policyAdapter';

describe('Student Policy Fixture Exact Verification & Repair', () => {
  const FIXTURE_TEXT = `
Assignment: Should a public library extend its evening opening hours?

Write an evidence-based response that distinguishes observed results from assumptions and recommendations.

Permitted AI assistance:
Students may use AI to brainstorm topics and suggest spelling or grammar corrections to sentences they wrote themselves.

Prohibited AI assistance:
Students must not use AI to generate sentences or paragraphs for submission. AI rewriting, paraphrasing, and translation are also prohibited.

Disclosure:
Students must declare any permitted AI assistance, naming the tool and describing its use. Keep relevant prompts and outputs.

Detection:
This assignment has no numerical AI detection threshold. A low detection score does not establish compliance, and a high score does not independently establish misconduct.

Evidence:
Preserve numerical facts, explain limitations, and avoid presenting an association as proof of causation.
  `.trim();

  it('interprets the fictional test policy fixture with 100% precision and zero invented rules', async () => {
    const interpretation = await interpretAcademicPolicy({
      rawPolicyText: FIXTURE_TEXT,
      sourceType: 'user-provided',
      sourceIdentifier: 'Library Hours Policy',
    });

    // 1. Permitted Activities
    expect(interpretation.activityRules.brainstorming.status).toBe('permitted');
    expect(interpretation.activityRules['grammar-spelling'].status).toBe('permitted-with-conditions');
    expect(interpretation.activityRules['grammar-spelling'].conditions).toContain(
      'Applies to sentences written by the student'
    );

    // 2. Prohibited Activities
    expect(interpretation.activityRules['generated-sentences'].status).toBe('prohibited');
    expect(interpretation.activityRules['rewriting-paraphrasing'].status).toBe('prohibited');
    expect(interpretation.activityRules.translation.status).toBe('prohibited');

    // 3. Unspecified Activities (Outlining & Exams)
    expect(interpretation.activityRules.outlining.status).toBe('not-specified');
    expect(interpretation.prohibitedActivities.some((p) => p.activity.toLowerCase().includes('exam'))).toBe(false);

    // 4. Disclosure & Record Retention
    expect(interpretation.disclosureRequirement.required).toBe(true);
    expect(interpretation.disclosureRequirement.specifyToolNames).toBe(true);
    expect(interpretation.disclosureRequirement.details).toContain('naming the tool and describing its use');

    expect(interpretation.recordRetentionRequirement.required).toBe(true);
    expect(interpretation.recordRetentionRequirement.rawPromptsRequired).toBe(true);
    // Version history should NOT be invented as mandatory
    expect(interpretation.recordRetentionRequirement.draftingHistoryRequired).toBe(false);

    // 5. Numerical AI detection threshold: not specified
    expect(interpretation.numericalThreshold.type).toBe('none');
    expect(interpretation.numericalThreshold.exactDescription).toBe(
      'Accepted detection percentage: Not specified in the supplied policy.'
    );
    expect(interpretation.numericalThreshold.guidanceText).toContain(
      'This assignment has no numerical AI detection threshold'
    );

    // 6. Evidence requirements
    expect(interpretation.evidenceRequirements).toContain('Preserve numerical facts');
    expect(interpretation.evidenceRequirements).toContain('avoid presenting an association as proof of causation');

    // 7. Rule summary accurately matches required formulation
    expect(interpretation.ruleSummary).toContain('AI brainstorming and spelling or grammar suggestions');
    expect(interpretation.ruleSummary).toContain('AI-generated submission text, rewriting, paraphrasing, and translation are prohibited');
    expect(interpretation.ruleSummary).toContain('naming the tool and describing its use');
    expect(interpretation.ruleSummary).toContain('keep relevant prompts and outputs');
  });

  describe('Declaration Comparisons for Fixture', () => {
    it('evaluates Brainstorming declaration correctly', async () => {
      const interpretation = await interpretAcademicPolicy({
        rawPolicyText: FIXTURE_TEXT,
        sourceType: 'user-provided',
        sourceIdentifier: 'Library Hours Policy',
      });

      const results = evaluateStudentDeclaration(['brainstorming'], interpretation);
      expect(results).toHaveLength(1);
      const bEval = results[0];

      expect(bEval.activityId).toBe('brainstorming');
      expect(bEval.verdict).toBe('permitted-with-conditions');
      expect(bEval.explanation).toContain('Brainstorming is permitted');
      expect(bEval.explanation).toContain('Name the AI tool, describe its use, and keep relevant prompts and outputs');
      expect(bEval.relevantRuleExcerpt).toContain('brainstorm');
    });

    it('evaluates Rewriting declaration as conflicting with supplied instructions', async () => {
      const interpretation = await interpretAcademicPolicy({
        rawPolicyText: FIXTURE_TEXT,
        sourceType: 'user-provided',
        sourceIdentifier: 'Library Hours Policy',
      });

      const results = evaluateStudentDeclaration(['rewriting-paraphrasing'], interpretation);
      expect(results).toHaveLength(1);
      const rEval = results[0];

      expect(rEval.activityId).toBe('rewriting-paraphrasing');
      expect(rEval.verdict).toBe('potential-conflict');
      expect(rEval.explanation).toContain('You declared AI rewriting or paraphrasing');
      expect(rEval.explanation).toContain('The supplied instructions prohibit this activity');
      expect(rEval.relevantRuleExcerpt).toContain('rewriting');
    });

    it('evaluates Outlining declaration as Not specified / unaddressed by policy', async () => {
      const interpretation = await interpretAcademicPolicy({
        rawPolicyText: FIXTURE_TEXT,
        sourceType: 'user-provided',
        sourceIdentifier: 'Library Hours Policy',
      });

      const results = evaluateStudentDeclaration(['outlining'], interpretation);
      expect(results).toHaveLength(1);
      const oEval = results[0];

      expect(oEval.activityId).toBe('outlining');
      expect(oEval.verdict).toBe('unaddressed-by-policy');
      expect(oEval.explanation).toContain('The supplied instructions do not explicitly address outlining');
      expect(oEval.explanation).toContain('Ask your instructor before using AI for this activity');
    });

    it('evaluates combined Brainstorming and Rewriting selections together', async () => {
      const interpretation = await interpretAcademicPolicy({
        rawPolicyText: FIXTURE_TEXT,
        sourceType: 'user-provided',
        sourceIdentifier: 'Library Hours Policy',
      });

      const results = evaluateStudentDeclaration(['brainstorming', 'rewriting-paraphrasing'], interpretation);
      expect(results).toHaveLength(2);

      const bEval = results.find((r) => r.activityId === 'brainstorming')!;
      const rEval = results.find((r) => r.activityId === 'rewriting-paraphrasing')!;

      expect(bEval.verdict).toBe('permitted-with-conditions');
      expect(rEval.verdict).toBe('potential-conflict');
    });
  });

  describe('Zero Detector Alteration & Pure Read-Only Synthesis', () => {
    it('never changes detector inputs or outputs, scores, confidence, or verdicts', async () => {
      const interpretation = await interpretAcademicPolicy({
        rawPolicyText: FIXTURE_TEXT,
        sourceType: 'user-provided',
        sourceIdentifier: 'Library Hours Policy',
      });

      const mockBalanced = {
        ai: 15,
        human: 85,
        mixed: 0,
        verdict: 'likely-human',
        confidence: 94,
        language: 'English',
      } as any;

      const mockAggressive = {
        ai: 40,
        human: 60,
        risk: 'Moderate',
      } as any;

      const guidance = synthesizeAcademicPolicyGuidance({
        balancedResult: mockBalanced,
        aggressiveResult: mockAggressive,
        interpretation,
        declaration: {
          declaredActivities: ['brainstorming', 'rewriting-paraphrasing'],
        },
      });

      expect(guidance.balancedAiScore).toBe(15);
      expect(guidance.balancedVerdict).toBe('likely-human');
      expect(guidance.aggressiveAiScore).toBe(40);
      expect(guidance.aggressiveVerdict).toBe('Moderate Risk');

      // Check declaration count and results
      expect(guidance.declaredActivitiesCount).toBe(2);
      expect(guidance.declarationEvaluations).toHaveLength(2);
    });
  });
});
