import { supabase } from '@/db/supabase';

export interface FeedbackMetrics {
  totalFeedback: number;
  byType: Record<string, number>;
  byLabel: Record<string, number>;
  falsePositives: number;
  falseNegatives: number;
  unverified: number;
  reviewedCount: number;
}

export interface PerformanceByLanguage {
  language_code: string;
  result_count: number;
  avg_ai_probability: number;
  avg_confidence: number;
  feedback_count: number;
  incorrect_count: number;
}

export interface PerformanceByVersion {
  detector_version: string;
  result_count: number;
  avg_ai_probability: number;
  avg_confidence: number;
  feedback_count: number;
}

export interface ProblematicContentType {
  content_type: string;
  result_count: number;
  feedback_count: number;
  incorrect_count: number;
}

export interface RecentFeedbackItem {
  id: string;
  feedback_type: string;
  user_label: string;
  comment: string;
  reviewed: boolean;
  created_at: string;
  result_id: string;
  verdict: string;
  ai_probability: number;
  language_code: string;
  content_type: string;
  detector_version: string;
}

export async function fetchFeedbackMetrics(): Promise<FeedbackMetrics> {
  const { data, error } = await supabase.from('detector_feedback').select('*');
  if (error || !Array.isArray(data)) {
    console.error('Error fetching feedback metrics:', error);
    return {
      totalFeedback: 0,
      byType: {},
      byLabel: {},
      falsePositives: 0,
      falseNegatives: 0,
      unverified: 0,
      reviewedCount: 0,
    };
  }

  const byType: Record<string, number> = {};
  const byLabel: Record<string, number> = {};
  let falsePositives = 0;
  let falseNegatives = 0;
  let reviewedCount = 0;

  data.forEach((row) => {
    byType[row.feedback_type] = (byType[row.feedback_type] || 0) + 1;
    if (row.user_label) {
      byLabel[row.user_label] = (byLabel[row.user_label] || 0) + 1;
    }
    if (row.reviewed) reviewedCount += 1;
    // FP/FN approximations based on feedback labels alone; ground-truth comes from reviewed feedback.
    if (row.user_label === 'human' && row.feedback_type === 'incorrect') {
      falsePositives += 1;
    }
    if (row.user_label === 'ai' && row.feedback_type === 'incorrect') {
      falseNegatives += 1;
    }
  });

  return {
    totalFeedback: data.length,
    byType,
    byLabel,
    falsePositives,
    falseNegatives,
    unverified: data.length - reviewedCount,
    reviewedCount,
  };
}

export async function fetchPerformanceByLanguage(): Promise<PerformanceByLanguage[]> {
  const { data, error } = await supabase.rpc('detector_perf_by_language');
  if (error) {
    console.error('Error fetching performance by language:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function fetchPerformanceByVersion(): Promise<PerformanceByVersion[]> {
  const { data, error } = await supabase.rpc('detector_perf_by_version');
  if (error) {
    console.error('Error fetching performance by version:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function fetchProblematicContentTypes(): Promise<ProblematicContentType[]> {
  const { data, error } = await supabase.rpc('detector_problematic_content_types');
  if (error) {
    console.error('Error fetching problematic content types:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function fetchRecentFeedback(limit = 50): Promise<RecentFeedbackItem[]> {
  const { data, error } = await supabase
    .from('detector_feedback')
    .select('id, feedback_type, user_label, comment, reviewed, created_at, result_id, detector_results!result_id(verdict, ai_probability, language_code, content_type, detector_version)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !Array.isArray(data)) {
    console.error('Error fetching recent feedback:', error);
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    feedback_type: row.feedback_type,
    user_label: row.user_label,
    comment: row.comment,
    reviewed: row.reviewed,
    created_at: row.created_at,
    result_id: row.result_id,
    verdict: row.detector_results?.verdict || 'unknown',
    ai_probability: row.detector_results?.ai_probability || 0,
    language_code: row.detector_results?.language_code || 'unknown',
    content_type: row.detector_results?.content_type || 'unknown',
    detector_version: row.detector_results?.detector_version || 'unknown',
  }));
}
