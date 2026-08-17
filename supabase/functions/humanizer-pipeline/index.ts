import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createServiceClient, checkEntitlement, getTimezone } from "../_shared/entitlements.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const INTEGRATIONS_API_KEY = Deno.env.get("INTEGRATIONS_API_KEY");

const HUMANIZER_FEATURE_SLUG = 'ai_humanizer';

const LLM_ENDPOINT = "https://app-c18l1vf2nz7l-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";
const FALLBACK_LLM_ENDPOINT = "https://app-c18l1vf2nz7l-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALTERNATIVE_TYPES = ["Most Faithful", "Most Natural", "Most Concise"] as const;

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;
const MAX_DELAY_MS = 60000;
const REQUEST_TIMEOUT_MS = 120000;
const DELAY_BETWEEN_ALTERNATIVES_MS = 2000;

const GUEST_HUMANIZER_DAILY_LIMIT = 5;

type AlternativeType = typeof ALTERNATIVE_TYPES[number];

interface AlternativeRecord {
  alternative_id?: string;
  job_id: string;
  alternative_type: AlternativeType;
  status: string;
  text?: string;
  summary?: string;
  scores?: any;
  similarity_to_original?: number;
  meaning_integrity?: number;
  provider?: string;
  model?: string;
  attempt_count?: number;
  error_code?: string;
  error_message?: string;
  processing_time?: number;
  warnings?: any[];
  created_at?: string;
  completed_at?: string;
}

interface GuestEntitlement {
  allowed: boolean;
  remaining: number | null;
  limit: number | null;
  plan: string | null;
  reason: string | null;
}

function getClientIp(req: Request): string {
  const xForwardedFor = req.headers.get('x-forwarded-for');
  const xRealIp = req.headers.get('x-real-ip');
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  if (xRealIp) return xRealIp.trim();
  return 'unknown';
}

async function hashGuestId(guestId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(guestId);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function decodeTokenPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return typeof payload === 'object' && payload !== null ? payload : null;
  } catch {
    return null;
  }
}

async function checkGuestEntitlement(
  supabase: any,
  guestId: string,
  featureSlug: string,
  timezone = 'UTC'
): Promise<GuestEntitlement> {
  const hash = await hashGuestId(guestId);
  const usageDate = new Date().toLocaleDateString('en-CA', { timeZone: timezone });

  const { data, error } = await supabase
    .from('guest_usage')
    .select('used_count')
    .eq('guest_hash', hash)
    .eq('usage_date', usageDate)
    .eq('feature_slug', featureSlug)
    .maybeSingle();

  if (error) {
    console.error('checkGuestEntitlement error:', error);
    throw new Error('Guest entitlement check failed');
  }

  const used = data?.used_count || 0;
  const remaining = Math.max(GUEST_HUMANIZER_DAILY_LIMIT - used, 0);
  if (remaining > 0) {
    return { allowed: true, remaining, limit: GUEST_HUMANIZER_DAILY_LIMIT, plan: 'guest', reason: null };
  }

  return {
    allowed: false,
    remaining: 0,
    limit: GUEST_HUMANIZER_DAILY_LIMIT,
    plan: 'guest',
    reason: 'Free trial limit reached for today. Sign up or upgrade to continue.',
  };
}

async function recordGuestUsage(
  supabase: any,
  guestId: string,
  featureSlug: string,
  count = 1,
  timezone = 'UTC'
): Promise<{ remaining: number | null; limit: number | null; used: number | null }> {
  const hash = await hashGuestId(guestId);
  const usageDate = new Date().toLocaleDateString('en-CA', { timeZone: timezone });

  const { data, error } = await supabase.rpc('increment_guest_usage', {
    p_guest_hash: hash,
    p_usage_date: usageDate,
    p_feature_slug: featureSlug,
    p_count: count,
  });

  if (error) {
    console.error('recordGuestUsage error:', error);
    throw new Error('Guest usage recording failed');
  }

  const row = (data || [])[0] || {};
  const used = row.used_count ?? 0;
  const remaining = Math.max(GUEST_HUMANIZER_DAILY_LIMIT - used, 0);
  return { remaining, limit: GUEST_HUMANIZER_DAILY_LIMIT, used };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const authHeader = req.headers.get("Authorization");
    const timezone = getTimezone(req);

    let user: { id: string } | null = null;
    let isGuest = false;
    let guestId = '';

    if (!authHeader) {
      isGuest = true;
      guestId = getClientIp(req);
    } else {
      const token = authHeader.replace("Bearer ", "").trim();
      const payload = decodeTokenPayload(token);
      const role = typeof payload?.role === 'string' ? payload.role : '';

      if (token === '' || role === 'anon') {
        isGuest = true;
        guestId = getClientIp(req);
      } else if (role === 'authenticated') {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !authUser) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }
        user = authUser;
      } else {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
    }

    // Entitlement check: humanizer is a Pro feature; guests use a free trial quota.
    let entitlement;
    if (isGuest) {
      entitlement = await checkGuestEntitlement(supabase, guestId, HUMANIZER_FEATURE_SLUG, timezone);
    } else {
      entitlement = await checkEntitlement(supabase, user.id, HUMANIZER_FEATURE_SLUG, timezone);
    }
    if (!entitlement.allowed) {
      return jsonResponse({
        success: false,
        error: entitlement.reason || "Humanizer requires a Pro subscription",
        upgrade_required: true,
        remaining: entitlement.remaining,
        limit: entitlement.limit,
        plan: entitlement.plan,
      }, 403);
    }

    const body = await req.json();
    const { action, job_id, text, settings, alternative_type, sentence_context, operation } = body;
    const userId = user?.id ?? null;
    const guestIdForHandlers = guestId || null;

    if (action === "create_job") {
      return await handleCreateJob(supabase, userId, guestIdForHandlers, text, settings);
    }

    if (action === "process_job" && job_id) {
      return await handleProcessJob(supabase, userId, guestIdForHandlers, job_id);
    }

    if (action === "retry_missing_versions" && job_id) {
      return await handleRetryMissing(supabase, userId, guestIdForHandlers, job_id);
    }

    if (action === "retry_all" && job_id) {
      return await handleRetryAll(supabase, userId, guestIdForHandlers, job_id);
    }

    if (action === "select_alternative" && job_id && alternative_type) {
      return await handleSelectAlternative(supabase, userId, guestIdForHandlers, job_id, alternative_type);
    }

    if (action === "regenerate" && job_id && operation) {
      return await handleRegenerate(supabase, userId, guestIdForHandlers, job_id, operation, sentence_context);
    }

    if (action === "submit_feedback" && job_id) {
      if (isGuest) {
        return jsonResponse({ error: "Feedback requires a signed-in account" }, 403);
      }
      return await handleSubmitFeedback(supabase, user.id, job_id, body);
    }

    if (action === "get_job" && job_id) {
      return await handleGetJob(supabase, userId, guestIdForHandlers, job_id);
    }

    if (action === "get_job_versions" && job_id) {
      return await handleGetJobVersions(supabase, userId, guestIdForHandlers, job_id);
    }

    if (action === "update_job_text" && job_id) {
      return await handleUpdateJobText(supabase, userId, guestIdForHandlers, job_id, body.humanized_text);
    }

    if (action === "check_guest_usage") {
      return await handleCheckGuestUsage(supabase, guestIdForHandlers, timezone);
    }

    return jsonResponse({ error: "Invalid action" }, 400);

  } catch (err: any) {
    console.error("Edge function error:", err);
    return jsonResponse({ error: err.message || "Internal server error" }, 500);
  }
});

function jsonResponse(body: any, status: number = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function loadOwnedJob(
  supabase: any,
  userId: string | null,
  guestId: string | null,
  jobId: string
): Promise<{ job: any; error: any }> {
  let query = supabase.from("humanization_jobs").select("*").eq("job_id", jobId);
  if (userId) {
    query = query.eq("user_id", userId);
  } else if (guestId) {
    query = query.eq("guest_id", guestId);
  } else {
    return { job: null, error: { message: "No owner context" } };
  }

  const { data, error } = await query.single();
  return { job: data, error };
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

async function handleCreateJob(
  supabase: any,
  userId: string | null,
  guestId: string | null,
  text: string,
  settings: any,
  timezone = 'UTC'
) {
  if (!text || text.length > 50000) {
    return jsonResponse({ error: "Invalid text length" }, 400);
  }

  const requestId = crypto.randomUUID();

  const { data: job, error: insertError } = await supabase
    .from("humanization_jobs")
    .insert({
      user_id: userId,
      guest_id: guestId,
      original_text: text,
      settings: settings || {},
      status: "analyzing",
      domain_type: settings?.domainType || "General",
      input_length: text.length,
      expected_alternatives: 3,
      completed_alternatives: 0,
      failed_alternatives: 0,
      request_id: requestId
    })
    .select()
    .single();

  if (insertError) throw insertError;

  let remaining: number | null = null;
  let limit: number | null = null;
  if (guestId) {
    try {
      const usage = await recordGuestUsage(supabase, guestId, HUMANIZER_FEATURE_SLUG, 1, timezone);
      remaining = usage.remaining;
      limit = usage.limit;
    } catch (usageErr: any) {
      console.error('Failed to record guest humanizer usage:', usageErr);
    }
  }

  // Create pending alternative records
  const alternatives: AlternativeRecord[] = ALTERNATIVE_TYPES.map(type => ({
    job_id: job.job_id,
    alternative_type: type,
    status: "Pending"
  }));

  const { error: altInsertError } = await supabase.from("humanization_alternatives").insert(alternatives);
  if (altInsertError) throw altInsertError;

  return jsonResponse({ success: true, job, remaining, limit });
}

async function handleProcessJob(
  supabase: any,
  userId: string | null,
  guestId: string | null,
  jobId: string
) {
  const startTime = Date.now();

  const { job, error: jobError } = await loadOwnedJob(supabase, userId, guestId, jobId);
  if (jobError || !job) return jsonResponse({ error: "Job not found" }, 404);

  // Prevent re-processing a completed/partial job unless retrying
  if (job.status === "completed") {
    return jsonResponse({ success: true, job: await loadJobWithAlternatives(supabase, jobId) });
  }

  // Reset previous failed attempts for a fresh process_job run
  await resetFailedAlternatives(supabase, jobId);
  await supabase.from("humanization_jobs").update({
    status: "analyzing",
    error_message: null,
    completed_alternatives: 0,
    failed_alternatives: 0
  }).eq("job_id", jobId);

  // Stage: analyzing -> planning -> rewriting
  await updateJobStatus(supabase, jobId, "analyzing");
  await updateJobStatus(supabase, jobId, "planning");
  await updateJobStatus(supabase, jobId, "rewriting");

  const originalText = job.original_text;
  const jobSettings = job.settings || {};

  // Primary strategy: generate all three alternatives in a single structured request
  let alternatives: AlternativeRecord[] = [];
  let completedTypes = new Set<AlternativeType>();
  let generationError: string | null = null;

  try {
    const singleResult = await generateAllAlternativesSingleRequest(supabase, jobId, originalText, jobSettings);
    alternatives = singleResult.results;
    completedTypes = singleResult.completedTypes;
  } catch (err: any) {
    generationError = err.message || "Single-request generation failed";
    console.warn("Single-request generation failed, falling back to sequential:", generationError);
  }

  // Fallback strategy: sequential generation for any missing or invalid alternatives
  if (completedTypes.size < 3) {
    try {
      const missingTypes = ALTERNATIVE_TYPES.filter(t => !completedTypes.has(t));
      const sequentialResults = await generateAlternativesSequentially(supabase, jobId, originalText, jobSettings, alternatives, missingTypes);
      alternatives = mergeAlternatives(alternatives, sequentialResults);
    } catch (err: any) {
      generationError = err.message || "Sequential generation failed";
      console.error("Sequential generation failed:", generationError);
    }
  }

  // Validate final set and update DB
  const completedCount = alternatives.filter(a => a.status === "Completed").length;
  const failedCount = alternatives.filter(a => a.status !== "Completed").length;

  await updateJobStatus(supabase, jobId, "verifying");

  // Verify completed alternatives and compute sentence changes for the best/default
  for (const alt of alternatives) {
    if (alt.status === "Completed" && alt.text) {
      const verification = verifyIntegrity(originalText, alt.text);
      const meaning = verification.meaning_preservation_score || 0;
      await supabase.from("humanization_alternatives").update({
        meaning_integrity: meaning,
        scores: { ...alt.scores, meaning_preservation_score: meaning }
      }).eq("alternative_id", alt.alternative_id);
    }
  }

  // Determine final job status and charging
  const finalStatus = completedCount === 3 ? "completed" : (completedCount > 0 ? "partial" : "failed");
  const shouldCharge = completedCount > 0 && !job.usage_charged;

  const { data: updatedJob, error: updateError } = await supabase.from("humanization_jobs").update({
    status: finalStatus,
    completed_at: new Date().toISOString(),
    completed_alternatives: completedCount,
    failed_alternatives: failedCount,
    processing_time: Date.now() - startTime,
    usage_charged: shouldCharge ? true : job.usage_charged,
    error_message: finalStatus === "failed" ? (generationError || "No alternatives could be generated") : null,
    alternatives: alternatives.map(toLegacyAlternative) // keep legacy column in sync
  }).eq("job_id", jobId).select().single();

  if (updateError) throw updateError;

  if (finalStatus === "failed") {
    return jsonResponse({ success: false, error: generationError || "No alternatives could be generated", job: updatedJob, request_id: job.request_id }, 500);
  }

  return jsonResponse({ success: true, job: await loadJobWithAlternatives(supabase, jobId) });
}

async function handleRetryMissing(
  supabase: any,
  userId: string | null,
  guestId: string | null,
  jobId: string
) {
  const { job, error: jobError } = await loadOwnedJob(supabase, userId, guestId, jobId);
  if (jobError || !job) return jsonResponse({ error: "Job not found" }, 404);

  const { data: existingAlts } = await supabase
    .from("humanization_alternatives")
    .select("*")
    .eq("job_id", jobId);

  const completedMap = new Map(existingAlts?.filter((a: AlternativeRecord) => a.status === "Completed").map((a: AlternativeRecord) => [a.alternative_type, a]));

  // Only retry non-completed alternatives
  const missingTypes = ALTERNATIVE_TYPES.filter(type => !completedMap.has(type));
  if (missingTypes.length === 0) {
    return jsonResponse({ success: true, job: await loadJobWithAlternatives(supabase, jobId) });
  }

  const alternatives = await generateAlternativesSequentially(supabase, jobId, job.original_text, job.settings || {}, [], missingTypes);

  // Recount
  const { data: allAlts } = await supabase.from("humanization_alternatives").select("*").eq("job_id", jobId);
  const completedCount = allAlts.filter((a: AlternativeRecord) => a.status === "Completed").length;
  const failedCount = allAlts.filter((a: AlternativeRecord) => a.status !== "Completed").length;
  const finalStatus = completedCount === 3 ? "completed" : (completedCount > 0 ? "partial" : "failed");

  const { data: updatedJob } = await supabase.from("humanization_jobs").update({
    status: finalStatus,
    completed_alternatives: completedCount,
    failed_alternatives: failedCount,
    completed_at: finalStatus === "completed" ? new Date().toISOString() : job.completed_at,
    alternatives: allAlts.map(toLegacyAlternative),
    error_message: null
  }).eq("job_id", jobId).select().single();

  return jsonResponse({ success: true, job: await loadJobWithAlternatives(supabase, jobId) });
}

async function handleRetryAll(
  supabase: any,
  userId: string | null,
  guestId: string | null,
  jobId: string
) {
  const { job, error: jobError } = await loadOwnedJob(supabase, userId, guestId, jobId);
  if (jobError || !job) return jsonResponse({ error: "Job not found" }, 404);

  await resetAllAlternatives(supabase, jobId);
  await supabase.from("humanization_jobs").update({
    status: "analyzing",
    error_message: null,
    completed_alternatives: 0,
    failed_alternatives: 0
  }).eq("job_id", jobId);

  return handleProcessJob(supabase, userId, guestId, jobId);
}

async function handleSelectAlternative(
  supabase: any,
  userId: string | null,
  guestId: string | null,
  jobId: string,
  altType: string
) {
  const { job, error: jobError } = await loadOwnedJob(supabase, userId, guestId, jobId);
  if (jobError || !job) throw new Error("Job not found");

  const { data: alternative, error: altError } = await supabase
    .from("humanization_alternatives")
    .select("*")
    .eq("job_id", jobId)
    .eq("alternative_type", altType)
    .single();

  if (altError || !alternative || !alternative.text) throw new Error("Alternative not found or not ready");

  const humanized_text = alternative.text;
  const scores = alternative.scores || generateScores(job.original_text, humanized_text);
  const sentence_changes = generateSentenceChanges(job.original_text, humanized_text);
  const verification_results = verifyIntegrity(job.original_text, humanized_text);
  const output_length = humanized_text.length;

  const { data: updatedJob, error: updateError } = await supabase.from("humanization_jobs").update({
    selected_alternative: altType,
    humanized_text,
    scores,
    sentence_changes,
    verification_results,
    output_length
  }).eq("job_id", jobId).select().single();

  if (updateError) throw updateError;

  await supabase.from("humanization_versions").insert({
    job_id: jobId,
    version_number: 1,
    humanized_text,
    settings: job.settings,
    scores,
    sentence_changes,
    verification_results,
    word_count: humanized_text.split(/\s+/).filter(Boolean).length,
    change_percentage: scores?.originality_score || 0
  });

  return jsonResponse({ success: true, job: updatedJob });
}

async function handleRegenerate(
  supabase: any,
  userId: string | null,
  guestId: string | null,
  jobId: string,
  operation: string,
  sentenceContext?: string
) {
  const { job, error: jobError } = await loadOwnedJob(supabase, userId, guestId, jobId);
  if (jobError || !job) throw new Error("Job not found");

  const scope = operation;
  const context = sentenceContext || job.original_text;
  const settings = job.settings || {};

  const rewritten = await rewriteText(context, { ...settings, goal: "natural", scope });
  return jsonResponse({ success: true, text: rewritten, scope });
}

async function handleSubmitFeedback(supabase: any, userId: string, jobId: string, body: any) {
  const { overall_quality, meaning_preservation, naturalness, usefulness, issue_type, issue_description } = body;

  const { error: insertError } = await supabase.from("humanization_feedback").insert({
    job_id: jobId,
    user_id: userId,
    overall_quality,
    meaning_preservation,
    naturalness,
    usefulness,
    issue_type,
    issue_description
  });

  if (insertError) throw insertError;
  return jsonResponse({ success: true });
}

async function handleGetJob(
  supabase: any,
  userId: string | null,
  guestId: string | null,
  jobId: string
) {
  const { job, error: jobError } = await loadOwnedJob(supabase, userId, guestId, jobId);
  if (jobError || !job) return jsonResponse({ error: "Job not found" }, 404);

  return jsonResponse({ success: true, job: await loadJobWithAlternatives(supabase, jobId) });
}

async function handleGetJobVersions(
  supabase: any,
  userId: string | null,
  guestId: string | null,
  jobId: string
) {
  const { job, error: jobError } = await loadOwnedJob(supabase, userId, guestId, jobId);
  if (jobError || !job) return jsonResponse({ error: "Job not found" }, 404);

  const { data: versions, error: versionsError } = await supabase
    .from("humanization_versions")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (versionsError) throw versionsError;
  return jsonResponse({ success: true, versions: versions || [] });
}

async function handleUpdateJobText(
  supabase: any,
  userId: string | null,
  guestId: string | null,
  jobId: string,
  humanizedText: string
) {
  const { job, error: jobError } = await loadOwnedJob(supabase, userId, guestId, jobId);
  if (jobError || !job) return jsonResponse({ error: "Job not found" }, 404);

  const { data: updatedJob, error: updateError } = await supabase
    .from("humanization_jobs")
    .update({ humanized_text: humanizedText })
    .eq("job_id", jobId)
    .select()
    .single();

  if (updateError) throw updateError;
  return jsonResponse({ success: true, job: updatedJob });
}

async function handleCheckGuestUsage(
  supabase: any,
  guestId: string | null,
  timezone = 'UTC'
) {
  if (!guestId) {
    return jsonResponse({ success: true, remaining: GUEST_HUMANIZER_DAILY_LIMIT, limit: GUEST_HUMANIZER_DAILY_LIMIT });
  }
  const entitlement = await checkGuestEntitlement(supabase, guestId, HUMANIZER_FEATURE_SLUG, timezone);
  return jsonResponse({ success: true, remaining: entitlement.remaining, limit: entitlement.limit });
}

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

async function updateJobStatus(supabase: any, jobId: string, status: string) {
  await supabase.from("humanization_jobs").update({ status }).eq("job_id", jobId);
}

async function resetFailedAlternatives(supabase: any, jobId: string) {
  await supabase.from("humanization_alternatives")
    .update({ status: "Pending", error_code: null, error_message: null, attempt_count: 0 })
    .eq("job_id", jobId)
    .in("status", ["Validation Failed", "Provider Failed", "Retrying", "Pending"]);
}

async function resetAllAlternatives(supabase: any, jobId: string) {
  await supabase.from("humanization_alternatives")
    .update({ status: "Pending", text: null, scores: null, error_code: null, error_message: null, attempt_count: 0 })
    .eq("job_id", jobId);
}

async function loadJobWithAlternatives(supabase: any, jobId: string) {
  const { data: job, error: jobError } = await supabase.from("humanization_jobs").select("*").eq("job_id", jobId).single();
  if (jobError) throw jobError;

  const { data: alternatives, error: altError } = await supabase
    .from("humanization_alternatives")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: true });

  if (altError) throw altError;

  return {
    ...job,
    alternatives: alternatives?.map(toLegacyAlternative) || []
  };
}

function toLegacyAlternative(alt: AlternativeRecord) {
  return {
    alternative_id: alt.alternative_id,
    alternative_type: alt.alternative_type,
    status: alt.status,
    text: alt.text,
    summary: alt.summary,
    scores: alt.scores,
    similarity_to_original: alt.similarity_to_original,
    meaning_integrity: alt.meaning_integrity,
    provider: alt.provider,
    model: alt.model,
    attempt_count: alt.attempt_count,
    error_code: alt.error_code,
    error_message: alt.error_message,
    processing_time: alt.processing_time,
    warnings: alt.warnings,
    created_at: alt.created_at,
    completed_at: alt.completed_at
  };
}

// ---------------------------------------------------------------------------
// Generation strategies
// ---------------------------------------------------------------------------

async function generateAllAlternativesSingleRequest(
  supabase: any,
  jobId: string,
  originalText: string,
  settings: any
): Promise<AlternativeRecord[]> {
  const prompt = buildUnifiedPrompt(originalText, settings);
  const responseText = await callLLMWithRetries(prompt, originalText, { structured: true, jobId, supabase });

  const parsed = parseAlternativesJson(responseText);
  if (!parsed || !Array.isArray(parsed.alternatives) || parsed.alternatives.length !== 3) {
    throw new Error("Single-request response did not contain exactly 3 alternatives");
  }

  const typeMap: Record<string, AlternativeType> = {
    "faithful": "Most Faithful",
    "natural": "Most Natural",
    "concise": "Most Concise"
  };

  const results: AlternativeRecord[] = [];
  const completedTypes = new Set<AlternativeType>();

  for (const item of parsed.alternatives) {
    const altType = typeMap[item.type?.toLowerCase()];
    if (!altType) {
      throw new Error(`Unknown alternative type: ${item.type}`);
    }

    const text = (item.text || "").trim();
    if (!text) {
      await upsertAlternative(supabase, {
        job_id: jobId,
        alternative_type: altType,
        status: "Provider Failed",
        error_message: `${altType}: empty output`,
        attempt_count: 1
      });
      continue;
    }

    const similarity = calculateSimilarity(originalText, text);
    const scores = { ...generateScores(originalText, text), ...(item.scores || {}) };

    try {
      validateAlternativeQuality(altType, originalText, text, settings, similarity);
    } catch (validationErr: any) {
      await upsertAlternative(supabase, {
        job_id: jobId,
        alternative_type: altType,
        status: "Validation Failed",
        text,
        scores,
        similarity_to_original: similarity,
        meaning_integrity: scores.meaning_preservation_score,
        error_message: validationErr.message,
        attempt_count: 1
      });
      continue;
    }

    const record: AlternativeRecord = {
      job_id: jobId,
      alternative_type: altType,
      status: "Completed",
      text,
      summary: item.summary || "",
      scores,
      similarity_to_original: similarity,
      meaning_integrity: scores.meaning_preservation_score,
      provider: "gemini-gateway",
      model: "gemini-2.5-flash",
      attempt_count: 1,
      error_code: null,
      error_message: null,
      warnings: item.warnings || []
    };

    await upsertAlternative(supabase, record);
    results.push(record);
    completedTypes.add(altType);
  }

  // If all three are valid, check pairwise distinctness. If too similar, mark weaker ones for regeneration.
  if (results.length === 3) {
    const texts = results.map(r => r.text!);
    if (!areAlternativesDistinct(texts)) {
      // Mark the duplicate(s) as validation failed; sequential fallback will regenerate only missing ones
      for (let i = 0; i < results.length; i++) {
        for (let j = i + 1; j < results.length; j++) {
          const sim = calculateSimilarity(texts[i], texts[j]);
          if (sim >= 90) {
            const weaker = results[i].similarity_to_original! <= results[j].similarity_to_original! ? i : j;
            results[weaker].status = "Validation Failed";
            results[weaker].error_message = `Too similar to ${results[weaker === i ? j : i].alternative_type} (${sim.toFixed(1)}% similar)`;
            await upsertAlternative(supabase, results[weaker]);
            completedTypes.delete(results[weaker].alternative_type);
          }
        }
      }
    }
  }

  return { results, completedTypes };
}

async function generateAlternativesSequentially(
  supabase: any,
  jobId: string,
  originalText: string,
  settings: any,
  existing: AlternativeRecord[] = [],
  onlyTypes?: AlternativeType[]
): Promise<AlternativeRecord[]> {
  const goals: { goal: string; label: AlternativeType }[] = [
    { goal: "faithful", label: "Most Faithful" },
    { goal: "natural", label: "Most Natural" },
    { goal: "concise", label: "Most Concise" }
  ];

  const typesToGenerate = onlyTypes || ALTERNATIVE_TYPES;
  const results: AlternativeRecord[] = [...existing];

  for (const { goal, label } of goals) {
    if (!typesToGenerate.includes(label)) continue;

    // Skip if already completed in existing
    if (existing.some(e => e.alternative_type === label && e.status === "Completed")) continue;

    const existingRecord = existing.find(e => e.alternative_type === label);
    const record = existingRecord || {
      job_id: jobId,
      alternative_type: label,
      status: "Generating"
    };

    await upsertAlternative(supabase, { ...record, status: "Generating", attempt_count: (record.attempt_count || 0) });

    let bestRecord: AlternativeRecord | null = null;
    let lastError: string | null = null;
    let lastText = "";

    try {
      const settingsWithGoal = { ...settings, goal };
      const text = await callLLMWithRetries(
        buildPrompt(originalText, settingsWithGoal, goal),
        originalText,
        { jobId, supabase, alternativeType: label }
      );
      lastText = text;

      const similarity = calculateSimilarity(originalText, text);
      validateAlternativeQuality(label, originalText, text, settingsWithGoal, similarity);

      const scores = generateScores(originalText, text);
      bestRecord = {
        ...record,
        status: "Completed",
        text,
        scores,
        similarity_to_original: similarity,
        meaning_integrity: scores.meaning_preservation_score,
        provider: "gemini-gateway",
        model: "gemini-2.5-flash",
        attempt_count: (record.attempt_count || 0) + 1,
        error_code: null,
        error_message: null,
        warnings: []
      };
    } catch (err: any) {
      lastError = err.message || "Generation failed";
      console.warn(`${label} failed:`, lastError);
      bestRecord = {
        ...record,
        status: "Provider Failed",
        error_code: "provider_failed",
        error_message: lastError,
        attempt_count: (record.attempt_count || 0) + 1
      };
    }

    // If validation-like failure occurred and we have some text, mark as Validation Failed
    if (!bestRecord && lastText) {
      bestRecord = {
        ...record,
        status: "Validation Failed",
        error_code: "validation_failed",
        error_message: lastError || "Output did not pass quality validation",
        text: lastText,
        attempt_count: (record.attempt_count || 0) + 1
      };
    }

    if (bestRecord) {
      await upsertAlternative(supabase, bestRecord);
      const idx = results.findIndex(r => r.alternative_type === label);
      if (idx >= 0) results[idx] = bestRecord;
      else results.push(bestRecord);
    }

    // Delay before next alternative (except last)
    if (label !== "Most Concise") await delay(DELAY_BETWEEN_ALTERNATIVES_MS);
  }

  return results;
}

function mergeAlternatives(primary: AlternativeRecord[], fallback: AlternativeRecord[]): AlternativeRecord[] {
  const map = new Map(primary.map(a => [a.alternative_type, a]));
  for (const alt of fallback) {
    if (!map.has(alt.alternative_type) || map.get(alt.alternative_type)?.status !== "Completed") {
      map.set(alt.alternative_type, alt);
    }
  }
  return ALTERNATIVE_TYPES.map(type => map.get(type)!).filter(Boolean);
}

async function upsertAlternative(supabase: any, alt: AlternativeRecord) {
  const { data: existing } = await supabase
    .from("humanization_alternatives")
    .select("alternative_id")
    .eq("job_id", alt.job_id)
    .eq("alternative_type", alt.alternative_type)
    .single();

  if (existing) {
    const update: any = { ...alt };
    if (alt.status === "Completed") update.completed_at = new Date().toISOString();
    delete update.alternative_id;
    delete update.created_at;
    await supabase.from("humanization_alternatives").update(update).eq("alternative_id", existing.alternative_id);
    alt.alternative_id = existing.alternative_id;
  } else {
    const { data } = await supabase.from("humanization_alternatives").insert(alt).select().single();
    if (data) alt.alternative_id = data.alternative_id;
  }
}

// ---------------------------------------------------------------------------
// LLM calling with retry logic
// ---------------------------------------------------------------------------

interface LLMOptions {
  structured?: boolean;
  jobId?: string;
  supabase?: any;
  alternativeType?: string;
}

async function callLLMWithRetries(prompt: string, userText: string, options: LLMOptions = {}): Promise<string> {
  const { structured, jobId, supabase, alternativeType } = options;

  let lastError: string | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const start = Date.now();
    const provider = "gemini-gateway";
    const model = "gemini-2.5-flash";

    try {
      const text = await callLLM(prompt, userText, { structured, timeoutMs: REQUEST_TIMEOUT_MS });

      if (supabase && jobId) {
        await logExecution(supabase, {
          job_id: jobId,
          alternative_type: alternativeType,
          provider,
          model,
          status: "Success",
          attempt_number: attempt,
          latency: Date.now() - start,
          success: true
        });
      }

      return text;
    } catch (err: any) {
      lastError = err.message || "Unknown LLM error";
      const isRateLimit = err.status === 429 || err.message?.includes("429") || err.message?.includes("temporarily busy");
      const isQuota = err.status === 402 || err.message?.includes("402") || err.message?.includes("quota exceeded");
      const isTimeout = err.message?.includes("timeout");
      const isServerError = err.status >= 500;

      const status = isRateLimit ? "Rate Limited" : (isQuota ? "Quota Exceeded" : (isTimeout ? "Timeout" : (isServerError ? "Server Error" : "Failed")));
      const errorCode = isRateLimit ? "429" : (isQuota ? "402" : (isTimeout ? "timeout" : (isServerError ? String(err.status) : "unknown")));

      // Compute wait time
      let waitMs = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      if (err.retryAfter && err.retryAfter > 0) waitMs = err.retryAfter * 1000;
      waitMs = Math.min(waitMs, MAX_DELAY_MS);
      waitMs += Math.floor(Math.random() * 1000); // jitter

      if (supabase && jobId) {
        await logExecution(supabase, {
          job_id: jobId,
          alternative_type: alternativeType,
          provider,
          model,
          status,
          attempt_number: attempt,
          latency: Date.now() - start,
          success: false,
          error_code: errorCode,
          error_message: lastError,
          retry_after: err.retryAfter,
          wait_time: waitMs
        });
      }

      // Do not retry quota/402 errors
      if (isQuota) {
        throw err;
      }

      // Only retry on rate limit, timeout, or server error
      if (!isRateLimit && !isTimeout && !isServerError) {
        throw err;
      }

      if (attempt < MAX_RETRIES) {
        console.warn(`Attempt ${attempt} failed with ${status}. Retrying after ${waitMs}ms...`);
        await delay(waitMs);
      }
    }
  }

  throw new Error(lastError || "Maximum retries exceeded");
}

async function callLLM(prompt: string, userText: string, options: { structured?: boolean; timeoutMs?: number } = {}): Promise<string> {
  if (!INTEGRATIONS_API_KEY) {
    throw new Error("INTEGRATIONS_API_KEY is not configured");
  }

  const { structured = false, timeoutMs = REQUEST_TIMEOUT_MS } = options;

  const body: any = {
    contents: [{ role: "user", parts: [{ text: prompt + "\n\n" + userText }] }]
  };

  if (structured) {
    body.generationConfig = {
      responseMimeType: "application/json",
      responseSchema: ALTERNATIVES_SCHEMA
    };
  }

  const response = await fetch(LLM_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Authorization": `Bearer ${INTEGRATIONS_API_KEY}`
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("LLM API error:", response.status, errorText);

    const err: any = new Error(`LLM API returned status: ${response.status}`);
    err.status = response.status;

    const retryAfter = response.headers.get("Retry-After");
    if (retryAfter) {
      err.retryAfter = parseInt(retryAfter, 10);
    }

    if (response.status === 429) {
      err.message = "The AI service is temporarily busy. Please wait a moment and try again.";
    } else if (response.status === 402) {
      err.message = "AI service quota exceeded. Please top up your account credits.";
    } else if (response.status >= 500) {
      err.message = "The AI service experienced an error. Please try again shortly.";
    }

    throw err;
  }

  if (!response.body) {
    throw new Error("LLM API returned empty body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const dataStr = line.slice(5).trim();
      if (!dataStr || dataStr === "[DONE]") continue;

      try {
        const frame = JSON.parse(dataStr);
        const text = frame?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) fullText += text;
      } catch {
        // incomplete frame, skip
      }
    }
  }

  return fullText.trim();
}

async function logExecution(supabase: any, record: any) {
  if (!supabase) return;
  try {
    await supabase.from("model_execution_records").insert({
      job_id: record.job_id,
      alternative_id: record.alternative_id,
      provider: record.provider,
      model_name: record.model,
      status: record.status,
      attempt_number: record.attempt_number,
      wait_time: record.wait_time,
      retry_after: record.retry_after,
      latency: record.latency,
      success: record.success,
      error_code: record.error_code,
      error_message: record.error_message
    });
  } catch (e) {
    console.error("Failed to log execution:", e);
  }
}

// ---------------------------------------------------------------------------
// Structured output schema and parsing
// ---------------------------------------------------------------------------

const ALTERNATIVES_SCHEMA = {
  type: "object",
  properties: {
    alternatives: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["faithful", "natural", "concise"] },
          text: { type: "string" },
          summary: { type: "string" },
          scores: { type: "object" },
          warnings: { type: "array", items: { type: "string" } }
        },
        required: ["type", "text"]
      }
    }
  },
  required: ["alternatives"]
};

function parseAlternativesJson(text: string): any {
  // Try direct JSON parse
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code block
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        // fall through
      }
    }
    // Try to find first { ... }
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch {
        // fall through
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

function buildUnifiedPrompt(originalText: string, settings: any): string {
  const level = settings.level || "balanced";
  const tone = settings.tone || "neutral";
  const audience = settings.audience || "general";
  const readingLevel = settings.readingLevel || "standard";

  const levelInstructions: Record<string, string> = {
    light: "Make light edits: fix grammar, improve flow, and smooth awkward phrasing while keeping the original sentence structure largely intact. Minimal changes.",
    balanced: "Rewrite moderately: vary sentence structure, replace generic AI phrasing, improve rhythm and transitions, while preserving all facts and meaning.",
    strong: "Rewrite substantially: restructure sentences and paragraphs, diversify vocabulary, and remove predictable AI patterns. Preserve all facts, names, dates, numbers, and citations.",
    advanced: "Transform at paragraph level: significantly rephrase and restructure to sound authentically human, while strictly preserving every fact, name, date, number, citation, and quotation.",
    custom: "Apply the user's advanced settings exactly as specified."
  };

  const preservation: string[] = [];
  if (settings.preserveFacts) preservation.push("facts, statistics, numbers, percentages, and main claims");
  if (settings.preserveKeywords) preservation.push("important keywords and search terms");
  if (settings.preserveCitations) preservation.push("citations, references, and source attributions");
  if (settings.preserveFormatting) preservation.push("formatting such as lists, headings, and emphasis");
  if (settings.preserveParagraphStructure) preservation.push("paragraph boundaries and logical flow");
  if (settings.preserveTechnicalTerminology) preservation.push("technical and domain-specific terminology");
  if (settings.preserveBrandVoice) preservation.push("brand voice and preferred terminology");

  const transformations: string[] = [];
  if (settings.shortenText) transformations.push("shorten the text where possible without losing meaning");
  if (settings.expandExplanations) transformations.push("expand brief explanations for clarity");
  if (settings.reducePassiveVoice) transformations.push("convert passive voice to active voice where appropriate");
  if (settings.increaseSentenceVariation) transformations.push("vary sentence length and structure");
  if (settings.improveTransitions) transformations.push("improve transitions between sentences and paragraphs");
  if (settings.removeRepetition) transformations.push("remove repetitive words and phrases");
  if (settings.improveClarity) transformations.push("improve clarity and readability");
  if (settings.increaseEmotionalWarmth) transformations.push("add warmth and human warmth where appropriate");
  if (settings.reduceFormality) transformations.push("reduce excessive formality");

  let englishVariant = "";
  if (settings.useBritishEnglish) englishVariant = "Use British English spelling and conventions.";
  else if (settings.useAmericanEnglish) englishVariant = "Use American English spelling and conventions.";

  let contractions = "";
  if (settings.allowContractions) contractions = "Use natural contractions (e.g., don't, it's, we're).";
  else if (settings.avoidContractions) contractions = "Avoid contractions.";

  const protectedWords = settings.wordsToPreserve ? `PRESERVE these exact words/phrases: ${settings.wordsToPreserve}.` : "";
  const wordsToAvoid = settings.wordsToAvoid ? `AVOID using these words/phrases: ${settings.wordsToAvoid}.` : "";
  const preferredTerms = settings.preferredTerminology ? `PREFERRED TERMINOLOGY: ${settings.preferredTerminology}.` : "";
  const brandVoice = settings.brandVoiceInstructions ? `BRAND VOICE: ${settings.brandVoiceInstructions}.` : "";
  const extra = settings.additionalInstructions ? `ADDITIONAL INSTRUCTIONS: ${settings.additionalInstructions}.` : "";

  return `You are an expert editor. Produce exactly three humanized versions of the following text as a single valid JSON object matching the provided schema.

Tone: ${tone}. Audience: ${audience}. Reading level: ${readingLevel}.
Base rewriting level: ${levelInstructions[level] || levelInstructions.balanced}

STRICT RULES FOR ALL THREE VERSIONS:
- Preserve ALL of the following: ${preservation.length > 0 ? preservation.join(", ") : "facts, names, dates, numbers, citations, and meaning"}.
- Do NOT invent facts, change numbers, alter names, or remove citations.
- Do NOT simply swap synonyms; restructure sentences and vary phrasing.
- Do NOT add labels like [faithful], [natural], or [concise] inside the text.
- ${englishVariant}
- ${contractions}
${protectedWords}
${wordsToAvoid}
${preferredTerms}
${brandVoice}
${extra}
${transformations.length > 0 ? "Also: " + transformations.join("; ") + "." : ""}

SPECIFIC VERSION INSTRUCTIONS:
1. Most Faithful (type: "faithful"): Make the smallest changes necessary to reduce AI-signal phrasing. Keep original structure and wording wherever possible. Do not remove any content.
2. Most Natural (type: "natural"): Restructure sentences for a conversational, human-like flow. Use varied sentence lengths and natural transitions. Preserve all meaning and facts.
3. Most Concise (type: "concise"): Remove redundancy and filler while keeping every important claim and fact. The result must still be complete and not truncated.

Return ONLY the JSON object. No preamble, no markdown, no explanation.`;
}

function buildPrompt(originalText: string, settings: any, goal: string, scope: string = "full"): string {
  const level = settings.level || "balanced";
  const tone = settings.tone || "neutral";
  const audience = settings.audience || "general";
  const readingLevel = settings.readingLevel || "standard";

  const levelInstructions: Record<string, string> = {
    light: "Make light edits: fix grammar, improve flow, and smooth awkward phrasing while keeping the original sentence structure largely intact. Minimal changes.",
    balanced: "Rewrite moderately: vary sentence structure, replace generic AI phrasing, improve rhythm and transitions, while preserving all facts and meaning.",
    strong: "Rewrite substantially: restructure sentences and paragraphs, diversify vocabulary, and remove predictable AI patterns. Preserve all facts, names, dates, numbers, and citations.",
    advanced: "Transform at paragraph level: significantly rephrase and restructure to sound authentically human, while strictly preserving every fact, name, date, number, citation, and quotation.",
    custom: "Apply the user's advanced settings exactly as specified."
  };

  const goalInstructions: Record<string, string> = {
    faithful: "Prioritize fidelity: change only what is necessary to reduce AI-signal phrasing. Keep the original structure and wording wherever possible. Do not remove content.",
    natural: "Prioritize naturalness: make the text sound like it was written by a real person. Use varied sentence lengths, conversational flow, and human transitions. Preserve all meaning and facts.",
    concise: "Prioritize conciseness: remove fluff, redundancy, and verbose phrasing. Make every word count while keeping all key facts. Do not truncate."
  };

  const preservation: string[] = [];
  if (settings.preserveFacts) preservation.push("facts, statistics, numbers, percentages, and main claims");
  if (settings.preserveKeywords) preservation.push("important keywords and search terms");
  if (settings.preserveCitations) preservation.push("citations, references, and source attributions");
  if (settings.preserveFormatting) preservation.push("formatting such as lists, headings, and emphasis");
  if (settings.preserveParagraphStructure) preservation.push("paragraph boundaries and logical flow");
  if (settings.preserveTechnicalTerminology) preservation.push("technical and domain-specific terminology");
  if (settings.preserveBrandVoice) preservation.push("brand voice and preferred terminology");

  const transformations: string[] = [];
  if (settings.shortenText) transformations.push("shorten the text where possible without losing meaning");
  if (settings.expandExplanations) transformations.push("expand brief explanations for clarity");
  if (settings.reducePassiveVoice) transformations.push("convert passive voice to active voice where appropriate");
  if (settings.increaseSentenceVariation) transformations.push("vary sentence length and structure");
  if (settings.improveTransitions) transformations.push("improve transitions between sentences and paragraphs");
  if (settings.removeRepetition) transformations.push("remove repetitive words and phrases");
  if (settings.improveClarity) transformations.push("improve clarity and readability");
  if (settings.increaseEmotionalWarmth) transformations.push("add warmth and human warmth where appropriate");
  if (settings.reduceFormality) transformations.push("reduce excessive formality");

  let englishVariant = "";
  if (settings.useBritishEnglish) englishVariant = "Use British English spelling and conventions.";
  else if (settings.useAmericanEnglish) englishVariant = "Use American English spelling and conventions.";

  let contractions = "";
  if (settings.allowContractions) contractions = "Use natural contractions (e.g., don't, it's, we're).";
  else if (settings.avoidContractions) contractions = "Avoid contractions.";

  const protectedWords = settings.wordsToPreserve ? `PRESERVE these exact words/phrases: ${settings.wordsToPreserve}.` : "";
  const wordsToAvoid = settings.wordsToAvoid ? `AVOID using these words/phrases: ${settings.wordsToAvoid}.` : "";
  const preferredTerms = settings.preferredTerminology ? `PREFERRED TERMINOLOGY: ${settings.preferredTerminology}.` : "";
  const brandVoice = settings.brandVoiceInstructions ? `BRAND VOICE: ${settings.brandVoiceInstructions}.` : "";
  const extra = settings.additionalInstructions ? `ADDITIONAL INSTRUCTIONS: ${settings.additionalInstructions}.` : "";

  const scopeInstruction = scope === "sentence"
    ? "Rewrite ONLY the specific sentence or short passage provided below, using the surrounding context for tone. Return just the rewritten sentence/passage, nothing else."
    : scope === "paragraph"
    ? "Rewrite ONLY the paragraph provided below. Return just the rewritten paragraph, nothing else."
    : "Rewrite the full text below. Return ONLY the rewritten text, with no preamble, explanations, or markdown formatting.";

  return `You are an expert editor and writing coach. Your task is to humanize the following text so it reads as if written by a skilled human writer, not an AI.

${levelInstructions[level] || levelInstructions.balanced}
${goalInstructions[goal] || goalInstructions.natural}

Tone: ${tone}. Audience: ${audience}. Reading level: ${readingLevel}.

STRICT RULES:
- Preserve ALL of the following: ${preservation.length > 0 ? preservation.join(", ") : "facts, names, dates, numbers, and meaning"}.
- Do NOT invent facts, change numbers, alter names, or remove citations.
- Do NOT simply swap synonyms; restructure sentences and vary phrasing.
- Do NOT add labels like [faithful], [natural], or [concise].
- ${englishVariant}
- ${contractions}
${protectedWords}
${wordsToAvoid}
${preferredTerms}
${brandVoice}
${extra}
${transformations.length > 0 ? "Also: " + transformations.join("; ") + "." : ""}

${scopeInstruction}`;
}

async function rewriteText(originalText: string, settings: any): Promise<string> {
  const goal = settings.goal || "natural";
  const scope = settings.scope || "full";
  const prompt = buildPrompt(originalText, settings, goal, scope);
  const result = await callLLMWithRetries(prompt, originalText);

  return result
    .replace(/^["']|["']$/g, "")
    .replace(/^(Here is|Here's|Rewritten text:|Humanized version:)/im, "")
    .trim();
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateAlternativeQuality(label: string, original: string, rewritten: string, settings: any, similarity: number) {
  const cleanOriginal = original.trim();
  const cleanRewritten = rewritten.trim();

  if (!cleanRewritten || cleanRewritten.length === 0) {
    throw new Error(`${label}: empty output`);
  }

  if (cleanOriginal === cleanRewritten) {
    throw new Error(`${label}: output unchanged`);
  }

  // Type-aware minimum-change thresholds. Most Faithful is expected to stay close to the original;
  // Most Concise can be much shorter but must preserve every claim.
  const baseThresholds: Record<string, number> = {
    light: 10,
    balanced: 20,
    strong: 35,
    advanced: 45,
    custom: 25
  };
  const baseMinChange = baseThresholds[settings.level || "balanced"] || 20;

  const typeMinChange: Record<string, number> = {
    "Most Faithful": Math.min(baseMinChange, 5),
    "Most Natural": baseMinChange,
    "Most Concise": Math.min(baseMinChange, 10)
  };
  const minChange = typeMinChange[label] ?? baseMinChange;

  if (similarity > 100 - minChange && cleanOriginal !== cleanRewritten) {
    throw new Error(`${label}: output too similar (${similarity.toFixed(1)}% similar)`);
  }

  // Concise must not be truncated or incomplete
  if (label === "Most Concise") {
    const origWords = cleanOriginal.split(/\s+/).filter(Boolean).length;
    const newWords = cleanRewritten.split(/\s+/).filter(Boolean).length;
    if (origWords > 20 && newWords < origWords * 0.5) {
      throw new Error(`${label}: output appears truncated or too short`);
    }
  }
}

function areAlternativesDistinct(texts: string[]): boolean {
  if (texts.length < 2) return true;
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const sim = calculateSimilarity(texts[i], texts[j]);
      if (sim >= 90) return false;
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Text analysis and scoring (legacy helpers preserved)
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function wordSet(text: string): Set<string> {
  return new Set(normalizeText(text).split(" ").filter(w => w.length > 2));
}

function calculateSimilarity(original: string, rewritten: string): number {
  if (!original || !rewritten) return 0;
  const s1 = normalizeText(original);
  const s2 = normalizeText(rewritten);
  if (s1 === s2) return 100;

  const words1 = s1.split(" ").filter(Boolean);
  const words2 = s2.split(" ").filter(Boolean);
  if (words1.length === 0 || words2.length === 0) return 0;

  const set1 = new Set(words1);
  const set2 = new Set(words2);
  let common = 0;
  for (const w of set1) {
    if (set2.has(w)) common++;
  }

  return Math.min(100, Math.round((common / Math.max(set1.size, set2.size)) * 100));
}

function jaccardSimilarity(original: string, rewritten: string): number {
  const set1 = wordSet(original);
  const set2 = wordSet(rewritten);
  if (set1.size === 0 && set2.size === 0) return 100;
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return Math.round((intersection.size / union.size) * 100);
}

function lexicalDiversity(text: string): number {
  const words = normalizeText(text).split(" ").filter(Boolean);
  const unique = new Set(words);
  if (words.length === 0) return 0;
  return Math.round((unique.size / words.length) * 100);
}

function detectPredictablePatterns(text: string): string[] {
  const patterns: string[] = [];
  const openings = ["in conclusion", "furthermore", "moreover", "therefore", "however", "additionally", "it is important to note", "it should be noted"];
  const lower = text.toLowerCase();
  for (const o of openings) {
    if (lower.includes(o)) patterns.push(`Contains "${o}"`);
  }
  return patterns;
}

function extractProtectedItems(original: string, rewritten: string): any[] {
  const items: any[] = [];
  const numberRegex = /\b\d+(?:\.\d+)?%?\b/g;
  const urlRegex = /https?:\/\/[^\s]+/g;
  const dateRegex = /\b(?:\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:,\s+\d{4})?)\b/gi;

  const originalNumbers = original.match(numberRegex) || [];
  const rewrittenNumbers = rewritten.match(numberRegex) || [];
  if (originalNumbers.length > 0) {
    items.push({ type: "numbers", original: originalNumbers, present: rewrittenNumbers, status: arraysEqual(originalNumbers, rewrittenNumbers) ? "preserved" : "check" });
  }

  const originalUrls = original.match(urlRegex) || [];
  const rewrittenUrls = rewritten.match(urlRegex) || [];
  if (originalUrls.length > 0) {
    items.push({ type: "urls", original: originalUrls, present: rewrittenUrls, status: arraysEqual(originalUrls, rewrittenUrls) ? "preserved" : "check" });
  }

  const originalDates = original.match(dateRegex) || [];
  const rewrittenDates = rewritten.match(dateRegex) || [];
  if (originalDates.length > 0) {
    items.push({ type: "dates", original: originalDates, present: rewrittenDates, status: arraysEqual(originalDates, rewrittenDates) ? "preserved" : "check" });
  }

  return items;
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, i) => val === sortedB[i]);
}

function verifyIntegrity(original: string, rewritten: string): any {
  const protectedItems = extractProtectedItems(original, rewritten);
  const issues: string[] = [];

  for (const item of protectedItems) {
    if (item.status !== "preserved") {
      issues.push(`Check ${item.type}: original count ${item.original.length}, new count ${item.present.length}`);
    }
  }

  const originalNegations = (original.match(/\b(not|no|never|none|nothing|nowhere|neither|nor)\b/gi) || []).length;
  const rewrittenNegations = (rewritten.match(/\b(not|no|never|none|nothing|nowhere|neither|nor)\b/gi) || []).length;
  if (Math.abs(originalNegations - rewrittenNegations) > 1) {
    issues.push("Negation count changed significantly; verify meaning preserved.");
  }

  const similarity = calculateSimilarity(original, rewritten);
  const meaningPreservation = Math.max(60, 100 - Math.max(0, similarity - 30) / 2);

  return {
    meaning_preservation_score: Math.round(meaningPreservation),
    factual_integrity: issues.length === 0 ? "High" : "Check Required",
    naturalness: "Improved",
    protected_items: protectedItems,
    issues
  };
}

function generateScores(original: string, rewritten: string): any {
  const similarity = calculateSimilarity(original, rewritten);
  const jaccard = jaccardSimilarity(original, rewritten);
  const changePercent = Math.max(0, 100 - similarity);
  const diversityBefore = lexicalDiversity(original);
  const diversityAfter = lexicalDiversity(rewritten);
  const patternsBefore = detectPredictablePatterns(original).length;
  const patternsAfter = detectPredictablePatterns(rewritten).length;

  const meaningPreservation = Math.max(60, 100 - Math.max(0, similarity - 30) / 2);
  const naturalness = Math.min(100, 65 + changePercent * 0.4 + (diversityAfter - diversityBefore) * 0.2);
  const aiSignalAfter = Math.max(5, Math.min(85, 85 - changePercent * 0.6 - (patternsBefore - patternsAfter) * 3));

  return {
    humanization_score: Math.min(100, Math.round(60 + changePercent * 0.5)),
    meaning_preservation_score: Math.round(meaningPreservation),
    naturalness_score: Math.round(naturalness),
    readability_score: Math.round(70 + Math.min(25, changePercent * 0.3)),
    grammar_score: 96,
    coherence_score: Math.round(75 + Math.min(20, changePercent * 0.2)),
    sentence_variety_score: Math.min(100, Math.round(50 + changePercent * 0.6)),
    vocabulary_diversity_score: Math.min(100, diversityAfter),
    tone_consistency_score: Math.round(80 + Math.min(15, changePercent * 0.1)),
    originality_score: Math.min(100, Math.round(changePercent)),
    ai_signal_before: Math.round(Math.min(90, 50 + patternsBefore * 5 + (100 - diversityBefore) * 0.3)),
    ai_signal_after: Math.round(aiSignalAfter),
    confidence_level: changePercent > 25 ? "High" : "Medium",
    similarity,
    jaccard_similarity: jaccard,
    lexical_diversity_before: diversityBefore,
    lexical_diversity_after: diversityAfter,
    predictable_patterns_before: patternsBefore,
    predictable_patterns_after: patternsAfter
  };
}

function splitSentences(text: string): string[] {
  return text
    .replace(/([.!?])\s+/g, "$1\n")
    .split("\n")
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function generateSentenceChanges(original: string, humanized: string): any[] {
  const origSentences = splitSentences(original);
  const humSentences = splitSentences(humanized);
  const changes: any[] = [];

  const used = new Set<number>();
  for (let i = 0; i < origSentences.length; i++) {
    const orig = origSentences[i];
    let bestMatch = i < humSentences.length ? humSentences[i] : "";
    let bestIdx = i < humSentences.length ? i : -1;
    let bestScore = bestMatch ? calculateSimilarity(orig, bestMatch) : 0;

    if (bestScore < 80) {
      for (let j = 0; j < humSentences.length; j++) {
        if (used.has(j)) continue;
        const score = calculateSimilarity(orig, humSentences[j]);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = humSentences[j];
          bestIdx = j;
        }
      }
    }

    if (bestIdx >= 0) used.add(bestIdx);

    const similarity = calculateSimilarity(orig, bestMatch);
    const isUnchanged = orig === bestMatch || similarity > 95;
    const isRestructured = similarity < 60;
    const changeType = isUnchanged ? "Unchanged" : (isRestructured ? "Sentence Restructuring" : "Vocabulary Update");

    changes.push({
      original_sentence: orig,
      humanized_sentence: bestMatch || "[removed]",
      change_type: changeType,
      reason: isUnchanged
        ? "Preserved for factual integrity or already natural enough"
        : (isRestructured
          ? "Restructured to reduce AI-like patterns and improve flow"
          : "Word and phrasing adjustments for naturalness"),
      confidence: isUnchanged ? "High" : (isRestructured ? "High" : "Medium"),
      similarity,
      meaning_preservation_confidence: isUnchanged ? 100 : Math.round(100 - Math.max(0, (100 - similarity - 30)) / 2),
      naturalness_improvement: isUnchanged ? "0" : `+${Math.round(100 - similarity) / 2}`,
      readability_change: isUnchanged ? "None" : "Improved",
      grammar_issues_fixed: 0,
      ai_signals_reduced: isUnchanged ? [] : ["Predictable phrasing"]
    });
  }

  for (let j = 0; j < humSentences.length; j++) {
    if (!used.has(j)) {
      changes.push({
        original_sentence: "[added]",
        humanized_sentence: humSentences[j],
        change_type: "Added",
        reason: "New sentence added for flow or clarity",
        confidence: "Medium",
        similarity: 0,
        meaning_preservation_confidence: 80,
        naturalness_improvement: "+",
        readability_change: "Improved",
        grammar_issues_fixed: 0,
        ai_signals_reduced: []
      });
    }
  }

  return changes;
}
