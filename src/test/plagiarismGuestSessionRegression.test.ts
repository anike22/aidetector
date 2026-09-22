import { describe, it, expect } from 'vitest';
import { supabase } from '@/db/supabase';
import { ensureGuestSession, getVisitorId } from '@/lib/visitorId';
import { checkEntitlement } from '@/lib/entitlementsApi';
import { buildSearchCoverageReport } from '@/lib/plagiarism/coverageMatrix';

describe('Plagiarism Checker Guest Session & Error-State Regression', () => {
  it('1. ensureGuestSession returns canonical persistent guest id string', async () => {
    const localId = getVisitorId();
    expect(localId).toMatch(/^v_\d+_[a-zA-Z0-9]+$/);

    const guestId = await ensureGuestSession();
    expect(guestId).toBeTruthy();
    expect(typeof guestId).toBe('string');
  });

  it('2. entitlementsApi allows plagiarism_checker for guest introductory check', async () => {
    const ent = await checkEntitlement('plagiarism_checker');
    expect(ent).toBeDefined();
    expect(typeof ent.allowed).toBe('boolean');
    expect(ent.isTrialCheck).toBe(true);
  });

  it('3. Provider status matrix marks skipped providers as Not Checked (not Checked - 0 results)', () => {
    const report = buildSearchCoverageReport({
      crossref: 'skipped',
      openalex: 'skipped',
      unpaywall: 'skipped',
      webSearch: 'not_configured',
      exa: 'skipped',
    });

    const crossref = report.systems.find(s => s.id === 'crossref');
    expect(crossref).toBeDefined();
    expect(crossref?.status).toBe('not_checked');
    expect(crossref?.statusLabel).toBe('Not Checked');

    const openalex = report.systems.find(s => s.id === 'openalex');
    expect(openalex).toBeDefined();
    expect(openalex?.status).toBe('not_checked');
    expect(openalex?.statusLabel).toBe('Not Checked');

    const unpaywall = report.systems.find(s => s.id === 'unpaywall');
    expect(unpaywall).toBeDefined();
    expect(unpaywall?.status).toBe('not_checked');
    expect(unpaywall?.statusLabel).toBe('Not Checked');

    const web = report.systems.find(s => s.id === 'web_search');
    expect(web).toBeDefined();
    expect(web?.status).toBe('not_applicable');
    expect(web?.statusLabel).toBe('Not Configured');
  });

  it('4. Operational provider is distinguished from Not Checked and Unavailable', () => {
    const report = buildSearchCoverageReport({
      crossref: { status: 'ok', queriesSent: 5, candidatesReturned: 3, verifiedSources: 1 },
      openalex: 'failed',
      unpaywall: 'skipped',
      webSearch: 'ok',
    });

    const crossref = report.systems.find(s => s.id === 'crossref');
    expect(crossref?.status).toBe('checked');
    expect(crossref?.statusLabel).toBe('Operational: Verified');
    expect(crossref?.queriesSent).toBe(5);

    const openalex = report.systems.find(s => s.id === 'openalex');
    expect(openalex?.status).toBe('unavailable');
    expect(openalex?.statusLabel).toBe('Temporarily unavailable');

    const unpaywall = report.systems.find(s => s.id === 'unpaywall');
    expect(unpaywall?.status).toBe('not_checked');
    expect(unpaywall?.statusLabel).toBe('Not Checked');
  });

  it('5. Live DB check: guest session reserve with unique guest ID succeeds and settles atomically', async () => {
    const freshGuest = `reg_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const { data, error } = await supabase.rpc('reserve_entitlement_and_credits', {
      p_user_id: null,
      p_guest_id: freshGuest,
      p_feature_slug: 'plagiarism_checker',
      p_credits_cost: 1,
      p_timezone: 'UTC',
      p_unit_quantity: 1,
      p_idempotency_key: `idem_${freshGuest}`,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    const res = data![0];
    expect(res.allowed).toBe(true);
    expect(res.is_trial_check).toBe(true);

    // Settle with outcome success
    const { error: settleErr } = await supabase.rpc('settle_client_reservation', {
      p_reservation_id: res.reservation_id,
      p_guest_id: freshGuest,
      p_outcome: 'success',
    });
    expect(settleErr).toBeNull();

    // Second check attempt must be rejected with TRIAL_EXHAUSTED
    const { data: secondAttempt } = await supabase.rpc('reserve_entitlement_and_credits', {
      p_user_id: null,
      p_guest_id: freshGuest,
      p_feature_slug: 'plagiarism_checker',
      p_credits_cost: 1,
      p_timezone: 'UTC',
      p_unit_quantity: 1,
      p_idempotency_key: `idem_second_${freshGuest}`,
    });
    expect(secondAttempt![0].allowed).toBe(false);
    expect(secondAttempt![0].error_code).toBe('TRIAL_EXHAUSTED');
    expect(secondAttempt![0].trial_checks_remaining).toBe(0);

    // Clean up test session
    await supabase.from('server_guest_sessions').delete().eq('guest_id', freshGuest);
  });
});
