import React, { useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Search, Store, FileText, PiggyBank, Handshake, Landmark, ExternalLink, ShieldCheck, Plus } from 'lucide-react';

type FinderResult = {
  id: string;
  title?: string;
  name?: string;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
  phone?: string | null;
  rating?: number | null;
  description?: string | null;
  organization?: string | null;
  deadline?: string | null;
  amount?: string | null;
  status?: string | null;
  source_provider: string;
  source_url: string | null;
  retrieved_at?: string;
  finder?: string;
};

const sourceCoverage = {
  tender: 'EU public procurement notices and World Bank-financed procurement notices across eligible countries. Other national procurement portals are not yet connected.',
  grant: 'US federal opportunities from Grants.gov and EU funding calls from the EU Funding & Tenders Portal. Other jurisdictions are not yet connected.',
  partnership: 'Google Places company listings can identify potential partner targets. A listing does not mean the business is seeking partners.',
  investor: 'No reliable global investor directory is connected. Save an investor only when you have a source URL you can verify.'
} as const;

export default function PremiumFindersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'local' | 'tender' | 'grant' | 'partnership' | 'investor'>('local');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [results, setResults] = useState<FinderResult[]>([]);
  const [manualInvestor, setManualInvestor] = useState({ name: '', website: '', sourceUrl: '', region: '', notes: '' });
  const [savingInvestor, setSavingInvestor] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Enter a search keyword.');
      return;
    }
    if ((activeTab === 'local' || activeTab === 'partnership') && !location.trim()) {
      toast.error('Enter a location for business discovery.');
      return;
    }
    if (!user) {
      toast.error('Please sign in to search and save prospects.');
      return;
    }

    setLoading(true);
    setResults([]);
    try {
      if (activeTab === 'local' || activeTab === 'partnership') {
        const { data, error } = await supabase.functions.invoke('search-companies', {
          body: { query: query.trim(), location: location.trim() }
        });
        if (error) {
          const detail = await error.context?.text?.().catch(() => '');
          throw new Error(detail || error.message || 'Business search failed.');
        }
        if (data?.error) throw new Error(data.error);
        const companies = Array.isArray(data?.companies) ? data.companies : [];
        setResults(companies.map((company: any, index: number) => ({
          ...company,
          id: company.source_url || `${company.name}-${index}`,
          title: company.name
        })));
        if (companies.length) toast.success(`Found ${companies.length} businesses from Google Places.`);
        else toast.info('No matching businesses were returned by Google Places.');
      } else if (activeTab === 'tender' || activeTab === 'grant') {
        const { data, error } = await supabase.functions.invoke('search-official-finders', {
          body: { finder: activeTab, query: query.trim() }
        });
        if (error) {
          const detail = await error.context?.text?.().catch(() => '');
          throw new Error(detail || error.message || 'Official opportunity search failed.');
        }
        if (data?.error) throw new Error(data.error);
        const found = Array.isArray(data?.results) ? data.results : [];
        setResults(found);
        if (found.length) toast.success(`Found ${found.length} records from ${(data.providers || []).join(', ')}.`);
        else toast.info(data?.notice || 'No matching records were returned.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Finder search is unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const addToCrm = async (record: FinderResult) => {
    if (!user) return toast.error('Please sign in to save prospects.');
    const key = record.source_url || record.id;
    setSavingId(key);
    try {
      const isOpportunity = activeTab === 'tender' || activeTab === 'grant';
      const { error } = await supabase.from('prospecting_crm_leads').insert({
        user_id: user.id,
        company_name: record.title || record.name || 'Untitled prospect',
        decision_maker_name: null,
        lead_score: null,
        stage: 'New Lead',
        details: {
          record_type: isOpportunity ? activeTab : activeTab === 'partnership' ? 'potential_partner_target' : 'local_business',
          description: record.description || null,
          organization: record.organization || null,
          website: record.website || null,
          industry: record.industry || null,
          location: record.location || null,
          phone: record.phone || null,
          deadline: record.deadline || null,
          amount: record.amount || null,
          status: record.status || null,
          provider_rating: record.rating ?? null,
          source_provider: record.source_provider,
          source_url: record.source_url,
          source_retrieved_at: record.retrieved_at || new Date().toISOString(),
          verification_status: 'provider_record'
        }
      });
      if (error) throw error;
      toast.success(`${record.title || record.name} saved to CRM.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save this record.');
    } finally {
      setSavingId(null);
    }
  };

  const saveInvestor = async () => {
    if (!user) return toast.error('Please sign in to save investor records.');
    if (!manualInvestor.name.trim() || !manualInvestor.sourceUrl.trim()) {
      toast.error('Investor name and a source URL are required.');
      return;
    }
    try {
      new URL(manualInvestor.sourceUrl);
    } catch {
      toast.error('Enter a valid source URL.');
      return;
    }
    setSavingInvestor(true);
    try {
      const { error } = await supabase.from('prospecting_crm_leads').insert({
        user_id: user.id,
        company_name: manualInvestor.name.trim(),
        decision_maker_name: null,
        lead_score: null,
        stage: 'New Lead',
        details: {
          record_type: 'investor',
          website: manualInvestor.website.trim() || null,
          location: manualInvestor.region.trim() || null,
          notes: manualInvestor.notes.trim() || null,
          source_provider: 'User supplied source',
          source_url: manualInvestor.sourceUrl.trim(),
          source_retrieved_at: new Date().toISOString(),
          verification_status: 'user_entered_source_requires_review'
        }
      });
      if (error) throw error;
      setManualInvestor({ name: '', website: '', sourceUrl: '', region: '', notes: '' });
      toast.success('Investor record saved to CRM. Review the source before outreach.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save investor record.');
    } finally {
      setSavingInvestor(false);
    }
  };

  const title = (record: FinderResult) => record.title || record.name || 'Untitled record';
  const searchLabel = activeTab === 'partnership' ? 'Potential partner companies' : activeTab === 'local' ? 'Local businesses' : activeTab === 'tender' ? 'Public tenders' : 'Grant opportunities';

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy mb-2 flex items-center"><Store className="mr-3 h-8 w-8 text-primary" /> Premium Finders</h1>
        <p className="text-muted-foreground">Discover source-backed businesses and public opportunities, then save records to your CRM. Coverage is shown honestly for each finder.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value as typeof activeTab); setResults([]); setQuery(''); setLocation(''); }} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto md:h-12 mb-8">
          <TabsTrigger value="local" className="py-2.5"><Store className="mr-2 h-4 w-4 hidden md:block" /> Local</TabsTrigger>
          <TabsTrigger value="tender" className="py-2.5"><FileText className="mr-2 h-4 w-4 hidden md:block" /> Tenders</TabsTrigger>
          <TabsTrigger value="grant" className="py-2.5"><PiggyBank className="mr-2 h-4 w-4 hidden md:block" /> Grants</TabsTrigger>
          <TabsTrigger value="partnership" className="py-2.5"><Handshake className="mr-2 h-4 w-4 hidden md:block" /> Partners</TabsTrigger>
          <TabsTrigger value="investor" className="py-2.5"><Landmark className="mr-2 h-4 w-4 hidden md:block" /> Investors</TabsTrigger>
        </TabsList>

        {(['local', 'tender', 'grant', 'partnership'] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{tab === 'partnership' ? 'Discover potential partner companies' : tab === 'local' ? 'Find local businesses' : tab === 'tender' ? 'Search public tenders' : 'Search grant opportunities'}</CardTitle>
                <CardDescription>{sourceCoverage[tab]}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid grid-cols-1 ${tab === 'local' || tab === 'partnership' ? 'md:grid-cols-2' : ''} gap-4`}>
                  <Input aria-label="Search keyword" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tab === 'local' || tab === 'partnership' ? 'Business type (e.g. software companies)' : 'Keyword (e.g. cybersecurity, renewable energy)'} />
                  {(tab === 'local' || tab === 'partnership') && <Input aria-label="Location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, region or country" />}
                </div>
                <Button onClick={handleSearch} disabled={loading} className="mt-5">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Search {tab === 'partnership' ? 'potential partners' : tab === 'local' ? 'businesses' : tab === 'tender' ? 'tenders' : 'grants'}
                </Button>
              </CardContent>
            </Card>

            {results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{searchLabel}</CardTitle>
                  <CardDescription>{results.length} source records returned. Check the source notice and eligibility before acting. A company listing is not evidence of partnership intent or sales readiness.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Name / opportunity</TableHead><TableHead>Organization</TableHead><TableHead>Location</TableHead><TableHead>Deadline / phone</TableHead><TableHead>Source</TableHead><TableHead className="text-right">CRM</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {results.map((record) => {
                          const key = record.source_url || record.id;
                          return <TableRow key={key}>
                            <TableCell className="font-medium">
                              <div>{title(record)}</div>
                              {record.website && <a className="text-xs text-primary hover:underline" href={record.website} target="_blank" rel="noreferrer">{record.website}</a>}
                              {record.description && <p className="text-xs text-muted-foreground mt-1 max-w-sm">{record.description}</p>}
                            </TableCell>
                            <TableCell>{record.organization || record.industry || 'Not provided'}</TableCell>
                            <TableCell>{record.location || 'Not provided'}</TableCell>
                            <TableCell>{record.deadline || record.phone || 'Not provided'}</TableCell>
                            <TableCell>{record.source_url ? <a className="inline-flex items-center text-primary hover:underline" href={record.source_url} target="_blank" rel="noreferrer">{record.source_provider} <ExternalLink className="ml-1 h-3 w-3" /></a> : record.source_provider}</TableCell>
                            <TableCell className="text-right"><Button size="sm" variant="outline" disabled={savingId === key} onClick={() => addToCrm(record)}>{savingId === key ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add to CRM'}</Button></TableCell>
                          </TableRow>;
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
            {!loading && results.length === 0 && <p className="text-sm text-muted-foreground">Run a search to retrieve live provider records. No sample results are displayed.</p>}
          </TabsContent>
        ))}

        <TabsContent value="investor">
          <Card>
            <CardHeader>
              <CardTitle>Save a sourced investor prospect</CardTitle>
              <CardDescription>{sourceCoverage.investor} This is a sourced-record workflow, not an automated global investor database. Do not treat a firm's existence as evidence it is currently investing or accepting pitches.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Investor / firm name *</Label><Input value={manualInvestor.name} onChange={(event) => setManualInvestor({ ...manualInvestor, name: event.target.value })} placeholder="Investor or fund name" /></div>
                <div className="space-y-2"><Label>Website</Label><Input value={manualInvestor.website} onChange={(event) => setManualInvestor({ ...manualInvestor, website: event.target.value })} placeholder="https://..." /></div>
                <div className="space-y-2"><Label>Source URL *</Label><Input value={manualInvestor.sourceUrl} onChange={(event) => setManualInvestor({ ...manualInvestor, sourceUrl: event.target.value })} placeholder="Official investor profile or fund source" /></div>
                <div className="space-y-2"><Label>Region</Label><Input value={manualInvestor.region} onChange={(event) => setManualInvestor({ ...manualInvestor, region: event.target.value })} placeholder="Country or investment region" /></div>
              </div>
              <div className="space-y-2"><Label>Investment thesis / notes</Label><Textarea value={manualInvestor.notes} onChange={(event) => setManualInvestor({ ...manualInvestor, notes: event.target.value })} placeholder="Record the published investment focus and any evidence of current activity." /></div>
              <Button onClick={saveInvestor} disabled={savingInvestor}>{savingInvestor ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Save sourced investor</Button>
              <p className="text-xs text-muted-foreground">For US adviser registration checks, consult the official <a className="text-primary underline" href="https://adviserinfo.sec.gov/" target="_blank" rel="noreferrer">SEC IAPD directory</a>. Registration does not mean a firm is a venture investor.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
