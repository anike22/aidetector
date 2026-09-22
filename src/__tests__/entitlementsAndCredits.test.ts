import { describe, it, expect } from 'vitest';
import {
  PLAN_TIERS,
  RATE_TABLE,
  calculateOperationCreditCost,
  isTrialEligibleOperation,
  formatRunCostLabel,
} from '@/lib/entitlements';

describe('Entitlements & Central Rate Table System', () => {
  describe('Plan Tier Matrix Structure', () => {
    it('defines 5 standard plans: free, pro, pro_plus, business, enterprise', () => {
      expect(PLAN_TIERS.free).toBeDefined();
      expect(PLAN_TIERS.pro).toBeDefined();
      expect(PLAN_TIERS.pro_plus).toBeDefined();
      expect(PLAN_TIERS.business).toBeDefined();
      expect(PLAN_TIERS.enterprise).toBeDefined();
    });

    it('Free plan provides 5 one-time introductory checks and $0 price', () => {
      const free = PLAN_TIERS.free;
      expect(free.monthlyPrice).toBe(0);
      expect(free.annualPrice).toBe(0);
      expect(free.trialChecks).toBe(5);
      expect(free.monthlyCredits).toBe(0);
      expect(free.limits.maxWordsPerCheck).toBe(1000);
    });

    it('Pro plan matches $12/mo ($120/yr) with 300 monthly credits', () => {
      const pro = PLAN_TIERS.pro;
      expect(pro.monthlyPrice).toBe(12);
      expect(pro.annualPrice).toBe(120);
      expect(pro.annualMonthlyEquivalent).toBe(10);
      expect(pro.monthlyCredits).toBe(300);
      expect(pro.limits.maxWordsPerCheck).toBe(10000);
    });

    it('Pro Plus plan matches $29/mo ($290/yr) with 1,000 monthly credits', () => {
      const proPlus = PLAN_TIERS.pro_plus;
      expect(proPlus.monthlyPrice).toBe(29);
      expect(proPlus.annualPrice).toBe(290);
      expect(proPlus.annualMonthlyEquivalent).toBeCloseTo(24.17, 1);
      expect(proPlus.monthlyCredits).toBe(1000);
      expect(proPlus.limits.forensicMode).toBe(true);
    });

    it('Business plan matches $79/mo ($790/yr) with 3,000 monthly credits & 5 team seats', () => {
      const biz = PLAN_TIERS.business;
      expect(biz.monthlyPrice).toBe(79);
      expect(biz.annualPrice).toBe(790);
      expect(biz.annualMonthlyEquivalent).toBeCloseTo(65.83, 1);
      expect(biz.monthlyCredits).toBe(3000);
      expect(biz.limits.teamSeats).toBe(5);
      expect(biz.limits.apiAccess).toBe(true);
    });
  });

  describe('Central Rate Table Calculations', () => {
    it('calculates text detection cost (1 cr per started 1,000 words per engine)', () => {
      // 500 words, 1 engine => 1 credit
      expect(calculateOperationCreditCost('text_detect_balanced', { words: 500, engines: 1 })).toBe(1);
      // 1,500 words, 1 engine => 2 credits
      expect(calculateOperationCreditCost('text_detect_balanced', { words: 1500, engines: 1 })).toBe(2);
      // 2,500 words, 2 engines (Dual) => 3 * 2 = 6 credits
      expect(calculateOperationCreditCost('text_detect_balanced', { words: 2500, engines: 2 })).toBe(6);
    });

    it('calculates Humanizer rewrite cost (3 cr per started 1,000 input words)', () => {
      // 400 words => 3 credits
      expect(calculateOperationCreditCost('humanizer_rewrite', { words: 400 })).toBe(3);
      // 1,200 words => 6 credits
      expect(calculateOperationCreditCost('humanizer_rewrite', { words: 1200 })).toBe(6);
    });

    it('calculates Plagiarism search cost (2 cr per started 1,000 words)', () => {
      expect(calculateOperationCreditCost('plagiarism_check', { words: 800 })).toBe(2);
      expect(calculateOperationCreditCost('plagiarism_check', { words: 2100 })).toBe(6);
    });

    it('calculates SEO Assistant report cost (3 cr per started 1,000 words)', () => {
      expect(calculateOperationCreditCost('seo_assistant', { words: 950 })).toBe(3);
      expect(calculateOperationCreditCost('seo_assistant', { words: 1050 })).toBe(6);
    });

    it('calculates Image analysis cost (2 cr standard, 4 cr advanced deepfake)', () => {
      expect(calculateOperationCreditCost('image_detect_standard', { images: 1 })).toBe(2);
      expect(calculateOperationCreditCost('image_detect_standard', { images: 3 })).toBe(6);
      expect(calculateOperationCreditCost('image_detect_advanced', { images: 1 })).toBe(4);
    });

    it('calculates Video analysis cost (2 cr/30s Balanced, 3 cr/30s High-Sensitivity, 6 cr/30s Forensic)', () => {
      // 25s Balanced => 2 credits
      expect(calculateOperationCreditCost('video_detect_balanced', { videoSeconds: 25 })).toBe(2);
      // 60s Balanced => 4 credits (2 slots * 2)
      expect(calculateOperationCreditCost('video_detect_balanced', { videoSeconds: 60 })).toBe(4);
      // 45s High-Sensitivity => 6 credits (2 slots * 3)
      expect(calculateOperationCreditCost('video_detect_high_sensitivity', { videoSeconds: 45 })).toBe(6);
      // 30s Forensic => 6 credits
      expect(calculateOperationCreditCost('video_detect_forensic', { videoSeconds: 30 })).toBe(6);
    });

    it('calculates Voice analysis cost (2 cr per started minute)', () => {
      expect(calculateOperationCreditCost('voice_analysis', { audioMinutes: 0.5 })).toBe(2);
      expect(calculateOperationCreditCost('voice_analysis', { audioMinutes: 2.2 })).toBe(6);
    });

    it('calculates Citation verification cost (1 cr per 5 references)', () => {
      expect(calculateOperationCreditCost('citation_verify', { references: 4 })).toBe(1);
      expect(calculateOperationCreditCost('citation_verify', { references: 12 })).toBe(3);
    });
  });

  describe('Trial Check Eligibility & Badge Formatting', () => {
    it('flags standard tools as trial eligible', () => {
      expect(isTrialEligibleOperation('text_detect_balanced')).toBe(true);
      expect(isTrialEligibleOperation('humanizer_rewrite')).toBe(true);
      expect(isTrialEligibleOperation('plagiarism_check')).toBe(true);
      expect(isTrialEligibleOperation('image_detect_standard')).toBe(true);
      expect(isTrialEligibleOperation('video_detect_balanced')).toBe(true);
      expect(isTrialEligibleOperation('voice_analysis')).toBe(true);
    });

    it('flags advanced and paid-only tools as trial ineligible', () => {
      expect(isTrialEligibleOperation('seo_assistant')).toBe(false);
      expect(isTrialEligibleOperation('ai_checker_for_bloggers')).toBe(false);
      expect(isTrialEligibleOperation('generate_article')).toBe(false);
      expect(isTrialEligibleOperation('text_detect_aggressive')).toBe(false);
      expect(isTrialEligibleOperation('image_detect_advanced')).toBe(false);
      expect(isTrialEligibleOperation('video_detect_forensic')).toBe(false);
      expect(isTrialEligibleOperation('citation_verify')).toBe(false);
      expect(isTrialEligibleOperation('hallucination_check')).toBe(false);
      expect(isTrialEligibleOperation('verified_authorship_register')).toBe(false);
      expect(isTrialEligibleOperation('bulk_processing')).toBe(false);
      expect(isTrialEligibleOperation('api_access')).toBe(false);
    });

    it('formats Run button labels correctly based on trial availability', () => {
      // Eligible feature with trial checks remaining
      const trialLabel = formatRunCostLabel('text_detect_balanced', true, 1);
      expect(trialLabel.badge).toBe('1 Free Trial Check');
      expect(trialLabel.isTrial).toBe(true);
      expect(trialLabel.cost).toBe(0);

      // Eligible feature when trial checks are exhausted
      const paidLabel = formatRunCostLabel('text_detect_balanced', false, 1);
      expect(paidLabel.badge).toBe('1 Credit');
      expect(paidLabel.isTrial).toBe(false);
      expect(paidLabel.cost).toBe(1);

      // Ineligible feature (e.g. Advanced Image Deepfake)
      const advLabel = formatRunCostLabel('image_detect_advanced', true, 4);
      expect(advLabel.badge).toBe('4 Credits');
      expect(advLabel.isTrial).toBe(false);
      expect(advLabel.cost).toBe(4);
    });
  });

  describe('Guest-to-Signup Trial Balance Preservation Simulation', () => {
    it('simulates guest consuming 1 check and receiving 4 remaining upon registration', () => {
      const guestTrialTotal = 1;
      let guestTrialUsed = 0;
      let guestTrialRemaining = 1;

      // Guest performs 1 analysis
      guestTrialUsed += 1;
      guestTrialRemaining = Math.max(0, guestTrialTotal - guestTrialUsed);
      expect(guestTrialRemaining).toBe(0);

      // User creates free account (5 total introductory allowance)
      const userTrialTotal = 5;
      const transferredTrialUsed = guestTrialUsed; // 1 carried over
      const userTrialRemaining = Math.max(0, userTrialTotal - transferredTrialUsed);

      expect(transferredTrialUsed).toBe(1);
      expect(userTrialRemaining).toBe(4); // 4 checks remaining
    });

    it('simulates direct user registration receiving all 5 checks', () => {
      const directUserTrialTotal = 5;
      const guestTrialUsed = 0; // Did not use guest check first
      const directUserTrialRemaining = Math.max(0, directUserTrialTotal - guestTrialUsed);

      expect(directUserTrialRemaining).toBe(5);
    });
  });
});
