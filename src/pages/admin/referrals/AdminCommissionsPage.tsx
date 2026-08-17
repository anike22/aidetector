import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCommissions, approveCommission, payCommission, createCommission } from '@/lib/referralApi';
import type { Commission, CommissionType } from '@/types/referral';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminCommissionsPage() {
  const { profile } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<CommissionType>('Percentage');

  const load = async () => {
    try {
      const data = await getCommissions();
      setCommissions(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load commissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin') load();
  }, [profile]);

  const approve = async (id: string) => {
    try {
      await approveCommission(id);
      await load();
      toast.success('Commission approved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve');
    }
  };

  const pay = async (id: string) => {
    try {
      await payCommission(id);
      await load();
      toast.success('Commission marked paid');
    } catch (err: any) {
      toast.error(err.message || 'Failed to pay');
    }
  };

  const add = async () => {
    try {
      await createCommission({ amount: Number(newAmount) || 0, commission_type: newType, status: 'Pending' });
      setNewAmount('');
      await load();
      toast.success('Commission created');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create');
    }
  };

  if (profile?.role !== 'admin') return <p className="p-8 text-center">Admin access required.</p>;
  if (loading) return <p className="p-8 text-center">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Commission Management</h1>
      <Card>
        <CardHeader><CardTitle className="text-base font-medium">Create manual commission</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="Amount" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} type="number" />
          <Select value={newType} onValueChange={(v) => setNewType(v as CommissionType)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(['Fixed','Percentage','Recurring','OneTime'] as CommissionType[]).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={add}>Create</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base font-medium">Commissions</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Affiliate</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-sm">{c.affiliate_user_id?.slice(0, 8) || '-'}</TableCell>
                  <TableCell className="capitalize">{c.commission_type}</TableCell>
                  <TableCell>${c.amount.toFixed(2)}</TableCell>
                  <TableCell><Badge variant="outline">{c.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</TableCell>
                  <TableCell className="text-right space-x-1">
                    {c.status === 'Pending' && <Button size="sm" onClick={() => approve(c.id)}>Approve</Button>}
                    {c.status === 'Approved' && <Button size="sm" onClick={() => pay(c.id)}>Pay</Button>}
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
