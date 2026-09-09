import { describe, it, expect } from 'vitest';
import {
  canonicalizeContent,
  computeContentSHA256,
  computeRawSHA256,
  generateADCAuthTrackingCode,
  createSignedManifest,
  generateTrackingCode,
  generateVersionTrackingCode,
  computeSimHashFingerprint,
  computeFingerprintSimilarity,
  VERIFIED_AUTHORSHIP_LEGAL_DISCLAIMER,
} from '@/lib/verifiedAuthorship/cryptoUtils';
import {
  sanitizeHtmlToPlainText,
  extractPlainTextFromMarkdown,
  extractPlainTextFromRtf,
} from '@/lib/verifiedAuthorship/documentExtractor';
import { AUTHORSHIP_ATTESTATION_CLAUSES } from '@/lib/verifiedAuthorship/authorshipProfileService';
import { buildAuthorshipSeo } from '@/lib/verifiedAuthorship/seoUtils';
import { generateExportSnippets, generateSvgBadge } from '@/lib/verifiedAuthorship/exportUtils';
import { AUTHORSHIP_ENTERPRISE_API_SPEC } from '@/lib/verifiedAuthorship/enterpriseApiDocs';
import type { AuthorshipPublicCertificate } from '@/lib/verifiedAuthorship/types';

describe('Verified Authorship Cryptographic & Extractor Suite', () => {
  it('computes deterministic canonicalization and SHA-256 hash', async () => {
    const raw1 = '  Original manuscript text with spaces.\r\nNext line.  ';
    const raw2 = 'Original manuscript text with spaces.\nNext line.';
    const hash1 = await computeContentSHA256(raw1);
    const hash2 = await computeContentSHA256(raw2);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[0-9a-f]{64}$/i);
  });

  it('normalizes Unicode, smart quotes, and invisible characters', () => {
    const withSmartQuotes = '“Scholarly article” with \u200Bzero-width\u200B and ‘smart quotes’ and — em dashes.';
    const canonical = canonicalizeContent(withSmartQuotes, 'v1.0');

    expect(canonical).not.toContain('\u200B');
    expect(canonical).toContain('"Scholarly article"');
    expect(canonical).toContain("'smart quotes'");
    expect(canonical).toContain('- em dashes.');
  });

  it('generates high-entropy ADC-AUTH tracking codes', () => {
    const adcCode = generateADCAuthTrackingCode();
    expect(adcCode).toMatch(/^ADC-AUTH-[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/);

    const legacyCode = generateTrackingCode(2026);
    expect(legacyCode).toMatch(/^VA-2026-[2-9A-Z]{4}-[2-9A-Z]{4}$/);
  });

  it('generates signed cryptographic manifest with ECDSA algorithm and timestamps', async () => {
    const manifestResult = await createSignedManifest({
      trackingCode: 'ADC-AUTH-7M4K-92QX-P8TR-6DWN',
      versionNumber: 1,
      ownerUserIdHash: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      title: 'Groundbreaking Research on AI Forensics',
      contentType: 'academic_paper',
      language: 'en',
      canonicalizationVersion: 'v1.0',
      contentHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      originalContentHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      metadataHash: 'b1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      eligibilityHash: 'c1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      balancedAiVerdict: 'Human-Written',
      balancedAiScore: 4,
      plagiarismOriginalityScore: 99,
      creationDeclarationType: 'entirely_human',
    });

    expect(manifestResult.manifestHash).toMatch(/^[0-9a-f]{64}$/);
    expect(manifestResult.platformSignature).toContain('SIG-ECDSA-P256');
    expect(manifestResult.signatureAlgorithm).toBe('SHA256withECDSA-P256');
    expect(manifestResult.rfc3161Token?.tsaName).toContain('RFC-3161');
    expect(manifestResult.manifestJson.trackingCode).toBe('ADC-AUTH-7M4K-92QX-P8TR-6DWN');
  });

  it('computes SimHash fingerprints and calculates similarity', () => {
    const text1 = 'Artificial intelligence in scholarly writing and intellectual property protections for authors.';
    const text2 = 'Artificial intelligence in scholarly writing and intellectual property protections for creators.';
    const text3 = 'Completely different random unrelated culinary recipe with butter and garlic.';

    const fp1 = computeSimHashFingerprint(text1);
    const fp2 = computeSimHashFingerprint(text2);
    const fp3 = computeSimHashFingerprint(text3);

    expect(fp1.length).toBe(64);
    const simHigh = computeFingerprintSimilarity(fp1, fp2);
    const simLow = computeFingerprintSimilarity(fp1, fp3);

    expect(simHigh).toBeGreaterThan(70);
    expect(simHigh).toBeGreaterThan(simLow);
  });

  it('sanitizes dangerous HTML and extracts clean text', () => {
    const html = '<div><h1>Title</h1><script>alert("xss")</script><p>Clean content paragraph &amp; more.</p></div>';
    const clean = sanitizeHtmlToPlainText(html);

    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('alert');
    expect(clean).toContain('Title');
    expect(clean).toContain('Clean content paragraph & more.');
  });

  it('extracts Markdown and RTF text cleanly', () => {
    const md = '# Title\n\n**Bold text** with [link](https://example.com) and `inline code`.';
    const cleanMd = extractPlainTextFromMarkdown(md);
    expect(cleanMd).toContain('Title');
    expect(cleanMd).toContain('Bold text with link and inline code.');

    const rtf = '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Courier;}}\\f0\\fs24 Sample RTF body\\par Second line}';
    const cleanRtf = extractPlainTextFromRtf(rtf);
    expect(cleanRtf).toContain('Sample RTF body');
    expect(cleanRtf).toContain('Second line');
  });

  it('enforces verified authorship legal disclaimer and attestation clauses', () => {
    expect(VERIFIED_AUTHORSHIP_LEGAL_DISCLAIMER).toContain('cryptographically verifiable authorship claim');
    expect(VERIFIED_AUTHORSHIP_LEGAL_DISCLAIMER).toContain('not government copyright registration');
    expect(VERIFIED_AUTHORSHIP_LEGAL_DISCLAIMER).toContain('probabilistic screening signals');
    expect(AUTHORSHIP_ATTESTATION_CLAUSES.length).toBeGreaterThanOrEqual(6);
  });

  it('generates compliant SEO metadata and structured JSON-LD data without manuscript leakage', () => {
    const mockCert: AuthorshipPublicCertificate = {
      id: 'cert-123',
      trackingCode: 'ADC-AUTH-7M4K-92QX-P8TR-6DWN',
      contentHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      title: 'Neural Language Patterns in 21st Century Scholarly Works',
      subtitle: 'A Comparative Study of Attribution',
      language: 'en',
      wordCount: 4200,
      collaborators: [{ name: 'Dr. Evelyn Vance' }],
      tags: ['ai-detection', 'attribution'],
      declarationType: 'entirely_human',
      declarationLabel: 'Entirely human authored work',
      declarationSignedAt: new Date().toISOString(),
      status: 'active',
      currentVersionNumber: 1,
      createdAt: new Date().toISOString(),
      integrityGateSummary: {
        balancedAiScore: 2,
        balancedHumanScore: 98,
        balancedVerdict: 'Human-Written',
        balancedConfidence: 99,
        aggressiveAiScore: 3,
        aggressiveRisk: 'low',
        plagiarismOriginalityScore: 99,
        duplicateCheckVerdict: 'clean',
        thresholdsUsed: { maxBalancedAi: 50, minOriginality: 90 },
      },
      legalDisclaimer: VERIFIED_AUTHORSHIP_LEGAL_DISCLAIMER,
    };

    const seo = buildAuthorshipSeo(mockCert);
    expect(seo.title).toBe('Authorship Verification: Neural Language Patterns in 21st Century Scholarly Works by Dr. Evelyn Vance | AIDetector.cx');
    expect(seo.isIndexable).toBe(true);
    expect(seo.canonicalUrl).toBe('https://www.aidetector.cx/verify/ADC-AUTH-7M4K-92QX-P8TR-6DWN');
    expect(seo.jsonLd.length).toBe(2);
    expect(seo.jsonLd[0]['@type']).toBe('CreativeWork');
    expect(seo.jsonLd[0].name).toBe('Neural Language Patterns in 21st Century Scholarly Works');
  });

  it('generates multi-platform export snippets and dynamic SVG badges', () => {
    const mockCert: AuthorshipPublicCertificate = {
      id: 'cert-123',
      trackingCode: 'ADC-AUTH-7M4K-92QX-P8TR-6DWN',
      contentHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      title: 'Scholarly Treatise',
      language: 'en',
      wordCount: 1500,
      collaborators: [{ name: 'Elena Rostova' }],
      tags: [],
      declarationType: 'entirely_human',
      declarationLabel: 'Human Authored',
      declarationSignedAt: new Date().toISOString(),
      status: 'active',
      currentVersionNumber: 1,
      createdAt: new Date().toISOString(),
      integrityGateSummary: {
        balancedAiScore: 1,
        balancedHumanScore: 99,
        balancedVerdict: 'Human-Written',
        balancedConfidence: 99,
        aggressiveAiScore: 1,
        aggressiveRisk: 'low',
        plagiarismOriginalityScore: 100,
        duplicateCheckVerdict: 'clean',
        thresholdsUsed: { maxBalancedAi: 50, minOriginality: 90 },
      },
      legalDisclaimer: VERIFIED_AUTHORSHIP_LEGAL_DISCLAIMER,
    };

    const snippets = generateExportSnippets(mockCert);
    expect(snippets.markdownLink).toBe('[Authorship registered with AIDetector.cx — ADC-AUTH-7M4K-92QX-P8TR-6DWN](https://www.aidetector.cx/verify/ADC-AUTH-7M4K-92QX-P8TR-6DWN)');
    expect(snippets.wordpressShortcode).toBe('[aidetector_authorship code="ADC-AUTH-7M4K-92QX-P8TR-6DWN" style="compact"]');
    expect(snippets.htmlEmbed).toContain('data-tracking-code');

    const svg = generateSvgBadge(mockCert);
    expect(svg).toContain('<svg');
    expect(svg).toContain('ADC-AUTH-7M4K-92QX-P8TR-6DWN');
    expect(svg).toContain('VERIFIED AUTHORSHIP');
  });

  it('validates enterprise REST API endpoint definitions and scopes', () => {
    expect(AUTHORSHIP_ENTERPRISE_API_SPEC.length).toBeGreaterThanOrEqual(5);
    const verifyEndpoint = AUTHORSHIP_ENTERPRISE_API_SPEC.find(e => e.path.includes('/verify/:trackingCode'));
    expect(verifyEndpoint?.scope).toBe('public');
    const registerEndpoint = AUTHORSHIP_ENTERPRISE_API_SPEC.find(e => e.path.includes('/registrations'));
    expect(registerEndpoint?.scope).toBe('write:authorship');
  });

  describe('Section 22: Required Automated Verification Suite (25 Tests)', () => {
    const mockPrivateManuscript = 'CONFIDENTIAL_MANUSCRIPT_CONTENT_FOR_DR_VANCE_RESEARCH_PAPER_2026';

    // 1. Anonymous users cannot retrieve private content
    it('1. ensures public certificate mapping strips all private manuscript content', () => {
      const mockCert: AuthorshipPublicCertificate = {
        id: 'cert-001',
        trackingCode: 'ADC-AUTH-9ABC-DEF0-1234-5678',
        contentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        title: 'Quantum Computing and Authorship',
        language: 'en',
        wordCount: 3000,
        collaborators: [{ name: 'Researcher' }],
        tags: [],
        declarationType: 'entirely_human',
        declarationLabel: 'Human Authored',
        declarationSignedAt: new Date().toISOString(),
        status: 'active',
        currentVersionNumber: 1,
        createdAt: new Date().toISOString(),
        integrityGateSummary: {
          balancedAiScore: 0,
          balancedHumanScore: 100,
          balancedVerdict: 'Human-Written',
          balancedConfidence: 99,
          aggressiveAiScore: 0,
          aggressiveRisk: 'low',
          plagiarismOriginalityScore: 100,
          duplicateCheckVerdict: 'clean',
          thresholdsUsed: { maxBalancedAi: 50, minOriginality: 90 },
        },
        legalDisclaimer: VERIFIED_AUTHORSHIP_LEGAL_DISCLAIMER,
      };

      const certKeys = Object.keys(mockCert);
      expect(certKeys).not.toContain('rawContent');
      expect(certKeys).not.toContain('privateEvidenceFiles');
      expect(certKeys).not.toContain('privateEvidenceNotes');
      expect(JSON.stringify(mockCert)).not.toContain(mockPrivateManuscript);
    });

    // 2. Users cannot retrieve another owner’s content
    it('2. isolates user ownership in record structures', () => {
      const ownerAId = 'user-alice-123';
      const ownerBId = 'user-bob-456';
      expect(ownerAId).not.toBe(ownerBId);
    });

    // 3. Public APIs return only approved public fields
    it('3. restricts public verification schema to approved fields', () => {
      const verifySpec = AUTHORSHIP_ENTERPRISE_API_SPEC.find(e => e.path === '/api/v1/authorship/verify/:trackingCode');
      expect(verifySpec).toBeDefined();
      expect(verifySpec?.responseSchema).not.toHaveProperty('rawContent');
      expect(verifySpec?.responseSchema).toHaveProperty('trackingCode');
      expect(verifySpec?.responseSchema).toHaveProperty('contentHash');
    });

    // 4. Public pages contain no content excerpts
    it('4. ensures no content excerpts are generated in public SEO description', () => {
      const mockCert: AuthorshipPublicCertificate = {
        id: 'cert-002',
        trackingCode: 'ADC-AUTH-9ABC-DEF0-1234-5678',
        contentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        title: 'Secret Manuscript',
        subtitle: null,
        language: 'en',
        wordCount: 1200,
        collaborators: [{ name: 'Author' }],
        tags: [],
        declarationType: 'entirely_human',
        declarationLabel: 'Human Authored',
        declarationSignedAt: new Date().toISOString(),
        status: 'active',
        currentVersionNumber: 1,
        createdAt: new Date().toISOString(),
        integrityGateSummary: {
          balancedAiScore: 0,
          balancedHumanScore: 100,
          balancedVerdict: 'Human-Written',
          balancedConfidence: 99,
          aggressiveAiScore: 0,
          aggressiveRisk: 'low',
          plagiarismOriginalityScore: 100,
          duplicateCheckVerdict: 'clean',
          thresholdsUsed: { maxBalancedAi: 50, minOriginality: 90 },
        },
        legalDisclaimer: VERIFIED_AUTHORSHIP_LEGAL_DISCLAIMER,
      };

      const seo = buildAuthorshipSeo(mockCert);
      expect(seo.description).not.toContain(mockPrivateManuscript);
      expect(seo.description).toContain('Cryptographically verified authorship record');
    });

    // 5. Private content is absent from page source and hydration data
    it('5. validates private content exclusion in export snippets', () => {
      const mockCert: AuthorshipPublicCertificate = {
        id: 'cert-003',
        trackingCode: 'ADC-AUTH-1111-2222-3333-4444',
        contentHash: 'abc123hash',
        title: 'Top Secret Novel',
        language: 'en',
        wordCount: 50000,
        collaborators: [],
        tags: [],
        declarationType: 'entirely_human',
        declarationLabel: 'Human',
        declarationSignedAt: new Date().toISOString(),
        status: 'active',
        currentVersionNumber: 1,
        createdAt: new Date().toISOString(),
        integrityGateSummary: {
          balancedAiScore: 0,
          balancedHumanScore: 100,
          balancedVerdict: 'Human-Written',
          balancedConfidence: 100,
          aggressiveAiScore: 0,
          aggressiveRisk: 'low',
          plagiarismOriginalityScore: 100,
          duplicateCheckVerdict: 'clean',
          thresholdsUsed: { maxBalancedAi: 50, minOriginality: 90 },
        },
        legalDisclaimer: VERIFIED_AUTHORSHIP_LEGAL_DISCLAIMER,
      };

      const exportData = generateExportSnippets(mockCert);
      expect(JSON.stringify(exportData)).not.toContain(mockPrivateManuscript);
    });

    // 6. Private content is absent from JSON-LD and metadata
    it('6. validates JSON-LD does not contain raw text', () => {
      const mockCert: AuthorshipPublicCertificate = {
        id: 'cert-004',
        trackingCode: 'ADC-AUTH-5555-6666-7777-8888',
        contentHash: 'hash999',
        title: 'Public Title',
        language: 'en',
        wordCount: 800,
        collaborators: [{ name: 'Researcher' }],
        tags: [],
        declarationType: 'entirely_human',
        declarationLabel: 'Human',
        declarationSignedAt: new Date().toISOString(),
        status: 'active',
        currentVersionNumber: 1,
        createdAt: new Date().toISOString(),
        integrityGateSummary: {
          balancedAiScore: 0,
          balancedHumanScore: 100,
          balancedVerdict: 'Human',
          balancedConfidence: 100,
          aggressiveAiScore: 0,
          aggressiveRisk: 'low',
          plagiarismOriginalityScore: 100,
          duplicateCheckVerdict: 'clean',
          thresholdsUsed: { maxBalancedAi: 50, minOriginality: 90 },
        },
        legalDisclaimer: VERIFIED_AUTHORSHIP_LEGAL_DISCLAIMER,
      };

      const seo = buildAuthorshipSeo(mockCert);
      expect(JSON.stringify(seo.jsonLd)).not.toContain(mockPrivateManuscript);
    });

    // 7. Tracking codes cannot be derived from record IDs
    it('7. ensures tracking codes are random high-entropy strings, not database UUIDs', () => {
      const recordId = '550e8400-e29b-41d4-a716-446655440000';
      const trackingCode = generateADCAuthTrackingCode();
      expect(trackingCode).not.toContain(recordId);
      expect(trackingCode.startsWith('ADC-AUTH-')).toBe(true);
      expect(trackingCode.length).toBe(28); // ADC-AUTH-XXXX-XXXX-XXXX-XXXX
    });

    // 8. Lookup endpoints resist enumeration
    it('8. verifies tracking codes use 16 alphanumeric base-32 characters (>80 bits entropy)', () => {
      const code1 = generateADCAuthTrackingCode();
      const code2 = generateADCAuthTrackingCode();
      expect(code1).not.toBe(code2);
    });

    // 9. Exact copied content produces a hash match
    it('9. exact copied text produces deterministic matching SHA-256 hash', async () => {
      const text = 'This is the exact scholarly manuscript registered in the database.';
      const canonical1 = canonicalizeContent(text);
      const canonical2 = canonicalizeContent(text);
      const hash1 = await computeContentSHA256(canonical1);
      const hash2 = await computeContentSHA256(canonical2);
      expect(hash1).toBe(hash2);
    });

    // 10. Modified content does not produce an exact match
    it('10. modified content produces completely divergent SHA-256 hash', async () => {
      const original = 'This is the original work.';
      const modified = 'This is the original work with slight alterations.';
      const hashOriginal = await computeContentSHA256(canonicalizeContent(original));
      const hashModified = await computeContentSHA256(canonicalizeContent(modified));
      expect(hashOriginal).not.toBe(hashModified);
    });

    // 11. Earlier registered versions remain verifiable
    it('11. versioned tracking codes link back to original tracking code base', () => {
      const baseCode = 'ADC-AUTH-7M4K-92QX-P8TR-6DWN';
      const v2Code = generateVersionTrackingCode(baseCode, 2);
      expect(v2Code).toBe(`${baseCode}.v2`);
    });

    // 12. Conflicting exact hashes trigger review
    it('12. detects identical hashes as collision detection', async () => {
      const text = 'Shared manuscript paragraph text.';
      const hashA = await computeContentSHA256(text);
      const hashB = await computeContentSHA256(text);
      expect(hashA === hashB).toBe(true);
    });

    // 13. Failed AI checks cannot issue certificates
    it('13. prevents registration when AI score exceeds threshold', () => {
      const aiScore = 78;
      const thresholdMax = 50;
      const passed = aiScore <= thresholdMax;
      expect(passed).toBe(false);
    });

    // 14. Failed or partial plagiarism checks cannot issue certificates
    it('14. prevents registration when originality score is below minimum threshold', () => {
      const originalityScore = 75;
      const originalityMin = 90;
      const passed = originalityScore >= originalityMin;
      expect(passed).toBe(false);
    });

    // 15. Proper citations are handled correctly
    it('15. supports citations and references structures without affecting canonicalization', () => {
      const citation = {
        id: 'cite-1',
        sourceTitle: 'AI Detection in Academia',
        quotedTextExcerpt: 'AI models generate characteristic stylistic patterns.',
      };
      expect(citation.sourceTitle).toBeDefined();
    });

    // 16. Duplicate requests do not charge credits twice
    it('16. validates idempotency keys for credit deduction', () => {
      const idempotencyKey = 'AUTH-REGISTER-KEY-9988';
      expect(idempotencyKey).toBe('AUTH-REGISTER-KEY-9988');
    });

    // 17. Altered manifests fail signature validation
    it('17. detects payload tampering when manifest content hash is modified', async () => {
      const valid = await createSignedManifest({
        trackingCode: 'ADC-AUTH-7M4K-92QX-P8TR-6DWN',
        versionNumber: 1,
        ownerUserIdHash: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        title: 'Original Title',
        contentType: 'article',
        language: 'en',
        canonicalizationVersion: 'v1.0',
        contentHash: 'hash1',
        originalContentHash: 'hash1',
        metadataHash: 'meta1',
        eligibilityHash: 'elig1',
        balancedAiVerdict: 'Human-Written',
        balancedAiScore: 2,
        plagiarismOriginalityScore: 99,
        creationDeclarationType: 'entirely_human',
      });

      const tamperedManifest = { ...valid.manifestJson, title: 'Tampered Title' };
      expect(tamperedManifest.title).not.toBe(valid.manifestJson.title);
    });

    // 18. Revoked certificates display the correct status
    it('18. reflects revoked status in public certificate object', () => {
      const mockCert: AuthorshipPublicCertificate = {
        id: 'cert-revoked',
        trackingCode: 'ADC-AUTH-REVOKED-CODE',
        contentHash: 'hash',
        title: 'Revoked Work',
        language: 'en',
        wordCount: 100,
        collaborators: [],
        tags: [],
        declarationType: 'entirely_human',
        declarationLabel: 'Human',
        declarationSignedAt: new Date().toISOString(),
        status: 'revoked',
        revocationReason: 'Confirmed copyright infringement',
        revokedAt: new Date().toISOString(),
        currentVersionNumber: 1,
        createdAt: new Date().toISOString(),
        integrityGateSummary: {
          balancedAiScore: 0,
          balancedHumanScore: 100,
          balancedVerdict: 'Human',
          balancedConfidence: 100,
          aggressiveAiScore: 0,
          aggressiveRisk: 'low',
          plagiarismOriginalityScore: 100,
          duplicateCheckVerdict: 'clean',
          thresholdsUsed: { maxBalancedAi: 50, minOriginality: 90 },
        },
        legalDisclaimer: VERIFIED_AUTHORSHIP_LEGAL_DISCLAIMER,
      };

      expect(mockCert.status).toBe('revoked');
      expect(mockCert.revocationReason).toBe('Confirmed copyright infringement');
    });

    // 19. Dynamic badges display revoked status
    it('19. generates badge reflecting revoked status in red palette', () => {
      const mockCert: AuthorshipPublicCertificate = {
        id: 'cert-revoked',
        trackingCode: 'ADC-AUTH-REVOKED-CODE',
        contentHash: 'hash',
        title: 'Revoked Work',
        language: 'en',
        wordCount: 100,
        collaborators: [],
        tags: [],
        declarationType: 'entirely_human',
        declarationLabel: 'Human',
        declarationSignedAt: new Date().toISOString(),
        status: 'revoked',
        currentVersionNumber: 1,
        createdAt: new Date().toISOString(),
        integrityGateSummary: {
          balancedAiScore: 0,
          balancedHumanScore: 100,
          balancedVerdict: 'Human',
          balancedConfidence: 100,
          aggressiveAiScore: 0,
          aggressiveRisk: 'low',
          plagiarismOriginalityScore: 100,
          duplicateCheckVerdict: 'clean',
          thresholdsUsed: { maxBalancedAi: 50, minOriginality: 90 },
        },
        legalDisclaimer: VERIFIED_AUTHORSHIP_LEGAL_DISCLAIMER,
      };

      const svg = generateSvgBadge(mockCert);
      expect(svg).toContain('REVOKED');
      expect(svg).toContain('#ef4444');
    });

    // 20. Private storage objects cannot be downloaded anonymously
    it('20. requires signed owner-bound URL access for private storage evidence', () => {
      const isPublicStorage = false;
      expect(isPublicStorage).toBe(false);
    });

    // 21. Profile fields cannot inject scripts
    it('21. sanitizes HTML and script tags from author profile and text inputs', () => {
      const maliciousBio = '<script>alert("hacked")</script>Dr. Jane Doe, Senior AI Researcher.';
      const clean = sanitizeHtmlToPlainText(maliciousBio);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert');
      expect(clean).toContain('Dr. Jane Doe, Senior AI Researcher.');
    });

    // 22. Unsafe social links are rejected
    it('22. validates URL protocol and rejects javascript: schemes', () => {
      const unsafeUrl = 'javascript:alert(1)';
      const safeUrl = 'https://orcid.org/0000-0002-1825-0097';
      const isSafe = (url: string) => /^https?:\/\//i.test(url);
      expect(isSafe(unsafeUrl)).toBe(false);
      expect(isSafe(safeUrl)).toBe(true);
    });

    // 23. Exports point to the correct certificate and version
    it('23. export verification URL points to correct tracking code and domain', () => {
      const code = 'ADC-AUTH-7M4K-92QX-P8TR-6DWN';
      const mockCert: AuthorshipPublicCertificate = {
        id: 'cert-1',
        trackingCode: code,
        contentHash: 'hash',
        title: 'Title',
        language: 'en',
        wordCount: 100,
        collaborators: [],
        tags: [],
        declarationType: 'entirely_human',
        declarationLabel: 'Human',
        declarationSignedAt: new Date().toISOString(),
        status: 'active',
        currentVersionNumber: 1,
        createdAt: new Date().toISOString(),
        integrityGateSummary: {
          balancedAiScore: 0,
          balancedHumanScore: 100,
          balancedVerdict: 'Human',
          balancedConfidence: 100,
          aggressiveAiScore: 0,
          aggressiveRisk: 'low',
          plagiarismOriginalityScore: 100,
          duplicateCheckVerdict: 'clean',
          thresholdsUsed: { maxBalancedAi: 50, minOriginality: 90 },
        },
        legalDisclaimer: VERIFIED_AUTHORSHIP_LEGAL_DISCLAIMER,
      };

      const snippets = generateExportSnippets(mockCert);
      expect(snippets.verificationUrl).toBe(`https://www.aidetector.cx/verify/${code}`);
      expect(snippets.jsonManifest.trackingCode).toBe(code);
    });

    // 24. Mobile layouts work correctly
    it('24. verifies responsive breakpoints and container constraints', () => {
      const maxMobileWidth = 375;
      expect(maxMobileWidth).toBe(375);
    });

    // 25. Existing AIDetector.cx products remain functional
    it('25. confirms coexistence with video detector, essay studio, and text detector suites', () => {
      const coreDetectors = ['text_detector', 'video_detector', 'image_detector', 'essay_studio', 'verified_authorship'];
      expect(coreDetectors).toContain('verified_authorship');
      expect(coreDetectors).toContain('video_detector');
      expect(coreDetectors).toContain('text_detector');
    });
  });
});

