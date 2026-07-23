import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Loader2, Settings } from 'lucide-react';

export function EmailNotificationsTab() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [autoRes, tplRes] = await Promise.all([
      supabase.from('email_automations').select('*'),
      supabase.from('email_templates').select('id, name').eq('is_enabled', true)
    ]);
    
    if (autoRes.data) {
        // Find existing or mock default notifications from automations
        const notifs = [
            { id: autoRes.data.find(a => a.trigger_event === 'user_signup')?.id || 'new1', name: 'User Signup', event: 'user_signup', user_email: true, admin_email: true, template_id: autoRes.data.find(a => a.trigger_event === 'user_signup')?.template_id },
            { id: autoRes.data.find(a => a.trigger_event === 'purchase_success')?.id || 'new2', name: 'Purchase Success', event: 'purchase_success', user_email: true, admin_email: true, template_id: autoRes.data.find(a => a.trigger_event === 'purchase_success')?.template_id },
            { id: autoRes.data.find(a => a.trigger_event === 'payment_failed')?.id || 'new3', name: 'Payment Failed', event: 'payment_failed', user_email: true, admin_email: true, template_id: autoRes.data.find(a => a.trigger_event === 'payment_failed')?.template_id },
            { id: autoRes.data.find(a => a.trigger_event === 'password_reset')?.id || 'new4', name: 'Password Reset', event: 'password_reset', user_email: true, admin_email: false, template_id: autoRes.data.find(a => a.trigger_event === 'password_reset')?.template_id },
        ];
        setNotifications(notifs);
    }
    if (tplRes.data) setTemplates(tplRes.data);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    // Sync notifications back to email_automations
    for (const notif of notifications) {
        if (!notif.template_id) continue;
        const payload = {
            name: notif.name,
            trigger_event: notif.event,
            template_id: notif.template_id,
            is_enabled: notif.user_email
        };
        if (notif.id && !notif.id.startsWith('new')) {
            await supabase.from('email_automations').update(payload).eq('id', notif.id);
        } else {
            await supabase.from('email_automations').insert([payload]);
        }
    }
    toast.success('Notification preferences saved');
    loadData();
    setSaving(false);
  };

  const updateNotif = (index: number, field: string, value: any) => {
      const newNotifs = [...notifications];
      newNotifs[index] = { ...newNotifs[index], [field]: value };
      setNotifications(newNotifs);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage automated system notifications for users and admins</CardDescription>
        </div>
        <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Settings className="w-4 h-4 mr-2" />}
            Save Settings
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <div className="space-y-6">
            {notifications.map((notif, index) => (
                <div key={notif.event} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                        <Label className="text-base font-semibold">{notif.name}</Label>
                        <p className="text-sm text-muted-foreground">Triggered on {notif.event.replace('_', ' ')}</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col gap-2">
                           <div className="flex items-center gap-2">
                              <Switch id={`user-${notif.event}`} checked={notif.user_email} onCheckedChange={c => updateNotif(index, 'user_email', c)} />
                              <Label htmlFor={`user-${notif.event}`}>Send to User</Label>
                           </div>
                           <Select value={notif.template_id || ''} onValueChange={v => updateNotif(index, 'template_id', v)} disabled={!notif.user_email}>
                               <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue placeholder="Select Template" /></SelectTrigger>
                               <SelectContent>
                                   {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                               </SelectContent>
                           </Select>
                        </div>
                    </div>
                </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
