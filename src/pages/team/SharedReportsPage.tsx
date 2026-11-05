import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { useTeam } from '@/contexts/TeamContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
  const { user } = useAuth();
  const { currentWorkspace, currentOrganization } = useTeam();
  const [workspaceId, setWorkspaceId] = useState(currentWorkspace?.id || searchParams.get('workspace') || '');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [reports, setReports] = useState<CollaborationReport[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (currentWorkspace?.id) setWorkspaceId(currentWorkspace.id);
  }, [currentWorkspace?.id]);

  useEffect(() => {
    if (currentOrganization) {
      getOrganizationWorkspaces(currentOrganization.id).then(setWorkspaces).catch(() => {});
    }
  }, [currentOrganization]);

  useEffect(() => {
    if (workspaceId) load();
  }, [workspaceId]);

  const load = async () => {
    try {
      const data = await getWorkspaceReports(workspaceId);
      setReports(data);
    } catch {
      setReports([]);
    }
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
        <header className="max-w-3xl mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Shared AI Detection Reports & Team Collaboration</h1>
          <p className="mt-3 text-base text-muted-foreground">
            Organize AI detection, humanization, and plagiarism results in one workspace. AIDetector.cx shared reports help teams review findings, discuss results, and manage approval steps without losing the context of an analysis.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <Link className="text-primary underline underline-offset-4" to="/detector">AI text detection</Link>
            <Link className="text-primary underline underline-offset-4" to="/humanizer">AI humanizer</Link>
            <Link className="text-primary underline underline-offset-4" to="/plagiarism-checker">Plagiarism checker</Link>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-3 mb-8" aria-label="Shared report collaboration features">
          <div className="rounded-xl border p-5">
            <h2 className="font-semibold">Keep analysis together</h2>
            <p className="mt-2 text-sm text-muted-foreground">Create workspace reports for detection, humanization, and plagiarism workflows, with a clear record for your team.</p>
          </div>
          <div className="rounded-xl border p-5">
            <h2 className="font-semibold">Discuss findings</h2>
            <p className="mt-2 text-sm text-muted-foreground">Use report comments to keep review conversations connected to the analysis being discussed.</p>
          </div>
          <div className="rounded-xl border p-5">
            <h2 className="font-semibold">Manage approvals</h2>
            <p className="mt-2 text-sm text-muted-foreground">Submit reports to configured approval workflows and track review decisions in the workspace.</p>
          </div>
        </section>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Your workspace reports</h2>
            <p className="text-sm text-muted-foreground">Workspace reports and their contents remain visible only to people with the appropriate access.</p>
          </div>
          {workspaceId && (
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
          )}
        </div>

        {workspaceId ? (
          <>
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
          </>
        ) : (
          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="text-lg font-semibold">{user ? 'Choose a workspace to get started' : 'Sign in to access your shared reports'}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {user ? 'Open your organization workspace to create and review team reports.' : 'Sign in to view reports belonging to your workspace. Report titles, analysis results, comments, and approvals are not exposed on this public page.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {user ? <Button asChild><Link to="/organizations">Open organizations</Link></Button> : <><Button asChild><Link to="/login">Sign in</Link></Button><Button variant="outline" asChild><Link to="/signup">Create an account</Link></Button></>}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
