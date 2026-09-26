import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLifecycle } from '@/contexts/LifecycleContext';
import { useTeam } from '@/contexts/TeamContext';
import { completeChecklistItem } from '@/lib/lifecycleApi';
import type { UserChecklistProgress } from '@/types/lifecycle';

export interface OnboardingTask {
  item_key: string;
  label: string;
  description: string;
  completed: boolean;
  href: string;
  isUpgrade?: boolean;
}

type PlanKey = 'free' | 'pro' | 'business' | 'enterprise';

const PLAN_ORDER: Record<PlanKey, string[]> = {
  free: [
    'verify_email',
    'complete_profile',
    'first_scan',
    'save_report',
    'try_seo_assistant',
    'explore_seo_content_studio',
  ],
  pro: [
    'verify_email',
    'complete_profile',
    'first_humanize',
    'first_scan',
    'first_api_key',
    'install_extension',
    'save_report',
  ],
  business: [
    'verify_email',
    'complete_profile',
    'first_humanize',
    'first_scan',
    'first_api_key',
    'install_extension',
    'save_report',
    'invite_first_member',
  ],
  enterprise: [
    'verify_email',
    'complete_org_setup',
    'invite_first_member',
    'create_first_workspace',
    'create_first_department',
    'assign_first_role',
    'first_api_key',
  ],
};

const TASK_META: Record<string, { label: string; description: string; href: string }> = {
  verify_email: { label: 'Verify email', description: 'Confirm your email address to secure your account.', href: '/settings/preferences' },
  complete_profile: { label: 'Complete profile', description: 'Add your name and avatar so teammates recognize you.', href: '/settings/preferences' },
  first_scan: { label: 'Run first AI Detector scan', description: 'Paste content and detect AI-generated text.', href: '/detector' },
  save_report: { label: 'Save first report', description: 'Save a detection report for future reference.', href: '/detector' },
  try_seo_assistant: { label: 'Try SEO Assistant', description: 'Analyze a page or keyword for SEO opportunities.', href: '/seo-assistant' },
  explore_seo_content_studio: { label: 'Explore SEO Content Studio', description: 'Generate and edit AI-assisted SEO content.', href: '/content-studio' },
  first_humanize: { label: 'Use AI Humanizer', description: 'Make AI-generated text sound natural and human.', href: '/humanizer' },
  first_api_key: { label: 'Generate API key', description: 'Create a key to use the developer API.', href: '/api' },
  install_extension: { label: 'Install Chrome Extension', description: 'Detect AI content directly in your browser.', href: '/chrome-extension' },
  complete_org_setup: { label: 'Complete organization setup', description: 'Finish configuring your Enterprise organization.', href: '/organizations' },
  invite_first_member: { label: 'Invite first member', description: 'Bring a teammate into your organization.', href: '/organizations' },
  create_first_workspace: { label: 'Create first workspace', description: 'Set up a workspace for your team.', href: '/organizations' },
  create_first_department: { label: 'Create first department', description: 'Organize members by department.', href: '/organizations' },
  assign_first_role: { label: 'Assign first role', description: 'Give a member a role and permissions.', href: '/organizations' },
  upgrade_to_pro: { label: 'Upgrade to Pro', description: 'Unlock advanced AI detection and unlimited usage.', href: '/pricing' },
};

function normalizePlan(plan: string | null | undefined): PlanKey {
  const p = (plan || 'free').toLowerCase();
  if (p === 'pro') return 'pro';
  if (p === 'business') return 'business';
  if (p === 'enterprise') return 'enterprise';
  return 'free';
}

function isTaskCompleted(
  key: string,
  checklist: UserChecklistProgress[],
  authUser: ReturnType<typeof useAuth>['user'],
  authProfile: ReturnType<typeof useAuth>['profile'],
  usageStats: ReturnType<typeof useLifecycle>['usageStats'],
  team: ReturnType<typeof useTeam>
): boolean {
  const dbCompleted = checklist.some((i) => i.item_key === key && i.completed);
  if (dbCompleted) return true;

  switch (key) {
    case 'verify_email':
      return !!authUser?.email_confirmed_at;
    case 'complete_profile':
      return !!authProfile?.full_name && !!authProfile?.avatar_url;
    case 'first_scan':
      return (usageStats?.ai_scans ?? 0) > 0;
    case 'first_humanize':
      return (usageStats?.words_humanized ?? 0) > 0;
    case 'first_plagiarism':
      return (usageStats?.plagiarism_checks ?? 0) > 0;
    case 'save_report':
      return (usageStats?.reports_generated ?? 0) > 0;
    case 'first_api_key':
      return (usageStats?.api_requests ?? 0) > 0;
    case 'complete_org_setup':
      return !!team.currentOrganization?.name && team.organizationMembers.length > 0;
    case 'invite_first_member':
      return team.organizationMembers.length > 1;
    case 'create_first_workspace':
      return team.workspaces.length > 0;
    case 'create_first_department':
      return false;
    case 'assign_first_role':
      return false;
    default:
      return false;
  }
}

export function useOnboardingChecklist() {
  const { user: authUser, profile: authProfile } = useAuth();
  const { profile: lifecycleProfile, checklist, usageStats, refresh } = useLifecycle();
  const team = useTeam();

  const plan = normalizePlan(authProfile?.subscription_plan ?? lifecycleProfile?.subscription_plan);
  const taskKeys = PLAN_ORDER[plan];

  const taskMap = useMemo(() => {
    const map = new Map<string, OnboardingTask>();
    for (const key of taskKeys) {
      const meta = TASK_META[key];
      const dbItem = checklist.find((i) => i.item_key === key)?.item;
      const completed = isTaskCompleted(key, checklist, authUser, authProfile, usageStats, team);
      map.set(key, {
        item_key: key,
        label: dbItem?.label || meta.label,
        description: dbItem?.description || meta.description,
        href: meta.href,
        completed,
      });
    }
    return map;
  }, [taskKeys, checklist, authUser, authProfile, usageStats, team]);

  const items = useMemo<OnboardingTask[]>(() => {
    const core = taskKeys
      .map((key) => taskMap.get(key)!)
      .filter((task) => !task.completed);
    if (plan === 'free') {
      const upgrade = taskMap.get('upgrade_to_pro') || {
        item_key: 'upgrade_to_pro',
        label: 'Upgrade to Pro',
        description: 'Unlock AI Humanizer, unlimited scans, and API access.',
        href: '/pricing',
        completed: false,
        isUpgrade: true,
      };
      if (!upgrade.completed) core.push(upgrade);
    }
    return core;
  }, [taskKeys, taskMap, plan]);

  const completedCount = useMemo(() => {
    return taskKeys.filter((key) => taskMap.get(key)?.completed).length;
  }, [taskKeys, taskMap]);

  const totalCount = taskKeys.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allComplete = totalCount > 0 && completedCount === totalCount;

  const completingRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    let cancelled = false;
    async function autoComplete() {
      for (const key of taskKeys) {
        const task = taskMap.get(key);
        if (!task || !task.completed) continue;
        const dbDone = checklist.some((i) => i.item_key === key && i.completed);
        if (dbDone) continue;
        if (completingRef.current.has(key)) continue;
        completingRef.current.add(key);
        try {
          await completeChecklistItem(key);
        } finally {
          if (!cancelled) refresh();
        }
      }
    }
    autoComplete();
    return () => {
      cancelled = true;
    };
  }, [taskKeys, taskMap, checklist, refresh]);

  const completeTask = useCallback(
    async (key: string) => {
      if (completingRef.current.has(key)) return;
      completingRef.current.add(key);
      try {
        await completeChecklistItem(key);
      } finally {
        await refresh();
      }
    },
    [refresh]
  );

  return {
    plan,
    items,
    completedCount,
    totalCount,
    percent,
    allComplete,
    completeTask,
  };
}
