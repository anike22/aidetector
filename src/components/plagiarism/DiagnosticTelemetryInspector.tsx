import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Terminal, ShieldCheck, CheckCircle2, AlertTriangle, XCircle,
  Database, Search, Cpu, FileText, BarChart3, Copy, Check
} from 'lucide-react';
import type { PlagiarismAnalysisResult } from '@/pages/detector/detectionEngine';

interface DiagnosticTelemetryInspectorProps {
  result: PlagiarismAnalysisResult;
}

export function DiagnosticTelemetryInspector({ result }: DiagnosticTelemetryInspectorProps) {
  const [copied, setCopied] = useState(false);
  const diag = result.diagnostics;

  const handleCopyJson = () => {
    if (!diag) return;
    navigator.clipboard.writeText(JSON.stringify(diag, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!diag) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">Standard scan mode telemetry recorded.</p>
          <p className="text-xs mt-1">Run a Deep Forensic scan or inspect the Coverage Matrix for detailed provider logs.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border shadow-sm p-3 bg-muted/20">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Submitted Text</p>
          <p className="text-lg font-bold text-foreground mt-0.5">{diag.submittedWords} words</p>
          <p className="text-[11px] text-muted-foreground">{diag.submittedChars} chars · {diag.sentenceCount} sents</p>
        </Card>

        <Card className="border-border shadow-sm p-3 bg-muted/20">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Zoned Queries</p>
          <p className="text-lg font-bold text-foreground mt-0.5">{diag.queriesGenerated} plans</p>
          <p className="text-[11px] text-muted-foreground">5-tier fallback ladder</p>
        </Card>

        <Card className="border-border shadow-sm p-3 bg-muted/20">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Retrieval Outcome</p>
          <p className="text-lg font-bold text-foreground mt-0.5">{diag.fullTextRetrievedCount} full / {diag.abstractSnippetFallbackCount} abs</p>
          <p className="text-[11px] text-muted-foreground">{diag.failedRetrievalsCount} failed fetches</p>
        </Card>

        <Card className="border-border shadow-sm p-3 bg-muted/20">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Matcher Yield</p>
          <p className="text-lg font-bold text-foreground mt-0.5">{diag.exactMatchesFound} exact / {diag.nearMatchesFound} near</p>
          <p className="text-[11px] text-muted-foreground">{diag.verifiedParaphrasesFound} paraphrases</p>
        </Card>
      </div>

      {/* Main Inspection Accordion */}
      <Card className="border-border shadow-card">
        <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" /> 16-Point Diagnostic Telemetry Inspector
            </CardTitle>
            <CardDescription className="text-xs">
              Zero-hallucination verification telemetry derived strictly from provider queries and retrieved source texts.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleCopyJson} className="h-7 text-xs gap-1">
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy JSON'}
          </Button>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <Accordion type="multiple" defaultValue={['strategy', 'providers', 'scoring']} className="space-y-2">
            
            {/* 1. Query Strategy & Generation */}
            <AccordionItem value="strategy" className="border border-border rounded-lg px-3 py-1">
              <AccordionTrigger className="text-xs font-semibold hover:no-underline">
                <span className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-primary" /> Query Discovery Strategy & Zones
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-xs space-y-2 pt-2 text-muted-foreground">
                <div className="bg-muted p-2 rounded text-[11px] font-mono text-foreground">
                  Strategy: {diag.queryStrategy}
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Queries Sent By Provider:</p>
                  <div className="space-y-1">
                    {Object.entries(diag.queriesSentByProvider || {}).map(([provider, qList]) => (
                      <div key={provider} className="border-l-2 border-primary/40 pl-2">
                        <span className="font-semibold text-foreground capitalize">{provider}:</span>{' '}
                        {qList.length ? (
                          <ul className="list-disc pl-4 mt-0.5 space-y-0.5 font-mono text-[10px]">
                            {qList.map((q, idx) => (
                              <li key={idx} className="text-foreground/90">{q}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="italic text-muted-foreground">None sent</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 2. Provider Responses & Candidates */}
            <AccordionItem value="providers" className="border border-border rounded-lg px-3 py-1">
              <AccordionTrigger className="text-xs font-semibold hover:no-underline">
                <span className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-info" /> Provider Status & Candidate Ingestion
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-xs space-y-2 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {Object.entries(diag.providersResponded || {}).map(([prov, responded]) => (
                    <div key={prov} className="border border-border rounded p-2 bg-muted/10 flex items-center justify-between">
                      <div>
                        <p className="font-semibold capitalize text-foreground">{prov}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {diag.candidatesReturnedByProvider?.[prov] ?? 0} candidates returned
                        </p>
                      </div>
                      <Badge variant="outline" className={responded ? 'text-success border-success/30' : 'text-muted-foreground'}>
                        {responded ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        {responded ? 'Responded' : 'No Response'}
                      </Badge>
                    </div>
                  ))}
                </div>
                {diag.retrievedUrls && diag.retrievedUrls.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold text-foreground mb-1">Retrieved Sources Reaching Matcher:</p>
                    <ul className="list-disc pl-4 space-y-0.5 font-mono text-[10px] text-muted-foreground max-h-32 overflow-y-auto">
                      {diag.retrievedUrls.map((u, i) => (
                        <li key={i} className="text-foreground/80 truncate">{u}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* 3. Matcher & Scoring Formula */}
            <AccordionItem value="scoring" className="border border-border rounded-lg px-3 py-1">
              <AccordionTrigger className="text-xs font-semibold hover:no-underline">
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-warning" /> Matcher Breakdown & Scoring Formula
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-xs space-y-2 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-muted/30 border border-border p-2 rounded">
                    <p className="text-[10px] text-muted-foreground uppercase">Exact Spans</p>
                    <p className="text-base font-bold text-destructive">{diag.exactMatchesFound}</p>
                  </div>
                  <div className="bg-muted/30 border border-border p-2 rounded">
                    <p className="text-[10px] text-muted-foreground uppercase">Near Spans</p>
                    <p className="text-base font-bold text-warning">{diag.nearMatchesFound}</p>
                  </div>
                  <div className="bg-muted/30 border border-border p-2 rounded">
                    <p className="text-[10px] text-muted-foreground uppercase">Paraphrase Spans</p>
                    <p className="text-base font-bold text-info">{diag.verifiedParaphrasesFound}</p>
                  </div>
                  <div className="bg-muted/30 border border-border p-2 rounded">
                    <p className="text-[10px] text-muted-foreground uppercase">Candidate Sim</p>
                    <p className="text-base font-bold text-muted-foreground">{diag.candidateSimilaritiesFound}</p>
                  </div>
                </div>
                <div className="p-2.5 bg-muted/40 rounded border border-border">
                  <p className="text-[11px] font-semibold text-foreground">Scoring Formula:</p>
                  <p className="font-mono text-[11px] text-primary mt-0.5">{diag.scoringFormula}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Calculated unique coverage: <strong className="text-foreground">{diag.calculatedSimilarityPercentage}%</strong> (Merged non-overlapping character union).
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
