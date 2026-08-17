import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Clock, Settings, Play } from 'lucide-react';

export function EmailAutomationsTab() {
  const [automations, setAutomations] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAutomation, setEditingAutomation] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [autoRes, tplRes] = await Promise.all([
      supabase.from('email_automations').select('*').order('created_at', { ascending: false }),
      supabase.from('email_templates').select('id, name').eq('is_enabled', true)
    ]);
    if (autoRes.data) setAutomations(autoRes.data);
    if (tplRes.data) setTemplates(tplRes.data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editingAutomation.name || !editingAutomation.trigger_event || !editingAutomation.template_id) {
      toast.error('Name, Trigger, and Template are required');
      return;
    }
    setSaving(true);
    
    const payload = {
      name: editingAutomation.name,
      trigger_event: editingAutomation.trigger_event,
      template_id: editingAutomation.template_id,
      delay_minutes: editingAutomation.delay_minutes || 0,
      is_enabled: editingAutomation.is_enabled,
    };

    if (editingAutomation.id) {
      const { error } = await supabase.from('email_automations').update(payload).eq('id', editingAutomation.id);
      if (error) toast.error(error.message);
      else {
        toast.success('Automation updated');
        setEditingAutomation(null);
        loadData();
      }
    } else {
      const { error } = await supabase.from('email_automations').insert([payload]);
      if (error) toast.error(error.message);
      else {
        toast.success('Automation created');
        setEditingAutomation(null);
        loadData();
      }
    }
    setSaving(false);
  };

  const handleTest = async (auto: any) => {
    toast.info(`Testing automation: ${auto.name}`);
    try {
      const { data, error } = await supabase.functions.invoke('email-automation-worker', {
        body: { automation_id: auto.id, test: true }
      });
      if (error) throw error;
      toast.success('Test job submitted successfully');
    } catch(err: any) {
      toast.error('Test failed: ' + err.message);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Email Automations</CardTitle>
          <CardDescription>Configure workflows triggered by user actions</CardDescription>
        </div>
        <Dialog open={!!editingAutomation} onOpenChange={(open) => !open && setEditingAutomation(null)}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAutomation({ name: '', trigger_event: '', template_id: '', delay_minutes: 0, is_enabled: true })}>
              <Plus className="w-4 h-4 mr-2" /> Create Automation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAutomation?.id ? 'Edit Automation' : 'New Automation'}</DialogTitle>
            </DialogHeader>
            {editingAutomation && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Automation Name</Label>
                  <Input value={editingAutomation.name} onChange={e => setEditingAutomation({...editingAutomation, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Trigger Event</Label>
                  <Select value={editingAutomation.trigger_event} onValueChange={v => setEditingAutomation({...editingAutomation, trigger_event: v})}>
                    <SelectTrigger><SelectValue placeholder="Select Trigger" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user_signup">User Signs Up</SelectItem>
                      <SelectItem value="password_reset">Password Reset Requested</SelectItem>
                      <SelectItem value="newsletter_subscription">Newsletter Subscription</SelectItem>
                      <SelectItem value="purchase_success">Purchase Success</SelectItem>
                      <SelectItem value="payment_failed">Payment Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select value={editingAutomation.template_id} onValueChange={v => setEditingAutomation({...editingAutomation, template_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select Template" /></SelectTrigger>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Delay (Minutes)</Label>
                  <Input type="number" min="0" value={editingAutomation.delay_minutes} onChange={e => setEditingAutomation({...editingAutomation, delay_minutes: parseInt(e.target.value) || 0})} />
                  <p className="text-xs text-muted-foreground">0 for immediate delivery</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={editingAutomation.is_enabled} 
                    onCheckedChange={c => setEditingAutomation({...editingAutomation, is_enabled: c})} 
                    id="auto-enabled" 
                  />
                  <Label htmlFor="auto-enabled">Enable Automation</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingAutomation(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Automation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Delay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {automations.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">No automations found</TableCell></TableRow>
                ) : (
                  automations.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell><Badge variant="outline">{a.trigger_event}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center text-muted-foreground text-sm">
                          <Clock className="w-3 h-3 mr-1" /> {a.delay_minutes === 0 ? 'Immediate' : `${a.delay_minutes} min`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.is_enabled ? 'default' : 'secondary'}>{a.is_enabled ? 'Enabled' : 'Disabled'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                           <Button variant="ghost" size="sm" onClick={() => handleTest(a)} title="Test Automation"><Play className="w-4 h-4" /></Button>
                           <Button variant="ghost" size="sm" onClick={() => setEditingAutomation(a)}><Edit className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
