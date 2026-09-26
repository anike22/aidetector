import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { enterpriseSearch } from '@/lib/enterpriseApi';
import type { EnterpriseSearchResult } from '@/types/enterprise';
import { FileText, User, FolderOpen } from 'lucide-react';

const ICONS: Record<string, React.ElementType> = { document: FileText, report: FileText, user: User, folder: FolderOpen };

export default function OrganizationSearchTab({ organizationId }: { organizationId: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EnterpriseSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await enterpriseSearch(organizationId, query.trim());
      setResults(data);
    } catch (err: any) {
      toast.error(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Enterprise search</CardTitle>
        <CardDescription>Search documents, reports, and users across your organization.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={search} className="flex gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="flex-1" />
          <Button type="submit" disabled={loading}>Search</Button>
        </form>
        <div className="space-y-2">
          {results.map((r) => {
            const Icon = ICONS[r.type] || FileText;
            return (
              <div key={r.id + r.type} className="flex items-start gap-3 border rounded-lg p-3">
                <Icon className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.title}</div>
                  {r.subtitle && <div className="text-xs text-muted-foreground truncate">{r.subtitle}</div>}
                </div>
                <Badge variant="outline" className="capitalize shrink-0">{r.type}</Badge>
              </div>
            );
          })}
          {!loading && results.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No results found.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
