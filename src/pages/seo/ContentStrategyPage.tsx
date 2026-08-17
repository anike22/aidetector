import React, { useState } from 'react';
import { Search, Download, Calendar, Layout, PenTool, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { seoApi } from '@/lib/api/seo';

export default function ContentStrategyPage() {
  const [domain, setDomain] = useState('');
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<any>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain || !keywords) return toast.error('Please enter domain and target keywords');
    try {
      setLoading(true);
      const data = await seoApi.runContentStrategy(domain, keywords);
      setStrategy(data);
      toast.success('Content Strategy generated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate strategy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Content Strategy</h1>
        <p className="text-muted-foreground mt-1">Generate topic clusters, content pillars, and publishing calendars.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Enter domain or URL" className="pl-9 h-12" value={domain} onChange={(e) => setDomain(e.target.value)} />
            </div>
            <Textarea placeholder="Enter target keywords (one per line or comma-separated)" rows={3} value={keywords} onChange={(e) => setKeywords(e.target.value)} />
            <Button type="submit" size="lg" disabled={loading} className="w-full md:w-auto">
              {loading ? 'Generating...' : 'Generate Strategy'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {strategy && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-2xl font-bold">Strategy for {strategy.domain_url}</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => toast.success('Exporting PDF...')}><Download className="w-4 h-4 mr-2" /> PDF</Button>
              <Button variant="outline" onClick={() => toast.success('Exporting CSV...')}><FileText className="w-4 h-4 mr-2" /> CSV</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <Layout className="h-8 w-8 text-blue-500 mb-2" />
                <span className="text-2xl font-bold">{strategy.content_pillars_count}</span>
                <span className="text-sm text-muted-foreground">Content Pillars</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <PenTool className="h-8 w-8 text-indigo-500 mb-2" />
                <span className="text-2xl font-bold">{strategy.topic_clusters_count}</span>
                <span className="text-sm text-muted-foreground">Topic Clusters</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <FileText className="h-8 w-8 text-emerald-500 mb-2" />
                <span className="text-2xl font-bold">{strategy.content_pieces_count}</span>
                <span className="text-sm text-muted-foreground">Content Pieces</span>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Content Pillars</CardTitle>
              <CardDescription>Main topic themes to establish authority</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium whitespace-nowrap">Pillar Name</th>
                      <th className="px-4 py-3 font-medium whitespace-nowrap">Target Keyword</th>
                      <th className="px-4 py-3 font-medium whitespace-nowrap">Traffic Score</th>
                      <th className="px-4 py-3 font-medium whitespace-nowrap">Competition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strategy.strategy_data?.pillars?.map((p: any, i: number) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-3 font-medium whitespace-nowrap">{p.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><Badge>{p.target_keyword}</Badge></td>
                        <td className="px-4 py-3 whitespace-nowrap text-emerald-600 font-medium">{p.traffic_score}/100</td>
                        <td className="px-4 py-3 whitespace-nowrap">{p.competition}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publishing Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium whitespace-nowrap">Title</th>
                      <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 font-medium whitespace-nowrap">Planned Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strategy.strategy_data?.calendar?.map((c: any, i: number) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-3 font-medium whitespace-nowrap">{c.title}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><Badge variant="outline">{c.status}</Badge></td>
                        <td className="px-4 py-3 whitespace-nowrap">{new Date(c.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
