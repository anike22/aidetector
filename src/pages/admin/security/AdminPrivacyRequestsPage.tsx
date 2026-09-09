import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { UserX, Loader2 } from 'lucide-react';
import type { PrivacyRequest, PrivacyRequestStatus } from '@/types/security';
import { getPrivacyRequests, updatePrivacyRequestStatus } from '@/lib/securityApi';

const statusOptions: PrivacyRequestStatus[] = ['pending', 'in_review', 'fulfilled', 'rejected'];

export default function AdminPrivacyRequestsPage() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const data = await getPrivacyRequests();
      setRequests(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load privacy requests.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(id: string, status: PrivacyRequestStatus) {
    try {
      await updatePrivacyRequestStatus(id, status, adminNotes[id] || '');
      toast.success('Request updated.');
      await loadRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update request.');
    }
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold">Admin Access Required</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UserX className="h-8 w-8" />
            Privacy Requests
          </h1>
          <p className="text-muted-foreground">Review and fulfill GDPR/CCPA/data subject requests.</p>
        </div>
        <Button variant="outline" onClick={loadRequests} disabled={loading}>Refresh</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Privacy Requests</CardTitle>
          <CardDescription>{requests.filter((r) => r.status === 'pending' || r.status === 'in_review').length} require action</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && <Loader2 className="h-6 w-6 animate-spin" />}
          {requests.length === 0 && !loading && <p className="text-sm text-muted-foreground">No requests found.</p>}
          {requests.map((request) => (
            <div key={request.id} className="p-4 border rounded-md space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{request.request_type.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-muted-foreground">Requested {formatDistanceToNow(new Date(request.requested_at))} ago</p>
                </div>
                <Badge variant={request.status === 'fulfilled' ? 'default' : request.status === 'rejected' ? 'destructive' : 'secondary'}>{request.status}</Badge>
              </div>
              <p className="text-sm">{(request.details?.reason as string) || 'No additional details'}</p>
              <Textarea
                className="min-h-[60px]"
                placeholder="Admin notes"
                value={adminNotes[request.id] || ''}
                onChange={(e) => setAdminNotes({ ...adminNotes, [request.id]: e.target.value })}
              />
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <Button key={status} size="sm" variant={request.status === status ? 'default' : 'outline'} onClick={() => handleUpdate(request.id, status)}>
                    {status.replace(/_/g, ' ')}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
