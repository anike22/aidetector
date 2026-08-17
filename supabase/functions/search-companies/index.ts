import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { project } = await req.json();
    
    // First, attempt to get API key from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    let apiKey = '';

    if (supabaseUrl && supabaseServiceKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data } = await supabaseAdmin
        .from('app_settings')
        .select('key_value')
        .eq('key_name', 'GOOGLE_MAPS_API_KEY')
        .single();
      
      if (data?.key_value) {
        apiKey = data.key_value;
      }
    }

    // Fallback to environment variable if DB has no value
    if (!apiKey) {
      apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY') || '';
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Real lead data source is not connected yet. GOOGLE_MAPS_API_KEY is missing." }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchQuery = `${project.business_type} in ${project.target_country}`;
    
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.primaryTypeDisplayName,places.rating"
      },
      body: JSON.stringify({
        textQuery: searchQuery,
        pageSize: 10
      })
    });

    if (!response.ok) {
        throw new Error(`Google Places API error: ${await response.text()}`);
    }

    const data = await response.json();
    const places = data.places || [];

    const companies = places.map((place: any) => {
      let score = 50;
      if (place.websiteUri) score += 20;
      if (place.nationalPhoneNumber) score += 20;
      if (place.rating) score += Math.floor(place.rating * 2);

      let reason = "Base local match";
      if (place.websiteUri) reason += ", Has website";
      if (place.nationalPhoneNumber) reason += ", Has phone";

      return {
        name: place.displayName?.text || 'Unknown Company',
        website: place.websiteUri || null,
        industry: place.primaryTypeDisplayName?.text || project.business_type,
        location: place.formattedAddress || project.target_country,
        employees: 'Unknown',
        revenue_estimate: 'Unknown',
        lead_score: Math.min(score, 99),
        phone: place.nationalPhoneNumber || null,
        email: null, // Google Places API does not provide emails directly
        score_reason: reason,
        social_profiles: {}
      };
    });

    if (companies.length === 0) {
      return new Response(
        JSON.stringify({ error: "No real leads found for this search" }), 
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ companies }), 
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
