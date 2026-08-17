import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("Webhook payload:", payload);

    if (!RESEND_API_KEY) {
      console.log("No RESEND_API_KEY provided. Skipping email send.");
      return new Response(JSON.stringify({ success: true, message: "No API key" }), { status: 200 });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
       console.log("Missing Supabase env vars");
       return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { user, email_data } = payload;

    if (!user || !email_data) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
    }

    const { email_action_type, token, token_hash, redirect_to } = email_data;

    let subject = "Your Account Verification Code";
    let html = `<p>Your verification code is: <strong>${token}</strong></p>`;

    if (email_action_type === "signup") {
      subject = "Welcome to AIDetector.cx!";
      const confirmationLink = `${redirect_to}?token_hash=${token_hash}&type=signup`;
      html = `
        <h2>Welcome to AIDetector.cx!</h2>
        <p>Please confirm your email address by clicking the link below:</p>
        <p><a href="${confirmationLink}">Confirm your email</a></p>
        <p>Or use this code: <strong>${token}</strong></p>
      `;
    } else if (email_action_type === "recovery") {
      subject = "Reset your AIDetector.cx password";
      const recoveryLink = `${redirect_to}?token_hash=${token_hash}&type=recovery`;
      html = `
        <h2>Password Recovery</h2>
        <p>Click the link below to reset your password:</p>
        <p><a href="${recoveryLink}">Reset Password</a></p>
        <p>Or use this code: <strong>${token}</strong></p>
      `;
    } else if (email_action_type === "magiclink") {
      subject = "Your magic link for AIDetector.cx";
      const magicLink = `${redirect_to}?token_hash=${token_hash}&type=magiclink`;
      html = `
        <h2>Your Magic Link</h2>
        <p>Click the link below to log in:</p>
        <p><a href="${magicLink}">Log In</a></p>
        <p>Or use this code: <strong>${token}</strong></p>
      `;
    } else if (email_action_type === "email_change") {
      subject = "Confirm your new email address";
      const link = `${redirect_to}?token_hash=${token_hash}&type=email_change`;
      html = `
        <h2>Confirm Email Change</h2>
        <p>Click the link below to confirm your new email:</p>
        <p><a href="${link}">Confirm New Email</a></p>
        <p>Or use this code: <strong>${token}</strong></p>
      `;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "AIDetector.cx <no-reply@aidetector.cx>",
        to: user.email,
        subject,
        html
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend API error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to send email" }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
