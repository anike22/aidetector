import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getWorkspaceTemplates, createTemplate, updateTemplate, deleteTemplate } from '@/lib/teamApi';
import type { SharedTemplate, TemplateType } from '@/types/team';

const TYPES: TemplateType[] = ['detection', 'humanization', 'grammar', 'plagiarism', 'api'];

export default function WorkspaceTemplatesTab({ workspaceId }: { workspaceId: string }) {
  const [templates, setTemplates] = useState<SharedTemplate[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<TemplateType>('detection');

  const load = async () => {
    const data = await getWorkspaceTemplates(workspaceId);
    setTemplates(data);
  };

  useEffect(() => { load(); }, [workspaceId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createTemplate(workspaceId, { name: name.trim(), template_type: type, settings: {} });
      toast.success('Template created');
      setName('');
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create template');
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteTemplate(id);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete template');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="text-base font-medium">Shared templates</CardTitle>
          <CardDescription>Reusable presets for detection, humanization, grammar, and plagiarism.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
            <DialogHeader><DialogTitle>Create template</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="t-name">Template name</Label>
                <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as TemplateType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">{t.name}</p>
                <Badge variant="outline" className="capitalize mt-1">{t.template_type}</Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          {templates.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No templates yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
