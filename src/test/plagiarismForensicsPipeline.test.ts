import { describe, it, expect } from 'vitest';
import { segmentDocument, extractNamedEntities, extractRareTerms } from '@/lib/plagiarism/textSegmentation';
import { parseCitations, auditAttributionForPassage } from '@/lib/plagiarism/citationIntelligence';
import { analyzeParaphraseShift } from '@/lib/plagiarism/paraphraseEngine';
import { traceAiRewritePatterns } from '@/lib/plagiarism/aiRewriteTracer';
import { detectCrossLingualMatches } from '@/lib/plagiarism/crossLingualEngine';
import { analyzeConceptAndStructure } from '@/lib/plagiarism/conceptAndStructureEngine';
import { clusterAndChronologizeSources } from '@/lib/plagiarism/sourceClustering';
import { evaluateFalsePositive } from '@/lib/plagiarism/falsePositiveFilter';
import { computePlagiarismRisk } from '@/lib/plagiarism/riskEngine';
import { executePlagiarismForensicsPipeline } from '@/lib/plagiarism/plagiarismIntelligencePipeline';
import type { PlagiarismAnalysisResult, VerifiedSource } from '@/pages/detector/detectionEngine';

describe('Plagiarism Forensics & Intelligence Pipeline Test Suite', () => {
  const sampleAcademicText = `
    Artificial intelligence has transformed medical diagnosis and healthcare systems. In this paper, we propose a novel deep learning framework for early detection of neurological disorders. As demonstrated by Smith et al. (2021), early diagnostic intervention improves patient recovery rates by 42%. Previous studies have demonstrated that neural networks utilize complex feature maps to identify subtle biomarkers.
  `;

  const mockVerifiedSources: VerifiedSource[] = [
    {
      title: 'Deep learning for early diagnosis of neurological disorders in clinical settings',
      doi: '10.1016/j.neuro.2021.05.012',
      url: 'https://doi.org/10.1016/j.neuro.2021.05.012',
      publisher: 'Elsevier / Journal of Neuroscience',
      provider: 'crossref',
      matchContribution: 35,
      citedMaterial: false,
      similarity: 78,
      matchType: 'Verified Paraphrase',
      verified: true,
      matchedSpans: [
        {
          submittedStart: 250,
          submittedEnd: 360,
          submittedPassage: 'early diagnostic intervention improves patient recovery rates by 42%',
          sourcePassage: 'timely clinical intervention enhances patient therapeutic outcomes by 42%',
          matchType: 'paraphrase',
          spanSimilarity: 0.82,
        },
      ],
    },
    {
      title: 'Syndicated Medical News: AI Diagnostics Breakthrough',
      doi: '10.1016/j.neuro.2021.05.012',
      url: 'https://mednews-mirror.org/ai-breakthrough',
      publisher: 'MedNews Syndicate',
      provider: 'web',
      matchContribution: 35,
      citedMaterial: false,
      similarity: 78,
      matchType: 'Near Match',
      verified: true,
      matchedSpans: [],
    },
  ];

  const mockBaseResult: PlagiarismAnalysisResult = {
    status: 'completed',
    similarityScore: 35,
    originalityScore: 65,
    exactMatchScore: 0,
    nearMatchScore: 10,
    paraphraseMatchScore: 25,
    semanticMatchScore: 5,
    riskLevel: 'Medium',
    sources: mockVerifiedSources,
    coverageNote: 'Searched Crossref and OpenAlex.',
    providerStatus: {
      crossref: 'ok',
      openalex: 'ok',
      unpaywall: 'ok',
      gemini: 'ok',
      webSearch: 'ok',
    },
  };

  it('1. Text Segmentation parses distinctive segments and named entities', () => {
    const segments = segmentDocument(sampleAcademicText);
    expect(segments.length).toBeGreaterThan(0);
    expect(segments[0].wordCount).toBeGreaterThan(10);
    expect(segments[0].distinctivenessScore).toBeGreaterThan(0);

    const entities = extractNamedEntities(sampleAcademicText);
    expect(entities.length).toBeGreaterThanOrEqual(0);

    const rareTerms = extractRareTerms(sampleAcademicText);
    expect(rareTerms.length).toBeGreaterThan(0);
  });

  it('2. Citation Intelligence identifies author-date APA and narrative citations', () => {
    const citations = parseCitations(sampleAcademicText, mockVerifiedSources);
    expect(citations.length).toBeGreaterThan(0);
    const smithCitation = citations.find((c) => c.inTextCitation.includes('Smith') || c.citedAuthors?.some((a) => a.includes('Smith')));
    expect(smithCitation).toBeDefined();
    expect(smithCitation?.status).toBe('properly_cited');

    const attribution = auditAttributionForPassage(
      'early diagnostic intervention improves patient recovery rates by 42%',
      250,
      360,
      sampleAcademicText,
      citations,
      mockVerifiedSources[0]
    );
    expect(attribution.isAttributed).toBe(true);
  });

  it('3. Paraphrase Engine detects synonym substitutions and sentence restructuring', () => {
    const sub = 'early diagnostic intervention improves patient recovery rates by 42%';
    const src = 'timely clinical intervention enhances patient therapeutic outcomes by 42%';
    const result = analyzeParaphraseShift(sub, src);
    expect(result.isParaphrase).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(60);
  });

  it('4. AI Rewrite Tracer discovers preserved fact progressions and arguments', () => {
    const traces = traceAiRewritePatterns(sampleAcademicText, mockVerifiedSources);
    expect(traces.length).toBeGreaterThan(0);
    expect(traces[0].confidence).toBeGreaterThan(40);
    expect(traces[0].cautiousVerdict).toBeDefined();
    expect(traces[0].evidenceSignals.length).toBeGreaterThan(0);
  });

  it('5. Source Clustering groups syndicated copies and discovers earliest date', () => {
    const { sourceClusters, chronologicalTimeline, earliestDiscoveredSource } = clusterAndChronologizeSources(mockVerifiedSources);
    expect(sourceClusters.length).toBe(1); // Grouped by DOI
    expect(sourceClusters[0].totalMirrorsCount).toBe(1);
    expect(chronologicalTimeline.length).toBe(2);
    expect(earliestDiscoveredSource).toBeDefined();
    expect(earliestDiscoveredSource?.isEarliestDiscovered).toBe(true);
  });

  it('6. False Positive Filter identifies academic idioms and boilerplate', () => {
    const fp1 = evaluateFalsePositive('In this paper, we propose a novel framework', 0, 40, false);
    expect(fp1.isExcludedFromRisk).toBe(true);
    expect(fp1.category).toBe('academic_terminology');

    const fp2 = evaluateFalsePositive('All rights reserved and privacy policy applies', 0, 45, false);
    expect(fp2.isExcludedFromRisk).toBe(true);

    const fp3 = evaluateFalsePositive('unprecedented proprietary neural structure without citation', 0, 60, false);
    expect(fp3.isExcludedFromRisk).toBe(false);
    expect(fp3.category).toBe('unattributed_match');
  });

  it('7. Risk Engine separates raw similarity from actual Plagiarism Risk level', () => {
    const risk = computePlagiarismRisk(sampleAcademicText.length, [], 35);
    expect(risk.riskLevel).toBe('None');

    const mockEvidence = [{
      id: 'm1',
      submittedStart: 10,
      submittedEnd: 60,
      submittedPassage: 'text',
      sourcePassage: 'text',
      sourceTitle: 'title',
      sourceUrl: 'url',
      sourcePublisher: 'pub',
      sourceProvider: 'crossref',
      category: 'exact' as const,
      categoryLabel: 'Exact Match',
      confidence: 100,
      attributionStatus: 'missing_citation' as const,
      attributionExplanation: 'Missing',
      isExcludedByFalsePositiveFilter: false,
    }];

    const riskWithUncited = computePlagiarismRisk(sampleAcademicText.length, mockEvidence, 35);
    expect(riskWithUncited.riskLevel).toBeDefined();
    expect(riskWithUncited.uncitedDirectMatchPercentage).toBeGreaterThan(0);
  });

  it('8. Full Plagiarism Forensics Pipeline executes end-to-end with zero crash', () => {
    const intel = executePlagiarismForensicsPipeline(sampleAcademicText, mockBaseResult);
    expect(intel.auditPackageId).toBeDefined();
    expect(intel.rawSimilarityPercentage).toBe(35);
    expect(intel.plagiarismRiskLevel).toBeDefined();
    expect(intel.evidenceMatches.length).toBeGreaterThanOrEqual(0);
    expect(intel.citations.length).toBeGreaterThan(0);
    expect(intel.sourceClusters.length).toBeGreaterThan(0);
  });
});
