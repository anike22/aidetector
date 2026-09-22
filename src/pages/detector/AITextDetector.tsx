import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload, Bot, Shield, CheckCircle2, AlertTriangle, Fingerprint, TextSearch,
  Sparkles, Network, RefreshCw, UserCheck, Download, Copy, Share2, Activity,
  BarChart2, Type, FileText, Globe, Info, Languages, AlertOctagon,
  ChevronDown, ChevronUp, ArrowRight,
} from 'lucide-react';
import { AnalysisError, type ContentType, type Verdict } from './detectionEngine';
import { runBalancedDetector, type BalancedDetectorResult, type BalancedDetectorError } from '@/lib/detection/balancedDetectorService';
import { runAggressiveDetector, type AggressiveDetectorResult } from '@/lib/detection/aggressiveDetectorService';
import { extractTextFromFile } from '@/utils/fileExtractor';
import { saveDetectorResult, type AggressiveResultSnapshot } from '@/lib/detection/storage';
import DualDetectorResults from '@/components/detector/DualDetectorResults';
import DetectorFeedback from '@/components/detector/DetectorFeedback';
import { StudentModeToggle } from '@/components/student-policy/StudentModeToggle';
import { StudentModePanel } from '@/components/student-policy/StudentModePanel';
import { useCustomerDataPlatform } from '@/contexts/CustomerDataPlatformContext';
import { useAuth } from '@/contexts/AuthContext';
import { trackLifecycleEvent } from '@/lib/trackLifecycleEvent';
import { trackBehaviorEvent } from '@/lib/personalizationApi';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useUpgradeModal } from '@/hooks/useUpgradeModal';
import { supabase } from '@/db/supabase';
import UsageBadge from '@/components/common/UsageBadge';
import UpgradeModal from '@/components/common/UpgradeModal';
import { LiveUsagePanel } from '@/components/common/LiveUsagePanel';
import { getPreservedDraftText, clearPreservedDraftText, preserveDraftText } from '@/lib/visitorId';
import { SubscriptionActions } from './SubscriptionActions';

const SAMPLE_TEXT = `Artificial intelligence has revolutionized the way businesses operate in the modern era. The implementation of machine learning algorithms enables companies to process vast amounts of data with unprecedented efficiency. Furthermore, natural language processing capabilities allow for automated content generation that is indistinguishable from human writing. Organizations leveraging these technologies experience substantial improvements in productivity metrics and operational cost reduction. The utilization of AI-powered tools represents a paradigm shift in how enterprises approach problem-solving and decision-making processes.`;

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'academic', label: 'Academic essay' },
  { value: 'research', label: 'Research paper' },
  { value: 'blog', label: 'Blog article' },
  { value: 'seo', label: 'SEO content' },
  { value: 'news', label: 'News article' },
  { value: 'business', label: 'Business report' },
  { value: 'email', label: 'Email' },
  { value: 'job', label: 'Job application' },
  { value: 'legal', label: 'Legal writing' },
  { value: 'technical', label: 'Technical documentation' },
  { value: 'creative', label: 'Creative writing' },
  { value: 'social', label: 'Social media' },
  { value: 'product', label: 'Product description' },
  { value: 'student', label: 'Student assignment' },
];

const LANGUAGE_HINTS = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish — Beta' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'it', label: 'Italian' },
  { value: 'nl', label: 'Dutch' },
  { value: 'ar', label: 'Arabic — Beta' },
  { value: 'hi', label: 'Hindi — Beta' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese — Beta' },
  { value: 'ko', label: 'Korean — Beta' },
  { value: 'ru', label: 'Russian — Beta' },
  { value: 'tr', label: 'Turkish — Beta' },
  { value: 'id', label: 'Indonesian — Beta' },
  { value: 'vi', label: 'Vietnamese — Beta' },
];

function ScoreGauge({ value, color, size = 'md' }: { value: number; color: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const radius = size === 'xl' ? 65 : size === 'lg' ? 45 : size === 'md' ? 35 : 28;
  const stroke = size === 'xl' ? 10 : size === 'lg' ? 6 : size === 'md' ? 5 : 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const svgSize = (radius + stroke + 4) * 2;

  return (
    <svg width={svgSize} height={svgSize} className="transform -rotate-90 drop-shadow-sm">
      <circle cx={svgSize / 2} cy={svgSize / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
      <circle
        cx={svgSize / 2} cy={svgSize / 2} r={radius}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

function VerdictBadge({ verdict, ai }: { verdict: Verdict; ai: number }) {
  const config: Record<Verdict, { label: string; class: string; icon: React.ElementType }> = {
    'likely-human': { label: 'Likely human-written', class: 'bg-success/10 text-success border-success/20', icon: UserCheck },
    'mostly-human-ai-assisted': { label: 'Mostly human, AI-assisted', class: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
    'mixed': { label: 'Mixed human & AI', class: 'bg-warning/10 text-warning border-warning/20', icon: AlertTriangle },
    'mostly-ai-human-edited': { label: 'Mostly AI, human-edited', class: 'bg-warning/10 text-warning border-warning/20', icon: AlertTriangle },
    'likely-ai': { label: 'Likely AI-generated', class: 'bg-destructive/10 text-destructive border-destructive/20', icon: Bot },
    'inconclusive': { label: 'Inconclusive', class: 'bg-muted/20 text-muted-foreground border-border', icon: AlertOctagon },
    'insufficient-text': { label: 'Insufficient text', class: 'bg-muted/20 text-muted-foreground border-border', icon: AlertOctagon },
  };
  const cfg = config[verdict] || config['inconclusive'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${cfg.class}`}>
      <Icon className="w-4 h-4" /> {cfg.label}
    </span>
  );
}

function RiskBadge({ level }: { level: string }) {
  const config: Record<string, { class: string; icon: React.ElementType }> = {
    Low: { class: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
    Medium: { class: 'bg-warning/10 text-warning border-warning/20', icon: AlertTriangle },
    High: { class: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertTriangle },
    Critical: { class: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertTriangle },
  };
  const cfg = config[level] || config.Medium;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${cfg.class}`}>
      <Icon className="w-4 h-4" /> {level} Risk
    </span>
  );
}

function passageClass(verdict: Verdict): string {
  switch (verdict) {
    case 'likely-human':
    case 'mostly-human-ai-assisted':
      return 'bg-success/10 hover:bg-success/20 text-success-foreground border border-success/20';
    case 'mixed':
    case 'mostly-ai-human-edited':
      return 'bg-warning/15 hover:bg-warning/30 text-warning-foreground border border-warning/30';
    case 'likely-ai':
      return 'bg-destructive/15 hover:bg-destructive/30 text-destructive-foreground border border-destructive/30';
    default:
      return 'bg-muted/30 hover:bg-muted/50 border border-border/50';
  }
}

function verdictDescription(verdict: Verdict): string {
  switch (verdict) {
    case 'likely-human': return 'Consistent with natural human writing.';
    case 'mostly-human-ai-assisted': return 'Mostly human with possible AI polish.';
    case 'mixed': return 'Mixed signals: likely collaboration or heavy editing.';
    case 'mostly-ai-human-edited': return 'AI-like base with significant human editing.';
    case 'likely-ai': return 'Strong AI-generation patterns.';
    default: return 'Not enough evidence.';
  }
}

function readabilityEstimate(sentenceLength: number, lexicalDiversity: number): number {
  const raw = 60 - sentenceLength * 1.5 + lexicalDiversity * 40;
  return Math.min(100, Math.max(20, Math.round(raw)));
}

const FEATURE_SLUG = 'ai_detector';

function DetectorDiagnosticsPanel({ result }: { result: BalancedDetectorResult }) {
  if (!import.meta.env.DEV) return null;
  const items = [
    { label: 'Selected language', value: result.full.language.primary?.name || 'Unknown' },
    { label: 'Language code', value: result.full.language.primary?.code || '—' },
    { label: 'Pipeline', value: result.languagePipelineVersion },
    { label: 'Detector version', value: result.engineVersion },
    { label: 'Model version', value: result.modelVersion },
    { label: 'Calibration', value: result.calibrationVersion },
    { label: 'Processing time', value: result.processingTimeMs ? `${result.processingTimeMs} ms` : '—' },
    { label: 'Request ID', value: result.requestId },
  ];
  return (
    <Card className="border-border/50 shadow-premium rounded-2xl bg-card">
      <CardHeader className="pb-4 pt-5 px-6 border-b border-border/50">
        <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" /> Diagnostics
        </CardTitle>
        <CardDescription className="text-xs">Internal runtime metadata. Not shown to end users.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {items.map((item) => (
            <div key={item.label} className="flex flex-col">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <span className="font-mono font-medium truncate" title={String(item.value)}>{String(item.value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AITextDetector() {
  const navigate = useNavigate();
  const { trackToolUsage } = useCustomerDataPlatform();
  const { user, profile, refreshProfile } = useAuth();
  const { entitlement, refresh: refreshEntitlement } = useEntitlement(FEATURE_SLUG);
  const { open, featureName, trigger, remaining, limit, openUpgradeModal, closeUpgradeModal } = useUpgradeModal();
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // ── Dual detector state ─────────────────────────────────────────────────────
  const [balancedResult, setBalancedResult] = useState<BalancedDetectorResult | null>(null);
  const [balancedLoading, setBalancedLoading] = useState(false);
  const [balancedError, setBalancedError] = useState<{ message: string; canRetry: boolean } | null>(null);
  const [aggressiveResult, setAggressiveResult] = useState<AggressiveDetectorResult | null>(null);
  const [aggressiveLoading, setAggressiveLoading] = useState(false);
  const [aggressiveError, setAggressiveError] = useState<{ message: string; canRetry: boolean } | null>(null);
  // Restore preserved draft text if returning from sign-in/pricing
  useEffect(() => {
    const savedDraft = getPreservedDraftText(FEATURE_SLUG);
    if (savedDraft && savedDraft.trim().length > 0) {
      setContent(savedDraft);
      setUseSample(false);
      clearPreservedDraftText();
      toast.info('Your draft text has been restored.');
    }
  }, []);
  const [savedResultId, setSavedResultId] = useState<string | null>(null);
  const [zeroRetention, setZeroRetention] = useState(false);
  const [useSample, setUseSample] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('auto');
  const [languageHint, setLanguageHint] = useState('auto');
  const [explanationMode, setExplanationMode] = useState<'simple' | 'technical'>('simple');
  const [sentenceFilter, setSentenceFilter] = useState<'all' | Verdict>('all');
  const [analysisError, setAnalysisError] = useState<{ message: string; code?: string; canRetry: boolean } | null>(null);
  const [guestUsage, setGuestUsage] = useState<{ remaining: number; limit: number } | null>(null);
  const [isStudentModeOpen, setIsStudentModeOpen] = useState(false);
  const [isSentenceAnalysisExpanded, setIsSentenceAnalysisExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialText = params.get('text');
    if (initialText && content === '') {
      setContent(initialText);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('profiles')
          .select('detector_zero_retention')
          .eq('id', user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.detector_zero_retention) setZeroRetention(true);
          });
      }
    });
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsExtracting(true);
    try {
      let combinedText = '';
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds the 10MB limit.`);
        }
        const text = await extractTextFromFile(file);
        if (!text || text.trim() === '') {
          throw new Error(`We couldn't read this document. Please upload a valid DOCX, PDF, or TXT file.`);
        }
        combinedText += `\n\n--- File: ${file.name} ---\n\n` + text.trim();
      }
      setContent(combinedText.trim());
      setUseSample(false);

      const wordCount = combinedText.trim().split(/\s+/).filter((w) => w.length > 0).length;
      toast.success(`Document uploaded successfully. Extracted ${wordCount} words.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to extract file content.');
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    const textToAnalyze = content || (useSample ? SAMPLE_TEXT : '');
    if (!textToAnalyze.trim() || textToAnalyze.split(/\s+/).length < 20) {
      toast.error('Please enter at least 20 words.');
      return;
    }

    // ── Reset all state ──────────────────────────────────────────────────────
    setIsAnalyzing(true);
    setAnalysisError(null);
    setBalancedResult(null);
    setBalancedError(null);
    setAggressiveResult(null);
    setAggressiveError(null);
    setSavedResultId(null);

    // ── Start both engines independently and in parallel ──────────────────────
    setBalancedLoading(true);
    setAggressiveLoading(true);

    const balancedPromise = runBalancedDetector(textToAnalyze, {
      contentType,
      languageHint: languageHint === 'auto' ? undefined : languageHint,
      onGuestUsage: !user ? setGuestUsage : undefined,
      engineCount: 2,
    });

    // Both results share this scan's authorization. Never run the second
    // engine when the billing check or the first analysis failed.
    const aggressivePromise = balancedPromise.then(() => runAggressiveDetector(textToAnalyze));

    // ── Handle balanced result ────────────────────────────────────────────────
    balancedPromise
      .then(async (bResult) => {
        setBalancedResult(bResult);
        setBalancedLoading(false);

        // Analytics
        trackToolUsage('detector', {
          engine: 'balanced',
          model: bResult.full.modelFamilies[0]?.family,
          ai_probability: bResult.ai,
          word_count: textToAnalyze.split(/\s+/).length,
        });
        trackLifecycleEvent('first_scan', {
          ai_probability: bResult.ai,
          word_count: textToAnalyze.split(/\s+/).length,
        });
        trackLifecycleEvent('detector_use', {
          ai_probability: bResult.ai,
          word_count: textToAnalyze.split(/\s+/).length,
        });
        trackBehaviorEvent({
          event_type: 'detector',
          event_category: 'tool',
          event_data: {
            engine: 'balanced',
            ai_probability: bResult.ai,
            word_count: textToAnalyze.split(/\s+/).length,
          },
        });
      })
      .catch((e) => {
        setBalancedLoading(false);
        if (e instanceof AnalysisError && e.code === 'UPGRADE_REQUIRED') {
          if (textToAnalyze) {
            preserveDraftText(textToAnalyze, FEATURE_SLUG);
          }
          if (!user) {
            toast.error('You’ve used your free guest check. Create an account to get 4 additional free checks.');
            navigate('/signup?returnTo=' + encodeURIComponent('/detector'));
          } else {
            toast.error('You’ve used all your free checks. Choose a plan to continue.');
            navigate('/pricing');
          }
        } else if (e instanceof AnalysisError && e.code === 'AUTH_REQUIRED') {
          if (textToAnalyze) {
            preserveDraftText(textToAnalyze, FEATURE_SLUG);
          }
          toast.error('Please sign in to analyze text.');
          navigate('/login?returnTo=' + encodeURIComponent('/detector'));
        } else {
          const message = e instanceof Error ? e.message : 'Balanced Detector analysis failed.';
          setBalancedError({ message, canRetry: true });
          setAnalysisError({ message, code: e instanceof AnalysisError ? e.code : 'API_ERROR', canRetry: true });
        }
        // Analytics: balanced failure
        trackBehaviorEvent({
          event_type: 'detector_failure',
          event_category: 'tool',
          event_data: { engine: 'balanced' },
        });
      });

    // ── Handle aggressive result ──────────────────────────────────────────────
    aggressivePromise
      .then((aResult) => {
        setAggressiveResult(aResult);
        setAggressiveLoading(false);
        // Analytics
        trackBehaviorEvent({
          event_type: 'detector',
          event_category: 'tool',
          event_data: {
            engine: 'aggressive',
            ai_probability: aResult.ai,
          },
        });
      })
      .catch((e) => {
        setAggressiveLoading(false);
        const message = e instanceof Error ? e.message : 'High-Sensitivity Analysis failed.';
        setAggressiveError({ message, canRetry: true });
        trackBehaviorEvent({
          event_type: 'detector_failure',
          event_category: 'tool',
          event_data: { engine: 'aggressive' },
        });
      });

    // ── Save result when both settle (one or both may have failed) ────────────
    Promise.allSettled([balancedPromise, aggressivePromise]).then(async ([bSettled, aSettled]) => {
      if (bSettled.status !== 'fulfilled') {
        setIsAnalyzing(false);
        return;
      }

      const bResult = bSettled.value;
      const aResult = aSettled.status === 'fulfilled' ? aSettled.value : null;

      // Score difference analytics
      if (aResult !== null) {
        const diff = Math.abs(bResult.ai - aResult.ai);
        const balancedVerdictFamily =
          ['likely-human', 'mostly-human-ai-assisted'].includes(bResult.verdict) ? 'human' :
          ['likely-ai', 'mostly-ai-human-edited'].includes(bResult.verdict) ? 'ai' : 'mixed';
        const aggressiveVerdictFamily = aResult.ai >= 65 ? 'ai' : aResult.ai < 40 ? 'human' : 'mixed';
        trackBehaviorEvent({
          event_type: 'detector_comparison',
          event_category: 'tool',
          event_data: {
            score_difference: diff,
            verdict_disagreement: balancedVerdictFamily !== aggressiveVerdictFamily,
          },
        });
      }

      // Persist balanced result (+ optional aggressive snapshot)
      const aggressiveSnapshot: AggressiveResultSnapshot | undefined = aResult
        ? {
            ai: aResult.ai,
            human: aResult.human,
            risk: aResult.risk,
            recommendations: aResult.recommendations,
            engineLabel: 'seo-assistant-heuristic',
            recordedAt: new Date().toISOString(),
          }
        : undefined;

      const saved = await saveDetectorResult(textToAnalyze, bResult.full, {
        zeroRetention,
        aggressiveResult: aggressiveSnapshot,
      });
      if (saved) setSavedResultId(saved.id);

      setIsAnalyzing(false);
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Text copied to clipboard');
  };

  const handleCopySummary = () => {
    if (!balancedResult) return;
    const summary = [
      `AIDetector.cx Analysis — ${balancedResult.analyzedAt}`,
      `Verdict: ${balancedResult.verdict.replace(/-/g, ' ')}`,
      `AI: ${balancedResult.ai}% | Human: ${balancedResult.human}% | Mixed: ${balancedResult.mixed}%`,
      `Confidence: ${balancedResult.confidence}% (${balancedResult.confidenceLevel})`,
      `Language: ${balancedResult.language}`,
      `Content type: ${balancedResult.full.contentType}`,
      '',
      balancedResult.full.explanation.simple,
      '',
      'Limitations:',
      ...balancedResult.full.limitations,
    ].join('\n');
    navigator.clipboard.writeText(summary);
    toast.success('Summary copied to clipboard');
  };

  const handleDownloadReport = () => {
    if (!balancedResult) return;
    const report = {
      reportTitle: 'AIDetector.cx Analysis Report',
      generatedAt: balancedResult.analyzedAt,
      detectorVersion: balancedResult.engineVersion,
      modelVersion: balancedResult.modelVersion,
      languagePipelineVersion: balancedResult.languagePipelineVersion,
      calibrationVersion: balancedResult.calibrationVersion,
      requestId: balancedResult.requestId,
      overall: balancedResult.full.overall,
      language: balancedResult.full.language,
      contentType: balancedResult.full.contentType,
      textSufficiency: balancedResult.full.textSufficiency,
      sentences: balancedResult.full.sentences,
      paragraphs: balancedResult.full.paragraphs,
      highlights: balancedResult.full.highlights,
      modelFamilies: balancedResult.full.modelFamilies,
      humanization: balancedResult.full.humanization,
      explanation: balancedResult.full.explanation,
      limitations: balancedResult.full.limitations,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aidetector-report-${balancedResult.requestId}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  const activeText = useSample && !content ? SAMPLE_TEXT : content;
  const wordCount = (activeText.match(/\S+/g) || []).length;
  const result = balancedResult?.full;

  const stats = result
    ? {
        readability: readabilityEstimate(result.linguisticProfile.avgSentenceLength, result.linguisticProfile.lexicalDiversity),
        burstiness: Math.round(result.statisticalProfile.burstiness * 100),
        perplexity: Math.round(result.statisticalProfile.tokenPredictability * 100),
        complexity: Math.round(result.linguisticProfile.sentenceLengthVariance * 3),
      }
    : null;

  // Retry handlers for each engine independently
  const handleBalancedRetry = () => {
    const textToAnalyze = content || (useSample ? SAMPLE_TEXT : '');
    if (!textToAnalyze.trim()) return;
    setBalancedError(null);
    setBalancedLoading(true);
    runBalancedDetector(textToAnalyze, {
      contentType,
      languageHint: languageHint === 'auto' ? undefined : languageHint,
      onGuestUsage: !user ? setGuestUsage : undefined,
    })
      .then((bResult) => { setBalancedResult(bResult); setBalancedLoading(false); })
      .catch((e) => {
        setBalancedLoading(false);
        const message = e instanceof Error ? e.message : 'Balanced Detector analysis failed.';
        setBalancedError({ message, canRetry: true });
      });
  };

  const handleAggressiveRetry = () => {
    const textToAnalyze = content || (useSample ? SAMPLE_TEXT : '');
    if (!textToAnalyze.trim()) return;
    setAggressiveError(null);
    setAggressiveLoading(true);
    runAggressiveDetector(textToAnalyze)
      .then((aResult) => { setAggressiveResult(aResult); setAggressiveLoading(false); })
      .catch((e) => {
        setAggressiveLoading(false);
        const message = e instanceof Error ? e.message : 'High-Sensitivity Analysis failed.';
        setAggressiveError({ message, canRetry: true });
      });
  };

  const handleOptimizeInSEOAssistant = () => {
    const textToTransfer = activeText || content;
    if (!textToTransfer.trim()) {
      navigate('/ai-checker-for-bloggers');
      return;
    }
    try {
      const draft = {
        content: textToTransfer,
        keyword: '',
        updatedAt: Date.now(),
        sourcePage: '/detector',
      };
      localStorage.setItem('aidetector_blogger_draft', JSON.stringify(draft));
      localStorage.setItem('seo_assistant_draft', JSON.stringify(draft));
      toast.success('Document transferred to SEO Assistant.');
    } catch (e) {
      console.error('Failed to transfer draft to SEO Assistant:', e);
    }
    navigate('/ai-checker-for-bloggers');
  };

  return (
    <div className="pt-6 pb-20">
      <PageMeta
        title="AI Detector – Free AI Content Checker | AIDetector.cx"
        description="Free AI detector for ChatGPT, Claude, Gemini and AI-generated text. Dual Balanced and High-Sensitivity engines, multilingual support across 19+ languages, and sentence-level results."
        canonicalUrl="https://www.aidetector.cx/detector"
      />
      <UpgradeModal
        open={open}
        onOpenChange={closeUpgradeModal}
        featureName={featureName}
        trigger={trigger}
        remaining={remaining}
        limit={limit}
      />
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">AI Detector</h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">Free AI detector for ChatGPT, Claude and AI-generated text — dual engines, multilingual support and sentence-level analysis.</p>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <LiveUsagePanel
              featureSlug={FEATURE_SLUG}
              operationCost={1}
              operationCostLabel="1 scan"
              currentDraftText={content}
              compact={true}
            />
            <SubscriptionActions
              plan={profile?.subscription_plan}
              status={profile?.subscription_status}
              planEndDate={profile?.plan_end_date}
              onRefresh={async () => {
                await refreshProfile();
                await refreshEntitlement();
                window.dispatchEvent(new CustomEvent('subscription-updated'));
              }}
              onManage={() => navigate('/dashboard?tab=subscription')}
            />
          </div>
        </div>

        {/* Live Entitlement & Usage Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-3">
            <LiveUsagePanel
              featureSlug={FEATURE_SLUG}
              operationCost={1}
              operationCostLabel="1 scan"
              currentDraftText={content}
            />
          </div>
        </div>

        {!user && guestUsage && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-semibold">Free trial:</span>{' '}
                {guestUsage.remaining} of {guestUsage.limit} daily scans remaining.
                {guestUsage.remaining === 0 && ' Sign up to unlock more.'}
              </p>
            </div>
            <div className="shrink-0">
              <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-xs font-semibold">
                <Link to="/signup?redirect=/detector">Sign up free</Link>
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Input and Options (sticky on desktop for long document comparison) */}
          <div className="lg:col-span-5 lg:sticky lg:top-4 flex flex-col gap-5">
            {/* Student Mode Guidance Entry Trigger */}
            <div className="rounded-xl border border-border/70 bg-card p-2 shadow-xs">
              <StudentModeToggle
                isOpen={isStudentModeOpen}
                onToggle={() => setIsStudentModeOpen(!isStudentModeOpen)}
              />
              {isStudentModeOpen && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <StudentModePanel
                    balancedResult={balancedResult}
                    aggressiveResult={aggressiveResult}
                    onClose={() => setIsStudentModeOpen(false)}
                  />
                </div>
              )}
            </div>

            {/* Document Content Card with Desktop Internal Scroll & Natural Mobile Page Flow */}
            <Card className="border-border/50 shadow-premium overflow-hidden flex flex-col min-h-[300px] md:h-[480px] rounded-2xl bg-card">
              <CardHeader className="bg-muted/20 border-b border-border/50 py-3.5 px-4 sm:px-5">
                <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Document Content</span>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      multiple
                      accept=".txt,.md,.html,.pdf,.docx"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    <Button type="button" variant="outline" size="sm" className="h-7 rounded-lg text-xs font-semibold px-2.5" onClick={() => fileInputRef.current?.click()} disabled={isExtracting}>
                      <Upload className="w-3 h-3 mr-1" /> Upload
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 rounded-lg text-xs font-semibold text-muted-foreground px-2" onClick={() => { setContent(''); setUseSample(true); }}>
                      Try Sample
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-3">
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> 25+ languages</span>
                  <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Sentence-level detection</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative min-h-0 flex flex-col">
                <Textarea
                  placeholder="Paste your text here (minimum 20 words) to detect AI-generated content across languages..."
                  className="w-full h-full min-h-[180px] resize-none border-0 focus-visible:ring-0 rounded-none p-4 sm:p-5 text-sm sm:text-base leading-relaxed bg-transparent md:overflow-y-auto"
                  value={activeText}
                  onChange={(e) => { setContent(e.target.value); setUseSample(false); }}
                  disabled={isExtracting}
                />
                {isExtracting && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                      <span className="font-medium text-muted-foreground">Extracting text...</span>
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="p-3.5 sm:p-4 bg-muted/20 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${wordCount < 50 ? 'border-warning/50 bg-warning/10 text-warning' : 'border-border/50 bg-background text-muted-foreground'}`}>
                    {wordCount} words
                  </span>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => navigate(`/humanizer?text=${encodeURIComponent(activeText)}`)}
                    disabled={!activeText.trim()}
                    variant="outline"
                    className="flex-1 sm:flex-none h-9 px-4 font-bold text-xs border-primary/20 text-primary hover:bg-primary/10 rounded-xl"
                  >
                    <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Humanize
                  </Button>
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || (!content.trim() && !useSample) || isExtracting}
                    className="flex-1 sm:flex-none h-9 px-5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-hover transition-all"
                  >
                    {isAnalyzing ? (
                      <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Analyzing...</>
                    ) : (
                      <><Shield className="w-3.5 h-3.5 mr-1.5" /> Detect AI</>
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Options */}
            <Card className="border-border/50 shadow-premium rounded-2xl bg-card p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5"><Type className="w-3.5 h-3.5" /> Content Type</label>
                  <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                    <SelectTrigger className="h-9 rounded-lg text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map((ct) => (
                        <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5"><Languages className="w-3.5 h-3.5" /> Language Hint</label>
                  <Select value={languageHint} onValueChange={setLanguageHint}>
                    <SelectTrigger className="h-9 rounded-lg text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_HINTS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Complete Results Workspace in Required Hierarchy */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Level 1 & Level 2: Dual Detector Results (Overall result, Balanced & Strict side-by-side) */}
            {(balancedLoading || aggressiveLoading || balancedResult || aggressiveResult || balancedError || aggressiveError) ? (
              <DualDetectorResults
                balancedResult={balancedResult}
                balancedLoading={balancedLoading}
                balancedError={balancedError}
                onBalancedRetry={handleBalancedRetry}
                aggressiveResult={aggressiveResult}
                aggressiveLoading={aggressiveLoading}
                aggressiveError={aggressiveError}
                onAggressiveRetry={handleAggressiveRetry}
              />
            ) : (
              analysisError ? (
                <Card className="border-destructive/30 bg-destructive/5 shadow-premium h-full flex flex-col items-center justify-center py-16 px-6 rounded-2xl">
                  <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                  </div>
                  <p className="text-lg font-extrabold text-foreground mb-2 text-center">Detection failed</p>
                  <p className="text-sm text-muted-foreground text-center max-w-[320px] text-pretty mb-6">
                    {analysisError.message}
                  </p>
                  {analysisError.canRetry && (
                    <Button onClick={handleAnalyze} variant="default" className="rounded-xl">
                      <RefreshCw className="w-4 h-4 mr-2" /> Retry
                    </Button>
                  )}
                </Card>
              ) : (
                <Card className="border-border/50 shadow-premium h-full flex flex-col items-center justify-center py-24 rounded-2xl bg-card">
                  <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Shield className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-xl font-extrabold text-foreground mb-2">Ready to Analyze</p>
                  <p className="text-sm text-muted-foreground text-center max-w-[260px] text-pretty">
                    Enter your text and click Detect AI to see detailed metrics and sentence breakdown.
                  </p>
                </Card>
              )
            )}

            {/* Extended analysis cards — Levels 3 through 7 */}
            {result && (
              <div className="space-y-6 animate-slide-in">
                {/* Action toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopySummary} className="rounded-xl gap-1.5 text-xs font-semibold h-8">
                      <Copy className="w-3.5 h-3.5" /> Copy Summary
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadReport} className="rounded-xl gap-1.5 text-xs font-semibold h-8">
                      <Download className="w-3.5 h-3.5" /> Download Report
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-xl gap-1.5 text-xs font-semibold h-8">
                      <Share2 className="w-3.5 h-3.5" /> Copy Text
                    </Button>
                  </div>
                </div>

                {/* Level 3: Language / content metadata & text sufficiency */}
                <Card className="border-border/50 shadow-premium rounded-2xl bg-card">
                  <CardContent className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Badge variant="outline" className="px-3 py-1 text-xs gap-1.5 font-semibold">
                        <Globe className="w-3.5 h-3.5 text-primary" />
                        {result.language.primary?.name || 'Unknown'}
                        {result.language.primary?.confidence != null && (
                          <span className="text-muted-foreground ml-1 font-normal">({result.language.primary.confidence}%)</span>
                        )}
                      </Badge>
                      {result.language.secondary.length > 0 && (
                        <Badge variant="secondary" className="px-3 py-1 text-xs gap-1.5 font-semibold">
                          <Languages className="w-3.5 h-3.5" /> Multilingual
                        </Badge>
                      )}
                      {result.language.codeSwitched && (
                        <Badge variant="outline" className="px-3 py-1 text-xs gap-1.5 font-semibold text-warning border-warning/30">
                          <AlertTriangle className="w-3.5 h-3.5" /> Code-switched
                        </Badge>
                      )}
                      <Badge variant="outline" className="px-3 py-1 text-xs gap-1.5 font-semibold">
                        <Type className="w-3.5 h-3.5 text-primary" /> {CONTENT_TYPES.find((c) => c.value === result.contentType)?.label || result.contentType}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>
                        {result.textSufficiency.status === 'ok'
                          ? `Text length sufficient (${result.textSufficiency.wordCount} words).`
                          : `Text is ${result.textSufficiency.status}. Min recommended: ${result.textSufficiency.minRecommended} words.`}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Warnings */}
                {result.warnings.length > 0 && (
                  <div className="space-y-2">
                    {result.warnings.map((w, i) => (
                      <div key={i} className={`rounded-xl border p-3 text-xs sm:text-sm flex gap-3 ${
                        w.severity === 'critical'
                          ? 'bg-destructive/10 border-destructive/20 text-destructive'
                          : w.severity === 'warning'
                          ? 'bg-warning/10 border-warning/20 text-warning'
                          : 'bg-muted/30 border-border/50 text-muted-foreground'
                      }`}>
                        {w.severity === 'critical' ? <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" /> : <Info className="w-4 h-4 shrink-0 mt-0.5" />}
                        <span>{w.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Level 4: Explanation & Factors */}
                <Card className="border-border/50 shadow-premium rounded-2xl bg-card">
                  <CardHeader className="pb-3 pt-4 sm:pt-5 px-5 sm:px-6 border-b border-border/50 bg-background/50">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" /> Result Explanation & Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 sm:p-6">
                    <Tabs value={explanationMode} onValueChange={(v) => setExplanationMode(v as 'simple' | 'technical')} className="w-full">
                      <TabsList className="mb-4 grid w-full grid-cols-2">
                        <TabsTrigger value="simple" className="text-xs">Simple Overview</TabsTrigger>
                        <TabsTrigger value="technical" className="text-xs">Technical Details</TabsTrigger>
                      </TabsList>
                      <TabsContent value="simple" className="text-xs sm:text-sm text-foreground/85 leading-relaxed">
                        {result.explanation.simple}
                      </TabsContent>
                      <TabsContent value="technical" className="text-xs sm:text-sm text-foreground/85 leading-relaxed">
                        {result.explanation.technical || 'Technical details are not available for this result.'}
                      </TabsContent>
                    </Tabs>
                    {result.explanation.factors.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-border/40 flex flex-wrap gap-2">
                        {result.explanation.factors.map((f, i) => (
                          <Badge key={i} variant="outline" className={`text-xs ${
                            f.direction === 'ai' ? 'border-destructive/30 text-destructive bg-destructive/5' :
                            f.direction === 'human' ? 'border-success/30 text-success bg-success/5' :
                            'border-warning/30 text-warning bg-warning/5'
                          }`}>
                            {f.label} · {f.impact}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Level 5: Deeper Analysis (Linguistic Metrics, Pattern Profile & Humanization, Paragraph Timeline, Flagged Passages, Limitations) */}
                {stats && (
                  <Card className="border-border/50 shadow-premium rounded-2xl bg-card">
                    <CardHeader className="pb-3 pt-4 sm:pt-5 px-5 sm:px-6 border-b border-border/50 bg-background/50">
                      <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-primary" /> Linguistic Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 sm:p-6">
                      <div className="space-y-4">
                        {[
                          { label: 'Readability', value: stats.readability, color: 'bg-primary' },
                          { label: 'Burstiness (Human trait)', value: stats.burstiness, color: 'bg-success' },
                          { label: 'Predictability (AI trait)', value: stats.perplexity, color: 'bg-warning' },
                          { label: 'Complexity variance', value: Math.min(100, stats.complexity), color: 'bg-primary/50' },
                        ].map((m) => (
                          <div key={m.label}>
                            <div className="flex justify-between text-xs sm:text-sm mb-1 font-semibold">
                              <span className="text-muted-foreground">{m.label}</span>
                              <span className="text-foreground">{m.value}/100</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div className={`${m.color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${Math.max(1, m.value)}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Pattern Profile & Humanization */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="border-border/50 shadow-premium rounded-2xl bg-card">
                    <CardContent className="p-5 flex flex-col justify-between h-full">
                      <div className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2 mb-3">
                        <Fingerprint className="w-4 h-4 text-primary" /> Pattern Profile
                      </div>
                      <div>
                        {result.modelFamilies.length > 0 ? (
                          <>
                            <div className="text-sm sm:text-base font-black text-foreground">{result.modelFamilies[0].family}</div>
                            <Badge variant="secondary" className="mt-2 text-xs">{result.modelFamilies[0].probability}% Match</Badge>
                            {result.modelFamilies[0].signals.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-2">{result.modelFamilies[0].signals[0]}</div>
                            )}
                          </>
                        ) : (
                          <div className="text-xs sm:text-sm text-muted-foreground">No strong pattern signal detected.</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 shadow-premium rounded-2xl bg-card">
                    <CardContent className="p-5 flex flex-col justify-between h-full">
                      <div className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2 mb-3">
                        <Bot className="w-4 h-4 text-warning" /> Humanization Signal
                      </div>
                      <div>
                        <div className="text-sm sm:text-base font-black text-warning">{result.humanization.detected ? `${result.humanization.confidence}%` : 'None'}</div>
                        <div className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {result.humanization.explanation}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Paragraph Timeline */}
                <Card className="border-border/50 shadow-premium rounded-2xl bg-card">
                  <CardHeader className="pb-3 pt-4 sm:pt-5 px-5 sm:px-6 border-b border-border/50 bg-background/50">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Network className="w-4 h-4 text-primary" /> Paragraph Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-end gap-1 h-16 w-full">
                      {result.paragraphs.map((p, i) => (
                        <TooltipProvider key={i}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`flex-1 rounded-sm transition-all hover:opacity-80 ${
                                  p.verdict === 'likely-ai' || p.verdict === 'mostly-ai-human-edited'
                                    ? 'bg-destructive'
                                    : p.verdict === 'mixed'
                                    ? 'bg-warning'
                                    : 'bg-success'
                                }`}
                                style={{ height: `${Math.max(10, p.aiProbability)}%` }}
                              />
                            </TooltipTrigger>
                            <TooltipContent className="bg-foreground text-background font-semibold border-none text-xs">
                              Paragraph {i + 1}: {p.verdict.replace(/-/g, ' ')} ({p.aiProbability}% AI)
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Flagged Passages */}
                {result.highlights.length > 0 && (
                  <Card className="border-border/50 shadow-premium rounded-2xl bg-card">
                    <CardHeader className="pb-3 pt-4 sm:pt-5 px-5 sm:px-6 border-b border-border/50 bg-background/50">
                      <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                        <TextSearch className="w-4 h-4 text-primary" /> Flagged Passages
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 sm:p-6 space-y-3">
                      {result.highlights.slice(0, 6).map((h, i) => (
                        <div key={i} className={`p-3 rounded-xl text-xs sm:text-sm ${passageClass(h.verdict)}`}>
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-[10px] uppercase">{h.verdict.replace(/-/g, ' ')}</Badge>
                            <span className="text-xs opacity-70">{h.confidence}% confidence</span>
                          </div>
                          <p className="line-clamp-3">{h.text}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Limitations */}
                {result.limitations.length > 0 && (
                  <Card className="border-border/50 shadow-premium rounded-2xl bg-card">
                    <CardHeader className="pb-3 pt-4 sm:pt-5 px-5 sm:px-6 border-b border-border/50 bg-background/50">
                      <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-warning" /> Limitations & Interpretation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 sm:p-6">
                      <ul className="space-y-2 text-xs sm:text-sm text-foreground/80">
                        {result.limitations.map((l, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
                            <span>{l}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Level 6: Next Action — Optimize in SEO Assistant CTA */}
                <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-background shadow-premium rounded-2xl overflow-hidden">
                  <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wide">
                          Content Optimization
                        </Badge>
                        <span className="text-xs font-semibold text-muted-foreground">For Bloggers, Writers & Content Teams</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-foreground">
                        Ready to improve this content?
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
                        Writing for a blog, client, agency or SEO campaign? Continue with SEO, readability, plagiarism, content uniqueness and publishing-readiness analysis.
                      </p>
                    </div>
                    <div className="shrink-0">
                      <Button
                        onClick={handleOptimizeInSEOAssistant}
                        className="w-full sm:w-auto h-9 sm:h-10 px-4 sm:px-5 font-bold text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-xl gap-2"
                      >
                        <span>Optimize in SEO Assistant &rarr;</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Level 7: Detailed Evidence — Sentence-Level Analysis (Collapsed by default) */}
                <Card className="border-border/50 shadow-premium rounded-2xl bg-card overflow-hidden">
                  <CardHeader className="bg-muted/20 pb-3.5 pt-4 sm:pt-5 px-5 sm:px-6 border-b border-border/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                        <TextSearch className="w-4 h-4 text-primary" />
                        <span>Sentence-Level Analysis</span>
                        <Badge variant="secondary" className="text-xs font-semibold">
                          {result.sentences.length}
                        </Badge>
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSentenceAnalysisExpanded(!isSentenceAnalysisExpanded)}
                        className="h-8 rounded-lg text-xs font-semibold gap-1.5 border-border hover:bg-muted"
                      >
                        <span>{isSentenceAnalysisExpanded ? 'Hide Sentence Analysis' : `Explore ${result.sentences.length} sentence-level results`}</span>
                        {isSentenceAnalysisExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  {isSentenceAnalysisExpanded && (
                    <CardContent className="p-5 sm:p-6 space-y-4 animate-slide-in">
                      {/* Filter & Legend */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/40 text-xs font-semibold text-muted-foreground">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-success/80"></span> Human</span>
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-warning/80"></span> Mixed</span>
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-destructive/80"></span> AI</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Filter:</span>
                          <select
                            value={sentenceFilter}
                            onChange={(e) => setSentenceFilter(e.target.value as 'all' | Verdict)}
                            className="h-7 rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="all">All sentences ({result.sentences.length})</option>
                            <option value="likely-human">Likely human ({result.sentences.filter(s => s.verdict === 'likely-human').length})</option>
                            <option value="mixed">Mixed ({result.sentences.filter(s => s.verdict === 'mixed').length})</option>
                            <option value="likely-ai">Likely AI ({result.sentences.filter(s => s.verdict === 'likely-ai').length})</option>
                          </select>
                        </div>
                      </div>

                      {/* Scrollable Sentence Container */}
                      <div className="max-h-[520px] overflow-y-auto pr-2 text-sm sm:text-base leading-loose text-foreground/85">
                        <TooltipProvider delayDuration={150}>
                          {result.sentences
                            .filter((s) => sentenceFilter === 'all' || s.verdict === sentenceFilter)
                            .map((s, i) => (
                            <Tooltip key={i}>
                              <TooltipTrigger asChild>
                                <span className={`cursor-pointer transition-colors duration-200 rounded px-1 mx-[1px] ${passageClass(s.verdict)}`}>
                                  {s.text}{' '}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="p-3 w-64 bg-foreground border-none shadow-xl rounded-xl text-background">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center pb-2 border-b border-background/20">
                                    <span className="font-bold text-sm">Verdict</span>
                                    <VerdictBadge verdict={s.verdict} ai={s.aiProbability} />
                                  </div>
                                  <div className="text-xs text-background/80 leading-relaxed font-medium">
                                    {s.explanation}
                                  </div>
                                  <div className="grid grid-cols-3 gap-1 text-xs text-center pt-1">
                                    <div><div className="font-bold">{s.aiProbability}%</div><div className="text-background/60">AI</div></div>
                                    <div><div className="font-bold">{s.humanProbability}%</div><div className="text-background/60">Human</div></div>
                                    <div><div className="font-bold">{s.mixedProbability}%</div><div className="text-background/60">Mixed</div></div>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </TooltipProvider>
                        {result.sentences.filter((s) => sentenceFilter !== 'all' && s.verdict === sentenceFilter).length === 0 && (
                          <p className="text-sm text-muted-foreground py-4 text-center">No sentences match the selected filter.</p>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Diagnostics (dev only) */}
                <DetectorDiagnosticsPanel result={balancedResult!} />

                {/* Feedback */}
                {savedResultId ? (
                  <DetectorFeedback resultId={savedResultId} />
                ) : (
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4 text-xs text-muted-foreground flex items-start gap-2">
                    <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground mb-1">Zero-retention mode is on</p>
                      This result was analyzed in memory only and no record was stored, so feedback is not available. You can change this in privacy settings.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
