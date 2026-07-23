import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export interface SendEmailOptions {
  supabase: any;
  recipient: string;
  subject: string;
  html: string;
  text?: string;
  type: string;
  template_name?: string;
  userId?: string;
  metadata?: any;
}

export async function sendEmail({ supabase, recipient, subject, html, text, type, template_name, userId, metadata }: SendEmailOptions) {
  // Get Resend settings
  const { data: settings } = await supabase.from('email_settings').select('*').limit(1).single();
  if (!settings || !settings.resend_api_key) {
    throw new Error("Resend not configured in email_settings");
  }

  // Create log entry
  const { data: log } = await supabase.from('email_logs').insert([{
    recipient: recipient,
    recipient_email: recipient, // keep for backward compatibility
    user_id: userId || null,
    subject: subject,
    template_name: template_name || 'custom',
    email_type: type,
    status: 'sending',
    provider: 'resend',
    metadata: metadata || {}
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
        to: recipient,
        subject: subject,
        html: html,
        text: text || "Please view this email in an HTML-compatible client.",
        reply_to: settings.reply_to_email || undefined
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      if (logId) await supabase.from('email_logs').update({ status: 'failed', error_message: errorText, updated_at: new Date().toISOString() }).eq('id', logId);
      throw new Error(`Resend error: ${errorText}`);
    } else {
      const data = await res.json();
      if (logId) await supabase.from('email_logs').update({ status: 'sent', provider_message_id: data.id, sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', logId);
      return data;
    }
  } catch (err: any) {
    if (logId) await supabase.from('email_logs').update({ status: 'failed', error_message: err.message, updated_at: new Date().toISOString() }).eq('id', logId);
    throw err;
  }
}
