import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getReferralStats, getAffiliateEarnings, getCommissions, getPayouts, getMarketingAssets, getLeaderboards } from '@/lib/referralApi';
import type { ReferralStats, AffiliateEarnings, Commission, Payout, MarketingAsset, Leaderboard } from '@/types/referral';
import { TrendingUp, Users, MousePointer, DollarSign, Download, Trophy, FileText, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function PartnerPortalPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats>({ clicks: 0, signups: 0, verified_users: 0, active_users: 0, paid_subscriptions: 0, revenue: 0, conversions: 0 });
  const [earnings, setEarnings] = useState<AffiliateEarnings>({ pending: 0, approved: 0, paid: 0 });
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [leaderboard, setLeaderboard] = useState<Leaderboard[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [s, e, c, p, a, l] = await Promise.all([
        getReferralStats(user?.id),
        getAffiliateEarnings(user?.id || ''),
        getCommissions({ userId: user?.id }),
        getPayouts({ userId: user?.id }),
        getMarketingAssets(),
        getLeaderboards('TopAffiliates'),
      ]);
      setStats(s);
      setEarnings(e);
      setCommissions(c.filter((x) => x.status === 'Approved' || x.status === 'Paid'));
      setPayouts(p);
      setAssets(a);
      setLeaderboard(l.slice(0, 10));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load partner portal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  if (loading) return <p className="p-8 text-center">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Partner Portal</h1>
        <p className="text-muted-foreground">Everything you need to promote and earn.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><MousePointer className="h-5 w-5 text-primary" /><div><div className="text-sm text-muted-foreground">Clicks</div><div className="text-xl font-semibold">{stats.clicks}</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Users className="h-5 w-5 text-primary" /><div><div className="text-sm text-muted-foreground">Signups</div><div className="text-xl font-semibold">{stats.signups}</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="h-5 w-5 text-primary" /><div><div className="text-sm text-muted-foreground">Conversions</div><div className="text-xl font-semibold">{stats.conversions}</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><DollarSign className="h-5 w-5 text-primary" /><div><div className="text-sm text-muted-foreground">Earnings</div><div className="text-xl font-semibold">${earnings.approved.toFixed(2)}</div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="commissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="commissions"><DollarSign className="h-4 w-4 mr-1" /> Commissions</TabsTrigger>
          <TabsTrigger value="payouts"><CreditCard className="h-4 w-4 mr-1" /> Payouts</TabsTrigger>
          <TabsTrigger value="marketing"><FileText className="h-4 w-4 mr-1" /> Marketing</TabsTrigger>
          <TabsTrigger value="leaderboard"><Trophy className="h-4 w-4 mr-1" /> Leaderboard</TabsTrigger>
        </TabsList>
        <TabsContent value="commissions">
          <Card>
            <CardHeader><CardTitle className="text-base font-medium">Approved commissions</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="capitalize">{c.commission_type}</TableCell>
                      <TableCell>${c.amount.toFixed(2)}</TableCell>
                      <TableCell><Badge variant="outline">{c.status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {commissions.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No approved commissions yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payouts">
          <Card>
            <CardHeader><CardTitle className="text-base font-medium">Payout history</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {payouts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div><div className="text-sm font-medium">${p.amount.toFixed(2)}</div><div className="text-xs text-muted-foreground">{p.payout_method}</div></div>
                    <Badge variant="outline">{p.status}</Badge>
                  </div>
                ))}
                {payouts.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No payouts yet.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="marketing">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Marketing assets</CardTitle>
              <CardDescription>Download logos, banners, and templates.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {assets.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <div className="text-sm font-medium">{a.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{a.asset_type}</div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={a.file_url} download><Download className="h-4 w-4 mr-1" /> Download</a>
                    </Button>
                  </div>
                ))}
              </div>
              {assets.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No assets available.</p>}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader><CardTitle className="text-base font-medium">Top affiliates</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.map((entry, i) => (
                  <div key={entry.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-semibold w-6">{i + 1}</div>
                      <div className="text-sm">{entry.user?.full_name || entry.user?.email || 'Anonymous'}</div>
                    </div>
                    <div className="text-sm font-medium">{entry.score} pts</div>
                  </div>
                ))}
                {leaderboard.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Leaderboard is empty.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
