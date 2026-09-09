import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14.0.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function ok(data: any): Response {
    return new Response(
        JSON.stringify({ code: "SUCCESS", message: "ok", data }),
        {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders }
        }
    );
}

function fail(msg: string, code = 400): Response {
    return new Response(
        JSON.stringify({ code: "FAIL", message: msg }),
        {
            status: code,
            headers: { "Content-Type": "application/json", ...corsHeaders }
        }
    );
}

Deno.serve(async (req) => {
    try {
        if (req.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }
        if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

        const { sessionId } = await req.json();
        if (!sessionId) throw new Error("Missing session_id parameter");

        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "sk_test_mock";
        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: "2023-10-16",
        });

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== "paid") {
            return ok({
                verified: false,
                status: session.payment_status,
                sessionId: session.id,
            });
        }

        const { data: order, error: fetchError } = await supabase
            .from("orders")
            .select("id, status, metadata, user_id")
            .eq("stripe_session_id", sessionId)
            .single();

        if (fetchError || !order) {
            throw new Error("Order not found");
        }

        let orderUpdated = true;
        if (order.status === "pending") {
            const { error } = await supabase
                .from("orders")
                .update({
                    status: "completed",
                    completed_at: new Date().toISOString(),
                    customer_email: session.customer_details?.email,
                    customer_name: session.customer_details?.name,
                    stripe_payment_intent_id: session.payment_intent as string,
                })
                .eq("id", order.id);

            if (error) {
                console.error("Failed to update order:", error);
                orderUpdated = false;
            } else {
                // Post-payment subscription activation and entitlement unlock
                const meta = order.metadata || {};
                const stripeMeta = session.metadata || {};
                let orderMetadata = meta;
                try {
                    if (typeof stripeMeta.order_metadata === 'string') {
                        orderMetadata = JSON.parse(stripeMeta.order_metadata);
                    }
                } catch {
                    orderMetadata = meta;
                }

                // ── Server-side catalog verification ─────────────────────
                // The plan comes from order metadata, but the PAID AMOUNT
                // must match the catalog price. A session that paid any
                // other amount grants nothing.
                const plan = (orderMetadata.plan || '').toLowerCase();
                const interval = (orderMetadata.interval || 'month').toLowerCase() === 'year' ? 'year' : 'month';
                const { data: priceRow } = await supabase
                    .from('plan_prices')
                    .select('amount_cents, credits')
                    .eq('plan', plan)
                    .eq('billing_interval', interval)
                    .eq('is_active', true)
                    .maybeSingle();
                const paidCents = Number(session.amount_total ?? 0);
                if (!priceRow || paidCents < Number(priceRow.amount_cents)) {
                    // Amount mismatch: do not grant. Mark order completed
                    // (payment did happen) but skip the entitlement grant.
                    await supabase
                        .from('orders')
                        .update({ metadata: { ...orderMetadata, grant_skipped: 'amount_mismatch' } })
                        .eq('id', order.id);
                    return ok({
                        verified: true,
                        granted: false,
                        reason: 'amount_mismatch',
                        sessionId: session.id,
                    });
                }
                const normalizedPlan = plan;

                const now = new Date();
                const planEndDate = new Date(now);
                if (interval === 'year') {
                    planEndDate.setFullYear(planEndDate.getFullYear() + 1);
                } else {
                    planEndDate.setMonth(planEndDate.getMonth() + 1);
                }

                const planCredits = Number(priceRow.credits);

                await supabase
                    .from('profiles')
                    .update({
                        subscription_plan: normalizedPlan,
                        subscription_status: 'Active',
                        plan_start_date: now.toISOString(),
                        plan_end_date: planEndDate.toISOString(),
                        credits_balance: planCredits,
                    })
                    .eq('id', order.user_id);

                // Record initial grant in usage ledger
                await supabase.from('usage_ledger').insert({
                    user_id: order.user_id,
                    feature_slug: 'subscription_credit_grant',
                    operation: 'grant',
                    credits_amount: planCredits,
                    outcome: 'success',
                    metadata: { plan: normalizedPlan, order_id: order.id, session_id: session.id },
                }).catch(() => {});

                await supabase.auth.admin.updateUserById(order.user_id, {
                    app_metadata: { subscription_plan: normalizedPlan, subscription_status: 'Active' },
                });

                await supabase.from('user_transactions').insert({
                    user_id: order.user_id,
                    type: 'subscription',
                    amount: (session.amount_total || 0) / 100,
                    status: 'completed',
                    notes: `${normalizedPlan} subscription activated via Stripe session ${session.id}`,
                });

                await supabase.from('behavior_events').insert({
                    user_id: order.user_id,
                    event_type: 'payment_completed',
                    event_category: 'billing',
                    event_data: { plan: normalizedPlan, interval, order_id: order.id, session_id: session.id, amount: (session.amount_total || 0) / 100, currency: session.currency },
                }).catch(() => {});
                await supabase.from('behavior_events').insert({
                    user_id: order.user_id,
                    event_type: 'subscription_activated',
                    event_category: 'billing',
                    event_data: { plan: normalizedPlan, interval, order_id: order.id, session_id: session.id },
                }).catch(() => {});
            }
        }

        const subscriptionPlan = (() => {
            const meta = order.metadata || {};
            try {
                if (typeof session.metadata?.order_metadata === 'string') {
                    return JSON.parse(session.metadata.order_metadata).plan || meta.plan || null;
                }
            } catch { /* ignore */ }
            return meta.plan || null;
        })();

        return ok({
            verified: true,
            status: "paid",
            sessionId: session.id,
            paymentIntentId: session.payment_intent,
            amount: session.amount_total,
            currency: session.currency,
            customerEmail: session.customer_details?.email,
            customerName: session.customer_details?.name,
            orderUpdated,
            metadata: order.metadata,
            subscriptionPlan,
            subscriptionStatus: 'active'
        });
    } catch (error) {
        console.error("Payment verification failed:", error);
        return fail(error instanceof Error ? error.message : "Payment verification failed", 500);
    }
});
