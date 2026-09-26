import { supabase } from '@/db/supabase';
import { getUserCommunicationPreferences } from '@/lib/automationApi';
import type {
  ActivationChecklistItem,
  CustomerGoalTemplate,
  FeatureAnnouncement,
  LifecycleAnalytics,
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

async function areChannelPreferencesEnabled(email = false, inApp = false, dashboard = false): Promise<{ email: boolean; inApp: boolean; dashboard: boolean }> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return { email: false, inApp: false, dashboard: false };
  const prefs = await getUserCommunicationPreferences(user.id);
  if (!prefs) {
    return { email: email ? true : false, inApp: inApp ? true : false, dashboard: dashboard ? true : false };
  }
  return {
    email: email ? prefs.email_enabled : false,
    inApp: inApp ? prefs.in_app_enabled : false,
    dashboard: dashboard ? prefs.dashboard_announcements_enabled : false,
  };
}

export async function getLifecycleProfile(): Promise<LifecycleProfile | null> {
  const { data, error } = await supabase
    .from('customer_profiles')
    .select('id, lifecycle_stage, previous_stage, stage_updated_at, activation_score, activation_score_updated_at, health_score, health_score_updated_at, upgrade_readiness_score, upgrade_readiness_updated_at, subscription_plan, onboarding_dismissed, onboarding_completed, onboarding_reset_at')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    customer_profile_id: data.id,
    lifecycle_stage: data.lifecycle_stage,
    previous_stage: data.previous_stage,
    stage_updated_at: data.stage_updated_at,
    activation_score: data.activation_score ?? 0,
    activation_score_updated_at: data.activation_score_updated_at,
    health_score: data.health_score ?? 0,
    health_score_updated_at: data.health_score_updated_at,
    upgrade_readiness_score: data.upgrade_readiness_score ?? 0,
    upgrade_readiness_updated_at: data.upgrade_readiness_updated_at,
    subscription_plan: data.subscription_plan ?? 'free',
    onboarding_dismissed: data.onboarding_dismissed ?? false,
    onboarding_completed: data.onboarding_completed ?? false,
    onboarding_reset_at: data.onboarding_reset_at,
  };
}

export async function getActivationChecklist(): Promise<UserChecklistProgress[]> {
  const { data: progress, error: progressError } = await supabase
    .from('user_checklist_progress')
    .select('*')
    .order('completed_at', { ascending: false });
  if (progressError || !progress) return [];

  const { data: items, error: itemsError } = await supabase
    .from('activation_checklist_items')
    .select('*')
    .eq('enabled', true)
    .order('display_order', { ascending: true });
  if (itemsError || !items) return [];

  const itemMap = new Map((items as ActivationChecklistItem[]).map((i) => [i.item_key, i]));
  return (progress as UserChecklistProgress[]).map((row) => ({
    ...row,
    item: itemMap.get(row.item_key),
  })).sort((a, b) => (a.item?.display_order ?? 0) - (b.item?.display_order ?? 0));
}

export async function completeChecklistItem(itemKey: string): Promise<boolean> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return false;

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile?.id) return false;

  await supabase.rpc('complete_checklist_item', {
    p_profile_id: profile.id,
    p_item_key: itemKey,
  });
  return true;
}

export async function getMilestones(): Promise<Milestone[]> {
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('enabled', true)
    .order('display_order', { ascending: true });
  if (error) return [];
  return (data || []) as Milestone[];
}

export async function getUserMilestones(): Promise<UserMilestone[]> {
  const { data: unlocked, error: unlockedError } = await supabase
    .from('user_milestones')
    .select('*')
    .order('unlocked_at', { ascending: false });
  if (unlockedError || !unlocked) return [];

  const { data: allMilestones, error: milestonesError } = await supabase
    .from('milestones')
    .select('*');
  if (milestonesError || !allMilestones) return [];

  const milestoneMap = new Map((allMilestones as Milestone[]).map((m) => [m.milestone_key, m]));
  return (unlocked as UserMilestone[]).map((row) => ({
    ...row,
    milestone: milestoneMap.get(row.milestone_key),
  }));
}

export async function getGoalTemplates(): Promise<CustomerGoalTemplate[]> {
  const { data, error } = await supabase
    .from('customer_goals')
    .select('*')
    .eq('enabled', true)
    .order('created_at', { ascending: true });
  if (error) return [];
  return (data || []) as CustomerGoalTemplate[];
}

export async function getUserGoals(): Promise<UserGoal[]> {
  const { data: goals, error: goalsError } = await supabase
    .from('user_goals')
    .select('*')
    .order('created_at', { ascending: true });
  if (goalsError || !goals) return [];

  const { data: templates, error: templatesError } = await supabase
    .from('customer_goals')
    .select('*');
  if (templatesError || !templates) return [];

  const templateMap = new Map((templates as CustomerGoalTemplate[]).map((t) => [t.goal_key, t]));
  return (goals as UserGoal[]).map((row) => ({
    ...row,
    template: templateMap.get(row.goal_key),
  }));
}

export async function setUserGoal(goalKey: string): Promise<boolean> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return false;

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile?.id) return false;

  await supabase.rpc('set_user_goal', {
    p_profile_id: profile.id,
    p_goal_key: goalKey,
  });
  return true;
}

export async function getTours(): Promise<ProductTour[]> {
  const { data, error } = await supabase
    .from('product_tours')
    .select('*')
    .eq('enabled', true);
  if (error) return [];
  return (data || []) as ProductTour[];
}

export async function getUserTourProgress(): Promise<UserTourProgress[]> {
  const { data: progress, error: progressError } = await supabase
    .from('user_tour_progress')
    .select('*');
  if (progressError || !progress) return [];

  const { data: tours, error: toursError } = await supabase
    .from('product_tours')
    .select('*');
  if (toursError || !tours) return [];

  const tourMap = new Map((tours as ProductTour[]).map((t) => [t.tour_key, t]));
  return (progress as UserTourProgress[]).map((row) => ({
    ...row,
    tour: tourMap.get(row.tour_key),
  }));
}

export async function updateTourProgress(tourKey: string, step: number, completed: boolean): Promise<void> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile?.id) return;

  await supabase.from('user_tour_progress').upsert({
    customer_profile_id: profile.id,
    tour_key: tourKey,
    current_step: step,
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  }, { onConflict: 'customer_profile_id,tour_key' });
}

export async function getFeatureAnnouncements(): Promise<FeatureAnnouncement[]> {
  const channels = await areChannelPreferencesEnabled(false, false, true);
  if (!channels.dashboard) return [];
  const { data, error } = await supabase
    .from('feature_announcements')
    .select('*')
    .eq('enabled', true)
    .lte('start_date', new Date().toISOString())
    .or('end_date.is.null,end_date.gte.' + new Date().toISOString())
    .order('priority', { ascending: false });
  if (error) return [];
  return (data || []) as FeatureAnnouncement[];
}

export async function getNotifications(limit = 20): Promise<LifecycleNotification[]> {
  const channels = await areChannelPreferencesEnabled(false, true, false);
  if (!channels.inApp) return [];
  const { data, error } = await supabase
    .from('user_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data || []) as LifecycleNotification[];
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from('user_notifications').update({ read: true, read_at: new Date().toISOString() }).eq('id', id);
}

export async function getUserJourneyStages(): Promise<UserJourneyStage[]> {
  const { data, error } = await supabase.from('user_journey_stages').select('*');
  if (error) return [];
  return (data || []) as UserJourneyStage[];
}

export async function computeNextBestAction(
  checklist: UserChecklistProgress[],
  profile: LifecycleProfile | null,
  goals: UserGoal[]
): Promise<NextBestAction | null> {
  const incomplete = checklist.find((i) => !i.completed);
  if (incomplete?.item) {
    return {
      id: 'checklist-' + incomplete.item_key,
      action_key: incomplete.item_key,
      title: incomplete.item.label,
      description: incomplete.item.description || 'Complete this step to advance your activation.',
      cta_url: actionUrlForKey(incomplete.item_key),
      priority: 1,
      reason: 'activation_checklist',
    };
  }

  if (goals.length > 0) {
    const active = goals.find((g) => !g.completed);
    if (active?.template) {
      return {
        id: 'goal-' + active.goal_key,
        action_key: active.goal_key,
        title: active.template.title,
        description: active.template.description || 'Keep working toward your goal.',
        cta_url: actionUrlForKey(active.goal_key),
        priority: 2,
        reason: 'active_goal',
      };
    }
  }

  const usedTools = new Set(checklist.filter((i) => i.completed).map((i) => i.item_key));
  if (!usedTools.has('first_humanize') && usedTools.has('first_scan')) {
    return {
      id: 'recommend-humanizer',
      action_key: 'try_humanizer',
      title: 'Try the Humanizer',
      description: 'Make AI-generated text sound natural after detection.',
      cta_url: '/humanizer',
      priority: 3,
      reason: 'product_adoption',
    };
  }
  if (!usedTools.has('first_plagiarism') && usedTools.has('first_humanize')) {
    return {
      id: 'recommend-plagiarism',
      action_key: 'try_plagiarism',
      title: 'Run a Plagiarism Check',
      description: 'Ensure your content is original.',
      cta_url: '/plagiarism-checker',
      priority: 3,
      reason: 'product_adoption',
    };
  }
  if (!usedTools.has('install_extension')) {
    return {
      id: 'recommend-extension',
      action_key: 'install_extension',
      title: 'Install Chrome Extension',
      description: 'Analyze content directly in your browser.',
      cta_url: '/chrome-extension',
      priority: 4,
      reason: 'product_adoption',
    };
  }
  if (!usedTools.has('first_api_key')) {
    return {
      id: 'recommend-api',
      action_key: 'generate_api_key',
      title: 'Generate an API Key',
      description: 'Integrate AI detection into your workflow.',
      cta_url: '/api',
      priority: 5,
      reason: 'product_adoption',
    };
  }

  return {
    id: 'explore-progress',
    action_key: 'view_progress',
    title: 'View Your Progress',
    description: 'See your full activation score, achievements, and usage stats.',
    cta_url: '/dashboard/progress',
    priority: 10,
    reason: 'explore',
  };
}

function actionUrlForKey(key: string): string {
  const map: Record<string, string> = {
    verify_email: '/account/settings',
    complete_profile: '/account/settings',
    first_scan: '/ai-detector',
    first_humanize: '/humanizer',
    first_plagiarism: '/plagiarism-checker',
    install_extension: '/chrome-extension',
    install_plugin: '/wordpress-plugin',
    first_api_key: '/api',
    save_report: '/dashboard',
    upgrade_to_pro: '/pricing',
    check_100_documents: '/ai-detector',
    humanize_50_articles: '/humanizer',
    generate_api_key: '/api',
    connect_plugin: '/wordpress-plugin',
  };
  return map[key] || '/dashboard';
}

export async function getUsageStats(): Promise<UsageStats> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return zeroStats();

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  const profileId = profile?.id;
  if (!profileId) return zeroStats();

  const { data, error } = await supabase.rpc('get_usage_stats', { p_profile_id: profileId });
  if (error || !data) return zeroStats();
  return data as UsageStats;
}

function zeroStats(): UsageStats {
  return {
    ai_scans: 0,
    words_analyzed: 0,
    words_humanized: 0,
    reports_generated: 0,
    plagiarism_checks: 0,
    api_requests: 0,
    extension_usage: 0,
    plugin_activity: 0,
    time_saved_minutes: 0,
    documents_processed: 0,
  };
}

export async function updateOnboardingPreferences(prefs: {
  onboarding_dismissed?: boolean;
  onboarding_completed?: boolean;
  onboarding_reset_at?: string | null;
}): Promise<boolean> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return false;
  const { error } = await supabase
    .from('customer_profiles')
    .update(prefs)
    .eq('user_id', user.id);
  return !error;
}

export async function resetOnboardingProgress(): Promise<boolean> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return false;

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile?.id) return false;

  await supabase
    .from('user_checklist_progress')
    .delete()
    .eq('customer_profile_id', profile.id);

  await supabase
    .from('customer_profiles')
    .update({ onboarding_completed: false, onboarding_dismissed: false, onboarding_reset_at: new Date().toISOString() })
    .eq('user_id', user.id);

  return true;
}

export async function getLifecycleAnalytics(): Promise<LifecycleAnalytics> {
  const { data, error } = await supabase.rpc('get_lifecycle_analytics');
  if (error || !data) {
    return {
      lifecycle_distribution: [],
      activation_rate: 0,
      dau: 0,
      wau: 0,
      mau: 0,
      power_users: 0,
      inactive_users: 0,
      at_risk_users: 0,
      average_activation_score: 0,
      average_health_score: 0,
    };
  }
  return data as LifecycleAnalytics;
}

export async function getAdminFunnel() {
  const { data, error } = await supabase.rpc('get_activation_funnel');
  if (error || !data) return { stages: [] };
  return data as { stages: { stage_key: string; label: string; count: number; previous_count?: number; conversion_rate?: number }[] };
}

export async function getAdminFeatureAdoption() {
  const { data, error } = await supabase.rpc('get_feature_adoption_stats');
  if (error || !data) return { features: [] };
  return data as { features: { feature_key: string; total_users: number; active_users_week: number }[] };
}

export async function dismissAnnouncement(announcementId: string): Promise<void> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;
  const { data: profile } = await supabase.from('customer_profiles').select('id').eq('user_id', user.id).maybeSingle();
  if (!profile?.id) return;
  await supabase.from('user_announcement_interactions').upsert({
    customer_profile_id: profile.id,
    announcement_id: announcementId,
    dismissed: true,
    dismissed_at: new Date().toISOString(),
  }, { onConflict: 'customer_profile_id,announcement_id' });
}

export async function recordAnnouncementView(announcementId: string): Promise<void> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;
  const { data: profile } = await supabase.from('customer_profiles').select('id').eq('user_id', user.id).maybeSingle();
  if (!profile?.id) return;
  await supabase.from('user_announcement_interactions').upsert({
    customer_profile_id: profile.id,
    announcement_id: announcementId,
    viewed: true,
    viewed_at: new Date().toISOString(),
  }, { onConflict: 'customer_profile_id,announcement_id' });
}
