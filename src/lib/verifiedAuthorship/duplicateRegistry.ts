// ─── Duplicate Registry & Fingerprint Conflict Engine ────────────────────────

import { supabase } from '@/db/supabase';
import {
  computeSimHashFingerprint,
  computeFingerprintSimilarity,
} from './cryptoUtils';

export interface DuplicateCheckResult {
  hasConflict: boolean;
  collisionType: 'none' | 'same_owner_version_match' | 'cross_account_conflict' | 'revoked_hash_match';
  similarityScore: number;
  matchedRegistrationId?: string;
  matchedTrackingCode?: string;
  matchedTitle?: string;
  message: string;
}

/**
 * Checks content hash and SimHash fingerprint against all registered works
 */
export async function checkDuplicateRegistry(
  contentHash: string,
  canonicalText: string,
  currentUserId: string,
  similarityThreshold: number = 95.0
): Promise<DuplicateCheckResult> {
  const currentFingerprint = computeSimHashFingerprint(canonicalText);

  // 1. Exact hash check on active/suspended/revoked registrations
  const { data: exactMatches, error: hashError } = await supabase
    .from('authorship_registrations')
    .select('id, user_id, tracking_code, title, status')
    .eq('content_hash', contentHash)
    .limit(5);

  if (hashError) {
    console.error('Error querying registry by hash:', hashError);
  }

  if (exactMatches && exactMatches.length > 0) {
    const match = exactMatches[0];
    if (match.user_id === currentUserId) {
      return {
        hasConflict: true,
        collisionType: 'same_owner_version_match',
        similarityScore: 100,
        matchedRegistrationId: match.id,
        matchedTrackingCode: match.tracking_code,
        matchedTitle: match.title,
        message: `Identical content is already registered under your account (${match.tracking_code}). You can create a new version under this registration instead of a duplicate claim.`,
      };
    } else {
      return {
        hasConflict: true,
        collisionType: 'cross_account_conflict',
        similarityScore: 100,
        matchedRegistrationId: match.id,
        matchedTrackingCode: match.tracking_code,
        message: `A matching content hash is already registered under another account. The submission will require administrator conflict review before certificate issuance.`,
      };
    }
  }

  // 2. Exact hash check on previous versions
  const { data: versionMatches } = await supabase
    .from('authorship_versions')
    .select('registration_id, version_tracking_code, title')
    .eq('content_hash', contentHash)
    .limit(1);

  if (versionMatches && versionMatches.length > 0) {
    const vMatch = versionMatches[0];
    return {
      hasConflict: true,
      collisionType: 'same_owner_version_match',
      similarityScore: 100,
      matchedRegistrationId: vMatch.registration_id,
      matchedTrackingCode: vMatch.version_tracking_code,
      matchedTitle: vMatch.title,
      message: `Identical content is already registered as an earlier version (${vMatch.version_tracking_code}).`,
    };
  }

  // 3. Near-duplicate fingerprint search across active registrations
  const { data: recentRegistrations } = await supabase
    .from('authorship_registrations')
    .select('id, user_id, tracking_code, title, raw_content')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(100);

  if (recentRegistrations && recentRegistrations.length > 0) {
    for (const reg of recentRegistrations) {
      if (!reg.raw_content) continue;
      const otherFp = computeSimHashFingerprint(reg.raw_content);
      const similarity = computeFingerprintSimilarity(currentFingerprint, otherFp);

      if (similarity >= similarityThreshold) {
        if (reg.user_id === currentUserId) {
          return {
            hasConflict: true,
            collisionType: 'same_owner_version_match',
            similarityScore: similarity,
            matchedRegistrationId: reg.id,
            matchedTrackingCode: reg.tracking_code,
            matchedTitle: reg.title,
            message: `Very similar content (${similarity}% match) is already registered under your account (${reg.tracking_code}). Consider creating an updated version.`,
          };
        } else {
          return {
            hasConflict: true,
            collisionType: 'cross_account_conflict',
            similarityScore: similarity,
            matchedRegistrationId: reg.id,
            matchedTrackingCode: reg.tracking_code,
            message: `High structural similarity (${similarity}%) detected with an existing registered work. A conflict review case will be opened.`,
          };
        }
      }
    }
  }

  // Clean registry check
  return {
    hasConflict: false,
    collisionType: 'none',
    similarityScore: 0,
    message: 'No duplicate content or existing registry conflict detected.',
  };
}
