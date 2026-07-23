import React, { useState } from 'react';
import { Search, Download, AlertTriangle, CheckCircle, Info, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { seoApi } from '@/lib/api/seo';

export default function SEOAuditPage() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState<any>(null);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return toast.error('Please enter a domain');
    try {
      setLoading(true);
      const data = await seoApi.runSEOAudit(domain);
      setAudit(data);
      toast.success('SEO Audit completed!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to run SEO audit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">On-Page & Content SEO Audit</h1>
        <p className="text-muted-foreground mt-1">Analyze title tags, headings, content quality, and identify critical on-page issues.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleAudit} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter domain or URL to audit (e.g., example.com)"
                className="pl-9 h-12"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? 'Running Audit...' : 'Run Audit'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {audit && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Audit Results for {audit.domain_url}</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => toast.success('Exporting PDF...')}><Download className="w-4 h-4 mr-2" /> Export PDF</Button>
              <Button variant="outline" onClick={() => toast.success('Exporting CSV...')}><FileText className="w-4 h-4 mr-2" /> Export CSV</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="md:col-span-2 bg-primary/5 border-primary/20">
              <CardContent className="pt-6 flex flex-col items-center text-center justify-center">
                <span className="text-sm font-medium text-muted-foreground mb-2">Overall SEO Score</span>
                <span className="text-6xl font-bold text-primary">{audit.overall_seo_score}</span>
                <Progress value={audit.overall_seo_score} className="w-full max-w-xs mt-4" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center justify-center h-full">
                <span className="text-sm font-medium text-muted-foreground mb-2">On-Page Score</span>
                <span className="text-4xl font-bold text-foreground">{audit.on_page_seo_score}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center justify-center h-full">
                <span className="text-sm font-medium text-muted-foreground mb-2">Content Score</span>
                <span className="text-4xl font-bold text-foreground">{audit.content_seo_score}</span>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-rose-200 bg-rose-50/50">
              <CardContent className="pt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-rose-500" />
                  <div>
                    <div className="text-2xl font-bold text-rose-700">{audit.critical_issues_count}</div>
                    <div className="text-sm font-medium text-rose-600">Critical Issues</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="pt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Info className="h-8 w-8 text-amber-500" />
                  <div>
                    <div className="text-2xl font-bold text-amber-700">{audit.warnings_count}</div>
                    <div className="text-sm font-medium text-amber-600">Warnings</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="pt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                  <div>
                    <div className="text-2xl font-bold text-emerald-700">{audit.opportunities_count}</div>
                    <div className="text-sm font-medium text-emerald-600">Opportunities</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Title & Meta Tag Analysis</CardTitle>
                <CardDescription>Based on {audit.audit_data?.titles?.total_pages || 0} pages crawled</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Missing Titles</span>
                  <Badge variant={audit.audit_data?.titles?.missing > 0 ? "destructive" : "secondary"}>
                    {audit.audit_data?.titles?.missing || 0} pages
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Duplicate Titles</span>
                  <Badge variant={audit.audit_data?.titles?.duplicate > 0 ? "destructive" : "secondary"}>
                    {audit.audit_data?.titles?.duplicate || 0} pages
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Titles Too Long (&gt;60 chars)</span>
                  <Badge variant="outline" className="text-amber-600">
                    {audit.audit_data?.titles?.too_long || 0} pages
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Titles Too Short (&lt;30 chars)</span>
                  <Badge variant="outline" className="text-amber-600">
                    {audit.audit_data?.titles?.too_short || 0} pages
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Quality</CardTitle>
                <CardDescription>Readability and semantic analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Average Readability Score</span>
                  <span className="font-bold">{audit.audit_data?.content?.readability || 0}/100</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Average Word Count</span>
                  <span className="font-bold">{audit.audit_data?.content?.avg_words || 0} words</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Missing Key Entities</span>
                  <Badge variant={audit.audit_data?.content?.missing_entities > 0 ? "destructive" : "secondary"}>
                    {audit.audit_data?.content?.missing_entities || 0} entities
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
