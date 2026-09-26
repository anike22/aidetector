export interface CustomerProfile {
  id: string;
  user_id: string | null;
  visitor_id: string | null;
  email: string | null;
  full_name: string | null;
  username: string | null;
  company: string | null;
  role: string | null;
  country: string | null;
  language: string | null;
  timezone: string | null;
  first_landing_page: string | null;
  first_referrer: string | null;
  first_channel: string | null;
  first_utm_source: string | null;
  first_utm_medium: string | null;
  first_utm_campaign: string | null;
  first_utm_content: string | null;
  first_utm_term: string | null;
  last_referrer: string | null;
  last_channel: string | null;
  registration_source: string | null;
  signup_at: string | null;
  last_login_at: string | null;
  engagement_score: number;
  engagement_level: string | null;
  lead_status: string | null;
  lifetime_value: number;
  total_spend: number;
  subscription_plan: string | null;
  account_status: string | null;
  subscription_status: string | null;
  session_count: number;
  page_views: number;
  cta_clicks: number;
  popup_conversions: number;
  api_requests: number;
  tools_used_count: number;
  gdpr_opt_out_tracking: boolean;
  gdpr_opt_out_marketing: boolean;
  is_anonymized: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerDevice {
  id: string;
  customer_profile_id: string;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  screen_resolution: string | null;
  language: string | null;
  first_seen_at: string;
  last_seen_at: string;
  session_count: number;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  is_dynamic: boolean;
  rules_json: SegmentRule;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface SegmentRule {
  operator?: 'AND' | 'OR';
  field?: string;
  operator_value?: string;
  value?: unknown;
  tool?: string;
  page?: string;
  days?: number;
  conditions?: SegmentRule[];
}

export interface CustomerTag {
  id: string;
  name: string;
  color: string | null;
  is_system: boolean;
  created_at: string;
}

export interface CustomerInterest {
  id: string;
  customer_profile_id: string;
  interest: string;
  score: number;
  inferred_at: string;
}

export interface LeadEvent {
  id: string;
  customer_profile_id: string | null;
  visitor_id: string | null;
  user_id: string | null;
  event_type: string;
  page: string | null;
  popup_id: string | null;
  cta_id: string | null;
  ab_variant: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PrivacyConsent {
  id: string;
  customer_profile_id: string;
  consent_type: string;
  granted: boolean;
  updated_at: string;
}

export interface DataDeletionRequest {
  id: string;
  customer_profile_id: string;
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  requested_at: string;
  processed_at: string | null;
  admin_notes: string | null;
}

export type CDPEventType =
  | 'page_view'
  | 'tool_used'
  | 'cta_click'
  | 'popup_impression'
  | 'popup_close'
  | 'popup_conversion'
  | 'signup'
  | 'login'
  | 'logout'
  | 'subscription_upgraded'
  | 'subscription_downgraded'
  | 'subscription_cancelled'
  | 'report_downloaded'
  | 'api_key_created'
  | 'extension_installed'
  | 'plugin_downloaded'
  | 'recommendation_displayed'
  | 'recommendation_clicked'
  | 'destination_opened'
  | 'recommendation_dismissed'
  | 'recommendation_accepted'
  | 'advanced_controls_opened'
  | 'controls_applied'
  | 'controls_reset'
  | 'controls_abandoned'
  | 'registration_started'
  | 'registration_completed'
  | 'registration_failed'
  | 'verification_email_sent'
  | 'verification_email_resent'
  | 'custom';

export interface CDPEvent {
  event_type: CDPEventType;
  page?: string;
  metadata?: Record<string, unknown>;
}
