import { useCallback } from 'react';
import { streamLLM } from '@/lib/sse';
import { useEntitlement } from './useEntitlement';

interface StreamLLMOptions {
  contents: Array<{ role: string; parts: Array<{ text: string }> }>;
  tools?: any[];
  systemInstruction?: any;
  supabaseUrl: string;
  supabaseAnonKey: string;
  onChunk: (text: string) => void;
  onComplete: () => void;
  onError: (err: Error) => void;
  signal?: AbortSignal;
}

export function useGatedStreamLLM(
  featureSlug: string,
  featureName: string,
  openUpgradeModal?: (opts: {
    featureName: string;
    trigger: 'limit_reached' | 'pro_feature';
    remaining?: number | null;
    limit?: number | null;
  }) => void
) {
  const { entitlement, loading, recordUsage } = useEntitlement(featureSlug);

  const gatedStreamLLM = useCallback(
    async (opts: StreamLLMOptions): Promise<void> => {
      if (loading) {
        opts.onError(new Error('Checking your plan, please wait...'));
        return;
      }
      if (!entitlement?.allowed) {
        openUpgradeModal?.({
          featureName,
          trigger: entitlement?.remaining === 0 ? 'limit_reached' : 'pro_feature',
          remaining: entitlement?.remaining,
          limit: entitlement?.limit,
        });
        opts.onError(new Error(`${featureName} is not available on your current plan.`));
        return;
      }

      await recordUsage();
      await streamLLM({ ...opts, featureSlug });
    },
    [entitlement, loading, featureName, featureSlug, openUpgradeModal, recordUsage]
  );

  return gatedStreamLLM;
}
