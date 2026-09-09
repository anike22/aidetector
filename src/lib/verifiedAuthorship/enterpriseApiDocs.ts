/**
 * Enterprise REST API Specification & Mock Handlers
 * Section 18: Enterprise API and Integrations
 */

export interface AuthorshipApiEndpoint {
  method: 'GET' | 'POST' | 'DELETE' | 'PUT';
  path: string;
  scope: 'public' | 'read:authorship' | 'write:authorship' | 'admin:authorship';
  description: string;
  rateLimit: string;
  requestBodySchema?: Record<string, any>;
  responseSchema: Record<string, any>;
}

export const AUTHORSHIP_ENTERPRISE_API_SPEC: AuthorshipApiEndpoint[] = [
  {
    method: 'POST',
    path: '/api/v1/authorship/eligibility-check',
    scope: 'write:authorship',
    description: 'Executes pre-registration Integrity Gate (AI multi-model, originality, and collision detection) without creating persistent records.',
    rateLimit: '30 req/min',
    requestBodySchema: {
      content: 'string (min 50 chars)',
      title: 'string',
      language: 'string (e.g. "en")',
      thresholdVersion: 'string (optional)',
    },
    responseSchema: {
      passed: 'boolean',
      balancedAiScore: 'number',
      plagiarismOriginalityScore: 'number',
      duplicateDetected: 'boolean',
      canRegister: 'boolean',
    },
  },
  {
    method: 'POST',
    path: '/api/v1/authorship/registrations',
    scope: 'write:authorship',
    description: 'Registers a new manuscript claim with deterministic canonicalization, manifest signing, and certificate generation.',
    rateLimit: '10 req/min',
    requestBodySchema: {
      title: 'string',
      subtitle: 'string (optional)',
      content: 'string',
      category: 'string',
      language: 'string',
      creationDeclaration: 'object',
      collaborators: 'array',
      citations: 'array',
    },
    responseSchema: {
      registrationId: 'string (UUID)',
      trackingCode: 'string (ADC-AUTH-...)',
      canonicalContentHash: 'string (SHA-256)',
      status: 'string ("active")',
      verificationUrl: 'string',
      manifest: 'object',
    },
  },
  {
    method: 'GET',
    path: '/api/v1/authorship/verify/:trackingCode',
    scope: 'public',
    description: 'Retrieves safe public certificate metadata for a tracking code. Never returns manuscript body.',
    rateLimit: '120 req/min',
    responseSchema: {
      trackingCode: 'string',
      title: 'string',
      authorPublicName: 'string',
      registeredAt: 'string (ISO 8601)',
      status: 'string',
      contentHash: 'string',
      eligibilityBadges: 'array',
    },
  },
  {
    method: 'POST',
    path: '/api/v1/authorship/compare',
    scope: 'public',
    description: 'Zero-retention cryptographic content comparison. Evaluates candidate text in volatile memory and returns exact match status.',
    rateLimit: '60 req/min',
    requestBodySchema: {
      trackingCode: 'string',
      candidateText: 'string',
      canonicalizationVersion: 'string (e.g. "v1.0")',
    },
    responseSchema: {
      matchStatus: 'string ("exact_match_current" | "exact_match_earlier" | "no_match")',
      versionNumber: 'number',
      comparedAt: 'string (ISO 8601)',
    },
  },
  {
    method: 'POST',
    path: '/api/v1/authorship/disputes',
    scope: 'public',
    description: 'Submits an infringement or false authorship dispute against an active certificate.',
    rateLimit: '5 req/hour',
    requestBodySchema: {
      trackingCode: 'string',
      disputantEmail: 'string',
      disputeReason: 'string',
      evidenceUrls: 'array',
      statement: 'string',
    },
    responseSchema: {
      disputeTicketId: 'string',
      status: 'string ("pending")',
      submittedAt: 'string',
    },
  },
];
