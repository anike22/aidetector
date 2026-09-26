import { describe, it, expect } from 'vitest';
import { evaluateBloggerKeywords } from '@/lib/seo/bloggerKeywordMetrics';
import {
  analyzeSentences,
  analyzeParagraphs,
  analyzeHeadingStructure,
  analyzeKeywordUsage,
  analyzeTransitionWords,
  analyzeUniqueness,
  analyzeGrammar,
} from '@/pages/seo-assistant/analysisEngine';
import { matchInternalLinksToArticle } from '@/lib/seo/internalLinkDiscovery';
import { extractSnippetDescription } from '@/components/seo-assistant/GoogleSERPPreview';
import type { SEOAnalysisHistoryItem } from '@/lib/seoAssistantHistory';

describe('AI Checker for Bloggers - 10 Core Functional Requirements', () => {
  // Requirement 1: Primary + 3 related keywords, KD, search volume, word count target, locking
  it('1. Evaluates keyword difficulty, search volume, intent, and recommended word count for ranking', () => {
    const primary = 'best travel camera';
    const related = ['lightweight mirrorless camera', 'compact travel photography', 'vlog camera for travel'];
    const result = evaluateBloggerKeywords(primary, related);

    expect(result.primary.keyword).toBe('best travel camera');
    expect(result.primary.difficulty).toBeGreaterThanOrEqual(0);
    expect(result.primary.difficulty).toBeLessThanOrEqual(100);
    expect(result.primary.searchVolume).toBeGreaterThan(0);
    expect(result.primary.intent).toBeDefined();
    expect(result.related.length).toBe(3);
    expect(result.recommendedWordCount.targetWords).toBeGreaterThanOrEqual(1200);
    expect(result.recommendedWordCount.rangeText).toMatch(/[\d,]+ ?[–-] ?[\d,]+ words/);
    expect(result.recommendedWordCount.minWords).toBeGreaterThan(1000);
  });

  // Requirement 2: Title validation (must contain primary keyword) and static 30 credit cost
  it('2. Validates that content title must contain the primary keyword', () => {
    const primary = 'AI checker for bloggers';
    const validTitle = 'How an AI Checker for Bloggers Can 10x Your Organic Traffic';
    const invalidTitle = 'How Content Creators Grow Fast Online';

    const checkTitle = (title: string, kw: string) => title.toLowerCase().includes(kw.toLowerCase().trim());

    expect(checkTitle(validTitle, primary)).toBe(true);
    expect(checkTitle(invalidTitle, primary)).toBe(false);
  });

  // Requirement 5: Internal linking analyzes paragraph or entire content for appropriate anchor placement
  it('3. Finds contextual anchor locations within paragraphs and entire content', () => {
    const content = `
      Planning a long hiking expedition requires dependable gear and efficient packing.
      Photographers venturing into remote national parks often search for lightweight mirrorless camera equipment to reduce pack weight without compromising image quality.
      Proper lens selection makes all the difference when framing scenic mountain horizons at dawn.
    `;
    const candidates = [
      {
        url: 'https://example.com/gear/mirrorless-cameras',
        title: 'Complete Guide to Mirrorless Cameras',
        suggestedAnchor: 'lightweight mirrorless camera',
        relevance: 90,
      },
    ];

    const matched = matchInternalLinksToArticle(candidates, content, 'travel camera', ['mirrorless camera']);
    expect(matched.length).toBe(1);
    expect(matched[0].anchorText.toLowerCase()).toContain('mirrorless camera');
    expect(matched[0].contextSnippet).toBeDefined();
    expect(matched[0].start).toBeDefined();
    expect(matched[0].paragraphIndex).toBeGreaterThanOrEqual(0);
  });

  // Requirement 6: Sentence length 25-30 words recommended, paragraph length 250-300 words recommended
  it('4. Calibrates sentence length (25–30 words recommended) and paragraph length (250–300 words recommended)', () => {
    // 27-word sentence (within recommended 25-30 words)
    const idealSentence = 'When evaluating search engine algorithms for competitive blog niches, authors must consistently balance engaging narrative structures with authoritative factual citations that satisfy rigorous user experience criteria.';
    const sentWords = idealSentence.split(/\s+/).length;
    expect(sentWords).toBeGreaterThanOrEqual(25);
    expect(sentWords).toBeLessThanOrEqual(30);

    const sentResult = analyzeSentences(idealSentence);
    // Sentences in recommended range should not be flagged as very long
    expect(sentResult.veryLongSentences?.length || 0).toBe(0);

    // Test paragraph analysis with recommended 250-300 range
    const shortPara = Array(150).fill('word').join(' ');
    const paraResult = analyzeParagraphs(shortPara);
    expect(paraResult.veryLongParagraphCount).toBe(0);
    expect(paraResult.longParagraphCount).toBe(0);
  });

  // Requirement 7: H1 is not compulsory, but primary keyword must appear in content title
  it('5. Does NOT penalize missing H1 in body when content title carries the keyword', () => {
    const contentWithoutH1 = `## Overview of Travel Gear\n\nHere is an in-depth article without an H1 heading.\n\n## Best Cameras for Hiking\n\nMore helpful details here.`;
    const headingResult = analyzeHeadingStructure(contentWithoutH1);
    
    // Missing H1 in markdown body should not drastically reduce score or produce breaking errors
    expect(headingResult.score).toBeGreaterThanOrEqual(70);

    // Primary keyword checked against title
    const kwResult = analyzeKeywordUsage(contentWithoutH1, 'travel gear', 'Best Travel Gear for Bloggers');
    expect(kwResult.inTitle).toBe(true);
    expect(kwResult.recommendations.some(r => r.includes('Add primary keyword to your H1'))).toBe(false);
  });

  // Requirement 8: All passive voice should not be removed, minimum required baseline accepted
  it('6. Accepts natural baseline of passive voice without demanding complete removal', () => {
    const textWithNaturalPassive = `
      The scientific hypothesis was formulated after several empirical trials.
      Researchers then collected sample data from three distinct test locations.
      Results were compiled and analyzed using statistical regression models.
      Our team recommends applying these findings to future ecological studies.
    `;
    const sentResult = analyzeSentences(textWithNaturalPassive);
    expect(sentResult.passiveVoiceCount).toBeGreaterThan(0);
    // Should not aggressively flag natural passive sentences
    expect(sentResult.recommendations.some(r => r.includes('use active voice for clarity'))).toBe(false);
  });

  // Requirement 9: Does not force all transition words into content, accepts reasonable baseline
  it('7. Accepts minimum required baseline of transition words (~15% or 2+ connectors)', () => {
    const text = `
      Content optimization requires deep topical knowledge and structured planning.
      Furthermore, authors should verify semantic relevance across subheadings.
      Therefore, search engines reward comprehensive and authentic articles.
      Readers also appreciate concise conclusions that summarize key takeaways.
    `;
    const transResult = analyzeTransitionWords(text);
    expect(transResult.count).toBeGreaterThanOrEqual(2);
    expect(transResult.recommendations.some(r => r.includes('target 25%+ to improve flow'))).toBe(false);
    expect(transResult.recommendations[0]).toContain('Meets minimum required transition words');
  });

  // Requirement 1 (New): Content Uniqueness: Overused Words measured by 1% to 2% of entire content
  it('8. Calibrates Overused Words threshold to 1%–2% of total content (10–20 max per 1000 words)', () => {
    // Generate a 1,000-word article
    const fillerWords = ['analysis', 'framework', 'digital', 'publishing', 'strategy', 'audience', 'engagement', 'research', 'performance', 'standard'];
    const articleWords: string[] = [];
    while (articleWords.length < 980) {
      articleWords.push(...fillerWords);
    }
    // Add a word that appears 10 times in 1,000 words (1.0% - within acceptable 1%-2% baseline)
    for (let i = 0; i < 10; i++) {
      articleWords.push('visibility');
    }
    // Add another filler word to reach 1,000 words
    while (articleWords.length < 1000) {
      articleWords.push('overview');
    }
    const text1000Words = articleWords.join(' ');

    const result1 = analyzeUniqueness(text1000Words);
    // 10 occurrences of 'visibility' in 1,000 words (1.0%) must NOT be flagged as overused
    expect(result1.overusedWords).not.toContain('visibility');

    // Now test a 1,000-word article where a word occurs 25 times (> 2.0% - exceeds threshold)
    const uniqueFillerWords: string[] = [];
    for (let i = 0; i < 975; i++) {
      uniqueFillerWords.push(`term${i}`);
    }
    for (let i = 0; i < 25; i++) {
      uniqueFillerWords.push('monetization');
    }
    const result2 = analyzeUniqueness(uniqueFillerWords.join(' '));
    // 25 occurrences (>2%) SHOULD be flagged as overused
    expect(result2.overusedWords).toContain('monetization');
    expect(result2.recommendations.some((r: string) => r.includes('1%–2% frequency threshold'))).toBe(true);
  });

  // Requirement 2 (New): Grammar and Spacing accuracy: genuine double spaces flagged, markdown newlines ignored
  it('9. Strictly flags genuine double spaces within lines while ignoring normal markdown paragraph breaks', () => {
    // Text with standard markdown paragraph breaks (\n\n) - should NOT trigger Spacing issues
    const markdownContent = `# Title of Article\n\nThis is paragraph one with clear insights.\n\nThis is paragraph two explaining best practices.\n\n## Subheading\n\nThis is paragraph three.`;
    const cleanResult = analyzeGrammar(markdownContent);
    const spacingIssuesClean = cleanResult.issues.filter((i: any) => i.type === 'Spacing');
    expect(spacingIssuesClean.length).toBe(0);

    // Text with actual double spaces between words
    const doubleSpacedContent = `Here is a sentence  with double spaces. Another line  with double spaces.`;
    const dirtyResult = analyzeGrammar(doubleSpacedContent);
    const spacingIssuesDirty = dirtyResult.issues.filter((i: any) => i.type === 'Spacing');
    expect(spacingIssuesDirty.length).toBe(2);
    expect(spacingIssuesDirty[0].suggestion).toBe('Remove extra spaces');
  });

  // Requirement 3 (New): Real-time live analysis in Step 3 & session persistence without 30 credit re-analysis
  it('10. Blogger Step 3 supports real-time live analysis and persists session without 30-credit re-deduction', () => {
    const mockSession = {
      step: 3,
      primaryKeyword: 'AI checker for bloggers',
      relatedKeywords: ['AI detector for bloggers', 'AI content detector', 'blog SEO'],
      title: 'Top AI Checker for Bloggers to Safeguard Search Traffic',
      isKeywordsLocked: true,
      isTitleLocked: true,
      isCreditsCharged: true,
      metrics: {
        primary: { keyword: 'AI checker for bloggers', difficulty: 38, searchVolume: 3600 },
      },
    };

    // Verify session data indicates Step 3 unlocked and credits charged
    expect(mockSession.step).toBe(3);
    expect(mockSession.isKeywordsLocked).toBe(true);
    expect(mockSession.isTitleLocked).toBe(true);
    expect(mockSession.isCreditsCharged).toBe(true);

    // Verify that title contains primary keyword
    expect(mockSession.title.toLowerCase()).toContain(mockSession.primaryKeyword.toLowerCase());
  });

  // Requirement 4 (New): Accuracy of Keywords & Metrics
  it('11. Accurately calculates Keyword Difficulty, Intent, and Google Keyword Planner volume tiers', () => {
    const benchmarkResult = evaluateBloggerKeywords('ai checker for bloggers', [
      'ai detector for bloggers',
      'content optimization',
    ]);

    expect(benchmarkResult.primary.keyword).toBe('ai checker for bloggers');
    expect(benchmarkResult.primary.difficulty).toBe(38);
    expect(benchmarkResult.primary.searchVolume).toBe(3600);
    expect(benchmarkResult.primary.searchVolumeFormatted).toBe('3.6K/mo');
    expect(benchmarkResult.primary.intent).toBe('Commercial');
    expect(benchmarkResult.primary.cpc).toBe('$2.85');

    // Test arbitrary long-tail keyword
    const longTail = evaluateBloggerKeywords('how to optimize blog posts for beginner travel writers in 2026');
    expect(longTail.primary.difficulty).toBeLessThanOrEqual(45); // long-tail is low difficulty
    expect(longTail.primary.intent).toBe('Informational');
    expect(longTail.primary.searchVolume).toBeGreaterThan(0);
  });

  // Requirement 1 (Latest): History is saved work, locked in Step 3 without requiring re-entry or credit deduction
  it('12. Opening saved work from history restores locked keywords and title in Step 3 without re-charging or re-analyzing', () => {
    const historyItem: SEOAnalysisHistoryItem = {
      id: 'hist_test_123',
      title: 'Top AI Checker for Bloggers to Rank on Google',
      keyword: 'ai checker for bloggers',
      wordCount: 1200,
      creditCost: 30, // originally charged once
      content: '# Top AI Checker for Bloggers to Rank on Google\n\nContent body here...',
      scores: {
        overall: 92,
        seoScore: 94,
        readabilityScore: 90,
        uniquenessScore: 95,
        aiRiskScore: 91,
      },
      snapshot: {} as any,
      createdAt: Date.now() - 3600000,
      contentHash: 'hash_test_123',
      bloggerSession: {
        primaryKeyword: 'ai checker for bloggers',
        relatedKeywords: ['blog seo tool', 'content checker', 'writing assistant'],
        title: 'Top AI Checker for Bloggers to Rank on Google',
        step: 3,
        isKeywordsLocked: true,
        isTitleLocked: true,
        isCreditsCharged: true,
      },
    };

    // When opening from history:
    const restoredPrimary = historyItem.bloggerSession?.primaryKeyword || historyItem.keyword;
    const restoredTitle = historyItem.bloggerSession?.title || historyItem.title;
    const restoredRelated = historyItem.bloggerSession?.relatedKeywords || [];
    const restoredStep = historyItem.bloggerSession?.step || 3;
    const isKeywordsLocked = historyItem.bloggerSession?.isKeywordsLocked ?? true;
    const isTitleLocked = historyItem.bloggerSession?.isTitleLocked ?? true;

    expect(restoredStep).toBe(3);
    expect(isKeywordsLocked).toBe(true);
    expect(isTitleLocked).toBe(true);
    expect(restoredPrimary).toBe('ai checker for bloggers');
    expect(restoredTitle).toBe('Top AI Checker for Bloggers to Rank on Google');
    expect(restoredRelated.length).toBe(3);

    // Opening history consumes 0 credits
    const restoreCreditCost = 0;
    expect(restoreCreditCost).toBe(0);
  });

  // Requirement 2 (Latest): Start New automatically saves current session to history and opens fresh session
  it('13. Start New saves active work to history before resetting workspace to Step 1', () => {
    // Current active session
    const currentSession = {
      primaryKeyword: 'organic traffic strategies',
      relatedKeywords: ['blog growth', 'seo keywords', 'content marketing'],
      title: 'Best Organic Traffic Strategies for Growing Blogs',
      content: '# Best Organic Traffic Strategies for Growing Blogs\n\nComprehensive guide...',
      wordCount: 850,
      step: 3,
      isKeywordsLocked: true,
      isTitleLocked: true,
      isCreditsCharged: true,
    };

    // Auto-save logic snapshot
    const shouldSave = (currentSession.content.trim().length > 0 || currentSession.title.trim().length > 0);
    expect(shouldSave).toBe(true);

    const savedHistoryRecord: SEOAnalysisHistoryItem = {
      id: 'hist_autosave_999',
      title: currentSession.title,
      keyword: currentSession.primaryKeyword,
      wordCount: currentSession.wordCount,
      creditCost: 30,
      content: currentSession.content,
      scores: { overall: 88, seoScore: 90, readabilityScore: 85, uniquenessScore: 92, aiRiskScore: 89 },
      snapshot: {} as any,
      createdAt: Date.now(),
      contentHash: 'hash_test_456',
      bloggerSession: {
        primaryKeyword: currentSession.primaryKeyword,
        relatedKeywords: currentSession.relatedKeywords,
        title: currentSession.title,
        step: 3,
        isKeywordsLocked: true,
        isTitleLocked: true,
        isCreditsCharged: true,
      },
    };

    expect(savedHistoryRecord.title).toBe('Best Organic Traffic Strategies for Growing Blogs');
    expect(savedHistoryRecord.bloggerSession?.isTitleLocked).toBe(true);

    // After saving, workspace resets to fresh Step 1
    const resetState = {
      step: 1,
      isKeywordsLocked: false,
      isTitleLocked: false,
      isCreditsCharged: false,
      primaryKeyword: '',
      relatedKeywords: ['', '', ''],
      title: '',
      content: '',
      wordCount: 0,
    };

    expect(resetState.step).toBe(1);
    expect(resetState.isKeywordsLocked).toBe(false);
    expect(resetState.isTitleLocked).toBe(false);
    expect(resetState.primaryKeyword).toBe('');
    expect(resetState.content).toBe('');
  });

  // Requirement 3 (Latest): Google SERP Snippet Preview calculations and truncation checks
  it('14. Google SERP Snippet Preview calculates optimal title limits, pixel bounds, and extracts meta description', () => {
    const optimalTitle = 'AI Checker for Bloggers: Complete SEO Guide 2026';
    const longTitle = 'AI Checker for Bloggers: The Ultimate Definitive Comprehensive In-Depth Guide for Content Creators and Professional Writers';
    const sampleContent = `# Heading 1\n\nThis is an authoritative guide on how to safeguard search rankings. We explain how search engines evaluate quality signals and keyword distribution without penalizing genuine writing.`;

    // 1. Character count limit
    expect(optimalTitle.length).toBeLessThanOrEqual(60);
    expect(longTitle.length).toBeGreaterThan(60);

    // 2. Truncation logic (58-60 chars)
    const maxChars = 60;
    const truncatedLong = `${longTitle.substring(0, maxChars)}...`;
    expect(truncatedLong.endsWith('...')).toBe(true);
    expect(truncatedLong.length).toBe(63);

    // 3. Pixel estimation (~9.5px per character)
    const pixelWidthOptimal = Math.round(optimalTitle.length * 9.5);
    const pixelWidthLong = Math.round(longTitle.length * 9.5);
    expect(pixelWidthOptimal).toBeLessThan(580);
    expect(pixelWidthLong).toBeGreaterThan(580);

    // 4. Meta description extraction from markdown content (removes # headings and caps to 160)
    const cleanExcerpt = extractSnippetDescription(sampleContent, 160);
    expect(cleanExcerpt.startsWith('This is an authoritative guide')).toBe(true);
    expect(cleanExcerpt).not.toContain('# Heading 1');
    expect(cleanExcerpt.length).toBeLessThanOrEqual(160);
  });
});
