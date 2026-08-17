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
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    // We need a client with ANON key to use signInWithPassword normally,
    // but actually signInWithPassword works with anon key.
    // Let's use the Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const authClient = createClient(supabaseUrl, supabaseAnonKey);

    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401, headers: corsHeaders });
    }

    const userId = authData.user.id;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Look for existing wp API key
    const { data: existingKeys } = await supabaseAdmin
      .from('api_keys')
      .select('api_key')
      .eq('user_id', userId)
      .like('api_key', 'aid_%')
      .order('created_at', { ascending: false })
      .limit(1);

    let apiKey = '';

    if (existingKeys && existingKeys.length > 0) {
      apiKey = existingKeys[0].api_key;
    } else {
      // Generate a new one
      const cryptoRandom = crypto.randomUUID().replace(/-/g, '');
      apiKey = `aid_${cryptoRandom}`;
      
      const { error: insertError } = await supabaseAdmin
        .from('api_keys')
        .insert({
          user_id: userId,
          api_key: apiKey,
          created_at: new Date().toISOString()
        });

      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({
      success: true,
      api_key: apiKey,
      email: authData.user.email
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});