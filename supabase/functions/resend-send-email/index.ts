import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({ error: "Missing Auth" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
    }
    
    // Check if admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
         return new Response(JSON.stringify({ error: "Forbidden" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 });
    }

    const { recipients, subject, html, text, type } = await req.json();

    if (!recipients || !recipients.length || !subject || !html) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    // Get Resend settings
    const { data: settings } = await supabase.from('email_settings').select('*').limit(1).single();
    if (!settings || !settings.resend_api_key) {
        return new Response(JSON.stringify({ error: "Resend not configured" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    let successCount = 0;
    let failedCount = 0;
    
    for (const email of recipients) {
      // Create log
      const { data: log } = await supabase.from('email_logs').insert([{
        recipient_email: email,
        subject,
        email_type: type || 'admin_message',
        status: 'sending'
      }]).select().single();
      
      const logId = log?.id;

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${settings.resend_api_key}`
          },
          body: JSON.stringify({
            from: `${settings.default_from_name} <${settings.default_from_email}>`,
            to: email,
            subject: subject,
            html: html,
            text: text
          })
        });

        if (!res.ok) {
          const errorText = await res.text();
          failedCount++;
          if (logId) await supabase.from('email_logs').update({ status: 'failed', error_message: errorText }).eq('id', logId);
        } else {
          const data = await res.json();
          successCount++;
          if (logId) await supabase.from('email_logs').update({ status: 'sent', provider_message_id: data.id, sent_at: new Date().toISOString() }).eq('id', logId);
        }
      } catch (err: any) {
        failedCount++;
        if (logId) await supabase.from('email_logs').update({ status: 'failed', error_message: err.message }).eq('id', logId);
      }
    }

    return new Response(JSON.stringify({ success: true, successCount, failedCount }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
