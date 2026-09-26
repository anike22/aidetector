import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLifecycle } from '@/contexts/LifecycleContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function ProductTourManager() {
  const { tours, tourProgress, loading, advanceTour } = useLifecycle();
  const reducedMotion = useReducedMotion();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  const [activeTour, setActiveTour] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const availableTour = useMemo(() => {
    if (loading) return null;
    return tours.find((t) => {
      const trigger = t.trigger_conditions as { page?: string } | null;
      if (!trigger?.page) return false;
      const match = pathname === trigger.page || pathname.startsWith(trigger.page);
      if (!match) return false;
      const progress = tourProgress.find((p) => p.tour_key === t.tour_key);
      return !progress?.completed;
    });
  }, [tours, tourProgress, pathname, loading]);

  useEffect(() => {
    if (availableTour && !activeTour) {
      const progress = tourProgress.find((p) => p.tour_key === availableTour.tour_key);
      setStep(progress?.current_step ?? 0);
      setActiveTour(availableTour.tour_key);
    }
  }, [availableTour, activeTour, tourProgress]);

  const tour = useMemo(() => tours.find((t) => t.tour_key === activeTour), [activeTour, tours]);
  const steps = tour?.steps || [];
  const currentStep = steps[step];

  const handleNext = async () => {
    if (!tour) return;
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
      await advanceTour(tour.tour_key, step + 1, false);
    } else {
      await advanceTour(tour.tour_key, step, true);
      setActiveTour(null);
    }
  };

  const handlePrev = () => {
    if (!tour) return;
    if (step > 0) {
      setStep((s) => s - 1);
      advanceTour(tour.tour_key, step - 1, false);
    }
  };

  const handleSkip = async () => {
    if (!tour) return;
    await advanceTour(tour.tour_key, step, false);
    setActiveTour(null);
  };

  if (!activeTour || !tour || !currentStep) return null;

  const targetSelector = currentStep.target;
  const targetEl = typeof document !== 'undefined' ? document.querySelector(targetSelector) : null;

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/30" onClick={handleSkip} />
      <TooltipBody
        targetEl={targetEl}
        title={currentStep.title}
        content={currentStep.content}
        step={step}
        total={steps.length}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleSkip}
        reducedMotion={reducedMotion}
      />
    </div>,
    document.body
  );
}

function TooltipBody({
  targetEl,
  title,
  content,
  step,
  total,
  onNext,
  onPrev,
  onSkip,
  reducedMotion,
}: {
  targetEl: Element | null;
  title: string;
  content: string;
  step: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  reducedMotion: boolean;
}) {
  const [rect, setRect] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    if (targetEl) {
      const r = targetEl.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }
  }, [targetEl]);

  const style: React.CSSProperties = targetEl
    ? {
        top: rect.top + rect.height + 12,
        left: Math.min(Math.max(rect.left, 16), window.innerWidth - 320 - 16),
      }
    : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <AnimatePresence>
      <motion.div
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
        className="absolute w-[calc(100%-2rem)] max-w-xs rounded-xl border border-border bg-card p-4 shadow-hover md:w-80"
        style={style}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">{title}</h4>
          </div>
          <button onClick={onSkip} className="text-muted-foreground hover:text-foreground" aria-label="Close tour">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{content}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {step + 1} / {total}
          </span>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onPrev}>
                <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                Back
              </Button>
            )}
            <Button size="sm" className="h-8 text-xs" onClick={onNext}>
              {step === total - 1 ? 'Finish' : 'Next'}
              {step < total - 1 && <ChevronRight className="ml-1 h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
