import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Shield,
  Activity,
  AlertTriangle,
  FileText,
  Lock,
  Server,
  Globe,
  HardDrive,
  Loader2,
} from 'lucide-react';
import type { SecurityEvent, SecurityAlert, Incident, BackupJob, ThreatIntelligence } from '@/types/security';
import {
  getSecurityEvents,
  getSecurityAlerts,
  getIncidents,
  getBackupJobs,
  getThreatIntelligence,
  getAuditLogs,
  resolveSecurityAlert,
} from '@/lib/securityApi';

export default function AdminSecurityCenterPage() {
  const { user, profile, loading: authLoading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [backups, setBackups] = useState<BackupJob[]>([]);
  const [threats, setThreats] = useState<ThreatIntelligence[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  async function loadData() {
    setLoading(true);
    try {
      const [e, a, i, b, t, logs] = await Promise.all([
        getSecurityEvents(),
        getSecurityAlerts(),
        getIncidents(),
        getBackupJobs(),
        getThreatIntelligence(),
        getAuditLogs(50),
      ]);
      setEvents(e);
      setAlerts(a);
      setIncidents(i);
      setBackups(b);
      setThreats(t);
      setAuditLogs(logs);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load security center data.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResolveAlert(id: string) {
    try {
      await resolveSecurityAlert(id);
      toast.success('Alert resolved.');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve alert.');
    }
  }

  const openAlerts = alerts.filter((a) => a.status === 'open');
  const openIncidents = incidents.filter((i) => i.status !== 'resolved' && i.status !== 'closed');
  const criticalEvents = events.filter((e) => e.severity === 'critical');

  if (authLoading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold">Admin Access Required</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Security Operations Center
          </h1>
          <p className="text-muted-foreground">Real-time monitoring, risk scoring, and incident response.</p>
        </div>
        <Button variant="outline" onClick={loadData}>Refresh</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="overview"><Activity className="h-4 w-4 mr-2" />Overview</TabsTrigger>
          <TabsTrigger value="events"><Server className="h-4 w-4 mr-2" />Events</TabsTrigger>
          <TabsTrigger value="alerts"><AlertTriangle className="h-4 w-4 mr-2" />Alerts</TabsTrigger>
          <TabsTrigger value="incidents"><Shield className="h-4 w-4 mr-2" />Incidents</TabsTrigger>
          <TabsTrigger value="threats"><Globe className="h-4 w-4 mr-2" />Threat Intel</TabsTrigger>
          <TabsTrigger value="audit"><FileText className="h-4 w-4 mr-2" />Audit Logs</TabsTrigger>
          <TabsTrigger value="backups"><HardDrive className="h-4 w-4 mr-2" />Backups</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardDescription>Open Alerts</CardDescription><CardTitle className="text-3xl">{openAlerts.length}</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{criticalEvents.length} critical events</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Open Incidents</CardDescription><CardTitle className="text-3xl">{openIncidents.length}</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{incidents.filter((i) => i.severity === 'critical').length} critical</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Total Events</CardDescription><CardTitle className="text-3xl">{events.length}</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">Last 24h tracked</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Threat Indicators</CardDescription><CardTitle className="text-3xl">{threats.length}</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">Active indicators</p></CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Latest Alerts</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="p-3 border rounded-md flex items-start justify-between gap-3">
                    <div>
                      <Badge variant={alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : 'secondary'}>{alert.severity}</Badge>
                      <p className="font-medium mt-1">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(alert.created_at))} ago</p>
                    </div>
                    {alert.status === 'open' && <Button size="sm" variant="outline" onClick={() => handleResolveAlert(alert.id)}>Resolve</Button>}
                  </div>
                ))}
                {alerts.length === 0 && <p className="text-sm text-muted-foreground">No alerts.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Recent Events</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div>
                      <p className="font-medium">{event.event_type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">{event.ip_address || 'No IP'}</p>
                    </div>
                    <Badge variant={event.severity === 'critical' ? 'destructive' : 'secondary'}>{event.severity}</Badge>
                  </div>
                ))}
                {events.length === 0 && <p className="text-sm text-muted-foreground">No events.</p>}
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild><Link to="/admin/incidents">Manage Incidents</Link></Button>
            <Button asChild variant="outline"><Link to="/admin/compliance">Compliance Dashboard</Link></Button>
            <Button asChild variant="outline"><Link to="/admin/privacy-requests">Privacy Requests</Link></Button>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Security Events</CardTitle><CardDescription>Authentication, access, and system events</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {events.length === 0 && <p className="text-sm text-muted-foreground">No events recorded.</p>}
              {events.slice(0, 50).map((event) => (
                <div key={event.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 border rounded-md gap-2">
                  <div>
                    <p className="font-medium">{event.event_type.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-muted-foreground">{event.ip_address || 'No IP'} • {event.user_agent?.slice(0, 40) || 'No agent'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={event.severity === 'critical' ? 'destructive' : 'secondary'}>{event.severity}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(event.detected_at))} ago</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Security Alerts</CardTitle><CardDescription>Suspicious activity requiring review</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {alerts.length === 0 && <p className="text-sm text-muted-foreground">No alerts.</p>}
              {alerts.map((alert) => (
                <div key={alert.id} className="p-3 border rounded-md flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : alert.severity === 'high' ? 'secondary' : 'outline'}>{alert.severity}</Badge>
                    <p className="font-medium mt-1">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(alert.created_at))} ago • {alert.status}</p>
                  </div>
                  {alert.status === 'open' && <Button size="sm" variant="outline" onClick={() => handleResolveAlert(alert.id)}>Resolve</Button>}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Incidents</CardTitle><CardDescription>Security investigations and response</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {incidents.length === 0 && <p className="text-sm text-muted-foreground">No incidents.</p>}
              {incidents.map((incident) => (
                <div key={incident.id} className="p-3 border rounded-md">
                  <div className="flex items-center gap-2">
                    <Badge variant={incident.severity === 'critical' ? 'destructive' : 'secondary'}>{incident.severity}</Badge>
                    <span className="text-xs text-muted-foreground uppercase">{incident.status}</span>
                  </div>
                  <p className="font-medium mt-1">{incident.title}</p>
                  <p className="text-sm text-muted-foreground">{incident.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Owner: {incident.owner?.full_name || incident.owner?.email || 'Unassigned'}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Threat Intelligence</CardTitle><CardDescription>Monitored indicators and abuse patterns</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {threats.length === 0 && <p className="text-sm text-muted-foreground">No threat indicators recorded.</p>}
              {threats.map((threat) => (
                <div key={threat.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{threat.threat_type} <span className="text-muted-foreground font-normal">– {threat.indicator}</span></p>
                    <p className="text-sm text-muted-foreground">{threat.description || 'No description'}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={threat.risk_level === 'critical' ? 'destructive' : 'secondary'}>{threat.risk_level}</Badge>
                    <p className="text-xs text-muted-foreground">Count: {threat.count}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Audit Logs</CardTitle><CardDescription>Administrative and system activity</CardDescription></CardHeader>
            <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
              {auditLogs.length === 0 && <p className="text-sm text-muted-foreground">No audit logs.</p>}
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 border rounded-md flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{log.action}</p>
                    <p className="text-sm text-muted-foreground">{log.resource_type || 'system'} • {log.ip_address || 'No IP'}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(log.created_at))} ago</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Backup Jobs</CardTitle><CardDescription>Disaster recovery and backup verification</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {backups.length === 0 && <p className="text-sm text-muted-foreground">No backup jobs recorded.</p>}
              {backups.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{job.job_type}</p>
                    <p className="text-sm text-muted-foreground">Started {formatDistanceToNow(new Date(job.started_at))} ago</p>
                  </div>
                  <Badge variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}>{job.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
