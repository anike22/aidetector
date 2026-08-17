import { useRef, useEffect } from 'react';
import { usePersonalization } from '@/contexts/PersonalizationContext';
import { useCustomerDataPlatform } from '@/contexts/CustomerDataPlatformContext';
import { useRecommendationNavigation } from '@/hooks/useRecommendationNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, X, Check, ArrowRight } from 'lucide-react';
import type { PersonalizedRecommendation } from '@/types/personalization';
import type { ResolvedRecommendation } from '@/lib/recommendationRegistry';

export function RecommendationStrip() {
  const { recommendations, loading } = usePersonalization();
  const { trackEvent } = useCustomerDataPlatform();
  const { handleClick, handleDismiss, handleAccept, resolve } = useRecommendationNavigation();
  const active = recommendations.filter((r) => !r.dismissed && !r.accepted).slice(0, 3);
  const trackedIds = useRef<string>('');

  useEffect(() => {
    if (loading || active.length === 0) return;
    const key = active.map((r) => r.id).join(',');
    if (trackedIds.current === key) return;
    trackedIds.current = key;
    active.forEach((rec) => {
      trackEvent({
        event_type: 'recommendation_displayed',
        metadata: {
          recommendation_id: rec.id,
          recommendation_type: rec.type,
          recommendation_subtype: rec.subtype,
          source: 'strip',
        },
      });
    });
  }, [loading, active, trackEvent]);

  if (loading || active.length === 0) return null;

  return (
    <section className="mb-6" aria-label="Recommended for you">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wide">Recommended for you</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {active.map((rec) => (
          <RecommendationCard
            key={rec.id}
            rec={rec}
            onClick={() => handleClick(rec, 'strip')}
            onDismiss={() => handleDismiss(rec, 'strip')}
            onAccept={() => handleAccept(rec, 'strip')}
            resolved={resolve(rec, 'strip')}
          />
        ))}
      </div>
    </section>
  );
}

interface RecommendationCardProps {
  rec: PersonalizedRecommendation;
  resolved: ResolvedRecommendation;
  onClick: () => void;
  onDismiss: () => void;
  onAccept: () => void;
}

function RecommendationCard({ rec, resolved, onClick, onDismiss, onAccept }: RecommendationCardProps) {
  const actionable = resolved.isActionable && resolved.targetRoute;

  return (
    <Card
      className={`flex flex-col relative ${
        actionable
          ? 'cursor-pointer hover:shadow-md hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary transition-colors'
          : 'opacity-90'
      }`}
      role={actionable ? 'link' : 'article'}
      aria-label={actionable ? `${rec.title}: ${resolved.ctaLabel}` : rec.title}
      tabIndex={actionable ? 0 : -1}
      onClick={(e) => {
        // Let the explicit CTA button handle its own clicks without bubbling.
        if ((e.target as HTMLElement).closest('[data-rec-action]')) return;
        if (actionable) onClick();
      }}
      onKeyDown={(e) => {
        if (!actionable) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium leading-tight">{rec.title}</CardTitle>
          <Button
            data-rec-action
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            aria-label="Dismiss recommendation"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col justify-end">
        {rec.reason && (
          <Badge variant="secondary" className="w-fit mb-3 text-xs">
            {rec.reason}
          </Badge>
        )}
        <div className="flex items-center gap-2">
          {actionable && (
            <Button
              data-rec-action
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              {resolved.ctaLabel} <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
          <Button
            data-rec-action
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onAccept();
            }}
            className="shrink-0"
            aria-label="Accept recommendation"
          >
            <Check className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
