import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  getOrganizationMembers,
  inviteOrganizationMember,
  removeOrganizationMember,
  updateOrganizationMember,
  suspendOrganizationMember,
  restoreOrganizationMember,
  transferOrganizationOwnership,
  bulkInviteOrganizationMembers,
  changeMemberDepartment,
  changeMemberTeam,
  getOrganizationDepartments,
  getOrganizationTeams,
} from '@/lib/teamApi';
import { getMemberLoginHistory, forceLogoutMember } from '@/lib/enterpriseApi';
import type { OrganizationMember, OrganizationRole } from '@/types/team';
import { Search, History, LogOut, UserCog } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ROLES: OrganizationRole[] = [
  'owner',
  'super_admin',
  'admin',
  'manager',
  'team_lead',
  'editor',
  'reviewer',
  'analyst',
  'billing_manager',
  'api_manager',
  'support',
  'member',
  'viewer',
  'guest',
];

export default function OrganizationMembersTab({ organizationId }: { organizationId: string }) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrganizationRole>('member');
  const [bulkText, setBulkText] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const load = async () => {
    const [data, deps, tms] = await Promise.all([
      getOrganizationMembers(organizationId),
      getOrganizationDepartments(organizationId),
      getOrganizationTeams(organizationId),
    ]);
    setMembers(data);
    setDepartments(deps);
    setTeams(tms);
  };

  useEffect(() => { load(); }, [organizationId]);

  useEffect(() => {
    const channel = supabase
      .channel(`org-members-${organizationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'organization_members', filter: `organization_id=eq.${organizationId}` },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organizationId]);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase();
      const text = `${m.user?.full_name || ''} ${m.user?.email || ''} ${m.department_names?.join(' ') || ''} ${m.team_names?.join(' ') || ''}`.toLowerCase();
      const matchesSearch = !q || text.includes(q);
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [members, search, statusFilter]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await inviteOrganizationMember(organizationId, email.trim(), role);
      toast.success('Invitation sent');
      setEmail('');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to invite');
    } finally {
      setLoading(false);
    }
  };

  const bulkInvite = async () => {
    const lines = bulkText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setLoading(true);
    try {
      await bulkInviteOrganizationMembers(
        organizationId,
        lines.map((line) => {
          const [addr, r = 'member'] = line.split(':').map((s) => s.trim());
          return { email: addr, role: r as OrganizationRole };
        })
      );
      toast.success(`Invited ${lines.length} members`);
      setBulkText('');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Bulk invite failed');
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (memberId: string, newRole: OrganizationRole) => {
    try {
      await updateOrganizationMember(memberId, { role: newRole });
      toast.success('Role updated');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    }
  };

  const updateDepartment = async (memberId: string, departmentId: string) => {
    try {
      await changeMemberDepartment(memberId, departmentId === 'none' ? undefined : departmentId);
      toast.success('Department updated');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update department');
    }
  };

  const updateTeam = async (memberId: string, teamId: string) => {
    try {
      await changeMemberTeam(memberId, teamId === 'none' ? undefined : teamId);
      toast.success('Team updated');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update team');
    }
  };

  const toggleSuspend = async (member: OrganizationMember) => {
    try {
      if (member.status === 'suspended') await restoreOrganizationMember(member.id);
      else await suspendOrganizationMember(member.id);
      toast.success('Member status updated');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const remove = async (memberId: string) => {
    try {
      await removeOrganizationMember(memberId);
      toast.success('Member removed');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  const forceLogout = async (member: OrganizationMember) => {
    try {
      await forceLogoutMember(member.user_id);
      toast.success('Member logged out from all sessions');
    } catch (err: any) {
      toast.error(err.message || 'Failed to force logout');
    }
  };

  const viewHistory = async (member: OrganizationMember) => {
    setSelectedMember(member);
    setHistoryOpen(true);
    try {
      const history = await getMemberLoginHistory(member.user_id, 20);
      setLoginHistory(history);
    } catch (err: any) {
      setLoginHistory([]);
    }
  };

  const transfer = async (member: OrganizationMember) => {
    try {
      await transferOrganizationOwnership(organizationId, member.user_id);
      toast.success('Ownership transferred');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to transfer ownership');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Members</CardTitle>
        <CardDescription>Invite, manage, and assign roles to organization members.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={invite} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-0">
            <Label htmlFor="invite-email" className="sr-only">Email</Label>
            <Input id="invite-email" type="email" placeholder="colleague@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Select value={role} onValueChange={(v) => setRole(v as OrganizationRole)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={loading} className="shrink-0">Invite</Button>
        </form>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Bulk invite</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
            <DialogHeader><DialogTitle>Bulk invite</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Enter one email per line, optionally with role separated by colon (e.g. user@example.com:manager).</p>
              <Textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={8} />
              <Button onClick={bulkInvite} disabled={loading}>Send invitations</Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search members, departments, teams..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="invited">Invited</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left font-medium whitespace-nowrap">User</th>
                <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Role</th>
                <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Department</th>
                <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Team</th>
                <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Status</th>
                <th className="px-4 py-2 text-right font-medium whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-medium">{m.user?.full_name || m.user?.email}</div>
                    <div className="text-xs text-muted-foreground">{m.user?.email}</div>
                    {m.last_login_at && (
                      <div className="text-xs text-muted-foreground">Last login {formatDistanceToNow(new Date(m.last_login_at), { addSuffix: true })}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize whitespace-nowrap">{m.role.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{m.department_names?.join(', ') || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{m.team_names?.join(', ') || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><Badge variant="outline" className="capitalize">{m.status}</Badge></td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Select value={m.role} onValueChange={(v) => updateRole(m.id, v as OrganizationRole)}>
                        <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r.replace(/_/g, ' ')}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={m.department_ids?.[0] || 'none'} onValueChange={(v) => updateDepartment(m.id, v)}>
                        <SelectTrigger className="w-32 h-8" title="Department"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No department</SelectItem>
                          {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={m.team_ids?.[0] || 'none'} onValueChange={(v) => updateTeam(m.id, v)}>
                        <SelectTrigger className="w-32 h-8" title="Team"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No team</SelectItem>
                          {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={() => toggleSuspend(m)}>{m.status === 'suspended' ? 'Restore' : 'Suspend'}</Button>
                      <Button variant="outline" size="sm" onClick={() => forceLogout(m)}><LogOut className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => viewHistory(m)}><History className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => transfer(m)}><UserCog className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => remove(m.id)}>Remove</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No members found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>Login history: {selectedMember?.user?.full_name || selectedMember?.user?.email}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {loginHistory.map((h) => (
              <div key={h.id} className="flex justify-between text-sm border-b py-2">
                <span className="text-muted-foreground">{formatDistanceToNow(new Date(h.created_at), { addSuffix: true })}</span>
                <span className="font-medium truncate max-w-[50%]">{h.ip_address || 'Unknown IP'}</span>
              </div>
            ))}
            {loginHistory.length === 0 && <p className="text-sm text-muted-foreground">No login history available.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
