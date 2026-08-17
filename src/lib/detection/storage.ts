import { supabase } from '@/db/supabase';
import type { AdvancedTextAnalysisResult } from './types';

export type FeedbackType = 'correct' | 'incorrect' | 'unsure' | 'wrong_language' | 'other';
export type UserLabel = 'human' | 'ai' | 'mixed' | 'unsure';

export interface SavedResult {
  id: string;
  requestId: string;
  createdAt: string;
}

export interface DetectorFeedbackInput {
  resultId: string;
  feedbackType: FeedbackType;
  userLabel?: UserLabel;
  comment?: string;
}

function hashText(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) + h) + text.charCodeAt(i);
    h |= 0;
  }
  return h.toString(16);
}

// AggressiveResultSnapshot is stored as-is from the aggressive engine.
// It must NOT contain a 'mixed' field — preserving the engine's two-category output.
export interface AggressiveResultSnapshot {
  ai: number;
  human: number;
  risk: string;
  recommendations: string[];
  engineLabel: 'seo-assistant-heuristic';
  recordedAt: string;
}

export async function saveDetectorResult(
  text: string,
  result: AdvancedTextAnalysisResult,
  options: {
    userId?: string;
    requestId?: string;
    zeroRetention?: boolean;
    retentionDays?: number;
    // Optional: aggressive engine result stored alongside the balanced result.
    // Older records without this field remain fully valid — backward compatible.
    aggressiveResult?: AggressiveResultSnapshot;
  } = {}
): Promise<SavedResult | null> {
  const { data: { user } } = await supabase.auth.getUser();
  const userId = options.userId || user?.id;
  if (!userId) return null;

  // Respect zero-retention mode: do not persist the result record at all.
  if (options.zeroRetention) {
    return null;
  }

  const textHash = hashText(text);
  const metadata = {
    ...result.metadata,
    sentenceCount: result.sentences.length,
    paragraphCount: result.paragraphs.length,
    highlightCount: result.highlights.length,
    modelFamilies: result.modelFamilies.map((m) => m.family),
    humanization: result.humanization.detected,
    warnings: result.warnings.map((w) => w.type),
  };

  const insertPayload: Record<string, unknown> = {
    user_id: userId,
    request_id: options.requestId || result.metadata.requestId,
    detector_version: result.metadata.detectorVersion,
    model_version: result.metadata.modelVersion,
    language_pipeline_version: result.metadata.languagePipelineVersion,
    calibration_version: result.metadata.calibrationVersion,
    content_type: result.contentType,
    language_code: result.metadata.languageCode,
    input_length: result.metadata.inputLength,
    word_count: result.metadata.wordCount,
    ai_probability: result.overall.aiProbability,
    human_probability: result.overall.humanProbability,
    mixed_probability: result.overall.mixedProbability,
    verdict: result.overall.verdict,
    confidence: result.overall.confidence,
    risk_level: result.overall.riskLevel,
    text_hash: textHash,
    metadata,
    retention_mode: options.zeroRetention ? 'zero_retention' : 'standard',
  };

  // Store the aggressive result snapshot when available.
  // The column is JSONB and nullable — old rows without it open normally.
  if (options.aggressiveResult) {
    insertPayload.aggressive_result = options.aggressiveResult;
  }

  const { data, error } = await supabase
    .from('detector_results')
    .insert(insertPayload)
    .select('id, request_id, created_at')
    .single();

  if (error) {
    console.error('Failed to save detector result:', error);
    return null;
  }

  return {
    id: data.id,
    requestId: data.request_id,
    createdAt: data.created_at,
  };
}

export async function submitFeedback(input: DetectorFeedbackInput): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required to submit feedback');

  const { error } = await supabase.from('detector_feedback').insert({
    result_id: input.resultId,
    user_id: user.id,
    feedback_type: input.feedbackType,
    user_label: input.userLabel,
    comment: input.comment?.trim() || null,
  });

  if (error) {
    console.error('Failed to submit feedback:', error);
    throw new Error(error.message);
  }
}

export async function fetchUserDetectorHistory(options: { limit?: number; offset?: number } = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('detector_results')
    .select('id, request_id, detector_version, content_type, language_code, ai_probability, human_probability, mixed_probability, verdict, confidence, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);

  if (error) {
    console.error('Failed to fetch detector history:', error);
    return [];
  }

  return Array.isArray(data) ? data : [];
}

export async function deleteDetectorResult(resultId: string): Promise<void> {
  const { error } = await supabase.from('detector_results').delete().eq('id', resultId);
  if (error) {
    console.error('Failed to delete detector result:', error);
    throw new Error(error.message);
  }
}

export async function deleteDetectorHistory(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');
  const { error } = await supabase.from('detector_results').delete().eq('user_id', user.id);
  if (error) {
    console.error('Failed to delete detector history:', error);
    throw new Error(error.message);
  }
}

export interface DetectorPrivacySettings {
  zeroRetention: boolean;
  retentionDays: number;
  allowFeedbackTraining: boolean;
}

export async function fetchDetectorPrivacySettings(): Promise<DetectorPrivacySettings> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { zeroRetention: false, retentionDays: 90, allowFeedbackTraining: false };
  const { data, error } = await supabase
    .from('profiles')
    .select('detector_zero_retention, detector_data_retention_days, allow_feedback_training')
    .eq('id', user.id)
    .maybeSingle();
  if (error || !data) {
    console.error('Failed to load detector privacy settings:', error);
    return { zeroRetention: false, retentionDays: 90, allowFeedbackTraining: false };
  }
  return {
    zeroRetention: data.detector_zero_retention,
    retentionDays: data.detector_data_retention_days,
    allowFeedbackTraining: data.allow_feedback_training,
  };
}

export async function updateDetectorPrivacySettings(settings: Partial<DetectorPrivacySettings>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');
  const payload: Record<string, any> = {};
  if (typeof settings.zeroRetention === 'boolean') payload.detector_zero_retention = settings.zeroRetention;
  if (typeof settings.retentionDays === 'number') payload.detector_data_retention_days = settings.retentionDays;
  if (typeof settings.allowFeedbackTraining === 'boolean') payload.allow_feedback_training = settings.allowFeedbackTraining;
  const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
  if (error) {
    console.error('Failed to update detector privacy settings:', error);
    throw new Error(error.message);
  }
}
