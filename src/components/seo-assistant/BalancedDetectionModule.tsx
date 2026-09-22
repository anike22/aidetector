import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield, Bot, CheckCircle2, AlertTriangle, AlertOctagon, UserCheck,
  Activity, Info, RefreshCw, Layers, ChevronDown, ChevronUp, Zap, ShieldAlert
} from 'lucide-react';
import { AnalysisModule } from '@/pages/seo-assistant/AnalysisShared';
import { runBalancedDetector, type BalancedDetectorResult } from '@/lib/detection/balancedDetectorService';
import type { AIRiskResult } from '@/pages/seo-assistant/analysisEngine';
import { toast } from 'sonner';

interface BalancedDetectionModuleProps {
  content: string;
  balancedResult: BalancedDetectorResult | null;
  setBalancedResult: (res: BalancedDetectorResult | null) => void;
  aggressiveResult: AIRiskResult;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onSentenceHighlightToggle?: (active: boolean) => void;
  sentenceHighlightActive?: boolean;
  onNavigateIssue?: (location: any) => void;
}

export function BalancedDetectionModule({
  content,
  balancedResult,
  setBalancedResult,
  aggressiveResult,
  loading,
  setLoading,
  onSentenceHighlightToggle,
  sentenceHighlightActive = false,
  onNavigateIssue,
}: BalancedDetectionModuleProps) {
  const [showSentences, setShowSentences] = useState(false);
  const [showComparison, setShowComparison] = useState(true);
  const [analyzedContent, setAnalyzedContent] = useState<string>('');

  const isOutdated = Boolean(balancedResult && analyzedContent && content.trim() !== analyzedContent.trim());

  const handleRunBalanced = async () => {
    if (!content.trim() || content.split(/\s+/).filter(Boolean).length < 20) {
      toast.error('Please enter at least 20 words to run Balanced AI Detection.');
      return;
    }
    setLoading(true);
    try {
      const currentText = content;
      const res = await runBalancedDetector(currentText, {
        sentenceLevel: true,
        paragraphLevel: true,
      });
      setBalancedResult(res);
      setAnalyzedContent(currentText);
      toast.success('Balanced AI Detection complete.');
    } catch (err: any) {
      console.error('Balanced detector error:', err);
      toast.error(err?.message || 'Failed to complete Balanced AI Detection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const score = balancedResult ? balancedResult.human : 0;

  return (
    <AnalysisModule
      title="Balanced AI Detection"
      score={balancedResult ? balancedResult.human : undefined}
      defaultOpen={false}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-muted-foreground text-pretty">
            Calibrated dual-pass detection designed for reduced false positives and explainable sentence-level scoring.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleRunBalanced}
          disabled={loading || !content.trim()}
          className="h-8 text-xs border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 gap-1.5 w-full font-medium"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Analyzing Balanced Model…
            </>
          ) : (
            <>
              <Shield className="w-3.5 h-3.5" />
              {balancedResult ? 'Re-run Balanced Detector' : 'Run Balanced AI Detection'}
            </>
          )}
        </Button>

        {isOutdated && (
          <div className="flex items-center gap-1.5 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1 text-pretty">Analyzed an earlier version of content.</span>
            <Button size="sm" variant="ghost" className="h-6 text-[10px] px-1.5 font-medium underline" onClick={handleRunBalanced}>
              Rerun
            </Button>
          </div>
        )}

        {balancedResult && (
          <div className="flex flex-col gap-3 mt-1">
            {/* Score Grid */}
            <div className="grid grid-cols-3 gap-1.5">
              <div className="flex flex-col items-center p-2 bg-destructive/5 border border-destructive/20 rounded">
                <span className="text-base font-bold text-destructive">{balancedResult.ai}%</span>
                <span className="text-[10px] text-muted-foreground uppercase">AI</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-success/5 border border-success/20 rounded">
                <span className="text-base font-bold text-success">{balancedResult.human}%</span>
                <span className="text-[10px] text-muted-foreground uppercase">Human</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-warning/5 border border-warning/20 rounded">
                <span className="text-base font-bold text-warning">{balancedResult.mixed}%</span>
                <span className="text-[10px] text-muted-foreground uppercase">Mixed</span>
              </div>
            </div>

            {/* Verdict and Risk Badge */}
            <div className="flex items-center justify-between gap-2 p-2 bg-muted/20 border border-border rounded text-xs">
              <span className="text-muted-foreground">Verdict:</span>
              <Badge variant="outline" className="font-semibold text-[11px] capitalize">
                {balancedResult.verdict.replace(/-/g, ' ')}
              </Badge>
            </div>

            {/* Metadata Summary */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground p-2 bg-muted/10 rounded border border-border/50">
              <div>
                <span className="font-medium text-foreground">Confidence: </span>
                {balancedResult.confidence}% ({balancedResult.confidenceLevel})
              </div>
              <div>
                <span className="font-medium text-foreground">Language: </span>
                {balancedResult.language}
              </div>
              <div>
                <span className="font-medium text-foreground">Engine: </span>
                {balancedResult.engineVersion}
              </div>
              <div>
                <span className="font-medium text-foreground">Latency: </span>
                {balancedResult.processingTimeMs ? `${balancedResult.processingTimeMs}ms` : 'Recorded'}
              </div>
            </div>

            {/* Sentence Breakdown Toggle */}
            {balancedResult.full?.sentences && balancedResult.full.sentences.length > 0 && (
              <div className="pt-2 border-t border-border flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Sentence-Level Analysis ({balancedResult.full.sentences.length})
                  </span>
                  <div className="flex items-center gap-1">
                    {onSentenceHighlightToggle && (
                      <Button
                        size="sm"
                        variant={sentenceHighlightActive ? 'default' : 'outline'}
                        onClick={() => onSentenceHighlightToggle(!sentenceHighlightActive)}
                        className="h-6 text-[10px] px-2 gap-1"
                      >
                        <Layers className="w-3 h-3" />
                        {sentenceHighlightActive ? 'Highlights On' : 'Highlight'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowSentences(!showSentences)}
                      className="h-6 text-[10px] px-1.5"
                    >
                      {showSentences ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>

                {showSentences && (
                  <div className="max-h-48 overflow-y-auto divide-y divide-border/50 text-[11px] bg-background/50 rounded border border-border">
                    {balancedResult.full.sentences.slice(0, 25).map((s, i) => {
                      const prob = Math.round(s.aiProbability);
                      const isHighAi = prob >= 65;
                      const isMixed = prob >= 35 && prob < 65;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => onNavigateIssue?.({
                            type: 'ai_sentence',
                            text: s.text,
                            start: s.start,
                            end: s.end,
                            sentenceIndex: i,
                            aiProbability: prob,
                            severity: isHighAi ? 'error' : isMixed ? 'warning' : 'info'
                          })}
                          className="w-full text-left p-2 hover:bg-muted/50 transition-colors flex flex-col gap-1 rounded group cursor-pointer"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-mono text-muted-foreground group-hover:text-primary font-medium">#{i + 1}</span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1 py-0 ${
                                isHighAi
                                  ? 'bg-destructive/10 text-destructive border-destructive/20'
                                  : isMixed
                                  ? 'bg-warning/10 text-warning border-warning/20'
                                  : 'bg-success/10 text-success border-success/20'
                              }`}
                            >
                              {prob}% AI Signal
                            </Badge>
                          </div>
                          <p className="text-foreground/80 leading-relaxed italic line-clamp-2 group-hover:text-foreground">"{s.text}"</p>
                          {(s as any).signals && (s as any).signals.length > 0 && (
                            <p className="text-[9px] text-muted-foreground">{(s as any).signals.slice(0, 2).join(' · ')}</p>
                          )}
                          <span className="text-[9px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">Click to locate sentence in editor →</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Side-by-Side Engine Comparison View */}
            <div className="pt-2 border-t border-border flex flex-col gap-2">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground uppercase hover:text-foreground text-left"
              >
                <span>Engine Comparison: Balanced vs Strict</span>
                {showComparison ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showComparison && (
                <div className="p-2.5 bg-muted/20 border border-border rounded-lg flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-background rounded border border-border/70 flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
                        <Shield className="w-3 h-3" /> Balanced Engine
                      </div>
                      <div className="text-sm font-bold text-foreground">{balancedResult.ai}% AI</div>
                      <div className="text-[10px] text-muted-foreground">Calibrated Precision</div>
                    </div>
                    <div className="p-2 bg-background rounded border border-border/70 flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-warning">
                        <Zap className="w-3 h-3" /> Strict Engine
                      </div>
                      <div className="text-sm font-bold text-foreground">{aggressiveResult.aiScore}% AI</div>
                      <div className="text-[10px] text-muted-foreground">{aggressiveResult.riskLevel} Risk Screen</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground bg-muted/40 p-2 rounded border border-border/40">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                    <span className="text-pretty">
                      Different scores reflect calibrated sensitivity differences, not errors. Balanced minimizes false positives for academic/editorial safety; Strict acts as an aggressive screening heuristic.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AnalysisModule>
  );
}
