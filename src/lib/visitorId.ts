/**
 * Manages persistent anonymous visitor / guest session IDs and draft preservation.
 */
const VISITOR_KEY = 'aicx_vid';
const DRAFT_KEY = 'aicx_draft_text';
const DRAFT_FEATURE_KEY = 'aicx_draft_feature';

let memorySessionStore: Record<string, string> = {};
let memoryLocalStore: Record<string, string> = {};

/**
 * Synchronous local guest id (may be pre-bootstrap). Real enforcement is
 * server-side: edge functions validate/create the session via
 * issue_or_validate_guest_session, and registration links usage.
 */
export function getVisitorId(): string {
  const existing = getStoredVisitorId();
  if (existing) return existing;
  const newId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  try {
    if (typeof localStorage !== 'undefined' && localStorage.setItem) {
      localStorage.setItem(VISITOR_KEY, newId);
    }
  } catch {
    /* noop */
  }
  memoryLocalStore[VISITOR_KEY] = newId;
  return newId;
}

let serverSessionPromise: Promise<string> | null = null;

/**
 * Ensures a server-issued guest session exists for this visitor. The
 * server validates the local id (creating/upserting the row with the
 * authoritative trial counters). Call before the first billable request.
 */
export async function ensureGuestSession(): Promise<string> {
  const localId = getVisitorId();
  if (serverSessionPromise) return serverSessionPromise;
  serverSessionPromise = (async () => {
    try {
      const { supabase } = await import('@/db/supabase');
      const { data, error } = await supabase.rpc('issue_or_validate_guest_session', {
        p_guest_id: localId,
        p_ip: null,
        p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      });
      if (!error && data?.guest_id) {
        // Server is authoritative; adopt its id (same on upsert).
        try {
          if (typeof localStorage !== 'undefined' && localStorage.setItem) {
            localStorage.setItem(VISITOR_KEY, data.guest_id);
          }
        } catch { /* noop */ }
        memoryLocalStore[VISITOR_KEY] = data.guest_id;
        return data.guest_id as string;
      }
    } catch (e) {
      // Offline/failure: local id still works; the server will upsert on
      // the next reserve call (fail-safe, not a bypass — server still gates).
    }
    return localId;
  })();
  return serverSessionPromise;
}

export function getStoredVisitorId(): string | null {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem) {
      return localStorage.getItem(VISITOR_KEY);
    }
  } catch {
    // fallback
  }
  return memoryLocalStore[VISITOR_KEY] || null;
}

/** Removes stored visitor id (called after merge if needed). */
export function clearVisitorId(): void {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.removeItem) {
      localStorage.removeItem(VISITOR_KEY);
    }
  } catch {
    /* noop */
  }
  delete memoryLocalStore[VISITOR_KEY];
}

/**
 * Preserves user entered text across sign-in, signup, or checkout redirects.
 */
export function preserveDraftText(text: string, featureSlug = 'ai_detector'): void {
  try {
    if (text && text.trim().length > 0) {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.setItem) {
        sessionStorage.setItem(DRAFT_KEY, text);
        sessionStorage.setItem(DRAFT_FEATURE_KEY, featureSlug);
      }
      memorySessionStore[DRAFT_KEY] = text;
      memorySessionStore[DRAFT_FEATURE_KEY] = featureSlug;
    }
  } catch {
    if (text && text.trim().length > 0) {
      memorySessionStore[DRAFT_KEY] = text;
      memorySessionStore[DRAFT_FEATURE_KEY] = featureSlug;
    }
  }
}

/**
 * Retrieves preserved draft text.
 */
export function getPreservedDraftText(expectedFeature?: string): string | null {
  try {
    let feature: string | null = null;
    let text: string | null = null;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem) {
      feature = sessionStorage.getItem(DRAFT_FEATURE_KEY);
      text = sessionStorage.getItem(DRAFT_KEY);
    }
    if (!text) {
      feature = memorySessionStore[DRAFT_FEATURE_KEY] || null;
      text = memorySessionStore[DRAFT_KEY] || null;
    }
    if (expectedFeature && feature && feature !== expectedFeature) {
      return null;
    }
    return text;
  } catch {
    const feature = memorySessionStore[DRAFT_FEATURE_KEY];
    if (expectedFeature && feature && feature !== expectedFeature) {
      return null;
    }
    return memorySessionStore[DRAFT_KEY] || null;
  }
}

/**
 * Clears preserved draft text.
 */
export function clearPreservedDraftText(): void {
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.removeItem) {
      sessionStorage.removeItem(DRAFT_KEY);
      sessionStorage.removeItem(DRAFT_FEATURE_KEY);
    }
  } catch {
    /* noop */
  }
  delete memorySessionStore[DRAFT_KEY];
  delete memorySessionStore[DRAFT_FEATURE_KEY];
}
