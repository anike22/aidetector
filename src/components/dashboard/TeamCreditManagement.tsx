import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Coins,
  UserPlus,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  Layers,
  Shield,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getTeamCreditSummary,
  allocateTeamMemberCredits,
  removeTeamMember,
  type TeamCreditSummary,
} from '@/lib/entitlementsApi';

export function TeamCreditManagement() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<TeamCreditSummary | null>(null);

  // Form states
  const [showAddMember, setShowAddMember] = useState(false);
  const [email, setEmail] = useState('');
  const [seatName, setSeatName] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [allocatedCredits, setAllocatedCredits] = useState('500');
  const [submitting, setSubmitting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuota, setEditQuota] = useState('');

  const fetchSummary = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getTeamCreditSummary();
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to fetch team summary:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid member email address.');
      return;
    }

    const quotaNum = parseInt(allocatedCredits, 10);
    if (isNaN(quotaNum) || quotaNum < 0) {
      toast.error('Please enter a valid credit sub-quota.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await allocateTeamMemberCredits(email.trim(), quotaNum, seatName.trim() || undefined, role);
      if (!res.success) {
        toast.error(res.error || 'Failed to allocate team member credits.');
        return;
      }

      toast.success(`Allocated ${quotaNum} credits to ${email.trim()}`);
      setEmail('');
      setSeatName('');
      setAllocatedCredits('500');
      setShowAddMember(false);
      await fetchSummary(true);
    } catch (err: any) {
      toast.error(err.message || 'Error updating allocation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickUpdateQuota = async (memberEmail: string, currentSeatName?: string, currentRole?: string) => {
    const quotaNum = parseInt(editQuota, 10);
    if (isNaN(quotaNum) || quotaNum < 0) {
      toast.error('Please enter a valid positive number');
      return;
    }

    try {
      const res = await allocateTeamMemberCredits(memberEmail, quotaNum, currentSeatName, currentRole);
      if (!res.success) {
        toast.error(res.error || 'Failed to update quota.');
        return;
      }
      toast.success('Member sub-quota updated.');
      setEditingId(null);
      await fetchSummary(true);
    } catch (err: any) {
      toast.error(err.message || 'Error updating quota');
    }
  };

  const handleRemove = async (allocId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from this team? Their unused quota will return to the team pool.`)) {
      return;
    }

    try {
      const res = await removeTeamMember(allocId);
      if (!res.success) {
        toast.error(res.error || 'Failed to remove team member.');
        return;
      }
      toast.success(`Removed ${memberEmail}. Unused credits restored to shared pool.`);
      await fetchSummary(true);
    } catch (err: any) {
      toast.error(err.message || 'Error removing member');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-card rounded-xl border border-border">
        <Loader2 className="w-6 h-6 animate-spin text-primary mr-3" />
        <span className="text-muted-foreground text-sm font-medium">Loading team credit pool...</span>
      </div>
    );
  }

  // 1. Member View (when user is a seat in a Business/Enterprise team)
  if (summary && summary.is_team_account && !summary.is_owner) {
    const allocated = summary.allocated_credits || 0;
    const consumed = summary.consumed_credits || 0;
    const remaining = summary.remaining_credits || 0;
    const pct = allocated > 0 ? Math.min(100, Math.round((consumed / allocated) * 100)) : 0;

    return (
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Team Member Credit Allocation
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Your account is attached to a {summary.plan?.toUpperCase()} shared team plan.
            </p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Seat: {summary.seat_name || 'Active Member'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-xs text-muted-foreground font-medium">Allocated Sub-Quota</span>
              <p className="text-2xl font-bold text-foreground mt-1">{allocated.toLocaleString()} Credits</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/40 border border-border/60">
              <span className="text-xs text-muted-foreground font-medium">Credits Consumed</span>
              <p className="text-2xl font-bold text-foreground mt-1">{consumed.toLocaleString()} Credits</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-xs text-primary font-medium">Remaining Sub-Quota</span>
              <p className="text-2xl font-bold text-primary mt-1">{remaining.toLocaleString()} Credits</p>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>Quota Consumption ({pct}%)</span>
              <span>{remaining} credits remaining in current cycle</span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>

          {remaining <= 10 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Your team sub-quota is almost exhausted. Contact your team administrator to request additional credits.</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // 2. Non-Business/Enterprise Owner view
  if (!summary || !summary.is_team_account) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Team Credit Allocation
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Multi-seat sub-quota allocations and team usage tracking are available exclusively on Business and Enterprise plans.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-5 rounded-xl bg-muted/30 border border-dashed border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 justify-center md:justify-start">
                <Sparkles className="w-4 h-4 text-primary" />
                Upgrade to Business ($79/mo) or Enterprise
              </h4>
              <p className="text-xs text-muted-foreground max-w-md">
                Get a 3,000+ credit monthly pool, 5+ included team seats, custom sub-quota allocations per member, and audit logging.
              </p>
            </div>
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shrink-0">
              <a href="/pricing">Upgrade Plan</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 3. Business / Enterprise Owner Management View
  const totalPool = summary.total_pool || 0;
  const totalAllocated = summary.total_allocated || 0;
  const totalConsumed = summary.total_consumed || 0;
  const unallocated = summary.unallocated_pool || 0;
  const allocations = summary.allocations || [];

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Team Credit Pool & Seat Management
            </CardTitle>
            <Badge className="bg-primary/10 text-primary border-primary/20 uppercase text-[10px] font-bold tracking-wider">
              {summary.plan}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Allocate monthly sub-quotas to your team members and track their consumption against your shared credit pool.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSummary(true)}
            disabled={refreshing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAddMember(!showAddMember)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Member Seat
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Pool Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-lg bg-muted/40 border border-border">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-primary" />
              Total Shared Pool
            </span>
            <p className="text-xl font-bold text-foreground mt-1">{totalPool.toLocaleString()}</p>
          </div>
          <div className="p-3.5 rounded-lg bg-muted/40 border border-border">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              Allocated Quotas
            </span>
            <p className="text-xl font-bold text-foreground mt-1">{totalAllocated.toLocaleString()}</p>
          </div>
          <div className="p-3.5 rounded-lg bg-muted/40 border border-border">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-500" />
              Team Consumed
            </span>
            <p className="text-xl font-bold text-foreground mt-1">{totalConsumed.toLocaleString()}</p>
          </div>
          <div className="p-3.5 rounded-lg bg-primary/10 border border-primary/20">
            <span className="text-xs text-primary font-medium flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              Unallocated Pool
            </span>
            <p className="text-xl font-bold text-primary mt-1">{unallocated.toLocaleString()}</p>
          </div>
        </div>

        {/* Add Member Form */}
        {showAddMember && (
          <form onSubmit={handleAddOrUpdate} className="p-4 rounded-xl bg-muted/30 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-primary" />
                Allocate Team Member Seat
              </h4>
              <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddMember(false)} className="text-xs h-7">
                Cancel
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Member Email</Label>
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-8 text-xs mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Seat / Name</Label>
                <Input
                  type="text"
                  placeholder="e.g. Content Lead"
                  value={seatName}
                  onChange={(e) => setSeatName(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Role</Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full h-8 px-2 text-xs rounded-md border border-input bg-background mt-1"
                >
                  <option value="member">Member</option>
                  <option value="admin">Team Admin</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Sub-Quota (Credits)</Label>
                <Input
                  type="number"
                  min="0"
                  max={unallocated}
                  placeholder="500"
                  value={allocatedCredits}
                  onChange={(e) => setAllocatedCredits(e.target.value)}
                  className="h-8 text-xs mt-1"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="submit" size="sm" disabled={submitting} className="bg-primary hover:bg-primary/90 text-xs">
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
                Confirm Allocation
              </Button>
            </div>
          </form>
        )}

        {/* Member Seats Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Active Team Seats ({allocations.length})</h4>
            <span className="text-xs text-muted-foreground">{unallocated.toLocaleString()} credits available to allocate</span>
          </div>

          <div className="overflow-x-auto w-full max-w-full bg-card rounded-lg border border-border">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-muted-foreground bg-muted/50 uppercase border-b border-border">
                <tr>
                  <th className="px-4 py-2.5 font-semibold whitespace-nowrap">Member / Seat</th>
                  <th className="px-4 py-2.5 font-semibold whitespace-nowrap">Role</th>
                  <th className="px-4 py-2.5 font-semibold whitespace-nowrap">Quota</th>
                  <th className="px-4 py-2.5 font-semibold whitespace-nowrap">Consumed</th>
                  <th className="px-4 py-2.5 font-semibold whitespace-nowrap">Remaining</th>
                  <th className="px-4 py-2.5 font-semibold whitespace-nowrap">Usage</th>
                  <th className="px-4 py-2.5 font-semibold text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allocations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                      No team members allocated yet. Click <strong>"Add Member Seat"</strong> above to distribute sub-quotas to your team.
                    </td>
                  </tr>
                ) : (
                  allocations.map((item) => {
                    const allocated = item.allocated_credits || 0;
                    const consumed = item.consumed_credits || 0;
                    const rem = Math.max(0, allocated - consumed);
                    const pct = allocated > 0 ? Math.min(100, Math.round((consumed / allocated) * 100)) : 0;
                    const isEditing = editingId === item.id;

                    return (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-foreground">{item.seat_name || item.member_email}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">{item.member_email}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {item.role || 'member'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <Input
                                type="number"
                                className="w-20 h-7 text-xs"
                                value={editQuota}
                                onChange={(e) => setEditQuota(e.target.value)}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => handleQuickUpdateQuota(item.member_email, item.seat_name || undefined, item.role)}
                              >
                                <Check className="w-3.5 h-3.5 text-primary" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-foreground">{allocated.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {consumed.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-semibold text-primary">
                          {rem.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-1.5 flex-1" />
                            <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                if (isEditing) {
                                  setEditingId(null);
                                } else {
                                  setEditingId(item.id);
                                  setEditQuota(String(allocated));
                                }
                              }}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemove(item.id, item.member_email)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
export default TeamCreditManagement;
