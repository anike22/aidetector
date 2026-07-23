import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TextSearch, AlertTriangle, CheckCircle2,
  RefreshCw, Download, Save, Link2, ExternalLink
} from 'lucide-react';
import { analyzePlagiarism, type PlagiarismAnalysisResult } from './detectionEngine';

export default function PlagiarismDetector() {
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PlagiarismAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!content.trim() || content.split(/\s+/).length < 20) return;

    setIsAnalyzing(true);
    setTimeout(async () => {
      const res = await analyzePlagiarism(content);
      setResult(res);
      setIsAnalyzing(false);
    }, 1500);
  };

  const wordCount = (content.match(/\S+/g) || []).length;

  return (
    <div className="pt-2">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <Card className="border-border shadow-card overflow-hidden flex flex-col h-[400px]">
            <CardHeader className="bg-card border-b border-border py-4">
              <CardTitle className="text-base font-semibold text-navy flex items-center justify-between">
                <span>Input Text for Plagiarism Check</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
              <Textarea
                placeholder="Paste text here to check for exact matches, paraphrasing, and patchwork plagiarism..."
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
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Checking...</>
                ) : (
                  <><TextSearch className="w-4 h-4 mr-2" /> Check Plagiarism</>
                )}
              </Button>
            </div>
          </Card>

          {/* Matched Text visualization (Simplified) */}
          {result && (
            <Card className="border-border shadow-card flex-1">
              <CardHeader className="pb-3 pt-5 px-5 border-b border-border">
                <CardTitle className="text-base font-semibold text-navy flex items-center gap-2">
                  <TextSearch className="w-4 h-4 text-primary" /> Matched Sections
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 text-base leading-relaxed text-foreground/80">
                <p className="bg-warning/20 p-4 rounded-md border border-warning/30 text-sm">
                  <span className="font-semibold block mb-2 text-warning flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Plagiarized Content Found</span>
                  {result.sources.length > 0 ? 'Some sentences in your text closely match existing sources online. Review the sources panel on the right.' : 'No matched sections found in our database.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {!result ? (
            <Card className="border-border shadow-card h-full flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                <TextSearch className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-semibold text-navy mb-1">No analysis yet</p>
              <p className="text-sm text-muted-foreground text-center max-w-xs text-pretty">
                Paste your content and check for plagiarism to see sources.
              </p>
            </Card>
          ) : (
            <div className="space-y-5">
              <Card className={`border shadow-card ${
                result.originalityScore < 70 ? 'border-destructive/30 bg-destructive/5' :
                result.originalityScore < 90 ? 'border-warning/30 bg-warning/5' :
                'border-success/30 bg-success/5'
              }`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-navy flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 ${result.originalityScore >= 90 ? 'text-success' : 'text-muted-foreground'}`} /> Originality Score
                    </span>
                    <Badge variant={result.originalityScore < 70 ? 'destructive' : 'default'} className={result.originalityScore >= 90 ? 'bg-success hover:bg-success' : ''}>
                      {result.riskLevel} Risk
                    </Badge>
                  </div>
                  
                  <div className="flex items-end gap-4 mb-2">
                    <span className={`text-4xl font-extrabold ${
                      result.originalityScore < 70 ? 'text-destructive' :
                      result.originalityScore < 90 ? 'text-warning' :
                      'text-success'
                    }`}>{result.originalityScore}%</span>
                    <span className="text-sm text-muted-foreground mb-1 font-medium uppercase tracking-wider">Original</span>
                  </div>
                  
                  <Progress value={result.originalityScore} className="h-2 mb-4" />
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mt-4 pt-4 border-t border-border/50">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Exact Match:</span>
                      <span className="font-medium text-navy">{result.matchTypes.exact}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AI Paraphrased:</span>
                      <span className="font-medium text-navy">{result.matchTypes.aiParaphrased}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sources */}
              <Card className="border-border shadow-card">
                <CardHeader className="pb-2 pt-4 px-5 border-b border-border/50">
                  <CardTitle className="text-sm font-semibold text-navy flex items-center justify-between">
                    <span className="flex items-center gap-2"><Link2 className="w-4 h-4 text-primary" /> Similarity Sources</span>
                    <span className="text-xs text-muted-foreground font-normal">{result.sources.length} sources</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {result.sources.length === 0 ? (
                    <div className="p-5 text-center text-sm text-muted-foreground">No matching sources found.</div>
                  ) : (
                    <div className="divide-y divide-border/50 max-h-[300px] overflow-y-auto">
                      {result.sources.map((source, i) => (
                        <div key={i} className="p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm text-navy max-w-[80%] truncate" title={source.url}>{source.url}</span>
                            <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">{source.similarity}%</Badge>
                          </div>
                          <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                            <span>{source.matchType}</span>
                            <a href={`https://${source.url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                              View Source <ExternalLink className="w-3 h-3" />
                            </a>
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
