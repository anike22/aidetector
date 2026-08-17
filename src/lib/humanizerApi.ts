import { supabase } from '@/db/supabase';
import { HumanizerSettings, HumanizationJob, HumanizationVersion, HumanizationFeedback } from '../types/humanizer';

async function getHumanizerHeaders(): Promise<Record<string, string>> {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
}

async function invokePipeline(action: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const headers = await getHumanizerHeaders();
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/humanizer-pipeline`, {
    method: "POST",
    headers,
    body: JSON.stringify({ action, ...payload }),
  });

  const result = await response.json();
  if (!response.ok && !result.job) {
    throw new Error(result.error || `Failed to ${action}`);
  }
  return result;
}

export const humanizerApi = {
  createJob: async (
    text: string,
    settings: HumanizerSettings
  ): Promise<{ job: HumanizationJob; guestUsage: { remaining: number; limit: number } | null }> => {
    const result = await invokePipeline("create_job", { text, settings });
    if (!result.success) throw new Error((result.error as string) || "Failed to create job");
    const guestUsage =
      result.remaining !== null && result.limit !== null
        ? { remaining: result.remaining as number, limit: result.limit as number }
        : null;
    return { job: result.job as HumanizationJob, guestUsage };
  },

  processJob: async (jobId: string): Promise<HumanizationJob> => {
    const result = await invokePipeline("process_job", { job_id: jobId });
    // Partial completion returns success=false with a job payload; preserve the job so UI can show available alternatives
    if (!result.job && !result.success) throw new Error((result.error as string) || "Failed to process job");
    if (result.job) return result.job as HumanizationJob;
    throw new Error((result.error as string) || "Failed to process job");
  },

  retryMissingVersions: async (jobId: string): Promise<HumanizationJob> => {
    const result = await invokePipeline("retry_missing_versions", { job_id: jobId });
    if (!result.success) throw new Error((result.error as string) || "Failed to retry missing versions");
    return result.job as HumanizationJob;
  },

  retryAll: async (jobId: string): Promise<HumanizationJob> => {
    const result = await invokePipeline("retry_all", { job_id: jobId });
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
    return { ...job, alternatives: alternatives || [] } as HumanizationJob;
  },
  
  getJobs: async (): Promise<HumanizationJob[]> => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.access_token) return [];

    const { data, error } = await supabase
      .from('humanization_jobs')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as HumanizationJob[];
  },

  getJobVersions: async (jobId: string): Promise<HumanizationVersion[]> => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.access_token) {
      const result = await invokePipeline("get_job_versions", { job_id: jobId });
      if (!result.success) {
        throw new Error((result.error as string) || "Failed to fetch job versions");
      }
      return (result.versions || []) as HumanizationVersion[];
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

  toggleJobSaved: async (jobId: string, saved: boolean): Promise<void> => {
    const { error } = await supabase
      .from('humanization_jobs')
      .update({ saved })
      .eq('job_id', jobId);
      
    if (error) throw error;
  }
};
