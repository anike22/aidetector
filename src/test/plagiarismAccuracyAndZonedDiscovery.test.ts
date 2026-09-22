import { describe, it, expect } from 'vitest';
import {
  computePassageDistinctiveness,
  buildQueryPlanAcrossDocumentZones,
  extractRareTerms,
  extractNamedEntities,
  splitSentencesWithOffsets,
  segmentDocument,
} from '@/lib/plagiarism/textSegmentation';
import { buildSearchCoverageReport } from '@/lib/plagiarism/coverageMatrix';

describe('Plagiarism Accuracy & Zoned Discovery Engine', () => {
  const sampleAcademicText = `
    Attention Is All You Need is a landmark paper published in 2017 introducing the Transformer architecture.
    The dominant sequence transduction models are based on complex recurrent or convolutional neural networks.
    We propose the Transformer, a model architecture eschewing recurrence and relying entirely on an attention mechanism.
    Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable.
    On the WMT 2014 English-to-German translation task, the big transformer model achieves 28.4 BLEU.
    On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8.
    The Transformer allows for significantly more parallelization and can reach a new state of the art in translation quality after being trained for as little as twelve hours on eight P100 GPUs.
    An attention function can be described as mapping a query and a set of key-value pairs to an output.
    Multi-head attention allows the model to jointly attend to information from different representation subspaces.
    In this work, we presented the Transformer, the first sequence transduction model based entirely on attention.
  `;

  it('1. Extracts named entities and rare technical tokens accurately', () => {
    const entities = extractNamedEntities(sampleAcademicText);
    const rareTerms = extractRareTerms(sampleAcademicText);

    expect(entities.length).toBeGreaterThan(0);
    expect(rareTerms.length).toBeGreaterThan(0);
    expect(entities.some((e) => e.includes('Transformer') || e.includes('Attention') || e.includes('WMT'))).toBe(true);
  });

  it('2. Scores distinctive factual and technical passages substantially higher than generic boilerplate', () => {
    const highInfoPassage = "On the WMT 2014 English-to-German translation task, the big transformer model achieves 28.4 BLEU score on eight P100 GPUs.";
    const boilerplatePassage = "All rights reserved. Terms and conditions apply. Privacy policy details are written in accordance with standard rules.";

    const highScore = computePassageDistinctiveness(highInfoPassage);
    const lowScore = computePassageDistinctiveness(boilerplatePassage);

    expect(highScore).toBeGreaterThan(0.4);
    expect(lowScore).toBeLessThan(0.2);
    expect(highScore).toBeGreaterThan(lowScore);
  });

  it('3. Generates 5-tier query fallback ladders across document zones', () => {
    const queries = buildQueryPlanAcrossDocumentZones(sampleAcademicText, 15);

    expect(queries.length).toBeGreaterThan(0);
    // Should contain level 1 or 2 exact quoted queries
    const hasQuoted = queries.some((q) => q.query.startsWith('"') && q.query.endsWith('"'));
    expect(hasQuoted).toBe(true);

    // Should cover multiple zones
    const zones = new Set(queries.map((q) => q.zone));
    expect(zones.size).toBeGreaterThanOrEqual(2);
  });

  it('4. Provides transparent search coverage report without false 100% equivalence', () => {
    const report = buildSearchCoverageReport({
      crossref: { status: 'ok', queriesSent: 6, candidatesReturned: 8, verifiedSources: 2 },
      openalex: { status: 'ok', queriesSent: 6, candidatesReturned: 10, verifiedSources: 3 },
      unpaywall: { status: 'ok', queriesSent: 2, candidatesReturned: 2, verifiedSources: 2 },
      webSearch: { status: 'not_configured', queriesSent: 0, candidatesReturned: 0, verifiedSources: 0 },
    });

    expect(report.allPrimaryRegistriesOperational).toBe(true);
    expect(report.totalQueriesSent).toBe(14);
    expect(report.totalCandidatesEvaluated).toBe(20);
    expect(report.totalVerifiedSourcesFound).toBe(7);

    const crossrefSystem = report.systems.find((s) => s.id === 'crossref');
    expect(crossrefSystem?.statusLabel).toContain('Operational');
    expect(crossrefSystem?.queriesSent).toBe(6);
  });

  it('5. Handles partial or unavailable registry failures gracefully', () => {
    const report = buildSearchCoverageReport({
      crossref: { status: 'failed' },
      openalex: { status: 'ok', queriesSent: 4, candidatesReturned: 5, verifiedSources: 1 },
      unpaywall: { status: 'skipped' },
    });

    expect(report.allPrimaryRegistriesOperational).toBe(false);
    expect(report.unavailableCount).toBe(1);
    const failedSystem = report.systems.find((s) => s.id === 'crossref');
    expect(failedSystem?.status).toBe('unavailable');
    expect(failedSystem?.statusLabel).toBe('Temporarily unavailable');
  });
});

// ─── Discovery Recall Regression: zone coverage must survive provider query slices ───

describe('Discovery Recall Regression (Req 31, 34, 35)', () => {
  // Hybrid document: original opening (low distinctiveness) + verbatim copied middle + original ending.
  // Ground truth: only the middle zone is copied (~50%).
  const HYBRID_DOC = `In this research paper we conduct an original investigation into the deployment of neural attention architectures for small-scale educational applications. Our classroom tests demonstrated that students benefit from immediate feedback during composition tasks.
The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. In this work we propose the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism to draw global dependencies between input and output.
We conclude that adopting self-attention models enables educators to build lightweight interactive tutoring tools without large cluster expenses.`;

  it('emits Level-1 quoted queries for ALL five zones, including low-distinctiveness copied text', () => {
    const plan = buildQueryPlanAcrossDocumentZones(HYBRID_DOC, 16);
    const zonesCovered = new Set(plan.map((q) => q.zone));
    // Every zone that has at least 7 words must contribute a Level-1 query.
    expect(zonesCovered.size).toBeGreaterThanOrEqual(5);
    const level1 = plan.filter((q) => q.level === 1);
    expect(level1.length).toBeGreaterThanOrEqual(5);
    // The copied middle-zone phrase must be queryable verbatim.
    const copiedQuery = plan.find((q) => q.query.includes('dominant sequence transduction models'));
    expect(copiedQuery).toBeDefined();
    expect(copiedQuery!.zone).toBe('middle');
  });

  it('orders the plan so any provider prefix (first 6-16 queries) covers every zone', () => {
    const plan = buildQueryPlanAcrossDocumentZones(HYBRID_DOC, 16);
    for (const sliceLen of [6, 8, 10, 16]) {
      const prefix = plan.slice(0, sliceLen);
      const zones = new Set(prefix.map((q) => q.zone));
      expect(zones.size).toBeGreaterThanOrEqual(5);
    }
  });

  it('discovers the copied middle zone even when only the first 3 queries run', () => {
    const plan = buildQueryPlanAcrossDocumentZones(HYBRID_DOC, 16);
    const firstThree = plan.slice(0, 3);
    const hitsCopied = firstThree.some((q) =>
      q.query.includes('dominant sequence transduction') ||
      q.query.includes('sequence transduction models') ||
      q.query.includes('attention mechanism')
    );
    expect(hitsCopied).toBe(true);
  });
});
