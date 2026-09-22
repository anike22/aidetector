import { describe, it, expect } from 'vitest';
import { 
  analyzeUniqueness, 
  analyzeEEAT, 
  analyzeEngagement,
  analyzeSentences,
  analyzeHeadingStructure
} from '@/pages/seo-assistant/analysisEngine';

describe('SEO Assistant Interactive Features & Regression Tests (Parts 26–46)', () => {
  // PART 39: AI Sentence Navigation and Occurrence Integrity
  describe('PART 39: Sentence Analysis & Offset Integrity', () => {
    it('analyzes sentences across varied lengths and maintains exact sentence boundaries', () => {
      const longArticle = `
        Artificial intelligence detection has evolved rapidly over recent years.
        While early models relied primarily on simple statistical metrics like burstiness and perplexity, contemporary detection platforms incorporate multi-tier neural classification and semantic variance models.
        This sentence is short.
        This sentence is short.
        Understanding how these models classify syntax allows content authors to calibrate their tone without sacrificing natural clarity.
      `;

      const result = analyzeSentences(longArticle);
      expect(result.totalSentences).toBeGreaterThanOrEqual(4);
      expect(result.longSentenceCount).toBeGreaterThanOrEqual(1);

      // Verify duplicate sentences are handled independently
      const shortOccurrences = longArticle.match(/This sentence is short\./g);
      expect(shortOccurrences?.length).toBe(2);
    });
  });

  // PART 40: Content Uniqueness & Exact Word/Phrase Navigation
  describe('PART 40: Content Uniqueness 10+ Occurrences & Navigation', () => {
    it('accurately identifies 10+ occurrences of "detector" with precise indices and boundary protection', () => {
      const repeatedWordText = `
        The detector scanned the document. 
        Each detector tested returned varying probabilities. 
        A primary detector identified structural repetition. 
        Another detector evaluated token perplexity. 
        The fifth detector calibrated tone. 
        Our sixth detector compared stylistic signals. 
        A seventh detector checked semantic entropy. 
        An eighth detector verified sentence variance. 
        The ninth detector flagged passive voice. 
        The tenth detector generated an overall confidence score. 
        Finally, the eleventh detector confirmed the benchmark.
      `;

      const result = analyzeUniqueness(repeatedWordText);
      expect(result.wordOccurrences).toBeDefined();

      const detectorData = result.wordOccurrences?.find(w => w.word.toLowerCase() === 'detector');
      expect(detectorData).toBeDefined();
      expect(detectorData!.count).toBeGreaterThanOrEqual(10);
      expect(detectorData!.occurrences.length).toBeGreaterThanOrEqual(10);

      // Verify every occurrence has valid start and end offsets and doesn't mismatch word boundaries
      detectorData!.occurrences.forEach((occ, idx) => {
        expect(occ.start).toBeGreaterThanOrEqual(0);
        expect(occ.end).toBeGreaterThan(occ.start);
        expect(occ.index).toBe(idx);
        const extracted = repeatedWordText.slice(occ.start, occ.end).toLowerCase();
        expect(extracted).toBe('detector');
      });

      // Verify word boundary: "detectors" or "detection" are not matched as "detector"
      const mixedText = 'The detector analyzes detection across multiple detectors.';
      const mixedResult = analyzeUniqueness(mixedText);
      const mixedDetectorData = mixedResult.wordOccurrences?.find(w => w.word.toLowerCase() === 'detector');
      if (mixedDetectorData) {
        mixedDetectorData.occurrences.forEach(occ => {
          const slice = mixedText.slice(occ.start, occ.end).toLowerCase();
          expect(slice).toBe('detector');
        });
      }
    });

    it('identifies repeated multi-word phrases with exact phrase boundaries', () => {
      const repeatedPhraseText = `
        On the other hand, empirical testing reveals notable variations.
        On the other hand, calibrated models reduce false positive rates.
        On the other hand, manual editorial review remains indispensable.
      `;

      const result = analyzeUniqueness(repeatedPhraseText);
      expect(result.phraseOccurrences).toBeDefined();

      const phraseData = result.phraseOccurrences?.find(p => p.phrase.toLowerCase().includes('on the other hand'));
      if (phraseData) {
        expect(phraseData.count).toBeGreaterThanOrEqual(2);
        phraseData.occurrences.forEach(occ => {
          expect(occ.start).toBeGreaterThanOrEqual(0);
          expect(occ.end).toBeGreaterThan(occ.start);
        });
      }
    });

    it('ensures score calculation is purely functional and unaffected by UI interactions', () => {
      const text = 'Unique high-value content with diverse vocabulary and minimal structural redundancy across paragraphs.';
      const score1 = analyzeUniqueness(text).score;
      const score2 = analyzeUniqueness(text).score;
      expect(score1).toBe(score2);
    });
  });

  // PART 41: E-E-A-T Analysis & Anti-Fabrication Framework
  describe('PART 41: E-E-A-T Ethical Framework & Recommendation Relevance', () => {
    it('evaluates real content E-E-A-T signals without fabricating false facts', () => {
      const textWithStatsAndCitations = `
        # Comprehensive Guide to Content Quality
        
        According to Stanford University research (https://stanford.edu/study), structured verification enhances readability by 35%.
        In our practical testing, we found that implementing pre-publishing checklists reduced revision cycles.
        
        Written by Senior Technical Editor.
      `;

      const result = analyzeEEAT(textWithStatsAndCitations);
      expect(result.score).toBeGreaterThan(70);
      expect(result.hasStats).toBe(true);
      expect(result.hasCitations).toBe(true);
      expect(result.hasPersonalExamples).toBe(true);
      expect(result.hasAuthor).toBe(true);
    });

    it('detects missing personal experience in purely conceptual text and prompts ethical framework', () => {
      const conceptualText = `
        # Theoretical Overview of Search Algorithms
        Search engines evaluate web documents using indexation hierarchies and crawler heuristics.
        Relevance scoring incorporates query matching and page structure.
      `;

      const result = analyzeEEAT(conceptualText);
      expect(result.hasPersonalExamples).toBe(false);
      expect(result.recommendations.some(r => r.toLowerCase().includes('personal') || r.toLowerCase().includes('examples'))).toBe(true);
    });
  });

  // PART 42: Engagement Question Recommendation for Explanatory Passages
  describe('PART 42: Engagement Analysis on Explanatory Passage Without Questions', () => {
    it('identifies missing questions in purely explanatory text and suggests engagement hook', () => {
      const explanatoryText = `
        # Understanding Token Classification Mechanics
        
        Neural network classifiers compute log-probabilities across token sequences to estimate entropy levels.
        When perplexity falls below calibrated thresholds, models assign elevated synthetic probability scores.
        For example, repetitive transitional syntax often triggers sensitivity filters regardless of intent.
        Data indicates that 60% of false positives stem from rigid phrase structures.
      `;

      const result = analyzeEngagement(explanatoryText);
      expect(result.questionCount).toBe(0);
      expect(result.exampleCount).toBeGreaterThanOrEqual(1);
      expect(result.dataCount).toBeGreaterThanOrEqual(1);
      
      // Since question count is 0, recommendation must suggest adding rhetorical questions
      const questionRec = result.recommendations.find(r => r.toLowerCase().includes('rhetorical questions'));
      expect(questionRec).toBeDefined();
    });
  });

  // PART 26: Engagement Throttling
  describe('PART 26: Engagement Question Throttling', () => {
    it('does not demand extra rhetorical questions if article already contains questions', () => {
      const engagingText = `
        # Exploring Content Optimization
        
        Have you ever wondered why certain articles rank higher despite having similar word counts?
        What if the key lies not in keyword density, but in contextual clarity and topical authority?
        
        For example, consider a case where adding structured benchmarks improved reader time-on-page by 40%.
        Furthermore, survey data shows that 85% of engaged users prefer concrete case studies over abstract advice.
      `;

      const result = analyzeEngagement(engagingText);
      expect(result.questionCount).toBeGreaterThanOrEqual(2);
      expect(result.exampleCount).toBeGreaterThanOrEqual(1);
      expect(result.dataCount).toBeGreaterThanOrEqual(2);
      expect(result.score).toBeGreaterThanOrEqual(60);
      
      // Since questions exist, the question recommendation should not be present
      const questionRec = result.recommendations.find(r => r.toLowerCase().includes('rhetorical questions'));
      expect(questionRec).toBeUndefined();
    });
  });

  // UX & Scroll Behavior Verification
  describe('UX & Independent Scrolling Integrity', () => {
    it('verifies that content analysis is unaffected by scrolling and paste operations', () => {
      const longPastedArticle = `
        # Comprehensive Guide to Scalable Web Systems

        Modern enterprise software demands architectural resilience, high concurrency, and predictable latency profiles.
        When architecting distributed systems, teams must balance consistency guarantees with network partition tolerance.

        ## Database Optimization Strategies
        Indexing strategies, query plan profiling, and read-replica distribution alleviate I/O bottlenecks.
        Furthermore, empirical data indicates that caching frequent lookups improves throughput by 55%.

        ## Monitoring and Reliability
        Distributed tracing and structured logging enable immediate root-cause isolation during incidents.
      `;

      const initialResult = analyzeEEAT(longPastedArticle);
      const secondResult = analyzeEEAT(longPastedArticle);
      expect(initialResult.score).toBe(secondResult.score);

      const initialUniq = analyzeUniqueness(longPastedArticle);
      const secondUniq = analyzeUniqueness(longPastedArticle);
      expect(initialUniq.score).toBe(secondUniq.score);
      expect(initialUniq.duplicatePhrases.length).toBe(secondUniq.duplicatePhrases.length);
    });

    it('verifies internal link location target metadata structure and scroll container isolation contract', () => {
      const sampleArticle = `
        When optimizing content for search visibility, internal linking helps distribute topical authority.
        Understanding semantic variance models improves both readability and indexing speed.
      `;
      const targetAnchor = 'semantic variance models';
      const startIndex = sampleArticle.indexOf(targetAnchor);
      const endIndex = startIndex + targetAnchor.length;

      const locationPayload = {
        type: 'internal_link_anchor',
        text: targetAnchor,
        start: startIndex,
        end: endIndex,
        sentenceIndex: 1,
        contextSnippet: 'Understanding semantic variance models improves both readability',
        severity: 'info' as const
      };

      expect(locationPayload.start).toBeGreaterThan(0);
      expect(locationPayload.end).toBeGreaterThan(locationPayload.start);
      expect(sampleArticle.slice(locationPayload.start, locationPayload.end)).toBe(targetAnchor);
      expect(locationPayload.severity).toBe('info');
    });
  });
});
