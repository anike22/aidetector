import { supabase } from '@/db/supabase';
import { ensureGuestSession } from '@/lib/visitorId';
import { broadcastUsageUpdate } from '@/lib/entitlementsApi';
import { analyzeAdvancedText } from './engine';
import type { AdvancedTextAnalysisResult, ContentType } from './types';

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

/** Stable per-submission idempotency key (prevents duplicate charges). */
let keyCounter = 0;
function cryptoKey(): string {
  const c = typeof crypto !== 'undefined' ? (crypto as any) : undefined;
  const rnd = c?.randomUUID ? c.randomUUID() : `${Date.now()}_${++keyCounter}_${Math.random().toString(36).slice(2)}`;
  return `det_${rnd}`;
}

export async function analyzeText(
  text: string,
  options: AnalyzeTextOptions = {}
): Promise<AdvancedTextAnalysisResult> {
  const startTime = performance.now();
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new AnalysisError('Text is required for analysis.', 'VALIDATION_ERROR');
  }

  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || null;
  const guestId = userId ? null : await ensureGuestSession();

  const tz = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  })();

  // 1. Authoritative Server Entitlement & Atomic Reservation Check
  const { data: reservationData, error: reservationError } = await supabase.rpc('reserve_entitlement_and_credits', {
    p_user_id: userId,
    p_guest_id: guestId,
    p_feature_slug: 'ai_detector',
    p_credits_cost: 1,
    p_timezone: tz,
    p_idempotency_key: cryptoKey(),
    p_metadata: { text_length: text.length }
  });

  if (reservationError) {
    console.error('reserve_entitlement_and_credits error:', reservationError);
  }

  const reservation = (reservationData || [])[0] || {};

  if (reservation.allowed === false) {
    broadcastUsageUpdate();
    throw new AnalysisError(
      reservation.reason || 'Daily scan limit reached. Create a free account or upgrade to continue.',
      'UPGRADE_REQUIRED',
      {
        remaining: reservation.daily_remaining ?? 0,
        limit: reservation.daily_limit ?? (userId ? 10 : 3),
        plan: reservation.plan ?? (userId ? 'free' : 'guest')
      }
    );
  }

  const reservationId = reservation.reservation_id;

  // 2. High-Precision Full Detection Analysis
  let result: AdvancedTextAnalysisResult;
  try {
    result = await analyzeAdvancedText(text, {
      contentType: options.contentType || 'auto',
      languageHint: options.languageHint,
      sentenceLevel: options.sentenceLevel !== false,
      paragraphLevel: options.paragraphLevel !== false,
    });
  } catch (analysisErr) {
    // If analysis fails, release reservation
    if (reservationId) {
      try {
        await supabase.rpc('settle_client_reservation', {
          p_reservation_id: reservationId,
          p_outcome: 'failed',
          p_metadata: { reason: analysisErr instanceof Error ? analysisErr.message : 'Analysis failed' }
        });
      } catch (finalizeErr) {
        console.warn('finalize_credit_reservation failed error:', finalizeErr);
      }
    }
    broadcastUsageUpdate();
    throw new AnalysisError(
      analysisErr instanceof Error ? analysisErr.message : 'The detector could not analyze this text.',
      'API_ERROR'
    );
  }

  // 3. Finalize Atomic Reservation on Success
  if (reservationId) {
    try {
      await supabase.rpc('settle_client_reservation', {
        p_reservation_id: reservationId,
        p_outcome: 'success',
        p_metadata: {}
      });
    } catch (finalizeErr) {
      console.warn('finalize_credit_reservation success error:', finalizeErr);
    }
  }

  const durationMs = Math.round(performance.now() - startTime);
  if (result?.metadata) {
    result.metadata.processingTimeMs = durationMs;
  }

  if (!userId && reservation.daily_remaining !== null && options.onGuestUsage) {
    options.onGuestUsage({
      remaining: Math.max(0, (reservation.daily_remaining ?? 1) - 1),
      limit: reservation.daily_limit ?? 3,
    });
  }

  // Notify all UI listeners immediately so bars and numbers update in real time
  broadcastUsageUpdate();

  return result;
}
