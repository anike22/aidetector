import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ProspectingDecisionMaker, ProspectingCompany } from '@/types/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Copy, RefreshCw, Save } from 'lucide-react';

export default function OutreachGeneratorPage() {
  const [searchParams] = useSearchParams();
  const dmId = searchParams.get('dm');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [decisionMaker, setDecisionMaker] = useState<ProspectingDecisionMaker | null>(null);
  const [company, setCompany] = useState<ProspectingCompany | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [outreachType, setOutreachType] = useState('email');
  const [tone, setTone] = useState('professional');
  const [keyPoints, setKeyPoints] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');

  useEffect(() => {
    if (user && dmId) {
      fetchDM();
    }
  }, [user, dmId]);

  const fetchDM = async () => {
    try {
      setLoading(true);
      const { data: dmData, error: dmErr } = await supabase
        .from('prospecting_decision_makers')
        .select('*')
        .eq('id', dmId)
        .eq('is_demo', false)
        .single();
      if (dmErr) throw dmErr;
      setDecisionMaker(dmData);

      if (dmData.company_id) {
        const { data: compData, error: compErr } = await supabase
          .from('prospecting_companies')
          .select('*')
          .eq('id', dmData.company_id)
          .single();
        if (!compErr) setCompany(compData);
      }
    } catch(err) {
      toast.error('Failed to load decision maker');
    } finally {
      setLoading(false);
    }
  };

  const generateMessage = () => {
    if (!decisionMaker || !company) return;
    setGenerating(true);

    const name = decisionMaker.name;
    const role = decisionMaker.job_title || 'your role';
    const business = company.name;
    const points = keyPoints.trim();
    const opening = tone === 'friendly'
      ? `I hope your week is going well. I'm reaching out because of your work as ${role} at ${business}.`
      : tone === 'casual'
        ? `I'm getting in touch about your role at ${business}.`
        : tone === 'formal'
          ? `I am contacting you in your capacity as ${role} at ${business}.`
          : `I'm reaching out because you are listed as ${role} at ${business}.`;
    const context = points ? `\n\nThe reason for my message: ${points}` : '';
    let message = '';

    if (outreachType === 'email') {
      message = `Subject: Introduction — ${business}\n\nHi ${name},\n\n${opening}${context}\n\nWould you be open to a short conversation to see whether this is relevant to your current priorities?\n\nBest regards,\n[Your Name]`;
    } else if (outreachType === 'linkedin') {
      message = `Hi ${name}, ${opening} ${points ? points + ' ' : ''}Would you be open to connecting?`;
    } else if (outreachType === 'whatsapp') {
      message = `Hello ${name}, I'm [Your Name]. I'm contacting you about ${business}. ${points ? points + ' ' : ''}Would it be convenient to share a little more information?`;
    } else {
      message = `Opening: Hello ${name}, this is [Your Name]. Is now a convenient time for a brief introduction?\n\nContext: I'm contacting you because you are listed as ${role} at ${business}.${context}\n\nQuestion: Is this an area you are responsible for, or is there someone else I should contact?\n\nClose: Thank you for your time.`;
    }

    setGeneratedMessage(message);
    setGenerating(false);
  };

  const handleSaveToCrm = async () => {
    if (!user || !decisionMaker || !company) return;
    try {
      const { error: msgErr } = await supabase.from('prospecting_outreach_messages').insert({
        decision_maker_id: decisionMaker.id,
        user_id: user.id,
        outreach_type: outreachType,
        tone: tone,
        key_points: keyPoints,
        generated_message: generatedMessage
      });
      if (msgErr) throw msgErr;

      // Ensure they exist in CRM Leads
      const { data: existingLead } = await supabase
        .from('prospecting_crm_leads')
        .select('*')
        .eq('company_name', company.name)
        .eq('decision_maker_name', decisionMaker.name)
        .single();
      
      if (existingLead) {
        await supabase.from('prospecting_crm_leads').update({ stage: 'Contacted', last_activity: `Generated ${outreachType} message` }).eq('id', existingLead.id);
      } else {
        await supabase.from('prospecting_crm_leads').insert({
          user_id: user.id,
          company_name: company.name,
          decision_maker_name: decisionMaker.name,
          lead_score: null,
          stage: 'Contacted',
          last_activity: `Generated ${outreachType} message`,
          details: {
            job_title: decisionMaker.job_title,
            email: decisionMaker.email,
            source_provider: (decisionMaker as any).source_provider || null,
            source_url: (decisionMaker as any).source_url || null
          }
        });
      }

      toast.success('Message saved and CRM updated');
      navigate('/prospecting/crm');
    } catch(err) {
      toast.error('Failed to save to CRM');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage);
    toast.success('Copied to clipboard');
  };

  if (loading) return <div className="container mx-auto py-8">Loading...</div>;
  if (!decisionMaker) return <div className="container mx-auto py-8">No decision maker found.</div>;

  return (
    <div className="container mx-auto py-8 max-w-5xl flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-1/3">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Draft for {decisionMaker.name} ({decisionMaker.job_title || 'role not listed'}) at {company?.name}. The draft uses only saved company/contact details and facts you enter below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Key Points</Label>
              <Textarea 
                placeholder="Mention our SEO services, highlight case study..." 
                value={keyPoints}
                onChange={e => setKeyPoints(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={generateMessage} disabled={generating}>
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Generate Outreach
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="w-full md:w-2/3">
        <Tabs value={outreachType} onValueChange={setOutreachType}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="call">Cold Call</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <Card className="min-h-[400px] flex flex-col">
              <CardHeader>
                <CardTitle>{outreachType.charAt(0).toUpperCase() + outreachType.slice(1)} Template</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                {generatedMessage ? (
                  <Textarea 
                    value={generatedMessage}
                    onChange={e => setGeneratedMessage(e.target.value)}
                    className="min-h-[300px] font-mono text-sm leading-relaxed text-pretty"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground border-2 border-dashed border-muted rounded-md p-8 text-center">
                    Click 'Generate draft' to prepare a {outreachType} message for {decisionMaker.name}.
                  </div>
                )}
              </CardContent>
              {generatedMessage && (
                <CardFooter className="flex justify-end gap-2 border-t border-border pt-4">
                  <Button variant="outline" onClick={copyToClipboard}><Copy className="mr-2 h-4 w-4" /> Copy</Button>
                  <Button onClick={handleSaveToCrm}><Save className="mr-2 h-4 w-4" /> Save to CRM</Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </Tabs>
      </div>
    </div>
  );
}