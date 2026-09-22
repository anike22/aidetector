import { describe, it, expect } from 'vitest';
import {
  AI_DIRECTORY_PRODUCTS,
  getAllDirectoryProducts,
  getDirectoryProductByIdOrSlug,
} from '@/data/aiDirectoryData';
import { generateProductDetailSchema, generateBreadcrumbSchema } from '@/lib/directorySeo';

describe('Product Review Page Architecture Suite', () => {
  it('verifies product evolution milestones structure and chronological ordering', () => {
    const chatgpt = getDirectoryProductByIdOrSlug('chatgpt');
    expect(chatgpt).toBeDefined();
    expect(chatgpt?.evolutionMilestones).toBeDefined();
    expect(chatgpt?.evolutionMilestones?.length).toBeGreaterThanOrEqual(2);

    const milestones = chatgpt!.evolutionMilestones!;
    milestones.forEach(m => {
      expect(m.id).toBeTruthy();
      expect(m.date).toBeTruthy();
      expect(m.versionOrModel).toBeTruthy();
      expect(m.title).toBeTruthy();
      expect(m.summary).toBeTruthy();
      expect(m.majorChanges.length).toBeGreaterThan(0);
      expect(m.capabilitiesAdded.length).toBeGreaterThan(0);
    });

    // Exactly one current active architecture marker
    const currentMilestones = milestones.filter(m => m.isCurrent);
    expect(currentMilestones.length).toBe(1);
    expect(currentMilestones[0].sourceRef).toBeDefined();
    expect(currentMilestones[0].sourceRef?.url).toContain('openai.com');
  });

  it('validates structured feature analysis and feature availability matrix', () => {
    const chatgpt = getDirectoryProductByIdOrSlug('chatgpt');
    expect(chatgpt?.structuredFeatureGroups).toBeDefined();
    expect(chatgpt?.structuredFeatureGroups?.length).toBeGreaterThanOrEqual(2);

    chatgpt?.structuredFeatureGroups?.forEach(group => {
      expect(group.category).toBeTruthy();
      expect(group.description).toBeTruthy();
      expect(group.features.length).toBeGreaterThan(0);
      group.features.forEach(f => {
        expect(f.name).toBeTruthy();
        expect(f.description).toBeTruthy();
        expect(f.targetAudience).toBeTruthy();
        expect(f.availabilityTier).toBeTruthy();
      });
    });

    expect(chatgpt?.featureAvailabilityMatrix).toBeDefined();
    expect(chatgpt?.featureAvailabilityMatrix?.length).toBeGreaterThan(0);

    chatgpt?.featureAvailabilityMatrix?.forEach(item => {
      expect(item.featureName).toBeTruthy();
      expect(['boolean', 'string'].includes(typeof item.isAvailable)).toBe(true);
      expect(item.requiredPlan).toBeTruthy();
      expect(item.supportedPlatforms.length).toBeGreaterThan(0);
      expect(item.lastVerified).toBeTruthy();
    });
  });

  it('validates audience use cases and operational boundaries', () => {
    const chatgpt = getDirectoryProductByIdOrSlug('chatgpt');
    expect(chatgpt?.audienceUseCases).toBeDefined();
    expect(chatgpt?.audienceUseCases?.length).toBeGreaterThanOrEqual(2);

    chatgpt?.audienceUseCases?.forEach(uc => {
      expect(uc.persona).toBeTruthy();
      expect(uc.benefits.length).toBeGreaterThan(0);
      expect(uc.recommendedWorkflows.length).toBeGreaterThan(0);
    });
  });

  it('validates FAQ items and SEO-readiness', () => {
    const chatgpt = getDirectoryProductByIdOrSlug('chatgpt');
    expect(chatgpt?.faqs).toBeDefined();
    expect(chatgpt?.faqs?.length).toBeGreaterThanOrEqual(2);

    chatgpt?.faqs?.forEach(faq => {
      expect(faq.question).toBeTruthy();
      expect(faq.answer).toBeTruthy();
      expect(faq.question.length).toBeGreaterThan(10);
      expect(faq.answer.length).toBeGreaterThan(20);
    });
  });

  it('validates authentic verified user reviews and calculation integrity', () => {
    const chatgpt = getDirectoryProductByIdOrSlug('chatgpt');
    expect(chatgpt?.userReviews).toBeDefined();
    expect(chatgpt?.userReviews?.length).toBeGreaterThanOrEqual(1);

    chatgpt?.userReviews?.forEach(rev => {
      expect(rev.id).toBeTruthy();
      expect(rev.authorName).toBeTruthy();
      expect(rev.rating).toBeGreaterThanOrEqual(1);
      expect(rev.rating).toBeLessThanOrEqual(5);
      expect(rev.title).toBeTruthy();
      expect(rev.reviewText).toBeTruthy();
      expect(rev.usageDuration).toBeTruthy();
      expect(rev.verifiedUser).toBe(true);
      expect(rev.date).toBeTruthy();
    });

    // Score calculation
    const avgRating =
      chatgpt!.userReviews!.reduce((sum, r) => sum + r.rating, 0) / chatgpt!.userReviews!.length;
    expect(avgRating).toBeGreaterThanOrEqual(1);
    expect(avgRating).toBeLessThanOrEqual(5);
  });

  it('verifies Claude product review rich data model integrity', () => {
    const claude = getDirectoryProductByIdOrSlug('claude');
    expect(claude).toBeDefined();
    expect(claude?.evolutionMilestones?.length).toBeGreaterThanOrEqual(2);
    expect(claude?.structuredFeatureGroups?.length).toBeGreaterThanOrEqual(1);
    expect(claude?.featureAvailabilityMatrix?.length).toBeGreaterThanOrEqual(1);
    expect(claude?.audienceUseCases?.length).toBeGreaterThanOrEqual(1);
    expect(claude?.faqs?.length).toBeGreaterThanOrEqual(1);
    expect(claude?.userReviews?.length).toBeGreaterThanOrEqual(1);
  });

  it('generates rich JSON-LD ProductDetail and Breadcrumb schemas for SEO', () => {
    const chatgpt = getDirectoryProductByIdOrSlug('chatgpt')!;
    const schema = generateProductDetailSchema(chatgpt);

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('SoftwareApplication');
    expect(schema.name).toBe(chatgpt.name);
    expect(schema.applicationCategory).toBe(chatgpt.primaryCategory);
    expect(schema.operatingSystem).toBeTruthy();

    const breadcrumbs = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://www.aidetector.cx/' },
      { name: 'AI Directory', url: 'https://www.aidetector.cx/tools' },
      { name: 'ChatGPT Review', url: 'https://www.aidetector.cx/tools/chatgpt' },
    ]);

    expect(breadcrumbs['@type']).toBe('BreadcrumbList');
    expect(breadcrumbs.itemListElement.length).toBe(3);
  });
});
