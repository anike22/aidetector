import { supabase } from '@/db/supabase';
import type { AdvancedTextAnalysisResult, AnalysisOptions, ContentType } from './types';

export class AnalysisError extends Error {
  constructor(
    message: string,
    public readonly code: 'AUTH_REQUIRED' | 'UPGRADE_REQUIRED' | 'RATE_LIMITED' | 'API_ERROR' | 'VALIDATION_ERROR' | 'NETWORK_ERROR',
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AnalysisError';
  }
}

export interface AnalyzeTextOptions {
  contentType?: ContentType;
  languageHint?: string;
  sentenceLevel?: boolean;
  paragraphLevel?: boolean;
  onGuestUsage?: (usage: { remaining: number; limit: number }) => void;
}

export interface GuestUsageInfo {
  remaining: number;
  limit: number;
}

export interface AnalyzeTextResponse {
  result: AdvancedTextAnalysisResult;
  guestUsage: GuestUsageInfo | null;
}

function buildRequestBody(
  text: string,
  options: Pick<AnalyzeTextOptions, 'contentType' | 'languageHint' | 'sentenceLevel' | 'paragraphLevel'>
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    text,
    sentence_level: options.sentenceLevel !== false,
    paragraph_level: options.paragraphLevel !== false,
  };
  if (options.contentType && options.contentType !== 'auto') {
    body.content_type = options.contentType;
  }
  if (options.languageHint) {
    body.language = options.languageHint;
  }
  return body;
}

export async function analyzeText(
  text: string,
  options: AnalyzeTextOptions = {}
): Promise<AdvancedTextAnalysisResult> {
  const startTime = performance.now();
  const { data: { session } } = await supabase.auth.getSession();
  const isAuthenticated = !!session?.access_token;
  const body = buildRequestBody(text, options);

  const headers: Record<string, string> = {};
  if (isAuthenticated) {
    headers.Authorization = `Bearer ${session.access_token}`;
  } else {
    // Anonymous users call the same detector endpoint. The anon key is used
    // as a valid JWT so the Edge Function gateway accepts the request, and the
    // function treats it as a guest session.
    headers.Authorization = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
  }

  let res: { data?: { result?: AdvancedTextAnalysisResult; [key: string]: unknown } | null; error?: { message?: string } | null } | undefined;
  try {
    res = await supabase.functions.invoke('detector', {
      body,
      headers,
    });
  } catch (err) {
    throw new AnalysisError(
      err instanceof Error ? err.message : 'Network error while contacting the detector service.',
      'NETWORK_ERROR'
    );
  }

  if (res?.error) {
    throw new AnalysisError(
      res.error.message || 'Detector service returned an error.',
      'API_ERROR'
    );
  }

  const data = res?.data as {
    error?: string;
    upgrade_required?: boolean;
    remaining?: number | null;
    limit?: number | null;
    plan?: string;
    result?: AdvancedTextAnalysisResult;
  } | null | undefined;

  if (!data) {
    throw new AnalysisError('Empty response from detector service.', 'API_ERROR');
  }

  if (data.upgrade_required) {
    throw new AnalysisError(
      data.error || 'Free trial limit reached. Sign up or upgrade to continue using the AI Detector.',
      'UPGRADE_REQUIRED',
      { remaining: data.remaining, limit: data.limit, plan: data.plan }
    );
  }

  if (data.error || !data.result) {
    throw new AnalysisError(
      data.error || 'The detector could not analyze this text.',
      'API_ERROR'
    );
  }

  if (!isAuthenticated && data.remaining !== null && data.limit !== null && options.onGuestUsage) {
    options.onGuestUsage({
      remaining: data.remaining ?? 0,
      limit: data.limit ?? 0,
    });
  }

  const processingTimeMs = Math.round(performance.now() - startTime);
  const result = data.result;
  result.metadata = {
    ...result.metadata,
    processingTimeMs,
  } as typeof result.metadata;

  return result;
}
