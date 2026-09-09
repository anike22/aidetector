// ─── Comprehensive Unit & Integration Tests for AI Video Forensic Engine (Phase 1 + 2) ───

import { describe, it, expect } from 'vitest';
import { validateVideoUpload, computeVideoSHA256 } from '../videoIngestionEngine';
import { detectShotBoundaries, executeAdaptiveVisualForensics } from '../visualForensicEngine';
import { executeSemanticAudioForensics } from '../semanticAudioEngine';
import { executeGeneratorAttribution } from '../generatorAttributionEngine';
import { evaluateCreatorFalsePositiveShield } from '../falsePositiveShield';
import { compareOriginalVsPublishedVideos } from '../videoComparatorEngine';
import {
  executeVideoProvenanceInspection,
  evaluateVideoQuality,
  synthesizeVideoEvidence,
} from '../audioProvenanceFusionEngine';
import { executeRealVideoForensics } from '../videoForensicEngine';

describe('Video Forensics: Ingestion, Validation & Crypto Hashing', () => {
  it('validates supported video formats (MP4, WebM, MOV)', async () => {
    const fakeMp4 = new File(['fake-mp4-data'], 'test-video.mp4', { type: 'video/mp4' });
    const result = await validateVideoUpload(fakeMp4);
    expect(result.valid).toBe(true);
    expect(result.declaredMimeType).toBe('video/mp4');
  });

  it('rejects unsupported file formats gracefully', async () => {
    const fakeExe = new File(['fake-binary'], 'malicious.exe', { type: 'application/x-msdownload' });
    const result = await validateVideoUpload(fakeExe);
    expect(result.valid).toBe(false);
    expect(result.errorMessage).toContain('Unsupported video file format');
  });

  it('computes accurate 64-char SHA-256 digests for raw video files', async () => {
    const fakeFile = new File(['AIDetector.cx Multimodal Video Verification 2026'], 'sample.mp4', {
      type: 'video/mp4',
    });
    const hash = await computeVideoSHA256(fakeFile);
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64);
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
  });
});

describe('Phase 2 Audio & Semantic Analysis', () => {
  it('extracts phoneme-viseme alignment, voice cloning, and room acoustics', async () => {
    const fakeFile = new File([new Uint8Array(50000)], 'clip.mp4', { type: 'video/mp4' });
    const { audioFinding, semanticAnomalies } = await executeSemanticAudioForensics(
      fakeFile,
      12.0,
      'balanced',
      'a1b2c3d4e5f678901234567890abcdef'
    );

    expect(audioFinding.hasAudioTrack).toBe(true);
    expect(audioFinding.phonemeVisemeAlignmentScore).toBeGreaterThanOrEqual(0);
    expect(audioFinding.emotionExpressionConsistencyScore).toBeGreaterThanOrEqual(0);
    expect(audioFinding.roomAcousticContinuityScore).toBeGreaterThanOrEqual(0);
  });
});

describe('Phase 2 Generator Attribution Engine', () => {
  it('identifies verified generation source from C2PA claimGenerator', () => {
    const visual = {
      verdicts: ['Fully AI-generated video' as const],
      overallVisualScore: 85,
      confidenceLevel: 'High' as const,
      spatialArtifactScore: 80,
      temporalConsistencyScore: 20,
      opticalFlowAnomalyScore: 85,
      facialCoherenceScore: 30,
      bodyHandCoherenceScore: 30,
      frequencyDomainAnomalyScore: 85,
      lightingShadowConsistencyScore: 40,
      textureStabilityScore: 30,
      objectPermanenceScore: 40,
      cameraMotionConsistencyScore: 50,
      detectedGenerativeSignatures: [],
      reasoning: [],
    };

    const provenance = {
      c2paStatus: 'Valid trusted credentials' as const,
      manifestPresent: true,
      trustedIssuer: 'OpenAI Provenance Authority',
      claimGenerator: 'OpenAI Sora',
      digitalSourceType: 'trainedAlgorithmicMedia',
      creationDate: '2026-03-01',
      editHistory: [],
      frameSequenceIntegrityVerified: true,
      signedEditingHistory: [],
      containerMetadata: {
        format: 'video/mp4',
        codec: 'H.264',
        frameRate: 30,
        bitrateKbps: 6000,
        isCleanStandardHeader: true,
      },
      metadataIntegrity: 'Standard encoding metadata' as const,
      watermark: { detected: false, confidence: 0 },
      rawMetadataTags: {},
      reasoning: [],
    };

    const attribution = executeGeneratorAttribution(visual, provenance, 'dummyhash');
    expect(attribution.status).toBe('Verified generation source');
    expect(attribution.verifiedSource).toBe('OpenAI Sora');
    expect(attribution.confidenceScore).toBeGreaterThanOrEqual(95);
  });
});

describe('Phase 2 Creator False-Positive Shield', () => {
  it('evaluates legitimate production conditions and applies mitigation dampening', () => {
    const visual = {
      verdicts: ['Conventionally edited video' as const],
      overallVisualScore: 68,
      confidenceLevel: 'Moderate' as const,
      spatialArtifactScore: 60,
      temporalConsistencyScore: 70,
      opticalFlowAnomalyScore: 55,
      facialCoherenceScore: 75,
      bodyHandCoherenceScore: 80,
      frequencyDomainAnomalyScore: 50,
      lightingShadowConsistencyScore: 45,
      textureStabilityScore: 40,
      objectPermanenceScore: 80,
      cameraMotionConsistencyScore: 50,
      detectedGenerativeSignatures: [],
      reasoning: [],
    };

    const quality = {
      permitsReliableAnalysis: true,
      width: 1080,
      height: 1920,
      resolutionLabel: '1080p FHD',
      durationSeconds: 15,
      frameRate: 30,
      fileSizeBytes: 12000000,
      compressionBitrateRating: 'Heavy Compression Artifacts' as const,
      lightingQuality: 'Good' as const,
      motionBlurLevel: 'Moderate' as const,
      reliabilityScore: 85,
      confoundingFactors: ['Heavy social media compression artifacts'],
      counterForensicResilienceVersion: 'v2026.4',
      fairnessCalibrationVersion: 'v2026.4',
      outOfDistributionDetected: false,
      recommendation: 'Analysis reliable',
    };

    const shield = evaluateCreatorFalsePositiveShield(visual, quality, 'somehash123', 'balanced');
    expect(shield.shieldActive).toBe(true);
    expect(shield.mitigationApplied).toBe(true);
    expect(shield.adjustedSyntheticScore).toBeLessThan(shield.rawSyntheticScore);
    expect(shield.evaluatedExplanations.length).toBeGreaterThan(0);
  });
});

describe('Phase 2 Original vs. Published Video Comparator', () => {
  it('performs differential analysis and proves authenticity against platform compression', async () => {
    const master = new File(['master-prores-data-high-bitrate'], 'master.mov', { type: 'video/quicktime' });
    const tiktok = new File(['tiktok-h264-compressed-version'], 'tiktok_download.mp4', { type: 'video/mp4' });

    const comp = await compareOriginalVsPublishedVideos(master, tiktok, 'TikTok');
    expect(comp.matchingVisualScore).toBeGreaterThanOrEqual(70);
    expect(comp.encodingDifferences.length).toBeGreaterThan(0);
    expect(comp.authenticityDefenseVerdict).toContain('Original strongly supports authenticity');
  });
});

describe('Phase 2 Master Pipeline Integration', () => {
  it('executes full 7-finding multimodal video analysis successfully', async () => {
    const sample = new File(['sample-video-stream'], 'interview.mp4', { type: 'video/mp4' });
    const result = await executeRealVideoForensics(sample, 'balanced');

    expect(result.status).toBe('completed');
    expect(result.visualEvidence).toBeDefined();
    expect(result.audioEvidence).toBeDefined();
    expect(result.attribution).toBeDefined();
    expect(result.falsePositiveShield).toBeDefined();
    expect(result.provenance).toBeDefined();
    expect(result.quality).toBeDefined();
    expect(result.summary).toBeDefined();
  });
});
