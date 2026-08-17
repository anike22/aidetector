import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { useTeam } from '@/contexts/TeamContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getWorkspace, getWorkspaceReports, getWorkspaceProjects, getWorkspaceMembers } from '@/lib/teamApi';
import type { Workspace, CollaborationReport, WorkspaceProject, WorkspaceMember } from '@/types/team';
import { FolderOpen, Users, FileText, Settings } from 'lucide-react';
import WorkspaceMembersTab from '@/components/team/WorkspaceMembersTab';
import WorkspaceProjectsTab from '@/components/team/WorkspaceProjectsTab';
import WorkspaceTemplatesTab from '@/components/team/WorkspaceTemplatesTab';
import WorkspaceGuidelinesTab from '@/components/team/WorkspaceGuidelinesTab';
import WorkspaceWorkflowsTab from '@/components/team/WorkspaceWorkflowsTab';
import WorkspaceDocumentsTab from '@/components/team/WorkspaceDocumentsTab';
import WorkspaceActivityTab from '@/components/team/WorkspaceActivityTab';
import { formatDistanceToNow } from 'date-fns';

export default function WorkspaceDashboardPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { setCurrentWorkspace } = useTeam();
  const [ws, setWs] = useState<Workspace | null>(null);
  const [reports, setReports] = useState<CollaborationReport[]>([]);
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [w, r, p, m] = await Promise.all([
          getWorkspace(workspaceId),
          getWorkspaceReports(workspaceId),
          getWorkspaceProjects(workspaceId),
          getWorkspaceMembers(workspaceId),
        ]);
        if (!mounted) return;
        setWs(w);
        if (w) setCurrentWorkspace(w);
        setReports(r);
        setProjects(p);
        setMembers(m);
      } catch (err: any) {
        toast.error('Failed to load workspace');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [workspaceId]);

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-8 md:px-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{ws?.name}</h1>
              <p className="text-sm text-muted-foreground">{ws?.description || 'Workspace'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/reports/shared?workspace=${workspaceId}`}>
              <Button variant="outline"><FileText className="h-4 w-4 mr-2" /> Shared reports</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <MetricCard icon={FileText} label="Reports" value={reports.length} />
          <MetricCard icon={FolderOpen} label="Projects" value={projects.length} />
          <MetricCard icon={Users} label="Members" value={members.length} />
        </div>

        <Tabs defaultValue="reports">
          <div className="overflow-x-auto whitespace-nowrap -mx-4 px-4 mb-6">
            <TabsList className="inline-flex h-10">
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
              <TabsTrigger value="workflows">Workflows</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Recent reports</CardTitle>
                <CardDescription>Collaboration reports in this workspace.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports.slice(0, 10).map((r) => (
                    <Link to={`/reports/${r.id}/collaborate`} key={r.id}>
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:border-primary transition-colors">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{r.title}</p>
                          <p className="text-xs text-muted-foreground">{r.tool_type} • {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</p>
                        </div>
                        <Badge variant="outline" className="capitalize shrink-0">{r.approval_status}</Badge>
                      </div>
                    </Link>
                  ))}
                  {reports.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No reports yet.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="documents"><WorkspaceDocumentsTab workspaceId={workspaceId!} /></TabsContent>
          <TabsContent value="projects"><WorkspaceProjectsTab workspaceId={workspaceId!} /></TabsContent>
          <TabsContent value="members"><WorkspaceMembersTab workspaceId={workspaceId!} /></TabsContent>
          <TabsContent value="templates"><WorkspaceTemplatesTab workspaceId={workspaceId!} /></TabsContent>
          <TabsContent value="guidelines"><WorkspaceGuidelinesTab workspaceId={workspaceId!} /></TabsContent>
          <TabsContent value="workflows"><WorkspaceWorkflowsTab workspaceId={workspaceId!} /></TabsContent>
          <TabsContent value="activity"><WorkspaceActivityTab workspaceId={workspaceId!} /></TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
