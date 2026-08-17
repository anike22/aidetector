import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Store, Search, Download, Star, Loader2, Plus } from 'lucide-react';
import { getMarketplaceApps, installApp, getAppInstalls, uninstallApp, APP_TYPE_LABELS } from '@/lib/marketplaceApi';
import type { MarketplaceApp, AppInstall, MarketplaceAppType } from '@/types/marketplace';

export default function AppsMarketplacePage() {
  const { user } = useAuth();
  const [apps, setApps] = useState<MarketplaceApp[]>([]);
  const [installs, setInstalls] = useState<AppInstall[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<MarketplaceAppType | 'all'>('all');
  const [showPublish, setShowPublish] = useState(false);
  const [newApp, setNewApp] = useState({ name: '', description: '', app_type: 'template' as MarketplaceAppType, pricing: 'free' as const, price: 0, category: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [a, i] = await Promise.all([getMarketplaceApps({ status: 'approved' }), user ? getAppInstalls() : Promise.resolve([])]);
      setApps(a);
      setInstalls(i);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load marketplace.');
    } finally {
      setLoading(false);
    }
  }

  async function handleInstall(app: MarketplaceApp) {
    if (!user) {
      toast.error('Please sign in to install apps.');
      return;
    }
    try {
      await installApp(app.id);
      toast.success(`${app.name} installed.`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to install app.');
    }
  }

  async function handleUninstall(installId: string, appName: string) {
    try {
      await uninstallApp(installId);
      toast.success(`${appName} uninstalled.`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to uninstall app.');
    }
  }

  async function handlePublish() {
    if (!newApp.name) return;
    try {
      await fetch('/api/marketplace/apps', { method: 'POST', body: JSON.stringify(newApp) });
      toast.success('App submitted for review.');
      setShowPublish(false);
      setNewApp({ name: '', description: '', app_type: 'template', pricing: 'free', price: 0, category: '' });
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish app.');
    }
  }

  const filtered = apps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(search.toLowerCase()) || (app.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = type === 'all' || app.app_type === type;
    return matchesSearch && matchesType;
  });

  return (
    <MainLayout>
      <div className="container max-w-6xl py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Store className="h-8 w-8" />
              App Marketplace
            </h1>
            <p className="text-muted-foreground">Discover apps, templates, plugins, and integrations.</p>
          </div>
          {user && (
            <Button onClick={() => setShowPublish(true)}><Plus className="h-4 w-4 mr-2" />Publish App</Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search apps, templates, integrations..." className="pl-9" />
          </div>
          <Select value={type} onValueChange={(v) => setType(v as MarketplaceAppType | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(APP_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading && <Loader2 className="h-6 w-6 animate-spin" />}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filtered.map((app) => {
            const installed = installs.find((i) => i.app_id === app.id);
            return (
              <Card key={app.id} className="h-full flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    {app.icon_url ? <img src={app.icon_url} alt={app.name} className="w-10 h-10 rounded" /> : <Store className="h-8 w-8 text-primary" />}
                    <div>
                      <CardTitle className="text-lg">{app.name}</CardTitle>
                      <CardDescription>{APP_TYPE_LABELS[app.app_type]}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground mb-3 flex-1">{app.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline">{app.pricing}</Badge>
                    {app.price ? <Badge>${app.price}</Badge> : null}
                    <Badge variant="secondary"><Star className="h-3 w-3 mr-1" />{app.rating || '0'}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <span><Download className="h-3 w-3 inline mr-1" />{app.downloads || 0}</span>
                    <span>{app.category}</span>
                  </div>
                  {installed ? (
                    <Button variant="outline" className="w-full" onClick={() => handleUninstall(installed.id, app.name)}>Uninstall</Button>
                  ) : (
                    <Button className="w-full" onClick={() => handleInstall(app)}>Install</Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        {filtered.length === 0 && !loading && <p className="text-muted-foreground">No apps found.</p>}

        <Dialog open={showPublish} onOpenChange={setShowPublish}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Publish App</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <Input placeholder="App name" value={newApp.name} onChange={(e) => setNewApp({ ...newApp, name: e.target.value })} />
              <Input placeholder="Description" value={newApp.description} onChange={(e) => setNewApp({ ...newApp, description: e.target.value })} />
              <Select value={newApp.app_type} onValueChange={(v) => setNewApp({ ...newApp, app_type: v as MarketplaceAppType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(APP_TYPE_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={newApp.pricing} onValueChange={(v) => setNewApp({ ...newApp, pricing: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="freemium">Freemium</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handlePublish} disabled={!newApp.name}>Submit for Review</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
