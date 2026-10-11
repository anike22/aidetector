import { describe, expect, it } from 'vitest';
import bitcoin from './fixtures/userAttestedAiBitcoinMining.md?raw';
import human from './fixtures/userAttestedHumanSeoReview.md?raw';
import { analyzeReadingEvidence } from '../../supabase/functions/_shared/detection/readingEvidence.ts';
import { analyzeAdvancedText } from '@/lib/detection/engine';

describe('Auditable document reading rubric', () => {
  it('accounts for every reading criterion including neutral and counter-evidence checks', () => {
    const r = analyzeReadingEvidence(bitcoin);
    expect(r.checks.map(c => c.id)).toEqual(['organization','section-pattern','repeated-ideas','hypothetical-examples','firsthand-experience','grounding','attributed-evidence','voice','qualifications','seo','conclusion','counter-evidence','prior-knowledge']);
    expect(r.positivePoints).toBeCloseTo(r.checks.reduce((n,c) => n + Math.max(0,c.points),0), 2);
    expect(r.counterPoints).toBeCloseTo(r.checks.reduce((n,c) => n + Math.min(0,c.points),0), 2);
    expect(r.netPoints).toBeCloseTo(r.positivePoints + r.counterPoints, 2);
    expect(r.checks.find(c => c.id === 'counter-evidence')!.points).toBeLessThan(0);
    for (const c of r.checks) for (const e of c.excerpts) expect(bitcoin.slice(e.start,e.end)).toBe(e.text);
  });
  it('does not treat a payout rule as a cited source', () => {
    const r = analyzeReadingEvidence(bitcoin);
    expect(r.checks.find(c => c.id === 'attributed-evidence')!.value).toBe(0);
    expect(r.checks.find(c => c.id === 'grounding')!.finding).toContain('0 source markers');
  });
  it('gives organization, SEO framing and prior provenance zero authorship points', () => {
    for (const text of [bitcoin,human]) for (const c of analyzeReadingEvidence(text).checks.filter(c => ['organization','seo','prior-knowledge'].includes(c.id))) expect(c.points).toBe(0);
  });
  it('requires corroboration and disables the English rubric for short and other-language text', () => {
    expect(analyzeReadingEvidence(human).eligible).toBe(false);
    expect(analyzeReadingEvidence(human).netPoints).toBe(0);
    expect(analyzeReadingEvidence(bitcoin,'ar').netPoints).toBe(0);
    expect(analyzeReadingEvidence('For example, imagine a simple calculation. It depends on conditions.').netPoints).toBe(0);
  });
  it('computes the returned score from the published evidence ledger without a target override', async () => {
    const r = await analyzeAdvancedText(bitcoin);
    const audit = r.readingEvidence!;
    expect(audit.requestedContribution).toBe(Math.round(audit.netPoints));
    expect(r.overall.aiProbability).toBe(audit.baseAi + audit.appliedContribution);
    expect(r.overall.aiProbability + r.overall.humanProbability + r.overall.mixedProbability).toBe(100);
    expect(r.limitations.some(l => l.includes('provisional'))).toBe(true);
  });
});
