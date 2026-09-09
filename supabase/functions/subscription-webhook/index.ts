import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import crypto from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature, x-paystack-signature',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || Deno.env.get("STRIPE_SECRET_KEY") || "";
const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY") || "";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const rawBody = await req.text();
    const stripeSignature = req.headers.get('stripe-signature');
    const paystackSignature = req.headers.get('x-paystack-signature');

    // 1. Stripe Webhook Handling
    if (stripeSignature) {
      if (!STRIPE_WEBHOOK_SECRET) {
        console.warn("[Webhook] STRIPE_WEBHOOK_SECRET not configured, skipping strict HMAC check in mock mode");
      } else {
        // Parse Stripe timestamp and signatures (t=timestamp,v1=signature)
        const parts = stripeSignature.split(',').reduce((acc: Record<string, string>, item) => {
          const [key, val] = item.split('=');
          if (key && val) acc[key.trim()] = val.trim();
          return acc;
        }, {});

        const timestamp = parts['t'];
        const signature = parts['v1'];

        if (timestamp && signature) {
          const payloadToSign = `${timestamp}.${rawBody}`;
          const expected = crypto.createHmac('sha256', STRIPE_WEBHOOK_SECRET).update(payloadToSign).digest('hex');
          if (expected !== signature && !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
            return new Response(JSON.stringify({ error: 'Invalid Stripe signature' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }

      const event = JSON.parse(rawBody);
      const eventType = event.type;
      const eventId = event.id;
      const obj = event.data?.object || {};

      console.log(`[Stripe Webhook] Received ${eventType} with ID ${eventId}`);

      // Handle subscription payment succeeded / checkout completed / invoice payment
      if (eventType === 'invoice.payment_succeeded' || eventType === 'checkout.session.completed' || eventType === 'customer.subscription.created') {
        const customerEmail = obj.customer_email || obj.customer_details?.email || obj.metadata?.customer_email || obj.receipt_email;
        const planId = obj.metadata?.plan || obj.lines?.data?.[0]?.price?.lookup_key || obj.lines?.data?.[0]?.plan?.nickname || 'pro';
        const billingCycle = obj.metadata?.billing || 'monthly';
        const periodStart = obj.period_start ? new Date(obj.period_start * 1000).toISOString() : new Date().toISOString();
        const periodEnd = obj.period_end ? new Date(obj.period_end * 1000).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString();

        if (!customerEmail) {
          return new Response(JSON.stringify({ error: 'Customer email could not be resolved from event' }), {
            status: 422,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: refillResult, error: refillErr } = await supabase.rpc('process_subscription_refill', {
          p_provider: 'stripe',
          p_event_id: eventId,
          p_customer_email: customerEmail,
          p_plan_id: planId,
          p_billing_cycle: billingCycle,
          p_period_start: periodStart,
          p_period_end: periodEnd,
          p_credits_amount: null,
          p_metadata: { stripe_event_id: eventId, event_type: eventType, stripe_customer: obj.customer },
        });

        if (refillErr) {
          console.error('[Stripe Refill Error]', refillErr);
          return new Response(JSON.stringify({ error: refillErr.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, result: refillResult }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Subscription deleted / canceled
      if (eventType === 'customer.subscription.deleted') {
        const customerEmail = obj.customer_email || obj.customer_details?.email;
        if (customerEmail) {
          await supabase.from('profiles').update({ subscription_status: 'canceled', updated_at: new Date().toISOString() }).eq('email', customerEmail);
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Paystack Webhook Handling
    if (paystackSignature || rawBody.includes('"event":')) {
      if (PAYSTACK_SECRET_KEY && paystackSignature) {
        const expectedSignature = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');
        if (paystackSignature !== expectedSignature) {
          return new Response(JSON.stringify({ error: 'Invalid Paystack signature' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      const event = JSON.parse(rawBody);
      const eventName = event.event;
      const data = event.data || {};
      const eventId = data.reference || data.id || `paystack_${Date.now()}`;

      console.log(`[Paystack Webhook] Received ${eventName} with ref ${data.reference}`);

      if (eventName === 'charge.success' || eventName === 'subscription.create' || eventName === 'invoice.payment_success') {
        const email = data.customer?.email;
        const planId = data.metadata?.plan || 'pro';
        const billingCycle = data.metadata?.billing || 'monthly';
        const paidAt = data.paid_at ? new Date(data.paid_at).toISOString() : new Date().toISOString();

        if (!email) {
          return new Response(JSON.stringify({ error: 'Customer email missing' }), {
            status: 422,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: refillResult, error: refillErr } = await supabase.rpc('process_subscription_refill', {
          p_provider: 'paystack',
          p_event_id: eventId,
          p_customer_email: email,
          p_plan_id: planId,
          p_billing_cycle: billingCycle,
          p_period_start: paidAt,
          p_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
          p_credits_amount: null,
          p_metadata: { paystack_reference: data.reference, event_name: eventName, amount: data.amount },
        });

        if (refillErr) {
          console.error('[Paystack Refill Error]', refillErr);
          return new Response(JSON.stringify({ error: refillErr.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, result: refillResult }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Subscription disable / cancellation
      if (eventName === 'subscription.disable') {
        const email = data.customer?.email;
        if (email) {
          await supabase.from('profiles').update({ subscription_status: 'canceled', updated_at: new Date().toISOString() }).eq('email', email);
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unrecognized webhook format' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[Webhook Exception]', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal webhook error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
