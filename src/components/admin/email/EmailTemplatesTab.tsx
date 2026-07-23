import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Loader2, Plus, Edit } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function EmailTemplatesTab() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const { data } = await supabase.from('email_templates').select('*').order('created_at', { ascending: false });
    if (data) setTemplates(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editingTemplate.name || !editingTemplate.subject || !editingTemplate.html_body) {
      toast.error('Name, Subject, and HTML Body are required');
      return;
    }
    setSaving(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    const payload = {
      ...editingTemplate,
      version: (editingTemplate.version || 0) + 1,
      last_edited_by: session?.user?.id
    };

    if (payload.id) {
      const { error } = await supabase.from('email_templates').update(payload).eq('id', payload.id);
      if (error) toast.error(error.message);
      else {
        toast.success('Template updated');
        setEditingTemplate(null);
        loadTemplates();
      }
    } else {
      const { error } = await supabase.from('email_templates').insert([payload]);
      if (error) toast.error(error.message);
      else {
        toast.success('Template created');
        setEditingTemplate(null);
        loadTemplates();
      }
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>Manage transactional and marketing email templates</CardDescription>
        </div>
        <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTemplate({ name: '', type: 'transactional', subject: '', html_body: '', is_enabled: true })}>
              <Plus className="w-4 h-4 mr-2" /> New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate?.id ? 'Edit Template' : 'New Template'}</DialogTitle>
            </DialogHeader>
            {editingTemplate && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={editingTemplate.type} onValueChange={v => setEditingTemplate({...editingTemplate, type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transactional">Transactional</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input value={editingTemplate.subject} onChange={e => setEditingTemplate({...editingTemplate, subject: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Preview Text (Optional)</Label>
                  <Input value={editingTemplate.preview_text || ''} onChange={e => setEditingTemplate({...editingTemplate, preview_text: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>HTML Body</Label>
                    <span className="text-xs text-muted-foreground">{"{{"}first_name{"}}"}, {"{{"}dashboard_url{"}}"}</span>
                  </div>
                  <Textarea 
                    className="min-h-[200px] font-mono text-sm" 
                    value={editingTemplate.html_body} 
                    onChange={e => setEditingTemplate({...editingTemplate, html_body: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plain Text Body (Fallback)</Label>
                  <Textarea 
                    className="min-h-[100px]" 
                    value={editingTemplate.plain_text_body || ''} 
                    onChange={e => setEditingTemplate({...editingTemplate, plain_text_body: e.target.value})} 
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={editingTemplate.is_enabled} 
                    onCheckedChange={c => setEditingTemplate({...editingTemplate, is_enabled: c})} 
                    id="template-enabled" 
                  />
                  <Label htmlFor="template-enabled">Enable Template</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTemplate(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Template
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
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">No templates found</TableCell></TableRow>
                ) : (
                  templates.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{t.type}</Badge></TableCell>
                      <TableCell className="max-w-[200px] truncate">{t.subject}</TableCell>
                      <TableCell>
                        <Badge variant={t.is_enabled ? 'default' : 'secondary'}>{t.is_enabled ? 'Enabled' : 'Disabled'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setEditingTemplate(t)}><Edit className="w-4 h-4" /></Button>
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
