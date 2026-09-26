-- Phase 3 – User Activation & Customer Lifecycle Engine
ALTER TABLE customer_profiles
  ADD COLUMN lifecycle_stage text,
  ADD COLUMN previous_stage text,
  ADD COLUMN stage_updated_at timestamptz,
  ADD COLUMN activation_score int DEFAULT 0,
  ADD COLUMN activation_score_updated_at timestamptz,
  ADD COLUMN health_score int DEFAULT 0,
  ADD COLUMN health_score_updated_at timestamptz,
  ADD COLUMN upgrade_readiness_score int DEFAULT 0,
  ADD COLUMN upgrade_readiness_updated_at timestamptz,
  ADD COLUMN email_verified boolean DEFAULT false;

CREATE INDEX idx_customer_profiles_lifecycle_stage ON customer_profiles(lifecycle_stage);
CREATE INDEX idx_customer_profiles_health_score ON customer_profiles(health_score);
CREATE INDEX idx_customer_profiles_activation_score ON customer_profiles(activation_score);
CREATE INDEX idx_customer_profiles_upgrade_readiness ON customer_profiles(upgrade_readiness_score);

CREATE TABLE user_lifecycle_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_profile_id uuid NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  from_stage text,
  to_stage text,
  trigger text,
  changed_at timestamptz DEFAULT now()
);

CREATE INDEX idx_lifecycle_history_profile ON user_lifecycle_history(customer_profile_id);
CREATE INDEX idx_lifecycle_history_changed_at ON user_lifecycle_history(changed_at);

CREATE TABLE activation_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_key text UNIQUE NOT NULL,
  label text NOT NULL,
  description text,
  estimated_time int,
  completion_criteria jsonb DEFAULT '{}'::jsonb,
  reward_message text,
  display_order int DEFAULT 0,
  enabled boolean DEFAULT true,
  is_system boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE user_checklist_progress (
  customer_profile_id uuid NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  item_key text NOT NULL REFERENCES activation_checklist_items(item_key) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  PRIMARY KEY (customer_profile_id, item_key)
);

CREATE INDEX idx_checklist_progress_profile ON user_checklist_progress(customer_profile_id);

CREATE TABLE milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_key text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  badge_image_url text,
  requirements jsonb DEFAULT '{}'::jsonb,
  category text,
  display_order int DEFAULT 0,
  enabled boolean DEFAULT true,
  is_system boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE user_milestones (
  customer_profile_id uuid NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  milestone_key text NOT NULL REFERENCES milestones(milestone_key) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  PRIMARY KEY (customer_profile_id, milestone_key)
);

CREATE INDEX idx_user_milestones_profile ON user_milestones(customer_profile_id);

CREATE TABLE customer_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_key text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  requirements jsonb DEFAULT '{}'::jsonb,
  target int DEFAULT 1,
  enabled boolean DEFAULT true,
  is_system boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE user_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_profile_id uuid NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  goal_key text NOT NULL REFERENCES customer_goals(goal_key) ON DELETE CASCADE,
  progress int DEFAULT 0,
  target int DEFAULT 1,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (customer_profile_id, goal_key)
);

CREATE INDEX idx_user_goals_profile ON user_goals(customer_profile_id);

CREATE TABLE product_tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_key text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  steps jsonb DEFAULT '[]'::jsonb,
  trigger_conditions jsonb DEFAULT '{}'::jsonb,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE user_tour_progress (
  customer_profile_id uuid NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  tour_key text NOT NULL REFERENCES product_tours(tour_key) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  current_step int DEFAULT 0,
  PRIMARY KEY (customer_profile_id, tour_key)
);

CREATE TABLE feature_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  content text,
  cta_text text,
  cta_url text,
  target_segments text[] DEFAULT '{}',
  priority int DEFAULT 0,
  start_date timestamptz,
  end_date timestamptz,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE user_announcement_interactions (
  customer_profile_id uuid NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  announcement_id uuid NOT NULL REFERENCES feature_announcements(id) ON DELETE CASCADE,
  viewed boolean DEFAULT false,
  viewed_at timestamptz,
  clicked boolean DEFAULT false,
  clicked_at timestamptz,
  dismissed boolean DEFAULT false,
  dismissed_at timestamptz,
  PRIMARY KEY (customer_profile_id, announcement_id)
);

CREATE TABLE user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_profile_id uuid NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  metadata jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_user_notifications_profile ON user_notifications(customer_profile_id, read, created_at DESC);

CREATE TABLE user_journey_stages (
  customer_profile_id uuid NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  stage_key text NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  PRIMARY KEY (customer_profile_id, stage_key)
);

CREATE INDEX idx_user_journey_stages_profile ON user_journey_stages(customer_profile_id);

ALTER TABLE user_lifecycle_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_checklist_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tour_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_announcement_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_journey_stages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_lifecycle_admin()
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

CREATE POLICY user_lifecycle_history_select_self ON user_lifecycle_history
  FOR SELECT TO authenticated
  USING (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
CREATE POLICY user_lifecycle_history_select_admin ON user_lifecycle_history
  FOR SELECT TO authenticated
  USING (is_lifecycle_admin());

CREATE POLICY activation_checklist_items_select_all ON activation_checklist_items FOR SELECT TO anon, authenticated USING (enabled = true);
CREATE POLICY activation_checklist_items_select_admin ON activation_checklist_items FOR SELECT TO authenticated USING (is_lifecycle_admin());
CREATE POLICY activation_checklist_items_admin_write ON activation_checklist_items
  FOR ALL TO authenticated
  USING (is_lifecycle_admin())
  WITH CHECK (is_lifecycle_admin());

CREATE POLICY user_checklist_progress_self ON user_checklist_progress
  FOR ALL TO authenticated
  USING (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()))
  WITH CHECK (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
CREATE POLICY user_checklist_progress_admin ON user_checklist_progress
  FOR SELECT TO authenticated
  USING (is_lifecycle_admin());

CREATE POLICY milestones_select_all ON milestones FOR SELECT TO anon, authenticated USING (enabled = true);
CREATE POLICY milestones_admin_all ON milestones FOR ALL TO authenticated USING (is_lifecycle_admin()) WITH CHECK (is_lifecycle_admin());

CREATE POLICY user_milestones_self ON user_milestones FOR SELECT TO authenticated
  USING (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
CREATE POLICY user_milestones_admin ON user_milestones FOR SELECT TO authenticated USING (is_lifecycle_admin());

CREATE POLICY customer_goals_select_all ON customer_goals FOR SELECT TO anon, authenticated USING (enabled = true);
CREATE POLICY customer_goals_admin_all ON customer_goals FOR ALL TO authenticated USING (is_lifecycle_admin()) WITH CHECK (is_lifecycle_admin());

CREATE POLICY user_goals_self ON user_goals FOR ALL TO authenticated
  USING (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()))
  WITH CHECK (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
CREATE POLICY user_goals_admin ON user_goals FOR SELECT TO authenticated USING (is_lifecycle_admin());

CREATE POLICY product_tours_select_all ON product_tours FOR SELECT TO anon, authenticated USING (enabled = true);
CREATE POLICY product_tours_admin_all ON product_tours FOR ALL TO authenticated USING (is_lifecycle_admin()) WITH CHECK (is_lifecycle_admin());

CREATE POLICY user_tour_progress_self ON user_tour_progress FOR ALL TO authenticated
  USING (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()))
  WITH CHECK (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
CREATE POLICY user_tour_progress_admin ON user_tour_progress FOR SELECT TO authenticated USING (is_lifecycle_admin());

CREATE POLICY feature_announcements_select_all ON feature_announcements FOR SELECT TO anon, authenticated USING (enabled = true);
CREATE POLICY feature_announcements_admin_all ON feature_announcements FOR ALL TO authenticated USING (is_lifecycle_admin()) WITH CHECK (is_lifecycle_admin());

CREATE POLICY user_announcement_interactions_self ON user_announcement_interactions FOR ALL TO authenticated
  USING (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()))
  WITH CHECK (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
CREATE POLICY user_announcement_interactions_admin ON user_announcement_interactions FOR SELECT TO authenticated USING (is_lifecycle_admin());

CREATE POLICY user_notifications_self ON user_notifications FOR ALL TO authenticated
  USING (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()))
  WITH CHECK (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
CREATE POLICY user_notifications_admin ON user_notifications FOR SELECT TO authenticated USING (is_lifecycle_admin());

CREATE POLICY user_journey_stages_self ON user_journey_stages FOR SELECT TO authenticated
  USING (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
CREATE POLICY user_journey_stages_admin ON user_journey_stages FOR SELECT TO authenticated USING (is_lifecycle_admin());

CREATE OR REPLACE FUNCTION handle_lifecycle_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id uuid;
  v_tool text;
  v_cta text;
  v_event_type text;
BEGIN
  v_event_type := NEW.event_type;
  v_profile_id := NEW.customer_profile_id;
  IF v_profile_id IS NULL THEN RETURN NEW; END IF;

  IF v_event_type = 'tool_used' THEN
    v_tool := COALESCE(NEW.metadata->>'tool', '');

    IF v_tool = 'detector' THEN
      INSERT INTO user_checklist_progress (customer_profile_id, item_key, completed, completed_at)
      VALUES (v_profile_id, 'first_scan', true, now()) ON CONFLICT (customer_profile_id, item_key) DO NOTHING;
      INSERT INTO user_milestones (customer_profile_id, milestone_key, unlocked_at)
      VALUES (v_profile_id, 'first_scan', now()) ON CONFLICT (customer_profile_id, milestone_key) DO NOTHING;
      INSERT INTO user_journey_stages (customer_profile_id, stage_key, completed, completed_at)
      VALUES (v_profile_id, 'first_detector_use', true, now()) ON CONFLICT (customer_profile_id, stage_key) DO NOTHING;
      UPDATE user_goals SET progress = LEAST(progress + 1, target)
      WHERE customer_profile_id = v_profile_id AND goal_key = 'check_100_documents' AND completed = false;
    END IF;

    IF v_tool = 'humanizer' THEN
      INSERT INTO user_checklist_progress (customer_profile_id, item_key, completed, completed_at)
      VALUES (v_profile_id, 'first_humanize', true, now()) ON CONFLICT (customer_profile_id, item_key) DO NOTHING;
      INSERT INTO user_milestones (customer_profile_id, milestone_key, unlocked_at)
      VALUES (v_profile_id, 'first_humanization', now()) ON CONFLICT (customer_profile_id, milestone_key) DO NOTHING;
      INSERT INTO user_journey_stages (customer_profile_id, stage_key, completed, completed_at)
      VALUES (v_profile_id, 'first_humanizer_use', true, now()) ON CONFLICT (customer_profile_id, stage_key) DO NOTHING;
      UPDATE user_goals SET progress = LEAST(progress + 1, target)
      WHERE customer_profile_id = v_profile_id AND goal_key = 'humanize_50_articles' AND completed = false;
    END IF;

    IF v_tool = 'plagiarism' THEN
      INSERT INTO user_checklist_progress (customer_profile_id, item_key, completed, completed_at)
      VALUES (v_profile_id, 'first_plagiarism', true, now()) ON CONFLICT (customer_profile_id, item_key) DO NOTHING;
      INSERT INTO user_milestones (customer_profile_id, milestone_key, unlocked_at)
      VALUES (v_profile_id, 'first_plagiarism_check', now()) ON CONFLICT (customer_profile_id, milestone_key) DO NOTHING;
    END IF;

    IF v_tool = 'api_key_created' THEN
      INSERT INTO user_checklist_progress (customer_profile_id, item_key, completed, completed_at)
      VALUES (v_profile_id, 'first_api_key', true, now()) ON CONFLICT (customer_profile_id, item_key) DO NOTHING;
      INSERT INTO user_milestones (customer_profile_id, milestone_key, unlocked_at)
      VALUES (v_profile_id, 'api_activated', now()) ON CONFLICT (customer_profile_id, milestone_key) DO NOTHING;
      INSERT INTO user_journey_stages (customer_profile_id, stage_key, completed, completed_at)
      VALUES (v_profile_id, 'api_key_generation', true, now()) ON CONFLICT (customer_profile_id, stage_key) DO NOTHING;
      UPDATE user_goals SET progress = target
      WHERE customer_profile_id = v_profile_id AND goal_key = 'generate_api_key' AND completed = false;
    END IF;

    IF v_tool = 'chrome_extension_install' THEN
      INSERT INTO user_checklist_progress (customer_profile_id, item_key, completed, completed_at)
      VALUES (v_profile_id, 'install_extension', true, now()) ON CONFLICT (customer_profile_id, item_key) DO NOTHING;
      INSERT INTO user_milestones (customer_profile_id, milestone_key, unlocked_at)
      VALUES (v_profile_id, 'extension_installed', now()) ON CONFLICT (customer_profile_id, milestone_key) DO NOTHING;
      INSERT INTO user_journey_stages (customer_profile_id, stage_key, completed, completed_at)
      VALUES (v_profile_id, 'extension_install', true, now()) ON CONFLICT (customer_profile_id, stage_key) DO NOTHING;
      UPDATE user_goals SET progress = target
      WHERE customer_profile_id = v_profile_id AND goal_key = 'install_extension' AND completed = false;
    END IF;

    IF v_tool = 'wordpress_plugin_install' THEN
      INSERT INTO user_checklist_progress (customer_profile_id, item_key, completed, completed_at)
      VALUES (v_profile_id, 'install_plugin', true, now()) ON CONFLICT (customer_profile_id, item_key) DO NOTHING;
      INSERT INTO user_milestones (customer_profile_id, milestone_key, unlocked_at)
      VALUES (v_profile_id, 'plugin_connected', now()) ON CONFLICT (customer_profile_id, milestone_key) DO NOTHING;
      INSERT INTO user_journey_stages (customer_profile_id, stage_key, completed, completed_at)
      VALUES (v_profile_id, 'plugin_install', true, now()) ON CONFLICT (customer_profile_id, stage_key) DO NOTHING;
      UPDATE user_goals SET progress = target
      WHERE customer_profile_id = v_profile_id AND goal_key = 'connect_plugin' AND completed = false;
    END IF;

    IF v_tool = 'detector' AND NEW.metadata->>'count' IS NOT NULL THEN
      IF (NEW.metadata->>'count')::int >= 10 THEN
        INSERT INTO user_milestones (customer_profile_id, milestone_key, unlocked_at)
        VALUES (v_profile_id, '10_scans', now()) ON CONFLICT (customer_profile_id, milestone_key) DO NOTHING;
      END IF;
      IF (NEW.metadata->>'count')::int >= 100 THEN
        INSERT INTO user_milestones (customer_profile_id, milestone_key, unlocked_at)
        VALUES (v_profile_id, '100_scans', now()) ON CONFLICT (customer_profile_id, milestone_key) DO NOTHING;
      END IF;
      IF (NEW.metadata->>'count')::int >= 1000 THEN
        INSERT INTO user_milestones (customer_profile_id, milestone_key, unlocked_at)
        VALUES (v_profile_id, '1000_scans', now()) ON CONFLICT (customer_profile_id, milestone_key) DO NOTHING;
      END IF;
    END IF;
  END IF;

  IF v_event_type = 'cta_click' THEN
    v_cta := COALESCE(NEW.metadata->>'cta', '');
    IF v_cta = 'pricing' OR v_cta = 'pricing_visit' THEN
      INSERT INTO user_journey_stages (customer_profile_id, stage_key, completed, completed_at)
      VALUES (v_profile_id, 'pricing_visit', true, now()) ON CONFLICT (customer_profile_id, stage_key) DO NOTHING;
    END IF;
  END IF;

  IF v_event_type = 'report_saved' THEN
    INSERT INTO user_checklist_progress (customer_profile_id, item_key, completed, completed_at)
    VALUES (v_profile_id, 'save_report', true, now()) ON CONFLICT (customer_profile_id, item_key) DO NOTHING;
    INSERT INTO user_milestones (customer_profile_id, milestone_key, unlocked_at)
    VALUES (v_profile_id, 'first_report_saved', now()) ON CONFLICT (customer_profile_id, milestone_key) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lead_events_lifecycle
AFTER INSERT ON lead_events
FOR EACH ROW
EXECUTE FUNCTION handle_lifecycle_event();

CREATE OR REPLACE FUNCTION handle_profile_lifecycle_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  v_profile_id := NEW.id;

  IF NEW.email_verified = true AND (OLD.email_verified IS DISTINCT FROM NEW.email_verified) THEN
    INSERT INTO user_checklist_progress (customer_profile_id, item_key, completed, completed_at)
    VALUES (v_profile_id, 'verify_email', true, now()) ON CONFLICT (customer_profile_id, item_key) DO NOTHING;
    INSERT INTO user_milestones (customer_profile_id, milestone_key, unlocked_at)
    VALUES (v_profile_id, 'email_verified', now()) ON CONFLICT (customer_profile_id, milestone_key) DO NOTHING;
    INSERT INTO user_journey_stages (customer_profile_id, stage_key, completed, completed_at)
    VALUES (v_profile_id, 'email_verification', true, now()) ON CONFLICT (customer_profile_id, stage_key) DO NOTHING;
  END IF;

  IF (NEW.full_name IS NOT NULL AND NEW.full_name <> '') AND (NEW.role IS NOT NULL AND NEW.role <> '') THEN
    INSERT INTO user_checklist_progress (customer_profile_id, item_key, completed, completed_at)
    VALUES (v_profile_id, 'complete_profile', true, now()) ON CONFLICT (customer_profile_id, item_key) DO NOTHING;
  END IF;

  IF NEW.subscription_plan IS NOT NULL AND NEW.subscription_plan <> 'free' THEN
    INSERT INTO user_checklist_progress (customer_profile_id, item_key, completed, completed_at)
    VALUES (v_profile_id, 'upgrade_to_pro', true, now()) ON CONFLICT (customer_profile_id, item_key) DO NOTHING;
    INSERT INTO user_milestones (customer_profile_id, milestone_key, unlocked_at)
    VALUES (v_profile_id, 'first_upgrade', now()) ON CONFLICT (customer_profile_id, milestone_key) DO NOTHING;
    INSERT INTO user_journey_stages (customer_profile_id, stage_key, completed, completed_at)
    VALUES (v_profile_id, 'upgrade_to_pro', true, now()) ON CONFLICT (customer_profile_id, stage_key) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_customer_profiles_lifecycle
AFTER UPDATE ON customer_profiles
FOR EACH ROW
EXECUTE FUNCTION handle_profile_lifecycle_update();

INSERT INTO activation_checklist_items (item_key, label, description, estimated_time, completion_criteria, reward_message, display_order, enabled, is_system)
VALUES
  ('verify_email', 'Verify email address', 'Confirm your email to unlock full access.', 1, '{"field":"email_verified"}', 'Email verified — your account is secure.', 1, true, true),
  ('complete_profile', 'Complete your profile', 'Add your name, role, and company.', 2, '{"fields":["full_name","role"]}', 'Profile completed — we can personalize your experience.', 2, true, true),
  ('first_scan', 'Run first AI Detector scan', 'Analyze your first document for AI-generated content.', 2, '{"event":"tool_used","tool":"detector"}', 'First scan complete — welcome to AI detection.', 3, true, true),
  ('first_humanize', 'Humanize first document', 'Rewrite AI text to sound natural.', 3, '{"event":"tool_used","tool":"humanizer"}', 'First humanization done — your content sounds human.', 4, true, true),
  ('first_plagiarism', 'Run plagiarism scan', 'Check your content for originality.', 2, '{"event":"tool_used","tool":"plagiarism"}', 'Originality check complete.', 5, true, true),
  ('install_extension', 'Install Chrome Extension', 'Add AI detection to your browser.', 3, '{"event":"tool_used","tool":"chrome_extension_install"}', 'Extension installed — analyze anywhere.', 6, true, true),
  ('install_plugin', 'Install WordPress Plugin', 'Connect AI detection to your WordPress site.', 4, '{"event":"tool_used","tool":"wordpress_plugin_install"}', 'Plugin connected — protect your site.', 7, true, true),
  ('first_api_key', 'Generate first API Key', 'Start building with the API.', 2, '{"event":"tool_used","tool":"api_key_created"}', 'API activated — build at scale.', 8, true, true),
  ('save_report', 'Save first report', 'Save a report for quick access later.', 1, '{"event":"report_saved"}', 'First report saved — your work is organized.', 9, true, true),
  ('upgrade_to_pro', 'Upgrade to Pro', 'Unlock higher limits and advanced features.', 2, '{"field":"subscription_plan","not":"free"}', 'Welcome to Pro — enjoy premium features.', 10, true, true);

INSERT INTO milestones (milestone_key, title, description, badge_image_url, requirements, category, display_order, enabled, is_system)
VALUES
  ('first_login', 'First Login', 'Welcome to AIDetector.cx', NULL, '{"event":"signup"}', 'onboarding', 1, true, true),
  ('email_verified', 'Email Verified', 'You confirmed your email address.', NULL, '{"field":"email_verified"}', 'onboarding', 2, true, true),
  ('first_scan', 'First Scan', 'You ran your first AI Detector scan.', NULL, '{"event":"tool_used","tool":"detector"}', 'detector', 3, true, true),
  ('first_humanization', 'First Humanization', 'You humanized your first document.', NULL, '{"event":"tool_used","tool":"humanizer"}', 'humanizer', 4, true, true),
  ('first_plagiarism_check', 'First Plagiarism Check', 'You checked your first document for originality.', NULL, '{"event":"tool_used","tool":"plagiarism"}', 'plagiarism', 5, true, true),
  ('10_scans', '10 Scans', 'You analyzed 10 documents.', NULL, '{"event":"tool_used","tool":"detector","count":10}', 'detector', 6, true, true),
  ('100_scans', '100 Scans', 'You analyzed 100 documents.', NULL, '{"event":"tool_used","tool":"detector","count":100}', 'detector', 7, true, true),
  ('1000_scans', '1000 Scans', 'You analyzed 1,000 documents.', NULL, '{"event":"tool_used","tool":"detector","count":1000}', 'detector', 8, true, true),
  ('extension_installed', 'Extension Installed', 'You added AI detection to your browser.', NULL, '{"event":"tool_used","tool":"chrome_extension_install"}', 'integrations', 9, true, true),
  ('plugin_connected', 'Plugin Connected', 'You connected the WordPress plugin.', NULL, '{"event":"tool_used","tool":"wordpress_plugin_install"}', 'integrations', 10, true, true),
  ('api_activated', 'API Activated', 'You generated your first API key.', NULL, '{"event":"tool_used","tool":"api_key_created"}', 'api', 11, true, true),
  ('first_upgrade', 'First Upgrade', 'You upgraded to a premium plan.', NULL, '{"field":"subscription_plan","not":"free"}', 'billing', 12, true, true),
  ('first_report_saved', 'First Report Saved', 'You saved your first report.', NULL, '{"event":"report_saved"}', 'productivity', 13, true, true),
  ('one_month_active', 'One Month Active', 'You used the platform for a full month.', NULL, '{"days_active":30}', 'engagement', 14, true, true),
  ('three_month_active', 'Three Month Active', 'You used the platform for three months.', NULL, '{"days_active":90}', 'engagement', 15, true, true),
  ('power_user', 'Power User', 'You adopted multiple tools and use them consistently.', NULL, '{"tools_used":3,"days_active":15}', 'engagement', 16, true, true);

INSERT INTO customer_goals (goal_key, title, description, requirements, target, enabled, is_system)
VALUES
  ('check_100_documents', 'Check 100 documents', 'Run AI detection on 100 documents.', '{"event":"tool_used","tool":"detector","count":100}', 100, true, true),
  ('humanize_50_articles', 'Humanize 50 articles', 'Rewrite 50 articles with the Humanizer.', '{"event":"tool_used","tool":"humanizer","count":50}', 50, true, true),
  ('install_extension', 'Install Chrome Extension', 'Add the browser extension.', '{"event":"tool_used","tool":"chrome_extension_install"}', 1, true, true),
  ('connect_plugin', 'Connect WordPress Plugin', 'Connect the WordPress plugin.', '{"event":"tool_used","tool":"wordpress_plugin_install"}', 1, true, true),
  ('generate_api_key', 'Generate API Key', 'Create your first API key.', '{"event":"tool_used","tool":"api_key_created"}', 1, true, true),
  ('upgrade_to_pro', 'Upgrade to Pro', 'Unlock premium features.', '{"field":"subscription_plan","not":"free"}', 1, true, true);

INSERT INTO product_tours (tour_key, title, description, steps, trigger_conditions, enabled)
VALUES
  ('dashboard', 'Dashboard Overview', 'Learn your way around the dashboard.', '[{"target":".dashboard-progress","title":"Your Progress","content":"Track activation, achievements, and next steps here.","placement":"bottom"},{"target":".dashboard-recommendations","title":"Recommended Next Step","content":"We suggest the best action based on your activity.","placement":"bottom"}]'::jsonb, '{"page":"/dashboard"}', true),
  ('detector', 'AI Detector Tour', 'Learn how to analyze content.', '[{"target":".detector-input","title":"Paste Content","content":"Paste your text here for analysis.","placement":"bottom"},{"target":".detector-submit","title":"Analyze","content":"Click to run the AI detection scan.","placement":"right"}]'::jsonb, '{"page":"/ai-detector"}', true),
  ('humanizer', 'Humanizer Tour', 'Rewrite AI text to sound natural.', '[{"target":".humanizer-input","title":"Input Text","content":"Paste AI-generated text you want to humanize.","placement":"bottom"},{"target":".humanizer-submit","title":"Humanize","content":"Click to rewrite your content.","placement":"right"}]'::jsonb, '{"page":"/humanizer"}', true);

INSERT INTO feature_announcements (title, description, content, cta_text, cta_url, target_segments, priority, start_date, end_date, enabled)
VALUES
  ('Progress Dashboard is Live', 'Track your activation, achievements, and product usage in one place.', 'Visit the new Progress Dashboard to see your lifecycle stage, activation score, and personalized recommendations.', 'View Progress', '/dashboard/progress', '{}', 1, now(), now() + interval '30 days', true);

INSERT INTO user_checklist_progress (customer_profile_id, item_key, completed, completed_at)
SELECT cp.id, aci.item_key, false, NULL
FROM customer_profiles cp
CROSS JOIN activation_checklist_items aci
ON CONFLICT (customer_profile_id, item_key) DO NOTHING;

UPDATE customer_profiles
SET lifecycle_stage = COALESCE(lifecycle_stage, 'registered')
WHERE lifecycle_stage IS NULL;

CREATE OR REPLACE FUNCTION evaluate_lifecycle_stages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec record;
  v_tools int;
  v_active_days int;
  v_last_active timestamptz;
  v_checklist_completed int;
  v_days_since_active int;
  v_new_stage text;
BEGIN
  FOR rec IN SELECT * FROM customer_profiles LOOP
    v_new_stage := rec.lifecycle_stage;

    SELECT COUNT(DISTINCT metadata->>'tool') INTO v_tools
    FROM lead_events
    WHERE customer_profile_id = rec.id AND event_type = 'tool_used' AND created_at > now() - interval '30 days';

    SELECT COUNT(DISTINCT date_trunc('day', created_at)) INTO v_active_days
    FROM lead_events
    WHERE customer_profile_id = rec.id AND created_at > now() - interval '30 days';

    SELECT MAX(created_at) INTO v_last_active
    FROM lead_events
    WHERE customer_profile_id = rec.id;

    SELECT COUNT(*) INTO v_checklist_completed
    FROM user_checklist_progress
    WHERE customer_profile_id = rec.id AND completed = true;

    v_days_since_active := EXTRACT(DAY FROM (now() - COALESCE(v_last_active, rec.created_at)));

    IF rec.email_verified = false OR rec.email_verified IS NULL THEN
      v_new_stage := 'registered';
    ELSIF v_checklist_completed >= 3 AND rec.lifecycle_stage IN ('registered', 'email_verified') THEN
      v_new_stage := 'activated';
    ELSIF v_tools >= 2 AND rec.lifecycle_stage = 'activated' THEN
      v_new_stage := 'engaged';
    ELSIF v_active_days >= 15 AND v_tools >= 3 AND rec.lifecycle_stage IN ('activated', 'engaged') THEN
      v_new_stage := 'power_user';
    END IF;

    IF rec.subscription_plan IS NOT NULL AND rec.subscription_plan <> 'free' THEN
      IF rec.subscription_plan = 'pro' THEN v_new_stage := 'pro_customer';
      ELSIF rec.subscription_plan = 'business' THEN v_new_stage := 'business_customer';
      ELSIF rec.subscription_plan = 'enterprise' THEN v_new_stage := 'enterprise_customer';
      END IF;
    END IF;

    IF v_days_since_active > 60 AND rec.lifecycle_stage NOT IN ('churned') THEN
      v_new_stage := 'churned';
    ELSIF v_days_since_active > 30 AND rec.lifecycle_stage NOT IN ('inactive', 'at_risk', 'churned') THEN
      v_new_stage := 'inactive';
    ELSIF v_days_since_active > 14 AND rec.lifecycle_stage IN ('engaged', 'power_user', 'pro_customer') THEN
      v_new_stage := 'at_risk';
    END IF;

    IF rec.lifecycle_stage = 'churned' AND v_days_since_active <= 30 THEN
      v_new_stage := 'recovered';
    END IF;

    IF v_new_stage IS DISTINCT FROM rec.lifecycle_stage THEN
      UPDATE customer_profiles
      SET lifecycle_stage = v_new_stage,
          previous_stage = rec.lifecycle_stage,
          stage_updated_at = now()
      WHERE id = rec.id;

      INSERT INTO user_lifecycle_history (customer_profile_id, from_stage, to_stage, trigger, changed_at)
      VALUES (rec.id, rec.lifecycle_stage, v_new_stage, 'scheduled_evaluation', now());

      INSERT INTO user_notifications (customer_profile_id, notification_type, title, message, metadata)
      VALUES (rec.id, 'lifecycle_stage_change', 'Stage Updated',
              'Your lifecycle stage changed to ' || v_new_stage,
              jsonb_build_object('from_stage', rec.lifecycle_stage, 'to_stage', v_new_stage));
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION calculate_activation_score(profile_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score int := 0;
  v_profile customer_profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM customer_profiles WHERE id = profile_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  IF v_profile.email_verified THEN v_score := v_score + 15; END IF;
  IF v_profile.full_name IS NOT NULL AND v_profile.full_name <> '' AND v_profile.role IS NOT NULL AND v_profile.role <> '' THEN
    v_score := v_score + 10;
  END IF;
  IF EXISTS (SELECT 1 FROM user_checklist_progress WHERE customer_profile_id = profile_id AND item_key = 'first_scan' AND completed = true) THEN v_score := v_score + 20; END IF;
  IF EXISTS (SELECT 1 FROM user_checklist_progress WHERE customer_profile_id = profile_id AND item_key = 'first_humanize' AND completed = true) THEN v_score := v_score + 15; END IF;
  IF EXISTS (SELECT 1 FROM user_checklist_progress WHERE customer_profile_id = profile_id AND (item_key = 'install_extension' OR item_key = 'install_plugin' OR item_key = 'first_api_key') AND completed = true) THEN v_score := v_score + 10; END IF;
  IF EXISTS (SELECT 1 FROM user_checklist_progress WHERE customer_profile_id = profile_id AND item_key = 'save_report' AND completed = true) THEN v_score := v_score + 10; END IF;
  IF EXISTS (SELECT 1 FROM user_journey_stages WHERE customer_profile_id = profile_id AND stage_key = 'pricing_visit' AND completed = true) THEN v_score := v_score + 5; END IF;
  IF v_profile.subscription_plan IS NOT NULL AND v_profile.subscription_plan <> 'free' THEN v_score := v_score + 5; END IF;

  RETURN LEAST(GREATEST(v_score, 0), 100);
END;
$$;

CREATE OR REPLACE FUNCTION calculate_health_score(profile_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score int := 0;
  v_login_days int;
  v_recent_actions int;
  v_tools int;
  v_checklist int;
  v_consistency int;
BEGIN
  SELECT COUNT(DISTINCT date_trunc('day', created_at)) INTO v_login_days
  FROM lead_events
  WHERE customer_profile_id = profile_id AND event_type IN ('page_view', 'tool_used') AND created_at > now() - interval '30 days';

  SELECT COUNT(*) INTO v_recent_actions
  FROM lead_events
  WHERE customer_profile_id = profile_id AND created_at > now() - interval '7 days';

  SELECT COUNT(DISTINCT metadata->>'tool') INTO v_tools
  FROM lead_events
  WHERE customer_profile_id = profile_id AND event_type = 'tool_used';

  SELECT COUNT(*) INTO v_checklist
  FROM user_checklist_progress
  WHERE customer_profile_id = profile_id AND completed = true;

  v_consistency := LEAST(v_login_days, 30);

  v_score := ROUND((LEAST(v_login_days, 30) / 30.0) * 20)::int
           + LEAST(v_recent_actions, 20)
           + ROUND((LEAST(v_tools, 7) / 7.0) * 20)::int
           + ROUND((LEAST(v_tools, 7) / 7.0) * 15)::int
           + (CASE WHEN EXISTS (SELECT 1 FROM customer_profiles WHERE id = profile_id AND subscription_plan IS NOT NULL AND subscription_plan <> 'free') THEN 10 ELSE 0 END)
           + ROUND((v_consistency / 30.0) * 10)::int
           + ROUND((v_checklist / 10.0) * 5)::int;

  RETURN LEAST(GREATEST(v_score, 0), 100);
END;
$$;

CREATE OR REPLACE FUNCTION calculate_upgrade_readiness(profile_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score int := 0;
  v_detector_7d int;
  v_tools int;
  v_pricing_visits int;
  v_business_actions int;
BEGIN
  SELECT COUNT(*) INTO v_detector_7d
  FROM lead_events
  WHERE customer_profile_id = profile_id AND event_type = 'tool_used' AND metadata->>'tool' = 'detector' AND created_at > now() - interval '7 days';

  SELECT COUNT(DISTINCT metadata->>'tool') INTO v_tools
  FROM lead_events
  WHERE customer_profile_id = profile_id AND event_type = 'tool_used';

  SELECT COUNT(*) INTO v_pricing_visits
  FROM lead_events
  WHERE customer_profile_id = profile_id AND event_type = 'cta_click' AND (metadata->>'cta' = 'pricing' OR metadata->>'cta' = 'pricing_visit') AND created_at > now() - interval '30 days';

  v_business_actions := (SELECT COUNT(*) FROM lead_events WHERE customer_profile_id = profile_id AND event_type = 'tool_used' AND metadata->>'tool' = 'api_key_created')
                      + (SELECT COUNT(*) FROM lead_events WHERE customer_profile_id = profile_id AND event_type = 'cta_click' AND metadata->>'cta' = 'business');

  v_score := (CASE WHEN v_detector_7d > 20 THEN 20 WHEN v_detector_7d > 10 THEN 10 ELSE LEAST(v_detector_7d, 10) END)
           + (CASE WHEN v_tools >= 4 THEN 20 WHEN v_tools >= 3 THEN 10 ELSE v_tools * 5 END)
           + (CASE WHEN v_pricing_visits >= 3 THEN 15 WHEN v_pricing_visits >= 1 THEN 5 ELSE 0 END)
           + (CASE WHEN v_business_actions > 0 THEN 20 ELSE 0 END)
           + 15;

  RETURN LEAST(GREATEST(v_score, 0), 100);
END;
$$;

CREATE OR REPLACE FUNCTION refresh_lifecycle_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec record;
  v_score int;
BEGIN
  PERFORM evaluate_lifecycle_stages();
  FOR rec IN SELECT id FROM customer_profiles LOOP
    v_score := calculate_activation_score(rec.id);
    UPDATE customer_profiles SET activation_score = v_score, activation_score_updated_at = now() WHERE id = rec.id;
    v_score := calculate_health_score(rec.id);
    UPDATE customer_profiles SET health_score = v_score, health_score_updated_at = now() WHERE id = rec.id;
    v_score := calculate_upgrade_readiness(rec.id);
    UPDATE customer_profiles SET upgrade_readiness_score = v_score, upgrade_readiness_updated_at = now() WHERE id = rec.id;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION get_lifecycle_analytics(start_date date DEFAULT (now() - interval '30 days')::date, end_date date DEFAULT now()::date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'lifecycle_distribution', (SELECT jsonb_agg(jsonb_build_object('stage', lifecycle_stage, 'count', cnt)) FROM (SELECT lifecycle_stage, COUNT(*) as cnt FROM customer_profiles WHERE lifecycle_stage IS NOT NULL GROUP BY lifecycle_stage) s),
    'activation_rate', (SELECT ROUND((COUNT(*) FILTER (WHERE activation_score >= 60)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) FROM customer_profiles),
    'dau', (SELECT COUNT(DISTINCT customer_profile_id) FROM lead_events WHERE created_at > now() - interval '1 day'),
    'wau', (SELECT COUNT(DISTINCT customer_profile_id) FROM lead_events WHERE created_at > now() - interval '7 days'),
    'mau', (SELECT COUNT(DISTINCT customer_profile_id) FROM lead_events WHERE created_at > now() - interval '30 days'),
    'power_users', (SELECT COUNT(*) FROM customer_profiles WHERE lifecycle_stage = 'power_user'),
    'inactive_users', (SELECT COUNT(*) FROM customer_profiles WHERE lifecycle_stage IN ('inactive', 'at_risk', 'churned')),
    'at_risk_users', (SELECT COUNT(*) FROM customer_profiles WHERE lifecycle_stage = 'at_risk'),
    'average_activation_score', (SELECT ROUND(AVG(activation_score), 2) FROM customer_profiles),
    'average_health_score', (SELECT ROUND(AVG(health_score), 2) FROM customer_profiles)
  ) INTO result;
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION get_activation_funnel()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'stages', jsonb_build_array(
      jsonb_build_object('stage_key','visitors','label','Visitors','count', (SELECT COUNT(DISTINCT id) FROM anonymous_visitors)),
      jsonb_build_object('stage_key','signups','label','Signups','count', (SELECT COUNT(*) FROM customer_profiles)),
      jsonb_build_object('stage_key','verified','label','Email Verified','count', (SELECT COUNT(*) FROM customer_profiles WHERE email_verified = true)),
      jsonb_build_object('stage_key','first_scan','label','First Scan','count', (SELECT COUNT(DISTINCT customer_profile_id) FROM user_checklist_progress WHERE item_key = 'first_scan' AND completed = true)),
      jsonb_build_object('stage_key','second_tool','label','Second Tool','count', (SELECT COUNT(*) FROM (SELECT customer_profile_id FROM user_checklist_progress WHERE completed = true AND item_key IN ('first_humanize','first_plagiarism','first_api_key','install_extension','install_plugin') GROUP BY customer_profile_id HAVING COUNT(*) >= 2) t)),
      jsonb_build_object('stage_key','extension_install','label','Extension Install','count', (SELECT COUNT(DISTINCT customer_profile_id) FROM user_checklist_progress WHERE item_key = 'install_extension' AND completed = true)),
      jsonb_build_object('stage_key','pricing_visit','label','Pricing Visit','count', (SELECT COUNT(DISTINCT customer_profile_id) FROM user_journey_stages WHERE stage_key = 'pricing_visit' AND completed = true)),
      jsonb_build_object('stage_key','upgrade','label','Upgraded','count', (SELECT COUNT(*) FROM customer_profiles WHERE subscription_plan IS NOT NULL AND subscription_plan <> 'free')),
      jsonb_build_object('stage_key','retained','label','Retained (30d)','count', (SELECT COUNT(DISTINCT customer_profile_id) FROM lead_events WHERE created_at > now() - interval '30 days'))
    )
  ) INTO result;
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION get_feature_adoption_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'features', jsonb_build_array(
      jsonb_build_object('feature_key','detector','total_users', (SELECT COUNT(DISTINCT customer_profile_id) FROM lead_events WHERE event_type = 'tool_used' AND metadata->>'tool' = 'detector'), 'active_users_week', (SELECT COUNT(DISTINCT customer_profile_id) FROM lead_events WHERE event_type = 'tool_used' AND metadata->>'tool' = 'detector' AND created_at > now() - interval '7 days')),
      jsonb_build_object('feature_key','humanizer','total_users', (SELECT COUNT(DISTINCT customer_profile_id) FROM lead_events WHERE event_type = 'tool_used' AND metadata->>'tool' = 'humanizer'), 'active_users_week', (SELECT COUNT(DISTINCT customer_profile_id) FROM lead_events WHERE event_type = 'tool_used' AND metadata->>'tool' = 'humanizer' AND created_at > now() - interval '7 days')),
      jsonb_build_object('feature_key','plagiarism','total_users', (SELECT COUNT(DISTINCT customer_profile_id) FROM lead_events WHERE event_type = 'tool_used' AND metadata->>'tool' = 'plagiarism'), 'active_users_week', (SELECT COUNT(DISTINCT customer_profile_id) FROM lead_events WHERE event_type = 'tool_used' AND metadata->>'tool' = 'plagiarism' AND created_at > now() - interval '7 days')),
      jsonb_build_object('feature_key','api','total_users', (SELECT COUNT(DISTINCT customer_profile_id) FROM lead_events WHERE event_type = 'tool_used' AND metadata->>'tool' = 'api_key_created'), 'active_users_week', (SELECT COUNT(DISTINCT customer_profile_id) FROM lead_events WHERE event_type = 'tool_used' AND metadata->>'tool' = 'api_key_created' AND created_at > now() - interval '7 days')),
      jsonb_build_object('feature_key','extension','total_users', (SELECT COUNT(DISTINCT customer_profile_id) FROM lead_events WHERE event_type = 'tool_used' AND metadata->>'tool' = 'chrome_extension_install'), 'active_users_week', (SELECT COUNT(DISTINCT customer_profile_id) FROM lead_events WHERE event_type = 'tool_used' AND metadata->>'tool' = 'chrome_extension_install' AND created_at > now() - interval '7 days')),
      jsonb_build_object('feature_key','plugin','total_users', (SELECT COUNT(DISTINCT customer_profile_id) FROM lead_events WHERE event_type = 'tool_used' AND metadata->>'tool' = 'wordpress_plugin_install'), 'active_users_week', (SELECT COUNT(DISTINCT customer_profile_id) FROM lead_events WHERE event_type = 'tool_used' AND metadata->>'tool' = 'wordpress_plugin_install' AND created_at > now() - interval '7 days'))
    )
  ) INTO result;
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION complete_checklist_item(p_profile_id uuid, p_item_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_checklist_progress (customer_profile_id, item_key, completed, completed_at)
  VALUES (p_profile_id, p_item_key, true, now())
  ON CONFLICT (customer_profile_id, item_key)
  DO UPDATE SET completed = true, completed_at = COALESCE(user_checklist_progress.completed_at, now())
  WHERE user_checklist_progress.completed = false;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION unlock_milestone(p_profile_id uuid, p_milestone_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_milestones (customer_profile_id, milestone_key, unlocked_at)
  VALUES (p_profile_id, p_milestone_key, now())
  ON CONFLICT (customer_profile_id, milestone_key) DO NOTHING;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION record_journey_stage(p_profile_id uuid, p_stage_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_journey_stages (customer_profile_id, stage_key, completed, completed_at)
  VALUES (p_profile_id, p_stage_key, true, now())
  ON CONFLICT (customer_profile_id, stage_key)
  DO UPDATE SET completed = true, completed_at = COALESCE(user_journey_stages.completed_at, now())
  WHERE user_journey_stages.completed = false;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION set_user_goal(p_profile_id uuid, p_goal_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target int;
BEGIN
  SELECT target INTO v_target FROM customer_goals WHERE goal_key = p_goal_key AND enabled = true;
  IF NOT FOUND THEN RETURN false; END IF;
  INSERT INTO user_goals (customer_profile_id, goal_key, progress, target)
  VALUES (p_profile_id, p_goal_key, 0, v_target)
  ON CONFLICT (customer_profile_id, goal_key) DO NOTHING;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION update_goal_progress(p_profile_id uuid, p_goal_key text, p_progress int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_goals
  SET progress = LEAST(p_progress, target),
      completed = (LEAST(p_progress, target) >= target),
      completed_at = CASE WHEN LEAST(p_progress, target) >= target AND completed = false THEN now() ELSE completed_at END
  WHERE customer_profile_id = p_profile_id AND goal_key = p_goal_key;
  RETURN true;
END;
$$;
