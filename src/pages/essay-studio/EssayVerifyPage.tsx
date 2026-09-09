// EssayVerifyPage — dual-engine AI detection analysis
import { useState } from 'react';
import { useEssayStudio } from '@/contexts/EssayStudioContext';
import { essayService } from '@/lib/essay/essayService';
import { analyzeText } from '@/lib/detection/detectorApi';
import { analyzeAIRisk } from '@/pages/seo-assistant/analysisEngine';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Shield, AlertTriangle, CheckCircle, Loader2, RefreshCw,
  Info, ChevronRight, Scale, Zap,
} from 'lucide-react';

interface BalancedResult {
  overall?: { ai_probability?: number; human_probability?: number; label?: string };
  summary?: string;
  [key: string]: unknown;
}

interface AggressiveResult {
  aiScore?: number;
  humanScore?: number;
  riskLevel?: string;
  recommendations?: string[];
  [key: string]: unknown;
}

function getRiskColor(score: number) {
  if (score <= 30) return 'text-success';
  if (score <= 60) return 'text-warning';
  return 'text-destructive';
}

function getRiskBadge(score: number) {
  if (score <= 30) return { label: 'Low Risk', variant: 'secondary' as const };
  if (score <= 60) return { label: 'Moderate', variant: 'outline' as const };
  return { label: 'High Risk', variant: 'destructive' as const };
}

function ScoreGauge({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${color}`}>{score}%</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

export default function EssayVerifyPage() {
  const { essay, content, goToPhase } = useEssayStudio();
  const [balancedResult, setBalancedResult] = useState<BalancedResult | null>(null);
  const [aggressiveResult, setAggressiveResult] = useState<AggressiveResult | null>(null);
  const [runningBalanced, setRunningBalanced] = useState(false);
  const [runningAggressive, setRunningAggressive] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const MIN_WORDS = 50;

  const runBalanced = async () => {
    if (!essay) return;
    if (wordCount < MIN_WORDS) {
      toast.error(`Please write at least ${MIN_WORDS} words before running analysis.`);
      return;
    }
    setRunningBalanced(true);
    try {
      const result = await analyzeText(content, { sentenceLevel: false, paragraphLevel: false });
      setBalancedResult(result as unknown as BalancedResult);
      await essayService.logEvent(essay.id, 'detector_analysis', 'Balanced analysis run', { engine: 'balanced' }, wordCount);
      await essayService.saveDetectorResult(essay.id, {
        balanced_result: result as unknown as Record<string, unknown>,
        aggressive_result: aggressiveResult as Record<string, unknown> | null,
      });
      setLastAnalyzed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
      toast.error('Balanced analysis failed. Check your connection and try again.');
    } finally {
      setRunningBalanced(false);
    }
  };

  const runAggressive = async () => {
    if (!essay) return;
    if (wordCount < MIN_WORDS) {
      toast.error(`Please write at least ${MIN_WORDS} words before running analysis.`);
      return;
    }
    setRunningAggressive(true);
    try {
      const result = await analyzeAIRisk(content);
      setAggressiveResult(result as unknown as AggressiveResult);
      await essayService.logEvent(essay.id, 'detector_analysis', 'Strict analysis run', { engine: 'aggressive' }, wordCount);
      await essayService.saveDetectorResult(essay.id, {
        balanced_result: balancedResult as Record<string, unknown> | null,
        aggressive_result: result as unknown as Record<string, unknown>,
      });
      setLastAnalyzed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
      toast.error('Strict analysis failed. Please try again.');
    } finally {
      setRunningAggressive(false);
    }
  };

  const balancedAI = typeof balancedResult?.overall?.ai_probability === 'number'
    ? Math.round(balancedResult.overall.ai_probability * 100)
    : null;
  const aggressiveScore = typeof aggressiveResult?.aiScore === 'number'
    ? Math.round(aggressiveResult.aiScore)
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" /> AI Detection Verification
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Run both detection engines to get a complete picture. Results are probabilistic evidence — not proof of misconduct.
        </p>
      </div>

      {/* Disclaimer */}
      <Alert className="mb-6 border-warning/30 bg-warning/5">
        <Info className="h-4 w-4 text-warning" />
        <AlertDescription className="text-sm text-warning/90">
          <strong>Important:</strong> AI detection scores are probabilistic estimates, not conclusive proof. Many factors — writing style, academic vocabulary, topic complexity — affect scores. Never use detection results alone to draw conclusions about academic integrity.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Balanced Engine */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Scale className="h-4 w-4 text-primary" /> Balanced Analysis
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Primary calibrated detector — optimized to reduce false positives on academic writing.
                </CardDescription>
              </div>
              {balancedAI !== null && (
                <Badge variant={getRiskBadge(balancedAI).variant} className="shrink-0 text-xs">
                  {getRiskBadge(balancedAI).label}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {balancedAI !== null ? (
              <div className="space-y-3">
                <div className="flex justify-between gap-4">
                  <ScoreGauge score={balancedAI} label="AI Probability" color={getRiskColor(balancedAI)} />
                  <ScoreGauge
                    score={100 - balancedAI}
                    label="Human Probability"
                    color={getRiskColor(100 - balancedAI) === 'text-destructive' ? 'text-muted-foreground' : 'text-success'}
                  />
                </div>
                <Progress value={balancedAI} className="h-2" />
                {balancedResult?.overall?.label && (
                  <p className="text-xs text-muted-foreground text-center">{String(balancedResult.overall.label)}</p>
                )}
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Run analysis to see results
              </div>
            )}
            <Button
              onClick={runBalanced}
              disabled={runningBalanced || wordCount < MIN_WORDS}
              className="w-full mt-3"
              variant={balancedAI !== null ? 'outline' : 'default'}
            >
              {runningBalanced
                ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Analyzing…</>
                : balancedAI !== null
                ? <><RefreshCw className="h-3.5 w-3.5 mr-2" /> Re-analyze</>
                : <><Shield className="h-3.5 w-3.5 mr-2" /> Run Balanced Analysis</>
              }
            </Button>
          </CardContent>
        </Card>

        {/* Strict Engine */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-warning" /> Strict Analysis
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  High-sensitivity heuristic detector — more aggressive, may flag academic writing patterns as AI-like.
                </CardDescription>
              </div>
              {aggressiveScore !== null && (
                <Badge variant={getRiskBadge(aggressiveScore).variant} className="shrink-0 text-xs">
                  {getRiskBadge(aggressiveScore).label}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {aggressiveScore !== null ? (
              <div className="space-y-3">
                <div className="flex justify-between gap-4">
                  <ScoreGauge score={aggressiveScore} label="AI Risk Score" color={getRiskColor(aggressiveScore)} />
                  <ScoreGauge
                    score={100 - aggressiveScore}
                    label="Human Score"
                    color={getRiskColor(100 - aggressiveScore) === 'text-destructive' ? 'text-muted-foreground' : 'text-success'}
                  />
                </div>
                <Progress value={aggressiveScore} className="h-2" />
                {aggressiveResult?.riskLevel && (
                  <p className="text-xs text-muted-foreground text-center capitalize">{String(aggressiveResult.riskLevel)} risk level</p>
                )}
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Run analysis to see results
              </div>
            )}
            <Button
              onClick={runAggressive}
              disabled={runningAggressive || wordCount < MIN_WORDS}
              className="w-full mt-3"
              variant={aggressiveScore !== null ? 'outline' : 'default'}
            >
              {runningAggressive
                ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Analyzing…</>
                : aggressiveScore !== null
                ? <><RefreshCw className="h-3.5 w-3.5 mr-2" /> Re-analyze</>
                : <><Zap className="h-3.5 w-3.5 mr-2" /> Run Strict Analysis</>
              }
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Aggressive recommendations */}
      {aggressiveResult?.recommendations && Array.isArray(aggressiveResult.recommendations) && aggressiveResult.recommendations.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Strict Analysis Flags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(aggressiveResult.recommendations as string[]).slice(0, 5).map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-warning mt-0.5 shrink-0">·</span>
                  <span className="text-muted-foreground">{r}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Results summary when both run */}
      {balancedAI !== null && aggressiveScore !== null && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Both analyses completed</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Balanced: <span className={getRiskColor(balancedAI)}>{balancedAI}% AI probability</span>
                  {' · '}
                  Strict: <span className={getRiskColor(aggressiveScore)}>{aggressiveScore}% AI risk</span>
                  {lastAnalyzed && <span> · Analyzed at {lastAnalyzed}</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Discrepancies between engines are normal. The Strict engine is more sensitive to patterns common in both AI and formal academic writing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {wordCount < MIN_WORDS && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Your essay needs at least {MIN_WORDS} words to run detection. Current: {wordCount} words.
          </AlertDescription>
        </Alert>
      )}

      <Separator className="my-4" />
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => goToPhase('write')}>
          Back to Writing
        </Button>
        <Button onClick={() => goToPhase('improve')}>
          Analyze Quality <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
