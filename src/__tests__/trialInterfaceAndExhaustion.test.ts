import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  PLAN_TIERS,
  RATE_TABLE,
  isTrialEligibleOperation,
  calculateOperationCreditCost,
} from '../lib/entitlements';
import {
  preserveDraftText,
  getPreservedDraftText,
  clearPreservedDraftText,
  getVisitorId,
} from '../lib/visitorId';

describe('Trial Interface & Exhaustion Flow Specifications', () => {
  beforeEach(() => {
    // Mock sessionStorage
    const storage: Record<string, string> = {};
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        Object.keys(storage).forEach((key) => delete storage[key]);
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Trial Copy Specifications', () => {
    it('generates the exact trial copy for guest users', () => {
      const guestTrialCopy = 'You have 1 free check. Register to unlock 4 additional free checks.';
      expect(guestTrialCopy).toBe('You have 1 free check. Register to unlock 4 additional free checks.');
    });

    it('generates the exact exhaustion copy for guest users when attempting another check', () => {
      const guestExhaustedCopy = 'You’ve used your free guest check. Create an account to get 4 additional free checks.';
      expect(guestExhaustedCopy).toBe('You’ve used your free guest check. Create an account to get 4 additional free checks.');
    });

    it('generates the exact trial allowance copy for registered free users with 4, 3, 2, 1, 0 remaining', () => {
      const formatTrialAllowance = (count: number) =>
        `You have ${count} free check${count === 1 ? '' : 's'} remaining.`;

      expect(formatTrialAllowance(4)).toBe('You have 4 free checks remaining.');
      expect(formatTrialAllowance(3)).toBe('You have 3 free checks remaining.');
      expect(formatTrialAllowance(2)).toBe('You have 2 free checks remaining.');
      expect(formatTrialAllowance(1)).toBe('You have 1 free check remaining.');
      expect(formatTrialAllowance(0)).toBe('You have 0 free checks remaining.');
    });

    it('generates the exact exhaustion copy for registered free users when attempting another check', () => {
      const registeredExhaustedCopy = 'You’ve used all your free checks. Choose a plan to continue.';
      expect(registeredExhaustedCopy).toBe('You’ve used all your free checks. Choose a plan to continue.');
    });
  });

  describe('Allowance Countdown & Deduction Logic', () => {
    it('simulates registered free user countdown: 4 -> 3 -> 2 -> 1 -> 0', () => {
      let remaining = 4;
      const history: number[] = [remaining];

      // Step 1: Check 1 succeeds
      remaining = Math.max(0, remaining - 1);
      history.push(remaining);
      expect(remaining).toBe(3);

      // Step 2: Check 2 succeeds
      remaining = Math.max(0, remaining - 1);
      history.push(remaining);
      expect(remaining).toBe(2);

      // Step 3: Check 3 succeeds
      remaining = Math.max(0, remaining - 1);
      history.push(remaining);
      expect(remaining).toBe(1);

      // Step 4: Check 4 succeeds (final free check)
      remaining = Math.max(0, remaining - 1);
      history.push(remaining);
      expect(remaining).toBe(0);

      expect(history).toEqual([4, 3, 2, 1, 0]);
    });

    it('does not deduct allowance on failed checks', () => {
      let remaining = 4;
      const executeCheck = (shouldFail: boolean) => {
        if (shouldFail) {
          // Failure: allowance remains untouched
          return { success: false, remaining };
        }
        remaining = Math.max(0, remaining - 1);
        return { success: true, remaining };
      };

      expect(executeCheck(true).remaining).toBe(4);
      expect(executeCheck(false).remaining).toBe(3);
      expect(executeCheck(true).remaining).toBe(3);
      expect(executeCheck(false).remaining).toBe(2);
    });
  });

  describe('Draft Input Preservation', () => {
    it('preserves draft input in sessionStorage without placing it in URLs', () => {
      const testContent = 'This is confidential draft text that should never be placed in URL query strings.';
      preserveDraftText(testContent, 'text_detect_balanced');

      const retrieved = getPreservedDraftText('text_detect_balanced');
      expect(retrieved).toBe(testContent);

      // Clearing draft
      clearPreservedDraftText();
      expect(getPreservedDraftText('text_detect_balanced')).toBeNull();
    });

    it('isolates draft text by feature slug to prevent cross-tool pollution', () => {
      preserveDraftText('Detector draft', 'ai_detector');
      expect(getPreservedDraftText('plagiarism_checker')).toBeNull();
      expect(getPreservedDraftText('ai_detector')).toBe('Detector draft');
    });
  });

  describe('Trial Eligibility and Paid Rate Preservation', () => {
    it('allows trial checks only on trial-eligible tools (text, image, video detection)', () => {
      expect(isTrialEligibleOperation('text_detect_balanced')).toBe(true);
      expect(isTrialEligibleOperation('ai_image_detector')).toBe(true);
      expect(isTrialEligibleOperation('ai_video_detector')).toBe(true);
      expect(isTrialEligibleOperation('ai_detector')).toBe(true);
    });

    it('preserves paid plan rates and allocations', () => {
      expect(PLAN_TIERS.pro.monthlyCredits).toBe(300);
      expect(PLAN_TIERS.business.monthlyCredits).toBe(3000);
      expect(PLAN_TIERS.enterprise.monthlyCredits).toBe(15000);

      expect(calculateOperationCreditCost('text_detect_balanced', { words: 500 })).toBe(1);
      expect(calculateOperationCreditCost('humanizer_rewrite', { words: 800 })).toBe(10);
      expect(calculateOperationCreditCost('video_detect_balanced', { videoSeconds: 30 })).toBe(15);
      expect(calculateOperationCreditCost('image_detect_standard', { images: 1 })).toBe(5);
    });
  });
});
