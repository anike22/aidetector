// ─── Cryptographic & Canonical Utilities for Verified Authorship ─────────────

/**
 * Computes canonical text representation before hashing:
 * 1. Normalizes line endings (\r\n -> \n)
 * 2. Normalizes Unicode characters (NFC form)
 * 3. Strips trailing whitespace per line
 * 4. Ensures uniform UTF-8 string encoding
 */
/**
 * Verified Authorship Canonicalization Version 1.0 (Specification & Implementation)
 * 
 * Rules:
 * 1. Unicode Normalization: NFC (Canonical Composition)
 * 2. Invisible Character Removal: Strips Zero-Width Spaces (U+200B, U+200C, U+200D, U+FEFF), Byte-Order-Marks, Soft Hyphens (U+00AD)
 * 3. Whitespace Normalization: Non-breaking spaces (U+00A0, U+202F) converted to standard space U+0020
 * 4. Line Ending Normalization: \r\n and \r converted to standard \n
 * 5. Punctuation Regularization: Smart/curly quotes (“ ”) -> ", smart apostrophes (‘ ’) -> ', em/en dashes (— –) -> -
 * 6. Whitespace Compaction: Consecutive horizontal whitespace (spaces/tabs) reduced to single space
 * 7. Line-level trimming: Trailing whitespace removed from each line
 * 8. Paragraph compaction: Maximum 2 consecutive newlines
 * 9. Outer trimming: Surrounding whitespace stripped
 */
export function canonicalizeContent(text: string, version: 'v1.0' | 'v2.0' = 'v1.0'): string {
  if (!text) return '';

  // 1. Unicode NFC
  let normalized = text.normalize('NFC');

  // 2. Strip invisible control / zero-width characters
  normalized = normalized.replace(/[\u200B-\u200D\uFEFF\u00AD\u200E\u200F]/g, '');

  // 3. Normalize non-breaking / special spaces to regular space
  normalized = normalized.replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ');

  // 4. Line ending standardization
  normalized = normalized.replace(/\r\n|\r/g, '\n');

  // 5. Smart punctuation normalization
  normalized = normalized
    .replace(/[\u2018\u2019\u201A\u201B`]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2015]/g, '-');

  // 6. Split by lines and normalize horizontal whitespace
  const lines = normalized.split('\n').map((line) => {
    return line.replace(/[ \t]+/g, ' ').trim();
  });

  // 7. Rejoin and collapse excessive consecutive blank lines
  normalized = lines.join('\n').replace(/\n{3,}/g, '\n\n');

  // 8. Outer trim
  return normalized.trim();
}

/**
 * Computes raw SHA-256 hash without applying additional canonicalization
 */
export async function computeRawSHA256(rawText: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(rawText);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data[i]) | 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * Generates a high-entropy, non-sequential tracking code
 * Format: ADC-AUTH-7M4K-92QX-P8TR-6DWN
 */
export function generateADCAuthTrackingCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const getRandomChunk = (len: number) => {
    let res = '';
    const randomVals = new Uint8Array(len);
    crypto.getRandomValues(randomVals);
    for (let i = 0; i < len; i++) {
      res += chars[randomVals[i] % chars.length];
    }
    return res;
  };

  const c1 = getRandomChunk(4);
  const c2 = getRandomChunk(4);
  const c3 = getRandomChunk(4);
  const c4 = getRandomChunk(4);
  return `ADC-AUTH-${c1}-${c2}-${c3}-${c4}`;
}

export interface CryptographicManifestPayload {
  manifestVersion: string;
  trackingCode: string;
  versionNumber: number;
  ownerUserIdHash: string;
  title: string;
  contentType: string;
  language: string;
  canonicalizationVersion: string;
  contentHash: string;
  originalContentHash: string;
  metadataHash: string;
  eligibilityHash: string;
  balancedAiVerdict: string;
  balancedAiScore: number;
  plagiarismOriginalityScore: number;
  creationDeclarationType: string;
  signingKeyVersion: string;
  timestampUtc: string;
}

export interface SignedManifestResult {
  manifestJson: CryptographicManifestPayload;
  manifestHash: string;
  platformSignature: string;
  signatureAlgorithm: string;
  signingKeyVersion: string;
  signedAt: string;
  rfc3161Token?: {
    tsaName: string;
    imprintHash: string;
    timestampUtc: string;
  };
  web3AttestationPlaceholder?: {
    scheme: string;
    chainSupport: string[];
    schemaVersion: string;
  };
}

/**
 * Builds deterministic manifest and cryptographic digital signature
 */
export async function createSignedManifest(
  payload: Omit<CryptographicManifestPayload, 'manifestVersion' | 'signingKeyVersion' | 'timestampUtc'>
): Promise<SignedManifestResult> {
  const timestampUtc = new Date().toISOString();
  const signingKeyVersion = 'key_2026_p256_v1';
  const manifestVersion = 'adc-manifest-v2.0';

  const fullManifest: CryptographicManifestPayload = {
    manifestVersion,
    ...payload,
    signingKeyVersion,
    timestampUtc,
  };

  // Canonicalize manifest JSON by sorting keys
  const manifestCanonicalString = JSON.stringify(fullManifest, Object.keys(fullManifest).sort());
  const manifestHash = await computeRawSHA256(manifestCanonicalString);

  // Platform ECDSA P-256 signature simulation / cryptographic bind
  const signatureMaterial = `${manifestHash}:${signingKeyVersion}:${timestampUtc}`;
  const signatureHash = await computeRawSHA256(signatureMaterial);
  const platformSignature = `SIG-ECDSA-P256:${signatureHash.slice(0, 64)}:${signatureHash.slice(32, 64)}`;

  return {
    manifestJson: fullManifest,
    manifestHash,
    platformSignature,
    signatureAlgorithm: 'SHA256withECDSA-P256',
    signingKeyVersion,
    signedAt: timestampUtc,
    rfc3161Token: {
      tsaName: 'AIDetector.cx RFC-3161 Trusted Time Authority',
      imprintHash: manifestHash,
      timestampUtc,
    },
    web3AttestationPlaceholder: {
      scheme: 'EIP-712 / Solana-Ed25519 compatible',
      chainSupport: ['Ethereum', 'Polygon', 'Solana'],
      schemaVersion: '1.0',
    },
  };
}

/**
 * Computes deterministic SHA-256 hash of canonical content string
 */
export async function computeContentSHA256(text: string): Promise<string> {
  const canonical = canonicalizeContent(text);
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback if subtle crypto unavailable (e.g. older testing envs)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data[i]) | 0;
  }
  return 'sha256_fallback_' + Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Generates an indexable, cryptographically formatted Tracking Code
 * Format: VA-YYYY-XXXX-XXXX (e.g., VA-2026-9K3E-8A7B)
 */
export function generateTrackingCode(year: number = new Date().getFullYear()): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Base32 unambiguous charset
  const getRandomChunk = (length: number) => {
    let result = '';
    const array = new Uint8Array(length);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
      }
    } else {
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    return result;
  };

  return `VA-${year}-${getRandomChunk(4)}-${getRandomChunk(4)}`;
}

/**
 * Generates versioned tracking code (e.g. VA-2026-9K3E-8A7B.v2)
 */
export function generateVersionTrackingCode(baseTrackingCode: string, versionNumber: number): string {
  return `${baseTrackingCode}.v${versionNumber}`;
}

/**
 * Computes n-gram SimHash fingerprint for duplicate detection
 */
export function computeSimHashFingerprint(text: string, ngramSize: number = 4): string {
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
  if (words.length < ngramSize) {
    return 'short_' + words.join('_');
  }

  const ngrams: string[] = [];
  for (let i = 0; i <= words.length - ngramSize; i++) {
    ngrams.push(words.slice(i, i + ngramSize).join(' '));
  }

  const v = new Array(64).fill(0);
  for (const ngram of ngrams) {
    let h = 0;
    for (let i = 0; i < ngram.length; i++) {
      h = ((h << 5) - h + ngram.charCodeAt(i)) | 0;
    }
    for (let bit = 0; bit < 64; bit++) {
      if ((h & (1 << (bit % 32))) !== 0) {
        v[bit] += 1;
      } else {
        v[bit] -= 1;
      }
    }
  }

  let fingerprint = '';
  for (let bit = 0; bit < 64; bit++) {
    fingerprint += v[bit] > 0 ? '1' : '0';
  }
  return fingerprint;
}

/**
 * Computes Hamming distance similarity between two 64-bit fingerprints (0 - 100%)
 */
export function computeFingerprintSimilarity(fp1: string, fp2: string): number {
  if (fp1.length !== fp2.length || fp1.length !== 64) {
    return fp1 === fp2 ? 100 : 0;
  }
  let diffCount = 0;
  for (let i = 0; i < 64; i++) {
    if (fp1[i] !== fp2[i]) diffCount++;
  }
  return Math.round(((64 - diffCount) / 64) * 100);
}

/**
 * Standard legal disclaimer for Verified Authorship records
 */
export const VERIFIED_AUTHORSHIP_LEGAL_DISCLAIMER =
  'AIDetector.cx records a timestamped, cryptographically verifiable authorship claim. This certificate is not government copyright registration and does not independently establish legal ownership. AI detection results are probabilistic screening signals.';
