import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = "https://hzjnrmxwzkeaodvusszx.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6am5ybXh3emtlYW9kdnVzc3p4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDMwNzA5MCwiZXhwIjoyMDk1ODgzMDkwfQ.ZOO5fkOJihZQP1mKO1yEll-571xbCcb2JU4nNLlZwOI";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BRAND_COLOR = "#0f172a";
const ACCENT_COLOR = "#3b82f6";
const TEXT_COLOR = "#334155";
const BG_COLOR = "#f8fafc";
const CARD_BG = "#ffffff";
const FONT_FAMILY = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const buildTemplate = (title, preheader, content, footerText = "You are receiving this email because you signed up for AIDetector.") => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: ${FONT_FAMILY}; background-color: ${BG_COLOR}; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background-color: ${CARD_BG}; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 24px; font-weight: 800; color: ${BRAND_COLOR}; letter-spacing: -0.5px; text-decoration: none; }
    .title { color: ${BRAND_COLOR}; font-size: 24px; font-weight: 700; margin: 0 0 20px 0; line-height: 1.3; }
    .text { color: ${TEXT_COLOR}; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; }
    .btn { display: inline-block; background-color: ${ACCENT_COLOR}; color: #ffffff; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px; text-align: center; margin: 10px 0; }
    .footer { text-align: center; margin-top: 32px; color: #94a3b8; font-size: 14px; line-height: 1.5; }
    .footer a { color: #94a3b8; text-decoration: underline; }
    .divider { border-top: 1px solid #e2e8f0; margin: 32px 0; border-bottom: 0; }
    .alert-box { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 24px; border-radius: 4px; }
    .alert-text { color: #991b1b; margin: 0; font-size: 15px; }
    .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .receipt-table th { text-align: left; padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500; font-size: 14px; }
    .receipt-table td { padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: ${TEXT_COLOR}; font-size: 15px; }
    .receipt-total { font-weight: 700; color: ${BRAND_COLOR}; font-size: 18px; }
    @media only screen and (max-width: 600px) {
      .container { padding: 20px 10px; }
      .card { padding: 24px; }
    }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden;">${preheader}</div>
  <div class="container" style="max-width: 600px; margin: 0 auto;">
    <div class="header">
      <a href="{{frontend_url}}" class="logo">AIDetector</a>
    </div>
    <div class="card">
      <h1 class="title">${title}</h1>
      ${content}
    </div>
    <div class="footer">
      <p>${footerText}</p>
      <p>&copy; {{current_year}} AIDetector. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

const templates = [
  {
    name: 'Email Verification',
    subject: 'Verify Your Email Address - AIDetector',
    html_body: buildTemplate(
      'Verify your email address',
      'Please verify your email address to complete your registration.',
      `
      <p class="text">Hi there,</p>
      <p class="text">Welcome to AIDetector! We're excited to have you on board. Please verify your email address to activate your account and start exploring our platform.</p>
      <div style="text-align: center;">
        <a href="{{verification_link}}" class="btn">Verify Email Address</a>
      </div>
      <p class="text" style="margin-top: 24px; font-size: 14px; color: #64748b;">Or copy and paste this link into your browser:<br><a href="{{verification_link}}" style="color: ${ACCENT_COLOR}; word-break: break-all;">{{verification_link}}</a></p>
      <p class="text" style="margin-bottom: 0;">If you didn't create an account with us, you can safely ignore this email.</p>
      `,
      'You received this email because you signed up for an AIDetector account.'
    ),
    type: 'authentication'
  },
  {
    name: 'Welcome Email',
    subject: "Welcome to AIDetector! Let's get started",
    html_body: buildTemplate(
      'Welcome to AIDetector! 👋',
      "Here's everything you need to get started with our platform.",
      `
      <p class="text">Hi {{name}},</p>
      <p class="text">We're thrilled to have you here! AIDetector provides you with the most advanced AI detection and analysis tools available.</p>
      <h3 style="color: ${BRAND_COLOR}; font-size: 18px; margin-top: 32px;">Here's how to get started:</h3>
      <ul class="text" style="padding-left: 20px;">
        <li style="margin-bottom: 12px;"><strong>Run your first scan:</strong> Try analyzing a sample text to see the detection in action.</li>
        <li style="margin-bottom: 12px;"><strong>Complete your profile:</strong> Personalize your experience in the settings.</li>
        <li style="margin-bottom: 12px;"><strong>Explore features:</strong> Check out the dashboard for all available tools.</li>
      </ul>
      <div style="text-align: center; margin-top: 32px;">
        <a href="{{frontend_url}}/dashboard" class="btn">Go to Dashboard</a>
      </div>
      <p class="text" style="margin-top: 32px;">Need help? Just reply to this email, and our support team will be happy to assist you.</p>
      `
    ),
    type: 'onboarding'
  },
  {
    name: 'Password Reset',
    subject: 'Reset Your AIDetector Password',
    html_body: buildTemplate(
      'Reset your password',
      'We received a request to reset the password for your AIDetector account.',
      `
      <p class="text">Hi there,</p>
      <p class="text">We received a request to reset the password for the AIDetector account associated with {{email}}. No changes have been made to your account yet.</p>
      <p class="text">You can reset your password by clicking the button below:</p>
      <div style="text-align: center;">
        <a href="{{reset_link}}" class="btn">Reset Password</a>
      </div>
      <p class="text" style="margin-top: 24px; font-size: 14px; color: #64748b;">Or copy and paste this link into your browser:<br><a href="{{reset_link}}" style="color: ${ACCENT_COLOR}; word-break: break-all;">{{reset_link}}</a></p>
      <p class="text" style="margin-top: 24px; margin-bottom: 0;">If you did not request a new password, you can safely ignore this email. Your password will remain unchanged.</p>
      `,
      'You received this email because a password reset was requested for your account.'
    ),
    type: 'authentication'
  },
  {
    name: 'Invoice / Billing',
    subject: 'Your AIDetector Receipt [#{{invoice_id}}]',
    html_body: buildTemplate(
      'Payment Successful',
      'Thank you for your purchase. Here is your receipt for your recent transaction.',
      `
      <p class="text">Hi {{name}},</p>
      <p class="text">Thank you for your purchase! We've successfully processed your payment. You can find the details of your transaction below.</p>
      
      <table class="receipt-table" style="margin-top: 24px;">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong style="color: ${BRAND_COLOR}; display: block; margin-bottom: 4px;">{{plan_name}}</strong>
              <span style="color: #64748b; font-size: 13px;">Billed to {{card_last4}}</span>
            </td>
            <td style="text-align: right; vertical-align: top;">{{amount_formatted}}</td>
          </tr>
          <tr>
            <td style="padding-top: 16px; border-bottom: none; font-weight: 500;">Total Paid</td>
            <td style="padding-top: 16px; border-bottom: none; text-align: right;" class="receipt-total">{{amount_formatted}}</td>
          </tr>
        </tbody>
      </table>
      
      <p class="text" style="margin-top: 32px; font-size: 14px; color: #64748b;">Transaction ID: {{transaction_id}}<br>Date: {{transaction_date}}</p>
      
      <div style="text-align: center; margin-top: 32px;">
        <a href="{{frontend_url}}/dashboard/billing" class="btn" style="background-color: #f1f5f9; color: ${BRAND_COLOR}; border: 1px solid #e2e8f0;">View Billing History</a>
      </div>
      `,
      'You received this email because a payment was processed for your account.'
    ),
    type: 'transactional'
  },
  {
    name: 'Payment Failed',
    subject: 'Action Required: Your payment failed to process',
    html_body: buildTemplate(
      'Payment Failed',
      'We were unable to process your recent payment for your AIDetector subscription.',
      `
      <div class="alert-box">
        <p class="alert-text"><strong>We couldn't process your payment for {{plan_name}}.</strong></p>
      </div>
      <p class="text">Hi {{name}},</p>
      <p class="text">We were unable to process the charge of <strong>{{amount_formatted}}</strong> to your card ending in {{card_last4}}.</p>
      <p class="text">To ensure uninterrupted access to your premium features, please update your payment information as soon as possible. We will try to process the payment again automatically in a few days.</p>
      
      <div style="text-align: center; margin-top: 32px;">
        <a href="{{frontend_url}}/dashboard/billing" class="btn">Update Payment Method</a>
      </div>
      <p class="text" style="margin-top: 32px;">If you have any questions or need help, please don't hesitate to reach out to our support team.</p>
      `,
      'You received this email because a recurring payment failed on your account.'
    ),
    type: 'transactional'
  }
];

async function seed() {
  console.log("Connecting to Supabase at", SUPABASE_URL);
  for (const t of templates) {
    const { data: existing } = await supabase.from('email_templates').select('id').eq('name', t.name).single();
    if (!existing) {
      const { error } = await supabase.from('email_templates').insert([t]);
      if (error) console.error("Error inserting", t.name, error);
      else console.log("Inserted", t.name);
    } else {
      const { error } = await supabase.from('email_templates').update({
        subject: t.subject,
        html_body: t.html_body
      }).eq('id', existing.id);
      if (error) console.error("Error updating", t.name, error);
      else console.log("Updated", t.name);
    }
  }
}

seed().catch(console.error);