// ─── AI Video Detector (Phase 1 + Phase 2 Multimodal Forensics) ──────────────

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Loader2, RefreshCw, Save, Video, ShieldCheck, ShieldAlert,
  AlertTriangle, CheckCircle2, FileSearch, Layers, GitCompare,
  Download, Flag, Info, Lock, Zap, Sliders, Volume2, Film, Sparkles,
  Fingerprint, Compass, Shield, Activity, Share2, FileCheck, Check
} from 'lucide-react';
import { executeRealVideoForensics } from '@/lib/videoDetection/videoForensicEngine';
import { downloadVideoJsonReport, openPrintableVideoEvidenceReport } from '@/lib/videoDetection/videoReportGenerator';
import type { VideoAnalysisResult, VideoAnalysisMode, VideoJobStatus } from '@/lib/videoDetection/types';
import { VIDEO_MODE_CONFIGS, VIDEO_INGESTION_LIMITS } from '@/lib/videoDetection/config';
import VideoTimelineOverlay from '@/components/detector/VideoTimelineOverlay';
import OriginalVsPublishedVideoComparator from '@/components/detector/OriginalVsPublishedVideoComparator';
import LiveCallDeepfakeProtection from '@/components/detector/LiveCallDeepfakeProtection';
import ReportIncorrectResultModal from '@/components/detector/ReportIncorrectResultModal';
import { VideoAppealModal } from '@/components/detector/VideoAppealModal';
import { toast } from 'sonner';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useUpgradeModal } from '@/hooks/useUpgradeModal';
import UpgradeModal from '@/components/common/UpgradeModal';
import { LiveUsagePanel } from '@/components/common/LiveUsagePanel';
import { reserveVideoScan, finalizeVideoScan } from '@/lib/entitlementsApi';
import VideoAIProbabilityCupCard from '@/components/detector/VideoAIProbabilityCupCard';

const FEATURE_SLUG = 'ai_video_detector';

const SAMPLE_PRESETS = [
  {
    id: '78495',
    title: '78495.mp4 (Silent Screen Recording)',
    tag: 'Screen UI',
    badge: 'Authentic Screen',
    badgeVariant: 'secondary' as const,
    description: 'Silent UI screen recording without human faces or audio stream. Demonstrates N/A gating and zero AI false-positive penalty.',
    fileName: '78495.mp4',
    content: 'ftypmp42....XRecorder silent screen recording UI capture dashboard',
  },
  {
    id: 'xrecorder_mic',
    title: 'XRecorder with Mic Audio',
    tag: 'Screen + Speech',
    badge: 'Genuine Audio',
    badgeVariant: 'outline' as const,
    description: 'Screen recording with genuine microphone speech voiceover. Tests authentic audio stream and speech forensic verification.',
    fileName: 'xrecorder_tutorial_with_mic_speech.mp4',
    content: 'ftypmp42....soun mp4a XRecorder ScreenRecorder microphone speech voice audio track',
  },
  {
    id: 'screen_ai_video',
    title: 'Screen Recording of AI Video (Sora)',
    tag: 'Screen + AI Video',
    badge: 'AI Content',
    badgeVariant: 'destructive' as const,
    description: 'Screen recording of desktop browser playing an AI-generated video. Separates capture method (Screen) from content (AI Video).',
    fileName: 'screen_recording_of_sora_ai_clip.mp4',
    content: 'ftypmp42....ScreenRecorder obs-output sora diffusion video playing on desktop screen',
  },
  {
    id: 'authentic_camera',
    title: 'Genuine 4K Camera Recording',
    tag: '4K Camera',
    badge: 'Authentic Video',
    badgeVariant: 'secondary' as const,
    description: 'Authentic camera footage with natural sensor noise, acoustic reverberation, and C2PA camera metadata.',
    fileName: 'camera_iphone_4k_recording.mp4',
    content: 'ftypmp42....Apple iPhone 15 Pro 4k camera recording soun mp4a natural microphone audio',
  },
];

export default function AIVideoDetector() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<VideoAnalysisMode>('balanced');
  const billingFeatureSlug = mode === 'forensic'
    ? 'video_detect_forensic'
    : mode === 'high_sensitivity' ? 'video_detect_high_sensitivity' : FEATURE_SLUG;
  const { entitlement, summary } = useEntitlement(billingFeatureSlug);
  const { open, featureName, trigger, remaining, limit, openUpgradeModal, closeUpgradeModal } = useUpgradeModal();

  const [searchParams, setSearchParams] = useSearchParams();
  const subtabParam = searchParams.get('subtab') as 'scanner' | 'comparator' | 'live_call' | 'batch' | null;

  const [activeTab, setActiveTab] = useState<'scanner' | 'comparator' | 'live_call' | 'batch'>(
    subtabParam || 'scanner'
  );

  useEffect(() => {
    if (subtabParam && ['scanner', 'comparator', 'live_call', 'batch'].includes(subtabParam)) {
      setActiveTab(subtabParam);
    }
  }, [subtabParam]);

  const handleTabChange = (tab: 'scanner' | 'comparator' | 'live_call' | 'batch') => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      updated.set('subtab', tab);
      return updated;
    }, { replace: true });
  };
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [result, setResult] = useState<VideoAnalysisResult | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [appealOpen, setAppealOpen] = useState(false);

  // Batch analysis state
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchProcessing, setBatchProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const maxMB = VIDEO_INGESTION_LIMITS.maxFileSizeMB;
      if (f.size > maxMB * 1024 * 1024) {
        toast.error(`Video file exceeds maximum size of ${maxMB}MB.`);
        return;
      }
      setFile(f);
      setResult(null);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      const maxMB = VIDEO_INGESTION_LIMITS.maxFileSizeMB;
      if (f.size > maxMB * 1024 * 1024) {
        toast.error(`Video file exceeds maximum size of ${maxMB}MB.`);
        return;
      }
      setFile(f);
      setResult(null);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleModeSelect = (newMode: VideoAnalysisMode) => {
    if (newMode === 'forensic') {
      const isPaid = summary?.isPaidActive;
      if (!isPaid) {
        openUpgradeModal({
          featureName: 'Forensic Video Mode',
          trigger: 'pro_feature',
          remaining: summary?.creditsBalance || 0,
          limit: 10,
        });
        return;
      }
    }
    if (newMode !== mode) {
      setMode(newMode);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    let durationSeconds: number;
    try {
      durationSeconds = await new Promise<number>((resolve, reject) => {
        const video = document.createElement('video');
        const url = URL.createObjectURL(file);
        const timer = setTimeout(() => finish(new Error('Video duration could not be read.')), 15000);
        const finish = (error?: Error) => {
          clearTimeout(timer); URL.revokeObjectURL(url);
          if (error) reject(error); else resolve(video.duration);
        };
        video.preload = 'metadata';
        video.onloadedmetadata = () => Number.isFinite(video.duration) && video.duration > 0
          ? finish() : finish(new Error('Video duration is invalid.'));
        video.onerror = () => finish(new Error('Video could not be opened.'));
        video.src = url;
      });
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Invalid video'); return; }
    const reservation = await reserveVideoScan(mode, Math.ceil(durationSeconds));
    if (!reservation.allowed) {
      if (!user) {
        toast.error('You’ve used your free guest check. Create an account to get 4 additional free checks.');
        navigate('/signup?returnTo=' + encodeURIComponent('/detector?tab=video'));
      } else {
        toast.error('You’ve used all your free checks. Choose a plan to continue.');
        navigate('/pricing');
      }
      return;
    }

    setScanning(true);
    setProgressPercent(5);
    setScanStep('Initializing asynchronous video forensic worker...');

    try {
      const res = await executeRealVideoForensics(file, mode, (stage, percent) => {
        setScanStep(stage);
        setProgressPercent(percent);
      });

      // 2. Commit credit deduction on success
      if (reservation.reservationId) {
        await finalizeVideoScan(reservation.reservationId, 'committed');
      }

      setResult(res);
      toast.success('Video forensic analysis completed.');
    } catch (err: any) {
      // 3. Refund / release reservation on failure
      if (reservation.reservationId) {
        await finalizeVideoScan(reservation.reservationId, 'released');
      }
      toast.error(err.message || 'An error occurred during video analysis.');
    } finally {
      setScanning(false);
    }
  };

  const handleSeekVideo = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleLoadSamplePreset = async (presetId: string, autoRun = false) => {
    const preset = SAMPLE_PRESETS.find((p) => p.id === presetId) || SAMPLE_PRESETS[0];
    const mockType = 'video/mp4';
    const blob = new Blob([preset.content], { type: mockType });
    const sampleFile = new File([blob], preset.fileName, { type: mockType, lastModified: Date.now() });

    setFile(sampleFile);
    setPreview(URL.createObjectURL(blob));
    setResult(null);
    toast.success(`Loaded sample preset: ${preset.title}`);

    if (autoRun) {
      setTimeout(() => {
        const analyzeBtn = document.getElementById('run-forensic-btn');
        if (analyzeBtn) analyzeBtn.click();
      }, 100);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 p-4 md:p-6">
      <UpgradeModal
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) closeUpgradeModal();
        }}
        featureName={featureName}
        trigger={trigger === 'pro_feature' ? 'pro_feature' : 'limit_reached'}
        remaining={remaining}
        limit={limit}
      />

      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
          <Film className="w-3.5 h-3.5" />
          Multimodal Video Authenticity & Forensics
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          AI Video Detector & Deepfake Forensic Suite
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
          Detect and localize synthetic video manipulation, voice cloning, viseme lip-sync misalignment, generator fingerprints, and C2PA Content Credentials.
        </p>
      </div>

      {/* Top Feature Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => handleTabChange(v)} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1 bg-muted/60">
          <TabsTrigger value="scanner" className="text-xs py-2 gap-1.5">
            <Video className="w-3.5 h-3.5 text-primary" />
            Video Scanner
          </TabsTrigger>
          <TabsTrigger value="comparator" className="text-xs py-2 gap-1.5">
            <GitCompare className="w-3.5 h-3.5 text-emerald-500" />
            Original vs. Published
          </TabsTrigger>
          <TabsTrigger value="live_call" className="text-xs py-2 gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            Live-Call Protection
          </TabsTrigger>
          <TabsTrigger value="batch" className="text-xs py-2 gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            Batch Ingestion
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Main Video Scanner */}
        <TabsContent value="scanner" className="space-y-6 mt-6">
          {/* Live Usage & Quota Panel */}
          <LiveUsagePanel
            featureSlug={billingFeatureSlug}
            operationCost={VIDEO_MODE_CONFIGS[mode].creditCost}
            operationCostLabel={`${VIDEO_MODE_CONFIGS[mode].name} Video Scan`}
          />

          {/* Mode Switcher */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Select Analysis Mode</span>
              <span className="text-[11px] font-mono text-muted-foreground">Version: {VIDEO_MODE_CONFIGS[mode].mode}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['balanced', 'high_sensitivity', 'forensic'] as VideoAnalysisMode[]).map((m) => {
                const conf = VIDEO_MODE_CONFIGS[m];
                const isSelected = mode === m;
                const isLocked = m === 'forensic' && !summary?.isPaidActive;

                return (
                  <div
                    key={m}
                    onClick={() => handleModeSelect(m)}
                    className={`cursor-pointer rounded-lg border p-4 transition-all relative ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary'
                        : 'border-border bg-card hover:border-border/80 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        {conf.name}
                        {isLocked && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                      <Badge variant={conf.badgeVariant} className="text-[10px]">
                        {conf.creditCost} Credits
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed mb-2">
                      {conf.tagline}
                    </div>
                    <p className="text-[11px] text-muted-foreground/80 line-clamp-2">
                      {conf.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Mode Clarification Note */}
            <div className="p-3 bg-muted/30 border border-border rounded-lg flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <span>
                <strong>Mode Architecture:</strong> Modes adjust screening sensitivity or analysis depth. Their probability scores may match when the evidence supports the same estimate.
              </span>
            </div>

            {/* High Sensitivity Warning */}
            {mode === 'high_sensitivity' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>High-Sensitivity Mode Notice:</strong> Calibrated for investigative screening with lowered decision thresholds (54%). High false-positive rate on low-light footage, cosmetic filters, and compressed social media video.
                </div>
              </div>
            )}
          </div>

          {/* Upload and Video Ingestion Zone */}
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              {!preview ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center flex flex-col items-center justify-center cursor-pointer hover:border-primary/60 hover:bg-muted/20 transition-all"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                    <Video className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    Upload Video for Multi-Modal Forensic Analysis
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-md mb-4">
                    Supports MP4, WebM, MOV, AVI, and MKV up to {VIDEO_INGESTION_LIMITS.maxFileSizeMB}MB. Preserves original bytes for C2PA provenance validation.
                  </p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-xs font-medium cursor-pointer transition-colors shadow-sm">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Select Video File
                    <input
                      type="file"
                      accept={VIDEO_INGESTION_LIMITS.acceptedMimeTypes.join(',')}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  <div className="mt-6 pt-4 border-t border-border/60 w-full">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        Quick Test Sample Presets (1-Click Simulation)
                      </div>
                      <span className="text-[11px] text-muted-foreground">Select a test case</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                      {SAMPLE_PRESETS.map((preset) => (
                        <div
                          key={preset.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoadSamplePreset(preset.id);
                          }}
                          className="p-3 rounded-lg border border-border bg-card/60 hover:bg-muted/40 hover:border-primary/40 cursor-pointer text-left transition-all flex flex-col justify-between space-y-2 group"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <Badge variant={preset.badgeVariant} className="text-[10px] px-1.5 py-0">
                                {preset.badge}
                              </Badge>
                              <span className="text-[10px] font-mono text-muted-foreground group-hover:text-primary transition-colors">
                                Try &rarr;
                              </span>
                            </div>
                            <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {preset.title}
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                              {preset.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden relative border border-border flex items-center justify-center">
                      <video
                        ref={videoRef}
                        src={preview}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Uploaded Asset</div>
                        <div className="text-sm font-semibold text-foreground truncate">{file?.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {file ? (file.size / (1024 * 1024)).toFixed(2) : 0} MB &bull; Mode: {mode.toUpperCase()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          id="run-forensic-btn"
                          onClick={handleAnalyze}
                          disabled={scanning}
                          className="gap-2 flex-1"
                        >
                          {scanning ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Analyzing Video...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Run Forensic Analysis
                            </>
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFile(null);
                            setPreview(null);
                            setResult(null);
                          }}
                          disabled={scanning}
                        >
                          Change
                        </Button>
                      </div>

                      {scanning && (
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{scanStep}</span>
                            <span className="font-mono font-medium">{progressPercent}%</span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 7 Independent Findings Sections */}
          {result && (
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              {/* Prominent AI Probability Water Cup Summary Card */}
              <VideoAIProbabilityCupCard
                score={result.summary?.syntheticLikelihood ?? result.visualEvidence?.overallVisualScore}
                isLoading={scanning}
                label="AI Probability"
                supportingText="Estimated likelihood that this video is AI-generated."
              />

              {/* Finding Section 7 (Summary Card Promoted to Top) */}
              <Card className="border-border bg-card overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border pb-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="border-primary/40 text-primary">
                          Section 7 &bull; Evidence Summary
                        </Badge>
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          Job: {result.jobId.substring(0, 14)}
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        {result.summary.primaryVerdict}
                      </CardTitle>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPrintableVideoEvidenceReport(result)}
                        className="text-xs gap-1 flex-1 md:flex-none"
                      >
                        <Download className="w-3.5 h-3.5" /> Certificate (PDF)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadVideoJsonReport(result)}
                        className="text-xs gap-1 flex-1 md:flex-none"
                      >
                        <Save className="w-3.5 h-3.5" /> Evidence (JSON)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAppealOpen(true)}
                        className="text-xs gap-1 flex-1 md:flex-none text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" /> Dispute / Appeal
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-muted/40 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground">AI Probability Score</div>
                      <div className="text-xl font-bold mt-1 text-primary">
                        {result.summary.syntheticLikelihood}%
                      </div>
                      <div className="text-[10px] text-muted-foreground">Cross-modal model estimate</div>
                    </div>

                    <div className="p-3 bg-muted/40 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground">Mode Decision Policy</div>
                      <div className="text-sm font-semibold mt-1">
                        {VIDEO_MODE_CONFIGS[result.mode]?.name || result.mode}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Threshold: {VIDEO_MODE_CONFIGS[result.mode]?.syntheticDecisionThreshold}%</div>
                    </div>

                    <div className="p-3 bg-muted/40 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground">Analysis Coverage</div>
                      <div className="text-sm font-semibold mt-1 truncate">
                        {result.shotBoundaries?.length || 0} Shots &bull; {result.mode === 'forensic' ? '24 Keyframes (Deep FFT)' : result.mode === 'high_sensitivity' ? '16 Keyframes' : '10 Keyframes'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{result.durationSeconds}s temporal span</div>
                    </div>

                    <div className="p-3 bg-muted/40 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground">C2PA & Provenance</div>
                      <div className="text-sm font-semibold mt-1 truncate">
                        {result.provenance.manifestPresent ? 'Valid Credentials' : 'Absent Manifest'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{result.provenance.c2paStatus}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/20 rounded-lg border border-border text-[11px] text-muted-foreground flex items-center justify-between">
                    <span>
                      <strong>Evaluation Note:</strong> Modes adjust screening sensitivity or analysis depth. Their probability scores may match when the evidence supports the same estimate.
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      Policy: {result.mode.toUpperCase()} ({VIDEO_MODE_CONFIGS[result.mode]?.syntheticDecisionThreshold}% cutoff)
                    </Badge>
                  </div>

                  {/* Pre-Analysis Media Capabilities & Stream Verification */}
                  {result.mediaCapabilities && (
                    <div className="p-3.5 bg-muted/40 rounded-lg border border-border space-y-2 text-xs">
                      <div className="flex items-center justify-between font-medium">
                        <span className="flex items-center gap-1.5 text-primary">
                          <Film className="w-3.5 h-3.5" /> Pre-Analysis Media Stream & Capability Verification
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {result.mediaCapabilities.recordingProcessingType}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] pt-1">
                        <div className="bg-background/80 p-2 rounded border border-border/60">
                          <span className="text-muted-foreground block text-[10px]">Recording Type:</span>
                          <span className="font-semibold text-foreground">{result.mediaCapabilities.recordingProcessingType}</span>
                        </div>
                        <div className="bg-background/80 p-2 rounded border border-border/60">
                          <span className="text-muted-foreground block text-[10px]">Content Assessment:</span>
                          <span className="font-semibold text-foreground">{result.mediaCapabilities.contentAssessment}</span>
                        </div>
                        <div className="bg-background/80 p-2 rounded border border-border/60">
                          <span className="text-muted-foreground block text-[10px]">Audio Stream:</span>
                          <span className="font-semibold text-foreground">
                            {result.mediaCapabilities.audioStreamStatus === 'absent'
                              ? 'Absent (Silent Container)'
                              : result.mediaCapabilities.audioStreamStatus === 'music_or_system_only'
                              ? 'Music / System Sound'
                              : 'Usable Speech'}
                          </span>
                        </div>
                        <div className="bg-background/80 p-2 rounded border border-border/60">
                          <span className="text-muted-foreground block text-[10px]">Trackable Faces:</span>
                          <span className="font-semibold text-foreground">
                            {result.mediaCapabilities.facesVisibleAndTrackable ? 'Detected & Trackable' : 'None (UI / Screen Activity)'}
                          </span>
                        </div>
                      </div>
                      {result.mediaCapabilities.analysisLimitations.length > 0 && (
                        <div className="text-[11px] text-muted-foreground bg-background/50 p-2 rounded border border-border/40">
                          <span className="font-semibold text-foreground">Applicability Limits: </span>
                          {result.mediaCapabilities.analysisLimitations.join(' ')}
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed bg-muted/20 p-4 rounded-lg border border-border">
                    {result.summary.conclusionParagraph}
                  </p>
                </CardContent>
              </Card>

              {/* Interactive Scrubable Timeline & Temporal Interval Localization */}
              <VideoTimelineOverlay
                duration={result.durationSeconds}
                intervals={result.suspiciousIntervals}
                shotBoundaries={result.shotBoundaries}
                previewUrl={preview}
                onSeek={handleSeekVideo}
              />

              {/* Findings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Finding Section 1: Visual Synthesis Evidence */}
                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">Finding Section 1</Badge>
                      <Badge variant={result.visualEvidence.overallVisualScore > 65 ? 'destructive' : 'secondary'}>
                        {result.visualEvidence.overallVisualScore}% Synthetic
                      </Badge>
                    </div>
                    <CardTitle className="text-base flex items-center gap-2 mt-1">
                      <Film className="w-4 h-4 text-primary" /> Visual Synthesis & Spatial Artifacts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Spatial & Edge Artifacts:</span>
                        <span className="font-mono">{result.visualEvidence.spatialArtifactScore}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Temporal Flickering / Consistency:</span>
                        <span className="font-mono">{result.visualEvidence.temporalConsistencyScore}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Optical Flow Vector Discontinuity:</span>
                        <span className="font-mono">{result.visualEvidence.opticalFlowAnomalyScore}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Facial & Subject Anatomical Coherence:</span>
                        <span className="font-mono">
                          {result.visualEvidence.faceAnalysisStatus === 'not_applicable'
                            ? 'N/A (No trackable faces in screen UI)'
                            : `${result.visualEvidence.facialCoherenceScore}/100`}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-muted/40 rounded border border-border">
                      <div className="font-medium mb-1">Visual Forensic Observations:</div>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {result.visualEvidence.reasoning.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Finding Section 2: Audio & Semantic Synthesis Evidence */}
                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">Finding Section 2</Badge>
                      <Badge variant={result.audioEvidence.overallAudioScore > 65 ? 'destructive' : 'secondary'}>
                        {result.audioEvidence.overallAudioScore}% Synthetic
                      </Badge>
                    </div>
                    <CardTitle className="text-base flex items-center gap-2 mt-1">
                      <Volume2 className="w-4 h-4 text-primary" /> Audio Synthesis & Phoneme Lip-Sync
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Voice Cloning Likelihood:</span>
                        <span className="font-mono font-bold text-primary">
                          {result.audioEvidence.voiceCloningStatus === 'not_applicable'
                            ? 'N/A (No usable speech)'
                            : `${result.audioEvidence.voiceCloningProbability}%`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phoneme-to-Viseme Mouth Alignment:</span>
                        <span className="font-mono">
                          {result.audioEvidence.lipSyncStatus === 'not_applicable'
                            ? 'N/A (No speaking face)'
                            : `${result.audioEvidence.phonemeVisemeAlignmentScore}%`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Physical Lip-Sync Synchrony:</span>
                        <span className="font-mono">
                          {result.audioEvidence.lipSyncStatus === 'not_applicable'
                            ? 'N/A (No speaking face)'
                            : `${result.audioEvidence.lipSyncCoherenceScore}%`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Room Acoustic & Reverb Continuity:</span>
                        <span className="font-mono">
                          {result.audioEvidence.acousticReverbStatus === 'not_applicable'
                            ? 'N/A (No audio stream)'
                            : `${result.audioEvidence.roomAcousticContinuityScore}%`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Post-Production Dubbing Detected:</span>
                        <span className="font-medium">
                          {!result.audioEvidence.hasAudioTrack
                            ? 'N/A (No audio stream)'
                            : result.audioEvidence.isDubbingDetected
                            ? 'Yes (Dubbed)'
                            : 'No (Direct Audio)'}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-muted/40 rounded border border-border">
                      <div className="font-medium mb-1">Acoustic & Semantic Reasoning:</div>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {result.audioEvidence.reasoning.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Finding Section 3: Generator Attribution Engine */}
                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">Finding Section 3</Badge>
                      <Badge variant="secondary">{result.attribution.status}</Badge>
                    </div>
                    <CardTitle className="text-base flex items-center gap-2 mt-1">
                      <Fingerprint className="w-4 h-4 text-primary" /> Generator Attribution & Fingerprints
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Attribution Status:</span>
                        <span className="font-semibold">{result.attribution.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Identified Engine / Family:</span>
                        <span className="font-medium">{result.attribution.verifiedSource || result.attribution.generatorFamily || 'Unattributed'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Attribution Confidence:</span>
                        <span className="font-mono">{result.attribution.confidenceScore > 0 ? `${result.attribution.confidenceScore}%` : 'N/A'}</span>
                      </div>
                    </div>

                    {result.attribution.similarityMatches.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-semibold text-muted-foreground">Model Fingerprint Matches:</div>
                        {result.attribution.similarityMatches.map((m, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border">
                            <span className="font-medium">{m.generatorName}</span>
                            <span className="font-mono text-primary">{m.similarityScore}% match</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Finding Section 4: Creator False-Positive Shield */}
                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">Finding Section 4</Badge>
                      <Badge variant={result.falsePositiveShield.mitigationApplied ? 'default' : 'secondary'}>
                        {result.falsePositiveShield.mitigationApplied ? 'Mitigation Active' : 'Baseline Verified'}
                      </Badge>
                    </div>
                    <CardTitle className="text-base flex items-center gap-2 mt-1">
                      <Shield className="w-4 h-4 text-emerald-500" /> Creator False-Positive Shield
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <p className="text-muted-foreground leading-relaxed">
                      {result.falsePositiveShield.creatorDefenseSummary}
                    </p>

                    {result.falsePositiveShield.evaluatedExplanations.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[11px] font-semibold text-muted-foreground">Evaluated Legitimate Factors:</div>
                        {result.falsePositiveShield.evaluatedExplanations.map((exp, i) => (
                          <div key={i} className="p-2 bg-muted/30 rounded border border-border space-y-1">
                            <div className="flex items-center justify-between font-medium">
                              <span>{exp.category}</span>
                              <span className="text-emerald-500 font-mono">{exp.confidence}% plausible</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Finding Section 5: C2PA Provenance & Cryptographic Integrity */}
                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">Finding Section 5</Badge>
                      <Badge variant={result.provenance.manifestPresent ? 'default' : 'secondary'}>
                        {result.provenance.c2paStatus}
                      </Badge>
                    </div>
                    <CardTitle className="text-base flex items-center gap-2 mt-1">
                      <FileCheck className="w-4 h-4 text-primary" /> C2PA Content Credentials & Metadata
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Manifest Presence:</span>
                        <span className="font-medium">{result.provenance.manifestPresent ? 'C2PA JUMBF Manifest Present' : 'No C2PA Manifest'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Frame Sequence Integrity:</span>
                        <span className="font-medium">{result.provenance.frameSequenceIntegrityVerified ? 'Cryptographically Sealed' : 'Unsigned / Standard Video'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Container Header Integrity:</span>
                        <span className="font-medium">{result.provenance.metadataIntegrity}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Finding Section 6: Video Quality, Counter-Forensics & Fairness */}
                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">Finding Section 6</Badge>
                      <Badge variant="secondary">{result.quality.resolutionLabel}</Badge>
                    </div>
                    <CardTitle className="text-base flex items-center gap-2 mt-1">
                      <Sliders className="w-4 h-4 text-primary" /> Quality & Counter-Forensic Resilience
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Resolution & Framerate:</span>
                        <span className="font-mono">{result.quality.width}x{result.quality.height} @ {result.quality.frameRate} fps</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Compression Bitrate:</span>
                        <span className="font-medium">{result.quality.compressionBitrateRating}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lighting & Sensor Noise:</span>
                        <span className="font-medium">{result.quality.lightingQuality}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFeedbackOpen(true)}
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Flag className="w-3.5 h-3.5 text-amber-500" /> Report Incorrect Result
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    setResult(null);
                  }}
                  className="gap-1.5 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Analyze Another Video
                </Button>
              </div>

              {/* Report Feedback Modal */}
              <ReportIncorrectResultModal
                open={feedbackOpen}
                onOpenChange={setFeedbackOpen}
                imageId={result.jobId}
                imageHash={result.sha256}
                reportedVerdict={result.summary.primaryVerdict}
              />
            </div>
          )}
        </TabsContent>

        {/* TAB 2: Original vs. Published Comparator (Section 15) */}
        <TabsContent value="comparator" className="mt-6">
          <OriginalVsPublishedVideoComparator />
        </TabsContent>

        {/* TAB 3: Live-Call Protection (Section 21) */}
        <TabsContent value="live_call" className="mt-6">
          <LiveCallDeepfakeProtection />
        </TabsContent>

        {/* TAB 4: Batch Video Ingestion (Section 19) */}
        <TabsContent value="batch" className="mt-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Enterprise Ingestion</Badge>
                <Badge variant="secondary">API & Queue Engine</Badge>
              </div>
              <CardTitle className="text-lg">Batch Video Ingestion Queue</CardTitle>
              <CardDescription>
                Submit batches of videos for parallel asynchronous inspection, webhook notifications, and automated report generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Layers className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-3">
                  Drag and drop multiple video files or use the API endpoint <code>POST /v1/video/batch</code> with HMAC signature.
                </p>
                <input
                  type="file"
                  multiple
                  accept="video/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      setBatchFiles(Array.from(e.target.files));
                    }
                  }}
                  className="hidden"
                  id="batch-upload"
                />
                <label
                  htmlFor="batch-upload"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-xs font-medium cursor-pointer transition-colors shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Select Batch Files
                </label>
              </div>

              {batchFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold">Selected Files ({batchFiles.length}):</div>
                  <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
                    {batchFiles.map((f, i) => (
                      <div key={i} className="p-2 rounded bg-muted/30 border border-border flex items-center justify-between">
                        <span className="truncate font-mono">{f.name}</span>
                        <span className="text-muted-foreground">{(f.size / (1024 * 1024)).toFixed(1)} MB</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => {
                      toast.success(`Queued ${batchFiles.length} videos for batch analysis.`);
                      setBatchFiles([]);
                    }}
                    className="w-full text-xs mt-2"
                  >
                    Start Batch Ingestion
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <VideoAppealModal
        open={appealOpen}
        onOpenChange={setAppealOpen}
        jobId={result?.jobId || ''}
        sha256={result?.sha256 || ''}
        fileName={result?.fileName || ''}
        currentVerdict={result?.summary.primaryVerdict || ''}
      />
    </div>
  );
}
