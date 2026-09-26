import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Loader2, Send, Eye, Mail, Smartphone, Monitor } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  template_key?: string;
  body_only?: boolean;
  subject?: string;
  preview_text?: string;
  html_body?: string;
  cta_label?: string;
  cta_url?: string;
  is_default?: boolean;
}

export function EmailComposeTab() {
  const [segment, setSegment] = useState('one_user');
  const [customEmail, setCustomEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [validation, setValidation] = useState<{ warnings: string[]; errors: string[] }>({ warnings: [], errors: [] });
  const [sending, setSending] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTemplates();
    loadSettings();
  }, []);

  const loadTemplates = async () => {
    const { data } = await supabase
      .from('email_templates')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });
    const list = (data || []) as EmailTemplate[];
    setTemplates(list);

    const defaultTpl = list.find((t) => t.is_default || t.template_key === 'professional-partnership');
    if (defaultTpl) {
      setSelectedTemplate(defaultTpl.id);
      applyTemplate(defaultTpl);
    }
  };

  const loadSettings = async () => {
    const { data } = await supabase.from('email_settings').select('*').limit(1).single();
    if (data) setSettings(data);
  };

  const applyTemplate = (tpl: EmailTemplate) => {
    if (!tpl.body_only) {
      // Legacy full-HTML template: keep raw mode, use its stored subject/body
      setSubject(tpl.subject || '');
      setHtmlBody(tpl.html_body || '');
      return;
    }
    setSubject(tpl.subject || '');
    setPreheader(tpl.preview_text || '');
    setHtmlBody(tpl.html_body || '');
    setCtaLabel(tpl.cta_label || '');
    setCtaUrl(tpl.cta_url || '');
  };

  const handleTemplateChange = (id: string) => {
    setSelectedTemplate(id);
    if (id === 'custom') {
      setSubject('');
      setPreheader('');
      setHtmlBody('');
      setCtaLabel('');
      setCtaUrl('');
      return;
    }
    const tpl = templates.find((t) => t.id === id);
    if (tpl) applyTemplate(tpl);
  };

  const resolveRecipients = async (): Promise<string[]> => {
    let recipients: string[] = [];
    if (segment === 'one_user' && customEmail) {
      recipients = customEmail.split(',').map(e => e.trim()).filter(e => e);
    } else if (segment === 'all_users') {
      const { data } = await supabase.from('profiles').select('email');
      if (data) recipients = data.map((p: any) => p.email).filter((e: any) => e) as string[];
    } else if (segment === 'pro_users') {
      const { data } = await supabase.from('profiles').select('email').eq('subscription_plan', 'pro');
      if (data) recipients = data.map((p: any) => p.email).filter((e: any) => e) as string[];
    } else if (segment === 'business_users') {
      const { data } = await supabase.from('profiles').select('email').eq('subscription_plan', 'business');
      if (data) recipients = data.map((p: any) => p.email).filter((e: any) => e) as string[];
    }
    return recipients;
  };

  const buildPayload = (recipients: string[], isTest = false) => {
    const tpl = templates.find((t) => t.id === selectedTemplate);
    const payload: Record<string, any> = {
      recipients: isTest ? [recipients[0] || customEmail.split(',')[0].trim()] : recipients,
      subject,
      type: segment === 'one_user' ? 'admin_message' : 'campaign',
    };

    if (tpl?.body_only) {
      payload.template_id = selectedTemplate;
      payload.preheader = preheader;
      payload.bodyHtml = htmlBody;
      payload.cta = { label: ctaLabel.trim(), url: ctaUrl.trim() };
      payload.isCampaign = segment !== 'one_user';
      payload.unsubscribeUrl = segment !== 'one_user' ? 'https://aidetector.cx/unsubscribe?email={{email}}' : undefined;
      payload.testEmail = isTest;
    } else {
      payload.html = htmlBody;
      payload.text = '';
    }
    if (selectedTemplate === 'custom') {
      payload.html = htmlBody;
      payload.text = '';
      delete payload.template_id;
    }
    return payload;
  };

  const renderPreview = async () => {
    if (!subject || !htmlBody) {
      toast.error('Subject and message body are required to preview');
      return;
    }
    setPreviewLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No auth session');

      const payload: Record<string, any> = {
        subject,
        preheader,
        bodyHtml: htmlBody,
        recipientData: { first_name: 'Alex', email: 'alex@example.com' },
        cta: { label: ctaLabel.trim(), url: ctaUrl.trim() },
        isCampaign: segment !== 'one_user',
        unsubscribeUrl: segment !== 'one_user' ? 'https://aidetector.cx/unsubscribe?email={{email}}' : undefined,
        settings: settings || {},
      };

      if (selectedTemplate && selectedTemplate !== 'custom') {
        payload.template_id = selectedTemplate;
      }

      const { data, error } = await supabase.functions.invoke('render-email-template', {
        body: payload,
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setPreviewHtml(data.html || '');
      setValidation(data.validation || { warnings: [], errors: [] });
      setPreviewOpen(true);
    } catch (err: any) {
      toast.error('Preview failed: ' + err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!subject || !htmlBody) {
      toast.error('Subject and message body are required');
      return;
    }
    if (segment !== 'one_user' || !customEmail) {
      toast.error('Test email requires a specific recipient address');
      return;
    }
    setTestSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No auth session');

      const recipients = customEmail.split(',').map(e => e.trim()).filter(e => e);
      const { data, error } = await supabase.functions.invoke('resend-send-email', {
        body: buildPayload(recipients, true),
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success(`Test email sent. Success: ${data.successCount}, Failed: ${data.failedCount}`);
    } catch (err: any) {
      toast.error('Test email failed: ' + err.message);
    } finally {
      setTestSending(false);
    }
  };

  const handleSend = async () => {
    if (!subject || !htmlBody) {
      toast.error('Subject and message body are required');
      return;
    }

    setSending(true);
    try {
      const recipients = await resolveRecipients();
      if (recipients.length === 0) {
        toast.error('No valid recipients found');
        setSending(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No auth session');

      const { data, error } = await supabase.functions.invoke('resend-send-email', {
        body: buildPayload(recipients, false),
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success(`Successfully sent email to ${data.successCount} users. Failed: ${data.failedCount}`);
      setSubject('');
      setPreheader('');
      setHtmlBody('');
      setCtaLabel('');
      setCtaUrl('');
      setCustomEmail('');
      const defaultTpl = templates.find((t) => t.is_default || t.template_key === 'professional-partnership');
      if (defaultTpl) applyTemplate(defaultTpl);
    } catch (err: any) {
      toast.error('Failed to send email: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose Email</CardTitle>
        <CardDescription>Send direct emails or broadcasts to users.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Template</Label>
          <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
            <SelectTrigger><SelectValue placeholder="Select a template" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom HTML (no template wrapper)</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Recipient Segment</Label>
          <Select value={segment} onValueChange={setSegment}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="one_user">Specific User(s)</SelectItem>
              <SelectItem value="all_users">All Users</SelectItem>
              <SelectItem value="pro_users">Pro Users</SelectItem>
              <SelectItem value="business_users">Business Users</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {segment === 'one_user' && (
          <div className="space-y-2">
            <Label>Recipient Emails (comma separated)</Label>
            <Input 
              placeholder="user@example.com, another@example.com" 
              value={customEmail} 
              onChange={e => setCustomEmail(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Subject</Label>
          <Input 
            placeholder="Important Update" 
            value={subject} 
            onChange={e => setSubject(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Preheader (optional)</Label>
          <Input 
            placeholder="Short preview text shown in the inbox" 
            value={preheader} 
            onChange={e => setPreheader(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Message Body (HTML supported)</Label>
          <Textarea 
            placeholder="<p>Hello there,</p>" 
            className="min-h-[300px] font-mono text-sm"
            value={htmlBody} 
            onChange={e => setHtmlBody(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Supported merge tags: {"{{"}first_name{"}}"}, {"{{"}email{"}}"}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>CTA Label (optional)</Label>
            <Input 
              placeholder="Learn more" 
              value={ctaLabel} 
              onChange={e => setCtaLabel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>CTA URL (optional)</Label>
            <Input 
              placeholder="https://aidetector.cx/" 
              value={ctaUrl} 
              onChange={e => setCtaUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
          <Button onClick={handleSend} disabled={sending || testSending} className="gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Now
          </Button>
          <Button variant="outline" onClick={handleSendTest} disabled={sending || testSending} className="gap-2">
            {testSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Send Test
          </Button>
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={renderPreview} disabled={previewLoading} className="gap-2">
                {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                Preview Email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-4xl max-h-[90dvh] overflow-y-auto p-4">
              <DialogHeader>
                <DialogTitle>Email Preview</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
                    <Button
                      type="button"
                      size="sm"
                      variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                      onClick={() => setPreviewMode('desktop')}
                      className={`h-8 px-3.5 text-xs font-semibold gap-2 transition-all ${
                        previewMode === 'desktop'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-foreground/70 hover:text-foreground hover:bg-background/50'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5 shrink-0" />
                      <span>Desktop</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                      onClick={() => setPreviewMode('mobile')}
                      className={`h-8 px-3.5 text-xs font-semibold gap-2 transition-all ${
                        previewMode === 'mobile'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-foreground/70 hover:text-foreground hover:bg-background/50'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5 shrink-0" />
                      <span>Mobile</span>
                    </Button>
                  </div>
                </div>

                {(validation.warnings.length > 0 || validation.errors.length > 0) && (
                  <div className="space-y-2">
                    {validation.warnings.map((w, i) => (
                      <Alert key={`w-${i}`} variant="default" className="bg-yellow-50/50 border-yellow-200">
                        <AlertDescription>{w}</AlertDescription>
                      </Alert>
                    ))}
                    {validation.errors.map((e, i) => (
                      <Alert key={`e-${i}`} variant="destructive">
                        <AlertDescription>{e}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                <div className="w-full border rounded-lg overflow-hidden bg-muted p-4">
                  <div className={
                    previewMode === 'mobile'
                      ? 'mx-auto max-w-[375px] border bg-white shadow-sm'
                      : 'mx-auto max-w-[700px] border bg-white shadow-sm'
                  }>
                    <iframe
                      srcDoc={previewHtml}
                      title="Email preview"
                      className="w-full"
                      style={{ height: '60vh', border: 0 }}
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
