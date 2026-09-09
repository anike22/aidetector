import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const { email, metadata } = await req.json();

    if (!email) {
      throw new Error('Email is required for Paystack checkout');
    }

    // ── Server-side price authorization ─────────────────────────────────
    // The client supplies ONLY plan + interval. The amount comes from the
    // server-side catalog (plan_prices) and is verified again on
    // verify-paystack-payment — client-supplied amounts are ignored.
    const plan = String(metadata?.plan || '').toLowerCase();
    const interval = String(metadata?.interval || 'month').toLowerCase() === 'year' ? 'year' : 'month';
    if (!plan) {
      throw new Error('Plan is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: priceRows, error: priceErr } = await admin
      .from('plan_prices')
      .select('amount_cents, currency, credits')
      .eq('plan', plan)
      .eq('billing_interval', interval)
      .eq('is_active', true)
      .maybeSingle();
    if (priceErr || !priceRows) {
      throw new Error(`No price configured for plan '${plan}' (${interval})`);
    }

    // Resolve the authenticated buyer so the grant is bound to THIS user
    // (metadata-supplied user ids are untrusted).
    const token = authHeader.replace('Bearer ', '').trim();
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) throw new Error('Valid user session required');

    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }

    const payload = {
      email,
      amount: priceRows.amount_cents, // Paystack expects lowest denomination
      currency: (priceRows.currency || 'usd').toUpperCase() === 'USD' ? 'USD' : priceRows.currency.toUpperCase(),
      callback_url: `${req.headers.get('origin')}/payment-success`, // Redirect here after payment
      metadata: {
        type: (metadata?.type === 'upgrade' ? 'upgrade' : 'subscription'),
        plan,
        interval,
        user_id: user.id, // server-resolved; never client-supplied
      }
    };

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message);
    }

    return new Response(JSON.stringify({ data: { url: data.data.authorization_url } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: { message: error?.message || 'Checkout failed' } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});