import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getReferralLinks, deleteReferralLink, getReferralJourneys, createFraudReview } from '@/lib/referralApi';
import type { ReferralLink, ReferralJourney } from '@/types/referral';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ShieldAlert, Trash2 } from 'lucide-react';

export default function AdminReferralsPage() {
  const { profile } = useAuth();
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [journeys, setJourneys] = useState<Record<string, ReferralJourney[]>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const l = await getReferralLinks();
      setLinks(l);
      const map: Record<string, ReferralJourney[]> = {};
      for (const link of l.slice(0, 50)) {
        const j = await getReferralJourneys(link.id);
        map[link.id] = j;
      }
      setJourneys(map);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin') load();
  }, [profile]);

  const remove = async (id: string) => {
    try {
      await deleteReferralLink(id);
      setLinks(links.filter((l) => l.id !== id));
      toast.success('Referral link deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const flag = async (linkId: string, type: 'SelfReferral' | 'SuspiciousPattern') => {
    try {
      await createFraudReview({ referral_link_id: linkId, fraud_type: type });
      toast.success('Fraud review created');
    } catch (err: any) {
      toast.error(err.message || 'Failed to flag');
    }
  };

  if (profile?.role !== 'admin') return <p className="p-8 text-center">Admin access required.</p>;
  if (loading) return <p className="p-8 text-center">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Referral Management</h1>
      <Card>
        <CardHeader><CardTitle className="text-base font-medium">All referral links</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>User</TableHead><TableHead>Code</TableHead><TableHead>Type</TableHead><TableHead>Clicks</TableHead><TableHead>Conversions</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {links.map((l) => {
                const jj = journeys[l.id] || [];
                const clicks = jj.filter((j) => j.stage === 'visitor').length;
                const conversions = jj.filter((j) => j.stage === 'subscription').length;
                return (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm font-mono">{l.user_id.slice(0, 8)}</TableCell>
                    <TableCell className="font-mono">{l.code}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{l.link_type}</Badge></TableCell>
                    <TableCell>{clicks}</TableCell>
                    <TableCell>{conversions}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => flag(l.id, 'SuspiciousPattern')}><ShieldAlert className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(l.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
