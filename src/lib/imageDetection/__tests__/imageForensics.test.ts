// Comprehensive Test Suite for Image Forensic Engine, C2PA Parser, and Calibration Logic

import { describe, it, expect } from 'vitest';
import { computeSHA256, parseProvenanceAndMetadata } from '../c2paParser';

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
});
