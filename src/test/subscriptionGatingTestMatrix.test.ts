import { describe, it, expect } from 'vitest';
import { RATE_TABLE, calculateBloggerAnalysisCost, calculateOperationCreditCost, isTrialEligibleOperation } from '@/lib/entitlements';
import { isPaidSubscriptionActive } from '@/lib/subscription';

// Authoritative entitlement simulation matching checkEntitlement and PostgreSQL reserve_entitlement_and_credits
function evaluateEntitlement({
  isAuthenticated,
  isPaidActive,
  plan,
  creditsBalance,
  trialChecksRemaining,
  featureSlug,
  wordCount,
}: {
  isAuthenticated: boolean;
  isPaidActive: boolean;
  plan: 'guest' | 'free' | 'pro' | 'pro_plus' | 'business' | 'enterprise';
  creditsBalance: number;
  trialChecksRemaining: number;
  featureSlug: string;
  wordCount?: number;
}) {
  const rateItem = RATE_TABLE[featureSlug];
  if (!rateItem) {
    return { allowed: false, errorCode: 'MISSING_RATE_CONFIG', reason: 'Feature not configured' };
  }

  const minPlan = rateItem.minPlan;
  const ranks: Record<string, number> = { guest: 0, free: 1, pro: 2, pro_plus: 3, 'pro+': 3, business: 4, enterprise: 5 };
  const userRank = ranks[plan] ?? 0;
  const requiredRank = ranks[minPlan] ?? 99;
  const cost = wordCount ? calculateOperationCreditCost(featureSlug, { words: wordCount }) : rateItem.baseCreditCost;
  const trialEligible = rateItem.trialEligible;

  // 1. Paid active subscriber
  if (isPaidActive) {
    if (userRank < requiredRank) {
      return { allowed: false, errorCode: 'UPGRADE_REQUIRED', reason: 'Your plan does not include this feature.' };
    }
    if (creditsBalance >= cost) {
      return { allowed: true, isTrialCheck: false, cost, errorCode: null };
    }
    return { allowed: false, errorCode: 'CREDITS_EXHAUSTED', reason: 'Credit balance depleted.' };
  }

  // 2. Inactive / Expired paid plan
  if (isAuthenticated && userRank >= 2) {
    return { allowed: false, errorCode: 'SUBSCRIPTION_EXPIRED', reason: 'Subscription inactive or expired.' };
  }

  // 3. Guest (Not authenticated)
  if (!isAuthenticated) {
    if (requiredRank >= 2) {
      return { allowed: false, errorCode: 'UPGRADE_REQUIRED', reason: 'This feature requires a paid subscription.' };
    }
    if (trialEligible && trialChecksRemaining > 0) {
      return { allowed: true, isTrialCheck: true, cost: 0, errorCode: null };
    }
    return { allowed: false, errorCode: 'TRIAL_EXHAUSTED', reason: 'Guest trial check exhausted.' };
  }

  // 4. Authenticated Free User
  if (requiredRank >= 2) {
    // Pro feature requested by free user - Credits DO NOT bypass subscription gating!
    return { allowed: false, errorCode: 'UPGRADE_REQUIRED', reason: 'This feature requires a Pro or Business plan.' };
  }

  if (trialEligible && trialChecksRemaining > 0) {
    return { allowed: true, isTrialCheck: true, cost: 0, errorCode: null };
  }

  return { allowed: false, errorCode: 'TRIAL_EXHAUSTED', reason: 'Free checks exhausted.' };
}

describe('Subscription Gating & Entitlement Test Matrix', () => {
  describe('1. Rate Table Configuration Integrity', () => {
    it('configures ai_checker_for_bloggers as Pro-only with words_500 unit and no trial bypass', () => {
      const rate = RATE_TABLE['ai_checker_for_bloggers'];
      expect(rate).toBeDefined();
      expect(rate.minPlan).toBe('pro');
      expect(rate.trialEligible).toBe(false);
      expect(rate.baseCreditCost).toBe(5);
      expect(rate.billingUnit).toBe('words_500');
    });

    it('configures seo_assistant and generate_article as Pro-only', () => {
      expect(RATE_TABLE['seo_assistant'].minPlan).toBe('pro');
      expect(RATE_TABLE['seo_assistant'].trialEligible).toBe(false);
      expect(RATE_TABLE['generate_article'].minPlan).toBe('pro');
      expect(RATE_TABLE['generate_article'].trialEligible).toBe(false);
    });

    it('configures api_access as Business-only', () => {
      expect(RATE_TABLE['api_access'].minPlan).toBe('business');
      expect(RATE_TABLE['api_access'].trialEligible).toBe(false);
    });
  });

  describe('2. User State 1: Guest User', () => {
    it('blocks Guest from running ai_checker_for_bloggers full analysis', () => {
      const result = evaluateEntitlement({
        isAuthenticated: false,
        isPaidActive: false,
        plan: 'guest',
        creditsBalance: 0,
        trialChecksRemaining: 1,
        featureSlug: 'ai_checker_for_bloggers',
        wordCount: 1200,
      });

      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe('UPGRADE_REQUIRED');
    });

    it('allows Guest to use trial-eligible text detection if trial check remaining', () => {
      const result = evaluateEntitlement({
        isAuthenticated: false,
        isPaidActive: false,
        plan: 'guest',
        creditsBalance: 0,
        trialChecksRemaining: 1,
        featureSlug: 'text_detect_balanced',
      });

      expect(result.allowed).toBe(true);
      expect(result.isTrialCheck).toBe(true);
    });
  });

  describe('3. User State 2: Registered Free User with Free Allowance', () => {
    it('blocks Free user from ai_checker_for_bloggers even with 5 free checks remaining', () => {
      const result = evaluateEntitlement({
        isAuthenticated: true,
        isPaidActive: false,
        plan: 'free',
        creditsBalance: 0,
        trialChecksRemaining: 5,
        featureSlug: 'ai_checker_for_bloggers',
        wordCount: 500,
      });

      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe('UPGRADE_REQUIRED');
    });

    it('allows Free user to use standard text detection with trial check', () => {
      const result = evaluateEntitlement({
        isAuthenticated: true,
        isPaidActive: false,
        plan: 'free',
        creditsBalance: 0,
        trialChecksRemaining: 5,
        featureSlug: 'text_detect_balanced',
      });

      expect(result.allowed).toBe(true);
      expect(result.isTrialCheck).toBe(true);
    });
  });

  describe('4. User State 3: Registered Free User with 0 Free Checks', () => {
    it('blocks Free user with 0 checks from standard detection', () => {
      const result = evaluateEntitlement({
        isAuthenticated: true,
        isPaidActive: false,
        plan: 'free',
        creditsBalance: 0,
        trialChecksRemaining: 0,
        featureSlug: 'text_detect_balanced',
      });

      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe('TRIAL_EXHAUSTED');
    });

    it('blocks Free user with 0 checks from ai_checker_for_bloggers', () => {
      const result = evaluateEntitlement({
        isAuthenticated: true,
        isPaidActive: false,
        plan: 'free',
        creditsBalance: 0,
        trialChecksRemaining: 0,
        featureSlug: 'ai_checker_for_bloggers',
        wordCount: 800,
      });

      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe('UPGRADE_REQUIRED');
    });
  });

  describe('5. User State 4 & 5: Non-Subscriber with Purchased Top-Up Credits (CRITICAL RULE)', () => {
    it('DOES NOT unlock Pro features (ai_checker_for_bloggers) just because 500 top-up credits exist', () => {
      const result = evaluateEntitlement({
        isAuthenticated: true,
        isPaidActive: false,
        plan: 'free',
        creditsBalance: 500, // Top-up credits
        trialChecksRemaining: 0,
        featureSlug: 'ai_checker_for_bloggers',
        wordCount: 3716, // 40 credits cost
      });

      // Top-up credits provide capacity, NOT subscription entitlement
      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe('UPGRADE_REQUIRED');
    });

    it('DOES NOT unlock SEO Assistant or Generate Article for non-subscriber with top-up credits', () => {
      const seoRes = evaluateEntitlement({
        isAuthenticated: true,
        isPaidActive: false,
        plan: 'free',
        creditsBalance: 1000,
        trialChecksRemaining: 0,
        featureSlug: 'seo_assistant',
      });
      expect(seoRes.allowed).toBe(false);
      expect(seoRes.errorCode).toBe('UPGRADE_REQUIRED');

      const genRes = evaluateEntitlement({
        isAuthenticated: true,
        isPaidActive: false,
        plan: 'free',
        creditsBalance: 1000,
        trialChecksRemaining: 0,
        featureSlug: 'generate_article',
      });
      expect(genRes.allowed).toBe(false);
      expect(genRes.errorCode).toBe('UPGRADE_REQUIRED');
    });
  });

  describe('6. User State 6: Active Subscriber with Sufficient Credits', () => {
    it('allows Pro subscriber to run ai_checker_for_bloggers and computes 40 credits for 3,716 words', () => {
      const wordCount = 3716;
      const expectedCost = calculateBloggerAnalysisCost(wordCount);
      expect(expectedCost).toBe(40);

      const result = evaluateEntitlement({
        isAuthenticated: true,
        isPaidActive: true,
        plan: 'pro',
        creditsBalance: 1000,
        trialChecksRemaining: 0,
        featureSlug: 'ai_checker_for_bloggers',
        wordCount,
      });

      expect(result.allowed).toBe(true);
      expect(result.isTrialCheck).toBe(false);
      expect(result.cost).toBe(40);
    });

    it('allows Pro subscriber to run ai_checker_for_bloggers and computes 45 credits for 4,373 words', () => {
      const wordCount = 4373;
      const expectedCost = calculateBloggerAnalysisCost(wordCount);
      expect(expectedCost).toBe(45);

      const result = evaluateEntitlement({
        isAuthenticated: true,
        isPaidActive: true,
        plan: 'pro',
        creditsBalance: 500,
        trialChecksRemaining: 0,
        featureSlug: 'ai_checker_for_bloggers',
        wordCount,
      });

      expect(result.allowed).toBe(true);
      expect(result.isTrialCheck).toBe(false);
      expect(result.cost).toBe(45);
    });
  });

  describe('7. User State 7: Active Subscriber with 0 Credits', () => {
    it('blocks Pro subscriber with 0 credits from running ai_checker_for_bloggers with CREDITS_EXHAUSTED', () => {
      const result = evaluateEntitlement({
        isAuthenticated: true,
        isPaidActive: true,
        plan: 'pro',
        creditsBalance: 0,
        trialChecksRemaining: 0,
        featureSlug: 'ai_checker_for_bloggers',
        wordCount: 500,
      });

      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe('CREDITS_EXHAUSTED');
    });
  });

  describe('8. User State 8: Cancelled Subscriber Still Inside Paid Period', () => {
    it('maintains Pro access while current_period_end is in the future', () => {
      const futureDate = new Date(Date.now() + 15 * 86400000).toISOString();
      const isPaidActive = isPaidSubscriptionActive('pro', 'active', futureDate);
      expect(isPaidActive).toBe(true);

      const result = evaluateEntitlement({
        isAuthenticated: true,
        isPaidActive,
        plan: 'pro',
        creditsBalance: 300,
        trialChecksRemaining: 0,
        featureSlug: 'ai_checker_for_bloggers',
        wordCount: 500,
      });

      expect(result.allowed).toBe(true);
      expect(result.cost).toBe(5);
    });
  });

  describe('9. User State 9: Expired Subscriber with Remaining/Top-Up Credits', () => {
    it('blocks expired Pro subscriber even if top-up credits balance is positive', () => {
      const pastDate = new Date(Date.now() - 5 * 86400000).toISOString();
      const isPaidActive = isPaidSubscriptionActive('pro', 'canceled', pastDate);
      expect(isPaidActive).toBe(false);

      const result = evaluateEntitlement({
        isAuthenticated: true,
        isPaidActive,
        plan: 'pro',
        creditsBalance: 200, // leftover top-up credits
        trialChecksRemaining: 0,
        featureSlug: 'ai_checker_for_bloggers',
        wordCount: 500,
      });

      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe('SUBSCRIPTION_EXPIRED');
    });
  });

  describe('10. User State 10: Business/Enterprise Plan Hierarchy', () => {
    it('blocks Pro user from Business-only features (api_access)', () => {
      const result = evaluateEntitlement({
        isAuthenticated: true,
        isPaidActive: true,
        plan: 'pro',
        creditsBalance: 1000,
        trialChecksRemaining: 0,
        featureSlug: 'api_access',
      });

      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe('UPGRADE_REQUIRED');
    });

    it('allows Business subscriber to use api_access and ai_checker_for_bloggers', () => {
      const apiRes = evaluateEntitlement({
        isAuthenticated: true,
        isPaidActive: true,
        plan: 'business',
        creditsBalance: 3000,
        trialChecksRemaining: 0,
        featureSlug: 'api_access',
      });
      expect(apiRes.allowed).toBe(true);

      const bloggerRes = evaluateEntitlement({
        isAuthenticated: true,
        isPaidActive: true,
        plan: 'business',
        creditsBalance: 3000,
        trialChecksRemaining: 0,
        featureSlug: 'ai_checker_for_bloggers',
        wordCount: 2000,
      });
      expect(bloggerRes.allowed).toBe(true);
      expect(bloggerRes.cost).toBe(20); // ceil(2000/500)*5 = 20
    });
  });
});
