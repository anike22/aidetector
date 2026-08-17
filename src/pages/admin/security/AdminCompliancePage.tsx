import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Shield, FileCheck, Loader2 } from 'lucide-react';
import { getComplianceRecords, updateComplianceRecordStatus, getPrivacyRequests, updatePrivacyRequestStatus } from '@/lib/securityApi';
import type { PrivacyRequest, PrivacyRequestStatus } from '@/types/security';

export default function AdminCompliancePage() {
  const { profile } = useAuth();
  const [compliance, setCompliance] = useState<any[]>([]);
  const [privacyRequests, setPrivacyRequests] = useState<PrivacyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([getComplianceRecords(), getPrivacyRequests()]);
      setCompliance(c);
      setPrivacyRequests(p);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load compliance data.');
    } finally {
      setLoading(false);
    }
  }

  async function handleComplianceStatus(id: string, status: 'compliant' | 'non_compliant' | 'in_progress') {
    try {
      await updateComplianceRecordStatus(id, status);
      toast.success('Compliance status updated.');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update compliance.');
    }
  }

  async function handlePrivacyStatus(id: string, status: PrivacyRequestStatus) {
    try {
      await updatePrivacyRequestStatus(id, status, 'Reviewed by admin');
      toast.success('Privacy request updated.');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update request.');
    }
  }

  const total = compliance.length || 1;
  const compliant = compliance.filter((r) => r.status === 'compliant').length;
  const inProgress = compliance.filter((r) => r.status === 'in_progress').length;
  const nonCompliant = compliance.filter((r) => r.status === 'non_compliant').length;
  const pendingPrivacy = privacyRequests.filter((r) => r.status === 'pending' || r.status === 'in_review').length;

  if (profile?.role !== 'admin') {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold">Admin Access Required</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Compliance Center
          </h1>
          <p className="text-muted-foreground">Track frameworks, statuses, and privacy requests.</p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading}>Refresh</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Compliance Score</CardDescription><CardTitle className="text-3xl">{Math.round((compliant / total) * 100)}%</CardTitle></CardHeader>
          <CardContent><Progress value={(compliant / total) * 100} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Compliant</CardDescription><CardTitle className="text-3xl">{compliant}</CardTitle></CardHeader>
          <CardContent><Badge variant="default">{compliant} frameworks</Badge></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>In Progress</CardDescription><CardTitle className="text-3xl">{inProgress}</CardTitle></CardHeader>
          <CardContent><Badge variant="secondary">{inProgress} frameworks</Badge></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Non-Compliant</CardDescription><CardTitle className="text-3xl">{nonCompliant}</CardTitle></CardHeader>
          <CardContent><Badge variant="destructive">{nonCompliant} frameworks</Badge></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileCheck className="h-5 w-5" /> Compliance Frameworks</CardTitle>
            <CardDescription>Status across supported regulations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <Loader2 className="h-6 w-6 animate-spin" />}
            {compliance.length === 0 && !loading && <p className="text-sm text-muted-foreground">No compliance records.</p>}
            {compliance.map((record) => (
              <div key={record.id} className="p-3 border rounded-md flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="font-medium uppercase">{record.compliance_type}</p>
                  <p className="text-sm text-muted-foreground">Findings: {(record.findings || []).length}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={record.status === 'compliant' ? 'default' : record.status === 'non_compliant' ? 'destructive' : 'secondary'}>{record.status}</Badge>
                  <select
                    className="text-sm border rounded px-2 py-1 bg-background"
                    value={record.status}
                    onChange={(e) => handleComplianceStatus(record.id, e.target.value as any)}
                  >
                    <option value="compliant">Compliant</option>
                    <option value="in_progress">In Progress</option>
                    <option value="non_compliant">Non-Compliant</option>
                  </select>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy Requests</CardTitle>
            <CardDescription>{pendingPrivacy} pending or in review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <Loader2 className="h-6 w-6 animate-spin" />}
            {privacyRequests.length === 0 && !loading && <p className="text-sm text-muted-foreground">No privacy requests.</p>}
            {privacyRequests.map((request) => (
              <div key={request.id} className="p-3 border rounded-md flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{request.request_type.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-muted-foreground">{(request.details?.reason as string) || 'No details'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={request.status === 'fulfilled' ? 'default' : request.status === 'rejected' ? 'destructive' : 'secondary'}>{request.status}</Badge>
                  <select
                    className="text-sm border rounded px-2 py-1 bg-background"
                    value={request.status}
                    onChange={(e) => handlePrivacyStatus(request.id, e.target.value as PrivacyRequestStatus)}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_review">In Review</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
