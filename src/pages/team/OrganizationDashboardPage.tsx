import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { useTeam } from '@/contexts/TeamContext';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getOrganization } from '@/lib/teamApi';
import { getOrganizationDashboardSummary } from '@/lib/enterpriseApi';
import type { OrganizationDashboardSummary } from '@/types/enterprise';
import {
  LayoutDashboard,
  Users,
  Mail,
  Activity,
  FolderOpen,
  Building2,
  UsersRound,
  UserCog,
  CreditCard,
  Key,
  Shield,
  FileCheck,
  ScrollText,
  Fingerprint,
  Puzzle,
  Search,
  Settings,
} from 'lucide-react';
import OrganizationHeader from '@/components/team/OrganizationHeader';
import OrganizationSettingsTab from '@/components/team/OrganizationSettingsTab';
import OrganizationMembersTab from '@/components/team/OrganizationMembersTabV2';
import OrganizationWorkspacesTab from '@/components/team/OrganizationWorkspacesTab';
import OrganizationBillingTab from '@/components/team/OrganizationBillingTabV2';
import OrganizationApiTab from '@/components/team/OrganizationApiTabV2';
import OrganizationComplianceTab from '@/components/team/OrganizationComplianceTab';
import OrganizationAuditTab from '@/components/team/OrganizationAuditTab';
import OrganizationSsoTab from '@/components/team/OrganizationSsoTab';
import OrganizationDepartmentsTab from '@/components/team/OrganizationDepartmentsTab';
import OrganizationTeamsTab from '@/components/team/OrganizationTeamsTab';
import OrganizationRolesTab from '@/components/team/OrganizationRolesTab';
import OrganizationSecurityTab from '@/components/team/OrganizationSecurityTab';
import OrganizationIntegrationsTab from '@/components/team/OrganizationIntegrationsTab';
import OrganizationSearchTab from '@/components/team/OrganizationSearchTab';
import OrganizationOverviewTab from '@/components/team/OrganizationOverviewTab';
import OrganizationInvitationsTab from '@/components/team/OrganizationInvitationsTab';
import OrganizationActivityTab from '@/components/team/OrganizationActivityTab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: null },
  { id: 'members', label: 'Members', icon: Users, badge: 'total_members' as const },
  { id: 'invitations', label: 'Invitations', icon: Mail, badge: 'pending_invitations' as const },
  { id: 'activity', label: 'Activity', icon: Activity, badge: null },
  { id: 'workspaces', label: 'Workspaces', icon: FolderOpen, badge: 'workspaces_count' as const },
  { id: 'departments', label: 'Departments', icon: Building2, badge: 'departments_count' as const },
  { id: 'teams', label: 'Teams', icon: UsersRound, badge: 'teams_count' as const },
  { id: 'roles', label: 'Roles', icon: UserCog, badge: null },
  { id: 'billing', label: 'Billing', icon: CreditCard, badge: null },
  { id: 'api', label: 'API', icon: Key, badge: null },
  { id: 'security', label: 'Security', icon: Shield, badge: 'open_security_alerts' as const },
  { id: 'compliance', label: 'Compliance', icon: FileCheck, badge: null },
  { id: 'audit', label: 'Audit logs', icon: ScrollText, badge: null },
  { id: 'sso', label: 'SSO', icon: Fingerprint, badge: null },
  { id: 'integrations', label: 'Integrations', icon: Puzzle, badge: null },
  { id: 'search', label: 'Search', icon: Search, badge: null },
  { id: 'settings', label: 'Settings', icon: Settings, badge: null },
];

export default function OrganizationDashboardPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const { setCurrentOrganization } = useTeam();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<OrganizationDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const tabParam = searchParams.get('tab');
  const activeTab = TABS.some((t) => t.id === tabParam) ? tabParam! : 'overview';

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [org, data] = await Promise.all([getOrganization(orgId), getOrganizationDashboardSummary(orgId)]);
      if (org) setCurrentOrganization(org);
      setSummary(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [orgId]);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 md:px-6">
        <OrganizationHeader organizationId={orgId!} summary={summary} loading={loading} />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-4 px-4 py-2">
            <div className="overflow-x-auto whitespace-nowrap pb-1">
              <TabsList className="inline-flex h-10">
                {TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="inline-flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.badge && summary && (summary as any)[tab.badge] > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                        {(summary as any)[tab.badge]}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>
          <TabsContent value="overview"><OrganizationOverviewTab organizationId={orgId!} summary={summary} onRefresh={load} /></TabsContent>
          <TabsContent value="members"><OrganizationMembersTab organizationId={orgId!} /></TabsContent>
          <TabsContent value="invitations"><OrganizationInvitationsTab organizationId={orgId!} /></TabsContent>
          <TabsContent value="activity"><OrganizationActivityTab organizationId={orgId!} /></TabsContent>
          <TabsContent value="workspaces"><OrganizationWorkspacesTab organizationId={orgId!} /></TabsContent>
          <TabsContent value="departments"><OrganizationDepartmentsTab organizationId={orgId!} /></TabsContent>
          <TabsContent value="teams"><OrganizationTeamsTab organizationId={orgId!} /></TabsContent>
          <TabsContent value="roles"><OrganizationRolesTab /></TabsContent>
          <TabsContent value="billing"><OrganizationBillingTab organizationId={orgId!} /></TabsContent>
          <TabsContent value="api"><OrganizationApiTab organizationId={orgId!} /></TabsContent>
          <TabsContent value="security"><OrganizationSecurityTab organizationId={orgId!} /></TabsContent>
          <TabsContent value="compliance"><OrganizationComplianceTab organizationId={orgId!} /></TabsContent>
          <TabsContent value="audit"><OrganizationAuditTab organizationId={orgId!} /></TabsContent>
          <TabsContent value="sso"><OrganizationSsoTab organizationId={orgId!} /></TabsContent>
          <TabsContent value="integrations"><OrganizationIntegrationsTab organizationId={orgId!} /></TabsContent>
          <TabsContent value="search"><OrganizationSearchTab organizationId={orgId!} /></TabsContent>
          <TabsContent value="settings"><OrganizationSettingsTab organizationId={orgId!} /></TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
