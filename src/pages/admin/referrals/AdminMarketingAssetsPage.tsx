import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getMarketingAssets, createMarketingAsset, deleteMarketingAsset } from '@/lib/referralApi';
import type { MarketingAsset, MarketingAssetType } from '@/types/referral';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Trash2 } from 'lucide-react';

const ASSET_TYPES: MarketingAssetType[] = ['Logo','BrandGuideline','BannerAd','Screenshot','DemoVideo','EmailTemplate','SocialGraphic','LandingPageTemplate','ProductDescription'];

export default function AdminMarketingAssetsPage() {
  const { profile } = useAuth();
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<MarketingAssetType>('Logo');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await getMarketingAssets();
      setAssets(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin') load();
  }, [profile]);

  const add = async () => {
    try {
      await createMarketingAsset({ name, file_url: url, asset_type: type });
      setName(''); setUrl('');
      await load();
      toast.success('Asset added');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add asset');
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteMarketingAsset(id);
      await load();
      toast.success('Asset removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove');
    }
  };

  if (profile?.role !== 'admin') return <p className="p-8 text-center">Admin access required.</p>;
  if (loading) return <p className="p-8 text-center">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Marketing Asset Library</h1>
      <Card>
        <CardHeader><CardTitle className="text-base font-medium">Add asset</CardTitle></CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-2">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="File URL" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Select value={type} onValueChange={(v) => setType(v as MarketingAssetType)}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ASSET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={add}>Add</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base font-medium">Assets</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>URL</TableHead><TableHead>Added</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>{a.asset_type}</TableCell>
                  <TableCell className="text-sm truncate max-w-[200px]"><a href={a.file_url} target="_blank" rel="noreferrer" className="text-primary underline">{a.file_url}</a></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDistanceToNow(new Date(a.uploaded_at), { addSuffix: true })}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
