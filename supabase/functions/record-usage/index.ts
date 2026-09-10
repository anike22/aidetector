import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { withBillingGuard } from "../_shared/billing.ts";
import { getEntitlementSummary } from "../_shared/entitlements.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-timezone, x-idempotency-key, x-guest-id, x-visitor-id',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return withBillingGuard(req, {
    featureSlug: body => String(body.feature_slug || ''),
    corsHeaders,
  }, async ({ supabase, userId, guestId, body }) => {
    const summary = await getEntitlementSummary(
      supabase,
      userId,
      guestId,
      req.headers.get('x-timezone') || 'UTC',
    );
    const remaining = summary.isPaidActive ? summary.creditsBalance : summary.trialChecksRemaining;
    const limit = summary.isPaidActive ? summary.monthlyCreditAllocation : summary.trialChecksTotal;
    return new Response(JSON.stringify({
      success: true,
      data: {
        remaining,
        limit,
        used: Math.max(0, limit - remaining),
        reset_at: summary.creditsRefillDate,
        feature_slug: body.feature_slug,
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  });
});
