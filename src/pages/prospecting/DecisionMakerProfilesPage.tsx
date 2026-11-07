import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ProspectingCompany, ProspectingDecisionMaker } from '@/types/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Phone, ExternalLink, MessageSquareText, Plus, Target } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function DecisionMakerProfilesPage() {
  const { companyId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [company, setCompany] = useState<ProspectingCompany | null>(null);
  const [decisionMakers, setDecisionMakers] = useState<ProspectingDecisionMaker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && companyId) {
      fetchData();
    }
  }, [user, companyId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: compData, error: compErr } = await supabase
        .from('prospecting_companies')
        .select('*')
        .eq('id', companyId)
        .single();
        
      if (compErr) throw compErr;
      setCompany(compData);

      const { data: dmData, error: dmErr } = await supabase
        .from('prospecting_decision_makers')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_demo', false)
        .order('level', { ascending: false });

      if (dmErr) throw dmErr;
      
      setDecisionMakers((dmData || []).filter((record: any) => record.is_demo !== true));
    } catch (err: any) {
      toast.error('Failed to load decision makers');
    } finally {
      setLoading(false);
    }
  };

  const addToCrm = async (dm: ProspectingDecisionMaker) => {
    try {
      const { error } = await supabase.from('prospecting_crm_leads').insert({
        user_id: user!.id,
        company_name: company?.name,
        decision_maker_name: dm.name,
        lead_score: null,
        stage: 'New Lead',
        details: {
          job_title: dm.job_title,
          email: dm.email,
          source_provider: (dm as any).source_provider || null,
          source_url: (dm as any).source_url || null,
          verification_status: 'existing_profile_requires_source_review'
        }
      });
      if (error) throw error;
      toast.success(`${dm.name} added to CRM`);
    } catch(err: any) {
      toast.error('Failed to add to CRM');
    }
  };

  const getLevelBadge = (level: number | null) => {
    if (!level) return null;
    const colors = ['bg-slate-100', 'bg-blue-100', 'bg-indigo-100', 'bg-purple-100', 'bg-emerald-100'];
    return <Badge variant="outline" className={`${colors[level-1]} text-foreground border-transparent`}>Level {level}</Badge>;
  };

  const getIntentBadge = (label: string | null) => {
    if (label === 'Hot Lead') return <Badge className="bg-red-500 hover:bg-red-600">Hot Lead</Badge>;
    if (label === 'Warm Lead') return <Badge className="bg-orange-500 hover:bg-orange-600">Warm Lead</Badge>;
    return <Badge className="bg-blue-500 hover:bg-blue-600">Cold Lead</Badge>;
  };

  return (
    <div className="container mx-auto py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Companies
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy mb-2">{company?.name} - Decision Makers</h1>
          {company?.website && (
            <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
              {company.website} <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.success('Export initiated')} type="button">Export All</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          <Card className="h-64 bg-muted/20"></Card>
          <Card className="h-64 bg-muted/20"></Card>
        </div>
      ) : (
        <>
        {decisionMakers.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>No verified decision-maker records</CardTitle>
              <CardDescription>No sourced decision-maker profiles are saved for this company yet. We will not invent names, email addresses, phone numbers or buying-intent scores.</CardDescription>
            </CardHeader>
          </Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decisionMakers.map(dm => (
            <Card key={dm.id} className="flex flex-col h-full border-border">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>{getLevelBadge(dm.level)}</TooltipTrigger>
                        <TooltipContent>
                          <p className="w-[200px] text-sm">
                            {dm.level === 5 && 'Level 5: Can approve budget immediately (Founder, CEO, Owner)'}
                            {dm.level === 4 && 'Level 4: Can recommend purchase (COO, Marketing Director)'}
                            {dm.level === 3 && 'Level 3: Influencer (Team Lead, Project Manager)'}
                            {dm.level === 2 && 'Level 2: Researcher (Specialist)'}
                            {dm.level === 1 && 'Level 1: Low authority (Staff)'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {getIntentBadge(dm.buying_intent_label)}
                  </div>
                </div>
                <CardTitle className="text-xl">{dm.name}</CardTitle>
                <CardDescription className="text-primary font-medium">{dm.job_title}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2 text-sm">
                  {dm.email && (
                    <div className="flex items-center text-muted-foreground">
                      <Mail className="h-4 w-4 mr-2" /> {dm.email}
                    </div>
                  )}
                  {dm.phone && (
                    <div className="flex items-center text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2" /> {dm.phone}
                    </div>
                  )}
                  {dm.linkedin_profile && (
                    <div className="flex items-center text-muted-foreground">
                      <ExternalLink className="h-4 w-4 mr-2" /> 
                      <a href={`https://${dm.linkedin_profile}`} target="_blank" className="hover:underline hover:text-primary">LinkedIn Profile</a>
                    </div>
                  )}
                </div>

                {dm.opportunity_detection && (
                  <div className="bg-primary/5 p-3 rounded-md border border-primary/10 mt-4">
                    <div className="flex items-start">
                      <Target className="h-4 w-4 text-primary mt-0.5 mr-2 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-primary mb-1">Opportunity Detection</p>
                        <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{dm.opportunity_detection}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-4 border-t border-border mt-auto shrink-0 flex gap-2 flex-wrap">
                <Button className="flex-1 min-w-[120px]" asChild>
                  <Link to={`/prospecting/outreach/new?dm=${dm.id}`}>
                    <MessageSquareText className="mr-2 h-4 w-4" /> Generate Outreach
                  </Link>
                </Button>
                <Button variant="outline" className="flex-1 min-w-[120px]" onClick={() => addToCrm(dm)}>
                  <Plus className="mr-2 h-4 w-4" /> Add to CRM
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        </>
      )}
    </div>
  );
}