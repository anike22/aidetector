BEGIN;

-- Extend profiles with security attributes
ALTER TABLE public.profiles
  ADD COLUMN mfa_enabled boolean DEFAULT false,
  ADD COLUMN mfa_method text DEFAULT 'totp',
  ADD COLUMN password_changed_at timestamptz,
  ADD COLUMN last_login_at timestamptz,
  ADD COLUMN risk_score integer DEFAULT 0,
  ADD COLUMN security_preferences jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.organizations
  ADD COLUMN security_policy jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN compliance_frameworks text[] DEFAULT '{}'::text[],
  ADD COLUMN ip_allowlist text[] DEFAULT '{}'::text[],
  ADD COLUMN requires_mfa boolean DEFAULT false;

-- Custom enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='security_event_type') THEN
    CREATE TYPE security_event_type AS ENUM ('login_success','login_failure','logout','mfa_enabled','mfa_disabled','password_changed','api_key_created','api_key_deleted','permission_changed','suspicious_login','rate_limit_hit','data_export_requested','data_deletion_requested','account_recovered','device_trusted','device_revoked');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='security_alert_severity') THEN
    CREATE TYPE security_alert_severity AS ENUM ('low','medium','high','critical');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='risk_level') THEN
    CREATE TYPE risk_level AS ENUM ('low','medium','high','critical');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='incident_status') THEN
    CREATE TYPE incident_status AS ENUM ('open','investigating','contained','resolved','closed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='incident_severity') THEN
    CREATE TYPE incident_severity AS ENUM ('low','medium','high','critical');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='privacy_request_type') THEN
    CREATE TYPE privacy_request_type AS ENUM ('access','deletion','correction','portability','marketing_opt_out','analytics_opt_out','ai_training_opt_out');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='privacy_request_status') THEN
    CREATE TYPE privacy_request_status AS ENUM ('pending','in_review','fulfilled','rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='security_policy_scope') THEN
    CREATE TYPE security_policy_scope AS ENUM ('global','organization','workspace','team');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='backup_job_status') THEN
    CREATE TYPE backup_job_status AS ENUM ('running','completed','failed','verifying');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id uuid,
  ip_address text,
  user_agent text,
  location text,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  is_trusted boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.login_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address text,
  user_agent text,
  location text,
  success boolean NOT NULL DEFAULT true,
  failure_reason text,
  mfa_used boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  event_type security_event_type NOT NULL,
  severity security_alert_severity NOT NULL DEFAULT 'low',
  ip_address text,
  user_agent text,
  details jsonb DEFAULT '{}'::jsonb,
  detected_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.security_alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  alert_type security_event_type NOT NULL,
  severity security_alert_severity NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  message text NOT NULL,
  evidence jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.risk_scores (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  score integer NOT NULL DEFAULT 0,
  risk_level risk_level NOT NULL DEFAULT 'low',
  factors jsonb DEFAULT '{}'::jsonb,
  calculated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.incidents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  severity incident_severity NOT NULL DEFAULT 'medium',
  status incident_status NOT NULL DEFAULT 'open',
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.incident_notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.privacy_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type privacy_request_type NOT NULL,
  status privacy_request_status NOT NULL DEFAULT 'pending',
  details jsonb DEFAULT '{}'::jsonb,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  admin_notes text
);

CREATE TABLE IF NOT EXISTS public.security_policies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  scope security_policy_scope NOT NULL DEFAULT 'organization',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.threat_intelligence (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  threat_type text NOT NULL,
  indicator text NOT NULL,
  risk_level risk_level NOT NULL DEFAULT 'medium',
  description text,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 1,
  UNIQUE(threat_type, indicator)
);

CREATE TABLE IF NOT EXISTS public.backup_jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  status backup_job_status NOT NULL DEFAULT 'running',
  job_type text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  size_bytes bigint,
  verification_status text
);

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_risk_level(p_score integer)
RETURNS risk_level AS $$
BEGIN
  IF p_score >= 80 THEN RETURN 'critical';
  ELSIF p_score >= 50 THEN RETURN 'high';
  ELSIF p_score >= 20 THEN RETURN 'medium';
  ELSE RETURN 'low';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON public.login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_org ON public.security_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_user ON public.security_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON public.security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_risk_scores_user ON public.risk_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_org ON public.incidents(organization_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incident_notes_incident ON public.incident_notes(incident_id);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_user ON public.privacy_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_status ON public.privacy_requests(status);
CREATE INDEX IF NOT EXISTS idx_security_policies_org ON public.security_policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_threat_intel_indicator ON public.threat_intelligence(indicator);

-- RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_jobs ENABLE ROW LEVEL SECURITY;

-- Use inline admin check for compatibility
CREATE POLICY user_sessions_select_own ON public.user_sessions FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_app_admin());
CREATE POLICY user_sessions_delete_own ON public.user_sessions FOR DELETE TO authenticated USING (user_id = auth.uid() OR is_app_admin());
CREATE POLICY user_sessions_insert_system ON public.user_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY login_history_select_own ON public.login_history FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_app_admin());
CREATE POLICY login_history_insert_system ON public.login_history FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY security_events_select_admin ON public.security_events FOR SELECT TO authenticated USING (is_app_admin());
CREATE POLICY security_events_insert_system ON public.security_events FOR INSERT TO authenticated WITH CHECK (is_app_admin());

CREATE POLICY security_alerts_select_own_or_admin ON public.security_alerts FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_app_admin());
CREATE POLICY security_alerts_insert_admin ON public.security_alerts FOR INSERT TO authenticated WITH CHECK (is_app_admin());
CREATE POLICY security_alerts_update_admin ON public.security_alerts FOR UPDATE TO authenticated USING (is_app_admin()) WITH CHECK (is_app_admin());

CREATE POLICY risk_scores_select_own_or_admin ON public.risk_scores FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_app_admin());
CREATE POLICY risk_scores_insert_admin ON public.risk_scores FOR INSERT TO authenticated WITH CHECK (is_app_admin());
CREATE POLICY risk_scores_update_admin ON public.risk_scores FOR UPDATE TO authenticated USING (is_app_admin()) WITH CHECK (is_app_admin());

CREATE POLICY incidents_select_admin ON public.incidents FOR SELECT TO authenticated USING (is_app_admin());
CREATE POLICY incidents_insert_admin ON public.incidents FOR INSERT TO authenticated WITH CHECK (is_app_admin());
CREATE POLICY incidents_update_admin ON public.incidents FOR UPDATE TO authenticated USING (is_app_admin()) WITH CHECK (is_app_admin());

CREATE POLICY incident_notes_select_admin ON public.incident_notes FOR SELECT TO authenticated USING (is_app_admin());
CREATE POLICY incident_notes_insert_admin ON public.incident_notes FOR INSERT TO authenticated WITH CHECK (is_app_admin());

CREATE POLICY privacy_requests_select_own_or_admin ON public.privacy_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_app_admin());
CREATE POLICY privacy_requests_insert_own ON public.privacy_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY privacy_requests_update_admin ON public.privacy_requests FOR UPDATE TO authenticated USING (is_app_admin()) WITH CHECK (is_app_admin());

CREATE POLICY security_policies_select_all ON public.security_policies FOR SELECT TO authenticated USING (true);
CREATE POLICY security_policies_insert_admin ON public.security_policies FOR INSERT TO authenticated WITH CHECK (is_app_admin());
CREATE POLICY security_policies_update_admin ON public.security_policies FOR UPDATE TO authenticated USING (is_app_admin()) WITH CHECK (is_app_admin());

CREATE POLICY threat_intelligence_select_admin ON public.threat_intelligence FOR SELECT TO authenticated USING (is_app_admin());
CREATE POLICY threat_intelligence_insert_admin ON public.threat_intelligence FOR INSERT TO authenticated WITH CHECK (is_app_admin());
CREATE POLICY threat_intelligence_update_admin ON public.threat_intelligence FOR UPDATE TO authenticated USING (is_app_admin()) WITH CHECK (is_app_admin());

CREATE POLICY backup_jobs_select_admin ON public.backup_jobs FOR SELECT TO authenticated USING (is_app_admin());
CREATE POLICY backup_jobs_insert_admin ON public.backup_jobs FOR INSERT TO authenticated WITH CHECK (is_app_admin());
CREATE POLICY backup_jobs_update_admin ON public.backup_jobs FOR UPDATE TO authenticated USING (is_app_admin()) WITH CHECK (is_app_admin());

COMMIT;