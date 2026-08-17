import { useCallback, useEffect, useState } from 'react';
import { checkEntitlement, recordUsage, type EntitlementCheckResult, type UsageRecordResult } from '@/lib/entitlementsApi';

interface UseEntitlementResult {
  entitlement: EntitlementCheckResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  recordUsage: (idempotencyKey?: string) => Promise<UsageRecordResult>;
}

export function useEntitlement(featureSlug: string): UseEntitlementResult {
  const [entitlement, setEntitlement] = useState<EntitlementCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await checkEntitlement(featureSlug);
      setEntitlement(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Entitlement check failed';
      setError(message);
      // Surface entitlement errors in console for debugging, but never block the UI.
      console.error('[useEntitlement]', message);
    } finally {
      setLoading(false);
    }
  }, [featureSlug]);

  const record = useCallback(
    async (idempotencyKey?: string) => {
      const result = await recordUsage(featureSlug, idempotencyKey);
      await refresh();
      return result;
    },
    [featureSlug, refresh]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refresh automatically when the subscription is updated elsewhere (e.g. after payment).
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('subscription-updated', handler);
    return () => window.removeEventListener('subscription-updated', handler);
  }, [refresh]);

  return { entitlement, loading, error, refresh, recordUsage: record };
}
