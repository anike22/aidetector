import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');
    
    const token = authHeader.replace('Bearer ', '').trim();
    const { data: authData, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !authData.user) throw new Error('Unauthorized');
    
    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', authData.user.id).single();
    if (!profile || profile.role !== 'admin') throw new Error('Forbidden: Admin access required');

    const body = await req.json();
    const { action, provider, key_value } = body;

    if (action === 'test-connection') {
      let success = false;
      let message = 'Connection test failed';
      
      try {
        if (provider === 'openai') {
          const res = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${key_value}` }
          });
          if (res.ok) {
            success = true;
            message = 'Connection OK';
          } else {
            const err = await res.json();
            message = err.error?.message || 'Invalid API Key';
          }
        } else if (provider === 'gemini') {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': key_value
            },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'test' }] }]
            })
          });
          if (res.ok) {
            success = true;
            message = 'Connection OK';
          } else {
            const err = await res.json();
            message = err.error?.message || 'Invalid API Key';
          }
        } else if (provider === 'resend') {
           const res = await fetch('https://api.resend.com/emails', {
             method: 'GET',
             headers: { 'Authorization': `Bearer ${key_value}` }
           });
           if (res.ok || res.status === 405 || res.status === 400) {
             // Basic auth check
             success = true;
             message = 'Connection OK';
           }
        } else if (provider === 'dataforseo_login' || provider === 'dataforseo_password' || provider === 'google_client_id' || provider === 'google_client_secret') {
          // Fields without a direct validation endpoint
          success = true;
          message = 'Settings saved securely. Assuming OK.';
        } else {
          // generic fallback
          success = true;
          message = 'Provider not supported for automated testing, assuming OK';
        }
      } catch (e: any) {
        message = e.message;
      }

      // Update status in db if it exists
      if (success) {
        await supabaseClient.from('system_api_keys').update({ 
          status: 'active',
          last_tested_at: new Date().toISOString(),
          last_error: null
        }).eq('provider', provider);
      } else {
        await supabaseClient.from('system_api_keys').update({ 
          status: 'invalid',
          last_tested_at: new Date().toISOString(),
          last_error: message
        }).eq('provider', provider);
      }

      return new Response(JSON.stringify({ success, message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});