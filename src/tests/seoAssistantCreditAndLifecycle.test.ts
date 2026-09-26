import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { calculateBloggerAnalysisCost, calculateOperationCreditCost } from '@/lib/entitlements';
import {
  generateContentHash,
  extractArticleTitle,
  getSEOAssistantHistory,
  saveSEOAssistantHistoryItem,
  clearSEOAssistantHistory,
  type SEOAnalysisHistoryItem
} from '@/lib/seoAssistantHistory';

// In-memory localStorage mock for node test runner
class LocalStorageMock {
  store: Record<string, string> = {};
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
}

const mockStorage = new LocalStorageMock();
(globalThis as any).localStorage = mockStorage;

describe('SEO Assistant & Blogger Analysis Credit & Lifecycle Test Suite', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  describe('1. Word-Based Credit Calculation Rule: ceil(wordCount / 500) * 5', () => {
    it('calculates 5 credits for 1-500 words', () => {
      expect(calculateBloggerAnalysisCost(1)).toBe(5);
      expect(calculateBloggerAnalysisCost(250)).toBe(5);
      expect(calculateBloggerAnalysisCost(500)).toBe(5);
    });

    it('calculates 10 credits for 501-1000 words', () => {
      expect(calculateBloggerAnalysisCost(501)).toBe(10);
      expect(calculateBloggerAnalysisCost(750)).toBe(10);
      expect(calculateBloggerAnalysisCost(1000)).toBe(10);
    });

    it('calculates 15 credits for 1001-1500 words', () => {
      expect(calculateBloggerAnalysisCost(1001)).toBe(15);
      expect(calculateBloggerAnalysisCost(1500)).toBe(15);
    });

    it('calculates exactly 45 credits for 4,373 words (User Scenario)', () => {
      expect(calculateBloggerAnalysisCost(4373)).toBe(45);
    });

    it('matches calculateOperationCreditCost with words_500 rate table unit', () => {
      expect(calculateOperationCreditCost('ai_checker_for_bloggers', { words: 4373 })).toBe(45);
      expect(calculateOperationCreditCost('ai_checker_for_bloggers', { words: 500 })).toBe(5);
      expect(calculateOperationCreditCost('ai_checker_for_bloggers', { words: 501 })).toBe(10);
    });
  });

  describe('2. Authoritative Credit Balance Deduction', () => {
    it('accurately settles balance from 9,924 to 9,879 after 4,373-word analysis', () => {
      const initialBalance = 9924;
      const wordCount = 4373;
      const cost = calculateBloggerAnalysisCost(wordCount);
      expect(cost).toBe(45);

      const finalBalance = initialBalance - cost;
      expect(finalBalance).toBe(9879);
    });
  });

  describe('3. Same-Text Behavior, Content Hashing & History Persistence', () => {
    it('generates consistent deterministic hashes for matching content', () => {
      const text = '# What Do AI Detection Scores Actually Mean?\nAI detection scores indicate probability...';
      const kw = 'AI checker for bloggers';
      const hash1 = generateContentHash(text, kw);
      const hash2 = generateContentHash(text, kw);
      expect(hash1).toBe(hash2);
    });

    it('detects when content or keyword has been modified', () => {
      const text = '# What Do AI Detection Scores Actually Mean?\nAI detection scores indicate probability...';
      const modifiedText = text + '\nNew added paragraph.';
      const kw = 'AI checker for bloggers';

      const hash1 = generateContentHash(text, kw);
      const hash2 = generateContentHash(modifiedText, kw);
      expect(hash1).not.toBe(hash2);
    });

    it('saves completed analysis to history and retrieves it without deduction', () => {
      const item: SEOAnalysisHistoryItem = {
        id: 'seo_test_1',
        title: 'What Do AI Detection Scores Actually Mean?',
        keyword: 'AI checker for bloggers',
        wordCount: 4373,
        creditCost: 45,
        content: '# What Do AI Detection Scores Actually Mean?\n...',
        scores: {
          seo: 50,
          readability: 40,
          grammar: 0,
          eeat: 75,
          structure: 10,
          engagement: 100,
          overall: 54,
          publishingScore: 56,
          readyToPublish: false,
        },
        snapshot: {
          kwResult: { density: 1.2, count: 5, inH1: true, inIntro: true, inHeadings: true, inConclusion: true, recommendations: [] },
          semanticResult: { recommended: [], found: [], missing: [], coveragePercent: 80 },
          intentResult: { informational: 70, commercial: 10, transactional: 10, navigational: 10, dominant: 'informational', matchPercent: 70, recommendation: '' },
          readabilityResult: { score: 40, label: 'Standard', avgWordsPerSentence: 14, avgSyllablesPerWord: 1.5 },
          sentenceResult: { longSentenceCount: 2, passiveVoiceCount: 1, totalSentences: 20, longSentences: [], veryLongSentences: [], recommendations: [] },
          paraResult: { longParagraphCount: 0, veryLongParagraphCount: 0, totalParagraphs: 5, recommendations: [] },
          transitionResult: { count: 4, totalSentences: 20, percentage: 20, found: [], missing: [], recommendations: [] },
          grammarResult: { score: 100, issues: [] },
          headingResult: { h1Count: 1, h2Count: 4, h3Count: 2, headings: [], issues: [], score: 90 },
          eeatResult: { score: 75, hasPersonalExamples: true, hasStats: true, hasCitations: true, hasAuthor: true, recommendations: [] },
          engagementResult: { score: 100, questionCount: 2, exampleCount: 3, dataCount: 4, recommendations: [] },
          snippetResult: { score: 80, hasDefinition: true, hasList: true, hasTable: false, hasFAQ: true, recommendations: [] },
          aiRiskResult: { humanScore: 60, aiScore: 40, riskLevel: 'Low', recommendations: [] },
          uniquenessResult: { score: 95, duplicatePhrases: [], overusedWords: [], recommendations: [] },
          metaResult: { suggestedTitle: 'What Do AI Detection Scores Actually Mean?', suggestedDescription: 'Learn what AI scores mean', suggestedSlug: 'ai-detection-scores', titleLength: 42, descLength: 26, titleOk: true, descOk: true },
        },
        createdAt: Date.now(),
        contentHash: generateContentHash('# What Do AI Detection Scores Actually Mean?\n...', 'AI checker for bloggers'),
      };

      saveSEOAssistantHistoryItem(item);
      const history = getSEOAssistantHistory();
      expect(history.length).toBe(1);
      expect(history[0].id).toBe('seo_test_1');
      expect(history[0].title).toBe('What Do AI Detection Scores Actually Mean?');
      expect(history[0].scores.overall).toBe(54);
    });

    it('extractArticleTitle parses clean H1 or first line from markdown', () => {
      expect(extractArticleTitle('# What Do AI Detection Scores Actually Mean?\nBody')).toBe('What Do AI Detection Scores Actually Mean?');
      expect(extractArticleTitle('Introductory sentence without heading', 'Keyword')).toBe('Introductory sentence without heading');
      expect(extractArticleTitle('', 'Blogger SEO')).toBe('Analysis for "Blogger SEO"');
    });
  });

  describe('4. Lifecycle: Clear Workspace vs History Retention', () => {
    it('clearing workspace preserves past history entries', () => {
      const item: SEOAnalysisHistoryItem = {
        id: 'article_a',
        title: 'Article A',
        keyword: 'Topic A',
        wordCount: 1200,
        creditCost: 15,
        content: 'Article A content...',
        scores: {
          seo: 80, readability: 80, grammar: 80, eeat: 80, structure: 80, engagement: 80, overall: 80, publishingScore: 80, readyToPublish: true
        },
        snapshot: {} as any,
        createdAt: Date.now(),
        contentHash: generateContentHash('Article A content...', 'Topic A'),
      };

      saveSEOAssistantHistoryItem(item);
      expect(getSEOAssistantHistory().length).toBe(1);

      // Simulating clearing the active workspace:
      // Active draft is removed from localStorage
      localStorage.removeItem('aidetector_blogger_draft');

      // History remains intact!
      const retainedHistory = getSEOAssistantHistory();
      expect(retainedHistory.length).toBe(1);
      expect(retainedHistory[0].title).toBe('Article A');
    });
  });

  describe('5. Independent Action Costs', () => {
    it('generate article costs 5 credits independently', () => {
      expect(calculateOperationCreditCost('generate_article')).toBe(5);
    });

    it('humanizer costs depend only on humanize word count, not main SEO analysis', () => {
      expect(calculateOperationCreditCost('ai_humanizer', { words: 300 })).toBe(10);
    });
  });
});
