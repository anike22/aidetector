import { describe, expect, it } from 'vitest';
import { classifyWithClassifier } from '@/lib/detection/classifier';
import { analyzeAdvancedText } from '@/lib/detection/engine';

/** Candidate stress cases, NOT exact user screenshots and NOT a measured accuracy benchmark. */
describe('Balanced detector discrimination diagnostic', () => {
  const humanDraft = `I wrote this report after attending the council meeting on Tuesday. I checked my notes against the public minutes because I had misheard the name of one street. The first draft also left out a question from a resident, so I added her concern and emailed the final version to my editor.`;
  const clearScopHuman = `ClearScop is an SEO tool for researching, writing, optimizing and monitoring. It is an AI powered workflow for content creation and visibility. Just like the name sound, clearScop gives clear SEO direction for bloggers and agencies. When it comes to multilayered architecture, ClearScop is a tested business growth hube. Its best for bloggers who wish to optimize for chatGPT, google AI overviews, and other AI srarch. More so, the platform focused on AEO and SEO content strategies, it builds scalable growth engines for consumer.`;
  const naturalAiCandidate = `The public library has quietly become a gathering place for residents who rarely crossed paths before. On weekday evenings, students settle near the windows while older visitors join reading groups downstairs. Staff say the extended schedule has made the building more useful, although questions remain about how to fund the additional hours.`;
  const formulaicAiCandidate = `In today's rapidly evolving digital landscape, artificial intelligence is transforming the way organizations operate. By leveraging powerful machine learning algorithms, businesses can unlock new opportunities, streamline processes, and drive sustainable innovation. Moreover, adopting responsible frameworks is crucial for long-term success in an increasingly interconnected world.`;

  it('records raw classifier versus full-pipeline decisions for controlled contrast cases', async () => {
    const samples = [
      { name: 'human-draft', text: humanDraft },
      { name: 'clearscop-user-reported-human', text: clearScopHuman },
      { name: 'natural-ai-style', text: naturalAiCandidate },
      { name: 'formulaic-ai-style', text: formulaicAiCandidate },
      // Length sensitivity: these are stress probes, not verified authorship labels.
      { name: 'natural-ai-style-repeated-context', text: [naturalAiCandidate, naturalAiCandidate, naturalAiCandidate, naturalAiCandidate].join('\n\n') },
      { name: 'human-draft-repeated-context', text: [humanDraft, humanDraft, humanDraft, humanDraft].join('\n\n') },
      { name: 'formulaic-ai-style-repeated-context', text: [formulaicAiCandidate, formulaicAiCandidate, formulaicAiCandidate, formulaicAiCandidate].join('\n\n') },
    ];
    for (const sample of samples) {
      const classifier = await classifyWithClassifier(sample.text, 'en');
      const full = await analyzeAdvancedText(sample.text);
      if (sample.name === 'clearscop-user-reported-human') {
        const { runAggressiveDetector } = await import('@/lib/detection/aggressiveDetectorService');
        const strict = await runAggressiveDetector(sample.text);
        console.info('[user-human-case-strict]', JSON.stringify({ strictAi: strict.ai, strictRisk: strict.risk, warnings: full.warnings, sentences: full.sentences.map(s => ({verdict:s.verdict, ai:s.aiProbability, human:s.humanProbability})) }));
      }
      console.info('[detector-diagnostic]', JSON.stringify({
        sample: sample.name,
        classifierAvailable: classifier.available,
        binaryClassifierAi: classifier.aiProbability,
        multiClass: classifier.classProbabilities,
        multiClassAiFamily: Math.round(1000 * (
          (classifier.classProbabilities.ai ?? 0) +
          (classifier.classProbabilities['human-edited-ai'] ?? 0) +
          (classifier.classProbabilities['translated-ai'] ?? 0)
        )) / 10,
        chunkCount: classifier.chunkScores.length,
        chunkBinaryAi: classifier.chunkScores.map(chunk => chunk.aiProbability),
        wordCount: sample.text.trim().split(/\s+/).length,
        calibratedAi: full.overall.aiProbability,
        calibratedHuman: full.overall.humanProbability,
        mixed: full.overall.mixedProbability,
        verdict: full.overall.verdict,
        confidence: full.overall.confidence,
        localVerdicts: full.sentences.map(s => s.verdict),
        highlights: full.highlights.map(h => ({verdict:h.verdict, confidence:h.confidence})),
        warnings: full.warnings,
        detectorVersion: full.metadata.detectorVersion,
      }));
      if (sample.name === 'clearscop-user-reported-human') {
        // Regression for an actual UI contradiction: AI-leaning local sentences
        // used to be assembled into a green "Likely Human" highlight.
        const aiSentences = full.sentences.filter(s => s.verdict === 'likely-ai' || s.verdict === 'mostly-ai-human-edited');
        if (aiSentences.length === full.sentences.length) {
          expect(full.highlights.some(h => h.verdict === 'likely-human')).toBe(false);
        }
      }
      expect(classifier.available).toBe(true);
      expect(full.overall.aiProbability).toBeGreaterThanOrEqual(0);
      expect(full.overall.aiProbability).toBeLessThanOrEqual(100);
    }
  });
});
