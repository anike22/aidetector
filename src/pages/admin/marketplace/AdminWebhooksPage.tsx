import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Webhook, Loader2, RefreshCw } from 'lucide-react';
import { getWebhookEndpoints, getWebhookDeliveries, retryWebhookDelivery, WEBHOOK_EVENT_LABELS } from '@/lib/marketplaceApi';
import type { WebhookEndpoint, WebhookDelivery } from '@/types/marketplace';

export default function AdminWebhooksPage() {
  const { profile } = useAuth();
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [e, d] = await Promise.all([getWebhookEndpoints(), getWebhookDeliveries()]);
      setEndpoints(e);
      setDeliveries(d);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load webhooks.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRetry(id: string) {
    try {
      await retryWebhookDelivery(id);
      toast.success('Delivery retried.');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to retry delivery.');
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
            <Webhook className="h-8 w-8" />
            Webhook Administration
          </h1>
          <p className="text-muted-foreground">Monitor endpoints, deliveries, and retry failed events.</p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading}>Refresh</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Endpoints</CardTitle><CardDescription>{endpoints.length} configured</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {loading && <Loader2 className="h-6 w-6 animate-spin" />}
            {endpoints.map((ep) => (
              <div key={ep.id} className="p-3 border rounded-md">
                <p className="font-medium truncate">{ep.url}</p>
                <p className="text-xs text-muted-foreground">{ep.is_active ? 'Active' : 'Paused'} • {ep.events.length} events</p>
              </div>
            ))}
            {endpoints.length === 0 && !loading && <p className="text-sm text-muted-foreground">No endpoints.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Deliveries</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
            {deliveries.map((d) => (
              <div key={d.id} className="p-3 border rounded-md flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{WEBHOOK_EVENT_LABELS[d.event_type as keyof typeof WEBHOOK_EVENT_LABELS]}</p>
                  <p className="text-xs text-muted-foreground">HTTP {d.http_status || '-'} • {d.status} • {d.attempts} attempts</p>
                </div>
                {d.status === 'failed' && <Button size="sm" variant="outline" onClick={() => handleRetry(d.id)}><RefreshCw className="h-3 w-3 mr-1" />Retry</Button>}
              </div>
            ))}
            {deliveries.length === 0 && !loading && <p className="text-sm text-muted-foreground">No deliveries.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
