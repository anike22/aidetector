import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  getMyAffiliateApplication,
  applyForAffiliate,
  getAffiliateLinks,
  createAffiliateLink,
  getCommissions,
  getAffiliateEarnings,
  getPayouts,
  requestPayout,
} from '@/lib/referralApi';
import type { AffiliateApplication, AffiliateLink, Commission, Payout, AffiliateEarnings } from '@/types/referral';
import { DollarSign, Link2, Copy, TrendingUp, Wallet, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function AffiliateDashboardPage() {
  const { user, profile } = useAuth();
  const [app, setApp] = useState<AffiliateApplication | null>(null);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [earnings, setEarnings] = useState<AffiliateEarnings>({ pending: 0, approved: 0, paid: 0 });
  const [website, setWebsite] = useState('');
  const [social, setSocial] = useState('');
  const [experience, setExperience] = useState('');
  const [campaign, setCampaign] = useState('');
  const [coupon, setCoupon] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [a, l, c, p, e] = await Promise.all([
        getMyAffiliateApplication(),
        getAffiliateLinks(user?.id),
        getCommissions({ userId: user?.id }),
        getPayouts({ userId: user?.id }),
        getAffiliateEarnings(user?.id || ''),
      ]);
      setApp(a);
      setLinks(l);
      setCommissions(c);
      setPayouts(p);
      setEarnings(e);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load affiliate data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const submitApplication = async () => {
    try {
      const created = await applyForAffiliate({ website, social_profiles: social, marketing_experience: experience });
      setApp(created);
      toast.success('Application submitted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit application');
    }
  };

  const createLink = async () => {
    try {
      const link = await createAffiliateLink('Tracking', campaign || undefined, coupon || undefined);
      setLinks([link, ...links]);
      setCampaign('');
      setCoupon('');
      toast.success('Tracking link created');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create link');
    }
  };

  const request = async () => {
    if (earnings.approved <= 0) return;
    try {
      const payout = await requestPayout(earnings.approved, 'Bank Transfer');
      setPayouts([payout, ...payouts]);
      toast.success('Payout requested');
    } catch (err: any) {
      toast.error(err.message || 'Failed to request payout');
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied');
  };

  const trackingUrl = (link: AffiliateLink) => `${window.location.origin}/signup?aff=${link.id}${link.coupon_code ? `&coupon=${link.coupon_code}` : ''}`;

  if (loading) return <p className="p-8 text-center">Loading...</p>;

  const notApplied = !app || ['Rejected', 'Terminated'].includes(app.status);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Affiliate Program</h1>
        <p className="text-muted-foreground">Earn commissions by promoting AIDetector.cx.</p>
      </div>

      {notApplied ? (
        <Card>
          <CardHeader><CardTitle className="text-base font-medium">Apply to become an affiliate</CardTitle></CardHeader>
          <CardContent className="space-y-3 max-w-xl">
            <Input placeholder="Website or blog URL" value={website} onChange={(e) => setWebsite(e.target.value)} />
            <Textarea placeholder="Social profiles (one per line)" value={social} onChange={(e) => setSocial(e.target.value)} />
            <Textarea placeholder="Marketing experience" value={experience} onChange={(e) => setExperience(e.target.value)} />
            <Button onClick={submitApplication}>Submit Application</Button>
          </CardContent>
        </Card>
      ) : app.status !== 'Approved' ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-sm">Application status: <Badge variant="secondary">{app.status}</Badge></div>
            <p className="text-muted-foreground mt-2">Your application is under review.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardContent className="p-4 flex items-center gap-3"><Wallet className="h-5 w-5 text-primary" /><div><div className="text-sm text-muted-foreground">Pending</div><div className="text-xl font-semibold">${earnings.pending.toFixed(2)}</div></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><DollarSign className="h-5 w-5 text-primary" /><div><div className="text-sm text-muted-foreground">Approved</div><div className="text-xl font-semibold">${earnings.approved.toFixed(2)}</div></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="h-5 w-5 text-primary" /><div><div className="text-sm text-muted-foreground">Paid</div><div className="text-xl font-semibold">${earnings.paid.toFixed(2)}</div></div></CardContent></Card>
          </div>

          <Tabs defaultValue="links" className="space-y-4">
            <TabsList>
              <TabsTrigger value="links"><Link2 className="h-4 w-4 mr-1" /> Links</TabsTrigger>
              <TabsTrigger value="commissions"><ClipboardList className="h-4 w-4 mr-1" /> Commissions</TabsTrigger>
              <TabsTrigger value="payouts"><Wallet className="h-4 w-4 mr-1" /> Payouts</TabsTrigger>
            </TabsList>
            <TabsContent value="links">
              <Card>
                <CardHeader><CardTitle className="text-base font-medium">Tracking links</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input placeholder="Campaign name (optional)" value={campaign} onChange={(e) => setCampaign(e.target.value)} />
                    <Input placeholder="Coupon code (optional)" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
                    <Button onClick={createLink}>Create</Button>
                  </div>
                  <div className="space-y-2">
                    {links.map((l) => (
                      <div key={l.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{trackingUrl(l)}</div>
                          <div className="text-xs text-muted-foreground">{l.link_type} {l.campaign_name ? `• ${l.campaign_name}` : ''}</div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => copy(trackingUrl(l))}><Copy className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="commissions">
              <Card>
                <CardHeader><CardTitle className="text-base font-medium">Commissions</CardTitle></CardHeader>
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
                  {commissions.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No commissions yet.</p>}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="payouts">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Payouts</CardTitle>
                  <CardDescription>Request a payout once you have an approved balance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={request} disabled={earnings.approved <= 0}>Request ${earnings.approved.toFixed(2)} Payout</Button>
                  <div className="space-y-2">
                    {payouts.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div><div className="text-sm font-medium">${p.amount.toFixed(2)}</div><div className="text-xs text-muted-foreground">{p.payout_method}</div></div>
                        <Badge variant="outline">{p.status}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
