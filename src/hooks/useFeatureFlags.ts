import { useState, useEffect } from 'react';
import { 
  FeatureFlag, 
  fetchFeatureFlags, 
  getFeatureFlagSync, 
  isFeatureVisible, 
  normalizeFeatureSlug,
  getAllFeatureFlagsSync
} from '@/lib/featureFlags';

export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<string, FeatureFlag>>(() => getAllFeatureFlagsSync());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    // Initial fetch
    fetchFeatureFlags().then(data => {
      if (mounted) setFlags(data);
    });

    // Listen to update events (e.g. from admin updates or manual invalidations)
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Record<string, FeatureFlag>>;
      if (mounted && customEvent.detail) {
        setFlags(customEvent.detail);
      }
    };

    window.addEventListener('feature_flags_updated', handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('feature_flags_updated', handleUpdate);
    };
  }, []);

  const checkVisible = (slugOrRoute: string, surface: 'nav' | 'footer' | 'homepage' | 'all' = 'all') => {
    return isFeatureVisible(slugOrRoute, surface);
  };

  const getFlag = (slugOrRoute: string): FeatureFlag => {
    const slug = normalizeFeatureSlug(slugOrRoute);
    return flags[slug] || getFeatureFlagSync(slug);
  };

  return {
    flags,
    loading,
    isFeatureVisible: checkVisible,
    getFlag,
    refresh: () => fetchFeatureFlags(true),
  };
}
