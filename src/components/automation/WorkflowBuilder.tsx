import { useMemo, useState, useCallback, useEffect } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, AlertCircle } from 'lucide-react';
import type {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeData,
  ConditionOperator,
} from '@/types/automation';

interface WorkflowBuilderProps {
  definition: WorkflowDefinition;
  triggerType: string;
  onChange: (definition: WorkflowDefinition) => void;
  errors?: string[];
}

const NODE_TYPES: Array<{ value: WorkflowNode['type']; label: string }> = [
  { value: 'trigger', label: 'Trigger' },
  { value: 'condition', label: 'Condition' },
  { value: 'action', label: 'Action' },
  { value: 'delay', label: 'Delay' },
  { value: 'end', label: 'End' },
];

const CONDITION_OPERATORS: Array<{ value: ConditionOperator; label: string }> = [
  { value: 'eq', label: 'Equals' },
  { value: 'neq', label: 'Not equals' },
  { value: 'gt', label: 'Greater than' },
  { value: 'gte', label: 'Greater than or equal' },
  { value: 'lt', label: 'Less than' },
  { value: 'lte', label: 'Less than or equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does not contain' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
];

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function emptyNodeData(type: WorkflowNode['type']): WorkflowNodeData {
  if (type === 'trigger') return { eventType: 'user_registered' };
  if (type === 'condition') return { type: 'subscription_plan', operator: 'eq', value: '' };
  if (type === 'action') return { type: 'in_app_notification', category: 'product_tips', title: '', message: '' };
  if (type === 'delay') return { delayMinutes: 60 };
  return {};
}

export function validateDefinition(def: WorkflowDefinition): string[] {
  const errs: string[] = [];
  const nodes = def.nodes || [];
  const edges = def.edges || [];
  const nodeIds = new Set(nodes.map((n) => n.id));

  if (nodes.length === 0) {
    errs.push('Workflow must contain at least one node.');
    return errs;
  }

  const triggers = nodes.filter((n) => n.type === 'trigger');
  if (triggers.length !== 1) errs.push('Workflow must have exactly one trigger node.');

  const ends = nodes.filter((n) => n.type === 'end');
  if (ends.length === 0) errs.push('Workflow must have at least one end node.');

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      errs.push(`Edge references unknown nodes.`);
    }
  }

  for (const node of nodes) {
    if (node.type === 'end') continue;
    const outgoingYes = edges.find((e) => e.source === node.id && (e.sourceHandle ?? 'yes') === 'yes');
    const outgoingNo = edges.find((e) => e.source === node.id && e.sourceHandle === 'no');
    if (!outgoingYes) {
      errs.push(`${nodeLabel(node)} has no yes/true outgoing connection.`);
    }
    if (node.type === 'condition' && !outgoingNo) {
      errs.push(`${nodeLabel(node)} condition has no no/false outgoing connection.`);
    }
  }

  return errs;
}

function nodeLabel(node: WorkflowNode) {
  if (node.type === 'action') return node.data.title || 'Action';
  if (node.type === 'condition') return `${node.data.type || 'condition'} ${node.data.operator || ''}`;
  if (node.type === 'delay') return 'Delay';
  if (node.type === 'trigger') return 'Trigger';
  return 'End';
}

function buildEdges(nodes: WorkflowNode[]): WorkflowEdge[] {
  const edges: WorkflowEdge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === 'end') continue;
    const next = nodes[i + 1];
    if (!next) continue;
    if (node.type === 'condition') {
      // For simplicity, condition yes -> next node, no -> node after next if exists
      edges.push({ source: node.id, target: next.id, sourceHandle: 'yes' });
      const noTarget = nodes[i + 2];
      if (noTarget) {
        edges.push({ source: node.id, target: noTarget.id, sourceHandle: 'no' });
      }
    } else {
      edges.push({ source: node.id, target: next.id });
    }
  }
  return edges;
}

export function WorkflowBuilder({ definition, triggerType, onChange, errors = [] }: WorkflowBuilderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localNodes, setLocalNodes] = useState<WorkflowNode[]>(definition.nodes || []);
  const [localEdges, setLocalEdges] = useState<WorkflowEdge[]>(definition.edges || []);

  useEffect(() => {
    setLocalNodes(definition.nodes || []);
    setLocalEdges(definition.edges || []);
  }, [definition]);

  const emit = useCallback(
    (nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
      onChange({ nodes, edges });
    },
    [onChange]
  );

  const selectedNode = useMemo(
    () => localNodes.find((n) => n.id === selectedId) || null,
    [localNodes, selectedId]
  );

  const addNode = useCallback(
    (type: WorkflowNode['type']) => {
      const id = `${type}_${generateId()}`;
      const newNode: WorkflowNode = {
        id,
        type,
        data: emptyNodeData(type),
      };
      const nodes = [...localNodes, newNode];
      const edges = buildEdges(nodes);
      setLocalNodes(nodes);
      setLocalEdges(edges);
      emit(nodes, edges);
      setSelectedId(id);
    },
    [localNodes, emit]
  );

  const removeNode = useCallback(
    (id: string) => {
      const nodes = localNodes.filter((n) => n.id !== id);
      const edges = buildEdges(nodes);
      setLocalNodes(nodes);
      setLocalEdges(edges);
      emit(nodes, edges);
      if (selectedId === id) setSelectedId(null);
    },
    [localNodes, selectedId, emit]
  );

  const updateNodeData = useCallback(
    (id: string, patch: WorkflowNodeData) => {
      const nodes = localNodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...patch } } : n
      );
      setLocalNodes(nodes);
      emit(nodes, localEdges);
    },
    [localNodes, localEdges, emit]
  );

  const moveNode = useCallback(
    (id: string, direction: -1 | 1) => {
      const idx = localNodes.findIndex((n) => n.id === id);
      if (idx === -1) return;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= localNodes.length) return;
      const nodes = [...localNodes];
      const [moved] = nodes.splice(idx, 1);
      nodes.splice(newIdx, 0, moved);
      const edges = buildEdges(nodes);
      setLocalNodes(nodes);
      setLocalEdges(edges);
      emit(nodes, edges);
    },
    [localNodes, emit]
  );

  const setNextTarget = useCallback(
    (sourceId: string, targetId: string, handle: 'yes' | 'no') => {
      const edges = localEdges.filter((e) => !(e.source === sourceId && e.sourceHandle === handle));
      if (targetId) {
        edges.push({ source: sourceId, target: targetId, sourceHandle: handle });
      }
      setLocalEdges(edges);
      emit(localNodes, edges);
    },
    [localNodes, localEdges, emit]
  );

  const nodeOptions = useMemo(
    () => localNodes.filter((n) => n.type !== 'trigger').map((n) => ({ value: n.id, label: nodeLabel(n) })),
    [localNodes]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full min-h-[500px]">
      <div className="md:col-span-2 space-y-4">
        <Card className="h-full flex flex-col">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-medium">Workflow canvas</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-2">
            {localNodes.length === 0 && (
              <p className="text-sm text-muted-foreground">Add nodes to build your workflow.</p>
            )}
            {localNodes.map((node, index) => (
              <div key={node.id}>
                <button
                  onClick={() => setSelectedId(node.id)}
                  className={`w-full text-left rounded-lg border px-4 py-3 flex items-center justify-between transition-colors ${
                    selectedId === node.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-semibold shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{nodeLabel(node)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{node.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveNode(node.id, -1);
                      }}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveNode(node.id, 1);
                      }}
                      disabled={index === localNodes.length - 1}
                    >
                      ↓
                    </Button>
                    {node.type !== 'trigger' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNode(node.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </button>
                {index < localNodes.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="w-px h-4 bg-border" />
                  </div>
                )}
              </div>
            ))}
            {errors.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1">
                {errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{e}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-medium">Add node</CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-2">
            {NODE_TYPES.filter((t) => t.value !== 'trigger').map((type) => (
              <Button
                key={type.value}
                variant="outline"
                className="justify-start"
                onClick={() => addNode(type.value)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {type.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-medium">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {!selectedNode && <p className="text-sm text-muted-foreground">Select a node to edit.</p>}
            {selectedNode && selectedNode.type === 'trigger' && (
              <div className="space-y-2">
                <Label>Trigger event</Label>
                <Input
                  value={triggerType}
                  disabled
                  placeholder={triggerType}
                />
                <p className="text-xs text-muted-foreground">Trigger type is set on the workflow header.</p>
              </div>
            )}
            {selectedNode && selectedNode.type === 'condition' && (
              <ConditionEditor node={selectedNode} onChange={updateNodeData} />
            )}
            {selectedNode && selectedNode.type === 'action' && (
              <ActionEditor node={selectedNode} onChange={updateNodeData} />
            )}
            {selectedNode && selectedNode.type === 'delay' && (
              <DelayEditor node={selectedNode} onChange={updateNodeData} />
            )}
            {selectedNode && selectedNode.type !== 'trigger' && selectedNode.type !== 'end' && (
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="space-y-1">
                  <Label className="text-xs">Next on yes / true</Label>
                  <Select
                    value={localEdges.find((e) => e.source === selectedNode.id && (e.sourceHandle ?? 'yes') === 'yes')?.target || ''}
                    onValueChange={(v) => setNextTarget(selectedNode.id, v, 'yes')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select next node" />
                    </SelectTrigger>
                    <SelectContent>
                      {nodeOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedNode.type === 'condition' && (
                  <div className="space-y-1">
                    <Label className="text-xs">Next on no / false</Label>
                    <Select
                      value={localEdges.find((e) => e.source === selectedNode.id && e.sourceHandle === 'no')?.target || ''}
                      onValueChange={(v) => setNextTarget(selectedNode.id, v, 'no')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select next node" />
                      </SelectTrigger>
                      <SelectContent>
                        {nodeOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ConditionEditor({
  node,
  onChange,
}: {
  node: WorkflowNode;
  onChange: (id: string, data: WorkflowNodeData) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Condition type</Label>
        <Input
          value={(node.data.type as string) || ''}
          onChange={(e) => onChange(node.id, { ...node.data, type: e.target.value })}
          placeholder="e.g. subscription_plan"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Operator</Label>
        <Select
          value={(node.data.operator as string) || 'eq'}
          onValueChange={(v) => onChange(node.id, { ...node.data, operator: v as ConditionOperator })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONDITION_OPERATORS.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Value</Label>
        <Input
          value={String(node.data.value ?? '')}
          onChange={(e) => onChange(node.id, { ...node.data, value: e.target.value })}
          placeholder="e.g. pro"
        />
      </div>
    </div>
  );
}

function ActionEditor({
  node,
  onChange,
}: {
  node: WorkflowNode;
  onChange: (id: string, data: WorkflowNodeData) => void;
}) {
  const actionType = (node.data.type as string) || 'in_app_notification';
  const category = (node.data.category as string) || 'product_tips';

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Action type</Label>
        <Select
          value={actionType}
          onValueChange={(v) => onChange(node.id, { ...node.data, type: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in_app_notification">In-app notification</SelectItem>
            <SelectItem value="send_email">Send email</SelectItem>
            <SelectItem value="dashboard_announcement">Dashboard announcement</SelectItem>
            <SelectItem value="recommendation">Recommendation</SelectItem>
            <SelectItem value="add_tag">Add tag</SelectItem>
            <SelectItem value="remove_tag">Remove tag</SelectItem>
            <SelectItem value="add_to_segment">Add to segment</SelectItem>
            <SelectItem value="remove_from_segment">Remove from segment</SelectItem>
            <SelectItem value="update_lifecycle_stage">Update lifecycle stage</SelectItem>
            <SelectItem value="mark_milestone">Mark milestone</SelectItem>
            <SelectItem value="admin_notification">Admin notification</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Category</Label>
        <Select
          value={category}
          onValueChange={(v) => onChange(node.id, { ...node.data, category: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="product_tips">Product tips</SelectItem>
            <SelectItem value="feature_updates">Feature updates</SelectItem>
            <SelectItem value="security_notifications">Security notifications</SelectItem>
            <SelectItem value="billing_notifications">Billing notifications</SelectItem>
            <SelectItem value="marketing_communications">Marketing</SelectItem>
            <SelectItem value="weekly_summaries">Weekly summaries</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Title</Label>
        <Input
          value={(node.data.title as string) || ''}
          onChange={(e) => onChange(node.id, { ...node.data, title: e.target.value })}
          placeholder="Headline"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Message</Label>
        <Textarea
          value={(node.data.message as string) || ''}
          onChange={(e) => onChange(node.id, { ...node.data, message: e.target.value })}
          placeholder="Body content"
          rows={3}
        />
      </div>
      {(actionType === 'recommendation' || actionType === 'add_tag' || actionType === 'remove_tag' || actionType === 'update_lifecycle_stage' || actionType === 'mark_milestone') && (
        <div className="space-y-1">
          <Label className="text-xs">Value / key</Label>
          <Input
            value={String(node.data.value ?? '')}
            onChange={(e) => onChange(node.id, { ...node.data, value: e.target.value })}
            placeholder="e.g. ai_detector"
          />
        </div>
      )}
      {actionType === 'webhook' && (
        <div className="space-y-1">
          <Label className="text-xs">URL</Label>
          <Input
            value={(node.data.url as string) || ''}
            onChange={(e) => onChange(node.id, { ...node.data, url: e.target.value })}
            placeholder="https://..."
          />
        </div>
      )}
    </div>
  );
}

function DelayEditor({
  node,
  onChange,
}: {
  node: WorkflowNode;
  onChange: (id: string, data: WorkflowNodeData) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Delay (minutes)</Label>
        <Input
          type="number"
          min={1}
          value={Number(node.data.delayMinutes ?? 0)}
          onChange={(e) => onChange(node.id, { ...node.data, delayMinutes: parseInt(e.target.value, 10) || 0 })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Delay label</Label>
        <Input
          value={(node.data.label as string) || ''}
          onChange={(e) => onChange(node.id, { ...node.data, label: e.target.value })}
          placeholder="e.g. Wait 1 hour"
        />
      </div>
    </div>
  );
}

