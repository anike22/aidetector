/**
 * LeadCaptureContext – the central engine that powers the entire
 * Lead Capture & User Acquisition Platform.
 *
 * Responsibilities:
 *  - Maintain the active popup state (which popup config to show + variant)
 *  - Expose trigger helpers (triggerExitIntent, triggerToolCompletion, etc.)
 *  - Enforce frequency & cooldown rules
 *  - Track all events via leadApi
 *  - Expose page-context setter so each page declares its own context
 *  - Hide everything when the user is authenticated
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { useFrequencyGuard } from '@/hooks/useFrequencyGuard';
import { trackEvent, type LeadEventType } from '@/lib/leadApi';

export type PageContext =
  | 'global'
  | 'detector'
  | 'humanizer'
  | 'plagiarism'
  | 'chrome'
  | 'wordpress'
  | 'api'
  | 'pricing';

export interface PopupConfig {
  id: string;
  name: string;
  page_context: PageContext | 'global';
  trigger_type: string;
  headline: string;
  subheadline: string;
  benefits: string[];
  cta_primary: string;
  cta_secondary?: string;
  ab_variant?: string;
}

interface LeadCaptureState {
  /** Currently active popup (null = hidden) */
  activePopup: PopupConfig | null;
  /** Current page context for trigger matching */
  pageContext: PageContext;
  /** Whether any popup is visible */
  isVisible: boolean;
  /** Set page context from page-level components */
  setPageContext: (ctx: PageContext) => void;
  /** Show a specific popup config */
  showPopup: (config: PopupConfig) => void;
  /** Dismiss the active popup */
  dismiss: () => void;
  /** Mark conversion (user signed up from popup) */
  convert: () => void;
  /** Trigger tool-completion popup for current page */
  triggerToolCompletion: () => void;
  /** Trigger exit intent for current page */
  triggerExitIntent: () => void;
  /** Trigger usage limit prompt */
  triggerUsageLimit: (toolLabel: string, count: number) => void;
}

const LeadCaptureContext = createContext<LeadCaptureState | undefined>(undefined);

// ─── Static popup configs (these are also seeded to DB; this keeps runtime
//     calls snappy — no DB round-trip required for triggering popups) ────────

const POPUP_REGISTRY: Record<string, PopupConfig[]> = {
  detector: [
    {
      id: 'det-exit',
      name: 'Detector Exit Intent',
      page_context: 'detector',
      trigger_type: 'exit_intent',
      headline: 'Save Your Scan History',
      subheadline: 'Create a free account to never lose your detection results.',
      benefits: [
        'Save unlimited scan history',
        'Compare previous scans side-by-side',
        'Export detailed PDF reports',
        'Track AI content over time',
        'Unlock additional daily scans',
      ],
      cta_primary: 'Create Free Account',
      cta_secondary: 'Continue Without Saving',
    },
    {
      id: 'det-completion',
      name: 'Detector Tool Completion',
      page_context: 'detector',
      trigger_type: 'tool_completion',
      headline: 'Save This Result',
      subheadline: 'Your detection result is ready — create a free account to save it.',
      benefits: [
        'Save scan history',
        'Export reports',
        'Track trends over time',
        'Unlock more daily scans',
      ],
      cta_primary: 'Save Scan Result',
      cta_secondary: 'Dismiss',
    },
  ],
  humanizer: [
    {
      id: 'hum-exit',
      name: 'Humanizer Exit Intent',
      page_context: 'humanizer',
      trigger_type: 'exit_intent',
      headline: 'Save Your Rewritten Content',
      subheadline: 'Create a free account to access your writing history anytime.',
      benefits: [
        'Save all rewritten versions',
        'Access your full writing history',
        'Continue editing later',
        'Unlock premium writing modes',
      ],
      cta_primary: 'Save My Work',
      cta_secondary: 'Continue Without Saving',
    },
    {
      id: 'hum-completion',
      name: 'Humanizer Tool Completion',
      page_context: 'humanizer',
      trigger_type: 'tool_completion',
      headline: 'Your Content Has Been Humanized',
      subheadline: 'Save this version and access it later from any device.',
      benefits: [
        'Save rewritten versions',
        'Writing history',
        'Premium modes',
        'Continue editing',
      ],
      cta_primary: 'Save This Version',
      cta_secondary: 'Dismiss',
    },
  ],
  plagiarism: [
    {
      id: 'plag-exit',
      name: 'Plagiarism Exit Intent',
      page_context: 'plagiarism',
      trigger_type: 'exit_intent',
      headline: 'Download Your Originality Report',
      subheadline: 'Create a free account to download and store plagiarism reports.',
      benefits: [
        'Download originality reports',
        'View source history',
        'Store all results',
        'Track over time',
      ],
      cta_primary: 'Create Free Account',
      cta_secondary: 'Dismiss',
    },
  ],
  api: [
    {
      id: 'api-exit',
      name: 'API Exit Intent',
      page_context: 'api',
      trigger_type: 'exit_intent',
      headline: 'Generate Your Free API Key',
      subheadline: 'Access the AIDetector.cx API — free tier available immediately.',
      benefits: [
        'Generate API keys instantly',
        'Track usage & analytics',
        'View request history',
        'Developer documentation',
      ],
      cta_primary: 'Generate Free API Key',
      cta_secondary: 'View Docs First',
    },
  ],
  pricing: [
    {
      id: 'pricing-time',
      name: 'Pricing Visit',
      page_context: 'pricing',
      trigger_type: 'time',
      headline: 'Unlock Unlimited Usage',
      subheadline: 'Create a free account and start with generous free tier limits today.',
      benefits: [
        'Free tier with no credit card',
        'Upgrade anytime',
        'Cancel anytime',
        'All tools included',
      ],
      cta_primary: 'Start For Free',
      cta_secondary: 'View Plans',
    },
  ],
  chrome: [
    {
      id: 'chrome-scroll',
      name: 'Chrome Extension',
      page_context: 'chrome',
      trigger_type: 'scroll',
      headline: 'Sync Your Browser Activity',
      subheadline: 'Create a free account to sync extension history and save preferences.',
      benefits: [
        'Sync extension history',
        'Save preferences',
        'Feature update notifications',
        'Multi-device support',
      ],
      cta_primary: 'Create Free Account',
      cta_secondary: 'Dismiss',
    },
  ],
  wordpress: [
    {
      id: 'wp-scroll',
      name: 'WordPress Plugin',
      page_context: 'wordpress',
      trigger_type: 'scroll',
      headline: 'Connect Multiple Websites',
      subheadline: 'Create a free account to manage all your WordPress sites in one dashboard.',
      benefits: [
        'Connect multiple websites',
        'View plugin analytics',
        'Plugin update notifications',
        'Team access controls',
      ],
      cta_primary: 'Create Free Account',
      cta_secondary: 'Dismiss',
    },
  ],
  global: [
    {
      id: 'global-scroll',
      name: 'Global Scroll',
      page_context: 'global',
      trigger_type: 'scroll',
      headline: 'Enjoying AIDetector.cx?',
      subheadline: 'Create a free account to save your work and track results over time.',
      benefits: [
        'Save your history',
        'Access all tools',
        'Export reports',
        'Free forever tier',
      ],
      cta_primary: 'Create Free Account',
      cta_secondary: 'Dismiss',
    },
    {
      id: 'global-time',
      name: 'Global Time',
      page_context: 'global',
      trigger_type: 'time',
      headline: 'Get More From AIDetector.cx',
      subheadline: 'Free accounts include scan history, reports, and unlimited access to educational tools.',
      benefits: [
        'Unlimited history',
        'Export results',
        'All tools included',
        'Free to start',
      ],
      cta_primary: 'Create Free Account',
      cta_secondary: 'Dismiss',
    },
  ],
};

function getPopup(context: PageContext, triggerType: string): PopupConfig | undefined {
  const list = POPUP_REGISTRY[context] ?? POPUP_REGISTRY['global'];
  return (
    list?.find((p) => p.trigger_type === triggerType) ??
    POPUP_REGISTRY['global']?.find((p) => p.trigger_type === triggerType)
  );
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function LeadCaptureProvider({ children }: { children: ReactNode }) {
  const auth = useContext(AuthContext);
  const user = auth?.user ?? null;
  const [activePopup, setActivePopup] = useState<PopupConfig | null>(null);
  const [pageContext, setPageContextState] = useState<PageContext>('global');
  const currentPopupRef = useRef<PopupConfig | null>(null);

  const { canShow, recordShown, recordDismiss } = useFrequencyGuard();

  // Authenticated users never see lead capture
  const isEnabled = !user;

  const showPopup = useCallback(
    (config: PopupConfig) => {
      if (!isEnabled) return;
      const isExit = config.trigger_type === 'exit_intent';
      if (!canShow(isExit)) return;
      currentPopupRef.current = config;
      setActivePopup(config);
      recordShown(isExit);
      trackEvent({
        event_type: 'popup_impression',
        page: window.location.pathname,
        popup_id: config.id,
      });
    },
    [isEnabled, canShow, recordShown]
  );

  const dismiss = useCallback(() => {
    const popup = currentPopupRef.current;
    if (popup) {
      recordDismiss();
      trackEvent({
        event_type: 'popup_close',
        page: window.location.pathname,
        popup_id: popup.id,
      });
    }
    currentPopupRef.current = null;
    setActivePopup(null);
  }, [recordDismiss]);

  const convert = useCallback(() => {
    const popup = currentPopupRef.current;
    if (popup) {
      trackEvent({
        event_type: 'popup_conversion',
        page: window.location.pathname,
        popup_id: popup.id,
      });
    }
    currentPopupRef.current = null;
    setActivePopup(null);
  }, []);

  const triggerExitIntent = useCallback(() => {
    if (!isEnabled) return;
    const config = getPopup(pageContext, 'exit_intent');
    if (config) showPopup(config);
  }, [isEnabled, pageContext, showPopup]);

  const triggerToolCompletion = useCallback(() => {
    if (!isEnabled) return;
    const config = getPopup(pageContext, 'tool_completion');
    if (config) showPopup(config);
  }, [isEnabled, pageContext, showPopup]);

  const triggerUsageLimit = useCallback(
    (toolLabel: string, count: number) => {
      if (!isEnabled) return;
      const base = getPopup(pageContext, 'exit_intent');
      if (!base) return;
      showPopup({
        ...base,
        id: `${base.id}-usage`,
        headline: `${count} Free ${toolLabel} Used`,
        subheadline: 'Create a free account to continue and save your results.',
        trigger_type: 'usage_limit',
      });
    },
    [isEnabled, pageContext, showPopup]
  );

  const setPageContext = useCallback((ctx: PageContext) => {
    setPageContextState(ctx);
  }, []);

  // Close popup when user signs in
  useEffect(() => {
    if (user) {
      currentPopupRef.current = null;
      setActivePopup(null);
    }
  }, [user]);

  const value: LeadCaptureState = {
    activePopup,
    pageContext,
    isVisible: activePopup !== null,
    setPageContext,
    showPopup,
    dismiss,
    convert,
    triggerToolCompletion,
    triggerExitIntent,
    triggerUsageLimit,
  };

  return (
    <LeadCaptureContext.Provider value={value}>
      {children}
    </LeadCaptureContext.Provider>
  );
}

export function useLeadCapture(): LeadCaptureState {
  const ctx = useContext(LeadCaptureContext);
  if (!ctx) throw new Error('useLeadCapture must be used within LeadCaptureProvider');
  return ctx;
}
