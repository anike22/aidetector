import { describe, it, expect } from 'vitest';
import {
  analyzeEEAT,
  classifyArticleType,
  extractFactualAndStatisticalClaims,
  detectExistingEvidence,
  generateDynamicEEATOpportunities,
  clearEEATCache,
} from '@/lib/seo/eeatIntelligenceEngine';

describe('Contextual E-E-A-T Intelligence Engine Tests', () => {
  // TEST A: AI detector benchmark article containing real methodology.
  it('TEST A: AI detector benchmark article containing real methodology uses existing evidence', () => {
    clearEEATCache();
    const benchmarkContent = `
      # Empirical Benchmark of AI Detectors Across 500 Academic Essays
      Written by Dr. Elena Vance, Senior Computational Linguistics Researcher.

      ## Testing Methodology
      In our lab evaluation, we tested across 500 verified human essays and 500 GPT-4 generated essays under controlled prompt conditions.
      Our sample size of 1000 documents was evaluated across five commercial detection engines.
      
      ## Results and False Positive Observations
      We measured a false positive rate of 4.2% on non-native English writing.
      According to research published by Stanford NLP Group (https://stanford.edu/nlp-detector-study), syntactic complexity heavily skews perplexity metrics.
    `;

    const result = analyzeEEAT(benchmarkContent, 'AI detector benchmark');

    expect(result.hasPersonalExamples).toBe(true);
    expect(result.hasStats).toBe(true);
    expect(result.hasCitations).toBe(true);
    expect(result.hasAuthor).toBe(true);
    expect(result.articleType).toBe('benchmark');

    // Experience recommendations should use existing evidence or provide methodology synthesis rather than demanding input
    const methodologyOpp = result.opportunities?.find(o => o.type === 'methodology');
    expect(methodologyOpp).toBeDefined();
    expect(methodologyOpp?.evidenceStatus).toBe('ready_to_insert');
    expect(methodologyOpp?.suggestedText).toContain('Evaluation Framework & Test Summary');
  });

  // TEST B: AI detector article containing NO testing evidence.
  it('TEST B: AI detector article with NO testing evidence requests real experience and NEVER fabricates tests', () => {
    clearEEATCache();
    const conceptualAIArticle = `
      # What Are AI Detectors and How Do They Work?
      AI detectors analyze text to determine whether it was written by an artificial intelligence model or a human.
      They rely on statistical patterns such as perplexity and burstiness.
      Higher perplexity indicates more unpredictable word choices, which typically indicates human writing.
    `;

    const result = analyzeEEAT(conceptualAIArticle, 'AI detectors');

    expect(result.hasPersonalExamples).toBe(false);

    // CRITICAL NON-FABRICATION RULE:
    // Must NOT generate fabricated phrases like "In our practical tests...", "We tested...", "In our hands-on tests..."
    const opportunities = result.opportunities || [];
    for (const opp of opportunities) {
      expect(opp.suggestedText).not.toMatch(/In our hands-on evaluation of/i);
      expect(opp.suggestedText).not.toMatch(/In our practical tests and hands-on testing/i);
      expect(opp.suggestedText).not.toMatch(/We tested across/i);
    }

    // Must request genuine author input instead
    const expOpp = opportunities.find(o => o.type === 'experience');
    expect(expOpp).toBeDefined();
    expect(expOpp?.evidenceStatus).toBe('author_input_required');
    expect(expOpp?.reason).toContain('without documented first-hand test results');
  });

  // TEST C: Article containing unsupported statistic: "AI detectors achieve 99% accuracy."
  it('TEST C: flags unsupported quantitative accuracy claim for authoritative evidence or qualification', () => {
    clearEEATCache();
    const unsupportedStatArticle = `
      # Choosing the Right Detection Software
      Many tools claim to detect synthetic writing instantly.
      AI detectors achieve 99% accuracy across standard essays.
      This allows teachers and editors to spot generated content immediately.
    `;

    const result = analyzeEEAT(unsupportedStatArticle, 'AI detectors');

    // Should detect the statistical claim
    expect(result.detectedClaims?.some(c => c.text.includes('99%'))).toBe(true);

    // Should generate a targeted opportunity pointing to the 99% accuracy claim
    const statOpp = result.opportunities?.find(o => o.type === 'stats' && o.title.includes('99%'));
    expect(statOpp).toBeDefined();
    expect(statOpp?.evidenceStatus).toBe('source_required');
    expect(statOpp?.targetPassage).toContain('AI detectors achieve 99% accuracy');
    expect(statOpp?.severity).toBe('critical');
    expect(statOpp?.reason).toContain('requires an authoritative benchmark');

    // Should include exact offsets
    expect(statOpp?.targetStartOffset).toBeGreaterThan(0);
    expect(statOpp?.targetEndOffset).toBeGreaterThan(statOpp!.targetStartOffset);
  });

  // TEST D: Bitcoin mining article.
  it('TEST D: Bitcoin mining article generates topic-specific technical/operational opportunities differing from AI detector', () => {
    clearEEATCache();
    const cryptoMiningArticle = `
      # ASIC Bitcoin Mining Hardware Setup and Efficiency
      Written by Hardware Engineering Team.

      Mining rigs utilize specialized SHA-256 Application-Specific Integrated Circuits (ASICs).
      The Antminer S19 Pro delivers a hash rate of 110 TH/s while consuming 3250 watts of electricity.
      Proper airflow, exhaust ducting, and power distribution units are essential to maintain stable operating temperatures below 75 degrees Celsius.
    `;

    const result = analyzeEEAT(cryptoMiningArticle, 'bitcoin mining hardware');

    // Substantially differs from AI detector
    expect(result.articleType).toBe('technical');
    
    // Checks that limitations address thermal, firmware, or power supply instead of AI false positives/language models
    const limitationOpp = result.opportunities?.find(o => o.type === 'limitation');
    expect(limitationOpp).toBeDefined();
    expect(limitationOpp?.suggestedText).toContain('thermal conditions');
    expect(limitationOpp?.suggestedText).not.toContain('formulaic technical documentation');
    expect(limitationOpp?.suggestedText).not.toContain('false positive');
  });

  // TEST E: Well-cited article with strong evidence.
  it('TEST E: well-cited article with strong evidence does not repeatedly demand redundant citations', () => {
    clearEEATCache();
    const wellCitedArticle = `
      # Clinical Evaluation of Treatment Modalities
      Written by Dr. Marcus Cole, MD · Reviewed by Clinical Review Board.

      In our clinical trial cohort, we evaluated 250 patients over six months.
      The experimental protocol achieved a 78% symptom resolution rate.
      According to the New England Journal of Medicine (https://nejm.org/example-study), baseline variance remained within standard parameters.
      Technical limitations include patient compliance variability and dietary confounders.
    `;

    const result = analyzeEEAT(wellCitedArticle, 'clinical treatment evaluation');

    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.hasCitations).toBe(true);
    expect(result.hasStats).toBe(true);
    expect(result.hasAuthor).toBe(true);
    expect(result.hasPersonalExamples).toBe(true);

    // Should NOT have a generic "Authoritative Source Citations Needed" opportunity
    const citationAnchorOpp = result.opportunities?.find(o => o.id === 'eeat-citation-anchor');
    expect(citationAnchorOpp).toBeUndefined();
  });

  // TEST F: Change primary keyword and article.
  it('TEST F: dynamically changes recommendations and opportunities when keyword and article change', () => {
    clearEEATCache();

    // Run 1: AI Checker
    const text1 = 'AI detection algorithms check lexical diversity and syntactic tokens.';
    const result1 = analyzeEEAT(text1, 'best ai checker');

    // Run 2: Financial Planning
    const text2 = 'Index funds track market benchmarks and minimize management expense ratios over 30-year retirement horizons.';
    const result2 = analyzeEEAT(text2, 'index fund investing');

    expect(result1.opportunities?.length).toBeGreaterThan(0);
    expect(result2.opportunities?.length).toBeGreaterThan(0);

    // Reasons, titles, or suggested text must incorporate the specific keyword/topic
    const opp1Keywords = result1.opportunities?.map(o => o.suggestedText + ' ' + o.reason).join(' ');
    const opp2Keywords = result2.opportunities?.map(o => o.suggestedText + ' ' + o.reason).join(' ');

    expect(opp1Keywords).toContain('best ai checker');
    expect(opp2Keywords).toContain('index fund investing');
    expect(opp2Keywords).not.toContain('best ai checker');
  });

  // Non-fabrication rule checks
  it('strictly adheres to anti-fabrication guidelines (no fake URLs or study names)', () => {
    clearEEATCache();
    const article = 'Cloud computing optimizes server utilization across multiple geographic regions.';
    const result = analyzeEEAT(article, 'cloud computing architecture');

    const allText = (result.opportunities || []).map(o => o.suggestedText).join(' ');

    // Must not fabricate study names, URLs like example.com, or fake percentages
    expect(allText).not.toContain('74% of high-ranking articles');
    expect(allText).not.toContain('https://example.com/reference');
    expect(allText).not.toContain('Empirical Benchmark Analysis, 2024');
  });

  // Contextual insertion metadata check
  it('stores complete contextual insertion metadata for all opportunities', () => {
    clearEEATCache();
    const text = 'Remote work increases productivity by 22% according to general belief.';
    const result = analyzeEEAT(text, 'remote work productivity');

    expect(result.opportunities && result.opportunities.length > 0).toBe(true);
    for (const opp of result.opportunities!) {
      expect(opp.id).toBeDefined();
      expect(opp.type).toBeDefined();
      expect(typeof opp.targetStartOffset).toBe('number');
      expect(typeof opp.targetEndOffset).toBe('number');
      expect(opp.targetSection).toBeDefined();
      expect(opp.reason).toBeDefined();
      expect(opp.suggestedText).toBeDefined();
      expect(['ready_to_insert', 'author_input_required', 'source_required', 'review_required']).toContain(opp.evidenceStatus);
      expect(opp.confidence).toBeGreaterThan(0);
    }
  });
});
