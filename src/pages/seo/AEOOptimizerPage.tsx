import React, { useState } from 'react';
import { Search, Download, Zap, MessageSquare, ListChecks, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { seoApi } from '@/lib/api/seo';

export default function AEOOptimizerPage() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return toast.error('Please enter a domain');
    try {
      setLoading(true);
      const data = await seoApi.runAEOOptimizer(domain);
      setReport(data);
      toast.success('AEO Analysis completed!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to run AEO analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AEO Optimizer</h1>
        <p className="text-muted-foreground mt-1">Optimize content for AI search engines and answer engines.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleAudit} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter domain or URL to optimize for AEO (e.g., example.com)"
                className="pl-9 h-12"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? 'Running Analysis...' : 'Run AEO Analysis'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {report && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">AEO Results for {report.domain_url}</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => toast.success('Exporting PDF...')}><Download className="w-4 h-4 mr-2" /> Export PDF</Button>
              <Button variant="outline" onClick={() => toast.success('Exporting CSV...')}><FileText className="w-4 h-4 mr-2" /> Export CSV</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
            <Card className="col-span-2 md:col-span-2 bg-primary/5 border-primary/20">
              <CardContent className="pt-6 flex flex-col items-center text-center justify-center">
                <span className="text-sm font-medium text-muted-foreground mb-2">Overall AEO Score</span>
                <span className="text-6xl font-bold text-primary">{report.overall_aeo_score}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center justify-center h-full">
                <span className="text-sm font-medium text-muted-foreground mb-2">Question Cov.</span>
                <span className="text-2xl font-bold">{report.question_coverage_score}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center justify-center h-full">
                <span className="text-sm font-medium text-muted-foreground mb-2">Entity Cov.</span>
                <span className="text-2xl font-bold">{report.entity_coverage_score}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center justify-center h-full">
                <span className="text-sm font-medium text-muted-foreground mb-2">FAQ Quality</span>
                <span className="text-2xl font-bold">{report.faq_quality_score}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center justify-center h-full">
                <span className="text-sm font-medium text-muted-foreground mb-2">E-E-A-T</span>
                <span className="text-2xl font-bold">{report.eeat_score}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center justify-center h-full">
                <span className="text-sm font-medium text-muted-foreground mb-2">Schema</span>
                <span className="text-2xl font-bold">{report.structured_data_score}</span>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" /> AI Platform Visibility
                </CardTitle>
                <CardDescription>How often you appear in AI models</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">ChatGPT</span>
                    <span className="font-bold">{report.aeo_data?.platforms?.chatgpt}/100</span>
                  </div>
                  <Progress value={report.aeo_data?.platforms?.chatgpt} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">Gemini</span>
                    <span className="font-bold">{report.aeo_data?.platforms?.gemini}/100</span>
                  </div>
                  <Progress value={report.aeo_data?.platforms?.gemini} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">Claude</span>
                    <span className="font-bold">{report.aeo_data?.platforms?.claude}/100</span>
                  </div>
                  <Progress value={report.aeo_data?.platforms?.claude} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">Perplexity</span>
                    <span className="font-bold">{report.aeo_data?.platforms?.perplexity}/100</span>
                  </div>
                  <Progress value={report.aeo_data?.platforms?.perplexity} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" /> Missing Questions & Entities
                </CardTitle>
                <CardDescription>Topics your competitors answer but you don't</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3 border-b pb-2">Top Missing Questions</h4>
                  <ul className="space-y-3">
                    {report.aeo_data?.missing_questions?.map((mq: any, i: number) => (
                      <li key={i} className="flex justify-between items-center text-sm">
                        <span className="truncate max-w-[70%]">{mq.q}</span>
                        <Badge variant="secondary">{mq.vol} vol</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-3 border-b pb-2">Missing Entities</h4>
                  <ul className="space-y-3">
                    {report.aeo_data?.missing_entities?.map((me: any, i: number) => (
                      <li key={i} className="flex justify-between items-center text-sm">
                        <span>{me.e}</span>
                        <span className="text-muted-foreground">Rel: {me.rel}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
