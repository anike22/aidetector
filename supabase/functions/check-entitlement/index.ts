import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.1";
import { createServiceClient } from "../_shared/personalization.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-timezone',
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

    const { data, error } = await supabase.rpc('check_entitlement', {
      p_user_id: user.id,
      p_feature_slug: featureSlug,
      p_timezone: timezone,
    });

    if (error) {
      console.error('check_entitlement RPC error:', error);
      return fail('Entitlement check failed', 500);
    }

    const [row] = data || [];
    return ok({
      allowed: row?.allowed === true,
      reason: row?.reason ?? null,
      remaining: row?.remaining ?? null,
      limit: row?.limit_value ?? null,
      plan: row?.plan ?? 'free',
      feature_slug: featureSlug,
    });
  } catch (err) {
    console.error('check-entitlement error:', err);
    return fail(err instanceof Error ? err.message : 'Entitlement check failed', 500);
  }
});
