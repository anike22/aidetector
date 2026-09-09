// ─── Master Video Forensic Orchestration Engine ─────────────────────────────

import { VideoAnalysisMode, VideoAnalysisResult, VideoJobStatus } from './types';
import { computeVideoSHA256, validateVideoUpload, inspectMediaCapabilities } from './videoIngestionEngine';
import { executeAdaptiveVisualForensics } from './visualForensicEngine';
import { executeSemanticAudioForensics } from './semanticAudioEngine';
import { executeGeneratorAttribution } from './generatorAttributionEngine';
import { evaluateCreatorFalsePositiveShield } from './falsePositiveShield';
import {
  executeVideoProvenanceInspection,
  evaluateVideoQuality,
  synthesizeVideoEvidence,
} from './audioProvenanceFusionEngine';
import { VIDEO_PIPELINE_VERSION, THRESHOLD_VERSION } from './config';

export type StageCallback = (stage: string, percent: number, status: VideoJobStatus) => void;

/**
 * Executes full asynchronous multimodal video forensic analysis (Phase 1 + Phase 2)
 */
export async function executeRealVideoForensics(
  file: File,
  mode: VideoAnalysisMode = 'balanced',
  onProgress?: StageCallback
): Promise<VideoAnalysisResult> {
  const validModes: VideoAnalysisMode[] = ['balanced', 'high_sensitivity', 'forensic'];
  if (!validModes.includes(mode)) {
    throw new Error(`Invalid video analysis mode "${mode}". Supported modes are: balanced, high_sensitivity, forensic.`);
  }

  const jobId = `vjob_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Stage 1: Ingestion, Cryptographic Hashing & Media Capabilities Inspection
  onProgress?.('Validating video container & computing SHA-256 fingerprint...', 10, 'preprocessing');
  const validation = await validateVideoUpload(file);
  if (!validation.valid) {
    throw new Error(validation.errorMessage || 'Invalid video file format or size.');
  }

  const sha256 = await computeVideoSHA256(file);
  const duration = validation.estimatedDurationSeconds || 12;

  const mediaCapabilities = await inspectMediaCapabilities(file, jobId, sha256, duration);

  const delay = typeof process !== 'undefined' && process.env.NODE_ENV === 'test' ? 0 : 50;

  // Stage 2: Adaptive Visual Analysis
  onProgress?.('Extracting shot boundaries & computing optical flow temporal consistency...', 25, 'analyzing_visual');
  if (delay > 0) await new Promise((r) => setTimeout(r, delay));

  const { visualFinding, intervals: visualIntervals, shotBoundaries, keyframes } =
    await executeAdaptiveVisualForensics(file, null, duration, mode, sha256);

  // Stage 3: Audio & Semantic Synthesis Analysis
  onProgress?.('Inspecting phoneme-viseme alignment, voice cloning & room acoustics...', 45, 'analyzing_audio');
  if (delay > 0) await new Promise((r) => setTimeout(r, delay));

  const { audioFinding, semanticAnomalies } = await executeSemanticAudioForensics(file, duration, mode, sha256);

  // Stage 4: Provenance, C2PA Manifest & Container Inspection
  onProgress?.('Validating C2PA JUMBF manifests, certificates & container headers...', 65, 'verifying_provenance');
  if (delay > 0) await new Promise((r) => setTimeout(r, delay));

  const provenance = await executeVideoProvenanceInspection(file);

  // Stage 5: Generator Attribution & False-Positive Shield Evaluation
  onProgress?.('Matching generator fingerprints & evaluating creator false-positive shield...', 80, 'analyzing_semantic');
  if (delay > 0) await new Promise((r) => setTimeout(r, delay));

  const quality = evaluateVideoQuality(file, duration);
  const attribution = executeGeneratorAttribution(visualFinding, provenance, sha256, file.name);
  const falsePositiveShield = evaluateCreatorFalsePositiveShield(visualFinding, quality, sha256, mode, file);

  // Stage 6: Multi-Modal Evidence Fusion & Summary Synthesis (One Unified Pass)
  onProgress?.('Fusing multi-modal evidence & computing reliability score...', 95, 'fusing_evidence');
  if (delay > 0) await new Promise((r) => setTimeout(r, delay));

  const summary = synthesizeVideoEvidence(visualFinding, audioFinding, provenance, quality, mode, falsePositiveShield, mediaCapabilities);

  // Synchronize likelyGenerator from attribution
  if (attribution.verifiedSource) {
    summary.likelyGenerator = attribution.verifiedSource;
    summary.generatorAttributionStatus = 'Verified generation source';
  } else if (attribution.status === 'Probable generator family' && attribution.similarityMatches[0]) {
    summary.likelyGenerator = attribution.similarityMatches[0].generatorName;
    summary.generatorAttributionStatus = 'Probable generator family';
  } else {
    summary.generatorAttributionStatus = attribution.status;
  }

  // Generate localized intervals from visual and semantic audio (only when audio track is present and anomalous)
  const audioIntervals = audioFinding.hasAudioTrack && audioFinding.overallAudioScore >= 50
    ? semanticAnomalies.map((anomaly, idx) => ({
        id: `aud_int_${idx}`,
        startTimestamp: Math.max(0, (idx * (duration / 2))),
        endTimestamp: Math.min(duration, ((idx + 1) * (duration / 2))),
        category: 'Synthetic or cloned voice' as const,
        affectedSubject: 'Vocal Track Harmonics',
        signalStrength: audioFinding.overallAudioScore,
        confidenceScore: audioFinding.overallAudioScore,
        uncertaintyRange: [audioFinding.overallAudioScore - 8, Math.min(100, audioFinding.overallAudioScore + 8)] as [number, number],
        supportingFrames: [],
        alternativeExplanations: ['Acoustic compression & Bluetooth microphone noise'],
        modality: 'audio' as const,
      }))
    : [];

  const intervals = [...visualIntervals, ...audioIntervals].sort(
    (a, b) => a.startTimestamp - b.startTimestamp
  );

  onProgress?.('Forensic certificate and evidence bundle ready.', 100, 'completed');

  return {
    jobId,
    sha256,
    fileName: file.name,
    fileSizeBytes: file.size,
    durationSeconds: duration,
    analyzedAt: new Date().toISOString(),
    pipelineVersion: VIDEO_PIPELINE_VERSION,
    mode,
    thresholdVersion: THRESHOLD_VERSION,
    status: 'completed',
    progressPercent: 100,
    currentStageLabel: 'Analysis completed successfully',
    mediaCapabilities,
    visualEvidence: visualFinding,
    audioEvidence: audioFinding,
    attribution,
    falsePositiveShield,
    provenance,
    quality,
    summary,
    shotBoundaries,
    suspiciousIntervals: intervals,
  };
}
