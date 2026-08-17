import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getWorkspaceWorkflows, createWorkflow, updateWorkflow, deleteWorkflow } from '@/lib/teamApi';
import type { ApprovalWorkflow, WorkflowTrigger, WorkspaceRole } from '@/types/team';

const TRIGGERS: WorkflowTrigger[] = ['manual', 'auto_high_ai_score', 'auto_public_content'];
const ROLES: WorkspaceRole[] = ['admin', 'manager', 'editor', 'contributor', 'viewer'];

export default function WorkspaceWorkflowsTab({ workspaceId }: { workspaceId: string }) {
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<WorkflowTrigger>('manual');
  const [steps, setSteps] = useState<{ step_order: number; approver_role?: WorkspaceRole }[]>([{ step_order: 1, approver_role: 'manager' }]);

  const load = async () => {
    const data = await getWorkspaceWorkflows(workspaceId);
    setWorkflows(data);
  };

  useEffect(() => { load(); }, [workspaceId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createWorkflow(workspaceId, { name: name.trim(), steps: steps as any, trigger_condition: trigger });
      toast.success('Workflow created');
      setName('');
      setSteps([{ step_order: 1, approver_role: 'manager' }]);
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create workflow');
    }
  };

  const toggle = async (id: string, enabled: boolean) => {
    try {
      await updateWorkflow(id, { enabled });
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update workflow');
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteWorkflow(id);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="text-base font-medium">Approval workflows</CardTitle>
          <CardDescription>Define review pipelines for reports and content.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New workflow</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
            <DialogHeader><DialogTitle>Create approval workflow</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="w-name">Workflow name</Label>
                <Input id="w-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Trigger</Label>
                <Select value={trigger} onValueChange={(v) => setTrigger(v as WorkflowTrigger)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGERS.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Steps</Label>
                {steps.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-6">{s.step_order}.</span>
                    <Select value={s.approver_role} onValueChange={(v) => {
                      const next = [...steps];
                      next[idx].approver_role = v as WorkspaceRole;
                      setSteps(next);
                    }}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setSteps(steps.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setSteps([...steps, { step_order: steps.length + 1, approver_role: 'manager' }])}>Add step</Button>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {workflows.map((w) => (
            <div key={w.id} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">{w.name}</p>
                <div className="flex items-center gap-2">
                  <Switch checked={w.enabled} onCheckedChange={(v) => toggle(w.id, v)} />
                  <Button variant="ghost" size="icon" onClick={() => remove(w.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="capitalize">{w.trigger_condition.replace(/_/g, ' ')}</Badge>
                <span>{w.steps.length} step{w.steps.length === 1 ? '' : 's'}</span>
              </div>
            </div>
          ))}
          {workflows.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No workflows yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
