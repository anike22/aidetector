import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, CalendarClock, CheckCircle2, Clock3, FileSearch, Globe2, LayoutDashboard, Mail, Plus, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { toast } from 'sonner';
import { createOrganization, getOrganizationMembers, inviteOrganizationMember } from '@/lib/teamApi';
import type { Organization, OrganizationMember } from '@/types/team';

const agencyTools = [
  { name: 'AI Detector', detail: 'Balanced and Aggressive analysis', href: '/detector', icon: ShieldCheck },
  { name: 'Plagiarism Checker', detail: 'Originality and source review', href: '/plagiarism-checker', icon: FileSearch },
  { name: 'SEO Assistant', detail: 'Content and search-readiness workflows', href: '/seo-assistant', icon: Globe2 },
  { name: 'AI Humanizer', detail: 'Writing refinement workflows', href: '/humanizer', icon: Sparkles },
];

function trialDetails(org: Organization) {
  const value = (org.settings as Record<string, any> | undefined)?.agency_trial;
  const end = value?.ends_at ? new Date(value.ends_at) : null;
  const validEnd = end && Number.isFinite(end.getTime()) ? end : null;
  const remaining = validEnd ? Math.max(0, Math.ceil((validEnd.getTime() - Date.now()) / 86400000)) : 0;
  return { status: value?.status || 'not_started', end: validEnd, remaining };
}

export default function AgencyDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { organizations, refreshTeams, setCurrentOrganization, currentMembership, loading: teamsLoading } = useTeam();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const agencies = useMemo(() => organizations.filter((org) => org.type === 'agency'), [organizations]);
  const requestedId = searchParams.get('org');
  const organization = agencies.find((org) => org.id === requestedId) || agencies[0] || null;
  const [agencyName, setAgencyName] = useState('');
  const [industry, setIndustry] = useState('Digital marketing / SEO');
  const [country, setCountry] = useState('Nigeria');
  const [creating, setCreating] = useState(false);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'editor' | 'analyst'>('member');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!organization) return;
    let active = true;
    setCurrentOrganization(organization).catch((error) => console.error('Agency workspace selection failed', error));
    setMembersLoading(true);
    getOrganizationMembers(organization.id)
      .then((result) => { if (active) setMembers(result); })
      .catch((error) => { if (active) toast.error(error.message || 'Could not load agency members'); })
      .finally(() => { if (active) setMembersLoading(false); });
    return () => { active = false; };
  }, [organization?.id]);

  const trial = organization ? trialDetails(organization) : null;
  const isTrialing = trial?.status === 'trialing' && trial.remaining > 0;
  const canManage = currentMembership?.role === 'owner' || currentMembership?.role === 'admin' || currentMembership?.role === 'super_admin';

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!agencyName.trim()) return;
    setCreating(true);
    try {
      const created = await createOrganization({
        name: agencyName.trim(),
        type: 'agency',
        plan: 'team',
        industry: industry.trim() || undefined,
        country: country.trim() || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos',
      });
      await refreshTeams();
      toast.success('Agency workspace created. Your 7-day trial has started if your account is eligible.');
      navigate(`/agency-dashboard?org=${created.id}`, { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create agency workspace');
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async (event: FormEvent) => {
    event.preventDefault();
    if (!organization || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      await inviteOrganizationMember(organization.id, inviteEmail.trim(), inviteRole);
      toast.success('Invitation sent');
      setInviteEmail('');
      const updated = await getOrganizationMembers(organization.id);
      setMembers(updated);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send invitation');
    } finally {
      setInviting(false);
    }
  };

  if (authLoading || (user && teamsLoading)) {
    return <MainLayout><div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted-foreground">Loading your agency workspace…</div></MainLayout>;
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <Building2 className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold">Your agency workspace</h1>
          <p className="mt-3 text-muted-foreground">Sign in or create an AIDetector.cx account to start an agency workspace trial.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild><Link to="/signup?returnTo=%2Fagency-dashboard">Create account</Link></Button>
            <Button asChild variant="outline"><Link to="/login?returnTo=%2Fagency-dashboard">Sign in</Link></Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!organization) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-2xl px-4 py-12">
          <Badge variant="secondary">7-day free agency workspace trial</Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Create your agency workspace</h1>
          <p className="mt-2 text-muted-foreground">Set up a shared space for your team. Eligible accounts receive one 7-day workspace trial. No payment is collected here.</p>
          <Card className="mt-8">
            <CardHeader><CardTitle>Agency details</CardTitle><CardDescription>Start with your organisation name. You can update the details later.</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div><Label htmlFor="agency-name">Agency / organisation name</Label><Input id="agency-name" value={agencyName} onChange={(event) => setAgencyName(event.target.value)} placeholder="Your agency name" required maxLength={100} /></div>
                <div><Label htmlFor="agency-industry">Industry</Label><Input id="agency-industry" value={industry} onChange={(event) => setIndustry(event.target.value)} /></div>
                <div><Label htmlFor="agency-country">Country</Label><Input id="agency-country" value={country} onChange={(event) => setCountry(event.target.value)} /></div>
                <Button type="submit" disabled={creating || !agencyName.trim()} className="w-full">{creating ? 'Creating workspace…' : 'Start free 7-day trial'} <Plus className="ml-2 h-4 w-4" /></Button>
              </form>
            </CardContent>
          </Card>
          <p className="mt-4 text-xs text-muted-foreground">Trial eligibility is limited to one agency workspace trial per account. Tool usage continues to follow the existing access and credit rules unless a separate agency offer is agreed and activated.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2"><Badge variant="secondary">Agency workspace</Badge><Badge variant={isTrialing ? 'default' : 'outline'}>{isTrialing ? 'Free trial active' : trial?.status === 'not_eligible' ? 'Trial not available' : trial?.status === 'expired' || trial?.remaining === 0 ? 'Trial ended' : 'Workspace'}</Badge></div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">{organization.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your team, content checks and agency workspace.</p>
          </div>
          <Button asChild variant="outline"><Link to={`/organizations/${organization.id}`}><LayoutDashboard className="mr-2 h-4 w-4" /> Advanced organisation settings</Link></Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-primary/10 p-3"><Clock3 className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Trial days remaining</p><p className="text-2xl font-bold">{isTrialing ? trial?.remaining : 0}</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-primary/10 p-3"><Users className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Team members</p><p className="text-2xl font-bold">{members.filter((member) => member.status === 'active').length}</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-primary/10 p-3"><CalendarClock className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Trial end date</p><p className="text-base font-semibold">{trial?.end ? trial.end.toLocaleDateString() : 'Not set'}</p></div></CardContent></Card>
        </div>

        <Card className="border-primary/20">
          <CardContent className="p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div><h2 className="font-semibold">{isTrialing ? 'Your 7-day agency workspace trial is running' : 'Agency access and renewal'}</h2><p className="mt-1 text-sm text-muted-foreground">{isTrialing ? 'Explore team collaboration, invitations and shared workspace features before discussing a paid agency arrangement.' : 'Contact the AIDetector.cx team to discuss a new 30-day agency access arrangement and negotiated pricing.'}</p></div>
              <Button asChild><a href="mailto:partnerships@aidetector.cx?subject=Agency%20trial%20conversion%20and%20pricing">Discuss agency pricing</a></Button>
            </div>
            {trial?.status === 'not_eligible' && <p className="mt-3 text-sm text-muted-foreground">This account has already used an agency workspace trial. You can still request a negotiated agency offer.</p>}
            {trial?.end && <p className="mt-3 text-xs text-muted-foreground">Trial ends {trial.end.toLocaleString()} (local time shown by your browser).</p>}
          </CardContent>
        </Card>

        <section>
          <div className="mb-4"><h2 className="text-xl font-semibold">AIDetector.cx tools</h2><p className="text-sm text-muted-foreground">Open a tool from your workspace. Tool usage follows the current account entitlements unless an agency-wide scope is separately agreed and activated.</p></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {agencyTools.map((tool) => <Card key={tool.href} className="h-full"><CardContent className="p-5"><tool.icon className="mb-3 h-6 w-6 text-primary" /><h3 className="font-semibold">{tool.name}</h3><p className="mt-1 min-h-10 text-sm text-muted-foreground">{tool.detail}</p><Button asChild variant="link" className="mt-2 h-auto px-0"><Link to={tool.href}>Open tool <span aria-hidden="true">→</span></Link></Button></CardContent></Card>)}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Team members</CardTitle><CardDescription>Invite colleagues to your agency organisation.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {canManage && <form onSubmit={handleInvite} className="flex flex-col gap-2 sm:flex-row"><Input type="email" placeholder="colleague@agency.com" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} required /><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={inviteRole} onChange={(event) => setInviteRole(event.target.value as typeof inviteRole)}><option value="member">Member</option><option value="editor">Editor</option><option value="analyst">Analyst</option></select><Button type="submit" disabled={inviting}>{inviting ? 'Sending…' : 'Invite'}</Button></form>}
              {membersLoading ? <p className="text-sm text-muted-foreground">Loading members…</p> : members.length === 0 ? <p className="text-sm text-muted-foreground">No team members found yet.</p> : <div className="divide-y">{members.map((member) => <div key={member.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{member.user?.full_name || member.user?.email || 'Team member'}</p><p className="truncate text-xs text-muted-foreground">{member.user?.email || member.user_id}</p></div><Badge variant="outline" className="capitalize">{member.status === 'active' ? member.role.replace(/_/g, ' ') : member.status}</Badge></div>)}</div>}
              <Button asChild variant="outline" size="sm"><Link to={`/organizations/${organization.id}?tab=members`}>Manage team and roles</Link></Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Workspace features</CardTitle><CardDescription>Included in the free agency workspace trial.</CardDescription></CardHeader>
            <CardContent className="space-y-3 text-sm">{['Shared agency organisation','Team invitations and role assignment','Workspace and project collaboration','Shared reports and activity tools'].map((feature) => <div key={feature} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>{feature}</span></div>)}<p className="border-t pt-3 text-xs text-muted-foreground">The trial does not automatically override existing tool credits, subscription limits, or activate unlimited API/bulk access.</p></CardContent>
          </Card>
        </section>
        <p className="text-xs text-muted-foreground">Need help? <a className="text-primary underline" href="mailto:partnerships@aidetector.cx">partnerships@aidetector.cx</a></p>
      </div>
    </MainLayout>
  );
}
