import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sendEmail } from "../_shared/email/sendEmail.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-timezone',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface RegisterPayload {
  action?: 'register' | 'resend';
  email?: string;
  password?: string;
  fullName?: string;
  referralCode?: string;
  visitorId?: string;
  timezone?: string;
  return_to?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function safeError(message: string, status: number, requestId?: string): Response {
  return jsonResponse({ success: false, error: message, request_id: requestId }, status);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function trackEvent(
  supabase: ReturnType<typeof createClient>,
  userId: string | null,
  eventType: string,
  eventData: Record<string, unknown> = {},
  requestId?: string
): Promise<void> {
  if (!userId) return; // behavior_events.user_id is NOT NULL; skip pre-user events
  try {
    await supabase.from('behavior_events').insert({
      user_id: userId,
      event_type: eventType,
      event_category: 'registration',
      event_data: { ...eventData, request_id: requestId },
    });
  } catch {
    // Non-blocking analytics
  }
}

async function sendVerificationEmail(
  supabase: ReturnType<typeof createClient>,
  email: string,
  verificationLink: string,
  userId: string,
  frontendUrl: string
): Promise<{ sent: boolean; error?: string }> {
  try {
    let { data: template } = await supabase.from('email_templates').select('*').eq('name', 'Email Verification').single();
    let html = template?.html_body || `<p>Please verify your email: <a href="${verificationLink}">Verify Email</a></p>`;
    let subject = template?.subject || "Verify Your Email Address";

    html = html
      .replace(/\{\{verification_link\}\}/g, verificationLink)
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
      userId,
    });
    return { sent: true };
  } catch (err: any) {
    console.error('Verification email failed:', err);
    return { sent: false, error: err.message };
  }
}

async function ensureProfile(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  email: string,
  fullName: string
): Promise<void> {
  // Trigger usually creates the profile, but we repair/upgrade it here idempotently.
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
  if (!profile) {
    await supabase.from('profiles').insert({
      id: userId,
      email,
      full_name: fullName || '',
      subscription_plan: 'free',
      subscription_status: 'Active',
    });
  } else {
    await supabase.from('profiles').update({
      full_name: fullName || '',
      subscription_plan: 'free',
      subscription_status: 'Active',
    }).eq('id', userId);
  }
}

async function handleRegister(
  req: Request,
  payload: RegisterPayload,
  requestId: string
): Promise<Response> {
  const { email: rawEmail = '', password = '', fullName = '', return_to } = payload;
  const email = rawEmail.trim().toLowerCase();
  const postAuthRedirect = return_to || '';

  // Frontend validation
  if (!fullName || fullName.trim().length < 2) {
    return safeError('Full name must be at least 2 characters.', 400, requestId);
  }
  if (!email || !isValidEmail(email)) {
    return safeError('Please enter a valid email address.', 400, requestId);
  }
  if (!password || password.length < 8) {
    return safeError('Password must be at least 8 characters.', 400, requestId);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let origin = req.headers.get('origin') || req.headers.get('referer');
  if (origin) {
    try { origin = new URL(origin).origin; } catch { origin = null; }
  }
  const frontendUrl = Deno.env.get('CUSTOM_DOMAIN') || origin || 'https://aidetector.cx';

  await trackEvent(supabase, null, 'registration_started', { email }, requestId);

  // Check for existing auth user by email via RPC (avoids auth schema REST restrictions)
  const { data: existingAuthRows } = await supabase.rpc('get_auth_user_id_by_email', { p_email: email });
  const existingAuthUser = existingAuthRows?.[0];

  // If a profile exists, prefer that for tracking; otherwise use the auth lookup
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();

  if (existingAuthUser || existingProfile) {
    const userId = existingProfile?.id || existingAuthUser.id;
    const verified = existingAuthUser?.email_confirmed_at ? true : false;
    await trackEvent(supabase, userId, 'registration_failed', { email, reason: 'existing_email', verified }, requestId);
    return jsonResponse(
      {
        success: false,
        error: 'An account already exists with this email. If you have not verified it yet, you can resend the verification email.',
        verified,
        existing_user_id: userId,
        action: 'existing_account',
      },
      409
    );
  }

  // Create user and verification link
  const loginReturnParams = postAuthRedirect
    ? `verified=true&return_to=${encodeURIComponent(postAuthRedirect)}`
    : 'verified=true';
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'signup',
    email,
    password,
    options: { redirectTo: `${frontendUrl}/login?${loginReturnParams}` },
  });

  if (linkError) {
    console.error('generateLink error:', linkError);
    const msg = linkError.message?.toLowerCase() || '';
    if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
      await trackEvent(supabase, null, 'registration_failed', { email, reason: 'existing_email' }, requestId);
      return jsonResponse(
        {
          success: false,
          error: 'An account already exists with this email. If you have not verified it yet, you can resend the verification email.',
          action: 'existing_account',
        },
        409
      );
    }
    await trackEvent(supabase, null, 'registration_failed', { email, reason: linkError.message }, requestId);
    return safeError('We could not create your account right now. Please try again in a moment.', 500, requestId);
  }

  const user = linkData.user!;
  const hashedToken = linkData.properties?.hashed_token || linkData.properties?.token_hash;
  const verificationLink = hashedToken
    ? `${frontendUrl}/login?${loginReturnParams}&token_hash=${hashedToken}&type=signup`
    : linkData.properties.action_link;

  // Setup profile, free plan and entitlements
  try {
    await ensureProfile(supabase, user.id, email, fullName.trim());
  } catch (err: any) {
    console.error('Profile setup error:', err);
    // Continue; user exists and can repair on retry
  }

  // Send verification email
  const emailResult = await sendVerificationEmail(supabase, email, verificationLink, user.id, frontendUrl);

  await trackEvent(supabase, user.id, emailResult.sent ? 'verification_email_sent' : 'verification_email_failed', { email }, requestId);
  await trackEvent(supabase, user.id, 'registration_completed', { email, email_sent: emailResult.sent }, requestId);

  // Onboarding / lifecycle welcome event
  try {
    await supabase.from('lifecycle_events').insert({
      user_id: user.id,
      event_type: 'signup',
      status: 'completed',
      occurred_at: new Date().toISOString(),
    });
  } catch {
    // Table may not exist in all environments
  }

  return jsonResponse({
    success: true,
    user_id: user.id,
    email,
    email_sent: emailResult.sent,
    email_error: emailResult.error || null,
    message: emailResult.sent
      ? 'Account created! Please check your email to verify your account.'
      : 'Account created, but we could not send the verification email. Please use the resend option.',
  }, emailResult.sent ? 201 : 202);
}

async function handleResend(
  req: Request,
  payload: RegisterPayload,
  requestId: string
): Promise<Response> {
  const { email: rawEmail = '' } = payload;
  const email = rawEmail.trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    return safeError('Please enter a valid email address.', 400, requestId);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let origin = req.headers.get('origin') || req.headers.get('referer');
  if (origin) {
    try { origin = new URL(origin).origin; } catch { origin = null; }
  }
  const frontendUrl = Deno.env.get('CUSTOM_DOMAIN') || origin || 'https://aidetector.cx';

  // Find existing auth user by email via RPC
  const { data: authRows } = await supabase.rpc('get_auth_user_id_by_email', { p_email: email });
  const authUser = authRows?.[0];

  if (!authUser) {
    return safeError('No account found with this email.', 404, requestId);
  }

  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(authUser.id);
  if (userError || !userData.user) {
    return safeError('Could not locate the account. Please try again.', 500, requestId);
  }

  const user = userData.user;
  if (user.email_confirmed_at) {
    return safeError('This email is already verified. Please log in.', 400, requestId);
  }

  // Resend via GoTrue /resend endpoint so the existing unconfirmed user gets a fresh signup link
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/resend`, {
      method: 'POST',
      headers: {
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') || SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'signup',
        email,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('GoTrue resend error:', res.status, body);
      return jsonResponse({
        success: true,
        email_sent: false,
        message: 'We could not resend the verification email right now. Please try again in a few minutes.',
      }, 202);
    }
  } catch (err: any) {
    console.error('Resend request failed:', err);
    return jsonResponse({
      success: true,
      email_sent: false,
      message: 'We could not resend the verification email right now. Please try again in a few minutes.',
    }, 202);
  }

  await trackEvent(supabase, user.id, 'verification_email_resent', { email }, requestId);
  return jsonResponse({ success: true, email_sent: true, message: 'Verification email resent. Please check your inbox.' });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return safeError('Method not allowed', 405);
  }

  const requestId = crypto.randomUUID();

  let payload: RegisterPayload;
  try {
    payload = await req.json();
  } catch {
    return safeError('Invalid request body.', 400, requestId);
  }

  const action = payload.action || 'register';

  try {
    if (action === 'register') {
      return await handleRegister(req, payload, requestId);
    }
    if (action === 'resend') {
      return await handleResend(req, payload, requestId);
    }
    return safeError('Invalid action.', 400, requestId);
  } catch (error: any) {
    console.error('Register function unhandled error:', error);
    return safeError('Something went wrong. Please try again or contact support.', 500, requestId);
  }
});
