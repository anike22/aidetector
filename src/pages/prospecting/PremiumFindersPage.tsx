import React, { useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Search, Store, FileText, PiggyBank, Handshake, Landmark, ExternalLink, ShieldCheck } from 'lucide-react';

type CompanyResult = {
  name: string;
  website: string | null;
  industry: string | null;
  location: string | null;
  phone: string | null;
  rating: number | null;
  source_provider: string;
  source_url: string | null;
};

const unavailable = {
  tender: 'Tender search is not connected to an official procurement data provider yet.',
  grant: 'Grant search is not connected to official funding databases yet.',
  partnership: 'Partner discovery needs a verified company-data provider before it can return genuine matches.',
  investor: 'Investor search needs a verified investor directory before it can return genuine matches.'
} as const;

export default function PremiumFindersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('local');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [results, setResults] = useState<CompanyResult[]>([]);

  const handleSearch = async () => {
    if (activeTab !== 'local') return;
    if (!query.trim() || !location.trim()) {
      toast.error('Enter both a business type and a location.');
      return;
    }
    if (!user) {
      toast.error('Please sign in to search and save prospects.');
      return;
    }

    setLoading(true);
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke('search-companies', {
        body: { query: query.trim(), location: location.trim() }
      });
      if (error) {
        const detail = await error.context?.text?.().catch(() => '');
        throw new Error(detail || error.message || 'Company search failed.');
      }
      if (data?.error) throw new Error(data.error);
      const companies = Array.isArray(data?.companies) ? data.companies : [];
      setResults(companies);
      if (companies.length) toast.success(`Found ${companies.length} businesses from Google Places.`);
      else toast.info('The provider returned no matching businesses.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Company search is unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const addToCrm = async (company: CompanyResult) => {
    if (!user) {
      toast.error('Please sign in to save prospects.');
      return;
    }
    const key = company.source_url || company.name;
    setSavingId(key);
    try {
      const { error } = await supabase.from('prospecting_crm_leads').insert({
        user_id: user.id,
        company_name: company.name,
        decision_maker_name: null,
        lead_score: null,
        stage: 'New Lead',
        details: {
          website: company.website,
          industry: company.industry,
          location: company.location,
          phone: company.phone,
          provider_rating: company.rating,
          source_provider: company.source_provider,
          source_url: company.source_url,
          source_retrieved_at: new Date().toISOString(),
          verification_status: 'provider_record'
        }
      });
      if (error) throw error;
      toast.success(`${company.name} saved to CRM.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save this prospect.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy mb-2 flex items-center"><Store className="mr-3 h-8 w-8 text-primary" /> Premium Finders</h1>
        <p className="text-muted-foreground">Search real local businesses and save sourced records to your CRM. Unconnected finders are clearly identified instead of showing sample leads.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setResults([]); }} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto md:h-12 mb-8">
          <TabsTrigger value="local" className="py-2.5"><Store className="mr-2 h-4 w-4 hidden md:block" /> Local</TabsTrigger>
          <TabsTrigger value="tender" className="py-2.5"><FileText className="mr-2 h-4 w-4 hidden md:block" /> Tenders</TabsTrigger>
          <TabsTrigger value="grant" className="py-2.5"><PiggyBank className="mr-2 h-4 w-4 hidden md:block" /> Grants</TabsTrigger>
          <TabsTrigger value="partnership" className="py-2.5"><Handshake className="mr-2 h-4 w-4 hidden md:block" /> Partners</TabsTrigger>
          <TabsTrigger value="investor" className="py-2.5"><Landmark className="mr-2 h-4 w-4 hidden md:block" /> Investors</TabsTrigger>
        </TabsList>

        <TabsContent value="local">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Find local businesses</CardTitle>
              <CardDescription>Results come from Google Places. Contact details are shown only when the provider supplies them.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input aria-label="Business type" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Business type (e.g. dental clinics)" />
                <Input aria-label="Location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, region or country" />
              </div>
              <Button onClick={handleSearch} disabled={loading} className="mt-6">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Search real businesses
              </Button>
            </CardContent>
          </Card>

          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Verified provider records</CardTitle>
                <CardDescription>{results.length} businesses returned by Google Places. A provider listing is not proof of a sales opportunity or decision-maker identity.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>Business</TableHead><TableHead>Category</TableHead><TableHead>Location</TableHead><TableHead>Phone</TableHead><TableHead>Rating</TableHead><TableHead>Source</TableHead><TableHead className="text-right">CRM</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {results.map((company) => {
                        const key = company.source_url || company.name;
                        return <TableRow key={key}>
                          <TableCell className="font-medium">
                            <div>{company.name}</div>
                            {company.website && <a className="text-xs text-primary hover:underline" href={company.website} target="_blank" rel="noreferrer">{company.website}</a>}
                          </TableCell>
                          <TableCell>{company.industry || 'Not provided'}</TableCell>
                          <TableCell>{company.location || 'Not provided'}</TableCell>
                          <TableCell>{company.phone || 'Not provided'}</TableCell>
                          <TableCell>{company.rating ?? 'Not provided'}</TableCell>
                          <TableCell>{company.source_url ? <a className="inline-flex items-center text-primary hover:underline" href={company.source_url} target="_blank" rel="noreferrer">Google Places <ExternalLink className="ml-1 h-3 w-3" /></a> : 'Google Places'}</TableCell>
                          <TableCell className="text-right"><Button size="sm" variant="outline" disabled={savingId === key} onClick={() => addToCrm(company)}>{savingId === key ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add to CRM'}</Button></TableCell>
                        </TableRow>;
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
          {!loading && results.length === 0 && <p className="text-sm text-muted-foreground">Run a search to see live provider results. No sample companies are displayed.</p>}
        </TabsContent>

        {Object.entries(unavailable).map(([key, message]) => (
          <TabsContent key={key} value={key}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><ShieldCheck className="h-5 w-5 mr-2 text-muted-foreground" /> Source connection required</CardTitle>
                <CardDescription>{message}</CardDescription>
              </CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">This finder will remain unavailable until a supported provider is configured and its records can be attributed to an official source. No placeholder results will be shown or saved.</p></CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
