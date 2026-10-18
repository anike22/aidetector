import { computeCompetitorKeywordCoverage, type CompetitorResult } from '@/pages/seo-assistant/analysisEngine';

export interface CompetitorEvidence { url: string; wordCount?: number }

// SERP enrichment must never prevent the independent built-in search from running.
export async function optionalCompetitorEvidence(
  load: (signal: AbortSignal) => Promise<CompetitorEvidence[]>,
  timeoutMs = 8000,
): Promise<CompetitorEvidence[]> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      load(controller.signal),
      new Promise<CompetitorEvidence[]>(resolve => {
        timer = setTimeout(() => { controller.abort(); resolve([]); }, timeoutMs);
      }),
    ]);
  } catch {
    return [];
  } finally {
    clearTimeout(timer!);
  }
}

export function parseCompetitorAnalysis(raw: string, content: string, evidence: CompetitorEvidence[]) {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Competitor analysis returned no data. Please try again.');
  const parsed = JSON.parse(match[0]);
  const strings = (value: unknown): string[] => Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && !!item.trim()) : [];
  const normalize = (url: string) => url.replace(/\/$/, '').toLowerCase();
  const urls = new Set(evidence.map(item => normalize(item.url)));
  const items = (Array.isArray(parsed.competitors) ? parsed.competitors : [])
    .filter((item: any) => /^https?:\/\//i.test(String(item?.url || '')) && (!urls.size || urls.has(normalize(item.url))));
  if (!items.length) throw new Error('Search returned no verifiable competitor pages. Please try another keyword.');
  const competitors: CompetitorResult[] = items.map((item: any) => {
    const verified = evidence.find(v => normalize(v.url) === normalize(item.url));
    const count = Number(item.wordCount);
    return {
      url: item.url.trim(), title: String(item.title || item.url),
      wordCount: urls.size ? verified?.wordCount ?? null : Number.isFinite(count) && count > 0 ? count : null,
    };
  });
  const gap = parsed.contentGap || {};
  // Read keywords before reducing competitors to the display-only URL/title/count shape.
  const keywords = items.flatMap((item: any) => strings(item.keywordsUsed));
  const contentGap = computeCompetitorKeywordCoverage(
    content, strings(gap.missingKeywords), [...strings(gap.missingKeywords), ...keywords],
    strings(gap.missingHeadings), strings(gap.missingFAQs), strings(gap.missingSubtopics),
    typeof gap.targetWordCountRange === 'string' ? gap.targetWordCountRange : undefined,
    strings(gap.recommendedH2s),
  );
  if (!contentGap.totalCompetitorKeywords) throw new Error('Search returned no competitor keywords. Please try again.');
  return { competitors, contentGap };
}
