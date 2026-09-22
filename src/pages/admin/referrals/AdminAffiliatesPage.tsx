import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAffiliateApplications, updateAffiliateApplicationStatus } from '@/lib/referralApi';
import type { AffiliateApplication, AffiliateApplicationStatus, AffiliateTier } from '@/types/referral';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const STATUSES: AffiliateApplicationStatus[] = ['Pending', 'Approved', 'Rejected', 'Suspended', 'Terminated'];
const TIERS: AffiliateTier[] = ['Standard', 'Verified', 'Professional', 'Agency', 'Enterprise_Partner'];

export default function AdminAffiliatesPage() {
  const { profile, loading: authLoading, isAdmin } = useAuth();
  const [apps, setApps] = useState<AffiliateApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await getAffiliateApplications();
      setApps(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const update = async (id: string, status: AffiliateApplicationStatus, tier?: AffiliateTier) => {
    try {
      await updateAffiliateApplicationStatus(id, status, tier);
      await load();
      toast.success('Application updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  if (authLoading) return <p className="p-8 text-center text-muted-foreground">Checking authorization...</p>;
  if (!isAdmin) return <p className="p-8 text-center">Admin access required.</p>;
  if (loading) return <p className="p-8 text-center">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Affiliate Management</h1>
      <Card>
        <CardHeader><CardTitle className="text-base font-medium">Applications</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Applicant</TableHead><TableHead>Website</TableHead><TableHead>Status</TableHead><TableHead>Tier</TableHead><TableHead>Applied</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {apps.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="text-sm font-medium">{a.user?.full_name || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">{a.user?.email}</div>
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-[200px]">{a.website || '-'}</TableCell>
                  <TableCell><Badge variant="outline">{a.status}</Badge></TableCell>
                  <TableCell>{a.tier}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Select value={a.status} onValueChange={(v) => update(a.id, v as AffiliateApplicationStatus, a.tier)}>
                      <SelectTrigger className="w-[130px] inline-flex"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={a.tier} onValueChange={(v) => update(a.id, a.status, v as AffiliateTier)}>
                      <SelectTrigger className="w-[130px] inline-flex"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
