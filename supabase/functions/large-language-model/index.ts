import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getTimezone, reserveEntitlement, finalizeReservation, resolveAuthUserOrGuest } from "../_shared/entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-feature-slug, x-timezone",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  let contents: unknown[];
  let tools: unknown | undefined;
  let systemInstruction: unknown | undefined;
  try {
    const body = await req.json();
    contents = body.contents;
    tools = body.tools;
    systemInstruction = body.systemInstruction;
    if (!Array.isArray(contents) || contents.length === 0) {
      throw new Error("Missing or empty contents");
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Mandatory entitlement enforcement: every LLM stream reserves and settles
  // exactly one charge. Settlement happens when the stream completes (or is
  // released if the upstream errors before/while streaming).
  const featureSlug = req.headers.get("x-feature-slug");
  if (!featureSlug) {
    return jsonResponse({ error: "Missing x-feature-slug header" }, 400);
  }
  const llmSupabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const llmTimezone = getTimezone(req);
  const llmIdentity = await resolveAuthUserOrGuest(llmSupabase, req);
  const llmReservation = await reserveEntitlement(llmSupabase, {
    userId: llmIdentity.user?.id ?? null,
    guestId: llmIdentity.user ? null : llmIdentity.guestId,
    featureSlug,
    creditsCost: 2,
    timezone: llmTimezone,
    idempotencyKey: req.headers.get("x-idempotency-key") || null,
    metadata: { transport: "sse" },
  }).catch((err: any) => { throw new Error("Entitlement reservation failed: " + (err?.message || "unknown")); });

  if (!llmReservation.allowed) {
    return jsonResponse({
      error: llmReservation.reason || "Feature not available on your plan",
      error_code: llmReservation.errorCode || "UPGRADE_REQUIRED",
      upgrade_required: true,
      remaining: llmReservation.trialChecksRemaining,
      limit: llmReservation.trialChecksTotal,
      plan: llmReservation.plan,
    }, 403);
  }

  const upstreamBody: any = { contents };
  if (tools) upstreamBody.tools = tools;
  if (systemInstruction) upstreamBody.systemInstruction = systemInstruction;

  const upstream = await fetch(
    "https://app-c18l1vf2nz7l-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gateway-Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(upstreamBody),
    }
  );

  if (upstream.status === 429 || upstream.status === 402) {
    const errText = await upstream.text();
    await finalizeReservation(llmSupabase, {
      reservationId: llmReservation.reservationId,
      outcome: "failed",
      errorReason: `upstream_${upstream.status}`,
      timezone: llmTimezone,
    }).catch(() => {});
    return new Response(errText, {
      status: upstream.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!upstream.ok || !upstream.body) {
    await finalizeReservation(llmSupabase, {
      reservationId: llmReservation.reservationId,
      outcome: "failed",
      errorReason: `upstream_${upstream.status}`,
      timezone: llmTimezone,
    }).catch(() => {});
    return new Response(
      JSON.stringify({ error: `Upstream error: ${upstream.status}` }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Settle exactly once when the stream finishes; release on stream error.
  const reservationId = llmReservation.reservationId;
  const transform = new TransformStream({
    flush() {
      finalizeReservation(llmSupabase, {
        reservationId,
        outcome: "success",
        metadata: { transport: "sse" },
        timezone: llmTimezone,
      }).catch(() => {});
    },
    cancel() {
      finalizeReservation(llmSupabase, {
        reservationId,
        outcome: "failed",
        errorReason: "stream_cancelled",
        timezone: llmTimezone,
      }).catch(() => {});
    },
  });

  return new Response(upstream.body.pipeThrough(transform), {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
