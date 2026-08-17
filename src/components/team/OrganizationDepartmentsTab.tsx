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
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/lib/enterpriseApi';
import type { Department } from '@/types/enterprise';
import type { OrganizationMember } from '@/types/team';
import { Pencil, Trash2, Building2 } from 'lucide-react';
import EmptyState from './EmptyState';

export default function OrganizationDepartmentsTab({ organizationId }: { organizationId: string }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [managerId, setManagerId] = useState('');

  const load = async () => {
    const [d, m] = await Promise.all([getDepartments(organizationId), getOrganizationMembers(organizationId)]);
    setDepartments(d);
    setMembers(m);
  };

  useEffect(() => { load(); }, [organizationId]);

  useEffect(() => {
    const channel = supabase
      .channel(`org-departments-${organizationId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departments', filter: `organization_id=eq.${organizationId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organizationId]);

  const reset = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setParentId('');
    setManagerId('');
    setOpen(false);
  };

  const save = async () => {
    try {
      const payload: Partial<Department> = {
        name,
        description,
        parent_department_id: parentId || undefined,
        manager_user_id: managerId || undefined,
      };
      if (editing) await updateDepartment(editing.id, payload);
      else await createDepartment(organizationId, payload);
      toast.success(editing ? 'Department updated' : 'Department created');
      reset();
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save department');
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteDepartment(id);
      toast.success('Department deleted');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete department');
    }
  };

  const startEdit = (d: Department) => {
    setEditing(d);
    setName(d.name);
    setDescription(d.description || '');
    setParentId(d.parent_department_id || '');
    setManagerId(d.manager_user_id || '');
    setOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Departments</CardTitle>
            <CardDescription>Manage organizational departments and hierarchy.</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => reset()}>Create department</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
              <DialogHeader><DialogTitle>{editing ? 'Edit department' : 'Create department'}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                <div className="space-y-2">
                  <Label>Parent department</Label>
                  <Select value={parentId || 'all'} onValueChange={(v) => setParentId(v === 'all' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">None</SelectItem>
                      {departments.filter((d) => d.id !== editing?.id).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Manager</Label>
                  <Select value={managerId || 'all'} onValueChange={(v) => setManagerId(v === 'all' ? '' : v)}>
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
                <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Parent</th>
                <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Manager</th>
                <th className="px-4 py-2 text-right font-medium whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-medium">{d.name}</div>
                    {d.description && <div className="text-xs text-muted-foreground">{d.description}</div>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{d.parent?.name || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{d.manager?.display_name || d.manager?.email || '—'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(d)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(d.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr><td colSpan={4}>
                  <EmptyState
                    icon={Building2}
                    title="No departments yet"
                    description="Create your first department to build the organizational hierarchy."
                    actionLabel="Create department"
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
