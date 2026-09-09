import { describe, it, expect } from 'vitest';
import {
  computeSha256,
  extractProtectedEntities,
  validateRewriteIntegrity,
  calculateSubstantiveSummary,
  computeWordDiff,
  WRITING_STYLES
} from '@/lib/humanizerPipeline';

describe('Humanizer Pipeline Unit & Integration Tests', () => {
  it('computes deterministic SHA-256 hashes for text', async () => {
    const text1 = 'Artificial intelligence is transforming modern workflows.';
    const text2 = 'Artificial intelligence is transforming modern workflows.';
    const text3 = 'Different text altogether.';

    const hash1 = await computeSha256(text1);
    const hash2 = await computeSha256(text2);
    const hash3 = await computeSha256(text3);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(64);
  });

  it('extracts citations, numbers with units, URLs, dates, and locked terms', () => {
    const sourceText = `
      According to research by Smith et al. [1], global temperatures rose by 1.5°C in 2023.
      Contact support at support@aidetector.cx or visit https://aidetector.cx for 50% discounts.
      Please preserve AIDetector proprietary engine specifications.
    `;
    const lockedTerms = ['AIDetector proprietary engine'];

    const entities = extractProtectedEntities(sourceText, lockedTerms);

    expect(entities.some(e => e.type === 'citation' && e.value === '[1]')).toBe(true);
    expect(entities.some(e => e.type === 'citation' && e.value.includes('Smith et al.'))).toBe(true);
    expect(entities.some(e => e.type === 'number' && e.value === '1.5°C')).toBe(true);
    expect(entities.some(e => e.type === 'date' && e.value === '2023')).toBe(true);
    expect(entities.some(e => e.type === 'email' && e.value === 'support@aidetector.cx')).toBe(true);
    expect(entities.some(e => e.type === 'url' && e.value === 'https://aidetector.cx')).toBe(true);
    expect(entities.some(e => e.type === 'locked_term' && e.value === 'AIDetector proprietary engine')).toBe(true);
  });

  it('validates rewrite integrity and detects missing entities or broken formatting', () => {
    const sourceText = '# Overview\nGlobal warming increased by 1.5°C in 2023 [1]. Do not ignore this.';
    const goodRewrite = '# Overview\nIn 2023, global warming rose by 1.5°C [1]. We should not ignore this finding.';
    const badRewrite = 'Global warming increased a lot. Ignore this.';

    const entities = extractProtectedEntities(sourceText, []);

    const goodReport = validateRewriteIntegrity(sourceText, goodRewrite, entities);
    expect(goodReport.isValid).toBe(true);
    expect(goodReport.omissionsCount).toBe(0);
    expect(goodReport.formattingPreserved).toBe(true);

    const badReport = validateRewriteIntegrity(sourceText, badRewrite, entities);
    expect(badReport.isValid).toBe(false);
    expect(badReport.issues.length).toBeGreaterThan(0);
  });

  it('detects negation flips', () => {
    const sourceText = 'The results do not indicate any system failure.';
    const flippedRewrite = 'The results indicate significant system failure.';

    const report = validateRewriteIntegrity(sourceText, flippedRewrite, []);
    expect(report.negationIntegrity).toBe(false);
    expect(report.issues.some(i => i.toLowerCase().includes('negation'))).toBe(true);
  });

  it('calculates substantive change summaries accurately', () => {
    const source = 'AI tools are very helpful. They make writing faster. People like using them.';
    const rewrite = 'AI tools offer substantial assistance by accelerating writing workflows, earning broad appreciation.';

    const summary = calculateSubstantiveSummary(source, rewrite, []);
    expect(summary.total_sentences).toBe(3);
    expect(summary.sentences_modified).toBeGreaterThan(0);
    expect(summary.change_percentage).toBeGreaterThan(0);
    expect(summary.flow_improvements.length).toBeGreaterThan(0);
  });

  it('computes word diffs with unchanged, added, and removed segments', () => {
    const original = 'The fast brown fox jumps over the lazy dog.';
    const modified = 'The quick brown fox leaps over a sleepy dog.';

    const diff = computeWordDiff(original, modified);
    expect(diff.length).toBeGreaterThan(0);
    expect(diff.some(d => d.type === 'removed')).toBe(true);
    expect(diff.some(d => d.type === 'added')).toBe(true);
    expect(diff.some(d => d.type === 'unchanged')).toBe(true);
  });

  it('provides all 6 writing style definitions', () => {
    expect(WRITING_STYLES.length).toBe(6);
    const ids = WRITING_STYLES.map(s => s.id);
    expect(ids).toContain('standard');
    expect(ids).toContain('academic');
    expect(ids).toContain('professional');
    expect(ids).toContain('conversational');
    expect(ids).toContain('technical');
    expect(ids).toContain('marketing');
  });
});
