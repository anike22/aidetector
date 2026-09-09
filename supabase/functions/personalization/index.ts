import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.103.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function createServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function aggregateSignals(events: any[]) {
  const signals: Record<string, number> = {};
  for (const ev of events) {
    const key = `${ev.event_category}_${ev.event_type}`;
    signals[key] = (signals[key] || 0) + 1;
    if (ev.event_category === 'tool') {
      signals[ev.event_type] = (signals[ev.event_type] || 0) + 1;
    }
  }
  return signals;
}

async function getConfig(supabase: ReturnType<typeof createServiceClient>) {
  const { data } = await supabase.from('personalization_config').select('*').eq('id', 1).maybeSingle();
  return {
    maxRecs: (data?.thresholds as Record<string, number> | undefined)?.max_recommendations_per_user ?? 8,
    ttlHours: (data?.thresholds as Record<string, number> | undefined)?.recommendation_ttl_hours ?? 168,
    modelSettings: (data?.model_settings as Record<string, Record<string, boolean>> | undefined) ?? {},
  };
}

async function getProfileForScoring(supabase: ReturnType<typeof createServiceClient>, userId: string) {
  const { data } = await supabase
    .from('user_intelligence_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) return null;
  const signals = (data.behavioral_signals as Record<string, number>) || {};
  return {
    ...data,
    signals,
    plan: (data.subscription_plan || 'free').toLowerCase(),
    org: (data.organization_type || 'individual').toLowerCase(),
  };
}

function generateRecommendations(profile: NonNullable<Awaited<ReturnType<typeof getProfileForScoring>>>) {
  const candidates: any[] = [];
  const signals = profile.signals;
  const plan = profile.plan;
  const org = profile.org;
  const usage = (key: string) => signals[key] || 0;

  const add = (type: string, subtype: string, title: string, description: string, reason: string, contextPath: string, score: number) => {
    candidates.push({ type, subtype, title, description, reason, context_path: contextPath, score });
  };

  if (usage('tool_detector') >= 3 && usage('tool_humanizer') === 0) {
    add('product', 'humanizer', 'Try the AI Humanizer', 'Make AI-generated text read naturally.', 'You scan a lot of content for AI detection.', '/humanizer', 85);
  }
  if (usage('tool_humanizer') >= 3 && usage('tool_grammar') === 0) {
    add('product', 'grammar', 'Polish with Grammar Checker', 'Fix grammar and improve readability.', 'You humanize often — now refine the result.', '/grammar-checker', 80);
  }
  if (usage('tool_grammar') >= 3 && usage('tool_plagiarism') === 0) {
    add('product', 'plagiarism', 'Check for Plagiarism', 'Ensure originality across your writing.', 'Grammar fixes lead to originality checks.', '/plagiarism-checker', 78);
  }
  if (usage('tool_api') >= 5 && plan === 'pro') {
    add('upgrade', 'business_plan', 'Upgrade to Business', 'Unlock higher API quotas and team-ready features.', 'Your API usage is growing quickly.', '/pricing', 82);
  }
  if ((plan === 'business' || plan === 'enterprise') && usage('tool_api') === 0) {
    add('product', 'api', 'Explore the API Platform', 'Integrate detection into your product.', 'Business plans get the most value from APIs.', '/api', 75);
  }
  if (org === 'api_developer' && usage('tool_api') === 0) {
    add('content', 'sdk', 'Get the SDK', 'Quick-start code for popular languages.', 'Built for developers like you.', '/api/docs', 72);
  }
  if ((org === 'writer' || org === 'content_creator') && usage('chrome_extension') === 0) {
    add('product', 'chrome_extension', 'Install Chrome Extension', 'Detect and humanize directly in your browser.', 'Writers love the browser workflow.', '/chrome-extension', 70);
  }
  if (usage('tool_detector') >= 1 && usage('tutorial_onboarding') === 0) {
    add('content', 'tutorial', 'Complete the Product Tour', 'Learn the essentials in two minutes.', 'New users who tour convert 2× more.', '/tour', 60);
  }
  if (usage('saved_report') === 0 && usage('tool_detector') >= 2) {
    add('action', 'saved_report', 'Save Your First Report', 'Keep important results in one place.', 'You are generating reports worth keeping.', '/detector', 65);
  }
  if (plan === 'free' && usage('tool_detector') >= 5) {
    add('upgrade', 'pro_plan', 'Upgrade to Pro', 'Get unlimited scans and advanced reports.', 'You are an active detector user.', '/pricing', 70);
  }
  if (org === 'enterprise' || org === 'business') {
    add('upgrade', 'enterprise_contact', 'Talk to Enterprise Sales', 'Custom terms, SSO, and dedicated support.', 'Your organization may benefit from enterprise features.', '/contact-sales', 55);
  }
  return candidates.sort((a, b) => b.score - a.score);
}

function computePredictions(profile: NonNullable<Awaited<ReturnType<typeof getProfileForScoring>>>) {
  const signals = profile.signals;
  const plan = profile.plan;
  const predictions: any[] = [];
  const detector = signals['tool_detector'] || 0;
  const humanizer = signals['tool_humanizer'] || 0;
  const grammar = signals['tool_grammar'] || 0;
  const api = signals['tool_api'] || 0;
  const logins = signals['login'] || 0;
  const totalTools = [detector, humanizer, grammar, signals['tool_plagiarism'] || 0, signals['tool_image'] || 0, signals['tool_video'] || 0].filter(Boolean).length;
  let upgradeScore = 0;
  if (plan === 'free') {
    upgradeScore = Math.min(100, detector * 8 + totalTools * 10 + (signals['upgrade_viewed'] || 0) * 5);
  } else if (plan === 'pro') {
    upgradeScore = Math.min(100, api * 12 + (signals['business_feature_viewed'] || 0) * 10);
  }
  predictions.push({ type: 'upgrade', score: upgradeScore, confidence: 50 + Math.min(40, totalTools * 5), features: { plan, detector, total_tools: totalTools } });
  let churnScore = logins > 0 ? Math.max(0, 60 - logins * 10 - totalTools * 5) : 0;
  predictions.push({ type: 'churn', score: churnScore, confidence: 50, features: { logins, total_tools: totalTools } });
  let renewalScore = plan === 'free' ? 0 : Math.min(100, 40 + logins * 8 + totalTools * 6);
  predictions.push({ type: 'renewal', score: renewalScore, confidence: 55, features: { plan, logins, total_tools: totalTools } });
  const spend = (profile.static_attributes as Record<string, unknown>)?.total_spend as number || 0;
  const clv = spend > 0 ? spend * 1.5 : Math.max(0, totalTools * 10 + detector * 2);
  predictions.push({ type: 'clv', score: Math.min(100, Math.round(clv)), value: clv, confidence: 40, features: { spend, total_tools: totalTools } });
  const nextTool = detector > 0 && humanizer === 0 ? 'humanizer' : humanizer > 0 && grammar === 0 ? 'grammar' : grammar > 0 ? 'plagiarism' : 'humanizer';
  predictions.push({ type: 'feature_adoption', score: Math.min(100, 30 + detector * 6), confidence: 45, features: { next_tool: nextTool, detector } });
  const helpViews = signals['help_article_viewed'] || 0;
  const errors = signals['tool_error'] || 0;
  predictions.push({ type: 'support_risk', score: Math.min(100, helpViews * 15 + errors * 20), confidence: 50, features: { help_views: helpViews, errors } });
  predictions.push({ type: 'api_growth', score: Math.min(100, api * 8), value: api, confidence: api > 0 ? 60 : 30, features: { api_requests: api } });
  const highValue = Math.min(100, (org === 'enterprise' ? 70 : 0) + (spend > 0 ? 20 : 0) + totalTools * 5 + api * 3);
  predictions.push({ type: 'high_value', score: highValue, confidence: 50, features: { org, spend, total_tools: totalTools } });
  return predictions;
}

async function persistRecommendations(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  candidates: any[],
  max: number,
  ttlHours: number
) {
  const seen = new Set<string>();
  const unique = candidates.filter((c) => {
    if (seen.has(c.subtype)) return false;
    seen.add(c.subtype);
    return true;
  }).slice(0, max);
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
  await supabase
    .from('personalized_recommendations')
    .update({ dismissed: true, dismissed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('dismissed', false)
    .eq('accepted', false)
    .lt('expires_at', new Date().toISOString());
  for (const c of unique) {
    await supabase.from('personalized_recommendations').upsert(
      {
        user_id: userId,
        type: c.type,
        subtype: c.subtype,
        title: c.title,
        description: c.description,
        reason: c.reason,
        context_path: c.context_path || null,
        score: c.score,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,subtype' }
    );
  }
}

async function persistPredictions(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  predictions: any[]
) {
  for (const p of predictions) {
    await supabase.rpc('upsert_prediction', {
      p_user_id: userId,
      p_prediction_type: p.type,
      p_score: p.score,
      p_value: p.value ?? null,
      p_confidence: p.confidence,
      p_features: p.features,
    });
  }
}

async function processEvents(supabase: ReturnType<typeof createServiceClient>, userId: string, events: any[]) {
  await supabase.rpc('refresh_intelligence_profile', { p_user_id: userId });
  const signalDelta = aggregateSignals(events);
  await supabase.rpc('update_behavioral_signals', { p_user_id: userId, p_signals: signalDelta });
  const profile = await getProfileForScoring(supabase, userId);
  if (!profile) return { recommendations: 0, predictions: 0 };
  const config = await getConfig(supabase);
  let recs: any[] = [];
  if (config.modelSettings.recommendation_models?.product !== false) {
    recs = generateRecommendations(profile);
  }
  await persistRecommendations(supabase, userId, recs, config.maxRecs, config.ttlHours);
  let preds: any[] = [];
  if (config.modelSettings.prediction_models?.upgrade !== false) {
    preds = computePredictions(profile);
  }
  await persistPredictions(supabase, userId, preds);
  return { recommendations: recs.length, predictions: preds.length };
}

async function dailyBatch(supabase: ReturnType<typeof createServiceClient>, userIds?: string[]) {
  let ids = userIds || [];
  if (!Array.isArray(ids) || ids.length === 0) {
    const { data } = await supabase.from('user_intelligence_profiles').select('user_id').order('last_updated', { ascending: false }).limit(1000);
    ids = (data || []).map((d) => d.user_id);
  }
  const config = await getConfig(supabase);
  let processed = 0;
  for (const userId of ids) {
    try {
      const profile = await getProfileForScoring(supabase, userId);
      if (!profile) continue;
      if (config.modelSettings.recommendation_models?.product !== false) {
        const recs = generateRecommendations(profile);
        await persistRecommendations(supabase, userId, recs, config.maxRecs, config.ttlHours);
      }
      if (config.modelSettings.prediction_models?.upgrade !== false) {
        const preds = computePredictions(profile);
        await persistPredictions(supabase, userId, preds);
      }
      processed++;
    } catch (inner) {
      console.error('daily batch error for user', userId, inner);
    }
  }
  return processed;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  let body: { action?: string; user_id?: string; events?: any[]; user_ids?: string[] } = {};
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  const action = body.action || 'process';
  const supabase = createServiceClient();

  try {
    if (action === 'process') {
      if (!body.user_id) return errorResponse('Missing user_id', 400);
      const events = body.events || [];
      const result = await processEvents(supabase, body.user_id, events);
      return new Response(JSON.stringify({ ok: true, ...result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'daily') {
      const processed = await dailyBatch(supabase, body.user_ids);
      return new Response(JSON.stringify({ ok: true, processed }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'aggregate') {
      await supabase.rpc('aggregate_personalization_analytics');
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return errorResponse('Unknown action', 400);
  } catch (err) {
    console.error('personalization error', err);
    return errorResponse('Processing failed', 500);
  }
});
