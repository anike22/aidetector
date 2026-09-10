import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  createServiceClient,
  resolveAuthUserOrGuest,
  getEntitlementSummary,
  reserveEntitlement,
  getTimezone,
} from "../_shared/entitlements.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-timezone, x-guest-id, x-visitor-id',
};

function ok(data: unknown): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function fail(msg: string, code = 400, details?: unknown): Response {
  return new Response(JSON.stringify({ success: false, error: msg, details }), {
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
    const supabase = createServiceClient();
    const timezone = getTimezone(req);
    const { user, guestId } = await resolveAuthUserOrGuest(supabase, req);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { feature_slug: featureSlug, mode, guest_id_link: linkGuestId } = body;

    // Handle guest linking on signup/login if requested
    if (user?.id && linkGuestId) {
      await supabase.rpc('link_guest_to_registered_user', {
        p_guest_id: linkGuestId,
        p_user_id: user.id,
      });
    }

    // Mode: 'summary' returns complete live usage & trial status
    if (mode === 'summary' || !featureSlug) {
      const summary = await getEntitlementSummary(
        supabase,
        user?.id || null,
        guestId,
        timezone
      );
      return ok({
        ...summary,
        guestId: user ? null : guestId,
        isAuthenticated: !!user,
      });
    }

    const { data, error } = await supabase.rpc('check_entitlement', {
      p_user_id: user?.id || null, p_feature_slug: featureSlug, p_timezone: timezone,
    });
    if (error) throw error;
    return ok(data?.[0] || { allowed: false, reason: 'Authorization unavailable' });

  } catch (err) {
    console.error('check-entitlement error:', err);
    return fail(err instanceof Error ? err.message : 'Entitlement check failed', 500);
  }
});
