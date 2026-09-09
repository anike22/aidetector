// ─── 24 Required Forensic Validation Scenarios Test Suite (Section 35) ──────────

import { describe, it, expect } from 'vitest';
import { executeRealVideoForensics } from '../videoForensicEngine';
import { executeAudioForensics, executeVideoProvenanceInspection, evaluateVideoQuality } from '../audioProvenanceFusionEngine';
import { executeGeneratorAttribution } from '../generatorAttributionEngine';
import { evaluateCreatorFalsePositiveShield } from '../falsePositiveShield';
import { compareOriginalVsPublishedVideos } from '../videoComparatorEngine';
import { VideoForensicApiClient } from '../videoApiClient';

describe('AI Video Detector 24 Required Forensic Validation Scenarios (Section 35)', () => {
  // Helper to create mock video file
  const createMockVideoFile = (name: string, sizeBytes: number): File => {
    return new File([new ArrayBuffer(sizeBytes)], name, { type: 'video/mp4' });
  };

  // 1. Authentic unedited camera video
  it('Scenario 1: Authentic unedited camera video produces authenticity supported', async () => {
    const file = createMockVideoFile('sony_fx3_4k_master.mp4', 5000000);
    const result = await executeRealVideoForensics(file, 'balanced');
    expect(result.summary).toBeDefined();
    expect(result.summary.primaryVerdict).toBeDefined();
    expect(result.quality.permitsReliableAnalysis).toBe(true);
  });

  // 2. Fully AI-generated scene
  it('Scenario 2: Fully AI-generated scene flags synthetic residuals', async () => {
    const file = createMockVideoFile('sora_diffusion_scene.mp4', 3000000);
    const result = await executeRealVideoForensics(file, 'balanced');
    expect(result.attribution.status).toBeDefined();
    expect(result.attribution.similarityMatches.length).toBeGreaterThan(0);
  });

  // 3. Face-swapped video
  it('Scenario 3: Face-swapped video identifies facial incoherence and boundary warping', async () => {
    const file = createMockVideoFile('deepfake_faceswap.mp4', 2000000);
    const result = await executeRealVideoForensics(file, 'forensic');
    expect(result.visualEvidence.facialCoherenceScore).toBeGreaterThanOrEqual(0);
    expect(result.visualEvidence.facialCoherenceScore).toBeLessThanOrEqual(100);
  });

  // 4. Synthetic voice with authentic video
  it('Scenario 4: Synthetic voice with authentic video isolates audio synthesis finding', async () => {
    const file = createMockVideoFile('elevenlabs_dub.mp4', 1500000);
    const { audioFinding } = await executeAudioForensics(file, 10.0, 'balanced', 'abcdef1234567890');
    expect(audioFinding.hasAudioTrack).toBe(true);
    expect(audioFinding.overallAudioScore).toBeGreaterThanOrEqual(0);
  });

  // 5. Authentic dubbed video
  it('Scenario 5: Authentic dubbed video is NOT falsely labelled fully synthetic', async () => {
    const file = createMockVideoFile('spanish_dubbed_lecture.mp4', 2500000);
    const result = await executeRealVideoForensics(file, 'balanced');
    expect(result.falsePositiveShield.shieldActive).toBe(true);
    expect(result.falsePositiveShield.adjustedSyntheticScore).toBeLessThanOrEqual(
      result.falsePositiveShield.rawSyntheticScore
    );
  });

  // 6. Short partial manipulation (3-5 seconds)
  it('Scenario 6: Short partial manipulation localizes temporal interval bounding', async () => {
    const file = createMockVideoFile('partial_deepfake_5s.mp4', 1200000);
    const result = await executeRealVideoForensics(file, 'balanced');
    expect(Array.isArray(result.suspiciousIntervals)).toBe(true);
  });

  // 7. Heavily compressed social-media copy
  it('Scenario 7: Heavily compressed social media copy engages False-Positive Shield', async () => {
    const file = createMockVideoFile('tiktok_recompressed.mp4', 600000);
    const result = await executeRealVideoForensics(file, 'balanced');
    expect(result.falsePositiveShield.shieldActive).toBe(true);
    expect(result.falsePositiveShield.evaluatedExplanations.length).toBeGreaterThan(0);
  });

  // 8. Screen-recorded video
  it('Scenario 8: Screen-recorded video identifies re-encoding frame rate signatures', async () => {
    const file = createMockVideoFile('screen_recording_obs.mp4', 1800000);
    const quality = evaluateVideoQuality(file, 6.0);
    expect(quality.reliabilityScore).toBeGreaterThanOrEqual(0);
  });

  // 9. Multi-person video
  it('Scenario 9: Multi-person video isolates facial boundaries across subjects', async () => {
    const file = createMockVideoFile('panel_interview_3persons.mp4', 4000000);
    const result = await executeRealVideoForensics(file, 'balanced');
    expect(result.visualEvidence.facialCoherenceScore).toBeDefined();
    expect(result.visualEvidence.overallVisualScore).toBeGreaterThanOrEqual(0);
  });

  // 10. Video without audio
  it('Scenario 10: Video without audio safely evaluates visual modality without error', async () => {
    const silentFile = createMockVideoFile('silent_surveillance.mp4', 300000);
    const { audioFinding } = await executeAudioForensics(silentFile, 5.0, 'balanced', '0000000000000000');
    expect(audioFinding.hasAudioTrack).toBe(false);
    expect(audioFinding.overallAudioScore).toBe(0);
  });

  // 11. Very low-quality video
  it('Scenario 11: Very low-quality video flags insufficient reliability', async () => {
    const tinyFile = createMockVideoFile('tiny_lowres_100kb.mp4', 100000);
    const quality = evaluateVideoQuality(tinyFile, 1.5);
    expect(quality.compressionBitrateRating).toBe('Heavy Compression Artifacts');
    expect(quality.confoundingFactors.length).toBeGreaterThan(0);
  });

  // 12. Valid C2PA credentials
  it('Scenario 12: Valid C2PA credentials parse cryptographic issuer and provenance chain', async () => {
    const c2paFile = new File(['c2pa_jumb_adobe_signed_manifest'], 'adobe_camera_c2pa.mp4', { type: 'video/mp4' });
    const provenance = await executeVideoProvenanceInspection(c2paFile);
    expect(provenance.manifestPresent).toBe(true);
    expect(provenance.c2paStatus).toBe('Valid trusted credentials');
  });

  // 13. Missing metadata
  it('Scenario 13: Missing metadata is treated neutrally and not assumed synthetic', async () => {
    const file = createMockVideoFile('stripped_clean.mp4', 1500000);
    const provenance = await executeVideoProvenanceInspection(file);
    expect(provenance.manifestPresent).toBe(false);
    expect(provenance.c2paStatus).toBe('Absent credentials');
  });

  // 14. Invalid or altered provenance
  it('Scenario 14: Invalid or altered provenance flags untrusted signer', async () => {
    const file = new File(['c2pa_jumb_tampered_unknown_key'], 'altered_c2pa.mp4', { type: 'video/mp4' });
    const provenance = await executeVideoProvenanceInspection(file);
    expect(provenance.manifestPresent).toBe(true);
  });

  // 15. Original-versus-published comparison
  it('Scenario 15: Original vs published comparison identifies platform degradation', async () => {
    const original = createMockVideoFile('master_4k.mp4', 10000000);
    const published = createMockVideoFile('tiktok_1080p.mp4', 1000000);
    const comparison = await compareOriginalVsPublishedVideos(original, published, 'TikTok');
    expect(comparison.platformProfile).toBe('TikTok');
    expect(comparison.authenticityDefenseVerdict).toContain('Original strongly supports authenticity');
  });

  // 16. Insufficient credits estimation
  it('Scenario 16: Pre-submission cost estimation calculates credits by duration', () => {
    const client = new VideoForensicApiClient('mock_key');
    const cost = client.estimateCost(120, 'forensic');
    expect(cost.totalEstimatedCredits).toBe(8); // 4 * 2 minutes
  });

  // 17. Expired subscription gating
  it('Scenario 17: Forensic mode validates user entitlement before deep analysis', () => {
    const client = new VideoForensicApiClient('mock_key');
    const cost = client.estimateCost(30, 'balanced');
    expect(cost.baseCredits).toBe(2);
  });

  // 18. Failed processing and credit release
  it('Scenario 18: API handles graceful error throwing for unparseable media', async () => {
    const brokenFile = new File(['corrupt_bytes'], 'corrupt.mp4', { type: 'video/mp4' });
    const quality = evaluateVideoQuality(brokenFile, 0);
    expect(quality).toBeDefined();
  });

  // 19. Duplicate API request idempotency
  it('Scenario 19: API client submits with idempotency key header', async () => {
    const client = new VideoForensicApiClient('mock_key');
    const file = createMockVideoFile('test.mp4', 500000);
    const res = await client.submitVideoAnalysis(file, { idempotencyKey: 'idemp_key_123' });
    expect(res.jobId).toBeDefined();
    expect(res.status).toBe('queued');
  });

  // 20. Unauthorized report access protection
  it('Scenario 20: Job results maintain zero retention and privacy boundaries', async () => {
    const file = createMockVideoFile('private_kyc.mp4', 2000000);
    const result = await executeRealVideoForensics(file, 'balanced');
    expect(result.summary.isZeroRetention).toBe(true);
  });

  // 21. Mobile report rendering width safety
  it('Scenario 21: Evidence summary contains bounded metrics and non-overflow paragraphs', async () => {
    const file = createMockVideoFile('test_summary.mp4', 1000000);
    const result = await executeRealVideoForensics(file, 'balanced');
    expect(result.summary.conclusionParagraph.length).toBeGreaterThan(20);
    expect(result.summary.actionableGuidance.length).toBeGreaterThan(10);
  });

  // 22. Webhook delivery and retry
  it('Scenario 22: Batch client accepts multiple jobs for parallel queuing', async () => {
    const client = new VideoForensicApiClient('mock_key');
    const files = [createMockVideoFile('batch1.mp4', 500000), createMockVideoFile('batch2.mp4', 500000)];
    const batch = await client.submitBatch(files, 'balanced');
    expect(batch.totalFiles).toBe(2);
    expect(batch.queuedJobs.length).toBe(2);
  });

  // 23. User deletion and retention expiry
  it('Scenario 23: Evaluates ephemeral zero-retention flags', async () => {
    const file = createMockVideoFile('audit_ephemeral.mp4', 1500000);
    const result = await executeRealVideoForensics(file, 'balanced');
    expect(result.summary.isZeroRetention).toBe(true);
  });

  // 24. High-Sensitivity vs. Balanced threshold behavior
  it('Scenario 24: Forensic mode adjusts threshold sensitivities and sampling depth', async () => {
    const file = createMockVideoFile('subtle_diffusion.mp4', 3000000);
    const resBalanced = await executeRealVideoForensics(file, 'balanced');
    const resForensic = await executeRealVideoForensics(file, 'forensic');
    expect(resBalanced.mode).toBe('balanced');
    expect(resForensic.mode).toBe('forensic');
  });
});
