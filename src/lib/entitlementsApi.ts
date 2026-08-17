import { supabase } from '@/db/supabase';

export interface EntitlementCheckResult {
  allowed: boolean;
  reason: string | null;
  remaining: number | null;
  limit: number | null;
  plan: string;
  feature_slug: string;
}

export interface UsageRecordResult {
  remaining: number | null;
  limit: number | null;
  used: number | null;
  reset_at: string | null;
  feature_slug: string;
}

function getTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'x-timezone': getTimezone(),
  };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return headers;
}

export async function checkEntitlement(featureSlug: string): Promise<EntitlementCheckResult> {
  const res = await supabase.functions.invoke('check-entitlement', {
    body: { feature_slug: featureSlug },
    headers: await authHeaders(),
  });
  if (res.error) throw new Error(res.error.message || 'Entitlement check failed');
  return res.data?.data as EntitlementCheckResult;
}

export async function recordUsage(featureSlug: string, idempotencyKey?: string): Promise<UsageRecordResult> {
  const headers = await authHeaders();
  if (idempotencyKey) {
    headers['x-idempotency-key'] = idempotencyKey;
  }
  const res = await supabase.functions.invoke('record-usage', {
    body: { feature_slug: featureSlug },
    headers,
  });
  if (res.error) throw new Error(res.error.message || 'Usage recording failed');
  return res.data?.data as UsageRecordResult;
}
