import type { Passage } from './passageSegmentation.ts';

export interface SemanticEvidence {
  type: 'repetition' | 'topic-drift' | 'coherence';
  start: number;
  end: number;
  description: string;
  strength: number; // 0-1
}

export interface SemanticConsistencyResult {
  coherenceScore: number; // 0-1, higher = more coherent
  semanticRepetitionScore: number; // 0-1, higher = more repetitive
  topicDrift: number; // 0-1, higher = more drift
  evidence: SemanticEvidence[];
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function tfidfVectors(passages: Passage[]): Map<string, number>[] {
  const docs = passages.map((p) => tokenize(p.text));
  const df = new Map<string, number>();
  for (const doc of docs) {
    const seen = new Set<string>();
    for (const w of doc) {
      if (!seen.has(w)) {
        seen.add(w);
        df.set(w, (df.get(w) || 0) + 1);
      }
    }
  }
  const N = docs.length || 1;
  return docs.map((doc) => {
    const tf = new Map<string, number>();
    for (const w of doc) {
      tf.set(w, (tf.get(w) || 0) + 1);
    }
    const vec = new Map<string, number>();
    for (const [term, count] of tf.entries()) {
      const idf = Math.log((N + 1) / ((df.get(term) || 1) + 1)) + 1;
      vec.set(term, count * idf);
    }
    return vec;
  });
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [term, val] of a.entries()) {
    dot += val * (b.get(term) || 0);
    normA += val * val;
  }
  for (const val of b.values()) {
    normB += val * val;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Layer 7 — Semantic Consistency Analysis.
 *
 * Uses local TF-IDF cosine similarity between passages to detect semantic
 * repetition and topic drift. No external embedding API is required, so it
 * preserves privacy and keeps latency low.
 */
export function analyzeSemanticConsistency(passages: Passage[]): SemanticConsistencyResult {
  const paragraphPassages = passages.filter((p) => p.type === 'paragraph');
  if (paragraphPassages.length < 2) {
    return { coherenceScore: 0.5, semanticRepetitionScore: 0, topicDrift: 0, evidence: [] };
  }

  const vectors = tfidfVectors(paragraphPassages);
  const similarities: number[] = [];
  let repetitionScore = 0;
  const evidence: SemanticEvidence[] = [];

  for (let i = 1; i < vectors.length; i++) {
    const sim = cosineSimilarity(vectors[i - 1], vectors[i]);
    similarities.push(sim);

    if (sim > 0.75) {
      repetitionScore += sim;
      evidence.push({
        type: 'repetition',
        start: paragraphPassages[i - 1].start,
        end: paragraphPassages[i].end,
        description: 'Adjacent passages share a high proportion of vocabulary, a pattern common in repetitive AI output.',
        strength: sim,
      });
    } else if (sim < 0.15) {
      evidence.push({
        type: 'topic-drift',
        start: paragraphPassages[i - 1].start,
        end: paragraphPassages[i].end,
        description: 'Adjacent passages are semantically distant, suggesting a possible authorship boundary.',
        strength: 1 - sim,
      });
    }
  }

  const avgSim = similarities.length ? similarities.reduce((a, b) => a + b, 0) / similarities.length : 0;
  const maxDrop = similarities.length
    ? Math.max(0, ...similarities.map((s, i) => (i > 0 ? similarities[i - 1] - s : 0)))
    : 0;

  repetitionScore = Math.min(1, repetitionScore / Math.max(1, vectors.length - 1));
  const coherenceScore = Math.min(1, avgSim + 0.3); // bias toward moderate coherence
  const topicDrift = Math.min(1, maxDrop * 2);

  if (similarities.length > 0) {
    evidence.push({
      type: 'coherence',
      start: paragraphPassages[0].start,
      end: paragraphPassages[paragraphPassages.length - 1].end,
      description: `Overall passage-to-passage semantic coherence is ${avgSim > 0.5 ? 'moderate to high' : 'low'}.`,
      strength: coherenceScore,
    });
  }

  return {
    coherenceScore,
    semanticRepetitionScore: repetitionScore,
    topicDrift,
    evidence,
  };
}
