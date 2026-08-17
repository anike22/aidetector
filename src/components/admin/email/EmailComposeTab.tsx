import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';

export function EmailComposeTab() {
  const [segment, setSegment] = useState('one_user');
  const [customEmail, setCustomEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject || !htmlBody) {
      toast.error('Subject and message body are required');
      return;
    }

    setSending(true);
    try {
      let recipients: string[] = [];

      if (segment === 'one_user' && customEmail) {
        recipients = customEmail.split(',').map(e => e.trim()).filter(e => e);
      } else if (segment === 'all_users') {
        const { data } = await supabase.from('profiles').select('email');
        if (data) recipients = data.map(p => p.email).filter(e => e) as string[];
      } else if (segment === 'pro_users') {
         const { data } = await supabase.from('profiles').select('email').eq('subscription_plan', 'pro');
         if (data) recipients = data.map(p => p.email).filter(e => e) as string[];
      }

      if (recipients.length === 0) {
        toast.error('No valid recipients found');
        setSending(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No auth session');

      const { data, error } = await supabase.functions.invoke('resend-send-email', {
        body: { recipients, subject, html: htmlBody, type: 'admin_message' },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success(`Successfully sent email to ${data.successCount} users. Failed: ${data.failedCount}`);
      setSubject('');
      setHtmlBody('');
      setCustomEmail('');
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
          <Label>Message Body (HTML supported)</Label>
          <Textarea 
            placeholder="<p>Hello there,</p>" 
            className="min-h-[300px] font-mono text-sm"
            value={htmlBody} 
            onChange={e => setHtmlBody(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Supported merge tags: {"{{"}first_name{"}}"}, {"{{"}email{"}}"}</p>
        </div>

        <div className="flex gap-4 pt-4 border-t border-border">
          <Button onClick={handleSend} disabled={sending} className="gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
