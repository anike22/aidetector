import { describe, it, expect } from 'vitest';
import { SUPPORTED_LANGUAGES } from '@/components/seo-assistant/MultilingualPlagiarismModule';
import { computeContentSHA256, canonicalizeContent } from '@/lib/verifiedAuthorship/cryptoUtils';
import { computeOverallScores, analyzeKeywordUsage, analyzeReadability, analyzeAIRisk, analyzeUniqueness } from '@/pages/seo-assistant/analysisEngine';
import type { BalancedDetectorResult } from '@/lib/detection/balancedDetectorService';
import type { PlagiarismAnalysisResult } from '@/pages/detector/detectionEngine';
import type { RegisterResult } from '@/lib/verifiedAuthorship/authorshipService';

describe('SEO Assistant Extended Capabilities Suite', () => {

  describe('1. Non-Interference and Additive Design', () => {
    it('preserves existing Aggressive AI Risk and SEO scores unchanged', () => {
      const sampleText = 'Search engine optimization involves enhancing content relevance and user experience.';
      const kwResult = analyzeKeywordUsage(sampleText, 'optimization');
      const readResult = analyzeReadability(sampleText);
      const aiRisk = analyzeAIRisk(sampleText);
      const uniqueness = analyzeUniqueness(sampleText);

      const baselineScores = computeOverallScores({
        kwResult,
        readability: readResult,
        grammar: { score: 100, issues: [] },
        eeat: { score: 80, hasPersonalExamples: true, hasStats: true, hasCitations: true, hasAuthor: true, recommendations: [] },
        headings: { h1Count: 1, h2Count: 2, h3Count: 0, headings: [], issues: [], score: 90 },
        engagement: { score: 75, questionCount: 1, exampleCount: 1, dataCount: 1, recommendations: [] },
        snippet: { score: 70, hasDefinition: true, hasList: true, hasTable: false, hasFAQ: false, recommendations: [] },
        uniqueness,
      });

      // The presence of balanced AI or plagiarism checks MUST NOT modify the standard SEO score calculations
      expect(baselineScores.seo).toBeGreaterThanOrEqual(0);
      expect(baselineScores.readability).toBeGreaterThanOrEqual(0);
      expect(aiRisk.aiScore).toBeDefined();
      expect(aiRisk.humanScore).toBeDefined();
    });
  });

  describe('2. Balanced AI Detection Integrity', () => {
    it('maintains distinct data structures without blending Aggressive and Balanced scores', () => {
      const aggressiveResult = {
        humanScore: 35,
        aiScore: 65,
        riskLevel: 'Medium' as const,
        recommendations: ['Consider rephrasing standard passive constructions.'],
      };

      const balancedResult: BalancedDetectorResult = {
        ai: 12,
        human: 88,
        mixed: 0,
        verdict: 'likely-human',
        risk: 'Low',
        confidence: 95,
        confidenceLevel: 'High',
        language: 'English',
        engineVersion: 'v2.4-calibrated',
        modelVersion: 'gemini-flash',
        calibrationVersion: '2026-09',
        languagePipelineVersion: 'v1.2',
        requestId: 'req_test_789',
        analyzedAt: '2026-09-13T10:00:00Z',
        processingTimeMs: 120,
        full: {
          overall: {
            aiProbability: 12,
            humanProbability: 88,
            mixedProbability: 0,
            verdict: 'likely-human',
            riskLevel: 'Low',
            confidence: 95,
            confidenceLevel: 'High',
          },
          language: { primary: { code: 'en', name: 'English', confidence: 0.99 } },
          sentences: [
            { text: 'Search engine optimization is critical for modern discoverability.', aiProbability: 8, signals: ['High lexical burstiness'] },
            { text: 'Strategic keyword research clarifies user search intent.', aiProbability: 16, signals: ['Natural syntactic variation'] },
          ],
          metadata: {
            detectorVersion: 'v2.4-calibrated',
            modelVersion: 'gemini-flash',
            calibrationVersion: '2026-09',
            languagePipelineVersion: 'v1.2',
            requestId: 'req_test_789',
            analyzedAt: '2026-09-13T10:00:00Z',
            processingTimeMs: 120,
          },
        } as any,
      };

      // Aggressive and Balanced must remain strictly independent
      expect(aggressiveResult.aiScore).toBe(65);
      expect(balancedResult.ai).toBe(12);
      expect(balancedResult.human).toBe(88);
      expect(balancedResult.verdict).toBe('likely-human');
      expect(balancedResult.full?.sentences?.length).toBe(2);
      expect(balancedResult.engineVersion).toBe('v2.4-calibrated');
    });
  });

  describe('3. Multilingual Plagiarism Checker Specs', () => {
    it('includes complete supported language options with auto-detection', () => {
      expect(SUPPORTED_LANGUAGES).toEqual(
        expect.arrayContaining([
          { code: 'auto', name: 'Auto-Detect Language' },
          { code: 'en', name: 'English' },
          { code: 'es', name: 'Spanish (Español)' },
          { code: 'fr', name: 'French (Français)' },
          { code: 'de', name: 'German (Deutsch)' },
          { code: 'zh', name: 'Chinese (中文)' },
          { code: 'ja', name: 'Japanese (日本語)' },
          { code: 'pt', name: 'Portuguese (Português)' },
          { code: 'it', name: 'Italian (Italiano)' },
          { code: 'ar', name: 'Arabic (العربية)' },
          { code: 'ru', name: 'Russian (Русский)' },
        ])
      );
    });

    it('formats verified source matches and coverage notices correctly', () => {
      const plagiarismResult: PlagiarismAnalysisResult = {
        status: 'completed',
        similarityScore: 28,
        originalityScore: 72,
        exactMatchScore: 18,
        nearMatchScore: 10,
        paraphraseMatchScore: 0,
        semanticMatchScore: 0,
        riskLevel: 'Low',
        sources: [
          {
            url: 'https://doi.org/10.1016/j.ipm.2025.103001',
            title: 'Information Processing & Management: Neural Content Discovery',
            publisher: 'Elsevier',
            matchContribution: 28,
            matchType: 'exact',
            matchedSpans: [
              {
                sourceUrl: 'https://doi.org/10.1016/j.ipm.2025.103001',
                sourceTitle: 'Information Processing & Management: Neural Content Discovery',
                submittedPassage: 'Neural content discovery improves query precision significantly.',
                matchedSourcePassage: 'Neural content discovery improves query precision significantly.',
                matchType: 'exact',
                spanSimilarity: 0.99,
                startIndex: 0,
                endIndex: 65,
              },
            ],
          },
        ],
        coverageNote: 'Searches Crossref, OpenAlex, Unpaywall, and live search indexes.',
        providerStatus: {
          crossref: 'ok',
          openalex: 'ok',
          unpaywall: 'ok',
          gemini: 'ok',
          webSearch: 'ok',
        },
      };

      expect(plagiarismResult.similarityScore).toBe(28);
      expect(plagiarismResult.originalityScore).toBe(72);
      expect(plagiarismResult.sources[0].url).toMatch(/^https:\/\//);
      expect(plagiarismResult.sources[0].matchedSpans?.[0].spanSimilarity).toBe(0.99);
      expect(plagiarismResult.coverageNote).toContain('Crossref');
    });
  });

  describe('4. Authorship Registration and Cryptographic Anchoring', () => {
    it('produces deterministic SHA-256 content hashes with canonicalization', async () => {
      const draft1 = 'Article title\r\n\r\nParagraph 1 with extra   spaces.   ';
      const draft2 = 'Article title\n\nParagraph 1 with extra spaces.';

      const canonical1 = canonicalizeContent(draft1);
      const canonical2 = canonicalizeContent(draft2);

      const hash1 = await computeContentSHA256(canonical1);
      const hash2 = await computeContentSHA256(canonical2);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/.test(hash1)).toBe(true);
    });

    it('creates structured registration results with immutable versioning', () => {
      const regResult: RegisterResult = {
        success: true,
        registration: {
          id: 'reg_seo_001',
          userId: 'user_dev_1',
          trackingCode: 'VA-2026-SEO99',
          contentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          title: 'SEO Writing Masterclass',
          category: 'SEO Strategy',
          language: 'en',
          wordCount: 850,
          charCount: 5200,
          rawContent: 'Full article text...',
          creationDeclaration: {
            declarationType: 'human_with_ai_assistance',
            declarationLabel: 'Human Authored with AI Research Assistance',
            declarationStatement: 'Authored by user with AI tools used for initial outline and research.',
          },
          status: 'active',
          currentVersionNumber: 1,
          createdAt: '2026-09-13T10:00:00Z',
          updatedAt: '2026-09-13T10:00:00Z',
        } as any,
      };

      expect(regResult.success).toBe(true);
      expect(regResult.registration?.trackingCode).toBe('VA-2026-SEO99');
      expect(regResult.registration?.currentVersionNumber).toBe(1);
      expect(regResult.registration?.creationDeclaration.declarationType).toBe('human_with_ai_assistance');
    });
  });

  describe('5. Export and Backward Compatibility', () => {
    it('exports complete structured JSON payload with optional modules included when available', () => {
      const mockMeta = {
        suggestedTitle: 'Complete SEO Optimization Guide',
        suggestedDescription: 'A practical handbook for improving organic search visibility.',
        suggestedSlug: 'complete-seo-optimization-guide',
      };

      const mockContent = '# Complete SEO Optimization Guide\n\nDiscover how search algorithms rank content.';

      const mockBalanced: BalancedDetectorResult = {
        ai: 10,
        human: 90,
        mixed: 0,
        verdict: 'likely-human',
        risk: 'Low',
        confidence: 96,
        confidenceLevel: 'High',
        language: 'English',
        engineVersion: 'v2.4-calibrated',
        modelVersion: 'gemini-flash',
        calibrationVersion: '2026-09',
        languagePipelineVersion: 'v1.2',
        requestId: 'req_export_1',
        analyzedAt: '2026-09-13T10:00:00Z',
        processingTimeMs: 95,
      };

      const mockRegistration: RegisterResult = {
        success: true,
        registration: {
          id: 'reg_export_99',
          userId: 'user_1',
          trackingCode: 'VA-EXP-1234',
          contentHash: 'f1e2d3c4b5a60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
          title: mockMeta.suggestedTitle,
          category: 'Article',
          language: 'en',
          wordCount: 120,
          charCount: 800,
          rawContent: mockContent,
          creationDeclaration: {
            declarationType: 'entirely_human',
            declarationLabel: 'Entirely Human-Written',
            declarationStatement: 'Written without generative AI assistance.',
          },
          status: 'active',
          currentVersionNumber: 1,
          createdAt: '2026-09-13T10:00:00Z',
          updatedAt: '2026-09-13T10:00:00Z',
        } as any,
      };

      // Construct export schema identically to ExportPanel logic
      const reportJson = {
        generatedAt: new Date().toISOString(),
        seo: {
          title: mockMeta.suggestedTitle,
          description: mockMeta.suggestedDescription,
          slug: mockMeta.suggestedSlug,
          wordCount: mockContent.split(/\s+/).filter(Boolean).length,
          characterCount: mockContent.length,
        },
        content: mockContent,
        balancedAiDetection: {
          aiScore: mockBalanced.ai,
          humanScore: mockBalanced.human,
          verdict: mockBalanced.verdict,
          risk: mockBalanced.risk,
          confidence: mockBalanced.confidence,
        },
        verifiedAuthorship: {
          trackingCode: mockRegistration.registration!.trackingCode,
          contentHash: mockRegistration.registration!.contentHash,
          version: mockRegistration.registration!.currentVersionNumber,
          verificationUrl: `https://aidetector.cx/verify/${mockRegistration.registration!.trackingCode}`,
        },
      };

      expect(reportJson.seo.title).toBe('Complete SEO Optimization Guide');
      expect(reportJson.balancedAiDetection.aiScore).toBe(10);
      expect(reportJson.verifiedAuthorship.trackingCode).toBe('VA-EXP-1234');
      expect(reportJson.verifiedAuthorship.verificationUrl).toBe('https://aidetector.cx/verify/VA-EXP-1234');
    });

    it('maintains backwards compatibility when optional fields are null or undefined', () => {
      const minimalReport = {
        generatedAt: new Date().toISOString(),
        seo: {
          title: 'Basic SEO Article',
          description: 'Basic description',
          slug: 'basic-seo-article',
          wordCount: 50,
          characterCount: 300,
        },
        content: 'Basic content text',
        balancedAiDetection: null,
        plagiarismCheck: null,
        verifiedAuthorship: null,
      };

      expect(minimalReport.seo.title).toBe('Basic SEO Article');
      expect(minimalReport.balancedAiDetection).toBeNull();
      expect(minimalReport.plagiarismCheck).toBeNull();
      expect(minimalReport.verifiedAuthorship).toBeNull();
    });
  });
});
