import type { Passage } from './passageSegmentation';
import type { SemanticConsistencyResult } from './semanticConsistency';
import type { PassageScore } from './humanEditDetection';

export interface ConsistencyEvidence {
  start: number;
  end: number;
  description: string;
  strength: number;
}

export interface DocumentConsistencyResult {
  consistencyScore: number; // 0-1, higher = more consistent
  mixedAuthorshipProbability: number; // 0-1
  inconsistencyLocations: { start: number; end: number }[];
  evidence: ConsistencyEvidence[];
}

/**
 * Layer 9 — Document Consistency Analysis.
 *
 * Aggregates passage-level classifier scores, semantic consistency, and
 * human-edit signals to estimate whether a single author (human or AI) wrote
 * the whole document or whether authorship shifts within it.
 */
export function analyzeDocumentConsistency(
  passages: Passage[],
  classifierScores: PassageScore[],
  semantic: SemanticConsistencyResult,
  humanEditProbability: number,
): DocumentConsistencyResult {
  const paragraphPassages = passages.filter((p) => p.type === 'paragraph');
  const paragraphScores = classifierScores.filter((_, i) => passages[i]?.type === 'paragraph');

  const inconsistencyLocations: { start: number; end: number }[] = [];
  const evidence: ConsistencyEvidence[] = [];

  if (paragraphScores.length < 2) {
    return {
      consistencyScore: 0.5,
      mixedAuthorshipProbability: 0,
      inconsistencyLocations,
      evidence,
    };
  }

  const aiScores = paragraphScores.map((s) => s.aiProbability);
  const mean = aiScores.reduce((a, b) => a + b, 0) / aiScores.length;
  const variance =
    aiScores.reduce((sum, v) => sum + (v - mean) * (v - mean), 0) / aiScores.length;

  let conflictScore = 0;
  for (let i = 1; i < paragraphScores.length; i++) {
    const prev = paragraphScores[i - 1].aiProbability;
    const cur = paragraphScores[i].aiProbability;
    const delta = Math.abs(prev - cur);
    if (delta > 40) {
      conflictScore += delta / 100;
      const start = paragraphPassages[i - 1].start;
      const end = paragraphPassages[i].end;
      inconsistencyLocations.push({ start, end });
      evidence.push({
        start,
        end,
        description: `A large shift in AI probability (${delta.toFixed(0)} percentage points) between adjacent paragraphs suggests mixed authorship.`,
        strength: delta / 100,
      });
    }
  }

  // Semantic topic drift contributes to inconsistency.
  if (semantic.topicDrift > 0.3) {
    conflictScore += semantic.topicDrift * 0.5;
    evidence.push({
      start: 0,
      end: paragraphPassages[paragraphPassages.length - 1].end,
      description: 'Strong topic drift between passages points to sections written by different authors or processes.',
      strength: semantic.topicDrift,
    });
  }

  // Human editing of an AI base also lowers consistency.
  conflictScore += humanEditProbability * 0.3;

  const maxPossible = paragraphScores.length - 1 + 1; // rough upper bound
  const normalizedConflict = Math.min(1, conflictScore / Math.max(1, maxPossible));

  // Lower consistency score when conflict is high.
  const consistencyScore = Math.max(0, 1 - normalizedConflict);
  const mixedAuthorshipProbability = normalizedConflict;

  return { consistencyScore, mixedAuthorshipProbability, inconsistencyLocations, evidence };
}
