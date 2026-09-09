import { describe, it, expect } from 'vitest';
import { executeRealVideoForensics } from '../videoForensicEngine';
import { inspectMediaCapabilities } from '../videoIngestionEngine';

describe('AI Video Detector Sample Video Presets Suite', () => {
  it('Preset 1: executes 78495.mp4 as silent screen recording with N/A audio & face findings', async () => {
    const mockFile = new File(
      ['ftypmp42....XRecorder silent screen recording UI capture dashboard'],
      '78495.mp4',
      { type: 'video/mp4' }
    );

    const caps = await inspectMediaCapabilities(mockFile, 91.6);
    expect(caps.recordingProcessingType).toBe('Screen recording');
    expect(caps.audioStreamStatus).toBe('absent');
    expect(caps.audioStreamAvailable).toBe(false);
    expect(caps.usableSpeechPresent).toBe(false);
    expect(caps.facesVisibleAndTrackable).toBe(false);
    expect(caps.applicableAnalyses.voiceCloning).toBe(false);
    expect(caps.applicableAnalyses.faceSwapAnalysis).toBe(false);

    const result = await executeRealVideoForensics(mockFile, 'balanced', undefined, 0);
    expect(result.summary.syntheticLikelihood).toBeLessThanOrEqual(25);
    expect(result.summary.recordingProcessingType).toBe('Screen recording');
    expect(result.summary.contentAssessment).toBe('No strong AI evidence detected');
    expect(result.audioEvidence.lipSyncStatus).toBe('not_applicable');
    expect(result.visualEvidence.faceAnalysisStatus).toBe('not_applicable');
    expect(result.attribution.status).toBe('Insufficient attribution evidence');
  });

  it('Preset 2: executes XRecorder clip with microphone audio and verifies genuine speech detection', async () => {
    const mockFile = new File(
      ['ftypmp42....soun mp4a XRecorder ScreenRecorder microphone speech voice audio track tutorial narrative'],
      'xrecorder_tutorial_with_mic_speech.mp4',
      { type: 'video/mp4' }
    );

    const caps = await inspectMediaCapabilities(mockFile, 45.0);
    expect(caps.recordingProcessingType).toBe('Screen recording');
    expect(caps.audioStreamAvailable).toBe(true);
    expect(caps.audioStreamStatus).toBe('usable_speech');
    expect(caps.usableSpeechPresent).toBe(true);
    expect(caps.applicableAnalyses.voiceCloning).toBe(true);

    const result = await executeRealVideoForensics(mockFile, 'balanced', undefined, 0);
    expect(result.summary.recordingProcessingType).toBe('Screen recording');
    expect(result.summary.contentAssessment).toBe('No strong AI evidence detected');
    expect(result.audioEvidence.hasAudioTrack).toBe(true);
    expect(result.audioEvidence.voiceCloningProbability).toBeLessThan(40);
    expect(result.summary.syntheticLikelihood).toBeLessThan(35);
  });

  it('Preset 3: executes screen recording of AI video (Sora clip) and separates capture method from AI content', async () => {
    const mockFile = new File(
      ['ftypmp42....ScreenRecorder obs-output sora diffusion video playing on desktop screen'],
      'screen_recording_of_sora_ai_clip.mp4',
      { type: 'video/mp4' }
    );

    const caps = await inspectMediaCapabilities(mockFile, 30.0);
    expect(caps.recordingProcessingType).toBe('Screen recording');

    const result = await executeRealVideoForensics(mockFile, 'balanced', undefined, 0);
    expect(result.summary.recordingProcessingType).toBe('Screen recording');
    expect(result.summary.contentAssessment).toBe('Evidence of AI-generated or AI-manipulated content');
    expect(result.summary.syntheticLikelihood).toBeGreaterThanOrEqual(60);
    expect(result.summary.conclusionParagraph.toLowerCase()).toContain('screen recording');
  });

  it('Preset 4: executes authentic 4K camera recording', async () => {
    const mockFile = new File(
      ['ftypmp42....Apple iPhone 15 Pro 4k camera recording soun mp4a natural microphone audio'],
      'camera_iphone_4k_recording.mp4',
      { type: 'video/mp4' }
    );

    const caps = await inspectMediaCapabilities(mockFile, 60.0);
    expect(caps.recordingProcessingType).toBe('Camera recording');
    expect(caps.audioStreamAvailable).toBe(true);

    const result = await executeRealVideoForensics(mockFile, 'balanced', undefined, 0);
    expect(result.summary.syntheticLikelihood).toBeLessThan(25);
    expect(result.summary.contentAssessment).toBe('No strong AI evidence detected');
  });
});
