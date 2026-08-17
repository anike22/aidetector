import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePersonalization } from '@/contexts/PersonalizationContext';
import { resolveRecommendation, routeExists, type ResolvedRecommendation } from '@/lib/recommendationRegistry';
import type { PersonalizedRecommendation } from '@/types/personalization';

export function useRecommendationNavigation() {
  const { user, profile } = useAuth();
  const { markRecommendation, trackEvent } = usePersonalization();
  const navigate = useNavigate();

  const resolve = useCallback((rec: PersonalizedRecommendation, source = 'strip'): ResolvedRecommendation => {
    return resolveRecommendation(rec, source);
  }, []);

  const handleClick = useCallback(
    async (rec: PersonalizedRecommendation, source = 'strip') => {
      const resolved = resolve(rec, source);

      // Track click regardless of destination
      await trackEvent({
        event_type: 'recommendation_clicked',
        event_category: 'personalization',
        event_data: {
          recommendation_id: rec.id,
          recommendation_type: rec.type,
          recommendation_subtype: rec.subtype,
          target_route: resolved.targetRoute || null,
          source,
        },
      });

      if (!resolved.isActionable || !resolved.targetRoute || !routeExists(resolved.targetRoute)) {
        return;
      }

      // Mark as engaged in the personalization system
      await markRecommendation(rec.id, 'click', source);

      await trackEvent({
        event_type: 'destination_opened',
        event_category: 'personalization',
        event_data: {
          recommendation_id: rec.id,
          target_route: resolved.targetRoute,
          source: 'recommendation',
        },
      });

      const destination = resolved.targetRoute + resolved.queryParams;

      // Auth gate
      if (resolved.requiresAuth && !user) {
        navigate(`/login?redirect=${encodeURIComponent(destination)}`);
        return;
      }

      // Entitlement gate: free users clicking a Pro-only route are sent to pricing
      const plan = profile?.subscription_plan;
      if (resolved.requiresPro && (!plan || plan === 'free')) {
        navigate(`/pricing?reason=pro_required&redirect=${encodeURIComponent(destination)}`);
        return;
      }

      navigate(destination);
    },
    [resolve, markRecommendation, trackEvent, navigate, user, profile]
  );

  const handleDismiss = useCallback(
    async (rec: PersonalizedRecommendation, source = 'strip') => {
      await markRecommendation(rec.id, 'dismiss', source);
      await trackEvent({
        event_type: 'recommendation_dismissed',
        event_category: 'personalization',
        event_data: {
          recommendation_id: rec.id,
          recommendation_type: rec.type,
          recommendation_subtype: rec.subtype,
          source,
        },
      });
    },
    [markRecommendation, trackEvent]
  );

  const handleAccept = useCallback(
    async (rec: PersonalizedRecommendation, source = 'strip') => {
      await markRecommendation(rec.id, 'accept', source);
      await trackEvent({
        event_type: 'recommendation_accepted',
        event_category: 'personalization',
        event_data: {
          recommendation_id: rec.id,
          recommendation_type: rec.type,
          recommendation_subtype: rec.subtype,
          source,
        },
      });
    },
    [markRecommendation, trackEvent]
  );

  return { resolve, handleClick, handleDismiss, handleAccept };
}
