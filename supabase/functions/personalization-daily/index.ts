import {
  computePredictions,
  createServiceClient,
  generateRecommendations,
  getProfileForScoring,
  persistPredictions,
  persistRecommendations,
} from '../_shared/personalization.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const supabase = createServiceClient();

    let userIds: string[] = body.user_ids || [];
    if (!Array.isArray(userIds) || userIds.length === 0) {
      const { data, error } = await supabase
        .from('user_intelligence_profiles')
        .select('user_id')
        .order('last_updated', { ascending: false })
        .limit(1000);
      if (error) throw error;
      userIds = (data || []).map((d) => d.user_id);
    }

    const { data: config } = await supabase.from('personalization_config').select('*').eq('id', 1).maybeSingle();
    const maxRecs = (config?.thresholds as Record<string, number> | undefined)?.max_recommendations_per_user ?? 8;
    const ttlHours = (config?.thresholds as Record<string, number> | undefined)?.recommendation_ttl_hours ?? 168;
    const modelSettings = (config?.model_settings as Record<string, Record<string, boolean>> | undefined) ?? {};

    let processed = 0;
    for (const userId of userIds) {
      try {
        const profile = await getProfileForScoring(supabase, userId);
        if (!profile) continue;

        if (modelSettings.recommendation_models?.product !== false) {
          const recs = generateRecommendations(profile);
          await persistRecommendations(supabase, userId, recs, maxRecs, ttlHours);
        }

        if (modelSettings.prediction_models?.upgrade !== false) {
          const preds = computePredictions(profile);
          await persistPredictions(supabase, userId, preds);
        }

        processed++;
      } catch (inner) {
        console.error('daily batch error for user', userId, inner);
      }
    }

    return new Response(JSON.stringify({ ok: true, processed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('personalization-daily error', err);
    return new Response(JSON.stringify({ error: 'Batch processing failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
