import { useCallback, useEffect, useState } from 'react';
import {
  checkEntitlement,
  recordUsage,
  getLiveEntitlementSummary,
  type EntitlementCheckResult,
  type EntitlementSummary,
  type UsageRecordResult,
} from '@/lib/entitlementsApi';

interface UseEntitlementResult {
  entitlement: EntitlementCheckResult | null;
  summary: EntitlementSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  recordUsage: (idempotencyKey?: string) => Promise<UsageRecordResult>;
}

export function useEntitlement(featureSlug = 'ai_detector'): UseEntitlementResult {
  const [entitlement, setEntitlement] = useState<EntitlementCheckResult | null>(null);
  const [summary, setSummary] = useState<EntitlementSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [checkResult, summaryResult] = await Promise.allSettled([
        checkEntitlement(featureSlug),
        getLiveEntitlementSummary(),
      ]);

      if (checkResult.status === 'fulfilled') {
        setEntitlement(checkResult.value);
      }
      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Entitlement check failed';
      setError(message);
      console.warn('[useEntitlement]', message);
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

  // Real-time synchronization listeners
  useEffect(() => {
    const handleUpdate = () => {
      refresh();
    };

    const handleFocus = () => {
      refresh();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    window.addEventListener('usage-updated', handleUpdate);
    window.addEventListener('subscription-updated', handleUpdate);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('usage-updated', handleUpdate);
      window.removeEventListener('subscription-updated', handleUpdate);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refresh]);

  return { entitlement, summary, loading, error, refresh, recordUsage: record };
}
