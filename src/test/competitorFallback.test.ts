import { describe, it, expect, vi } from 'vitest';
import { optionalCompetitorEvidence, parseCompetitorAnalysis } from '@/lib/seo/competitorAnalysis';

const builtInResponse = JSON.stringify({
  competitors: [{ url: 'https://example.com/guide', title: 'Guide', keywordsUsed: ['machine learning', 'semantic search'] }],
  contentGap: { missingKeywords: ['semantic search'] },
});

describe('competitor analysis fallback', () => {
  it('uses built-in results after the optional provider fails', async () => {
    const evidence = await optionalCompetitorEvidence(async () => { throw new Error('Internal SE Server Error'); });
    const result = parseCompetitorAnalysis(builtInResponse, 'A guide to machine learning.', evidence);
    expect(result.competitors).toHaveLength(1);
    expect(result.contentGap.coveragePercent).toBe(50);
    expect(result.contentGap.coveredCount).toBe(1);
    expect(result.contentGap.missingKeywords).toEqual(['semantic search']);
  });

  it('continues with built-in results when the provider hangs and aborts the request', async () => {
    vi.useFakeTimers();
    try {
      let signal: AbortSignal | undefined;
      const pending = optionalCompetitorEvidence(async value => { signal = value; return new Promise(() => {}); });
      await vi.advanceTimersByTimeAsync(8000);
      const evidence = await pending;
      expect(signal?.aborted).toBe(true);
      expect(parseCompetitorAnalysis(builtInResponse, 'machine learning', evidence).contentGap.totalCompetitorKeywords).toBe(2);
    } finally { vi.useRealTimers(); }
  });

  it('retains verified URLs and word counts when the optional provider succeeds', async () => {
    const evidence = await optionalCompetitorEvidence(async () => [{ url: 'https://example.com/guide', wordCount: 900 }]);
    const result = parseCompetitorAnalysis(builtInResponse, 'machine learning', evidence);
    expect(result.competitors[0].wordCount).toBe(900);
    expect(result.contentGap.coveredCount).toBe(1);
  });

  it('does not report a perfect score for empty or unsupported competitor data', () => {
    expect(() => parseCompetitorAnalysis('{"competitors":[],"contentGap":{}}', 'article', [])).toThrow('no verifiable');
    expect(() => parseCompetitorAnalysis(builtInResponse, 'article', [{ url: 'https://other.com', wordCount: 800 }])).toThrow('no verifiable');
  });
});
