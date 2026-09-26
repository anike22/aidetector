export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';
export type ExecutionStatus = 'running' | 'delayed' | 'completed' | 'failed' | 'paused';
export type NodeType = 'trigger' | 'condition' | 'action' | 'delay' | 'end';
export type ConditionOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position?: { x: number; y: number };
  data: WorkflowNodeData;
}

export interface WorkflowNodeData {
  eventType?: string;
  type?: string;
  category?: string;
  title?: string;
  message?: string;
  value?: string | number;
  operator?: ConditionOperator;
  delayMinutes?: number;
  link?: string;
  cta_text?: string;
  target_segments?: string[];
  priority?: number;
  metadata?: Record<string, unknown>;
  context?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface WorkflowEdge {
  source: string;
  target: string;
  sourceHandle?: 'yes' | 'no';
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  status: WorkflowStatus;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  workflow_definition: WorkflowDefinition;
  version: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface AutomationWorkflowVersion {
  id: string;
  workflow_id: string;
  version: number;
  workflow_definition: WorkflowDefinition;
  created_at: string;
  created_by: string | null;
}

export interface AutomationEvent {
  id: string;
  event_type: string;
  user_id: string;
  customer_profile_id: string | null;
  event_data: Record<string, unknown>;
  processed: boolean;
  created_at: string;
}

export interface AutomationExecution {
  id: string;
  workflow_id: string;
  user_id: string;
  trigger_event: string;
  trigger_event_id: string | null;
  status: ExecutionStatus;
  created_at: string;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  retry_count: number;
  current_node_id: string | null;
  context: Record<string, unknown>;
  scheduled_resume_at: string | null;
  workflow?: AutomationWorkflow;
}

export interface AutomationExecutionLog {
  id: string;
  execution_id: string;
  step_id: string | null;
  step_type: 'trigger' | 'condition' | 'action' | 'delay' | 'end';
  step_config: Record<string, unknown> | null;
  status: 'completed' | 'skipped' | 'failed';
  result: Record<string, unknown> | null;
  error_message: string | null;
  timestamp: string;
}

export interface AutomationTemplate {
  id: string;
  template_key: string;
  name: string;
  description: string | null;
  category: string | null;
  workflow_definition: WorkflowDefinition;
  enabled: boolean;
}

export interface UserCommunicationPreferences {
  id?: string;
  user_id: string;
  product_tips: boolean;
  feature_updates: boolean;
  security_notifications: boolean;
  billing_notifications: boolean;
  marketing_communications: boolean;
  weekly_summaries: boolean;
  email_enabled: boolean;
  in_app_enabled: boolean;
  dashboard_announcements_enabled: boolean;
  max_messages_per_day: number;
  timezone: string;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  created_at?: string;
  updated_at: string;
}

export interface AutomationAnalyticsRow {
  workflow_id: string;
  workflow_name: string;
  date: string;
  starts: number;
  completions: number;
  failures: number;
  conversion_count: number;
  email_delivered: number;
  email_opened: number;
  email_clicked: number;
  notification_count: number;
  recommendation_click: number;
  unique_user_count: number;
}

export interface AutomationEventInput {
  eventType: string;
  metadata?: Record<string, unknown>;
}
