import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import {
  getOrganizationInvitations,
  sendOrganizationInvitation,
  resendOrganizationInvitation,
  revokeOrganizationInvitation,
  extendOrganizationInvitation,
} from '@/lib/enterpriseApi';
import { getOrganizationDepartments, getOrganizationTeams, getOrganizationWorkspaces } from '@/lib/teamApi';
import type { OrganizationInvitation } from '@/types/enterprise';
import type { OrganizationRole, Workspace } from '@/types/team';
import { formatDistanceToNow } from 'date-fns';
import { Mail, RefreshCw, X, CalendarClock, History, MailOpen } from 'lucide-react';
import EmptyState from './EmptyState';

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

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  delivered: 'bg-blue-100 text-blue-800',
  opened: 'bg-purple-100 text-purple-800',
  accepted: 'bg-green-100 text-green-800',
  declined: 'bg-gray-100 text-gray-800',
  expired: 'bg-orange-100 text-orange-800',
  revoked: 'bg-red-100 text-red-800',
  failed: 'bg-destructive/10 text-destructive',
  resent: 'bg-primary/10 text-primary',
};

export default function OrganizationInvitationsTab({ organizationId }: { organizationId: string }) {
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrganizationRole>('member');
  const [departmentId, setDepartmentId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try {
      const [inv, deps, tms, wss] = await Promise.all([
        getOrganizationInvitations(organizationId, filter === 'all' ? undefined : filter),
        getOrganizationDepartments(organizationId),
        getOrganizationTeams(organizationId),
        getOrganizationWorkspaces(organizationId),
      ]);
      setInvitations(inv);
      setDepartments(deps);
      setTeams(tms);
      setWorkspaces(wss);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load invitations');
    }
  };

  useEffect(() => {
    load();
  }, [organizationId, filter]);

  useEffect(() => {
    const channel = supabase
      .channel(`org-invitations-${organizationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'organization_invitations', filter: `organization_id=eq.${organizationId}` },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organizationId]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await sendOrganizationInvitation({
        organization_id: organizationId,
        invitee_email: email.trim(),
        role,
        department_id: departmentId || undefined,
        team_id: teamId || undefined,
        workspace_id: workspaceId || undefined,
        message: message || undefined,
      });
      toast.success('Invitation sent');
      setEmail('');
      setMessage('');
      setDepartmentId('');
      setTeamId('');
      setWorkspaceId('');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const resend = async (inv: OrganizationInvitation) => {
    try {
      await resendOrganizationInvitation(organizationId, inv.id);
      toast.success('Invitation resent');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend invitation');
    }
  };

  const revoke = async (inv: OrganizationInvitation) => {
    try {
      await revokeOrganizationInvitation(organizationId, inv.id);
      toast.success('Invitation revoked');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke invitation');
    }
  };

  const extend = async (inv: OrganizationInvitation) => {
    try {
      await extendOrganizationInvitation(organizationId, inv.id, 7);
      toast.success('Invitation extended by 7 days');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to extend invitation');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Invitations</CardTitle>
        <CardDescription>Invite new members and manage pending invitations.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={invite} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as OrganizationRole)}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">
                      {r.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Workspace</Label>
              <Select value={workspaceId} onValueChange={setWorkspaceId}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {workspaces.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="invite-message">Personal message (optional)</Label>
              <Textarea
                id="invite-message"
                placeholder="Add a short note..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <Button type="submit" disabled={loading}>
            <Mail className="h-4 w-4 mr-2" />
            Send invitation
          </Button>
        </form>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Invitation history</h3>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="opened">Opened</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Email</th>
                <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Role</th>
                <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Status</th>
                <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Sent</th>
                <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Expires</th>
                <th className="px-4 py-2 text-right font-medium whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => (
                <tr key={inv.id} className="border-t">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>{inv.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {inv.department_name && `Dept: ${inv.department_name}`}
                      {inv.team_name && ` • Team: ${inv.team_name}`}
                      {inv.workspace_name && ` • Workspace: ${inv.workspace_name}`}
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize whitespace-nowrap">{inv.role.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge className={STATUS_COLORS[inv.status] || 'bg-muted'}>{inv.status}</Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {formatDistanceToNow(new Date(inv.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {formatDistanceToNow(new Date(inv.expires_at), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {['pending', 'delivered', 'opened', 'resent', 'failed'].includes(inv.status) && (
                        <Button variant="ghost" size="icon" onClick={() => resend(inv)} title="Resend">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      {['pending', 'delivered', 'opened', 'resent', 'failed'].includes(inv.status) && (
                        <Button variant="ghost" size="icon" onClick={() => extend(inv)} title="Extend">
                          <CalendarClock className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => revoke(inv)} title="Revoke">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {invitations.length === 0 && (
                <tr><td colSpan={6}>
                  <EmptyState
                    icon={MailOpen}
                    title="No invitations yet"
                    description="Invite your first member by email and assign a role, department, team, or workspace."
                  />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
