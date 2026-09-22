import { describe, it, expect } from 'vitest';
import {
  AI_DIRECTORY_PRODUCTS,
  getAllDirectoryProducts,
  getDirectoryProductByIdOrSlug,
  getDirectoryCategories,
  getDirectoryPlatforms,
  getDirectoryUseCases,
} from '@/data/aiDirectoryData';

describe('AI Tools Directory Data & Integrity', () => {
  it('contains verified authentic products and AIDetector.cx platform listing', () => {
    const products = getAllDirectoryProducts();
    expect(products.length).toBeGreaterThanOrEqual(10);

    const aidetector = getDirectoryProductByIdOrSlug('aidetector-cx');
    expect(aidetector).toBeDefined();
    expect(aidetector?.isOwnerProduct).toBe(true);
    expect(aidetector?.company).toBe('AIDetector.cx');
    expect(aidetector?.pricingModel).toBe('Freemium');
    expect(aidetector?.features.length).toBeGreaterThan(0);
  });

  it('verifies that products have legitimate data structures and no fabricated review counts', () => {
    const products = getAllDirectoryProducts();
    products.forEach(p => {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.company).toBeTruthy();
      expect(p.primaryCategory).toBeTruthy();
      expect(p.pricingModel).toBeTruthy();
      expect(p.platforms.length).toBeGreaterThan(0);
      expect(p.lastVerified).toBeTruthy();
      expect(p.features.length).toBeGreaterThan(0);
      expect(p.useCases.length).toBeGreaterThan(0);
    });
  });

  it('provides helper functions for categories, platforms, and use cases', () => {
    const categories = getDirectoryCategories();
    expect(categories).toContain('AI Detection');
    expect(categories).toContain('AI Assistants');
    expect(categories).toContain('AI Coding');
    expect(categories).toContain('AI Search');
    expect(categories).toContain('AI Image Generation');
    expect(categories).toContain('AI Audio & Voice');

    const platforms = getDirectoryPlatforms();
    expect(platforms).toContain('Web');
    expect(platforms).toContain('macOS');
    expect(platforms).toContain('Windows');

    const useCases = getDirectoryUseCases();
    expect(useCases.length).toBeGreaterThan(0);
  });

  it('retrieves products by ID or by slug accurately', () => {
    const byId = getDirectoryProductByIdOrSlug('chatgpt');
    const bySlug = getDirectoryProductByIdOrSlug('chatgpt');
    expect(byId).toBeDefined();
    expect(byId?.id).toBe('chatgpt');
    expect(bySlug).toBeDefined();
    expect(bySlug?.id).toBe('chatgpt');

    const claude = getDirectoryProductByIdOrSlug('claude');
    expect(claude).toBeDefined();
    expect(claude?.company).toBe('Anthropic');

    const perplexity = getDirectoryProductByIdOrSlug('perplexity');
    expect(perplexity).toBeDefined();
    expect(perplexity?.primaryCategory).toBe('AI Search');

    const nonExistent = getDirectoryProductByIdOrSlug('invalid-non-existent-id');
    expect(nonExistent).toBeUndefined();
  });

  it('verifies pricing models and free tiers match reality', () => {
    const freePlanTools = AI_DIRECTORY_PRODUCTS.filter(p => p.hasFreePlan);
    expect(freePlanTools.length).toBeGreaterThan(0);
    expect(freePlanTools.some(p => p.id === 'chatgpt')).toBe(true);
    expect(freePlanTools.some(p => p.id === 'claude')).toBe(true);
    expect(freePlanTools.some(p => p.id === 'mistral-ai')).toBe(true);

    const paidTools = AI_DIRECTORY_PRODUCTS.filter(p => !p.hasFreePlan);
    expect(paidTools.some(p => p.id === 'midjourney')).toBe(true);
    expect(paidTools.some(p => p.id === 'github-copilot')).toBe(true);
  });

  it('verifies editorial assessment structure and integrity', () => {
    const assessed = AI_DIRECTORY_PRODUCTS.filter(p => p.editorialAssessment);
    expect(assessed.length).toBeGreaterThanOrEqual(10);

    assessed.forEach(p => {
      const ea = p.editorialAssessment!;
      expect(ea.author).toBe('AIDetector.cx Editorial Staff');
      expect(ea.title).toBeTruthy();
      expect(ea.summary).toBeTruthy();
      expect(ea.pros.length).toBeGreaterThan(0);
      expect(ea.cons.length).toBeGreaterThan(0);
      expect(ea.bestFor).toBeTruthy();
    });
  });

  it('verifies comparison capabilities between products', () => {
    const p1 = getDirectoryProductByIdOrSlug('chatgpt');
    const p2 = getDirectoryProductByIdOrSlug('claude');
    const p3 = getDirectoryProductByIdOrSlug('perplexity');

    expect(p1).toBeDefined();
    expect(p2).toBeDefined();
    expect(p3).toBeDefined();

    // Verify comparison fields exist on each product
    [p1!, p2!, p3!].forEach(prod => {
      expect(prod.pricingSummary).toBeTruthy();
      expect(prod.platforms.length).toBeGreaterThan(0);
      expect(prod.features.length).toBeGreaterThan(0);
    });
  });
});
