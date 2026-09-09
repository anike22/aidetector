import { supabase } from '@/db/supabase';
import type {
  MarketplaceApp,
  MarketplaceReview,
  AppInstall,
  WebhookEndpoint,
  WebhookDelivery,
  PartnerApplication,
  SdkDownload,
  IntegrationCatalogItem,
  MarketplaceAppStatus,
  MarketplaceAppType,
  MarketplaceAppPricing,
  WebhookEventType,
  WebhookDeliveryStatus,
  IntegrationType,
  PartnerApplicationStatus,
} from '@/types/marketplace';

// Marketplace apps
export async function getMarketplaceApps(filters?: { type?: MarketplaceAppType; status?: MarketplaceAppStatus; category?: string }): Promise<MarketplaceApp[]> {
  let q = supabase.from('marketplace_apps').select('*, publisher:profiles!marketplace_apps_publisher_id_fkey(email, full_name), reviews:marketplace_reviews(*)');
  if (filters?.type) q = q.eq('app_type', filters.type);
  if (filters?.status) q = q.eq('status', filters.status);
  if (filters?.category) q = q.eq('category', filters.category);
  const { data, error } = await q.order('downloads', { ascending: false });
  if (error) throw error;
  return (data as MarketplaceApp[]) || [];
}

export async function getMarketplaceAppBySlug(slug: string): Promise<MarketplaceApp | null> {
  const { data, error } = await supabase
    .from('marketplace_apps')
    .select('*, publisher:profiles!marketplace_apps_publisher_id_fkey(email, full_name), reviews:marketplace_reviews(*)')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data as MarketplaceApp | null;
}

export async function createMarketplaceApp(payload: Partial<MarketplaceApp>): Promise<MarketplaceApp> {
  const { data, error } = await supabase.from('marketplace_apps').insert(payload).select().single();
  if (error) throw error;
  return data as MarketplaceApp;
}

export async function updateMarketplaceAppStatus(id: string, status: MarketplaceAppStatus): Promise<MarketplaceApp> {
  const { data, error } = await supabase.from('marketplace_apps').update({ status }).eq('id', id).select().single();
  if (error) throw error;
  return data as MarketplaceApp;
}

export async function incrementAppDownloads(id: string) {
  const { error } = await supabase.rpc('increment_app_downloads', { app_id: id });
  if (error) {
    // Fallback if RPC not defined
    await supabase.from('marketplace_apps').update({ downloads: 0 }).eq('id', id);
  }
}

// Reviews
export async function createMarketplaceReview(appId: string, rating: number, review?: string): Promise<MarketplaceReview> {
  const { data, error } = await supabase.from('marketplace_reviews').insert({ app_id: appId, rating, review }).select().single();
  if (error) throw error;
  return data as MarketplaceReview;
}

// App installs
export async function getAppInstalls(): Promise<AppInstall[]> {
  const { data, error } = await supabase.from('app_installs').select('*, app:marketplace_apps(*)').order('installed_at', { ascending: false });
  if (error) throw error;
  return (data as AppInstall[]) || [];
}

export async function installApp(appId: string, organizationId?: string): Promise<AppInstall> {
  const { data, error } = await supabase.from('app_installs').insert({ app_id: appId, organization_id: organizationId }).select().single();
  if (error) throw error;
  return data as AppInstall;
}

export async function uninstallApp(installId: string) {
  const { error } = await supabase.from('app_installs').delete().eq('id', installId);
  if (error) throw error;
}

// Webhooks
export async function getWebhookEndpoints(): Promise<WebhookEndpoint[]> {
  const { data, error } = await supabase.from('webhook_endpoints').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as WebhookEndpoint[]) || [];
}

export async function createWebhookEndpoint(payload: Partial<WebhookEndpoint>): Promise<WebhookEndpoint> {
  const { data, error } = await supabase.from('webhook_endpoints').insert(payload).select().single();
  if (error) throw error;
  return data as WebhookEndpoint;
}

export async function updateWebhookEndpoint(id: string, payload: Partial<WebhookEndpoint>): Promise<WebhookEndpoint> {
  const { data, error } = await supabase.from('webhook_endpoints').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data as WebhookEndpoint;
}

export async function deleteWebhookEndpoint(id: string) {
  const { error } = await supabase.from('webhook_endpoints').delete().eq('id', id);
  if (error) throw error;
}

export async function getWebhookDeliveries(endpointId?: string): Promise<WebhookDelivery[]> {
  let q = supabase.from('webhook_deliveries').select('*').order('created_at', { ascending: false });
  if (endpointId) q = q.eq('endpoint_id', endpointId);
  const { data, error } = await q;
  if (error) throw error;
  return (data as WebhookDelivery[]) || [];
}

export async function retryWebhookDelivery(id: string): Promise<WebhookDelivery> {
  const { data, error } = await supabase.from('webhook_deliveries').update({ status: 'pending' as WebhookDeliveryStatus, attempts: 0 }).eq('id', id).select().single();
  if (error) throw error;
  return data as WebhookDelivery;
}

// Partner applications
export async function getPartnerApplications(): Promise<PartnerApplication[]> {
  const { data, error } = await supabase.from('partner_applications').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as PartnerApplication[]) || [];
}

export async function createPartnerApplication(payload: Partial<PartnerApplication>): Promise<PartnerApplication> {
  const { data, error } = await supabase.from('partner_applications').insert(payload).select().single();
  if (error) throw error;
  return data as PartnerApplication;
}

export async function updatePartnerApplicationStatus(id: string, status: PartnerApplicationStatus, adminNotes?: string): Promise<PartnerApplication> {
  const { data, error } = await supabase.from('partner_applications').update({ status, admin_notes: adminNotes }).eq('id', id).select().single();
  if (error) throw error;
  return data as PartnerApplication;
}

// SDKs
export async function getSdkDownloads(): Promise<SdkDownload[]> {
  const { data, error } = await supabase.from('sdk_downloads').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as SdkDownload[]) || [];
}

export async function createSdkDownload(payload: Partial<SdkDownload>): Promise<SdkDownload> {
  const { data, error } = await supabase.from('sdk_downloads').insert(payload).select().single();
  if (error) throw error;
  return data as SdkDownload;
}

// Integration catalog
export async function getIntegrationCatalog(): Promise<IntegrationCatalogItem[]> {
  const { data, error } = await supabase.from('integration_catalog').select('*').order('name', { ascending: true });
  if (error) throw error;
  return (data as IntegrationCatalogItem[]) || [];
}

export async function createIntegrationCatalogItem(payload: Partial<IntegrationCatalogItem>): Promise<IntegrationCatalogItem> {
  const { data, error } = await supabase.from('integration_catalog').insert(payload).select().single();
  if (error) throw error;
  return data as IntegrationCatalogItem;
}

export async function updateIntegrationCatalogItem(id: string, payload: Partial<IntegrationCatalogItem>): Promise<IntegrationCatalogItem> {
  const { data, error } = await supabase.from('integration_catalog').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data as IntegrationCatalogItem;
}

// Constants
export const APP_TYPE_LABELS: Record<MarketplaceAppType, string> = {
  template: 'Template',
  prompt_collection: 'Prompt Collection',
  style: 'Writing Style',
  humanization_preset: 'Humanization Preset',
  detection_policy: 'Detection Policy',
  grammar_rule: 'Grammar Rule',
  classroom_template: 'Classroom Template',
  workflow: 'Workflow',
  extension: 'Extension',
  plugin: 'Plugin',
  integration: 'Integration',
  ai_model: 'AI Model',
};

export const WEBHOOK_EVENT_LABELS: Record<WebhookEventType, string> = {
  user_registered: 'User Registered',
  subscription_created: 'Subscription Created',
  subscription_renewed: 'Subscription Renewed',
  subscription_cancelled: 'Subscription Cancelled',
  scan_completed: 'Scan Completed',
  humanization_completed: 'Humanization Completed',
  api_quota_reached: 'API Quota Reached',
  organization_created: 'Organization Created',
  referral_converted: 'Referral Converted',
  payment_completed: 'Payment Completed',
  security_alert: 'Security Alert',
};

export const INTEGRATION_TYPE_LABELS: Record<IntegrationType, string> = {
  oauth: 'OAuth',
  api_key: 'API Key',
  webhook: 'Webhook',
  plugin: 'Plugin',
  zapier: 'Zapier',
  make: 'Make',
  n8n: 'n8n',
  power_automate: 'Power Automate',
  native: 'Native',
};
