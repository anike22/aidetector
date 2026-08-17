import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { getOrganizationWorkspaces, createWorkspace } from '@/lib/teamApi';
import type { Workspace } from '@/types/team';
import EmptyState from './EmptyState';

export default function OrganizationWorkspacesTab({ organizationId }: { organizationId: string }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const data = await getOrganizationWorkspaces(organizationId);
    setWorkspaces(data);
  };

  useEffect(() => { load(); }, [organizationId]);

  useEffect(() => {
    const channel = supabase
      .channel(`org-workspaces-${organizationId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspaces', filter: `organization_id=eq.${organizationId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organizationId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createWorkspace(organizationId, { name: name.trim(), description });
      toast.success('Workspace created');
      setName('');
      setDescription('');
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create workspace');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="text-base font-medium">Workspaces</CardTitle>
          <CardDescription>Isolated collaboration spaces for teams and departments.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New workspace</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
            <DialogHeader><DialogTitle>Create workspace</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="ws-name">Workspace name</Label>
                <Input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Marketing" />
              </div>
              <div>
                <Label htmlFor="ws-desc">Description</Label>
                <Input id="ws-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
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
          {workspaces.map((ws) => (
            <Link to={`/workspaces/${ws.id}`} key={ws.id}>
              <Card className="h-full hover:border-primary transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <FolderOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{ws.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{ws.description || 'No description'}</p>
                      <Badge variant="outline" className="mt-2 capitalize">{ws.status}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {workspaces.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={FolderOpen}
                title="No workspaces yet"
                description="Create your first workspace to organize projects, reports, and team collaboration."
                actionLabel="New workspace"
                onAction={() => setOpen(true)}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
