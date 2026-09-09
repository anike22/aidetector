import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sendEmail } from "../_shared/email/sendEmail.ts";
import crypto from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify webhook signature
    const signature = req.headers.get('x-paystack-signature');
    const bodyText = await req.text();
    
    if (!signature) {
      throw new Error('No signature found in request');
    }

    // Verify the HMAC SHA512 signature using PAYSTACK_SECRET_KEY
    const expectedSignature = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(bodyText).digest('hex');
    
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    const event = JSON.parse(bodyText);

    if (event.event === 'charge.success' || event.event === 'invoice.payment_success' || event.event === 'subscription.create') {
      const data = event.data;
      const email = data.customer?.email;
      const amount = (data.amount / 100).toFixed(2);
      const currency = data.currency || 'USD';
      const planId = data.metadata?.plan || 'pro';
      const billingCycle = data.metadata?.billing || 'monthly';
      
      // Call atomic subscription refill RPC
      const { data: refillData, error: refillErr } = await supabase.rpc('process_subscription_refill', {
        p_provider: 'paystack',
        p_event_id: data.reference || `paystack_${Date.now()}`,
        p_customer_email: email,
        p_plan_id: planId,
        p_billing_cycle: billingCycle,
        p_period_start: data.paid_at ? new Date(data.paid_at).toISOString() : new Date().toISOString(),
        p_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        p_credits_amount: null,
        p_metadata: { paystack_reference: data.reference, amount: data.amount, currency }
      });

      if (refillErr) {
        console.warn('Subscription refill RPC error:', refillErr);
      }

      const { data: template } = await supabase.from('email_templates').select('*').eq('name', 'Invoice / Billing').single();
      
      let html = template?.html_body || `<p>Payment successful for ${currency} ${amount}</p>`;
      let subject = template?.subject || `Your Receipt [${data.reference}]`;
      
      html = html.replace(/\{\{invoice_id\}\}/g, data.reference)
                 .replace(/\{\{name\}\}/g, data.customer?.first_name || 'Customer')
                 .replace(/\{\{plan_name\}\}/g, planId || 'Subscription')
                 .replace(/\{\{card_last4\}\}/g, data.authorization?.last4 || '****')
                 .replace(/\{\{amount_formatted\}\}/g, `${currency} ${amount}`)
                 .replace(/\{\{transaction_id\}\}/g, data.reference)
                 .replace(/\{\{transaction_date\}\}/g, new Date(data.paid_at || Date.now()).toLocaleDateString())
                 .replace(/\{\{frontend_url\}\}/g, Deno.env.get('CUSTOM_DOMAIN') || 'https://aidetector.cx')
                 .replace(/\{\{current_year\}\}/g, new Date().getFullYear().toString());

      subject = subject.replace(/\{\{invoice_id\}\}/g, data.reference);

      // Look up user
      const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).limit(1).single();

      if (profile?.id) {
        await sendEmail({
          supabase,
          recipient: email,
          subject,
          html,
          type: 'transactional',
          template_name: 'Invoice / Billing',
          userId: profile.id
        });
      }
      
    } else if (event.event === 'charge.failed') {
      const data = event.data;
      const email = data.customer?.email;
      const amount = (data.amount / 100).toFixed(2);
      const currency = data.currency || 'USD';

      const { data: template } = await supabase.from('email_templates').select('*').eq('name', 'Payment Failed').single();
      
      let html = template?.html_body || `<p>Payment failed for ${currency} ${amount}</p>`;
      let subject = template?.subject || `Action Required: Your payment failed to process`;
      
      html = html.replace(/\{\{name\}\}/g, data.customer?.first_name || 'Customer')
                 .replace(/\{\{plan_name\}\}/g, data.metadata?.plan || 'Subscription')
                 .replace(/\{\{amount_formatted\}\}/g, `${currency} ${amount}`)
                 .replace(/\{\{card_last4\}\}/g, data.authorization?.last4 || '****')
                 .replace(/\{\{frontend_url\}\}/g, Deno.env.get('CUSTOM_DOMAIN') || 'https://aidetector.cx')
                 .replace(/\{\{current_year\}\}/g, new Date().getFullYear().toString());

      const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).limit(1).single();

      await sendEmail({
        supabase,
        recipient: email,
        subject,
        html,
        type: 'transactional',
        template_name: 'Payment Failed',
        userId: profile?.id
      });
    }

    return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error) {
    console.error("Paystack Webhook Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
  }
});