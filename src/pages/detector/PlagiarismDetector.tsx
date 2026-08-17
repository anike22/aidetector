import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TextSearch, AlertTriangle, CheckCircle2,
  RefreshCw, Download, Link2, ExternalLink,
  Info, WifiOff, BookOpen, Globe,
} from 'lucide-react';
import { analyzePlagiarism, type PlagiarismAnalysisResult } from './detectionEngine';
import HighlightedText, { HighlightLegend } from '@/components/plagiarism/HighlightedText';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useUpgradeModal } from '@/hooks/useUpgradeModal';
import UpgradeModal from '@/components/common/UpgradeModal';
import { toast } from 'sonner';

const FEATURE_SLUG = 'plagiarism_checker';

const riskBorder = (r: string) =>
  r === 'High' || r === 'Critical' ? 'border-destructive/30 bg-destructive/5' :
  r === 'Medium' ? 'border-warning/30 bg-warning/5' :
  'border-success/30 bg-success/5';

const riskBadgeClass = (r: string) =>
  r === 'High' || r === 'Critical' ? 'bg-destructive/10 text-destructive border-destructive/20' :
  r === 'Medium' ? 'bg-warning/10 text-warning border-warning/20' :
  'bg-success/10 text-success border-success/20';

export default function PlagiarismDetector() {
  const { entitlement, loading: entitlementLoading } = useEntitlement(FEATURE_SLUG);
  const { open, featureName, trigger, remaining, limit, openUpgradeModal, closeUpgradeModal } = useUpgradeModal();
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PlagiarismAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!content.trim() || content.split(/\s+/).length < 20) return;
    if (entitlementLoading) {
      toast.info('Checking your plan, please wait...');
      return;
    }
    if (!entitlement?.allowed) {
      openUpgradeModal({ featureName: 'Plagiarism Checker', trigger: 'pro_feature' });
      return;
    }
    setIsAnalyzing(true);
    setResult(null);
    try {
      const res = await analyzePlagiarism(content);
      if (res.upgrade_required) {
        openUpgradeModal({ featureName: 'Plagiarism Checker', trigger: 'pro_feature' });
        return;
      }
      setResult(res);
    } catch {
      toast.error('Plagiarism check could not be completed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExport = () => {
    if (!result) return;
    const text = [
      'Plagiarism Report — AIDetector.cx',
      `Date: ${new Date().toLocaleString()}`,
      `Status: ${result.status}`,
      '',
      `Similarity: ${result.similarityScore}%`,
      `Originality: ${result.originalityScore}%`,
      `Exact Match: ${result.exactMatchScore}%`,
      `Near Match: ${result.nearMatchScore}%`,
      `Candidate Similarity: ${result.semanticMatchScore}%`,
      '',
      `Coverage: ${result.coverageNote}`,
      '',
      `Verified Sources (${result.sources.length}):`,
      ...result.sources.map(s =>
        `  - ${s.title} | ${s.url}${s.doi ? ` | DOI: ${s.doi}` : ''} | ${s.matchContribution}% contribution | ${s.matchType}`
      ),
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'plagiarism-report.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = (content.match(/\S+/g) || []).length;

  return (
    <div className="pt-2">
      <UpgradeModal
        open={open}
        onOpenChange={closeUpgradeModal}
        featureName={featureName}
        trigger={trigger}
        remaining={remaining}
        limit={limit}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Input */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <Card className="border-border shadow-card overflow-hidden flex flex-col h-[400px]">
            <CardHeader className="bg-card border-b border-border py-4">
              <CardTitle className="text-base font-semibold text-navy">
                Input Text for Plagiarism Check
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto relative">
              {/* Highlighted overlay — shown after analysis with matches */}
              {result && result.sources.length > 0 && !isAnalyzing ? (
                <div className="p-5">
                  <HighlightedText
                    text={content}
                    spans={result.sources.flatMap(s => s.matchedSpans)}
                  />
                  <HighlightLegend />
                </div>
              ) : (
                <Textarea
                  placeholder="Paste text here — minimum 30 words. Searches Crossref, OpenAlex and Unpaywall."
                  className="w-full h-full resize-none border-0 focus-visible:ring-0 rounded-none p-5 text-base leading-relaxed bg-transparent"
                  value={content}
                  onChange={(e) => { setContent(e.target.value); setResult(null); }}
                />
              )}
            </CardContent>
            <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between">
              <span className={`text-sm font-medium ${wordCount < 30 ? 'text-warning' : 'text-muted-foreground'}`}>
                {wordCount} words
              </span>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !content.trim() || wordCount < 30}
                className="h-10 px-6 bg-primary text-primary-foreground font-medium"
              >
                {isAnalyzing
                  ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Checking...</>
                  : <><TextSearch className="w-4 h-4 mr-2" /> Check Plagiarism</>}
              </Button>
            </div>
          </Card>

          {/* Matched spans */}
          {result && result.sources.length > 0 && (
            <Card className="border-border shadow-card">
              <CardHeader className="pb-3 pt-5 px-5 border-b border-border">
                <CardTitle className="text-base font-semibold text-navy flex items-center gap-2">
                  <TextSearch className="w-4 h-4 text-primary" /> Matched Passages
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3 max-h-[300px] overflow-y-auto">
                {result.sources.flatMap((s) => s.matchedSpans).slice(0, 6).map((span, i) => (
                  <div key={i} className="text-xs rounded-md border border-warning/30 bg-warning/10 p-3">
                    <p className="font-semibold text-warning mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {span.matchType === 'exact' ? 'Exact match' : span.matchType === 'near' ? 'Near match' : 'Candidate similarity'}
                      {' '}· {Math.round(span.spanSimilarity * 100)}% similarity
                    </p>
                    <p className="text-foreground/80 italic line-clamp-2">"{span.submittedPassage}"</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {!result ? (
            <Card className="border-border shadow-card h-full flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                <TextSearch className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-semibold text-navy mb-1">No analysis yet</p>
              <p className="text-sm text-muted-foreground text-pretty">
                Searches Crossref and OpenAlex scholarly databases. Results reflect verified academic sources only.
              </p>
            </Card>
          ) : (
            <div className="space-y-5">
              {/* Status / error states */}
              {(result.status === 'analysis_failed' || result.status === 'provider_unavailable') && (
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="p-4 flex items-start gap-3">
                    <WifiOff className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-destructive mb-1">Analysis unavailable</p>
                      <p className="text-xs text-muted-foreground">
                        {result.errorMessage ?? 'Could not reach source providers. Please retry.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {result.status === 'no_verified_matches' && (
                <Card className="border-success/30 bg-success/5">
                  <CardContent className="p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-success mb-1">No matches found in checked sources</p>
                      <p className="text-xs text-muted-foreground">
                        No verified matches were found in the academic databases searched. This does not confirm full originality — general websites and recent publications may not be indexed.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {result.status === 'partial' && (
                <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 border border-warning/20 rounded-md px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Partial results — one or more providers were unavailable during this check.
                </div>
              )}

              {/* Score card — only when there are actual scores */}
              {(result.status === 'completed' || result.status === 'partial') && (
                <Card className={`border shadow-card ${riskBorder(result.riskLevel)}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-navy flex items-center gap-2">
                        <CheckCircle2 className={`w-4 h-4 ${result.riskLevel === 'None' || result.riskLevel === 'Low' ? 'text-success' : 'text-muted-foreground'}`} />
                        Similarity Score
                      </span>
                      <Badge className={riskBadgeClass(result.riskLevel)}>
                        {result.riskLevel} Risk
                      </Badge>
                    </div>
                    <div className="flex items-end gap-4 mb-2">
                      <span className={`text-4xl font-extrabold ${
                        result.similarityScore >= 50 ? 'text-destructive' :
                        result.similarityScore >= 15 ? 'text-warning' : 'text-success'
                      }`}>{result.similarityScore}%</span>
                      <span className="text-sm text-muted-foreground mb-1 font-medium uppercase tracking-wider">Similar</span>
                    </div>
                    <Progress value={result.similarityScore} className="h-2 mb-4" />
                    <div className="grid grid-cols-2 gap-2 text-xs mt-3 pt-3 border-t border-border/50">
                      {[
                        ['Originality', `${result.originalityScore}%`],
                        ['Exact Match', `${result.exactMatchScore}%`],
                        ['Near Match', `${result.nearMatchScore}%`],
                        ['Candidate Similarity', `${result.semanticMatchScore}%`],
                      ].map(([label, val]) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-muted-foreground">{label}:</span>
                          <span className="font-medium text-navy">{val}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Verified sources */}
              {result.sources.length > 0 && (
                <Card className="border-border shadow-card">
                  <CardHeader className="pb-2 pt-4 px-5 border-b border-border/50">
                    <CardTitle className="text-sm font-semibold text-navy flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-primary" /> Verified Sources
                      </span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {result.sources.length} source{result.sources.length !== 1 ? 's' : ''}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/50 max-h-[300px] overflow-y-auto">
                      {result.sources.map((source, i) => (
                        <div key={i} className="p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs text-navy truncate" title={source.title}>{source.title}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{source.publisher}</p>
                            </div>
                            <Badge className="bg-warning/10 text-warning border-warning/20 shrink-0 text-[10px]">
                              {source.matchContribution}%
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {source.provider === 'web'
                                ? <Globe className="w-3 h-3" />
                                : <BookOpen className="w-3 h-3" />}
                              {source.matchType}
                              {source.doi && <span className="ml-1 font-mono text-[10px]">DOI</span>}
                              {source.provider === 'web' && <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1 rounded">Web</span>}
                            </span>
                            <a href={source.url} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline">
                              View <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Coverage note */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 border border-border rounded-md px-3 py-2.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <div>
                  <span className="text-pretty">{result.coverageNote ?? 'Searches Crossref, OpenAlex and Unpaywall.'}</span>
                  {result.providerStatus && (() => {
                    const ps = result.providerStatus;
                    const searched: string[] = [];
                    const failed: string[] = [];
                    if (ps.crossref === 'ok') searched.push('Crossref');
                    else if (ps.crossref === 'failed') failed.push('Crossref');
                    if (ps.openalex === 'ok') searched.push('OpenAlex');
                    else if (ps.openalex === 'failed') failed.push('OpenAlex');
                    if (ps.unpaywall === 'ok') searched.push('Unpaywall');
                    else if (ps.unpaywall === 'failed') failed.push('Unpaywall');
                    if (ps.webSearch === 'ok') searched.push('Web');
                    else if (ps.webSearch === 'failed') failed.push('Web Search');
                    const parts = [
                      searched.length ? `Searched: ${searched.join(', ')}` : '',
                      failed.length   ? `Unavailable: ${failed.join(', ')}` : '',
                    ].filter(Boolean).join(' · ');
                    return parts ? <p className="mt-1 opacity-70">{parts}</p> : null;
                  })()}
                </div>
              </div>

              {result.sources.length > 0 && (
                <Button type="button" className="w-full h-10 gap-2 bg-primary text-primary-foreground" onClick={handleExport}>
                  <Download className="w-4 h-4" /> Export Report
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
