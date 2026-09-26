import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  TextSearch, AlertTriangle, CheckCircle2,
  RefreshCw, Download, Link2, ExternalLink,
  Info, WifiOff, BookOpen, Globe, Sparkles,
  Layers, History, Network, Eye, SplitSquareVertical, Bot, Shield,
  Zap, Compass, Table, Terminal, FolderLock, ShieldCheck, FileJson
} from 'lucide-react';
import { analyzePlagiarism, type PlagiarismAnalysisResult } from './detectionEngine';
import HighlightedText, { HighlightLegend } from '@/components/plagiarism/HighlightedText';
import { executePlagiarismForensicsPipeline } from '@/lib/plagiarism/plagiarismIntelligencePipeline';
import { downloadForensicAuditPackage } from '@/lib/plagiarism/forensicReportGenerator';
import {
  getStoredPrivateCorpus,
  savePrivateCorpus,
  type PrivateCorpusDocument
} from '@/lib/plagiarism/privateCorpusEngine';
import { ForensicSummaryHeader } from '@/components/plagiarism/ForensicSummaryHeader';
import { PlagiarismHeatmap } from '@/components/plagiarism/PlagiarismHeatmap';
import { SideBySideEvidenceMap } from '@/components/plagiarism/SideBySideEvidenceMap';
import { AiRewriteTraceCard } from '@/components/plagiarism/AiRewriteTraceCard';
import { SourceClusteringView } from '@/components/plagiarism/SourceClusteringView';
import { ChronologicalTimeline } from '@/components/plagiarism/ChronologicalTimeline';
import { CitationIntelligenceView } from '@/components/plagiarism/CitationIntelligenceView';
import { FalsePositiveInspector } from '@/components/plagiarism/FalsePositiveInspector';
import { ConceptualStructuralView } from '@/components/plagiarism/ConceptualStructuralView';
import { TableDataSimilarityView } from '@/components/plagiarism/TableDataSimilarityView';
import { VisualPlagiarismView } from '@/components/plagiarism/VisualPlagiarismView';
import { CodePlagiarismView } from '@/components/plagiarism/CodePlagiarismView';
import { PrivateCorpusView } from '@/components/plagiarism/PrivateCorpusView';
import { CoverageTransparencyCard } from '@/components/plagiarism/CoverageTransparencyCard';
import { SourceBreakdownView } from '@/components/plagiarism/SourceBreakdownView';
import { DiagnosticTelemetryInspector } from '@/components/plagiarism/DiagnosticTelemetryInspector';
import { PlagiarismBenchmarkSuite } from '@/components/plagiarism/PlagiarismBenchmarkSuite';
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
  r === 'Limited Coverage' || r.includes('Limited') || r.includes('Insufficient') ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
  'bg-success/10 text-success border-success/20';

export default function PlagiarismDetector() {
  const { entitlement, loading: entitlementLoading } = useEntitlement(FEATURE_SLUG);
  const { open, featureName, trigger, remaining, limit, openUpgradeModal, closeUpgradeModal } = useUpgradeModal();
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PlagiarismAnalysisResult | null>(null);
  const [scanMode, setScanMode] = useState<'standard' | 'deep_forensic'>('deep_forensic');
  const [corpusDocs, setCorpusDocs] = useState<PrivateCorpusDocument[]>(() => getStoredPrivateCorpus());
  const [forensicTab, setForensicTab] = useState<
    'heatmap' | 'sources' | 'evidence' | 'ai_rewrite' | 'citations' | 'timeline' | 'clusters' | 'conceptual' | 'tables' | 'code' | 'private_corpus' | 'coverage' | 'false_positives' | 'diagnostics' | 'benchmark'
  >('heatmap');

  const handleAddCorpusDoc = (doc: PrivateCorpusDocument) => {
    setCorpusDocs((prev) => {
      const updated = [doc, ...prev];
      savePrivateCorpus(updated);
      return updated;
    });
  };

  const handleRemoveCorpusDoc = (id: string) => {
    setCorpusDocs((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      savePrivateCorpus(updated);
      return updated;
    });
  };

  const forensicIntelligence = useMemo(() => {
    if (!result || !content) return null;
    if (result.status === 'analysis_failed' || result.status === 'provider_unavailable') return null;
    return executePlagiarismForensicsPipeline(content, result, corpusDocs);
  }, [result, content, corpusDocs]);

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
      if (res.upgrade_required || res.errorCode) {
        if (res.errorCode === 'INSUFFICIENT_CREDITS') {
          toast.error(res.errorMessage || 'Insufficient credits for plagiarism check. Please top up your balance.');
        } else {
          openUpgradeModal({
            featureName: 'Plagiarism Checker',
            trigger: res.errorCode === 'TRIAL_EXHAUSTED' ? 'limit_reached' : 'pro_feature',
            remaining: res.remaining ?? 0,
            limit: res.limit ?? 1,
          });
        }
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
      `Verified Paraphrase: ${result.paraphraseMatchScore}%`,
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
        <div className="lg:col-span-7 flex flex-col gap-4">

          {/* ── Scan Mode & Engine Settings Bar (Always Visible) ── */}
          <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scan Mode:</span>
              <div className="flex items-center bg-muted rounded-lg p-1 border border-border">
                <Button
                  variant={scanMode === 'standard' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-2.5 gap-1 font-medium"
                  onClick={() => setScanMode('standard')}
                >
                  <Zap className="w-3 h-3 text-warning" /> Standard Scan
                </Button>
                <Button
                  variant={scanMode === 'deep_forensic' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-2.5 gap-1 font-medium"
                  onClick={() => setScanMode('deep_forensic')}
                >
                  <Compass className="w-3 h-3 text-primary-foreground" /> Deep Forensic Scan (Default)
                </Button>
              </div>
            </div>

            <Badge className={scanMode === 'deep_forensic' ? 'bg-primary/10 text-primary border-primary/20 text-[11px] py-1' : 'bg-muted text-muted-foreground text-[11px] py-1'}>
              {scanMode === 'deep_forensic' ? '17 Forensic Engines Active' : 'Standard Pipeline'}
            </Badge>
          </div>

          <Card className="border-border shadow-card overflow-hidden flex flex-col h-[400px]">
            <CardHeader className="bg-card border-b border-border py-3 px-4 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold text-navy">
                Input Text for Plagiarism Check
              </CardTitle>
              <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-md border border-border">
                <Button
                  variant="ghost" size="sm"
                  className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setContent('According to recent empirical investigations in artificial intelligence (Vaswani et al., 2017), transformer architectures compute contextual representations across sequence dimensions.');
                    setResult(null);
                  }}
                >
                  Academic
                </Button>
                <Button
                  variant="ghost" size="sm"
                  className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setContent('def compute_jaccard_similarity(set_a: set, set_b: set) -> float:\n    intersection_cardinality = len(set_a.intersection(set_b))\n    union_cardinality = len(set_a.union(set_b))\n    return intersection_cardinality / float(union_cardinality) if union_cardinality != 0 else 1.0');
                    setResult(null);
                  }}
                >
                  Code
                </Button>
              </div>
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
                      {span.matchType === 'exact' ? 'Exact match' : span.matchType === 'near' ? 'Near match' : span.matchType === 'paraphrase' ? 'Verified paraphrase' : 'Candidate similarity'}
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
                        ['Originality', result.status === 'partial' && result.similarityScore === 0 ? 'Unconfirmed (Partial Coverage)' : `${result.originalityScore}%`],
                        ['Exact Match', `${result.exactMatchScore}%`],
                        ['Near Match', `${result.nearMatchScore}%`],
                        ['Verified Paraphrase', `${result.paraphraseMatchScore}%`],
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
              {(result.status === 'completed' || result.status === 'partial' || result.status === 'no_verified_matches') && result.sources.length > 0 && (
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

              {/* Verified sources — failure state */}
              {(result.status === 'analysis_failed' || result.status === 'provider_unavailable') && (
                <Card className="border-border shadow-card">
                  <CardHeader className="pb-2 pt-4 px-5 border-b border-border/50">
                    <CardTitle className="text-sm font-semibold text-navy flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-primary" /> Verified Sources
                      </span>
                      <span className="text-xs text-muted-foreground font-normal">Unavailable</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                    <WifiOff className="w-5 h-5 text-muted-foreground/50" />
                    Analysis did not complete. Source results are unavailable.
                  </CardContent>
                </Card>
              )}

              {/* Coverage note */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 border border-border rounded-md px-3 py-2.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <div>
                  <span className="text-pretty">{result.coverageNote ?? 'Searches Crossref, OpenAlex and Unpaywall.'}</span>
                  {result.providerStatus && (() => {
                    if (result.status === 'analysis_failed' || result.status === 'provider_unavailable') {
                      return <p className="mt-1 opacity-70">Providers: Not checked (analysis stopped before queries were executed)</p>;
                    }
                    const ps = result.providerStatus;
                    const searched: string[] = [];
                    const failed: string[] = [];
                    const getStat = (val: any) => (typeof val === 'object' && val !== null ? val.status : val);
                    if (getStat(ps.crossref) === 'ok') searched.push('Crossref');
                    else if (getStat(ps.crossref) === 'failed') failed.push('Crossref');
                    if (getStat(ps.openalex) === 'ok') searched.push('OpenAlex');
                    else if (getStat(ps.openalex) === 'failed') failed.push('OpenAlex');
                    if (getStat(ps.unpaywall) === 'ok') searched.push('Unpaywall');
                    else if (getStat(ps.unpaywall) === 'failed') failed.push('Unpaywall');
                    if (getStat(ps.webSearch) === 'ok' || getStat(ps.exa) === 'ok') searched.push('Web Search');
                    else if (getStat(ps.webSearch) === 'failed' || getStat(ps.exa) === 'failed') failed.push('Web Search');
                    const parts = [
                      searched.length ? `Searched: ${searched.join(', ')}` : '',
                      failed.length   ? `Unavailable: ${failed.join(', ')}` : '',
                    ].filter(Boolean).join(' · ');
                    return parts ? <p className="mt-1 opacity-70">{parts}</p> : <p className="mt-1 opacity-70">Providers: Not checked</p>;
                  })()}
                </div>
              </div>

              {/* Actions */}
              {result && (
                <div className="space-y-2">
                  {forensicIntelligence ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button
                        type="button"
                        className="w-full h-10 gap-2 bg-primary text-primary-foreground font-semibold"
                        onClick={() => {
                          downloadForensicAuditPackage(forensicIntelligence, 'txt');
                          toast.success('Downloaded 8-Section Forensic Audit Package (.TXT)');
                        }}
                      >
                        <Download className="w-4 h-4" /> Audit Package (.TXT)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-10 gap-2 border-primary/30 text-primary hover:bg-primary/5 font-semibold"
                        onClick={() => {
                          downloadForensicAuditPackage(forensicIntelligence, 'json');
                          toast.success('Downloaded Forensic Audit Package (.JSON)');
                        }}
                      >
                        <FileJson className="w-4 h-4" /> Audit Package (.JSON)
                      </Button>
                    </div>
                  ) : (
                    result.sources.length > 0 && (
                      <Button type="button" className="w-full h-10 gap-2 bg-primary text-primary-foreground" onClick={handleExport}>
                        <Download className="w-4 h-4" /> Export Report (.TXT)
                      </Button>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Advanced Plagiarism Forensic Intelligence Suite ── */}
      {forensicIntelligence && !isAnalyzing && (
        <div className="mt-10 pt-8 border-t border-border flex flex-col gap-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-navy flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Plagiarism Forensic Intelligence Suite
              </h2>
              <p className="text-muted-foreground text-xs md:text-sm mt-0.5">
                17-Stage Deep Evidence Mapping, Non-Overlapping Source Accounting & Multi-Modal Audit.
              </p>
            </div>

            {/* Scan Mode & Export Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-muted/60 rounded-lg p-1 border border-border">
                <Button
                  variant={scanMode === 'standard' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-2.5 gap-1"
                  onClick={() => setScanMode('standard')}
                >
                  <Zap className="w-3 h-3" /> Standard Scan
                </Button>
                <Button
                  variant={scanMode === 'deep_forensic' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-2.5 gap-1"
                  onClick={() => setScanMode('deep_forensic')}
                >
                  <Compass className="w-3 h-3" /> Deep Forensic Scan
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 font-medium"
                onClick={() => {
                  downloadForensicAuditPackage(forensicIntelligence, 'txt');
                  toast.success('Downloaded 8-Section Forensic Audit Package (.TXT)');
                }}
              >
                <Download className="w-3.5 h-3.5" /> 8-Section Audit (.TXT)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 font-medium"
                onClick={() => {
                  downloadForensicAuditPackage(forensicIntelligence, 'json');
                  toast.success('Downloaded Forensic Audit Package (.JSON)');
                }}
              >
                <FileJson className="w-3.5 h-3.5" /> JSON Export
              </Button>
            </div>
          </div>

          {/* Forensic Summary Metric Cards */}
          <ForensicSummaryHeader intel={forensicIntelligence} />

          {/* Forensic Navigation Tabs */}
          <Card className="border-border shadow-card overflow-hidden">
            <CardHeader className="bg-card border-b border-border py-3 px-4">
              <Tabs
                value={forensicTab}
                onValueChange={(v: any) => setForensicTab(v)}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-12 h-auto p-1 bg-muted/60 gap-1">
                  <TabsTrigger value="heatmap" className="text-xs py-1.5 gap-1">
                    <Eye className="w-3.5 h-3.5" /> Heatmap
                  </TabsTrigger>
                  <TabsTrigger value="sources" className="text-xs py-1.5 gap-1">
                    <Link2 className="w-3.5 h-3.5" /> Sources
                  </TabsTrigger>
                  <TabsTrigger value="evidence" className="text-xs py-1.5 gap-1">
                    <SplitSquareVertical className="w-3.5 h-3.5" /> Evidence
                  </TabsTrigger>
                  <TabsTrigger value="ai_rewrite" className="text-xs py-1.5 gap-1">
                    <Bot className="w-3.5 h-3.5" /> AI Rewrites
                  </TabsTrigger>
                  <TabsTrigger value="citations" className="text-xs py-1.5 gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> Citations
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="text-xs py-1.5 gap-1">
                    <History className="w-3.5 h-3.5" /> Timeline
                  </TabsTrigger>
                  <TabsTrigger value="clusters" className="text-xs py-1.5 gap-1">
                    <Network className="w-3.5 h-3.5" /> Clusters
                  </TabsTrigger>
                  <TabsTrigger value="conceptual" className="text-xs py-1.5 gap-1">
                    <Layers className="w-3.5 h-3.5" /> Concepts
                  </TabsTrigger>
                  <TabsTrigger value="tables" className="text-xs py-1.5 gap-1">
                    <Table className="w-3.5 h-3.5" /> Tables
                  </TabsTrigger>
                  <TabsTrigger value="code" className="text-xs py-1.5 gap-1">
                    <Terminal className="w-3.5 h-3.5" /> Code
                  </TabsTrigger>
                  <TabsTrigger value="private_corpus" className="text-xs py-1.5 gap-1">
                    <FolderLock className="w-3.5 h-3.5" /> Corpus
                  </TabsTrigger>
                  <TabsTrigger value="coverage" className="text-xs py-1.5 gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Coverage
                  </TabsTrigger>
                  <TabsTrigger value="diagnostics" className="text-xs py-1.5 gap-1">
                    <Terminal className="w-3.5 h-3.5" /> Telemetry
                  </TabsTrigger>
                  <TabsTrigger value="benchmark" className="text-xs py-1.5 gap-1">
                    <Zap className="w-3.5 h-3.5" /> Benchmarks
                  </TabsTrigger>
                </TabsList>

                <div className="p-4">
                  <TabsContent value="heatmap" className="m-0">
                    <PlagiarismHeatmap text={content} matches={forensicIntelligence.evidenceMatches} />
                  </TabsContent>

                  <TabsContent value="sources" className="m-0">
                    <SourceBreakdownView
                      sources={forensicIntelligence.individualSourceContributions}
                      overallSimilarity={forensicIntelligence.rawSimilarityPercentage}
                    />
                  </TabsContent>

                  <TabsContent value="evidence" className="m-0">
                    <SideBySideEvidenceMap matches={forensicIntelligence.evidenceMatches} />
                  </TabsContent>

                  <TabsContent value="ai_rewrite" className="m-0">
                    <AiRewriteTraceCard traces={forensicIntelligence.aiRewriteTraces} />
                  </TabsContent>

                  <TabsContent value="citations" className="m-0">
                    <CitationIntelligenceView citations={forensicIntelligence.citations} />
                  </TabsContent>

                  <TabsContent value="timeline" className="m-0">
                    <ChronologicalTimeline timeline={forensicIntelligence.chronologicalTimeline} />
                  </TabsContent>

                  <TabsContent value="clusters" className="m-0">
                    <SourceClusteringView
                      clusters={forensicIntelligence.sourceClusters}
                      credibilityMap={forensicIntelligence.sourceCredibilityMap}
                    />
                  </TabsContent>

                  <TabsContent value="conceptual" className="m-0">
                    <ConceptualStructuralView
                      conceptual={forensicIntelligence.conceptualSimilarities}
                      structural={forensicIntelligence.structuralSimilarities}
                      crossLingual={forensicIntelligence.crossLingualMatches}
                    />
                  </TabsContent>

                  <TabsContent value="tables" className="m-0">
                    <TableDataSimilarityView matches={forensicIntelligence.tableSimilarityMatches} />
                  </TabsContent>

                  <TabsContent value="code" className="m-0">
                    <CodePlagiarismView matches={forensicIntelligence.codePlagiarismMatches} />
                  </TabsContent>

                  <TabsContent value="private_corpus" className="m-0">
                    <PrivateCorpusView
                      matches={forensicIntelligence.selfSimilarityMatches}
                      corpusDocuments={corpusDocs}
                      onAddDocument={handleAddCorpusDoc}
                      onRemoveDocument={handleRemoveCorpusDoc}
                    />
                  </TabsContent>

                  <TabsContent value="coverage" className="m-0">
                    <CoverageTransparencyCard report={forensicIntelligence.searchCoverageReport} />
                  </TabsContent>

                  <TabsContent value="diagnostics" className="m-0">
                    {result && <DiagnosticTelemetryInspector result={result} />}
                  </TabsContent>

                  <TabsContent value="benchmark" className="m-0">
                    <PlagiarismBenchmarkSuite />
                  </TabsContent>
                </div>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}
