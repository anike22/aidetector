/**
 * Generates / retrieves a persistent anonymous visitor ID.
 * Stored in localStorage so it survives page reloads and sessions.
 */
const KEY = 'aicx_vid';

export function getVisitorId(): string {
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function getStoredVisitorId(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

/** Removes stored visitor id (called after merge). */
export function clearVisitorId(): void {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}
