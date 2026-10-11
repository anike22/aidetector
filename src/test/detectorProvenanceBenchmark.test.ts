import humanSeoArticle from './fixtures/userAttestedHumanSeoReview.md?raw';
import { classifyWithClassifier } from '@/lib/detection/classifier';
import { analyzeDocumentStyle } from '@/lib/detection/documentStyleEvidence';
import aiBitcoinMining from './fixtures/userAttestedAiBitcoinMining.md?raw';
import { describe, expect, it } from 'vitest';
import { analyzeAdvancedText } from '@/lib/detection/engine';
import { runAggressiveDetector } from '@/lib/detection/aggressiveDetectorService';

// Authorship provenance is self-reported, not independently verified.
// Do not use this small diagnostic set to claim accuracy or false-positive rates.
const attestedHumanSamples = [{
  id: 'clearscop-user-attested-human',
  provenance: 'user-attested',
  origin: 'human',
  text: `ClearScop is an SEO tool for researching, writing, optimizing and monitoring. It is an AI powered workflow for content creation and visibility. Just like the name sound, clearScop gives clear SEO direction for bloggers and agencies. When it comes to multilayered architecture, ClearScop is a tested business growth hube. Its best for bloggers who wish to optimize for chatGPT, google AI overviews, and other AI srarch. More so, the platform focused on AEO and SEO content strategies, it builds scalable growth engines for consumer.`,
}];

describe('Provenance-aware detector regression benchmark', () => {
  it('records both modes, false-positive events, and missing verified-ground-truth denominators', async () => {
    const samples = [
      ...attestedHumanSamples,
      {
        id: 'seo-review-user-attested-human-with-three-company-quotations',
        provenance: 'user-attested',
        origin: 'human',
        text: humanSeoArticle,
      },
      {
        id: 'bitcoin-mining-user-attested-ai',
        provenance: 'user-attested',
        origin: 'ai',
        text: aiBitcoinMining,
      },
    ];
    const results = [];
    for (const sample of samples) {
      const classifier = await classifyWithClassifier(sample.text, 'en');
      const style = analyzeDocumentStyle(sample.text);
      console.info('[style-evidence]', JSON.stringify({ id: sample.id, ...style }));
      const balanced = await analyzeAdvancedText(sample.text);
      const strict = await runAggressiveDetector(sample.text, {
        ai: balanced.overall.aiProbability,
        human: balanced.overall.humanProbability,
        mixed: balanced.overall.mixedProbability,
        verdict: balanced.overall.verdict,
        risk: balanced.overall.riskLevel,
        confidence: balanced.overall.confidence,
        confidenceLevel: balanced.overall.confidenceLevel,
        language: balanced.language.primary?.name || 'English',
        full: balanced,
      } as Parameters<typeof runAggressiveDetector>[1]);
      if (sample.id === 'seo-review-user-attested-human-with-three-company-quotations') {
        console.info('[human-seo-layer-audit]', JSON.stringify({
          wordCount: sample.text.trim().split(/\s+/).length,
          classifierAi: classifier.aiProbability,
          classifierChunks: classifier.chunkScores.map(c => c.aiProbability),
          localSentenceVerdicts: balanced.sentences.reduce<Record<string, number>>((counts, sentence) => {
            counts[sentence.verdict] = (counts[sentence.verdict] || 0) + 1; return counts;
          }, {}),
          localParagraphVerdicts: balanced.paragraphs.reduce<Record<string, number>>((counts, paragraph) => {
            counts[paragraph.verdict] = (counts[paragraph.verdict] || 0) + 1; return counts;
          }, {}),
          overall: balanced.overall,
          strictAi: strict.ai,
          strictRisk: strict.risk,
        }));
      }
      if (sample.origin === 'ai') {
        console.info('[long-ai-layer-audit]', JSON.stringify({
          wordCount: sample.text.trim().split(/\\s+/).length,
          classifierAi: classifier.aiProbability,
          classProbabilities: classifier.classProbabilities,
          chunkScores: classifier.chunkScores.map(c => c.aiProbability),
          chunkCount: classifier.chunkScores.length,
          localSentenceVerdicts: balanced.sentences.reduce<Record<string, number>>((counts, sentence) => {
            counts[sentence.verdict] = (counts[sentence.verdict] || 0) + 1; return counts;
          }, {}),
          localParagraphVerdicts: balanced.paragraphs.reduce<Record<string, number>>((counts, paragraph) => {
            counts[paragraph.verdict] = (counts[paragraph.verdict] || 0) + 1; return counts;
          }, {}),
          linguistic: balanced.linguisticProfile,
          statistical: balanced.statisticalProfile,
          humanization: balanced.humanization,
          overall: balanced.overall,
        }));
      }
      results.push({
        id: sample.id, origin: sample.origin, provenance: sample.provenance,
        balancedAi: balanced.overall.aiProbability, balancedVerdict: balanced.overall.verdict,
        strictAi: strict.ai, strictRisk: strict.risk,
        balancedHighAi: balanced.overall.aiProbability >= 65,
        strictHighAi: strict.ai >= 65,
        highlights: balanced.highlights.map(h => h.verdict),
      });
    }
    const report = {
      sampleCount: results.length,
      selfReportedHumanCount: results.filter(r => r.origin === 'human').length,
      selfReportedAiCount: results.filter(r => r.origin === 'ai').length,
      independentlyVerifiedHumanCount: 0,
      independentlyVerifiedAiCount: 0,
      highAiThreshold: 65,
      selfReportedHumanHighAiEvents: {
        balanced: results.filter(x => x.origin === 'human' && x.balancedHighAi).length,
        strict: results.filter(x => x.origin === 'human' && x.strictHighAi).length,
      },
      selfReportedAiFalseNegativeEvents: {
        balanced: results.filter(x => x.origin === 'ai' && !x.balancedHighAi).length,
        strict: results.filter(x => x.origin === 'ai' && !x.strictHighAi).length,
      },
      verifiedFalsePositiveRate: null,
      verifiedFalseNegativeRate: null,
      results,
    };
    console.info('[provenance-benchmark]', JSON.stringify(report));
    const longAi = results.find(r => r.id === 'bitcoin-mining-user-attested-ai');
    // Do not claim detection: prevent an unsupported confident Human verdict
    // while classifier recall remains unresolved.
    expect(longAi?.balancedVerdict).toBe('inconclusive');
    expect(longAi?.strictRisk).toBe('Medium');
    expect(longAi?.balancedAi).toBeLessThan(65);
    expect(report.selfReportedAiCount).toBe(1);
    expect(report.selfReportedHumanCount).toBe(2);
    expect(report.selfReportedHumanHighAiEvents.balanced).toBe(0);
    expect(report.selfReportedHumanHighAiEvents.strict).toBe(0);
    expect(report.verifiedFalsePositiveRate).toBeNull();
    expect(report.verifiedFalseNegativeRate).toBeNull();
  });
});
