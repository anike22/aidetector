-- Detector version metadata table
CREATE TABLE IF NOT EXISTS detector_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  model_version text NOT NULL,
  language_pipeline_version text NOT NULL,
  calibration_version text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  is_enterprise boolean NOT NULL DEFAULT false,
  release_notes text,
  released_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Detector result records (no full text stored)
CREATE TABLE IF NOT EXISTS detector_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  request_id text,
  detector_version text NOT NULL,
  model_version text NOT NULL,
  language_pipeline_version text NOT NULL,
  calibration_version text NOT NULL,
  content_type text,
  language_code text,
  input_length integer NOT NULL,
  word_count integer NOT NULL,
  ai_probability integer NOT NULL,
  human_probability integer NOT NULL,
  mixed_probability integer NOT NULL,
  verdict text NOT NULL,
  confidence integer NOT NULL,
  risk_level text,
  text_hash text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  retention_mode text NOT NULL DEFAULT 'standard',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User feedback on detector results
CREATE TABLE IF NOT EXISTS detector_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id uuid REFERENCES detector_results(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  feedback_type text NOT NULL CHECK (feedback_type IN ('correct','incorrect','unsure','wrong_language','other')),
  user_label text CHECK (user_label IN ('human','ai','mixed','unsure')),
  comment text,
  reviewed boolean NOT NULL DEFAULT false,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Extend profiles with detector privacy controls
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS detector_zero_retention boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS detector_data_retention_days integer NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS allow_feedback_training boolean NOT NULL DEFAULT false;

-- Seed active detector version
INSERT INTO detector_versions (version, model_version, language_pipeline_version, calibration_version, is_active, release_notes)
VALUES ('2.0.0', 'ensemble-v1', 'lang-v1', 'cal-v1', true, 'Multilingual explainable engine phase 1')
ON CONFLICT (version) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_detector_results_user_id ON detector_results(user_id);
CREATE INDEX IF NOT EXISTS idx_detector_results_created_at ON detector_results(created_at);
CREATE INDEX IF NOT EXISTS idx_detector_results_detector_version ON detector_results(detector_version);
CREATE INDEX IF NOT EXISTS idx_detector_feedback_result_id ON detector_feedback(result_id);
CREATE INDEX IF NOT EXISTS idx_detector_feedback_user_id ON detector_feedback(user_id);

-- Enable RLS
ALTER TABLE detector_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE detector_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE detector_versions ENABLE ROW LEVEL SECURITY;

-- Policies for detector_results
CREATE POLICY "detector_results_select_own"
  ON detector_results FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "detector_results_insert_own"
  ON detector_results FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "detector_results_delete_own"
  ON detector_results FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "detector_results_admin_all"
  ON detector_results FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- Policies for detector_feedback
CREATE POLICY "detector_feedback_select_own"
  ON detector_feedback FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "detector_feedback_insert_own"
  ON detector_feedback FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "detector_feedback_admin_all"
  ON detector_feedback FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- Policies for detector_versions
CREATE POLICY "detector_versions_select_all"
  ON detector_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "detector_versions_admin_all"
  ON detector_versions FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));
