import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

    // Get Auth token
    const authHeader = req.headers.get('Authorization');
    let user = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '').trim();
      const { data: authData } = await supabaseClient.auth.getUser(token);
      user = authData?.user;
    }
    
    // We could enforce plan logic here, but for now we'll allow all authenticated users
    // or even public downloads if we want the plugin to be public. Let's make it public 
    // but log the user if they are logged in.
    
    // Attempt to download the ZIP file from storage
    const { data: fileData, error: fileError } = await supabaseClient
      .storage
      .from('plugins')
      .download('aidetector-wp.zip');

    if (fileError || !fileData) {
      console.error('Plugin file not found in storage:', fileError);
      
      // Log failed download
      await supabaseClient.from('plugin_downloads').insert({
        user_id: user?.id,
        status: 'failed',
        error_message: fileError?.message || 'File not found'
      });

      return new Response(JSON.stringify({ error: 'Plugin is not yet available.' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Log successful download
    await supabaseClient.from('plugin_downloads').insert({
      user_id: user?.id,
      status: 'success',
      plugin_version: '1.2.0'
    });

    return new Response(fileData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="aidetector-wordpress-plugin.zip"'
      }
    });

  } catch (error: any) {
    console.error('Download error:', error);
    return new Response(JSON.stringify({ error: 'Failed to download plugin.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
