import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getIntelligenceProfile,
  getPredictions,
  getRecommendations,
  getPersonalizationSettings,
  trackBehaviorEvent,
} from '@/lib/personalizationApi';
import type { BehaviorEventInput } from '@/types/personalization';
import type {
  PersonalizedRecommendation,
  PersonalizationSettings,
  UserIntelligenceProfile,
  UserPrediction,
} from '@/types/personalization';
import { toast } from 'sonner';

interface PersonalizationContextType {
  profile: UserIntelligenceProfile | null;
  recommendations: PersonalizedRecommendation[];
  predictions: UserPrediction[];
  settings: PersonalizationSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
  trackEvent: (input: BehaviorEventInput) => Promise<void>;
  markRecommendation: (id: string, action: 'click' | 'accept' | 'dismiss', context?: string) => Promise<void>;
}

const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);

export function PersonalizationProvider({ children }: { children: ReactNode }) {
  const { user, profile: authProfile } = useAuth();
  const [profile, setProfile] = useState<UserIntelligenceProfile | null>(null);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [predictions, setPredictions] = useState<UserPrediction[]>([]);
  const [settings, setSettings] = useState<PersonalizationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [p, recs, preds, s] = await Promise.all([
        getIntelligenceProfile(),
        getRecommendations(),
        getPredictions(),
        getPersonalizationSettings(),
      ]);
      setProfile(p);
      setRecommendations(recs);
      setPredictions(preds);
      setSettings(s);
    } catch (e) {
      console.error('Personalization refresh failed', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh, authProfile?.subscription_plan]);

  const trackEvent = useCallback(async (input: BehaviorEventInput) => {
    if (!user || settings?.opt_out) return;
    try {
      await trackBehaviorEvent(input);
      // Refresh recommendations lazily after a short delay
      setTimeout(() => refresh(), 800);
    } catch (e) {
      console.error('Track behavior event failed', e);
    }
  }, [user, settings?.opt_out, refresh]);

  const markRecommendation = useCallback(async (id: string, action: 'click' | 'accept' | 'dismiss', context?: string) => {
    if (!user) return;
    try {
      const { recordRecommendationEvent } = await import('@/lib/personalizationApi');
      await recordRecommendationEvent(id, action, context);
      await refresh();
    } catch (e) {
      toast.error('Failed to record recommendation feedback');
      console.error(e);
    }
  }, [user, refresh]);

  return (
    <PersonalizationContext.Provider
      value={{
        profile,
        recommendations,
        predictions,
        settings,
        loading,
        refresh,
        trackEvent,
        markRecommendation,
      }}
    >
      {children}
    </PersonalizationContext.Provider>
  );
}

export function usePersonalization() {
  const ctx = useContext(PersonalizationContext);
  if (!ctx) throw new Error('usePersonalization must be used within PersonalizationProvider');
  return ctx;
}
