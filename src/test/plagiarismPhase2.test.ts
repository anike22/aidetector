import { describe, it, expect } from 'vitest';
import { extractTablesFromText, analyzeTableSimilarity, normalizeCellValue } from '@/lib/plagiarism/tableDatasetEngine';
import { computeHammingDistance, evaluateVisualPlagiarism, type ExtractedVisualArtifact } from '@/lib/plagiarism/visualPlagiarismEngine';
import { tokenizeAndNormalizeCode, extractCodeBlocks, analyzeCodePlagiarism } from '@/lib/plagiarism/codePlagiarismEngine';
import { analyzePrivateCorpusSimilarity, type PrivateCorpusDocument } from '@/lib/plagiarism/privateCorpusEngine';
import { buildSearchCoverageReport } from '@/lib/plagiarism/coverageMatrix';
import { executePlagiarismForensicsPipeline } from '@/lib/plagiarism/plagiarismIntelligencePipeline';
import { generateForensicAuditPackageText, computeDocumentSha256 } from '@/lib/plagiarism/forensicReportGenerator';
import type { PlagiarismAnalysisResult } from '@/pages/detector/detectionEngine';

describe('Phase 2 Advanced Plagiarism Intelligence Suite', () => {
  describe('1. Table & Dataset Similarity Engine', () => {
    it('extracts structured tables from markdown and normalizes numerical values', () => {
      const text = `
Here is our experimental results:
| Metric | Baseline | Model A | Gain |
| --- | --- | --- | --- |
| Accuracy | 85.0% | 92.5% | +7.5% |
| Latency | 120ms | 95ms | -25ms |
`;
      const tables = extractTablesFromText(text);
      expect(tables.length).toBe(1);
      expect(tables[0].headers).toEqual(['Metric', 'Baseline', 'Model A', 'Gain']);
      expect(tables[0].rowCount).toBe(2);

      expect(normalizeCellValue('$1,000.00')).toBe('1000');
      expect(normalizeCellValue('50%')).toBe('0.5');
    });

    it('detects tabular similarity despite column renaming and reordering', () => {
      const table = {
        id: 'tbl_1',
        headers: ['Group', 'Score', 'Rate'],
        rows: [['A', '100', '0.12'], ['B', '200', '0.24']],
        rawMarkdown: '',
        startIndex: 0,
        endIndex: 100,
        rowCount: 2,
        colCount: 3,
      };

      const candidateSources = [
        {
          title: 'Benchmark Results Journal',
          url: 'https://example.org/study',
          tableData: {
            headers: ['Category', 'Value', 'Percentage'],
            rows: [['A', '100', '0.12'], ['B', '200', '0.24']],
          },
        },
      ];

      const matches = analyzeTableSimilarity(table, candidateSources);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].dataValueOverlapScore).toBeGreaterThan(60);
    });
  });

  describe('2. Visual Plagiarism & Figure Analysis Engine', () => {
    it('computes exact and near Hamming distances correctly', () => {
      const hash1 = 'ffff0000ffff0000';
      const hash2 = 'ffff0000ffff0000';
      const hash3 = 'ffff0000ffff0001';

      expect(computeHammingDistance(hash1, hash2)).toBe(0);
      expect(computeHammingDistance(hash1, hash3)).toBe(1);
    });

    it('evaluates figure similarity with invariant perceptual mapping', () => {
      const artifacts: ExtractedVisualArtifact[] = [
        {
          id: 'art_1',
          type: 'chart',
          aspectRatio: 1.5,
          perceptualHash: '12345678abcdef00',
          colorDistribution: { r: 100, g: 150, b: 200 },
          detectedTextInImage: ['Accuracy', 'Epoch'],
        },
      ];

      const catalog = [
        {
          title: 'Published Neural Network Architecture',
          url: 'https://arxiv.org/abs/1234.5678',
          perceptualHash: '12345678abcdef02',
          extractedLabels: ['Accuracy', 'Loss'],
        },
      ];

      const matches = evaluateVisualPlagiarism(artifacts, catalog);
      expect(matches.length).toBe(1);
      expect(matches[0].structuralSimilarityScore).toBeGreaterThan(80);
      expect(matches[0].detectedTransformations).toContain('Resizing or subtle compression');
    });
  });

  describe('3. Code Plagiarism & AST Structure Analysis Engine', () => {
    it('normalizes variable names and strips comments for invariant comparison', () => {
      const code = `
        // Compute fibonacci
        function calculateSequence(totalCount) {
          let previousValue = 0;
          let nextValue = 1;
          for (let index = 0; index < totalCount; index++) {
            let temp = previousValue + nextValue;
            previousValue = nextValue;
            nextValue = temp;
          }
          return previousValue;
        }
      `;
      const normalized = tokenizeAndNormalizeCode(code);
      expect(normalized.tokens.length).toBeGreaterThan(10);
      expect(normalized.complexity).toBeGreaterThan(1);
    });

    it('detects algorithmic plagiarism despite identifier renaming', () => {
      const blocks = [
        {
          id: 'code_1',
          language: 'javascript',
          rawCode: 'function sort(arr) { for(let i=0; i<arr.length; i++) { if(arr[i] > 0) return true; } }',
          normalizedTokens: tokenizeAndNormalizeCode('function sort(arr) { for(let i=0; i<arr.length; i++) { if(arr[i] > 0) return true; } }').tokens,
          cyclomaticComplexity: 3,
          distinctiveTokenCount: 5,
          startIndex: 0,
          endIndex: 80,
        },
      ];

      const refCatalog = [
        {
          title: 'GitHub Algorithm Solution',
          url: 'https://github.com/example/repo',
          language: 'javascript',
          code: 'function checkPositive(elements) { for(let idx=0; idx<elements.length; idx++) { if(elements[idx] > 0) return true; } }',
        },
      ];

      const matches = analyzeCodePlagiarism(blocks, refCatalog);
      expect(matches.length).toBe(1);
      expect(matches[0].detectedObfuscations).toContain('Variable & function renaming');
    });
  });

  describe('4. Private Corpus & Self-Plagiarism Engine', () => {
    it('isolates user prior work and drafts from external plagiarism penalties', () => {
      const submittedText = 'Artificial intelligence models requires extensive validation across real-world operational distributions to ensure safety and alignment.';
      const corpus: PrivateCorpusDocument[] = [
        {
          id: 'doc_1',
          title: 'Previous Assignment Draft v1',
          documentHash: 'sha256_mock',
          createdAt: '2026-01-15T00:00:00Z',
          authorId: 'user_123',
          isOwnPriorWork: true,
          content: 'Artificial intelligence models requires extensive validation across real-world distributions.',
        },
      ];

      const matches = analyzePrivateCorpusSimilarity(submittedText, corpus);
      expect(matches.length).toBe(1);
      expect(matches[0].matchType).toBe('draft_version');
      expect(matches[0].isPermittedSelfReuse).toBe(true);
    });
  });

  describe('5. Search Coverage Transparency Matrix', () => {
    it('reports unavailable status rather than false zero plagiarism when provider fails', () => {
      const report = buildSearchCoverageReport(
        { crossref: 'ok', openalex: 'failed', unpaywall: 'ok', webSearch: 'ok' },
        true,
        false,
        false
      );

      expect(report.allPrimaryRegistriesOperational).toBe(false);
      expect(report.unavailableCount).toBe(1);
      const openAlexSys = report.systems.find((s) => s.id === 'openalex');
      expect(openAlexSys?.status).toBe('unavailable');
      expect(openAlexSys?.statusLabel).toBe('Temporarily unavailable');
    });
  });

  describe('6. Non-Overlapping Source Accounting & Forensic Pipeline', () => {
    it('executes full 17-stage forensic pipeline without double-counting overlapping sources', () => {
      const baseResult: PlagiarismAnalysisResult = {
        similarityScore: 25,
        originalityScore: 75,
        status: 'completed',
        coverageNote: 'Searched Crossref and OpenAlex',
        sources: [
          {
            title: 'Primary Source Paper',
            url: 'https://example.org/primary',
            publisher: 'Academic Press',
            provider: 'crossref',
            matchType: 'exact',
            matchContribution: 20,
            matchedSpans: [
              {
                submittedStart: 0,
                submittedEnd: 50,
                submittedPassage: 'Artificial intelligence transforms organizational operational efficiency',
                sourcePassage: 'Artificial intelligence transforms organizational operational efficiency',
                spanSimilarity: 0.98,
                matchType: 'exact',
              },
            ],
          },
          {
            title: 'Mirror Syndication Site',
            url: 'https://example.com/mirror',
            publisher: 'Syndicated News',
            provider: 'web',
            matchType: 'near',
            matchContribution: 15,
            matchedSpans: [
              {
                submittedStart: 25,
                submittedEnd: 50,
                submittedPassage: 'organizational operational efficiency',
                sourcePassage: 'organizational operational efficiency',
                spanSimilarity: 0.95,
                matchType: 'near',
              },
            ],
          },
        ],
        exactMatchScore: 20,
        nearMatchScore: 5,
        paraphraseMatchScore: 0,
        semanticMatchScore: 0,
        riskLevel: 'Low',
        confidenceScore: 92,
        providerStatus: { crossref: 'ok', openalex: 'ok', unpaywall: 'ok', webSearch: 'ok' },
      };

      const text = 'Artificial intelligence transforms organizational operational efficiency across modern enterprise sectors.';
      const intel = executePlagiarismForensicsPipeline(text, baseResult);

      expect(intel.documentHash).toBeDefined();
      expect(intel.documentHash).toContain('sha256_');
      expect(intel.individualSourceContributions.length).toBe(2);
      expect(intel.searchCoverageReport.overallCoveragePercentage).toBeGreaterThan(0);

      const auditText = generateForensicAuditPackageText(intel);
      expect(auditText).toContain('AIDETECTOR.CX ADVANCED PLAGIARISM FORENSIC AUDIT REPORT');
      expect(auditText).toContain('NON-OVERLAPPING DEDUPLICATED');
      expect(auditText).toContain('METHODOLOGY & FORENSIC INTEGRITY STATEMENT');
    });
  });
});
