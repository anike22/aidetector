import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Activity, ArrowRight, BarChart2, Globe, Search, 
  ShieldAlert, Target, Zap, LayoutDashboard, Plus, Eye,
  Link as LinkIcon, Search as SearchIcon, Server, Bot
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { seoApi } from '@/lib/api/seo';
import { SEOProject, DomainOverviewReport } from '@/types/seo';

// Add to generic routes layout later
export default function SEODashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<SEOProject[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [domainToAnalyze, setDomainToAnalyze] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [projectsData, reportsData] = await Promise.all([
        seoApi.getProjects(),
        seoApi.getRecentReports(10)
      ]);
      setProjects(projectsData);
      setReports(reportsData);
    } catch (error: any) {
      toast.error('Failed to load SEO dashboard data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainToAnalyze) {
      toast.error('Please enter a domain');
      return;
    }
    
    // We can just navigate to the domain overview page and let it handle the analysis/fetching
    navigate(`/domain-overview?domain=${encodeURIComponent(domainToAnalyze)}`);
  };

  // Safe getter for report summary data (the edge function saves random scores here)
  const getScore = (report: DomainOverviewReport, key: string) => {
    if (report.report_data && report.report_data[key] !== undefined) {
      return report.report_data[key];
    }
    return 0; // fallback
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SEO Intelligence</h2>
          <p className="text-muted-foreground">Comprehensive overview of your SEO performance and AI visibility.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/seo-projects/new">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Analyze Form */}
      <Card className="border-primary/20 shadow-sm bg-primary/5">
        <CardContent className="p-6">
          <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Enter domain, subdomain, or URL to analyze..."
                className="pl-10 h-12 text-base bg-background"
                value={domainToAnalyze}
                onChange={(e) => setDomainToAnalyze(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="h-12 w-full md:w-auto" disabled={isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Analyze Domain'}
              {!isAnalyzing && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Score Widgets (Mocked global view - derived from latest report if available) */}
      {reports.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Domain Health</CardTitle>
              <Activity className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getScore(reports[0], 'health_score')}/100</div>
              <p className="text-xs text-muted-foreground">+5% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall SEO Score</CardTitle>
              <Target className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getScore(reports[0], 'seo_score')}/100</div>
              <p className="text-xs text-muted-foreground">+2% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organic Traffic</CardTitle>
              <BarChart2 className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(getScore(reports[0], 'organic_traffic') || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Domain Authority</CardTitle>
              <ShieldAlert className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getScore(reports[0], 'da')}/100</div>
              <p className="text-xs text-muted-foreground">Stable</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SEO Tools Suite */}
      <div>
        <h3 className="text-xl font-bold mb-4 mt-8">SEO Tools Suite</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate('/keyword-research')}>
            <CardHeader className="pb-2">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                <SearchIcon className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-md">Keyword Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Discover high-volume keywords and analyze SERP competitors.</p>
            </CardContent>
          </Card>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate('/link-building')}>
            <CardHeader className="pb-2">
              <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-2">
                <LinkIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <CardTitle className="text-md">Link Building CRM</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Find backlink opportunities and manage outreach campaigns.</p>
            </CardContent>
          </Card>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate('/technical-seo')}>
            <CardHeader className="pb-2">
              <div className="h-10 w-10 bg-rose-100 rounded-lg flex items-center justify-center mb-2">
                <Server className="h-5 w-5 text-rose-600" />
              </div>
              <CardTitle className="text-md">Technical SEO</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Audit your site for critical technical issues and performance.</p>
            </CardContent>
          </Card>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate('/seo-agent')}>
            <CardHeader className="pb-2">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                <Bot className="h-5 w-5 text-purple-600" />
              </div>
              <CardTitle className="text-md">SEO Agent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Generate complete end-to-end SEO strategy and content plans.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Recent Reports */}
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <div>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Latest domain analyses</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/seo-reports">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1 pt-4 p-0">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground">Loading reports...</div>
            ) : reports.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No reports generated yet.</div>
            ) : (
              <div className="divide-y">
                {reports.slice(0, 5).map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{report.domain}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString()} • {report.report_type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                        {report.status}
                      </Badge>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/domain-overview?domain=${encodeURIComponent(report.domain)}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Projects */}
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <div>
              <CardTitle>Saved Projects</CardTitle>
              <CardDescription>Your tracked domains</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/seo-projects">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1 pt-4 p-0">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground flex flex-col items-center">
                <LayoutDashboard className="h-10 w-10 text-muted-foreground mb-2" />
                <p>No projects created yet.</p>
                <Button variant="link" asChild className="mt-2">
                  <Link to="/seo-projects/new">Create your first project</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {projects.slice(0, 5).map((project) => (
                  <div key={project.project_id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-primary hover:underline cursor-pointer truncate">
                        <Link to={`/seo-projects/${project.project_id}`}>{project.project_name}</Link>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{project.domain}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline">{project.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}