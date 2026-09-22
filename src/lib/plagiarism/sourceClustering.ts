/**
 * Source Clustering, Credibility, & Chronology Analysis
 *
 * Groups syndicated copies and mirror sites, ranks domain credibility,
 * and organizes sources along a chronological timeline (Earliest Discovered Source).
 */

import type { SourceCluster, ChronologyEntry, SourceCredibilityLevel } from './types';
import type { VerifiedSource } from '@/pages/detector/detectionEngine';

export function assessSourceCredibility(src: VerifiedSource): SourceCredibilityLevel {
  if (src.provider === 'crossref' || src.provider === 'openalex' || src.provider === 'unpaywall') {
    return 'Verified Academic';
  } else if (src.url.includes('.edu') || src.url.includes('.gov') || src.url.includes('.ac.uk')) {
    return 'Verified Academic';
  } else if (src.url.includes('nature.com') || src.url.includes('ieee.org') || src.url.includes('sciencedirect.com') || src.url.includes('springer.com')) {
    return 'Verified Academic';
  } else if (src.url.includes('reuters.com') || src.url.includes('bloomberg.com') || src.url.includes('bbc.com') || src.url.includes('nytimes.com')) {
    return 'Reputable Publisher';
  }
  return 'General Web';
}

export function clusterAndChronologizeSources(
  sources: VerifiedSource[]
): {
  sourceClusters: SourceCluster[];
  chronologicalTimeline: ChronologyEntry[];
  earliestDiscoveredSource: ChronologyEntry | null;
  sourceCredibilityMap: Record<string, SourceCredibilityLevel>;
} {
  const sourceCredibilityMap: Record<string, SourceCredibilityLevel> = {};
  const clustersMap = new Map<string, VerifiedSource[]>();
  const timeline: ChronologyEntry[] = [];

  for (const src of sources) {
    // 1. Assign Source Credibility
    let cred: SourceCredibilityLevel = 'General Web';
    if (src.provider === 'crossref' || src.provider === 'openalex' || src.provider === 'unpaywall') {
      cred = 'Verified Academic';
    } else if (src.url.includes('.edu') || src.url.includes('.gov') || src.url.includes('.ac.uk')) {
      cred = 'Verified Academic';
    } else if (src.url.includes('nature.com') || src.url.includes('ieee.org') || src.url.includes('sciencedirect.com') || src.url.includes('springer.com')) {
      cred = 'Verified Academic';
    } else if (src.url.includes('reuters.com') || src.url.includes('bloomberg.com') || src.url.includes('bbc.com') || src.url.includes('nytimes.com')) {
      cred = 'Reputable Publisher';
    }
    sourceCredibilityMap[src.url] = cred;

    // 2. Cluster duplicated / syndicated titles or DOIs
    const normTitle = src.title.toLowerCase().replace(/[^\w\s]/g, '').slice(0, 40);
    const clusterKey = src.doi || normTitle;

    if (!clustersMap.has(clusterKey)) {
      clustersMap.set(clusterKey, []);
    }
    clustersMap.get(clusterKey)!.push(src);

    // 3. Extract publication date where available from DOI or URL
    let pubDate: string | null = null;
    let formattedDate = 'Publication date unknown';

    // Try finding year in title or DOI (e.g. 10.1016/j.2023.04...)
    const doiYearMatch = src.doi ? src.doi.match(/\b(19\d{2}|20\d{2})\b/) : null;
    const urlYearMatch = src.url.match(/\b(19\d{2}|20\d{2})\b/);
    if (doiYearMatch) {
      pubDate = `${doiYearMatch[1]}-01-01`;
      formattedDate = `Est. ${doiYearMatch[1]} (from DOI record)`;
    } else if (urlYearMatch) {
      pubDate = `${urlYearMatch[1]}-01-01`;
      formattedDate = `Est. ${urlYearMatch[1]} (from URL metadata)`;
    } else if (src.provider === 'crossref' || src.provider === 'openalex') {
      pubDate = '2023-01-01';
      formattedDate = 'Indexed academic publication';
    }

    timeline.push({
      sourceId: src.url,
      title: src.title,
      url: src.url,
      publisher: src.publisher || 'Web Publisher',
      provider: src.provider,
      publicationDate: pubDate,
      formattedDate,
      isEarliestDiscovered: false,
      isArchiveEstimate: !doiYearMatch,
      doi: src.doi,
      similarityContribution: src.matchContribution,
    });
  }

  // Build Source Clusters
  const sourceClusters: SourceCluster[] = [];
  let clusterIdx = 1;
  for (const [_, clusterMembers] of clustersMap.entries()) {
    const primary = clusterMembers[0];
    const mirrors = clusterMembers.slice(1);
    sourceClusters.push({
      clusterId: `cluster_${clusterIdx++}`,
      primarySource: primary,
      mirrors,
      clusterType: mirrors.length > 0 ? 'syndication' : 'independent',
      totalMirrorsCount: mirrors.length,
    });
  }

  // Sort Chronological Timeline (earliest dates first)
  timeline.sort((a, b) => {
    if (!a.publicationDate) return 1;
    if (!b.publicationDate) return -1;
    return a.publicationDate.localeCompare(b.publicationDate);
  });

  let earliestDiscoveredSource: ChronologyEntry | null = null;
  if (timeline.length > 0 && timeline[0].publicationDate) {
    timeline[0].isEarliestDiscovered = true;
    earliestDiscoveredSource = timeline[0];
  }

  return {
    sourceClusters,
    chronologicalTimeline: timeline,
    earliestDiscoveredSource,
    sourceCredibilityMap,
  };
}
