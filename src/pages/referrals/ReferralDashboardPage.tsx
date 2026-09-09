import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QRCodeDataUrl from '@/components/ui/qrcodedataurl';
import { getReferralLinks, createReferralLink, getReferralStats, getReferralJourneys } from '@/lib/referralApi';
import type { ReferralLink, ReferralJourney, ReferralStats, ReferralLinkType } from '@/types/referral';
import { Link2, Copy, Share2, QrCode, Users, MousePointer, DollarSign, TrendingUp, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const LINK_TYPES: { value: ReferralLinkType; label: string }[] = [
  { value: 'direct', label: 'Direct Link' },
  { value: 'email', label: 'Email Invitation' },
  { value: 'qr', label: 'QR Code' },
  { value: 'social', label: 'Social Share' },
  { value: 'team', label: 'Team Invitation' },
  { value: 'classroom', label: 'Classroom Invitation' },
  { value: 'api', label: 'API Partner' },
];

const STAGES = ['visitor', 'signup', 'email_verified', 'first_scan', 'subscription', 'renewal'];

export default function ReferralDashboardPage() {
  const { user, profile } = useAuth();
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [stats, setStats] = useState<ReferralStats>({ clicks: 0, signups: 0, verified_users: 0, active_users: 0, paid_subscriptions: 0, revenue: 0, conversions: 0 });
  const [journeys, setJourneys] = useState<ReferralJourney[]>([]);
  const [linkType, setLinkType] = useState<ReferralLinkType>('direct');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [l, s, j] = await Promise.all([
        getReferralLinks(user?.id),
        getReferralStats(user?.id),
        getReferralJourneys(),
      ]);
      setLinks(l);
      setStats(s);
      setJourneys(j.slice(0, 20));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const generateLink = async () => {
    try {
      const link = await createReferralLink(linkType);
      setLinks([link, ...links]);
      toast.success('New referral link created');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create link');
    }
  };

  const referralUrl = (code: string) => `${window.location.origin}/signup?ref=${code}`;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const share = (platform: string, code: string) => {
    const url = encodeURIComponent(referralUrl(code));
    const text = encodeURIComponent('Join me on AIDetector.cx');
    let href = '';
    if (platform === 'twitter') href = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    if (platform === 'facebook') href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    if (platform === 'linkedin') href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    if (platform === 'whatsapp') href = `https://wa.me/?text=${text}%20${url}`;
    if (href) window.open(href, '_blank');
  };

  if (loading) return <p className="p-8 text-center">Loading...</p>;

  const primaryLink = links[0];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Referral Program</h1>
        <p className="text-muted-foreground">Invite others and earn rewards for every successful conversion.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><MousePointer className="h-5 w-5 text-primary" /><div><div className="text-sm text-muted-foreground">Clicks</div><div className="text-xl font-semibold">{stats.clicks}</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Users className="h-5 w-5 text-primary" /><div><div className="text-sm text-muted-foreground">Signups</div><div className="text-xl font-semibold">{stats.signups}</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="h-5 w-5 text-primary" /><div><div className="text-sm text-muted-foreground">Conversions</div><div className="text-xl font-semibold">{stats.conversions}</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><DollarSign className="h-5 w-5 text-primary" /><div><div className="text-sm text-muted-foreground">Est. Revenue</div><div className="text-xl font-semibold">${stats.revenue.toFixed(2)}</div></div></CardContent></Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Your referral link</CardTitle>
            <CardDescription>Share this link to start earning.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {primaryLink ? (
              <>
                <div className="flex items-center gap-2">
                  <Input value={referralUrl(primaryLink.code)} readOnly />
                  <Button variant="outline" size="icon" onClick={() => copy(referralUrl(primaryLink.code))}><Copy className="h-4 w-4" /></Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => share('twitter', primaryLink.code)}><Share2 className="h-4 w-4 mr-1" /> Twitter</Button>
                  <Button variant="outline" size="sm" onClick={() => share('facebook', primaryLink.code)}><Share2 className="h-4 w-4 mr-1" /> Facebook</Button>
                  <Button variant="outline" size="sm" onClick={() => share('linkedin', primaryLink.code)}><Share2 className="h-4 w-4 mr-1" /> LinkedIn</Button>
                  <Button variant="outline" size="sm" onClick={() => share('whatsapp', primaryLink.code)}><Share2 className="h-4 w-4 mr-1" /> WhatsApp</Button>
                </div>
                <div className="flex items-start gap-4 pt-2">
                  <QRCodeDataUrl text={referralUrl(primaryLink.code)} width={96} />
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Code: <span className="font-mono">{primaryLink.code}</span></div>
                    <div className="text-xs text-muted-foreground">Attribution window: {primaryLink.attribution_window_days} days</div>
                    <Badge variant="secondary" className="capitalize">{primaryLink.link_type}</Badge>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No referral link yet. Generate one below.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Generate new link</CardTitle>
            <CardDescription>Create a specialized referral link.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={linkType} onValueChange={(v) => setLinkType(v as ReferralLinkType)}>
              <SelectTrigger><SelectValue placeholder="Select link type" /></SelectTrigger>
              <SelectContent>
                {LINK_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={generateLink} className="w-full"><Link2 className="h-4 w-4 mr-2" /> Generate Link</Button>
            {profile?.referral_code && (
              <div className="text-sm text-muted-foreground">Profile referral code: <span className="font-mono">{profile.referral_code}</span></div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="journey" className="space-y-4">
        <TabsList>
          <TabsTrigger value="journey">Journey</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="email">Email Invite</TabsTrigger>
        </TabsList>
        <TabsContent value="journey">
          <Card>
            <CardHeader><CardTitle className="text-base font-medium">Referral journey</CardTitle></CardHeader>
            <CardContent>
              <div className="flex justify-between text-xs text-muted-foreground mb-4">
                {STAGES.map((s) => (
                  <div key={s} className="flex-1 text-center">
                    <div className="uppercase tracking-wider">{s.replace(/_/g, ' ')}</div>
                    <div className="text-lg font-semibold text-foreground">{journeys.filter((j) => j.stage === s).length}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {journeys.map((j) => (
                  <div key={j.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{j.stage.replace(/_/g, ' ')}</Badge>
                      <span className="text-sm text-muted-foreground">{j.visitor_id || j.referred_user_id || 'anonymous'}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(j.occurred_at), { addSuffix: true })}</span>
                  </div>
                ))}
                {journeys.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No referral activity yet.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="links">
          <Card>
            <CardHeader><CardTitle className="text-base font-medium">Your referral links</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {links.map((l) => (
                <div key={l.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{referralUrl(l.code)}</div>
                    <div className="text-xs text-muted-foreground capitalize">{l.link_type} • {l.attribution_window_days} days</div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => copy(referralUrl(l.code))}><Copy className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => copy(l.code)}><QrCode className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="email">
          <Card>
            <CardHeader><CardTitle className="text-base font-medium">Email invitation</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input placeholder="Enter recipient emails separated by commas" />
              <Button disabled={!primaryLink} onClick={() => toast.info('Email invitations coming soon')}><Mail className="h-4 w-4 mr-2" /> Send Invites</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
