import type { Passage } from './passageSegmentation.ts';
import type { SemanticConsistencyResult } from './semanticConsistency.ts';
import type { PassageScore } from './humanEditDetection.ts';

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
 *
 * v2.5.1 changes:
 * - Lowered inter-paragraph delta threshold from 40 → 25 pp to catch subtle
 *   mixed authorship in lightly edited documents.
 * - Added section-type classification: each paragraph is tagged as
 *   'ai-like' (aiProb ≥ 60), 'human-like' (aiProb ≤ 40), or 'neutral'.
 * - Mixed evidence now requires ≥2 ai-like AND ≥2 human-like paragraphs,
 *   preventing a single outlier paragraph from triggering mixed.
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
  const scoreMean = aiScores.reduce((a, b) => a + b, 0) / aiScores.length;
  const scoreVariance =
    aiScores.reduce((sum, v) => sum + (v - scoreMean) * (v - scoreMean), 0) / aiScores.length;

  // Classify each paragraph as ai-like, human-like, or neutral.
  const AI_SECTION_THRESHOLD = 60;   // aiProbability ≥ 60 → ai-like
  const HUMAN_SECTION_THRESHOLD = 40; // aiProbability ≤ 40 → human-like
  let aiLikeSections = 0;
  let humanLikeSections = 0;
  for (const score of aiScores) {
    if (score >= AI_SECTION_THRESHOLD) aiLikeSections++;
    else if (score <= HUMAN_SECTION_THRESHOLD) humanLikeSections++;
  }

  let conflictScore = 0;
  // Lowered threshold from 40 → 25 to detect subtle authorship transitions.
  const DELTA_THRESHOLD = 25;
  for (let i = 1; i < paragraphScores.length; i++) {
    const prev = paragraphScores[i - 1].aiProbability;
    const cur = paragraphScores[i].aiProbability;
    const delta = Math.abs(prev - cur);
    if (delta > DELTA_THRESHOLD) {
      conflictScore += delta / 100;
      const start = paragraphPassages[i - 1].start;
      const end = paragraphPassages[i].end;
      inconsistencyLocations.push({ start, end });
      evidence.push({
        start,
        end,
        description: `A shift in AI probability (${delta.toFixed(0)} percentage points) between adjacent paragraphs suggests mixed authorship.`,
        strength: delta / 100,
      });
    }
  }

  // Mixed authorship requires BOTH ai-like AND human-like sections to coexist.
  // For short documents (<= 3 paragraphs), 1 section of each is sufficient evidence.
  const minSectionsPerType = paragraphScores.length >= 4 ? 2 : 1;
  const hasStructuralMixedEvidence = aiLikeSections >= minSectionsPerType && humanLikeSections >= minSectionsPerType;
  if (!hasStructuralMixedEvidence && inconsistencyLocations.length > 0) {
    // Downweight conflict when evidence is from only one side.
    conflictScore *= 0.4;
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

  const maxPossible = paragraphScores.length - 1 + 1;
  const normalizedConflict = Math.min(1, conflictScore / Math.max(1, maxPossible));

  const consistencyScore = Math.max(0, 1 - normalizedConflict);
  const mixedAuthorshipProbability = normalizedConflict;

  return { consistencyScore, mixedAuthorshipProbability, inconsistencyLocations, evidence };
}
