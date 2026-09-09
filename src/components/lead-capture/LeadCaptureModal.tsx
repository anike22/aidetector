/**
 * LeadCaptureModal – the universal contextual signup popup.
 *
 * Reads the active popup config from LeadCaptureContext.
 * Renders a polished, accessible, dismissible modal dialog.
 * Supports Google OAuth, Magic Link, and Email+Password flows
 * (delegates to the existing auth flow / signup page).
 */
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Mail,
  Chrome,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLeadCapture } from '@/contexts/LeadCaptureContext';
import { trackEvent } from '@/lib/leadApi';

// Backdrop click closes modal
function Backdrop({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      onClick={onClick}
      aria-hidden="true"
    />
  );
}

export function LeadCaptureModal() {
  const { activePopup, isVisible, dismiss, convert } = useLeadCapture();
  const navigate = useNavigate();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus trap: focus close button on open
  useEffect(() => {
    if (isVisible) closeRef.current?.focus();
  }, [isVisible]);

  // Keyboard: Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) dismiss();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isVisible, dismiss]);

  const handlePrimary = () => {
    convert();
    navigate('/signup');
  };

  const handleGoogle = () => {
    trackEvent({
      event_type: 'cta_click',
      page: window.location.pathname,
      popup_id: activePopup?.id,
      metadata: { cta: 'google_oauth', popup_name: activePopup?.name },
    });
    convert();
    navigate('/signup?method=google');
  };

  const handleMagicLink = () => {
    trackEvent({
      event_type: 'cta_click',
      page: window.location.pathname,
      popup_id: activePopup?.id,
      metadata: { cta: 'magic_link', popup_name: activePopup?.name },
    });
    convert();
    navigate('/signup?method=magic');
  };

  if (!activePopup) return null;

  const benefits = Array.isArray(activePopup.benefits)
    ? activePopup.benefits
    : (JSON.parse(activePopup.benefits as unknown as string) as string[]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <Backdrop onClick={dismiss} />

          {/* Modal */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lc-modal-title"
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[calc(100%-2rem)] md:max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Top gradient accent */}
              <div
                className="h-1 w-full bg-gradient-to-r from-primary via-primary/80 to-primary/50"
                aria-hidden="true"
              />

              {/* Close button */}
              <button
                ref={closeRef}
                onClick={dismiss}
                aria-label="Close"
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>

              <div className="p-6 md:p-8">
                {/* Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-primary/10 text-primary border-primary/20 font-medium gap-1.5">
                    <Sparkles className="w-3 h-3" aria-hidden="true" />
                    Free Account
                  </Badge>
                </div>

                {/* Headline */}
                <h2
                  id="lc-modal-title"
                  className="text-xl font-bold mb-2 text-balance"
                >
                  {activePopup.headline}
                </h2>
                <p className="text-muted-foreground text-sm mb-5 text-pretty">
                  {activePopup.subheadline}
                </p>

                {/* Benefits */}
                {benefits.length > 0 && (
                  <ul className="space-y-2 mb-6" aria-label="Account benefits">
                    {benefits.slice(0, 5).map((b) => (
                      <li key={b} className="flex items-center gap-2 text-sm">
                        <CheckCircle2
                          className="w-4 h-4 text-success shrink-0"
                          aria-hidden="true"
                        />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* OAuth buttons */}
                <div className="space-y-2 mb-4">
                  <button
                    onClick={handleGoogle}
                    className="w-full flex items-center justify-center gap-2.5 h-10 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Continue with Google"
                  >
                    <Chrome className="w-4 h-4 text-primary" aria-hidden="true" />
                    Continue with Google
                  </button>
                  <button
                    onClick={handleMagicLink}
                    className="w-full flex items-center justify-center gap-2.5 h-10 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Continue with Magic Link"
                  >
                    <Mail className="w-4 h-4 text-primary" aria-hidden="true" />
                    Continue with Magic Link
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-4" aria-hidden="true">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Primary CTA */}
                <Button
                  onClick={handlePrimary}
                  className="w-full gap-2 font-semibold"
                >
                  <Zap className="w-4 h-4" aria-hidden="true" />
                  {activePopup.cta_primary}
                  <ArrowRight className="w-4 h-4 ml-auto" aria-hidden="true" />
                </Button>

                {/* Secondary / dismiss */}
                {activePopup.cta_secondary && (
                  <button
                    onClick={dismiss}
                    className="w-full mt-2 text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 focus:outline-none focus-visible:underline"
                  >
                    {activePopup.cta_secondary}
                  </button>
                )}

                <p className="mt-4 text-center text-[11px] text-muted-foreground">
                  No credit card required · Free forever tier · Cancel anytime
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
