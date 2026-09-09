import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Search, Activity, Users, Zap, LayoutDashboard, Globe, ExternalLink, Bot, CheckCircle, TrendingUp, AlertCircle, FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { seoApi } from '@/lib/api/seo';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

export default function DomainOverviewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const domainParam = searchParams.get('domain');
  
  const [domainInput, setDomainInput] = useState(domainParam || '');
  const [country, setCountry] = useState('US');
  const [device, setDevice] = useState('desktop');
  
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (domainParam) {
      loadReport(domainParam);
    }
  }, [domainParam]);

  const loadReport = async (domain: string, forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      let data = null;
      if (!forceRefresh) {
        data = await seoApi.getSemrushReport(domain);
      }
      
      if (!data) {
        toast.info('Generating new comprehensive report...');
        await seoApi.analyzeDomain(domain, country, device);
        data = await seoApi.getSemrushReport(domain);
      }
      
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load report. Please regenerate analysis.');
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput) return toast.error('Please enter a domain');
    if (domainInput === domainParam) {
      loadReport(domainInput, true);
    } else {
      navigate(`/domain-overview?domain=${encodeURIComponent(domainInput)}`);
    }
  };

  // Safe checks for data structure
  const renderEmptyOrError = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground animate-pulse">Analyzing domain data...</p>
        </div>
      );
    }
    
    if (error) {
      const isApiError = error.toLowerCase().includes('api credentials not configured') || error.toLowerCase().includes('not connected');
      
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4 border rounded-xl bg-destructive/5 p-8 text-center max-w-2xl mx-auto mt-12">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <h2 className="text-xl font-bold text-destructive">
            {isApiError ? 'Real data unavailable' : 'Report could not be loaded'}
          </h2>
          <p className="text-muted-foreground">{error}</p>
          {isApiError ? (
            <Button onClick={() => navigate('/settings/api-connections')}>Connect API</Button>
          ) : (
            <Button onClick={() => loadReport(domainInput)}>Try Again</Button>
          )}
        </div>
      );
    }

    if (!reportData && !domainParam) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center mt-12">
          <Globe className="w-16 h-16 text-muted-foreground/30" />
          <h2 className="text-2xl font-bold text-foreground">Semrush-Style Domain Overview</h2>
          <p className="text-muted-foreground max-w-lg">Enter a domain above to generate a comprehensive AI Search & SEO Intelligence report.</p>
        </div>
      );
    }

    return null;
  };

  if (loading || error || !reportData) {
    return (
      <div className="flex-1 space-y-6 pb-12">
        <div className="bg-card border rounded-xl p-4 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Enter domain (e.g., example.com)" className="pl-10 h-12" value={domainInput} onChange={(e) => setDomainInput(e.target.value)} />
            </div>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-full md:w-32 h-12"><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="US">US</SelectItem><SelectItem value="UK">UK</SelectItem><SelectItem value="CA">CA</SelectItem>
              </SelectContent>
            </Select>
            <Select value={device} onValueChange={setDevice}>
              <SelectTrigger className="w-full md:w-32 h-12"><SelectValue placeholder="Device" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="desktop">Desktop</SelectItem><SelectItem value="mobile">Mobile</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" size="lg" className="h-12 shrink-0" disabled={loading}>Search</Button>
          </form>
        </div>
        {renderEmptyOrError()}
      </div>
    );
  }

  const { data, keywords, competitors, backlinks, ai_visibility } = reportData;
  const { ai_search, seo, traffic, technical_audit, content_topics } = data || {};

  return (
    <div className="flex-1 space-y-8 pb-12">
      {/* Top Search Bar */}
      <div className="bg-card border rounded-xl p-4 shadow-sm sticky top-0 z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Enter domain (e.g., example.com)" className="pl-10 h-10" value={domainInput} onChange={(e) => setDomainInput(e.target.value)} />
          </div>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-full md:w-28 h-10"><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="US">US</SelectItem><SelectItem value="UK">UK</SelectItem><SelectItem value="CA">CA</SelectItem>
            </SelectContent>
          </Select>
          <Select value={device} onValueChange={setDevice}>
            <SelectTrigger className="w-full md:w-28 h-10"><SelectValue placeholder="Device" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="desktop">Desktop</SelectItem><SelectItem value="mobile">Mobile</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" className="h-10 shrink-0">Search</Button>
        </form>
        <div className="flex gap-2 shrink-0">
          <Button type="button" variant="outline" size="sm" className="h-10" onClick={() => loadReport(reportData.domain, true)}>
            <Activity className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-10" onClick={() => toast.success('Exporting PDF...')}>
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{reportData.domain}</h1>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            {reportData.data_source || 'DataForSEO'}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <span>Generated: {new Date(reportData.generated_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Search Card */}
        <Card className="border-indigo-200 bg-indigo-50/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <Bot className="w-5 h-5" /> AI Search Intelligence
              </CardTitle>
              <CardDescription>Visibility across LLMs & AI Engines</CardDescription>
            </div>
            <div className="text-right">
              <span className="text-4xl font-bold text-indigo-600">{ai_search?.visibility_score || 0}</span>
              <p className="text-xs text-muted-foreground">AI Visibility Score</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-background rounded-lg border">
                <p className="text-2xl font-bold">{ai_search?.mentions || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">AI Mentions</p>
              </div>
              <div className="text-center p-3 bg-background rounded-lg border">
                <p className="text-2xl font-bold">{ai_search?.cited_pages || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Cited Pages</p>
              </div>
              <div className="text-center p-3 bg-background rounded-lg border">
                <p className="text-2xl font-bold">{ai_visibility?.length || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Engines</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {ai_visibility?.map((v: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{v.platform}</span>
                  <div className="flex items-center gap-3">
                    <Progress value={v.visibility_score} className="w-24 h-2" />
                    <span className="w-8 text-right font-semibold">{v.visibility_score}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SEO Card */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" /> Organic Research
              </CardTitle>
              <CardDescription>Traditional SEO Metrics</CardDescription>
            </div>
            <div className="text-right">
              <span className="text-4xl font-bold text-primary">{seo?.authority_score || 0}</span>
              <p className="text-xs text-muted-foreground">Authority Score</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Organic Traffic</p>
                <p className="text-2xl font-bold">{seo?.organic_traffic?.toLocaleString() || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Paid Traffic</p>
                <p className="text-2xl font-bold">{seo?.paid_traffic?.toLocaleString() || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Organic Keywords</p>
                <p className="text-2xl font-bold">{seo?.organic_keywords?.toLocaleString() || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Referring Domains</p>
                <p className="text-2xl font-bold">{seo?.referring_domains?.toLocaleString() || 0}</p>
              </div>
            </div>
            
            <div className="h-[80px] w-full mt-4">
              {traffic?.trend_1y && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={traffic.trend_1y}>
                    <defs>
                      <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTraffic)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traffic & Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Traffic Trend (1 Year)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {traffic?.trend_1y ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={traffic.trend_1y}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{fontSize: 12}} tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, {month:'short'})} />
                    <YAxis tick={{fontSize: 12}} tickFormatter={(v) => (v > 1000 ? `${(v/1000).toFixed(1)}k` : v)} />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={0.2} fill="hsl(var(--primary))" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No trend data available</div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Traffic Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Branded</span>
                <span className="font-bold">{traffic?.branded_percent || 0}%</span>
              </div>
              <Progress value={traffic?.branded_percent || 0} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Non-Branded</span>
                <span className="font-bold">{traffic?.non_branded_percent || 0}%</span>
              </div>
              <Progress value={traffic?.non_branded_percent || 0} className="h-2 bg-muted" />
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-3">Top Countries</h4>
              <div className="space-y-2">
                {traffic?.by_country?.slice(0,4).map((c: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2"><Globe className="w-3 h-3 text-muted-foreground" /> {c.country}</span>
                    <span className="font-medium">{c.share}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organic Keywords Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Top Organic Keywords</CardTitle>
            <CardDescription>Keywords driving the most traffic to the domain</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => {}}>View All Keywords</Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full max-w-full bg-card">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground whitespace-nowrap">
                <tr>
                  <th className="px-4 py-3 font-medium">Keyword</th>
                  <th className="px-4 py-3 font-medium">Intent</th>
                  <th className="px-4 py-3 font-medium">Pos.</th>
                  <th className="px-4 py-3 font-medium">Volume</th>
                  <th className="px-4 py-3 font-medium">KD %</th>
                  <th className="px-4 py-3 font-medium">CPC ($)</th>
                  <th className="px-4 py-3 font-medium">Traffic %</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {keywords?.slice(0, 10).map((kw: any, i: number) => (
                  <tr key={i} className="hover:bg-muted/50 whitespace-nowrap">
                    <td className="px-4 py-3 font-medium text-primary">
                      <div className="flex items-center gap-2">
                        {kw.keyword}
                        <a href={kw.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{kw.intent}</Badge></td>
                    <td className="px-4 py-3 font-semibold">{kw.position}</td>
                    <td className="px-4 py-3">{kw.volume.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={kw.difficulty > 70 ? 'text-rose-600' : kw.difficulty > 40 ? 'text-amber-600' : 'text-emerald-600'}>
                          {kw.difficulty}
                        </span>
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${kw.difficulty > 70 ? 'bg-rose-500' : kw.difficulty > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{width: `${kw.difficulty}%`}} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{kw.cpc}</td>
                    <td className="px-4 py-3">{kw.traffic_percent}%</td>
                  </tr>
                ))}
                {(!keywords || keywords.length === 0) && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No keyword data found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Competitors & Backlinks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Main Organic Competitors</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full max-w-full bg-card">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground whitespace-nowrap">
                  <tr>
                    <th className="px-4 py-3 font-medium">Domain</th>
                    <th className="px-4 py-3 font-medium">AS</th>
                    <th className="px-4 py-3 font-medium">Traffic</th>
                    <th className="px-4 py-3 font-medium">AI Vis.</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {competitors?.map((comp: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/50 whitespace-nowrap">
                      <td className="px-4 py-3 font-medium text-primary">{comp.competitor_domain}</td>
                      <td className="px-4 py-3">{comp.authority_score}</td>
                      <td className="px-4 py-3">{comp.organic_traffic.toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold text-indigo-600">{comp.ai_visibility}</td>
                    </tr>
                  ))}
                  {(!competitors || competitors.length === 0) && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No competitor data found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Backlinks</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full max-w-full bg-card">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground whitespace-nowrap">
                  <tr>
                    <th className="px-4 py-3 font-medium">Source Domain</th>
                    <th className="px-4 py-3 font-medium">AS</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {backlinks?.slice(0,5).map((bl: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/50 whitespace-nowrap">
                      <td className="px-4 py-3 font-medium">
                        <div className="truncate max-w-[200px]">{bl.source_domain}</div>
                      </td>
                      <td className="px-4 py-3">{bl.authority_score}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={bl.link_type === 'follow' ? 'text-emerald-600 border-emerald-200' : 'text-slate-500 border-slate-200'}>
                          {bl.link_type}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {(!backlinks || backlinks.length === 0) && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No backlink data found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Technical SEO Audit Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Technical Site Audit</CardTitle>
            <CardDescription>Crawlability, Core Web Vitals & Schema Check</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(`/technical-seo?domain=${encodeURIComponent(domainInput)}`)}>View Full Audit</Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 mt-4">
            <div className="bg-muted rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-emerald-600">{technical_audit?.health_score || 0}</p>
              <p className="text-sm font-medium mt-1">Site Health</p>
            </div>
            <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-rose-600">{technical_audit?.errors || 0}</p>
              <p className="text-sm font-medium mt-1">Errors</p>
            </div>
            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{technical_audit?.warnings || 0}</p>
              <p className="text-sm font-medium mt-1">Warnings</p>
            </div>
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{technical_audit?.notices || 0}</p>
              <p className="text-sm font-medium mt-1">Notices</p>
            </div>
          </div>
          
          <div className="border rounded-xl bg-card overflow-hidden">
            <div className="p-4 border-b bg-muted/30">
              <h4 className="font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                Top Issues Detected
              </h4>
            </div>
            <div className="divide-y">
              <div className="p-4 flex items-center justify-between hover:bg-muted/30">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">Error</Badge>
                  <span className="font-medium text-sm">404 Pages Found (3 pages)</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/technical-seo?domain=${encodeURIComponent(domainInput)}`)}>Details</Button>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-muted/30">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Warning</Badge>
                  <span className="font-medium text-sm">Missing Meta Descriptions (12 pages)</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/technical-seo?domain=${encodeURIComponent(domainInput)}`)}>Details</Button>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-muted/30">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Warning</Badge>
                  <span className="font-medium text-sm">Slow LCP ({">"} 2.5s) on Mobile</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/technical-seo?domain=${encodeURIComponent(domainInput)}`)}>Details</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
