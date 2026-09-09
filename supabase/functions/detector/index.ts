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

interface SingleRequest {
  text: string;
  language?: string;
  content_type?: string;
  confidence_threshold?: number;
  sentence_level?: boolean;
  paragraph_level?: boolean;
  detector_version?: string;
  async?: boolean;
  webhook_url?: string;
}

interface BatchRequest {
  batch: SingleRequest[];
}

interface ErrorPayload {
  success: false;
  stage: string;
  message: string;
  request_id: string;
  detector_version: string;
  details?: unknown;
}

function generateRequestId(): string {
  return `det-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function errorResponse(
  stage: string,
  message: string,
  status: number,
  requestId: string,
  details?: unknown,
): Response {
  const payload: ErrorPayload = {
    success: false,
    stage,
    message,
    request_id: requestId,
    detector_version: DETECTOR_VERSION,
  };
  if (details !== undefined) payload.details = details;
  console.error(`[detector][${stage}][${requestId}] ${message}`, details ?? '');
  return jsonResponse(payload, status);
}

function sanitizeResult(result: AdvancedTextAnalysisResult, sentenceLevel: boolean, paragraphLevel: boolean) {
  const r = { ...result };
  if (!sentenceLevel) delete (r as any).sentences;
  if (!paragraphLevel) delete (r as any).paragraphs;
  return r;
}

function validateEnvironment(): { supabaseUrl: string; supabaseServiceKey: string } | Response {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !supabaseServiceKey) {
    const requestId = generateRequestId();
    console.error(`[detector][config][${requestId}] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY`);
    return errorResponse('configuration', 'Server configuration incomplete. Missing Supabase credentials.', 500, requestId);
  }
  return { supabaseUrl, supabaseServiceKey };
}

function validateResult(result: AdvancedTextAnalysisResult, requestId: string): Response | null {
  const required = {
    verdict: result.overall?.verdict,
    ai_probability: result.overall?.aiProbability,
    human_probability: result.overall?.humanProbability,
    confidence: result.overall?.confidence,
    detected_language: result.language?.primary?.code,
    detector_version: result.metadata?.detectorVersion,
  };
  const missing = Object.entries(required).filter(([, v]) => v === undefined || v === null).map(([k]) => k);
  if (missing.length > 0) {
    return errorResponse('response_validation', `Incomplete result: missing ${missing.join(', ')}`, 500, requestId);
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const requestId = generateRequestId();
  const startedAt = Date.now();

  try {
    if (req.method !== 'POST') {
      return errorResponse('http', 'Method not allowed. Only POST and OPTIONS are supported.', 405, requestId);
    }

    // Configuration
    const env = validateEnvironment();
    if (env instanceof Response) return env;
    const { supabaseUrl, supabaseServiceKey } = env;

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Authentication
    const authHeader = req.headers.get('Authorization');
    const internalTestKey = req.headers.get('x-detector-internal-test');
    const expectedTestKey = Deno.env.get('DETECTOR_INTERNAL_TEST_KEY');
    const isInternalTest = !!(expectedTestKey && internalTestKey && internalTestKey === expectedTestKey);

    let user: { id: string } | null = null;
    let isApiKey = false;
    let isServiceRole = false;
    let isGuest = false;
    let guestId = '';

    try {
      if (!authHeader) {
        // No authorization header: treat as anonymous guest.
        isGuest = true;
        guestId = getClientIp(req);
      } else {
        const token = authHeader.replace('Bearer ', '').trim();
        const payload = decodeTokenPayload(token);
        const role = typeof payload?.role === 'string' ? payload.role : '';

        if (token === '' || role === 'anon') {
          isGuest = true;
          guestId = getClientIp(req);
        } else if (isInternalTest && role === 'service_role') {
          // Service-role JWTs do not carry a sub claim. Allow internal end-to-end
          // validation calls when the secret header matches the configured key.
          isServiceRole = true;
          user = { id: 'internal-test-user' };
        } else if (token.startsWith('aid_')) {
          const { data: keyData, error: keyError } = await supabaseClient.from('api_keys').select('user_id').eq('api_key', token).maybeSingle();
          if (keyError || !keyData) {
            return errorResponse('authentication', 'Invalid API key.', 401, requestId, keyError?.message);
          }
          user = { id: keyData.user_id };
          isApiKey = true;
          supabaseClient.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('api_key', token).then();
        } else if (role === 'authenticated') {
          const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser(token);
          if (authError || !authUser) {
            return errorResponse('authentication', 'Invalid or expired session.', 401, requestId, authError?.message);
          }
          user = authUser;
        } else {
          return errorResponse('authentication', 'Invalid authorization token.', 401, requestId);
        }
      }
    } catch (authErr: any) {
      return errorResponse('authentication', authErr.message || 'Authentication failed.', 401, requestId);
    }

    // Body parsing
    let body: unknown;
    try {
      body = await req.json();
    } catch (parseErr: any) {
      return errorResponse('validation', `Invalid JSON body: ${parseErr.message}`, 400, requestId);
    }
    if (!body || typeof body !== 'object') {
      return errorResponse('validation', 'JSON body required.', 400, requestId);
    }

    // Entitlement
    const timezone = getTimezone(req);
    let entitlement;
    try {
      if (isServiceRole) {
        entitlement = { allowed: true, remaining: Infinity, limit: Infinity, plan: 'internal_test', reason: undefined };
      } else if (isGuest) {
        entitlement = await checkGuestEntitlement(supabaseClient, guestId, timezone);
      } else {
        entitlement = await checkEntitlement(supabaseClient, user.id, 'ai_detector', timezone);
      }
    } catch (entErr: any) {
      return errorResponse('subscription_validation', entErr.message || 'Entitlement check failed.', 500, requestId);
    }
    if (!entitlement.allowed) {
      return jsonResponse({
        success: false,
        stage: 'subscription_validation',
        message: entitlement.reason || 'Access denied',
        upgrade_required: true,
        remaining: entitlement.remaining,
        limit: entitlement.limit,
        plan: entitlement.plan,
        request_id: requestId,
        detector_version: DETECTOR_VERSION,
      }, 403);
    }

    // Batch request
    if ('batch' in body && Array.isArray(body.batch)) {
      const batch = (body as BatchRequest).batch;
      if (batch.length === 0) return errorResponse('validation', 'Batch array cannot be empty.', 400, requestId);
      if (batch.length > 25) return errorResponse('validation', 'Batch limit is 25 items.', 400, requestId);

      const results = [];
      for (const item of batch) {
        if (!item.text || typeof item.text !== 'string') {
          results.push({ error: 'text is required', status: 'error' });
          continue;
        }
        try {
          const result = await analyzeAdvancedText(item.text, {
            contentType: (item.content_type as any) || 'auto',
            languageHint: item.language,
          });
          const validationError = validateResult(result, requestId);
          if (validationError) {
            results.push({ error: 'Incomplete analysis result', status: 'error' });
          } else {
            results.push({
              status: 'ok',
              request_id: result.metadata.requestId,
              result: sanitizeResult(result, item.sentence_level !== false, item.paragraph_level !== false),
            });
          }
        } catch (e: any) {
          console.error(`[detector][analysis][${requestId}] Batch item failed:`, e);
          results.push({ error: e.message || 'Analysis failed', status: 'error' });
        }
      }

      if (!isServiceRole) {
        try {
          if (isGuest) {
            await recordGuestUsage(supabaseClient, guestId, batch.length, timezone);
          } else {
            await recordFeatureUsage(supabaseClient, user.id, 'ai_detector', batch.length, timezone);
          }
        } catch (usageErr: any) {
          console.error(`[detector][usage][${requestId}] Failed to record usage:`, usageErr);
        }
      }

      console.log(`[detector][success][${requestId}] Batch completed: ${results.length} items in ${Date.now() - startedAt}ms`);
      return jsonResponse({
        success: true,
        api_version: 'v2',
        endpoint: 'batch',
        request_id: requestId,
        detector_version: DETECTOR_VERSION,
        count: results.length,
        results,
      });
    }

    // Single / async request
    const single = body as SingleRequest;
    if (!single.text || typeof single.text !== 'string') {
      return errorResponse('validation', 'text is required.', 400, requestId);
    }
    if (single.text.length > 100_000) {
      return errorResponse('validation', 'Text exceeds maximum length of 100,000 characters.', 413, requestId);
    }

    // Async long-document placeholder
    if (single.async) {
      const jobId = crypto.randomUUID();
      console.log(`[detector][async][${requestId}] Queued job ${jobId}`);
      return jsonResponse({
        success: true,
        api_version: 'v2',
        endpoint: 'async',
        request_id: requestId,
        detector_version: DETECTOR_VERSION,
        job_id: jobId,
        status: 'queued',
        message: 'Long-document async analysis queued. Poll GET /detector/jobs/:job_id or configure webhooks.',
        webhook_url: single.webhook_url || null,
      }, 202);
    }

    // Analysis
    let result: AdvancedTextAnalysisResult;
    try {
      result = await analyzeAdvancedText(single.text, {
        contentType: (single.content_type as any) || 'auto',
        languageHint: single.language,
      });
    } catch (analysisErr: any) {
      return errorResponse('analysis', analysisErr.message || 'Detection pipeline failed.', 500, requestId);
    }

    const validationError = validateResult(result, requestId);
    if (validationError) return validationError;

    // Record usage (skip internal test calls)
    let updatedRemaining = entitlement.remaining ?? null;
    let updatedLimit = entitlement.limit ?? null;
    if (!isServiceRole) {
      try {
        if (isGuest) {
          const rec = await recordGuestUsage(supabaseClient, guestId, 1, timezone);
          if (rec.remaining !== null && rec.remaining !== undefined) updatedRemaining = rec.remaining;
          if (rec.limit !== null && rec.limit !== undefined) updatedLimit = rec.limit;
        } else {
          const rec = await recordFeatureUsage(supabaseClient, user.id, 'ai_detector', 1, timezone);
          if (rec.remaining !== null && rec.remaining !== undefined) updatedRemaining = rec.remaining;
          if (rec.limit !== null && rec.limit !== undefined) updatedLimit = rec.limit;
        }
      } catch (usageErr: any) {
        console.error(`[detector][usage][${requestId}] Failed to record usage:`, usageErr);
      }
    }

    const confidenceThreshold = typeof single.confidence_threshold === 'number' ? single.confidence_threshold : 0;
    const filteredHighlights = result.highlights.filter((h) => h.confidence >= confidenceThreshold);
    const finalResult = {
      ...sanitizeResult(result, single.sentence_level !== false, single.paragraph_level !== false),
      highlights: filteredHighlights,
    };

    console.log(`[detector][success][${requestId}] Analyzed ${single.text.length} chars, language=${result.language.primary?.code}, verdict=${result.overall.verdict}, time=${Date.now() - startedAt}ms`);

    return jsonResponse({
      success: true,
      api_version: 'v2',
      endpoint: 'analyze',
      request_id: result.metadata.requestId,
      detector_version: result.metadata.detectorVersion,
      model_version: result.metadata.modelVersion,
      language_pipeline_version: result.metadata.languagePipelineVersion,
      calibration_version: result.metadata.calibrationVersion,
      remaining: updatedRemaining ?? null,
      limit: updatedLimit ?? null,
      plan: entitlement.plan ?? (isGuest ? 'guest' : 'free'),
      result: finalResult,
    });
  } catch (err: any) {
    console.error(`[detector][fatal][${requestId}] Unhandled error:`, err);
    return errorResponse('unknown', err.message || 'Internal server error.', 500, requestId);
  }
});
