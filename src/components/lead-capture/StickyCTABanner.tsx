/**
 * StickyCTABanner – small sticky banner at bottom of long pages.
 *
 * Auto-hides when the user is authenticated.
 * Auto-hides on dismissal (persisted in sessionStorage).
 * Appears after a short delay to avoid CLS.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/leadApi';
import { cn } from '@/lib/utils';

interface Props {
  label?: string;
  subLabel?: string;
  ctaId?: string;
  /** Delay in ms before appearing (default 3000) */
  delay?: number;
  className?: string;
}

const SK = 'aicx_sticky_dismissed';

export function StickyCTABanner({
  label = 'Create Free Account',
  subLabel = 'Save your work · No credit card required',
  ctaId,
  delay = 3000,
  className,
}: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (user) return;
    try {
      if (sessionStorage.getItem(SK)) return;
    } catch { /* noop */ }
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [user, delay]);

  // Hide immediately on sign-in
  useEffect(() => {
    if (user) setVisible(false);
  }, [user]);

  const handleDismiss = () => {
    try { sessionStorage.setItem(SK, '1'); } catch { /* noop */ }
    setVisible(false);
    trackEvent({
      event_type: 'popup_close',
      page: window.location.pathname,
      cta_id: ctaId,
      metadata: { cta_type: 'sticky' },
    });
  };

  const handleCta = () => {
    trackEvent({
      event_type: 'cta_click',
      page: window.location.pathname,
      cta_id: ctaId,
      metadata: { cta_type: 'sticky', label },
    });
    setVisible(false);
    navigate('/signup');
  };

  if (user) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="complementary"
          aria-label="Create a free account"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'fixed bottom-4 left-1/2 -translate-x-1/2 z-40',
            'w-[calc(100%-2rem)] max-w-md',
            'bg-card border border-border rounded-xl shadow-xl',
            'flex items-center gap-3 px-4 py-3',
            className
          )}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{label}</p>
            {subLabel && (
              <p className="text-xs text-muted-foreground truncate">{subLabel}</p>
            )}
          </div>
          <Button onClick={handleCta} size="sm" className="shrink-0 gap-1.5 font-semibold">
            Start Free
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
