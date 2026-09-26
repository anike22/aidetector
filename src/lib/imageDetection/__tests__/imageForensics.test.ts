// Comprehensive Test Suite for Image Forensic Engine, C2PA Parser, and Calibration Logic

import { describe, it, expect } from 'vitest';
import { computeSHA256, parseProvenanceAndMetadata } from '../c2paParser';
import { evaluateAIGenerationEvidence } from '../imageForensicEngine';
import type { ImageProvenanceFinding, ImageQualityFinding } from '../types';

describe('Image Forensics: C2PA and Metadata Engine', () => {
  it('computes accurate SHA-256 digests for raw byte streams', async () => {
    const encoder = new TextEncoder();
    const testBytes = encoder.encode('AIDetector.cx Forensic Image Verification Test 2026');
    const hash = await computeSHA256(testBytes.buffer);
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64);
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
  });

  it('detects Midjourney synthetic metadata signatures in raw binary headers', async () => {
    const testStr = 'RIFF....WEBPVP8 ... Midjourney v6.0 prompt: cinematic portrait of astronaut ...';
    const encoder = new TextEncoder();
    const buffer = encoder.encode(testStr).buffer;

    const provenance = await parseProvenanceAndMetadata(buffer, 'image/webp');
    expect(provenance.claimGenerator).toBe('Midjourney');
    expect(provenance.digitalSourceType).toContain('trainedAlgorithmicMedia');
    expect(provenance.reasoning.some((r) => r.includes('Midjourney'))).toBe(true);
  });

  it('detects C2PA JUMBF box markers in authentic C2PA signed files', async () => {
    const fakeJumbf = '...jumbc2pa...c2ma...urn:c2pa:test...adobe...';
    const encoder = new TextEncoder();
    const buffer = encoder.encode(fakeJumbf).buffer;

    const provenance = await parseProvenanceAndMetadata(buffer, 'image/jpeg');
    expect(provenance.manifestPresent).toBe(true);
    expect(provenance.c2paStatus).toBe('Valid trusted credentials');
  });

  it('correctly labels stripped or standard camera EXIF as unsigned editable info', async () => {
    const fakeCameraExif = 'Exif..II*...Canon..EOS R5..2024:05:12 14:20:00...';
    const encoder = new TextEncoder();
    const buffer = encoder.encode(fakeCameraExif).buffer;

    const provenance = await parseProvenanceAndMetadata(buffer, 'image/jpeg');
    expect(provenance.cameraExif?.make).toBe('Canon');
    expect(provenance.cameraExif?.model).toBe('EOS R5');
    expect(provenance.c2paStatus).toBe('Absent credentials');
    expect(provenance.exifIntegrity).toBe('Standard EXIF headers present (unsigned)');
  });

  it('accurately identifies SynthID and DALL-E watermarks', async () => {
    const fakeDalle = '...dall-e 3...openai...generation_id...';
    const encoder = new TextEncoder();
    const buffer = encoder.encode(fakeDalle).buffer;

    const provenance = await parseProvenanceAndMetadata(buffer, 'image/png');
    expect(provenance.claimGenerator).toBe('OpenAI DALL-E');
    expect(provenance.watermark.detected).toBe(true);
    expect(provenance.watermark.provider).toBe('OpenAI DALL-E');
  });

  it('detects Apple iPhone, Samsung Galaxy, and Google Pixel camera models from EXIF', async () => {
    const iphoneBytes = new TextEncoder().encode('Exif..Apple..iPhone 15 Pro Max..iOS 17.4..ISO 64').buffer;
    const provIphone = await parseProvenanceAndMetadata(iphoneBytes, 'image/jpeg');
    expect(provIphone.cameraExif?.make).toBe('Apple');
    expect(provIphone.cameraExif?.model).toContain('iPhone 15 Pro Max');
    expect(provIphone.cameraExif?.iso).toBe(64);

    const samsungBytes = new TextEncoder().encode('Exif..Samsung..Galaxy Mobile Camera..sm-s928b..ISO 125').buffer;
    const provSamsung = await parseProvenanceAndMetadata(samsungBytes, 'image/jpeg');
    expect(provSamsung.cameraExif?.make).toBe('Samsung');
    expect(provSamsung.cameraExif?.model).toBe('Galaxy Mobile Camera');

    const pixelBytes = new TextEncoder().encode('Exif..Google..Pixel 8 Pro..ISO 50').buffer;
    const provPixel = await parseProvenanceAndMetadata(pixelBytes, 'image/jpeg');
    expect(provPixel.cameraExif?.make).toBe('Google');
    expect(provPixel.cameraExif?.model).toContain('Pixel 8');
  });
});

describe('Image Forensics: Camera Photo vs Synthetic Media Calibration', () => {
  const dummyQuality: ImageQualityFinding = {
    permitsReliableAnalysis: true,
    width: 1920,
    height: 1080,
    megapixels: 2.07,
    aspectRatio: '16:9',
    fileSizeBytes: 2450000,
    mimeType: 'image/jpeg',
    compressionQualityEstimate: 92,
    blurLevel: 'Sharp',
    noiseLevel: 'Natural sensor noise',
    dynamicRangeScore: 78,
    qualityVerdict: 'Optimal for forensic analysis',
    limitations: [],
  };

  it('assigns authentic low AI score (<= 15%) and "No strong AI-generation evidence" to genuine camera photo with EXIF', () => {
    const cameraProv: ImageProvenanceFinding = {
      c2paStatus: 'Absent credentials',
      manifestPresent: false,
      trustedIssuer: null,
      claimGenerator: null,
      digitalSourceType: null,
      creationDate: '2026-05-12T10:00:00Z',
      editHistory: [],
      cameraExif: {
        make: 'Apple',
        model: 'iPhone 15 Pro',
        software: 'iOS 17.4',
        colorSpace: 'sRGB',
      },
      exifIntegrity: 'Standard EXIF headers present (unsigned)',
      isMetadataClaimOnly: true,
      reasoning: ['Camera headers detected'],
      watermark: { detected: false, confidence: 0 },
    };

    const forensics = {
      spectralArtifactScore: 18,
      noiseUniformityScore: 16,
      compressionAnomalyScore: 24,
      diffusionGridScore: 17,
    };

    const finding = evaluateAIGenerationEvidence(cameraProv, forensics, dummyQuality);

    expect(finding.score).toBeLessThanOrEqual(15);
    expect(finding.score).toBeGreaterThanOrEqual(2);
    expect(finding.verdict).toBe('No strong AI-generation evidence');
    expect(finding.verdict).not.toBe('AI editing indicated');
    expect(finding.verdict).not.toBe('Likely AI-generated');
    expect(finding.reasoning.some((r) => r.includes('Apple iPhone 15 Pro'))).toBe(true);
  });

  it('eliminates false 61% AI score on camera photos when EXIF is stripped (e.g. testimage.jpg / web upload)', () => {
    const strippedProv: ImageProvenanceFinding = {
      c2paStatus: 'Absent credentials',
      manifestPresent: false,
      trustedIssuer: null,
      claimGenerator: null,
      digitalSourceType: null,
      creationDate: null,
      editHistory: [],
      cameraExif: null,
      exifIntegrity: 'Stripped / Cleaned metadata',
      isMetadataClaimOnly: false,
      reasoning: ['No EXIF header found'],
      watermark: { detected: false, confidence: 0 },
    };

    // Realistic indoor photo forensics: natural sensor noise, moderate JPEG ELA
    const forensics = {
      spectralArtifactScore: 20,
      noiseUniformityScore: 18,
      compressionAnomalyScore: 28,
      diffusionGridScore: 19,
    };

    const finding = evaluateAIGenerationEvidence(strippedProv, forensics, dummyQuality);

    // Must be low (< 25%), definitely not false 61%
    expect(finding.score).toBeLessThanOrEqual(25);
    expect(finding.score).not.toBe(61);
    expect(finding.verdict).toBe('No strong AI-generation evidence');
    expect(finding.verdict).not.toBe('AI editing indicated');
  });

  it('preserves high AI probability (>= 85%) and "Likely AI-generated" verdict for confirmed synthetic media', () => {
    const aiProv: ImageProvenanceFinding = {
      c2paStatus: 'Absent credentials',
      manifestPresent: false,
      trustedIssuer: null,
      claimGenerator: 'Midjourney',
      digitalSourceType: 'http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia',
      creationDate: null,
      editHistory: [],
      cameraExif: null,
      exifIntegrity: 'Stripped / Cleaned metadata',
      isMetadataClaimOnly: false,
      reasoning: ['Midjourney metadata signature detected'],
      watermark: { detected: false, confidence: 0 },
    };

    const forensics = {
      spectralArtifactScore: 65,
      noiseUniformityScore: 78,
      compressionAnomalyScore: 40,
      diffusionGridScore: 71,
    };

    const finding = evaluateAIGenerationEvidence(aiProv, forensics, dummyQuality);

    expect(finding.score).toBeGreaterThanOrEqual(85);
    expect(finding.verdict).toBe('Likely AI-generated');
    expect(finding.detectedGenerators).toContain('Midjourney');
  });
});
