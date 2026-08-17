import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.103.1';

export interface EntitlementResult {
  allowed: boolean;
  reason: string | null;
  remaining: number | null;
  limit: number | null;
  plan: string;
}

export function createServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function checkEntitlement(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  featureSlug: string,
  timezone = 'UTC'
): Promise<EntitlementResult> {
  const { data, error } = await supabase.rpc('check_entitlement', {
    p_user_id: userId,
    p_feature_slug: featureSlug,
    p_timezone: timezone,
  });

  if (error) {
    console.error('check_entitlement RPC error:', error);
    throw new Error('Entitlement check failed');
  }

  const row = (data || [])[0] || {};
  return {
    allowed: row.allowed === true,
    reason: row.reason ?? null,
    remaining: row.remaining ?? null,
    limit: row.limit_value ?? null,
    plan: row.plan ?? 'free',
  };
}

export async function recordUsage(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  featureSlug: string,
  count = 1,
  timezone = 'UTC'
) {
  const { data, error } = await supabase.rpc('increment_feature_usage', {
    p_user_id: userId,
    p_feature_slug: featureSlug,
    p_timezone: timezone,
    p_count: count,
  });

  if (error) {
    console.error('increment_feature_usage RPC error:', error);
    throw new Error('Usage recording failed');
  }

  const row = (data || [])[0] || {};
  return {
    remaining: row.remaining ?? null,
    limit: row.limit_value ?? null,
    used: row.used ?? null,
    reset_at: row.reset_at ?? null,
  };
}

export function getTimezone(req: Request): string {
  return req.headers.get('x-timezone') || 'UTC';
}

// --- Guest free-trial entitlement helpers ---

export interface GuestEntitlementResult {
  allowed: boolean;
  remaining: number | null;
  limit: number | null;
  plan: string | null;
  reason: string | null;
}

export interface GuestUsageResult {
  remaining: number | null;
  limit: number | null;
  used: number | null;
}

const GUEST_DAILY_LIMIT = 5;

function getGuestLimit(): number {
  return GUEST_DAILY_LIMIT;
}

async function hashGuestId(guestId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(guestId);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function getClientIp(req: Request): string {
  const xForwardedFor = req.headers.get('x-forwarded-for');
  const xRealIp = req.headers.get('x-real-ip');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  if (xRealIp) {
    return xRealIp.trim();
  }
  return 'unknown';
}

export async function checkGuestEntitlement(
  supabase: ReturnType<typeof createServiceClient>,
  guestId: string,
  timezone = 'UTC'
): Promise<GuestEntitlementResult> {
  const hash = await hashGuestId(guestId);
  const usageDate = new Date().toLocaleDateString('en-CA', { timeZone: timezone });

  const { data, error } = await supabase
    .from('guest_usage')
    .select('used_count')
    .eq('guest_hash', hash)
    .eq('usage_date', usageDate)
    .maybeSingle();

  if (error) {
    console.error('checkGuestEntitlement error:', error);
    throw new Error('Guest entitlement check failed');
  }

  const used = data?.used_count || 0;
  const remaining = Math.max(GUEST_DAILY_LIMIT - used, 0);

  if (remaining > 0) {
    return {
      allowed: true,
      remaining,
      limit: GUEST_DAILY_LIMIT,
      plan: 'guest',
      reason: null,
    };
  }

  return {
    allowed: false,
    remaining: 0,
    limit: GUEST_DAILY_LIMIT,
    plan: 'guest',
    reason: 'Free trial limit reached for today. Sign up or upgrade to continue.',
  };
}

export async function recordGuestUsage(
  supabase: ReturnType<typeof createServiceClient>,
  guestId: string,
  count = 1,
  timezone = 'UTC'
): Promise<GuestUsageResult> {
  const hash = await hashGuestId(guestId);
  const usageDate = new Date().toLocaleDateString('en-CA', { timeZone: timezone });

  const { data, error } = await supabase.rpc('increment_guest_usage', {
    p_guest_hash: hash,
    p_usage_date: usageDate,
    p_count: count,
  });

  if (error) {
    console.error('recordGuestUsage error:', error);
    throw new Error('Guest usage recording failed');
  }

  const row = (data || [])[0] || {};
  const used = row.used_count ?? 0;
  const remaining = Math.max(GUEST_DAILY_LIMIT - used, 0);

  return { remaining, limit: GUEST_DAILY_LIMIT, used };
}
