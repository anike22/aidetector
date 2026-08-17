import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  listWorkflows,
  listTemplates,
  listExecutions,
  getUserCommunicationPreferences,
  getAutomationAnalytics,
  trackAutomationEvent,
} from '@/lib/automationApi';
import type {
  AutomationExecution,
  AutomationTemplate,
  AutomationWorkflow,
  AutomationAnalyticsRow,
  UserCommunicationPreferences,
  AutomationEventInput,
} from '@/types/automation';

interface AutomationContextValue {
  workflows: AutomationWorkflow[];
  templates: AutomationTemplate[];
  executions: AutomationExecution[];
  analytics: AutomationAnalyticsRow[];
  preferences: UserCommunicationPreferences | null;
  loading: boolean;
  loadError: string | null;
  refresh: () => Promise<void>;
  trackEvent: (input: AutomationEventInput) => Promise<void>;
}

const AutomationContext = createContext<AutomationContextValue | undefined>(undefined);

export function AutomationProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [analytics, setAnalytics] = useState<AutomationAnalyticsRow[]>([]);
  const [preferences, setPreferences] = useState<UserCommunicationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setLoadError(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const promises: Promise<unknown>[] = [];
      promises.push(
        listTemplates().then(setTemplates).catch(() => setTemplates([]))
      );
      promises.push(
        getUserCommunicationPreferences(user.id)
          .then(setPreferences)
          .catch((err) => {
            console.error('Failed to load communication preferences:', err);
            setPreferences(null);
            setLoadError('We could not load your communication preferences. Please try again.');
          })
      );
      if (isAdmin) {
        promises.push(
          listWorkflows()
            .then(setWorkflows)
            .catch(() => setWorkflows([]))
        );
        promises.push(
          listExecutions({ limit: 100 })
            .then(({ data }) => setExecutions(data))
            .catch(() => setExecutions([]))
        );
        promises.push(
          getAutomationAnalytics()
            .then(setAnalytics)
            .catch(() => setAnalytics([]))
        );
      }
      await Promise.all(promises);
    } catch (e) {
      console.error('Automation context load error:', e);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const trackEvent = useCallback(async (input: AutomationEventInput) => {
    if (!user) return;
    try {
      await trackAutomationEvent(input);
    } catch (e) {
      console.error('Automation trackEvent error:', e);
    }
  }, [user]);

  return (
    <AutomationContext.Provider
      value={{
        workflows,
        templates,
        executions,
        analytics,
        preferences,
        loading,
        loadError,
        refresh: load,
        trackEvent,
      }}
    >
      {children}
    </AutomationContext.Provider>
  );
}

export function useAutomation() {
  const ctx = useContext(AutomationContext);
  if (!ctx) throw new Error('useAutomation must be used within AutomationProvider');
  return ctx;
}
