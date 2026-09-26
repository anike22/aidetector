import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Shield,
  Zap,
  Activity,
  Layers,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface SceneMeta {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  title: string;
  subtitle: string;
  voiceoverText: string;
  onScreenText: string;
}

export const VIDEO_SCENES: SceneMeta[] = [
  {
    id: 'scene_1',
    name: '1. The Dilemma',
    startTime: 0.0,
    endTime: 5.0,
    title: 'AI-generated or human-written?',
    subtitle: 'An article. An essay. A claim. Before you decide what to trust, take a closer look.',
    voiceoverText: 'An article. An essay. A claim. Before you decide what to trust, take a closer look.',
    onScreenText: 'AI-generated or human-written?',
  },
  {
    id: 'scene_2',
    name: '2. Meet AIDetector.cx',
    startTime: 5.0,
    endTime: 10.0,
    title: 'Meet AIDetector.cx',
    subtitle: 'A unified platform for examining AI-generated content and reviewing the signals behind the results.',
    voiceoverText: 'Meet A-I Detector dot C-X. A unified platform for examining AI-generated content and reviewing the signals behind the results.',
    onScreenText: 'AIDetector.cx — Evidence-based Content Analysis',
  },
  {
    id: 'scene_3',
    name: '3. Deep Text Scan',
    startTime: 10.0,
    endTime: 28.0,
    title: 'Deep Evidence-Based Text Analysis',
    subtitle: 'Paste your text to start an instant analysis. Review the overall score, sentence highlights, and perplexity signals.',
    voiceoverText: 'Paste your text to start an instant analysis. Review the overall score, sentence highlights, and perplexity and burstiness signals. Focus on what the analysis explains.',
    onScreenText: 'Perplexity & Burstiness Signals with Sentence Breakdown',
  },
  {
    id: 'scene_4',
    name: '4. Sensitivity Modes',
    startTime: 28.0,
    endTime: 38.0,
    title: 'Balanced vs. Aggressive Sensitivity Modes',
    subtitle: 'Explore Balanced and Aggressive analysis modes. A detection score supports your judgment; it does not establish authorship.',
    voiceoverText: 'Explore Balanced and Aggressive analysis modes to see how their thresholds differ. A detection score supports your judgment; it does not establish authorship.',
    onScreenText: 'Balanced (50%) vs. Aggressive (30%) Sensitivity Modes',
  },
  {
    id: 'scene_5',
    name: '5. Multi-Modal Forensics',
    startTime: 38.0,
    endTime: 48.0,
    title: 'Plagiarism & Image Forensics',
    subtitle: 'Go beyond text with verified plagiarism search and deep image forensics. Review the evidence to understand where further verification is needed.',
    voiceoverText: 'Go beyond text with verified plagiarism search and deep image and video deepfake forensics. Review the evidence to understand where further verification is needed.',
    onScreenText: 'Multi-Modal Forensics: Text, Plagiarism, Image & Video',
  },
  {
    id: 'scene_6',
    name: '6. Informed Decisions',
    startTime: 48.0,
    endTime: 54.0,
    title: 'Review the Signals. Make an Informed Decision.',
    subtitle: 'For education, publishing, or editorial compliance, bring more context to your decisions.',
    voiceoverText: 'For education, publishing, or editorial compliance, bring more context to your decisions.',
    onScreenText: 'Review the signals. Make an informed decision.',
  },
  {
    id: 'scene_7',
    name: '7. Try AIDetector.cx',
    startTime: 54.0,
    endTime: 60.0,
    title: 'Before you trust it, check it.',
    subtitle: 'Check your content at AIDetector.cx. 5 Free introductory trial checks included.',
    voiceoverText: 'Before you trust it, check it. Check your content at A-I Detector dot C-X.',
    onScreenText: 'Check your content at AIDetector.cx',
  },
];

interface InteractiveVideoStageProps {
  aspectRatio?: '16:9' | '9:16' | '4:5';
  autoPlay?: boolean;
  cleanMode?: boolean;
  onNavigateToDetector?: () => void;
}

export function InteractiveVideoStage({
  aspectRatio = '16:9',
  autoPlay = false,
  cleanMode = false,
  onNavigateToDetector,
}: InteractiveVideoStageProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentAspect, setCurrentAspect] = useState<'16:9' | '9:16' | '4:5'>(aspectRatio);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const totalDuration = 60.0;

  // Find active scene
  const activeScene =
    VIDEO_SCENES.find(
      (s) => currentTime >= s.startTime && currentTime < s.endTime
    ) || VIDEO_SCENES[VIDEO_SCENES.length - 1];

  // Animation step
  const updateTime = useCallback(
    (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const delta = (timestamp - lastTimeRef.current) / 1000.0;
      lastTimeRef.current = timestamp;

      if (isPlaying) {
        setCurrentTime((prev) => {
          let nextTime = prev + delta;
          if (audioRef.current && !audioRef.current.paused && audioRef.current.currentTime > 0) {
            // Keep strictly synchronized with audio if audio is playing
            if (Math.abs(audioRef.current.currentTime - nextTime) > 0.3) {
              nextTime = audioRef.current.currentTime;
            }
          }

          if (nextTime >= totalDuration) {
            setIsPlaying(false);
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
            return 0;
          }
          return nextTime;
        });
      }

      requestRef.current = requestAnimationFrame(updateTime);
    },
    [isPlaying, totalDuration]
  );

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateTime);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [updateTime]);

  // Audio sync
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/promo/promo_audio_60s.wav');
      audioRef.current.preload = 'auto';
    }

    if (isPlaying) {
      audioRef.current.currentTime = currentTime;
      if (!isMuted) {
        audioRef.current.play().catch(() => {});
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      lastTimeRef.current = null;
    } else {
      if (currentTime >= totalDuration - 0.5) {
        setCurrentTime(0);
        if (audioRef.current) audioRef.current.currentTime = 0;
      }
      lastTimeRef.current = performance.now();
      setIsPlaying(true);
    }
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleJumpToScene = (scene: SceneMeta) => {
    setCurrentTime(scene.startTime);
    if (audioRef.current) {
      audioRef.current.currentTime = scene.startTime;
    }
    if (!isPlaying) {
      lastTimeRef.current = performance.now();
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    lastTimeRef.current = performance.now();
    setIsPlaying(true);
  };

  const formatTimecode = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Calculations for current scene animations
  const sceneProgress = (currentTime - activeScene.startTime) / (activeScene.endTime - activeScene.startTime);
  const scoreCounter = Math.min(87, Math.round(sceneProgress * 120));

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden bg-slate-950 text-slate-100 border border-indigo-900/50 shadow-2xl flex flex-col select-none transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* Aspect Ratio & Format Controls Bar (Hidden in cleanMode) */}
      {!cleanMode && (
        <div className="px-3 sm:px-4 py-2 bg-slate-900/90 border-b border-indigo-950 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-indigo-200 tracking-wide">AIDetector.cx Walkthrough</span>
            <Badge variant="outline" className="hidden sm:inline-flex text-[10px] bg-indigo-950/80 text-indigo-300 border-indigo-800">
              Synchronized Narration
            </Badge>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-[11px] mr-1 hidden sm:inline">Format:</span>
            <button
              onClick={() => setCurrentAspect('16:9')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                currentAspect === '16:9' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              16:9 Landscape
            </button>
            <button
              onClick={() => setCurrentAspect('9:16')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                currentAspect === '9:16' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              9:16 Vertical
            </button>
            <button
              onClick={() => setCurrentAspect('4:5')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                currentAspect === '4:5' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              4:5 Feed
            </button>
          </div>
        </div>
      )}

      {/* Main Video Screen Container */}
      <div
        onClick={togglePlay}
        className={`relative w-full cursor-pointer bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/90 flex items-center justify-center overflow-hidden transition-all duration-300 ${
          currentAspect === '9:16'
            ? 'aspect-[9/16] max-h-[620px] max-w-[350px] mx-auto'
            : currentAspect === '4:5'
            ? 'aspect-[4/5] max-h-[580px] max-w-[460px] mx-auto'
            : 'aspect-video min-h-[300px] sm:min-h-[420px]'
        }`}
      >
        {/* Animated Particle & Glow Background */}
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-600/30 rounded-full blur-3xl" />
        </div>

        {/* Top Watermark / Brand Header inside video */}
        <div className="absolute top-3 sm:top-5 inset-x-3 sm:inset-x-6 flex items-center justify-between pointer-events-none z-20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              ✦
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white drop-shadow">
                AIDetector.cx
              </span>
              <span className="text-[10px] sm:text-xs text-indigo-300 ml-2 hidden sm:inline opacity-90">
                Evidence-Based Content Forensics
              </span>
            </div>
          </div>
          <Badge className="bg-indigo-900/80 text-indigo-200 border-indigo-700/60 text-[10px] sm:text-xs">
            {activeScene.name}
          </Badge>
        </div>

        {/* SCENE 1 (0-6s): The Dilemma */}
        {activeScene.id === 'scene_1' && (
          <div className="relative z-10 w-full max-w-2xl px-4 text-center animate-in fade-in duration-300">
            <Badge variant="outline" className="mb-2.5 bg-indigo-950/80 text-indigo-300 border-indigo-700 text-xs px-3 py-1">
              CONTENT INTEGRITY IN THE AI ERA
            </Badge>
            <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug mb-2 text-balance">
              AI-generated? Human-written? Manipulated?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mb-6 max-w-lg mx-auto">
              Before you decide what to trust, take a closer look.
            </p>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 max-w-lg mx-auto text-left">
              <div className="p-3 sm:p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg transform transition-transform hover:scale-105">
                <FileText className="w-5 h-5 text-indigo-400 mb-2" />
                <div className="text-xs sm:text-sm font-bold text-white">Article</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Perplexity & syntax</div>
                <div className="mt-2 text-[10px] font-semibold text-amber-400">Reviewing signals</div>
              </div>

              <div className="p-3 sm:p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg transform transition-transform hover:scale-105">
                <ImageIcon className="w-5 h-5 text-purple-400 mb-2" />
                <div className="text-xs sm:text-sm font-bold text-white">Image</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Diffusion frequency</div>
                <div className="mt-2 text-[10px] font-semibold text-purple-300">Sub-pixel artifacts</div>
              </div>

              <div className="p-3 sm:p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg transform transition-transform hover:scale-105">
                <VideoIcon className="w-5 h-5 text-pink-400 mb-2" />
                <div className="text-xs sm:text-sm font-bold text-white">Video</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Live deepfake ROI</div>
                <div className="mt-2 text-[10px] font-semibold text-rose-400">Temporal stability</div>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 2 (5-10s): Meet AIDetector.cx */}
        {activeScene.id === 'scene_2' && (
          <div className="relative z-10 w-full max-w-2xl px-4 text-center animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-black mx-auto mb-3 shadow-xl">
              ✦
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
              Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-300">AIDetector.cx</span>
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 mb-6 max-w-lg mx-auto">
              A unified platform for examining AI-generated content and reviewing the signals behind the results.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-xl mx-auto text-left">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-indigo-900/60">
                <div className="text-xs font-bold text-indigo-400 mb-1">Multi-Model Analysis</div>
                <div className="text-xs font-semibold text-white">Perplexity & Syntax</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Evaluates statistical predictability across sentences.</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-indigo-900/60">
                <div className="text-xs font-bold text-emerald-400 mb-1">Dual Sensitivity</div>
                <div className="text-xs font-semibold text-white">Balanced & Aggressive</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Adaptable decision boundaries for various use cases.</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-indigo-900/60">
                <div className="text-xs font-bold text-purple-400 mb-1">Explainable Signals</div>
                <div className="text-xs font-semibold text-white">Transparent Evidence</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Highlights specific phrases alongside forensic signals.</div>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 3 (14.5-26.5s): Deep Text Scan */}
        {activeScene.id === 'scene_3' && (
          <div className="relative z-10 w-full max-w-2xl px-4 animate-in fade-in duration-300">
            <div className="bg-slate-900/95 border border-indigo-800/80 rounded-2xl p-4 sm:p-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                {/* Radial Gauge */}
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="10" fill="none" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#ef4444"
                      strokeWidth="10"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * scoreCounter) / 100}
                      strokeLinecap="round"
                      fill="none"
                      className="transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl sm:text-3xl font-extrabold text-white">{scoreCounter}%</span>
                    <span className="text-[10px] font-semibold text-red-300 uppercase">AI Score</span>
                  </div>
                </div>

                {/* Scan Highlight Details */}
                <div className="flex-1 space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Highlighted Signal Evidence</span>
                    <Badge variant="destructive" className="text-[10px]">High Probability</Badge>
                  </div>
                  <div className="p-2 rounded bg-red-950/60 border border-red-800/60 text-[11px] sm:text-xs text-red-200">
                    “The synthesized parameters exhibit uniform perplexity and repetitive syntax...”
                  </div>
                  <div className="p-2 rounded bg-emerald-950/60 border border-emerald-800/60 text-[11px] sm:text-xs text-emerald-200">
                    “I conducted three separate experiments in our laboratory last June...”
                  </div>

                  {/* Forensic Bar */}
                  <div className="pt-1 grid grid-cols-2 gap-2 text-[10px]">
                    <div className="text-slate-300">
                      Perplexity: <span className="font-bold text-red-400">14.2 (Low)</span>
                    </div>
                    <div className="text-slate-300">
                      Burstiness: <span className="font-bold text-amber-400">0.18 (Uniform)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 4 (26.5-37.0s): Sensitivity Modes */}
        {activeScene.id === 'scene_4' && (
          <div className="relative z-10 w-full max-w-2xl px-4 animate-in fade-in duration-300 text-center">
            <h3 className="text-lg sm:text-2xl font-bold text-white mb-1">
              Balanced vs. Aggressive Analysis Modes
            </h3>
            <p className="text-xs text-amber-300 font-medium mb-4">
              A detection result supports your judgment; it does not establish authorship.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="p-3.5 rounded-xl bg-slate-900/90 border-2 border-indigo-600 shadow-md">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs sm:text-sm font-bold text-white">Balanced Mode</span>
                  <Badge className="bg-emerald-600 text-[10px]">Recommended</Badge>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1">
                  <div>• Standard 50% Bayesian decision threshold</div>
                  <div>• Conservative calibration to protect authentic human writing</div>
                  <div>• Best for academic essays, research & publishing</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-600/80 shadow-md">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs sm:text-sm font-bold text-white">Aggressive Mode</span>
                  <Badge className="bg-amber-600 text-[10px]">High-Sensitivity</Badge>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1">
                  <div>• Sensitive 30% threshold for short snippets</div>
                  <div>• Detects lightly paraphrased AI text</div>
                  <div>• Best for compliance & SEO triage</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 5 (37-48s): Multi-Modal Suite */}
        {activeScene.id === 'scene_5' && (
          <div className="relative z-10 w-full max-w-2xl px-4 animate-in fade-in duration-300">
            <div className="text-center mb-3">
              <h3 className="text-lg sm:text-2xl font-bold text-white">
                Multi-Modal Content Intelligence
              </h3>
              <p className="text-xs text-slate-300">
                Text, plagiarism, image forensics & video deepfake detection
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-indigo-900/70">
                <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs mb-1">
                  <FileText className="w-3.5 h-3.5" /> Plagiarism Checker
                </div>
                <div className="text-xs font-semibold text-white">96% Original</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Cross-referenced against open academic repositories.</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-purple-900/70">
                <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs mb-1">
                  <ImageIcon className="w-3.5 h-3.5" /> Image Forensics
                </div>
                <div className="text-xs font-semibold text-white">Frequency Heatmap</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Latent diffusion artifact & sub-pixel noise analysis.</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-pink-900/70">
                <div className="flex items-center gap-1.5 text-pink-400 font-bold text-xs mb-1">
                  <VideoIcon className="w-3.5 h-3.5" /> Video Deepfakes
                </div>
                <div className="text-xs font-semibold text-white">2×2 Grid ROI</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Live meeting & stream participant protection.</div>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 6 (48-54s): Informed Decisions */}
        {activeScene.id === 'scene_6' && (
          <div className="relative z-10 w-full max-w-2xl px-4 text-center animate-in fade-in duration-300">
            <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 mb-2">
              CONTEXT-AWARE VERIFICATION
            </Badge>
            <h2 className="text-xl sm:text-3xl font-extrabold text-white mb-2">
              Review the signals. Make an informed decision.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mb-5 max-w-md mx-auto">
              For study, publishing, or everyday content review, bring more context to your decisions.
            </p>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-lg mx-auto text-left text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="font-bold text-white">🎓 Education</span>
                <p className="text-[10px] text-slate-400 mt-1">Academic integrity & transparent citations.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="font-bold text-white">📰 Publishing</span>
                <p className="text-[10px] text-slate-400 mt-1">Editorial screening & freelance validation.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="font-bold text-white">💼 Compliance</span>
                <p className="text-[10px] text-slate-400 mt-1">Contract safety & deepfake triage.</p>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 7 (54-60s): Call to Action */}
        {activeScene.id === 'scene_7' && (
          <div className="relative z-10 w-full max-w-md px-4 text-center animate-in zoom-in-95 duration-300">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-black mx-auto mb-3 shadow-xl ring-4 ring-indigo-400/30">
              ✦
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-1">
              AIDetector.cx
            </h2>
            <p className="text-sm sm:text-base font-bold text-indigo-300 italic mb-4">
              “Before you trust it, check it.”
            </p>

            <Button
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigateToDetector) {
                  onNavigateToDetector();
                } else {
                  navigate('/detector');
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg gap-2 text-sm sm:text-base"
            >
              Explore AIDetector.cx <ArrowRight className="w-4 h-4" />
            </Button>
            <div className="text-[11px] text-slate-400 mt-3">
              5 Free Trial Checks Included • No Credit Card Required
            </div>
          </div>
        )}

        {/* Big Center Play Overlay Button if paused */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-30 pointer-events-none">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-2xl ring-4 ring-white/20 transform transition-transform hover:scale-110">
              <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
            </div>
          </div>
        )}

        {/* Subtitle / Voiceover Banner */}
        {showCaptions && (
          <div className="absolute bottom-4 inset-x-4 sm:inset-x-12 z-20 pointer-events-none text-center">
            <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-slate-950/90 border border-indigo-500/40 backdrop-blur-md shadow-lg max-w-xl">
              <p className="text-xs sm:text-sm font-semibold text-white leading-snug drop-shadow">
                {activeScene.voiceoverText}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Scrub Bar & Player Controls */}
      <div className="p-3 sm:p-4 bg-slate-900 border-t border-indigo-950/80 space-y-2">
        {/* Timeline Slider */}
        <div className="relative w-full flex items-center group">
          <input
            type="range"
            min={0}
            max={totalDuration}
            step={0.1}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        {/* Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={togglePlay}
              className="h-8 text-xs font-semibold gap-1.5"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRestart}
              className="h-8 text-xs text-slate-400 hover:text-white px-2"
              title="Restart video"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
              className="h-8 text-xs text-slate-400 hover:text-white px-2"
              title={isMuted ? 'Unmute narration' : 'Mute narration'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </Button>

            <span className="text-xs font-mono text-slate-400 ml-1">
              {formatTimecode(currentTime)} / {formatTimecode(totalDuration)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCaptions(!showCaptions)}
              className={`h-8 text-xs px-2.5 font-medium ${
                showCaptions ? 'text-indigo-400 bg-indigo-950/60' : 'text-slate-400 hover:text-white'
              }`}
            >
              CC {showCaptions ? 'On' : 'Off'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 text-xs text-slate-400 hover:text-white px-2"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>

            {!cleanMode && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 text-xs text-slate-400 hover:text-white px-2 gap-1"
              >
                <a href="/promo/aidetector-promo-main-60s-captioned.mp4" download>
                  <Download className="w-3.5 h-3.5" /> MP4
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Scene Jump Chips (Hidden in cleanMode) */}
        {!cleanMode && (
          <div className="pt-2 flex flex-wrap gap-1.5 overflow-x-auto pb-1">
            {VIDEO_SCENES.map((scene) => {
              const isCurrent = activeScene.id === scene.id;
              return (
                <button
                  key={scene.id}
                  onClick={() => handleJumpToScene(scene)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 shrink-0 ${
                    isCurrent
                      ? 'bg-indigo-600 text-white font-bold shadow-sm'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {scene.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
