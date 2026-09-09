import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Check, ChevronDown, ChevronUp, Loader2, X, RotateCcw, Play, PartyPopper } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useLifecycle } from '@/contexts/LifecycleContext';
import { useOnboardingChecklist } from '@/hooks/useOnboardingChecklist';
import { SmartRecommendations } from '@/components/lifecycle/SmartRecommendations';
import { updateOnboardingPreferences } from '@/lib/lifecycleApi';

export function ActivationChecklistWidget({ embedded = false }: { embedded?: boolean }) {
  const { loading, profile, showCelebration, dismissOnboarding, resumeOnboarding, resetOnboarding } = useLifecycle();
  const { items, completedCount, totalCount, percent, allComplete, completeTask } = useOnboardingChecklist();
  const [expanded, setExpanded] = useState(true);

  const prevCountRef = useRef<number | null>(null);
  const milestonesFiredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const prev = prevCountRef.current;
    prevCountRef.current = completedCount;
    if (prev === null) return;

    if (completedCount === 1 && prev < 1 && !milestonesFiredRef.current.has('first')) {
      milestonesFiredRef.current.add('first');
      showCelebration({ id: 'milestone-first', type: 'milestone', title: '🎉 First step complete', message: 'Great start! Keep going to unlock more features.' });
      confetti({ particleCount: 100, spread: 60, origin: { y: 0.7 } });
    }

    if (completedCount > 0 && totalCount > 0 && completedCount >= Math.ceil(totalCount / 2) && completedCount < totalCount && !milestonesFiredRef.current.has('half')) {
      milestonesFiredRef.current.add('half');
      showCelebration({ id: 'milestone-half', type: 'milestone', title: '🚀 Halfway there', message: "You're halfway through setup. Keep up the momentum." });
      confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
    }

    if (allComplete && prev < totalCount && !milestonesFiredRef.current.has('complete')) {
      milestonesFiredRef.current.add('complete');
      showCelebration({ id: 'milestone-complete', type: 'milestone', title: '🏆 Onboarding complete', message: 'Your workspace is fully configured. Explore advanced features now.' });
      confetti({ particleCount: 300, spread: 80, origin: { y: 0.5 } });
    }
  }, [completedCount, totalCount, allComplete, showCelebration]);

  useEffect(() => {
    if (allComplete && profile && !profile.onboarding_completed) {
      updateOnboardingPreferences({ onboarding_completed: true }).then(() => {
        // Local state will refresh on next load; no need to block UI.
      });
    }
  }, [allComplete, profile]);

  if (loading) {
    return (
      <Card className={embedded ? 'border-0 shadow-none' : ''}>
        <CardContent className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (profile?.onboarding_dismissed && !allComplete) {
    return (
      <Card className={embedded ? 'border-0 shadow-none' : ''}>
        <CardContent className="flex flex-col items-start gap-3 p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <PartyPopper className="h-4 w-4" />
            <p className="text-sm">Onboarding paused. Resume when you're ready.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => resumeOnboarding()}>
              <Play className="mr-1 h-3.5 w-3.5" /> Resume Onboarding
            </Button>
            <Button size="sm" variant="outline" onClick={() => resetOnboarding()}>
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (allComplete) {
    return <SmartRecommendations embedded={embedded} />;
  }

  const remainingMinutes = items.filter((i) => !i.isUpgrade).length * 2;

  return (
    <Card className={embedded ? 'border-0 shadow-none' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base md:text-lg">Activation Checklist</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {completedCount} of {totalCount} completed · {percent}% done
              {remainingMinutes > 0 && ` · ~${remainingMinutes} min remaining`}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => dismissOnboarding()}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
              aria-label="Hide checklist"
              title="Hide checklist"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={() => setExpanded((e) => !e)}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Progress value={percent} className="mt-3 h-2" />
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-2">
          {items.map((item) => (
            <ChecklistRow key={item.item_key} item={item} onStart={completeTask} />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

function ChecklistRow({ item, onStart }: { item: ReturnType<typeof useOnboardingChecklist>['items'][number]; onStart: (key: string) => void }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${item.isUpgrade ? 'border-accent/30 bg-accent/5' : 'border-border bg-card'}`}>
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${item.completed ? 'border-success bg-success' : 'border-muted-foreground/30'}`}
      >
        {item.completed && <Check className="h-3.5 w-3.5 text-success-foreground" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {item.label}
        </p>
        {!item.completed && <p className="text-xs text-muted-foreground">{item.description}</p>}
      </div>
      {!item.completed && (
        <Button
          size="sm"
          variant={item.isUpgrade ? 'default' : 'outline'}
          className="h-8 shrink-0 text-xs"
          asChild
          onClick={item.isUpgrade ? undefined : () => onStart(item.item_key)}
        >
          <a href={item.href}>{item.isUpgrade ? 'Upgrade' : 'Start'}</a>
        </Button>
      )}
    </div>
  );
}

