import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import bitcoin from './fixtures/userAttestedAiBitcoinMining.md?raw';
import human from './fixtures/userAttestedHumanSeoReview.md?raw';
import { analyzeAdvancedText as browser } from '@/lib/detection/engine';
import { analyzeAdvancedText as edge } from '../../supabase/functions/_shared/detection/engine.ts';
import { runAggressiveDetector as browserStrict } from '@/lib/detection/aggressiveDetectorService';
import { runAggressiveDetector as edgeStrict } from '../../supabase/functions/_shared/detection/aggressiveDetector.ts';
import { analyzeDocumentStyle } from '@/lib/detection/documentStyleEvidence';

const priorDeno = (globalThis as any).Deno;
beforeAll(() => { (globalThis as any).Deno = { env: { get: () => 'true' } }; });
afterAll(() => { (globalThis as any).Deno = priorDeno; });
const stable = (r: Awaited<ReturnType<typeof browser>>) => ({
  overall: r.overall, sentences: r.sentences, paragraphs: r.paragraphs,
  highlights: r.highlights, warnings: r.warnings, trace: r._dev,
});
describe('Shared browser and Edge evidence scoring', () => {
  it('uses the same implementation for both modes', () => {
    expect(browser).toBe(edge);
    expect(browserStrict).toBe(edgeStrict);
  });
  it('traces the exact unchanged bitcoin article through the reading rubric', async () => {
    expect(createHash('sha256').update(bitcoin).digest('hex')).toBe('b297a5efc3c5c63f849817b7c07df663a2377606c40104ddf3f58e535b6c8d1d');
    const r = await browser(bitcoin);
    expect(r._dev?.rawEnsembleScores.ai).toBe(19);
    expect(r._dev?.preStyleScores.ai).toBe(19);
    expect(r._dev?.styleEvidence.supportingCues).toHaveLength(4);
    const audit = r.readingEvidence!;
    expect(audit.appliedContribution).toBe(Math.round(audit.netPoints));
    expect(audit.finalAi).toBe(audit.baseAi + audit.appliedContribution);
    expect(r.overall.aiProbability).toBe(audit.finalAi);
    expect(r.overall.verdict).toBe('inconclusive');
    expect((await browserStrict(bitcoin)).ai).toBe(r.overall.aiProbability);
    expect(stable(await edge(bitcoin))).toEqual(stable(r));
  });
  it('allows strong document evidence to contribute more than twelve points', async () => {
    const paragraph = 'Equipment needs to be understood before making a purchase because its output changes with operating conditions. For example, imagine equipment using 300 watts while producing output. Keep in mind that earnings are not guaranteed. Research the equipment and calculate the costs before spending money. Mining equipment output depends on the network and electricity conditions.';
    const text = Array.from({ length: 12 }, (_, i) => `## Section ${i + 1}\n\n${paragraph}\n\n${paragraph}`).join('\n\n');
    const style = analyzeDocumentStyle(text);
    expect(style.supportingCues.length).toBeGreaterThan(5);
    const r = await browser(text);
    expect(r._dev?.styleEvidence.eligible).toBe(true);
    expect(r._dev?.styleEvidence.requestedContribution).toBeGreaterThan(12);
    expect(r._dev?.styleEvidence.appliedContribution).toBeGreaterThan(12);
    expect(r.overall.aiProbability).toBeLessThanOrEqual(100);
    expect(r.overall.humanProbability).toBeGreaterThanOrEqual(0);
  });
  it('keeps human controls and multilingual input identical across execution paths', async () => {
    for (const text of [human, 'El informe contiene nuestras observaciones y los resultados del trabajo realizado ayer.', 'هذا التقرير يشرح نتائج العمل والملاحظات التي سجلناها أمس.', 'Yesterday I checked the records and corrected an error in my own notes.']) {
      expect(stable(await browser(text))).toEqual(stable(await edge(text)));
      expect(await browserStrict(text)).toEqual(await edgeStrict(text));
    }
  });
});
