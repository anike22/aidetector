import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Handshake, Loader2 } from 'lucide-react';
import { getPartnerApplications, updatePartnerApplicationStatus } from '@/lib/marketplaceApi';
import type { PartnerApplication, PartnerApplicationStatus } from '@/types/marketplace';

const statusOptions: PartnerApplicationStatus[] = ['pending', 'approved', 'rejected'];

export default function AdminPartnerApplicationsPage() {
  const { profile } = useAuth();
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    setLoading(true);
    try {
      const data = await getPartnerApplications();
      setApplications(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatus(id: string, status: PartnerApplicationStatus) {
    try {
      await updatePartnerApplicationStatus(id, status, notes[id] || '');
      toast.success(`Application ${status}.`);
      await loadApplications();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update application.');
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
            <Handshake className="h-8 w-8" />
            Partner Applications
          </h1>
          <p className="text-muted-foreground">Review and approve partner program requests.</p>
        </div>
        <Button variant="outline" onClick={loadApplications} disabled={loading}>Refresh</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>{applications.filter((a) => a.status === 'pending').length} pending</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && <Loader2 className="h-6 w-6 animate-spin" />}
          {applications.length === 0 && !loading && <p className="text-sm text-muted-foreground">No applications found.</p>}
          {applications.map((app) => (
            <div key={app.id} className="p-4 border rounded-md space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{app.organization_name}</p>
                  <p className="text-sm text-muted-foreground">{app.application_type}</p>
                  <p className="text-xs text-muted-foreground">{app.website}</p>
                </div>
                <Badge variant={app.status === 'approved' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'}>{app.status}</Badge>
              </div>
              <p className="text-sm">{app.description}</p>
              <Textarea
                className="min-h-[60px]"
                placeholder="Admin notes"
                value={notes[app.id] || ''}
                onChange={(e) => setNotes({ ...notes, [app.id]: e.target.value })}
              />
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <Button key={status} size="sm" variant={app.status === status ? 'default' : 'outline'} onClick={() => handleStatus(app.id, status)}>
                    {status}
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
