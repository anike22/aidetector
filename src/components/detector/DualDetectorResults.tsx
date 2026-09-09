// DualDetectorResults — renders the two independent detection engine outputs.
// Balanced Detector is shown first and is visually dominant (recommended primary).
// Aggressive Detector is shown as a secondary, strictly-labelled result.
//
// Rules:
// - Scores are NEVER averaged or combined.
// - The Aggressive Detector does NOT display a Mixed score.
// - Disagreement is surfaced neutrally; neither result is changed.
// - Either engine can be in loading, error, or complete state independently.

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield, Bot, AlertTriangle, CheckCircle2, UserCheck, Info, RefreshCw,
  AlertOctagon, Activity, Zap, ShieldAlert,
} from 'lucide-react';
import type { BalancedDetectorResult } from '@/lib/detection/balancedDetectorService';
import type { AggressiveDetectorResult } from '@/lib/detection/aggressiveDetectorService';

// ─── Shared helpers ────────────────────────────────────────────────────────────

type Verdict = BalancedDetectorResult['verdict'];

function ScoreGauge({ value, color }: { value: number; color: string }) {
  const radius = 52;
  const stroke = 8;
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

function gaugeColor(aiPct: number): string {
  if (aiPct >= 70) return 'hsl(var(--destructive))';
  if (aiPct >= 45) return 'hsl(var(--warning))';
  return 'hsl(var(--success))';
}

function verdictLabel(verdict: string): string {
  const map: Record<string, string> = {
    'likely-human': 'Likely Human',
    'mostly-human-ai-assisted': 'Mostly Human, AI-Assisted',
    'mixed': 'Mixed Human & AI',
    'mostly-ai-human-edited': 'Mostly AI, Human-Edited',
    'likely-ai': 'Likely AI-Generated',
    'inconclusive': 'Inconclusive',
    'insufficient-text': 'Insufficient Text',
  };
  return map[verdict] || verdict.replace(/-/g, ' ');
}

function verdictColorClass(verdict: string): string {
  if (verdict === 'likely-human' || verdict === 'mostly-human-ai-assisted')
    return 'bg-success/10 text-success border-success/20';
  if (verdict === 'mixed' || verdict === 'mostly-ai-human-edited')
    return 'bg-warning/10 text-warning border-warning/20';
  if (verdict === 'likely-ai')
    return 'bg-destructive/10 text-destructive border-destructive/20';
  return 'bg-muted/20 text-muted-foreground border-border';
}

function riskColorClass(risk: string): string {
  if (risk === 'Low') return 'bg-success/10 text-success border-success/20';
  if (risk === 'Medium') return 'bg-warning/10 text-warning border-warning/20';
  return 'bg-destructive/10 text-destructive border-destructive/20';
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const icons: Record<string, React.ElementType> = {
    'likely-human': UserCheck,
    'mostly-human-ai-assisted': CheckCircle2,
    'mixed': AlertTriangle,
    'mostly-ai-human-edited': AlertTriangle,
    'likely-ai': Bot,
    'inconclusive': AlertOctagon,
    'insufficient-text': AlertOctagon,
  };
  const Icon = icons[verdict] || AlertOctagon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${verdictColorClass(verdict)}`}>
      <Icon className="w-3.5 h-3.5" /> {verdictLabel(verdict)}
    </span>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const Icon = risk === 'Low' ? CheckCircle2 : AlertTriangle;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${riskColorClass(risk)}`}>
      <Icon className="w-3 h-3" /> {risk} Risk
    </span>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1 font-semibold">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">{value}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all duration-700`} style={{ width: `${Math.max(1, value)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─── Disagreement detection ────────────────────────────────────────────────────

function shouldShowDisagreement(
  balanced: BalancedDetectorResult,
  aggressive: AggressiveDetectorResult
): boolean {
  // Condition 1: AI scores differ by ≥25pp
  if (Math.abs(balanced.ai - aggressive.ai) >= 25) return true;

  // Condition 2: One says Human while the other says AI
  const bHuman = balanced.ai < 40;
  const bAi = balanced.ai >= 65;
  const aHuman = aggressive.ai < 40;
  const aAi = aggressive.ai >= 65;
  if ((bHuman && aAi) || (bAi && aHuman)) return true;

  // Condition 3: Verdicts conflict (human-family vs ai-family)
  const humanFamily = ['likely-human', 'mostly-human-ai-assisted'];
  const aiFamily = ['likely-ai', 'mostly-ai-human-edited'];
  const bInHuman = humanFamily.includes(balanced.verdict);
  const bInAi = aiFamily.includes(balanced.verdict);
  const aInHuman = aggressive.ai < 40;
  const aInAi = aggressive.ai >= 60;
  if ((bInHuman && aInAi) || (bInAi && aInHuman)) return true;

  // Condition 4: Balanced says Mixed while aggressive says high AI (≥65)
  if (balanced.verdict === 'mixed' && aggressive.ai >= 65) return true;

  return false;
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function EngineLoadingCard({ label, description }: { label: string; description: string }) {
  return (
    <Card className="border-border/50 shadow-premium rounded-2xl bg-card animate-pulse">
      <CardHeader className="pb-4 pt-5 px-6 border-b border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 rounded-full bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
        <div className="h-3 w-48 rounded bg-muted/60 mt-1" />
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-xs text-muted-foreground/70 text-center">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Error card ───────────────────────────────────────────────────────────────

function EngineErrorCard({
  engineLabel,
  message,
  canRetry,
  onRetry,
}: {
  engineLabel: string;
  message: string;
  canRetry: boolean;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-destructive/30 bg-destructive/5 shadow-premium rounded-2xl">
      <CardContent className="p-6 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-foreground mb-1">{engineLabel} is temporarily unavailable.</p>
          <p className="text-xs text-muted-foreground text-pretty">{message}</p>
        </div>
        {canRetry && onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="rounded-xl gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Balanced Detector card (primary, visually dominant) ──────────────────────

function BalancedResultCard({ result }: { result: BalancedDetectorResult }) {
  const cardBorder =
    result.verdict === 'likely-ai' || result.verdict === 'mostly-ai-human-edited'
      ? 'border-destructive/30 bg-destructive/5'
      : result.verdict === 'likely-human' || result.verdict === 'mostly-human-ai-assisted'
      ? 'border-success/30 bg-success/5'
      : 'border-warning/30 bg-warning/5';

  return (
    <Card className={`border shadow-premium rounded-2xl overflow-hidden ${cardBorder}`}>
      <CardHeader className="pb-4 pt-5 px-6 border-b border-border/50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Shield className="w-4 h-4 text-primary shrink-0" />
              <CardTitle className="text-base font-bold text-foreground">Balanced Detector</CardTitle>
              <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wide shrink-0">
                Recommended
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Calibrated for balanced accuracy and reduced false positives.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Primary score gauge + breakdown */}
        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
            <ScoreGauge value={result.ai} color={gaugeColor(result.ai)} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-foreground leading-none">{result.ai}%</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mt-0.5">AI</span>
            </div>
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <ScoreBar label="AI" value={result.ai} color={gaugeColor(result.ai)} />
            <ScoreBar label="Human" value={result.human} color="hsl(var(--success))" />
            <ScoreBar label="Mixed" value={result.mixed} color="hsl(var(--warning))" />
          </div>
        </div>

        {/* Verdict + Risk */}
        <div className="flex flex-wrap gap-2">
          <VerdictBadge verdict={result.verdict} />
          <RiskBadge risk={result.risk} />
        </div>

        {/* Confidence + metadata row */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Confidence: <span className="font-semibold text-foreground ml-1">{result.confidence}% ({result.confidenceLevel})</span>
          </span>
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            Language: <span className="font-semibold text-foreground ml-1">{result.language}</span>
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground/70">
          <span>Engine: {result.engineVersion}</span>
          <span>Model: {result.modelVersion}</span>
          {result.processingTimeMs != null && <span>{result.processingTimeMs}ms</span>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Aggressive Detector card (secondary, with caution label) ─────────────────

function AggressiveResultCard({ result }: { result: AggressiveDetectorResult }) {
  const aiColor = gaugeColor(result.ai);

  return (
    <Card className="border-border/50 shadow-premium rounded-2xl bg-card overflow-hidden">
      <CardHeader className="pb-4 pt-5 px-6 border-b border-border/50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Zap className="w-4 h-4 text-warning shrink-0" />
              <CardTitle className="text-base font-bold text-foreground">High-Sensitivity Analysis — Strict</CardTitle>
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wide text-warning border-warning/40 shrink-0">
                Higher False-Positive Risk
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              A stricter, higher-sensitivity screen that flags weaker AI-like patterns. It is not inherently more accurate and may produce more false positives than the Balanced result.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {/* Scores — two-category only, no Mixed */}
        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
            <ScoreGauge value={result.ai} color={aiColor} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-foreground leading-none">{result.ai}%</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mt-0.5">AI</span>
            </div>
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <ScoreBar label="AI" value={result.ai} color={aiColor} />
            <ScoreBar label="Human" value={result.human} color="hsl(var(--success))" />
          </div>
        </div>

        {/* Risk level */}
        <div className="flex items-center gap-2">
          <RiskBadge risk={result.risk} />
        </div>

        {/* Caution notice */}
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 flex gap-3">
          <ShieldAlert className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            This detector is intentionally more sensitive and may flag polished, formal or heavily edited human writing.
          </p>
        </div>

        {/* Recommendations from engine (shown as-is) */}
        {result.recommendations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Engine Signals</p>
            <ul className="space-y-1">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-warning/70 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Disagreement notice ──────────────────────────────────────────────────────

function DisagreementNotice() {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/30 px-5 py-4 space-y-2">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-muted-foreground shrink-0" />
        <p className="text-sm font-bold text-foreground">Detectors reached different conclusions</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed pl-6">
        The detectors reached different conclusions because they use different scoring and calibration methods.
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed pl-6">
        Use the Balanced Detector as the primary result. Treat High-Sensitivity Analysis — Strict as an additional warning signal rather than conclusive proof.
      </p>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface DualDetectorResultsProps {
  // Balanced Detector state
  balancedResult: BalancedDetectorResult | null;
  balancedLoading: boolean;
  balancedError: { message: string; canRetry: boolean } | null;
  onBalancedRetry?: () => void;

  // Aggressive Detector state
  aggressiveResult: AggressiveDetectorResult | null;
  aggressiveLoading: boolean;
  aggressiveError: { message: string; canRetry: boolean } | null;
  onAggressiveRetry?: () => void;
}

export default function DualDetectorResults({
  balancedResult,
  balancedLoading,
  balancedError,
  onBalancedRetry,
  aggressiveResult,
  aggressiveLoading,
  aggressiveError,
  onAggressiveRetry,
}: DualDetectorResultsProps) {
  const showDisagreement =
    balancedResult !== null &&
    aggressiveResult !== null &&
    shouldShowDisagreement(balancedResult, aggressiveResult);

  const neitherReady = !balancedResult && !aggressiveResult && !balancedLoading && !aggressiveLoading && !balancedError && !aggressiveError;

  if (neitherReady) return null;

  return (
    <div className="space-y-5 animate-slide-in">
      {/* Section heading */}
      <div>
        <h2 className="text-lg font-extrabold text-foreground tracking-tight">AI Detection Results</h2>
        <p className="text-xs text-muted-foreground mt-1 text-pretty">
          Your text was analyzed by two independent detection engines. The Balanced Detector provides the calibrated primary verdict. The High-Sensitivity Analysis is a stricter secondary screen with a higher false-positive risk, not a more accurate detector.
        </p>
      </div>

      {/* Balanced Detector — primary, shown first */}
      {balancedLoading && (
        <EngineLoadingCard
          label="Running Balanced Detector…"
          description="Calibrated multi-layer analysis in progress."
        />
      )}
      {balancedError && !balancedLoading && (
        <EngineErrorCard
          engineLabel="Balanced Detector"
          message={balancedError.message}
          canRetry={balancedError.canRetry}
          onRetry={onBalancedRetry}
        />
      )}
      {balancedResult && !balancedLoading && (
        <BalancedResultCard result={balancedResult} />
      )}

      {/* Disagreement notice */}
      {showDisagreement && <DisagreementNotice />}

      {/* Aggressive Detector — secondary */}
      {aggressiveLoading && (
        <EngineLoadingCard
          label="Running High-Sensitivity Analysis…"
          description="Strict AI-signal threshold analysis in progress."
        />
      )}
      {aggressiveError && !aggressiveLoading && (
        <EngineErrorCard
          engineLabel="High-Sensitivity Analysis"
          message={aggressiveError.message}
          canRetry={aggressiveError.canRetry}
          onRetry={onAggressiveRetry}
        />
      )}
      {aggressiveResult && !aggressiveLoading && (
        <AggressiveResultCard result={aggressiveResult} />
      )}
    </div>
  );
}
