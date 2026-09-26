import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getFraudReviews, updateFraudReviewStatus } from '@/lib/referralApi';
import type { FraudReview, FraudReviewStatus } from '@/types/referral';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function AdminFraudPage() {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<FraudReview[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await getFraudReviews();
      setReviews(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load fraud reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin') load();
  }, [profile]);

  const update = async (id: string, status: FraudReviewStatus) => {
    try {
      await updateFraudReviewStatus(id, status, notes[id]);
      await load();
      toast.success('Fraud review updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  if (profile?.role !== 'admin') return <p className="p-8 text-center">Admin access required.</p>;
  if (loading) return <p className="p-8 text-center">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Fraud Review Queue</h1>
      <Card>
        <CardHeader><CardTitle className="text-base font-medium">Pending cases</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Type</TableHead><TableHead>Link/User</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead>Notes</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Badge variant="outline">{r.fraud_type}</Badge></TableCell>
                  <TableCell className="font-mono text-sm">{r.referral_link_id?.slice(0, 8) || r.affiliate_user_id?.slice(0, 8) || '-'}</TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</TableCell>
                  <TableCell>
                    <Textarea className="min-h-[60px]" value={notes[r.id] || r.notes || ''} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="outline" onClick={() => update(r.id, 'Approved')}>Approve</Button>
                    <Button size="sm" onClick={() => update(r.id, 'Rejected')}>Reject</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {reviews.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No fraud cases.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
