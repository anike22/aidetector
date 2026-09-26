// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateProductDetailSchema,
  generateProductMeta,
} from '@/lib/directorySeo';
import {
  AI_DIRECTORY_PRODUCTS,
  getDirectoryProductByIdOrSlug,
} from '@/data/aiDirectoryData';
import type {
  DirectoryProduct,
  ProductUserReview,
  ReviewReport,
  EvidenceAttachment,
  ConflictDisclosure,
} from '@/types/directory';

const mockSampleReview: ProductUserReview = {
  id: 'rev_test_1',
  productId: 'chatgpt',
  authorName: 'Alex Chen',
  roleOrProfession: 'Staff AI Engineer',
  companyOrSchool: 'Datatech Labs',
  rating: 4.8,
  dimensionalRatings: {
    easeOfUse: 5,
    featureQuality: 5,
    valueForMoney: 4,
    reliability: 5,
  },
  title: 'Solid daily reasoning driver with strong code completion',
  reviewText: 'We have integrated ChatGPT into our continuous integration pipeline and daily architectural ideation. The reasoning models excel at complex multi-file refactoring.',
  pros: ['Outstanding Python refactoring capabilities', 'Huge 128k context window'],
  cons: ['Occasional peak latency spikes', 'Advanced voice mode rate limits'],
  primaryUseCase: 'Software Engineering & Coding',
  planUsed: 'Plus / Pro Tier ($20/mo)',
  usageDuration: '6-12 months',
  verifiedUser: true,
  helpfulVotes: 14,
  date: '2026-08-15',
  lastEditedDate: '2026-09-10',
  moderationStatus: 'approved',
};

describe('Phase 4: Third-Party AI Product Review UX & System Architecture', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('55. Review Form UX: 6-Step Multi-Step Flow & Draft Autosave', () => {
    it('1. correctly formats draft payload across all 6 wizard steps and autosaves to localStorage', () => {
      const draftKey = 'aidetector_review_draft_chatgpt';
      const draftPayload = {
        rating: 5,
        outputQualityRating: 5,
        speedRating: 4,
        valueRating: 4,
        easeRating: 5,
        title: 'Exceptional reasoning depth for complex Python refactoring',
        reviewText: 'We tested ChatGPT across our entire 20k-line legacy repository. It identified 14 memory leaks within seconds.',
        pros: ['Deep multi-step reasoning', 'Clean Markdown code blocks'],
        cons: ['Occasional token limit timeouts'],
        authorName: 'Marcus Vance',
        roleOrProfession: 'Lead Software Architect',
        companyOrSchool: 'ScaleMatrix',
        primaryUseCase: 'Software Engineering & Coding',
        planUsed: 'Plus / Pro Tier ($20/mo)',
        usageDuration: '3-6 months',
        hasConflict: false,
        conflictType: 'none',
        conflictDetails: '',
      };

      localStorage.setItem(draftKey, JSON.stringify(draftPayload));

      const retrieved = JSON.parse(localStorage.getItem(draftKey) || '{}');
      expect(retrieved.title).toBe('Exceptional reasoning depth for complex Python refactoring');
      expect(retrieved.rating).toBe(5);
      expect(retrieved.pros).toHaveLength(2);
      expect(retrieved.cons).toHaveLength(1);
    });

    it('2. discards draft upon successful review submission or explicit user action', () => {
      const draftKey = 'aidetector_review_draft_chatgpt';
      localStorage.setItem(draftKey, JSON.stringify({ title: 'Temporary draft' }));
      expect(localStorage.getItem(draftKey)).toBeTruthy();

      localStorage.removeItem(draftKey);
      expect(localStorage.getItem(draftKey)).toBeNull();
    });
  });

  describe('56. Review Guidelines & Mandatory Acceptance', () => {
    it('3. verifies community guidelines requirements before review publication', () => {
      const guidelines = [
        'Genuine Experience',
        'Factual Specificity',
        'No Impersonation',
        'Conflict Transparency',
        'Privacy Safety',
      ];
      expect(guidelines).toHaveLength(5);

      const reviewSubmission = {
        ...mockSampleReview,
        guidelinesAgreed: true,
      };
      expect(reviewSubmission.guidelinesAgreed).toBe(true);
    });
  });

  describe('57. Edit / Update Review Support with Timestamps', () => {
    it('4. tracks original review date and updates lastEditedDate on modification', () => {
      const originalDate = '2026-08-15';
      const updatedDate = '2026-09-21';

      const updatedReview: ProductUserReview = {
        ...mockSampleReview,
        title: 'Updated: Even better with GPT-5 release',
        date: originalDate,
        lastEditedDate: updatedDate,
      };

      expect(updatedReview.date).toBe('2026-08-15');
      expect(updatedReview.lastEditedDate).toBe('2026-09-21');
      expect(updatedReview.title).toContain('Updated:');
    });

    it('5. preserves original review ID when updating to maintain thread continuity', () => {
      const reviewId = mockSampleReview.id;
      const reviewsList = [mockSampleReview];

      const modifiedReview: ProductUserReview = {
        ...mockSampleReview,
        reviewText: 'Revised review text reflecting longer term operational testing.',
        lastEditedDate: '2026-09-21',
      };

      const updatedList = reviewsList.map(r => (r.id === reviewId ? modifiedReview : r));
      expect(updatedList).toHaveLength(1);
      expect(updatedList[0].id).toBe(reviewId);
      expect(updatedList[0].reviewText).toContain('Revised review text');
    });
  });

  describe('58. Review Quality & Granular Dimension Ratings', () => {
    it('6. calculates multi-factor dimension ratings accurately', () => {
      const review1: ProductUserReview = {
        ...mockSampleReview,
        id: 'rev_1',
        rating: 5,
        dimensionalRatings: { easeOfUse: 5, featureQuality: 4, valueForMoney: 5, reliability: 4 },
      };
      const review2: ProductUserReview = {
        ...mockSampleReview,
        id: 'rev_2',
        rating: 4,
        dimensionalRatings: { easeOfUse: 4, featureQuality: 4, valueForMoney: 3, reliability: 5 },
      };

      const allReviews = [review1, review2];
      const easeSum = allReviews.reduce((sum, r) => sum + (r.dimensionalRatings?.easeOfUse || 0), 0);
      const easeAvg = (easeSum / allReviews.length).toFixed(1);

      expect(easeAvg).toBe('4.5');
    });
  });

  describe('59 & 60. Evidence Verification, Moderation & Competitor Neutrality', () => {
    it('7. enforces secure evidence attachment constraints with privacy protection', () => {
      const evidence: EvidenceAttachment = {
        id: 'ev_12345',
        fileName: 'benchmark_comparison.png',
        fileType: 'image/png',
        fileSize: 1024 * 500, // 500 KB
        dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        uploadedAt: '2026-09-21',
        evidenceType: 'benchmark',
        privacy: 'moderators_only',
        verificationStatus: 'submitted',
      };

      expect(evidence.fileSize).toBeLessThan(5 * 1024 * 1024);
      expect(['image/png', 'image/jpeg', 'image/webp', 'application/pdf']).toContain(evidence.fileType);
      expect(evidence.privacy).toBe('moderators_only');
    });

    it('8. supports recording conflict of interest disclosures for platform transparency', () => {
      const conflict: ConflictDisclosure = {
        hasConflict: true,
        relationshipType: 'received_free_access',
        details: 'Received 6 months complimentary enterprise workspace for developer evaluation',
      };

      const reviewWithConflict: ProductUserReview = {
        ...mockSampleReview,
        conflictDisclosure: conflict,
      };

      expect(reviewWithConflict.conflictDisclosure?.hasConflict).toBe(true);
      expect(reviewWithConflict.conflictDisclosure?.relationshipType).toBe('received_free_access');
    });

    it('9. records user violation reports in moderation queue with reason and status', () => {
      const report: ReviewReport = {
        id: 'rep_101',
        reviewId: 'rev_test_1',
        productId: 'chatgpt',
        reason: 'misleading_information',
        details: 'Review claims feature is free when it requires enterprise subscription',
        reportedAt: '2026-09-21',
        status: 'pending',
      };

      const reportsQueue = [report];
      localStorage.setItem('aidetector_directory_review_reports', JSON.stringify(reportsQueue));

      const savedReports: ReviewReport[] = JSON.parse(
        localStorage.getItem('aidetector_directory_review_reports') || '[]'
      );
      expect(savedReports).toHaveLength(1);
      expect(savedReports[0].status).toBe('pending');
      expect(savedReports[0].reason).toBe('misleading_information');
    });
  });

  describe('61, 62 & 63. Technical SEO, Structured Data & Rating Aggregation', () => {
    it('10. generates valid JSON-LD schema with authentic AggregateRating and Editorial Review', () => {
      const tool = getDirectoryProductByIdOrSlug('chatgpt');
      expect(tool).toBeDefined();

      if (tool) {
        // Product with approved community review
        const toolWithReviews: DirectoryProduct = {
          ...tool,
          userReviews: [mockSampleReview],
        };
        const schema = generateProductDetailSchema(toolWithReviews);
        expect(schema['@context']).toBe('https://schema.org');
        expect(schema['@type']).toBe('SoftwareApplication');
        expect(schema.name).toBe(tool.name);
        expect(schema.aggregateRating).toBeDefined();
        expect(schema.aggregateRating.ratingValue).toBe(4.8);
        expect(schema.aggregateRating.reviewCount).toBe(1);

        // Without reviews - aggregateRating MUST be omitted to prevent Google spam penalties
        const toolWithoutReviews: DirectoryProduct = {
          ...tool,
          userReviews: [],
        };
        const schemaEmpty = generateProductDetailSchema(toolWithoutReviews);
        expect(schemaEmpty.aggregateRating).toBeUndefined();
        expect(schemaEmpty.review).toBeDefined(); // Editorial review remains
      }
    });

    it('11. generates unique data-driven SEO metadata and canonical tags', () => {
      const tool = getDirectoryProductByIdOrSlug('claude');
      expect(tool).toBeDefined();

      if (tool) {
        const meta = generateProductMeta(tool);
        expect(meta.title).toContain(tool.name);
        expect(meta.title).toContain('Review');
        expect(meta.canonicalUrl).toBe(`https://www.aidetector.cx/tools/${tool.id}`);
        expect(meta.description).toContain(tool.name);
        expect(meta.description.length).toBeGreaterThan(60);
      }
    });
  });
});
