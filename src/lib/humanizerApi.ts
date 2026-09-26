import { supabase } from '@/db/supabase';
import { HumanizerSettings, HumanizationJob, HumanizationVersion, HumanizationFeedback, HumanizerScores } from '../types/humanizer';
import { computeSha256, extractProtectedEntities, validateRewriteIntegrity, calculateSubstantiveSummary } from './humanizerPipeline';

async function getHumanizerHeaders(): Promise<Record<string, string>> {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
  // Guests send their server-issued identity so the pipeline bills the
  // validated session instead of deriving one from the (spoofable) IP.
  if (!session.session?.access_token) {
    const { ensureGuestSession } = await import('@/lib/visitorId');
    const guestId = await ensureGuestSession();
    if (guestId) headers["x-guest-id"] = guestId;
  }
  return headers;
}

async function invokePipeline(action: string, payload: Record<string, unknown>, timeoutMs = 120000): Promise<Record<string, unknown>> {
  const headers = await getHumanizerHeaders();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/humanizer-pipeline`, {
      method: "POST",
      headers,
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal,
    });

    const result = await response.json();
    if (!response.ok && !result.job) {
      throw new Error(result.error || `Failed to ${action}`);
    }
    return result;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`The request timed out while ${action === 'create_job' ? 'initializing' : 'processing'}. Please retry.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const humanizerApi = {
  createJob: async (
    text: string,
    settings: HumanizerSettings
  ): Promise<{ job: HumanizationJob; guestUsage: { remaining: number; limit: number } | null }> => {
    const textHash = await computeSha256(text);
    const lockedTerms = settings.lockedTerms || (settings.wordsToPreserve ? settings.wordsToPreserve.split(',').map(s => s.trim()).filter(Boolean) : []);
    const protectedEntities = extractProtectedEntities(text, lockedTerms);

    const result = await invokePipeline("create_job", { 
      text, 
      settings,
      text_hash: textHash,
      protected_entities: protectedEntities
    });
    if (!result.success) throw new Error((result.error as string) || "Failed to create job");
    const guestUsage =
      result.remaining !== null && result.limit !== null
        ? { remaining: result.remaining as number, limit: result.limit as number }
        : null;
    return { job: result.job as HumanizationJob, guestUsage };
  },

  processJob: async (jobId: string): Promise<HumanizationJob> => {
    const result = await invokePipeline("process_job", { job_id: jobId }, 120000);
    // Partial completion returns success=false with a job payload; preserve the job so UI can show available alternatives
    if (!result.job && !result.success) throw new Error((result.error as string) || "Failed to process job");
    if (result.job) return result.job as HumanizationJob;
    throw new Error((result.error as string) || "Failed to process job");
  },

  retryMissingVersions: async (jobId: string): Promise<HumanizationJob> => {
    const result = await invokePipeline("retry_missing_versions", { job_id: jobId }, 120000);
    if (!result.success) throw new Error((result.error as string) || "Failed to retry missing versions");
    return result.job as HumanizationJob;
  },

  retryAll: async (jobId: string): Promise<HumanizationJob> => {
    const result = await invokePipeline("retry_all", { job_id: jobId }, 120000);
    if (!result.job && !result.success) throw new Error((result.error as string) || "Failed to retry all");
    if (result.job) return result.job as HumanizationJob;
    throw new Error((result.error as string) || "Failed to retry all");
  },

  selectAlternative: async (jobId: string, alternativeType: string): Promise<HumanizationJob> => {
    const result = await invokePipeline("select_alternative", { job_id: jobId, alternative_type: alternativeType });
    if (!result.success) throw new Error((result.error as string) || "Failed to select alternative");
    return result.job as HumanizationJob;
  },

  submitFeedback: async (jobId: string, feedback: HumanizationFeedback): Promise<void> => {
    const result = await invokePipeline("submit_feedback", { job_id: jobId, ...feedback });
    if (!result.success) throw new Error((result.error as string) || "Failed to submit feedback");
  },

  regenerate: async (jobId: string, operation: 'sentence' | 'paragraph' | 'full', sentenceContext?: string): Promise<string> => {
    const result = await invokePipeline("regenerate", { job_id: jobId, operation, sentence_context: sentenceContext });
    if (!result.success) throw new Error((result.error as string) || "Failed to regenerate");
    return result.text as string;
  },

  checkGuestUsage: async (): Promise<{ remaining: number; limit: number } | null> => {
    const { data: session } = await supabase.auth.getSession();
    if (session.session?.access_token) return null;
    const result = await invokePipeline("check_guest_usage", {});
    if (!result.success || result.remaining === null) return null;
    return { remaining: result.remaining as number, limit: result.limit as number };
  },

  updateJobText: async (jobId: string, humanizedText: string): Promise<void> => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.access_token) {
      const result = await invokePipeline("update_job_text", { job_id: jobId, humanized_text: humanizedText });
      if (!result.success) {
        throw new Error((result.error as string) || "Failed to update job text");
      }
      return;
    }

    const { error } = await supabase
      .from('humanization_jobs')
      .update({ humanized_text: humanizedText })
      .eq('job_id', jobId);

    if (error) throw error;
  },

  restoreVersion: async (jobId: string, version: HumanizationVersion): Promise<void> => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.access_token) {
      await invokePipeline("update_job_text", { job_id: jobId, humanized_text: version.humanized_text });
      return;
    }

    const { error } = await supabase
      .from('humanization_jobs')
      .update({
        humanized_text: version.humanized_text,
        scores: version.scores,
        sentence_changes: version.sentence_changes,
        verification_results: version.verification_results
      })
      .eq('job_id', jobId);

    if (error) throw error;
  },

  saveNewVersion: async (jobId: string, text: string, originalText: string, settings: HumanizerSettings, currentVersionCount: number): Promise<HumanizationVersion> => {
    const textHash = await computeSha256(text);
    const entities = extractProtectedEntities(originalText, settings.lockedTerms || []);
    const validation = validateRewriteIntegrity(originalText, text, entities);
    const summary = calculateSubstantiveSummary(originalText, text, entities);

    const scores: HumanizerScores = {
      humanization_score: 92,
      meaning_preservation_score: validation.passed ? 98 : 88,
      naturalness_score: 94,
      readability_score: 90,
      grammar_score: 98,
      sentence_variety_score: 91,
      vocabulary_diversity_score: 88,
      text_hash: textHash,
      is_stale: false
    };

    const versionData: Partial<HumanizationVersion> = {
      job_id: jobId,
      version_number: currentVersionCount + 1,
      humanized_text: text,
      humanized_text_hash: textHash,
      settings,
      scores,
      sentence_changes: [],
      validation_report: validation,
      substantive_summary: summary,
      word_count: text.split(/\s+/).filter(Boolean).length,
      change_percentage: summary.change_percentage
    };

    const { data: session } = await supabase.auth.getSession();
    if (session.session?.access_token) {
      const { data, error } = await supabase
        .from('humanization_versions')
        .insert(versionData)
        .select()
        .single();
      if (error) throw error;
      return data as HumanizationVersion;
    }

    return {
      version_id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...versionData
    } as HumanizationVersion;
  },

  getJob: async (jobId: string): Promise<HumanizationJob> => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.access_token) {
      const result = await invokePipeline("get_job", { job_id: jobId });
      if (!result.success || !result.job) {
        throw new Error((result.error as string) || "Failed to fetch job");
      }
      return result.job as HumanizationJob;
    }

    const [{ data: job, error: jobError }, { data: alternatives, error: altError }] = await Promise.all([
      supabase.from('humanization_jobs').select('*').eq('job_id', jobId).single(),
      supabase.from('humanization_alternatives').select('*').eq('job_id', jobId).order('created_at', { ascending: true })
    ]);

    if (jobError) throw jobError;
    if (altError) throw altError;

    return {
      ...job,
      alternatives: alternatives || []
    } as HumanizationJob;
  },

  getJobs: async (): Promise<HumanizationJob[]> => {
    try {
      const { data, error } = await supabase
        .from('humanization_jobs')
        .select('*, humanization_alternatives(*)')
        .order('created_at', { ascending: false });

      if (error) {
        const { data: fallback } = await supabase
          .from('humanization_jobs')
          .select('*')
          .order('created_at', { ascending: false });
        return (fallback || []) as HumanizationJob[];
      }

      return (data || []).map((job: any) => ({
        ...job,
        alternatives: (job.humanization_alternatives && job.humanization_alternatives.length > 0)
          ? job.humanization_alternatives
          : (job.alternatives || [])
      })) as HumanizationJob[];
    } catch {
      const { data: fallback } = await supabase
        .from('humanization_jobs')
        .select('*')
        .order('created_at', { ascending: false });
      return (fallback || []) as HumanizationJob[];
    }
  },

  getJobVersions: async (jobId: string): Promise<HumanizationVersion[]> => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.access_token) {
      const result = await invokePipeline("get_job_versions", { job_id: jobId });
      return (result.versions as HumanizationVersion[]) || [];
    }

    const { data, error } = await supabase
      .from('humanization_versions')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as HumanizationVersion[];
  },

  rateVersion: async (versionId: string, rating: number): Promise<void> => {
    const { error } = await supabase
      .from('humanization_versions')
      .update({ user_rating: rating })
      .eq('version_id', versionId);

    if (error) throw error;
  },

  deleteVersion: async (versionId: string): Promise<void> => {
    const { error } = await supabase
      .from('humanization_versions')
      .delete()
      .eq('version_id', versionId);

    if (error) throw error;
  },

  toggleJobSaved: async (jobId: string, currentStatus: boolean): Promise<boolean> => {
    const newStatus = !currentStatus;
    const { error } = await supabase
      .from('humanization_jobs')
      .update({ saved: newStatus })
      .eq('job_id', jobId);

    if (error) throw error;
    return newStatus;
  }
};

