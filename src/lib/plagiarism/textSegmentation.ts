/**
 * Advanced Text Segmentation, Distinctive Passage Extraction & Query Ladder Engine
 * AIDetector.cx
 */

import type { DistinctiveSegment } from './types';

// Common stop words across English and major academic languages
export const COMMON_STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'is', 'are', 'was', 'were', 'been', 'being', 'has', 'had', 'having', 'do', 'does', 'did',
]);

export const COMMON_ACADEMIC_TERMS = new Set([
  'abstract', 'introduction', 'method', 'methods', 'results', 'discussion', 'conclusion',
  'study', 'paper', 'article', 'research', 'analysis', 'data', 'model', 'models', 'system',
  'systems', 'approach', 'proposed', 'using', 'used', 'show', 'shows', 'shown', 'result',
  'based', 'new', 'novel', 'performance', 'accuracy', 'task', 'tasks', 'dataset', 'datasets',
  'training', 'test', 'validation', 'experiment', 'experiments', 'evaluation',
  'architecture', 'framework', 'algorithm', 'algorithms', 'network', 'networks',
]);

export const BOILERPLATE_MARKERS = [
  'terms and conditions', 'privacy policy', 'all rights reserved',
  'written in accordance with', 'declaration of competing interest',
  'informed consent was obtained', 'supplementary materials are available',
  'received on', 'accepted on', 'published online', 'ethics approval',
  'conflict of interest statement', 'funding information', 'acknowledgments',
];

export interface QueryLadderEntry {
  level: 1 | 2 | 3 | 4 | 5;
  levelName: 'exact_phrase' | 'short_exact' | 'dual_fragments' | 'rare_keywords' | 'semantic_terms';
  query: string;
  passageText: string;
  zone: 'beginning' | 'early_middle' | 'middle' | 'late_middle' | 'ending';
  distinctivenessScore: number;
}

export function extractNamedEntities(text: string): string[] {
  const entities = new Set<string>();
  const words = text.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const raw = words[i].replace(/[^\w]/g, '');
    if (raw.length > 2 && /^[A-Z][a-z]+$/.test(raw) && !COMMON_STOP_WORDS.has(raw.toLowerCase())) {
      if (i + 1 < words.length) {
        const next = words[i + 1].replace(/[^\w]/g, '');
        if (/^[A-Z][a-z]+$/.test(next) && !COMMON_STOP_WORDS.has(next.toLowerCase())) {
          entities.add(`${raw} ${next}`);
          i++;
          continue;
        }
      }
      entities.add(raw);
    }
  }
  return Array.from(entities).slice(0, 15);
}

export function extractRareTerms(text: string): string[] {
  const words = text.toLowerCase().match(/\b[a-z]{5,}\b/g) || [];
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (!COMMON_STOP_WORDS.has(w) && !COMMON_ACADEMIC_TERMS.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }
  return Object.keys(freq)
    .sort((a, b) => b.length - a.length || freq[a] - freq[b])
    .slice(0, 12);
}

export function computePassageDistinctiveness(passage: string): number {
  const words = passage.split(/\s+/).filter(Boolean);
  if (words.length < 5) return 0.1;

  const lower = passage.toLowerCase();
  if (BOILERPLATE_MARKERS.some((m) => lower.includes(m))) return 0.05;

  // Numbers, stats, percentages, dates
  const numbers = passage.match(/\b\d+(?:\.\d+)?%?\b/g) || [];
  const numScore = Math.min(numbers.length * 0.15, 0.35);

  // Capitalized named entities / proper nouns
  const entities = extractNamedEntities(passage);
  const entityScore = Math.min(entities.length * 0.15, 0.35);

  // Technical rare words
  const rare = extractRareTerms(passage);
  const rareScore = Math.min(rare.length * 0.08, 0.30);

  // Distinct word ratio (low repetition)
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  const diversityRatio = uniqueWords.size / words.length;
  const divScore = diversityRatio >= 0.7 ? 0.15 : 0.05;

  // Penalize generic filler phrases
  if (lower.startsWith('in this paper we') || lower.startsWith('it is well known that') || lower.startsWith('the results show that')) {
    return Math.max(0.15, Math.min(0.65, numScore + entityScore + rareScore));
  }

  return Math.min(1.0, Math.round((0.15 + numScore + entityScore + rareScore + divScore) * 100) / 100);
}

export function splitSentencesWithOffsets(text: string): Array<{ text: string; start: number; end: number }> {
  const out: Array<{ text: string; start: number; end: number }> = [];
  const re = /[^.!?]+[.!?]*(?:\s+|$)|[^.!?]+$/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const s = m[0].trim();
    if (s.length > 10) {
      out.push({ text: s, start: m.index, end: m.index + m[0].length });
    }
  }
  return out;
}

export function segmentDocument(text: string, targetSegmentWords = 120): DistinctiveSegment[] {
  if (!text || text.trim().length === 0) return [];

  const sentences = splitSentencesWithOffsets(text);
  const segments: DistinctiveSegment[] = [];

  let currentText = '';
  let currentStart = 0;

  for (const s of sentences) {
    if (currentText === '') {
      currentStart = s.start;
    }
    currentText += (currentText ? ' ' : '') + s.text;
    const wordCount = (currentText.match(/\S+/g) || []).length;

    if (wordCount >= targetSegmentWords) {
      const rareTerms = extractRareTerms(currentText);
      const namedEntities = extractNamedEntities(currentText);
      const lower = currentText.toLowerCase();
      const isBoilerplate = BOILERPLATE_MARKERS.some((m) => lower.includes(m));
      const distinctivenessScore = computePassageDistinctiveness(currentText);

      segments.push({
        id: `seg_${segments.length + 1}`,
        startIndex: currentStart,
        endIndex: currentStart + currentText.length,
        text: currentText.trim(),
        wordCount,
        distinctivenessScore,
        rareTerms,
        namedEntities,
        isBoilerplateCandidate: isBoilerplate,
      });

      currentText = '';
    }
  }

  if (currentText.trim().length > 0) {
    const rareTerms = extractRareTerms(currentText);
    const namedEntities = extractNamedEntities(currentText);
    const wordCount = (currentText.match(/\S+/g) || []).length;
    const lower = currentText.toLowerCase();
    const isBoilerplate = BOILERPLATE_MARKERS.some((m) => lower.includes(m));

    segments.push({
      id: `seg_${segments.length + 1}`,
      startIndex: currentStart,
      endIndex: currentStart + currentText.length,
      text: currentText.trim(),
      wordCount,
      distinctivenessScore: computePassageDistinctiveness(currentText),
      rareTerms,
      namedEntities,
      isBoilerplateCandidate: isBoilerplate,
    });
  }

  return segments;
}

/**
 * Generate multi-zone query fallback ladders across the entire document
 */
export function buildQueryPlanAcrossDocumentZones(text: string, maxTotalQueries = 18): QueryLadderEntry[] {
  const sentences = splitSentencesWithOffsets(text);
  if (!sentences.length) return [];

  const totalLen = sentences.length;
  const queries: QueryLadderEntry[] = [];
  const seenQueries = new Set<string>();

  // Partition into 5 zones
  const zones: Array<{
    name: 'beginning' | 'early_middle' | 'middle' | 'late_middle' | 'ending';
    startIdx: number;
    endIdx: number;
  }> = [
    { name: 'beginning', startIdx: 0, endIdx: Math.max(1, Math.floor(totalLen * 0.2)) },
    { name: 'early_middle', startIdx: Math.floor(totalLen * 0.2), endIdx: Math.max(2, Math.floor(totalLen * 0.4)) },
    { name: 'middle', startIdx: Math.floor(totalLen * 0.4), endIdx: Math.max(3, Math.floor(totalLen * 0.6)) },
    { name: 'late_middle', startIdx: Math.floor(totalLen * 0.6), endIdx: Math.max(4, Math.floor(totalLen * 0.8)) },
    { name: 'ending', startIdx: Math.floor(totalLen * 0.8), endIdx: totalLen },
  ];

  for (const zone of zones) {
    const zoneSentences = sentences.slice(zone.startIdx, zone.endIdx);
    if (!zoneSentences.length) continue;

    // Score and rank passages in this zone
    const candidatePassages: Array<{ text: string; score: number }> = [];

    // 1. Single sentences
    for (const s of zoneSentences) {
      candidatePassages.push({ text: s.text, score: computePassageDistinctiveness(s.text) });
    }

    // 2. Overlapping sentence pairs (S_i + S_{i+1})
    for (let i = 0; i < zoneSentences.length - 1; i++) {
      const pair = `${zoneSentences[i].text} ${zoneSentences[i + 1].text}`;
      candidatePassages.push({ text: pair, score: computePassageDistinctiveness(pair) });
    }

    candidatePassages.sort((a, b) => b.score - a.score);
    const topPassage = candidatePassages[0];
    if (!topPassage) continue;

    const words = topPassage.text.split(/\s+/).filter(Boolean);
    const cleanWords = words.map((w) => w.replace(/[^\w-]/g, '')).filter(Boolean);

    // Level 1: Exact distinctive phrase (7-10 words in quotes)
    // ALWAYS emit for every zone — recall priority: a zone skipped here
    // risks missing copied material located in that zone.
    if (cleanWords.length >= 7) {
      const p1 = cleanWords.slice(0, Math.min(9, cleanWords.length)).join(' ');
      const q1 = `"${p1}"`;
      if (!seenQueries.has(q1)) {
        seenQueries.add(q1);
        queries.push({
          level: 1,
          levelName: 'exact_phrase',
          query: q1,
          passageText: topPassage.text,
          zone: zone.name,
          distinctivenessScore: topPassage.score,
        });
      }
    }

    if (topPassage.score < 0.2) continue;

    // Level 2: Shorter exact phrase (5-7 core words)
    if (cleanWords.length >= 5) {
      const start = Math.max(0, Math.min(2, cleanWords.length - 5));
      const p2 = cleanWords.slice(start, start + 5).join(' ');
      const q2 = `"${p2}"`;
      if (!seenQueries.has(q2) && p2.length > 15) {
        seenQueries.add(q2);
        queries.push({
          level: 2,
          levelName: 'short_exact',
          query: q2,
          passageText: topPassage.text,
          zone: zone.name,
          distinctivenessScore: topPassage.score,
        });
      }
    }

    // Level 3: Dual phrase fragments
    if (cleanWords.length >= 10) {
      const frag1 = cleanWords.slice(0, 4).join(' ');
      const frag2 = cleanWords.slice(-4).join(' ');
      const q3 = `"${frag1}" "${frag2}"`;
      if (!seenQueries.has(q3)) {
        seenQueries.add(q3);
        queries.push({
          level: 3,
          levelName: 'dual_fragments',
          query: q3,
          passageText: topPassage.text,
          zone: zone.name,
          distinctivenessScore: topPassage.score,
        });
      }
    }

    // Level 4: Rare keywords + Entities
    const rare = extractRareTerms(topPassage.text);
    const entities = extractNamedEntities(topPassage.text);
    const combinedTerms = [...entities, ...rare].slice(0, 5);
    if (combinedTerms.length >= 2) {
      const q4 = combinedTerms.join(' ');
      if (!seenQueries.has(q4)) {
        seenQueries.add(q4);
        queries.push({
          level: 4,
          levelName: 'rare_keywords',
          query: q4,
          passageText: topPassage.text,
          zone: zone.name,
          distinctivenessScore: topPassage.score,
        });
      }
    }

    // Level 5: Open scholarly search terms
    const nonStopWords = cleanWords.filter((w) => !COMMON_STOP_WORDS.has(w.toLowerCase())).slice(0, 6);
    if (nonStopWords.length >= 3) {
      const q5 = nonStopWords.join(' ');
      if (!seenQueries.has(q5)) {
        seenQueries.add(q5);
        queries.push({
          level: 5,
          levelName: 'semantic_terms',
          query: q5,
          passageText: topPassage.text,
          zone: zone.name,
          distinctivenessScore: topPassage.score,
        });
      }
    }
  }

  // Zone round-robin ordering: sort by ladder level first, so ANY prefix of the
  // plan covers every document zone before drilling into deeper fallback levels.
  const zoneOrder = ['beginning', 'early_middle', 'middle', 'late_middle', 'ending'];
  const ordered = queries.slice().sort((a, b) => {
    const dz = zoneOrder.indexOf(a.zone) - zoneOrder.indexOf(b.zone);
    return dz !== 0 ? dz : a.level - b.level;
  }).sort((a, b) => a.level - b.level);

  return ordered.slice(0, maxTotalQueries);
}

