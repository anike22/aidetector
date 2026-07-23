import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert, RefreshCw, CheckCircle2,
  AlertTriangle, XCircle, Download, Save,
  BarChart2, FileQuestion
} from 'lucide-react';
import { analyzeHallucination, type HallucinationAnalysisResult } from './detectionEngine';

export default function HallucinationDetector() {
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<HallucinationAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!content.trim() || content.split(/\s+/).length < 20) return;

    setIsAnalyzing(true);
    setTimeout(async () => {
      const res = await analyzeHallucination(content);
      setResult(res);
      setIsAnalyzing(false);
    }, 1500);
  };

  const wordCount = (content.match(/\S+/g) || []).length;

  return (
    <div className="pt-2">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input and Claims */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <Card className="border-border shadow-card overflow-hidden flex flex-col h-[300px]">
            <CardHeader className="bg-card border-b border-border py-4">
              <CardTitle className="text-base font-semibold text-navy flex items-center justify-between">
                <span>Input Text for Hallucination Check</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
              <Textarea
                placeholder="Paste text containing facts, statistics, or claims to verify their authenticity..."
                className="w-full h-full resize-none border-0 focus-visible:ring-0 rounded-none p-5 text-base leading-relaxed bg-transparent"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </CardContent>
            <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between">
              <span className={`text-sm font-medium ${wordCount < 20 ? 'text-warning' : 'text-muted-foreground'}`}>
                {wordCount} words
              </span>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !content.trim()}
                className="h-10 px-6 bg-primary text-primary-foreground font-medium"
              >
                {isAnalyzing ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Detecting...</>
                ) : (
                  <><ShieldAlert className="w-4 h-4 mr-2" /> Detect Hallucinations</>
                )}
              </Button>
            </div>
          </Card>

          {/* Factual Claims */}
          {result && (
            <Card className="border-border shadow-card flex-1">
              <CardHeader className="pb-3 pt-5 px-5 border-b border-border">
                <CardTitle className="text-base font-semibold text-navy flex items-center gap-2">
                  <FileQuestion className="w-4 h-4 text-primary" /> Extracted Factual Claims
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {result.claims.length === 0 ? (
                  <div className="p-5 text-center text-sm text-muted-foreground">No factual claims extracted.</div>
                ) : (
                  <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                    {result.claims.map((claim, i) => (
                      <div key={i} className="p-5 hover:bg-muted/10 transition-colors">
                        <div className="flex items-start gap-3 mb-2">
                          {claim.status === 'Verified' ? (
                            <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                          ) : claim.status === 'Questionable' ? (
                            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="text-sm text-foreground/90 font-medium leading-relaxed">{claim.text}</p>
                            {claim.evidence && (
                              <p className="text-xs text-muted-foreground mt-1 bg-muted/50 p-2 rounded border border-border/50">
                                <strong>Evidence:</strong> {claim.evidence}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {!result ? (
            <Card className="border-border shadow-card h-full flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                <ShieldAlert className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-semibold text-navy mb-1">No analysis yet</p>
              <p className="text-sm text-muted-foreground text-center max-w-xs text-pretty">
                Paste your content to check for AI hallucinations and fabricated facts.
              </p>
            </Card>
          ) : (
            <div className="space-y-5">
              <Card className={`border shadow-card ${
                result.hallucinationRiskScore >= 70 ? 'border-destructive/30 bg-destructive/5' :
                result.hallucinationRiskScore >= 40 ? 'border-warning/30 bg-warning/5' :
                'border-success/30 bg-success/5'
              }`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-navy flex items-center gap-2">
                      <ShieldAlert className={`w-4 h-4 ${result.hallucinationRiskScore >= 70 ? 'text-destructive' : 'text-primary'}`} /> Hallucination Risk
                    </span>
                    <Badge variant={result.hallucinationRiskScore >= 70 ? 'destructive' : 'default'} className={result.hallucinationRiskScore < 40 ? 'bg-success hover:bg-success' : ''}>
                      {result.riskLevel} Risk
                    </Badge>
                  </div>
                  
                  <div className="flex items-end gap-4 mb-2">
                    <span className={`text-4xl font-extrabold ${
                      result.hallucinationRiskScore >= 70 ? 'text-destructive' :
                      result.hallucinationRiskScore >= 40 ? 'text-warning' :
                      'text-success'
                    }`}>{result.hallucinationRiskScore}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Probability of containing fabricated facts or hallucinated statistics.</p>
                  
                  <div className="grid grid-cols-3 gap-2 text-center mt-4 pt-4 border-t border-border/50">
                    <div className="bg-card border border-border rounded-md p-2">
                      <div className="text-xl font-bold text-success">{result.summary.verified}</div>
                      <div className="text-xs text-muted-foreground uppercase">Verified</div>
                    </div>
                    <div className="bg-card border border-border rounded-md p-2">
                      <div className="text-xl font-bold text-warning">{result.summary.questionable}</div>
                      <div className="text-xs text-muted-foreground uppercase">Questionable</div>
                    </div>
                    <div className="bg-card border border-border rounded-md p-2">
                      <div className="text-xl font-bold text-destructive">{result.summary.unsupported}</div>
                      <div className="text-xs text-muted-foreground uppercase">Unsupported</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detected Issues */}
              <Card className="border-border shadow-card">
                <CardHeader className="pb-2 pt-4 px-5 border-b border-border/50">
                  <CardTitle className="text-sm font-semibold text-navy flex items-center justify-between">
                    <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" /> Detected Issues</span>
                    <Badge variant="outline">{result.issues.length} Found</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {result.issues.length === 0 ? (
                    <div className="p-5 text-center text-sm text-success font-medium">No hallucination issues detected!</div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {result.issues.map((issue, i) => (
                        <div key={i} className="p-4 flex items-start gap-3">
                          <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                          <div>
                            <span className="text-sm font-semibold text-navy capitalize">{issue.type.replace('-', ' ')}</span>
                            <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3">
                <Button type="button" className="flex-1 h-10 gap-2 bg-primary text-primary-foreground" onClick={() => {}}>
                  <Download className="w-4 h-4" /> Export Report
                </Button>
                <Button type="button" variant="outline" className="flex-1 h-10 gap-2 border-border text-foreground/70 hover:text-foreground" onClick={() => {}}>
                  <Save className="w-4 h-4" /> Save Report
                </Button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
