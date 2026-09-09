import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { renderEmailTemplate } from "../_shared/email/renderEmailTemplate.ts";

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

    const {
      recipients,
      subject,
      html,
      text,
      type,
      template_key,
      template_id,
      preheader,
      bodyHtml,
      cta,
      isCampaign,
      unsubscribeUrl,
      testEmail,
    } = await req.json();

    if (!recipients || !recipients.length) {
      return new Response(JSON.stringify({ error: "Missing recipients" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    if (!html && !bodyHtml && !template_key && !template_id) {
      return new Response(JSON.stringify({ error: "Missing message content" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    // Get Resend settings
    const { data: settings } = await supabase.from('email_settings').select('*').limit(1).single();
    if (!settings || !settings.resend_api_key) {
        return new Response(JSON.stringify({ error: "Resend not configured" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    let successCount = 0;
    let failedCount = 0;

    for (const email of recipients) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, email')
        .eq('email', email)
        .maybeSingle();

      const recipientData: Record<string, string> = {
        email,
        first_name: profile?.first_name || '',
      };

      let finalHtml = html;
      let finalText = text;
      let finalSubject = subject;

      if (template_key || template_id || bodyHtml) {
        let template = null;
        if (template_key || template_id) {
          let query = supabase.from('email_templates').select('*');
          if (template_id) query = query.eq('id', template_id);
          else if (template_key) query = query.eq('template_key', template_key);
          const { data: tpl } = await query.single();
          template = tpl;
        }

        const rendered = renderEmailTemplate({
          template,
          subject,
          preheader,
          bodyHtml,
          recipientData,
          cta,
          isCampaign,
          unsubscribeUrl,
          settings,
        });

        if (rendered.validation.errors.length > 0) {
          failedCount++;
          await supabase.from('email_logs').insert([{
            recipient_email: email,
            recipient: email,
            subject: subject || 'Untitled',
            email_type: type || 'admin_message',
            status: 'failed',
            error_message: rendered.validation.errors.join('; ')
          }]);
          continue;
        }

        finalHtml = rendered.html;
        finalText = rendered.text;
        finalSubject = rendered.subject;
      }

      // Create log
      const { data: log } = await supabase.from('email_logs').insert([{
        recipient_email: email,
        recipient: email,
        subject: finalSubject,
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
            from: `${settings.default_from_name || settings.sender_display_name || 'AIDetector.cx'} <${settings.default_from_email}>`,
            to: email,
            subject: finalSubject,
            html: finalHtml,
            text: finalText,
            reply_to: settings.reply_to_email || settings.business_email || undefined,
            ...(testEmail ? { reply_to: settings.reply_to_email || settings.business_email || undefined } : {})
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
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
