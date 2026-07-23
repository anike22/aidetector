import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Quote, RefreshCw, CheckCircle2,
  AlertTriangle, XCircle, Download, Save,
  Link as LinkIcon, ShieldCheck
} from 'lucide-react';
import { verifyCitations, type CitationVerificationResult } from './detectionEngine';

export default function CitationVerifier() {
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CitationVerificationResult | null>(null);

  const handleAnalyze = async () => {
    if (!content.trim() || content.split(/\s+/).length < 20) return;

    setIsAnalyzing(true);
    setTimeout(async () => {
      const res = await verifyCitations(content);
      setResult(res);
      setIsAnalyzing(false);
    }, 1500);
  };

  const wordCount = (content.match(/\S+/g) || []).length;

  return (
    <div className="pt-2">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input and Citations */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <Card className="border-border shadow-card overflow-hidden flex flex-col h-[300px]">
            <CardHeader className="bg-card border-b border-border py-4">
              <CardTitle className="text-base font-semibold text-navy flex items-center justify-between">
                <span>Input Text with Citations/References</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
              <Textarea
                placeholder="Paste your academic or professional text here to verify all citations, links, and references..."
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
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                ) : (
                  <><Quote className="w-4 h-4 mr-2" /> Verify Citations</>
                )}
              </Button>
            </div>
          </Card>

          {/* Citations List */}
          {result && (
            <Card className="border-border shadow-card flex-1">
              <CardHeader className="pb-3 pt-5 px-5 border-b border-border">
                <CardTitle className="text-base font-semibold text-navy flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Scanned Citations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {result.citations.length === 0 ? (
                  <div className="p-5 text-center text-sm text-muted-foreground">No citations or references found in the text.</div>
                ) : (
                  <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                    {result.citations.map((citation, i) => (
                      <div key={i} className="p-5 hover:bg-muted/10 transition-colors">
                        <div className="flex items-start gap-3 mb-3">
                          {citation.status === 'Valid' ? (
                            <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                          ) : citation.status === 'Mismatched' ? (
                            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-navy">{citation.text}</p>
                            {citation.url && (
                              <a href={`https://${citation.url}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                                <LinkIcon className="w-3 h-3" /> {citation.url}
                              </a>
                            )}
                          </div>
                          <Badge variant="outline" className={`shrink-0 ${
                            citation.status === 'Valid' ? 'border-success/50 text-success' : 
                            citation.status === 'Mismatched' ? 'border-warning/50 text-warning' : 'border-destructive/50 text-destructive'
                          }`}>{citation.status}</Badge>
                        </div>
                        
                        <div className="ml-8 grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between bg-muted/50 p-1.5 rounded">
                            <span className="text-muted-foreground">URL Exists:</span>
                            <span className="font-medium text-navy">{citation.details.urlExists ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex justify-between bg-muted/50 p-1.5 rounded">
                            <span className="text-muted-foreground">Source Exists:</span>
                            <span className="font-medium text-navy">{citation.details.sourceExists ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex justify-between bg-muted/50 p-1.5 rounded">
                            <span className="text-muted-foreground">Matches Claim:</span>
                            <span className="font-medium text-navy">{citation.details.matchesClaim ? 'Yes' : citation.details.matchesClaim === false ? 'No' : 'Partial'}</span>
                          </div>
                          <div className="flex justify-between bg-muted/50 p-1.5 rounded">
                            <span className="text-muted-foreground">Authority:</span>
                            <span className="font-medium text-navy">{citation.details.authority}</span>
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
                <Quote className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-semibold text-navy mb-1">No analysis yet</p>
              <p className="text-sm text-muted-foreground text-center max-w-xs text-pretty">
                Paste your content to verify citations, links, and academic references.
              </p>
            </Card>
          ) : (
            <div className="space-y-5">
              <Card className={`border shadow-card ${
                result.citationQualityScore < 50 ? 'border-destructive/30 bg-destructive/5' :
                result.citationQualityScore < 80 ? 'border-warning/30 bg-warning/5' :
                'border-success/30 bg-success/5'
              }`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-navy flex items-center gap-2">
                      <ShieldCheck className={`w-4 h-4 ${result.citationQualityScore >= 80 ? 'text-success' : 'text-primary'}`} /> Citation Quality Score
                    </span>
                    <Badge variant={result.citationQualityScore < 50 ? 'destructive' : 'default'} className={result.citationQualityScore >= 80 ? 'bg-success hover:bg-success' : ''}>
                      {result.riskLevel} Risk
                    </Badge>
                  </div>
                  
                  <div className="flex items-end gap-4 mb-2">
                    <span className={`text-4xl font-extrabold ${
                      result.citationQualityScore < 50 ? 'text-destructive' :
                      result.citationQualityScore < 80 ? 'text-warning' :
                      'text-success'
                    }`}>{result.citationQualityScore}/100</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Overall reliability and accuracy of the references provided in the text.</p>
                </CardContent>
              </Card>

              {/* Flagged Citations */}
              <Card className="border-border shadow-card">
                <CardHeader className="pb-2 pt-4 px-5 border-b border-border/50">
                  <CardTitle className="text-sm font-semibold text-navy flex items-center justify-between">
                    <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" /> Flagged Citations</span>
                    <Badge variant="outline">{result.flaggedCitations.length} Issues</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {result.flaggedCitations.length === 0 ? (
                    <div className="p-5 text-center text-sm text-success font-medium">All citations are valid and accurate!</div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {result.flaggedCitations.map((flag, i) => (
                        <div key={i} className="p-4">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider mb-2 inline-block ${
                            flag.type === 'Fake' ? 'bg-destructive/10 text-destructive' :
                            flag.type === 'Broken' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'
                          }`}>{flag.type}</span>
                          <p className="text-sm text-foreground/80 font-medium mb-1 truncate">"{flag.text}"</p>
                          <p className="text-xs text-muted-foreground">{flag.reason}</p>
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
