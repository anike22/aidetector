// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { computeCompetitorKeywordCoverage } from '@/pages/seo-assistant/analysisEngine';
import {
  saveDomainToActiveSEOProject,
  getActiveSEOProjectSummary,
  persistSEOProjectDomain,
  getStoredSEOProjectDomain
} from '@/lib/seo/domainPrefill';
import { seoApi } from '@/lib/api/seo';

describe('Competitor Keyword Coverage and Content Gap Engine', () => {
  it('correctly calculates coverage percentage and present vs missing keywords', () => {
    const postContent = `
      This comprehensive review explores artificial intelligence search engines.
      We dive into machine learning algorithms, natural language understanding, and automated ranking signals.
    `;
    const missingKeywords = ['deep neural networks', 'vector embeddings', 'semantic search'];
    const competitorKeywords = [
      'machine learning',
      'deep neural networks',
      'natural language',
      'vector embeddings',
      'semantic search'
    ];

    const result = computeCompetitorKeywordCoverage(
      postContent,
      missingKeywords,
      competitorKeywords,
      ['Heading 1', 'Heading 2'],
      ['How does vector search work?']
    );

    expect(result.totalCompetitorKeywords).toBe(5);
    // 'machine learning' and 'natural language' are in postContent
    expect(result.coveredCount).toBe(2);
    expect(result.missingCount).toBe(3);
    expect(result.coveragePercent).toBe(40);

    const mlItem = result.competitorKeywords.find(k => k.keyword === 'machine learning');
    expect(mlItem?.foundInPost).toBe(true);
    expect(mlItem?.frequencyInPost).toBeGreaterThanOrEqual(1);

    const dnnItem = result.competitorKeywords.find(k => k.keyword === 'deep neural networks');
    expect(dnnItem?.foundInPost).toBe(false);
    expect(dnnItem?.frequencyInPost).toBe(0);

    expect(result.missingKeywords).toContain('deep neural networks');
    expect(result.missingHeadings).toEqual(['Heading 1', 'Heading 2']);
    expect(result.missingFAQs).toEqual(['How does vector search work?']);
  });

  it('handles empty competitor keywords gracefully', () => {
    const result = computeCompetitorKeywordCoverage('Some article content', [], []);
    expect(result.totalCompetitorKeywords).toBe(0);
    expect(result.coveredCount).toBe(0);
    expect(result.coveragePercent).toBe(100);
  });
});

describe('SEO Project Domain Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('saves and normalizes domain in local cache', () => {
    persistSEOProjectDomain('https://example.com/blog/article');
    const stored = getStoredSEOProjectDomain();
    expect(stored).toBe('example.com');
  });

  it('saveDomainToActiveSEOProject updates active project if exists or creates fallback project', async () => {
    vi.spyOn(seoApi, 'getProjects').mockResolvedValue([
      {
        id: 'proj-123',
        user_id: 'user-1',
        name: 'My Authority Site',
        domain: 'old-domain.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ]);

    const updateSpy = vi.spyOn(seoApi, 'updateProject').mockResolvedValue({
      id: 'proj-123',
      user_id: 'user-1',
      name: 'My Authority Site',
      domain: 'growthmarket.org',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const res = await saveDomainToActiveSEOProject('growthmarket.org');
    expect(res.success).toBe(true);
    expect(res.domain).toBe('growthmarket.org');
    expect(res.projectName).toBe('My Authority Site');
    expect(updateSpy).toHaveBeenCalledWith('proj-123', expect.objectContaining({ domain: 'growthmarket.org' }));

    const cached = getStoredSEOProjectDomain();
    expect(cached).toBe('growthmarket.org');
  });

  it('retrieves active project summary with projectName and domain', async () => {
    vi.spyOn(seoApi, 'getProjects').mockResolvedValue([
      {
        id: 'proj-456',
        user_id: 'user-1',
        name: 'Fintech Portal',
        domain: 'fintechpulse.io',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ]);

    const summary = await getActiveSEOProjectSummary();
    expect(summary?.projectName).toBe('Fintech Portal');
    expect(summary?.domain).toBe('fintechpulse.io');
  });
});
