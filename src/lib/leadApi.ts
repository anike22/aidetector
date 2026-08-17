/**
 * Thin API layer for all lead-capture DB operations.
 * Uses the public anon key — RLS policies allow inserts from all roles.
 */
import { supabase } from '@/db/supabase';
import { getVisitorId } from './visitorId';

export type LeadEventType =
  | 'popup_impression'
  | 'popup_close'
  | 'popup_conversion'
  | 'cta_click'
  | 'cta_impression'
  | 'tool_completion'
  | 'tool_used'
  | 'exit_intent'
  | 'scroll_trigger'
  | 'time_trigger'
  | 'signup'
  | 'page_view';

export interface LeadEventPayload {
  event_type: LeadEventType;
  page?: string;
  popup_id?: string;
  cta_id?: string;
  ab_variant?: string;
  metadata?: Record<string, unknown>;
  user_id?: string;
}

export async function trackEvent(payload: LeadEventPayload): Promise<void> {
  const visitor_id = getVisitorId();
  await supabase.from('lead_events').insert({
    visitor_id,
    ...payload,
    metadata: payload.metadata ?? {},
  });
}

export async function upsertVisitor(data: {
  landing_page?: string;
  referrer_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  country?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  language?: string;
  visited_pages?: string[];
  tools_used?: string[];
}): Promise<void> {
  const visitor_id = getVisitorId();
  const { error } = await supabase.from('anonymous_visitors').upsert(
    {
      visitor_id,
      last_seen_at: new Date().toISOString(),
      ...data,
    },
    { onConflict: 'visitor_id', ignoreDuplicates: false }
  );
  if (error) console.error('[leadApi] upsertVisitor', error);
}

export async function mergeVisitorToUser(userId: string): Promise<void> {
  const visitor_id = getVisitorId();
  await supabase
    .from('anonymous_visitors')
    .update({ merged_user_id: userId, merged_at: new Date().toISOString() })
    .eq('visitor_id', visitor_id);
  await supabase
    .from('lead_events')
    .update({ user_id: userId })
    .eq('visitor_id', visitor_id)
    .is('user_id', null);
  await supabase.rpc('merge_visitor_to_customer_profile', { p_user_id: userId });
}

export async function incrementABVariant(
  variantId: string,
  field: 'impressions' | 'clicks' | 'conversions'
): Promise<void> {
  const { data } = await supabase
    .from('ab_test_variants')
    .select(field)
    .eq('id', variantId)
    .maybeSingle();
  if (!data) return;
  const current = (data as Record<string, unknown>)[field];
  await supabase
    .from('ab_test_variants')
    .update({ [field]: (typeof current === 'number' ? current : 0) + 1 })
    .eq('id', variantId);
}
