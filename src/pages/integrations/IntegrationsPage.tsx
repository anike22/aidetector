import { useEffect, useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Puzzle, Search, ExternalLink, Loader2 } from 'lucide-react';
import { getIntegrationCatalog, INTEGRATION_TYPE_LABELS } from '@/lib/marketplaceApi';
import type { IntegrationCatalogItem } from '@/types/marketplace';

const INTEGRATION_CATEGORIES = [
  'Productivity', 'CMS', 'LMS', 'Automation', 'Communication', 'CRM'
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');

  useEffect(() => {
    loadIntegrations();
  }, []);

  async function loadIntegrations() {
    try {
      const data = await getIntegrationCatalog();
      setIntegrations(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load integrations.');
    } finally {
      setLoading(false);
    }
  }

  const filtered = integrations.filter((i) => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || (i.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || i.category === category;
    return matchesSearch && matchesCategory;
  });

  const featured = filtered.filter((i) => i.is_featured);

  return (
    <MainLayout>
      <div className="container max-w-6xl py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Puzzle className="h-8 w-8" />
              Integration Hub
            </h1>
            <p className="text-muted-foreground">Connect AIDetector.cx with your favorite tools.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search integrations" className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={category === 'All' ? 'default' : 'outline'} size="sm" onClick={() => setCategory('All')}>All</Button>
            {INTEGRATION_CATEGORIES.map((c) => (
              <Button key={c} variant={category === c ? 'default' : 'outline'} size="sm" onClick={() => setCategory(c)}>{c}</Button>
            ))}
          </div>
        </div>

        {loading && <Loader2 className="h-6 w-6 animate-spin" />}

        {featured.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Featured</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featured.map((item) => (
                <IntegrationCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        <h2 className="text-xl font-semibold mb-4">All Integrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <IntegrationCard key={item.id} item={item} />
          ))}
        </div>
        {filtered.length === 0 && !loading && <p className="text-muted-foreground">No integrations match your search.</p>}
      </div>
    </MainLayout>
  );
}

function IntegrationCard({ item }: { item: IntegrationCatalogItem }) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          {item.icon_url ? <img src={item.icon_url} alt={item.name} className="w-10 h-10 rounded" /> : <Puzzle className="h-8 w-8 text-primary" />}
          <div>
            <CardTitle className="text-lg">{item.name}</CardTitle>
            <CardDescription>{INTEGRATION_TYPE_LABELS[item.integration_type]}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground mb-4 flex-1">{item.description}</p>
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {item.is_featured && <Badge variant="default">Featured</Badge>}
          {item.category && <Badge variant="outline">{item.category}</Badge>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild className="flex-1">
            <a href={item.docs_url || '#'}>Docs</a>
          </Button>
          <Button size="sm" asChild className="flex-1">
            <a href={item.install_url || '#'}><ExternalLink className="h-3 w-3 mr-1" />Install</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
