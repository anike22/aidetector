import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  AlertTriangle,
  RefreshCw,
  Eye,
  Info,
  Sparkles,
  ShieldAlert,
  BarChart2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { BalancedDetectorResult } from '@/lib/detection/balancedDetectorService';
import type { AggressiveDetectorResult } from '@/lib/detection/aggressiveDetectorService';

interface Props {
  aiResult: BalancedDetectorResult | AggressiveDetectorResult;
  analyzedTarget: 'full' | 'selection';
  isResultStale: boolean;
  isAnalyzingAI: boolean;
  onRecheck: () => void;
  text: string;
}

export function WordCounterAiResultCard({
  aiResult,
  analyzedTarget,
  isResultStale,
  isAnalyzingAI,
  onRecheck,
  text,
}: Props) {
  return (
    <Card className="border-border shadow-card bg-card overflow-hidden animate-in fade-in duration-300">
      <CardHeader className="pb-3 pt-4 px-5 border-b border-border/60 bg-muted/20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                AI Detection Analysis
                <Badge
                  variant="outline"
                  className={`text-xs capitalize font-semibold ${
                    aiResult.ai < 30
                      ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                      : aiResult.ai < 70
                      ? 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                      : 'border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/10'
                  }`}
                >
                  {'verdict' in aiResult ? (aiResult.verdict as string).replace(/-/g, ' ') : `${aiResult.risk} Risk`}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Analyzed {analyzedTarget === 'selection' ? 'selected passage' : 'document'} ({'engineVersion' in aiResult ? aiResult.engineVersion : 'Aggressive Engine'})
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRecheck}
              disabled={isAnalyzingAI}
              className="h-8 text-xs gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzingAI ? 'animate-spin' : ''}`} />
              Re-check
            </Button>
          </div>
        </div>

        {/* Stale Result Warning Banner */}
        {isResultStale && (
          <div className="mt-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="font-medium">
              Text changed since this check. Click "Re-check" to evaluate your updated draft.
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Score Overview Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-center">
            <span className="text-xs text-muted-foreground font-medium block mb-1">AI Probability</span>
            <span className="text-2xl font-extrabold text-foreground">{Math.round(aiResult.ai)}%</span>
            <div className="w-full mt-2">
              <Progress
                value={aiResult.ai}
                className={`h-2 ${aiResult.ai > 50 ? '[&>div]:bg-red-500' : '[&>div]:bg-emerald-500'}`}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-center">
            <span className="text-xs text-muted-foreground font-medium block mb-1">Human Probability</span>
            <span className="text-2xl font-extrabold text-foreground">{Math.round(aiResult.human)}%</span>
            <div className="w-full mt-2">
              <Progress
                value={aiResult.human}
                className="h-2 [&>div]:bg-emerald-500"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-center">
            <span className="text-xs text-muted-foreground font-medium block mb-1">Confidence</span>
            <span className="text-2xl font-extrabold text-foreground capitalize">
              {'confidenceLevel' in aiResult ? aiResult.confidenceLevel : 'Standard'}
            </span>
            <span className="text-[11px] text-muted-foreground block mt-1">
              Risk: {aiResult.risk || 'Standard'}
            </span>
          </div>
        </div>

        {/* Sentence Level Breakdown (if available) */}
        {'full' in aiResult && aiResult.full?.sentences && aiResult.full.sentences.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Sentence-Level Inspection ({aiResult.full.sentences.length} sentences)
            </h4>
            <div className="p-4 rounded-xl bg-muted/20 border border-border/50 space-y-2 max-h-60 overflow-y-auto text-sm leading-relaxed">
              {aiResult.full.sentences.map((sent: any, sIdx: number) => {
                const isAi = (sent.aiProbability ?? 0) > 60;
                const isMixed = (sent.aiProbability ?? 0) >= 30 && (sent.aiProbability ?? 0) <= 60;
                return (
                  <span
                    key={sIdx}
                    className={`inline mr-1 px-1 py-0.5 rounded transition-colors ${
                      isAi
                        ? 'bg-red-500/15 text-red-900 dark:text-red-200 border-b border-red-500/30'
                        : isMixed
                        ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border-b border-amber-500/30'
                        : 'hover:bg-muted/40'
                    }`}
                    title={`AI Probability: ${Math.round(sent.aiProbability ?? 0)}%`}
                  >
                    {sent.text}{' '}
                  </span>
                );
              })}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-red-500/30 border border-red-500/50" />
                AI Pattern (&gt;60%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500/30 border border-amber-500/50" />
                Mixed / Edited (30-60%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-transparent border border-border" />
                Human Characteristic (&lt;30%)
              </span>
            </div>
          </div>
        )}

        {/* Uncertainty & Ethical Disclaimer */}
        <div className="p-3 bg-muted/30 border border-border/40 rounded-xl text-xs text-muted-foreground flex items-start gap-2.5">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <strong>Interpretation Note:</strong> AI content detection identifies statistical and structural patterns common to large language models. It should be used as an evaluative signal to guide human review, not as conclusive proof of authorship.
          </div>
        </div>

        {/* Handoff actions to Humanizer / Plagiarism / SEO */}
        <div className="pt-2 flex flex-wrap items-center gap-2.5 border-t border-border/50">
          <span className="text-xs text-muted-foreground font-medium">Next actions:</span>
          
          <Button variant="outline" size="sm" asChild className="h-8 text-xs gap-1.5">
            <Link to="/humanizer" state={{ text }}>
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Humanize Text
            </Link>
          </Button>

          <Button variant="outline" size="sm" asChild className="h-8 text-xs gap-1.5">
            <Link to="/plagiarism-checker" state={{ text }}>
              <ShieldAlert className="w-3.5 h-3.5 text-primary" />
              Check Plagiarism
            </Link>
          </Button>

          <Button variant="outline" size="sm" asChild className="h-8 text-xs gap-1.5">
            <Link to="/seo-assistant" state={{ text }}>
              <BarChart2 className="w-3.5 h-3.5 text-primary" />
              SEO Assistant
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
