import type { SummarizeResult, SummaryFormat, SummaryLength } from '@/lib/summarizerApi';

export interface SummaryHistoryItem {
  id: string;
  timestamp: number;
  title: string;
  inputText: string;
  inputWords: number;
  fileName?: string | null;
  result: SummarizeResult;
  settings: {
    length: SummaryLength;
    format: SummaryFormat;
    language: string;
    focus?: string;
  };
}

const STORAGE_KEY = 'aidetector_summarizer_session_history_v1';
const MAX_HISTORY_ITEMS = 20;

// In-memory fallback for environments where Web Storage is unavailable (e.g. Node/Vitest or disabled storage)
let memoryStore: SummaryHistoryItem[] = [];

function getRawStorage(): string | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const sess = window.sessionStorage.getItem(STORAGE_KEY);
      if (sess) return sess;
    }
  } catch {
    // ignore
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const loc = window.localStorage.getItem(STORAGE_KEY);
      if (loc) return loc;
    }
  } catch {
    // ignore
  }
  return null;
}

function setRawStorage(serialized: string): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(STORAGE_KEY, serialized);
    }
  } catch {
    // ignore
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, serialized);
    }
  } catch {
    // ignore
  }
}

export function getSummaryHistory(): SummaryHistoryItem[] {
  try {
    const raw = getRawStorage();
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryStore = parsed.filter(
          (item) => item && typeof item.id === 'string' && item.result && item.inputText
        );
        return memoryStore;
      }
    }
  } catch (err) {
    console.warn('[summarizerHistory] Failed to read history:', err);
  }
  return [...memoryStore];
}

export function saveSummaryToHistory(item: Omit<SummaryHistoryItem, 'id' | 'timestamp'>): SummaryHistoryItem {
  const current = getSummaryHistory();
  const newItem: SummaryHistoryItem = {
    ...item,
    id: `sum_hist_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
  };

  const itemSummaryText = item.result?.summary?.items?.join('\n') || '';

  // Prepend new item and enforce maximum limit (deduplicating exact matches)
  const updated = [
    newItem,
    ...current.filter((c) => (c.result?.summary?.items?.join('\n') || '') !== itemSummaryText),
  ].slice(0, MAX_HISTORY_ITEMS);

  memoryStore = updated;
  try {
    setRawStorage(JSON.stringify(updated));
  } catch (err) {
    console.warn('[summarizerHistory] Failed to save history item:', err);
  }

  return newItem;
}

export function removeSummaryFromHistory(id: string): SummaryHistoryItem[] {
  const current = getSummaryHistory();
  const filtered = current.filter((item) => item.id !== id);
  memoryStore = filtered;
  try {
    setRawStorage(JSON.stringify(filtered));
  } catch (err) {
    console.warn('[summarizerHistory] Failed to update history:', err);
  }
  return filtered;
}

export function clearSummaryHistory(): void {
  memoryStore = [];
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {
    console.warn('[summarizerHistory] Failed to clear history:', err);
  }
}
