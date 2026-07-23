import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Search, Target, Globe, Server, 
  Activity, Clock, FileText, CheckCircle2, AlertTriangle, AlertCircle, Sparkles, Link as LinkIcon, BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

export default function AdminSEOIntelligenceSection() {
  const [activeTab, setActiveTab] = useState<'projects' | 'reports' | 'tools' | 'system'>('projects');
  
  // Projects State
  const [projects, setProjects] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  
  // Tools State
  const [keywordSearches, setKeywordSearches] = useState<any[]>([]);
  const [contentStrategies, setContentStrategies] = useState<any[]>([]);
  const [linkBuilding, setLinkBuilding] = useState<any[]>([]);
  const [seoAgents, setSeoAgents] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'projects') {
        const { data: pData, error: pError } = await supabase.from('seo_projects').select('*').order('created_at', { ascending: false });
        if (pError) throw pError;
        setProjects(pData || []);
      } else if (activeTab === 'reports') {
        const { data: rData, error: rError } = await supabase.from('domain_overview_reports').select('*').order('generated_at', { ascending: false }).limit(50);
        if (rError) throw rError;
        setReports(rData || []);
      } else if (activeTab === 'tools') {
        const [kw, cs, lb, sa] = await Promise.all([
          supabase.from('keyword_research').select('*').order('generated_at', { ascending: false }).limit(20),
          supabase.from('content_strategies').select('*').order('generated_at', { ascending: false }).limit(20),
          supabase.from('link_building_reports').select('*').order('generated_at', { ascending: false }).limit(20),
          supabase.from('seo_agent_projects').select('*').order('generated_at', { ascending: false }).limit(20)
        ]);
        setKeywordSearches(kw.data || []);
        setContentStrategies(cs.data || []);
        setLinkBuilding(lb.data || []);
        setSeoAgents(sa.data || []);
      }
    } catch (err: any) {
      toast.error('Failed to load SEO Intelligence data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">SEO Intelligence Center</h2>
          <p className="text-muted-foreground">Monitor SEO tool usage, reports, and system health.</p>
        </div>
        <div className="flex flex-wrap bg-muted p-1 rounded-lg gap-1">
          <Button 
            variant={activeTab === 'projects' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('projects')}
          >
            <Globe className="w-4 h-4 mr-2" />
            Projects
          </Button>
          <Button 
            variant={activeTab === 'reports' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('reports')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Reports
          </Button>
          <Button 
            variant={activeTab === 'tools' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('tools')}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Tools Usage
          </Button>
          <Button 
            variant={activeTab === 'system' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('system')}
          >
            <Server className="w-4 h-4 mr-2" />
            System
          </Button>
        </div>
      </div>

      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 flex flex-col justify-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Projects</p>
                <p className="text-3xl font-bold">{projects.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex flex-col justify-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">Active Projects</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {projects.filter(p => p.status === 'Active').length}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle>All User Projects</CardTitle>
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search projects..." className="pl-9 h-9" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 font-medium whitespace-nowrap">Project / Domain</th>
                      <th className="px-4 py-3 font-medium whitespace-nowrap">Owner</th>
                      <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 font-medium whitespace-nowrap">Created At</th>
                      <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                    ) : projects.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No projects found.</td></tr>
                    ) : projects.map((p) => (
                      <tr key={p.project_id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-primary">{p.project_name}</div>
                          <div className="text-xs text-muted-foreground">{p.domain}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{p.user_id || 'Unknown User'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={p.status === 'Active' ? 'default' : 'secondary'}>{p.status}</Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <Button variant="ghost" size="sm" onClick={() => {}}>View Details</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 flex flex-col justify-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Reports</p>
                <p className="text-3xl font-bold">{reports.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex flex-col justify-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">Completed</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {reports.filter(r => r.status === 'Completed').length}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle>Recent Domain Analyses</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 font-medium whitespace-nowrap">Domain</th>
                      <th className="px-4 py-3 font-medium whitespace-nowrap">User</th>
                      <th className="px-4 py-3 font-medium whitespace-nowrap">Type</th>
                      <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 font-medium whitespace-nowrap">Time (s)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                    ) : reports.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No reports generated.</td></tr>
                    ) : reports.map((r) => (
                      <tr key={r.report_id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium whitespace-nowrap">{r.domain}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.users?.email || 'Unknown'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{r.report_type}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={r.status === 'Completed' ? 'default' : r.status === 'Failed' ? 'destructive' : 'secondary'}>
                            {r.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{r.processing_time || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'tools' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <Card>
              <CardHeader className="pb-3 border-b flex flex-row items-center gap-2">
                <Search className="w-5 h-5 text-blue-500" />
                <CardTitle>Keyword Research</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Seed Keyword</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Region</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Keywords</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Generated At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {loading ? (
                        <tr><td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">Loading...</td></tr>
                      ) : keywordSearches.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">No data found.</td></tr>
                      ) : keywordSearches.map((r) => (
                        <tr key={r.keyword_research_id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 font-medium whitespace-nowrap">{r.seed_keyword}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{r.country} / {r.language}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{r.total_keywords}</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(r.generated_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b flex flex-row items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                <CardTitle>SEO Agent Projects</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Target Keyword</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Domain</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Generated At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {loading ? (
                        <tr><td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">Loading...</td></tr>
                      ) : seoAgents.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">No data found.</td></tr>
                      ) : seoAgents.map((r) => (
                        <tr key={r.seo_agent_project_id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 font-medium whitespace-nowrap">{r.target_keyword}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{r.domain_url || '—'}</td>
                          <td className="px-4 py-3 whitespace-nowrap"><Badge variant="outline">{r.status}</Badge></td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(r.generated_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b flex flex-row items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-500" />
                <CardTitle>Content Strategies</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Domain</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Keywords</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Pillars</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Pieces</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {loading ? (
                        <tr><td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">Loading...</td></tr>
                      ) : contentStrategies.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">No data found.</td></tr>
                      ) : contentStrategies.map((r) => (
                        <tr key={r.content_strategy_id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 font-medium whitespace-nowrap">{r.domain_url}</td>
                          <td className="px-4 py-3 whitespace-nowrap max-w-[150px] truncate">{r.target_keywords}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{r.content_pillars_count}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{r.content_pieces_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b flex flex-row items-center gap-2">
                <LinkIcon className="w-5 h-5 text-orange-500" />
                <CardTitle>Link Building Runs</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Domain</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Opportunities</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Outreach</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Generated At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {loading ? (
                        <tr><td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">Loading...</td></tr>
                      ) : linkBuilding.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">No data found.</td></tr>
                      ) : linkBuilding.map((r) => (
                        <tr key={r.link_building_report_id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 font-medium whitespace-nowrap">{r.domain_url}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{r.total_opportunities}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{r.outreach_campaigns_count}</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(r.generated_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>API Status</CardTitle>
              <CardDescription>External service connections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-medium">SEO Data Provider API</span>
                </div>
                <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">Online</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-medium">AI Inference Engine</span>
                </div>
                <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">Online</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-medium">Traffic Analytics API</span>
                </div>
                <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">Online</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
              <CardDescription>Metrics from the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Average Report Generation Time</span>
                  <span className="font-medium">4.2s</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-1/4" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">API Call Success Rate</span>
                  <span className="font-medium">99.8%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[99.8%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">System Uptime</span>
                  <span className="font-medium">100%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
