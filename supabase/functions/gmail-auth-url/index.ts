import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const redirectUri = Deno.env.get('SUPABASE_URL') + '/functions/v1/gmail-auth-callback';
    
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID is not configured');
    }

    const scope = 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email';
    
    // We expect the frontend to pass the user ID as state or we pass a token
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const returnUrl = url.searchParams.get('returnUrl') || 'http://localhost:5173';
    
    if (!userId) {
      throw new Error('userId is required in query params');
    }

    const stateStr = btoa(JSON.stringify({ userId, returnUrl }));

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${stateStr}`;

    return new Response(JSON.stringify({ url: authUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
});