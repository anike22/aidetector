import { supabase } from '@/db/supabase';
import type {
  BehaviorEventInput,
  PersonalizationConfig,
  PersonalizationSettings,
  PersonalizedRecommendation,
  RecommendationAnalyticsRow,
  UserIntelligenceProfile,
  UserPrediction,
} from '@/types/personalization';

export async function getIntelligenceProfile(): Promise<UserIntelligenceProfile | null> {
  const { data, error } = await supabase
    .from('user_intelligence_profiles')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data as UserIntelligenceProfile | null;
}

export async function getRecommendations(limit = 8): Promise<PersonalizedRecommendation[]> {
  const { data, error } = await supabase
    .from('personalized_recommendations')
    .select('*')
    .or('dismissed.eq.false,accepted.eq.true')
    .order('score', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as PersonalizedRecommendation[];
}

export async function recordRecommendationEvent(
  recommendationId: string,
  action: 'impression' | 'click' | 'accept' | 'dismiss',
  context?: string
): Promise<void> {
  const { error } = await supabase.rpc('record_recommendation_event', {
    p_recommendation_id: recommendationId,
    p_action: action,
    p_context: context || null,
  });
  if (error) throw error;
}

export async function getPredictions(): Promise<UserPrediction[]> {
  const { data, error } = await supabase.from('user_predictions').select('*');
  if (error) throw error;
  return (data || []) as UserPrediction[];
}

export async function getPersonalizationSettings(): Promise<PersonalizationSettings | null> {
  const { data, error } = await supabase
    .from('personalization_settings')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data as PersonalizationSettings | null;
}

export async function updatePersonalizationSettings(
  updates: Partial<Pick<PersonalizationSettings, 'dashboard_layout' | 'hidden_widgets' | 'homepage_variant' | 'opt_out' | 'reduced_motion'>>
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');
  const { error } = await supabase.from('personalization_settings').upsert({
    user_id: userData.user.id,
    ...updates,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function getPersonalizationConfig(): Promise<PersonalizationConfig | null> {
  const { data, error } = await supabase
    .from('personalization_config')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data as PersonalizationConfig | null;
}

export async function updatePersonalizationConfig(
  config: Partial<Pick<PersonalizationConfig, 'model_settings' | 'thresholds'>>
): Promise<void> {
  const { error } = await supabase
    .from('personalization_config')
    .update({
      ...config,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);
  if (error) throw error;
}

export async function getRecommendationAnalytics(
  start?: string,
  end?: string
): Promise<RecommendationAnalyticsRow[]> {
  let q = supabase.from('recommendation_analytics_daily').select('*').order('date', { ascending: true });
  if (start) q = q.gte('date', start);
  if (end) q = q.lte('date', end);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as RecommendationAnalyticsRow[];
}

export async function trackBehaviorEvent(input: BehaviorEventInput): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  const userId = userData.user.id;

  await supabase.rpc('record_behavior_event', {
    p_user_id: userId,
    p_event_type: input.event_type,
    p_event_category: input.event_category,
    p_event_data: input.event_data || {},
    p_session_id: input.session_id || null,
    p_device_info: input.device_info || {},
  });

  // Fire-and-forget personalization refresh via Edge Function
  try {
    await supabase.functions.invoke('personalization', {
      body: { action: 'process', user_id: userId, events: [input] },
    });
  } catch {
    // Edge Function refresh is best-effort; raw event is already persisted.
  }
}

export async function batchProcessPersonalization(userIds?: string[]): Promise<void> {
  await supabase.functions.invoke('personalization', {
    body: { action: 'daily', user_ids: userIds },
  });
}
