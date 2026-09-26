// ─── Live-Call Deepfake Protection Component (Stream Isolation & Real-Time Monitoring) ───

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Camera,
  RotateCw,
  Eye,
  AlertTriangle,
  Play,
  Square,
  CheckCircle2,
  Lock,
  Monitor,
  Radio,
  RefreshCw,
  Volume2,
  Info,
  Layers,
  HelpCircle,
  Copy,
  Check,
  XCircle,
  Clock,
  Pause,
  UploadCloud,
  ArrowRight,
  Target,
  Smartphone,
  ExternalLink,
  Cpu,
  Sliders,
  Grid3X3,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  LiveCallState,
  LiveSourceType,
  ChallengeType,
  ChallengeState,
  AnalysisSampleResult,
  StreamHealthMetrics,
  StreamLogItem,
  RegionOfInterest,
  PRESET_PARTICIPANT_ROIS,
  PLATFORM_CAPABILITY_MATRIX,
  PlatformCapabilityMatrixItem,
  INITIAL_STREAM_HEALTH,
  checkPlatformCapabilities,
  validateMediaStream,
  createSafeMonitoringStream,
  generateChallengePrompt,
  getFriendlyMediaErrorMessage,
  BoundedFrameAnalyzer,
  NativeCompanionBridge,
} from '@/lib/videoDetection/liveCallStreamManager';

export default function LiveCallDeepfakeProtection() {
  const navigate = useNavigate();

  // Discrete Monitoring States: selecting_source | connecting | monitoring | interrupted | unsupported | error | stopped | companion_connecting | idle
  const [appState, setAppState] = useState<LiveCallState>('idle');
  const [sourceType, setSourceType] = useState<LiveSourceType>('none');
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [showCompanionModal, setShowCompanionModal] = useState(false);
  const [companionWsUrl, setCompanionWsUrl] = useState('ws://localhost:8899/screen-stream');
  const [companionStatus, setCompanionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState<{ title: string; message: string; isMobile?: boolean } | null>(null);

  // Participant Region of Interest (ROI) State
  const [selectedRoi, setSelectedRoi] = useState<RegionOfInterest>(PRESET_PARTICIPANT_ROIS[0]);
  const selectedRoiRef = useRef<RegionOfInterest>(PRESET_PARTICIPANT_ROIS[0]);
  useEffect(() => {
    selectedRoiRef.current = selectedRoi;
  }, [selectedRoi]);

  // Platform capabilities
  const [platformInfo] = useState(() => checkPlatformCapabilities());

  // Stream & Hardware Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const releaseStreamCallbackRef = useRef<(() => void) | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0);
  const fpsWindowRef = useRef<{ timestamp: number; frames: number }[]>([]);
  const lastFreshFrameTimeRef = useRef<number>(Date.now());
  const frameAnalyzerRef = useRef<BoundedFrameAnalyzer>(new BoundedFrameAnalyzer(1500));
  const companionBridgeRef = useRef<NativeCompanionBridge>(new NativeCompanionBridge());

  // Health Metrics & Active Analysis Result
  const [health, setHealth] = useState<StreamHealthMetrics>(INITIAL_STREAM_HEALTH);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisSampleResult | null>(null);
  const [logs, setLogs] = useState<StreamLogItem[]>([
    {
      id: 'init',
      timestamp: new Date().toLocaleTimeString(),
      event: 'Live-Call Protection engine ready. Select an authorized video source to begin.',
      type: 'info',
    },
  ]);

  // Active Challenge State
  const [challenge, setChallenge] = useState<ChallengeState>({
    type: null,
    prompt: null,
    issuedAt: null,
    status: 'idle',
    verificationMessage: '',
  });

  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const addLog = useCallback((event: string, type: 'info' | 'warning' | 'alert' | 'success' = 'info') => {
    setLogs((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toLocaleTimeString(),
        event,
        type,
      },
      ...prev.slice(0, 35),
    ]);
  }, []);

  // Safe Cleanup: only releases tracks owned by monitoring, never pauses or stops host call tracks
  const cleanupMedia = useCallback((targetState: LiveCallState = 'idle') => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    if (frameAnalyzerRef.current) {
      frameAnalyzerRef.current.cancel();
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    if (releaseStreamCallbackRef.current) {
      try {
        releaseStreamCallbackRef.current();
      } catch {
        // ignore
      }
      releaseStreamCallbackRef.current = null;
    }
    mediaStreamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    frameCountRef.current = 0;
    fpsWindowRef.current = [];

    setHealth(INITIAL_STREAM_HEALTH);
    setAppState(targetState);
    if (targetState === 'idle' || targetState === 'stopped') {
      setSourceType('none');
    }
    setChallenge({
      type: null,
      prompt: null,
      issuedAt: null,
      status: 'idle',
      verificationMessage: '',
    });
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupMedia('idle');
    };
  }, [cleanupMedia]);

  // Real-Time Frame & Audio Telemetry Loop with Stagnation Detection
  const startMetricsLoop = useCallback(() => {
    const dataArray = new Uint8Array(128);
    lastFreshFrameTimeRef.current = performance.now();
    frameAnalyzerRef.current.reset();

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }

    const updateFrame = async () => {
      const video = videoRef.current;
      const stream = mediaStreamRef.current;
      const analyser = analyserRef.current;

      if (!stream || stream.getVideoTracks().length === 0) {
        return;
      }

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      const now = performance.now();

      // Audio RMS Level Measurement (if audio track present and unmuted)
      let audioRms = 0;
      let audioDb = -Infinity;
      if (analyser && audioTrack && audioTrack.readyState === 'live' && !audioTrack.muted) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        audioRms = Math.min(1, sum / (dataArray.length * 128));
        audioDb = audioRms > 0.01 ? Math.round(20 * Math.log10(audioRms)) : -60;
      }

      // Check Video decodable frames & detect stagnation
      let width = 0;
      let height = 0;
      let fps = 0;
      let isStagnant = false;

      if (video && video.videoWidth > 0 && !video.paused && !video.ended && videoTrack?.readyState === 'live') {
        width = video.videoWidth;
        height = video.videoHeight;
        frameCountRef.current += 1;
        lastFreshFrameTimeRef.current = now;

        // Rolling 1-second FPS calculation
        fpsWindowRef.current.push({ timestamp: now, frames: frameCountRef.current });
        fpsWindowRef.current = fpsWindowRef.current.filter((item) => now - item.timestamp <= 1000);

        if (fpsWindowRef.current.length > 1) {
          const first = fpsWindowRef.current[0];
          const last = fpsWindowRef.current[fpsWindowRef.current.length - 1];
          const timeSpan = (last.timestamp - first.timestamp) / 1000;
          if (timeSpan > 0.2) {
            fps = Math.round(((last.frames - first.frames) / timeSpan) * 10) / 10;
          }
        }

        // Bounded Frame Analysis with backpressure & Participant ROI
        if (offscreenCanvasRef.current && frameAnalyzerRef.current.shouldSample(Date.now())) {
          frameAnalyzerRef.current
            .analyzeFrame(
              offscreenCanvasRef.current,
              video,
              frameCountRef.current,
              selectedRoiRef.current,
              Boolean(audioTrack && audioTrack.readyState === 'live')
            )
            .then((res) => {
              if (res) {
                setLastAnalysis(res);
              }
            })
            .catch(() => {});
        }
      } else {
        // Frame delivery stopped or video paused
        const timeSinceLastFrame = now - lastFreshFrameTimeRef.current;
        if (timeSinceLastFrame > 2500) {
          isStagnant = true;
          // Mark previous analysis result as stale
          setLastAnalysis((prev) => (prev ? { ...prev, isStale: true } : null));
          setAppState((curr) => (curr === 'monitoring' ? 'interrupted' : curr));
        }
      }

      setHealth((prev) => ({
        ...prev,
        videoConnected: videoTrack?.readyState === 'live' && !videoTrack?.muted,
        audioConnected: audioTrack?.readyState === 'live' && !audioTrack?.muted,
        videoTrackState: videoTrack ? videoTrack.readyState : 'none',
        audioTrackState: audioTrack ? audioTrack.readyState : 'none',
        resolutionWidth: width,
        resolutionHeight: height,
        measuredFps: isStagnant ? 0 : fps,
        totalFramesReceived: frameCountRef.current,
        audioRmsLevel: audioRms,
        audioDb,
        lastFrameTimestamp: lastFreshFrameTimeRef.current,
        lastFrameDeltaMs: Math.round(now - lastFreshFrameTimeRef.current),
        isFrameStagnant: isStagnant,
      }));

      animFrameIdRef.current = requestAnimationFrame(updateFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(updateFrame);
  }, []);

  // Web Audio Context initialization (isolated from speaker output)
  const setupAudioAnalysis = useCallback((stream: MediaStream) => {
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const sourceNode = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      sourceNode.connect(analyser); // Analyser only; NEVER connects to audioCtx.destination (no feedback)

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
    } catch (err) {
      console.warn('[LiveCallDeepfakeProtection] Web Audio analysis not initialized:', err);
    }
  }, []);

  // Attach track lifecycle event listeners
  const attachTrackListeners = useCallback(
    (stream: MediaStream, type: LiveSourceType) => {
      stream.getTracks().forEach((track) => {
        track.onended = () => {
          addLog(`Stream track ended: ${track.kind} (${track.label || 'source'})`, 'warning');
          setAppState('interrupted');
          setLastAnalysis((prev) => (prev ? { ...prev, isStale: true } : null));
          toast.info('Captured window or call track ended.');
        };

        track.onmute = () => {
          addLog(`Track muted / backgrounded: ${track.kind}`, 'warning');
          setAppState('interrupted');
          setLastAnalysis((prev) => (prev ? { ...prev, isStale: true } : null));
        };

        track.onunmute = () => {
          addLog(`Track unmuted / resumed: ${track.kind}`, 'info');
          lastFreshFrameTimeRef.current = performance.now();
          setAppState((curr) => (curr === 'interrupted' ? 'monitoring' : curr));
        };
      });
    },
    [addLog]
  );

  // 1. Connect Call Window / Tab / Screen (Explicit getDisplayMedia, No Microphone Required)
  const connectDisplayMedia = async () => {
    setShowSourceModal(false);
    setErrorMessage(null);

    // Capability gate
    if (!platformInfo.supportsScreenCapture) {
      setAppState('unsupported');
      const err = {
        title: platformInfo.isMobile ? 'Mobile Limitation: External App Capture Not Permitted' : 'Screen Sharing Unavailable',
        message:
          platformInfo.reason ||
          'Mobile operating systems (iOS / Android) do not permit web browsers to capture other apps or screen windows via getDisplayMedia.',
        isMobile: platformInfo.isMobile,
      };
      setErrorMessage(err);
      addLog(`Display capture unsupported on this device: ${err.message}`, 'alert');
      return;
    }

    setAppState('connecting');
    addLog('Requesting authorization to observe video call window / tab via getDisplayMedia...', 'info');

    try {
      // getDisplayMedia constraints: do NOT request mic; system/tab audio is optional
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'window',
        } as any,
        audio: {
          suppressLocalAudioPlayback: false,
        } as any,
        selfBrowserSurface: 'exclude',
        preferCurrentTab: false,
      } as any);

      const val = validateMediaStream(displayStream);
      if (!val.isValid || !val.hasVideo) {
        throw new Error(val.reason || 'Screen stream contains no active video track');
      }

      const { monitoringStream, releaseMonitoringStream } = createSafeMonitoringStream(displayStream, true);
      mediaStreamRef.current = monitoringStream;
      releaseStreamCallbackRef.current = releaseMonitoringStream;
      setSourceType('shared_screen_window');

      const vTrack = monitoringStream.getVideoTracks()[0];
      const aTrack = monitoringStream.getAudioTracks()[0];

      setHealth((prev) => ({
        ...prev,
        sourceType: 'shared_screen_window',
        sourceLabel: 'Authorized Video Call Window / Tab',
        sourceDescription: 'Observing user-authorized display stream without modifying host playback.',
        videoConnected: Boolean(vTrack && vTrack.readyState === 'live'),
        audioConnected: Boolean(aTrack && aTrack.readyState === 'live'),
        videoLabel: vTrack?.label || 'Shared Video-Call Display',
        audioLabel: aTrack?.label || (aTrack ? 'Shared Tab / System Audio' : 'No Audio Selected'),
      }));

      setupAudioAnalysis(monitoringStream);
      attachTrackListeners(monitoringStream, 'shared_screen_window');

      if (videoRef.current) {
        videoRef.current.srcObject = monitoringStream;
        videoRef.current.play().catch(() => {});
      }

      setAppState('idle'); // Source attached, ready to start monitoring
      startMetricsLoop();
      addLog(`Attached Call Window Source: "${vTrack?.label || 'Display Stream'}" (${aTrack ? 'audio captured' : 'video only'}).`, 'success');
      toast.success('Video Call Source Connected (Ready to Monitor)');
    } catch (err: any) {
      console.error('[LiveCallDeepfakeProtection] Display capture error:', err);
      const friendly = getFriendlyMediaErrorMessage(err);
      setErrorMessage(friendly);
      setAppState('error');
      addLog(`Failed to attach screen source: ${friendly.message}`, 'alert');
      if (err.name !== 'AbortError') {
        toast.error(friendly.title);
      }
    }
  };

  // 2. Connect Device Camera (Explicit Local Self-Test, Never Silent Fallback)
  const connectDeviceCameraTest = async () => {
    setShowSourceModal(false);
    setErrorMessage(null);
    setAppState('connecting');
    addLog('Requesting local camera & microphone for self-test...', 'info');

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices
        .getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
          audio: true,
        })
        .catch(async (err) => {
          if (err.name === 'NotFoundError' || err.name === 'NotAllowedError') {
            addLog('Audio capture unavailable; connecting video-only camera stream...', 'warning');
            return await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 1280 }, height: { ideal: 720 } },
              audio: false,
            });
          }
          throw err;
        });

      const val = validateMediaStream(stream);
      if (!val.isValid || !val.hasVideo) {
        throw new Error(val.reason || 'Camera stream contains no active video track');
      }

      const { monitoringStream, releaseMonitoringStream } = createSafeMonitoringStream(stream, true);
      mediaStreamRef.current = monitoringStream;
      releaseStreamCallbackRef.current = releaseMonitoringStream;
      setSourceType('device_camera_test');

      const vTrack = monitoringStream.getVideoTracks()[0];
      const aTrack = monitoringStream.getAudioTracks()[0];

      setHealth((prev) => ({
        ...prev,
        sourceType: 'device_camera_test',
        sourceLabel: 'Local Camera & Mic Self-Test',
        sourceDescription: 'Local loopback testing for personal camera/mic liveness and lighting.',
        videoConnected: Boolean(vTrack && vTrack.readyState === 'live'),
        audioConnected: Boolean(aTrack && aTrack.readyState === 'live'),
        videoLabel: vTrack?.label || 'Default Camera',
        audioLabel: aTrack?.label || (aTrack ? 'Default Microphone' : 'Not Connected'),
      }));

      setupAudioAnalysis(monitoringStream);
      attachTrackListeners(monitoringStream, 'device_camera_test');

      if (videoRef.current) {
        videoRef.current.srcObject = monitoringStream;
        videoRef.current.play().catch(() => {});
      }

      setAppState('idle');
      startMetricsLoop();
      addLog(`Connected Local Camera: "${vTrack?.label || 'Camera'}" with ${aTrack ? 'audio' : 'no audio'}.`, 'success');
      toast.success('Local Camera Connected (Self-Test Mode)');
    } catch (err: any) {
      console.error('[LiveCallDeepfakeProtection] Camera connection error:', err);
      const friendly = getFriendlyMediaErrorMessage(err);
      setErrorMessage(friendly);
      setAppState('error');
      addLog(`Failed to connect camera: ${friendly.message}`, 'alert');
      toast.error(friendly.title);
    }
  };

  // Start Monitoring (Idempotent)
  const handleStartProtection = () => {
    if (!consentConfirmed) {
      toast.error('Participant notice & consent confirmation is required before monitoring.');
      return;
    }

    if (appState === 'monitoring') {
      return; // Already monitoring (idempotent)
    }

    if (!mediaStreamRef.current) {
      toast.error('Please connect a live video source before starting monitoring.');
      return;
    }

    const val = validateMediaStream(mediaStreamRef.current);
    if (!val.isValid || !val.hasVideo) {
      toast.error('No live video track available. Please reconnect a valid source.');
      return;
    }

    lastFreshFrameTimeRef.current = performance.now();
    frameAnalyzerRef.current.reset();
    setAppState('monitoring');
    addLog(`Live Deepfake Protection active on ${health.sourceLabel}. Analyzing cadence...`, 'success');
    toast.success('Live Video Monitoring Active');
  };

  // Stop Monitoring (Releases only monitoring resources, keeps host call intact)
  const handleStopProtection = () => {
    cleanupMedia('stopped');
    addLog('Live monitoring stopped. Monitoring resources released without affecting call.', 'info');
    toast.info('Live Video Monitoring Stopped');
  };

  // Interactive Challenge-Response Trigger
  const handleIssueChallenge = (type: ChallengeType) => {
    if (appState !== 'monitoring') {
      toast.error('Active challenges can only be issued while live video monitoring is actively running.');
      return;
    }

    const prompt = generateChallengePrompt(type);
    setChallenge({
      type,
      prompt,
      issuedAt: Date.now(),
      status: 'in_progress',
      verificationMessage: 'Challenge prompt issued to remote participant. Verify physical response in video feed.',
    });

    addLog(`Interactive liveness challenge issued: [${type}] "${prompt}"`, 'warning');
    toast.info(`Challenge Issued: ${type.replace(/_/g, ' ')}`);
  };

  // Manual Operator Attestation
  const handleOperatorAttestation = (passed: boolean) => {
    if (challenge.status !== 'in_progress') return;

    setChallenge((prev) => ({
      ...prev,
      status: passed ? 'passed' : 'failed',
      verificationMessage: passed
        ? 'Operator Attestation: Real-time physical liveness confirmed without synthetic distortion.'
        : 'Operator Attestation: Physical challenge failed or rejected due to visual anomaly / non-compliance.',
    }));

    addLog(
      passed ? 'Challenge verified as PASS by operator.' : 'Challenge flagged as FAIL by operator.',
      passed ? 'success' : 'alert'
    );

    if (passed) {
      toast.success('Challenge Marked as Passed');
    } else {
      toast.error('Challenge Flagged as Failed');
    }
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
    toast.success('Challenge prompt copied to clipboard');
  };

  const isStreamLive = health.videoConnected && (appState === 'idle' || appState === 'monitoring' || appState === 'interrupted');
  const isMonitoring = appState === 'monitoring';
  const isInterrupted = appState === 'interrupted';

  return (
    <div className="space-y-6">
      {/* Source Selection Modal */}
      <Dialog open={showSourceModal} onOpenChange={setShowSourceModal}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" /> Select Video Monitoring Source
            </DialogTitle>
            <DialogDescription className="text-xs">
              Choose an input source. In compliance with browser privacy standards, call monitoring observes only the window, tab, or camera you explicitly authorize.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 pt-2">
            {/* Option 1: Share Video-Call Window / Tab (Primary for active meetings) */}
            <div
              onClick={connectDisplayMedia}
              className={`p-4 rounded-xl border transition-all space-y-2 group cursor-pointer ${
                platformInfo.supportsScreenCapture
                  ? 'border-border bg-card hover:border-primary/50 hover:bg-muted/30'
                  : 'border-dashed border-border/70 bg-muted/20 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Monitor className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                  1. Monitor a Video Call or Shared Screen
                </div>
                <Badge variant={platformInfo.supportsScreenCapture ? 'default' : 'outline'} className="text-[10px]">
                  {platformInfo.supportsScreenCapture ? 'Recommended for Calls' : 'Unsupported on Mobile'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Observes an active Zoom, Google Meet, Microsoft Teams, or WebRTC call window or browser tab via{' '}
                <code className="text-primary font-mono text-[11px]">getDisplayMedia</code> without modifying the call playback element.
              </p>
              {!platformInfo.supportsScreenCapture && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Mobile browsers cannot capture background calling apps. Use a desktop browser instead.</span>
                </div>
              )}
            </div>

            {/* Option 2: Device Camera Test */}
            <div
              onClick={connectDeviceCameraTest}
              className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted/30 cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Camera className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                  2. Analyze My Camera (Local Self-Test)
                </div>
                <Badge variant="outline" className="text-[10px]">Pre-Call Test Only</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tests your own webcam and lighting before joining a meeting. Do not use this to monitor an active call if your calling app is already using the webcam.
              </p>
            </div>

            {/* Option 3: Android Native Companion / WebRTC Screen Stream */}
            <div
              onClick={() => {
                setShowSourceModal(false);
                setShowCompanionModal(true);
              }}
              className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted/30 cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Smartphone className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                  3. Connect Android / Mobile Companion App
                </div>
                <Badge variant="secondary" className="text-[10px]">Android MediaProjection</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connects to the AIDetector Android Companion Service running with <code className="text-primary font-mono text-[11px]">MediaProjection</code> foreground service to monitor WhatsApp, Zoom, Teams, or Meet on Android.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Environment Capability Matrix Modal */}
      <Dialog open={showMatrixModal} onOpenChange={setShowMatrixModal}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Cpu className="w-5 h-5 text-primary" /> Supported Live-Call Protection Capability Matrix
            </DialogTitle>
            <DialogDescription className="text-xs">
              Truthful assessment of supported capture mechanisms, incoming video/audio accessibility, and background persistence across platforms and target apps.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="w-full max-w-full overflow-x-auto bg-card rounded-lg border">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50 text-muted-foreground">
                    <th className="p-2.5 font-semibold whitespace-nowrap">Platform</th>
                    <th className="p-2.5 font-semibold whitespace-nowrap">Target Apps</th>
                    <th className="p-2.5 font-semibold whitespace-nowrap">Capture Mechanism</th>
                    <th className="p-2.5 font-semibold whitespace-nowrap">Participant Video</th>
                    <th className="p-2.5 font-semibold whitespace-nowrap">Call Audio</th>
                    <th className="p-2.5 font-semibold whitespace-nowrap">Background Persistence</th>
                    <th className="p-2.5 font-semibold whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {PLATFORM_CAPABILITY_MATRIX.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/20">
                      <td className="p-2.5 font-semibold whitespace-nowrap">{item.platform}</td>
                      <td className="p-2.5 whitespace-nowrap text-muted-foreground">{item.targetApp}</td>
                      <td className="p-2.5 whitespace-nowrap font-mono text-[11px]">{item.mechanism}</td>
                      <td className="p-2.5 whitespace-nowrap">
                        {item.videoAccessible ? (
                          <Badge variant="default" className="bg-emerald-600 text-[10px] py-0 px-1.5">Yes</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px] py-0 px-1.5">No</Badge>
                        )}
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        {item.audioAccessible ? (
                          <Badge variant="default" className="bg-emerald-600 text-[10px] py-0 px-1.5">Yes</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-[10px] py-0 px-1.5">OS Restricted</Badge>
                        )}
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        {item.backgroundPersistence ? (
                          <span className="text-emerald-600 font-medium">Maintained</span>
                        ) : (
                          <span className="text-amber-600 font-medium">Suspended</span>
                        )}
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        <Badge
                          variant={
                            item.status === 'implemented_and_tested'
                              ? 'default'
                              : item.status === 'requires_development'
                              ? 'secondary'
                              : 'destructive'
                          }
                          className="text-[10px] py-0"
                        >
                          {item.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg text-xs space-y-1.5 border">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-primary" /> Key Security & Operating System Policy Notes:
              </div>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li><strong>Android Audio Protection:</strong> Android 10+ VoIP apps (WhatsApp, Zoom, Teams) set <code className="text-primary font-mono text-[11px]">setAllowedCapturePolicy(ALLOW_CAPTURE_BY_NONE)</code> which blocks audio recording by third-party apps by default for privacy.</li>
                <li><strong>Android Screen Capture:</strong> Requires user-authorized <code className="text-primary font-mono text-[11px]">MediaProjection</code> and a Foreground Service with <code className="text-primary font-mono text-[11px]">type="mediaProjection"</code> to persist while the calling app is in front.</li>
                <li><strong>Desktop Contention:</strong> Desktop <code className="text-primary font-mono text-[11px]">getDisplayMedia</code> captures the window composited surface without accessing the hardware camera, preventing hardware locks with Zoom/Teams.</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Android Native Companion Modal */}
      <Dialog open={showCompanionModal} onOpenChange={setShowCompanionModal}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Smartphone className="w-5 h-5 text-primary" /> Android Native Companion Service Setup
            </DialogTitle>
            <DialogDescription className="text-xs">
              Live protection for native Android calling apps (WhatsApp, Zoom, Teams, Meet) using Android MediaProjection foreground service.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Companion WebSocket Bridge</span>
                <Badge
                  variant={companionStatus === 'connected' ? 'default' : companionStatus === 'connecting' ? 'secondary' : 'outline'}
                  className="text-[10px]"
                >
                  {companionStatus}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={companionWsUrl}
                  onChange={(e) => setCompanionWsUrl(e.target.value)}
                  placeholder="ws://localhost:8899/screen-stream"
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border bg-background font-mono"
                />
                <Button
                  size="sm"
                  variant="default"
                  className="text-xs h-8"
                  onClick={async () => {
                    setCompanionStatus('connecting');
                    const ok = await companionBridgeRef.current.connect(companionWsUrl);
                    if (ok) {
                      setCompanionStatus('connected');
                      setAppState('idle');
                      setSourceType('native_companion');
                      setHealth((prev) => ({
                        ...prev,
                        sourceType: 'native_companion',
                        sourceLabel: 'Android Companion (MediaProjection)',
                        sourceDescription: 'Screen feed captured via Android Foreground Service.',
                        videoConnected: true,
                        audioConnected: false,
                        videoLabel: 'Android Screen Stream (VirtualDisplay)',
                        audioLabel: 'Restricted by Android VoIP Audio Policy',
                      }));
                      toast.success('Android Companion Bridge Connected');
                      setShowCompanionModal(false);
                    } else {
                      setCompanionStatus('error');
                      toast.error('Could not connect to Companion WebSocket bridge on device.');
                    }
                  }}
                >
                  Connect Bridge
                </Button>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary" /> Architecture & Implementation Blueprint
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                To monitor native WhatsApp / Zoom calls on Android without interruptions:
              </p>
              <ol className="list-decimal pl-4 space-y-1.5 text-muted-foreground">
                <li>Install the <strong>AIDetector Companion APK</strong> on the Android device.</li>
                <li>Tap <strong>"Start Live Call Shield"</strong> to grant user-authorized <code className="text-primary font-mono text-[11px]">MediaProjection</code> permission.</li>
                <li>The companion launches a <code className="text-primary font-mono text-[11px]">ForegroundService</code> (type: <code className="text-primary font-mono text-[11px]">mediaProjection</code>) displaying a floating inspection badge.</li>
                <li>Switch to WhatsApp or Zoom — the service continuously samples the incoming video frame without touching the microphone or locking the camera hardware.</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Header & Control Panel */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 text-primary">Live Call Protection</Badge>
              <Badge
                variant={
                  isMonitoring
                    ? 'default'
                    : isInterrupted
                    ? 'destructive'
                    : isStreamLive
                    ? 'secondary'
                    : 'outline'
                }
              >
                {isMonitoring
                  ? 'Status: Monitoring Active'
                  : isInterrupted
                  ? 'Status: Monitoring Interrupted (Billing Suspended)'
                  : isStreamLive
                  ? 'Status: Source Connected (Ready)'
                  : appState === 'unsupported'
                  ? 'Status: Unsupported on this Platform'
                  : 'Status: Idle (No Source Connected)'}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMatrixModal(true)}
                className="text-xs gap-1.5"
              >
                <Cpu className="w-3.5 h-3.5 text-primary" /> Capability Matrix
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompanionModal(true)}
                className="text-xs gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-500" /> Android Shield
              </Button>
              {isStreamLive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSourceModal(true)}
                  className="text-xs gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Change Source
                </Button>
              )}
              {isStreamLive ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleStopProtection}
                  className="text-xs gap-1.5"
                >
                  <Square className="w-3.5 h-3.5" /> Stop Monitoring
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowSourceModal(true)}
                  className="text-xs gap-1.5"
                >
                  <Video className="w-3.5 h-3.5" /> Select Video Source
                </Button>
              )}
            </div>
          </div>

          <CardTitle className="text-xl pt-2">Live-Call Deepfake Protection & Challenge-Response</CardTitle>
          <CardDescription className="text-xs">
            Real-time deepfake integrity verification and interactive challenge-response to safeguard executive video conferences, financial transactions, and KYC interviews without interrupting active calls.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Unsupported Mobile Limitation Banner */}
          {appState === 'unsupported' && (
            <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200 py-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                Mobile OS Limitation Detected
              </AlertTitle>
              <AlertDescription className="text-xs mt-1 leading-relaxed space-y-2">
                <p>
                  Mobile operating systems (iOS and Android) do not allow web browsers to capture other running calling apps (Zoom, Teams, Meet) in the background.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5 bg-background"
                    onClick={() => navigate('/ai-video-detector')}
                  >
                    <UploadCloud className="w-3.5 h-3.5" /> Upload Recorded Video Instead
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    onClick={connectDeviceCameraTest}
                  >
                    <Camera className="w-3.5 h-3.5" /> Test Local Camera Instead
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Interruption Notice */}
          {isInterrupted && (
            <Alert variant="destructive" className="py-2.5">
              <Pause className="w-4 h-4" />
              <AlertTitle className="text-xs font-semibold">Monitoring Interrupted — No New Video Frames</AlertTitle>
              <AlertDescription className="text-xs mt-0.5 leading-relaxed">
                The captured window or video stream stopped delivering fresh frames (app switched, window minimized, or call ended). Analysis requests and charges are suspended. Re-activate the window or unpause the stream to resume.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message Banner */}
          {errorMessage && appState !== 'unsupported' && (
            <Alert variant="destructive" className="py-2.5">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle className="text-xs font-semibold">{errorMessage.title}</AlertTitle>
              <AlertDescription className="text-xs mt-0.5 leading-relaxed">
                {errorMessage.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Consent Checkbox */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="live-consent-check"
                checked={consentConfirmed}
                onChange={(e) => setConsentConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-border text-primary cursor-pointer"
              />
              <label
                htmlFor="live-consent-check"
                className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none"
              >
                <strong>Mandatory Participant Notice & Consent:</strong> I confirm that participants in this session have been informed of live forensic monitoring. Frames and audio metrics are processed locally in volatile memory under strict Zero-Retention policy.
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Zero Audio/Video Remote Retention (Local Browser Memory Only)</span>
              </div>

              {!isMonitoring && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleStartProtection}
                  disabled={!consentConfirmed || !isStreamLive || isInterrupted}
                  className="gap-1.5 text-xs"
                >
                  <Play className="w-3.5 h-3.5" /> Start Monitoring
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* When No Source is Connected: Explicit Default State */}
      {!isStreamLive && appState !== 'unsupported' && (
        <Card className="border-border bg-card/60 text-center py-12 px-4">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground border border-border shadow-inner">
              <VideoOff className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-semibold">No Active Call or Stream Connected</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect your active video conference window (Zoom, Meet, Teams) or test with your local device camera to begin real-time verification.
              </p>
            </div>

            {/* Inactive System Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left pt-2">
              <div className="p-2.5 rounded-lg border bg-background/50 space-y-1">
                <div className="text-[11px] text-muted-foreground">Video Stream</div>
                <div className="text-xs font-semibold text-muted-foreground">Not connected</div>
              </div>
              <div className="p-2.5 rounded-lg border bg-background/50 space-y-1">
                <div className="text-[11px] text-muted-foreground">Audio Stream</div>
                <div className="text-xs font-semibold text-muted-foreground">Not connected</div>
              </div>
              <div className="p-2.5 rounded-lg border bg-background/50 space-y-1">
                <div className="text-[11px] text-muted-foreground">Sampling Rate</div>
                <div className="text-xs font-semibold text-muted-foreground">1 frame / 1.5s</div>
              </div>
              <div className="p-2.5 rounded-lg border bg-background/50 space-y-1">
                <div className="text-[11px] text-muted-foreground">Analysis Engine</div>
                <div className="text-xs font-semibold text-muted-foreground">Standby</div>
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={() => setShowSourceModal(true)} className="gap-2 text-xs">
                <Video className="w-4 h-4" /> Connect Video Source
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Live Media Stream Preview & Health Dashboard (Active Stream) */}
      {isStreamLive && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Live Video Preview & Hardware Stream Health */}
          <Card className="border-border bg-card lg:col-span-1 space-y-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" /> Monitored Video Stream
                </CardTitle>
                <Badge
                  variant={isInterrupted ? 'destructive' : health.videoConnected ? 'default' : 'destructive'}
                  className="text-[10px]"
                >
                  {isInterrupted
                    ? 'Interrupted (0 FPS)'
                    : health.videoConnected
                    ? `${health.measuredFps} FPS`
                    : 'Video Inactive'}
                </Badge>
              </div>
              <CardDescription className="text-xs truncate">
                {health.sourceLabel}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Participant ROI Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Grid3X3 className="w-3.5 h-3.5 text-primary" /> Target Participant / Grid Focus
                  </span>
                  <span className="text-[10px] text-muted-foreground">Select calling tile</span>
                </div>
                <Select
                  value={selectedRoi.id}
                  onValueChange={(val) => {
                    const found = PRESET_PARTICIPANT_ROIS.find((r) => r.id === val);
                    if (found) {
                      setSelectedRoi(found);
                      toast.info(`Target region set to: ${found.label}`);
                    }
                  }}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Select Participant Tile" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_PARTICIPANT_ROIS.map((roi) => (
                      <SelectItem key={roi.id} value={roi.id} className="text-xs">
                        {roi.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Isolated Video Preview Element: muted and inline to prevent any audio feedback */}
              <div className="relative aspect-video rounded-xl bg-black overflow-hidden border border-border flex items-center justify-center group shadow-md">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted // Prevents local audio feedback loop
                  className="w-full h-full object-cover"
                />

                {/* Participant ROI Bounding Box Overlay */}
                {selectedRoi.id !== 'full' && (
                  <div
                    className="absolute border-2 border-primary bg-primary/10 pointer-events-none rounded transition-all duration-300"
                    style={{
                      left: `${selectedRoi.x}%`,
                      top: `${selectedRoi.y}%`,
                      width: `${selectedRoi.width}%`,
                      height: `${selectedRoi.height}%`,
                    }}
                  >
                    <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-semibold px-1 rounded shadow">
                      {selectedRoi.label.split('(')[0]}
                    </div>
                  </div>
                )}

                {/* Live / Interrupted Indicator Overlay */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-medium border border-white/10">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isInterrupted
                        ? 'bg-amber-500'
                        : isMonitoring
                        ? 'bg-red-500 animate-pulse'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span>
                    {isInterrupted ? 'PAUSED / INTERRUPTED' : isMonitoring ? 'MONITORING LIVE' : 'PREVIEW ONLY'}
                  </span>
                </div>

                <div className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-mono border border-white/10">
                  {health.resolutionWidth > 0 ? `${health.resolutionWidth}x${health.resolutionHeight}` : 'Evaluating'}
                </div>
              </div>

              {/* Real Audio Volume Meter */}
              <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Volume2 className="w-3.5 h-3.5" /> Audio Stream Activity
                  </span>
                  <span className="font-mono text-[11px]">
                    {health.audioConnected ? `${health.audioDb} dB` : 'No Audio Captured'}
                  </span>
                </div>
                <Progress value={health.audioConnected ? health.audioRmsLevel * 100 : 0} className="h-2" />
                {!health.audioConnected && (
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Audio stream is optional for video monitoring. Lip-synchronization telemetry is disabled without audio.
                  </p>
                )}
              </div>

              {/* Stream Telemetry */}
              <div className="space-y-2 text-xs border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Target Focus:</span>
                  <span className="font-semibold text-primary">{selectedRoi.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Capture Source:</span>
                  <span className="font-medium text-foreground capitalize">{health.sourceType.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Video Track:</span>
                  <span className="font-mono text-[11px] truncate max-w-[160px]">{health.videoLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Audio Track:</span>
                  <span className="font-mono text-[11px] truncate max-w-[160px]">{health.audioLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Frames Decoded:</span>
                  <span className="font-mono font-semibold text-primary">{health.totalFramesReceived.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Forensic Analysis & Interactive Challenge-Response */}
          <div className="lg:col-span-2 space-y-6">
            {/* Forensic Detection Status & Result Card */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Real-Time Forensic Integrity Analysis</CardTitle>
                  <Badge
                    variant={isInterrupted ? 'destructive' : isMonitoring ? 'default' : 'secondary'}
                    className="text-[10px]"
                  >
                    {isInterrupted
                      ? 'Analysis Suspended (Interrupted)'
                      : isMonitoring
                      ? 'Continuous Sampling (1.5s)'
                      : 'Awaiting Monitoring Start'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Result Display */}
                {lastAnalysis && (
                  <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-semibold">Latest Sample Analysis</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                        <Clock className="w-3 h-3" />
                        <span>Analyzed at {new Date(lastAnalysis.analyzedAt).toLocaleTimeString()}</span>
                        {lastAnalysis.isStale && (
                          <Badge variant="outline" className="text-amber-600 text-[10px] px-1 py-0">
                            Stale (Stream Paused)
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg border bg-background space-y-1">
                        <span className="text-muted-foreground">Synthetic Score</span>
                        <div className="font-bold text-sm text-foreground">{lastAnalysis.syntheticScore}%</div>
                      </div>
                      <div className="p-2.5 rounded-lg border bg-background space-y-1">
                        <span className="text-muted-foreground">Liveness Confidence</span>
                        <div className="font-bold text-sm text-emerald-600">{lastAnalysis.livenessConfidence}%</div>
                      </div>
                      <div className="p-2.5 rounded-lg border bg-background space-y-1">
                        <span className="text-muted-foreground">Audio Sync</span>
                        <div className="font-semibold text-xs capitalize text-foreground">
                          {lastAnalysis.audioSyncStatus.replace(/_/g, ' ')}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg border bg-background space-y-1">
                        <span className="text-muted-foreground">Frame Index</span>
                        <div className="font-mono text-xs text-muted-foreground">#{lastAnalysis.frameIndex}</div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {lastAnalysis.summaryMessage}
                    </p>
                  </div>
                )}

                {/* Real Stream Conditions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg border bg-background space-y-1">
                    <span className="text-muted-foreground">Frame Cadence & Delivery</span>
                    <div
                      className={`font-semibold flex items-center gap-1.5 ${
                        isInterrupted ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {isInterrupted ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          Delivery Interrupted (0 FPS)
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {health.measuredFps > 0 ? `Active Delivery (${health.measuredFps} FPS)` : 'Receiving Frames...'}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border bg-background space-y-1">
                    <span className="text-muted-foreground">Audio-Visual Lip Sync</span>
                    <div
                      className={`font-semibold flex items-center gap-1.5 ${
                        health.audioConnected ? 'text-emerald-600' : 'text-muted-foreground'
                      }`}
                    >
                      {health.audioConnected ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Audio Stream Active
                        </>
                      ) : (
                        <>
                          <Info className="w-3.5 h-3.5" />
                          Audio Not Captured (Video Only)
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Interactive Challenge-Response */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Active Interactive Challenge-Response</CardTitle>
                <CardDescription className="text-xs">
                  Issue an unpredictable real-time physical challenge to verify participant liveness and uncover generative face-swap avatars without interrupting call audio.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { type: 'repeat_phrase' as ChallengeType, label: 'Spoken Code', icon: Radio },
                    { type: 'head_turn' as ChallengeType, label: 'Head Turn 45°', icon: RotateCw },
                    { type: 'hand_wave' as ChallengeType, label: 'Hand Across Face', icon: Eye },
                    { type: 'camera_movement' as ChallengeType, label: 'Perspective Tilt', icon: Camera },
                    { type: 'show_object' as ChallengeType, label: 'Rotate Object', icon: Layers },
                  ].map((item) => (
                    <Button
                      key={item.type}
                      variant="outline"
                      size="sm"
                      onClick={() => handleIssueChallenge(item.type)}
                      disabled={!isMonitoring || isInterrupted}
                      className="text-xs flex-col h-auto py-2.5 gap-1 hover:border-primary/50"
                    >
                      <item.icon className="w-4 h-4 text-primary" />
                      <span>{item.label}</span>
                    </Button>
                  ))}
                </div>

                {/* Challenge Prompt Active Card */}
                {challenge.status !== 'idle' && challenge.prompt && (
                  <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                        Active Challenge Prompt
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyPrompt(challenge.prompt || '')}
                        className="h-7 text-xs gap-1.5"
                      >
                        {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedPrompt ? 'Copied' : 'Copy Prompt'}
                      </Button>
                    </div>

                    <p className="text-sm font-mono bg-background/80 p-3 rounded-lg border border-border">
                      {challenge.prompt}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <p className="text-xs text-muted-foreground">{challenge.verificationMessage}</p>

                      {challenge.status === 'in_progress' && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleOperatorAttestation(true)}
                            className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Pass
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleOperatorAttestation(false)}
                            className="h-7 text-xs gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Flag Fail
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Audit Log */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Session Event Audit Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 font-mono text-[11px] max-h-36 overflow-y-auto bg-muted/20 p-3 rounded-lg border border-border">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2">
                      <span className="text-muted-foreground shrink-0">[{log.timestamp}]</span>
                      <span
                        className={
                          log.type === 'alert'
                            ? 'text-red-500 font-semibold'
                            : log.type === 'warning'
                            ? 'text-amber-500'
                            : log.type === 'success'
                            ? 'text-emerald-500'
                            : 'text-foreground/80'
                        }
                      >
                        {log.event}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
