import {
  aggregateSignals,
  computePredictions,
  createServiceClient,
  generateRecommendations,
  getProfileForScoring,
  persistPredictions,
  persistRecommendations,
  refreshProfileAndSignals,
} from '../_shared/personalization.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  let body: { user_id?: string; events?: Array<{ event_type: string; event_category: string; event_data?: Record<string, unknown> }> } = {};
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  const userId = body.user_id;
  if (!userId) return errorResponse('Missing user_id', 400);

  const events = (body.events || []).map((e) => ({
    event_type: e.event_type,
    event_category: e.event_category,
    event_data: e.event_data || {},
  }));

  try {
    const supabase = createServiceClient();

    // 1. Refresh static profile from customer profile
    await supabase.rpc('refresh_intelligence_profile', { p_user_id: userId });

    // 2. Aggregate and persist behavioral signals
    const signalDelta = aggregateSignals(events);
    await refreshProfileAndSignals(supabase, userId, signalDelta);

    // 3. Load enriched profile for scoring
    const profile = await getProfileForScoring(supabase, userId);
    if (!profile) {
      return new Response(JSON.stringify({ ok: true, recommendations: 0, predictions: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Generate and persist recommendations
    const { data: config } = await supabase.from('personalization_config').select('*').eq('id', 1).maybeSingle();
    const maxRecs = (config?.thresholds as Record<string, number> | undefined)?.max_recommendations_per_user ?? 8;
    const ttlHours = (config?.thresholds as Record<string, number> | undefined)?.recommendation_ttl_hours ?? 168;
    const modelSettings = (config?.model_settings as Record<string, Record<string, boolean>> | undefined) ?? {};

    let recommendations: ReturnType<typeof generateRecommendations> = [];
    if (modelSettings.recommendation_models?.product !== false) {
      recommendations = generateRecommendations(profile);
    }
    await persistRecommendations(supabase, userId, recommendations, maxRecs, ttlHours);

    // 5. Compute and persist predictions
    let predictions: ReturnType<typeof computePredictions> = [];
    if (modelSettings.prediction_models?.upgrade !== false) {
      predictions = computePredictions(profile);
    }
    await persistPredictions(supabase, userId, predictions);

    return new Response(
      JSON.stringify({ ok: true, recommendations: recommendations.length, predictions: predictions.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('personalization-event-processor error', err);
    return errorResponse('Processing failed', 500);
  }
});
