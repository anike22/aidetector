// EssayImprovePage — quality scoring on 11 dimensions with actionable recommendations
import { useState, useCallback } from 'react';
import { useEssayStudio } from '@/contexts/EssayStudioContext';
import { essayService } from '@/lib/essay/essayService';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  BarChart2, ChevronRight, Loader2, RefreshCw, AlertCircle,
  CheckCircle, ChevronDown, ChevronUp, Info, Target,
} from 'lucide-react';
import type { EssayQualityScore, QualityIssue } from '@/types/essay';

const DIMENSION_LABELS: Record<string, string> = {
  thesis_score: 'Thesis Strength',
  argument_score: 'Argument Quality',
  evidence_score: 'Evidence & Support',
  organization_score: 'Organization',
  coherence_score: 'Coherence & Flow',
  critical_thinking_score: 'Critical Thinking',
  grammar_score: 'Grammar & Mechanics',
  readability_score: 'Readability',
  academic_tone_score: 'Academic Tone',
  citation_quality_score: 'Citation Quality',
  originality_score: 'Originality',
};

function getScoreColor(score: number) {
  if (score >= 75) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

function getProgressColor(score: number) {
  if (score >= 75) return 'bg-success';
  if (score >= 50) return 'bg-warning';
  return 'bg-destructive';
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-36 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden min-w-0">
        <div
          className={`h-full rounded-full transition-all ${getProgressColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-semibold w-8 shrink-0 text-right ${getScoreColor(score)}`}>{score}</span>
    </div>
  );
}

function IssueCard({ issue, onShowInEssay }: { issue: QualityIssue; onShowInEssay: (loc: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const sev = issue.severity;
  const severityColors = {
    high: 'border-destructive/30 bg-destructive/5',
    medium: 'border-warning/30 bg-warning/5',
    low: 'border-border bg-muted/30',
  };
  const severityBadge = {
    high: 'destructive' as const,
    medium: 'outline' as const,
    low: 'secondary' as const,
  };

  return (
    <div className={`rounded-lg border p-3 ${severityColors[sev]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{issue.title}</span>
            <Badge variant={sev === 'high' ? 'destructive' : 'secondary'} className="text-xs capitalize">{sev}</Badge>
            <span className="text-xs text-muted-foreground">{issue.category} · {issue.score}/100</span>
          </div>
          {issue.location && (
            <p className="text-xs text-muted-foreground mt-0.5">{issue.location}</p>
          )}
        </div>
        <button onClick={() => setExpanded(e => !e)} className="shrink-0 p-1">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-muted-foreground">{issue.description}</p>
          <div className="flex items-start gap-2 bg-background rounded p-2 border border-border">
            <Target className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs">{issue.recommendation}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {issue.location && (
              <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => onShowInEssay(issue.location || '')}>
                Show Issue
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EssayImprovePage() {
  const { essay, content, goToPhase } = useEssayStudio();
  const [qualityScore, setQualityScore] = useState<EssayQualityScore | null>(null);
  const [running, setRunning] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const MIN_WORDS = 100;

  const runQualityAnalysis = useCallback(async () => {
    if (!essay) return;
    if (wordCount < MIN_WORDS) {
      toast.error(`Please write at least ${MIN_WORDS} words before running quality analysis.`);
      return;
    }
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('essay-quality', {
        body: {
          essay_text: content,
          essay_type: essay.essay_type,
          academic_level: essay.academic_level,
          citation_style: essay.citation_style,
        },
      });
      if (error) {
        const msg = await error?.context?.text?.();
        throw new Error(msg || error.message);
      }

      const saved = await essayService.saveQualityScore(essay.id, {
        ...data,
        issues: data.issues || [],
      });
      setQualityScore(saved);
      await essayService.logEvent(essay.id, 'ai_assist', 'Quality analysis run', { overall: data.overall_score }, wordCount);
      toast.success('Quality analysis complete');
    } catch (err) {
      console.error(err);
      toast.error('Quality analysis failed. Please try again.');
    } finally {
      setRunning(false);
    }
  }, [essay, content, wordCount]);

  const issues = qualityScore?.issues ?? [];
  const filteredIssues = filterSeverity === 'all'
    ? issues
    : issues.filter((i: QualityIssue) => i.severity === filterSeverity);

  const scoreKeys = Object.keys(DIMENSION_LABELS) as (keyof EssayQualityScore)[];

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-primary" /> Essay Quality Score
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Get scored on 11 academic dimensions with specific, actionable recommendations for each weakness.
        </p>
      </div>

      <Alert className="mb-6 border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          This Quality Score is separate from AI detection. It evaluates the academic strength of your writing — not whether it was written by AI.
        </AlertDescription>
      </Alert>

      {!qualityScore && !running && (
        <Card className="mb-6">
          <CardContent className="py-10 text-center">
            <BarChart2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-4">
              Analyze your essay to receive quality scores across 11 academic dimensions.
            </p>
            <Button onClick={runQualityAnalysis} disabled={wordCount < MIN_WORDS}>
              <BarChart2 className="h-4 w-4 mr-2" /> Analyze Essay Quality
            </Button>
            {wordCount < MIN_WORDS && (
              <p className="text-xs text-muted-foreground mt-2">
                Minimum {MIN_WORDS} words required (current: {wordCount})
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {running && (
        <Card className="mb-6">
          <CardContent className="py-10 text-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Analyzing your essay across 11 dimensions…</p>
            <p className="text-xs text-muted-foreground mt-1">This may take 15–30 seconds.</p>
          </CardContent>
        </Card>
      )}

      {qualityScore && !running && (
        <>
          {/* Overall Score */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Essay Quality</p>
                  <div className={`text-4xl font-bold mt-1 ${getScoreColor(qualityScore.overall_score)}`}>
                    {qualityScore.overall_score}<span className="text-base text-muted-foreground font-normal">/100</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0 max-w-48">
                  <Progress value={qualityScore.overall_score} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {qualityScore.overall_score >= 75 ? 'Strong academic work' :
                     qualityScore.overall_score >= 50 ? 'Adequate — improvements recommended' :
                     'Significant revision needed'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={runQualityAnalysis}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Re-analyze
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Dimension breakdown */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {scoreKeys.map(key => {
                const score = qualityScore[key] as number;
                return (
                  <ScoreBar key={key} label={DIMENSION_LABELS[key as string]} score={score ?? 0} />
                );
              })}
            </CardContent>
          </Card>

          {/* Issues */}
          {issues.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    Issues & Recommendations
                    <Badge variant="secondary" className="text-xs">{issues.length}</Badge>
                  </CardTitle>
                  <div className="flex gap-1">
                    {(['all', 'high', 'medium', 'low'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setFilterSeverity(s)}
                        className={`text-xs px-2 py-1 rounded ${filterSeverity === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                      >
                        {s === 'all' ? `All (${issues.length})` : s}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredIssues.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-success py-2">
                    <CheckCircle className="h-4 w-4" />
                    No {filterSeverity} severity issues found.
                  </div>
                ) : (
                  filteredIssues.map((issue: QualityIssue, i: number) => (
                    <IssueCard
                      key={i}
                      issue={issue}
                      onShowInEssay={(loc) => {
                        toast.info(`Issue location: ${loc}`, { description: 'Go to the Write phase and search for this section.' });
                      }}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {issues.length === 0 && (
            <Card>
              <CardContent className="py-6 text-center">
                <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-sm font-medium text-success">No significant issues found</p>
                <p className="text-xs text-muted-foreground mt-1">Your essay meets academic quality standards.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Separator className="my-6" />
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => goToPhase('verify')}>
          Back to Verify
        </Button>
        <Button onClick={() => goToPhase('cite')}>
          Manage Citations <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
