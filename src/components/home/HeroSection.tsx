import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Shield, FileText, ArrowRight, Loader2, CheckCircle2, AlertTriangle,
  Globe, Activity, Zap, Languages, Sparkles, UserPlus, ArrowUpRight, Lock, Coins,
  Trash2, RefreshCw, Play
} from 'lucide-react';
import { PromoVideoModal } from '@/components/promo/PromoVideoModal';
import { StudentModeToggle } from '@/components/student-policy/StudentModeToggle';
import { StudentModePanel } from '@/components/student-policy/StudentModePanel';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useUpgradeModal } from '@/hooks/useUpgradeModal';
import { useEntitlement } from '@/hooks/useEntitlement';
import { runBalancedDetector, type BalancedDetectorResult } from '@/lib/detection/balancedDetectorService';
import { runAggressiveDetector, type AggressiveDetectorResult } from '@/lib/detection/aggressiveDetectorService';
import { preserveDraftText, getPreservedDraftText, clearPreservedDraftText } from '@/lib/visitorId';
import { calculateOperationCreditCost, isTrialEligibleOperation } from '@/lib/entitlements';

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
    <div className="rounded-xl border border-border/60 bg-card p-4 flex flex-col gap-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <Badge variant="outline" className="text-xs shrink-0 font-medium">{verdict}</Badge>
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
            <Activity className="w-3.5 h-3.5 text-primary shrink-0" />
            Confidence {confidence}%
          </div>
        )}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
          {language || 'English'}
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{explanation}</p>
    </div>
  );
}

export default function HeroSection() {
  const { user, profile } = useAuth();
  const { summary, entitlement, loading: entitlementLoading, refresh } = useEntitlement('text_detect_balanced');
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [balancedResult, setBalancedResult] = useState<BalancedDetectorResult | null>(null);
  const [aggressiveResult, setAggressiveResult] = useState<AggressiveDetectorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { openUpgradeModal } = useUpgradeModal();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isStudentModeOpen, setIsStudentModeOpen] = useState(false);

  // Restore preserved draft text if present
  useEffect(() => {
    const preserved = getPreservedDraftText('text_detect_balanced') || getPreservedDraftText();
    if (preserved && !content) {
      setContent(preserved);
      clearPreservedDraftText();
    }
  }, []);

  const wordCount = (content.match(/\S+/g) || []).length;
  const hasResult = balancedResult || aggressiveResult;
  const currentPlan = profile?.subscription_plan || (user ? 'free' : 'guest');
  const isPaid = summary?.isPaidActive ?? false;

  const trialRemaining = typeof summary?.trialChecksRemaining === 'number'
    ? summary.trialChecksRemaining
    : typeof entitlement?.trialChecksRemaining === 'number'
    ? entitlement.trialChecksRemaining
    : (user ? 4 : 1);
  const trialTotal = summary?.trialChecksTotal ?? entitlement?.trialChecksTotal ?? (user ? 5 : 1);
  const trialUsed = summary?.trialChecksUsed ?? Math.max(0, trialTotal - trialRemaining);
  const creditsBalance = summary?.creditsBalance ?? 0;
  const monthlyAllocation = summary?.monthlyCreditAllocation ?? 0;

  // Calculate allowance progress
  const progressPercent = isPaid
    ? (!monthlyAllocation || monthlyAllocation <= 0 ? 100 : Math.max(0, Math.min(100, Math.round((creditsBalance / monthlyAllocation) * 100))))
    : (!trialTotal || trialTotal <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((trialRemaining / trialTotal) * 100))));

  const isLimitReached = !entitlementLoading && (
    isPaid ? creditsBalance < 1 : trialRemaining <= 0 && creditsBalance < 1
  );

  const handleDetect = async () => {
    if (content.length < 50) {
      toast.error('Please enter at least 50 characters for accurate detection.');
      return;
    }

    if (isLimitReached) {
      if (content) {
        preserveDraftText(content, 'text_detect_balanced');
      }
      if (!user) {
        toast.error('You’ve used your free guest check. Create an account to get 4 additional free checks.');
        navigate('/signup?returnTo=' + encodeURIComponent('/'));
      } else if (!isPaid) {
        toast.error('You’ve used all your free checks. Choose a plan to continue.');
        navigate('/pricing');
      } else {
        toast.error('Monthly credit balance depleted. Please top up or renew.');
        navigate('/pricing');
      }
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setBalancedResult(null);
    setAggressiveResult(null);

    try {
      const bPromise = runBalancedDetector(content);
      const aPromise = bPromise
        .then((b) => runAggressiveDetector(content, b))
        .catch(() => runAggressiveDetector(content));
      const [b, a] = await Promise.all([bPromise, aPromise]);
      setBalancedResult(b);
      setAggressiveResult(a);
      // Refresh entitlement balance after check
      refresh();

      // Smoothly scroll results into view
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err && (err as any).code === 'UPGRADE_REQUIRED') {
        if (content) {
          preserveDraftText(content, 'text_detect_balanced');
        }
        if (!user) {
          toast.error('You’ve used your free guest check. Create an account to get 4 additional free checks.');
          navigate('/signup?returnTo=' + encodeURIComponent('/'));
        } else {
          toast.error('You’ve used all your free checks. Choose a plan to continue.');
          navigate('/pricing');
        }
      } else if (err && typeof err === 'object' && 'code' in err && (err as any).code === 'AUTH_REQUIRED') {
        if (content) {
          preserveDraftText(content, 'text_detect_balanced');
        }
        toast.error('Please sign in to continue.');
        navigate('/login?returnTo=' + encodeURIComponent('/'));
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
    setError(null);
  };

  const clearContent = () => {
    setContent('');
    setBalancedResult(null);
    setAggressiveResult(null);
    setError(null);
  };

  const viewFull = () => {
    preserveDraftText(content, 'text_detect_balanced');
    navigate(`/detector?text=${encodeURIComponent(content)}`);
  };

  return (
    <section className="relative pt-3 sm:pt-4 md:pt-6 pb-12 md:pb-16 overflow-hidden bg-background">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-15 bg-primary rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 relative z-10">
        {/* Compact Headline */}
        <div className="text-center max-w-3xl mx-auto mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight text-balance">
            AI Detector for <span className="text-primary">ChatGPT, AI & Human-Written Content</span>
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVideoModalOpen(true)}
              className="h-7 sm:h-8 rounded-full border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary font-medium text-xs gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
              aria-label="Watch how AIDetector.cx works product video"
            >
              <div className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
              </div>
              Watch how it works (60s)
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:inline">·</span>
            <span className="text-xs text-muted-foreground italic hidden sm:inline">“Before you trust it, check it.”</span>
          </div>
        </div>

        {/* Compact Server-Backed Trial Allowance Bar */}
        <div className="mb-3 rounded-xl border border-border/70 bg-card/90 shadow-sm p-2.5 sm:p-3 text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {isPaid ? (
                <Coins className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Zap className={`h-4 w-4 shrink-0 ${trialRemaining > 0 ? 'text-primary' : 'text-amber-500'}`} />
              )}
              <span className="font-semibold text-foreground truncate">
                {isPaid
                  ? `${creditsBalance} credits available · 1 credit per check`
                  : !user
                  ? trialRemaining > 0
                    ? '1 free check remaining · No signup required.'
                    : '0 free checks remaining'
                  : `${trialRemaining} of ${trialTotal} free checks remaining`}
              </span>
              <Badge variant={trialRemaining <= 0 && !isPaid ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0 capitalize shrink-0 font-medium">
                {isPaid ? `${profile?.subscription_plan || 'Pro'} Plan` : !user ? 'Guest Trial' : 'Free Account'}
              </Badge>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0">
              <div className="w-20 sm:w-28 bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${trialRemaining <= 0 && !isPaid ? 'bg-destructive' : 'bg-primary'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {!user && trialRemaining > 0 && (
                <Link
                  to="/signup"
                  onClick={() => {
                    if (content) preserveDraftText(content, 'text_detect_balanced');
                  }}
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1 text-[11px]"
                >
                  <UserPlus className="h-3 w-3" />
                  Register for 4 additional free checks
                </Link>
              )}
              {!user && trialRemaining <= 0 && (
                <Link
                  to="/signup"
                  onClick={() => {
                    if (content) preserveDraftText(content, 'text_detect_balanced');
                  }}
                  className="text-amber-600 dark:text-amber-400 font-semibold hover:underline inline-flex items-center gap-1 text-[11px]"
                >
                  <UserPlus className="h-3 w-3" />
                  Create account for 4 free checks
                </Link>
              )}
              {user && !isPaid && trialRemaining <= 0 && (
                <Link
                  to="/pricing"
                  className="text-primary hover:underline font-semibold inline-flex items-center gap-1 text-[11px]"
                >
                  <Sparkles className="h-3 w-3" />
                  Upgrade for more credits
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Working Detector Component */}
        <div className="bg-card rounded-2xl shadow-premium border border-border/60 overflow-hidden text-left">
          {/* Header toolbar */}
          <div className="px-3.5 py-2.5 bg-muted/30 border-b border-border/50 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={insertSample}
                className="h-7 text-xs font-medium rounded-lg px-2.5"
              >
                <FileText className="w-3 h-3 mr-1" /> Try Sample
              </Button>
              {content && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearContent}
                  className="h-7 text-xs font-medium text-muted-foreground hover:text-foreground px-2"
                  title="Clear text"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Clear
                </Button>
              )}
            </div>

            <div className="text-[11px] font-semibold text-muted-foreground bg-background px-2.5 py-1 rounded-md border border-border/50">
              {wordCount} / 2,000 words
            </div>
          </div>

          {/* Student Mode Guidance Entry Trigger */}
          <div className="px-3.5 sm:px-4 md:px-5 pt-2">
            <StudentModeToggle
              isOpen={isStudentModeOpen}
              onToggle={() => setIsStudentModeOpen(!isStudentModeOpen)}
            />
          </div>

          {/* Expanded Student Mode Guidance Panel */}
          {isStudentModeOpen && (
            <div className="px-3.5 sm:px-4 md:px-5 py-2">
              <StudentModePanel
                balancedResult={balancedResult}
                aggressiveResult={aggressiveResult}
                onClose={() => setIsStudentModeOpen(false)}
              />
            </div>
          )}

          {/* Textarea container */}
          <div className="p-3.5 sm:p-4 md:p-5">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setBalancedResult(null);
                setAggressiveResult(null);
                setError(null);
              }}
              placeholder="Paste your text here for instant AI detection (minimum 50 characters)..."
              className="min-h-[140px] sm:min-h-[170px] md:min-h-[190px] max-h-[260px] resize-y border-none focus-visible:ring-0 p-0 text-base leading-relaxed shadow-none bg-transparent placeholder:text-muted-foreground/60"
            />

            {error && (
              <div className="mt-3 bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-xs sm:text-sm text-destructive flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-foreground">{error}</span>
              </div>
            )}

            {/* Dual results */}
            {hasResult && (
              <div ref={resultsRef} className="mt-5 space-y-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Analysis Results</h3>
                  <Button variant="ghost" size="sm" onClick={viewFull} className="text-xs h-7 gap-1 text-primary">
                    View Sentence Breakdown <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {balancedResult && (
                    <ResultCard
                      title="Balanced Detector"
                      subtitle="Recommended standard"
                      ai={balancedResult.ai}
                      human={balancedResult.human}
                      mixed={balancedResult.mixed}
                      verdict={balancedResult.verdict.replace(/-/g, ' ')}
                      confidence={balancedResult.confidence}
                      language={balancedResult.language}
                      color="hsl(var(--primary))"
                      explanation="Calibrated for balanced classification and reduced false positives across diverse writing styles."
                    />
                  )}
                  {aggressiveResult && (
                    <ResultCard
                      title="High-Sensitivity Analysis — Strict"
                      subtitle="Strict inspection filter"
                      ai={aggressiveResult.ai}
                      human={aggressiveResult.human}
                      verdict={`${aggressiveResult.risk} Risk`}
                      language={balancedResult?.language || 'English'}
                      color="hsl(var(--destructive))"
                      explanation="A stricter, higher-sensitivity screen that flags subtle AI-like patterns. May produce false positives on formal human text."
                    />
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2">
                  <p className="text-xs text-muted-foreground">
                    Looking for full sentence highlights, confidence breakdown, and PDF export?
                  </p>
                  <Button onClick={viewFull} size="sm" className="w-full sm:w-auto font-semibold text-xs h-8">
                    View Full Analysis <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Action footer with Complete Analysis Button */}
          <div className="p-3 sm:p-4 bg-muted/20 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium order-2 sm:order-1">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-success shrink-0" /> Secure</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> Instant</span>
              <span className="flex items-center gap-1 hidden sm:inline-flex"><Globe className="w-3.5 h-3.5 text-primary shrink-0" /> Multilingual</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
              <Button
                size="default"
                onClick={handleDetect}
                disabled={(!content && !isLimitReached) || isAnalyzing}
                className={`flex-1 sm:flex-none font-bold rounded-xl shadow-hover transition-all text-sm h-10 px-5 ${
                  isLimitReached
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Analyzing Content...
                  </>
                ) : isLimitReached ? (
                  !user ? (
                    <>
                      <UserPlus className="w-4 h-4 mr-1.5" /> Guest Check Used – Sign Up for 4 More
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-1.5" /> 5 Free Checks Used – Upgrade
                    </>
                  )
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-1.5" />
                    {isPaid ? 'Analyze Text • 1 Credit' : 'Analyze Text • 1 Trial Check'}
                  </>
                )}
              </Button>
              <Button
                size="default"
                variant="outline"
                onClick={() => navigate('/pricing')}
                className="flex-1 sm:flex-none font-medium rounded-xl text-xs sm:text-sm h-10"
              >
                View Plans
              </Button>
            </div>
          </div>
        </div>

        {/* Preserved Introduction & Badges Section (Moved below detector & results) */}
        <div className="mt-8 pt-8 border-t border-border/50 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs font-semibold text-primary mb-3 uppercase tracking-wide">
            <Languages className="w-3.5 h-3.5" />
            Advanced Multilingual AI Detection
          </div>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-pretty max-w-2xl mx-auto mb-4">
            Detect AI-generated, human-written and mixed content across multiple languages with independent detection modes, sentence-level analysis and explainable results.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {BADGES.slice(1).map((b) => (
              <span key={b} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/60 bg-muted/30 text-xs font-medium text-muted-foreground">
                {b === 'Dual Detection' && <Shield className="w-3 h-3 text-primary" />}
                {b === 'Sentence Analysis' && <Zap className="w-3 h-3 text-primary" />}
                {b === 'Explainable Results' && <Activity className="w-3 h-3 text-primary" />}
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      <PromoVideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />
    </section>
  );
}
