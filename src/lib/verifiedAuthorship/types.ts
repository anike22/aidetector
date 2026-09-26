// ─── Verified Authorship TypeScript Types & Interfaces ────────────────────────

export type AuthorshipStatus = 'active' | 'pending_conflict_review' | 'suspended' | 'revoked';

export type DisputeStatus = 'pending' | 'under_review' | 'upheld' | 'dismissed';

export type ActorRole = 'owner' | 'admin' | 'system' | 'visitor';

/**
 * 8 Creation Declaration Categories (Section 3, Step 2)
 */
export type CreationDeclarationType =
  | 'entirely_human'
  | 'human_with_ai_editing'
  | 'human_with_ai_research'
  | 'partially_ai_substantially_rewritten'
  | 'translation'
  | 'collaborative_work'
  | 'previously_published_derivative'
  | 'authorized_derivative';

export interface CreationDeclaration {
  declarationType: CreationDeclarationType;
  declarationLabel: string;
  declarationStatement: string;
  isOriginalCreator: boolean;
  hasIntellectualPropertyRights: boolean;
  notKnowinglyCopied: boolean;
  understandsNotCopyrightGrant: boolean;
  acceptsTermsAndDisputes: boolean;
  signerIdentifier: string; // user id / email
  signerIpFingerprint?: string;
  signedTimestamp: string;
  additionalDeclarations?: string;
}

export interface CollaboratorDeclaration {
  name: string;
  role?: string;
  emailOrAffiliation?: string;
}

export interface CitationReference {
  id: string;
  sourceTitle: string;
  authorOrPublisher?: string;
  url?: string;
  quotedTextExcerpt?: string;
  licenseOrAttributionNotes?: string;
}

export interface IntegrityGateCheckResult {
  passed: boolean;
  gateScore: number;
  configuredThreshold: number;
  statusLabel: string;
  details: string;
  advisoryOnly?: boolean;
}

export interface IntegrityGateSummary {
  allPassed: boolean;
  evaluatedAt: string;
  thresholdVersion: string;
  balancedAiCheck: IntegrityGateCheckResult & {
    aiSignal: number;
    humanSignal: number;
    mixedSignal: number;
    verdict: string;
    risk: string;
    confidence: number;
    engineVersion: string;
  };
  aggressiveAiCheck: IntegrityGateCheckResult & {
    aiSignal: number;
    humanSignal: number;
    risk: string;
    recommendations: string[];
    isAdvisory: true;
  };
  plagiarismCheck: IntegrityGateCheckResult & {
    originalityPercent: number;
    verifiedSourcesCount: number;
    providerName: string;
  };
  duplicateRegistryCheck: IntegrityGateCheckResult & {
    collisionDetected: boolean;
    collisionType: 'none' | 'same_owner_version_match' | 'cross_account_conflict' | 'revoked_hash_match';
    existingRegistrationId?: string;
    similarityScore: number;
  };
  creditsDeducted: number;
  reservationId?: string;
}

export interface AuthorshipRegistration {
  id: string;
  userId: string;
  trackingCode: string;
  contentHash: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  category?: string | null;
  language: string;
  wordCount: number;
  charCount: number;
  claimedCreationDate?: string | null;
  publishedUrl?: string | null;
  citations: CitationReference[];
  collaborators: CollaboratorDeclaration[];
  tags: string[];
  rawContent: string; // Private
  documentName?: string | null;
  documentMimeType?: string | null;
  documentStoragePath?: string | null;
  privateEvidenceNotes?: string | null;
  privateEvidenceFiles: Array<{ name: string; path: string; size: number; mimeType: string }>;
  creationDeclaration: CreationDeclaration;
  declarationSignedAt: string;
  integrityGateResults: IntegrityGateSummary;
  balancedAiScore: number;
  aggressiveAiScore: number;
  plagiarismOriginalityScore: number;
  duplicateCheckResult: string;
  status: AuthorshipStatus;
  revocationReason?: string | null;
  revokedAt?: string | null;
  suspensionReason?: string | null;
  suspendedAt?: string | null;
  currentVersionNumber: number;
  viewCount: number;
  lookupCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorshipPublicCertificate {
  id: string;
  trackingCode: string;
  contentHash: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  category?: string | null;
  language: string;
  wordCount: number;
  claimedCreationDate?: string | null;
  publishedUrl?: string | null;
  collaborators: CollaboratorDeclaration[];
  tags: string[];
  declarationType: CreationDeclarationType;
  declarationLabel: string;
  declarationSignedAt: string;
  status: AuthorshipStatus;
  revocationReason?: string | null;
  revokedAt?: string | null;
  suspensionReason?: string | null;
  suspendedAt?: string | null;
  currentVersionNumber: number;
  createdAt: string;
  integrityGateSummary: {
    balancedAiScore: number;
    balancedHumanScore: number;
    balancedVerdict: string;
    balancedConfidence: number;
    aggressiveAiScore: number;
    aggressiveRisk: string;
    plagiarismOriginalityScore: number;
    duplicateCheckVerdict: string;
    thresholdsUsed: {
      maxBalancedAi: number;
      minOriginality: number;
    };
  };
  legalDisclaimer: string;
}

export interface AuthorshipVersion {
  id: string;
  registrationId: string;
  versionNumber: number;
  versionTrackingCode: string;
  contentHash: string;
  title: string;
  rawContent: string;
  changeSummary?: string | null;
  integrityGateResults: IntegrityGateSummary;
  creationDeclaration: CreationDeclaration;
  createdAt: string;
}

export interface AuthorshipDispute {
  id: string;
  registrationId: string;
  reporterEmail: string;
  reporterUserId?: string | null;
  claimReason: string;
  claimDescription: string;
  evidenceUrls: string[];
  evidenceFilePath?: string | null;
  status: DisputeStatus;
  ownerResponse?: string | null;
  ownerRespondedAt?: string | null;
  adminNotes?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  resolutionAction?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorshipAuditLog {
  id: string;
  registrationId?: string | null;
  actorUserId?: string | null;
  actorRole: ActorRole;
  action: string;
  details: Record<string, unknown>;
  ipFingerprint?: string | null;
  createdAt: string;
}

export interface AuthorshipPlatformSettings {
  id: string;
  balancedAiThresholdMax: number;
  plagiarismOriginalityMin: number;
  duplicateSimilarityThreshold: number;
  registrationCreditCost: number;
  allowCollaborators: boolean;
  maxFileSizeMb: number;
  signingKeyId: string;
  signingKeyActive: boolean;
  lastRotatedAt: string;
  updatedAt: string;
  updatedBy?: string | null;
}
