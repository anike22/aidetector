import { describe, it, expect } from 'vitest';
import {
  createCorpusDocument,
  analyzePrivateCorpusSimilarity,
  getStoredPrivateCorpus,
  DEFAULT_PRESET_CORPUS,
  type PrivateCorpusDocument,
} from '@/lib/plagiarism/privateCorpusEngine';
import {
  generateForensicAuditPackageText,
  downloadForensicAuditPackage,
} from '@/lib/plagiarism/forensicReportGenerator';
import { executePlagiarismForensicsPipeline } from '@/lib/plagiarism/plagiarismIntelligencePipeline';
import type { PlagiarismAnalysisResult } from '@/pages/detector/detectionEngine';

describe('Private Student Corpus & 8-Section Forensic Audit Package', () => {
  const mockBaseResult: PlagiarismAnalysisResult = {
    similarityScore: 42,
    riskLevel: 'Medium',
    originalityScore: 58,
    exactMatchScore: 25,
    semanticMatchScore: 17,
    paraphraseScore: 10,
    characterCount: 650,
    wordCount: 110,
    sources: [
      {
        url: 'https://arxiv.org/abs/1706.03762',
        title: 'Attention Is All You Need',
        publisher: 'NeurIPS / arXiv',
        matchType: 'Academic Repository',
        matchContribution: 25,
        doi: '10.48550/arXiv.1706.03762',
        provider: 'crossref',
      },
    ],
    matchedSentences: [
      {
        text: 'Transformer architectures compute contextual representations across sequence dimensions.',
        startIndex: 0,
        endIndex: 88,
        matchType: 'exact',
        sourceTitle: 'Attention Is All You Need',
        sourceUrl: 'https://arxiv.org/abs/1706.03762',
        similarity: 95,
      },
    ],
    coverageNote: 'Searched Crossref, OpenAlex, Unpaywall, and live web indices.',
    searchTimestamp: new Date().toISOString(),
    providerStatus: { crossref: 'ok', openalex: 'ok', unpaywall: 'ok', webSearch: 'ok' },
  };

  const sampleSubmission = `According to recent empirical investigations in artificial intelligence, transformer architectures compute contextual representations across sequence dimensions. As demonstrated by Alex Morgan in previous coursework drafts, attention mechanisms have transformed computational linguistics.`;

  it('correctly creates and indexes student essay into private corpus', () => {
    const studentEssay = createCorpusDocument(
      'Alex Morgan - CS-402 Term Paper v1',
      'Artificial intelligence and attention mechanisms have transformed computational linguistics across academic institutions.',
      'Alex Morgan',
      true,
      'CS Department'
    );

    expect(studentEssay.id).toMatch(/^doc_/);
    expect(studentEssay.documentHash).toMatch(/^sha256_/);
    expect(studentEssay.authorName).toBe('Alex Morgan');
    expect(studentEssay.isOwnPriorWork).toBe(true);
    expect(studentEssay.wordCount).toBeGreaterThan(5);
  });

  it('detects and isolates self-similarity against student essays in private corpus', () => {
    const customEssay = createCorpusDocument(
      'Alex Morgan - Prior Essay Draft',
      sampleSubmission,
      'Alex Morgan',
      true,
      'Student Submissions'
    );

    const matches = analyzePrivateCorpusSimilarity(sampleSubmission, [customEssay]);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].documentTitle).toBe('Alex Morgan - Prior Essay Draft');
    expect(matches[0].isPermittedSelfReuse).toBe(true);
    expect(matches[0].matchType).toBe('draft_version');
    expect(matches[0].similarityScore).toBeGreaterThanOrEqual(20);
  });

  it('executes full plagiarism forensic intelligence pipeline with custom private corpus', () => {
    const customEssay = createCorpusDocument(
      'Prior Student Term Paper',
      sampleSubmission,
      'Jane Doe',
      false,
      'Institutional Repository'
    );

    const intel = executePlagiarismForensicsPipeline(sampleSubmission, mockBaseResult, [customEssay]);
    expect(intel).toBeDefined();
    expect(intel.selfSimilarityMatches.length).toBeGreaterThan(0);
    expect(intel.selfSimilarityMatches[0].isPermittedSelfReuse).toBe(false);
    expect(intel.selfSimilarityMatches[0].matchType).toBe('internal_institutional');
  });

  it('generates a full 8-section forensic audit text package with all required headers', () => {
    const intel = executePlagiarismForensicsPipeline(sampleSubmission, mockBaseResult, DEFAULT_PRESET_CORPUS);
    const textReport = generateForensicAuditPackageText(intel);

    expect(textReport).toContain('AIDETECTOR.CX ADVANCED PLAGIARISM FORENSIC AUDIT REPORT');
    expect(textReport).toContain('1. FORENSIC RISK & SIMILARITY ASSESSMENT');
    expect(textReport).toContain('2. SEARCH COVERAGE TRANSPARENCY');
    expect(textReport).toContain('3. INDIVIDUAL SOURCE BREAKDOWN (NON-OVERLAPPING DEDUPLICATED)');
    expect(textReport).toContain('4. DETAILED EVIDENCE MATCHES');
    expect(textReport).toContain('5. AI REWRITE SOURCE TRACING');
    expect(textReport).toContain('6. CITATION & ATTRIBUTION AUDIT');
    expect(textReport).toContain('7. CHRONOLOGICAL DISCOVERY & SYNDICATED SOURCE CLUSTERS');
    expect(textReport).toContain('8. METHODOLOGY & FORENSIC INTEGRITY STATEMENT');
  });

  it('serializes forensic audit package to valid JSON structure', () => {
    const intel = executePlagiarismForensicsPipeline(sampleSubmission, mockBaseResult, DEFAULT_PRESET_CORPUS);
    const jsonStr = JSON.stringify(intel);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.auditPackageId).toBe(intel.auditPackageId);
    expect(parsed.documentHash).toBe(intel.documentHash);
    expect(parsed.searchCoverageReport).toBeDefined();
    expect(parsed.individualSourceContributions).toBeInstanceOf(Array);
    expect(parsed.evidenceMatches).toBeInstanceOf(Array);
  });
});
