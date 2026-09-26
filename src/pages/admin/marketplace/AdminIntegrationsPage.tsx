import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Puzzle, Loader2, Plus } from 'lucide-react';
import { getIntegrationCatalog, createIntegrationCatalogItem, updateIntegrationCatalogItem, INTEGRATION_TYPE_LABELS } from '@/lib/marketplaceApi';
import type { IntegrationCatalogItem, IntegrationType } from '@/types/marketplace';

const CATEGORIES = ['Productivity', 'CMS', 'LMS', 'Automation', 'Communication', 'CRM'];

export default function AdminIntegrationsPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<IntegrationCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({ name: '', slug: '', description: '', integration_type: 'native' as IntegrationType, category: 'Productivity', docs_url: '', install_url: '' });

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    try {
      const data = await getIntegrationCatalog();
      setItems(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load integrations.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newItem.name || !newItem.slug) return;
    try {
      await createIntegrationCatalogItem(newItem);
      toast.success('Integration added.');
      setNewItem({ name: '', slug: '', description: '', integration_type: 'native', category: 'Productivity', docs_url: '', install_url: '' });
      await loadItems();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add integration.');
    }
  }

  async function toggleFeatured(item: IntegrationCatalogItem) {
    try {
      await updateIntegrationCatalogItem(item.id, { is_featured: !item.is_featured });
      toast.success('Integration updated.');
      await loadItems();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update integration.');
    }
  }

  async function toggleActive(item: IntegrationCatalogItem) {
    try {
      await updateIntegrationCatalogItem(item.id, { is_active: !item.is_active });
      toast.success('Integration updated.');
      await loadItems();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update integration.');
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
            <Puzzle className="h-8 w-8" />
            Integration Catalog Admin
          </h1>
          <p className="text-muted-foreground">Manage integrations displayed in the Integration Hub.</p>
        </div>
        <Button variant="outline" onClick={loadItems} disabled={loading}>Refresh</Button>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Add Integration</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
            <Input placeholder="Slug" value={newItem.slug} onChange={(e) => setNewItem({ ...newItem, slug: e.target.value })} />
          </div>
          <Input placeholder="Description" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select className="text-sm border rounded px-2 py-2 bg-background" value={newItem.integration_type} onChange={(e) => setNewItem({ ...newItem, integration_type: e.target.value as IntegrationType })}>
              {Object.entries(INTEGRATION_TYPE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <select className="text-sm border rounded px-2 py-2 bg-background" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Input placeholder="Docs URL" value={newItem.docs_url} onChange={(e) => setNewItem({ ...newItem, docs_url: e.target.value })} />
          </div>
          <Button onClick={handleCreate} disabled={!newItem.name || !newItem.slug}><Plus className="h-4 w-4 mr-2" />Add Integration</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Catalog</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading && <Loader2 className="h-6 w-6 animate-spin" />}
          {items.length === 0 && !loading && <p className="text-sm text-muted-foreground">No integrations.</p>}
          {items.map((item) => (
            <div key={item.id} className="p-3 border rounded-md flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <p className="font-medium">{item.name} <span className="text-muted-foreground font-normal">({item.slug})</span></p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline">{INTEGRATION_TYPE_LABELS[item.integration_type]}</Badge>
                  {item.is_featured && <Badge variant="default">Featured</Badge>}
                  {!item.is_active && <Badge variant="secondary">Inactive</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm"><Switch checked={item.is_featured || false} onCheckedChange={() => toggleFeatured(item)} /> Featured</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={item.is_active || false} onCheckedChange={() => toggleActive(item)} /> Active</label>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
