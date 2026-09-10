import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  createServiceClient,
  resolveAuthUserOrGuest,
  reserveEntitlement,
  finalizeReservation,
  getTimezone,
} from "../_shared/entitlements.ts";
import { analyzeAdvancedText } from "../_shared/detection/engine.ts";
import type { AdvancedTextAnalysisResult } from "../_shared/detection/types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-timezone, x-request-id, x-guest-id, x-visitor-id, x-idempotency-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DETECTOR_VERSION = '2.5.0';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const requestId = `det-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  let reservationId: string | null = null;
  const supabase = createServiceClient();
  const timezone = getTimezone(req);
  const idempotencyKey = req.headers.get('x-idempotency-key') || null;

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user, guestId, isApiKey } = await resolveAuthUserOrGuest(supabase, req);
    const body = await req.json().catch(() => ({}));
    const { text, sentence_level = true, paragraph_level = true } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Authoritative Server Entitlement & Atomic Reservation
    const entitlement = await reserveEntitlement(supabase, {
      userId: user?.id || null,
      guestId,
      featureSlug: 'ai_detector',
      creditsCost: 1,
      unitQuantity: Math.max(1, String(text || '').trim().split(/\s+/).filter(Boolean).length),
      timezone,
      idempotencyKey,
      metadata: { text_length: text.length, isApiKey },
    });

    if (!entitlement.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: entitlement.reason || 'Daily limit reached',
          reason: entitlement.reason,
          errorCode: entitlement.errorCode,
          upgrade_required: true,
          remaining: entitlement.dailyRemaining ?? entitlement.remainingCredits,
          daily_remaining: entitlement.dailyRemaining,
          daily_limit: entitlement.dailyLimit,
          credits_balance: entitlement.remainingCredits,
          plan: entitlement.plan,
          reset_at: entitlement.resetAt,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    reservationId = entitlement.reservationId;

    // 2. Perform Advanced Analysis
    const analysisResult = await analyzeAdvancedText(text, {
      detectorVersion: DETECTOR_VERSION,
      confidenceThreshold: 0.5,
      language: body.language || 'auto',
    });

    // 3. Finalize Reservation
    if (reservationId) {
      await finalizeReservation(supabase, {
        reservationId,
        outcome: 'success',
        metadata: {
          aiProbability: analysisResult.overall?.aiProbability,
          verdict: analysisResult.overall?.verdict,
        },
        timezone,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        request_id: requestId,
        data: analysisResult,
        usage: {
          plan: entitlement.plan,
          daily_remaining: entitlement.dailyRemaining !== null ? Math.max(0, entitlement.dailyRemaining - 1) : null,
          credits_remaining: entitlement.remainingCredits,
          reset_at: entitlement.resetAt,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error(`[detector][${requestId}] Error:`, err);
    if (reservationId) {
      await finalizeReservation(supabase, {
        reservationId,
        outcome: 'failed',
        errorReason: err.message,
        timezone,
      });
    }
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Detection failed', request_id: requestId }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
