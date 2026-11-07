import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") || "https://www.aidetector.cx",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin"
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const authorization = req.headers.get("Authorization") || "";
    const token = authorization.replace(/^Bearer\s+/i, "");

    if (!supabaseUrl || !anonKey || !token) return json({ error: "Sign-in is required to search for prospects." }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: authData, error: authError } = await userClient.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "Your session is invalid or has expired. Please sign in again." }, 401);

    const body = await req.json().catch(() => ({}));
    const query = String(body?.query || body?.project?.business_type || "").trim();
    const location = String(body?.location || body?.project?.target_country || "").trim();

    if (query.length < 2 || query.length > 120 || location.length < 2 || location.length > 120) {
      return json({ error: "Enter a business type and location (2–120 characters each)." }, 400);
    }

    let apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY") || "";
    if (!apiKey && serviceKey) {
      const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await admin.from("app_settings").select("key_value").eq("key_name", "GOOGLE_MAPS_API_KEY").maybeSingle();
      if (!error && data?.key_value) apiKey = String(data.key_value);
    }
    if (!apiKey) return json({ error: "Google Places is not configured. Add GOOGLE_MAPS_API_KEY before searching." }, 503);

    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.primaryTypeDisplayName,places.rating,places.googleMapsUri"
      },
      body: JSON.stringify({ textQuery: `${query} in ${location}`, pageSize: 20 })
    });

    if (!response.ok) {
      const providerError = await response.text();
      console.error("Google Places search failed", response.status, providerError.slice(0, 500));
      return json({ error: "The Google Places provider could not complete this search. Please try again later." }, 502);
    }

    const data = await response.json();
    const companies = (data.places || []).filter((place: any) => place.displayName?.text).map((place: any) => ({
      name: place.displayName.text,
      website: place.websiteUri || null,
      industry: place.primaryTypeDisplayName?.text || null,
      location: place.formattedAddress || null,
      phone: place.nationalPhoneNumber || null,
      rating: typeof place.rating === "number" ? place.rating : null,
      lead_score: null,
      source_provider: "Google Places",
      source_url: place.googleMapsUri || null,
      source_retrieved_at: new Date().toISOString()
    }));

    return json({ companies, count: companies.length, provider: "Google Places" });
  } catch (error) {
    console.error("Prospecting search error", error);
    return json({ error: "Prospecting search failed unexpectedly. Please try again." }, 500);
  }
});
