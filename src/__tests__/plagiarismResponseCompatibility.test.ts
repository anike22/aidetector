import { describe, expect, it } from 'vitest';
import { normalizePlagiarismResult } from '@/lib/plagiarism/normalizePlagiarismResult';

describe('normalizePlagiarismResult', () => {
  it('prevents undefined/NaN scores from legacy responses', () => {
    const result = normalizePlagiarismResult({
      status: 'completed',
      similarityScore: 18,
      originalityScore: 82,
      exactMatchScore: 12,
      nearMatchScore: 6,
      semanticMatchScore: 0,
      riskLevel: 'Low',
      sources: [],
      providerStatus: { crossref: 'ok', openalex: 'ok', unpaywall: 'skipped', webSearch: 'ok' },
      coverageNote: 'Searched available providers.',
    });

    expect(result.paraphraseMatchScore).toBe(0);
    expect(result.similarityScore).toBe(18);
    expect(result.originalityScore).toBe(82);
    expect(Number.isFinite(result.paraphraseMatchScore)).toBe(true);
  });

  it('does not convert missing evidence into plagiarism', () => {
    const result = normalizePlagiarismResult({
      status: 'no_verified_matches',
      similarityScore: undefined,
      originalityScore: undefined,
      sources: [],
      providerStatus: {},
    });

    expect(result.similarityScore).toBe(0);
    expect(result.originalityScore).toBe(100);
    expect(result.exactMatchScore).toBe(0);
    expect(result.nearMatchScore).toBe(0);
    expect(result.paraphraseMatchScore).toBe(0);
  });

  it('rejects malformed responses instead of displaying fabricated scores', () => {
    expect(() => normalizePlagiarismResult({ foo: 'bar' })).toThrow('PLAGIARISM_CHECK_UNAVAILABLE');
  });
});
