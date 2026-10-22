import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getPayouts, updatePayoutStatus, getPayoutBankDetails, type UsdBankDetails } from '@/lib/referralApi';
import type { Payout, PayoutStatus } from '@/types/referral';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function AdminPayoutsPage() {
  const { profile } = useAuth();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [bankDetails, setBankDetails] = useState<{ id: string; details: UsdBankDetails | null } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await getPayouts();
      setPayouts(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin') load();
  }, [profile]);

  const revealBankDetails = async (id: string) => {
    try { setBankDetails({ id, details: await getPayoutBankDetails(id) }); }
    catch { toast.error('Unable to retrieve bank details. Admin access is required.'); }
  };

  const update = async (id: string, status: PayoutStatus) => {
    try {
      await updatePayoutStatus(id, status);
      await load();
      toast.success('Payout updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  if (profile?.role !== 'admin') return <p className="p-8 text-center">Admin access required.</p>;
  if (loading) return <p className="p-8 text-center">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Payout Approvals</h1>
      {bankDetails && <Card><CardHeader><CardTitle>USD bank details for payout {bankDetails.id.slice(0, 8)}</CardTitle></CardHeader><CardContent className="space-y-2">
        <p className="text-sm">Use only for this payout. Confirm recipient details before processing a transfer.</p>
        {bankDetails.details ? <dl className="grid gap-2 md:grid-cols-2">{Object.entries(bankDetails.details).filter(([key]) => key !== 'usd_confirmed').map(([key, value]) => <div key={key}><dt className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</dt><dd className="break-all">{String(value || '—')}</dd></div>)}</dl> : <p>No bank details were submitted with this legacy payout.</p>}
        <Button variant="outline" onClick={() => setBankDetails(null)}>Hide bank details</Button>
      </CardContent></Card>}
      <Card>
        <CardHeader><CardTitle className="text-base font-medium">Payout requests</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Affiliate</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead>Requested</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">{p.affiliate_user_id.slice(0, 8)}</TableCell>
                  <TableCell className="font-medium">${p.amount.toFixed(2)}</TableCell>
                  <TableCell>{p.payout_method || '-'}</TableCell>
                  <TableCell><Badge variant="outline">{p.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDistanceToNow(new Date(p.requested_at), { addSuffix: true })}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="outline" onClick={() => revealBankDetails(p.id)}>View bank details</Button>
                    {p.status === 'Pending' && <Button size="sm" onClick={() => update(p.id, 'Approved')}>Approve</Button>}
                    {p.status === 'Approved' && <Button size="sm" onClick={() => update(p.id, 'Processing')}>Start Processing</Button>}
                    {(p.status === 'Approved' || p.status === 'Processing') && <Button size="sm" variant="outline" onClick={() => update(p.id, 'Failed')}>Mark Failed</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {payouts.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No payout requests.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
