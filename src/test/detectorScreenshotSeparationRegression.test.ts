import { describe, expect, it } from 'vitest';
import { runAggressiveDetector } from '@/lib/detection/aggressiveDetectorService';

/**
 * Regression cases motivated by manually verified production screenshots, 2026-10-09.
 *
 * Actual screenshot observations (NOT reproduced as test outputs):
 * - human sample A: Balanced 26%, Strict 98%
 * - human sample B: Balanced 27%, Strict 86%
 * - AI sample:      Balanced 16%, Strict 86%
 *
 * The original submitted texts / full metadata were not in the screenshots.
 * The fixtures below are controlled *representative human text* and *synthetic*
 * Balanced metadata to probe the known high-risk amplification path.
 * They must not be presented as reproduction of the exact production scans.
 */
describe('Detector AI-vs-human separation regressions (human false positives)', () => {
  const humanAuthoredDraft = `I drafted the introduction on Tuesday after reviewing my interview notes. The first version sounded stiff, so I moved the personal example to the opening and cut two paragraphs that repeated the same point. My editor suggested a shorter conclusion, but the observations and wording are mine.`;

  const humanAuthoredReport = `The town council met on Thursday to review the proposed bus timetable. I attended the session and took notes while residents described how the earlier service affected work shifts. After the meeting, I checked the published schedule against those comments and corrected two mistakes in my draft.`;

  function humanLeaningBalanced(ai: number, human: number, mixed: number): any {
    return {
      ai, human, mixed, verdict: 'mostly-human-ai-assisted', risk: 'Medium',
      confidence: 54, confidenceLevel: 'Medium', language: 'English',
      full: {
        metadata: {
          classProbabilities: {
            human: 0.62, ai: 0.08, 'human-edited-ai': 0.26, mixed: 0.04,
          },
        },
        humanization: {
          detected: true, confidence: 20,
          signals: ['coherence mismatch'],
          explanation: 'Weak paraphrase-style evidence; not proof of AI authorship.',
        },
        linguisticProfile: {
          specificityScore: 0.06, personalVoiceScore: 0.04, contextualCoherence: 0.07,
        },
        statisticalProfile: { editingSignalScore: 0.16 },
        sentences: [],
      },
    };
  }

  it('does not turn a human-leaning 26/62/12 Balanced result into 90-98% AI using weak editing cues', async () => {
    const result = await runAggressiveDetector(
      humanAuthoredDraft,
      humanLeaningBalanced(26, 62, 12),
    );
    expect(result.ai).toBeLessThan(65);
    expect(result.risk).not.toBe('High');
  });

  it('does not label an independently supplied human-written sample high risk only due to an aggressive score floor', async () => {
    const result = await runAggressiveDetector(
      humanAuthoredReport,
      humanLeaningBalanced(27, 61, 12),
    );
    expect(result.ai).toBeLessThan(65);
    expect(result.risk).not.toBe('High');
  });
});
