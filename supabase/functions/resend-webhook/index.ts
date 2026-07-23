import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const payload = await req.json();

    const { type, data } = payload;
    if (!type || !data || !data.email_id) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
    }

    const messageId = data.email_id;
    const timestamp = data.created_at;

    let updateData: any = {};
    if (type === 'email.delivered') {
      updateData = { status: 'delivered', delivered_at: timestamp };
    } else if (type === 'email.bounced') {
      updateData = { status: 'bounced', bounced_at: timestamp };
    } else if (type === 'email.complained') {
      updateData = { status: 'complained', complained_at: timestamp };
    } else if (type === 'email.opened') {
      updateData = { status: 'opened', opened_at: timestamp };
    } else if (type === 'email.clicked') {
      updateData = { status: 'clicked', clicked_at: timestamp };
    }

    if (Object.keys(updateData).length > 0) {
      // Find log by provider_message_id
      const { data: log } = await supabase.from('email_logs').select('id, recipient_email').eq('provider_message_id', messageId).single();
      
      if (log) {
        await supabase.from('email_logs').update(updateData).eq('id', log.id);
        
        // Update user preference if bounced or complained
        if (type === 'email.bounced' || type === 'email.complained') {
          // get user ID from email if possible
           const { data: profile } = await supabase.from('profiles').select('id').eq('email', log.recipient_email).single();
           if (profile) {
              await supabase.from('user_email_preferences').upsert({
                user_id: profile.id,
                bounced: type === 'email.bounced' ? true : undefined,
                complained: type === 'email.complained' ? true : undefined,
                updated_at: new Date().toISOString()
              });
           }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error("Webhook error", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
