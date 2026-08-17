import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.103.1';

export type RecommendationType = 'product' | 'upgrade' | 'content' | 'action';
export type RecommendationSubtype =
  | 'humanizer'
  | 'grammar'
  | 'plagiarism'
  | 'pro_plan'
  | 'business_plan'
  | 'enterprise_contact'
  | 'api'
  | 'sdk'
  | 'chrome_extension'
  | 'wordpress_plugin'
  | 'tutorial'
  | 'saved_report'
  | 'next_action';

export interface BehaviorEvent {
  event_type: string;
  event_category: string;
  event_data?: Record<string, unknown>;
}

export interface RecommendationCandidate {
  type: RecommendationType;
  subtype: RecommendationSubtype;
  title: string;
  description: string;
  reason: string;
  context_path?: string;
  score: number;
}

export function createServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function aggregateSignals(events: BehaviorEvent[]): Record<string, number> {
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

export async function refreshProfileAndSignals(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  signalDelta: Record<string, number>
) {
  const { data: profile } = await supabase
    .from('user_intelligence_profiles')
    .select('behavioral_signals')
    .eq('user_id', userId)
    .maybeSingle();

  const existing = (profile?.behavioral_signals as Record<string, number>) || {};
  const updated: Record<string, number> = { ...existing };
  for (const [k, v] of Object.entries(signalDelta)) {
    updated[k] = (updated[k] || 0) + v;
  }

  await supabase.rpc('update_behavioral_signals', {
    p_user_id: userId,
    p_signals: updated,
  });
}

export async function getProfileForScoring(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string
) {
  const { data } = await supabase
    .from('user_intelligence_profiles')
    .select('*, customer_profile_id')
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

export function generateRecommendations(profile: NonNullable<ReturnType<typeof getProfileForScoring>> extends Promise<infer T> ? T : never): RecommendationCandidate[] {
  const candidates: RecommendationCandidate[] = [];
  const signals = profile.signals;
  const plan = profile.plan;
  const org = profile.org;

  const usage = (key: string) => signals[key] || 0;

  const add = (type: RecommendationType, subtype: RecommendationSubtype, title: string, description: string, reason: string, contextPath: string, score: number) => {
    candidates.push({ type, subtype, title, description, reason, context_path: contextPath, score });
  };

  // Product cross-sell rules
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

  // Upgrade rules
  const detectorUsage = usage('tool_detector');
  const detectorLimit = typeof profile.static_attributes === 'object' && (profile.static_attributes as Record<string, unknown>)?.detector_limit as number | undefined;
  if (plan === 'free' && detectorLimit && detectorLimit > 0 && detectorUsage / detectorLimit >= 0.8) {
    add('upgrade', 'pro_plan', 'Upgrade to Pro', 'You are near your free scan limit.', 'You have used most of your free scans.', '/pricing', 88);
  } else if (plan === 'free' && detectorUsage >= 5) {
    add('upgrade', 'pro_plan', 'Upgrade to Pro', 'Get unlimited scans and advanced reports.', 'You are an active detector user.', '/pricing', 70);
  }

  // Enterprise hint
  if (org === 'enterprise' || org === 'business') {
    add('upgrade', 'enterprise_contact', 'Talk to Enterprise Sales', 'Custom terms, SSO, and dedicated support.', 'Your organization may benefit from enterprise features.', '/contact-sales', 55);
  }

  return candidates.sort((a, b) => b.score - a.score);
}

export function computePredictions(profile: NonNullable<ReturnType<typeof getProfileForScoring>> extends Promise<infer T> ? T : never): { type: string; score: number; value?: number; confidence: number; features: Record<string, unknown> }[] {
  const signals = profile.signals;
  const plan = profile.plan;
  const predictions: { type: string; score: number; value?: number; confidence: number; features: Record<string, unknown> }[] = [];

  const detector = signals['tool_detector'] || 0;
  const humanizer = signals['tool_humanizer'] || 0;
  const grammar = signals['tool_grammar'] || 0;
  const api = signals['tool_api'] || 0;
  const logins = signals['login'] || 0;
  const totalTools = [detector, humanizer, grammar, signals['tool_plagiarism'] || 0, signals['tool_image'] || 0, signals['tool_video'] || 0].filter(Boolean).length;

  // Upgrade probability: free with high tool usage
  let upgradeScore = 0;
  if (plan === 'free') {
    upgradeScore = Math.min(100, detector * 8 + totalTools * 10 + (signals['upgrade_viewed'] || 0) * 5);
  } else if (plan === 'pro') {
    upgradeScore = Math.min(100, api * 12 + (signals['business_feature_viewed'] || 0) * 10);
  }
  predictions.push({ type: 'upgrade', score: upgradeScore, confidence: 50 + Math.min(40, totalTools * 5), features: { plan, detector, total_tools: totalTools } });

  // Churn probability: low login/activity
  let churnScore = 0;
  if (logins > 0) {
    churnScore = Math.max(0, 60 - logins * 10 - totalTools * 5);
  }
  predictions.push({ type: 'churn', score: churnScore, confidence: 50, features: { logins, total_tools: totalTools } });

  // Renewal probability: active paid users
  let renewalScore = plan === 'free' ? 0 : Math.min(100, 40 + logins * 8 + totalTools * 6);
  predictions.push({ type: 'renewal', score: renewalScore, confidence: 55, features: { plan, logins, total_tools: totalTools } });

  // CLV heuristic
  const spend = (profile.static_attributes as Record<string, unknown>)?.total_spend as number || 0;
  const clv = spend > 0 ? spend * 1.5 : Math.max(0, totalTools * 10 + detector * 2);
  predictions.push({ type: 'clv', score: Math.min(100, Math.round(clv)), value: clv, confidence: 40, features: { spend, total_tools: totalTools } });

  // Feature adoption probability: next unused core tool
  const nextTool = detector > 0 && humanizer === 0 ? 'humanizer' : humanizer > 0 && grammar === 0 ? 'grammar' : grammar > 0 ? 'plagiarism' : 'humanizer';
  const adoptionScore = Math.min(100, 30 + detector * 6);
  predictions.push({ type: 'feature_adoption', score: adoptionScore, confidence: 45, features: { next_tool: nextTool, detector } });

  // Support risk: repeated help views / errors
  const helpViews = signals['help_article_viewed'] || 0;
  const errors = signals['tool_error'] || 0;
  const supportRisk = Math.min(100, helpViews * 15 + errors * 20);
  predictions.push({ type: 'support_risk', score: supportRisk, confidence: 50, features: { help_views: helpViews, errors } });

  // API growth
  const apiGrowth = api > 0 ? Math.min(100, api * 8) : 0;
  predictions.push({ type: 'api_growth', score: apiGrowth, value: api, confidence: api > 0 ? 60 : 30, features: { api_requests: api } });

  // High-value customer
  const highValue = Math.min(100, (org === 'enterprise' ? 70 : 0) + (spend > 0 ? 20 : 0) + totalTools * 5 + api * 3);
  predictions.push({ type: 'high_value', score: highValue, confidence: 50, features: { org, spend, total_tools: totalTools } });

  return predictions;
}

export async function persistRecommendations(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  candidates: RecommendationCandidate[],
  max = 8,
  ttlHours = 168
) {
  // Deduplicate by subtype
  const seen = new Set<string>();
  const unique = candidates.filter((c) => {
    if (seen.has(c.subtype)) return false;
    seen.add(c.subtype);
    return true;
  }).slice(0, max);

  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

  // Mark old un-actioned recommendations as dismissed to make room
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

export async function persistPredictions(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  predictions: { type: string; score: number; value?: number; confidence: number; features: Record<string, unknown> }[]
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
