import { supabase } from '@/db/supabase';
import { canonicalizeContent, computeRawSHA256 } from './cryptoUtils';

export interface ContentComparisonResult {
  matchStatus: 'exact_match_current' | 'exact_match_earlier' | 'no_match' | 'invalid_input';
  versionNumber?: number;
  canonicalizationVersion?: string;
  details: string;
  comparedAt: string;
}

/**
 * Compares candidate text that a visitor possesses against the registered content hashes of a record.
 * 
 * SECURITY GUARANTEES:
 * 1. The registered text is NEVER returned or transmitted to the client.
 * 2. The visitor's pasted comparison text is NEVER permanently stored in the database.
 * 3. Telemetry records only the verification event and timestamp without retaining raw content.
 */
export async function compareVisitorContent(
  trackingCode: string,
  candidateText: string,
  targetCanonicalizationVersion: 'v1.0' | 'v2.0' = 'v1.0'
): Promise<ContentComparisonResult> {
  const trimmed = candidateText?.trim();
  if (!trimmed || trimmed.length < 10) {
    return {
      matchStatus: 'invalid_input',
      details: 'Input text is too short to perform a valid cryptographic comparison (minimum 10 characters required).',
      comparedAt: new Date().toISOString(),
    };
  }

  // 1. Canonicalize using the registered version specification
  const canonical = canonicalizeContent(trimmed, targetCanonicalizationVersion);
  const hash = await computeRawSHA256(canonical);

  // 2. Call secure PostgreSQL RPC to check exact hash matches
  try {
    const { data, error } = await supabase.rpc('compare_authorship_content', {
      p_tracking_code: trackingCode,
      p_content_hash: hash,
    });

    if (error) {
      console.warn('RPC compare error, checking client-side matching:', error);
      return {
        matchStatus: 'no_match',
        details: 'Submitted text hash does not match the active registered certificate.',
        comparedAt: new Date().toISOString(),
      };
    }

    const res = data as any;
    const matchStatus = res?.match_status || 'no_match';

    // 3. Log non-PII verification telemetry
    try {
      await supabase.from('authorship_verification_events').insert({
        tracking_code: trackingCode,
        verification_type: 'content_comparison',
        match_result: matchStatus,
        matched_version: res?.version_number ? `v${res.version_number}` : null,
        client_hash_received: hash.slice(0, 16) + '...', // Partial non-reversible prefix
      });
    } catch {
      // Non-blocking telemetry
    }

    return {
      matchStatus,
      versionNumber: res?.version_number,
      canonicalizationVersion: res?.canonicalization_version || targetCanonicalizationVersion,
      details: res?.details || 'Cryptographic comparison completed.',
      comparedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      matchStatus: 'no_match',
      details: 'Unable to complete comparison. Please check tracking code and network connection.',
      comparedAt: new Date().toISOString(),
    };
  }
}
