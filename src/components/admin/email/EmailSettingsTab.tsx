import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function EmailSettingsTab() {
  const [settings, setSettings] = useState({
    id: '',
    resend_api_key: '',
    verified_domain: '',
    default_from_email: '',
    default_from_name: '',
    reply_to_email: '',
    support_email: '',
    billing_email: '',
    notification_email: '',
    admin_alert_email: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    supabase.from('email_settings').select('*').limit(1).single().then(({ data, error }) => {
      if (data) setSettings(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { id, created_at, updated_at, ...updateData } = settings as any;
    
    if (settings.id) {
      const { error } = await supabase.from('email_settings').update(updateData).eq('id', settings.id);
      if (error) toast.error('Failed to save settings: ' + error.message);
      else toast.success('Settings saved successfully');
    } else {
      const { data, error } = await supabase.from('email_settings').insert([updateData]).select().single();
      if (error) toast.error('Failed to save settings: ' + error.message);
      else {
        toast.success('Settings saved successfully');
        if (data) setSettings(data);
      }
    }
    setSaving(false);
  };

  const handleTestConnection = async () => {
    if (!settings.admin_alert_email && !settings.support_email) {
      toast.error('Please configure Admin Alert Email or Support Email to receive the test email.');
      return;
    }
    
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('resend-test-connection', {
        body: { 
          api_key: settings.resend_api_key,
          from: `${settings.default_from_name} <${settings.default_from_email}>`,
          to: settings.admin_alert_email || settings.support_email
        }
      });
      if (error) throw error;
      if (data && data.error) throw new Error(data.error);
      toast.success('Test email sent successfully! Check your inbox.');
    } catch (err: any) {
      toast.error('Test connection failed: ' + err.message);
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Provider Settings</CardTitle>
        <CardDescription>Configure Resend API and default email addresses for outgoing emails.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Resend API Key</Label>
            <Input 
              type="password" 
              placeholder="re_..." 
              value={settings.resend_api_key || ''} 
              onChange={e => setSettings({...settings, resend_api_key: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Verified Sending Domain</Label>
            <Input 
              placeholder="e.g. aidetector.cx" 
              value={settings.verified_domain || ''} 
              onChange={e => setSettings({...settings, verified_domain: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Default From Name</Label>
            <Input 
              placeholder="AIDetector" 
              value={settings.default_from_name || ''} 
              onChange={e => setSettings({...settings, default_from_name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Default From Email</Label>
            <Input 
              type="email" 
              placeholder="noreply@aidetector.cx" 
              value={settings.default_from_email || ''} 
              onChange={e => setSettings({...settings, default_from_email: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Reply-To Email</Label>
            <Input 
              type="email" 
              placeholder="support@aidetector.cx" 
              value={settings.reply_to_email || ''} 
              onChange={e => setSettings({...settings, reply_to_email: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Support Email</Label>
            <Input 
              type="email" 
              placeholder="support@aidetector.cx" 
              value={settings.support_email || ''} 
              onChange={e => setSettings({...settings, support_email: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Billing Email</Label>
            <Input 
              type="email" 
              placeholder="billing@aidetector.cx" 
              value={settings.billing_email || ''} 
              onChange={e => setSettings({...settings, billing_email: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Admin Alert Email</Label>
            <Input 
              type="email" 
              placeholder="admin@aidetector.cx" 
              value={settings.admin_alert_email || ''} 
              onChange={e => setSettings({...settings, admin_alert_email: e.target.value})}
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-border">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Settings
          </Button>
          <Button variant="outline" onClick={handleTestConnection} disabled={testing || !settings.resend_api_key}>
            {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Test Connection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
