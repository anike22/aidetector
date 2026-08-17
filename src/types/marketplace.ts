export type MarketplaceAppType =
  | 'template'
  | 'prompt_collection'
  | 'style'
  | 'humanization_preset'
  | 'detection_policy'
  | 'grammar_rule'
  | 'classroom_template'
  | 'workflow'
  | 'extension'
  | 'plugin'
  | 'integration'
  | 'ai_model';

export type MarketplaceAppPricing = 'free' | 'paid' | 'subscription' | 'freemium';
export type MarketplaceAppStatus = 'pending_review' | 'approved' | 'rejected' | 'suspended';
export type WebhookEventType =
  | 'user_registered'
  | 'subscription_created'
  | 'subscription_renewed'
  | 'subscription_cancelled'
  | 'scan_completed'
  | 'humanization_completed'
  | 'api_quota_reached'
  | 'organization_created'
  | 'referral_converted'
  | 'payment_completed'
  | 'security_alert';
export type WebhookDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying';
export type IntegrationType = 'oauth' | 'api_key' | 'webhook' | 'plugin' | 'zapier' | 'make' | 'n8n' | 'power_automate' | 'native';
export type PartnerApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface MarketplaceApp {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  app_type: MarketplaceAppType;
  pricing: MarketplaceAppPricing;
  price?: number | null;
  status: MarketplaceAppStatus;
  publisher_id: string;
  category?: string | null;
  tags?: string[] | null;
  icon_url?: string | null;
  download_url?: string | null;
  version?: string | null;
  permissions?: Record<string, unknown> | null;
  rating?: number | null;
  downloads?: number | null;
  revenue_share_percent?: number | null;
  created_at: string;
  updated_at: string;
  publisher?: { email?: string; full_name?: string };
  reviews?: MarketplaceReview[];
}

export interface MarketplaceReview {
  id: string;
  app_id: string;
  user_id: string;
  rating: number;
  review?: string | null;
  created_at: string;
  user?: { email?: string; full_name?: string };
}

export interface AppInstall {
  id: string;
  app_id: string;
  user_id: string;
  organization_id?: string | null;
  installed_at: string;
  settings?: Record<string, unknown> | null;
  app?: MarketplaceApp;
}

export interface WebhookEndpoint {
  id: string;
  user_id: string;
  organization_id?: string | null;
  url: string;
  secret?: string | null;
  events: WebhookEventType[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  endpoint_id: string;
  event_type: WebhookEventType;
  payload?: Record<string, unknown> | null;
  status: WebhookDeliveryStatus;
  http_status?: number | null;
  response_body?: string | null;
  attempts: number;
  delivered_at?: string | null;
  created_at: string;
}

export interface PartnerApplication {
  id: string;
  user_id: string;
  organization_name: string;
  website?: string | null;
  application_type: string;
  description?: string | null;
  status: PartnerApplicationStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SdkDownload {
  id: string;
  language: string;
  version: string;
  download_url: string;
  docs_url?: string | null;
  release_notes?: string | null;
  is_latest?: boolean | null;
  download_count?: number | null;
  created_at: string;
}

export interface IntegrationCatalogItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  integration_type: IntegrationType;
  category?: string | null;
  icon_url?: string | null;
  docs_url?: string | null;
  install_url?: string | null;
  is_featured?: boolean | null;
  is_active?: boolean | null;
  created_at: string;
}
