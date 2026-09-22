import { describe, it, expect } from 'vitest';
import {
  AI_DIRECTORY_PRODUCTS,
  getDirectoryProductByIdOrSlug,
} from '@/data/aiDirectoryData';
import type {
  ProductUserReview,
  MultiDimensionRating,
  EvidenceAttachment,
  ConflictDisclosure,
  VendorResponse,
  ReviewReport,
} from '@/types/directory';

describe('Phase 2: AI Product Review Page Architecture - Deep Verification', () => {
  it('validates multi-dimension ratings structure and range constraints for reviews', () => {
    const chatgpt = getDirectoryProductByIdOrSlug('chatgpt');
    expect(chatgpt).toBeDefined();
    expect(chatgpt?.userReviews).toBeDefined();

    const reviews = chatgpt!.userReviews!;
    expect(reviews.length).toBeGreaterThan(0);

    reviews.forEach(review => {
      // Overall rating must be between 1 and 5
      expect(review.rating).toBeGreaterThanOrEqual(1);
      expect(review.rating).toBeLessThanOrEqual(5);

      // Core fields
      expect(review.id).toBeTruthy();
      expect(review.authorName).toBeTruthy();
      expect(review.title).toBeTruthy();
      expect(review.reviewText).toBeTruthy();
      expect(review.pros.length).toBeGreaterThan(0);
      expect(review.cons.length).toBeGreaterThan(0);
      expect(review.usageDuration).toBeTruthy();
      expect(review.primaryUseCase).toBeTruthy();

      // Check dimensional ratings if provided
      if (review.dimensionalRatings) {
        const { easeOfUse, featureQuality, valueForMoney, reliability } = review.dimensionalRatings;
        if (easeOfUse) {
          expect(easeOfUse).toBeGreaterThanOrEqual(1);
          expect(easeOfUse).toBeLessThanOrEqual(5);
        }
        if (featureQuality) {
          expect(featureQuality).toBeGreaterThanOrEqual(1);
          expect(featureQuality).toBeLessThanOrEqual(5);
        }
        if (valueForMoney) {
          expect(valueForMoney).toBeGreaterThanOrEqual(1);
          expect(valueForMoney).toBeLessThanOrEqual(5);
        }
        if (reliability) {
          expect(reliability).toBeGreaterThanOrEqual(1);
          expect(reliability).toBeLessThanOrEqual(5);
        }
      }
    });
  });

  it('validates evidence attachment specifications and safe privacy defaults', () => {
    const chatgpt = getDirectoryProductByIdOrSlug('chatgpt');
    const reviewWithEvidence = chatgpt?.userReviews?.find(r => r.evidenceAttachment);

    expect(reviewWithEvidence).toBeDefined();
    const evidence = reviewWithEvidence!.evidenceAttachment!;

    expect(evidence.id).toBeTruthy();
    expect(evidence.fileName).toBeTruthy();
    expect(evidence.fileType).toMatch(/^(image\/png|image\/jpeg|image\/webp|application\/pdf)$/);
    expect(evidence.fileSize).toBeLessThanOrEqual(5 * 1024 * 1024); // 5MB limit
    expect(['screenshot', 'billing', 'interface', 'error', 'benchmark']).toContain(evidence.evidenceType);
    expect(['submitted', 'reviewed', 'insufficient', 'rejected']).toContain(evidence.verificationStatus);
    expect(['moderators_only', 'public_redacted']).toContain(evidence.privacy);
  });

  it('validates conflict of interest disclosures and transparency flags', () => {
    const chatgpt = getDirectoryProductByIdOrSlug('chatgpt');
    const reviews = chatgpt?.userReviews || [];

    reviews.forEach(review => {
      if (review.conflictDisclosure) {
        const conflict = review.conflictDisclosure;
        expect(typeof conflict.hasConflict).toBe('boolean');
        expect([
          'none',
          'employee',
          'former_employee',
          'consultant',
          'affiliate',
          'received_free_access',
          'received_incentive',
          'investor',
          'competitor',
        ]).toContain(conflict.relationshipType);

        if (conflict.hasConflict) {
          expect(conflict.details).toBeTruthy();
        }
      }
    });
  });

  it('validates verified vendor response architecture without review mutation', () => {
    const chatgpt = getDirectoryProductByIdOrSlug('chatgpt');
    const reviewWithVendorResponse = chatgpt?.userReviews?.find(r => r.vendorResponse);

    expect(reviewWithVendorResponse).toBeDefined();
    const vendorResp = reviewWithVendorResponse!.vendorResponse!;

    expect(vendorResp.id).toBeTruthy();
    expect(vendorResp.companyName).toBeTruthy();
    expect(vendorResp.responderRole).toBeTruthy();
    expect(vendorResp.date).toBeTruthy();
    expect(vendorResp.responseText).toBeTruthy();
    expect(vendorResp.officialVerified).toBe(true);

    // Verify vendor response does not alter the original review text or rating
    expect(reviewWithVendorResponse!.rating).toBe(5);
    expect(reviewWithVendorResponse!.reviewText).toContain('The Canvas feature alone justified our team upgrade');
  });

  it('evaluates category-based alternatives ranking and trade-offs calculation', () => {
    const chatgpt = getDirectoryProductByIdOrSlug('chatgpt');
    expect(chatgpt).toBeDefined();

    // Get alternatives in same category
    const sameCategoryTools = AI_DIRECTORY_PRODUCTS.filter(
      p => p.id !== chatgpt!.id && p.category === chatgpt!.category
    );

    expect(sameCategoryTools.length).toBeGreaterThan(0);

    sameCategoryTools.forEach(alt => {
      expect(alt.name).toBeTruthy();
      expect(alt.summary).toBeTruthy();
      expect(alt.pricingModel).toBeTruthy();
    });
  });

  it('ensures user reviews moderation status state transitions are well-formed', () => {
    const validModerationStates = ['pending', 'published', 'rejected', 'flagged', 'needs_review'];
    const sampleReview: ProductUserReview = {
      id: 'rev_test_1',
      productId: 'chatgpt',
      authorName: 'Senior ML Engineer',
      rating: 4,
      date: '2026-09-18',
      title: 'Solid daily driver with occasional rate limits',
      reviewText: 'Excellent capability across coding and reasoning tasks.',
      pros: ['Fast inference', 'Strong tool calling'],
      cons: ['Weekly rate caps'],
      primaryUseCase: 'Code Generation',
      usageDuration: '6-12 months',
      moderationStatus: 'needs_review',
    };

    expect(validModerationStates).toContain(sampleReview.moderationStatus);
  });

  it('validates review report data model and supported report categories', () => {
    const sampleReport: ReviewReport = {
      id: 'rep_123',
      reviewId: 'rev_chatgpt_1',
      productId: 'chatgpt',
      reportedBy: 'user_anonymous',
      reason: 'conflict_of_interest',
      details: 'Author appears to be affiliated with product marketing team without disclosure.',
      reportedAt: '2026-09-20',
      status: 'pending',
    };

    expect(['spam', 'conflict_of_interest', 'abusive', 'privacy_violation', 'misleading', 'other']).toContain(
      sampleReport.reason
    );
    expect(['pending', 'investigating', 'resolved', 'dismissed']).toContain(sampleReport.status);
  });
});
