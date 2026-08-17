export type OrganizationType =
  | 'individual'
  | 'student'
  | 'teacher'
  | 'university'
  | 'business'
  | 'enterprise'
  | 'agency'
  | 'api_developer'
  | 'content_creator'
  | 'seo_professional'
  | 'writer'
  | 'journalist';

export type RecommendationType = 'product' | 'upgrade' | 'content' | 'action';

export type RecommendationSubtype =
  | 'humanizer'
  | 'grammar'
  | 'plagiarism'
  | 'pro_plan'
  | 'business_plan'
  | 'enterprise_contact'
  | 'api'
  | 'sdk'
  | 'chrome_extension'
  | 'wordpress_plugin'
  | 'tutorial'
  | 'saved_report'
  | 'next_action';

export type PredictionType =
  | 'upgrade'
  | 'churn'
  | 'renewal'
  | 'clv'
  | 'feature_adoption'
  | 'support_risk'
  | 'api_growth'
  | 'high_value';

export interface UserIntelligenceProfile {
  id: string;
  user_id: string;
  customer_profile_id: string | null;
  subscription_plan: string | null;
  lifecycle_stage: string | null;
  country: string | null;
  language: string | null;
  device: string | null;
  browser: string | null;
  referral_source: string | null;
  utm_source: string | null;
  organization_type: OrganizationType | null;
  ai_confidence_score: number;
  static_attributes: Record<string, unknown>;
  behavioral_signals: Record<string, unknown>;
  predictions: Record<string, unknown>;
  last_updated: string;
  created_at: string;
}

export interface BehaviorEventInput {
  event_type: string;
  event_category: string;
  event_data?: Record<string, unknown>;
  session_id?: string;
  device_info?: Record<string, unknown>;
}

export interface PersonalizedRecommendation {
  id: string;
  user_id: string;
  type: RecommendationType;
  subtype: RecommendationSubtype;
  title: string;
  description: string | null;
  reason: string | null;
  context_path: string | null;
  score: number;
  dismissed: boolean;
  accepted: boolean;
  shown: boolean;
  shown_at: string | null;
  clicked_at: string | null;
  accepted_at: string | null;
  dismissed_at: string | null;
  expires_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface UserPrediction {
  id: string;
  user_id: string;
  prediction_type: PredictionType;
  score: number;
  value: number | null;
  confidence: number;
  features: Record<string, unknown>;
  triggered: boolean;
  triggered_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonalizationSettings {
  id: string;
  user_id: string;
  dashboard_layout: Record<string, unknown>;
  hidden_widgets: string[];
  homepage_variant: string | null;
  opt_out: boolean;
  reduced_motion: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonalizationConfig {
  id: number;
  model_settings: {
    recommendation_models?: Record<string, boolean>;
    prediction_models?: Record<string, boolean>;
    learning_enabled?: boolean;
  };
  thresholds: {
    high_churn_risk?: number;
    high_upgrade_probability?: number;
    low_renewal_probability?: number;
    high_support_risk?: number;
    api_quota_threshold?: number;
    detector_quota_threshold?: number;
    recommendation_ttl_hours?: number;
    max_recommendations_per_user?: number;
  };
  updated_by: string | null;
  updated_at: string;
}

export interface RecommendationAnalyticsRow {
  date: string;
  impressions: number;
  clicks: number;
  accepts: number;
  dismissals: number;
  conversions: number;
  revenue_influenced: number;
  feature_adoptions: number;
  retention_improvements: number;
}
