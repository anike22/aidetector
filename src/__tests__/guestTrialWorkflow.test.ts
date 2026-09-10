import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '@/db/supabase';
import {
  preserveDraftText,
  getPreservedDraftText,
  clearPreservedDraftText,
} from '@/lib/visitorId';
import {
  checkEntitlement,
  getLiveEntitlementSummary,
  reserveEntitlement,
  finalizeReservation,
} from '@/lib/entitlementsApi';
import { isTrialEligibleOperation, RATE_TABLE } from '@/lib/entitlements';

describe('Guest Trial Allowance and Workflow Verification', () => {
  beforeEach(() => {
    clearPreservedDraftText();
  });

  it('1. Fresh guest starts with 1/1 check available and 100% allowance', async () => {
    const testGuestId = `v_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    const { data, error } = await supabase.rpc('get_user_entitlement_summary', {
      p_user_id: null,
      p_guest_id: testGuestId,
      p_timezone: 'UTC',
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);

    const row = data![0];
    expect(row.plan).toBe('guest');
    expect(row.is_paid_active).toBe(false);
    expect(row.trial_checks_remaining).toBe(1);
    expect(row.trial_checks_total).toBe(1);
    expect(row.trial_checks_used).toBe(0);
    expect(row.warning_level).toBe('normal');
  });

  it('2. Guest executes first check: reservation succeeds atomically', async () => {
    const testGuestId = `v_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const { data, error } = await supabase.rpc('reserve_entitlement_and_credits', {
      p_user_id: null,
      p_guest_id: testGuestId,
      p_feature_slug: 'ai_detector',
      p_credits_cost: 1,
      p_timezone: 'UTC',
      p_unit_quantity: 100,
      p_idempotency_key: `idem_${Date.now()}`,
      p_metadata: { words: 120 },
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    const res = data![0];
    expect(res.allowed).toBe(true);
    expect(res.is_trial_check).toBe(true);
    expect(res.reservation_id).toBeTruthy();
    // Atomic deduction at reserve time: the single check is consumed.
    expect(res.trial_checks_remaining).toBe(0);
    expect(res.trial_checks_total).toBe(1);
  });

  it('3. Successful settlement decrements allowance to 0/1 (0% bar)', async () => {
    const testGuestId = `v_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Step A: Reserve
    const { data: resData } = await supabase.rpc('reserve_entitlement_and_credits', {
      p_user_id: null,
      p_guest_id: testGuestId,
      p_feature_slug: 'ai_detector',
      p_credits_cost: 1,
      p_timezone: 'UTC',
      p_unit_quantity: 100,
      p_idempotency_key: `idem_${Date.now()}`,
      p_metadata: {},
    });

    const reservationId = resData![0].reservation_id;

    // Step B: Finalize on success
    const { error: finalizeError } = await supabase.rpc('settle_client_reservation', {
      p_reservation_id: reservationId,
      p_outcome: 'success',
      p_guest_id: testGuestId,
    });

    expect(finalizeError).toBeNull();

    // Step C: Verify updated balance is 0/1 and warning level is exhausted
    const { data: summaryData } = await supabase.rpc('get_user_entitlement_summary', {
      p_user_id: null,
      p_guest_id: testGuestId,
      p_timezone: 'UTC',
    });

    const summary = summaryData![0];
    expect(summary.trial_checks_remaining).toBe(0);
    expect(summary.trial_checks_total).toBe(1);
    expect(summary.trial_checks_used).toBe(1);
    expect(summary.warning_level).toBe('exhausted');
  });

  it('4. Second check attempt by exhausted guest is rejected with TRIAL_EXHAUSTED', async () => {
    const testGuestId = `v_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // First check: Reserve & Finalize
    const { data: res1 } = await supabase.rpc('reserve_entitlement_and_credits', {
      p_user_id: null,
      p_guest_id: testGuestId,
      p_feature_slug: 'text_detect_balanced',
      p_credits_cost: 1,
      p_timezone: 'UTC',
      p_unit_quantity: 100,
    });

    await supabase.rpc('settle_client_reservation', {
      p_reservation_id: res1![0].reservation_id,
      p_outcome: 'success',
      p_guest_id: testGuestId,
    });

    // Second check attempt
    const { data: res2, error: err2 } = await supabase.rpc('reserve_entitlement_and_credits', {
      p_user_id: null,
      p_guest_id: testGuestId,
      p_feature_slug: 'text_detect_balanced',
      p_credits_cost: 1,
      p_timezone: 'UTC',
      p_unit_quantity: 100,
    });

    expect(err2).toBeNull();
    const secondAttempt = res2![0];
    expect(secondAttempt.allowed).toBe(false);
    expect(secondAttempt.error_code).toBe('TRIAL_EXHAUSTED');
    expect(secondAttempt.trial_checks_remaining).toBe(0);
    expect(secondAttempt.reason).toContain("You've used your free check. Register for 4 additional free checks.");
  });

  it('5. Processing failure releases reservation and keeps 1/1 check available', async () => {
    const testGuestId = `v_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Reserve check
    const { data: resData } = await supabase.rpc('reserve_entitlement_and_credits', {
      p_user_id: null,
      p_guest_id: testGuestId,
      p_feature_slug: 'ai_detector',
      p_credits_cost: 1,
      p_timezone: 'UTC',
      p_unit_quantity: 100,
    });

    const reservationId = resData![0].reservation_id;

    // Simulate analysis processing failure (e.g. network/provider error)
    await supabase.rpc('settle_client_reservation', {
      p_reservation_id: reservationId,
      p_outcome: 'failed',
      p_metadata: { reason: 'Simulated backend timeout' },
      p_guest_id: testGuestId,
    });

    // Check balance remains 1/1
    const { data: summaryData } = await supabase.rpc('get_user_entitlement_summary', {
      p_user_id: null,
      p_guest_id: testGuestId,
      p_timezone: 'UTC',
    });

    const summary = summaryData![0];
    expect(summary.trial_checks_remaining).toBe(1);
    expect(summary.trial_checks_used).toBe(0);
    expect(summary.warning_level).toBe('normal');
  });

  it('6. Anonymous or third-party callers cannot link guest usage to an account', async () => {
    const testGuestId = `v_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Guest uses 1 check (anon context)
    const { data: res1 } = await supabase.rpc('reserve_entitlement_and_credits', {
      p_user_id: null,
      p_guest_id: testGuestId,
      p_feature_slug: 'ai_detector',
      p_credits_cost: 1,
      p_timezone: 'UTC',
      p_unit_quantity: 100,
    });
    expect(res1![0].allowed).toBe(true);

    await supabase.rpc('settle_client_reservation', {
      p_reservation_id: res1![0].reservation_id,
      p_outcome: 'success',
      p_guest_id: testGuestId,
    });

    // Anon caller linking to another account's user id must be REJECTED
    // (prevents stealing/merging trial allowances; the +4-once grant for
    // the actual owner is covered by the service-role SQL suite).
    const { error: linkError } = await supabase.rpc('link_guest_to_registered_user', {
      p_guest_id: testGuestId,
      p_user_id: '025ac332-43b2-4d56-ac3e-282b5e200305',
      p_timezone: 'UTC',
    });
    expect(linkError).toBeTruthy();
    expect(linkError!.message).toContain('Not authorized');
  });

  it('7. Draft text is preserved across navigation and sign-up redirects', () => {
    const draftContent = 'This is a high quality test essay drafted by a student needing AI detection.';
    
    preserveDraftText(draftContent, 'ai_detector');
    
    const retrieved = getPreservedDraftText('ai_detector');
    expect(retrieved).toBe(draftContent);

    clearPreservedDraftText();
    expect(getPreservedDraftText('ai_detector')).toBeNull();
  });

  it('8. Rate table accurately covers all primary and alias slugs', () => {
    expect(isTrialEligibleOperation('ai_detector')).toBe(true);
    expect(isTrialEligibleOperation('text_detect_balanced')).toBe(true);
    expect(isTrialEligibleOperation('ai_image_detector')).toBe(true);
    expect(isTrialEligibleOperation('image_detect_standard')).toBe(true);
    expect(isTrialEligibleOperation('ai_video_detector')).toBe(true);
    expect(isTrialEligibleOperation('video_detect_balanced')).toBe(true);

    // Paid-only features
    expect(isTrialEligibleOperation('text_detect_aggressive')).toBe(false);
    expect(isTrialEligibleOperation('image_detect_advanced')).toBe(false);
    expect(isTrialEligibleOperation('video_detect_high_sensitivity')).toBe(false);
    expect(isTrialEligibleOperation('citation_verify')).toBe(false);
  });
});
