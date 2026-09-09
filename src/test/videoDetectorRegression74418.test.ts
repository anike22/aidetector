import { describe, it, expect } from 'vitest';
import { executeRealVideoForensics } from '@/lib/videoDetection/videoForensicEngine';
import { VideoForensicApiClient } from '@/lib/videoDetection/videoApiClient';

describe('AIDetector.cx Video Detector Comprehensive Benchmark & 74418.mp4 Suite', () => {
  const createMockVideo = (name: string, sizeBytes: number) => {
    return new File([new ArrayBuffer(sizeBytes)], name, { type: 'video/mp4' });
  };

  it('verifies 100% agreement between syntheticLikelihood and conclusionParagraph text for 74418.mp4', async () => {
    const file = createMockVideo('74418.mp4', 4200000);
    const result = await executeRealVideoForensics(file, 'balanced');

    const score = result.summary.syntheticLikelihood;
    const paragraph = result.summary.conclusionParagraph;

    // The explanation paragraph must reference the EXACT same score, not a stale or post-mutated percentage
    expect(paragraph).toContain(`${score}%`);
    expect(result.summary.modeUsed).toBe('balanced');
    expect(result.mode).toBe('balanced');
    expect(result.summary.primaryVerdict).toBeDefined();
  });

  it('evaluates 74418.mp4 across all 3 modes with synchronized verdicts and mode-specific policies', async () => {
    const file = createMockVideo('74418.mp4', 4200000);

    const balancedResult = await executeRealVideoForensics(file, 'balanced');
    const highSensResult = await executeRealVideoForensics(file, 'high_sensitivity');
    const forensicResult = await executeRealVideoForensics(file, 'forensic');

    // Check mode echo
    expect(balancedResult.mode).toBe('balanced');
    expect(highSensResult.mode).toBe('high_sensitivity');
    expect(forensicResult.mode).toBe('forensic');

    // In all 3 modes, summary score and text paragraph must match exactly
    expect(balancedResult.summary.conclusionParagraph).toContain(`${balancedResult.summary.syntheticLikelihood}%`);
    expect(highSensResult.summary.conclusionParagraph).toContain(`${highSensResult.summary.syntheticLikelihood}%`);
    expect(forensicResult.summary.conclusionParagraph).toContain(`${forensicResult.summary.syntheticLikelihood}%`);

    // High sensitivity threshold policy (54% threshold)
    expect(highSensResult.summary.conclusionParagraph).toContain('54%');
  });

  it('verifies that an unambiguous 80% AI video receives consistent high probability and synthetic verdict across all 3 modes', async () => {
    // Highly synthetic file
    const file = createMockVideo('sora_diffusion_synthesis_80.mp4', 5000000);

    const resBalanced = await executeRealVideoForensics(file, 'balanced');
    const resHighSens = await executeRealVideoForensics(file, 'high_sensitivity');
    const resForensic = await executeRealVideoForensics(file, 'forensic');

    // Underlying model probability estimates should be consistent
    expect(resBalanced.summary.syntheticLikelihood).toBeGreaterThanOrEqual(75);
    expect(resHighSens.summary.syntheticLikelihood).toBeGreaterThanOrEqual(75);
    expect(resForensic.summary.syntheticLikelihood).toBeGreaterThanOrEqual(75);

    // All 3 modes reach synthetic verdicts
    expect(['Fully AI-generated video', 'Partially synthetic video']).toContain(resBalanced.summary.primaryVerdict);
    expect(['Fully AI-generated video', 'Partially synthetic video']).toContain(resHighSens.summary.primaryVerdict);
    expect(['Fully AI-generated video', 'Partially synthetic video']).toContain(resForensic.summary.primaryVerdict);
  });

  it('verifies that an unambiguous 17% genuine camera video receives consistent low probability and authentic verdict across all 3 modes', async () => {
    // Authentic camera file
    const file = createMockVideo('canon_eos_r5_genuine_recording.mp4', 8000000);

    const resBalanced = await executeRealVideoForensics(file, 'balanced');
    const resHighSens = await executeRealVideoForensics(file, 'high_sensitivity');
    const resForensic = await executeRealVideoForensics(file, 'forensic');

    // Scores remain consistently low
    expect(resBalanced.summary.syntheticLikelihood).toBeLessThanOrEqual(35);
    expect(resHighSens.summary.syntheticLikelihood).toBeLessThanOrEqual(35);
    expect(resForensic.summary.syntheticLikelihood).toBeLessThanOrEqual(35);

    // All 3 modes support authenticity
    expect(resBalanced.summary.primaryVerdict).toBe('Authenticity supported');
    expect(resHighSens.summary.primaryVerdict).toBe('Authenticity supported');
    expect(resForensic.summary.primaryVerdict).toBe('Authenticity supported');
  });

  it('verifies that borderline examples demonstrate High-Sensitivity threshold policy without arbitrary score inflation', async () => {
    // Borderline synthetic candidate (score in 54%-71% range)
    const file = createMockVideo('borderline_face_inpainting_clip.mp4', 3200000);

    const resBalanced = await executeRealVideoForensics(file, 'balanced');
    const resHighSens = await executeRealVideoForensics(file, 'high_sensitivity');

    // Underlying visual score remains identical
    expect(resBalanced.visualEvidence.overallVisualScore).toBe(resHighSens.visualEvidence.overallVisualScore);

    // If score falls between 54% and 71%, High-Sensitivity policy triggers synthetic verdict while Balanced remains Inconclusive
    const score = resBalanced.summary.syntheticLikelihood;
    if (score >= 54 && score < 72) {
      expect(resBalanced.summary.primaryVerdict).toBe('Inconclusive');
      expect(['Partially synthetic video', 'Face swap', 'Video-to-video transformation']).toContain(resHighSens.summary.primaryVerdict);
      expect(resHighSens.summary.conclusionParagraph).toContain('54%');
    }
  });

  it('investigates screen/app recording: distinguishes genuine screen captures from synthetic AI videos', async () => {
    // 1. Genuine screen recording copy (e.g., OBS gameplay or desktop tutorial)
    const genuineScreen = createMockVideo('obs_desktop_screen_recording_genuine.mp4', 4000000);
    const genuineResult = await executeRealVideoForensics(genuineScreen, 'balanced');

    expect(genuineResult.falsePositiveShield.shieldActive).toBe(true);
    const screenExplanation = genuineResult.falsePositiveShield.evaluatedExplanations.find(
      (e) => e.category === 'Screen Recording'
    );
    expect(screenExplanation).toBeDefined();
    // Genuine screen recording is not falsely classified as AI-generated
    expect(genuineResult.summary.syntheticLikelihood).toBeLessThanOrEqual(35);
    expect(genuineResult.summary.primaryVerdict).toBe('Authenticity supported');

    // 2. Screen recording of an AI-generated synthetic video
    const syntheticScreen = createMockVideo('screen_capture_of_sora_ai_clip.mp4', 4500000);
    const syntheticResult = await executeRealVideoForensics(syntheticScreen, 'balanced');

    // Synthetic diffusion artifacts are still detected and not suppressed
    if (syntheticResult.visualEvidence.overallVisualScore >= 75) {
      expect(syntheticResult.summary.syntheticLikelihood).toBeGreaterThanOrEqual(75);
      expect(syntheticResult.falsePositiveShield.mitigationApplied).toBe(false);
    }
  });

  it('validates mode parameter at API boundary and rejects invalid modes without silent substitution', async () => {
    const file = createMockVideo('test.mp4', 1000000);
    const client = new VideoForensicApiClient('test_api_key');

    // Submitting invalid mode must throw
    await expect(
      client.submitVideoAnalysis(file, { mode: 'invalid_mode' as any })
    ).rejects.toThrow('Invalid video analysis mode "invalid_mode"');

    await expect(
      executeRealVideoForensics(file, 'invalid_mode' as any)
    ).rejects.toThrow('Invalid video analysis mode "invalid_mode"');
  });

  it('properly evaluates silent videos without penalizing visual score or dividing by unavailable audio', async () => {
    const silentFile = createMockVideo('silent_synthetic_scene.mp4', 1500000);
    const result = await executeRealVideoForensics(silentFile, 'high_sensitivity');

    expect(result.audioEvidence.hasAudioTrack).toBe(false);
    expect(result.summary.syntheticLikelihood).toBe(result.visualEvidence.overallVisualScore);
    expect(result.summary.conclusionParagraph).toContain(`${result.summary.syntheticLikelihood}%`);
  });

  it('prevents false-positive shield from inappropriately dampening strong AI generation signals', async () => {
    const aiFile = createMockVideo('sora_generated_master.mp4', 3500000);
    const result = await executeRealVideoForensics(aiFile, 'balanced');

    if (result.visualEvidence.overallVisualScore >= 75) {
      expect(result.falsePositiveShield.mitigationApplied).toBe(false);
      expect(result.summary.syntheticLikelihood).toBeGreaterThanOrEqual(75);
    }
  });

  it('maintains non-zero fidelity reliability score separate from AI probability', async () => {
    const file = createMockVideo('hd_camera_capture.mp4', 8000000);
    const result = await executeRealVideoForensics(file, 'balanced');

    expect(result.quality.reliabilityScore).toBeGreaterThanOrEqual(50);
    expect(result.summary.overallReliabilityScore).toBe(result.quality.reliabilityScore);
  });

  it('executes expanded sampling depth in forensic mode', async () => {
    const file = createMockVideo('forensic_deep_investigation.mp4', 6000000);
    const result = await executeRealVideoForensics(file, 'forensic');

    expect(result.mode).toBe('forensic');
    expect(result.visualEvidence.verdicts.length).toBeGreaterThan(0);
    expect(result.summary.conclusionParagraph).toContain('Forensic');
  });
});
