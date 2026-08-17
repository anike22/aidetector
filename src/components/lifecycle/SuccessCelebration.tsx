import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, CheckCircle2, Target, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfettiOverlay } from './ConfettiOverlay';

interface Celebration {
  id: string;
  type: 'milestone' | 'checklist' | 'goal';
  title: string;
  message: string;
  nextStep?: { label: string; url: string };
}

export function SuccessCelebrationManager({
  celebrations,
  onDismiss,
}: {
  celebrations: Celebration[];
  onDismiss: (id: string) => void;
}) {
  const [activeConfetti, setActiveConfetti] = useState<string | null>(null);

  useEffect(() => {
    if (celebrations.length > 0 && activeConfetti !== celebrations[0].id) {
      setActiveConfetti(celebrations[0].id);
    }
  }, [celebrations, activeConfetti]);

  const iconFor = (type: Celebration['type']) => {
    switch (type) {
      case 'milestone':
        return <Award className="h-6 w-6 text-primary" />;
      case 'checklist':
        return <CheckCircle2 className="h-6 w-6 text-success" />;
      case 'goal':
        return <Target className="h-6 w-6 text-info" />;
    }
  };

  return (
    <>
      <ConfettiOverlay
        active={!!activeConfetti}
        onDone={() => setActiveConfetti(null)}
      />
      <AnimatePresence>
        {celebrations.slice(0, 3).map((c) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24 }}
            className="fixed bottom-4 right-4 z-[90] w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-hover"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                {iconFor(c.type)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold">{c.title}</h4>
                {c.message && <p className="mt-0.5 text-xs text-muted-foreground">{c.message}</p>}
                {c.nextStep && (
                  <Button
                    size="sm"
                    className="mt-2 h-8 text-xs"
                    asChild
                  >
                    <a href={c.nextStep.url}>{c.nextStep.label}</a>
                  </Button>
                )}
              </div>
              <button
                onClick={() => onDismiss(c.id)}
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
}
