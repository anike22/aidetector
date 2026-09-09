import { supabase } from '@/db/supabase';
import type {
  UserSession,
  LoginHistoryEntry,
  SecurityEvent,
  SecurityAlert,
  RiskScore,
  Incident,
  IncidentNote,
  PrivacyRequest,
  SecurityPolicy,
  ThreatIntelligence,
  BackupJob,
  SecurityEventType,
  SecuritySeverity,
  IncidentStatus,
  IncidentSeverity,
  PrivacyRequestType,
  PrivacyRequestStatus,
  SecurityPolicyScope,
  BackupJobStatus,
} from '@/types/security';

// User sessions
export async function getUserSessions(): Promise<UserSession[]> {
  const { data, error } = await supabase.from('user_sessions').select('*').order('last_active_at', { ascending: false });
  if (error) throw error;
  return (data as UserSession[]) || [];
}

export async function terminateSession(id: string) {
  const { error } = await supabase.from('user_sessions').delete().eq('id', id);
  if (error) throw error;
}

export async function terminateAllSessionsExceptCurrent(currentId?: string) {
  let q = supabase.from('user_sessions').delete();
  if (currentId) q = q.neq('id', currentId);
  const { error } = await q;
  if (error) throw error;
}

// Login history
export async function getLoginHistory(limit = 50): Promise<LoginHistoryEntry[]> {
  const { data, error } = await supabase.from('login_history').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data as LoginHistoryEntry[]) || [];
}

// Security events (admin)
export async function getSecurityEvents(): Promise<SecurityEvent[]> {
  const { data, error } = await supabase.from('security_events').select('*').order('detected_at', { ascending: false });
  if (error) throw error;
  return (data as SecurityEvent[]) || [];
}

export async function createSecurityEvent(payload: Partial<SecurityEvent>): Promise<SecurityEvent> {
  const { data, error } = await supabase.from('security_events').insert(payload).select().single();
  if (error) throw error;
  return data as SecurityEvent;
}

// Security alerts
export async function getSecurityAlerts(): Promise<SecurityAlert[]> {
  const { data, error } = await supabase.from('security_alerts').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as SecurityAlert[]) || [];
}

export async function createSecurityAlert(payload: Partial<SecurityAlert>): Promise<SecurityAlert> {
  const { data, error } = await supabase.from('security_alerts').insert(payload).select().single();
  if (error) throw error;
  return data as SecurityAlert;
}

export async function resolveSecurityAlert(id: string): Promise<SecurityAlert> {
  const { data, error } = await supabase.from('security_alerts').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data as SecurityAlert;
}

// Risk scores
export async function getRiskScores(): Promise<RiskScore[]> {
  const { data, error } = await supabase.from('risk_scores').select('*').order('calculated_at', { ascending: false });
  if (error) throw error;
  return (data as RiskScore[]) || [];
}

export async function createRiskScore(payload: Partial<RiskScore>): Promise<RiskScore> {
  const { data, error } = await supabase.from('risk_scores').insert(payload).select().single();
  if (error) throw error;
  return data as RiskScore;
}

// Incidents
export async function getIncidents(): Promise<Incident[]> {
  const { data, error } = await supabase.from('incidents').select('*, owner:profiles!incidents_owner_id_fkey(email, full_name), notes:incident_notes(*)').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Incident[]) || [];
}

export async function createIncident(payload: Partial<Incident>): Promise<Incident> {
  const { data, error } = await supabase.from('incidents').insert(payload).select().single();
  if (error) throw error;
  return data as Incident;
}

export async function updateIncidentStatus(id: string, status: IncidentStatus): Promise<Incident> {
  const updates: Partial<Incident> = { status };
  if (status === 'resolved' || status === 'closed') updates.resolved_at = new Date().toISOString();
  const { data, error } = await supabase.from('incidents').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Incident;
}

export async function assignIncident(id: string, ownerId: string): Promise<Incident> {
  const { data, error } = await supabase.from('incidents').update({ owner_id: ownerId }).eq('id', id).select().single();
  if (error) throw error;
  return data as Incident;
}

export async function addIncidentNote(incidentId: string, note: string): Promise<IncidentNote> {
  const { data, error } = await supabase.from('incident_notes').insert({ incident_id: incidentId, note }).select().single();
  if (error) throw error;
  return data as IncidentNote;
}

// Privacy requests
export async function getPrivacyRequests(): Promise<PrivacyRequest[]> {
  const { data, error } = await supabase.from('privacy_requests').select('*').order('requested_at', { ascending: false });
  if (error) throw error;
  return (data as PrivacyRequest[]) || [];
}

export async function createPrivacyRequest(requestType: PrivacyRequestType, details?: Record<string, unknown>): Promise<PrivacyRequest> {
  const { data, error } = await supabase.from('privacy_requests').insert({ request_type: requestType, details }).select().single();
  if (error) throw error;
  return data as PrivacyRequest;
}

export async function updatePrivacyRequestStatus(id: string, status: PrivacyRequestStatus, adminNotes?: string): Promise<PrivacyRequest> {
  const updates: Partial<PrivacyRequest> = { status };
  if (status === 'fulfilled' || status === 'rejected') updates.processed_at = new Date().toISOString();
  if (adminNotes) updates.admin_notes = adminNotes;
  const { data, error } = await supabase.from('privacy_requests').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as PrivacyRequest;
}

// Data deletion requests (existing table)
export async function getDataDeletionRequests(): Promise<{ id: string; customer_profile_id: string; status: string; requested_at: string; processed_at?: string | null; admin_notes?: string | null }[]> {
  const { data, error } = await supabase.from('data_deletion_requests').select('*').order('requested_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createDataDeletionRequest(customerProfileId: string): Promise<{ id: string }> {
  const { data, error } = await supabase.from('data_deletion_requests').insert({ customer_profile_id: customerProfileId }).select('id').single();
  if (error) throw error;
  return data as { id: string };
}

export async function updateDataDeletionRequestStatus(id: string, status: string, adminNotes?: string) {
  const updates: { status: string; processed_at?: string; admin_notes?: string } = { status };
  if (status === 'completed' || status === 'rejected') updates.processed_at = new Date().toISOString();
  if (adminNotes) updates.admin_notes = adminNotes;
  const { error } = await supabase.from('data_deletion_requests').update(updates).eq('id', id);
  if (error) throw error;
}

// Security policies
export async function getSecurityPolicies(): Promise<SecurityPolicy[]> {
  const { data, error } = await supabase.from('security_policies').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as SecurityPolicy[]) || [];
}

export async function createSecurityPolicy(payload: Partial<SecurityPolicy>): Promise<SecurityPolicy> {
  const { data, error } = await supabase.from('security_policies').insert(payload).select().single();
  if (error) throw error;
  return data as SecurityPolicy;
}

export async function updateSecurityPolicy(id: string, payload: Partial<SecurityPolicy>): Promise<SecurityPolicy> {
  const { data, error } = await supabase.from('security_policies').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data as SecurityPolicy;
}

// Threat intelligence
export async function getThreatIntelligence(): Promise<ThreatIntelligence[]> {
  const { data, error } = await supabase.from('threat_intelligence').select('*').order('last_seen', { ascending: false });
  if (error) throw error;
  return (data as ThreatIntelligence[]) || [];
}

export async function createThreatIntelligence(payload: Partial<ThreatIntelligence>): Promise<ThreatIntelligence> {
  const { data, error } = await supabase.from('threat_intelligence').insert(payload).select().single();
  if (error) throw error;
  return data as ThreatIntelligence;
}

// Backup jobs
export async function getBackupJobs(): Promise<BackupJob[]> {
  const { data, error } = await supabase.from('backup_jobs').select('*').order('started_at', { ascending: false });
  if (error) throw error;
  return (data as BackupJob[]) || [];
}

export async function createBackupJob(jobType: string): Promise<BackupJob> {
  const { data, error } = await supabase.from('backup_jobs').insert({ job_type: jobType, status: 'running' }).select().single();
  if (error) throw error;
  return data as BackupJob;
}

// Compliance records (existing)
export async function getComplianceRecords() {
  const { data, error } = await supabase.from('compliance_records').select('*').order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateComplianceRecordStatus(id: string, status: 'compliant' | 'non_compliant' | 'in_progress') {
  const { error } = await supabase.from('compliance_records').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

// Audit logs (existing)
export async function getAuditLogs(limit = 100) {
  const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data || [];
}

// Profile security helpers
export async function updateSecurityPreferences(userId: string, updates: { mfa_enabled?: boolean; mfa_method?: string; security_preferences?: Record<string, unknown> }) {
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
  if (error) throw error;
  return data;
}

export async function getSecurityProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('mfa_enabled,mfa_method,last_login_at,password_changed_at,risk_score,security_preferences').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

// Fraud helpers
export async function flagSuspiciousUser(userId: string, reason: string) {
  await createSecurityAlert({
    user_id: userId,
    alert_type: 'suspicious_login',
    severity: 'high',
    status: 'open',
    message: `User flagged: ${reason}`,
    evidence: { reason },
  });
}

export function getClientDeviceInfo() {
  return {
    user_agent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screen: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
