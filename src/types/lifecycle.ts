export type LifecycleStage =
  | 'anonymous_visitor'
  | 'registered'
  | 'email_verified'
  | 'activated'
  | 'engaged'
  | 'power_user'
  | 'pro_customer'
  | 'business_customer'
  | 'enterprise_customer'
  | 'inactive'
  | 'at_risk'
  | 'churned'
  | 'recovered';

export type HealthCategory = 'excellent' | 'healthy' | 'needs_attention' | 'at_risk' | 'critical';

export interface LifecycleProfile {
  customer_profile_id: string;
  lifecycle_stage: LifecycleStage | null;
  previous_stage: LifecycleStage | null;
  stage_updated_at: string | null;
  activation_score: number;
  activation_score_updated_at: string | null;
  health_score: number;
  health_score_updated_at: string | null;
  upgrade_readiness_score: number;
  upgrade_readiness_updated_at: string | null;
  subscription_plan: string | null;
  onboarding_dismissed: boolean;
  onboarding_completed: boolean;
  onboarding_reset_at: string | null;
}

export interface LifecycleHistoryEntry {
  id: string;
  customer_profile_id: string;
  from_stage: LifecycleStage | null;
  to_stage: LifecycleStage | null;
  trigger: string | null;
  changed_at: string;
}

export interface ActivationChecklistItem {
  id: string;
  item_key: string;
  label: string;
  description: string | null;
  estimated_time: number | null;
  completion_criteria: Record<string, unknown> | null;
  reward_message: string | null;
  display_order: number;
  enabled: boolean;
  is_system: boolean;
}

export interface UserChecklistProgress {
  customer_profile_id: string;
  item_key: string;
  completed: boolean;
  completed_at: string | null;
  item?: ActivationChecklistItem;
}

export interface Milestone {
  id: string;
  milestone_key: string;
  title: string;
  description: string | null;
  badge_image_url: string | null;
  requirements: Record<string, unknown> | null;
  category: string | null;
  display_order: number;
  enabled: boolean;
  is_system: boolean;
}

export interface UserMilestone {
  customer_profile_id: string;
  milestone_key: string;
  unlocked_at: string;
  milestone?: Milestone;
}

export interface CustomerGoalTemplate {
  id: string;
  goal_key: string;
  title: string;
  description: string | null;
  requirements: Record<string, unknown> | null;
  enabled: boolean;
  is_system: boolean;
}

export interface UserGoal {
  id: string;
  customer_profile_id: string;
  goal_key: string;
  progress: number;
  target: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  template?: CustomerGoalTemplate;
}

export interface ProductTour {
  id: string;
  tour_key: string;
  title: string;
  description: string | null;
  steps: TourStep[] | null;
  trigger_conditions: Record<string, unknown> | null;
  enabled: boolean;
}

export interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export interface UserTourProgress {
  customer_profile_id: string;
  tour_key: string;
  completed: boolean;
  completed_at: string | null;
  current_step: number;
  tour?: ProductTour;
}

export interface FeatureAnnouncement {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  cta_text: string | null;
  cta_url: string | null;
  target_segments: string[] | null;
  priority: number;
  start_date: string | null;
  end_date: string | null;
  enabled: boolean;
  created_at: string;
}

export interface UserAnnouncementInteraction {
  customer_profile_id: string;
  announcement_id: string;
  viewed: boolean;
  viewed_at: string | null;
  clicked: boolean;
  clicked_at: string | null;
  dismissed: boolean;
  dismissed_at: string | null;
  announcement?: FeatureAnnouncement;
}

export interface LifecycleNotification {
  id: string;
  customer_profile_id: string;
  notification_type: string;
  title: string;
  message: string | null;
  link: string | null;
  metadata: Record<string, unknown> | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface UserJourneyStage {
  customer_profile_id: string;
  stage_key: string;
  completed: boolean;
  completed_at: string | null;
}

export interface UsageStats {
  ai_scans: number;
  words_analyzed: number;
  words_humanized: number;
  reports_generated: number;
  plagiarism_checks: number;
  api_requests: number;
  extension_usage: number;
  plugin_activity: number;
  time_saved_minutes: number;
  documents_processed: number;
}

export interface NextBestAction {
  id: string;
  action_key: string;
  title: string;
  description: string;
  cta_url: string;
  priority: number;
  reason: string;
}

export interface FeatureAdoptionStats {
  feature_key: string;
  total_users: number;
  active_users: number;
  new_users_week: number;
  new_users_month: number;
}

export interface FunnelStage {
  stage_key: string;
  label: string;
  count: number;
  previous_count: number;
  conversion_rate: number;
}

export interface LifecycleAnalytics {
  lifecycle_distribution: { stage: LifecycleStage; count: number }[];
  activation_rate: number;
  dau: number;
  wau: number;
  mau: number;
  power_users: number;
  inactive_users: number;
  at_risk_users: number;
  average_activation_score: number;
  average_health_score: number;
}
