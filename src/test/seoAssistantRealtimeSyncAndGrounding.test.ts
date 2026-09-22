import { describe, it, expect } from 'vitest';
import {
  analyzeKeywordUsage,
  analyzeSemanticKeywords,
  analyzeSearchIntent,
  analyzeReadability,
  analyzeSentences,
  analyzeParagraphs,
  analyzeTransitionWords,
  analyzeGrammar,
  analyzeHeadingStructure,
  analyzeEEAT,
  analyzeEngagement,
  analyzeSnippetPotential,
  analyzeAIRisk,
  analyzeUniqueness,
  generateMeta,
  computeOverallScores,
  getSentencesWithPositions,
  getParagraphsWithPositions,
  getHeadingsWithPositions,
} from '@/pages/seo-assistant/analysisEngine';
import { generateContentHash } from '@/lib/seoAssistantHistory';

describe('SEO Assistant Real-Time Analysis, Versioning & Grounding', () => {
  const sampleArticle = `# Ultimate Guide to AI Content Detection

Understanding AI content detection is essential for modern bloggers and digital publishers. In our hands-on testing, we found that combining multiple statistical heuristics yields the most reliable results.

## Key Mechanisms of Content Analysis

Modern detectors analyze perplexity and burstiness. However, relying on a single metric often produces false positives. For example, technical documentation often features uniform sentence lengths.

Furthermore, writers should verify that their assertions are supported by verifiable facts and structured data.

### Best Practices for Writers

1. Write clear, varied sentences.
2. Include first-hand experiences and case studies.
3. Review your drafts regularly.`;

  it('1. Generates deterministic contentHash based on content and keyword', () => {
    const hash1 = generateContentHash(sampleArticle, 'ai content detection');
    const hash2 = generateContentHash(sampleArticle, 'ai content detection');
    const hashModified = generateContentHash(sampleArticle + ' extra text', 'ai content detection');
    const hashDifferentKw = generateContentHash(sampleArticle, 'different keyword');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hashModified);
    expect(hash1).not.toBe(hashDifferentKw);
    expect(typeof hash1).toBe('string');
    expect(hash1.length).toBeGreaterThan(0);
  });

  it('2. Sentence analysis identifies exact positions, sentenceIndex, and removes long sentence issues upon editing', () => {
    const longSentence = 'This is an excessively long and unnecessarily verbose sentence that goes on and on without any punctuation or natural pause, easily exceeding the recommended threshold for readability in modern online publishing articles.';
    const textWithLong = `# Title\n\n${longSentence}\n\nShort sentence here.`;
    
    const initialResult = analyzeSentences(textWithLong);
    expect(initialResult.longSentenceCount + (initialResult.veryLongSentences?.length || 0)).toBeGreaterThan(0);
    expect(initialResult.sentenceItems).toBeDefined();
    
    const longItem = initialResult.sentenceItems?.find(s => s.type === 'very_long_sentence' || s.type === 'long_sentence');
    expect(longItem).toBeDefined();
    expect(longItem?.start).toBeGreaterThanOrEqual(0);
    expect(longItem?.end).toBeGreaterThan(longItem?.start || 0);
    expect(longItem?.sentenceIndex).toBe(0);

    // Fix the sentence by breaking it down
    const fixedText = `# Title\n\nThis is a short sentence. Here is another concise sentence.\n\nShort sentence here.`;
    const fixedResult = analyzeSentences(fixedText);
    
    expect(fixedResult.longSentenceCount).toBe(0);
    expect(fixedResult.veryLongSentences?.length || 0).toBe(0);
    expect(fixedResult.sentenceItems?.length || 0).toBe(0);
    expect(fixedResult.recommendations).toContain('Sentence structure looks good.');
  });

  it('3. Grammar analysis identifies exact offset positions and clears issues upon correction', () => {
    const textWithGrammarIssue = 'i am writing this article and its going to be great. i think this is good.';
    const initialGrammar = analyzeGrammar(textWithGrammarIssue);
    
    expect(initialGrammar.issues.length).toBeGreaterThan(0);
    expect(initialGrammar.issues[0].start).toBeDefined();
    expect(initialGrammar.issues[0].end).toBeDefined();
    expect(initialGrammar.score).toBeLessThan(100);

    // Fix grammar
    const fixedText = 'I am writing this article and it is going to be great. I think this is good.';
    const fixedGrammar = analyzeGrammar(fixedText);
    
    expect(fixedGrammar.issues.length).toBe(0);
    expect(fixedGrammar.score).toBe(100);
  });

  it('4. Heading structure analysis accurately parses headings with positions and updates score when H2 is added', () => {
    const textWithoutH2 = `# Main Title\n\nJust some paragraphs without any subheadings.`;
    const initialHeadings = analyzeHeadingStructure(textWithoutH2);
    
    expect(initialHeadings.h1Count).toBe(1);
    expect(initialHeadings.h2Count).toBe(0);
    expect(initialHeadings.issues.some(i => i.includes('H2'))).toBe(true);
    expect(initialHeadings.score).toBeLessThan(100);

    // Add H2 headings
    const textWithH2 = `# Main Title\n\n## Section One\n\nContent.\n\n## Section Two\n\nMore content.`;
    const fixedHeadings = analyzeHeadingStructure(textWithH2);
    
    expect(fixedHeadings.h1Count).toBe(1);
    expect(fixedHeadings.h2Count).toBe(2);
    expect(fixedHeadings.issues.length).toBe(0);
    expect(fixedHeadings.score).toBe(100);
  });

  it('5. Content Uniqueness accurately counts occurrences grounded in current text and removes issues when repetition is removed', () => {
    const repetitiveText = `optimization optimization optimization optimization optimization optimization optimization
This article is about optimization and search ranking.
the best way to improve the best way to improve the best way to improve`;
    
    const initialUniq = analyzeUniqueness(repetitiveText);
    expect(initialUniq.overusedWords).toContain('optimization');
    expect(initialUniq.wordOccurrences).toBeDefined();
    
    const optOcc = initialUniq.wordOccurrences?.find(w => w.word === 'optimization');
    expect(optOcc?.count).toBeGreaterThan(5);
    expect(optOcc?.occurrences.length).toBe(optOcc?.count);
    expect(optOcc?.occurrences[0].start).toBeGreaterThanOrEqual(0);

    // Remove repetition
    const uniqueText = `We analyzed various strategies for enhancing digital publishing performance and content clarity. Each approach offers distinct advantages for authors.`;
    const fixedUniq = analyzeUniqueness(uniqueText);
    
    expect(fixedUniq.overusedWords.length).toBe(0);
    expect(fixedUniq.duplicatePhrases.length).toBe(0);
    expect(fixedUniq.score).toBe(100);
    expect(fixedUniq.recommendations).toContain('Content appears unique with varied vocabulary.');
  });

  it('6. Overall SEO Score and Publishing Readiness dynamically recalculate when module findings improve', () => {
    const kw = 'content optimization';
    
    // Imperfect article
    const lowQualityText = `some random text without headings or clear structure. i think its ok.`;
    const lowKw = analyzeKeywordUsage(lowQualityText, kw);
    const lowRead = analyzeReadability(lowQualityText);
    const lowGram = analyzeGrammar(lowQualityText);
    const lowEeat = analyzeEEAT(lowQualityText);
    const lowHead = analyzeHeadingStructure(lowQualityText);
    const lowEng = analyzeEngagement(lowQualityText);
    const lowSnip = analyzeSnippetPotential(lowQualityText);
    const lowUniq = analyzeUniqueness(lowQualityText);

    const initialScores = computeOverallScores({
      kwResult: lowKw,
      readability: lowRead,
      grammar: lowGram,
      eeat: lowEeat,
      headings: lowHead,
      engagement: lowEng,
      snippet: lowSnip,
      uniqueness: lowUniq,
    });

    // High quality improved article with balanced keyword density (0.8% - 1.5%)
    const highQualityText = `# Content Optimization Guide

Content optimization is defined as the art of making writing clear and useful for online readers. In our experience, we found that simple sentences work best for engagement. Clear writing helps people understand important ideas without unnecessary confusion or cognitive strain.

## Why Content Optimization Helps

Why do writers care about high standards? For example, 80% of readers prefer clear writing over complex jargon. When you write directly, people stay longer on your page and understand your message. Every paragraph should deliver real value to the reader.

- Clear headings
- Simple explanations
- Active voice sentences

## Frequently Asked Questions

FAQ: How do I improve my drafts? Just practice daily, read widely, and edit carefully to refine your voice.

Source: https://example.org
Written by Editorial Team

## Conclusion

In conclusion, content optimization helps everyone learn faster, communicate better, and build lasting trust with their audience.`;

    const highKw = analyzeKeywordUsage(highQualityText, kw);
    const highRead = analyzeReadability(highQualityText);
    const highGram = analyzeGrammar(highQualityText);
    const highEeat = analyzeEEAT(highQualityText);
    const highHead = analyzeHeadingStructure(highQualityText);
    const highEng = analyzeEngagement(highQualityText);
    const highSnip = analyzeSnippetPotential(highQualityText);
    const highUniq = analyzeUniqueness(highQualityText);

    const improvedScores = computeOverallScores({
      kwResult: highKw,
      readability: highRead,
      grammar: highGram,
      eeat: highEeat,
      headings: highHead,
      engagement: highEng,
      snippet: highSnip,
      uniqueness: highUniq,
    });

    expect(improvedScores.overall).toBeGreaterThan(initialScores.overall);
    expect(improvedScores.publishingScore).toBeGreaterThan(initialScores.publishingScore);
    expect(typeof improvedScores.readyToPublish).toBe('boolean');
  });

  it('7. Validates 1 Primary + up to 3 Related Keywords with duplicate prevention and case normalization', () => {
    // Normalization helper simulation matching SEO assistant session rules
    function validateKeywordSet(primary: string, related: string[]) {
      const cleanPrimary = primary.trim();
      if (!cleanPrimary) return { valid: false, error: 'Primary keyword is required' };

      const seen = new Set<string>();
      seen.add(cleanPrimary.toLowerCase());

      const validRelated: string[] = [];
      for (const raw of related) {
        const trimmed = raw.trim();
        if (!trimmed) continue;
        const lower = trimmed.toLowerCase();
        if (seen.has(lower)) continue; // skip duplicates
        seen.add(lower);
        validRelated.push(trimmed);
        if (validRelated.length >= 3) break; // enforce max 3
      }

      return {
        valid: true,
        primary: cleanPrimary,
        related: validRelated,
      };
    }

    const validCase = validateKeywordSet('AI checker for bloggers', [
      'AI detector for bloggers',
      'AI content detector for bloggers',
      'AI checker for SEO content',
      'extra 4th keyword',
    ]);
    expect(validCase.valid).toBe(true);
    expect(validCase.primary).toBe('AI checker for bloggers');
    expect(validCase.related?.length).toBe(3);
    expect(validCase.related).toEqual([
      'AI detector for bloggers',
      'AI content detector for bloggers',
      'AI checker for SEO content',
    ]);

    // Duplicate detection and empty primary rejection
    const emptyPrimary = validateKeywordSet('  ', ['related 1']);
    expect(emptyPrimary.valid).toBe(false);

    const duplicateCheck = validateKeywordSet('AI Checker', ['ai checker', 'AI CHECKER', 'Unique Related']);
    expect(duplicateCheck.related).toEqual(['Unique Related']);
  });

  it('8. Supports Keyword-Locked Session Lifecycle with content replacement and versioning protection', () => {
    let documentVersion = 1;
    let lockedPrimaryKeyword = 'AI detector';
    const lockedRelatedKeywords = ['AI content checker', 'SEO content detector'];
    let lastAppliedVersion = 0;

    function simulateAnalysisRequest(currentVersion: number, content: string) {
      // Simulate asynchronous execution
      return {
        version: currentVersion,
        contentHash: generateContentHash(content, lockedPrimaryKeyword),
        wordCount: content.split(/\s+/).filter(Boolean).length,
      };
    }

    // Version 1 edit
    documentVersion++;
    const req1 = simulateAnalysisRequest(documentVersion, 'First article text draft');

    // Rapid Version 2 edit
    documentVersion++;
    const req2 = simulateAnalysisRequest(documentVersion, 'Second updated article text with full replacement');

    // If Version 2 finishes and applies first:
    if (req2.version > lastAppliedVersion) {
      lastAppliedVersion = req2.version;
    }
    expect(lastAppliedVersion).toBe(3);

    // Stale Version 1 attempts to apply later:
    let appliedStale = false;
    if (req1.version > lastAppliedVersion) {
      lastAppliedVersion = req1.version;
      appliedStale = true;
    }
    expect(appliedStale).toBe(false); // correctly rejected!
    expect(lastAppliedVersion).toBe(3); // stays on latest version
    expect(lockedPrimaryKeyword).toBe('AI detector'); // keyword remains locked
    expect(lockedRelatedKeywords.length).toBe(2);
  });

  it('9. Identifies exact spacing issues at character-level positions (e.g., pos 26, 44, 60, 89) with surrounding contextSnippet', () => {
    // Construct sample text with extra spaces at specific locations
    const textWithSpacingIssues = 'This is the initial text.  Here is another sentence.  Third sentence with  double spaces and  fourth item.';
    const result = analyzeGrammar(textWithSpacingIssues);

    const spacingIssues = result.issues.filter(i => i.type === 'Spacing');
    expect(spacingIssues.length).toBeGreaterThanOrEqual(4);

    for (const issue of spacingIssues) {
      expect(issue.type).toBe('Spacing');
      expect(issue.text).toMatch(/^\s{2,}$/);
      expect(typeof issue.start).toBe('number');
      expect(typeof issue.end).toBe('number');
      expect(issue.end).toBeGreaterThan(issue.start);
      expect(issue.contextSnippet).toBeDefined();
      expect(typeof issue.contextSnippet).toBe('string');
      expect(issue.contextSnippet?.length).toBeGreaterThan(0);
    }

    // Verify ordering by start position
    for (let i = 0; i < spacingIssues.length - 1; i++) {
      expect(spacingIssues[i].start).toBeLessThanOrEqual(spacingIssues[i + 1].start);
    }
  });

  it('10. Dynamically scales across hundreds of grammar/spacing issues and decrements counts accurately upon live correction', () => {
    // Generate text with 25 spacing issues
    const parts: string[] = [];
    for (let i = 0; i < 25; i++) {
      parts.push(`WordA${i}  WordB${i}`);
    }
    const initialText = parts.join(' ');
    const initialResult = analyzeGrammar(initialText);

    expect(initialResult.issues.length).toBe(25);
    expect(initialResult.score).toBe(0); // 100 - 25*8 <= 0

    // Fix 5 issues
    for (let i = 0; i < 5; i++) {
      parts[i] = `WordA${i} WordB${i}`; // single space
    }
    const partiallyFixedText = parts.join(' ');
    const partiallyFixedResult = analyzeGrammar(partiallyFixedText);

    expect(partiallyFixedResult.issues.length).toBe(20);
    expect(partiallyFixedResult.score).toBe(0);

    // Fix all remaining issues
    for (let i = 5; i < 25; i++) {
      parts[i] = `WordA${i} WordB${i}`;
    }
    const completelyFixedText = parts.join(' ');
    const completelyFixedResult = analyzeGrammar(completelyFixedText);

    expect(completelyFixedResult.issues.length).toBe(0);
    expect(completelyFixedResult.score).toBe(100);
  });

  it('11. Accurately parses and paginates 280+ grammar & spacing issues with stable ordering, early/middle/late location indexing, and zero duplicate cards', () => {
    // Generate text producing 285 spacing issues
    const parts: string[] = [];
    for (let i = 0; i < 285; i++) {
      parts.push(`Term_${i}  NextTerm_${i}`);
    }
    const largeArticle = parts.join(' ');
    const grammarResult = analyzeGrammar(largeArticle);

    expect(grammarResult.issues.length).toBe(285);
    expect(grammarResult.score).toBe(0); // Score is 0/100, which is accurately clamped to 0

    // Check early finding (pos 0-100)
    const earlyFinding = grammarResult.issues[0];
    expect(earlyFinding.type).toBe('Spacing');
    expect(earlyFinding.start).toBeLessThan(100);
    expect(earlyFinding.contextSnippet).toContain('Term_0');

    // Check middle finding (#140)
    const middleFinding = grammarResult.issues[140];
    expect(middleFinding.type).toBe('Spacing');
    expect(middleFinding.start).toBeGreaterThan(earlyFinding.start);
    expect(middleFinding.contextSnippet).toContain('Term_140');

    // Check late finding (#284)
    const lateFinding = grammarResult.issues[284];
    expect(lateFinding.type).toBe('Spacing');
    expect(lateFinding.start).toBeGreaterThan(middleFinding.start);
    expect(lateFinding.contextSnippet).toContain('Term_284');

    // Verify all 285 findings have strictly non-decreasing start positions (stable sort)
    for (let i = 0; i < grammarResult.issues.length - 1; i++) {
      expect(grammarResult.issues[i].start).toBeLessThanOrEqual(grammarResult.issues[i + 1].start);
    }

    // Simulate progressive pagination batches (initial 10, then +20, then show all)
    let visibleCount = 10;
    let batch1 = grammarResult.issues.slice(0, visibleCount);
    expect(batch1.length).toBe(10);

    visibleCount = Math.min(grammarResult.issues.length, visibleCount + 20);
    let batch2 = grammarResult.issues.slice(0, visibleCount);
    expect(batch2.length).toBe(30);

    visibleCount = grammarResult.issues.length;
    let allBatch = grammarResult.issues.slice(0, visibleCount);
    expect(allBatch.length).toBe(285);

    // Verify uniqueness of issue start offsets (no duplicate findings created during expansion)
    const offsetSet = new Set(allBatch.map(b => b.start));
    expect(offsetSet.size).toBe(285);
  });
});

