import { describe, expect, it } from 'vitest';
import { classifyWithClassifier } from '@/lib/detection/classifier';
import { analyzeAdvancedText } from '@/lib/detection/engine';

/** Candidate stress cases, NOT exact user screenshots and NOT a measured accuracy benchmark. */
describe('Balanced detector discrimination diagnostic', () => {
  const humanDraft = `I wrote this report after attending the council meeting on Tuesday. I checked my notes against the public minutes because I had misheard the name of one street. The first draft also left out a question from a resident, so I added her concern and emailed the final version to my editor.`;
  const naturalAiCandidate = `The public library has quietly become a gathering place for residents who rarely crossed paths before. On weekday evenings, students settle near the windows while older visitors join reading groups downstairs. Staff say the extended schedule has made the building more useful, although questions remain about how to fund the additional hours.`;
  const formulaicAiCandidate = `In today's rapidly evolving digital landscape, artificial intelligence is transforming the way organizations operate. By leveraging powerful machine learning algorithms, businesses can unlock new opportunities, streamline processes, and drive sustainable innovation. Moreover, adopting responsible frameworks is crucial for long-term success in an increasingly interconnected world.`;

  it('records raw classifier versus full-pipeline decisions for controlled contrast cases', async () => {
    const samples = [
      { name: 'human-draft', text: humanDraft },
      { name: 'natural-ai-style', text: naturalAiCandidate },
      { name: 'formulaic-ai-style', text: formulaicAiCandidate },
    ];
    for (const sample of samples) {
      const classifier = await classifyWithClassifier(sample.text, 'en');
      const full = await analyzeAdvancedText(sample.text);
      console.info('[detector-diagnostic]', JSON.stringify({
        sample: sample.name,
        classifierAvailable: classifier.available,
        binaryClassifierAi: classifier.aiProbability,
        multiClass: classifier.classProbabilities,
        calibratedAi: full.overall.aiProbability,
        calibratedHuman: full.overall.humanProbability,
        mixed: full.overall.mixedProbability,
        verdict: full.overall.verdict,
        confidence: full.overall.confidence,
        detectorVersion: full.metadata.detectorVersion,
      }));
      expect(classifier.available).toBe(true);
      expect(full.overall.aiProbability).toBeGreaterThanOrEqual(0);
      expect(full.overall.aiProbability).toBeLessThanOrEqual(100);
    }
  });
});
