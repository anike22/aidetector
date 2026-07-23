import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sendEmail } from "../_shared/email/sendEmail.ts";

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
    const { action, email, password } = await req.json();

    let origin = req.headers.get('origin') || req.headers.get('referer');
    if (origin) {
      try { origin = new URL(origin).origin; } catch (e) { origin = null; }
    }
    const frontendUrl = Deno.env.get('CUSTOM_DOMAIN') || origin || 'https://aidetector.cx';

    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    if (action === 'signup') {
      if (!password) {
        return new Response(JSON.stringify({ error: "Password required" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      }

      // Generate signup link
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email,
        password,
        options: {
          redirectTo: `${frontendUrl}/login?verified=true`
        }
      });

      if (linkError) throw linkError;
      
      const hashedToken = linkData.properties?.hashed_token || linkData.properties?.token_hash;
      const verificationLink = hashedToken ? `${frontendUrl}/login?verified=true&token_hash=${hashedToken}&type=signup` : linkData.properties.action_link;
      const user = linkData.user;

      // Get template
      let { data: template } = await supabase.from('email_templates').select('*').eq('name', 'Email Verification').single();
      
      let html = template?.html_body || `<p>Please verify your email: <a href="${verificationLink}">Verify Email</a></p>`;
      let subject = template?.subject || "Verify Your Email Address";
      
      html = html.replace(/\{\{verification_link\}\}/g, verificationLink)
                 .replace(/\{\{email\}\}/g, email)
                 .replace(/\{\{frontend_url\}\}/g, frontendUrl)
                 .replace(/\{\{current_year\}\}/g, new Date().getFullYear().toString());
                 
      await sendEmail({
        supabase,
        recipient: email,
        subject,
        html,
        type: 'authentication',
        template_name: 'Email Verification',
        userId: user?.id
      });

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } else if (action === 'reset_password') {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: `${frontendUrl}/reset-password/confirm`
        }
      });

      if (linkError) throw linkError;

      const hashedToken = linkData.properties.hashed_token;
      const resetLink = `${frontendUrl}/reset-password/confirm?token_hash=${hashedToken}&type=recovery`;
      const user = linkData.user;

      let { data: template } = await supabase.from('email_templates').select('*').eq('name', 'Password Reset').single();
      
      let html = template?.html_body || `<p>Reset your password: <a href="${resetLink}">Reset Password</a></p>`;
      let subject = template?.subject || "Reset Your Password";
      
      html = html.replace(/\{\{reset_link\}\}/g, resetLink)
                 .replace(/\{\{reset_password_url\}\}/g, resetLink)
                 .replace(/\{\{email\}\}/g, email)
                 .replace(/\{\{frontend_url\}\}/g, frontendUrl)
                 .replace(/\{\{current_year\}\}/g, new Date().getFullYear().toString());

      await sendEmail({
        supabase,
        recipient: email,
        subject,
        html,
        type: 'authentication',
        template_name: 'Password Reset',
        userId: user?.id
      });

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });

  } catch (error) {
    console.error("Auth Proxy Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
