import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { getOrganization, updateOrganization } from '@/lib/teamApi';
import { getOrganizationDashboardSummary, getOrganizationSecurityEvents, getOrganizationSecurityAlerts } from '@/lib/enterpriseApi';
import type { Organization } from '@/types/team';
import type { OrganizationDashboardSummary, SecurityEvent, SecurityAlert } from '@/types/enterprise';
import {
  Shield,
  ShieldAlert,
  Lock,
  Key,
  UserCog,
  LogIn,
  MailWarning,
  Users,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import EmptyState from './EmptyState';

export default function OrganizationSecurityTab({ organizationId }: { organizationId: string }) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [summary, setSummary] = useState<OrganizationDashboardSummary | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [ips, setIps] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [o, s, e, a] = await Promise.all([
        getOrganization(organizationId),
        getOrganizationDashboardSummary(organizationId),
        getOrganizationSecurityEvents(organizationId, { limit: 50 }),
        getOrganizationSecurityAlerts(organizationId, { limit: 50 }),
      ]);
      setOrg(o);
      setSummary(s);
      setEvents(e);
      setAlerts(a);
      setIps((o?.ip_restrictions || []).join('\n'));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [organizationId]);

  useEffect(() => {
    const channel = supabase
      .channel(`org-security-${organizationId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'security_events', filter: `organization_id=eq.${organizationId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'security_alerts', filter: `organization_id=eq.${organizationId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'organization_members', filter: `organization_id=eq.${organizationId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organizationId]);

  const save = async () => {
    if (!org) return;
    try {
      const list = ips.split('\n').map((s) => s.trim()).filter(Boolean);
      await updateOrganization(org.id, { mfa_required: org.mfa_required, ip_restrictions: list });
      toast.success('Security settings saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  if (loading || !org || !summary) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <SecurityMetric icon={Clock} label="Last login" value={summary.recent_logins[0]?.last_login_at ? formatDistanceToNow(new Date(summary.recent_logins[0].last_login_at), { addSuffix: true }) : '—'} />
        <SecurityMetric icon={LogIn} label="Failed logins (30d)" value={summary.failed_logins_30d} />
        <SecurityMetric icon={Lock} label="MFA adoption" value={`${summary.mfa_adoption.enabled}/${summary.mfa_adoption.total}`} />
        <SecurityMetric icon={ShieldAlert} label="Password resets (30d)" value={summary.password_resets_30d} />
        <SecurityMetric icon={Key} label="API key creation (30d)" value={summary.api_key_creations_30d} />
        <SecurityMetric icon={UserCog} label="Role changes (30d)" value={summary.role_changes_30d} />
        <SecurityMetric icon={AlertTriangle} label="Suspicious logins (30d)" value={summary.suspicious_logins_30d} />
        <SecurityMetric icon={MailWarning} label="Invitation abuse (30d)" value={summary.invitation_abuse_30d} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              Security Alerts
            </CardTitle>
            <CardDescription>Open and recently resolved security alerts.</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <EmptyState icon={Shield} title="No recent security issues detected" description="Your organization has no open security alerts." />
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 10).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg text-sm hover:bg-muted/30 transition-colors">
                    <SeverityIcon severity={alert.severity} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium capitalize">{alert.alert_type.replace(/_/g, ' ')}</span>
                        <Badge variant={alert.status === 'open' ? 'destructive' : 'secondary'} className="text-[10px]">{alert.status}</Badge>
                      </div>
                      <p className="text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Security score</CardTitle>
            <CardDescription>Aggregated posture based on MFA, failed logins, and open alerts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-2">
              <div className={`text-5xl font-bold ${summary.security_score >= 80 ? 'text-success' : summary.security_score >= 50 ? 'text-warning' : 'text-destructive'}`}>
                {summary.security_score}
              </div>
              <span className="text-muted-foreground text-lg ml-1">/100</span>
            </div>
            <div className="space-y-2 text-sm">
              <ScoreRow label="MFA adoption" ok={summary.mfa_adoption.total > 0 && summary.mfa_adoption.enabled === summary.mfa_adoption.total} />
              <ScoreRow label="No failed logins" ok={summary.failed_logins_30d === 0} />
              <ScoreRow label="No suspicious logins" ok={summary.suspicious_logins_30d === 0} />
              <ScoreRow label="No open alerts" ok={summary.open_security_alerts === 0} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Recent security events</CardTitle>
          <CardDescription>Detected events from the last 30 days.</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <EmptyState icon={Shield} title="No recent security events" description="Security events such as logins, role changes, and API key usage will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Event</th>
                    <th className="px-4 py-2 text-left font-medium whitespace-nowrap">User</th>
                    <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Severity</th>
                    <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Time</th>
                    <th className="px-4 py-2 text-left font-medium whitespace-nowrap">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {events.slice(0, 20).map((e) => (
                    <tr key={e.id} className="border-t">
                      <td className="px-4 py-3 whitespace-nowrap capitalize">{e.event_type.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={e.user?.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px]">{(e.user?.display_name || e.user?.full_name || e.user?.email || 'U').charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="truncate max-w-[140px]">{e.user?.display_name || e.user?.full_name || e.user?.email || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap"><Badge variant={e.severity === 'critical' || e.severity === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">{e.severity}</Badge></td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDistanceToNow(new Date(e.detected_at), { addSuffix: true })}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{e.ip_address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Authentication</CardTitle>
            <CardDescription>Require multi-factor authentication for all members.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="mfa">Require MFA</Label>
              <Switch id="mfa" checked={org.mfa_required} onCheckedChange={(v) => setOrg({ ...org, mfa_required: v })} />
            </div>
            <p className="text-sm text-muted-foreground">SSO/SAML configuration is available in the SSO tab and enforced when enabled.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">IP restrictions</CardTitle>
            <CardDescription>Limit organization access to specific IP addresses or CIDR ranges (one per line).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={ips} onChange={(e) => setIps(e.target.value)} rows={6} />
            <Button onClick={save}>Save security settings</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SecurityMetric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <Card>
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

function SeverityIcon({ severity }: { severity: string }) {
  const className = severity === 'critical' || severity === 'high' ? 'text-destructive' : 'text-warning';
  return <ShieldAlert className={`h-5 w-5 shrink-0 mt-0.5 ${className}`} />;
}

function ScoreRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <Badge variant={ok ? 'default' : 'destructive'} className="text-[10px]">{ok ? 'Pass' : 'Review'}</Badge>
    </div>
  );
}
