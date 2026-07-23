import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const stateStr = url.searchParams.get('state');

  if (!code || !stateStr) {
    return new Response("Missing code or state", { status: 400 });
  }

  let userId = '';
  let returnUrl = '/';
  try {
    const stateObj = JSON.parse(atob(stateStr));
    userId = stateObj.userId;
    returnUrl = stateObj.returnUrl;
  } catch (e) {
    return new Response("Invalid state parameter", { status: 400 });
  }

  try {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
    const redirectUri = Deno.env.get('SUPABASE_URL') + '/functions/v1/gmail-auth-callback';

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('Failed to obtain access token');
    }

    // Get email address
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profileData = await profileRes.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    await supabase.from('gmail_tokens').upsert({
      user_id: userId,
      access_token_encrypted: tokenData.access_token,
      refresh_token_encrypted: tokenData.refresh_token || null,
      token_expiry: expiresAt.toISOString(),
      email_address: profileData.email,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    // Redirect back to frontend
    const finalUrl = new URL(returnUrl);
    finalUrl.searchParams.set('gmail', 'success');
    return Response.redirect(finalUrl.toString(), 302);

  } catch (error: any) {
    return new Response(error.message, { status: 500 });
  }
});