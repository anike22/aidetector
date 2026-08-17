// EssaySubmitPage — submission readiness check + export
import { useState, useCallback } from 'react';
import { useEssayStudio } from '@/contexts/EssayStudioContext';
import { essayService } from '@/lib/essay/essayService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  CheckCircle2, AlertTriangle, XCircle, Download,
  FileText, Loader2, RefreshCw, Send, Shield,
} from 'lucide-react';

interface ReadinessItem {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'fail';
  detail: string;
  action?: { label: string; phase: string };
}

type ReadinessResult = {
  score: number;
  items: ReadinessItem[];
};

async function computeReadiness(
  essay: NonNullable<ReturnType<typeof useEssayStudio>['essay']>,
  content: string
): Promise<ReadinessResult> {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const target = essay.target_word_count || 1000;
  const pct = Math.round((wordCount / target) * 100);

  const sources = await essayService.listSources(essay.id);
  const citations = await essayService.listCitations(essay.id);
  const qualityScore = await essayService.getQualityScore(essay.id);
  const detectorResult = await essayService.getDetectorResult(essay.id);
  const unverifiedCitations = citations.filter(c => c.needs_verification && !c.is_verified);
  const hasSources = sources.length > 0;
  const requiredSources = essay.required_sources || 0;
  const sourcesReq = requiredSources > 0 ? sources.length >= requiredSources : true;

  // Detect thesis presence
  const hasThesis = content.toLowerCase().includes('thesis') ||
    content.toLowerCase().includes('this paper') ||
    content.toLowerCase().includes('this essay') ||
    content.toLowerCase().includes('i argue') ||
    content.toLowerCase().includes('this study') ||
    content.length > 200;

  // Detect conclusion
  const hasConclusion = content.toLowerCase().includes('conclusion') ||
    content.toLowerCase().includes('in summary') ||
    content.toLowerCase().includes('in conclusion') ||
    content.toLowerCase().includes('to conclude') ||
    content.toLowerCase().includes('therefore') ||
    content.toLowerCase().includes('ultimately');

  const items: ReadinessItem[] = [
    {
      id: 'word_count',
      label: 'Word count requirement',
      status: pct >= 90 ? 'pass' : pct >= 70 ? 'warning' : 'fail',
      detail: pct >= 90
        ? `${wordCount} words — target met (${pct}%)`
        : `${wordCount} / ${target} words (${pct}%) — needs more content`,
      action: pct < 90 ? { label: 'Continue writing', phase: 'write' } : undefined,
    },
    {
      id: 'thesis',
      label: 'Thesis identified',
      status: hasThesis ? 'pass' : 'warning',
      detail: hasThesis
        ? 'A thesis statement appears to be present'
        : 'No clear thesis statement detected — review your introduction',
      action: !hasThesis ? { label: 'Review in Write', phase: 'write' } : undefined,
    },
    {
      id: 'structure',
      label: 'Essay structure',
      status: wordCount >= 100 && hasConclusion ? 'pass' : wordCount >= 100 ? 'warning' : 'fail',
      detail: !hasConclusion
        ? 'No conclusion section detected — ensure your essay has a proper ending'
        : 'Structure looks complete',
      action: !hasConclusion ? { label: 'Review in Write', phase: 'write' } : undefined,
    },
    {
      id: 'sources',
      label: 'Sources listed',
      status: hasSources ? (sourcesReq ? 'pass' : 'warning') : 'warning',
      detail: !hasSources
        ? 'No sources added — add your research materials'
        : !sourcesReq
        ? `${sources.length} / ${requiredSources} required sources added`
        : `${sources.length} source${sources.length > 1 ? 's' : ''} listed`,
      action: !hasSources ? { label: 'Add sources', phase: 'sources' } : undefined,
    },
    {
      id: 'citations',
      label: 'Citation style consistent',
      status: citations.length === 0 ? 'warning' : unverifiedCitations.length === 0 ? 'pass' : 'warning',
      detail: citations.length === 0
        ? 'No citations added — add in-text citations if required'
        : unverifiedCitations.length > 0
        ? `${unverifiedCitations.length} citation${unverifiedCitations.length > 1 ? 's' : ''} unverified — please verify`
        : `${citations.length} citation${citations.length > 1 ? 's' : ''} added and verified`,
      action: unverifiedCitations.length > 0 ? { label: 'Review citations', phase: 'cite' } : undefined,
    },
    {
      id: 'ai_analysis',
      label: 'AI detection completed',
      status: detectorResult ? 'pass' : 'warning',
      detail: detectorResult
        ? `Both engines analyzed at ${new Date(detectorResult.analyzed_at).toLocaleDateString()}`
        : 'Run AI detection before submission',
      action: !detectorResult ? { label: 'Run verification', phase: 'verify' } : undefined,
    },
    {
      id: 'quality',
      label: 'Quality analysis completed',
      status: qualityScore
        ? qualityScore.overall_score >= 60 ? 'pass' : 'warning'
        : 'warning',
      detail: qualityScore
        ? `Essay quality score: ${qualityScore.overall_score}/100`
        : 'Run quality analysis before submitting',
      action: !qualityScore ? { label: 'Analyze quality', phase: 'improve' } : undefined,
    },
  ];

  const passing = items.filter(i => i.status === 'pass').length;
  const score = Math.round((passing / items.length) * 100);

  return { score, items };
}

export default function EssaySubmitPage() {
  const { essay, content, goToPhase } = useEssayStudio();
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);
  const [running, setRunning] = useState(false);
  const [exporting, setExporting] = useState<'txt' | null>(null);

  const runCheck = useCallback(async () => {
    if (!essay) return;
    setRunning(true);
    try {
      const result = await computeReadiness(essay, content);
      setReadiness(result);
      await essayService.logEvent(essay.id, 'final_verification', `Submission readiness: ${result.score}/100`, { score: result.score }, 0);
    } catch (err) {
      console.error(err);
      toast.error('Readiness check failed');
    } finally {
      setRunning(false);
    }
  }, [essay, content]);

  const exportTxt = async () => {
    if (!essay || !content) return;
    setExporting('txt');
    try {
      const metadata = [
        `Title: ${essay.title}`,
        `Type: ${essay.essay_type}`,
        `Level: ${essay.academic_level}`,
        `Words: ${essay.word_count}`,
        `Citation Style: ${essay.citation_style.toUpperCase()}`,
        `Exported: ${new Date().toLocaleString()}`,
        '',
        '─'.repeat(60),
        '',
      ].join('\n');

      const blob = new Blob([metadata + content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${essay.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      await essayService.logEvent(essay.id, 'export', 'Exported as TXT', { format: 'txt' }, essay.word_count);
      toast.success('Essay exported as .txt');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(null);
    }
  };

  const scoreColor =
    (readiness?.score ?? 0) >= 85 ? 'text-success' :
    (readiness?.score ?? 0) >= 60 ? 'text-warning' : 'text-destructive';

  const itemIcon = (status: ReadinessItem['status']) => {
    if (status === 'pass') return <CheckCircle2 className="h-4 w-4 text-success shrink-0" />;
    if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-warning shrink-0" />;
    return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" /> Submission Readiness
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Run a final check before submitting your essay to confirm all requirements are met.
        </p>
      </div>

      <Alert className="mb-6">
        <Shield className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Readiness scores reflect completion of steps — they do not guarantee academic acceptance or certify that text is human-written. Always review your essay and comply with your institution's submission policies.
        </AlertDescription>
      </Alert>

      {/* Readiness score */}
      {readiness && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Essay Readiness</p>
                <div className={`text-5xl font-bold mt-1 ${scoreColor}`}>
                  {readiness.score}
                  <span className="text-lg text-muted-foreground font-normal">/100</span>
                </div>
              </div>
              <div className="flex-1 min-w-0 max-w-48">
                <Progress value={readiness.score} className="h-3 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {readiness.score >= 85 ? 'Ready to submit' :
                   readiness.score >= 60 ? 'Almost ready — address warnings' :
                   'Not ready — resolve issues first'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Run check button */}
      {!readiness ? (
        <Card className="mb-6">
          <CardContent className="py-10 text-center">
            <Send className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-4">
              Run a readiness check to see if your essay is ready to submit.
            </p>
            <Button onClick={runCheck} disabled={running}>
              {running ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Checking…</> : <><Send className="h-4 w-4 mr-2" />Run Readiness Check</>}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Checklist */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Readiness Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {readiness.items.map(item => (
                <div key={item.id} className="flex items-start gap-3">
                  {itemIcon(item.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{item.label}</span>
                      <Badge
                        variant={item.status === 'pass' ? 'secondary' : item.status === 'warning' ? 'secondary' : 'destructive'}
                        className={`text-xs ${item.status === 'pass' ? 'text-success' : item.status === 'warning' ? 'text-warning' : ''}`}
                      >
                        {item.status === 'pass' ? 'Complete' : item.status === 'warning' ? 'Warning' : 'Incomplete'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                  </div>
                  {item.action && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs shrink-0"
                      onClick={() => goToPhase(item.action!.phase as Parameters<typeof goToPhase>[0])}
                    >
                      {item.action.label}
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Button variant="outline" onClick={runCheck} disabled={running} className="mb-6">
            {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Re-run Check
          </Button>
        </>
      )}

      {/* Export */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" /> Export Essay
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Export your essay for submission. DOCX and PDF export are available in a future update.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={exportTxt}
              disabled={!!exporting || !content}
            >
              {exporting === 'txt' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
              Export as .txt
            </Button>
            <Button variant="outline" onClick={() => {}} disabled className="opacity-50">
              <FileText className="h-4 w-4 mr-2" /> Export DOCX (Coming Soon)
            </Button>
            <Button variant="outline" onClick={() => {}} disabled className="opacity-50">
              <FileText className="h-4 w-4 mr-2" /> Export PDF (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />
      <Button variant="outline" onClick={() => goToPhase('history')}>Back to History</Button>
    </div>
  );
}
