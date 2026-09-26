/**
 * Single source of truth for whether a paid subscription is currently active.
 * Used by UI, entitlement checks, and tests. Always checks billing records on
 * the server; the frontend helper only mirrors the server rule.
 */
export function isPaidSubscriptionActive(
  plan: string | null | undefined,
  status: string | null | undefined,
  planEndDate: string | null | undefined
): boolean {
  if (!plan || plan === 'free') return false;
  if (!['pro', 'pro_plus', 'pro+', 'business', 'enterprise'].includes(plan.toLowerCase())) return false;

  const normalizedStatus = (status || '').toLowerCase();
  if (['active', 'trialing'].includes(normalizedStatus)) {
    if (!planEndDate) return true;
    const end = new Date(planEndDate);
    return !Number.isFinite(end.getTime()) || end > new Date();
  }

  if (['cancelled', 'canceled'].includes(normalizedStatus)) {
    if (!planEndDate) return false;
    const end = new Date(planEndDate);
    return Number.isFinite(end.getTime()) && end > new Date();
  }

  return false;
}

export function isSubscriptionLoading(plan: string | null | undefined, status: string | null | undefined): boolean {
  return plan === undefined || (plan === null && status === undefined);
}
