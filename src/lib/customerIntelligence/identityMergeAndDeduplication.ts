import { getVisitorId } from './visitorTracking';
import { LOCAL_JOURNEY_KEY } from './journeyTracker';
import { JourneyEvent } from '@/types/customerIntelligence';
import { supabase } from '@/db/supabase';

const SEEN_IDEMPOTENCY_KEYS = new Set<string>();

/**
 * Checks and records idempotency key to prevent duplicate conversion or checkout events.
 */
export function checkAndRecordIdempotency(key: string): boolean {
  if (SEEN_IDEMPOTENCY_KEYS.has(key)) {
    return false; // Duplicate detected
  }
  SEEN_IDEMPOTENCY_KEYS.add(key);
  // Keep idempotency set bounded
  if (SEEN_IDEMPOTENCY_KEYS.size > 2000) {
    const arr = Array.from(SEEN_IDEMPOTENCY_KEYS);
    SEEN_IDEMPOTENCY_KEYS.clear();
    arr.slice(500).forEach(k => SEEN_IDEMPOTENCY_KEYS.add(k));
  }
  return true;
}

/**
 * Lightweight bot traffic detector to prevent automated web crawlers from skewing conversion funnels.
 */
export function isBotTraffic(userAgent: string): boolean {
  if (!userAgent) return false;
  const lower = userAgent.toLowerCase();
  const botPatterns = [
    'bot',
    'crawl',
    'spider',
    'slurp',
    'headlesschrome',
    'lighthouse',
    'mediapartners-google',
    'bingbot',
    'duckduckbot',
    'baiduspider',
    'yandexbot',
    'facebookexternalhit',
    'pingdom',
    'python-requests',
    'curl/',
    'wget/',
  ];
  return botPatterns.some((p) => lower.includes(p));
}

/**
 * Merges an anonymous visitor's pre-registration touchpoints, events, and attribution
 * with their authenticated user account upon legitimate registration/login.
 */
export async function mergeAnonymousVisitorWithAccount(
  visitorId: string,
  userId: string,
  email?: string
): Promise<{ success: boolean; mergedEventsCount: number }> {
  try {
    // 1. Update local journey events with authenticated userId
    let localCount = 0;
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(LOCAL_JOURNEY_KEY);
      if (stored) {
        const events: JourneyEvent[] = JSON.parse(stored);
        const updated = events.map((ev) => {
          if (ev.visitorId === visitorId && !ev.userId) {
            localCount++;
            return { ...ev, userId, userEmail: email };
          }
          return ev;
        });
        window.localStorage.setItem(LOCAL_JOURNEY_KEY, JSON.stringify(updated));
      }
    }

    // 2. Bridge to Supabase Customer Profiles if connected
    try {
      await supabase
        .from('customer_profiles')
        .update({
          user_id: userId,
          email: email,
          updated_at: new Date().toISOString(),
        })
        .eq('visitor_id', visitorId);
    } catch {
      /* Supabase offline/mock fallback */
    }

    return { success: true, mergedEventsCount: localCount };
  } catch (err) {
    console.error('Failed to merge anonymous visitor with account:', err);
    return { success: false, mergedEventsCount: 0 };
  }
}
