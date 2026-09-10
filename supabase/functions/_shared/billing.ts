/**
 * Shared server-side billing guard for every billable edge endpoint.
 *
 * Enforces, in order:
 *  1. Resolve the authenticated account or a valid server-issued guest identity.
 *  2. Resolve the feature's configured cost from the registry (default-deny).
 *  3. Atomically reserve a trial check or paid credits BEFORE processing.
 *  4. Run processing only after successful authorization.
 *  5. Settle the charge exactly once on success; release on genuine failure.
 *
 * Fail-closed: billing system errors return a retryable 503, never access.
 */
import {
  createServiceClient,
  resolveAuthUserOrGuest,
  reserveEntitlement,
  finalizeReservation,
  getTimezone,
} from "./entitlements.ts";

export interface BillingContext {
  supabase: ReturnType<typeof createServiceClient>;
  userId: string | null;
  guestId: string | null;
  isApiKey: boolean;
  reservationId: string | null;
  isTrialCheck: boolean;
  body: Record<string, any>;
}

export interface BillingGuardOptions {
  featureSlug: string | ((body: Record<string, any>) => string);
  /** Fallback cost when the registry row lacks one (registry value wins). */
  defaultCost?: number;
  corsHeaders: Record<string, string>;
  /** 'response' (default): settle based on handler response status.
   *  'manual': the handler settles the reservation itself (e.g. SSE). */
  settleMode?: "response" | "manual";
  /** Extra metadata attached to the reservation. */
  metadata?: Record<string, unknown>;
}

function json(body: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function withBillingGuard(
  req: Request,
  opts: BillingGuardOptions,
  handler: (ctx: BillingContext) => Promise<Response>
): Promise<Response> {
  const supabase = createServiceClient();
  const timezone = getTimezone(req);

  let body: Record<string, any> = {};
  const hasBody = req.method === "POST" || req.method === "PUT" || req.method === "PATCH";
  if (hasBody) {
    try {
      const raw = await req.text();
      body = raw ? JSON.parse(raw) : {};
    } catch {
      body = {};
    }
  }

  // 1. Identity
  let userId: string | null = null;
  let guestId: string | null = null;
  let isApiKey = false;
  try {
    const identity = await resolveAuthUserOrGuest(supabase, req);
    userId = identity.user?.id ?? null;
    guestId = identity.guestId ?? null;
    isApiKey = identity.isApiKey;
  } catch (err: any) {
    console.error("[billing] identity resolution failed:", err?.message);
    return json(
      { success: false, error: "Authorization could not be established. Please retry.", retryable: true },
      503,
      opts.corsHeaders
    );
  }

  // 2+3. Atomic reservation (registry-driven cost, default-deny)
  const featureSlug = typeof opts.featureSlug === 'function' ? opts.featureSlug(body) : opts.featureSlug;
  const idempotencyKey = req.headers.get("x-idempotency-key") || null;
  let reservation;
  try {
    reservation = await reserveEntitlement(supabase, {
      userId,
      guestId,
      featureSlug,
      creditsCost: opts.defaultCost ?? 1,
      unitQuantity: Math.max(1, String(body.text ?? body.content ?? body.input ?? body.prompt ?? body.keyword ?? body.domain ?? '').trim().split(/\s+/).filter(Boolean).length),
      timezone,
      idempotencyKey,
      metadata: { ...(opts.metadata || {}), is_api_key: isApiKey },
    });
  } catch (err: any) {
    console.error("[billing] reservation failed:", err?.message);
    return json(
      { success: false, error: "Billing authorization temporarily unavailable. Please retry.", retryable: true },
      503,
      opts.corsHeaders
    );
  }

  if (!reservation.allowed) {
    return json(
      {
        success: false,
        error: reservation.reason || "This feature requires an active subscription or credits.",
        error_code: reservation.errorCode || "UPGRADE_REQUIRED",
        upgrade_required: true,
        remaining: reservation.trialChecksRemaining,
        limit: reservation.trialChecksTotal,
        plan: reservation.plan,
      },
      403,
      opts.corsHeaders
    );
  }

  // 4. Authorized processing
  const ctx: BillingContext = {
    supabase,
    userId,
    guestId,
    isApiKey,
    reservationId: reservation.reservationId,
    isTrialCheck: reservation.isTrialCheck,
    body,
  };

  let response: Response;
  try {
    response = await handler(ctx);
  } catch (err: any) {
    // 7. Genuine processing failure -> release the reservation.
    if (reservation.reservationId && opts.settleMode !== "manual") {
      await finalizeReservation(supabase, {
        reservationId: reservation.reservationId,
        outcome: "failed",
        errorReason: err?.message || "handler_error",
        timezone,
      }).catch(() => {});
    }
    return json(
      { success: false, error: err?.message || "Processing failed" },
      500,
      opts.corsHeaders
    );
  }

  if (opts.settleMode === "manual") {
    return response;
  }

  if (response.ok && response.body && response.headers.get('content-type')?.includes('text/event-stream') && reservation.reservationId) {
    return settleBillingStream(response.body, supabase, reservation.reservationId, {
      ...Object.fromEntries(response.headers),
      'x-billing-plan': reservation.plan,
      'x-trial-check': reservation.isTrialCheck ? 'true' : 'false',
      'x-trial-remaining': String(Math.max(0, reservation.trialChecksRemaining)),
      'x-credits-remaining': String(Math.max(0, reservation.remainingCredits)),
    });
  }

  // 5/6. Settle once: success keeps the charge; server errors release it.
  const outcome = response.ok ? "success" : "failed";
  if (reservation.reservationId) {
    await finalizeReservation(supabase, {
      reservationId: reservation.reservationId,
      outcome,
      errorReason: outcome === "failed" ? `http_${response.status}` : null,
      timezone,
    }).catch(() => {});
  }

  // Surface the authoritative balance to the client for consistent UX.
  const headers = new Headers(response.headers);
  headers.set("x-billing-plan", reservation.plan);
  headers.set("x-trial-check", reservation.isTrialCheck ? "true" : "false");
  headers.set("x-trial-remaining", String(Math.max(0, reservation.trialChecksRemaining)));
  headers.set("x-credits-remaining", String(Math.max(0, reservation.remainingCredits)));
  return new Response(response.body, { status: response.status, headers });
}

/** Keep the deduction for delivered output; release a stream that fails before output. */
export function settleBillingStream(body: ReadableStream<Uint8Array>, supabase: ReturnType<typeof createServiceClient>, reservationId: string, headers: Record<string,string>): Response {
  const reader = body.getReader();
  let settled = false;
  let delivered = false;
  const settle = async (outcome: 'success'|'failed') => {
    if (settled) return;
    settled = true;
    await finalizeReservation(supabase, { reservationId, outcome }).catch(console.error);
  };
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const {value,done} = await reader.read();
        if (done) { await settle(delivered ? 'success' : 'failed'); controller.close(); }
        else { delivered = true; controller.enqueue(value); }
      } catch (error) { await settle(delivered ? 'success' : 'failed'); controller.error(error); }
    },
    async cancel(reason) { try { await reader.cancel(reason); } finally { await settle(delivered ? 'success' : 'failed'); } },
  });
  return new Response(stream, {headers});
}
