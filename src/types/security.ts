export type SecurityEventType =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'password_changed'
  | 'api_key_created'
  | 'api_key_deleted'
  | 'permission_changed'
  | 'suspicious_login'
  | 'rate_limit_hit'
  | 'data_export_requested'
  | 'data_deletion_requested'
  | 'account_recovered'
  | 'device_trusted'
  | 'device_revoked';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type PrivacyRequestType = 'access' | 'deletion' | 'correction' | 'portability' | 'marketing_opt_out' | 'analytics_opt_out' | 'ai_training_opt_out';
export type PrivacyRequestStatus = 'pending' | 'in_review' | 'fulfilled' | 'rejected';
export type SecurityPolicyScope = 'global' | 'organization' | 'workspace' | 'team';
export type BackupJobStatus = 'running' | 'completed' | 'failed' | 'verifying';

export interface UserSession {
  id: string;
  user_id: string;
  device_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  location?: string | null;
  started_at: string;
  last_active_at: string;
  expires_at?: string | null;
  is_active: boolean;
  is_trusted: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface LoginHistoryEntry {
  id: string;
  user_id: string;
  ip_address?: string | null;
  user_agent?: string | null;
  location?: string | null;
  success: boolean;
  failure_reason?: string | null;
  mfa_used?: boolean | null;
  created_at: string;
}

export interface SecurityEvent {
  id: string;
  user_id?: string | null;
  organization_id?: string | null;
  event_type: SecurityEventType;
  severity: SecuritySeverity;
  ip_address?: string | null;
  user_agent?: string | null;
  details?: Record<string, unknown> | null;
  detected_at: string;
}

export interface SecurityAlert {
  id: string;
  user_id?: string | null;
  organization_id?: string | null;
  alert_type: SecurityEventType;
  severity: SecuritySeverity;
  status: string;
  message: string;
  evidence?: Record<string, unknown> | null;
  created_at: string;
  resolved_at?: string | null;
}

export interface RiskScore {
  id: string;
  user_id?: string | null;
  organization_id?: string | null;
  score: number;
  risk_level: RiskLevel;
  factors?: Record<string, unknown> | null;
  calculated_at: string;
}

export interface Incident {
  id: string;
  organization_id?: string | null;
  title: string;
  description?: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  owner_id?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  owner?: { email?: string; full_name?: string };
  notes?: IncidentNote[];
}

export interface IncidentNote {
  id: string;
  incident_id: string;
  author_id: string;
  note: string;
  created_at: string;
  author?: { email?: string; full_name?: string };
}

export interface PrivacyRequest {
  id: string;
  user_id: string;
  request_type: PrivacyRequestType;
  status: PrivacyRequestStatus;
  details?: Record<string, unknown> | null;
  requested_at: string;
  processed_at?: string | null;
  admin_notes?: string | null;
}

export interface SecurityPolicy {
  id: string;
  organization_id?: string | null;
  name: string;
  scope: SecurityPolicyScope;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ThreatIntelligence {
  id: string;
  threat_type: string;
  indicator: string;
  risk_level: RiskLevel;
  description?: string | null;
  first_seen: string;
  last_seen: string;
  count: number;
}

export interface BackupJob {
  id: string;
  status: BackupJobStatus;
  job_type: string;
  started_at: string;
  completed_at?: string | null;
  size_bytes?: number | null;
  verification_status?: string | null;
}

export interface ComplianceSummary {
  total: number;
  compliant: number;
  inProgress: number;
  nonCompliant: number;
}

export interface SecurityOverview {
  activeAlerts: number;
  openIncidents: number;
  avgRiskScore: number;
  failedLogins24h: number;
  privacyRequestsPending: number;
}
