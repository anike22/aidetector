import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/db/supabase';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { formatBytes } from '@/lib/utils';
import type { OrganizationDashboardSummary } from '@/types/enterprise';
import {
  Users,
  Mail,
  UsersRound,
  Building2,
  FolderOpen,
  Zap,
  HardDrive,
  CreditCard,
  Shield,
  Activity,
  Clock,
  ShieldAlert,
  Key,
  ScrollText,
  Settings,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

interface OrganizationOverviewTabProps {
  organizationId: string;
  summary: OrganizationDashboardSummary | null;
  onRefresh?: () => void;
}

export default function OrganizationOverviewTab({ organizationId, summary, onRefresh }: OrganizationOverviewTabProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const tables = [
      'organization_members',
      'organization_invitations',
      'activity_feeds',
      'security_events',
      'security_alerts',
      'teams',
      'departments',
      'workspaces',
      'api_keys',
      'organization_billing',
    ];
    const channel = supabase.channel(`org-overview-all-${organizationId}`);
    tables.forEach((table) => {
      const filter = table === 'api_keys' || table === 'activity_feeds' ? undefined : `organization_id=eq.${organizationId}`;
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter },
        () => onRefresh?.()
      );
    });
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organizationId, onRefresh]);

  if (!summary) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const go = (tab: string) => navigate(`/organizations/${organizationId}?tab=${tab}`);

  const seatUsagePct = summary.seats_total > 0 ? Math.round((summary.seats_used / summary.seats_total) * 100) : 0;
  const apiUsagePct = summary.api_quota > 0 ? Math.round((summary.api_used / summary.api_quota) * 100) : 0;
  const storageUsagePct = summary.storage_quota > 0 ? Math.round((summary.storage_bytes / summary.storage_quota) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard icon={Users} label="Active Members" value={summary.total_members} />
        <KpiCard icon={Mail} label="Pending Invitations" value={summary.pending_invitations} />
        <KpiCard icon={UsersRound} label="Teams" value={summary.teams_count} />
        <KpiCard icon={Building2} label="Departments" value={summary.departments_count} />
        <KpiCard icon={FolderOpen} label="Workspaces" value={summary.workspaces_count} />
        <KpiCard icon={Zap} label="API Calls (30d)" value={summary.api_calls_30d} />
        <KpiCard icon={HardDrive} label="Storage Used" value={formatBytes(summary.storage_bytes)} />
        <KpiCard icon={CreditCard} label="Subscription Plan" value={summary.billing?.plan || summary.organization.plan} />
        <KpiCard icon={Users} label="Seats Used" value={`${summary.seats_used}/${summary.seats_total}`} />
        <KpiCard icon={Shield} label="Security Score" value={`${summary.security_score}/100`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">Quick actions</CardTitle>
            <CardDescription>Common executive tasks for your organization.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <QuickActionButton label="Invite member" icon={Users} onClick={() => go('members')} />
              <QuickActionButton label="Create workspace" icon={FolderOpen} onClick={() => go('workspaces')} />
              <QuickActionButton label="Create department" icon={Building2} onClick={() => go('departments')} />
              <QuickActionButton label="Create team" icon={UsersRound} onClick={() => go('teams')} />
              <QuickActionButton label="Assign roles" icon={Settings} onClick={() => go('members')} />
              <QuickActionButton label="Manage billing" icon={CreditCard} onClick={() => go('billing')} />
              <QuickActionButton label="View audit logs" icon={ScrollText} onClick={() => go('audit')} />
              <QuickActionButton label="Generate API key" icon={Key} onClick={() => go('api')} />
            </div>
          </CardContent>
        </Card>

        <SubscriptionCard summary={summary} seatUsagePct={seatUsagePct} apiUsagePct={apiUsagePct} storageUsagePct={storageUsagePct} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart title="Member growth" data={summary.charts.member_growth} xKey="date" yKey="members" color="var(--chart-1)" />
        <TrendChart title="API usage trend" data={summary.charts.api_usage} xKey="date" yKey="calls" color="var(--chart-2)" />
        <TrendChart title="Workspace growth" data={summary.charts.workspace_growth} xKey="date" yKey="workspaces" color="var(--chart-3)" />
        <AreaTrendChart title="Storage growth" data={summary.charts.storage_growth} xKey="date" yKey="bytes" />
        <TrendChart title="Login activity" data={summary.charts.login_activity} xKey="date" yKey="logins" color="var(--chart-4)" />
        <DualBarChart title="Invitations" data={summary.charts.invitations} xKey="date" y1Key="sent" y2Key="accepted" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RecentListCard title="Recent Logins" icon={Clock} empty="No recent logins.">
          {summary.recent_logins.slice(0, 5).map((login, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
              <div className="min-w-0">
                <p className="font-medium truncate">{login.display_name || login.email}</p>
                <p className="text-xs text-muted-foreground truncate">{login.email}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {login.last_login_at ? formatDistanceToNow(new Date(login.last_login_at), { addSuffix: true }) : 'Never'}
              </span>
            </div>
          ))}
        </RecentListCard>

        <RecentListCard title="Security Events" icon={ShieldAlert} empty="No security events.">
          {summary.recent_security_events.slice(0, 5).map((event, idx) => (
            <div key={idx} className="flex items-start gap-3 text-sm py-2 border-b last:border-0">
              <ShieldAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium truncate">{event.event_type.replace(/_/g, ' ')}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(event.detected_at), { addSuffix: true })} • {event.severity}
                </p>
              </div>
            </div>
          ))}
        </RecentListCard>

        <RecentListCard title="Recent Activity" icon={Activity} empty="No recent activity.">
          {summary.recent_activity.slice(0, 5).map((event, idx) => (
            <div key={idx} className="flex items-start gap-3 text-sm py-2 border-b last:border-0">
              <Avatar className="h-6 w-6">
                <AvatarImage src={(event.metadata?.avatar_url as string | undefined) || undefined} />
                <AvatarFallback className="text-[10px]">{(event.display_name || event.email || 'S').charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate">
                  <span className="font-medium">{event.display_name || event.email || 'System'}</span>{' '}
                  <span className="text-muted-foreground">{event.action.replace(/_/g, ' ')}</span>
                  {event.resource_type && <span className="text-muted-foreground"> {event.resource_type.replace(/_/g, ' ')}</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {event.created_at ? formatDistanceToNow(new Date(event.created_at), { addSuffix: true }) : ''}
                </p>
              </div>
            </div>
          ))}
        </RecentListCard>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-xl font-semibold truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionButton({ label, icon: Icon, onClick }: { label: string; icon: React.ElementType; onClick: () => void }) {
  return (
    <Button variant="outline" className="justify-start h-11" onClick={onClick}>
      <Icon className="h-4 w-4 mr-2 shrink-0" />
      {label}
    </Button>
  );
}

function SubscriptionCard({
  summary,
  seatUsagePct,
  apiUsagePct,
  storageUsagePct,
}: {
  summary: OrganizationDashboardSummary;
  seatUsagePct: number;
  apiUsagePct: number;
  storageUsagePct: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          Subscription
        </CardTitle>
        <CardDescription>Current plan and resource usage.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Current plan</span>
          <Badge className="capitalize">{summary.billing?.plan || summary.organization.plan}</Badge>
        </div>
        <UsageRow label="Seats" used={summary.seats_used} total={summary.seats_total} pct={seatUsagePct} />
        <UsageRow label="API calls" used={summary.api_used} total={summary.api_quota} pct={apiUsagePct} />
        <UsageRow label="Storage" used={formatBytes(summary.storage_bytes)} total={formatBytes(summary.storage_quota)} pct={storageUsagePct} rawUsed={summary.storage_bytes} rawTotal={summary.storage_quota} />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Renewal date</span>
          <span>{summary.billing?.next_billing_date ? format(parseISO(summary.billing.next_billing_date), 'MMM d, yyyy') : '—'}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function UsageRow({
  label,
  used,
  total,
  pct,
  rawUsed,
  rawTotal,
}: {
  label: string;
  used: string | number;
  total: string | number;
  pct: number;
  rawUsed?: number;
  rawTotal?: number;
}) {
  const warning = rawTotal !== undefined && rawTotal > 0 && (rawUsed || 0) / rawTotal > 0.8;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{used} / {total}</span>
      </div>
      <Progress value={pct} className={warning ? 'text-warning' : ''} />
      {warning && <p className="text-xs text-warning font-medium">Approaching limit</p>}
    </div>
  );
}

function RecentListCard({
  title,
  icon: Icon,
  empty,
  children,
}: {
  title: string;
  icon: React.ElementType;
  empty: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.some((c) => c);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasItems ? <div className="space-y-1">{children}</div> : <p className="text-sm text-muted-foreground text-center py-6">{empty}</p>}
      </CardContent>
    </Card>
  );
}

function TrendChart({ title, data, xKey, yKey, color }: { title: string; data: any[]; xKey: string; yKey: string; color: string }) {
  const chartData = data.map((d) => ({ ...d, label: format(parseISO(d[xKey]), 'MMM d') }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8 }} />
              <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function AreaTrendChart({ title, data, xKey, yKey }: { title: string; data: any[]; xKey: string; yKey: string }) {
  const chartData = data.map((d) => ({ ...d, label: format(parseISO(d[xKey]), 'MMM d') }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-5)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-5)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatBytes(v, 0)} />
              <Tooltip contentStyle={{ borderRadius: 8 }} formatter={(v: number) => formatBytes(v)} />
              <Area type="monotone" dataKey={yKey} stroke="var(--chart-5)" fillOpacity={1} fill="url(#colorStorage)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function DualBarChart({ title, data, xKey, y1Key, y2Key }: { title: string; data: any[]; xKey: string; y1Key: string; y2Key: string }) {
  const chartData = data.map((d) => ({ ...d, label: format(parseISO(d[xKey]), 'MMM d') }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8 }} />
              <Legend wrapperStyle={{ paddingTop: 8 }} />
              <Bar dataKey={y1Key} fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey={y2Key} fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
