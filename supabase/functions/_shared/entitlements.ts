import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.103.1';

export interface EntitlementReservationResult {
  allowed: boolean;
  reservationId: string | null;
  reason: string | null;
  errorCode: string | null;
  plan: string;
  remainingCredits: number;
  trialChecksRemaining: number;
  trialChecksTotal: number;
  resetAt: string | null;
  isTrialCheck: boolean;
  dailyRemaining: number | null;
  dailyLimit: number | null;
}

export interface EntitlementFinalizeResult {
  finalized: boolean;
  status: string;
  creditsRefunded: number;
  newBalance: number;
}

export interface EntitlementSummaryResult {
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
}

export function createServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function getTimezone(req: Request): string {
  return req.headers.get('x-timezone') || 'UTC';
}

export function getClientIp(req: Request): string {
  const xForwardedFor = req.headers.get('x-forwarded-for');
  const xRealIp = req.headers.get('x-real-ip');
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  if (xRealIp) return xRealIp.trim();
  return 'unknown';
}

export async function resolveAuthUserOrGuest(
  supabase: ReturnType<typeof createServiceClient>,
  req: Request
): Promise<{ user: { id: string } | null; guestId: string | null; isApiKey: boolean }> {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const guestHeader = req.headers.get('x-guest-id') || req.headers.get('x-visitor-id') || '';

  // 1. API Key prefix
  if (token.startsWith('aid_')) {
    const { data: keyData } = await supabase
      .from('api_keys')
      .select('user_id, owner_user_id, is_active, revoked_at')
      .eq('api_key', token)
      .maybeSingle();

    const keyOwnerId = keyData?.owner_user_id || keyData?.user_id;
    if (keyOwnerId && keyData?.is_active === true && !keyData?.revoked_at) {
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('api_key', token);
      return { user: { id: keyOwnerId }, guestId: null, isApiKey: true };
    }
  }

  if (token.startsWith('aid_')) throw new Error('Invalid or revoked API key');

  // 2. Authenticated JWT token
  if (token && token.startsWith('eyJ')) {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user?.id) {
      return { user: { id: user.id }, guestId: null, isApiKey: false };
    }
  }

  // 3. Guest Identifier — client-supplied ids are VALIDATED server-side:
  // issue_or_validate_guest_session upserts the session (creating it only
  // under the per-IP daily cap), so rotating fresh client ids cannot mint
  // unlimited trial checks.
  let validGuestId = guestHeader ? guestHeader.trim() : null;
  if (validGuestId) {
    const ip = getClientIp(req);
    const ua = req.headers.get('user-agent') || 'unknown';
    const { data: issued, error } = await supabase.rpc('issue_or_validate_guest_session', {
      p_guest_id: validGuestId,
      p_ip: ip,
      p_user_agent: ua,
      p_timezone: getTimezone(req),
    });
    if (error) throw new Error('Guest identity verification failed');
    const row = (issued || [])[0];
    if (!row?.guest_id) throw new Error('Guest identity unavailable');
    return { user: null, guestId: row?.guest_id || validGuestId, isApiKey: false };
  }
  if (!validGuestId) {
    const ip = getClientIp(req);
    const ua = req.headers.get('user-agent') || 'unknown';
    const { data, error } = await supabase.rpc('issue_or_validate_guest_session', {
      p_guest_id: null,
      p_ip: ip,
      p_user_agent: ua,
      p_timezone: getTimezone(req),
    });
    const row = (data || [])[0];
    if (error || !row?.guest_id || row.is_blocked) throw new Error('Guest session unavailable');
    validGuestId = row.guest_id;
  }

  return { user: null, guestId: validGuestId, isApiKey: false };
}

/**
 * Authoritative Server Entitlement & Atomic Reservation.
 * MUST be invoked before starting expensive processing or calling AI providers.
 */
export async function reserveEntitlement(
  supabase: ReturnType<typeof createServiceClient>,
  params: {
    userId?: string | null;
    guestId?: string | null;
    featureSlug: string;
    creditsCost?: number;
    timezone?: string;
    idempotencyKey?: string | null;
    metadata?: Record<string, unknown>;
    /** Optional unit quantity (e.g. input words) for words_1000 billing. */
    unitQuantity?: number | null;
  }
): Promise<EntitlementReservationResult> {
  const { data, error } = await supabase.rpc('reserve_entitlement_and_credits', {
    p_user_id: params.userId || null,
    p_guest_id: params.guestId || null,
    p_feature_slug: params.featureSlug,
    p_credits_cost: params.creditsCost || 1,
    p_timezone: params.timezone || 'UTC',
    p_idempotency_key: params.idempotencyKey || null,
    p_metadata: params.metadata || {},
    p_unit_quantity: params.unitQuantity ?? null,
  });

  if (error) {
    console.error('reserve_entitlement_and_credits RPC error:', error);
    throw new Error(`Entitlement reservation failed: ${error.message}`);
  }

  const row = (data || [])[0];
  if (!row || (row.allowed === true && !row.reservation_id)) throw new Error('Invalid billing authorization response');
  return {
    allowed: row.allowed === true,
    reservationId: row.reservation_id ?? null,
    reason: row.reason ?? null,
    errorCode: row.error_code ?? null,
    plan: row.plan ?? 'guest',
    remainingCredits: Number(row.credits_balance ?? 0),
    dailyRemaining: row.daily_remaining == null ? null : Number(row.daily_remaining),
    dailyLimit: row.daily_limit == null ? null : Number(row.daily_limit),
    trialChecksRemaining: row.trial_checks_remaining ?? 0,
    trialChecksTotal: row.trial_checks_total ?? 1,
    resetAt: row.reset_at ?? null,
    isTrialCheck: row.is_trial_check === true,
  };
}

/**
 * Finalize an atomic reservation on success or release/refund on failure.
 */
export async function finalizeReservation(
  supabase: ReturnType<typeof createServiceClient>,
  params: {
    reservationId: string;
    outcome: 'success' | 'failed';
    metadata?: Record<string, unknown>;
    errorReason?: string | null;
    timezone?: string;
  }
): Promise<EntitlementFinalizeResult> {
  const { data, error } = await supabase.rpc('finalize_credit_reservation', {
    p_reservation_id: params.reservationId,
    p_outcome: params.outcome,
    p_metadata: params.metadata || {},
    p_error_reason: params.errorReason || null,
    p_timezone: params.timezone || 'UTC',
  });

  if (error) {
    console.error('finalize_credit_reservation RPC error:', error);
    return { finalized: false, status: 'error', creditsRefunded: 0, newBalance: 0 };
  }

  const row = typeof data === 'boolean' ? { finalized: data, status: data ? 'settled' : 'already_settled' } : (data || [])[0] || {};
  return {
    finalized: row.finalized === true,
    status: row.status ?? 'unknown',
    creditsRefunded: row.credits_refunded ?? 0,
    newBalance: row.new_balance ?? 0,
  };
}

/**
 * Get comprehensive entitlement and live usage summary for UI.
 */
export async function getEntitlementSummary(
  supabase: ReturnType<typeof createServiceClient>,
  userId?: string | null,
  guestId?: string | null,
  timezone = 'UTC'
): Promise<EntitlementSummaryResult> {
  const { data, error } = await supabase.rpc('get_user_entitlement_summary', {
    p_user_id: userId || null,
    p_guest_id: guestId || null,
    p_timezone: timezone,
  });

  if (error) {
    console.error('get_user_entitlement_summary RPC error:', error);
    throw new Error(`Summary fetch failed: ${error.message}`);
  }

  const row = (data || [])[0] || {};
  return {
    plan: row.plan ?? 'guest',
    status: row.status ?? 'Active',
    isPaidActive: row.is_paid_active === true,
    creditsBalance: row.credits_balance ?? 0,
    creditsUsedTotal: row.credits_used_total ?? 0,
    trialChecksRemaining: row.trial_checks_remaining ?? (userId ? 5 : 1),
    trialChecksUsed: row.trial_checks_used ?? 0,
    trialChecksTotal: row.trial_checks_total ?? (userId ? 5 : 1),
    monthlyCreditAllocation: row.monthly_credit_allocation ?? 0,
    creditsRefillDate: row.credits_refill_date ?? null,
    planEndDate: row.plan_end_date ?? null,
    warningLevel: row.warning_level ?? 'normal',
  };
}
