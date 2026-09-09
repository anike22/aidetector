// ─── Verified Authorship Service & Data Access Layer ─────────────────────────

import { supabase } from '@/db/supabase';
import {
  computeContentSHA256,
  generateTrackingCode,
  generateVersionTrackingCode,
  canonicalizeContent,
  VERIFIED_AUTHORSHIP_LEGAL_DISCLAIMER,
} from './cryptoUtils';
import { executeIntegrityGate, fetchAuthorshipSettings } from './integrityGateEngine';
import type {
  AuthorshipRegistration,
  AuthorshipPublicCertificate,
  AuthorshipVersion,
  AuthorshipDispute,
  AuthorshipPlatformSettings,
  CreationDeclaration,
  CitationReference,
  CollaboratorDeclaration,
  IntegrityGateSummary,
} from './types';

export interface SubmitRegistrationParams {
  title: string;
  subtitle?: string;
  description?: string;
  category?: string;
  language: string;
  claimedCreationDate?: string;
  publishedUrl?: string;
  rawContent: string;
  citations?: CitationReference[];
  collaborators?: CollaboratorDeclaration[];
  tags?: string[];
  documentName?: string;
  documentMimeType?: string;
  documentStoragePath?: string;
  privateEvidenceNotes?: string;
  privateEvidenceFiles?: Array<{ name: string; path: string; size: number; mimeType: string }>;
  creationDeclaration: CreationDeclaration;
}

export interface RegisterResult {
  success: boolean;
  registration?: AuthorshipRegistration;
  publicCertificate?: AuthorshipPublicCertificate;
  integrityGateSummary?: IntegrityGateSummary;
  conflictDetails?: {
    isConflict: boolean;
    existingId?: string;
    existingTrackingCode?: string;
    message: string;
  };
  errorMessage?: string;
}

/**
 * Executes registration workflow:
 * 1. Sanitizes & canonicalizes content
 * 2. Runs Integrity Gate
 * 3. Handles conflict checks
 * 4. Generates tracking code and stores record
 * 5. Emits audit log
 */
export async function registerAuthorshipClaim(
  params: SubmitRegistrationParams,
  precomputedGate?: IntegrityGateSummary
): Promise<RegisterResult> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Authentication required to register authorship.');
  }

  const canonical = canonicalizeContent(params.rawContent);
  const contentHash = await computeContentSHA256(canonical);
  const wordCount = canonical.split(/\s+/).filter(Boolean).length;
  const charCount = canonical.length;

  // Run or use precomputed Integrity Gate
  const gateSummary = precomputedGate || (await executeIntegrityGate(canonical, user.id));

  // Check if blocked by duplicate cross-account collision
  if (gateSummary.duplicateRegistryCheck.collisionType === 'cross_account_conflict') {
    return {
      success: false,
      integrityGateSummary: gateSummary,
      conflictDetails: {
        isConflict: true,
        existingId: gateSummary.duplicateRegistryCheck.existingRegistrationId,
        message: 'A matching content hash is already registered under another account. A conflict review has been flagged.',
      },
      errorMessage: 'Registration blocked: duplicate registry conflict detected with another account.',
    };
  }

  if (!gateSummary.allPassed) {
    return {
      success: false,
      integrityGateSummary: gateSummary,
      errorMessage: 'Content did not pass one or more mandatory Integrity Gate eligibility requirements.',
    };
  }

  const trackingCode = generateTrackingCode();
  const status = 'active';

  const insertPayload = {
    user_id: user.id,
    tracking_code: trackingCode,
    content_hash: contentHash,
    title: params.title.trim(),
    subtitle: params.subtitle?.trim() || null,
    description: params.description?.trim() || null,
    category: params.category || 'General',
    language: params.language || 'en',
    word_count: wordCount,
    char_count: charCount,
    claimed_creation_date: params.claimedCreationDate || null,
    published_url: params.publishedUrl || null,
    citations: params.citations || [],
    collaborators: params.collaborators || [],
    tags: params.tags || [],
    raw_content: canonical,
    document_name: params.documentName || null,
    document_mime_type: params.documentMimeType || null,
    document_storage_path: params.documentStoragePath || null,
    private_evidence_notes: params.privateEvidenceNotes || null,
    private_evidence_files: params.privateEvidenceFiles || [],
    creation_declaration: params.creationDeclaration,
    declaration_signed_at: new Date().toISOString(),
    integrity_gate_results: gateSummary,
    balanced_ai_score: gateSummary.balancedAiCheck.aiSignal,
    aggressive_ai_score: gateSummary.aggressiveAiCheck.aiSignal,
    plagiarism_originality_score: gateSummary.plagiarismCheck.originalityPercent,
    duplicate_check_result: gateSummary.duplicateRegistryCheck.statusLabel,
    status,
    current_version_number: 1,
  };

  const { data: newReg, error: insertError } = await supabase
    .from('authorship_registrations')
    .insert(insertPayload)
    .select('*')
    .single();

  if (insertError || !newReg) {
    console.error('Insert registration error:', insertError);
    throw new Error(insertError?.message || 'Failed to save authorship registration to database.');
  }

  // Insert initial version record
  await supabase.from('authorship_versions').insert({
    registration_id: newReg.id,
    version_number: 1,
    version_tracking_code: trackingCode,
    content_hash: contentHash,
    title: params.title.trim(),
    raw_content: canonical,
    change_summary: 'Initial Registration',
    integrity_gate_results: gateSummary,
    creation_declaration: params.creationDeclaration,
  });

  // Record Audit Log
  await supabase.from('authorship_audit_logs').insert({
    registration_id: newReg.id,
    actor_user_id: user.id,
    actor_role: 'owner',
    action: 'REGISTER_CLAIM',
    details: {
      trackingCode,
      contentHash,
      title: params.title,
      balancedAiScore: gateSummary.balancedAiCheck.aiSignal,
      plagiarismScore: gateSummary.plagiarismCheck.originalityPercent,
    },
  });

  const registration = mapDbToRegistration(newReg);
  const publicCertificate = mapRegistrationToPublicCertificate(registration);

  return {
    success: true,
    registration,
    publicCertificate,
    integrityGateSummary: gateSummary,
  };
}

/**
 * Creates a new content version for an existing registration
 */
export async function createAuthorshipVersion(
  registrationId: string,
  newTitle: string,
  newContent: string,
  changeSummary: string,
  declaration: CreationDeclaration
): Promise<{ success: boolean; version?: AuthorshipVersion; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const { data: reg, error: regError } = await supabase
    .from('authorship_registrations')
    .select('*')
    .eq('id', registrationId)
    .eq('user_id', user.id)
    .single();

  if (regError || !reg) {
    throw new Error('Registration not found or unauthorized.');
  }

  if (reg.status === 'revoked') {
    throw new Error('Cannot add versions to a revoked certificate.');
  }

  const canonical = canonicalizeContent(newContent);
  const contentHash = await computeContentSHA256(canonical);
  const nextVersionNum = (reg.current_version_number || 1) + 1;
  const versionTrackingCode = generateVersionTrackingCode(reg.tracking_code, nextVersionNum);

  // Run Integrity Gate for new version
  const gateSummary = await executeIntegrityGate(canonical, user.id);
  if (!gateSummary.allPassed) {
    return {
      success: false,
      error: 'New content version failed Integrity Gate eligibility checks.',
    };
  }

  const { data: vRecord, error: vError } = await supabase
    .from('authorship_versions')
    .insert({
      registration_id: reg.id,
      version_number: nextVersionNum,
      version_tracking_code: versionTrackingCode,
      content_hash: contentHash,
      title: newTitle.trim(),
      raw_content: canonical,
      change_summary: changeSummary.trim(),
      integrity_gate_results: gateSummary,
      creation_declaration: declaration,
    })
    .select('*')
    .single();

  if (vError) throw new Error(vError.message);

  // Update parent registration
  await supabase
    .from('authorship_registrations')
    .update({
      title: newTitle.trim(),
      content_hash: contentHash,
      raw_content: canonical,
      current_version_number: nextVersionNum,
      word_count: canonical.split(/\s+/).filter(Boolean).length,
      char_count: canonical.length,
      integrity_gate_results: gateSummary,
      balanced_ai_score: gateSummary.balancedAiCheck.aiSignal,
      aggressive_ai_score: gateSummary.aggressiveAiCheck.aiSignal,
      plagiarism_originality_score: gateSummary.plagiarismCheck.originalityPercent,
      updated_at: new Date().toISOString(),
    })
    .eq('id', registrationId);

  // Audit log
  await supabase.from('authorship_audit_logs').insert({
    registration_id: reg.id,
    actor_user_id: user.id,
    actor_role: 'owner',
    action: 'CREATE_VERSION',
    details: {
      versionNumber: nextVersionNum,
      versionTrackingCode,
      contentHash,
      changeSummary,
    },
  });

  return {
    success: true,
    version: {
      id: vRecord.id,
      registrationId: vRecord.registration_id,
      versionNumber: vRecord.version_number,
      versionTrackingCode: vRecord.version_tracking_code,
      contentHash: vRecord.content_hash,
      title: vRecord.title,
      rawContent: vRecord.raw_content,
      changeSummary: vRecord.change_summary,
      integrityGateResults: vRecord.integrity_gate_results,
      creationDeclaration: vRecord.creation_declaration,
      createdAt: vRecord.created_at,
    },
  };
}

/**
 * Fetches public certificate by tracking code or ID (Safe for public visitors: NEVER exposes raw content)
 */
export async function fetchPublicCertificate(
  identifier: string
): Promise<AuthorshipPublicCertificate | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

  let query = supabase.from('authorship_registrations').select('*');
  if (isUuid) {
    query = query.eq('id', identifier);
  } else {
    query = query.eq('tracking_code', identifier.trim());
  }

  const { data, error } = await query.single();
  if (error || !data) {
    return null;
  }

  // Increment view count asynchronously
  supabase
    .from('authorship_registrations')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', data.id)
    .then();

  const reg = mapDbToRegistration(data);
  return mapRegistrationToPublicCertificate(reg);
}

/**
 * Fetches complete registration record for authenticated owner or admin
 */
export async function fetchOwnerRegistration(id: string): Promise<AuthorshipRegistration | null> {
  const { data, error } = await supabase
    .from('authorship_registrations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapDbToRegistration(data);
}

/**
 * Lists all registrations owned by current authenticated user
 */
export async function listOwnerRegistrations(): Promise<AuthorshipRegistration[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('authorship_registrations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(mapDbToRegistration);
}

export const fetchOwnerRegistrations = listOwnerRegistrations;

/**
 * Revokes a registration with an audit reason
 */
export async function revokeAuthorshipRegistration(
  id: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required.');

  const { error } = await supabase
    .from('authorship_registrations')
    .update({
      status: 'revoked',
      revocation_reason: reason.trim(),
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  await supabase.from('authorship_audit_logs').insert({
    registration_id: id,
    actor_user_id: user.id,
    actor_role: 'owner',
    action: 'REVOKE_CLAIM',
    details: { reason },
  });

  return { success: true };
}

/**
 * Submits a dispute / false claim report
 */
export async function submitAuthorshipDispute(params: {
  registrationId: string;
  reporterEmail: string;
  claimReason: string;
  claimDescription: string;
  evidenceUrls?: string[];
}): Promise<{ success: boolean; disputeId?: string; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('authorship_disputes')
    .insert({
      registration_id: params.registrationId,
      reporter_email: params.reporterEmail.trim(),
      reporter_user_id: user?.id || null,
      claim_reason: params.claimReason,
      claim_description: params.claimDescription.trim(),
      evidence_urls: params.evidenceUrls || [],
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };

  // Log dispute
  await supabase.from('authorship_audit_logs').insert({
    registration_id: params.registrationId,
    actor_user_id: user?.id || null,
    actor_role: user ? 'owner' : 'visitor',
    action: 'SUBMIT_DISPUTE',
    details: {
      reporterEmail: params.reporterEmail,
      claimReason: params.claimReason,
    },
  });

  return { success: true, disputeId: data?.id };
}

/**
 * Verifies any content text or hash against registered records
 */
export async function verifyHashOrContent(
  input: string
): Promise<{ isMatch: boolean; matchedRecord?: AuthorshipPublicCertificate; computedHash: string }> {
  const isHashFormat = /^[0-9a-f]{64}$/i.test(input.trim());
  const hashToSearch = isHashFormat ? input.trim().toLowerCase() : await computeContentSHA256(input);

  const { data, error } = await supabase
    .from('authorship_registrations')
    .select('*')
    .eq('content_hash', hashToSearch)
    .limit(1);

  if (!error && data && data.length > 0) {
    const reg = mapDbToRegistration(data[0]);
    return {
      isMatch: true,
      matchedRecord: mapRegistrationToPublicCertificate(reg),
      computedHash: hashToSearch,
    };
  }

  return {
    isMatch: false,
    computedHash: hashToSearch,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapDbToRegistration(row: any): AuthorshipRegistration {
  return {
    id: row.id,
    userId: row.user_id,
    trackingCode: row.tracking_code,
    contentHash: row.content_hash,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    category: row.category,
    language: row.language || 'en',
    wordCount: row.word_count || 0,
    charCount: row.char_count || 0,
    claimedCreationDate: row.claimed_creation_date,
    publishedUrl: row.published_url,
    citations: row.citations || [],
    collaborators: row.collaborators || [],
    tags: row.tags || [],
    rawContent: row.raw_content,
    documentName: row.document_name,
    documentMimeType: row.document_mime_type,
    documentStoragePath: row.document_storage_path,
    privateEvidenceNotes: row.private_evidence_notes,
    privateEvidenceFiles: row.private_evidence_files || [],
    creationDeclaration: row.creation_declaration,
    declarationSignedAt: row.declaration_signed_at,
    integrityGateResults: row.integrity_gate_results,
    balancedAiScore: Number(row.balanced_ai_score) || 0,
    aggressiveAiScore: Number(row.aggressive_ai_score) || 0,
    plagiarismOriginalityScore: Number(row.plagiarism_originality_score) || 0,
    duplicateCheckResult: row.duplicate_check_result,
    status: row.status,
    revocationReason: row.revocation_reason,
    revokedAt: row.revoked_at,
    suspensionReason: row.suspension_reason,
    suspendedAt: row.suspended_at,
    currentVersionNumber: row.current_version_number || 1,
    viewCount: row.view_count || 0,
    lookupCount: row.lookup_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRegistrationToPublicCertificate(reg: AuthorshipRegistration): AuthorshipPublicCertificate {
  const gate = reg.integrityGateResults;
  return {
    id: reg.id,
    trackingCode: reg.trackingCode,
    contentHash: reg.contentHash,
    title: reg.title,
    subtitle: reg.subtitle,
    description: reg.description,
    category: reg.category,
    language: reg.language,
    wordCount: reg.wordCount,
    claimedCreationDate: reg.claimedCreationDate,
    publishedUrl: reg.publishedUrl,
    collaborators: reg.collaborators,
    tags: reg.tags,
    declarationType: reg.creationDeclaration?.declarationType || 'entirely_human',
    declarationLabel: reg.creationDeclaration?.declarationLabel || 'Entirely Human-Written',
    declarationSignedAt: reg.declarationSignedAt,
    status: reg.status,
    revocationReason: reg.revocationReason,
    revokedAt: reg.revokedAt,
    suspensionReason: reg.suspensionReason,
    suspendedAt: reg.suspendedAt,
    currentVersionNumber: reg.currentVersionNumber,
    createdAt: reg.createdAt,
    integrityGateSummary: {
      balancedAiScore: reg.balancedAiScore,
      balancedHumanScore: gate?.balancedAiCheck?.humanSignal ?? (100 - reg.balancedAiScore),
      balancedVerdict: gate?.balancedAiCheck?.verdict || 'Human / Original Pattern',
      balancedConfidence: gate?.balancedAiCheck?.confidence || 92,
      aggressiveAiScore: reg.aggressiveAiScore,
      aggressiveRisk: gate?.aggressiveAiCheck?.risk || 'Low',
      plagiarismOriginalityScore: reg.plagiarismOriginalityScore,
      duplicateCheckVerdict: reg.duplicateCheckResult || 'Clean Registry Match',
      thresholdsUsed: {
        maxBalancedAi: gate?.balancedAiCheck?.configuredThreshold || 50,
        minOriginality: gate?.plagiarismCheck?.configuredThreshold || 90,
      },
    },
    legalDisclaimer: VERIFIED_AUTHORSHIP_LEGAL_DISCLAIMER,
  };
}
