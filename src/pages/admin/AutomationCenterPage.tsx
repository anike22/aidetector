import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WorkflowBuilder, validateDefinition } from '@/components/automation/WorkflowBuilder';
import {
  createWorkflow,
  createWorkflowFromTemplate,
  deleteWorkflow,
  listTemplates,
  listWorkflows,
  publishWorkflowVersion,
  updateWorkflow,
} from '@/lib/automationApi';
import type {
  AutomationTemplate,
  AutomationWorkflow,
  WorkflowDefinition,
  WorkflowStatus,
} from '@/types/automation';
import { Plus, LayoutList, Save, Trash2, Play, Pause, Copy, Bot } from 'lucide-react';

const TRIGGER_OPTIONS = [
  'user_registered',
  'first_scan',
  'detector_use',
  'humanizer_use',
  'plagiarism_check',
  'api_request',
  'trial_started',
  'subscription_renewal_due',
  'payment_failed',
  'days_inactive_7',
  'days_inactive_30',
  'weekly_digest',
  'lifecycle_stage_changed',
  'feature_released',
  'manual',
];

export default function AutomationCenterPage() {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AutomationWorkflow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [definition, setDefinition] = useState<WorkflowDefinition>({ nodes: [], edges: [] });
  const [errors, setErrors] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [wfs, tpls] = await Promise.all([listWorkflows(), listTemplates()]);
      setWorkflows(wfs);
      setTemplates(tpls);
    } catch (e) {
      toast.error('Failed to load automation center');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (wf: AutomationWorkflow) => {
    setEditing(wf);
    setDefinition(wf.workflow_definition || { nodes: [], edges: [] });
    setErrors([]);
  };

  const handleDefinitionChange = (def: WorkflowDefinition) => {
    setDefinition(def);
    setErrors(validateDefinition(def));
  };

  const handleSave = async (publish = false) => {
    if (!editing) return;
    const validationErrors = validateDefinition(definition);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix workflow errors before saving.');
      return;
    }

    try {
      await updateWorkflow(editing.id, {
        name: editing.name,
        description: editing.description,
        trigger_type: editing.trigger_type,
        trigger_config: editing.trigger_config,
        workflow_definition: definition,
      });
      if (publish) {
        await publishWorkflowVersion(editing.id, definition);
        toast.success('Workflow published');
      } else {
        toast.success('Workflow saved');
      }
      await load();
    } catch (e) {
      toast.error('Failed to save workflow');
      console.error(e);
    }
  };

  const toggleStatus = async (wf: AutomationWorkflow) => {
    const next: WorkflowStatus = wf.status === 'active' ? 'paused' : wf.status === 'paused' ? 'active' : 'active';
    try {
      await updateWorkflow(wf.id, { status: next });
      toast.success(`Workflow ${next}`);
      await load();
    } catch (e) {
      toast.error('Failed to update status');
      console.error(e);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this workflow?')) return;
    try {
      await deleteWorkflow(id);
      toast.success('Workflow deleted');
      if (editing?.id === id) setEditing(null);
      await load();
    } catch (e) {
      toast.error('Failed to delete workflow');
      console.error(e);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Enter a workflow name');
      return;
    }
    try {
      let wf: AutomationWorkflow;
      if (selectedTemplateId) {
        wf = await createWorkflowFromTemplate(selectedTemplateId, newName.trim());
      } else {
        wf = await createWorkflow({
          name: newName.trim(),
          trigger_type: 'manual',
          workflow_definition: { nodes: [{ id: 'trigger', type: 'trigger', data: { eventType: 'manual' } }, { id: 'end', type: 'end', data: {} }], edges: [{ source: 'trigger', target: 'end' }] },
        });
      }
      setCreateOpen(false);
      setNewName('');
      setSelectedTemplateId('');
      await load();
      startEdit(wf);
      toast.success('Workflow created');
    } catch (e) {
      toast.error('Failed to create workflow');
      console.error(e);
    }
  };

  const statusBadge = (status: WorkflowStatus) => {
    const map: Record<WorkflowStatus, string> = {
      draft: 'secondary',
      active: 'default',
      paused: 'outline',
      archived: 'destructive',
    };
    return <Badge variant={map[status] as 'default' | 'secondary' | 'outline' | 'destructive'}>{status}</Badge>;
  };

  const unusedTemplates = useMemo(() => templates, [templates]);

  return (
    <MainLayout showFooter={false}>
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Automation Center</h1>
            <p className="text-sm text-muted-foreground">Build and manage customer engagement workflows.</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create workflow</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Welcome journey" />
                </div>
                <div className="space-y-1">
                  <Label>Start from template</Label>
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Blank workflow" />
                    </SelectTrigger>
                    <SelectContent>
                      {unusedTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <LayoutList className="h-4 w-4" /> Workflows
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {workflows.length === 0 && (
                    <p className="p-4 text-sm text-muted-foreground">No workflows yet.</p>
                  )}
                  <div className="divide-y divide-border">
                    {workflows.map((wf) => (
                      <div
                        key={wf.id}
                        className={`p-4 flex items-center justify-between cursor-pointer hover:bg-muted/40 ${editing?.id === wf.id ? 'bg-muted/60' : ''}`}
                        onClick={() => startEdit(wf)}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{wf.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{wf.trigger_type}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {statusBadge(wf.status)}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStatus(wf);
                            }}
                          >
                            {wf.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              remove(wf.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Bot className="h-4 w-4" /> Templates
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {templates.map((t) => (
                    <div key={t.id} className="p-4 border-b border-border last:border-0">
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.category}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {editing ? (
                <Card className="h-full flex flex-col">
                  <CardHeader className="border-b border-border flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <Input
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        className="text-base font-medium border-none px-0 focus-visible:ring-0"
                      />
                      <Input
                        value={editing.description || ''}
                        onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                        placeholder="Description"
                        className="text-xs text-muted-foreground border-none px-0 focus-visible:ring-0"
                      />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={editing.trigger_type}
                        onValueChange={(v) => setEditing({ ...editing, trigger_type: v })}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRIGGER_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={() => handleSave(false)}>
                        <Save className="h-4 w-4 mr-2" /> Save
                      </Button>
                      <Button onClick={() => handleSave(true)}>
                        <Copy className="h-4 w-4 mr-2" /> Publish
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-4">
                    <WorkflowBuilder
                      definition={definition}
                      triggerType={editing.trigger_type}
                      onChange={handleDefinitionChange}
                      errors={errors}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center min-h-[400px]">
                  <p className="text-sm text-muted-foreground">Select a workflow to edit.</p>
                </Card>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-4">
          <Link to="/admin/automation/logs" className="text-sm text-primary hover:underline">Execution logs</Link>
          <Link to="/admin/automation/analytics" className="text-sm text-primary hover:underline">Analytics</Link>
        </div>
      </div>
    </MainLayout>
  );
}
