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

  const generateMessage = async () => {
    if (!decisionMaker) return;
    setGenerating(true);
    
    // Simulate AI Generation
    await new Promise(r => setTimeout(r, 1500));
    
    let message = '';
    const pointsText = keyPoints ? ` We specialize in: ${keyPoints}.` : '';

    if (outreachType === 'email') {
      message = `Subject: Quick question about ${company?.name || 'your company'} growth\n\nHi ${decisionMaker.name},\n\nI noticed that you recently expanded operations, and as the ${decisionMaker.job_title}, scaling efficiently is likely top of mind.\n\n${pointsText} I'd love to share a quick idea on how we helped a similar company in your industry achieve their goals.\n\nAre you open to a brief chat next Tuesday?\n\nBest regards,\n[Your Name]`;
    } else if (outreachType === 'linkedin') {
      message = `Hi ${decisionMaker.name}, saw the great news about ${company?.name || 'your team'}'s recent growth! As you focus on scaling, I'd love to connect. ${pointsText} Let me know if you're open to a brief chat.`;
    } else if (outreachType === 'whatsapp') {
      message = `Hi ${decisionMaker.name}, reaching out because of ${company?.name || 'your company'}'s recent expansion. ${pointsText} Do you have 5 mins next week for a quick chat?`;
    } else {
      message = `[Ringing]\n\nProspect: Hello?\n\nYou: Hi ${decisionMaker.name}, this is [Your Name]. I know I caught you out of the blue, do you have 30 seconds?\n\nProspect: Sure.\n\nYou: Great. I was researching ${company?.name || 'your company'} and saw your recent expansion. ${pointsText} Is that something you are actively looking to improve right now?\n\n[Wait for response]`;
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
          lead_score: decisionMaker.buying_intent_score,
          stage: 'Contacted',
          last_activity: `Generated ${outreachType} message`,
          details: { job_title: decisionMaker.job_title, email: decisionMaker.email }
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
            <CardDescription>Target: {decisionMaker.name} ({decisionMaker.job_title}) at {company?.name}</CardDescription>
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
                    Click 'Generate Outreach' to create a personalized {outreachType} message for {decisionMaker.name}.
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