import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { getOrganizationMembers } from '@/lib/teamApi';
import { getTeams, createTeam, updateTeam, deleteTeam, getDepartments } from '@/lib/enterpriseApi';
import type { Team } from '@/types/enterprise';
import type { Department } from '@/types/enterprise';
import type { OrganizationMember } from '@/types/team';
import { Pencil, Trash2, UsersRound } from 'lucide-react';
import EmptyState from './EmptyState';

export default function OrganizationTeamsTab({ organizationId }: { organizationId: string }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [leadId, setLeadId] = useState('');

  const load = async () => {
    const [t, d, m] = await Promise.all([getTeams(organizationId), getDepartments(organizationId), getOrganizationMembers(organizationId)]);
    setTeams(t);
    setDepartments(d);
    setMembers(m);
  };

  useEffect(() => { load(); }, [organizationId]);

  useEffect(() => {
    const channel = supabase
      .channel(`org-teams-${organizationId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams', filter: `organization_id=eq.${organizationId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organizationId]);

  const reset = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setDepartmentId('');
    setLeadId('');
    setOpen(false);
  };

  const save = async () => {
    try {
      const payload: Partial<Team> = {
        name,
        description,
        department_id: departmentId || undefined,
        lead_user_id: leadId || undefined,
      };
      if (editing) await updateTeam(editing.id, payload);
      else await createTeam(organizationId, payload);
      toast.success(editing ? 'Team updated' : 'Team created');
      reset();
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save team');
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteTeam(id);
      toast.success('Team deleted');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete team');
    }
  };

  const startEdit = (t: Team) => {
    setEditing(t);
    setName(t.name);
    setDescription(t.description || '');
    setDepartmentId(t.department_id || '');
    setLeadId(t.lead_user_id || '');
    setOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Teams</CardTitle>
            <CardDescription>Manage teams and assign them to departments.</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => reset()}>Create team</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
              <DialogHeader><DialogTitle>{editing ? 'Edit team' : 'Create team'}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={departmentId || 'all'} onValueChange={(v) => setDepartmentId(v === 'all' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">None</SelectItem>
                      {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Lead</Label>
                  <Select value={leadId || 'all'} onValueChange={(v) => setLeadId(v === 'all' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">None</SelectItem>
                      {members.map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.user?.display_name || m.user?.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={save} disabled={!name.trim()}>{editing ? 'Save changes' : 'Create'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Name</th>
                <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Department</th>
                <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Lead</th>
                <th className="px-4 py-2 text-right font-medium whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-medium">{t.name}</div>
                    {t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{t.department?.name || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{t.lead?.display_name || t.lead?.email || '—'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(t)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {teams.length === 0 && (
                <tr><td colSpan={4}>
                  <EmptyState
                    icon={UsersRound}
                    title="No teams yet"
                    description="Create your first team to group members and assign department ownership."
                    actionLabel="Create team"
                    onAction={() => { reset(); setOpen(true); }}
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
