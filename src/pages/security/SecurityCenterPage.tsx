import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  Shield,
  Smartphone,
  History,
  Bell,
  Lock,
  Download,
  Trash2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import type { UserSession, LoginHistoryEntry, SecurityAlert } from '@/types/security';
import {
  getUserSessions,
  getLoginHistory,
  getSecurityAlerts,
  terminateSession,
  terminateAllSessionsExceptCurrent,
  createPrivacyRequest,
  getSecurityProfile,
  updateSecurityPreferences,
} from '@/lib/securityApi';

export default function SecurityCenterPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [history, setHistory] = useState<LoginHistoryEntry[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [securityProfile, setSecurityProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [s, h, a, sp] = await Promise.all([
        getUserSessions(),
        getLoginHistory(20),
        getSecurityAlerts(),
        getSecurityProfile(user!.id),
      ]);
      setSessions(s);
      setHistory(h);
      setAlerts(a);
      setSecurityProfile(sp);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load security data.');
    } finally {
      setLoading(false);
    }
  }

  async function handleTerminateSession(id: string) {
    setProcessing(true);
    try {
      await terminateSession(id);
      toast.success('Session terminated.');
      setSessions(sessions.filter((s) => s.id !== id));
    } catch (err: any) {
      toast.error(err.message || 'Failed to terminate session.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleTerminateAll() {
    const current = sessions.find((s) => s.is_active);
    setProcessing(true);
    try {
      await terminateAllSessionsExceptCurrent(current?.id);
      toast.success('All other sessions terminated.');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to terminate sessions.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleRequestExport() {
    setProcessing(true);
    try {
      await createPrivacyRequest('access', { reason: 'User data export request' });
      toast.success('Data export request submitted.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to request export.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleRequestDeletion() {
    setProcessing(true);
    try {
      await createPrivacyRequest('deletion', { reason: 'Account deletion request' });
      toast.success('Deletion request submitted.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to request deletion.');
    } finally {
      setProcessing(false);
    }
  }

  async function toggleMfa() {
    if (!user) return;
    setProcessing(true);
    try {
      const next = !securityProfile?.mfa_enabled;
      await updateSecurityPreferences(user.id, { mfa_enabled: next });
      toast.success(next ? 'MFA enabled.' : 'MFA disabled.');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update MFA.');
    } finally {
      setProcessing(false);
    }
  }

  const currentSession = sessions.find((s) => s.is_active);
  const riskLevel = securityProfile?.risk_score >= 80 ? 'critical' : securityProfile?.risk_score >= 50 ? 'high' : securityProfile?.risk_score >= 20 ? 'medium' : 'low';

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-6xl py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Security Center</h1>
            <p className="text-muted-foreground">Manage your account security, sessions, and privacy.</p>
          </div>
          <Button variant="outline" onClick={loadData} disabled={processing}>
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="overview"><Shield className="h-4 w-4 mr-2" />Overview</TabsTrigger>
            <TabsTrigger value="sessions"><Smartphone className="h-4 w-4 mr-2" />Sessions</TabsTrigger>
            <TabsTrigger value="history"><History className="h-4 w-4 mr-2" />Login History</TabsTrigger>
            <TabsTrigger value="alerts"><Bell className="h-4 w-4 mr-2" />Alerts</TabsTrigger>
            <TabsTrigger value="privacy"><Lock className="h-4 w-4 mr-2" />Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Risk Score</CardDescription>
                  <CardTitle className="text-3xl">{securityProfile?.risk_score ?? 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={riskLevel === 'low' ? 'default' : riskLevel === 'medium' ? 'secondary' : 'destructive'}>
                    {riskLevel}
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Active Sessions</CardDescription>
                  <CardTitle className="text-3xl">{sessions.length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{sessions.filter((s) => s.is_trusted).length} trusted</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Open Alerts</CardDescription>
                  <CardTitle className="text-3xl">{alerts.filter((a) => a.status === 'open').length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{alerts.filter((a) => a.severity === 'critical').length} critical</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Security Recommendations</CardTitle>
                <CardDescription>Actions to improve your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Multi-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">Add an extra layer of protection.</p>
                    </div>
                  </div>
                  <Button onClick={toggleMfa} disabled={processing}>
                    {securityProfile?.mfa_enabled ? 'Disable MFA' : 'Enable MFA'}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Review Trusted Devices</p>
                      <p className="text-sm text-muted-foreground">Remove devices you no longer use.</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setActiveTab('sessions')}>Review</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>Manage devices signed in to your account</CardDescription>
                </div>
                <Button variant="destructive" size="sm" onClick={handleTerminateAll} disabled={processing}>
                  Sign out all others
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {sessions.length === 0 && <p className="text-sm text-muted-foreground">No active sessions found.</p>}
                {sessions.map((session) => (
                  <div key={session.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 border rounded-md gap-3">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {session.is_active && <Badge variant="default">Current</Badge>}
                        {session.user_agent?.split(' ')[0] || 'Unknown device'}
                      </p>
                      <p className="text-sm text-muted-foreground">{session.location || session.ip_address || 'Unknown location'}</p>
                      <p className="text-xs text-muted-foreground">Last active {formatDistanceToNow(new Date(session.last_active_at))} ago</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={session.id === currentSession?.id || processing}
                      onClick={() => handleTerminateSession(session.id)}
                    >
                      Terminate
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Login History</CardTitle>
                <CardDescription>Recent sign-in attempts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {history.length === 0 && <p className="text-sm text-muted-foreground">No login history found.</p>}
                {history.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      {entry.success ? <Shield className="h-5 w-5 text-green-500" /> : <AlertTriangle className="h-5 w-5 text-red-500" />}
                      <div>
                        <p className="font-medium">{entry.success ? 'Successful login' : `Failed: ${entry.failure_reason || 'Unknown'}`}</p>
                        <p className="text-sm text-muted-foreground">{entry.location || entry.ip_address || 'Unknown location'}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(entry.created_at))} ago</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Alerts</CardTitle>
                <CardDescription>Notifications about your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {alerts.length === 0 && <p className="text-sm text-muted-foreground">No alerts.</p>}
                {alerts.map((alert) => (
                  <div key={alert.id} className="p-3 border rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : 'secondary'}>{alert.severity}</Badge>
                      <span className="text-xs text-muted-foreground uppercase">{alert.status}</span>
                    </div>
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(alert.created_at))} ago</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Controls</CardTitle>
                <CardDescription>Manage your data and consent preferences</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-md space-y-2">
                  <Download className="h-6 w-6" />
                  <h3 className="font-semibold">Export Your Data</h3>
                  <p className="text-sm text-muted-foreground">Request a copy of your personal data.</p>
                  <Button onClick={handleRequestExport} disabled={processing}>Request Export</Button>
                </div>
                <div className="p-4 border rounded-md space-y-2">
                  <Trash2 className="h-6 w-6" />
                  <h3 className="font-semibold">Delete Your Data</h3>
                  <p className="text-sm text-muted-foreground">Submit a request to delete your account data.</p>
                  <Button variant="destructive" onClick={handleRequestDeletion} disabled={processing}>Request Deletion</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
