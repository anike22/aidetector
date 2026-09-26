import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Video,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Zap,
  Sliders,
  Layers,
  Activity,
  FileCheck,
  Code2,
  Film,
  Eye,
  Camera,
  Scale,
  ArrowRight,
  Info,
  Sparkles,
  Fingerprint,
  Cpu,
  Volume2,
  Building2,
  UserCheck,
  GitCompare,
  ExternalLink,
  HelpCircle,
  Clock,
  Database,
  FileSpreadsheet,
  Check,
  Share2,
  BarChart3,
  BookmarkCheck,
  RefreshCw,
  FileText,
} from 'lucide-react';
import AIVideoDetector from '@/pages/detector/AIVideoDetector';

// ─── 25 Visible FAQs for AI Video Detector ─────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: 'What is an AI video detector?',
    a: 'An AI video detector is a specialized multi-modal software tool that evaluates spatial frames, temporal motion vectors, audio spectrograms, phoneme-viseme speech alignment, and container metadata to estimate whether a video was generated or manipulated with artificial intelligence.',
  },
  {
    q: 'How do AI video detectors work?',
    a: 'AI video detectors break videos into shot boundaries and keyframes, calculate optical flow vectors across sequential frames, inspect facial landmarks for temporal coherence, analyze audio frequencies for synthetic voice artifacts, and inspect C2PA Content Credentials to determine authenticity.',
  },
  {
    q: 'How can I check if a video is AI-generated?',
    a: 'Upload the highest-quality original video file directly to AIDetector.cx, choose your preferred analysis mode (Balanced, High-Sensitivity, or Forensic), allow the multi-modal pipeline to process, and review the timestamped findings and confidence metrics.',
  },
  {
    q: 'Is AIDetector.cx free to use?',
    a: 'Yes. AIDetector.cx offers a free allowance of video analysis credits every month for standard Balanced Mode inspections. Advanced batch ingestion and automated high-throughput API endpoints are available on premium tiers.',
  },
  {
    q: 'Can it detect deepfake videos?',
    a: 'Yes. The detector specializes in identifying deepfake face swaps, facial reenactment, and boundary blending artifacts around the hairline, jawline, and eyes where synthetic overlays meet original footage.',
  },
  {
    q: 'Can it detect AI-cloned voices?',
    a: 'Yes. The audio forensics module analyzes spectral harmonics, breathing acoustics, room reverberation consistency, and neural vocoder residuals to detect synthetic or cloned voices.',
  },
  {
    q: 'Can it detect lip-sync manipulation?',
    a: 'Yes. The phoneme-viseme synchronization engine compares acoustic speech sounds with visual mouth movements, flagging unnatural delays, shape misalignments, or blurred lip boundaries characteristic of AI dubbing tools like Wav2Lip.',
  },
  {
    q: 'Can it detect Sora videos?',
    a: 'Yes. The engine detects diffusion motion inconsistencies, temporal object morphing, and synthetic noise distributions characteristic of OpenAI Sora and Sora 2 models.',
  },
  {
    q: 'Can it detect Google Veo videos?',
    a: 'Yes. The detector analyzes spatial physics coherence, lighting evolution, and high-frequency video diffusion artifacts produced by Google Veo video generation architectures.',
  },
  {
    q: 'Can it detect Kling or Runway videos?',
    a: 'Yes. Kling AI (1.0, 1.5, 2.0) and Runway Gen-2/Gen-3 Alpha produce distinct temporal flow vectors, frame interpolation signatures, and boundary edge artifacts that our model accurately flags.',
  },
  {
    q: 'Can I analyze a YouTube video?',
    a: 'You can analyze YouTube videos by providing a direct video URL or uploading downloaded source files. Note that YouTube re-encoding may reduce high-frequency forensic evidence compared to master camera exports.',
  },
  {
    q: 'Can I check a TikTok or Instagram video?',
    a: 'Yes. You can upload downloaded TikTok or Instagram clips. The engine incorporates quantization compensation algorithms to distinguish platform compression artifacts from genuine generative manipulation.',
  },
  {
    q: 'Does WhatsApp compression affect detection?',
    a: 'Yes. Aggressive spatial downscaling (720p/480p) and low-bitrate H.264 re-encoding strip subtle sensor noise and high-frequency textures. When degradation is severe, AIDetector.cx automatically widens uncertainty bounds.',
  },
  {
    q: 'Are AI video detectors accurate?',
    a: 'Accuracy varies based on video resolution, duration, compression level, and whether audio is present. On our curated 850-video multi-modal evaluation benchmark, AIDetector.cx achieved 93.4% precision and a 3.8% false-positive rate in Balanced Mode.',
  },
  {
    q: 'Can AI video detectors be bypassed?',
    a: 'Individual signals can be weakened through heavy recompression, motion blur, cropping, or screen-recording. AIDetector.cx mitigates this by fusing visual, temporal, audio, acoustic, and metadata signals into a unified consensus.',
  },
  {
    q: 'What does an inconclusive result mean?',
    a: 'An inconclusive verdict indicates that available forensic signals conflict, or that video quality, heavy compression, or extreme low light prevents a reliable distinction between genuine and synthetic content.',
  },
  {
    q: 'Can it identify the generator?',
    a: 'When known architectural fingerprints or C2PA metadata manifests are present, the engine suggests probable generator attribution (e.g., Kling, Sora, Runway, HeyGen). However, generic diffusion models may return unknown synthetic process.',
  },
  {
    q: 'Does missing metadata mean a video is fake?',
    a: 'No. Most social media platforms, messaging apps, and content management systems automatically strip EXIF and container metadata during upload. Missing metadata is never treated as proof of AI generation.',
  },
  {
    q: 'Can it detect partially manipulated videos?',
    a: 'Yes. The interactive timeline highlights exact intervals where localized edits occurred (e.g., an authentic speech with a 4-second deepfake face swap or spliced audio statement).',
  },
  {
    q: 'Does it analyze audio and video separately?',
    a: 'Yes. Visual frames and audio tracks undergo independent forensic decomposition before cross-modal phoneme-viseme correlation and multi-modal evidence synthesis.',
  },
  {
    q: 'Can it monitor a live video call?',
    a: 'The browser-based Live-Call Protection module is currently being validated for permitted local camera/microphone inputs and WebRTC screen-shares. It does not automatically intercept external proprietary desktop calling apps without permissions.',
  },
  {
    q: 'Is there an AI video detection API?',
    a: 'Yes. AIDetector.cx provides a REST API supporting asynchronous video job submission, presigned URLs, webhook notifications, and JSON forensic reports. Explore documentation at /api-platform.',
  },
  {
    q: 'Are uploaded videos stored?',
    a: 'Uploaded video frames are processed in temporary volatile memory and automatically purged after analysis. We do not permanently store customer videos or use them to train generative models.',
  },
  {
    q: 'Can a detector prove that a video is authentic?',
    a: 'A detector provides probabilistic evidence indicating an absence of synthetic anomalies and the presence of natural camera sensor physics, but absolute legal proof requires an unbroken C2PA provenance chain.',
  },
  {
    q: 'What is the difference between an AI video and a deepfake?',
    a: 'An AI video is synthesized entirely from text or image prompts using diffusion models, whereas a deepfake typically modifies specific elements (such as swapping a face or altering speech) of an otherwise real video.',
  },
];

// ─── 12 Controlled, Licensed Empirical Benchmark Examples ──────────────────────
const CONTROLLED_EXAMPLES = [
  {
    title: 'Authentic Master Camera Recording',
    source: 'Sony FX3 Cinema Camera (ProRes 422 HQ, 4K 24fps)',
    expectedVerdict: 'Authenticity Supported',
    transformation: 'Direct camera sensor export; no transcoding or post-filters applied.',
    evidenceDetected: 'Natural optical sensor PRNU noise, coherent optical flow vectors, valid EXIF lens metadata, intact room acoustics.',
    limitations: 'Studio lighting may produce clean skin textures that simulate diffusion smoothing.',
    version: 'v2.4',
  },
  {
    title: 'Fully Synthetic Video Scene',
    source: 'OpenAI Sora (Text-to-Video, 1080p 30fps)',
    expectedVerdict: 'Fully AI-Generated Video',
    transformation: 'Direct MP4 export from generative diffusion pipeline.',
    evidenceDetected: 'Temporal physics discontinuities, micro-texture swimming across water reflection, absent camera sensor noise.',
    limitations: 'Static architectural shots without moving water or foliage require longer temporal analysis.',
    version: 'v2.4',
  },
  {
    title: 'High-Resolution Diffusion Scene',
    source: 'Google Veo (1080p, 60fps)',
    expectedVerdict: 'Fully AI-Generated Video',
    transformation: 'Native generative video container with synthetic audio track.',
    evidenceDetected: 'Unstable background object permanence during camera pan, harmonic spectral voice synthesis signatures.',
    limitations: 'Requires >2 seconds duration for motion trajectory stability modeling.',
    version: 'v2.4',
  },
  {
    title: 'Targeted Deepfake Face Swap',
    source: 'SimSwap over 1080p broadcast interview',
    expectedVerdict: 'Deepfake Face Swap Detected',
    transformation: 'Face region replaced and blended into original source frame video.',
    evidenceDetected: 'Boundary edge blending discontinuity along jawline, mismatched skin color tone delta, divergent corneal glints.',
    limitations: 'High-contrast direct frontal lighting can mask blending seams in low-resolution video.',
    version: 'v2.4',
  },
  {
    title: 'AI Dubbing & Lip-Sync Manipulation',
    source: 'Wav2Lip re-animated speech over 4K documentary',
    expectedVerdict: 'AI Lip-Sync Manipulation',
    transformation: 'Mouth region warped to align with alternate multilingual audio track.',
    evidenceDetected: 'Phoneme-viseme temporal offset (>85ms delay), blurred mouth boundary relative to static upper face.',
    limitations: 'Subtle re-voicing with minimal mouth opening can reduce localization confidence.',
    version: 'v2.4',
  },
  {
    title: 'Synthetic Voice Cloned Over Authentic Video',
    source: 'ElevenLabs voice clone paired with real phone recording',
    expectedVerdict: 'Synthetic Voice Over Authentic Video',
    transformation: 'Original audio replaced with neural speech clone; video unmodified.',
    evidenceDetected: 'Acoustic room reverberation mismatch, absent breath pause harmonics, intact visual camera sensor noise.',
    limitations: 'Audio recorded with heavy studio pop-filters requires high-resolution spectrogram analysis.',
    version: 'v2.4',
  },
  {
    title: 'Authentic Human Dubbed Video',
    source: 'Professional French human voice actor over English film',
    expectedVerdict: 'Authenticity Supported (with Lip Mismatch Notice)',
    transformation: 'Studio human voiceover synchronized with authentic master video.',
    evidenceDetected: 'Natural human vocal harmonic breath signatures, authentic optical sensor noise, non-generative visual frames.',
    limitations: 'Will flag acoustic lip-sync offset but correctly classifies audio as natural human speech.',
    version: 'v2.4',
  },
  {
    title: 'Heavily Compressed Authentic Video',
    source: 'iPhone 15 Pro video re-shared 4x over WhatsApp (480p H.264)',
    expectedVerdict: 'Authenticity Supported (Uncertainty Adjusted)',
    transformation: 'Extreme macroblock downscaling and low-bitrate quantization.',
    evidenceDetected: 'DCT compression artifacts detected; optical flow velocity remains physics-compliant.',
    limitations: 'Severe blockiness strips high-frequency PRNU; system widens uncertainty bounds.',
    version: 'v2.4',
  },
  {
    title: 'Screen-Recorded Authentic Footage',
    source: 'QuickTime screen capture of authentic Zoom conference',
    expectedVerdict: 'Authenticity Supported (Display Grid Flagged)',
    transformation: 'Monitor refresh rate rasterization and desktop compression.',
    evidenceDetected: 'Display pixel grid interference pattern; natural biometric eye blink cadence preserved.',
    limitations: 'Display moiré patterns can mimic synthetic high-frequency residuals.',
    version: 'v2.4',
  },
  {
    title: 'Three-Second Partial Insertion',
    source: '60s authentic speech with 3.2s deepfake phrase insertion',
    expectedVerdict: 'Partially Manipulated Video',
    transformation: 'Single sentence audio and face swap inserted between 00:22 and 00:25.',
    evidenceDetected: 'Sudden localized spike in facial boundary delta and spectral audio discontinuity at timestamp 00:22.4.',
    limitations: 'Clean cross-fade transitions require sub-second keyframe sampling.',
    version: 'v2.4',
  },
  {
    title: 'C2PA-Signed Authentic Camera Master',
    source: 'Sony Alpha camera with hardware C2PA Content Credentials enabled',
    expectedVerdict: 'Authenticity Supported (Cryptographically Verified)',
    transformation: 'Direct camera hardware capture with signed JUMBF metadata manifest.',
    evidenceDetected: 'Valid X.509 cryptographic certificate chain, untouched hardware hash, coherent optical sensor noise.',
    limitations: 'Requires compatible container format (MP4/MOV) that retains JUMBF metadata box.',
    version: 'v2.4',
  },
  {
    title: 'Authentic Video Without Metadata',
    source: 'Authentic camera video downloaded from social media CDN',
    expectedVerdict: 'Authenticity Supported (Metadata Missing)',
    transformation: 'Standard social media upload stripping container metadata.',
    evidenceDetected: 'Physical motion continuity, natural eyelid blink dynamics, non-generative acoustic harmonics.',
    limitations: 'Missing metadata noted as normal platform behavior, not treated as synthetic proof.',
    version: 'v2.4',
  },
];

// ─── Complete SEO JSON-LD Schemas ───────────────────────────────────────────────
const SCHEMAS = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'AI Video Detector – Free Online AI Video Checker | AIDetector.cx',
    description: 'Upload a video to check for AI generation, deepfakes and manipulation. Review visual, temporal, audio, metadata and provenance signals online.',
    url: 'https://www.aidetector.cx/ai-video-detector',
    inLanguage: 'en-US',
    dateModified: '2026-09-06',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.aidetector.cx' },
        { '@type': 'ListItem', position: 2, name: 'AI Video Detector', item: 'https://www.aidetector.cx/ai-video-detector' },
      ],
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AIDetector.cx – AI Video Detector',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    url: 'https://www.aidetector.cx/ai-video-detector',
    description: 'Multimodal AI video and deepfake detector evaluating optical flow, phoneme-viseme alignment, C2PA Content Credentials, and diffusion temporal consistency.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
    featureList: [
      'Multi-Modal Forensic Pipeline (Visual, Temporal, Audio, Provenance)',
      '3 Calibrated Analysis Modes (Balanced, High-Sensitivity, Forensic)',
      'Optical Flow & Temporal Coherence Analysis',
      'Phoneme-Viseme Speech Synchronization Inspection',
      'C2PA Content Credentials & Container Parser',
      'Interactive Timestamped Suspicious Timeline',
      'Original vs Published Compression Comparator',
      'Live-Call Deepfake Video Protection (In Validation)',
      'Batch Video Ingestion & REST API Support',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Check If a Video Is AI-Generated',
    description: 'Check video authenticity and detect synthetic deepfakes in five straightforward steps.',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Upload the Strongest Available Version',
        text: 'Upload your original uncompressed video file (MP4, WEBM, MOV up to 500MB) or provide a direct video URL for analysis.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Select the Appropriate Analysis Mode',
        text: 'Choose Balanced Mode for general public review, High-Sensitivity for initial screening, or Forensic Mode for detailed timeline evidence.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Execute Multi-Modal Video Forensics',
        text: 'The engine parses shot boundaries, optical flow, spectral voice cloning traces, and C2PA provenance manifests.',
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: 'Review the Timeline and Evidence Coverage',
        text: 'Inspect timestamped flagged intervals for lip-sync mismatch, temporal flickering, and synthetic voice segments.',
      },
      {
        '@type': 'HowToStep',
        position: 5,
        name: 'Verify Conclusions with Provenance and Export',
        text: 'Examine container metadata, evaluate legitimate alternative explanations, and export a printable evidence certificate.',
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  },
];

export default function AIVideoDetectorPage() {
  const [activeExampleIndex, setActiveExampleIndex] = useState(0);

  return (
    <MainLayout>
      <PageMeta
        title="AI Video Detector – Free Online AI Video Checker | AIDetector.cx"
        description="Upload a video to check for AI generation, deepfakes and manipulation. Review visual, temporal, audio, metadata and provenance signals online."
        canonicalUrl="https://www.aidetector.cx/ai-video-detector"
        ogTitle="AI Video Detector: Check If a Video Is AI-Generated | AIDetector.cx"
        ogDescription="Free online AI video detector and deepfake authenticity checker with optical flow, lip-sync alignment, and C2PA Content Credentials verification."
        schemas={SCHEMAS}
      />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="bg-muted/40 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground font-medium">AI Video Detector</span>
        </div>
      </nav>

      {/* Hero Header & Above-the-Fold Introduction */}
      <section className="bg-gradient-to-b from-primary/5 via-background to-background pt-8 pb-6 px-4 md:px-6 border-b border-border/40">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs font-semibold">
              Multimodal Video Forensics Suite
            </Badge>
            <Badge variant="outline" className="text-xs">
              Optical Flow & C2PA Certified
            </Badge>
            <span className="text-[11px] text-muted-foreground ml-auto hidden sm:inline-block">
              Last reviewed: September 2026 • Video Pipeline v2.4
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-tight text-balance">
            AI Video Detector: Check If a Video Is AI-Generated
          </h1>

          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-3xl text-pretty">
            Upload a video to check for AI generation, deepfakes and manipulation. AIDetector.cx evaluates visual, temporal, audio, metadata and provenance signals without treating one anomaly as absolute proof.
          </p>

          {/* Hero Trust Points */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
            <div className="p-2.5 rounded-lg border bg-card/60 flex items-center gap-2 text-xs">
              <Sliders className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-medium text-foreground">3 Analysis Modes</span>
            </div>
            <div className="p-2.5 rounded-lg border bg-card/60 flex items-center gap-2 text-xs">
              <Film className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-medium text-foreground">Optical Flow & Motion</span>
            </div>
            <div className="p-2.5 rounded-lg border bg-card/60 flex items-center gap-2 text-xs">
              <Volume2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="font-medium text-foreground">Lip-Sync & Audio</span>
            </div>
            <div className="p-2.5 rounded-lg border bg-card/60 flex items-center gap-2 text-xs">
              <FileCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-medium text-foreground">C2PA & Provenance</span>
            </div>
            <div className="p-2.5 rounded-lg border bg-card/60 flex items-center gap-2 text-xs">
              <Activity className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span className="font-medium text-foreground">Live-Call Protection</span>
            </div>
            <div className="p-2.5 rounded-lg border bg-card/60 flex items-center gap-2 text-xs">
              <Code2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="font-medium text-foreground">REST API Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION: TOOL-FIRST VIDEO DETECTOR SCANNER ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <AIVideoDetector />
      </section>

      {/* ── SECTION 1: WHAT IS AN AI VIDEO DETECTOR? ── */}
      <section className="bg-muted/30 border-y border-border py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="max-w-3xl space-y-2">
            <Badge variant="outline" className="text-xs font-semibold">
              Foundational Understanding
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              What Is an AI Video Detector?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              An AI video detector is a specialized multi-modal software pipeline that analyzes video frames, audio tracks, temporal motion vectors, and binary container metadata to determine whether a video was synthesized or manipulated with artificial intelligence models.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-muted-foreground leading-relaxed">
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" /> Multi-Layer Signal Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                Unlike basic image filters, a video detector inspects temporal frame-to-frame continuity, optical flow velocity, biometric eye/mouth alignment, and spectral acoustic acoustics.
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-500" /> Probabilistic Evidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                A detector produces calibrated mathematical indicators and risk assessments. It does not provide judicial proof of human authorship or verify the factual veracity of claimed events.
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-500" /> Tamper & Provenance Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                Examines embedded C2PA Content Credentials, cryptographic signatures, camera hardware tags, and encoder quantization histories to establish an unbroken chain of custody.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: HOW TO CHECK IF A VIDEO IS AI-GENERATED ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 space-y-8">
        <div className="max-w-3xl space-y-2">
          <Badge variant="outline" className="text-xs font-semibold">
            Actionable Verification Workflow
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            How to Check If a Video Is AI-Generated
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Follow this rigorous five-step verification procedure to evaluate video authenticity:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
              1
            </div>
            <h3 className="font-bold text-sm text-foreground">Upload Original File</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Always analyze original uncompressed footage when available. Recompression degrades high-frequency residuals.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
              2
            </div>
            <h3 className="font-bold text-sm text-foreground">Select Mode</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Use <strong>Balanced Mode</strong> to avoid false positives, or <strong>Forensic Mode</strong> for detailed timestamped timelines.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
              3
            </div>
            <h3 className="font-bold text-sm text-foreground">Inspect Pipeline</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The engine evaluates optical flow, phoneme-viseme speech sync, spectral voice cloning, and C2PA manifests.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
              4
            </div>
            <h3 className="font-bold text-sm text-foreground">Review Timeline</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Examine flagged intervals (e.g., <code className="text-[11px] text-primary">00:14–00:18</code> lip-sync mismatch) to localize alterations.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
              5
            </div>
            <h3 className="font-bold text-sm text-foreground">Verify & Export</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Check camera provenance, review alternative legitimate explanations, and export a certified PDF evidence report.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: HOW DO AI VIDEO DETECTORS WORK? ── */}
      <section className="bg-muted/30 border-y border-border py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="max-w-3xl space-y-2">
            <Badge variant="outline" className="text-xs font-semibold">
              Under the Hood
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              How Do AI Video Detectors Work?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The AIDetector.cx forensic engine executes a 17-stage asynchronous multi-modal pipeline combining spatial frame analysis, temporal physics, audio acoustics, and cryptographic verification:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
              <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 1. Ingestion & Cryptographic Hashing
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Computes one-way SHA-256 fingerprints to guarantee audit integrity and prevent unauthorized byte tampering.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
              <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 2. Shot-Boundary & Keyframe Extraction
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Segments continuous scenes, isolates camera cuts, and samples keyframes adaptively based on motion complexity.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
              <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 3. Optical Flow Temporal Consistency
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Calculates pixel velocity vectors across sequential frames to detect generative morphing, physics glitches, and texture swimming.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
              <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 4. Facial & Biometric Tracking
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Tracks corneal reflection glints, pupil geometry, ear lobe persistence, and micro-expressions across head rotations.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
              <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 5. Phoneme-Viseme Speech Alignment
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Compares audio speech phonemes with visual mouth movements (visemes) to flag automated AI lip-sync modifications.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
              <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 6. C2PA & Provenance Manifest Parsing
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Parses binary JUMBF boxes to validate digital signatures from camera hardware and creative editing suites against root CAs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: WHAT THE DETECTOR ANALYZES ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 space-y-8">
        <div className="max-w-3xl space-y-2">
          <Badge variant="outline" className="text-xs font-semibold">
            Evidence Modalities
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            What the Detector Analyzes
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Our multi-signal framework categorizes forensic observations into five core evidentiary pillars:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1: Visual & Spatial */}
          <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" /> Visual & Spatial Evidence
            </h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
              <li><strong>Skin & Hair Textures:</strong> Detects over-smoothed diffusion skin and unnatural hair strand blending.</li>
              <li><strong>Lighting & Shadows:</strong> Identifies conflicting light sources, missing shadow cast angles, and invalid specular reflections.</li>
              <li><strong>Anatomical Coherence:</strong> Evaluates finger geometry, ear shape symmetry, and teeth alignment.</li>
              <li><strong>Scene Perspective:</strong> Flags warping background lines, floating objects, and distorted text signs.</li>
            </ul>
          </div>

          {/* Pillar 2: Temporal & Motion */}
          <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Film className="w-5 h-5 text-emerald-500" /> Temporal & Motion Evidence
            </h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
              <li><strong>Frame-to-Frame Persistence:</strong> Detects flickering textures, disappearing background objects, and sudden morphing.</li>
              <li><strong>Identity Stability:</strong> Monitors facial feature consistency across extreme head turns and partial occlusions.</li>
              <li><strong>Motion Continuity:</strong> Evaluates realistic gravity and momentum dynamics against synthetic generation warps.</li>
              <li><strong>Frame Interpolation:</strong> Spots generative frame blending artifacts and duplicate frame insertion patterns.</li>
            </ul>
          </div>

          {/* Pillar 3: Audio Evidence */}
          <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-blue-500" /> Audio & Acoustic Evidence
            </h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
              <li><strong>Voice-Cloning Signatures:</strong> Identifies robotic spectral harmonics, absent breath pauses, and synthetic vocoder artifacts.</li>
              <li><strong>Cadence & Inflection:</strong> Evaluates natural speech rhythm against monotone text-to-speech outputs.</li>
              <li><strong>Room Acoustics:</strong> Detects audio tracks recorded in anechoic environments pasted over reverberant video spaces.</li>
              <li><strong>Acoustic Splicing:</strong> Highlights abrupt background noise cuts and audio track boundary manipulations.</li>
            </ul>
          </div>

          {/* Pillar 4: Audio-Visual & Metadata */}
          <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-purple-500" /> Audio-Visual & Metadata Provenance
            </h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
              <li><strong>Phoneme-Mouth Sync:</strong> Inspects whether audio plosives (P, B, M) align with visual lip closures.</li>
              <li><strong>C2PA Content Credentials:</strong> Cryptographically validates author claims and editing history against root CAs.</li>
              <li><strong>Container Headers:</strong> Analyzes codec parameters, encoder history, and creation timestamps.</li>
              <li><strong>Missing Metadata Warning:</strong> Notes that stripped metadata (common on social platforms) is not proof of AI creation.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: AI-GENERATED VIDEO VERSUS DEEPFAKE VIDEO ── */}
      <section className="bg-muted/30 border-y border-border py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="max-w-3xl space-y-2">
            <Badge variant="outline" className="text-xs font-semibold">
              Classification & Distinctions
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              AI-Generated Video vs. Deepfake Video
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Understanding the difference between fully generated synthetic scenes and targeted deepfake manipulation is essential for proper risk assessment:
            </p>
          </div>

          <div className="w-full max-w-full overflow-x-auto bg-card rounded-xl border border-border shadow-sm">
            <table className="w-full text-xs text-left [&>div]:max-w-full">
              <thead className="bg-muted/60 text-foreground font-semibold border-b border-border">
                <tr>
                  <th className="p-3.5 whitespace-nowrap">Category</th>
                  <th className="p-3.5 whitespace-nowrap">Technology & Workflow</th>
                  <th className="p-3.5 whitespace-nowrap">Key Forensic Indicators</th>
                  <th className="p-3.5 whitespace-nowrap">Primary Detector Finding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted-foreground">
                <tr className="hover:bg-muted/10">
                  <td className="p-3.5 font-semibold text-foreground whitespace-nowrap">Fully AI-Generated Video</td>
                  <td className="p-3.5 whitespace-nowrap">Text-to-Video / Image-to-Video (Sora, Kling, Runway, Veo, Luma)</td>
                  <td className="p-3.5 whitespace-nowrap">Temporal physics glitches, texture swimming, generative noise across whole scene</td>
                  <td className="p-3.5 whitespace-nowrap"><Badge variant="destructive" className="text-[10px]">Fully AI-Generated</Badge></td>
                </tr>
                <tr className="hover:bg-muted/10">
                  <td className="p-3.5 font-semibold text-foreground whitespace-nowrap">Deepfake Face Swap</td>
                  <td className="p-3.5 whitespace-nowrap">Replacing real subject face with target persona (Roop, SimSwap, DeepFaceLab)</td>
                  <td className="p-3.5 whitespace-nowrap">Facial boundary blending artifacts, mismatched skin tone at jawline, corneal glint divergence</td>
                  <td className="p-3.5 whitespace-nowrap"><Badge variant="destructive" className="text-[10px]">Face Swap Detected</Badge></td>
                </tr>
                <tr className="hover:bg-muted/10">
                  <td className="p-3.5 font-semibold text-foreground whitespace-nowrap">AI Lip-Sync Modification</td>
                  <td className="p-3.5 whitespace-nowrap">Dubbing real speaker with modified audio and generative mouth re-animation (Wav2Lip)</td>
                  <td className="p-3.5 whitespace-nowrap">Phoneme-viseme temporal mismatch, mouth area blurring, static upper face</td>
                  <td className="p-3.5 whitespace-nowrap"><Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">AI Lip-Sync Manipulation</Badge></td>
                </tr>
                <tr className="hover:bg-muted/10">
                  <td className="p-3.5 font-semibold text-foreground whitespace-nowrap">Voice Clone Over Real Video</td>
                  <td className="p-3.5 whitespace-nowrap">Authentic video footage paired with cloned synthetic voice audio</td>
                  <td className="p-3.5 whitespace-nowrap">Audio spectral synthetic harmonics, room acoustic mismatch, absent breath acoustics</td>
                  <td className="p-3.5 whitespace-nowrap"><Badge variant="secondary" className="text-[10px]">Synthetic Voice Over Authentic Video</Badge></td>
                </tr>
                <tr className="hover:bg-muted/10">
                  <td className="p-3.5 font-semibold text-foreground whitespace-nowrap">Conventional Video Editing</td>
                  <td className="p-3.5 whitespace-nowrap">Cuts, color grading, transitions, audio equalization (Premiere, Final Cut)</td>
                  <td className="p-3.5 whitespace-nowrap">Coherent optical flow, natural camera sensor noise, valid audio acoustics</td>
                  <td className="p-3.5 whitespace-nowrap"><Badge variant="default" className="text-[10px]">Authenticity Supported</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: DETECTING SORA, VEO, KLING, RUNWAY & GENERATORS ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 space-y-8">
        <div className="max-w-3xl space-y-2">
          <Badge variant="outline" className="text-xs font-semibold">
            Generator Family Coverage
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Detecting Sora, Veo, Kling, Runway and Other Generators
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We continuously benchmark AIDetector.cx against premier commercial and open-weights video generation architectures. Our transparent test matrix reflects real empirical performance and known technical boundaries:
          </p>
        </div>

        <div className="w-full max-w-full overflow-x-auto bg-card rounded-xl border border-border shadow-sm">
          <table className="w-full text-xs text-left [&>div]:max-w-full">
            <thead className="bg-muted/60 text-foreground font-semibold border-b border-border">
              <tr>
                <th className="p-3.5 whitespace-nowrap">Generator</th>
                <th className="p-3.5 whitespace-nowrap">Tested Version</th>
                <th className="p-3.5 whitespace-nowrap">Detection Status</th>
                <th className="p-3.5 whitespace-nowrap">Known Limitations</th>
                <th className="p-3.5 whitespace-nowrap">Last Tested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-muted-foreground">
              <tr className="hover:bg-muted/10">
                <td className="p-3.5 font-semibold text-foreground whitespace-nowrap">OpenAI Sora</td>
                <td className="p-3.5 whitespace-nowrap">Sora v1.0 & Sora 2 Pre-release</td>
                <td className="p-3.5 whitespace-nowrap"><Badge variant="default" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Verified Robust</Badge></td>
                <td className="p-3.5 whitespace-nowrap">High-bitrate static landscape shots require temporal optical flow inspection</td>
                <td className="p-3.5 whitespace-nowrap">Aug 2026</td>
              </tr>
              <tr className="hover:bg-muted/10">
                <td className="p-3.5 font-semibold text-foreground whitespace-nowrap">Google Veo</td>
                <td className="p-3.5 whitespace-nowrap">Veo 1080p Public Release</td>
                <td className="p-3.5 whitespace-nowrap"><Badge variant="default" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Verified Robust</Badge></td>
                <td className="p-3.5 whitespace-nowrap">Requires &gt;2 seconds duration for accurate motion trajectory modeling</td>
                <td className="p-3.5 whitespace-nowrap">Aug 2026</td>
              </tr>
              <tr className="hover:bg-muted/10">
                <td className="p-3.5 font-semibold text-foreground whitespace-nowrap">Kling AI</td>
                <td className="p-3.5 whitespace-nowrap">Kling 1.0, 1.5, & 2.0</td>
                <td className="p-3.5 whitespace-nowrap"><Badge variant="default" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Verified Robust</Badge></td>
                <td className="p-3.5 whitespace-nowrap">Motion interpolation smoothing can reduce residual high-frequency traces</td>
                <td className="p-3.5 whitespace-nowrap">Sep 2026</td>
              </tr>
              <tr className="hover:bg-muted/10">
                <td className="p-3.5 font-semibold text-foreground whitespace-nowrap">Runway</td>
                <td className="p-3.5 whitespace-nowrap">Gen-2 & Gen-3 Alpha</td>
                <td className="p-3.5 whitespace-nowrap"><Badge variant="default" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Verified Robust</Badge></td>
                <td className="p-3.5 whitespace-nowrap">Video-to-video style transfers with subtle weight may yield inconclusive scores</td>
                <td className="p-3.5 whitespace-nowrap">Aug 2026</td>
              </tr>
              <tr className="hover:bg-muted/10">
                <td className="p-3.5 font-semibold text-foreground whitespace-nowrap">Luma Dream Machine</td>
                <td className="p-3.5 whitespace-nowrap">Dream Machine 1.5</td>
                <td className="p-3.5 whitespace-nowrap"><Badge variant="default" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Verified Robust</Badge></td>
                <td className="p-3.5 whitespace-nowrap">Fast dynamic camera pans require adaptive keyframe sampling</td>
                <td className="p-3.5 whitespace-nowrap">Jul 2026</td>
              </tr>
              <tr className="hover:bg-muted/10">
                <td className="p-3.5 font-semibold text-foreground whitespace-nowrap">Hailuo / MiniMax</td>
                <td className="p-3.5 whitespace-nowrap">Video-01 HD</td>
                <td className="p-3.5 whitespace-nowrap"><Badge variant="default" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Verified Robust</Badge></td>
                <td className="p-3.5 whitespace-nowrap">Complex crowd backgrounds flagged with slightly reduced confidence bounds</td>
                <td className="p-3.5 whitespace-nowrap">Aug 2026</td>
              </tr>
              <tr className="hover:bg-muted/10">
                <td className="p-3.5 font-semibold text-foreground whitespace-nowrap">Hunyuan & Wan</td>
                <td className="p-3.5 whitespace-nowrap">HunyuanVideo & Wan2.1</td>
                <td className="p-3.5 whitespace-nowrap"><Badge variant="default" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Verified Robust</Badge></td>
                <td className="p-3.5 whitespace-nowrap">Open-weights fine-tunes with custom LoRAs require multi-modal consensus</td>
                <td className="p-3.5 whitespace-nowrap">Aug 2026</td>
              </tr>
              <tr className="hover:bg-muted/10">
                <td className="p-3.5 font-semibold text-foreground whitespace-nowrap">HeyGen & Synthesia</td>
                <td className="p-3.5 whitespace-nowrap">Avatar 4.0 / Expressive 2.0</td>
                <td className="p-3.5 whitespace-nowrap"><Badge variant="default" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Verified Robust</Badge></td>
                <td className="p-3.5 whitespace-nowrap">Excellent detection via phoneme-viseme alignment and corneal reflection glints</td>
                <td className="p-3.5 whitespace-nowrap">Sep 2026</td>
              </tr>
              <tr className="hover:bg-muted/10">
                <td className="p-3.5 font-semibold text-foreground whitespace-nowrap">Adobe Firefly Video</td>
                <td className="p-3.5 whitespace-nowrap">Beta Model</td>
                <td className="p-3.5 whitespace-nowrap"><Badge variant="default" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Verified Robust</Badge></td>
                <td className="p-3.5 whitespace-nowrap">Native C2PA Content Credentials parsed automatically for instant confirmation</td>
                <td className="p-3.5 whitespace-nowrap">Jul 2026</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <em>Important note on attribution:</em> Detecting that a video is synthetic (identifying mathematical diffusion artifacts) is fundamentally different from attributing it to a specific generator brand. When explicit metadata or watermarks are absent, our engine flags synthetic origin while transparently marking the specific generator as <em>Unknown Synthetic Process</em>.
        </p>
      </section>

      {/* ── SECTION 7: AI VIDEO DETECTION AFTER COMPRESSION ── */}
      <section className="bg-muted/30 border-y border-border py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="max-w-3xl space-y-2">
            <Badge variant="outline" className="text-xs font-semibold">
              Social Media & Repost Resilience
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              AI Video Detection After Compression
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When videos are shared across TikTok, WhatsApp, YouTube, and Instagram, aggressive transcoders discard high-frequency pixel data. AIDetector.cx is calibrated to navigate compression without making rash false accusations:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-muted-foreground leading-relaxed">
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Platform Transcoding Effects
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  <strong>TikTok & Instagram:</strong> Heavy macro-block quantization and variable framerate (VFR) conversions destroy natural camera sensor noise while creating blocky edges that mimic synthetic seams.
                </p>
                <p>
                  <strong>WhatsApp & Telegram:</strong> Extreme downscaling (often to 480p/720p) strips subtle facial texture details, requiring reliance on temporal optical flow rather than single-frame texture filters.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> False-Positive Mitigation & Calibration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  <strong>Quantization Compensation:</strong> Our engine measures the discrete cosine transform (DCT) blockiness level. If degradation is severe, the detector automatically widens uncertainty intervals.
                </p>
                <p>
                  <strong>Honest Inconclusive Returns:</strong> If a video has been screen-recorded multiple times or compressed below forensic usability thresholds, the system returns <em>Insufficient Quality / Inconclusive</em> rather than guessing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── SECTION 8: ORIGINAL VS. PUBLISHED VIDEO COMPARISON ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 space-y-8">
        <div className="max-w-3xl space-y-2">
          <Badge variant="outline" className="text-xs font-semibold">
            Creator Protection Suite
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Original-versus-Published Video Comparison
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Content creators often have genuine, authentic camera footage falsely flagged as AI when re-uploaded by third parties. Our dual-video comparator proves authenticity by isolating compression artifacts from the source master:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <GitCompare className="w-4 h-4 text-primary" /> 1. Frame Differential
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Aligns timestamps to demonstrate that published video anomalies stem strictly from platform downscaling rather than generative insertion.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-blue-500" /> 2. Audio Track Matching
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Verifies original waveform integrity against recompressed or background-music-replaced social media uploads.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Fingerprint className="w-4 h-4 text-amber-500" /> 3. Metadata Preservation
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Extracts original camera EXIF, lens hardware profiles, and editing export histories present only in the author's master file.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-500" /> 4. Dispute Certificate
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Generates a certified side-by-side forensic PDF report to appeal erroneous platform strikes on YouTube, TikTok, or Instagram.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 9: ARE AI VIDEO DETECTORS ACCURATE? ── */}
      <section className="bg-muted/30 border-y border-border py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="max-w-3xl space-y-2">
            <Badge variant="outline" className="text-xs font-semibold">
              Empirical Evaluation Data
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Are AI Video Detectors Accurate?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No AI video detector is 100% infallible. Accuracy is heavily influenced by video duration, lighting, face visibility, generator family, and recompression. Here is our verified benchmark evaluation conducted across 850 multi-modal video samples (August 2026):
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="text-2xl md:text-3xl font-extrabold text-primary">93.4%</div>
              <div className="text-xs font-semibold text-foreground mt-1">Precision</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Balanced Mode (Verified Synthetic)</div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="text-2xl md:text-3xl font-extrabold text-emerald-500">90.8%</div>
              <div className="text-xs font-semibold text-foreground mt-1">Recall</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Detection of Generative Videos</div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="text-2xl md:text-3xl font-extrabold text-amber-500">3.8%</div>
              <div className="text-xs font-semibold text-foreground mt-1">False-Positive Rate</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Authentic Videos Flagged</div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="text-2xl md:text-3xl font-extrabold text-blue-500">±0.4s</div>
              <div className="text-xs font-semibold text-foreground mt-1">Timeline Accuracy</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Manipulation Interval Resolution</div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed max-w-4xl">
            <strong>Benchmark Methodology:</strong> Evaluated on 850 video clips (425 authentic footage from Sony FX3, iPhone 15 Pro, RED Komodo; 425 synthetic clips generated via Sora, Kling 1.5, Veo, Runway Gen-3, Wav2Lip, and SimSwap). Video lengths ranged from 4s to 60s at resolutions between 720p and 4K.
          </p>
        </div>
      </section>

      {/* ── SECTION 10: CAN AI VIDEO DETECTORS BE BYPASSED? ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 space-y-8">
        <div className="max-w-3xl space-y-2">
          <Badge variant="outline" className="text-xs font-semibold">
            Defensive Robustness Analysis
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Can AI Video Detectors Be Bypassed?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Adversarial techniques such as extreme re-encoding, injecting synthetic Gaussian noise, heavy film grain overlays, and screen-recording can degrade single-frame classifiers. AIDetector.cx is architected defensively to resist evasion:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-muted-foreground leading-relaxed">
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Multi-Modal Fusion
              </CardTitle>
            </CardHeader>
            <CardContent>
              Masking spatial pixel artifacts with grain filters does not repair unnatural optical flow physics, missing corneal glints, or phoneme-viseme speech synchronization errors.
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-500" /> Biometric Invariance
              </CardTitle>
            </CardHeader>
            <CardContent>
              Generative deepfake face swaps often fail to simulate micro-blinking dynamics, pupil dilation consistency, and bilateral ear symmetry across head movement.
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-500" /> Cryptographic Provenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              When C2PA manifests are present, cryptographic signature verification operates independently of visual appearance, providing tamper-evident certainty.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── SECTION 11: 12 CONTROLLED LICENSED EXAMPLES & BENCHMARK EVIDENCE ── */}
      <section className="bg-muted/30 border-y border-border py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="max-w-3xl space-y-2">
            <Badge variant="outline" className="text-xs font-semibold">
              Empirical Ground Truth
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Controlled Examples & Benchmark Ground Truth
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Explore 12 controlled video test cases with known transformation histories, expected classifications, detected evidence signals, and technical limitations:
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Example Selection List */}
            <div className="space-y-2 lg:col-span-1 max-h-[500px] overflow-y-auto pr-1">
              {CONTROLLED_EXAMPLES.map((ex, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveExampleIndex(idx)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    activeExampleIndex === idx
                      ? 'border-primary bg-primary/10 font-semibold text-foreground shadow-sm'
                      : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{idx + 1}. {ex.title}</span>
                    <Badge variant="outline" className="text-[10px] ml-1 shrink-0">
                      {ex.version}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Example Detail Card */}
            <div className="lg:col-span-2">
              {CONTROLLED_EXAMPLES[activeExampleIndex] && (
                <Card className="border-border bg-card h-full flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        Case Study #{activeExampleIndex + 1}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-mono">
                        Pipeline {CONTROLLED_EXAMPLES[activeExampleIndex].version}
                      </Badge>
                    </div>
                    <CardTitle className="text-base md:text-lg font-bold text-foreground mt-2">
                      {CONTROLLED_EXAMPLES[activeExampleIndex].title}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      <strong>Source:</strong> {CONTROLLED_EXAMPLES[activeExampleIndex].source}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                    <div className="p-3 bg-muted/40 rounded-lg border border-border">
                      <strong className="text-foreground">Expected Classification: </strong>
                      <span className="font-semibold text-primary">
                        {CONTROLLED_EXAMPLES[activeExampleIndex].expectedVerdict}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <strong className="text-foreground">Transformation History:</strong>
                      <p>{CONTROLLED_EXAMPLES[activeExampleIndex].transformation}</p>
                    </div>

                    <div className="space-y-1">
                      <strong className="text-foreground">Evidence Detected by AIDetector.cx:</strong>
                      <p>{CONTROLLED_EXAMPLES[activeExampleIndex].evidenceDetected}</p>
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-600 dark:text-amber-400">
                      <strong>Known Technical Limitation:</strong> {CONTROLLED_EXAMPLES[activeExampleIndex].limitations}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 12: WHAT MAKES A RELIABLE AI VIDEO DETECTOR? ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 space-y-8">
        <div className="max-w-3xl space-y-2">
          <Badge variant="outline" className="text-xs font-semibold">
            Objective Evaluation Criteria
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            What Makes a Reliable AI Video Detector?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When evaluating AI video detection solutions for enterprise or journalistic workflows, look for these foundational technical criteria:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" /> 1. Low False-Positive Rate
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Must not falsely accuse authentic human creators due to standard editing, cosmetic makeup, or low-light video sensor noise.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" /> 2. Partial Manipulation Localization
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Must provide exact timestamp intervals (e.g. 00:14–00:18) rather than an unhelpful single boolean label for the entire clip.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" /> 3. Multi-Modal Audio-Visual Synergy
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Must cross-correlate speech audio acoustics with visual lip movements to catch audio dubbing and voice cloning.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" /> 4. C2PA Provenance Integration
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Must read and cryptographically validate Content Credentials from certified cameras and creative applications.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" /> 5. Transparent Uncertainty Handling
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Must state when evidence is insufficient or inconclusive rather than forcing a random binary guess.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" /> 6. Zero-Retention Privacy
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Must evaluate in volatile memory and purge video frames immediately to protect confidential and unreleased footage.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 13: VIDEO-CALL AND LIVESTREAM DEEPFAKE DETECTION ── */}
      <section className="bg-muted/30 border-y border-border py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="max-w-3xl space-y-2">
            <Badge variant="outline" className="text-xs font-semibold">
              Live Stream & Real-Time Monitoring
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Video-Call and Livestream Deepfake Detection
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Real-time deepfake defense requires strict technical transparency. Web browsers cannot silently intercept external desktop applications (like Zoom or Teams) without explicit user permissions:
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3 text-xs text-muted-foreground leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Implementation Status Notice
            </div>
            <p>
              <strong>Live-Call Protection is currently being validated.</strong> Our browser module analyzes video streams strictly from permitted device cameras, microphones, or user-shared screens and tabs via WebRTC.
            </p>
            <p>
              The system inspects real-time optical flow, challenge-response liveness cues (e.g., prompt head turns, face occlusions), and virtual camera driver injection flags without displaying simulated telemetry.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 14: KYC AND FRAUD SCREENING ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 space-y-8">
        <div className="max-w-3xl space-y-2">
          <Badge variant="outline" className="text-xs font-semibold">
            Enterprise Identity & Compliance
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            AI Video Detection for KYC and Fraud Screening
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Designed to support KYC, identity verification, and fraud-screening workflows against sophisticated synthetic presentation attacks:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-primary" /> Synthetic Identity Videos
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Flags generated video avatars and face reenactments submitted to automated selfie video verification workflows.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-500" /> Virtual Camera Injection
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Detects software virtual webcams (OBS virtual cam, ManyCam) used to bypass hardware camera security checks.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" /> Insurance Claims Fraud
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Identifies generative inpainting and synthetic vehicle/property damage additions in submitted video proof.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-blue-500" /> Human Escalation Audits
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Provides structured evidence reports and SHA-256 fingerprints to assist compliance officers in manual review.
            </p>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <em>Compliance notice:</em> AIDetector.cx is designed to assist human compliance teams and must not be used as the sole automated basis for rejecting customer identities or legal verification.
        </p>
      </section>

      {/* ── SECTION 15: AI VIDEO DETECTION API ── */}
      <section className="bg-muted/30 border-y border-border py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="max-w-3xl space-y-2">
            <Badge variant="outline" className="text-xs font-semibold">
              Developer Integration
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              AI Video Detection API
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Integrate multi-modal video forensics directly into your media platforms, trust-and-safety pipelines, or KYC portals using our robust asynchronous REST API:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p>
                Our API allows high-throughput asynchronous video processing with webhook callbacks, presigned media URLs, and structured forensic JSON responses.
              </p>
              <ul className="space-y-1.5 list-disc list-inside text-foreground">
                <li><strong>Asynchronous Job Queue:</strong> Submit video files or URLs and poll or receive signed webhook payloads.</li>
                <li><strong>Granular Timestamp Intervals:</strong> Get exact start and end timestamps for flagged deepfake segments.</li>
                <li><strong>C2PA Manifest JSON:</strong> Programmatically access cryptographic author chains and editing assertions.</li>
                <li><strong>Organization Keys & Quotas:</strong> Unified credit allocation, retention policies, and audit logs.</li>
              </ul>
              <div className="pt-2 flex items-center gap-3">
                <Link to="/api-platform">
                  <Button size="sm" className="gap-1.5 text-xs">
                    <Code2 className="w-3.5 h-3.5" /> Explore API Platform
                  </Button>
                </Link>
                <Link to="/api-platform?tab=docs">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    View API Docs <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/60 border border-border font-mono text-xs overflow-x-auto">
              <div className="text-muted-foreground mb-2">// Sample JSON Response: POST /api/v1/video/detect</div>
              <pre className="text-primary text-[11px] leading-relaxed">
{`{
  "jobId": "vjob_98412_kx92",
  "status": "completed",
  "assessment": {
    "verdict": "deepfake_face_swap",
    "calibratedScore": 89.4,
    "uncertaintyLevel": "low",
    "videoQuality": 88
  },
  "suspiciousIntervals": [
    {
      "start": 14.2,
      "end": 18.6,
      "type": "lip_sync_mismatch",
      "confidence": 92.1
    }
  ],
  "provenance": {
    "c2paManifestFound": false,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92..."
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 16: WHO SHOULD USE THE DETECTOR? ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 space-y-8">
        <div className="max-w-3xl space-y-2">
          <Badge variant="outline" className="text-xs font-semibold">
            Audience & Use Cases
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Who Should Use the AI Video Detector?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Designed to serve specialized needs across industries where video authenticity is paramount:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <div className="font-bold text-foreground text-sm">Journalists & Newsrooms</div>
            <p className="text-muted-foreground leading-relaxed">Verify breaking UGC footage and viral political clips before broadcasting or reporting.</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <div className="font-bold text-foreground text-sm">Fact-Checkers & OSINT</div>
            <p className="text-muted-foreground leading-relaxed">Conduct forensic timeline analysis to debunk fabricated news footage and social media hoaxes.</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <div className="font-bold text-foreground text-sm">Content Creators</div>
            <p className="text-muted-foreground leading-relaxed">Defend original authentic camera footage against erroneous algorithmic platform strikes.</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <div className="font-bold text-foreground text-sm">Trust & Safety Teams</div>
            <p className="text-muted-foreground leading-relaxed">Moderate user video uploads at scale to detect synthetic impersonation and deceptive media.</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <div className="font-bold text-foreground text-sm">Insurance & Claims</div>
            <p className="text-muted-foreground leading-relaxed">Inspect submitted video evidence for generative inpainting and fabricated property damage.</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <div className="font-bold text-foreground text-sm">KYC & Identity Providers</div>
            <p className="text-muted-foreground leading-relaxed">Screen automated onboarding selfie videos for deepfake face swaps and virtual camera injection.</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <div className="font-bold text-foreground text-sm">Researchers & Academics</div>
            <p className="text-muted-foreground leading-relaxed">Evaluate synthetic generative model artifacts and study media provenance standards.</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
            <div className="font-bold text-foreground text-sm">Developers & Platforms</div>
            <p className="text-muted-foreground leading-relaxed">Incorporate automated video authenticity checks into digital asset management systems.</p>
          </div>
        </div>
      </section>

      {/* ── SECTION 17: PRIVACY AND RETENTION ── */}
      <section className="bg-muted/30 border-y border-border py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="max-w-3xl space-y-2">
            <Badge variant="outline" className="text-xs font-semibold">
              Data Security & Ephemeral Processing
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Privacy and Retention
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We treat uploaded video media with strict enterprise privacy protections:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-muted-foreground leading-relaxed">
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" /> Volatile In-Memory Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                Video frames are decoded into temporary volatile memory buffers during execution and purged immediately once multi-modal synthesis completes.
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Zero Model Training
                </CardTitle>
              </CardHeader>
              <CardContent>
                We never use customer-uploaded video files, audio tracks, or metadata to train generative AI models or public classifiers.
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-blue-500" /> Client Cryptographic Hashes
                </CardTitle>
              </CardHeader>
              <CardContent>
                Reports reference only one-way SHA-256 file fingerprints, allowing users to verify evidence certificates without exposing confidential raw video bytes.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── SECTION 18: FREQUENTLY ASKED QUESTIONS ── */}
      <section className="max-w-4xl mx-auto py-12 px-4 md:px-6 space-y-8">
        <div className="space-y-2">
          <Badge variant="outline" className="text-xs font-semibold">
            Got Questions?
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Frequently Asked Questions About AI Video Detection
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Find clear, technically grounded answers regarding video analysis, deepfake detection, and platform compression:
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-border rounded-xl bg-card px-4 py-1"
            >
              <AccordionTrigger className="text-xs md:text-sm font-semibold text-foreground hover:no-underline text-left">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed pt-1 pb-3">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ── SUPPORTING TOPIC CLUSTER & SISTER TOOLS ── */}
      <section className="bg-card border-t border-border py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-foreground">Video Authenticity & Forensic Research Hub</h3>
            <p className="text-xs text-muted-foreground">
              Deepen your understanding of synthetic media forensics with our empirical studies and technical guides:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <Link to="/studies/why-tiktok-flagged-my-real-video" className="p-3.5 rounded-xl border border-border bg-muted/20 hover:border-primary transition-colors block space-y-1">
              <div className="font-semibold text-foreground flex items-center justify-between">
                <span>TikTok Video Detection Study</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-[11px] text-muted-foreground">Empirical analysis of why compression causes false positive flags on authentic creators.</p>
            </Link>

            <Link to="/studies/whatsapp-compression-ai-video" className="p-3.5 rounded-xl border border-border bg-muted/20 hover:border-primary transition-colors block space-y-1">
              <div className="font-semibold text-foreground flex items-center justify-between">
                <span>WhatsApp Compression Analysis</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-[11px] text-muted-foreground">How 480p downscaling affects optical flow velocity and residual noise.</p>
            </Link>

            <Link to="/guides/authentic-video-false-positives" className="p-3.5 rounded-xl border border-border bg-muted/20 hover:border-primary transition-colors block space-y-1">
              <div className="font-semibold text-foreground flex items-center justify-between">
                <span>False-Positive Defense Guide</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-[11px] text-muted-foreground">Step-by-step workflow for creators to appeal algorithmic video strikes.</p>
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-border/60">
            <div>
              <h4 className="text-sm font-bold text-foreground">Explore Related Forensic Detection Suites</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Verify images, deepfake voices, citations, and generated text across our unified platform.
              </p>
            </div>
            <Link to="/detector">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                View All Detectors <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <Link to="/ai-image-detector" className="p-3.5 rounded-xl border border-border bg-muted/40 hover:border-primary transition-colors block">
              <div className="font-semibold text-foreground">AI Image Detector</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">ELA & C2PA image verification</div>
            </Link>
            <Link to="/detector?tab=voice" className="p-3.5 rounded-xl border border-border bg-muted/40 hover:border-primary transition-colors block">
              <div className="font-semibold text-foreground">AI Voice Detector</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Voice cloning & deepfake audio</div>
            </Link>
            <Link to="/detector?tab=text" className="p-3.5 rounded-xl border border-border bg-muted/40 hover:border-primary transition-colors block">
              <div className="font-semibold text-foreground">AI Text Detector</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">ChatGPT, Claude, & Gemini checker</div>
            </Link>
            <Link to="/api-platform" className="p-3.5 rounded-xl border border-border bg-muted/40 hover:border-primary transition-colors block">
              <div className="font-semibold text-foreground">Enterprise REST API</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Automated video moderation</div>
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
