import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Webhook, Plus, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { getWebhookEndpoints, createWebhookEndpoint, updateWebhookEndpoint, deleteWebhookEndpoint, getWebhookDeliveries, retryWebhookDelivery, WEBHOOK_EVENT_LABELS } from '@/lib/marketplaceApi';
import type { WebhookEndpoint, WebhookDelivery } from '@/types/marketplace';

const ALL_EVENTS = Object.keys(WEBHOOK_EVENT_LABELS) as (keyof typeof WEBHOOK_EVENT_LABELS)[];

export default function WebhooksPage() {
  const { user } = useAuth();
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [secret, setSecret] = useState('');

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

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

  async function handleAddEndpoint() {
    if (!url || selectedEvents.length === 0) return;
    try {
      await createWebhookEndpoint({ url, events: selectedEvents as any, secret });
      toast.success('Webhook endpoint created.');
      setUrl('');
      setSelectedEvents([]);
      setSecret('');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create endpoint.');
    }
  }

  async function toggleEndpoint(endpoint: WebhookEndpoint) {
    try {
      await updateWebhookEndpoint(endpoint.id, { is_active: !endpoint.is_active });
      toast.success('Endpoint updated.');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update endpoint.');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteWebhookEndpoint(id);
      toast.success('Endpoint deleted.');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete endpoint.');
    }
  }

  async function handleRetry(id: string) {
    try {
      await retryWebhookDelivery(id);
      toast.success('Delivery queued for retry.');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to retry delivery.');
    }
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="container py-8">
          <h1 className="text-2xl font-bold">Sign in required</h1>
          <p className="text-muted-foreground">Please sign in to manage webhooks.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-6xl py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Webhook className="h-8 w-8" />
              Webhook Manager
            </h1>
            <p className="text-muted-foreground">Subscribe to platform events and manage deliveries.</p>
          </div>
          <Button variant="outline" onClick={loadData} disabled={loading}>Refresh</Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add Endpoint</CardTitle>
            <CardDescription>Register a URL to receive event payloads</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/webhook" />
            <Input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Optional signing secret" />
            <div className="flex flex-wrap gap-2">
              {ALL_EVENTS.map((event) => (
                <Button
                  key={event}
                  type="button"
                  variant={selectedEvents.includes(event) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedEvents((prev) => prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event])}
                >
                  {WEBHOOK_EVENT_LABELS[event]}
                </Button>
              ))}
            </div>
            <Button onClick={handleAddEndpoint} disabled={!url || selectedEvents.length === 0}><Plus className="h-4 w-4 mr-2" />Add Endpoint</Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Endpoints</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {loading && <Loader2 className="h-6 w-6 animate-spin" />}
              {endpoints.length === 0 && !loading && <p className="text-sm text-muted-foreground">No endpoints configured.</p>}
              {endpoints.map((ep) => (
                <div key={ep.id} className="p-3 border rounded-md space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{ep.url}</p>
                    <Switch checked={ep.is_active} onCheckedChange={() => toggleEndpoint(ep)} />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ep.events.map((e) => <Badge key={e} variant="outline">{WEBHOOK_EVENT_LABELS[e as keyof typeof WEBHOOK_EVENT_LABELS]}</Badge>)}
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(ep.id)}><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent Deliveries</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
              {deliveries.length === 0 && !loading && <p className="text-sm text-muted-foreground">No deliveries recorded.</p>}
              {deliveries.map((d) => (
                <div key={d.id} className="p-3 border rounded-md flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{WEBHOOK_EVENT_LABELS[d.event_type as keyof typeof WEBHOOK_EVENT_LABELS]}</p>
                    <p className="text-xs text-muted-foreground">HTTP {d.http_status || '-'} • {d.status} • {d.attempts} attempts</p>
                  </div>
                  {d.status === 'failed' && <Button size="sm" variant="outline" onClick={() => handleRetry(d.id)}><RefreshCw className="h-3 w-3 mr-1" />Retry</Button>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
