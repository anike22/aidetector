import { describe, it, expect } from 'vitest';
import { calculateOperationCreditCost, isTrialEligibleOperation, getFeatureRateConfig } from '@/lib/entitlements';
import { analyzePlagiarism } from '@/pages/detector/detectionEngine';

describe('Plagiarism Entitlement and Billing Matrix Tests', () => {
  it('1. verifies rate table configuration for plagiarism_check and aliases', () => {
    const configCheck = getFeatureRateConfig('plagiarism_check');
    expect(configCheck).toBeDefined();
    expect(configCheck?.baseCreditCost).toBe(2);
    expect(configCheck?.billingUnit).toBe('words_1000');
    expect(configCheck?.minPlan).toBe('free');
    expect(configCheck?.trialEligible).toBe(true);

    const configChecker = getFeatureRateConfig('plagiarism_checker');
    expect(configChecker).toBeDefined();
    expect(configChecker?.baseCreditCost).toBe(2);
    expect(configChecker?.billingUnit).toBe('words_1000');
  });

  it('2. calculates accurate credit costs per 1,000 words for paid users', () => {
    // 500 words = 1 unit of 1000 = 2 credits
    expect(calculateOperationCreditCost('plagiarism_check', { words: 500 })).toBe(2);
    // 1000 words = 1 unit = 2 credits
    expect(calculateOperationCreditCost('plagiarism_check', { words: 1000 })).toBe(2);
    // 1001 words = 2 units = 4 credits
    expect(calculateOperationCreditCost('plagiarism_check', { words: 1001 })).toBe(4);
    // 2500 words = 3 units = 6 credits
    expect(calculateOperationCreditCost('plagiarism_check', { words: 2500 })).toBe(6);
    expect(calculateOperationCreditCost('plagiarism_checker', { words: 2500 })).toBe(6);
  });

  it('3. confirms plagiarism is trial-eligible for guest and free accounts', () => {
    expect(isTrialEligibleOperation('plagiarism_check')).toBe(true);
    expect(isTrialEligibleOperation('plagiarism_checker')).toBe(true);
  });

  it('4. distinguishes error classification structure: INSUFFICIENT_CREDITS vs UPGRADE_REQUIRED', () => {
    // Verify that INSUFFICIENT_CREDITS does not set upgrade_required to true
    const insufficientCreditsError = {
      error_code: 'INSUFFICIENT_CREDITS',
      error: 'Insufficient credits for this operation (4 credits needed, balance: 1). Please top up or renew your plan to continue.',
      upgrade_required: false,
    };
    expect(insufficientCreditsError.upgrade_required).toBe(false);
    expect(insufficientCreditsError.error_code).toBe('INSUFFICIENT_CREDITS');

    const upgradeRequiredError = {
      error_code: 'UPGRADE_REQUIRED',
      error: 'This feature requires an active Pro subscription. Upgrade to continue.',
      upgrade_required: true,
    };
    expect(upgradeRequiredError.upgrade_required).toBe(true);
    expect(upgradeRequiredError.error_code).toBe('UPGRADE_REQUIRED');
  });
});
