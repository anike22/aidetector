import { supabase } from '@/db/supabase';
import type {
  CustomerProfile,
  CustomerSegment,
  CustomerTag,
  CustomerInterest,
  LeadEvent,
  PrivacyConsent,
  CDPEvent,
  CustomerDevice,
  DataDeletionRequest,
} from '@/types/cdp';
import { getVisitorId } from './visitorId';

export interface DeviceInfo {
  deviceType: string;
  browser: string;
  os: string;
  screenResolution: string;
  language: string;
}

export function detectDevice(): DeviceInfo {
  const ua = navigator.userAgent;
  let deviceType = 'desktop';
  if (/Mobi|Android/i.test(ua)) deviceType = 'mobile';
  else if (/iPad|Tablet|Kindle/i.test(ua)) deviceType = 'tablet';

  let browser = 'Unknown';
  if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua) && /Apple Computer/.test(ua)) browser = 'Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Edge\//i.test(ua) || /Edg\//i.test(ua)) browser = 'Edge';

  let os = 'Unknown';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X|macOS/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iOS|iPhone|iPad/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return {
    deviceType,
    browser,
    os,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language || 'en',
  };
}

async function resolveProfileId(): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  const visitorId = getVisitorId();

  if (userId) {
    const { data } = await supabase
      .from('customer_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  if (visitorId) {
    const { data } = await supabase
      .from('customer_profiles')
      .select('id')
      .eq('visitor_id', visitorId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  return null;
}

export async function syncDeviceInfo(): Promise<void> {
  const profileId = await resolveProfileId();
  if (!profileId) return;
  const device = detectDevice();
  await supabase.rpc('upsert_customer_device', {
    p_profile_id: profileId,
    p_device_type: device.deviceType,
    p_browser: device.browser,
    p_os: device.os,
    p_screen_resolution: device.screenResolution,
    p_language: device.language,
  });
}

export async function getCurrentCustomerProfile(): Promise<CustomerProfile | null> {
  const profileId = await resolveProfileId();
  if (!profileId) return null;
  const { data } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('id', profileId)
    .maybeSingle();
  return data as CustomerProfile | null;
}

export async function getCustomerEvents(
  profileId: string,
  options: { limit?: number; eventType?: string } = {}
): Promise<LeadEvent[]> {
  let q = supabase
    .from('lead_events')
    .select('*')
    .eq('customer_profile_id', profileId)
    .order('created_at', { ascending: false });
  if (options.limit) q = q.limit(options.limit);
  if (options.eventType) q = q.eq('event_type', options.eventType);
  const { data } = await q;
  return Array.isArray(data) ? (data as LeadEvent[]) : [];
}

export async function getCustomerDevices(profileId: string): Promise<CustomerDevice[]> {
  const { data } = await supabase
    .from('customer_devices')
    .select('*')
    .eq('customer_profile_id', profileId)
    .order('last_seen_at', { ascending: false });
  return Array.isArray(data) ? (data as CustomerDevice[]) : [];
}

export async function getCustomerSegments(profileId: string): Promise<CustomerSegment[]> {
  const { data } = await supabase
    .from('customer_segment_memberships')
    .select('customer_segments(*)')
    .eq('customer_profile_id', profileId);
  if (!Array.isArray(data)) return [];
  return data
    .map((row: Record<string, unknown>) => row.customer_segments as CustomerSegment)
    .filter(Boolean);
}

export async function getCustomerTags(profileId: string): Promise<CustomerTag[]> {
  const { data } = await supabase
    .from('customer_tag_assignments')
    .select('customer_tags(*)')
    .eq('customer_profile_id', profileId);
  if (!Array.isArray(data)) return [];
  return data.map((row: Record<string, unknown>) => row.customer_tags as CustomerTag).filter(Boolean);
}

export async function getCustomerInterests(profileId: string): Promise<CustomerInterest[]> {
  const { data } = await supabase
    .from('customer_interests')
    .select('*')
    .eq('customer_profile_id', profileId)
    .order('score', { ascending: false });
  return Array.isArray(data) ? (data as CustomerInterest[]) : [];
}

export async function getPrivacyConsents(profileId: string): Promise<PrivacyConsent[]> {
  const { data } = await supabase
    .from('privacy_consents')
    .select('*')
    .eq('customer_profile_id', profileId);
  return Array.isArray(data) ? (data as PrivacyConsent[]) : [];
}

export async function setPrivacyConsent(
  profileId: string,
  consentType: string,
  granted: boolean
): Promise<void> {
  await supabase.from('privacy_consents').upsert(
    {
      customer_profile_id: profileId,
      consent_type: consentType,
      granted,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'customer_profile_id,consent_type' }
  );

  if (consentType === 'tracking') {
    await supabase
      .from('customer_profiles')
      .update({ gdpr_opt_out_tracking: !granted })
      .eq('id', profileId);
  }
  if (consentType === 'marketing') {
    await supabase
      .from('customer_profiles')
      .update({ gdpr_opt_out_marketing: !granted })
      .eq('id', profileId);
  }
}

export async function requestDataDeletion(profileId: string): Promise<void> {
  await supabase.from('data_deletion_requests').insert({
    customer_profile_id: profileId,
    status: 'pending',
    requested_at: new Date().toISOString(),
  });
}

export async function exportCustomerData(profileId: string): Promise<Record<string, unknown>> {
  const [profile, events, devices, tags, interests, consents] = await Promise.all([
    supabase.from('customer_profiles').select('*').eq('id', profileId).maybeSingle(),
    getCustomerEvents(profileId, { limit: 1000 }),
    getCustomerDevices(profileId),
    getCustomerTags(profileId),
    getCustomerInterests(profileId),
    getPrivacyConsents(profileId),
  ]);

  return {
    profile: profile.data,
    events,
    devices,
    tags,
    interests,
    consents,
    exported_at: new Date().toISOString(),
  };
}

export async function trackCDPEvent(event: CDPEvent): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  const visitorId = getVisitorId();

  await supabase.from('lead_events').insert({
    event_type: event.event_type,
    page: event.page ?? window.location.pathname,
    metadata: event.metadata ?? {},
    user_id: userId,
    visitor_id: visitorId,
  });
}

export async function refreshCustomerInsights(profileId?: string): Promise<void> {
  await supabase.functions.invoke('refresh-customer-insights', {
    body: { profileId },
  });
}

export async function listAllSegments(): Promise<CustomerSegment[]> {
  const { data } = await supabase.from('customer_segments').select('*').order('created_at', { ascending: true });
  return Array.isArray(data) ? (data as CustomerSegment[]) : [];
}

export async function listAllTags(): Promise<CustomerTag[]> {
  const { data } = await supabase.from('customer_tags').select('*').order('name', { ascending: true });
  return Array.isArray(data) ? (data as CustomerTag[]) : [];
}

export async function searchCustomerProfiles(options: {
  query?: string;
  segmentId?: string;
  tagId?: string;
  country?: string;
  plan?: string;
  leadStatus?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: CustomerProfile[]; count: number }> {
  let q = supabase.from('customer_profiles').select('*', { count: 'exact' }).eq('is_anonymized', false);

  if (options.query) {
    q = q.or(
      `email.ilike.%${options.query}%,full_name.ilike.%${options.query}%,username.ilike.%${options.query}%,company.ilike.%${options.query}%`
    );
  }
  if (options.country) q = q.eq('country', options.country);
  if (options.plan) q = q.eq('subscription_plan', options.plan);
  if (options.leadStatus) q = q.eq('lead_status', options.leadStatus);
  if (options.fromDate) q = q.gte('created_at', options.fromDate);
  if (options.toDate) q = q.lte('created_at', options.toDate);

  if (options.segmentId) {
    const { data: memberIds } = await supabase
      .from('customer_segment_memberships')
      .select('customer_profile_id')
      .eq('segment_id', options.segmentId);
    const ids = Array.isArray(memberIds) ? memberIds.map((m) => m.customer_profile_id) : [];
    if (ids.length) q = q.in('id', ids);
    else q = q.eq('id', '00000000-0000-0000-0000-000000000000');
  }

  if (options.tagId) {
    const { data: taggedIds } = await supabase
      .from('customer_tag_assignments')
      .select('customer_profile_id')
      .eq('tag_id', options.tagId);
    const ids = Array.isArray(taggedIds) ? taggedIds.map((m) => m.customer_profile_id) : [];
    if (ids.length) q = q.in('id', ids);
    else q = q.eq('id', '00000000-0000-0000-0000-000000000000');
  }

  q = q.order('updated_at', { ascending: false });
  if (options.limit) q = q.range(options.offset ?? 0, (options.offset ?? 0) + options.limit - 1);

  const { data, count, error } = await q;
  if (error) throw error;
  return { data: Array.isArray(data) ? (data as CustomerProfile[]) : [], count: count ?? 0 };
}

export async function createSegment(segment: Partial<CustomerSegment>): Promise<void> {
  await supabase.from('customer_segments').insert({
    name: segment.name,
    description: segment.description,
    rules_json: segment.rules_json,
    is_dynamic: true,
    is_system: false,
  });
}

export async function updateSegment(id: string, segment: Partial<CustomerSegment>): Promise<void> {
  await supabase
    .from('customer_segments')
    .update({
      name: segment.name,
      description: segment.description,
      rules_json: segment.rules_json,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
}

export async function deleteSegment(id: string): Promise<void> {
  await supabase.from('customer_segments').delete().eq('id', id);
}

export async function createTag(name: string, color?: string): Promise<void> {
  await supabase.from('customer_tags').insert({ name, color, is_system: false });
}

export async function updateTag(id: string, name: string, color?: string): Promise<void> {
  await supabase.from('customer_tags').update({ name, color }).eq('id', id);
}

export async function deleteTag(id: string): Promise<void> {
  await supabase.from('customer_tags').delete().eq('id', id);
}

export async function getSegmentMembers(segmentId: string): Promise<CustomerProfile[]> {
  const { data } = await supabase
    .from('customer_segment_memberships')
    .select('customer_profiles(*)')
    .eq('segment_id', segmentId);
  if (!Array.isArray(data)) return [];
  return data
    .map((row: Record<string, unknown>) => row.customer_profiles as CustomerProfile)
    .filter(Boolean);
}

export async function getTagMembers(tagId: string): Promise<CustomerProfile[]> {
  const { data } = await supabase
    .from('customer_tag_assignments')
    .select('customer_profiles(*)')
    .eq('tag_id', tagId);
  if (!Array.isArray(data)) return [];
  return data
    .map((row: Record<string, unknown>) => row.customer_profiles as CustomerProfile)
    .filter(Boolean);
}
