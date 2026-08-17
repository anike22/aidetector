import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getWorkspaceGuidelines, createGuideline, deleteGuideline } from '@/lib/teamApi';
import type { BrandGuideline, GuidelineCategory } from '@/types/team';

const CATEGORIES: GuidelineCategory[] = ['tone', 'style', 'terminology', 'formatting', 'reading_level', 'ai_risk'];

export default function WorkspaceGuidelinesTab({ workspaceId }: { workspaceId: string }) {
  const [guidelines, setGuidelines] = useState<BrandGuideline[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<GuidelineCategory>('tone');
  const [content, setContent] = useState('');

  const load = async () => {
    const data = await getWorkspaceGuidelines(workspaceId);
    setGuidelines(data);
  };

  useEffect(() => { load(); }, [workspaceId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    try {
      await createGuideline(workspaceId, { name: name.trim(), category, content: content.trim() });
      toast.success('Guideline created');
      setName('');
      setContent('');
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create guideline');
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteGuideline(id);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="text-base font-medium">Brand writing guidelines</CardTitle>
          <CardDescription>Tone, terminology, and style rules for AI-assisted content.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New guideline</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
            <DialogHeader><DialogTitle>Create guideline</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="g-name">Guideline name</Label>
                <Input id="g-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as GuidelineCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="g-content">Content</Label>
                <Textarea id="g-content" value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
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
          {guidelines.map((g) => (
            <div key={g.id} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium">{g.name}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{g.category.replace('_', ' ')}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => remove(g.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{g.content}</p>
            </div>
          ))}
          {guidelines.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No guidelines yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
