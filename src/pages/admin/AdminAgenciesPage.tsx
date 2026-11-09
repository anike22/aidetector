import { useCallback, useEffect, useMemo, useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Building2, CalendarClock, CheckCircle2, Clock3, CreditCard, Loader2, RefreshCw, Search, ShieldAlert, Users, XCircle } from 'lucide-react';

type Agency = {
  id: string;
  name: string;
  owner_id: string;
  status: 'active' | 'suspended' | 'deleted';
  plan: 'team' | 'business' | 'enterprise';
  max_members: number | null;
  country: string | null;
  industry: string | null;
  billing_email: string | null;
  created_at: string;
  settings: Record<string, any> | null;
  owner?: { email: string; full_name: string | null };
  member_count: number;
  active_members: number;
  operations_30d: number;
  last_activity: string | null;
};

type AgencySubscription = {
  status?: string;
  plan?: string;
  amount?: number | null;
  currency?: string;
  billing_cycle?: string;
  payment_reference?: string | null;
  starts_at?: string;
  ends_at?: string | null;
  notes?: string | null;
};

const dateInput = (value?: string | null) => value ? new Date(value).toISOString().slice(0, 10) : '';
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const formatMoney = (amount?: number | null, currency = 'NGN') => amount == null ? 'Not set' : new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

function getTrial(agency: Agency) {
  const trial = agency.settings?.agency_trial || {};
  const end = trial.ends_at ? new Date(trial.ends_at) : null;
  const remaining = end && Number.isFinite(end.getTime()) ? Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000)) : 0;
  return { ...trial, remaining, end };
}

export default function AdminAgenciesPage() {
  const { user, profile, loading: authLoading, isAdmin } = useAuth();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Agency | null>(null);
  const [busy, setBusy] = useState(false);
  const [trialEnd, setTrialEnd] = useState('');
  const [memberLimit, setMemberLimit] = useState('10');
  const [workspacePlan, setWorkspacePlan] = useState<'team' | 'business' | 'enterprise'>('team');
  const [subscriptionStatus, setSubscriptionStatus] = useState('pending');
  const [subscriptionAmount, setSubscriptionAmount] = useState('');
  const [subscriptionCurrency, setSubscriptionCurrency] = useState('NGN');
  const [paymentReference, setPaymentReference] = useState('');
  const [subscriptionEnd, setSubscriptionEnd] = useState('');
  const [subscriptionNotes, setSubscriptionNotes] = useState('');

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const { data: orgRows, error } = await supabase
        .from('organizations')
        .select('id,name,owner_id,status,plan,max_members,country,industry,billing_email,created_at,settings')
        .eq('type', 'agency')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (orgRows || []) as unknown as Agency[];
      if (!rows.length) {
        setAgencies([]);
        return;
      }

      const ownerIds = [...new Set(rows.map((row) => row.owner_id))];
      const { data: owners, error: ownerError } = await supabase
        .from('profiles')
        .select('id,email,full_name')
        .in('id', ownerIds);
      if (ownerError) throw ownerError;
      const ownerMap = new Map((owners || []).map((owner: any) => [owner.id, owner]));

      const { data: members, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id,user_id,status')
        .in('organization_id', rows.map((row) => row.id));
      if (memberError) throw memberError;
      const memberRows = members || [];
      const memberUserIds = [...new Set(memberRows.map((member: any) => member.user_id))];
      const { data: usage, error: usageError } = memberUserIds.length
        ? await supabase.from('usage_ledger')
          .select('user_id,feature_slug,created_at,outcome')
          .in('user_id', memberUserIds)
          .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
          .order('created_at', { ascending: false })
          .limit(5000)
        : { data: [], error: null };
      if (usageError) throw usageError;

      const memberCounts = new Map<string, { total: number; active: number }>();
      const userToAgency = new Map<string, string>();
      memberRows.forEach((member: any) => {
        const current = memberCounts.get(member.organization_id) || { total: 0, active: 0 };
        current.total += member.status !== 'removed' ? 1 : 0;
        current.active += member.status === 'active' ? 1 : 0;
        memberCounts.set(member.organization_id, current);
        if (member.status === 'active') userToAgency.set(member.user_id, member.organization_id);
      });
      const usageStats = new Map<string, { count: number; last: string | null }>();
      (usage || []).forEach((entry: any) => {
        if (entry.outcome !== 'success') return;
        const orgId = userToAgency.get(entry.user_id);
        if (!orgId) return;
        const current = usageStats.get(orgId) || { count: 0, last: null };
        current.count += 1;
        if (!current.last || entry.created_at > current.last) current.last = entry.created_at;
        usageStats.set(orgId, current);
      });

      setAgencies(rows.map((row) => ({
        ...row,
        owner: ownerMap.get(row.owner_id) as Agency['owner'],
        member_count: memberCounts.get(row.id)?.total || 0,
        active_members: memberCounts.get(row.id)?.active || 0,
        operations_30d: usageStats.get(row.id)?.count || 0,
        last_activity: usageStats.get(row.id)?.last || null,
      })));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load agency accounts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAdmin) void load();
    else if (!authLoading) setLoading(false);
  }, [authLoading, isAdmin, load]);

  useEffect(() => {
    if (!selected) return;
    setTrialEnd(dateInput(selected.settings?.agency_trial?.ends_at));
    setMemberLimit(String(selected.max_members || 10));
    setWorkspacePlan(selected.plan);
    const subscription = (selected.settings?.agency_subscription || {}) as AgencySubscription;
    setSubscriptionStatus(subscription.status || 'pending');
    setSubscriptionAmount(subscription.amount == null ? '' : String(subscription.amount));
    setSubscriptionCurrency(subscription.currency || 'NGN');
    setPaymentReference(subscription.payment_reference || '');
    setSubscriptionEnd(dateInput(subscription.ends_at));
    setSubscriptionNotes(subscription.notes || '');
  }, [selected]);

  const stats = useMemo(() => ({
    total: agencies.length,
    active: agencies.filter((agency) => agency.status === 'active').length,
    suspended: agencies.filter((agency) => agency.status === 'suspended').length,
    trialing: agencies.filter((agency) => getTrial(agency).status === 'trialing' && getTrial(agency).remaining > 0).length,
    expiring: agencies.filter((agency) => getTrial(agency).status === 'trialing' && getTrial(agency).remaining <= 3).length,
  }), [agencies]);

  const visible = useMemo(() => agencies.filter((agency) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [agency.name, agency.owner?.email, agency.owner?.full_name, agency.billing_email].some((value) => value?.toLowerCase().includes(query));
    const matchesStatus = statusFilter === 'all' || agency.status === statusFilter || (statusFilter === 'trialing' && getTrial(agency).status === 'trialing' && getTrial(agency).remaining > 0);
    return matchesSearch && matchesStatus;
  }), [agencies, search, statusFilter]);

  const act = async (action: string, payload: Record<string, unknown> = {}) => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc('admin_manage_agency_workspace', {
        p_org_id: selected.id,
        p_action: action,
        p_payload: payload,
      });
      if (error) throw error;
      if (!data?.success) throw new Error('Agency management action was not confirmed');
      toast.success('Agency account updated');
      await load(true);
      const updated = (await supabase.from('organizations').select('id,name,owner_id,status,plan,max_members,country,industry,billing_email,created_at,settings').eq('id', selected.id).single()).data as unknown as Agency;
      if (updated) setSelected({ ...updated, owner: selected.owner, member_count: selected.member_count, active_members: selected.active_members, operations_30d: selected.operations_30d, last_activity: selected.last_activity });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Agency management action failed');
    } finally {
      setBusy(false);
    }
  };

  const trial = selected ? getTrial(selected) : null;
  const subscription = selected ? (selected.settings?.agency_subscription || {}) as AgencySubscription : null;

  if (authLoading || loading) return <MainLayout><div className="mx-auto max-w-7xl px-4 py-16 text-center text-muted-foreground"><Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />Loading agency accounts…</div></MainLayout>;
  if (!user || !isAdmin || profile?.role !== 'admin') return <MainLayout><div className="mx-auto max-w-xl px-4 py-20 text-center"><ShieldAlert className="mx-auto mb-4 h-10 w-10 text-destructive" /><h1 className="text-2xl font-bold">Administrator access required</h1><p className="mt-2 text-muted-foreground">This area is restricted to authorised AIDetector.cx platform administrators.</p></div></MainLayout>;

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 md:px-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><Badge variant="secondary">Platform administration</Badge><h1 className="mt-3 text-3xl font-bold tracking-tight">Agency management</h1><p className="mt-1 text-sm text-muted-foreground">Manage agency workspaces, trial windows, negotiated contract records and access status.</p></div>
          <Button variant="outline" onClick={() => { setRefreshing(true); void load(true); }} disabled={refreshing}><RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh data</Button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Agency accounts" value={stats.total} icon={Building2} />
          <Metric label="Active workspaces" value={stats.active} icon={CheckCircle2} />
          <Metric label="Active trials" value={stats.trialing} icon={Clock3} />
          <Metric label="Trials ending soon" value={stats.expiring} icon={CalendarClock} />
          <Metric label="Suspended" value={stats.suspended} icon={XCircle} />
        </div>

        <Card>
          <CardHeader><CardTitle>Agency accounts</CardTitle><CardDescription>All registered agency workspaces, owners, team size and recent usage.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search agency, owner or billing email" /></div>
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="sm:w-48"><SelectValue placeholder="Filter status" /></SelectTrigger><SelectContent><SelectItem value="all">All accounts</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="trialing">Trial active</SelectItem></SelectContent></Select>
            </div>
            {visible.length === 0 ? <div className="rounded-lg border border-dashed p-10 text-center"><Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><h3 className="font-semibold">{agencies.length ? 'No matching agencies' : 'No agency workspaces yet'}</h3><p className="mt-1 text-sm text-muted-foreground">{agencies.length ? 'Try a different search or status filter.' : 'Agency workspaces will appear here as customers create them.'}</p></div> : (
              <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b text-muted-foreground"><th className="py-3 pr-4 font-medium">Agency</th><th className="py-3 pr-4 font-medium">Owner</th><th className="py-3 pr-4 font-medium">Workspace</th><th className="py-3 pr-4 font-medium">Trial</th><th className="py-3 pr-4 font-medium">Team</th><th className="py-3 pr-4 font-medium">Operations · 30d</th><th className="py-3 pr-4 font-medium">Created</th><th className="py-3 font-medium">Action</th></tr></thead><tbody>{visible.map((agency) => {
                const agencyTrial = getTrial(agency);
                const paid = agency.settings?.agency_subscription as AgencySubscription | undefined;
                return <tr key={agency.id} className="border-b last:border-0"><td className="py-4 pr-4"><p className="font-medium">{agency.name}</p><p className="text-xs text-muted-foreground">{agency.industry || agency.country || 'Agency workspace'}</p></td><td className="py-4 pr-4"><p>{agency.owner?.full_name || 'Account owner'}</p><p className="text-xs text-muted-foreground">{agency.owner?.email || agency.billing_email || '—'}</p></td><td className="py-4 pr-4"><Badge variant={agency.status === 'active' ? 'default' : 'destructive'}>{agency.status}</Badge><p className="mt-1 text-xs capitalize text-muted-foreground">{agency.plan}</p></td><td className="py-4 pr-4"><p className="capitalize">{agencyTrial.status || 'Not started'}</p><p className="text-xs text-muted-foreground">{agencyTrial.end ? `${agencyTrial.remaining} days left · ${formatDate(agencyTrial.ends_at)}` : '—'}</p></td><td className="py-4 pr-4">{agency.active_members}/{agency.max_members || '—'}</td><td className="py-4 pr-4">{agency.operations_30d}</td><td className="py-4 pr-4">{formatDate(agency.created_at)}</td><td className="py-4"><Button size="sm" variant="outline" onClick={() => setSelected(agency)}>Manage</Button></td></tr>;
              })}</tbody></table></div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selected} onOpenChange={(open) => { if (!open && !busy) setSelected(null); }}>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            {selected && <>
              <DialogHeader><DialogTitle>{selected.name}</DialogTitle><DialogDescription>Owner: {selected.owner?.email || selected.owner_id} · Created {formatDate(selected.created_at)}</DialogDescription></DialogHeader>
              <div className="grid gap-3 sm:grid-cols-3"><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Active team members</p><p className="text-2xl font-bold">{selected.active_members}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Successful tool operations · 30 days</p><p className="text-2xl font-bold">{selected.operations_30d}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Last tool activity</p><p className="text-sm font-semibold">{formatDate(selected.last_activity)}</p></CardContent></Card></div>

              <section className="space-y-3 rounded-lg border p-4"><div><h3 className="font-semibold">Workspace access</h3><p className="text-xs text-muted-foreground">Suspend or reactivate the agency workspace without changing personal account subscriptions.</p></div><div className="flex flex-wrap gap-2">{selected.status === 'suspended' ? <Button onClick={() => void act('activate')} disabled={busy}><CheckCircle2 className="mr-2 h-4 w-4" />Reactivate workspace</Button> : <Button variant="destructive" onClick={() => void act('suspend')} disabled={busy}><XCircle className="mr-2 h-4 w-4" />Suspend workspace</Button>}</div></section>

              <section className="space-y-3 rounded-lg border p-4"><div><h3 className="font-semibold">Workspace configuration</h3><p className="text-xs text-muted-foreground">These are collaboration workspace settings, not tool-credit entitlements.</p></div><div className="grid gap-3 sm:grid-cols-2"><div><Label>Workspace plan</Label><Select value={workspacePlan} onValueChange={(value) => setWorkspacePlan(value as typeof workspacePlan)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="team">Team</SelectItem><SelectItem value="business">Business</SelectItem><SelectItem value="enterprise">Enterprise</SelectItem></SelectContent></Select></div><div><Label>Maximum team members</Label><Input type="number" min="1" max="500" value={memberLimit} onChange={(event) => setMemberLimit(event.target.value)} /></div></div><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={() => void act('set_plan',{plan:workspacePlan})}>Save workspace plan</Button><Button variant="outline" disabled={busy} onClick={() => void act('set_member_limit',{max_members:Number(memberLimit)})}>Save member limit</Button></div></section>

              <section className="space-y-3 rounded-lg border p-4"><div><h3 className="font-semibold">Trial management</h3><p className="text-xs text-muted-foreground">Extend an eligible workspace trial by setting a new end date, or end it immediately.</p></div><div className="flex flex-col gap-2 sm:flex-row sm:items-end"><div className="flex-1"><Label>New trial end date</Label><Input type="date" value={trialEnd} onChange={(event) => setTrialEnd(event.target.value)} /></div><Button variant="outline" disabled={busy || !trialEnd} onClick={() => void act('extend_trial',{ends_at:new Date(`${trialEnd}T23:59:59`).toISOString()})}>Extend trial</Button><Button variant="destructive" disabled={busy || !trial || !trial.status || trial.status === 'expired'} onClick={() => void act('end_trial')}>End trial</Button></div><p className="text-xs text-muted-foreground">Current trial: {trial?.status || 'Not started'} · Ends {formatDate(trial?.ends_at)}</p></section>

              <section className="space-y-3 rounded-lg border p-4"><div><h3 className="font-semibold">Negotiated agency contract</h3><p className="text-xs text-muted-foreground">Record the agreed monthly unlimited-access contract. Confirm payment in Paystack before setting the status to Active. This record does not itself alter product entitlements or issue credits.</p></div><div className="grid gap-3 sm:grid-cols-2"><div><Label>Contract status</Label><Select value={subscriptionStatus} onValueChange={setSubscriptionStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['pending','active','paused','cancelled','expired'].map((status) => <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>)}</SelectContent></Select></div><div><Label>Agreed monthly price</Label><Input type="number" min="0" step="0.01" value={subscriptionAmount} onChange={(event) => setSubscriptionAmount(event.target.value)} placeholder="Negotiated amount" /></div><div><Label>Currency</Label><Select value={subscriptionCurrency} onValueChange={setSubscriptionCurrency}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NGN">NGN</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="GBP">GBP</SelectItem></SelectContent></Select></div><div><Label>Contract end date</Label><Input type="date" value={subscriptionEnd} onChange={(event) => setSubscriptionEnd(event.target.value)} /></div><div className="sm:col-span-2"><Label>Paystack payment reference (required for Active)</Label><Input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Verified Paystack reference" /></div><div className="sm:col-span-2"><Label>Admin notes</Label><Textarea value={subscriptionNotes} onChange={(event) => setSubscriptionNotes(event.target.value)} placeholder="Agreed scope, negotiated price or renewal notes" /></div></div><Button disabled={busy || (subscriptionStatus === 'active' && (!paymentReference.trim() || !subscriptionEnd))} onClick={() => void act('set_subscription',{status:subscriptionStatus,plan:'agency_unlimited_monthly',billing_cycle:'monthly',amount:subscriptionAmount || '',currency:subscriptionCurrency,payment_reference:paymentReference,ends_at:subscriptionEnd ? new Date(`${subscriptionEnd}T23:59:59`).toISOString() : '',notes:subscriptionNotes})}><CreditCard className="mr-2 h-4 w-4" />Save contract record</Button>{subscription?.status && <p className="text-xs text-muted-foreground">Saved contract: {subscription.status} · {formatMoney(subscription.amount,subscription.currency)} · Ends {formatDate(subscription.ends_at)}</p>}</section>

              <DialogFooter><Button variant="outline" onClick={() => setSelected(null)} disabled={busy}>Close</Button></DialogFooter>
            </>}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return <Card><CardContent className="flex items-center gap-3 p-5"><div className="rounded-xl bg-primary/10 p-3"><Icon className="h-5 w-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold tabular-nums">{value}</p></div></CardContent></Card>;
}
