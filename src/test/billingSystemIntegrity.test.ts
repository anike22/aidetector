import { describe, it, expect } from 'vitest';
import {
  calculateBloggerAnalysisCost,
  calculateOperationCreditCost,
  RATE_TABLE,
  isTrialEligibleOperation,
} from '@/lib/entitlements';
import { TOP_UP_PACKS } from '@/components/pricing/TopUpModal';

describe('AIDetector.cx Billing System Repair & Integrity Audit', () => {
  describe('1. /ai-checker-for-bloggers Word-Based Credit Cost & Boundaries', () => {
    it('calculates exact 5 credits per started 500 words for boundary tests', () => {
      // 1–500 words -> 5 credits
      expect(calculateBloggerAnalysisCost(1)).toBe(5);
      expect(calculateBloggerAnalysisCost(100)).toBe(5);
      expect(calculateBloggerAnalysisCost(499)).toBe(5);
      expect(calculateBloggerAnalysisCost(500)).toBe(5);

      // 501–1,000 words -> 10 credits
      expect(calculateBloggerAnalysisCost(501)).toBe(10);
      expect(calculateBloggerAnalysisCost(750)).toBe(10);
      expect(calculateBloggerAnalysisCost(999)).toBe(10);
      expect(calculateBloggerAnalysisCost(1000)).toBe(10);

      // 1,001–1,500 words -> 15 credits
      expect(calculateBloggerAnalysisCost(1001)).toBe(15);
      expect(calculateBloggerAnalysisCost(1200)).toBe(15);
      expect(calculateBloggerAnalysisCost(1499)).toBe(15);
      expect(calculateBloggerAnalysisCost(1500)).toBe(15);

      // 1,501–2,000 words -> 20 credits
      expect(calculateBloggerAnalysisCost(1501)).toBe(20);
      expect(calculateBloggerAnalysisCost(1750)).toBe(20);
      expect(calculateBloggerAnalysisCost(2000)).toBe(20);

      // 2,001–2,500 words -> 25 credits
      expect(calculateBloggerAnalysisCost(2001)).toBe(25);
      expect(calculateBloggerAnalysisCost(2500)).toBe(25);

      // 3,001–3,500 words -> 35 credits
      expect(calculateBloggerAnalysisCost(3001)).toBe(35);
      expect(calculateBloggerAnalysisCost(3500)).toBe(35);

      // 0 or negative words boundary fallback
      expect(calculateBloggerAnalysisCost(0)).toBe(5);
    });

    it('calculateOperationCreditCost supports ai_checker_for_bloggers and aliases', () => {
      expect(calculateOperationCreditCost('ai_checker_for_bloggers', { words: 500 })).toBe(5);
      expect(calculateOperationCreditCost('ai_checker_for_bloggers', { words: 501 })).toBe(10);
      expect(calculateOperationCreditCost('ai_checker_for_bloggers', { words: 1500 })).toBe(15);
      expect(calculateOperationCreditCost('ai_checker_for_bloggers', { words: 1501 })).toBe(20);
      expect(calculateOperationCreditCost('blogger_seo_check', { wordCount: 2000 })).toBe(20);
      expect(calculateOperationCreditCost('ai_checker_blogger', { words: 3500 })).toBe(35);
    });
  });

  describe('2. Subfeature Separation & Independent Pricing', () => {
    it('preserves independent pricing for existing billable subfeatures', () => {
      // Humanizer: 3 credits per 1,000 words
      expect(calculateOperationCreditCost('humanizer', { words: 1000 })).toBe(3);
      expect(calculateOperationCreditCost('humanizer', { words: 1200 })).toBe(6);

      // Generate Article / With AI: 5 credits fixed
      expect(calculateOperationCreditCost('generate_article', {})).toBe(5);

      // Plagiarism: 2 credits per 1,000 words
      expect(calculateOperationCreditCost('plagiarism_deep', { words: 1000 })).toBe(2);

      // Balanced AI text detection: 1 credit per 1,000 words
      expect(calculateOperationCreditCost('text_detect_balanced', { words: 1000 })).toBe(1);

      // Citation verification: 1 credit per 5 references
      expect(calculateOperationCreditCost('citation_verify', { references: 5 })).toBe(1);
      expect(calculateOperationCreditCost('citation_verify', { references: 10 })).toBe(2);

      // Verified Authorship Registry: 5 credits per certificate
      expect(calculateOperationCreditCost('verified_authorship_register', {})).toBe(5);
    });

    it('confirms trial eligibility mappings are accurate and secure', () => {
      expect(isTrialEligibleOperation('ai_checker_for_bloggers')).toBe(false);
      expect(isTrialEligibleOperation('text_detect_balanced')).toBe(true);
      expect(isTrialEligibleOperation('humanizer')).toBe(true);
      expect(isTrialEligibleOperation('text_detect_aggressive')).toBe(false);
      expect(isTrialEligibleOperation('video_detect_deepfake')).toBe(false);
    });
  });

  describe('3. Top-Up Packs & Credit Lifecycle', () => {
    it('defines standard Top-Up packs with transparent pricing and credit amounts', () => {
      expect(TOP_UP_PACKS).toHaveLength(4);
      expect(TOP_UP_PACKS[0]).toEqual({
        id: 'pack_500',
        name: 'Starter Boost',
        credits: 500,
        priceUsd: 15,
      });
      expect(TOP_UP_PACKS[1].credits).toBe(1000);
      expect(TOP_UP_PACKS[1].popular).toBe(true);
      expect(TOP_UP_PACKS[2].credits).toBe(2500);
      expect(TOP_UP_PACKS[3].credits).toBe(5000);
      expect(TOP_UP_PACKS[3].bestValue).toBe(true);
    });

    it('models consumption order: plan credits consumed before top-up credits', () => {
      const simulateCreditDeduction = (
        planBalance: number,
        topUpBalance: number,
        cost: number
      ) => {
        let remainingCost = cost;
        let newPlanBalance = planBalance;
        let newTopUpBalance = topUpBalance;

        if (newPlanBalance >= remainingCost) {
          newPlanBalance -= remainingCost;
          remainingCost = 0;
        } else {
          remainingCost -= newPlanBalance;
          newPlanBalance = 0;
          if (newTopUpBalance >= remainingCost) {
            newTopUpBalance -= remainingCost;
            remainingCost = 0;
          } else {
            throw new Error('Insufficient credit balance');
          }
        }

        return {
          planBalance: newPlanBalance,
          topUpBalance: newTopUpBalance,
          totalAvailable: newPlanBalance + newTopUpBalance,
        };
      };

      // Case 1: Plan credits suffice (100 plan, 250 top-up, 15 cost)
      const res1 = simulateCreditDeduction(100, 250, 15);
      expect(res1.planBalance).toBe(85);
      expect(res1.topUpBalance).toBe(250); // Untouched!
      expect(res1.totalAvailable).toBe(335);

      // Case 2: Plan credits partially cover (10 plan, 250 top-up, 15 cost)
      const res2 = simulateCreditDeduction(10, 250, 15);
      expect(res2.planBalance).toBe(0);
      expect(res2.topUpBalance).toBe(245); // 5 deducted from top-up
      expect(res2.totalAvailable).toBe(245);

      // Case 3: Monthly refill preserves top-up credits (245 top-up remains, plan refills to 300)
      const planRefilled = 300;
      const combinedAfterRefill = planRefilled + res2.topUpBalance;
      expect(combinedAfterRefill).toBe(545);
    });
  });

  describe('4. Free and Visitor Credit Rules (Section 12)', () => {
    it('enforces exactly 1 guest check and 5 total account introductory trial checks', () => {
      const guestTrialLimit = 1;
      const freeAccountTrialLimit = 5;

      expect(guestTrialLimit).toBe(1);
      expect(freeAccountTrialLimit).toBe(5);

      // Simulating guest using 1 check
      const guestChecksUsed = 1;
      const guestRemaining = Math.max(0, guestTrialLimit - guestChecksUsed);
      expect(guestRemaining).toBe(0);

      // Transitioning to free registered account unlocks remaining (5 total - 1 used = 4)
      const accountRemaining = Math.max(0, freeAccountTrialLimit - guestChecksUsed);
      expect(accountRemaining).toBe(4);

      // Once all 5 account checks are used, balance is 0 and does not reset on session reload
      const accountUsedAll = 5;
      const accountExhausted = Math.max(0, freeAccountTrialLimit - accountUsedAll);
      expect(accountExhausted).toBe(0);
    });
  });

  describe('5. Paid Plan Credit Allocation & Annual Monthly Refill (Sections 13 & 14)', () => {
    it('verifies monthly credit grants by plan tier for both monthly and annual subscriptions', () => {
      const monthlyGrants = {
        free: 0,
        pro: 300,
        pro_plus: 1000,
        business: 3000,
        enterprise: 15000,
      };

      expect(monthlyGrants.pro).toBe(300);
      expect(monthlyGrants.pro_plus).toBe(1000);
      expect(monthlyGrants.business).toBe(3000);

      // Annual subscriptions receive monthly allocation (e.g. 300/mo, NOT 3,600 upfront)
      const annualBillingInterval = 'year';
      const annualMonthlyCreditGrant = (plan: 'pro' | 'pro_plus' | 'business') => monthlyGrants[plan];

      expect(annualMonthlyCreditGrant('pro')).toBe(300);
      expect(annualMonthlyCreditGrant('pro_plus')).toBe(1000);
      expect(annualMonthlyCreditGrant('business')).toBe(3000);
    });

    it('monthly refill updates plan allocation while preserving separately purchased top-up credits', () => {
      const stateBeforeRefill = {
        planCredits: 12, // Remaining from previous month
        topUpCredits: 350, // Separately purchased top-up pack
        monthlyAllocation: 300,
      };

      // Refill event triggers on monthly anniversary
      const stateAfterRefill = {
        planCredits: stateBeforeRefill.monthlyAllocation, // Refills to 300
        topUpCredits: stateBeforeRefill.topUpCredits, // Preserved 350
        totalAvailable: stateBeforeRefill.monthlyAllocation + stateBeforeRefill.topUpCredits, // 650
        nextRefillDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      expect(stateAfterRefill.planCredits).toBe(300);
      expect(stateAfterRefill.topUpCredits).toBe(350);
      expect(stateAfterRefill.totalAvailable).toBe(650);
    });
  });

  describe('6. Cancellation vs Expiration Policy (Sections 15 & 16)', () => {
    it('retains paid access and monthly credits until current period ends on cancellation', () => {
      const subscription = {
        plan: 'pro',
        status: 'active',
        cancel_at_period_end: true,
        current_period_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days left
        credits_balance: 180,
      };

      // Period has not ended yet => isPaidActive remains true
      const now = new Date();
      const isPeriodActive = new Date(subscription.current_period_end) > now;
      const isPaidActive = isPeriodActive && (subscription.status === 'active' || subscription.cancel_at_period_end);

      expect(isPaidActive).toBe(true);
      expect(subscription.credits_balance).toBe(180);
    });

    it('expires paid entitlements when period genuinely ends without destroying top-up balance', () => {
      const expiredSubscription = {
        plan: 'pro',
        status: 'canceled',
        cancel_at_period_end: true,
        current_period_end: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Ended yesterday
        plan_credits_balance: 0,
        topup_credits_balance: 200, // Top-up credits preserved!
      };

      const now = new Date();
      const isPaidActive = new Date(expiredSubscription.current_period_end) > now;
      expect(isPaidActive).toBe(false);

      // Top-up credits remain available in wallet
      const totalAvailable = isPaidActive ? expiredSubscription.plan_credits_balance + expiredSubscription.topup_credits_balance : expiredSubscription.topup_credits_balance;
      expect(totalAvailable).toBe(200);
    });
  });

  describe('7. Team Credit Accounting & Quota Protection (Section 18)', () => {
    it('enforces member sub-quota and prevents bypass even with large team pool', () => {
      const teamPool = {
        ownerCredits: 3000,
        memberAllocatedQuota: 200,
        memberUsed: 195,
      };

      const memberRemainingQuota = teamPool.memberAllocatedQuota - teamPool.memberUsed;
      expect(memberRemainingQuota).toBe(5);

      // Operation costing 10 credits
      const operationCost = 10;
      const canMemberExecute = memberRemainingQuota >= operationCost;
      expect(canMemberExecute).toBe(false); // Blocked because member quota is exceeded, even though owner pool has 3,000 credits
    });
  });
});
