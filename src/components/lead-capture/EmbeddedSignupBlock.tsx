/**
 * EmbeddedSignupBlock – inline signup block placed contextually
 * within long pages (after FAQs, after benchmark sections, etc.).
 *
 * Props:
 *  headline     – main heading (default: "Create Your Free Account")
 *  subheadline  – supporting copy
 *  benefits     – list of bullet points (max 4 shown)
 *  ctaLabel     – button label
 *  ctaId        – optional cta_id for analytics
 *  variant      – "card" | "banner" (default: "card")
 */
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/leadApi';
import { cn } from '@/lib/utils';

interface Props {
  headline?: string;
  subheadline?: string;
  benefits?: string[];
  ctaLabel?: string;
  ctaId?: string;
  variant?: 'card' | 'banner';
  className?: string;
}

const DEFAULT_BENEFITS = [
  'Save unlimited scan history',
  'Export detailed reports',
  'Access all tools',
  'Free forever tier',
];

export function EmbeddedSignupBlock({
  headline = 'Create Your Free Account',
  subheadline = 'Join over 2 million users who trust AIDetector.cx to detect and humanize AI-generated content.',
  benefits = DEFAULT_BENEFITS,
  ctaLabel = 'Create Free Account',
  ctaId,
  variant = 'card',
  className,
}: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Never show to signed-in users
  if (user) return null;

  const handleCta = () => {
    trackEvent({
      event_type: 'cta_click',
      page: window.location.pathname,
      cta_id: ctaId,
      metadata: { cta_type: 'embedded', label: ctaLabel },
    });
    navigate('/signup');
  };

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'py-8 px-4 md:px-6 bg-primary/5 border-y border-primary/10',
          className
        )}
      >
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-4 md:gap-8">
          <div className="flex-1 min-w-0 text-center md:text-left">
            <p className="font-semibold text-balance">{headline}</p>
            <p className="text-sm text-muted-foreground text-pretty mt-0.5">{subheadline}</p>
          </div>
          <Button onClick={handleCta} className="shrink-0 gap-2 font-semibold">
            {ctaLabel}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    );
  }

  // variant === 'card' (default)
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/50 bg-card p-6 md:p-8 shadow-sm',
        className
      )}
      aria-label="Create a free account"
    >
      <div className="flex items-start gap-4 flex-col md:flex-row md:items-center">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Free</Badge>
          </div>
          <h3 className="font-bold text-lg mb-1 text-balance">{headline}</h3>
          <p className="text-muted-foreground text-sm mb-4 text-pretty">{subheadline}</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 mb-5" aria-label="Benefits">
            {benefits.slice(0, 4).map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" aria-hidden="true" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <Button onClick={handleCta} className="gap-2 font-semibold">
            {ctaLabel}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
          <p className="mt-2 text-[11px] text-muted-foreground">
            No credit card required
          </p>
        </div>
      </div>
    </div>
  );
}
