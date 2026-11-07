import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ProspectingCompany, ProspectingProject } from '@/types/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Download, Search, Users, ExternalLink, Loader2, Building2, MapPin, Target } from 'lucide-react';



export default function CompanySearchResultsPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<ProspectingProject | null>(null);
  const [companies, setCompanies] = useState<ProspectingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSearchingRealData, setIsSearchingRealData] = useState(false);

  useEffect(() => {
    if (user && projectId) {
      fetchData();
    }
  }, [user, projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: projData, error: projErr } = await supabase
        .from('prospecting_projects')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (projErr) throw projErr;
      setProject(projData);

      const { data: compData, error: compErr } = await supabase
        .from('prospecting_companies')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_demo', false)
        .order('created_at', { ascending: false });

      if (compErr) throw compErr;
      setCompanies(compData || []);
    } catch (err: any) {
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async () => {
    if (!project || !projectId || !user) {
      toast.error('Project or signed-in user is unavailable.');
      return;
    }

    setIsSearchingRealData(true);
    try {
      const { data: realData, error: apiErr } = await supabase.functions.invoke('search-companies', {
        body: { project }
      });
      if (apiErr) {
        const detail = await apiErr.context?.text?.().catch(() => '');
        throw new Error(detail || apiErr.message || 'Real company search failed.');
      }
      if (realData?.error) throw new Error(realData.error);
      const found = Array.isArray(realData?.companies) ? realData.companies : [];
      if (!found.length) {
        toast.info('The connected provider returned no matching companies.');
        return;
      }

      const companiesToInsert = found.map((comp: any) => ({
        project_id: projectId,
        user_id: user.id,
        name: comp.name,
        website: comp.website,
        industry: comp.industry,
        employees: null,
        revenue_estimate: null,
        location: comp.location,
        lead_score: null,
        phone: comp.phone,
        email: null,
        score_reason: 'Provider listing only; no buying-intent score has been calculated.',
        social_profiles: {},
        source_provider: comp.source_provider || 'Google Places',
        source_url: comp.source_url || null,
        source_retrieved_at: comp.source_retrieved_at || new Date().toISOString(),
        is_demo: false
      }));

      const { error: insertError } = await supabase.from('prospecting_companies').insert(companiesToInsert);
      if (insertError) throw insertError;
      toast.success(`Saved ${companiesToInsert.length} sourced company records.`);
      await fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to search for real companies.');
    } finally {
      setIsSearchingRealData(false);
    }
  };

  const addCompanyToCrm = async (company: ProspectingCompany) => {
    if (!user) return toast.error('Please sign in to save prospects.');
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
          source_provider: (company as any).source_provider || null,
          source_url: (company as any).source_url || null,
          verification_status: 'provider_record'
        }
      });
      if (error) throw error;
      toast.success(`${company.name} added to CRM.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add company to CRM.');
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'bg-muted text-muted-foreground';
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.website && c.website.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container mx-auto py-8">
      <Button variant="ghost" onClick={() => navigate('/prospecting')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy mb-2">{project?.name || 'Project Companies'}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Target className="h-4 w-4" /> {project?.business_type} in {project?.target_country}
          </p>
        </div>
          <div className="flex gap-2 items-center flex-wrap">
            <Button variant="outline" onClick={() => {
              const rows = companies.map((c) => [c.name, c.website || '', c.industry || '', c.location || '', c.phone || '', c.source_url || '']);
              const csv = [['Company', 'Website', 'Industry', 'Location', 'Phone', 'Source URL'], ...rows]
                .map((row) => row.map((value) => '"' + String(value).replace(/"/g, '""') + '"').join(',')).join('\n');
              const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
              const anchor = document.createElement('a');
              anchor.href = url;
              anchor.download = 'prospecting-companies.csv';
              anchor.click();
              URL.revokeObjectURL(url);
            }} type="button"><Download className="mr-2 h-4 w-4" /> Export All</Button>
          </div>
      </div>

      <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card p-4 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-1">Total Companies</p>
              <h4 className="text-2xl font-bold">{companies.length}</h4>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-1">Lead scoring</p>
              <h4 className="text-2xl font-bold">
                Not calculated
              </h4>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search companies by name or website..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={runSimulation} disabled={isSearchingRealData}>
              {isSearchingRealData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Find More Companies
            </Button>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden w-full max-w-full overflow-x-auto">
            <Table className="[&>div]:max-w-full">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="whitespace-nowrap">Company</TableHead>
                  <TableHead className="whitespace-nowrap">Industry / Size</TableHead>
                  <TableHead className="whitespace-nowrap">Location</TableHead>
                  <TableHead className="whitespace-nowrap">Contact</TableHead>
                  <TableHead className="whitespace-nowrap">Lead Score</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : filteredCompanies.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No companies found.</TableCell></TableRow>
                ) : (
                  filteredCompanies.map(company => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div>{company.name}</div>
                          {company.website && (
                            <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center mt-0.5">
                              {company.website} <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm">{company.industry}</div>
                        <div className="text-xs text-muted-foreground">{company.employees || 'Size not provided'}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center text-sm">
                          <MapPin className="h-3 w-3 mr-1 text-muted-foreground" /> {company.location}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col text-sm text-muted-foreground">
                          {company.phone ? <span>{company.phone}</span> : <span>No phone</span>}
                          {company.email ? <span>{company.email}</span> : <span>No email</span>}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className={getScoreColor(company.lead_score)}>
                            Lead score: {company.lead_score ?? 'Not calculated'}
                          </Badge>
                          {company.score_reason && (
                            <span className="text-[10px] text-muted-foreground truncate max-w-[150px]" title={company.score_reason}>
                              {company.score_reason}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10" asChild>
                          <Link to={`/prospecting/companies/${company.id}/decision-makers`}>
                            <Users className="h-4 w-4 mr-2" /> Decision Makers
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => addCompanyToCrm(company)}>Add to CRM</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
      </>
    </div>
  );
}