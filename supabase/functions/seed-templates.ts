import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const templates = [
  {
    name: 'Email Verification',
    subject: 'Verify Your Email Address',
    html_body: `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0f172a;">Welcome to AIDetector.cx</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="{{verification_link}}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Verify Email</a>
        <p>If you didn't create an account, you can ignore this email.</p>
        <hr style="border: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="color: #64748b; font-size: 12px;">© {{current_year}} AIDetector.cx. All rights reserved.</p>
      </div>
    `,
    type: 'authentication',
    status: 'active'
  },
  {
    name: 'Welcome Email',
    subject: 'Welcome to AIDetector.cx',
    html_body: `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0f172a;">Welcome!</h2>
        <p>We're thrilled to have you on board.</p>
        <p>You can now access your dashboard and start using our AI tools.</p>
        <a href="https://aidetector.cx/dashboard" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Go to Dashboard</a>
      </div>
    `,
    type: 'authentication',
    status: 'active'
  },
  {
    name: 'Password Reset',
    subject: 'Reset Your Password',
    html_body: `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0f172a;">Reset Password</h2>
        <p>We received a request to reset your password. Click the link below to choose a new one:</p>
        <a href="{{reset_link}}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
    type: 'authentication',
    status: 'active'
  }
];

async function seed() {
  for (const t of templates) {
    const { data: existing } = await supabase.from('email_templates').select('id').eq('name', t.name).single();
    if (!existing) {
      await supabase.from('email_templates').insert([t]);
      console.log(`Inserted ${t.name}`);
    } else {
      console.log(`${t.name} already exists.`);
    }
  }
}

seed().catch(console.error);
