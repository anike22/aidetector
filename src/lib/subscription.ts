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
  if (!['pro', 'business', 'enterprise'].includes(plan.toLowerCase())) return false;

  const activeStatuses = ['active', 'trialing', 'cancelled', 'canceled'];
  const normalizedStatus = (status || '').toLowerCase();
  if (!activeStatuses.includes(normalizedStatus)) return false;

  if (planEndDate) {
    const end = new Date(planEndDate);
    if (!isNaN(end.getTime()) && end <= new Date()) return false;
  }

  return true;
}

export function isSubscriptionLoading(plan: string | null | undefined, status: string | null | undefined): boolean {
  return plan === undefined || (plan === null && status === undefined);
}
