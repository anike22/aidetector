import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const payload = await req.json();

    // Verify it's a resend inbound payload
    const { type, data } = payload;
    if (type === 'email.received') {
        const { from, to, subject, html, text, created_at, message_id } = data;
        
        await supabase.from('email_inbound_messages').insert([{
            from_email: from,
            to_email: to,
            subject: subject,
            html_body: html,
            text_body: text,
            provider_message_id: message_id,
            status: 'open'
        }]);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error("Webhook error", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
