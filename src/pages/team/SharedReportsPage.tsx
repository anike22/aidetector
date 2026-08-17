import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { useTeam } from '@/contexts/TeamContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { getWorkspaceReports, createReport, getOrganizationWorkspaces } from '@/lib/teamApi';
import type { CollaborationReport, Workspace } from '@/types/team';
import { formatDistanceToNow } from 'date-fns';

export default function SharedReportsPage() {
  const [searchParams] = useSearchParams();
  const { currentWorkspace, currentOrganization } = useTeam();
  const [workspaceId, setWorkspaceId] = useState(currentWorkspace?.id || searchParams.get('workspace') || '');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [reports, setReports] = useState<CollaborationReport[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (currentOrganization) {
      getOrganizationWorkspaces(currentOrganization.id).then(setWorkspaces).catch(() => {});
    }
  }, [currentOrganization]);

  useEffect(() => {
    if (workspaceId) load();
  }, [workspaceId]);

  const load = async () => {
    const data = await getWorkspaceReports(workspaceId);
    setReports(data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !workspaceId) return;
    try {
      await createReport(workspaceId, { title: title.trim() });
      toast.success('Report created');
      setTitle('');
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create report');
    }
  };

  const filtered = reports.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Shared reports</h1>
            <p className="text-sm text-muted-foreground">Collaborate on detection, humanization, and plagiarism reports.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New report</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
              <DialogHeader><DialogTitle>Create collaboration report</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="r-title">Title</Label>
                  <Input id="r-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="March campaign review" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search reports…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filtered.map((r) => (
                <Link to={`/reports/${r.id}/collaborate`} key={r.id}>
                  <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.tool_type} • {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</p>
                    </div>
                    <Badge variant="outline" className="capitalize shrink-0">{r.approval_status}</Badge>
                  </div>
                </Link>
              ))}
              {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No reports found.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
