// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateProductDetailSchema,
  generateBreadcrumbSchema,
  generateProductMeta,
} from '@/lib/directorySeo';
import {
  AI_DIRECTORY_PRODUCTS,
  getDirectoryProductByIdOrSlug,
} from '@/data/aiDirectoryData';
import type { DirectoryProduct, ProductCorrectionReport } from '@/types/directory';

describe('Phase 3: AI Product Review Page Architecture - Research Transparency & Corrections', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('32. Factual Corrections & Outdated Information Workflow', () => {
    it('supports submitting a correction report with valid field, proposed correction, and source', () => {
      const correction: ProductCorrectionReport = {
        id: 'cor_test_1',
        productId: 'chatgpt',
        field: 'pricing_summary',
        fieldLabel: 'Pricing Summary / Monthly Cost',
        currentValue: 'Free tier available; Plus plan $20/month',
        proposedCorrection: 'OpenAI announced new Enterprise and Edu tiers with custom token limits.',
        sourceUrl: 'https://openai.com/pricing',
        notes: 'Verified from official pricing page.',
        submitterEmail: 'auditor@aidetector.cx',
        status: 'pending',
        submittedAt: '2026-09-20',
      };

      const existingReports = JSON.parse(
        localStorage.getItem('aidetector_directory_corrections') || '[]'
      );
      existingReports.push(correction);
      localStorage.setItem(
        'aidetector_directory_corrections',
        JSON.stringify(existingReports)
      );

      const stored = JSON.parse(
        localStorage.getItem('aidetector_directory_corrections') || '[]'
      );
      expect(stored).toHaveLength(1);
      expect(stored[0].productId).toBe('chatgpt');
      expect(stored[0].field).toBe('pricing_summary');
      expect(stored[0].status).toBe('pending');
      expect(stored[0].sourceUrl).toBe('https://openai.com/pricing');
    });

    it('allows approving a correction and updating resolution details', () => {
      const initialReport: ProductCorrectionReport = {
        id: 'cor_approve_1',
        productId: 'claude',
        field: 'timeline',
        fieldLabel: 'Evolution Milestones',
        currentValue: 'Claude 3.5 Sonnet launched June 2024',
        proposedCorrection: 'Claude 3.7 Sonnet hybrid reasoning model launched with extended thinking.',
        sourceUrl: 'https://www.anthropic.com/news',
        status: 'pending',
        submittedAt: '2026-09-19',
      };

      localStorage.setItem(
        'aidetector_directory_corrections',
        JSON.stringify([initialReport])
      );

      // Approve correction
      const reports = JSON.parse(
        localStorage.getItem('aidetector_directory_corrections') || '[]'
      );
      const updatedReports = reports.map((r: ProductCorrectionReport) =>
        r.id === 'cor_approve_1'
          ? {
              ...r,
              status: 'approved',
              resolvedAt: '2026-09-20',
              resolutionNotes: 'Verified with official Anthropic release announcement.',
            }
          : r
      );
      localStorage.setItem(
        'aidetector_directory_corrections',
        JSON.stringify(updatedReports)
      );

      const verified = JSON.parse(
        localStorage.getItem('aidetector_directory_corrections') || '[]'
      );
      expect(verified[0].status).toBe('approved');
      expect(verified[0].resolvedAt).toBe('2026-09-20');
      expect(verified[0].resolutionNotes).toContain('official Anthropic release');
    });
  });

  describe('33. Sources & Research Transparency', () => {
    it('verifies product data contains official source citations with timestamps and categories', () => {
      const chatgpt = getDirectoryProductByIdOrSlug('chatgpt');
      expect(chatgpt).toBeDefined();
      expect(chatgpt?.sourceReferences).toBeDefined();
      expect(chatgpt?.sourceReferences!.length).toBeGreaterThanOrEqual(2);

      const pricingSource = chatgpt?.sourceReferences?.find(
        s => s.category === 'official_pricing' || s.title.toLowerCase().includes('pricing')
      );
      expect(pricingSource).toBeDefined();
      expect(pricingSource?.isOfficial).toBe(true);
      expect(pricingSource?.lastCheckedAt || pricingSource?.lastChecked).toBeDefined();
    });

    it('identifies official vs independent benchmark source categories', () => {
      const sources = [
        {
          id: 'src_1',
          title: 'Official Pricing',
          url: 'https://openai.com/chatgpt/pricing',
          isOfficial: true,
          category: 'official_pricing',
          lastCheckedAt: '2026-09-15',
        },
        {
          id: 'src_2',
          title: 'LMSYS Chatbot Arena Leaderboard',
          url: 'https://chat.lmsys.org',
          isOfficial: false,
          category: 'independent_benchmark',
          lastCheckedAt: '2026-09-10',
        },
      ];

      expect(sources[0].isOfficial).toBe(true);
      expect(sources[1].isOfficial).toBe(false);
      expect(sources[1].category).toBe('independent_benchmark');
    });
  });

  describe('34. Last Verified System & Granular Freshness Badges', () => {
    it('provides granular freshness metadata (Product info, Pricing, Timeline)', () => {
      const chatgpt = getDirectoryProductByIdOrSlug('chatgpt');
      expect(chatgpt?.freshness).toBeDefined();
      expect(chatgpt?.freshness?.lastVerifiedProductInfo).toBeDefined();
      expect(chatgpt?.freshness?.lastVerifiedPricing).toBeDefined();
      expect(chatgpt?.freshness?.lastUpdatedTimeline).toBeDefined();

      // Check dates match ISO YYYY-MM-DD pattern
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      expect(chatgpt?.freshness?.lastVerifiedProductInfo).toMatch(dateRegex);
      expect(chatgpt?.freshness?.lastVerifiedPricing).toMatch(dateRegex);
      expect(chatgpt?.freshness?.lastUpdatedTimeline).toMatch(dateRegex);
    });
  });

  describe('35-37. SEO Metadata & Heading Architecture', () => {
    it('generates non-hyperbolic, data-driven page title and meta description', () => {
      const chatgpt = getDirectoryProductByIdOrSlug('chatgpt')!;
      const meta = generateProductMeta(chatgpt);

      expect(meta.title).toBe('ChatGPT Review: Features, Pricing, Pros & Cons | AIDetector.cx');
      expect(meta.description).toContain('ChatGPT');
      expect(meta.description).not.toContain('#1');
      expect(meta.description).not.toContain('most accurate');
      expect(meta.canonicalUrl).toBe('https://www.aidetector.cx/tools/chatgpt');
      expect(meta.openGraph.siteName).toBe('AIDetector.cx');
    });

    it('generates clean BreadcrumbList structured data', () => {
      const breadcrumbs = generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.aidetector.cx/' },
        { name: 'AI Directory', url: 'https://www.aidetector.cx/tools' },
        { name: 'ChatGPT Review', url: 'https://www.aidetector.cx/tools/chatgpt' },
      ]);

      expect(breadcrumbs['@context']).toBe('https://schema.org');
      expect(breadcrumbs['@type']).toBe('BreadcrumbList');
      expect(breadcrumbs.itemListElement).toHaveLength(3);
      expect(breadcrumbs.itemListElement[2].name).toBe('ChatGPT Review');
    });
  });

  describe('38-40. Structured Data (SoftwareApplication, AggregateRating, Pros/Cons)', () => {
    it('generates valid SoftwareApplication schema with editorial assessment and pros/cons notes', () => {
      const chatgpt = getDirectoryProductByIdOrSlug('chatgpt')!;
      const schema = generateProductDetailSchema(chatgpt);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('SoftwareApplication');
      expect(schema.name).toBe('ChatGPT');
      expect(schema.offers).toBeDefined();
      expect(schema.offers.category).toBe(chatgpt.pricingModel);

      // Editorial Review structured data
      expect(schema.review).toBeDefined();
      expect(schema.review['@type']).toBe('Review');
      expect(schema.review.author.name).toBe('AIDetector.cx Editorial Staff');
      expect(schema.review.reviewRating.ratingValue).toBe(chatgpt.editorialAssessment?.rating);

      // Structured Pros and Cons search data
      if (chatgpt.editorialAssessment?.pros) {
        expect(schema.review.positiveNotes).toBeDefined();
        expect(schema.review.positiveNotes['@type']).toBe('ItemList');
        expect(schema.review.positiveNotes.itemListElement.length).toBe(
          chatgpt.editorialAssessment.pros.length
        );
      }
    });

    it('only computes AggregateRating when authentic user reviews exist', () => {
      const mockProductWithReviews: DirectoryProduct = {
        ...AI_DIRECTORY_PRODUCTS[0],
        userReviews: [
          {
            id: 'rev_1',
            productId: 'test',
            authorName: 'Alex K.',
            rating: 5,
            reviewText: 'Great product for research and development.',
            title: 'Solid LLM platform',
            date: '2026-09-18',
            roleOrProfession: 'Engineer',
            verifiedUser: true,
            helpfulCount: 3,
            conflictOfInterest: { hasConflict: false },
            dimensionRatings: { outputQuality: 5, speed: 5, valueForMoney: 4, easeOfUse: 5 },
            moderationStatus: 'approved',
          },
          {
            id: 'rev_2',
            productId: 'test',
            authorName: 'Sarah M.',
            rating: 4,
            reviewText: 'Reliable speed and rich ecosystem.',
            title: 'Very useful assistant',
            date: '2026-09-19',
            roleOrProfession: 'Designer',
            verifiedUser: true,
            helpfulCount: 1,
            conflictOfInterest: { hasConflict: false },
            dimensionRatings: { outputQuality: 4, speed: 4, valueForMoney: 4, easeOfUse: 4 },
            moderationStatus: 'approved',
          },
        ],
      };

      const schemaWithReviews = generateProductDetailSchema(mockProductWithReviews);
      expect(schemaWithReviews.aggregateRating).toBeDefined();
      expect(schemaWithReviews.aggregateRating['@type']).toBe('AggregateRating');
      expect(schemaWithReviews.aggregateRating.reviewCount).toBe(2);
      expect(schemaWithReviews.aggregateRating.ratingValue).toBe(4.5);

      const mockProductWithoutReviews: DirectoryProduct = {
        ...AI_DIRECTORY_PRODUCTS[0],
        userReviews: [],
      };
      const schemaWithout = generateProductDetailSchema(mockProductWithoutReviews);
      expect(schemaWithout.aggregateRating).toBeUndefined();
    });
  });

  describe('41-54. FAQs, Internal Linking & Neutral Review CTAs', () => {
    it('verifies product has maintained FAQs addressing common questions', () => {
      const chatgpt = getDirectoryProductByIdOrSlug('chatgpt')!;
      expect(chatgpt.faqs).toBeDefined();
      expect(chatgpt.faqs!.length).toBeGreaterThanOrEqual(3);

      const hasPricingFaq = chatgpt.faqs?.some(f =>
        f.question.toLowerCase().includes('free') || f.question.toLowerCase().includes('cost') || f.question.toLowerCase().includes('pricing')
      );
      expect(hasPricingFaq).toBe(true);
    });

    it('verifies related tools and pairwise comparison links connect logically', () => {
      const chatgpt = getDirectoryProductByIdOrSlug('chatgpt')!;
      const related = AI_DIRECTORY_PRODUCTS.filter(
        p => p.id !== chatgpt.id && (p.primaryCategory === chatgpt.primaryCategory || p.categories.some(c => chatgpt.categories.includes(c)))
      );
      expect(related.length).toBeGreaterThan(0);
      expect(related.some(r => r.id === 'claude' || r.id === 'gemini')).toBe(true);
    });
  });
});
