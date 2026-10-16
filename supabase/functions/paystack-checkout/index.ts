import { createClient } from "npm:@supabase/supabase-js@2.103.1";

import { billingInterval } from "../_shared/billing-interval.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const { email, metadata } = await req.json();

    if (!email) {
      throw new Error("Email is required for Paystack checkout");
    }

    // ── Server-side price authorization ─────────────────────────────────
    // The client supplies ONLY plan + interval. The amount comes from the
    // server-side catalog (plan_prices) and is verified again on
    // verify-paystack-payment — client-supplied amounts are ignored.
    const plan = String(metadata?.plan || "").toLowerCase();
    const interval = billingInterval(metadata);
    if (!plan) {
      throw new Error("Plan is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: priceRows, error: priceErr } = await admin
      .from("plan_prices")
      .select("amount_cents, currency, credits")
      .eq("plan", plan)
      .eq("billing_interval", interval)
      .eq("is_active", true)
      .maybeSingle();
    if (priceErr || !priceRows) {
      throw new Error(`No price configured for plan '${plan}' (${interval})`);
    }

    // Resolve the authenticated buyer so the grant is bound to THIS user
    // (metadata-supplied user ids are untrusted).
    const token = authHeader.replace("Bearer ", "").trim();
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) throw new Error("Valid user session required");

    const { data: current } = await admin.from("profiles")
      .select("subscription_plan,subscription_status,plan_end_date")
      .eq("id", user.id).maybeSingle();
    const ranks: Record<string, number> = {
      free: 1,
      pro: 2,
      pro_plus: 3,
      "pro+": 3,
      business: 4,
      enterprise: 5,
    };
    const currentPlan = String(current?.subscription_plan || "free")
      .toLowerCase();
    const currentActive =
      ["active", "trialing", "cancelled", "canceled"].includes(
        String(current?.subscription_status || "").toLowerCase(),
      ) &&
      !!current?.plan_end_date && new Date(current.plan_end_date) > new Date();
    if (currentActive && (ranks[plan] || -1) < (ranks[currentPlan] || -1)) {
      throw new Error(
        "Downgrades can be purchased after the current paid period ends. Your existing access remains active.",
      );
    }

    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured");
    }

    const { data: quote, error: quoteError } = await admin.rpc(
      "growth_checkout_quote",
      {
        p_user_id: user.id,
        p_plan: plan,
        p_interval: interval,
        p_code: String(metadata?.offer_code || ""),
      },
    );
    if (quoteError || !quote) {
      throw new Error(
        quoteError?.message || "Unable to calculate checkout price",
      );
    }
    if (quote.access_url) {
      return new Response(JSON.stringify({ data: { url: quote.access_url } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = {
      email: user.email,
      ...(quote.reference ? { reference: quote.reference } : {}),
      amount: quote.amount_minor, // Paystack expects lowest denomination
      currency: (priceRows.currency || "usd").toUpperCase() === "USD"
        ? "USD"
        : priceRows.currency.toUpperCase(),
      callback_url: `${req.headers.get("origin")}/payment-success`, // Redirect here after payment
      metadata: {
        type: metadata?.type === "upgrade" ? "upgrade" : "subscription",
        plan,
        interval,
        billing: interval === "year" ? "annual" : "monthly",
        user_id: user.id, // server-resolved; never client-supplied
      },
    };

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message);
    }

    if (quote.reference) {
      const { error: saveError } = await admin.rpc("growth_save_checkout", {
        p_reference: quote.reference,
        p_url: data.data.authorization_url,
      });
      if (saveError) {
        throw new Error("Unable to save discounted checkout. Please retry.");
      }
    }
    return new Response(
      JSON.stringify({ data: { url: data.data.authorization_url } }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: { message: error?.message || "Checkout failed" },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
