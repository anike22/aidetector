import { supabase } from '@/db/supabase';
import { ensureGuestSession, getVisitorId, preserveDraftText, getPreservedDraftText } from './visitorId';
import { calculateOperationCreditCost, isTrialEligibleOperation, RATE_TABLE } from './entitlements';

export interface EntitlementCheckResult {
  allowed: boolean;
  reason: string | null;
  errorCode?: string | null;
  plan: string;
  remainingCredits: number;
  trialChecksRemaining: number;
  trialChecksTotal: number;
  isTrialCheck: boolean;
  feature_slug: string;
  resetAt?: string | null;
  isAuthenticated?: boolean;
  reservationId?: string | null;
  // Legacy compatibility fields
  remaining?: number | null;
  limit?: number | null;
  dailyRemaining?: number | null;
  dailyLimit?: number | null;
}

export interface EntitlementSummary {
  plan: string;
  status: string;
  isPaidActive: boolean;
  creditsBalance: number;
  creditsUsedTotal: number;
  trialChecksRemaining: number;
  trialChecksUsed: number;
  trialChecksTotal: number;
  monthlyCreditAllocation: number;
  creditsRefillDate: string | null;
  planEndDate: string | null;
  warningLevel: 'normal' | 'warning_80' | 'warning_95' | 'exhausted';
  guestId: string | null;
  isAuthenticated: boolean;
  topUpCreditsBalance?: number;
  planCreditsBalance?: number;
  // Legacy compatibility fields
  dailyLimit?: number | null;
  dailyRemaining?: number | null;
  dailyUsed?: number;
  resetAt?: string | null;
}

export interface UsageRecordResult {
  remaining: number | null;
  limit: number | null;
  used: number | null;
  reset_at: string | null;
  feature_slug: string;
}

function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

const reservationGuestIds = new Map<string, string>();

/**
 * Fetch authoritative live entitlement summary for current user or guest directly from DB RPC.
 */
export async function getLiveEntitlementSummary(): Promise<EntitlementSummary> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || null;
  const guestId = userId ? null : getVisitorId();
  const tz = getTimezone();

  const { data, error } = await supabase.rpc('get_user_entitlement_summary', {
    p_user_id: userId,
    p_guest_id: guestId,
    p_timezone: tz,
  });

  if (error) {
    console.warn('[getLiveEntitlementSummary] RPC error:', error);
    const plan = userId ? 'free' : 'guest';
    const trialTotal = userId ? 5 : 1;
    return {
      plan,
      status: 'Active',
      isPaidActive: false,
      creditsBalance: 0,
      creditsUsedTotal: 0,
      trialChecksRemaining: 0,
      trialChecksUsed: trialTotal,
      trialChecksTotal: trialTotal,
      monthlyCreditAllocation: 0,
      creditsRefillDate: null,
      planEndDate: null,
      warningLevel: 'exhausted',
      guestId,
      isAuthenticated: !!userId,
      dailyLimit: trialTotal,
      dailyRemaining: 0,
      dailyUsed: trialTotal,
      resetAt: null,
    };
  }

  const row = (data || [])[0] || {};
  const trialTotal = row.trial_checks_total ?? (userId ? 5 : 1);
  const trialRemaining = typeof row.trial_checks_remaining === 'number' ? row.trial_checks_remaining : (userId ? 5 : 1);
  const trialUsed = row.trial_checks_used ?? 0;
  const topUpCredits = row.topup_credits_balance ?? 0;
  const planCredits = row.plan_credits_balance ?? (row.credits_balance ?? 0);

  return {
    plan: row.plan || (userId ? 'free' : 'guest'),
    status: row.status || 'Active',
    isPaidActive: Boolean(row.is_paid_active),
    creditsBalance: row.credits_balance ?? 0,
    creditsUsedTotal: row.credits_used_total ?? 0,
    trialChecksRemaining: trialRemaining,
    trialChecksUsed: trialUsed,
    trialChecksTotal: trialTotal,
    monthlyCreditAllocation: row.monthly_credit_allocation ?? 0,
    creditsRefillDate: row.credits_refill_date || null,
    planEndDate: row.plan_end_date || null,
    warningLevel: row.warning_level || (trialRemaining <= 0 ? 'exhausted' : 'normal'),
    guestId,
    isAuthenticated: !!userId,
    topUpCreditsBalance: topUpCredits,
    planCreditsBalance: planCredits,
    dailyLimit: trialTotal,
    dailyRemaining: trialRemaining,
    dailyUsed: trialUsed,
    resetAt: null,
  };
}

/**
 * Check entitlement for a specific feature before executing (read-only preflight check).
 * Does NOT create a pending credit reservation.
 */
export async function checkEntitlement(
  featureSlug: string,
  creditsCost?: number,
  units?: {
    words?: number;
    engines?: number;
    images?: number;
    videoSeconds?: number;
    audioMinutes?: number;
    references?: number;
  }
): Promise<EntitlementCheckResult> {
  const summary = await getLiveEntitlementSummary();
  const cost = creditsCost ?? calculateOperationCreditCost(featureSlug, units);
  const trialEligible = isTrialEligibleOperation(featureSlug);

  const rateItem = RATE_TABLE[featureSlug];
  const minPlan = rateItem?.minPlan || 'free';
  const ranks: Record<string, number> = { guest: 0, free: 1, pro: 2, pro_plus: 3, 'pro+': 3, business: 4, enterprise: 5 };

  const isGuest = !summary.isAuthenticated;
  const isPaid = summary.isPaidActive;
  const hasTrialRemaining = summary.trialChecksRemaining > 0;
  const hasCredits = summary.creditsBalance >= cost;

  let allowed = false;
  let isTrialCheck = false;
  let reason: string | null = null;
  let errorCode: string | null = null;

  if (isPaid) {
    if ((ranks[summary.plan] ?? -1) < (ranks[minPlan] ?? 99)) {
      errorCode = 'UPGRADE_REQUIRED';
      reason = 'Your plan does not include this feature.';
    } else if (hasCredits) {
      allowed = true;
      isTrialCheck = false;
    } else {
      allowed = false;
      errorCode = 'CREDITS_EXHAUSTED';
      reason = 'Monthly credit balance depleted. Please top up or renew.';
    }
  } else if (!isGuest && (ranks[summary.plan] ?? 0) >= 2) {
    errorCode = 'SUBSCRIPTION_EXPIRED';
    reason = 'Your paid subscription is inactive or expired. Renew to continue.';
  } else if (isGuest) {
    if (['pro', 'pro_plus', 'business', 'enterprise'].includes(minPlan)) {
      allowed = false;
      errorCode = 'UPGRADE_REQUIRED';
      reason = 'This feature requires a paid subscription. Please sign in and upgrade.';
    } else if (minPlan === 'free' && !['text_detect_balanced', 'ai_detector', 'image_detect_standard', 'ai_image_detector', 'video_detect_balanced', 'ai_video_detector', 'voice_analysis', 'ai_summarizer', 'plagiarism_checker', 'plagiarism_check'].includes(featureSlug)) {
      allowed = false;
      errorCode = 'REGISTER_REQUIRED';
      reason = 'This feature requires a free registered account. Please sign up to get 4 additional free checks.';
    } else if (trialEligible && hasTrialRemaining) {
      allowed = true;
      isTrialCheck = true;
    } else {
      allowed = false;
      errorCode = 'TRIAL_EXHAUSTED';
      reason = 'You’ve used your free guest check. Create an account to get 4 additional free checks.';
    }
  } else {
    // Authenticated Free user
    if (['pro', 'pro_plus', 'business', 'enterprise'].includes(minPlan)) {
      allowed = false;
      errorCode = 'UPGRADE_REQUIRED';
      reason = 'This feature requires a Pro or Business plan. Please upgrade to continue.';
    } else if (trialEligible && hasTrialRemaining) {
      allowed = true;
      isTrialCheck = true;
    } else {
      allowed = false;
      errorCode = 'TRIAL_EXHAUSTED';
      reason = 'You’ve used all your free checks. Choose a plan to continue.';
    }
  }

  return {
    allowed,
    reason,
    errorCode,
    plan: summary.plan,
    remainingCredits: summary.creditsBalance,
    trialChecksRemaining: summary.trialChecksRemaining,
    trialChecksTotal: summary.trialChecksTotal,
    isTrialCheck,
    feature_slug: featureSlug,
    resetAt: null,
    isAuthenticated: summary.isAuthenticated,
    reservationId: null,
    remaining: isTrialCheck ? summary.trialChecksRemaining : summary.creditsBalance,
    limit: isTrialCheck ? summary.trialChecksTotal : summary.monthlyCreditAllocation,
    dailyRemaining: summary.trialChecksRemaining,
    dailyLimit: summary.trialChecksTotal,
  };
}

export interface ReservationResponse {
  success: boolean;
  allowed: boolean;
  reservationId?: string | null;
  isTrialCheck?: boolean;
  reason?: string | null;
  errorCode?: string | null;
}

/**
 * Reserve entitlement atomically before starting job.
 */
export async function reserveEntitlement(
  featureSlug: string,
  cost?: number,
  units?: {
    words?: number;
    engines?: number;
    images?: number;
    videoSeconds?: number;
    audioMinutes?: number;
    references?: number;
  },
  idempotencyKey?: string
): Promise<ReservationResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || null;
  const guestId = userId ? null : await ensureGuestSession();
  const tz = getTimezone();

  const finalCost = cost ?? calculateOperationCreditCost(featureSlug, units);

  try {
    const { data, error } = await supabase.rpc('reserve_entitlement_and_credits', {
      p_user_id: userId,
      p_guest_id: guestId,
      p_feature_slug: featureSlug,
      p_credits_cost: finalCost,
      p_timezone: tz,
      p_idempotency_key: idempotencyKey || null,
      p_metadata: { engines: units?.engines ?? 1 },
      p_unit_quantity: units?.words ?? units?.images ?? units?.videoSeconds ??
        (units?.audioMinutes !== undefined ? Math.ceil(units.audioMinutes * 60) : undefined) ?? units?.references ??
        (RATE_TABLE[featureSlug]?.billingUnit === 'words_1000' ? null : 1),
    });

    if (error) {
      console.warn('[reserveEntitlement] RPC error:', error);
      return { success: false, allowed: false, reason: error.message, errorCode: 'RPC_ERROR' };
    }

    const row = (data || [])[0] || {};
    const allowed = row.allowed === true && !!row.reservation_id;
    if (allowed && guestId && row.reservation_id) {
      reservationGuestIds.set(row.reservation_id, guestId);
    }
    return {
      success: allowed,
      allowed,
      reservationId: row.reservation_id || null,
      isTrialCheck: Boolean(row.is_trial_check),
      reason: row.reason || null,
      errorCode: row.error_code || null,
    };
  } catch (err) {
    return { success: false, allowed: false, reason: String(err), errorCode: 'EXCEPTION' };
  }
}

/**
 * Finalize or release reservation after job finishes or errors.
 */
export async function finalizeReservation(
  reservationId: string | null | undefined,
  outcome: 'success' | 'failed' | 'committed' | 'released' | any = 'success',
  details?: Record<string, any> | string
): Promise<void> {
  if (!reservationId) {
    broadcastUsageUpdate();
    return;
  }

  const isSuccess = outcome === 'success' || outcome === 'committed';
  const effectiveOutcome: 'success' | 'failed' = isSuccess ? 'success' : 'failed';
  const metaObj = typeof details === 'object' ? details : { tag: details || 'general' };

  try {
    const { data, error } = await supabase.rpc('settle_client_reservation', {
      p_reservation_id: reservationId,
      p_outcome: effectiveOutcome,
      p_metadata: {
        ...(metaObj || {}),
        reason: !isSuccess ? (metaObj?.errorReason || metaObj?.error || 'Execution error') : undefined,
      },
      p_guest_id: reservationGuestIds.get(reservationId) || null,
    });
    if (error || data?.[0]?.settled !== true) {
      console.error('[finalizeReservation] Settlement pending:', error || data);
    }
  } catch (err) {
    console.warn('[finalizeReservation] error:', err);
  } finally {
    reservationGuestIds.delete(reservationId);
    broadcastUsageUpdate();
  }
}

/**
 * Image scan reservation aliases.
 */
export async function reserveImageScan(
  modeOrSlug = 'standard',
  cost = 2
): Promise<ReservationResponse> {
  const slug = modeOrSlug === 'ai_image_detector' || modeOrSlug.includes('image')
    ? modeOrSlug
    : modeOrSlug === 'advanced'
    ? 'image_detect_advanced'
    : 'image_detect_standard';
  return reserveEntitlement(slug, cost, { images: 1 });
}

export async function finalizeImageScan(
  reservationId: string | null | undefined,
  outcome: 'success' | 'failed' | 'committed' | 'released' | any = 'success',
  details?: Record<string, any>
): Promise<void> {
  return finalizeReservation(reservationId, outcome, details);
}

/**
 * Video scan reservation aliases.
 */
export async function reserveVideoScan(modeOrSlug = 'balanced', durationSeconds = 30): Promise<ReservationResponse> {
  const slug = modeOrSlug.startsWith('video_detect_') ? modeOrSlug
    : modeOrSlug === 'forensic' ? 'video_detect_forensic'
    : modeOrSlug === 'high_sensitivity' ? 'video_detect_high_sensitivity' : 'video_detect_balanced';
  return reserveEntitlement(slug, undefined, { videoSeconds: durationSeconds });
}

export async function finalizeVideoScan(
  reservationId: string | null | undefined,
  outcome: 'success' | 'failed' | 'committed' | 'released' | any = 'success',
  details?: Record<string, any>
): Promise<void> {
  return finalizeReservation(reservationId, outcome, details);
}

/**
 * Link guest session identifier to newly registered or logged in user.
 */
export async function linkGuestToUser(userId: string, guestId?: string): Promise<boolean> {
  const effectiveGuestId = guestId || getVisitorId();
  if (!effectiveGuestId || !userId) return false;

  try {
    const { data, error } = await supabase.rpc('link_guest_to_registered_user', {
      p_guest_id: effectiveGuestId,
      p_user_id: userId,
      p_timezone: getTimezone(),
    });
    if (error) {
      console.warn('[linkGuestToUser] RPC error:', error);
      return false;
    }
    broadcastUsageUpdate();
    return Boolean(data);
  } catch (err) {
    console.warn('[linkGuestToUser] exception:', err);
    return false;
  }
}

/**
 * Record usage and broadcast update event (legacy compatibility).
 */
export async function recordUsage(
  featureSlug: string,
  idempotencyKey?: string
): Promise<UsageRecordResult> {
  const res = await reserveEntitlement(featureSlug, undefined, {}, idempotencyKey);
  if (!res.allowed || !res.reservationId) throw new Error(res.reason || 'Billing authorization failed');
  if (res.reservationId) {
    await finalizeReservation(res.reservationId, 'success', { featureSlug });
  }
  broadcastUsageUpdate();
  const summary = await getLiveEntitlementSummary();
  return {
    remaining: summary.isPaidActive ? summary.creditsBalance : summary.trialChecksRemaining,
    limit: summary.isPaidActive ? summary.monthlyCreditAllocation : summary.trialChecksTotal,
    used: summary.isPaidActive ? summary.creditsUsedTotal : summary.trialChecksUsed,
    reset_at: null,
    feature_slug: featureSlug,
  };
}

export interface TeamMemberAllocation {
  id: string;
  owner_id: string;
  member_email: string;
  member_user_id?: string | null;
  seat_name?: string | null;
  role: 'admin' | 'member';
  allocated_credits: number;
  consumed_credits: number;
  status: 'active' | 'invited' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface TeamCreditSummary {
  is_team_account: boolean;
  is_owner: boolean;
  plan?: string;
  total_pool?: number;
  remaining_pool?: number;
  total_allocated?: number;
  total_consumed?: number;
  unallocated_pool?: number;
  allocations?: TeamMemberAllocation[];
  // Member view fields
  owner_id?: string;
  seat_name?: string;
  role?: string;
  allocated_credits?: number;
  consumed_credits?: number;
  remaining_credits?: number;
  owner_shared_pool?: number;
}

/**
 * Get Team Credit Pool Summary (for Business & Enterprise accounts).
 */
export async function getTeamCreditSummary(): Promise<TeamCreditSummary> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return { is_team_account: false, is_owner: false, plan: 'free' };
  }

  try {
    const { data, error } = await supabase.rpc('get_team_credit_summary', {
      p_user_id: userId,
    });
    if (error) {
      console.warn('[getTeamCreditSummary] RPC error:', error);
      return { is_team_account: false, is_owner: false, plan: 'free' };
    }
    return (data as TeamCreditSummary) || { is_team_account: false, is_owner: false, plan: 'free' };
  } catch (err) {
    console.warn('[getTeamCreditSummary] exception:', err);
    return { is_team_account: false, is_owner: false, plan: 'free' };
  }
}

/**
 * Allocate or update team member credit sub-quota.
 */
export async function allocateTeamMemberCredits(
  memberEmail: string,
  allocatedCredits: number,
  seatName?: string,
  role = 'member'
): Promise<{ success: boolean; error?: string; allocation?: any }> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const { data, error } = await supabase.rpc('allocate_team_member_credits', {
      p_owner_id: userId,
      p_member_email: memberEmail,
      p_allocated_credits: allocatedCredits,
      p_seat_name: seatName || null,
      p_role: role,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    broadcastUsageUpdate();
    return data || { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Remove a team member seat (releases remaining sub-quota back to pool).
 */
export async function removeTeamMember(allocationId: string): Promise<{ success: boolean; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const { data, error } = await supabase.rpc('remove_team_member', {
      p_allocation_id: allocationId,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    broadcastUsageUpdate();
    return data || { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}


/**
 * Broadcast usage refresh event across tabs and components.
 */
export function broadcastUsageUpdate(): void {
  try {
    window.dispatchEvent(new CustomEvent('usage-updated'));
    window.dispatchEvent(new CustomEvent('subscription-updated'));
  } catch {
    // Ignore in non-browser context
  }
}

// Re-export helpers
export { preserveDraftText, getPreservedDraftText };
