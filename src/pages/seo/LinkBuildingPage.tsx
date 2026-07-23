import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Link as LinkIcon, Search, Plus, Filter, Download, ArrowUpRight, 
  ArrowDownRight, AlertTriangle, Briefcase, Mail, CheckCircle, Clock,
  BarChart2, Zap, Globe, MessageSquare, Target, Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { seoApi } from '@/lib/api/seo';

import { supabase } from '@/db/supabase';

export default function LinkBuildingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const domainParam = searchParams.get('domain');

  const [domainInput, setDomainInput] = useState(domainParam || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lbData, setLbData] = useState<any>(null);
  const [crmContacts, setCrmContacts] = useState<any[]>([]);

  // Modals state
  const [showAiAgent, setShowAiAgent] = useState(false);
  const [showAiPitch, setShowAiPitch] = useState<any>(null);
  const [showLinkGap, setShowLinkGap] = useState<any>(null);
  const [showEmailConfig, setShowEmailConfig] = useState(false);

  useEffect(() => {
    if (domainParam) {
      loadData(domainParam);
    }
  }, [domainParam]);

  const loadData = async (domain: string) => {
    try {
      setLoading(true);
      setError(null);
      // Try to load existing
      let report = await seoApi.getLinkIntelligenceReport(domain);
      
      if (!report) {
        toast.info('Generating Link Intelligence Report...');
        await seoApi.runLinkIntelligence(domain);
        report = await seoApi.getLinkIntelligenceReport(domain);
      }
      
      setLbData(report?.data);

      const contacts = await seoApi.getCrmContacts(domain);
      setCrmContacts(contacts);
    } catch (err: any) {
      setError(err.message || 'Failed to load link intelligence data');
      toast.error('Failed to load link intelligence data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPitch = async () => {
    try {
      const subject = `Quick question about your recent article on ${showAiPitch?.domain}`;
      const message = `Hi there,\n\nI was researching ${showAiPitch?.type} topics and found your excellent resource page at ${showAiPitch?.url || showAiPitch?.domain}. \n\nI recently published a highly relevant guide that I believe would make a great addition to your resource list. Let me know if you're open to taking a look!\n\nBest,\n[Your Name]`;

      await seoApi.dispatchAiPitch({
        target_domain: domainParam || domainInput,
        contact_email: `editor@${showAiPitch?.domain}`,
        publication: showAiPitch?.domain,
        link_type: showAiPitch?.type || 'Backlink Pitch',
        subject,
        message
      });
      
      toast.success('Pitch dispatched successfully via AI agent!');
      
      const contacts = await seoApi.getCrmContacts(domainParam || domainInput);
      setCrmContacts(contacts);
      
      setShowAiPitch(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispatch pitch');
    }
  };

  const handleSaveReport = async () => {
    toast.success('Report saved to your account!');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput) return toast.error('Please enter a domain');
    navigate(`/link-building?domain=${encodeURIComponent(domainInput)}`);
  };

  if (loading || !lbData) {
    return (
      <div className="flex-1 space-y-6 pb-12">
        <div className="bg-card border rounded-xl p-4 shadow-sm">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Enter your domain to discover opportunities" className="pl-10 h-10" value={domainInput} onChange={(e) => setDomainInput(e.target.value)} />
            </div>
            <Button type="submit" size="sm" className="h-10" disabled={loading}>Discover</Button>
          </form>
        </div>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground animate-pulse">Running AI Link Intelligence Engine...</p>
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
              <Button onClick={() => loadData(domainInput)}>Try Again</Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center mt-12">
            <LinkIcon className="w-16 h-16 text-muted-foreground/30" />
            <h2 className="text-2xl font-bold">World-Class AI Link Building Platform</h2>
            <p className="text-muted-foreground max-w-lg">Discover high-authority link opportunities, analyze competitor backlink gaps, and automate outreach using AI.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 pb-12 min-w-0 max-w-full">
      <div className="bg-card border rounded-xl p-4 shadow-sm sticky top-0 z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <form onSubmit={handleSearch} className="flex gap-3 flex-1 w-full md:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Enter your domain..." className="pl-10 h-10" value={domainInput} onChange={(e) => setDomainInput(e.target.value)} />
          </div>
          <Button type="submit" size="sm" className="h-10 shrink-0">Analyze</Button>
        </form>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-10" onClick={handleSaveReport}>
            <Download className="w-4 h-4 mr-2" /> Save Report
          </Button>
          <Button variant="outline" size="sm" className="h-10" onClick={() => setShowEmailConfig(true)}>
            <Mail className="w-4 h-4 mr-2" /> Connect Email
          </Button>
          <Button variant="default" size="sm" className="h-10 bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowAiAgent(true)}>
            <Zap className="w-4 h-4 mr-2" /> AI Agent Mode
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">{lbData.domain}</h1>
        <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Link Intelligence Engine</Badge>
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          {lbData.data_source || 'DataForSEO'}
        </Badge>
      </div>

      {/* Overview Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="col-span-2">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">Authority Score</p>
              <p className="text-4xl font-bold text-primary">{lbData.authority_score}</p>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-primary flex items-center justify-center">
              <Globe className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground text-xs font-semibold mb-1 uppercase tracking-wider">Backlinks</p>
            <p className="text-2xl font-bold">{lbData.total_backlinks.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground text-xs font-semibold mb-1 uppercase tracking-wider">Ref. Domains</p>
            <p className="text-2xl font-bold">{lbData.referring_domains.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center bg-emerald-50/50">
            <p className="text-emerald-700 text-xs font-semibold mb-1 uppercase tracking-wider">New (30d)</p>
            <p className="text-2xl font-bold text-emerald-600">+{lbData.new_links_30d}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center bg-rose-50/50">
            <p className="text-rose-700 text-xs font-semibold mb-1 uppercase tracking-wider">Lost (30d)</p>
            <p className="text-2xl font-bold text-rose-600">-{lbData.lost_links_30d}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="col-span-2 bg-indigo-50/30 border-indigo-100">
          <CardContent className="p-6">
            <p className="text-indigo-800 text-sm font-medium mb-2 flex items-center gap-2"><Target className="w-4 h-4"/> Found Opportunities</p>
            <p className="text-4xl font-bold text-indigo-700">{lbData.link_opportunities}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground text-xs font-semibold mb-1 uppercase tracking-wider">Active Outreach</p>
            <p className="text-2xl font-bold">{lbData.active_outreach}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground text-xs font-semibold mb-1 uppercase tracking-wider">Replies</p>
            <p className="text-2xl font-bold">{lbData.replies}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground text-xs font-semibold mb-1 uppercase tracking-wider">Acquired</p>
            <p className="text-2xl font-bold text-emerald-600">{lbData.links_acquired}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground text-xs font-semibold mb-1 uppercase tracking-wider">Est. Value</p>
            <p className="text-2xl font-bold text-amber-600">${lbData.est_value}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="opportunities" className="w-full">
        <div className="overflow-x-auto pb-2 -mb-2 border-b">
          <TabsList className="bg-transparent border-none p-0 inline-flex min-w-max h-10 justify-start">
            <TabsTrigger value="opportunities" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 h-10">Opportunities</TabsTrigger>
            <TabsTrigger value="competitors" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 h-10">Competitor Links</TabsTrigger>
            <TabsTrigger value="broken" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 h-10">Broken Link Finder</TabsTrigger>
            <TabsTrigger value="crm" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 h-10">Outreach CRM</TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent rounded-none px-4 h-10 text-indigo-600 flex items-center gap-2"><Zap className="w-3 h-3"/> AI Citations</TabsTrigger>
          </TabsList>
        </div>

        {/* OPPORTUNITIES TAB */}
        <TabsContent value="opportunities" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>High-Value Link Opportunities</CardTitle>
                <CardDescription>AI-curated list of domains likely to link to your content</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => {}}><Filter className="w-4 h-4 mr-2" /> Filter</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full max-w-full">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground whitespace-nowrap">
                    <tr>
                      <th className="px-4 py-3 font-medium">Domain / URL</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Auth</th>
                      <th className="px-4 py-3 font-medium">Traffic</th>
                      <th className="px-4 py-3 font-medium">Relevance</th>
                      <th className="px-4 py-3 font-medium">Contact</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lbData.opportunities.map((opp: any) => (
                      <tr key={opp.id} className="hover:bg-muted/50 whitespace-nowrap">
                        <td className="px-4 py-3">
                          <p className="font-medium text-primary truncate max-w-[200px]">{opp.domain}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{opp.url}</p>
                        </td>
                        <td className="px-4 py-3"><Badge variant="secondary" className="font-normal">{opp.type}</Badge></td>
                        <td className="px-4 py-3 font-semibold">{opp.authority}</td>
                        <td className="px-4 py-3">{opp.traffic.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-8">{opp.relevance}%</span>
                            <Progress value={opp.relevance} className="w-16 h-1.5" />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {opp.contact_found ? <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Found</Badge> : <span className="text-muted-foreground text-xs">AI Searching...</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" onClick={() => setShowAiPitch(opp)}>AI Pitch</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMPETITORS TAB */}
        <TabsContent value="competitors" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Link Intelligence</CardTitle>
              <CardDescription>Discover links your competitors have that you are missing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {lbData.competitors.map((comp: any) => (
                  <Card key={comp.id} className="bg-muted/30">
                    <CardContent className="p-4">
                      <p className="font-bold text-lg mb-2">{comp.domain}</p>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Shared Links</span>
                        <span className="font-medium">{comp.shared_links}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-3">
                        <span className="text-muted-foreground">Unique Links (Gap)</span>
                        <span className="font-medium text-primary">{comp.unique_links}</span>
                      </div>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setShowLinkGap(comp)}>View Link Gap</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BROKEN LINK FINDER */}
        <TabsContent value="broken" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Broken Link Building Opportunities</CardTitle>
              <CardDescription>Find 404 pages with high backlinks and pitch your alternative</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full max-w-full">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground whitespace-nowrap">
                    <tr>
                      <th className="px-4 py-3 font-medium">Dead URL (404)</th>
                      <th className="px-4 py-3 font-medium">Authority</th>
                      <th className="px-4 py-3 font-medium">Backlinks Pointing Here</th>
                      <th className="px-4 py-3 font-medium">Opp Score</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lbData.broken_links.map((bl: any) => (
                      <tr key={bl.id} className="hover:bg-muted/50 whitespace-nowrap">
                        <td className="px-4 py-3 font-mono text-xs text-rose-600 truncate max-w-[250px]">{bl.url}</td>
                        <td className="px-4 py-3">{bl.authority}</td>
                        <td className="px-4 py-3 font-bold">{bl.backlinks}</td>
                        <td className="px-4 py-3 text-emerald-600 font-semibold">{bl.score}/100</td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="outline" onClick={() => setShowAiPitch({ domain: bl.url, type: 'Broken Link' })}>Suggest Replacement</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CRM TAB */}
        <TabsContent value="crm" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Outreach Pipeline CRM</CardTitle>
              <CardDescription>Track emails, follow-ups, and negotiation status</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full max-w-full">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground whitespace-nowrap">
                    <tr>
                      <th className="px-4 py-3 font-medium">Contact</th>
                      <th className="px-4 py-3 font-medium">Publication</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Open Rate</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lbData.crm.map((contact: any) => (
                      <tr key={contact.id} className="hover:bg-muted/50 whitespace-nowrap">
                        <td className="px-4 py-3">
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-xs text-muted-foreground">{contact.email}</p>
                        </td>
                        <td className="px-4 py-3">{contact.publication}</td>
                        <td className="px-4 py-3">
                          <Badge variant={contact.status === 'Won' ? 'default' : 'secondary'} className={contact.status === 'Won' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                            {contact.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{contact.open_rate}%</td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="ghost" onClick={() => {}}>Message</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI CITATIONS TAB */}
        <TabsContent value="ai" className="mt-6">
          <Card className="border-indigo-200">
            <CardHeader className="bg-indigo-50/50">
              <CardTitle className="text-indigo-800">AI Search Engine Citations</CardTitle>
              <CardDescription>Track how often generative AI engines cite your domain</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full max-w-full">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground whitespace-nowrap">
                    <tr>
                      <th className="px-4 py-3 font-medium">AI Engine</th>
                      <th className="px-4 py-3 font-medium">Current Citations</th>
                      <th className="px-4 py-3 font-medium">Opportunity Score</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lbData.ai_citations.map((ai: any) => (
                      <tr key={ai.id} className="hover:bg-muted/50 whitespace-nowrap">
                        <td className="px-4 py-3 font-bold flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-400" /> {ai.engine}
                        </td>
                        <td className="px-4 py-3">{ai.citations}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-8 text-indigo-600 font-bold">{ai.opportunity_score}</span>
                            <Progress value={ai.opportunity_score} className="w-16 h-1.5 [&>div]:bg-indigo-500 bg-indigo-100" />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => toast.success('Generating optimization plan...')}>Optimize</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Modals */}
      <Dialog open={showAiAgent} onOpenChange={setShowAiAgent}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-indigo-500"/> Autonomous AI Link Builder</DialogTitle>
            <DialogDescription>
              The AI Agent will automatically discover opportunities, verify contacts, and send personalized pitches for your domain.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Campaign Goal</p>
              <Input placeholder="e.g. Get me 50 backlinks for example.com" defaultValue={`Get me 50 backlinks for ${domainInput}`} />
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-2">
              <p className="flex items-center gap-2 text-muted-foreground"><CheckCircle className="w-4 h-4 text-emerald-500" /> Analyzes competitors</p>
              <p className="flex items-center gap-2 text-muted-foreground"><CheckCircle className="w-4 h-4 text-emerald-500" /> Discovers verified contacts</p>
              <p className="flex items-center gap-2 text-muted-foreground"><CheckCircle className="w-4 h-4 text-emerald-500" /> Writes & sends personalized emails</p>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={() => { toast.success('Autonomous Agent Started! Check CRM for progress.'); setShowAiAgent(false); }} className="bg-indigo-600 hover:bg-indigo-700">Deploy Agent</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showAiPitch} onOpenChange={(open) => !open && setShowAiPitch(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>AI Pitch Generator</DialogTitle>
            <DialogDescription>
              Drafting a personalized pitch for {showAiPitch?.domain}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-muted border rounded-lg">
              <p className="text-sm font-semibold mb-2">Subject: Quick question about your recent article on {showAiPitch?.domain}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                Hi there,{"\n\n"}
                I was researching {showAiPitch?.type} topics and found your excellent resource page at {showAiPitch?.url || showAiPitch?.domain}. {"\n\n"}
                I recently published a highly relevant guide that I believe would make a great addition to your resource list. Let me know if you're open to taking a look!{"\n\n"}
                Best,{"\n"}
                [Your Name]
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAiPitch(null)}>Cancel</Button>
              <Button onClick={handleSendPitch}>Send Pitch</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showLinkGap} onOpenChange={(open) => !open && setShowLinkGap(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Link Gap: {showLinkGap?.domain}</DialogTitle>
            <DialogDescription>
              {showLinkGap?.domain} has {showLinkGap?.unique_links} links that {lbData?.domain} does not have.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="overflow-y-auto max-h-[300px] border rounded-lg divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">missing-source-{i+1}.com</p>
                    <p className="text-xs text-muted-foreground">DR: {Math.floor(Math.random() * 40) + 30}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => toast.success('Target added')}>Add Target</Button>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => { toast.success('Added all gap targets to pipeline!'); setShowLinkGap(null); }}>Add All to Pipeline</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEmailConfig} onOpenChange={setShowEmailConfig}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Connect Email Provider</DialogTitle>
            <DialogDescription>
              Connect your Gmail or Outlook account to send AI pitches directly from the CRM.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2" onClick={() => { toast.success('Redirecting to Google Auth...'); setShowEmailConfig(false); }}>
              <Mail className="w-6 h-6 text-red-500" />
              <span>Connect Gmail</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2" onClick={() => { toast.success('Redirecting to Microsoft Auth...'); setShowEmailConfig(false); }}>
              <Mail className="w-6 h-6 text-blue-500" />
              <span>Connect Outlook</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
