/**
 * VisitorTracker – runs once per page navigation.
 * Captures UTM params, referrer, device info, session count,
 * and upserts the anonymous_visitors row.
 * Also merges visitor data to user account on auth state change.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { upsertVisitor, mergeVisitorToUser, trackEvent } from '@/lib/leadApi';

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
  if (ua.includes('Brave')) return 'Brave';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  return 'Other';
}

function getOS(): string {
  const ua = navigator.userAgent;
  if (/Windows/.test(ua)) return 'Windows';
  if (/Macintosh|Mac OS X/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  if (/iPhone|iPad/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  return 'Other';
}

function parseUTM() {
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source:   p.get('utm_source')   ?? undefined,
    utm_medium:   p.get('utm_medium')   ?? undefined,
    utm_campaign: p.get('utm_campaign') ?? undefined,
    utm_content:  p.get('utm_content')  ?? undefined,
    utm_term:     p.get('utm_term')     ?? undefined,
  };
}

const MERGE_KEY = 'aicx_merged';

export function VisitorTracker() {
  const location = useLocation();
  const { user } = useAuth();

  // On every navigation: upsert visitor row + track page_view
  useEffect(() => {
    const utm = parseUTM();
    const isFirstVisit = !localStorage.getItem('aicx_vid');

    void upsertVisitor({
      landing_page: isFirstVisit ? window.location.pathname : undefined,
      referrer_url: document.referrer || undefined,
      ...utm,
      device_type: getDeviceType(),
      browser:     getBrowser(),
      os:          getOS(),
      language:    navigator.language,
    });

    void trackEvent({
      event_type: 'page_view',
      page: location.pathname,
      metadata: { referrer: document.referrer, ...utm },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // On sign-in: merge anonymous history → user account
  useEffect(() => {
    if (!user) return;
    const alreadyMerged = sessionStorage.getItem(MERGE_KEY);
    if (alreadyMerged) return;
    sessionStorage.setItem(MERGE_KEY, '1');
    void mergeVisitorToUser(user.id);
    void trackEvent({
      event_type: 'signup',
      page: window.location.pathname,
      user_id: user.id,
      metadata: { trigger: 'auth_state_change' },
    });
  }, [user]);

  return null; // purely side-effects
}
