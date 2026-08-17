import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getWorkspaceMembers, addWorkspaceMember, removeWorkspaceMember, updateWorkspaceMember, searchUsersByEmail } from '@/lib/teamApi';
import type { WorkspaceMember, WorkspaceRole } from '@/types/team';

const ROLES: WorkspaceRole[] = ['admin', 'manager', 'editor', 'contributor', 'viewer'];

export default function WorkspaceMembersTab({ workspaceId }: { workspaceId: string }) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('contributor');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const data = await getWorkspaceMembers(workspaceId);
    setMembers(data);
  };

  useEffect(() => { load(); }, [workspaceId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const users = await searchUsersByEmail(email.trim());
      if (users.length === 0) {
        toast.error('No user found with that email');
        return;
      }
      await addWorkspaceMember(workspaceId, users[0].id, role);
      toast.success('Member added');
      setEmail('');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  const updateRole = async (memberId: string, newRole: WorkspaceRole) => {
    try {
      await updateWorkspaceMember(memberId, { role: newRole });
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    }
  };

  const remove = async (memberId: string) => {
    try {
      await removeWorkspaceMember(memberId);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Workspace members</CardTitle>
        <CardDescription>Add members from your organization.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={add} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-0">
            <Label htmlFor="ws-email" className="sr-only">Email</Label>
            <Input id="ws-email" type="email" placeholder="colleague@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Select value={role} onValueChange={(v) => setRole(v as WorkspaceRole)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={submitting} className="shrink-0">Add</Button>
        </form>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left font-medium">User</th>
                <th className="px-4 py-2 text-left font-medium">Role</th>
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
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Select value={m.role} onValueChange={(v) => updateRole(m.id, v as WorkspaceRole)}>
                        <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={() => remove(m.id)}>Remove</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {members.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">No workspace members yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
