import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, ShieldAlert, AlertTriangle, Info, CheckCircle, Smartphone, Globe, 
  Zap, Download, Activity, Link as LinkIcon, FileCode, Server
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

import { supabase } from '@/db/supabase';

export default function TechnicalSEOPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const domainParam = searchParams.get('domain');

  const [domainInput, setDomainInput] = useState(domainParam || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<any>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (domainParam) {
      runAudit(domainParam);
    }
  }, [domainParam]);

  const runAudit = async (domain: string) => {
    try {
      setLoading(true);
      setError(null);
      // Simulate real API fetching/audit time
      
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/run-seo-audit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ domain_url: domain })
      });
      
      const responseData = await res.json();
      if (!responseData.success) {
        throw new Error(responseData.errors?.[0]?.message || 'Unknown error occurred');
      }

      setAuditData({
        domain,
        data_source: responseData.source,
        generated_at: responseData.generated_at,
        ...responseData.data, // This will spread the data if we had any
      });
    } catch (err: any) {
      setError(err.message || 'Audit failed');
      toast.error('Audit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput) return toast.error('Please enter a domain');
    navigate(`/technical-seo?domain=${encodeURIComponent(domainInput)}`);
  };

  if (loading || !auditData) {
    return (
      <div className="flex-1 space-y-6 pb-12">
        <div className="bg-card border rounded-xl p-4 shadow-sm">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Enter domain (e.g., example.com)" className="pl-10 h-10" value={domainInput} onChange={(e) => setDomainInput(e.target.value)} />
            </div>
            <Button type="submit" size="sm" className="h-10" disabled={loading}>Run Audit</Button>
          </form>
        </div>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground animate-pulse">Running full technical crawl...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4 border rounded-xl bg-destructive/5 p-8 text-center max-w-2xl mx-auto mt-12">
            <AlertTriangle className="w-12 h-12 text-destructive" />
            <h2 className="text-xl font-bold text-destructive">
              {error.toLowerCase().includes('api credentials not configured') || error.toLowerCase().includes('not connected') 
                ? 'Real data unavailable' 
                : 'Report could not be generated.'}
            </h2>
            <p className="text-muted-foreground">{error}</p>
            {error.toLowerCase().includes('api credentials not configured') || error.toLowerCase().includes('not connected') ? (
              <Button onClick={() => window.location.href = '/settings/api-connections'}>Connect API</Button>
            ) : (
              <Button onClick={() => runAudit(domainInput)}>Try Again</Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center mt-12">
            <Server className="w-16 h-16 text-muted-foreground/30" />
            <h2 className="text-2xl font-bold">Deep Technical SEO Audit</h2>
            <p className="text-muted-foreground max-w-lg">Enter a domain to crawl and identify critical errors, performance bottlenecks, and indexing issues.</p>
          </div>
        )}
      </div>
    );
  }

  const { errors, warnings, notices } = auditData.issues;
  
  const allErrors = [...errors];
  const allWarnings = [...warnings];
  
  const totalPagesErrors = Math.ceil(allErrors.length / itemsPerPage);
  const totalPagesWarnings = Math.ceil(allWarnings.length / itemsPerPage);
  
  const paginatedErrors = allErrors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginatedWarnings = allWarnings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex-1 space-y-6 pb-12">
      <div className="bg-card border rounded-xl p-4 shadow-sm sticky top-0 z-10 flex justify-between items-center gap-4">
        <form onSubmit={handleSearch} className="flex gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Enter domain..." className="pl-10 h-10" value={domainInput} onChange={(e) => setDomainInput(e.target.value)} />
          </div>
          <Button type="submit" size="sm" className="h-10 shrink-0">Run Audit</Button>
        </form>
        <Button variant="outline" size="sm" className="h-10" onClick={() => toast.success('Exporting full audit as CSV...')}>
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">{auditData.domain}</h1>
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          {auditData.data_source || 'DataForSEO'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground text-sm font-medium mb-1">Health Score</p>
            <p className="text-3xl font-bold">{auditData.health_score}/100</p>
          </CardContent>
        </Card>
        <Card className="border-rose-200 bg-rose-50/10">
          <CardContent className="p-6 text-center">
            <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-rose-600" />
            <p className="text-rose-600 text-sm font-medium mb-1">Errors</p>
            <p className="text-3xl font-bold text-rose-700">{allErrors.length}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/10">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-600" />
            <p className="text-amber-600 text-sm font-medium mb-1">Warnings</p>
            <p className="text-3xl font-bold text-amber-700">{allWarnings.length}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/10">
          <CardContent className="p-6 text-center">
            <Info className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="text-blue-600 text-sm font-medium mb-1">Notices</p>
            <p className="text-3xl font-bold text-blue-700">{notices.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Smartphone className="w-5 h-5 text-indigo-500"/> Core Web Vitals (Mobile)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <p className="font-semibold text-sm">LCP (Largest Contentful Paint)</p>
                <p className="text-xs text-muted-foreground">Loading performance</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-amber-600">{auditData.core_web_vitals.lcp.value}</p>
                <p className="text-xs text-amber-600">{auditData.core_web_vitals.lcp.status}</p>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <p className="font-semibold text-sm">FID (First Input Delay)</p>
                <p className="text-xs text-muted-foreground">Interactivity</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-600">{auditData.core_web_vitals.fid.value}</p>
                <p className="text-xs text-emerald-600">{auditData.core_web_vitals.fid.status}</p>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <p className="font-semibold text-sm">CLS (Cumulative Layout Shift)</p>
                <p className="text-xs text-muted-foreground">Visual stability</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-600">{auditData.core_web_vitals.cls.value}</p>
                <p className="text-xs text-emerald-600">{auditData.core_web_vitals.cls.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500"/> Google PageSpeed</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-full pb-8">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted" />
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={2 * Math.PI * 88} strokeDashoffset={2 * Math.PI * 88 * (1 - auditData.core_web_vitals.performance_score / 100)} className={auditData.core_web_vitals.performance_score > 89 ? 'text-emerald-500' : auditData.core_web_vitals.performance_score > 49 ? 'text-amber-500' : 'text-rose-500'} strokeLinecap="round" />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-5xl font-bold">{auditData.core_web_vitals.performance_score}</span>
                <span className="text-sm text-muted-foreground mt-1">Performance</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="errors" className="w-full" onValueChange={() => setCurrentPage(1)}>
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="errors" className="data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700">Errors ({allErrors.length})</TabsTrigger>
          <TabsTrigger value="warnings" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">Warnings ({allWarnings.length})</TabsTrigger>
          <TabsTrigger value="notices" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Notices ({notices.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="errors" className="mt-6">
          <Card className="border-rose-200">
            <CardHeader className="bg-rose-50/50 border-b border-rose-100">
              <CardTitle className="text-rose-800 flex items-center gap-2"><ShieldAlert className="w-5 h-5"/> Critical Errors List</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full max-w-full">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground whitespace-nowrap border-b border-rose-100">
                    <tr>
                      <th className="px-6 py-4 font-medium">Issue Type</th>
                      <th className="px-6 py-4 font-medium">Severity</th>
                      <th className="px-6 py-4 font-medium">Affected URL</th>
                      <th className="px-6 py-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-50">
                    {paginatedErrors.map((err) => (
                      <tr key={err.id} className="hover:bg-rose-50/30 whitespace-nowrap">
                        <td className="px-6 py-4 font-medium text-rose-700">{err.type}</td>
                        <td className="px-6 py-4"><Badge variant="destructive" className="bg-rose-600">{err.severity}</Badge></td>
                        <td className="px-6 py-4 text-muted-foreground font-mono text-xs max-w-[300px] truncate block">{err.url}</td>
                        <td className="px-6 py-4 text-right"><Button variant="outline" size="sm" onClick={() => toast.info('Opening URL inspector...')}>Inspect</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t flex justify-between items-center bg-card">
                <p className="text-sm text-muted-foreground">Showing {(currentPage-1)*itemsPerPage + 1} to {Math.min(currentPage*itemsPerPage, allErrors.length)} of {allErrors.length}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p-1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={currentPage >= totalPagesErrors} onClick={() => setCurrentPage(p => p+1)}>Next</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="warnings" className="mt-6">
          <Card className="border-amber-200">
            <CardHeader className="bg-amber-50/50 border-b border-amber-100">
              <CardTitle className="text-amber-800 flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Warnings List</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full max-w-full">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground whitespace-nowrap border-b border-amber-100">
                    <tr>
                      <th className="px-6 py-4 font-medium">Issue Type</th>
                      <th className="px-6 py-4 font-medium">Severity</th>
                      <th className="px-6 py-4 font-medium">Affected URL</th>
                      <th className="px-6 py-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    {paginatedWarnings.map((warn) => (
                      <tr key={warn.id} className="hover:bg-amber-50/30 whitespace-nowrap">
                        <td className="px-6 py-4 font-medium text-amber-700">{warn.type}</td>
                        <td className="px-6 py-4"><Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">{warn.severity}</Badge></td>
                        <td className="px-6 py-4 text-muted-foreground font-mono text-xs max-w-[300px] truncate block">{warn.url}</td>
                        <td className="px-6 py-4 text-right"><Button variant="outline" size="sm" onClick={() => toast.info('Opening URL inspector...')}>Inspect</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t flex justify-between items-center bg-card">
                <p className="text-sm text-muted-foreground">Showing {(currentPage-1)*itemsPerPage + 1} to {Math.min(currentPage*itemsPerPage, allWarnings.length)} of {allWarnings.length}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p-1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={currentPage >= totalPagesWarnings} onClick={() => setCurrentPage(p => p+1)}>Next</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notices" className="mt-6">
          <Card className="border-blue-200">
            <CardHeader className="bg-blue-50/50 border-b border-blue-100">
              <CardTitle className="text-blue-800 flex items-center gap-2"><Info className="w-5 h-5"/> Optimization Notices</CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Info className="w-12 h-12 mx-auto mb-4 text-blue-200" />
              <p>You have {notices.length} notices. Notices do not harm rankings but offer optimization opportunities.</p>
              <Button className="mt-4" variant="outline" onClick={() => toast.success('Exporting notices...')}>Download Notices Report</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
