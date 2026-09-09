import { describe, it, expect } from 'vitest';
import { validatePolicyUrl, sanitizeHtmlToText, computeContentHash } from '@/lib/studentPolicy/policyExtractor';
import { interpretAcademicPolicy, evaluateStudentDeclaration } from '@/lib/studentPolicy/policyInterpreter';
import { synthesizeAcademicPolicyGuidance } from '@/lib/studentPolicy/policyAdapter';

describe('Student Mode & Academic Policy Guidance (Phase 1)', () => {
  describe('SSRF and URL Validation', () => {
    it('blocks localhost, loopback, and private IPv4/IPv6 ranges', () => {
      expect(validatePolicyUrl('http://localhost:3000/policy').valid).toBe(false);
      expect(validatePolicyUrl('http://127.0.0.1/admin').valid).toBe(false);
      expect(validatePolicyUrl('http://192.168.1.1/secret').valid).toBe(false);
      expect(validatePolicyUrl('http://10.0.0.1/policy').valid).toBe(false);
      expect(validatePolicyUrl('http://172.16.0.1/doc').valid).toBe(false);
      expect(validatePolicyUrl('http://169.254.169.254/latest/meta-data').valid).toBe(false);
      expect(validatePolicyUrl('http://[::1]/policy').valid).toBe(false);
    });

    it('rejects unsupported URI schemes like file:// and data://', () => {
      expect(validatePolicyUrl('file:///etc/passwd').valid).toBe(false);
      expect(validatePolicyUrl('data:text/html,<h1>test</h1>').valid).toBe(false);
      expect(validatePolicyUrl('javascript:alert(1)').valid).toBe(false);
    });

    it('accepts valid HTTPS educational URLs', () => {
      const res = validatePolicyUrl('https://stanford.edu/academics/ai-guidelines');
      expect(res.valid).toBe(true);
      expect(res.cleanUrl).toBe('https://stanford.edu/academics/ai-guidelines');
    });
  });

  describe('HTML Text Sanitization & Security', () => {
    it('strips script tags, style blocks, and decodes HTML entities cleanly', () => {
      const html = `
        <html>
          <head><script>alert('hack')</script><style>body { color: red; }</style></head>
          <body>
            <header><nav>Home | About</nav></header>
            <main>
              <h1>Course AI Policy</h1>
              <p>AI tools are <strong>permitted</strong> for brainstorming &amp; outlining.</p>
            </main>
            <footer>Copyright 2026</footer>
          </body>
        </html>
      `;
      const clean = sanitizeHtmlToText(html);
      expect(clean).not.toContain('alert');
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('Home | About');
      expect(clean).toContain('AI tools are permitted for brainstorming & outlining.');
    });

    it('generates a deterministic content hash', async () => {
      const hash1 = await computeContentHash('Sample University Policy on Generative AI');
      const hash2 = await computeContentHash('Sample University Policy on Generative AI');
      const hash3 = await computeContentHash('Different Policy text');

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash1.startsWith('sha256:') || hash1.startsWith('hash:')).toBe(true);
    });
  });

  describe('Structured Policy Interpretation Engine', () => {
    it('interprets strict prohibition without creating false approvals', async () => {
      const policyText = `
        All generative AI use is strictly prohibited for this assignment. Zero tolerance policy.
        Any direct generation of sentences or whole paragraphs will result in referral.
      `;
      const interpretation = await interpretAcademicPolicy({
        rawPolicyText: policyText,
        sourceType: 'user-provided',
        sourceIdentifier: 'Syllabus Excerpt',
      });

      expect(interpretation.status).toBe('prohibited');
      expect(interpretation.prohibitedActivities.length).toBeGreaterThan(0);
      expect(interpretation.numericalThreshold.type).toBe('none');
      expect(interpretation.numericalThreshold.exactDescription).toContain('Not specified');
    });

    it('correctly handles external detector threshold (Turnitin 20%) with non-interchangeability note', async () => {
      const policyText = `
        Turnitin AI writing score must be below 20%. Any higher score will require an interview.
        Students must cite all assistance.
      `;
      const interpretation = await interpretAcademicPolicy({
        rawPolicyText: policyText,
        sourceType: 'user-provided',
        sourceIdentifier: 'Course Guideline',
      });

      expect(interpretation.numericalThreshold.type).toBe('external-detector');
      expect(interpretation.numericalThreshold.targetDetectorName).toBe('Turnitin');
      expect(interpretation.numericalThreshold.isInterchangeableWithAIDetector).toBe(false);
      expect(interpretation.numericalThreshold.guidanceText).toContain('not directly interchangeable');
    });

    it('identifies actual AI usage limit vs detector score', async () => {
      const policyText = `
        AI-generated writing must not exceed 25% of the overall essay.
        Students must retain prompt transcripts.
      `;
      const interpretation = await interpretAcademicPolicy({
        rawPolicyText: policyText,
        sourceType: 'user-provided',
        sourceIdentifier: 'Assignment Prompt',
      });

      expect(interpretation.numericalThreshold.type).toBe('actual-ai-usage');
      expect(interpretation.numericalThreshold.percentageValue).toBe(25);
      expect(interpretation.numericalThreshold.isInterchangeableWithAIDetector).toBe(false);
      expect(interpretation.recordRetentionRequirement.required).toBe(true);
    });

    it('identifies AIDetector.cx compatible threshold strictly with factual wording', async () => {
      const policyText = `
        AIDetector.cx score must be below 30% for final submission.
      `;
      const interpretation = await interpretAcademicPolicy({
        rawPolicyText: policyText,
        sourceType: 'user-provided',
        sourceIdentifier: 'Assignment Prompt',
      });

      expect(interpretation.numericalThreshold.type).toBe('aidetector-compatible');
      expect(interpretation.numericalThreshold.percentageValue).toBe(30);
      expect(interpretation.numericalThreshold.isInterchangeableWithAIDetector).toBe(true);
      expect(interpretation.numericalThreshold.guidanceText).toContain(
        'does not establish compliance with every assignment rule'
      );
    });

    it('detects conflicting policy instructions and displays the required warning', async () => {
      const conflictingText = `
        All generative AI is strictly prohibited in this department.
        However, for this assignment, AI use is encouraged and permitted for brainstorming.
      `;
      const interpretation = await interpretAcademicPolicy({
        rawPolicyText: conflictingText,
        sourceType: 'user-provided',
        sourceIdentifier: 'Mixed Instructions',
      });

      expect(interpretation.conflictsDetected).toBe(true);
      expect(interpretation.conflictDetails).toBe(
        'These instructions appear to conflict or may apply to different assessments. Ask your instructor which rule applies.'
      );
    });
  });

  describe('Student AI Declaration Evaluation', () => {
    it('accurately compares declared activities with policy rules', async () => {
      const policyText = `
        AI tools are permitted for brainstorming and grammar proofreading.
        Direct generation of paragraphs and rewriting is strictly prohibited.
      `;
      const interpretation = await interpretAcademicPolicy({
        rawPolicyText: policyText,
        sourceType: 'user-provided',
        sourceIdentifier: 'Assignment Policy',
      });

      const evaluations = evaluateStudentDeclaration(
        ['brainstorming', 'generated-sentences', 'prefer-not-to-specify'],
        interpretation
      );

      expect(evaluations).toHaveLength(3);

      const brainstormEval = evaluations.find((e) => e.activityId === 'brainstorming');
      expect(brainstormEval?.verdict).toBe('permitted-with-conditions');
      expect(brainstormEval?.explanation).toContain('permitted');

      const generationEval = evaluations.find((e) => e.activityId === 'generated-sentences');
      expect(generationEval?.verdict).toBe('potential-conflict');
      expect(generationEval?.explanation).toContain('may conflict');

      const preferNotEval = evaluations.find((e) => e.activityId === 'prefer-not-to-specify');
      expect(preferNotEval?.verdict).toBe('not-assessed');
    });
  });

  describe('Guidance Synthesis & Zero False Claims', () => {
    it('synthesizes read-only detection scores without modifying them or emitting false approvals', async () => {
      const interpretation = await interpretAcademicPolicy({
        rawPolicyText: 'AIDetector.cx score must be below 40%.',
        sourceType: 'user-provided',
        sourceIdentifier: 'Assignment AI Spec',
      });

      const guidance = synthesizeAcademicPolicyGuidance({
        balancedResult: {
          ai: 15,
          human: 85,
          mixed: 0,
          verdict: 'likely-human',
          confidence: 90,
          language: 'English',
          scores: { ai: 15, human: 85, mixed: 0 },
        } as any,
        aggressiveResult: {
          ai: 25,
          human: 75,
          risk: 'Low',
          scores: { ai: 25, human: 75 },
        } as any,
        interpretation,
        declaration: {
          declaredActivities: ['brainstorming'],
          promptsRetained: true,
        },
      });

      expect(guidance.detectorAvailable).toBe(true);
      expect(guidance.balancedAiScore).toBe(15);
      expect(guidance.aggressiveAiScore).toBe(25);
      expect(guidance.thresholdComparison.isComparable).toBe(true);
      expect(guidance.thresholdComparison.balancedComparisonNote).toContain('below the stated numerical threshold (40%)');
      expect(guidance.thresholdComparison.disclaimer).toBe(
        'This numerical comparison does not establish compliance with every assignment rule.'
      );
    });
  });
});
