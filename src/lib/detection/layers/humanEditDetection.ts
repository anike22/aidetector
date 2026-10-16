import type { LinguisticProfile, StatisticalProfile } from '../types.ts';
import type { Passage } from './passageSegmentation.ts';

export interface PassageScore {
  text: string;
  start: number;
  end: number;
  aiProbability: number;
  humanProbability: number;
  mixedProbability: number;
}

export interface EditEvidence {
  start: number;
  end: number;
  description: string;
  strength: number;
}

export interface HumanEditDetectionResult {
  humanEditProbability: number; // 0-1
  editBoundaries: { start: number; end: number }[];
  evidence: EditEvidence[];
}

// Humanization cues that differ from surrounding AI prose.
const INFORMAL_MARKERS = [
  /\b(don't|can't|won't|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|wouldn't|shouldn't|couldn't|mightn't|mustn't)\b/gi,
  /\b(yeah|yep|nope|gonna|wanna|gotta|kinda|sorta|dunno|lemme|gimme)\b/gi,
  /\b(i think|i believe|in my opinion|from my perspective|personally|honestly|frankly)\b/gi,
  /[;:\-]{2,}/g,
  /\.{3,}/g,
  /!{2,}/g,
  /\?{2,}/g,
];

const TYPO_PATTERNS = [
  /\b(teh|adn|taht|wiht|fo r|ot|si|ti)\b/gi,
  /\b([a-z])\1{2,}\b/gi,
];

function countMatches(text: string, patterns: RegExp[]): number {
  let count = 0;
  for (const p of patterns) {
    const matches = text.match(p);
    if (matches) count += matches.length;
  }
  return count;
}

/**
 * Layer 8 — Human-Edit Detection.
 *
 * Identifies passages where an AI-generated base appears to have been edited by
 * a human. Signals include localized informalities, typos, and classifier
 * disagreement with surrounding formal AI prose.
 */
export function detectHumanEdits(
  passages: Passage[],
  classifierScores: PassageScore[],
  _linguistic: LinguisticProfile,
  _statistical: StatisticalProfile,
): HumanEditDetectionResult {
  const paragraphPassages = passages.filter((p) => p.type === 'paragraph');
  const paragraphScores = classifierScores.filter((_, i) => passages[i]?.type === 'paragraph');
  if (paragraphPassages.length === 0 || paragraphScores.length === 0) {
    return { humanEditProbability: 0, editBoundaries: [], evidence: [] };
  }

  const editBoundaries: { start: number; end: number }[] = [];
  const evidence: EditEvidence[] = [];
  let totalStrength = 0;

  // Compare each paragraph to the document average.
  const avgAi =
    paragraphScores.reduce((sum, s) => sum + s.aiProbability, 0) / paragraphScores.length;

  for (let i = 0; i < paragraphPassages.length; i++) {
    const p = paragraphPassages[i];
    const score = paragraphScores[i];
    if (!score) continue;

    const informalCount = countMatches(p.text, INFORMAL_MARKERS);
    const typoCount = countMatches(p.text, TYPO_PATTERNS);
    const scoreDrop = Math.max(0, avgAi - score.aiProbability);

    const humanization = (informalCount + typoCount * 2) / Math.max(1, p.text.split(/\s+/).length);
    const editSignal = Math.min(1, humanization * 4 + scoreDrop);

    if (editSignal > 0.4) {
      totalStrength += editSignal;
      editBoundaries.push({ start: p.start, end: p.end });
      evidence.push({
        start: p.start,
        end: p.end,
        description: 'This passage shows localized informalities, typos, or a sudden drop in AI signal compared to surrounding text, consistent with human editing.',
        strength: editSignal,
      });
    }
  }

  const humanEditProbability = Math.min(
    1,
    (totalStrength / Math.max(1, paragraphPassages.length)) * 1.5,
  );

  return { humanEditProbability, editBoundaries, evidence };
}
