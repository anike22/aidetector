import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Bot, Sparkles, CheckCircle, ChevronRight, Activity, TrendingUp, 
  Target, Globe, Zap, Search, Clock, List, LayoutTemplate, Link as LinkIcon, 
  Download, Plus, Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { seoApi } from '@/lib/api/seo';
import { ResponsiveContainer, Treemap, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function SEOAgentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const keywordParam = searchParams.get('keyword');

  const [keyword, setKeyword] = useState(keywordParam || '');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planData, setPlanData] = useState<any>(null);

  useEffect(() => {
    if (keywordParam) {
      loadPlan(keywordParam);
    }
  }, [keywordParam]);

  const loadPlan = async (kw: string) => {
    try {
      setLoading(true);
      setError(null);
      let plan = await seoApi.getAdvancedSeoPlan(kw);
      if (!plan) {
        toast.info('Generating Advanced SEO Strategy...');
        await seoApi.runAdvancedSeoAgent({ keyword: kw, domain });
        plan = await seoApi.getAdvancedSeoPlan(kw);
      }
      setPlanData(plan?.data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate SEO plan');
      toast.error('Failed to generate SEO plan');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword) return toast.error('Please enter a target keyword');
    navigate(`/seo-agent?keyword=${encodeURIComponent(keyword)}`);
  };

  if (loading || !planData) {
    return (
      <div className="flex-1 space-y-6 pb-12">
        <div className="bg-card border rounded-xl p-4 shadow-sm">
          <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Enter Target Keyword..." className="pl-10 h-10" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Your Domain (Optional)" className="pl-10 h-10" value={domain} onChange={(e) => setDomain(e.target.value)} />
            </div>
            <Button type="submit" className="h-10" disabled={loading}>Generate Strategy</Button>
          </form>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-muted-foreground animate-pulse">AI Agent is crafting your end-to-end SEO strategy...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4 border rounded-xl bg-destructive/5 p-8 text-center max-w-2xl mx-auto mt-12">
            <Bot className="w-12 h-12 text-destructive" />
            <h2 className="text-xl font-bold text-destructive">
              {error.toLowerCase().includes('api credentials not configured') || error.toLowerCase().includes('not connected') 
                ? 'Real data unavailable' 
                : 'Report could not be generated.'}
            </h2>
            <p className="text-muted-foreground">{error}</p>
            {error.toLowerCase().includes('api credentials not configured') || error.toLowerCase().includes('not connected') ? (
              <Button onClick={() => window.location.href = '/settings/api-connections'}>Connect API</Button>
            ) : (
              <Button onClick={() => loadPlan(keyword)}>Try Again</Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center mt-12">
            <Bot className="w-16 h-16 text-indigo-200" />
            <h2 className="text-2xl font-bold">Advanced SEO Strategy Agent</h2>
            <p className="text-muted-foreground max-w-lg">Enter a target keyword to generate a complete step-by-step SEO execution plan covering content, backlinks, technical SEO, and AI visibility.</p>
          </div>
        )}
      </div>
    );
  }

  const { 
    executive_summary, keyword_intelligence, serp_competitors, 
    content_architecture, topic_clusters, execution_plan, 
    checklists, backlink_strategy, ai_search 
  } = planData;

  return (
    <div className="flex-1 space-y-6 pb-12 min-w-0 max-w-full">
      <div className="bg-card border rounded-xl p-4 shadow-sm sticky top-0 z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <form onSubmit={handleGenerate} className="flex gap-3 flex-1 w-full md:max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Enter Target Keyword..." className="pl-10 h-10" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <Button type="submit" size="sm" className="h-10 shrink-0">Regenerate</Button>
        </form>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-10" onClick={() => toast.success('Strategy saved to your projects!')}>
            <Save className="w-4 h-4 mr-2" /> Save
          </Button>
          <Button variant="outline" size="sm" className="h-10" onClick={() => toast.success('Exporting PDF...')}>
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold capitalize">{planData.keyword}</h1>
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          {planData.data_source || 'DataForSEO'}
        </Badge>
      </div>

      <Tabs defaultValue="executive" className="w-full">
        <div className="overflow-x-auto pb-2 -mb-2 border-b">
          <TabsList className="bg-transparent border-none p-0 inline-flex min-w-max h-10 justify-start">
            <TabsTrigger value="executive" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 h-10">Executive Summary</TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 h-10">Content Architecture</TabsTrigger>
            <TabsTrigger value="execution" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 h-10">Execution Plan</TabsTrigger>
            <TabsTrigger value="offpage" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 h-10">Backlinks & AI</TabsTrigger>
            <TabsTrigger value="checklists" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 h-10">Checklists</TabsTrigger>
          </TabsList>
        </div>

        {/* EXECUTIVE TAB */}
        <TabsContent value="executive" className="mt-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-muted-foreground text-xs uppercase font-semibold mb-1">Opportunity Score</p>
                <p className="text-3xl font-bold text-emerald-600">{executive_summary.opportunity_score}/100</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-muted-foreground text-xs uppercase font-semibold mb-1">Est. Traffic</p>
                <p className="text-3xl font-bold">{executive_summary.estimated_traffic.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-muted-foreground text-xs uppercase font-semibold mb-1">Difficulty</p>
                <p className="text-3xl font-bold text-amber-600">{executive_summary.difficulty}/100</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-muted-foreground text-xs uppercase font-semibold mb-1">Time to Rank</p>
                <p className="text-xl font-bold mt-2">{executive_summary.time_to_rank}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Keyword Intelligence</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="font-bold">{keyword_intelligence.volume.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">CPC</span>
                  <span className="font-bold">${keyword_intelligence.cpc}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Intent</span>
                  <Badge>{keyword_intelligence.intent}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-2">Secondary Keywords</span>
                  <div className="flex flex-wrap gap-2">
                    {keyword_intelligence.secondary.map((kw: string) => <Badge key={kw} variant="secondary">{kw}</Badge>)}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader><CardTitle>Top SERP Competitors</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {serp_competitors.map((comp: any, i: number) => (
                  <div key={i} className="p-3 border rounded-lg bg-muted/30">
                    <p className="font-semibold text-primary truncate">{comp.title}</p>
                    <p className="text-xs text-muted-foreground truncate mb-2">{comp.url}</p>
                    <div className="flex gap-4 text-xs">
                      <span>DA: <strong className="text-foreground">{comp.domain_authority}</strong></span>
                      <span>Words: <strong className="text-foreground">{comp.word_count}</strong></span>
                      <span>Links: <strong className="text-foreground">{comp.backlinks}</strong></span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CONTENT ARCHITECTURE TAB */}
        <TabsContent value="content" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>Page Architecture & Outline</CardTitle>
                <CardDescription>Recommended structure for your primary pillar page</CardDescription>
              </div>
              <Button onClick={() => toast.success('Content Brief PDF Generated!')}><Download className="w-4 h-4 mr-2"/> Full Brief</Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">Title Tag Ideas</h4>
                    <ul className="space-y-2">
                      {content_architecture.title_options.map((t: string) => (
                        <li key={t} className="p-2 bg-muted rounded-md text-sm border">{t}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">H2/H3 Structure</h4>
                    <ul className="space-y-2 border-l-2 border-primary ml-2 pl-4">
                      {content_architecture.h2_structure.map((h2: string) => (
                        <li key={h2} className="text-sm font-medium relative before:absolute before:-left-[21px] before:top-2 before:w-3 before:h-3 before:bg-card before:border-2 before:border-primary before:rounded-full">{h2}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 border rounded-xl bg-indigo-50/30 border-indigo-100">
                    <h4 className="font-semibold text-indigo-800 mb-2">Content Requirements</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between border-b pb-1"><span>Page Type:</span> <strong>{content_architecture.page_type}</strong></li>
                      <li className="flex justify-between border-b pb-1"><span>Target Length:</span> <strong>{executive_summary.content_depth}</strong></li>
                      <li className="flex justify-between border-b pb-1"><span>Internal Links Needed:</span> <strong>{content_architecture.internal_targets}</strong></li>
                      <li className="flex justify-between pb-1"><span>Required Schema:</span> <strong>{content_architecture.schema_needed.join(', ')}</strong></li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle>Topic Cluster Hub</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="h-64 w-full border rounded-lg p-2 bg-muted/20">
                  <h4 className="text-sm font-semibold text-center mb-2">Priority Distribution</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'High', value: topic_clusters.filter((c: any) => c.priority === 'High').length, fill: '#f43f5e' },
                        { name: 'Medium', value: topic_clusters.filter((c: any) => c.priority === 'Medium').length, fill: '#f59e0b' },
                        { name: 'Low', value: topic_clusters.filter((c: any) => c.priority === 'Low').length, fill: '#3b82f6' }
                      ]}
                      margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{fontSize: 12}} />
                      <YAxis allowDecimals={false} tick={{fontSize: 12}} />
                      <RechartsTooltip cursor={{fill: 'transparent'}} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-64 w-full border rounded-lg p-2 bg-muted/20">
                  <h4 className="text-sm font-semibold text-center mb-2">Cluster Types</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                      data={[
                        {
                          name: 'Clusters',
                          children: Object.entries(topic_clusters.reduce((acc: any, c: any) => {
                            acc[c.type] = (acc[c.type] || 0) + 1;
                            return acc;
                          }, {})).map(([name, size]) => ({ name, size }))
                        }
                      ]}
                      dataKey="size"
                      aspectRatio={4 / 3}
                      stroke="#fff"
                      fill="#818cf8"
                    >
                      <RechartsTooltip />
                    </Treemap>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Article Title</th>
                      <th className="px-4 py-3 font-medium">Content Type</th>
                      <th className="px-4 py-3 font-medium">Priority</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {topic_clusters.map((cluster: any, i: number) => (
                      <tr key={i} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{cluster.title}</td>
                        <td className="px-4 py-3"><Badge variant="outline">{cluster.type}</Badge></td>
                        <td className="px-4 py-3"><Badge className={cluster.priority === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}>{cluster.priority}</Badge></td>
                        <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" onClick={() => toast.success('Added task to execution plan!')}>Add Task</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EXECUTION PLAN TAB */}
        <TabsContent value="execution" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Step-by-Step Task Board</CardTitle>
              <CardDescription>Your roadmap to ranking on Page 1</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full max-w-full">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground whitespace-nowrap">
                    <tr>
                      <th className="px-4 py-3 font-medium">Timeline</th>
                      <th className="px-4 py-3 font-medium">Task</th>
                      <th className="px-4 py-3 font-medium">Priority</th>
                      <th className="px-4 py-3 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {execution_plan.map((task: any, i: number) => (
                      <tr key={i} className="hover:bg-muted/50 whitespace-nowrap">
                        <td className="px-4 py-3 font-semibold text-muted-foreground">{task.phase}</td>
                        <td className="px-4 py-3 text-foreground font-medium">{task.task}</td>
                        <td className="px-4 py-3"><Badge variant="outline">{task.priority}</Badge></td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="outline" className="gap-2" onClick={() => toast.success('Task marked complete!')}><CheckCircle className="w-4 h-4"/> Complete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OFF-PAGE & AI TAB */}
        <TabsContent value="offpage" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><LinkIcon className="w-5 h-5"/> Backlink Strategy</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-indigo-50 text-indigo-800 rounded-lg font-medium">
                  <span>Required Backlinks to Rank:</span>
                  <span className="text-xl font-bold">{backlink_strategy.required}</span>
                </div>
                <div>
                  <p className="font-semibold mb-2">Target Link Types:</p>
                  <div className="flex flex-wrap gap-2">
                    {backlink_strategy.targets.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
                  </div>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-800 text-sm">
                  <strong>Warning:</strong> {backlink_strategy.toxic_warnings}
                </div>
                <Button variant="outline" className="w-full" onClick={() => navigate(`/link-building?domain=${encodeURIComponent(domain)}`)}>Go to Link Building Engine</Button>
              </CardContent>
            </Card>

            <Card className="border-indigo-200">
              <CardHeader className="bg-indigo-50/50"><CardTitle className="flex items-center gap-2 text-indigo-800"><Bot className="w-5 h-5"/> AI Visibility Tactics</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <p className="font-semibold text-sm">ChatGPT Optimization</p>
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{ai_search.chatgpt_strategy}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Gemini Optimization</p>
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{ai_search.gemini_strategy}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Perplexity Optimization</p>
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{ai_search.perplexity_strategy}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CHECKLISTS TAB */}
        <TabsContent value="checklists" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>On-Page Checklist</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {checklists.on_page.map((item: string, i: number) => (
                    <li key={i} className="flex items-center gap-3">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Technical Checklist</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {checklists.technical.map((item: string, i: number) => (
                    <li key={i} className="flex items-center gap-3">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
