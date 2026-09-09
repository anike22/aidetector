import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getOrganizationMembers, inviteOrganizationMember, removeOrganizationMember, updateOrganizationMember } from '@/lib/teamApi';
import type { OrganizationMember, OrganizationRole } from '@/types/team';

export default function OrganizationMembersTab({ organizationId }: { organizationId: string }) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrganizationRole>('member');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const data = await getOrganizationMembers(organizationId);
    setMembers(data);
  };

  useEffect(() => { load(); }, [organizationId]);

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

  const updateRole = async (memberId: string, newRole: OrganizationRole) => {
    try {
      await updateOrganizationMember(memberId, { role: newRole });
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    }
  };

  const remove = async (memberId: string) => {
    try {
      await removeOrganizationMember(memberId);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Members</CardTitle>
        <CardDescription>Invite and manage organization members.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={invite} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-0">
            <Label htmlFor="invite-email" className="sr-only">Email</Label>
            <Input id="invite-email" type="email" placeholder="colleague@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Select value={role} onValueChange={(v) => setRole(v as OrganizationRole)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={loading} className="shrink-0">Invite</Button>
        </form>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left font-medium">User</th>
                <th className="px-4 py-2 text-left font-medium">Role</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">{m.user?.display_name || m.user?.email}</div>
                    <div className="text-xs text-muted-foreground">{m.user?.email}</div>
                  </td>
                  <td className="px-4 py-3 capitalize">{m.role}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{m.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Select value={m.role} onValueChange={(v) => updateRole(m.id, v as OrganizationRole)}>
                        <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={() => remove(m.id)}>Remove</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No members yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
