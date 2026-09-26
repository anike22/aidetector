import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLUGIN_VERSION = '2.1.0';
const DOWNLOAD_URL = 'https://aidetector.cx/api/plugin/download'; 

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Handle update-check
    if (path.includes('/update-check') || (req.method === 'POST' && (await req.clone().json().catch(()=>({}))).action === 'update-check')) {
      const updateData = {
        latest_version: PLUGIN_VERSION,
        current_version: '2.0.0',
        download_url: `${url.origin}/functions/v1/plugin-api/download`,
        changelog: `
          <h4>Version 2.1.0</h4>
          <ul>
            <li>Added Feature Controls integration</li>
            <li>Improved AI Detection algorithm</li>
            <li>Fixed Quick Links in dashboard</li>
            <li>Enhanced SEO Assistant capabilities</li>
          </ul>
        `,
        requires: '5.8',
        tested: '6.4.3',
        last_updated: new Date().toISOString(),
        upgrade_notice: 'This is a mandatory update to maintain compatibility with the latest API changes.'
      };
      return new Response(JSON.stringify(updateData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Handle download 
    if (path.includes('/download') || (req.method === 'POST' && (await req.clone().json().catch(()=>({}))).action === 'download')) {
      const authHeader = req.headers.get('Authorization');
      let user = null;
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '').trim();
        const { data: authData } = await supabaseClient.auth.getUser(token);
        user = authData?.user;
      }
      
      const { data: fileData, error: fileError } = await supabaseClient
        .storage
        .from('plugins')
        .download('aidetector-wp.zip');
        
      if (fileError || !fileData) {
        console.error('Plugin file not found in storage:', fileError);
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

      await supabaseClient.from('plugin_downloads').insert({
        user_id: user?.id,
        status: 'success',
        plugin_version: PLUGIN_VERSION
      });

      return new Response(fileData, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="aidetector-wordpress-plugin.zip"'
        }
      });
    }

    // Default error
    return new Response(JSON.stringify({ error: 'Not found' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});