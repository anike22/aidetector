import { describe, it, expect } from 'vitest';
import {
  normalizeAndValidateDomain,
  isIpOrPrivateHost,
  extractLinksFromJsonResponse,
  matchInternalLinksToArticle,
  validateAnchorQuality,
  expandToDescriptivePhraseInSentence,
} from '@/lib/seo/internalLinkDiscovery';

describe('SEO Assistant - Internal Link Discovery & Matching Engine', () => {
  describe('Domain Normalization & Validation', () => {
    it('normalizes standard domain input without protocol', () => {
      const res = normalizeAndValidateDomain('zerogpt.com');
      expect(res.valid).toBe(true);
      expect(res.domain).toBe('zerogpt.com');
      expect(res.origin).toBe('https://zerogpt.com');
    });

    it('normalizes www domain input', () => {
      const res = normalizeAndValidateDomain('www.zerogpt.com');
      expect(res.valid).toBe(true);
      expect(res.domain).toBe('www.zerogpt.com');
      expect(res.origin).toBe('https://www.zerogpt.com');
    });

    it('normalizes https URL with trailing slash and path', () => {
      const res = normalizeAndValidateDomain('https://example.com/blog/');
      expect(res.valid).toBe(true);
      expect(res.domain).toBe('example.com');
      expect(res.origin).toBe('https://example.com');
    });

    it('normalizes http URL and upgrades origin scheme to https', () => {
      const res = normalizeAndValidateDomain('http://openai.com');
      expect(res.valid).toBe(true);
      expect(res.domain).toBe('openai.com');
      expect(res.origin).toBe('https://openai.com');
    });

    it('rejects empty input with helpful message', () => {
      const res = normalizeAndValidateDomain('   ');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/please enter your website domain/i);
    });

    it('rejects invalid domain without TLD', () => {
      const res = normalizeAndValidateDomain('justaname');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/must include a valid extension/i);
    });

    it('rejects invalid characters in domain', () => {
      const res = normalizeAndValidateDomain('my website!.com');
      expect(res.valid).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

  describe('SSRF Protection & Restricted Hostnames', () => {
    it('detects and blocks localhost', () => {
      expect(isIpOrPrivateHost('localhost')).toBe(true);
      expect(isIpOrPrivateHost('sub.localhost')).toBe(true);
      const res = normalizeAndValidateDomain('localhost');
      expect(res.valid).toBe(false);
    });

    it('detects and blocks IPv4 loopback (127.0.0.1)', () => {
      expect(isIpOrPrivateHost('127.0.0.1')).toBe(true);
      expect(isIpOrPrivateHost('127.1.2.3')).toBe(true);
      const res = normalizeAndValidateDomain('127.0.0.1');
      expect(res.valid).toBe(false);
    });

    it('detects and blocks RFC1918 private IP ranges (10.x, 172.16.x, 192.168.x)', () => {
      expect(isIpOrPrivateHost('10.0.0.1')).toBe(true);
      expect(isIpOrPrivateHost('172.20.10.4')).toBe(true);
      expect(isIpOrPrivateHost('192.168.1.1')).toBe(true);
      const res = normalizeAndValidateDomain('192.168.1.100');
      expect(res.valid).toBe(false);
    });

    it('detects and blocks cloud metadata endpoint (169.254.169.254)', () => {
      expect(isIpOrPrivateHost('169.254.169.254')).toBe(true);
      const res = normalizeAndValidateDomain('169.254.169.254');
      expect(res.valid).toBe(false);
    });

    it('detects and blocks IPv6 addresses', () => {
      expect(isIpOrPrivateHost('[::1]')).toBe(true);
      expect(isIpOrPrivateHost('fe80::1')).toBe(true);
    });
  });

  describe('Search Grounding Response Extraction', () => {
    it('extracts links from clean JSON response', () => {
      const raw = JSON.stringify({
        links: [
          {
            url: 'https://zerogpt.com/ai-detector',
            title: 'AI Detector Tool',
            anchorText: 'AI detector',
            reason: 'Relevant tool for AI content verification',
          },
          {
            url: 'https://zerogpt.com/pricing',
            title: 'Pricing Plans',
            anchorText: 'subscription options',
            reason: 'Link to pricing overview',
          },
        ],
      });

      const extracted = extractLinksFromJsonResponse(raw, 'zerogpt.com');
      expect(extracted.length).toBe(2);
      expect(extracted[0].url).toBe('https://zerogpt.com/ai-detector');
      expect(extracted[0].title).toBe('AI Detector Tool');
      expect(extracted[0].anchorText).toBe('AI detector');
    });

    it('extracts links wrapped in markdown code blocks and conversational text', () => {
      const raw = `Here are the verified internal links discovered for zerogpt.com:
\`\`\`json
{
  "links": [
    {
      "url": "https://zerogpt.com/grammar-checker",
      "title": "Grammar Checker",
      "anchorText": "grammar checker",
      "reason": "Fix grammatical errors online"
    }
  ]
}
\`\`\`
Let me know if you need more recommendations.`;

      const extracted = extractLinksFromJsonResponse(raw, 'zerogpt.com');
      expect(extracted.length).toBe(1);
      expect(extracted[0].url).toBe('https://zerogpt.com/grammar-checker');
      expect(extracted[0].title).toBe('Grammar Checker');
    });

    it('filters out URLs belonging to unrelated foreign domains', () => {
      const raw = JSON.stringify({
        links: [
          {
            url: 'https://zerogpt.com/features',
            title: 'Features',
            anchorText: 'features',
            reason: 'Internal feature page',
          },
          {
            url: 'https://external-competitor.com/blog',
            title: 'External Blog',
            anchorText: 'external',
            reason: 'Unrelated domain',
          },
        ],
      });

      const extracted = extractLinksFromJsonResponse(raw, 'zerogpt.com');
      expect(extracted.length).toBe(1);
      expect(extracted[0].url).toBe('https://zerogpt.com/features');
    });
  });

  describe('Article Relevance & Anchor Text Grounding', () => {
    const article = `Artificial intelligence is changing how people create content. Using an AI detector can help identify synthetic text patterns. Furthermore, writers often review grammar and readability before publishing their work online.`;

    it('identifies exact existing anchor text in article with precise start/end offsets', () => {
      const candidateLinks = [
        {
          url: 'https://zerogpt.com/ai-detector',
          title: 'AI Detector',
          anchorText: 'AI detector',
          reason: 'Matches exact phrase in article',
        },
      ];

      const matched = matchInternalLinksToArticle(candidateLinks, article, 'ai detector');
      expect(matched.length).toBe(1);
      expect(matched[0].isExistingAnchor).toBe(true);
      expect(matched[0].anchorText).toBe('AI detector');
      expect(matched[0].start).toBeDefined();
      expect(matched[0].end).toBeDefined();
      expect(article.slice(matched[0].start!, matched[0].end!)).toBe('AI detector');
      expect(matched[0].contextSnippet).toContain('Using an AI detector can help');
    });

    it('distinguishes existing anchor opportunity from suggested new wording', () => {
      const candidateLinks = [
        {
          url: 'https://zerogpt.com/pricing-plans',
          title: 'Pricing Plans Guide',
          anchorText: 'pricing plans guide',
          reason: 'Suggested new insertion for pricing',
        },
      ];

      const matched = matchInternalLinksToArticle(candidateLinks, article, 'pricing plans guide');
      expect(matched.length).toBe(1);
      expect(matched[0].isExistingAnchor).toBe(false);
      expect(matched[0].start).toBeUndefined();
      expect(matched[0].end).toBeUndefined();
      expect(matched[0].anchorText).toBe('pricing plans guide');
      expect(matched[0].contextSnippet).toBeDefined();
      expect(matched[0].sentenceIndex).toBeDefined();
    });

    it('filters out weak candidates that fail the quality threshold (< 60)', () => {
      const weakCandidateLinks = [
        {
          url: 'https://zerogpt.com/random-unrelated-topic',
          title: 'Unrelated Car Repair Guide',
          anchorText: 'car repair',
          reason: 'Irrelevant topic',
        },
      ];

      const matched = matchInternalLinksToArticle(weakCandidateLinks, article, 'ai detector', ['plagiarism']);
      expect(matched.length).toBe(0); // Correctly suppressed
    });

    it('penalizes and filters out generic anchors like "click here" or "read more"', () => {
      const genericAnchorLinks = [
        {
          url: 'https://zerogpt.com/features',
          title: 'Features',
          anchorText: 'click here',
          reason: 'Generic anchor',
        },
      ];

      const matched = matchInternalLinksToArticle(genericAnchorLinks, article, 'ai detector');
      expect(matched.length).toBe(0); // Suppressed
    });

    it('rewards destination pages that align with locked primary and related keywords', () => {
      const strongCandidates = [
        {
          url: 'https://zerogpt.com/ai-detector-accuracy',
          title: 'AI Detector Accuracy Benchmark',
          anchorText: 'AI detector',
          reason: 'Direct match for target primary keyword',
        },
        {
          url: 'https://zerogpt.com/grammar-checker-tool',
          title: 'Grammar and Readability Checker',
          anchorText: 'grammar and readability',
          reason: 'Matches supporting topic in article',
        },
      ];

      const matched = matchInternalLinksToArticle(strongCandidates, article, 'ai detector', ['grammar analysis']);
      expect(matched.length).toBe(2);
      expect(matched[0].relevanceScore).toBeGreaterThanOrEqual(50);
      expect(matched[0].relevanceTier).toBeDefined();
      expect(matched[0].isExistingAnchor).toBe(true);
    });
  });

  describe('Anchor Text Quality Validation & Descriptive Phrase Expansion', () => {
    it('rejects isolated generic single words (word, tool, page, text, content, etc.)', () => {
      expect(validateAnchorQuality('word').valid).toBe(false);
      expect(validateAnchorQuality('words').valid).toBe(false);
      expect(validateAnchorQuality('tool').valid).toBe(false);
      expect(validateAnchorQuality('text').valid).toBe(false);
      expect(validateAnchorQuality('content').valid).toBe(false);
      expect(validateAnchorQuality('click here').valid).toBe(false);
      expect(validateAnchorQuality('read more').valid).toBe(false);
      expect(validateAnchorQuality('page').valid).toBe(false);
      expect(validateAnchorQuality('information').valid).toBe(false);
    });

    it('accepts specific proper nouns, technical entities, and model names as single-word anchors', () => {
      expect(validateAnchorQuality('ChatGPT').valid).toBe(true);
      expect(validateAnchorQuality('BERT').valid).toBe(true);
      expect(validateAnchorQuality('OpenAI').valid).toBe(true);
      expect(validateAnchorQuality('stylometry').valid).toBe(true);
      expect(validateAnchorQuality('tokenization').valid).toBe(true);
      expect(validateAnchorQuality('Claude').valid).toBe(true);
    });

    it('accepts descriptive multi-word phrases (2-6 words)', () => {
      expect(validateAnchorQuality('complete word').valid).toBe(true);
      expect(validateAnchorQuality('AI detector').valid).toBe(true);
      expect(validateAnchorQuality('word count analysis').valid).toBe(true);
      expect(validateAnchorQuality('large language models').valid).toBe(true);
      expect(validateAnchorQuality('synthetic text patterns').valid).toBe(true);
    });

    it('expands generic single word to natural descriptive phrase in sentence', () => {
      const sentence = 'A token can represent a complete word, part of a word, punctuation, or another textual unit depending on the language and tokenizer.';
      
      const expanded = expandToDescriptivePhraseInSentence(sentence, 'word', ['word', 'counter', 'tokenizer']);
      expect(expanded).toBe('complete word');

      const expandedUnit = expandToDescriptivePhraseInSentence(sentence, 'unit', ['textual', 'unit']);
      expect(expandedUnit).toBe('textual unit');
    });

    it('automatically expands generic "word" anchor into "complete word" during article matching', () => {
      const articleText = 'A token can represent a complete word, part of a word, punctuation, or another textual unit depending on the language and tokenizer.';
      const candidateLinks = [
        {
          url: 'https://zerogpt.com/word-counter',
          title: 'Word Counter & Token Analyzer',
          anchorText: 'word',
          reason: 'Count words in article',
        },
      ];

      const matched = matchInternalLinksToArticle(candidateLinks, articleText, 'tokenization');
      expect(matched.length).toBe(1);
      expect(matched[0].isExistingAnchor).toBe(true);
      // Confirmed: expands generic 'word' to natural descriptive phrase 'complete word'
      expect(matched[0].anchorText).toBe('complete word');
      expect(matched[0].start).toBeDefined();
      expect(matched[0].end).toBeDefined();
      expect(articleText.slice(matched[0].start!, matched[0].end!)).toBe('complete word');
    });

    it('expands generic "history" candidate to descriptive phrase "version history" or "analysis history"', () => {
      const sentence1 = 'Writers can review the complete version history of their document to track changes.';
      const expanded1 = expandToDescriptivePhraseInSentence(sentence1, 'history', ['version', 'history', 'revisions']);
      expect(expanded1).toBe('version history');

      const sentence2 = 'Access your past scan history from the user account dashboard.';
      const expanded2 = expandToDescriptivePhraseInSentence(sentence2, 'history', ['scan', 'history', 'scans']);
      expect(expanded2).toBe('scan history');
    });

    it('rejects generic "history" as standalone anchor when not part of descriptive phrase', () => {
      expect(validateAnchorQuality('history').valid).toBe(false);
      expect(validateAnchorQuality('data').valid).toBe(false);
      expect(validateAnchorQuality('tool').valid).toBe(false);
      expect(validateAnchorQuality('content').valid).toBe(false);
    });

    it('handles 3,000+ word articles with anchors at beginning, middle, and end without offset drift', () => {
      const filler = 'The quick brown fox jumps over the lazy dog and writes detailed articles with natural style. ';
      const paragraph = filler.repeat(20); // ~320 words per paragraph
      
      const doc = [
        'Beginning: We evaluate large language models on initial generation tasks.\n\n',
        paragraph, '\n\n',
        paragraph, '\n\n',
        paragraph, '\n\n',
        'Middle: Testing verified AI detection accuracy across multi-source benchmarks.\n\n',
        paragraph, '\n\n',
        paragraph, '\n\n',
        paragraph, '\n\n',
        'End: Review the full analysis history before submitting final drafts.\n\n'
      ].join('');

      expect(doc.split(/\s+/).length).toBeGreaterThan(1500);

      const candidates = [
        {
          url: 'https://zerogpt.com/llm-guide',
          title: 'Guide to Large Language Models',
          anchorText: 'large language models'
        },
        {
          url: 'https://zerogpt.com/ai-detector-accuracy',
          title: 'AI Detector Accuracy Benchmarks',
          anchorText: 'AI detection accuracy'
        },
        {
          url: 'https://zerogpt.com/history-dashboard',
          title: 'User Scan History Dashboard',
          anchorText: 'history'
        }
      ];

      const matched = matchInternalLinksToArticle(candidates, doc);
      expect(matched.length).toBe(3);
      
      // Candidate 1: Beginning
      expect(matched[0].anchorText).toBe('large language models');
      expect(matched[0].isExistingAnchor).toBe(true);
      expect(doc.slice(matched[0].start!, matched[0].end!)).toBe('large language models');

      // Candidate 2: Middle
      expect(matched[1].anchorText).toBe('AI detection accuracy');
      expect(matched[1].isExistingAnchor).toBe(true);
      expect(doc.slice(matched[1].start!, matched[1].end!)).toBe('AI detection accuracy');

      // Candidate 3: End - expanded from generic 'history' to 'analysis history'
      expect(matched[2].anchorText).toBe('analysis history');
      expect(matched[2].isExistingAnchor).toBe(true);
      expect(doc.slice(matched[2].start!, matched[2].end!)).toBe('analysis history');
    });

    it('rejects weak/irrelevant pages and qualifies only contextually relevant destinations', () => {
      const articleText = 'Understanding perplexity and burstiness in AI text detection is essential for content quality. We use advanced statistical models to distinguish synthetic prose from human writing.';
      
      const candidateLinks = [
        // Relevant candidate 1 (Topic & Context fit)
        {
          url: 'https://zerogpt.com/perplexity-explained',
          title: 'Understanding Perplexity in Large Language Models',
          anchorText: 'perplexity and burstiness'
        },
        // Relevant candidate 2 (Technical topic fit)
        {
          url: 'https://zerogpt.com/ai-text-detection',
          title: 'AI Text Detection Guide',
          anchorText: 'AI text detection'
        },
        // Irrelevant candidate (Cooking / unrelated page with minimal or no topic match)
        {
          url: 'https://zerogpt.com/best-coffee-recipes',
          title: 'Best Artisan Coffee Recipes',
          anchorText: 'coffee recipes'
        },
        // Generic page with generic words only (e.g., "Best Online Tools", generic stopword match)
        {
          url: 'https://zerogpt.com/tools',
          title: 'Online Tools and Free Services',
          anchorText: 'tools'
        }
      ];

      const matched = matchInternalLinksToArticle(candidateLinks, articleText, 'ai text detection', ['perplexity score']);
      
      // Only the 2 relevant candidates should qualify (score >= 50)
      expect(matched.length).toBe(2);
      expect(matched.map(m => m.url)).toEqual([
        'https://zerogpt.com/ai-text-detection',
        'https://zerogpt.com/perplexity-explained'
      ]);
      expect(matched[0].recommendationBasis).toBeDefined();
      expect(['Keyword/Intent Match', 'Contextual Match', 'Topic Match', 'Supporting Resource']).toContain(matched[0].recommendationBasis);
    });

    it('produces appropriately different recommendations for two unrelated articles on the same domain', () => {
      const domainPool = [
        {
          url: 'https://example.com/ai-detection-guide',
          title: 'Comprehensive Guide to AI Detection',
          anchorText: 'AI detection methods'
        },
        {
          url: 'https://example.com/tokenization-mechanisms',
          title: 'Language Model Tokenization Explained',
          anchorText: 'tokenization mechanisms'
        },
        {
          url: 'https://example.com/keyword-research-tools',
          title: 'Top Keyword Research Strategies for SEO',
          anchorText: 'keyword research strategies'
        },
        {
          url: 'https://example.com/backlink-outreach',
          title: 'How to Build Quality Editorial Backlinks',
          anchorText: 'editorial backlinks'
        }
      ];

      // Article A: Technical AI & LLM Topic
      const articleA = 'Modern neural networks process text using tokenization mechanisms before computing transformer attention weights. Accurate AI detection methods examine these distribution patterns.';
      const matchedA = matchInternalLinksToArticle(domainPool, articleA, 'tokenization', ['AI detection']);

      // Article B: SEO & Link Building Topic
      const articleB = 'To grow organic search visibility, bloggers must master keyword research strategies and secure high-authority editorial backlinks from reputable industry websites.';
      const matchedB = matchInternalLinksToArticle(domainPool, articleB, 'keyword research', ['backlinks']);

      // Assert that Article A and Article B receive completely different, topic-specific recommendations
      expect(matchedA.map(m => m.url)).toEqual([
        'https://example.com/tokenization-mechanisms',
        'https://example.com/ai-detection-guide'
      ]);

      expect(matchedB.map(m => m.url)).toEqual([
        'https://example.com/keyword-research-tools',
        'https://example.com/backlink-outreach'
      ]);
    });
  });

  describe('Primary Keyword Intent Interpretation & Long-Tail Query Integrity', () => {
    it('never slices multi-word primary keyword into isolated single tokens or mislabels "detect" as the primary keyword', () => {
      const lockedPrimaryKeyword = 'How Do AI Detectors Detect ChatGPT-Generated Text';
      const articleText = 'When analyzing how machine learning systems evaluate prose, a token can represent a complete word, part of a word, punctuation, or another textual unit depending on the language and tokenizer. AI detectors compute statistical perplexity across sentences.';

      const candidates = [
        {
          url: 'https://www.aidetector.cx/word-counter',
          title: 'Word Counter',
          anchorText: 'word',
          reason: 'Count words in article'
        },
        {
          url: 'https://www.aidetector.cx/how-ai-detectors-work',
          title: 'How AI Detectors Detect ChatGPT Text',
          anchorText: 'how machine learning systems evaluate prose',
          reason: 'Technical guide to AI detection'
        }
      ];

      const matched = matchInternalLinksToArticle(candidates, articleText, lockedPrimaryKeyword);

      // Check Candidate 1: Word Counter with anchor "complete word"
      const wordCounterMatch = matched.find(m => m.url.includes('word-counter'));
      if (wordCounterMatch) {
        // Must NEVER claim it aligns with primary keyword concept "detect"
        expect(wordCounterMatch.reason).not.toMatch(/aligns with primary keyword concept "detect"/i);
        expect(wordCounterMatch.reason).not.toMatch(/primary keyword.*"detect"/i);
        expect(wordCounterMatch.recommendationBasis).not.toBe('Keyword/Intent Match');
        // If present, must be truthful contextual reference
        expect(['Contextual Match', 'Supporting Resource', 'Topic Match']).toContain(wordCounterMatch.recommendationBasis);
      }

      // Check Candidate 2: Genuine search intent match
      const aiDetectorMatch = matched.find(m => m.url.includes('how-ai-detectors-work'));
      expect(aiDetectorMatch).toBeDefined();
      expect(aiDetectorMatch?.recommendationBasis).toBe('Keyword/Intent Match');
      expect(aiDetectorMatch?.reason).toContain(lockedPrimaryKeyword);
    });

    it('correctly evaluates search intent for multi-word long-tail keywords and questions', () => {
      // Test Case 1: "What Percentage of AI Detection Is Allowed in College"
      const pk1 = 'What Percentage of AI Detection Is Allowed in College';
      const article1 = 'Universities and professors are debating acceptable thresholds for artificial intelligence in student papers. Knowing what percentage of AI detection is allowed in college helps students maintain academic integrity.';
      const candidates1 = [
        {
          url: 'https://example.com/college-ai-detection-thresholds',
          title: 'College AI Detection Threshold Policies',
          anchorText: 'percentage of AI detection is allowed in college'
        },
        {
          url: 'https://example.com/college-admissions-rankings',
          title: 'Top College Admissions and Campus Life Rankings',
          anchorText: 'college'
        }
      ];

      const matched1 = matchInternalLinksToArticle(candidates1, article1, pk1);
      const policyMatch = matched1.find(m => m.url.includes('thresholds'));
      const admissionsMatch = matched1.find(m => m.url.includes('admissions'));

      expect(policyMatch).toBeDefined();
      expect(policyMatch?.recommendationBasis).toBe('Keyword/Intent Match');
      expect(policyMatch?.reason).toContain(pk1);

      // Admissions guide sharing only single token "college" must NOT be treated as a keyword-intent match
      if (admissionsMatch) {
        expect(admissionsMatch.recommendationBasis).not.toBe('Keyword/Intent Match');
        expect(admissionsMatch.reason).not.toMatch(/primary.*college/i);
      }

      // Test Case 2: "Why Human Writing Gets Flagged as AI"
      const pk2 = 'Why Human Writing Gets Flagged as AI';
      const article2 = 'False positive detection rates remain a major concern for academic and professional authors. Understanding why human writing gets flagged as AI allows authors to adjust repetitive syntactic patterns.';
      const candidates2 = [
        {
          url: 'https://example.com/why-human-writing-flagged-as-ai',
          title: 'Why Human Writing Gets Flagged as AI: False Positives Explained',
          anchorText: 'why human writing gets flagged as AI'
        },
        {
          url: 'https://example.com/creative-writing-prompts',
          title: 'Daily Creative Writing Prompts and Inspiration',
          anchorText: 'writing'
        }
      ];

      const matched2 = matchInternalLinksToArticle(candidates2, article2, pk2);
      const falsePositiveMatch = matched2.find(m => m.url.includes('why-human-writing-flagged-as-ai'));
      const creativeWritingMatch = matched2.find(m => m.url.includes('creative-writing-prompts'));

      expect(falsePositiveMatch).toBeDefined();
      expect(falsePositiveMatch?.recommendationBasis).toBe('Keyword/Intent Match');
      expect(falsePositiveMatch?.reason).toContain(pk2);

      // Creative writing prompts sharing only single token "writing" must NOT be treated as a keyword-intent match
      if (creativeWritingMatch) {
        expect(creativeWritingMatch.recommendationBasis).not.toBe('Keyword/Intent Match');
        expect(creativeWritingMatch.reason).not.toMatch(/primary.*writing/i);
      }
    });
  });
});
