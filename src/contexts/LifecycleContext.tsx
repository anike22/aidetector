import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerDataPlatform } from '@/contexts/CustomerDataPlatformContext';
import { toast } from 'sonner';
import {
  getActivationChecklist,
  getFeatureAnnouncements,
  getGoalTemplates,
  getLifecycleProfile,
  getMilestones,
  getNotifications,
  getTours,
  getUsageStats,
  getUserGoals,
  getUserJourneyStages,
  getUserMilestones,
  getUserTourProgress,
  computeNextBestAction,
  setUserGoal,
  markNotificationRead,
  dismissAnnouncement,
  recordAnnouncementView,
  updateTourProgress,
  updateOnboardingPreferences,
  resetOnboardingProgress,
} from '@/lib/lifecycleApi';
import type {
  ActivationChecklistItem,
  CustomerGoalTemplate,
  FeatureAnnouncement,
  LifecycleNotification,
  LifecycleProfile,
  Milestone,
  NextBestAction,
  ProductTour,
  UsageStats,
  UserChecklistProgress,
  UserGoal,
  UserJourneyStage,
  UserMilestone,
  UserTourProgress,
} from '@/types/lifecycle';

interface Celebration {
  id: string;
  type: 'milestone' | 'checklist' | 'goal';
  title: string;
  message: string;
  nextStep?: { label: string; url: string };
}

interface LifecycleContextValue {
  profile: LifecycleProfile | null;
  checklist: UserChecklistProgress[];
  milestones: Milestone[];
  userMilestones: UserMilestone[];
  goals: UserGoal[];
  goalTemplates: CustomerGoalTemplate[];
  tours: ProductTour[];
  tourProgress: UserTourProgress[];
  announcements: FeatureAnnouncement[];
  notifications: LifecycleNotification[];
  unreadNotifications: number;
  journeyStages: UserJourneyStage[];
  usageStats: UsageStats | null;
  nextAction: NextBestAction | null;
  celebrations: Celebration[];
  loading: boolean;
  refresh: () => Promise<void>;
  setGoal: (goalKey: string) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  dismissAnnouncementById: (id: string) => Promise<void>;
  viewAnnouncement: (id: string) => Promise<void>;
  advanceTour: (tourKey: string, step: number, completed: boolean) => Promise<void>;
  showCelebration: (celebration: Celebration) => void;
  clearCelebration: (id: string) => void;
  dismissOnboarding: () => Promise<void>;
  resumeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const LifecycleContext = createContext<LifecycleContextValue | undefined>(undefined);

export function LifecycleProvider({ children }: { children: ReactNode }) {
  const { user, profile: authProfile } = useAuth();
  const { customerProfile } = useCustomerDataPlatform();

  const [profile, setProfile] = useState<LifecycleProfile | null>(null);
  const [checklist, setChecklist] = useState<UserChecklistProgress[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [userMilestones, setUserMilestones] = useState<UserMilestone[]>([]);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [goalTemplates, setGoalTemplates] = useState<CustomerGoalTemplate[]>([]);
  const [tours, setTours] = useState<ProductTour[]>([]);
  const [tourProgress, setTourProgress] = useState<UserTourProgress[]>([]);
  const [announcements, setAnnouncements] = useState<FeatureAnnouncement[]>([]);
  const [notifications, setNotifications] = useState<LifecycleNotification[]>([]);
  const [journeyStages, setJourneyStages] = useState<UserJourneyStage[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [nextAction, setNextAction] = useState<NextBestAction | null>(null);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [loading, setLoading] = useState(true);

  const previousChecklistRef = useRef<UserChecklistProgress[]>([]);
  const previousMilestonesRef = useRef<UserMilestone[]>([]);
  const previousGoalsRef = useRef<UserGoal[]>([]);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [
        p,
        cl,
        ms,
        ums,
        gs,
        gts,
        ts,
        tps,
        anns,
        notifs,
        js,
        stats,
      ] = await Promise.all([
        getLifecycleProfile(),
        getActivationChecklist(),
        getMilestones(),
        getUserMilestones(),
        getUserGoals(),
        getGoalTemplates(),
        getTours(),
        getUserTourProgress(),
        getFeatureAnnouncements(),
        getNotifications(),
        getUserJourneyStages(),
        getUsageStats(),
      ]);

      setProfile(p);
      setChecklist(cl);
      setMilestones(ms);
      setUserMilestones(ums);
      setGoals(gs);
      setGoalTemplates(gts);
      setTours(ts);
      setTourProgress(tps);
      setAnnouncements(anns);
      setNotifications(notifs);
      setJourneyStages(js);
      setUsageStats(stats);

      const action = await computeNextBestAction(cl, p, gs);
      setNextAction(action);

      previousChecklistRef.current = cl;
      previousMilestonesRef.current = ums;
      previousGoalsRef.current = gs;
    } catch (e) {
      console.error('Lifecycle load error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const resetOnboarding = useCallback(async () => {
    await resetOnboardingProgress();
    await load();
  }, [load]);

  const showCelebration = useCallback((celebration: Celebration) => {
    setCelebrations((prev) => {
      if (prev.some((c) => c.id === celebration.id)) return prev;
      return [...prev, celebration];
    });
    toast.success(celebration.title, { description: celebration.message });
  }, []);

  const clearCelebration = useCallback((id: string) => {
    setCelebrations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const dismissOnboarding = useCallback(async () => {
    const ok = await updateOnboardingPreferences({ onboarding_dismissed: true });
    if (ok) {
      setProfile((prev) => (prev ? { ...prev, onboarding_dismissed: true } : prev));
    }
  }, []);

  const resumeOnboarding = useCallback(async () => {
    const ok = await updateOnboardingPreferences({ onboarding_dismissed: false });
    if (ok) {
      setProfile((prev) => (prev ? { ...prev, onboarding_dismissed: false } : prev));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, customerProfile?.id]);

  // Celebrate newly completed items, milestones, and goals
  useEffect(() => {
    const prev = previousChecklistRef.current;
    const newlyCompleted = checklist.filter(
      (i) => i.completed && !prev.find((pi) => pi.item_key === i.item_key && pi.completed)
    );
    for (const item of newlyCompleted) {
      showCelebration({
        id: 'checklist-' + item.item_key,
        type: 'checklist',
        title: 'Checklist Complete',
        message: item.item?.reward_message || item.item?.label || '',
      });
    }

    const prevMs = previousMilestonesRef.current;
    const newlyUnlocked = userMilestones.filter(
      (m) => !prevMs.find((pm) => pm.milestone_key === m.milestone_key)
    );
    for (const m of newlyUnlocked) {
      showCelebration({
        id: 'milestone-' + m.milestone_key,
        type: 'milestone',
        title: m.milestone?.title || 'Achievement Unlocked',
        message: m.milestone?.description || '',
      });
    }

    const prevGoals = previousGoalsRef.current;
    const newlyCompletedGoals = goals.filter(
      (g) => g.completed && !prevGoals.find((pg) => pg.goal_key === g.goal_key && pg.completed)
    );
    for (const g of newlyCompletedGoals) {
      showCelebration({
        id: 'goal-' + g.goal_key,
        type: 'goal',
        title: 'Goal Reached',
        message: g.template?.title || '',
      });
    }
  }, [checklist, userMilestones, goals, showCelebration]);

  const setGoal = useCallback(async (goalKey: string) => {
    await setUserGoal(goalKey);
    await load();
  }, [load]);

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n)));
  }, []);

  const dismissAnnouncementById = useCallback(async (id: string) => {
    await dismissAnnouncement(id);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const viewAnnouncement = useCallback(async (id: string) => {
    await recordAnnouncementView(id);
  }, []);

  const advanceTour = useCallback(async (tourKey: string, step: number, completed: boolean) => {
    await updateTourProgress(tourKey, step, completed);
    await load();
  }, [load]);

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  return (
    <LifecycleContext.Provider
      value={{
        profile,
        checklist,
        milestones,
        userMilestones,
        goals,
        goalTemplates,
        tours,
        tourProgress,
        announcements,
        notifications,
        unreadNotifications,
        journeyStages,
        usageStats,
        nextAction,
        celebrations,
        loading,
        refresh: load,
        setGoal,
        markRead,
        dismissAnnouncementById,
        viewAnnouncement,
        advanceTour,
        showCelebration,
        clearCelebration,
        dismissOnboarding,
        resumeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </LifecycleContext.Provider>
  );
}

export function useLifecycle() {
  const ctx = useContext(LifecycleContext);
  if (!ctx) throw new Error('useLifecycle must be used within LifecycleProvider');
  return ctx;
}
