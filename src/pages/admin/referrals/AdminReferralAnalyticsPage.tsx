import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getReferralLinks, getReferralJourneys, getCommissions, getLeaderboards } from '@/lib/referralApi';
import type { ReferralLink, ReferralJourney, Commission, Leaderboard } from '@/types/referral';
import { MousePointer, Users, TrendingUp, DollarSign, Trophy } from 'lucide-react';

export default function AdminReferralAnalyticsPage() {
  const { profile } = useAuth();
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [journeys, setJourneys] = useState<ReferralJourney[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [leaderboard, setLeaderboard] = useState<Leaderboard[]>([]);

  useEffect(() => {
    if (profile?.role !== 'admin') return;
    (async () => {
      const [l, c, lb] = await Promise.all([getReferralLinks(), getCommissions(), getLeaderboards('TopReferrers')]);
      setLinks(l);
      setCommissions(c);
      setLeaderboard(lb.slice(0, 10));
      const allJourneys: ReferralJourney[] = [];
      for (const link of l.slice(0, 50)) {
        const j = await getReferralJourneys(link.id);
        allJourneys.push(...j);
      }
      setJourneys(allJourneys);
    })();
  }, [profile]);

  if (profile?.role !== 'admin') return <p className="p-8 text-center">Admin access required.</p>;

  const clicks = journeys.filter((j) => j.stage === 'visitor').length;
  const signups = journeys.filter((j) => j.stage === 'signup').length;
  const conversions = journeys.filter((j) => j.stage === 'subscription').length;
  const revenue = commissions.filter((c) => c.status === 'Paid' || c.status === 'Approved').reduce((s, c) => s + c.amount, 0);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Referral Analytics</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><MousePointer className="h-5 w-5 text-primary" /><div><div className="text-sm text-muted-foreground">Clicks</div><div className="text-xl font-semibold">{clicks}</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Users className="h-5 w-5 text-primary" /><div><div className="text-sm text-muted-foreground">Signups</div><div className="text-xl font-semibold">{signups}</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="h-5 w-5 text-primary" /><div><div className="text-sm text-muted-foreground">Conversions</div><div className="text-xl font-semibold">{conversions}</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><DollarSign className="h-5 w-5 text-primary" /><div><div className="text-sm text-muted-foreground">Commission Value</div><div className="text-xl font-semibold">${revenue.toFixed(2)}</div></div></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base font-medium flex items-center gap-2"><Trophy className="h-4 w-4" /> Top referrers</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <div key={entry.id} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center gap-3"><span className="font-semibold w-6">{i + 1}</span><span className="text-sm">{entry.user?.full_name || entry.user?.email || 'Anonymous'}</span></div>
                <div className="text-sm font-medium">{entry.score} pts</div>
              </div>
            ))}
            {leaderboard.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No leaderboard data.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
