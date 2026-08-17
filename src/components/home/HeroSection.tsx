import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Shield, FileText, ArrowRight, Loader2, CheckCircle2, AlertTriangle,
  Globe, Activity, Zap, Languages,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useUpgradeModal } from '@/hooks/useUpgradeModal';
import { runBalancedDetector, type BalancedDetectorResult } from '@/lib/detection/balancedDetectorService';
import { runAggressiveDetector, type AggressiveDetectorResult } from '@/lib/detection/aggressiveDetectorService';

const SAMPLE_TEXT = `Artificial intelligence has revolutionized the way businesses operate in the modern era. The implementation of machine learning algorithms enables companies to process vast amounts of data with unprecedented efficiency. Furthermore, natural language processing capabilities allow for automated content generation that is indistinguishable from human writing. Organizations leveraging these technologies experience substantial improvements in productivity metrics and operational cost reduction. The utilization of AI-powered tools represents a paradigm shift in how enterprises approach problem-solving and decision-making processes.`;

const BADGES = ['Advanced Multilingual AI Detection', 'Dual Detection', 'Sentence Analysis', 'Explainable Results'];

function ScoreGauge({ value, color }: { value: number; color: string }) {
  return (
    <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  );
}

function ResultCard({
  title, subtitle, ai, human, mixed, verdict, confidence, language,
  color, explanation,
}: {
  title: string; subtitle?: string; ai: number; human: number; mixed?: number;
  verdict: string; confidence?: number; language: string; color: string;
  explanation: string;
}) {
  const mixedLabel = mixed !== undefined ? `${mixed}%` : '—';
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Badge variant="outline" className="text-xs shrink-0">{verdict}</Badge>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-3xl font-extrabold" style={{ color }}>{ai}%</div>
        <div className="flex-1 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">AI</span>
            <span className="font-semibold">{ai}%</span>
          </div>
          <ScoreGauge value={ai} color={color} />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Human</span>
            <span className="font-semibold">{human}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Mixed</span>
            <span className="font-semibold">{mixedLabel}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {confidence != null && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Activity className="w-3.5 h-3.5" />
            Confidence {confidence}%
          </div>
        )}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Globe className="w-3.5 h-3.5" />
          {language || 'Unknown'}
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{explanation}</p>
    </div>
  );
}

export default function HeroSection() {
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [balancedResult, setBalancedResult] = useState<BalancedDetectorResult | null>(null);
  const [aggressiveResult, setAggressiveResult] = useState<AggressiveDetectorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { openUpgradeModal } = useUpgradeModal();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = (content.match(/\S+/g) || []).length;
  const hasResult = balancedResult || aggressiveResult;

  const handleDetect = async () => {
    if (content.length < 50) {
      toast.error('Please enter at least 50 characters for accurate detection.');
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setBalancedResult(null);
    setAggressiveResult(null);
    try {
      const [b, a] = await Promise.all([
        runBalancedDetector(content),
        runAggressiveDetector(content),
      ]);
      setBalancedResult(b);
      setAggressiveResult(a);
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err && (err as any).code === 'UPGRADE_REQUIRED') {
        openUpgradeModal({
          featureName: 'AI Detector',
          trigger: ((err as any).details?.limit as number | null) === 0 ? 'limit_reached' : 'pro_feature',
          remaining: (err as any).details?.remaining as number | null,
          limit: (err as any).details?.limit as number | null,
        });
      } else if (err && typeof err === 'object' && 'code' in err && (err as any).code === 'AUTH_REQUIRED') {
        toast.error('Please sign in to analyze text.');
        navigate('/login?redirect=/');
      } else {
        const message = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
        setError(message);
        toast.error(message);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const insertSample = () => {
    setContent(SAMPLE_TEXT);
    setBalancedResult(null);
    setAggressiveResult(null);
  };

  const viewFull = () => {
    navigate(`/detector?text=${encodeURIComponent(content)}`);
  };

  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-background">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-20 bg-primary rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-semibold text-primary mb-5 uppercase tracking-wide">
            <Languages className="w-3.5 h-3.5" />
            Advanced Multilingual AI Detection
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-balance text-foreground mb-5 leading-tight">
            AI Detector for <span className="text-primary">ChatGPT, AI & Human-Written Content</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            Detect AI-generated, human-written and mixed content across multiple languages with independent detection modes, sentence-level analysis and explainable results.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            {BADGES.slice(1).map((b) => (
              <span key={b} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/60 bg-muted/30 text-xs font-medium text-muted-foreground">
                {b === 'Dual Detection' && <Shield className="w-3 h-3" />}
                {b === 'Sentence Analysis' && <Zap className="w-3 h-3" />}
                {b === 'Explainable Results' && <Activity className="w-3 h-3" />}
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Detector */}
        <div className="max-w-4xl mx-auto bg-card rounded-2xl shadow-premium border border-border/50 overflow-hidden text-left">
          <div className="p-4 bg-muted/30 border-b border-border/50 flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={insertSample} className="text-xs font-medium rounded-lg">
              <FileText className="w-3.5 h-3.5 mr-1.5" /> Try Sample
            </Button>
            <div className="text-xs font-semibold text-muted-foreground bg-background px-3 py-1.5 rounded-md border border-border/50">
              {wordCount} / 2,000 words
            </div>
          </div>

          <div className="p-5 md:p-6">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setBalancedResult(null);
                setAggressiveResult(null);
                setError(null);
              }}
              placeholder="Paste your text here for instant AI detection..."
              className="min-h-[180px] resize-y border-none focus-visible:ring-0 p-0 text-base leading-relaxed shadow-none bg-transparent placeholder:text-muted-foreground/60"
            />

            {error && (
              <div className="mt-4 bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-sm text-destructive flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="text-foreground">{error}</span>
              </div>
            )}

            {/* Dual results */}
            {hasResult && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {balancedResult && (
                  <ResultCard
                    title="Balanced Detector"
                    subtitle="Recommended"
                    ai={balancedResult.ai}
                    human={balancedResult.human}
                    mixed={balancedResult.mixed}
                    verdict={balancedResult.verdict.replace(/-/g, ' ')}
                    confidence={balancedResult.confidence}
                    language={balancedResult.language}
                    color="hsl(var(--primary))"
                    explanation="Calibrated for balanced classification and reduced false positives."
                  />
                )}
                {aggressiveResult && (
                  <ResultCard
                    title="High-Sensitivity Analysis — Strict"
                    ai={aggressiveResult.ai}
                    human={aggressiveResult.human}
                    verdict={`${aggressiveResult.risk} Risk`}
                    language={balancedResult?.language || 'Unknown'}
                    color="hsl(var(--destructive))"
                    explanation="A stricter, higher-sensitivity screen that flags weaker AI-like patterns. It is not inherently more accurate and may produce more false positives than the Balanced result."
                  />
                )}
              </div>
            )}

            {hasResult && (
              <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                <Button onClick={viewFull} className="w-full sm:w-auto font-semibold">
                  View Full Analysis <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  Sentence breakdown, signals, detailed report, and export on the detector page.
                </p>
              </div>
            )}
          </div>

          <div className="p-4 bg-muted/20 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-success" /> Secure</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Instant</span>
              <span className="flex items-center gap-1.5 hidden sm:inline-flex"><Globe className="w-4 h-4 text-primary" /> Multilingual</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                size="lg"
                onClick={handleDetect}
                disabled={!content || isAnalyzing}
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-hover transition-all"
              >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Shield className="w-5 h-5 mr-2" /> Detect AI Content Free</>}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/guides/understanding-ai-detection-scores')}
                className="flex-1 sm:flex-none font-semibold rounded-xl"
              >
                How AI Detection Works
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
