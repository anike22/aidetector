import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ProspectingCompany, ProspectingDecisionMaker } from '@/types/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Phone, ExternalLink, MessageSquareText, Plus } from 'lucide-react';

export default function DecisionMakerProfilesPage() {
  const { companyId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [company, setCompany] = useState<ProspectingCompany | null>(null);
  const [decisionMakers, setDecisionMakers] = useState<ProspectingDecisionMaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', job_title: '', email: '', phone: '', linkedin_profile: '', source_url: '' });

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
        .eq('is_demo', false)
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

  const addVerifiedContact = async () => {
    if (!user || !companyId) return;
    if (!contactForm.name.trim() || !contactForm.source_url.trim()) {
      toast.error('Contact name and source URL are required.');
      return;
    }
    try {
      new URL(contactForm.source_url);
    } catch {
      toast.error('Enter a valid source URL.');
      return;
    }
    setSavingContact(true);
    try {
      const { data, error } = await supabase.from('prospecting_decision_makers').insert({
        company_id: companyId,
        user_id: user.id,
        name: contactForm.name.trim(),
        job_title: contactForm.job_title.trim() || null,
        email: contactForm.email.trim() || null,
        phone: contactForm.phone.trim() || null,
        linkedin_profile: contactForm.linkedin_profile.trim() || null,
        level: null,
        buying_intent_score: null,
        buying_intent_label: null,
        investment_probability: null,
        opportunity_detection: null,
        source_provider: 'User supplied source',
        source_url: contactForm.source_url.trim(),
        source_retrieved_at: new Date().toISOString(),
        is_demo: false
      }).select().single();
      if (error) throw error;
      setDecisionMakers((current) => [data as ProspectingDecisionMaker, ...current]);
      setContactForm({ name: '', job_title: '', email: '', phone: '', linkedin_profile: '', source_url: '' });
      setShowAddForm(false);
      toast.success('Sourced contact saved. Review the source before outreach.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save contact.');
    } finally {
      setSavingContact(false);
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
          <Button onClick={() => setShowAddForm((value) => !value)}><Plus className="mr-2 h-4 w-4" /> Add sourced contact</Button>
          <Button variant="outline" onClick={() => {
            const rows = decisionMakers.map((record: any) => [record.name, record.job_title || '', record.email || '', record.phone || '', record.linkedin_profile || '', record.source_url || '']);
            const csv = [['Name', 'Job title', 'Email', 'Phone', 'LinkedIn', 'Source URL'], ...rows]
              .map((row) => row.map((value) => '"' + String(value).replace(/"/g, '""') + '"').join(',')).join('\n');
            const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = 'decision-maker-records.csv';
            anchor.click();
            URL.revokeObjectURL(url);
          }} type="button">Export CSV</Button>
        </div>
      </div>

      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add a sourced decision-maker</CardTitle>
            <CardDescription>Enter only details you have verified. A source URL is required; no buying-intent or investment score is generated.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full name *</Label><Input value={contactForm.name} onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })} /></div>
              <div className="space-y-2"><Label>Job title</Label><Input value={contactForm.job_title} onChange={(event) => setContactForm({ ...contactForm, job_title: event.target.value })} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={contactForm.email} onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={contactForm.phone} onChange={(event) => setContactForm({ ...contactForm, phone: event.target.value })} /></div>
              <div className="space-y-2"><Label>LinkedIn profile</Label><Input value={contactForm.linkedin_profile} onChange={(event) => setContactForm({ ...contactForm, linkedin_profile: event.target.value })} /></div>
              <div className="space-y-2"><Label>Source URL *</Label><Input value={contactForm.source_url} onChange={(event) => setContactForm({ ...contactForm, source_url: event.target.value })} placeholder="Official company page or public professional profile" /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button onClick={addVerifiedContact} disabled={savingContact}>{savingContact ? <><span className="mr-2">Saving...</span></> : 'Save sourced contact'}</Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                <div className="mb-2">
                  {(dm as any).source_provider ? (
                    <Badge variant="outline">Source: {(dm as any).source_provider}</Badge>
                  ) : (
                    <Badge variant="outline">Source not verified</Badge>
                  )}
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

                {(dm as any).source_url && (
                  <a href={(dm as any).source_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                    View source record
                  </a>
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