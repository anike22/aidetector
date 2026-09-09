import { useState, useCallback } from 'react';
import { useCustomerDataPlatform } from '@/contexts/CustomerDataPlatformContext';

type TriggerType = 'limit_reached' | 'pro_feature';

interface ModalState {
  open: boolean;
  featureName: string;
  trigger: TriggerType;
  remaining: number | null;
  limit: number | null;
}

export function useUpgradeModal() {
  const [state, setState] = useState<ModalState>({
    open: false,
    featureName: '',
    trigger: 'pro_feature',
    remaining: null,
    limit: null,
  });
  const { trackEvent } = useCustomerDataPlatform();

  const openUpgradeModal = useCallback(
    (params: { featureName: string; trigger: TriggerType; remaining?: number | null; limit?: number | null }) => {
      setState({
        open: true,
        featureName: params.featureName,
        trigger: params.trigger,
        remaining: params.remaining ?? null,
        limit: params.limit ?? null,
      });
      trackEvent({
        event_type: 'custom',
        metadata: {
          event_name: params.trigger === 'limit_reached' ? 'free_limit_reached' : 'pro_feature_attempted',
          product: params.featureName,
        },
      });
    },
    [trackEvent]
  );

  const closeUpgradeModal = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    ...state,
    openUpgradeModal,
    closeUpgradeModal,
  };
}
