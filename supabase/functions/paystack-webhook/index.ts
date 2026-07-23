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

    if (event.event === 'charge.success') {
      const data = event.data;
      const email = data.customer?.email;
      const amount = (data.amount / 100).toFixed(2);
      const currency = data.currency || 'USD';
      
      const { data: template } = await supabase.from('email_templates').select('*').eq('name', 'Invoice / Billing').single();
      
      let html = template?.html_body || `<p>Payment successful for ${currency} ${amount}</p>`;
      let subject = template?.subject || `Your Receipt [${data.reference}]`;
      
      html = html.replace(/\{\{invoice_id\}\}/g, data.reference)
                 .replace(/\{\{name\}\}/g, data.customer?.first_name || 'Customer')
                 .replace(/\{\{plan_name\}\}/g, data.metadata?.plan || 'Subscription')
                 .replace(/\{\{card_last4\}\}/g, data.authorization?.last4 || '****')
                 .replace(/\{\{amount_formatted\}\}/g, `${currency} ${amount}`)
                 .replace(/\{\{transaction_id\}\}/g, data.reference)
                 .replace(/\{\{transaction_date\}\}/g, new Date(data.paid_at).toLocaleDateString())
                 .replace(/\{\{frontend_url\}\}/g, Deno.env.get('CUSTOM_DOMAIN') || 'https://aidetector.cx')
                 .replace(/\{\{current_year\}\}/g, new Date().getFullYear().toString());

      subject = subject.replace(/\{\{invoice_id\}\}/g, data.reference);

      // We need to look up the user by email to get user id
      const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).limit(1).single();

      await sendEmail({
        supabase,
        recipient: email,
        subject,
        html,
        type: 'transactional',
        template_name: 'Invoice / Billing',
        userId: profile?.id
      });
      
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