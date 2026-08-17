import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Store, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { getMarketplaceApps, updateMarketplaceAppStatus, APP_TYPE_LABELS } from '@/lib/marketplaceApi';
import type { MarketplaceApp, MarketplaceAppStatus } from '@/types/marketplace';

export default function AdminMarketplacePage() {
  const { profile } = useAuth();
  const [apps, setApps] = useState<MarketplaceApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApps();
  }, []);

  async function loadApps() {
    setLoading(true);
    try {
      const data = await getMarketplaceApps({});
      setApps(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load apps.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatus(id: string, status: MarketplaceAppStatus) {
    try {
      await updateMarketplaceAppStatus(id, status);
      toast.success(`App ${status}.`);
      await loadApps();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update app.');
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
    <div className="container max-w-6xl py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Store className="h-8 w-8" />
            Marketplace Management
          </h1>
          <p className="text-muted-foreground">Review, approve, and suspend marketplace listings.</p>
        </div>
        <Button variant="outline" onClick={loadApps} disabled={loading}>Refresh</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications & Resources</CardTitle>
          <CardDescription>{apps.filter((a) => a.status === 'pending_review').length} pending review</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <Loader2 className="h-6 w-6 animate-spin" />}
          {apps.length === 0 && !loading && <p className="text-sm text-muted-foreground">No listings found.</p>}
          {apps.map((app) => (
            <div key={app.id} className="p-4 border rounded-md flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{app.name}</p>
                  <Badge variant={app.status === 'approved' ? 'default' : app.status === 'pending_review' ? 'secondary' : 'destructive'}>{app.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{APP_TYPE_LABELS[app.app_type]} • {app.pricing}{app.price ? ` • $${app.price}` : ''}</p>
                <p className="text-sm">{app.description}</p>
                <p className="text-xs text-muted-foreground">Publisher: {app.publisher?.email || app.publisher_id}</p>
              </div>
              <div className="flex gap-2">
                {app.status !== 'approved' && <Button size="sm" onClick={() => handleStatus(app.id, 'approved')}><CheckCircle2 className="h-4 w-4 mr-1" />Approve</Button>}
                {app.status !== 'suspended' && <Button size="sm" variant="outline" onClick={() => handleStatus(app.id, 'suspended')}><XCircle className="h-4 w-4 mr-1" />Suspend</Button>}
                {app.status !== 'rejected' && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleStatus(app.id, 'rejected')}>Reject</Button>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
