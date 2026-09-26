import { describe, it, expect } from 'vitest';
import { executePlagiarismForensicsPipeline } from '@/lib/plagiarism/plagiarismIntelligencePipeline';
import { computePlagiarismRisk } from '@/lib/plagiarism/riskEngine';
import { buildSearchCoverageReport } from '@/lib/plagiarism/coverageMatrix';
import { buildQueryPlanAcrossDocumentZones, segmentDocument, splitSentencesWithOffsets } from '@/lib/plagiarism/textSegmentation';
import type { PlagiarismAnalysisResult } from '@/pages/detector/detectionEngine';

describe('PDF Accuracy & Forensic Engine Verification Suite (Tests A to H)', () => {
  const sampleWikipediaPassage =
    'The James Webb Space Telescope is an optical space telescope designed primarily to conduct infrared astronomy. As the largest optical telescope in space, its high resolution and sensitivity allow it to view objects too old, distant, or faint for the Hubble Space Telescope.';

  // ───────────────────────────────────────────────────────────────────────────
  // TEST A: Exact Match Copied Text Detection & Offset Mapping
  // ───────────────────────────────────────────────────────────────────────────
  it('Test A: Correctly maps and attributes exact copied passages with precise character offsets', () => {
    const mockResult: PlagiarismAnalysisResult = {
      status: 'completed',
      similarityScore: 48,
      originalityScore: 52,
      exactMatchScore: 48,
      nearMatchScore: 0,
      paraphraseMatchScore: 0,
      semanticMatchScore: 0,
      riskLevel: 'High',
      sources: [
        {
          title: 'James Webb Space Telescope - Wikipedia',
          url: 'https://en.wikipedia.org/wiki/James_Webb_Space_Telescope',
          publisher: 'Wikipedia',
          doi: null,
          provider: 'web',
          matchContribution: 48,
          uniqueContribution: 48,
          citedMaterial: false,
          similarity: 100,
          matchType: 'Exact',
          verified: true,
          matchedSpans: [
            {
              submittedStart: 0,
              submittedEnd: 110,
              submittedPassage: sampleWikipediaPassage.slice(0, 110),
              sourcePassage: sampleWikipediaPassage.slice(0, 110),
              matchType: 'exact',
              spanSimilarity: 1.0,
            },
          ],
        },
      ],
      coverageNote: 'Verified exact matches found in indexed repositories.',
      providerStatus: {
        crossref: 'skipped',
        openalex: 'skipped',
        unpaywall: 'skipped',
        gemini: 'skipped',
        webSearch: 'ok',
        exa: 'ok',
      },
    };

    const intel = executePlagiarismForensicsPipeline(sampleWikipediaPassage, mockResult);

    expect(intel.evidenceMatches.length).toBeGreaterThan(0);
    const firstMatch = intel.evidenceMatches[0];
    expect(firstMatch.category).toBe('exact');
    expect(firstMatch.submittedStart).toBe(0);
    expect(firstMatch.submittedEnd).toBe(110);
    expect(firstMatch.sourceTitle).toContain('James Webb Space Telescope');
    expect(intel.individualSourceContributions.length).toBe(1);
    expect(intel.individualSourceContributions[0].uniqueNonOverlappingPercentage).toBe(48);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST B: Multi-Source Overlap Merging (Strict Union Calculation)
  // ───────────────────────────────────────────────────────────────────────────
  it('Test B: Merges overlapping multi-source matches into a strict union without double-counting', () => {
    const text =
      'Artificial intelligence in medicine represents a transformative paradigm for healthcare delivery and diagnostics. ' +
      'Recent clinical trials demonstrate significant improvement in diagnostic accuracy and radiomics workflow efficiency.';

    const spanA = {
      submittedStart: 0,
      submittedEnd: 115,
      submittedPassage: text.slice(0, 115),
      sourcePassage: text.slice(0, 115),
      matchType: 'exact' as const,
      spanSimilarity: 1.0,
    };

    const spanB = {
      submittedStart: 50,
      submittedEnd: 160,
      submittedPassage: text.slice(50, 160),
      sourcePassage: text.slice(50, 160),
      matchType: 'near' as const,
      spanSimilarity: 0.85,
    };

    const mockResult: PlagiarismAnalysisResult = {
      status: 'completed',
      similarityScore: 68,
      originalityScore: 32,
      exactMatchScore: 48,
      nearMatchScore: 30,
      paraphraseMatchScore: 0,
      semanticMatchScore: 0,
      riskLevel: 'High',
      sources: [
        {
          title: 'Source Alpha: Medical AI Journal',
          url: 'https://doi.org/10.1000/alpha',
          publisher: 'Springer Nature',
          doi: '10.1000/alpha',
          provider: 'crossref',
          matchContribution: 48,
          uniqueContribution: 48,
          citedMaterial: false,
          similarity: 100,
          matchType: 'Exact',
          verified: true,
          matchedSpans: [spanA],
        },
        {
          title: 'Source Beta: Healthcare Radiomics Review',
          url: 'https://doi.org/10.1000/beta',
          publisher: 'Elsevier',
          doi: '10.1000/beta',
          provider: 'openalex',
          matchContribution: 45,
          uniqueContribution: 20,
          citedMaterial: false,
          similarity: 85,
          matchType: 'Near Match',
          verified: true,
          matchedSpans: [spanB],
        },
      ],
      coverageNote: 'Overlapping multi-source evidence merged.',
      providerStatus: {
        crossref: 'ok',
        openalex: 'ok',
        unpaywall: 'skipped',
        gemini: 'skipped',
        webSearch: 'ok',
      },
    };

    const intel = executePlagiarismForensicsPipeline(text, mockResult);

    // Sum of unique contributions must equal the merged union score (48 + 20 = 68%)
    const sumUnique = intel.individualSourceContributions.reduce(
      (acc, s) => acc + s.uniqueNonOverlappingPercentage,
      0
    );
    expect(sumUnique).toBe(68);
    expect(sumUnique).toBeLessThanOrEqual(mockResult.similarityScore);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST C: Quoted & Cited Material Attribution Engine
  // ───────────────────────────────────────────────────────────────────────────
  it('Test C: Distinguishes properly cited quotations and prevents false high risk flags', () => {
    const citedDocument =
      'According to Smith et al. (2023), "deep neural architectures require extensive empirical benchmarking to avoid silent overfitting in non-stationary distributions." This perspective highlights the need for continuous evaluation.';

    const quoteMatch = {
      id: 'match_quote_1',
      sourceId: 'src_smith_2023',
      sourceTitle: 'Empirical Deep Learning Benchmarks',
      sourceUrl: 'https://example.com/smith2023',
      submittedStart: 34,
      submittedEnd: 161,
      submittedPassage:
        'deep neural architectures require extensive empirical benchmarking to avoid silent overfitting in non-stationary distributions.',
      sourcePassage:
        'deep neural architectures require extensive empirical benchmarking to avoid silent overfitting in non-stationary distributions.',
      similarityScore: 1.0,
      matchCategory: 'properly_cited' as const,
      attributionStatus: 'properly_cited' as const,
      isExcludedByFalsePositiveFilter: false,
      falsePositiveReason: 'Properly formatted and cited quotation',
    };

    const risk = computePlagiarismRisk(citedDocument.length, [quoteMatch], 60, false);

    expect(risk.properlyCitedPercentage).toBeGreaterThan(0);
    expect(risk.uncitedDirectMatchPercentage).toBe(0);
    expect(risk.riskLevel).toBe('None');
    expect(risk.riskExplanation).toContain('properly cited');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST D: Partial Provider Coverage (Honest 0% vs Limited Coverage)
  // ───────────────────────────────────────────────────────────────────────────
  it('Test D: Flags 0% similarity with failed providers as "Limited Coverage" rather than false 100% originality', () => {
    const report = buildSearchCoverageReport({
      crossref: 'failed',
      openalex: 'skipped',
      unpaywall: 'skipped',
      webSearch: 'not_configured',
      exa: 'failed',
    });

    expect(report.allPrimaryRegistriesOperational).toBe(false);
    expect(report.overallCoveragePercentage).toBeLessThanOrEqual(50);

    const risk = computePlagiarismRisk(500, [], 0, true);
    expect(risk.riskLevel).toBe('Limited Coverage');
    expect(risk.riskExplanation).toContain('partial source coverage');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST E: 5-Tier Query Generation Ladder Across Document Zones
  // ───────────────────────────────────────────────────────────────────────────
  it('Test E: Generates 5 distinct search query strategies covering all document zones', () => {
    const document =
      'Climate change represents an existential challenge for human civilization in the twenty-first century. ' +
      'Anthropogenic greenhouse gas emissions continue to accelerate oceanic thermal expansion and atmospheric warming. ' +
      'Paleoclimatic proxy records demonstrate unprecedented rates of polar ice sheet degradation across Greenland and West Antarctica. ' +
      'Technological interventions such as direct air carbon capture and geologic sequestration require massive capital allocation. ' +
      'International climate accords must establish transparent carbon accounting mechanisms to enforce mitigation targets.';

    const plan = buildQueryPlanAcrossDocumentZones(document);
    expect(plan.length).toBeGreaterThanOrEqual(5);

    const zones = new Set(plan.map((q) => q.zone));
    expect(zones.size).toBe(5);

    // Verify presence of exact phrase queries
    const exactQueries = plan.filter((q) => q.query.startsWith('"') && q.query.endsWith('"'));
    expect(exactQueries.length).toBeGreaterThan(0);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST F: No Synthetic Mock Evidence Fallback
  // ───────────────────────────────────────────────────────────────────────────
  it('Test F: Ensures pipeline produces zero mock fallbacks (ev_acad_1, ev_acad_2, ev_acad_3) when sources are empty', () => {
    const cleanText =
      'This is an original essay composed entirely by an individual author without any copying, paraphrasing, or source borrowing whatsoever.';

    const emptyResult: PlagiarismAnalysisResult = {
      status: 'no_verified_matches',
      similarityScore: 0,
      originalityScore: 100,
      exactMatchScore: 0,
      nearMatchScore: 0,
      paraphraseMatchScore: 0,
      semanticMatchScore: 0,
      riskLevel: 'None',
      sources: [],
      coverageNote: 'No overlapping passages detected in verified sources.',
      providerStatus: {
        crossref: 'ok',
        openalex: 'ok',
        unpaywall: 'skipped',
        gemini: 'skipped',
        webSearch: 'not_configured',
      },
    };

    const intel = executePlagiarismForensicsPipeline(cleanText, emptyResult);

    expect(intel.evidenceMatches.length).toBe(0);
    expect(intel.individualSourceContributions.length).toBe(0);
    expect(intel.evidenceMatches.some((e) => e.id.includes('ev_acad'))).toBe(false);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST G: Document Segmentation Fidelity & Boundary Precision
  // ───────────────────────────────────────────────────────────────────────────
  it('Test G: Accurately segments documents with exact non-zero character offsets', () => {
    const text = 'Sentence one is about technology. Sentence two examines bioinformatics and genomic sequencing.';
    const sentences = splitSentencesWithOffsets(text);

    expect(sentences.length).toBe(2);
    expect(sentences[0].start).toBe(0);
    expect(sentences[0].end).toBe(sentences[0].text.length + 1); // accounts for terminal punctuation
    expect(text.slice(sentences[0].start, sentences[0].end).trim()).toBe(sentences[0].text);
    expect(sentences[1].start).toBeGreaterThan(sentences[0].start);
    expect(text.slice(sentences[1].start, sentences[1].end).trim()).toBe(sentences[1].text);

    const segments = segmentDocument(text, 5);
    expect(segments.length).toBeGreaterThanOrEqual(1);
    expect(segments[0].startIndex).toBe(0);
    expect(segments[0].endIndex).toBeGreaterThan(0);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST H: Provider Matrix Telemetry Reporting
  // ───────────────────────────────────────────────────────────────────────────
  it('Test H: Reflects live provider telemetry metrics and distinguishes Operational from Unavailable', () => {
    const report = buildSearchCoverageReport({
      crossref: { status: 'ok', queriesSent: 8, candidatesReturned: 5, verifiedSources: 2 },
      openalex: { status: 'ok', queriesSent: 8, candidatesReturned: 12, verifiedSources: 3 },
      unpaywall: 'skipped',
      webSearch: 'failed',
      exa: { status: 'ok', queriesSent: 6, candidatesReturned: 8, verifiedSources: 1 },
    });

    const crossref = report.systems.find((s) => s.id === 'crossref');
    expect(crossref?.status).toBe('checked');
    expect(crossref?.statusLabel).toContain('Operational');
    expect(crossref?.queriesSent).toBe(8);

    const web = report.systems.find((s) => s.id === 'web_search');
    expect(web?.status).toBe('unavailable');
    expect(web?.statusLabel).toBe('Temporarily unavailable');

    const exa = report.systems.find((s) => s.id === 'exa_web_search');
    expect(exa?.status).toBe('checked');
    expect(exa?.queriesSent).toBe(6);
  });
});
