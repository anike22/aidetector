import { describe, it, expect, beforeEach } from 'vitest';
import {
  analyzeSemanticKeywords,
  clearSemanticKeywordsCache,
  generateSemanticCacheKey,
  type CompetitorInput,
} from '@/lib/seo/semanticKeywordsEngine';

describe('SEMANTIC KEYWORDS COVERAGE ACCURACY - Acceptance Test Suite', () => {
  beforeEach(() => {
    clearSemanticKeywordsCache();
  });

  // ─── TEST A: AI Detector ───────────────────────────────────────────────────
  it('TEST A: Generates relevant AI detection semantic recommendations dynamically', () => {
    const primaryKeyword = 'AI detector';
    const content = `# Evaluating Modern AI Detector Reliability

In digital publishing, an AI detector analyzes perplexity and burstiness to identify AI-generated text.
Many content creators worry about false positives when machine learning models evaluate human writing.
Modern language models like ChatGPT produce smooth syntax, but detection systems look for statistical uniformity.
To minimize false positives, detectors employ pattern recognition and perplexity score analysis.`;

    const result = analyzeSemanticKeywords(content, primaryKeyword);

    expect(result.recommended.length).toBeGreaterThanOrEqual(5);
    expect(result.totalAnalyzed).toBeGreaterThanOrEqual(5);

    // Should include concepts relevant to AI detection
    const allTerms = result.recommended.join(' ').toLowerCase();
    const hasAiDetection = allTerms.includes('ai') || allTerms.includes('detect');
    const hasNlpTerms =
      allTerms.includes('perplexity') ||
      allTerms.includes('burstiness') ||
      allTerms.includes('false positives') ||
      allTerms.includes('language models') ||
      allTerms.includes('machine learning') ||
      allTerms.includes('pattern recognition');

    expect(hasAiDetection).toBe(true);
    expect(hasNlpTerms).toBe(true);

    // Verify item-level metadata
    expect(result.items.length).toBe(result.recommended.length);
    const item = result.items[0];
    expect(item).toHaveProperty('term');
    expect(item).toHaveProperty('sourceType');
    expect(item).toHaveProperty('userCount');
    expect(item).toHaveProperty('recommendedCount');
    expect(item).toHaveProperty('status');
    expect(item).toHaveProperty('relevanceScore');
    expect(item).toHaveProperty('confidence');
  });

  // ─── TEST B: Bitcoin Mining Hardware ───────────────────────────────────────
  it('TEST B: Generates mining-related semantic recommendations substantially different from Test A', () => {
    const aiKeyword = 'AI detector';
    const aiContent = `An AI detector inspects perplexity, burstiness, and language model patterns to flag synthetic content.`;
    const aiResult = analyzeSemanticKeywords(aiContent, aiKeyword);

    const btcKeyword = 'Bitcoin mining hardware';
    const btcContent = `# Complete Guide to Bitcoin Mining Hardware

Selecting high-performance Bitcoin mining hardware requires analyzing ASIC miners, hash rate, and power consumption.
Modern mining rigs operate with high energy cost, making mining efficiency paramount.
Units like the Antminer deliver terahashes of computational power, but require specialized cooling systems
to maintain hardware longevity and maximize mining profitability.`;

    const btcResult = analyzeSemanticKeywords(btcContent, btcKeyword);

    expect(btcResult.recommended.length).toBeGreaterThanOrEqual(5);

    const btcTerms = btcResult.recommended.join(' ').toLowerCase();
    const hasBtcConcepts =
      btcTerms.includes('asic') ||
      btcTerms.includes('hash') ||
      btcTerms.includes('mining') ||
      btcTerms.includes('power consumption') ||
      btcTerms.includes('hardware') ||
      btcTerms.includes('antminer');

    expect(hasBtcConcepts).toBe(true);

    // Test A and Test B must NOT share static/generic recommendations
    // In the old broken engine, both returned generic NLP_BANKS default words
    const aiSet = new Set(aiResult.recommended);
    const commonCount = btcResult.recommended.filter((term) => aiSet.has(term)).length;
    // Common terms between AI detection and Bitcoin mining must be minimal (<= 1 if any)
    expect(commonCount).toBeLessThanOrEqual(1);

    // Old static fallback words must NOT appear as default recommendations
    expect(btcTerms).not.toContain('case study');
    expect(btcTerms).not.toContain('actionable tips');
  });

  // ─── TEST C: Same Keyword, Substantially Different Content Context ─────────
  it('TEST C: Recommendations adapt when article topic/context changes under the same keyword', () => {
    const keyword = 'Apple';

    // Context 1: Apple as agricultural fruit and orchard cultivation
    const orchardContent = `# Honeycrisp Apple Orchard Management

Growing crisp organic apples requires nutrient-rich orchard soil, proper tree pruning, and pest control.
Harvesting honeycrisp cultivars involves monitoring fruit firmness, sugar levels, and cold storage humidity.
Orchard irrigation during early spring bloom prevents premature fruit drop.`;

    // Context 2: Apple as consumer electronics and Silicon Valley corporation
    const techContent = `# Inside Apple Silicon Architecture and M3 Chips

Apple engineered the M3 microprocessor with unified memory, high GPU core counts, and thermal efficiency.
The Cupertino tech giant transitioned MacBooks away from Intel processors toward proprietary ARM silicon.
Benchmarking Geekbench single-core performance reveals massive battery life and hardware acceleration gains.`;

    const orchardResult = analyzeSemanticKeywords(orchardContent, keyword);
    const techResult = analyzeSemanticKeywords(techContent, keyword);

    const orchardTerms = orchardResult.recommended.join(' ').toLowerCase();
    const techTerms = techResult.recommended.join(' ').toLowerCase();

    // Orchard content should discover fruit/orchard terms
    expect(
      orchardTerms.includes('orchard') ||
      orchardTerms.includes('fruit') ||
      orchardTerms.includes('harvest') ||
      orchardTerms.includes('honeycrisp') ||
      orchardTerms.includes('soil')
    ).toBe(true);

    // Tech content should discover chip/hardware terms
    expect(
      techTerms.includes('silicon') ||
      techTerms.includes('m3') ||
      techTerms.includes('chips') ||
      techTerms.includes('gpu') ||
      techTerms.includes('macbook') ||
      techTerms.includes('processors')
    ).toBe(true);

    // They must not be identical
    expect(orchardResult.recommended).not.toEqual(techResult.recommended);
  });

  // ─── TEST D: Identical Content, Different Primary Keyword ──────────────────
  it('TEST D: Semantic priorities and rankings change when primary keyword changes on identical content', () => {
    const hybridContent = `# Cybersecurity Protocols in Cloud Computing Infrastructure

Modern cloud computing platforms require zero trust architecture and strict identity access management.
Securing enterprise cybersecurity boundaries involves end-to-end encryption, automated penetration testing,
and continuous cloud vulnerability scanning to protect multi-tenant cloud storage clusters.`;

    const resultCyber = analyzeSemanticKeywords(hybridContent, 'Cybersecurity protocols');
    const resultCloud = analyzeSemanticKeywords(hybridContent, 'Cloud computing infrastructure');

    // Both should extract terms, but their top priorities and primary derivations differ
    expect(resultCyber.recommended[0]).not.toEqual(resultCloud.recommended[0]);
    expect(resultCyber.recommended.join(' ')).toContain('cybersecurity');
    expect(resultCloud.recommended.join(' ')).toContain('cloud');
  });

  // ─── TEST E: Competitor Data Available ─────────────────────────────────────
  it('TEST E: Integrates real competitor SERP evidence and attributes sources', () => {
    const keyword = 'electric vehicle charging speed';
    const content = `# How Fast Do Electric Vehicles Charge?
    
Electric cars charge at different rates depending on level 2 home chargers and level 3 DC fast charging.
Battery temperature and state of charge influence overall charging time.`;

    const realCompetitors: CompetitorInput[] = [
      {
        url: 'https://ev-database.org/charging-speeds',
        title: 'EV Charging Speeds: Level 2 vs DC Fast Charging',
        h2Headings: ['DC Fast Charging Curves', 'Kilowatt Charging Capacity', 'Battery Preconditioning'],
        keywordsUsed: ['charging curve', 'kilowatt capacity', 'dc fast charging', 'battery preconditioning'],
      },
      {
        url: 'https://insideevs.com/guide/charging-times',
        title: 'Ultimate EV Charging Guide',
        h2Headings: ['Level 2 Charging Times', 'DC Fast Charging Curves', 'Battery Temperature Management'],
        keywordsUsed: ['charging curve', 'dc fast charging', 'level 2 charging'],
      },
    ];

    const result = analyzeSemanticKeywords(content, keyword, realCompetitors);

    expect(result.competitorStatus).toBe('active');
    expect(result.evidenceSourceSummary.competitorTerms).toBeGreaterThan(0);

    // Competitor consensus terms (e.g. "charging curve" or "dc fast charging") should have competitor evidence
    const compItem = result.items.find((i) => i.competitorEvidence && i.competitorEvidence.competitorsCount >= 2);
    expect(compItem).toBeDefined();
    if (compItem && compItem.competitorEvidence) {
      expect(compItem.competitorEvidence.competitorsCount).toBeGreaterThanOrEqual(2);
      expect(compItem.competitorEvidence.sampleSources.length).toBeGreaterThan(0);
      expect(compItem.sourceType === 'competitor_serp' || compItem.sourceType === 'combined').toBe(true);
    }
  });

  // ─── TEST F: Competitor Retrieval Unavailable ──────────────────────────────
  it('TEST F: Does NOT fabricate competitor data when competitor retrieval is unavailable', () => {
    const keyword = 'organic composting methods';
    const content = `# Best Practices for Backyard Composting
    
Aerobic composting requires a balanced ratio of nitrogen greens and carbon browns.
Turning the compost pile regularly maintains high internal temperatures and speeds up microbial decomposition.`;

    // Test with null, undefined, and empty array
    const resultNull = analyzeSemanticKeywords(content, keyword, null);
    const resultEmpty = analyzeSemanticKeywords(content, keyword, []);

    expect(resultNull.competitorStatus).toBe('unavailable');
    expect(resultEmpty.competitorStatus).toBe('unavailable');

    // No item should claim competitor evidence
    for (const item of resultNull.items) {
      expect(item.competitorEvidence).toBeNull();
      expect(item.sourceType).not.toBe('competitor_serp');
    }
    for (const item of resultEmpty.items) {
      expect(item.competitorEvidence).toBeNull();
      expect(item.sourceType).not.toBe('competitor_serp');
    }

    expect(resultNull.evidenceSourceSummary.competitorTerms).toBe(0);
  });

  // ─── TEST G: Deterministic Caching & Invalidation ──────────────────────────
  it('TEST G: Identical inputs return cached results; modifications invalidate and recalculate', () => {
    const kw = 'remote work ergonomics';
    const content = `# Ergonomic Workspace Setup
    
Adjust your monitor height to eye level and keep your elbows at a 90-degree angle.
Using an adjustable standing desk and ergonomic lumbar support chair relieves spinal strain.`;

    // 1. Initial analysis
    const result1 = analyzeSemanticKeywords(content, kw);

    // 2. Identical repeat - should hit cache
    const key1 = generateSemanticCacheKey(kw, content);
    const key2 = generateSemanticCacheKey(kw, content);
    expect(key1).toBe(key2);

    const result2 = analyzeSemanticKeywords(content, kw);
    expect(result2).toEqual(result1);

    // 3. Modified content - cache key changes and invalidates
    const modifiedContent = `${content}\n\nFrequent microbreaks and carpal tunnel wrist stretches further prevent repetitive strain injuries.`;
    const keyModified = generateSemanticCacheKey(kw, modifiedContent);
    expect(keyModified).not.toBe(key1);

    const resultModified = analyzeSemanticKeywords(modifiedContent, kw);
    expect(resultModified).not.toEqual(result1);

    // 4. Modified keyword - cache key changes and invalidates
    const diffKw = 'standing desk benefits';
    const keyDiffKw = generateSemanticCacheKey(diffKw, content);
    expect(keyDiffKw).not.toBe(key1);

    const resultDiffKw = analyzeSemanticKeywords(content, diffKw);
    expect(resultDiffKw.recommended).not.toEqual(result1.recommended);
  });

  // ─── Additional Verification: Coverage Classification ───────────────────────
  it('Correctly classifies coverage status (missing, underused, covered, well_covered) and dynamic usage range', () => {
    const kw = 'solar energy system';
    // Word count ~120 words. Term "photovoltaic panels" appears once, "solar inverters" appears 0 times, "solar energy" appears 3 times.
    const content = `# Installing a Home Solar Energy System
    
A residential solar energy system converts sunlight into electricity.
Investing in clean solar energy reduces household utility bills.
With high-efficiency photovoltaic panels on your roof, power generation remains consistent during sunny days.
Overall, solar energy is an economical long-term choice.`;

    const result = analyzeSemanticKeywords(content, kw);

    const items = result.items;
    expect(items.length).toBeGreaterThan(0);

    for (const item of items) {
      // Dynamic recommended count
      expect(item.recommendedCount.min).toBeGreaterThanOrEqual(1);
      expect(item.recommendedCount.max).toBeGreaterThanOrEqual(item.recommendedCount.min);

      // Verify status logic
      if (item.userCount === 0) {
        expect(item.status).toBe('missing');
      } else if (item.userCount < item.recommendedCount.min) {
        expect(item.status).toBe('underused');
      } else if (item.userCount > item.recommendedCount.max) {
        expect(item.status).toBe('well_covered');
      } else {
        expect(item.status).toBe('covered');
      }
    }
  });
});
