import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const { reference } = await req.json();
    
    if (!reference) {
      throw new Error('Reference is required');
    }

    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message);
    }

    if (data.data.status === 'success') {
      const metadata = data.data.metadata || {};
      const paidAmount = Number(data.data.amount || 0);
      const reference = String(data.data.reference || '');

      // ── Amount + plan verification against the server-side catalog ──
      // A successful payment of ANY amount must NOT grant a plan unless
      // the paid amount matches the catalog price for the claimed plan.
      const plan = String(metadata.plan || '').toLowerCase();
      const interval = String(metadata.interval || 'month').toLowerCase() === 'year' ? 'year' : 'month';

      const admin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: priceRows } = await admin
        .from('plan_prices')
        .select('amount_cents, credits')
        .eq('plan', plan)
        .eq('billing_interval', interval)
        .eq('is_active', true)
        .maybeSingle();

      const planOk = !!priceRows && paidAmount >= Number(priceRows.amount_cents);
      const grantable = planOk && (metadata.type === 'upgrade' || metadata.type === 'subscription') && metadata.user_id;

      if (grantable) {
        // Idempotency: one completed order per payment reference.
        const { data: existingOrder } = await admin
          .from('orders')
          .select('id, status')
          .eq('paystack_reference', reference)
          .eq('status', 'completed')
          .maybeSingle();

        if (!existingOrder) {
          const grantUserId = metadata.user_id;
          const planCredits = Number(priceRows!.credits);
          const now = new Date();
          const planEndDate = new Date(now);
          if (interval === 'year') planEndDate.setFullYear(planEndDate.getFullYear() + 1);
          else planEndDate.setMonth(planEndDate.getMonth() + 1);

          const { error: orderErr } = await admin.from('orders').insert({
            user_id: grantUserId,
            items: [{ plan, interval }],
            total_amount: paidAmount / 100,
            currency: data.data.currency || 'USD',
            status: 'completed',
            paystack_reference: reference,
            completed_at: now.toISOString(),
            metadata: { plan, interval, gateway: 'paystack', reference },
          });
          if (!orderErr) {
            await admin.from('profiles').update({
              subscription_plan: plan,
              subscription_status: 'Active',
              plan_start_date: now.toISOString(),
              plan_end_date: planEndDate.toISOString(),
              credits_balance: planCredits,
            }).eq('id', grantUserId);
            await admin.from('usage_ledger').insert({
              user_id: grantUserId,
              feature_slug: 'subscription_credit_grant',
              operation: 'grant',
              credits_amount: planCredits,
              outcome: 'success',
              metadata: { plan, interval, gateway: 'paystack', reference },
            }).then(undefined, () => {});
          }
        }
      }

      return new Response(JSON.stringify({ data: { verified: true, plan_granted: grantable, metadata } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ data: { verified: false } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

  } catch (error: any) {
    return new Response(JSON.stringify({ error: { message: error?.message || 'Verification failed' } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});