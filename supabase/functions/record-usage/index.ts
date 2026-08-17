import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createServiceClient } from "../_shared/personalization.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-timezone, x-idempotency-key',
};

function ok(data: unknown): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function fail(msg: string, code = 400): Response {
  return new Response(JSON.stringify({ success: false, error: msg }), {
    status: code,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const idempotencyCache = new Map<string, { response: unknown; expires: number }>();
const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000;

function getCachedResponse(key: string): unknown | null {
  const entry = idempotencyCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    idempotencyCache.delete(key);
    return null;
  }
  return entry.response;
}

function setCachedResponse(key: string, response: unknown): void {
  idempotencyCache.set(key, { response, expires: Date.now() + IDEMPOTENCY_TTL_MS });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return fail('Method not allowed', 405);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return fail('Authentication required', 401);

    const token = authHeader.replace('Bearer ', '').trim();
    const supabase = createServiceClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return fail('Invalid or expired session', 401);

    const { feature_slug: featureSlug } = await req.json();
    if (!featureSlug || typeof featureSlug !== 'string') {
      return fail('feature_slug is required');
    }

    const timezone = req.headers.get('x-timezone') || 'UTC';
    const idempotencyKey = req.headers.get('x-idempotency-key');

    if (idempotencyKey) {
      const cached = getCachedResponse(idempotencyKey);
      if (cached) return ok(cached);
    }

    const { data: checkData, error: checkError } = await supabase.rpc('check_entitlement', {
      p_user_id: user.id,
      p_feature_slug: featureSlug,
      p_timezone: timezone,
    });

    if (checkError) {
      console.error('check_entitlement RPC error in record-usage:', checkError);
      return fail('Entitlement check failed', 500);
    }

    const [entitlement] = checkData || [];
    if (!entitlement?.allowed) {
      return fail(entitlement?.reason || 'Usage not allowed', 403);
    }

    const { data, error } = await supabase.rpc('increment_feature_usage', {
      p_user_id: user.id,
      p_feature_slug: featureSlug,
      p_timezone: timezone,
    });

    if (error) {
      console.error('increment_feature_usage RPC error:', error);
      return fail('Usage recording failed', 500);
    }

    const [row] = data || [];
    const response = {
      remaining: row?.remaining ?? null,
      limit: row?.limit_value ?? null,
      used: row?.used ?? null,
      reset_at: row?.reset_at ?? null,
      feature_slug: featureSlug,
    };

    if (idempotencyKey) setCachedResponse(idempotencyKey, response);
    return ok(response);
  } catch (err) {
    console.error('record-usage error:', err);
    return fail(err instanceof Error ? err.message : 'Usage recording failed', 500);
  }
});
