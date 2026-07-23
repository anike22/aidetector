import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ProspectingCompany, ProspectingProject } from '@/types/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Download, Search, Users, ExternalLink, Loader2, Building2, MapPin, DollarSign, Target, Settings2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const SIMULATION_STAGES = [
  'Searching companies...',
  'Analyzing websites...',
  'Extracting data...',
  'Identifying decision makers...',
  'Calculating scores...',
  'Complete'
];

export default function CompanySearchResultsPage() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const isSimulating = searchParams.get('simulate') === 'true';
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<ProspectingProject | null>(null);
  const [companies, setCompanies] = useState<ProspectingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [simStage, setSimStage] = useState(0);
  const [simProgress, setSimProgress] = useState(0);
  
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isSearchingRealData, setIsSearchingRealData] = useState(false);

  useEffect(() => {
    if (user && projectId) {
      fetchData();
    }
  }, [user, projectId]);

  useEffect(() => {
    if (isSimulating && loading === false) {
      runSimulation();
    }
  }, [isSimulating, loading]);

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
        .order('lead_score', { ascending: false });

      if (compErr) throw compErr;
      setCompanies(compData || []);
    } catch (err: any) {
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async () => {
    // Run fake loading stages
    for (let i = 0; i < SIMULATION_STAGES.length; i++) {
      setSimStage(i);
      setSimProgress((i / (SIMULATION_STAGES.length - 1)) * 100);
      await new Promise(r => setTimeout(r, 1200));
    }
    
    // Create mock data or fetch real data depending on Demo Mode
    if (!isDemoMode) {
      // Use Real Edge Function to fetch actual data
      try {
        setSimStage(5);
        setSimProgress(100);
        
        setIsSearchingRealData(true);
        const { data: realData, error: apiErr } = await supabase.functions.invoke('search-companies', {
          body: { project }
        });

        setIsSearchingRealData(false);

        if (apiErr) {
          const errMsg = await apiErr.context?.text() || apiErr.message;
          console.error("Edge function err", errMsg);
          if (errMsg?.includes('GOOGLE_MAPS_API_KEY is missing')) {
            toast.error('Real lead data source is not connected yet.');
          } else {
            toast.error('Failed to search real leads: ' + errMsg);
          }
        } else if (realData?.error) {
          toast.error(realData.error);
          if (realData.error.includes('GOOGLE_MAPS_API_KEY is missing')) {
            toast.error('Real lead data source is not connected yet.');
          }
        } else if (realData?.companies) {
          // Insert real companies
          const companiesToInsert = realData.companies.map((comp: any) => ({
            project_id: projectId,
            user_id: user!.id,
            name: comp.name,
            website: comp.website,
            industry: comp.industry,
            employees: comp.employees,
            revenue_estimate: comp.revenue_estimate,
            location: comp.location,
            lead_score: comp.lead_score,
            phone: comp.phone,
            email: comp.email,
            score_reason: comp.score_reason,
            social_profiles: comp.social_profiles || {}
          }));

          for (const comp of companiesToInsert) {
            await supabase.from('prospecting_companies').insert(comp);
          }
          toast.success(`Found ${companiesToInsert.length} real companies!`);
        }
      } catch (err: any) {
        setIsSearchingRealData(false);
        console.error(err);
        toast.error('Failed to connect to real lead API.');
      }
    } else {
      // Demo Mode: generate context-aware mock data
      try {
        const mockCompanies = [
          { name: `Demo ${project?.business_type} Alpha`, website: 'demo-alpha.com', industry: project?.business_type || 'Unknown', employees: '50-100', revenue_estimate: '$5M - $10M', location: project?.target_country || 'USA', lead_score: 92, phone: '+1 555 123 4567', email: 'contact@demo-alpha.com' },
          { name: `Demo ${project?.business_type} Beta`, website: 'demo-beta.net', industry: project?.business_type || 'Unknown', employees: '10-50', revenue_estimate: '$1M - $5M', location: project?.target_country || 'USA', lead_score: 81, phone: '+1 555 987 6543', email: 'hello@demo-beta.net' },
          { name: `Demo ${project?.business_type} Gamma`, website: 'demo-gamma.org', industry: project?.business_type || 'Unknown', employees: '200+', revenue_estimate: '$50M+', location: project?.target_country || 'USA', lead_score: 65, phone: '+1 555 321 0000', email: 'info@demo-gamma.org' }
        ];

        for (const comp of mockCompanies) {
          await supabase.from('prospecting_companies').insert({
            project_id: projectId,
            user_id: user!.id,
            name: comp.name,
            website: comp.website,
            industry: comp.industry,
            employees: comp.employees,
            revenue_estimate: comp.revenue_estimate,
            location: comp.location,
            lead_score: comp.lead_score,
            phone: comp.phone,
            email: comp.email,
            score_reason: "Demo Data Match",
            social_profiles: { linkedin: `linkedin.com/company/${comp.name.toLowerCase().replace(/ /g,'-')}` }
          });
        }
        toast.success('AI Demo Company Search Complete!');
      } catch(err) {
        console.error(err);
      }
    }
    
    // Remove simulate flag
    searchParams.delete('simulate');
    setSearchParams(searchParams);
    
    // Reload
    fetchData();
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
            <div className="flex items-center space-x-2 mr-2 bg-muted/50 px-3 py-1.5 rounded-md">
              <Switch
                id="demo-mode"
                checked={isDemoMode}
                onCheckedChange={setIsDemoMode}
              />
              <Label htmlFor="demo-mode" className="text-sm font-medium cursor-pointer text-foreground">Demo Mode</Label>
            </div>
            <Button variant="outline" onClick={() => toast.success('Export initiated')} type="button"><Download className="mr-2 h-4 w-4" /> Export All</Button>
            <Button onClick={() => toast.success('Add to CRM initiated')} type="button">Bulk Add to CRM</Button>
          </div>
      </div>

      {isSimulating && (
        <div className="bg-card border border-primary/20 rounded-lg p-8 mb-8 text-center max-w-2xl mx-auto shadow-sm">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">{SIMULATION_STAGES[simStage]}</h3>
          <Progress value={simProgress} className="h-2 mb-2" />
          <p className="text-sm text-muted-foreground">{Math.round(simProgress)}% Complete</p>
        </div>
      )}

      {!isSimulating && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card p-4 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-1">Total Companies</p>
              <h4 className="text-2xl font-bold">{companies.length}</h4>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-1">Avg Lead Score</p>
              <h4 className="text-2xl font-bold">
                {companies.length > 0 ? Math.round(companies.reduce((acc, c) => acc + (c.lead_score || 0), 0) / companies.length) : 0}
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
                        <div className="text-xs text-muted-foreground">{company.employees} emp.</div>
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
                            Score: {company.lead_score || 'N/A'}
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}