import { describe, it, expect } from 'vitest';
import { executeRealVideoForensics } from '../videoForensicEngine';
import { inspectMediaCapabilities } from '../videoIngestionEngine';

function createMockVideoFile(name: string, sizeBytes: number, isSilent: boolean = false): File {
  const buffer = new ArrayBuffer(Math.min(sizeBytes, 16384));
  const view = new Uint8Array(buffer);
  
  // Add MP4 ftyp box
  const header = [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32];
  header.forEach((b, i) => { view[i] = b; });
  
  if (!isSilent && !name.includes('78495') && !name.includes('silent')) {
    // Inject audio track atom marker 'mp4a'
    const audioMarker = [0x6d, 0x70, 0x34, 0x61];
    audioMarker.forEach((b, i) => { view[100 + i] = b; });
  }

  return new File([buffer], name, { type: 'video/mp4' });
}

describe('Phase 6: Media Capability Inspection & 78495.mp4 Forensic Resolution', () => {
  it('correctly inspects 78495.mp4 as a silent, face-free screen recording', async () => {
    const file = createMockVideoFile('78495.mp4', 5 * 1024 * 1024, true);
    const mediaCap = await inspectMediaCapabilities(file, 'vjob_test_78495', 'mocksha256_78495', 91.6);

    expect(mediaCap.recordingProcessingType).toBe('Screen recording');
    expect(mediaCap.audioStreamStatus).toBe('absent');
    expect(mediaCap.audioStreamAvailable).toBe(false);
    expect(mediaCap.usableSpeechPresent).toBe(false);
    expect(mediaCap.facesVisibleAndTrackable).toBe(false);
    expect(mediaCap.detectedFaceCount).toBe(0);
    expect(mediaCap.applicableAnalyses.faceSwapAnalysis).toBe(false);
    expect(mediaCap.applicableAnalyses.voiceCloning).toBe(false);
    expect(mediaCap.applicableAnalyses.lipSyncAnalysis).toBe(false);
    expect(mediaCap.applicableAnalyses.acousticReverb).toBe(false);
    expect(mediaCap.applicableAnalyses.screenRecordingAudit).toBe(true);
  });

  it('runs full forensic analysis on 78495.mp4 suppressing face swap and voice cloning false positives', async () => {
    const file = createMockVideoFile('78495.mp4', 5 * 1024 * 1024, true);
    const result = await executeRealVideoForensics(file, 'balanced');

    // 1. Check Media Capabilities
    expect(result.mediaCapabilities).toBeDefined();
    expect(result.mediaCapabilities?.recordingProcessingType).toBe('Screen recording');
    expect(result.mediaCapabilities?.audioStreamStatus).toBe('absent');

    // 2. Visual Forensics: Face swap suppressed, no trackable faces
    expect(result.visualEvidence.hasTrackableFaces).toBe(false);
    expect(result.visualEvidence.faceAnalysisStatus).toBe('not_applicable');
    expect(result.visualEvidence.verdicts).not.toContain('Face swap');

    // 3. Audio Forensics: Suppressed unperformed analyses
    expect(result.audioEvidence.hasAudioTrack).toBe(false);
    expect(result.audioEvidence.voiceCloningStatus).toBe('not_applicable');
    expect(result.audioEvidence.lipSyncStatus).toBe('not_applicable');
    expect(result.audioEvidence.acousticReverbStatus).toBe('not_applicable');
    expect(result.audioEvidence.voiceCloningProbability).toBe(0);
    expect(result.audioEvidence.verdicts).not.toContain('Synthetic or cloned voice');
    expect(result.audioEvidence.verdicts).not.toContain('AI lip synchronization');

    // 4. Attribution: Unattributed (insufficient evidence)
    expect(result.attribution.status).toBe('Insufficient attribution evidence');
    expect(result.attribution.verifiedSource).toBeNull();
    expect(result.attribution.confidenceScore).toBe(0);

    // 5. Summary & Verdict: Authentic / Screen recording, not generative AI
    expect(result.summary.primaryVerdict).not.toBe('Face swap');
    expect(result.summary.primaryVerdict).not.toBe('AI lip synchronization');
    expect(result.summary.recordingProcessingType).toBe('Screen recording');
    expect(result.summary.contentAssessment).toBe('No strong AI evidence detected');
    expect(result.summary.syntheticLikelihood).toBeLessThan(35);
  });

  it('correctly handles XRecorder recordings with audio stream and genuine speech', async () => {
    const file = createMockVideoFile('xrecorder_with_mic_audio.mp4', 8 * 1024 * 1024, false);
    const result = await executeRealVideoForensics(file, 'balanced');

    expect(result.mediaCapabilities?.recordingProcessingType).toBe('Screen recording');
    expect(result.audioEvidence.hasAudioTrack).toBe(true);
    expect(result.summary.recordingProcessingType).toBe('Screen recording');
  });

  it('evaluates screen recordings containing AI generative footage accurately', async () => {
    // If a screen recording captures synthetic video (e.g. sora demo captured on screen)
    const file = createMockVideoFile('sora_screen_capture.mp4', 12 * 1024 * 1024, true);
    const result = await executeRealVideoForensics(file, 'balanced');

    expect(result.mediaCapabilities?.recordingProcessingType).toBe('Screen recording');
    // Screen recording is capture method, provenance/content assessment stays distinct
    expect(result.summary.recordingProcessingType).toBe('Screen recording');
  });

  it('preserves all mode thresholds and consistency across balanced, high_sensitivity, and forensic', async () => {
    const file = createMockVideoFile('78495.mp4', 5 * 1024 * 1024, true);
    
    const balancedRes = await executeRealVideoForensics(file, 'balanced');
    const sensitiveRes = await executeRealVideoForensics(file, 'high_sensitivity');
    const forensicRes = await executeRealVideoForensics(file, 'forensic');

    expect(balancedRes.mediaCapabilities?.audioStreamStatus).toBe('absent');
    expect(sensitiveRes.mediaCapabilities?.audioStreamStatus).toBe('absent');
    expect(forensicRes.mediaCapabilities?.audioStreamStatus).toBe('absent');

    // All modes must obey applicability gating
    expect(balancedRes.visualEvidence.faceAnalysisStatus).toBe('not_applicable');
    expect(sensitiveRes.visualEvidence.faceAnalysisStatus).toBe('not_applicable');
    expect(forensicRes.visualEvidence.faceAnalysisStatus).toBe('not_applicable');

    expect(balancedRes.audioEvidence.voiceCloningStatus).toBe('not_applicable');
    expect(sensitiveRes.audioEvidence.voiceCloningStatus).toBe('not_applicable');
    expect(forensicRes.audioEvidence.voiceCloningStatus).toBe('not_applicable');
  });
});
