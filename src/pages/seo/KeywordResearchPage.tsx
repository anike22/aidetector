import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, Download, TrendingUp, BarChart2, MessageSquare, Link as LinkIcon, 
  List, Zap, Globe, FileText, CheckCircle, Target, Users, AlertCircle, Sparkles
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
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function KeywordResearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const keywordParam = searchParams.get('keyword');

  const [keywordInput, setKeywordInput] = useState(keywordParam || '');
  const [country, setCountry] = useState('US');
  const [language, setLanguage] = useState('en');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  React.useEffect(() => {
    if (keywordParam) {
      loadReport(keywordParam);
    }
  }, [keywordParam]);

  const loadReport = async (kw: string) => {
    try {
      setLoading(true);
      setError(null);
      let data = await seoApi.getKeywordIntelligenceReport(kw);

      if (!data) {
        toast.info('Generating advanced keyword intelligence...');
        data = await seoApi.runKeywordIntelligence(kw, country, language);
        data = await seoApi.getKeywordIntelligenceReport(kw);
      }
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load keyword intelligence.');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywordInput) return toast.error('Please enter a seed keyword');
    navigate(`/keyword-research?keyword=${encodeURIComponent(keywordInput)}`);
  };

  const [generatingBrief, setGeneratingBrief] = useState(false);

  const handleGenerateBrief = async (clusterName: string) => {
    try {
      setGeneratingBrief(true);
      toast.info(`Generating Content Brief for ${clusterName}...`);
      
      const content = `# Content Brief: ${clusterName}
      
Target Keyword: ${clusterName}
Search Intent: Informational / Commercial

## 1. Introduction
Write a compelling introduction covering the main topic.

## 2. Core Entities to Include
- Entity 1
- Entity 2
- Entity 3

## 3. Recommended Structure
- H2: What is ${clusterName}?
- H2: Key Benefits
- H2: How to Choose
- H2: Common Pitfalls

## 4. Suggested FAQs
- What is the best approach for ${clusterName}?
- How much does it cost?
- How long does it take?

## 5. AI Optimization
Ensure conversational tone and use schema markup for FAQs.
      `;
      
      await seoApi.generatePdf(`Content_Brief_${clusterName}`, content);
      toast.success('Content Brief generated and downloaded successfully!');
    } catch (error: any) {
      toast.error('Failed to generate PDF: ' + error.message);
    } finally {
      setGeneratingBrief(false);
    }
  };

  const renderEmptyOrError = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground animate-pulse">Running Intelligence Engine (DataForSEO + OpenAI)...</p>
        </div>
      );
    }
    
    if (error) {
      const isApiError = error.toLowerCase().includes('api credentials not configured') || error.toLowerCase().includes('not connected');
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4 border rounded-xl bg-destructive/5 p-8 text-center max-w-2xl mx-auto mt-12">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <h2 className="text-xl font-bold text-destructive">
            {isApiError ? 'Real data unavailable' : 'Report could not be generated.'}
          </h2>
          <p className="text-muted-foreground">{error}</p>
          {isApiError ? (
            <Button onClick={() => navigate('/settings/api-connections')}>Connect API</Button>
          ) : (
            <Button onClick={() => loadReport(keywordInput)}>Try Again</Button>
          )}
        </div>
      );
    }

    if (!reportData && !keywordParam) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center mt-12">
          <Sparkles className="w-16 h-16 text-muted-foreground/30" />
          <h2 className="text-2xl font-bold text-foreground">Keyword Intelligence Engine</h2>
          <p className="text-muted-foreground max-w-lg">Enter a seed keyword above to generate a comprehensive Keyword Intelligence report including SERP features, clustering, and AI visibility.</p>
        </div>
      );
    }

    return null;
  };

  if (loading || error || !reportData) {
    return (
      <div className="flex-1 space-y-6 pb-12">
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Enter seed keyword..." className="pl-10 h-10" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} />
            </div>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-full md:w-28 h-10"><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="US">US</SelectItem><SelectItem value="UK">UK</SelectItem><SelectItem value="CA">CA</SelectItem>
              </SelectContent>
            </Select>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full md:w-28 h-10"><SelectValue placeholder="Language" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">EN</SelectItem><SelectItem value="es">ES</SelectItem><SelectItem value="fr">FR</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" size="sm" className="h-10 shrink-0" disabled={loading}>Analyze</Button>
          </form>
        </div>
        {renderEmptyOrError()}
      </div>
    );
  }

  const { data, data_source } = reportData;
  const { overview, keyword_ideas, questions, competitors, serp_analysis, clusters, ai_search_opportunity } = data || {};

  return (
    <div className="flex-1 space-y-6 pb-12 min-w-0 max-w-full">
      {/* Top Search Bar */}
      <div className="bg-card border rounded-xl p-4 shadow-sm sticky top-0 z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Enter seed keyword..." className="pl-10 h-10" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} />
          </div>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-full md:w-28 h-10"><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="US">US</SelectItem><SelectItem value="UK">UK</SelectItem><SelectItem value="CA">CA</SelectItem>
            </SelectContent>
          </Select>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full md:w-28 h-10"><SelectValue placeholder="Language" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">EN</SelectItem><SelectItem value="es">ES</SelectItem><SelectItem value="fr">FR</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" className="h-10 shrink-0">Analyze</Button>
        </form>
        <div className="flex gap-2 shrink-0">
          <Button type="button" variant="outline" size="sm" className="h-10" onClick={() => toast.success('Exporting Data...')}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold capitalize">{reportData.seed_keyword}</h1>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            {data_source || 'DataForSEO'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <div className="overflow-x-auto pb-2 -mb-2 border-b">
          <TabsList className="bg-transparent border-none p-0 inline-flex min-w-max h-10 justify-start">
            <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 h-10">Overview</TabsTrigger>
            <TabsTrigger value="ideas" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 h-10">Keyword Ideas</TabsTrigger>
            <TabsTrigger value="questions" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 h-10">Questions</TabsTrigger>
            <TabsTrigger value="serp" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 h-10">SERP Analysis</TabsTrigger>
            <TabsTrigger value="clusters" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 h-10">Clusters</TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 h-10 text-indigo-600">AI Opportunity</TabsTrigger>
          </TabsList>
        </div>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Volume</p>
                <p className="text-2xl font-bold">{overview?.total_volume?.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Keywords</p>
                <p className="text-2xl font-bold">{overview?.total_keywords?.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Avg KD%</p>
                <p className="text-2xl font-bold text-amber-600">{overview?.avg_kd}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Avg CPC</p>
                <p className="text-2xl font-bold">${overview?.avg_cpc}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Opportunity</p>
                <p className="text-2xl font-bold text-emerald-600">{overview?.avg_opportunity}/100</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Trend Score</p>
                <p className="text-2xl font-bold text-blue-600">{overview?.trend_score}/100</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Trend (12 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  {overview?.trend_data ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={overview.trend_data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{fontSize: 12}} tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, {month:'short'})} />
                        <YAxis tick={{fontSize: 12}} tickFormatter={(v) => (v > 1000 ? `${(v/1000).toFixed(1)}k` : v)} />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={0.2} fill="hsl(var(--primary))" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">No trend data</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Search Intent Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 mt-4">
                  {overview?.intent_distribution && Object.entries(overview.intent_distribution).map(([intent, pct]: any) => (
                    <div key={intent}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">{intent}</span>
                        <span className="font-bold">{pct}%</span>
                      </div>
                      <Progress value={pct} className={`h-2 ${intent === 'Informational' ? '[&>div]:bg-blue-500' : intent === 'Commercial' ? '[&>div]:bg-amber-500' : intent === 'Transactional' ? '[&>div]:bg-emerald-500' : '[&>div]:bg-purple-500'}`} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* KEYWORD IDEAS TAB */}
        <TabsContent value="ideas" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Keyword Ideas</CardTitle>
                <CardDescription>Comprehensive list of related keywords and variations</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full max-w-full bg-card">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground whitespace-nowrap">
                    <tr>
                      <th className="px-4 py-3 font-medium">Keyword</th>
                      <th className="px-4 py-3 font-medium">Intent</th>
                      <th className="px-4 py-3 font-medium">Volume</th>
                      <th className="px-4 py-3 font-medium">KD %</th>
                      <th className="px-4 py-3 font-medium">CPC</th>
                      <th className="px-4 py-3 font-medium">Competition</th>
                      <th className="px-4 py-3 font-medium">AI Opp.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {keyword_ideas?.map((kw: any, i: number) => (
                      <tr key={i} className="hover:bg-muted/50 whitespace-nowrap">
                        <td className="px-4 py-3 font-medium text-primary">{kw.keyword}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-xs ${kw.intent === 'Informational' ? 'text-blue-600 bg-blue-50' : kw.intent === 'Commercial' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'}`}>
                            {kw.intent}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{kw.volume.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={kw.kd > 70 ? 'text-rose-600' : kw.kd > 40 ? 'text-amber-600' : 'text-emerald-600'}>
                            {kw.kd}
                          </span>
                        </td>
                        <td className="px-4 py-3">${kw.cpc}</td>
                        <td className="px-4 py-3">{kw.competition}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-indigo-600">{kw.ai_opportunity}</span>
                            <Progress value={kw.ai_opportunity} className="w-16 h-1.5 [&>div]:bg-indigo-500 bg-indigo-100" />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!keyword_ideas || keyword_ideas.length === 0) && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No keywords found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QUESTIONS TAB */}
        <TabsContent value="questions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Questions (People Also Ask)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full max-w-full bg-card">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground whitespace-nowrap">
                    <tr>
                      <th className="px-4 py-3 font-medium">Question</th>
                      <th className="px-4 py-3 font-medium">Volume</th>
                      <th className="px-4 py-3 font-medium">KD %</th>
                      <th className="px-4 py-3 font-medium">AI Citation Prob.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {questions?.map((q: any, i: number) => (
                      <tr key={i} className="hover:bg-muted/50 whitespace-nowrap">
                        <td className="px-4 py-3 font-medium">{q.question}</td>
                        <td className="px-4 py-3">{q.volume.toLocaleString()}</td>
                        <td className="px-4 py-3">{q.kd}</td>
                        <td className="px-4 py-3 font-semibold text-indigo-600">{q.ai_citation_opportunity}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SERP ANALYSIS TAB */}
        <TabsContent value="serp" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 SERP Results</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full max-w-full bg-card">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground whitespace-nowrap">
                    <tr>
                      <th className="px-4 py-3 font-medium">Pos</th>
                      <th className="px-4 py-3 font-medium">URL</th>
                      <th className="px-4 py-3 font-medium">Authority</th>
                      <th className="px-4 py-3 font-medium">Backlinks</th>
                      <th className="px-4 py-3 font-medium">Traffic</th>
                      <th className="px-4 py-3 font-medium">Word Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {serp_analysis?.map((res: any, i: number) => (
                      <tr key={i} className="hover:bg-muted/50 whitespace-nowrap">
                        <td className="px-4 py-3 font-bold">{res.position}</td>
                        <td className="px-4 py-3 text-primary truncate max-w-[300px] block">{res.url}</td>
                        <td className="px-4 py-3">{res.authority}</td>
                        <td className="px-4 py-3">{res.backlinks.toLocaleString()}</td>
                        <td className="px-4 py-3">{res.traffic.toLocaleString()}</td>
                        <td className="px-4 py-3">{res.word_count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CLUSTERS TAB */}
        <TabsContent value="clusters" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clusters?.map((cluster: any, i: number) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{cluster.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm">
                      <p className="text-muted-foreground">Total Volume</p>
                      <p className="font-bold text-lg">{cluster.volume.toLocaleString()}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground">Avg KD</p>
                      <p className="font-bold text-lg">{cluster.avg_kd}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground">Keywords</p>
                      <p className="font-bold text-lg">{cluster.keywords_count}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => handleGenerateBrief(cluster.name)} disabled={generatingBrief}>
                    Create Content Brief PDF
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* AI OPPORTUNITY TAB */}
        <TabsContent value="ai" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-indigo-200 bg-indigo-50/10 lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-700">
                  <Bot className="w-5 h-5" /> AI Search Opportunity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-6xl font-bold text-indigo-600">{ai_search_opportunity?.overall_score || 0}</p>
                  <p className="text-sm font-medium mt-2">Overall AI Opportunity</p>
                </div>
                <div className="space-y-4 pt-4 border-t border-indigo-100">
                  <div>
                    <div className="flex justify-between text-sm mb-1"><span>ChatGPT Opportunity</span><span className="font-bold">{ai_search_opportunity?.chatgpt_opp}%</span></div>
                    <Progress value={ai_search_opportunity?.chatgpt_opp} className="h-2 [&>div]:bg-indigo-500 bg-indigo-100" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1"><span>Gemini Opportunity</span><span className="font-bold">{ai_search_opportunity?.gemini_opp}%</span></div>
                    <Progress value={ai_search_opportunity?.gemini_opp} className="h-2 [&>div]:bg-blue-500 bg-blue-100" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1"><span>Perplexity Opportunity</span><span className="font-bold">{ai_search_opportunity?.perplexity_opp}%</span></div>
                    <Progress value={ai_search_opportunity?.perplexity_opp} className="h-2 [&>div]:bg-emerald-500 bg-emerald-100" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Missing Entities for AI Search</CardTitle>
                  <CardDescription>Include these entities in your content to increase AI engine citation probability</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {ai_search_opportunity?.missing_entities?.map((entity: string, i: number) => (
                      <Badge key={i} variant="secondary" className="px-3 py-1 text-sm bg-muted">
                        {entity}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Suggested FAQs for AI Optimization</CardTitle>
                  <CardDescription>AI engines frequently answer these specific questions. Add them to your FAQ schema.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {ai_search_opportunity?.suggested_faqs?.map((faq: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm p-3 bg-muted/30 rounded-lg border">
                        <MessageSquare className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <span className="font-medium">{faq}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}

function Bot(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}
