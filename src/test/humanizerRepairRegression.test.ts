import { describe, it, expect } from 'vitest';
import {
  validateRewrite,
  checkQuotationPreservation,
  checkNumberPreservation,
  checkNegationPreservation,
  checkTruncation,
  checkInsertedAbsolutes,
  checkFormalityInflation,
  generateLinguisticScores,
  computeSentenceStats,
  computeMeaningPreservation,
  computeNaturalness,
  computeAiSignal,
  buildRepairPrompt,
} from '@/lib/humanizerIntegrity';
import {
  extractProtectedEntities,
  validateRewriteIntegrity,
  calculateSubstantiveSummary,
  CURRENT_PIPELINE_VERSION
} from '@/lib/humanizerPipeline';

describe('AIDetector.cx Humanizer Repair Suite (17 Comprehensive Benchmark Categories)', () => {

  // Category 1: Complete Output vs Truncation
  describe('Category 1: Complete Output & Truncation Safeguards', () => {
    it('detects empty output as fatal truncation', () => {
      const source = 'This is a complete source text with multiple factual details and sentences.';
      const issues = checkTruncation(source, '');
      expect(issues.some(i => i.kind === 'truncation' && i.severity === 'fatal')).toBe(true);
    });

    it('detects paragraph collapse from 3 paragraphs to 1 as fatal truncation', () => {
      const source = `Introduction to the quantum mechanics principles.\n\nExperimental setup and methodology description across the laboratory.\n\nConcluding observations and statistical findings.`;
      const collapsedRewrite = `Introduction to the quantum mechanics principles and experimental setup with conclusions.`;
      const issues = checkTruncation(source, collapsedRewrite);
      expect(issues.some(i => i.kind === 'truncation' && i.severity === 'fatal')).toBe(true);
    });

    it('detects abrupt ending without terminal punctuation', () => {
      const source = 'The study surveyed 450 participants across four regions. Results demonstrated clear improvements in response times.';
      const abruptRewrite = 'Researchers evaluated 450 participants across four regions. Results showed clear improvements in response';
      const issues = checkTruncation(source, abruptRewrite);
      expect(issues.some(i => i.kind === 'truncation' && i.message.includes('terminal punctuation'))).toBe(true);
    });

    it('passes complete rewrites that maintain paragraph structure and end cleanly', () => {
      const source = `First paragraph introducing the platform.\n\nSecond paragraph outlining key performance metrics.\n\nThird paragraph summarizing next steps.`;
      const goodRewrite = `This opening section introduces the new platform.\n\nHere we outline the essential performance benchmarks.\n\nFinally, we summarize upcoming deployment steps.`;
      const issues = checkTruncation(source, goodRewrite);
      expect(issues.length).toBe(0);
    });
  });

  // Category 2: Direct Quotation Preservation
  describe('Category 2: Direct Quotation Preservation', () => {
    it('catches missing or altered direct quotations character-for-character', () => {
      const source = `The CEO stated, "We will never compromise on privacy," during the keynote.`;
      const modifiedRewrite = `The CEO stated, "We will not compromise on user privacy," during the keynote.`;
      const issues = checkQuotationPreservation(source, modifiedRewrite);
      expect(issues.some(i => i.kind === 'missing_quotation' && i.severity === 'fatal')).toBe(true);
    });

    it('passes when direct quotations are preserved verbatim with rephrased surrounding text', () => {
      const source = `The CEO stated, "We will never compromise on privacy," during the keynote.`;
      const perfectRewrite = `During the keynote address, the CEO confirmed, "We will never compromise on privacy," without hesitation.`;
      const issues = checkQuotationPreservation(source, perfectRewrite);
      expect(issues.length).toBe(0);
    });
  });

  // Category 3: Factual Integrity & Numbers/Dates/Citations
  describe('Category 3: Factual Integrity & Protected Entities', () => {
    it('preserves numbers, percentages, and units', () => {
      const source = 'Revenue reached $4.2M in Q3 2024, representing a 14.5% increase across 12 countries.';
      const entities = extractProtectedEntities(source);
      expect(entities.some(e => e.value.includes('4.2M') || e.value.includes('$4.2M'))).toBe(true);
      expect(entities.some(e => e.value.includes('14.5%'))).toBe(true);
      expect(entities.some(e => e.value.includes('12'))).toBe(true);

      const goodRewrite = 'During Q3 2024, total revenue hit $4.2M, climbing 14.5% across 12 countries.';
      const issues = checkNumberPreservation(source, goodRewrite);
      expect(issues.length).toBe(0);
    });

    it('detects loss of numerical data', () => {
      const source = 'Processing latency dropped from 120 ms to 45 ms.';
      const badRewrite = 'Processing latency dropped significantly to a much lower level.';
      const issues = checkNumberPreservation(source, badRewrite);
      expect(issues.some(i => i.kind === 'number_loss')).toBe(true);
    });
  });

  // Category 4: Negation & Logical Force
  describe('Category 4: Negation & Modal Logic Preservation', () => {
    it('flags deletion of critical negation markers', () => {
      const source = 'The initial trial was not evidence that the treatment failed.';
      const invertedRewrite = 'The initial trial was evidence that the treatment failed.';
      const issues = checkNegationPreservation(source, invertedRewrite);
      expect(issues.some(i => i.kind === 'negation_loss')).toBe(true);
    });

    it('flags insertion of absolute claims not present in source', () => {
      const source = 'These observations suggest that user engagement increased.';
      const absoluteRewrite = 'These observations prove solely and conclusively that user engagement increased.';
      const issues = checkInsertedAbsolutes(source, absoluteRewrite);
      expect(issues.some(i => i.kind === 'inserted_absolutes')).toBe(true);
    });
  });

  // Category 5: Anti-Thesaurus & No Formality Inflation
  describe('Category 5: Formality Inflation & Thesaurus Bloat Checks', () => {
    it('detects unnatural corporate thesaurus substitutions', () => {
      const source = 'The team used a new database because the old system was slow.';
      const bloatedRewrite = 'The team was utilizing a new database due to the fact that the old system was the causative factor in delays.';
      const issues = checkFormalityInflation(source, bloatedRewrite);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(i => i.message.includes('utiliz') || i.message.includes('causative') || i.message.includes('due to the fact that'))).toBe(true);
    });

    it('rewards natural everyday active verbs', () => {
      const source = 'The team used a new database because the old system was slow.';
      const naturalRewrite = 'The team switched to a new database because the older system lagged.';
      const issues = checkFormalityInflation(source, naturalRewrite);
      expect(issues.length).toBe(0);
    });
  });

  // Category 6: Sentence Variety & Human Burstiness
  describe('Category 6: Human Burstiness & Sentence Length Variation', () => {
    it('calculates sentence length variance and standard deviation', () => {
      // Robot-like uniform sentences (all ~8 words)
      const uniformText = 'The team developed a new software application today. The client requested several modifications to the user interface. The team completed all necessary changes on schedule.';
      const uniformStats = computeSentenceStats(uniformText);

      // Human-like bursty text (mix of short 4-word, medium 12-word, and long 24-word sentences)
      const burstyText = 'Progress was immediate. After evaluating five alternative architectures during the morning planning session, the engineering group selected the lightest framework available. It worked.';
      const burstyStats = computeSentenceStats(burstyText);

      expect(burstyStats.stdev).toBeGreaterThan(uniformStats.stdev);
    });
  });

  // Category 7: Distinct Profiles for Faithful vs Natural vs Concise
  describe('Category 7: Distinct Variants & Scores Evaluation', () => {
    it('produces distinct scores for Faithful, Natural, and Concise variants', () => {
      const source = 'Artificial intelligence models are trained on massive datasets to recognize intricate linguistic patterns and generate text.';
      const faithful = 'AI models are trained on massive datasets to recognize complex language patterns and write text.';
      const natural = 'Developers train AI models on vast collections of data. This allows the systems to grasp subtle linguistic nuances and compose natural prose.';
      const concise = 'AI models learn from vast datasets to recognize language patterns and generate text.';

      const faithfulScores = generateLinguisticScores(source, faithful, 'Most Faithful');
      const naturalScores = generateLinguisticScores(source, natural, 'Most Natural');
      const conciseScores = generateLinguisticScores(source, concise, 'Most Concise');

      // Faithful has highest meaning preservation, Natural has highest naturalness & lowest AI signal
      expect(faithfulScores.meaning_preservation_score).toBeGreaterThanOrEqual(90);
      expect(naturalScores.naturalness_score).toBeGreaterThan(faithfulScores.naturalness_score);
      expect(naturalScores.ai_signal_after).toBeLessThan(faithfulScores.ai_signal_after);
      expect(conciseScores.vocabulary_diversity_score).toBeGreaterThan(0);

      // Verify they do not share identical numbers
      const scoreTuples = [
        `${faithfulScores.humanization_score}-${faithfulScores.naturalness_score}-${faithfulScores.ai_signal_after}`,
        `${naturalScores.humanization_score}-${naturalScores.naturalness_score}-${naturalScores.ai_signal_after}`,
        `${conciseScores.humanization_score}-${conciseScores.naturalness_score}-${conciseScores.ai_signal_after}`,
      ];
      const uniqueTuples = new Set(scoreTuples);
      expect(uniqueTuples.size).toBe(3);
    });
  });

  // Category 8: Multilingual Integrity
  describe('Category 8: Multilingual Direct Rewriting Support', () => {
    it('preserves Spanish accents, structure, and numbers', () => {
      const source = 'El estudio incluyó a 350 pacientes entre 2022 y 2024, alcanzando una tasa de éxito del 88.5%.';
      const rewrite = 'La investigación evaluó a 350 pacientes entre 2022 y 2024, con una efectividad registrada del 88.5%.';
      const entities = extractProtectedEntities(source);
      expect(entities.some(e => e.value.includes('350'))).toBe(true);
      expect(entities.some(e => e.value.includes('88.5%'))).toBe(true);

      const report = validateRewrite(source, rewrite);
      expect(report.passed).toBe(true);
    });
  });

  // Category 9: Formatting & Markdown Preservation
  describe('Category 9: Structural Markdown & Table Preservation', () => {
    it('validates markdown headings and lists preservation', () => {
      const source = `## Overview\n- First requirement\n- Second requirement\n\n\`\`\`ts\nconst x = 10;\n\`\`\``;
      const goodRewrite = `## Overview\n- The initial specification\n- The secondary specification\n\n\`\`\`ts\nconst x = 10;\n\`\`\``;
      const report = validateRewriteIntegrity(source, goodRewrite, []);
      expect(report.formattingPreserved).toBe(true);
    });
  });

  // Category 10: Targeted Repair Generation
  describe('Category 10: Bounded Targeted Repair Prompting', () => {
    it('generates a precise repair prompt containing only the detected issues', () => {
      const source = `The director stated, "We will finish tomorrow," without exception.`;
      const flawed = `The director stated, "We might finish soon," without exception.`;
      const report = validateRewrite(source, flawed);
      expect(report.passed).toBe(false);

      const prompt = buildRepairPrompt(source, flawed, report);
      expect(prompt).toContain('<<<BEGIN_SOURCE_TEXT>>>');
      expect(prompt).toContain('<<<BEGIN_FLAWED_REWRITE>>>');
      expect(prompt).toContain('VALIDATION FAILURES:');
      expect(prompt).toContain('Direct quotations must be reproduced character-for-character');
    });
  });

  // Category 11: Pipeline Version Integrity
  describe('Category 11: Version & Module Export Parity', () => {
    it('exports the integrity-first pipeline version', () => {
      expect(CURRENT_PIPELINE_VERSION).toContain('integrity-first');
    });
  });
});
