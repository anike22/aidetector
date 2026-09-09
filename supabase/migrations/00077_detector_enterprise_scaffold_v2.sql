-- Workspace-specific detector settings and custom thresholds
CREATE TABLE IF NOT EXISTS workspace_detector_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  ai_threshold integer NOT NULL DEFAULT 70,
  mixed_threshold integer NOT NULL DEFAULT 45,
  human_threshold integer NOT NULL DEFAULT 30,
  confidence_threshold integer NOT NULL DEFAULT 50,
  allowed_languages text[] NOT NULL DEFAULT '{}',
  blocked_content_types text[] NOT NULL DEFAULT '{}',
  private_deployment boolean NOT NULL DEFAULT false,
  data_residency text,
  sso_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id)
);

-- Audit log for detector events within a workspace
CREATE TABLE IF NOT EXISTS workspace_detector_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id uuid,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add workspace linkage to detector results
ALTER TABLE detector_results
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_detector_results_workspace_id ON detector_results(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_detector_audit_logs_workspace_id ON workspace_detector_audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_detector_audit_logs_created_at ON workspace_detector_audit_logs(created_at);

-- RLS
ALTER TABLE workspace_detector_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_detector_audit_logs ENABLE ROW LEVEL SECURITY;

-- Workspace settings: members can view, admins/managers can update
CREATE POLICY "workspace_detector_settings_select_member"
  ON workspace_detector_settings FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_members.workspace_id = workspace_detector_settings.workspace_id AND workspace_members.user_id = auth.uid()));

CREATE POLICY "workspace_detector_settings_admin_all"
  ON workspace_detector_settings FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_members.workspace_id = workspace_detector_settings.workspace_id AND workspace_members.user_id = auth.uid() AND workspace_members.role IN ('admin','manager')));

-- Audit logs: members can view own workspace logs
CREATE POLICY "workspace_detector_audit_logs_select_member"
  ON workspace_detector_audit_logs FOR SELECT
  TO authenticated
  USING (workspace_id IS NULL OR EXISTS (SELECT 1 FROM workspace_members WHERE workspace_members.workspace_id = workspace_detector_audit_logs.workspace_id AND workspace_members.user_id = auth.uid()));

CREATE POLICY "workspace_detector_audit_logs_insert_any"
  ON workspace_detector_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workspace_detector_settings_updated_at ON workspace_detector_settings;
CREATE TRIGGER workspace_detector_settings_updated_at
  BEFORE UPDATE ON workspace_detector_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
