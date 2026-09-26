/**
 * PageLeadCapture – drop into any page to wire up its specific
 * exit intent, scroll, time triggers, and sticky CTA.
 *
 * Usage:
 *   <PageLeadCapture context="detector" stickyLabel="Save Scan History" />
 */
import { useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeadCapture, type PageContext } from '@/contexts/LeadCaptureContext';
import { useExitIntent } from '@/hooks/useExitIntent';
import { useScrollTrigger } from '@/hooks/useScrollTrigger';
import { useTimeTrigger } from '@/hooks/useTimeTrigger';
import { StickyCTABanner } from './StickyCTABanner';
import { trackEvent } from '@/lib/leadApi';

interface Props {
  context: PageContext;
  /** Scroll depth that triggers popup (default 75%) */
  scrollPercent?: number;
  /** Seconds on page before time popup (default 60) */
  timeSeconds?: number;
  /** Whether to show sticky CTA (default true) */
  showSticky?: boolean;
  stickyLabel?: string;
  stickySubLabel?: string;
  /** Disable exit intent (e.g. while tool is active) */
  disableExitIntent?: boolean;
}

export function PageLeadCapture({
  context,
  scrollPercent = 75,
  timeSeconds = 60,
  showSticky = true,
  stickyLabel,
  stickySubLabel,
  disableExitIntent = false,
}: Props) {
  const { user } = useAuth();
  const { setPageContext, triggerExitIntent, showPopup } = useLeadCapture();

  // Register page context on mount / when context prop changes
  useEffect(() => {
    setPageContext(context);
  }, [context, setPageContext]);

  const enabled = !user;

  const onExitIntent = useCallback(() => {
    trackEvent({ event_type: 'exit_intent', page: window.location.pathname });
    triggerExitIntent();
  }, [triggerExitIntent]);

  const onScroll = useCallback(() => {
    trackEvent({ event_type: 'scroll_trigger', page: window.location.pathname, metadata: { percent: scrollPercent } });
    showPopup({
      id: `${context}-scroll`,
      name: `${context} Scroll ${scrollPercent}%`,
      page_context: context,
      trigger_type: 'scroll',
      headline: 'Enjoying This Page?',
      subheadline: 'Create a free account to save your work and access all tools.',
      benefits: ['Save your history', 'Access all tools', 'Export reports', 'Free forever tier'],
      cta_primary: 'Create Free Account',
      cta_secondary: 'Dismiss',
    });
  }, [context, scrollPercent, showPopup]);

  const onTime = useCallback(() => {
    trackEvent({ event_type: 'time_trigger', page: window.location.pathname, metadata: { seconds: timeSeconds } });
    // Only trigger time popup if no other popup was shown already
    showPopup({
      id: `${context}-time`,
      name: `${context} Time ${timeSeconds}s`,
      page_context: context,
      trigger_type: 'time',
      headline: 'Get More From AIDetector.cx',
      subheadline: 'Free accounts include history, reports, and unlimited educational access.',
      benefits: ['Unlimited history', 'Export results', 'All tools', 'Free to start'],
      cta_primary: 'Create Free Account',
      cta_secondary: 'Dismiss',
    });
  }, [context, timeSeconds, showPopup]);

  useExitIntent(onExitIntent, { enabled: enabled && !disableExitIntent, minTimeMs: 5000 });
  useScrollTrigger(scrollPercent, onScroll, enabled);
  useTimeTrigger(timeSeconds, onTime, enabled);

  if (!enabled || !showSticky) return null;

  return (
    <StickyCTABanner
      label={stickyLabel ?? 'Create Free Account'}
      subLabel={stickySubLabel ?? 'Save your work · No credit card required'}
    />
  );
}
