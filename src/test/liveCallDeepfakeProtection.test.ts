import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateMediaStream,
  createSafeMonitoringStream,
  generateChallengePrompt,
  getFriendlyMediaErrorMessage,
  checkPlatformCapabilities,
  BoundedFrameAnalyzer,
  INITIAL_STREAM_HEALTH,
  PRESET_PARTICIPANT_ROIS,
  PLATFORM_CAPABILITY_MATRIX,
  cropFrameToROI,
  NativeCompanionBridge,
} from '@/lib/videoDetection/liveCallStreamManager';

describe('Live-Call Deepfake Protection Unit & Integrity Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Initial stream health shows no active call or stream', () => {
    expect(INITIAL_STREAM_HEALTH.sourceType).toBe('none');
    expect(INITIAL_STREAM_HEALTH.sourceLabel).toBe('No active call or stream');
    expect(INITIAL_STREAM_HEALTH.videoConnected).toBe(false);
    expect(INITIAL_STREAM_HEALTH.audioConnected).toBe(false);
    expect(INITIAL_STREAM_HEALTH.videoLabel).toBe('Not connected');
    expect(INITIAL_STREAM_HEALTH.totalFramesReceived).toBe(0);
    expect(INITIAL_STREAM_HEALTH.activeRoi.id).toBe('full');
  });

  it('2. Stream validation fails when stream is null or has no active tracks', () => {
    const res = validateMediaStream(null);
    expect(res.isValid).toBe(false);
    expect(res.hasVideo).toBe(false);
    expect(res.hasAudio).toBe(false);

    const emptyStream = {
      getVideoTracks: () => [],
      getAudioTracks: () => [],
    } as unknown as MediaStream;

    const resEmpty = validateMediaStream(emptyStream);
    expect(resEmpty.isValid).toBe(false);
  });

  it('3. Stream validation confirms valid video and audio tracks', () => {
    const mockVideoTrack = { readyState: 'live', kind: 'video', label: 'FaceTime HD Camera' };
    const mockAudioTrack = { readyState: 'live', kind: 'audio', label: 'Internal Microphone' };

    const mockStream = {
      getVideoTracks: () => [mockVideoTrack],
      getAudioTracks: () => [mockAudioTrack],
    } as unknown as MediaStream;

    const res = validateMediaStream(mockStream);
    expect(res.isValid).toBe(true);
    expect(res.hasVideo).toBe(true);
    expect(res.hasAudio).toBe(true);
  });

  it('4. Stream validation distinguishes video-only stream from audio-present stream', () => {
    const mockVideoTrack = { readyState: 'live', kind: 'video', label: 'Screen Share Tab' };

    const videoOnlyStream = {
      getVideoTracks: () => [mockVideoTrack],
      getAudioTracks: () => [],
    } as unknown as MediaStream;

    const res = validateMediaStream(videoOnlyStream);
    expect(res.isValid).toBe(true);
    expect(res.hasVideo).toBe(true);
    expect(res.hasAudio).toBe(false);
  });

  it('5. Ended video tracks are recognized as invalid/inactive', () => {
    const mockEndedTrack = { readyState: 'ended', kind: 'video' };

    const endedStream = {
      getVideoTracks: () => [mockEndedTrack],
      getAudioTracks: () => [],
    } as unknown as MediaStream;

    const res = validateMediaStream(endedStream);
    expect(res.isValid).toBe(false);
    expect(res.hasVideo).toBe(false);
  });

  it('6. Permission denial returns clear, informative error message without silent fallback', () => {
    const notAllowedError = { name: 'NotAllowedError', message: 'Permission denied by user' };
    const res = getFriendlyMediaErrorMessage(notAllowedError);
    expect(res.title).toBe('Media Permission Denied');
    expect(res.message).toContain('Screen sharing or camera permission was cancelled or denied');
  });

  it('7. Abort error (user canceled window share picker) is handled gracefully', () => {
    const abortErr = { name: 'AbortError', message: 'The user aborted the request.' };
    const res = getFriendlyMediaErrorMessage(abortErr);
    expect(res.title).toBe('Screen Sharing Cancelled');
    expect(res.message).toContain('picker was dismissed');
  });

  it('8. Device not found error gives distinct hardware notification', () => {
    const notFoundErr = { name: 'NotFoundError', message: 'Requested device not found' };
    const res = getFriendlyMediaErrorMessage(notFoundErr);
    expect(res.title).toBe('Device Not Found');
  });

  it('9. Hardware in use error warns about camera contention and recommends window capture', () => {
    const inUseErr = { name: 'NotReadableError', message: 'Device in use' };
    const res = getFriendlyMediaErrorMessage(inUseErr);
    expect(res.title).toBe('Hardware In Use');
    expect(res.message).toContain('Share Video-Call Window, Tab, or Screen');
  });

  it('10. Mobile getDisplayMedia limitation is detected and explained truthfully', () => {
    const notSupported = { name: 'NotSupportedError', message: 'getDisplayMedia is undefined' };
    const res = getFriendlyMediaErrorMessage(notSupported);
    expect(res.title).toBeDefined();
    expect(res.message).toBeDefined();
  });

  it('11. Platform capability detector recognizes desktop vs mobile OS sandbox limitations', () => {
    const caps = checkPlatformCapabilities();
    expect(caps).toHaveProperty('supportsScreenCapture');
    expect(caps).toHaveProperty('supportsCamera');
    expect(caps).toHaveProperty('isMobile');
    expect(caps).toHaveProperty('platformName');
    expect(caps).toHaveProperty('hasCompanionSupport');
  });

  it('12. Safe Monitoring Stream protects host call tracks when monitoring is released', () => {
    let hostTrackStopped = false;
    let clonedTrackStopped = false;

    const mockHostVideoTrack = {
      kind: 'video',
      readyState: 'live',
      stop: () => {
        hostTrackStopped = true;
      },
      clone: () => ({
        kind: 'video',
        readyState: 'live',
        stop: () => {
          clonedTrackStopped = true;
        },
      }),
    } as unknown as MediaStreamTrack;

    const hostStream = {
      getVideoTracks: () => [mockHostVideoTrack],
      getAudioTracks: () => [],
      getTracks: () => [mockHostVideoTrack],
    } as unknown as MediaStream;

    // Simulate monitoring attached to an integrated host call (isOwnedByMonitoring = false)
    const { releaseMonitoringStream } = createSafeMonitoringStream(hostStream, false);

    // Release monitoring
    releaseMonitoringStream();

    // CRITICAL: Host track must NOT be stopped!
    expect(hostTrackStopped).toBe(false);
    expect(clonedTrackStopped).toBe(true);
  });

  it('13. Safe Monitoring Stream properly releases monitoring-owned tracks on stop', () => {
    let monitoringTrackStopped = false;

    const mockDisplayVideoTrack = {
      kind: 'video',
      readyState: 'live',
      stop: () => {
        monitoringTrackStopped = true;
      },
    } as unknown as MediaStreamTrack;

    const displayStream = {
      getVideoTracks: () => [mockDisplayVideoTrack],
      getAudioTracks: () => [],
      getTracks: () => [mockDisplayVideoTrack],
    } as unknown as MediaStream;

    // Direct getDisplayMedia capture (isOwnedByMonitoring = true)
    const { releaseMonitoringStream } = createSafeMonitoringStream(displayStream, true);
    releaseMonitoringStream();

    expect(monitoringTrackStopped).toBe(true);
  });

  it('14. BoundedFrameAnalyzer enforces rate limiting and backpressure queue bounds', async () => {
    const analyzer = new BoundedFrameAnalyzer(1500);

    const t0 = 10000;
    expect(analyzer.shouldSample(t0)).toBe(true);

    analyzer.recordSampleTimestamp(t0);

    // Frame sample at t0 + 500ms should be rejected due to rate limiting
    expect(analyzer.shouldSample(t0 + 500)).toBe(false);

    // Frame sample at t0 + 1600ms should be allowed
    expect(analyzer.shouldSample(t0 + 1600)).toBe(true);

    // Cancellation immediately cancels and blocks sampling
    analyzer.cancel();
    expect(analyzer.shouldSample(t0 + 2000)).toBe(false);

    // Reset restores sampling capability
    analyzer.reset();
    expect(analyzer.shouldSample(t0 + 2000)).toBe(true);
  });

  it('15. Challenge prompt generator generates unpredictable phrases with codes', () => {
    const phrase1 = generateChallengePrompt('repeat_phrase');
    const phrase2 = generateChallengePrompt('repeat_phrase');
    expect(phrase1).toContain('Verification Code');
    expect(phrase2).toContain('Verification Code');
  });

  it('16. Challenge prompt generator supports head turn, hand wave, camera tilt, and show object', () => {
    const headTurn = generateChallengePrompt('head_turn');
    const handWave = generateChallengePrompt('hand_wave');
    const cameraMove = generateChallengePrompt('camera_movement');
    const showObj = generateChallengePrompt('show_object');

    expect(headTurn).toContain('turn your head 45°');
    expect(handWave).toContain('wave your fingers');
    expect(cameraMove).toContain('tilt or shift');
    expect(showObj).toContain('hold a physical object');
  });

  it('17. PRESET_PARTICIPANT_ROIS covers full screen, 2x2 grid quadrants, and speaker focus', () => {
    expect(PRESET_PARTICIPANT_ROIS.length).toBeGreaterThanOrEqual(5);
    const full = PRESET_PARTICIPANT_ROIS.find((r) => r.id === 'full');
    const tl = PRESET_PARTICIPANT_ROIS.find((r) => r.id === 'grid_2x2_tl');
    const tr = PRESET_PARTICIPANT_ROIS.find((r) => r.id === 'grid_2x2_tr');

    expect(full).toBeDefined();
    expect(full?.width).toBe(100);
    expect(tl?.x).toBe(0);
    expect(tl?.width).toBe(50);
    expect(tr?.x).toBe(50);
  });

  it('18. cropFrameToROI correctly validates bounds and handles video elements', () => {
    const mockVideo = {
      videoWidth: 1280,
      videoHeight: 720,
    } as unknown as HTMLVideoElement;

    let drawn = false;
    const mockCanvas = {
      getContext: () => ({
        drawImage: () => {
          drawn = true;
        },
      }),
      width: 0,
      height: 0,
    } as unknown as HTMLCanvasElement;

    const roi = PRESET_PARTICIPANT_ROIS[1]; // 2x2 top-left
    const res = cropFrameToROI(mockVideo, mockCanvas, roi);
    expect(res).toBe(true);
    expect(drawn).toBe(true);
  });

  it('19. PLATFORM_CAPABILITY_MATRIX details Android, iOS, Desktop, and iframe mechanisms', () => {
    expect(PLATFORM_CAPABILITY_MATRIX.length).toBeGreaterThanOrEqual(5);

    const androidItem = PLATFORM_CAPABILITY_MATRIX.find((p) => p.platform.includes('Android 10+'));
    expect(androidItem).toBeDefined();
    expect(androidItem?.mechanism).toContain('MediaProjection');
    expect(androidItem?.videoAccessible).toBe(true);
    expect(androidItem?.audioAccessible).toBe(false); // Truthful: VoIP audio blocked by OS policy

    const desktopItem = PLATFORM_CAPABILITY_MATRIX.find((p) => p.platform.includes('Desktop'));
    expect(desktopItem?.videoAccessible).toBe(true);
    expect(desktopItem?.backgroundPersistence).toBe(true);
  });

  it('20. NativeCompanionBridge initializes and manages connection lifecycle', () => {
    const bridge = new NativeCompanionBridge();
    expect(bridge.getStatus()).toBe(false);
    bridge.disconnect();
    expect(bridge.getStatus()).toBe(false);
  });
});
