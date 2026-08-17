import { useEffect, useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getMyOrganizations } from '@/lib/teamApi';
import { getEnterpriseDashboardMetrics } from '@/lib/enterpriseApi';
import type { Organization } from '@/types/team';
import type { EnterpriseDashboardMetrics } from '@/types/enterprise';
import { Building2, Users, Briefcase, Activity, ShieldAlert } from 'lucide-react';

export default function EnterpriseAdminPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [metrics, setMetrics] = useState<Record<string, EnterpriseDashboardMetrics>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const orgs = await getMyOrganizations();
        setOrganizations(orgs);
        const map: Record<string, EnterpriseDashboardMetrics> = {};
        await Promise.all(
          orgs.map(async (o) => {
            try {
              map[o.id] = await getEnterpriseDashboardMetrics(o.id);
            } catch {}
          })
        );
        setMetrics(map);
      } catch (err: any) {
        toast.error('Failed to load platform overview');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalMembers = organizations.reduce((sum, o) => sum + (metrics[o.id]?.total_members || 0), 0);
  const totalWorkspaces = organizations.reduce((sum, o) => sum + (metrics[o.id]?.workspaces_count || 0), 0);
  const totalPendingInvitations = organizations.reduce((sum, o) => sum + (metrics[o.id]?.pending_invitations || 0), 0);
  const totalApiCalls = organizations.reduce((sum, o) => sum + (metrics[o.id]?.api_calls_30d || 0), 0);

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-8 md:px-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">Enterprise overview</h1>
        <p className="text-sm text-muted-foreground mb-8">Platform-level visibility into organizations, usage, and security.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard icon={Building2} label="Organizations" value={organizations.length} />
          <MetricCard icon={Users} label="Total members" value={totalMembers} />
          <MetricCard icon={Briefcase} label="Workspaces" value={totalWorkspaces} />
          <MetricCard icon={Activity} label="API calls (30d)" value={totalApiCalls} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Organizations</CardTitle>
            <CardDescription>All organizations on the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Name</th>
                    <th className="px-4 py-2 text-left font-medium">Type</th>
                    <th className="px-4 py-2 text-left font-medium">Plan</th>
                    <th className="px-4 py-2 text-left font-medium">Active members</th>
                    <th className="px-4 py-2 text-left font-medium">Workspaces</th>
                    <th className="px-4 py-2 text-left font-medium">Pending invitations</th>
                    <th className="px-4 py-2 text-left font-medium">API calls (30d)</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((o) => (
                    <tr key={o.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{o.name}</td>
                      <td className="px-4 py-3 capitalize"><Badge variant="outline">{o.type}</Badge></td>
                      <td className="px-4 py-3 capitalize"><Badge variant="outline">{o.plan}</Badge></td>
                      <td className="px-4 py-3">{metrics[o.id]?.active_users || metrics[o.id]?.total_members || 0}</td>
                      <td className="px-4 py-3">{metrics[o.id]?.workspaces_count || 0}</td>
                      <td className="px-4 py-3">{metrics[o.id]?.pending_invitations || 0}</td>
                      <td className="px-4 py-3">{metrics[o.id]?.api_calls_30d || 0}</td>
                      <td className="px-4 py-3 capitalize"><Badge variant={o.status === 'active' ? 'default' : 'secondary'}>{o.status}</Badge></td>
                    </tr>
                  ))}
                  {organizations.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">No organizations.</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Security monitoring</CardTitle>
            <CardDescription>High-level security posture and alerts.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">SSO, audit logs, and compliance monitoring will be centralized here as the platform scales.</p>
          </CardContent>
        </Card>
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
