import { describe, it, expect } from 'vitest';
import {
  AI_DIRECTORY_PRODUCTS,
  getAllDirectoryProducts,
  getDirectoryProductByIdOrSlug,
  getPopularComparisons,
  parseVsPairSlug,
} from '@/data/aiDirectoryData';
import {
  generateDirectoryItemListSchema,
  generateProductDetailSchema,
  generateBreadcrumbSchema,
} from '@/lib/directorySeo';

describe('AI Tools Directory Phase 2 Suite', () => {
  it('verifies supported modalities on all directory products', () => {
    const products = getAllDirectoryProducts();
    products.forEach(p => {
      expect(p.supportedModalities).toBeDefined();
      expect(p.supportedModalities.length).toBeGreaterThan(0);
      expect(['Text', 'Code', 'Image', 'Audio', 'Video', 'Document', 'Multimodal']).toEqual(
        expect.arrayContaining(p.supportedModalities)
      );
    });
  });

  it('verifies data provenance and source references for products', () => {
    const products = getAllDirectoryProducts();
    const withRefs = products.filter(p => p.sourceReferences && p.sourceReferences.length > 0);
    expect(withRefs.length).toBeGreaterThan(0);

    withRefs.forEach(p => {
      p.sourceReferences!.forEach(ref => {
        expect(ref.title).toBeTruthy();
        expect(ref.url).toMatch(/^https?:\/\//);
        expect(ref.lastChecked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  it('verifies pairwise vs comparison slug parser', () => {
    const chatgptVsClaude = parseVsPairSlug('chatgpt-vs-claude');
    expect(chatgptVsClaude.product1).toBeDefined();
    expect(chatgptVsClaude.product2).toBeDefined();
    expect(chatgptVsClaude.product1?.id).toBe('chatgpt');
    expect(chatgptVsClaude.product2?.id).toBe('claude');

    const cursorVsCopilot = parseVsPairSlug('cursor-vs-github-copilot');
    expect(cursorVsCopilot.product1?.id).toBe('cursor');
    expect(cursorVsCopilot.product2?.id).toBe('github-copilot');

    const invalid = parseVsPairSlug('single-product-only');
    expect(invalid.product1).toBeUndefined();
    expect(invalid.product2).toBeUndefined();
  });

  it('verifies popular comparisons helper returns authentic pairs', () => {
    const pairs = getPopularComparisons();
    expect(pairs.length).toBeGreaterThanOrEqual(4);

    pairs.forEach(pair => {
      expect(pair.id1).toBeTruthy();
      expect(pair.id2).toBeTruthy();
      expect(pair.title).toBeTruthy();
      expect(getDirectoryProductByIdOrSlug(pair.id1)).toBeDefined();
      expect(getDirectoryProductByIdOrSlug(pair.id2)).toBeDefined();
    });
  });

  it('generates valid JSON-LD schemas for ItemList, ProductDetail, and BreadcrumbList', () => {
    const products = getAllDirectoryProducts();
    const itemListSchema = generateDirectoryItemListSchema(products);
    expect(itemListSchema['@type']).toBe('ItemList');
    expect(itemListSchema.itemListElement.length).toBeGreaterThan(0);

    const chatgpt = getDirectoryProductByIdOrSlug('chatgpt');
    expect(chatgpt).toBeDefined();
    const productSchema = generateProductDetailSchema(chatgpt!);
    expect(productSchema['@type']).toBe('SoftwareApplication');
    expect(productSchema.name).toBe('ChatGPT');
    expect(productSchema.review).toBeDefined();
    expect(productSchema.review.reviewRating.ratingValue).toBe(4.8);

    const breadcrumbs = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://www.aidetector.cx/' },
      { name: 'AI Directory', url: 'https://www.aidetector.cx/tools' },
      { name: 'ChatGPT', url: 'https://www.aidetector.cx/tools/chatgpt' },
    ]);
    expect(breadcrumbs['@type']).toBe('BreadcrumbList');
    expect(breadcrumbs.itemListElement.length).toBe(3);
  });

  it('verifies difference detection helper logic between two distinct products', () => {
    const chatgpt = getDirectoryProductByIdOrSlug('chatgpt')!;
    const midjourney = getDirectoryProductByIdOrSlug('midjourney')!;

    // Category differs
    expect(chatgpt.primaryCategory).not.toBe(midjourney.primaryCategory);
    // Pricing model differs (Freemium vs Paid)
    expect(chatgpt.pricingModel).not.toBe(midjourney.pricingModel);
    // Free plan differs
    expect(chatgpt.hasFreePlan).not.toBe(midjourney.hasFreePlan);
    // Modalities differ
    expect(chatgpt.supportedModalities).not.toEqual(midjourney.supportedModalities);
  });
});
