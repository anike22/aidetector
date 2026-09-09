/**
 * useFrequencyGuard – reads global frequency rules from localStorage cache
 * and decides whether a popup is allowed to show.
 *
 * Rules:
 *  - maxPerSession:   total popups shown in this browser tab session
 *  - maxPerDay:       total popups shown today (midnight-to-midnight UTC)
 *  - cooldownHours:   hours to wait after any popup was dismissed
 *  - exitCooldown:    hours to wait before showing another exit-intent popup
 */

import { useCallback } from 'react';

const SK_SESSION = 'aicx_lc_session';  // count for this tab session
const SK_DAY     = 'aicx_lc_day';      // { date: string, count: number }
const SK_DISMISS = 'aicx_lc_dismiss';  // ISO timestamp of last dismiss
const SK_EXIT    = 'aicx_lc_exit';     // ISO timestamp of last exit-intent

interface FrequencyRules {
  maxPerSession: number;
  maxPerDay: number;
  cooldownHours: number;
  exitCooldownHours: number;
}

const DEFAULTS: FrequencyRules = {
  maxPerSession: 2,
  maxPerDay: 3,
  cooldownHours: 24,
  exitCooldownHours: 48,
};

function hoursAgo(isoDate: string): number {
  return (Date.now() - new Date(isoDate).getTime()) / 3_600_000;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useFrequencyGuard(rules: FrequencyRules = DEFAULTS) {
  // sessionCount ref is not used for reads here; session count is always
  // read from sessionStorage directly to survive re-renders correctly.
  const canShow = useCallback(
    (isExitIntent = false): boolean => {
      try {
        // Session limit
        const sess = parseInt(sessionStorage.getItem(SK_SESSION) ?? '0', 10);
        if (sess >= rules.maxPerSession) return false;

        // Daily limit
        const dayRaw = localStorage.getItem(SK_DAY);
        if (dayRaw) {
          const day = JSON.parse(dayRaw) as { date: string; count: number };
          if (day.date === todayUTC() && day.count >= rules.maxPerDay) return false;
        }

        // Global cooldown after dismiss
        const lastDismiss = localStorage.getItem(SK_DISMISS);
        if (lastDismiss && hoursAgo(lastDismiss) < rules.cooldownHours) return false;

        // Exit-intent specific cooldown
        if (isExitIntent) {
          const lastExit = localStorage.getItem(SK_EXIT);
          if (lastExit && hoursAgo(lastExit) < rules.exitCooldownHours) return false;
        }

        return true;
      } catch { return true; }
    },
    [rules]
  );

  const recordShown = useCallback((isExitIntent = false) => {
    try {
      const sess = parseInt(sessionStorage.getItem(SK_SESSION) ?? '0', 10);
      sessionStorage.setItem(SK_SESSION, String(sess + 1));

      const today = todayUTC();
      const dayRaw = localStorage.getItem(SK_DAY);
      const day = dayRaw ? JSON.parse(dayRaw) : { date: today, count: 0 };
      if (day.date !== today) { day.date = today; day.count = 0; }
      day.count += 1;
      localStorage.setItem(SK_DAY, JSON.stringify(day));

      if (isExitIntent) localStorage.setItem(SK_EXIT, new Date().toISOString());
    } catch { /* noop */ }
  }, []);

  const recordDismiss = useCallback(() => {
    try { localStorage.setItem(SK_DISMISS, new Date().toISOString()); } catch { /* noop */ }
  }, []);

  return { canShow, recordShown, recordDismiss };
}
