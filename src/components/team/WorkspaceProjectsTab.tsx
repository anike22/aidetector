import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getWorkspaceProjects, createProject, updateProject } from '@/lib/teamApi';
import type { WorkspaceProject } from '@/types/team';

export default function WorkspaceProjectsTab({ workspaceId }: { workspaceId: string }) {
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const data = await getWorkspaceProjects(workspaceId);
    setProjects(data);
  };

  useEffect(() => { load(); }, [workspaceId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createProject(workspaceId, { name: name.trim(), description });
      toast.success('Project created');
      setName('');
      setDescription('');
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const archive = async (id: string) => {
    try {
      await updateProject(id, { status: 'archived' });
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to archive');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="text-base font-medium">Projects</CardTitle>
          <CardDescription>Group related reports together.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New project</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
            <DialogHeader><DialogTitle>Create project</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="p-name">Project name</Label>
                <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Q4 Content Review" />
              </div>
              <div>
                <Label htmlFor="p-desc">Description</Label>
                <Input id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.filter((p) => p.status !== 'archived').map((p) => (
            <Card key={p.id} className="h-full flex flex-col">
              <CardContent className="p-4 flex-1">
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{p.description || 'No description'}</p>
                <Badge variant="outline" className="mt-2 capitalize">{p.status}</Badge>
              </CardContent>
              <div className="p-4 pt-0">
                <Button variant="outline" size="sm" className="w-full" onClick={() => archive(p.id)}>Archive</Button>
              </div>
            </Card>
          ))}
          {projects.filter((p) => p.status !== 'archived').length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full text-center py-8">No active projects.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
