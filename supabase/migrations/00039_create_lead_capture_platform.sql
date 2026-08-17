
-- ══════════════════════════════════════════════════════════════════
-- LEAD CAPTURE & USER ACQUISITION PLATFORM
-- ══════════════════════════════════════════════════════════════════

-- 1. ANONYMOUS VISITORS
CREATE TABLE anonymous_visitors (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id      text NOT NULL UNIQUE,
  first_seen_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  session_count   integer NOT NULL DEFAULT 1,
  landing_page    text,
  referrer_url    text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_content     text,
  utm_term        text,
  country         text,
  device_type     text,
  browser         text,
  os              text,
  language        text,
  visited_pages   jsonb NOT NULL DEFAULT '[]',
  tools_used      jsonb NOT NULL DEFAULT '[]',
  merged_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  merged_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX anonymous_visitors_visitor_id_idx ON anonymous_visitors(visitor_id);
CREATE INDEX anonymous_visitors_merged_user_id_idx ON anonymous_visitors(merged_user_id);
ALTER TABLE anonymous_visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_visitors_insert" ON anonymous_visitors FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_visitors_select_own" ON anonymous_visitors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_visitors_update_own" ON anonymous_visitors FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. LEAD EVENTS
CREATE TABLE lead_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id    text,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type    text NOT NULL,
  page          text,
  popup_id      uuid,
  cta_id        uuid,
  ab_variant    text,
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lead_events_visitor_id_idx ON lead_events(visitor_id);
CREATE INDEX lead_events_user_id_idx ON lead_events(user_id);
CREATE INDEX lead_events_event_type_idx ON lead_events(event_type);
CREATE INDEX lead_events_created_at_idx ON lead_events(created_at);
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lead_events_insert" ON lead_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "lead_events_select_own" ON lead_events FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "lead_events_admin_all" ON lead_events FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 3. POPUP CONFIGS
CREATE TABLE popup_configs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  page_context    text NOT NULL DEFAULT 'global',
  trigger_type    text NOT NULL,
  trigger_value   jsonb NOT NULL DEFAULT '{}',
  headline        text NOT NULL,
  subheadline     text NOT NULL,
  benefits        jsonb NOT NULL DEFAULT '[]',
  cta_primary     text NOT NULL DEFAULT 'Create Free Account',
  cta_secondary   text,
  is_active       boolean NOT NULL DEFAULT true,
  ab_test_id      uuid,
  priority        integer NOT NULL DEFAULT 0,
  frequency_max_per_session integer NOT NULL DEFAULT 1,
  frequency_max_per_day     integer NOT NULL DEFAULT 2,
  cooldown_hours            integer NOT NULL DEFAULT 24,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE popup_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "popup_configs_select_all" ON popup_configs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "popup_configs_admin_all" ON popup_configs FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 4. CTA CONFIGS
CREATE TABLE cta_configs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  page_context  text NOT NULL DEFAULT 'global',
  cta_type      text NOT NULL DEFAULT 'inline',
  label         text NOT NULL,
  sub_label     text,
  icon          text,
  is_active     boolean NOT NULL DEFAULT true,
  ab_test_id    uuid,
  position      text NOT NULL DEFAULT 'bottom',
  section_id    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE cta_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cta_configs_select_all" ON cta_configs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "cta_configs_admin_all" ON cta_configs FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 5. A/B TEST VARIANTS
CREATE TABLE ab_test_variants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name       text NOT NULL,
  variant_name    text NOT NULL,
  weight          integer NOT NULL DEFAULT 50,
  headline        text,
  cta_text        text,
  subheadline     text,
  is_active       boolean NOT NULL DEFAULT true,
  impressions     integer NOT NULL DEFAULT 0,
  clicks          integer NOT NULL DEFAULT 0,
  conversions     integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE ab_test_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ab_variants_select_all" ON ab_test_variants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ab_variants_admin_all" ON ab_test_variants FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "ab_variants_update_counters" ON ab_test_variants FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);

-- 6. FREQUENCY RULES
CREATE TABLE frequency_rules (
  id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  max_popups_per_session       integer NOT NULL DEFAULT 2,
  max_popups_per_day           integer NOT NULL DEFAULT 3,
  cooldown_after_dismiss_hours integer NOT NULL DEFAULT 24,
  exit_intent_cooldown_hours   integer NOT NULL DEFAULT 48,
  min_time_on_page_seconds     integer NOT NULL DEFAULT 5,
  updated_at                   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE frequency_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "frequency_rules_select" ON frequency_rules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "frequency_rules_admin_all" ON frequency_rules FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

INSERT INTO frequency_rules (max_popups_per_session, max_popups_per_day, cooldown_after_dismiss_hours, exit_intent_cooldown_hours, min_time_on_page_seconds)
VALUES (2, 3, 24, 48, 5);

-- SEED POPUP CONFIGS
INSERT INTO popup_configs (name, page_context, trigger_type, trigger_value, headline, subheadline, benefits, cta_primary, cta_secondary, priority)
VALUES
  ('Detector Exit Intent', 'detector', 'exit_intent', '{}',
   'Save Your Scan History',
   'Create a free account to never lose your detection results.',
   '["Save unlimited scan history","Compare previous scans side-by-side","Export detailed PDF reports","Track AI content over time","Unlock additional daily scans"]',
   'Create Free Account', 'Continue Without Saving', 10),
  ('Detector Tool Completion', 'detector', 'tool_completion', '{}',
   'Save This Result',
   'Your detection result is ready — create a free account to save it.',
   '["Save scan history","Export reports","Track trends over time","Unlock more daily scans"]',
   'Save Scan Result', 'Dismiss', 9),
  ('Humanizer Exit Intent', 'humanizer', 'exit_intent', '{}',
   'Save Your Rewritten Content',
   'Create a free account to access your writing history anytime.',
   '["Save all rewritten versions","Access your full writing history","Continue editing later","Unlock premium writing modes"]',
   'Save My Work', 'Continue Without Saving', 10),
  ('Humanizer Tool Completion', 'humanizer', 'tool_completion', '{}',
   'Your Content Has Been Humanized',
   'Save this version and access it later from any device.',
   '["Save rewritten versions","Writing history","Premium modes","Continue editing"]',
   'Save This Version', 'Dismiss', 9),
  ('Plagiarism Exit Intent', 'plagiarism', 'exit_intent', '{}',
   'Download Your Originality Report',
   'Create a free account to download and store plagiarism reports.',
   '["Download originality reports","View source history","Store all results","Track over time"]',
   'Create Free Account', 'Dismiss', 10),
  ('API Exit Intent', 'api', 'exit_intent', '{}',
   'Generate Your Free API Key',
   'Access the AIDetector.cx API — free tier available immediately.',
   '["Generate API keys instantly","Track usage & analytics","View request history","Developer documentation"]',
   'Generate Free API Key', 'View Docs First', 10),
  ('Pricing Visit Time', 'pricing', 'time', '{"seconds": 15}',
   'Unlock Unlimited Usage',
   'Create a free account and start with generous free tier limits today.',
   '["Free tier with no credit card","Upgrade anytime","Cancel anytime","All tools included"]',
   'Start For Free', 'View Plans', 8),
  ('Global Scroll 75', 'global', 'scroll', '{"percent": 75}',
   'Enjoying AIDetector.cx?',
   'Create a free account to save your work and track results over time.',
   '["Save your history","Access all tools","Export reports","Free forever tier"]',
   'Create Free Account', 'Dismiss', 5),
  ('Global 60s Time', 'global', 'time', '{"seconds": 60}',
   'Get More From AIDetector.cx',
   'Free accounts include scan history, reports, and unlimited access to educational tools.',
   '["Unlimited history","Export results","All tools","Free to start"]',
   'Create Free Account', 'Dismiss', 3),
  ('Chrome Scroll 50', 'chrome', 'scroll', '{"percent": 50}',
   'Sync Your Browser Activity',
   'Create a free account to sync extension history and save preferences.',
   '["Sync extension history","Save preferences","Feature update notifications","Multi-device support"]',
   'Create Free Account', 'Dismiss', 7),
  ('WordPress Scroll 50', 'wordpress', 'scroll', '{"percent": 50}',
   'Connect Multiple Websites',
   'Create a free account to manage all your WordPress sites in one dashboard.',
   '["Connect multiple websites","View plugin analytics","Plugin update notifications","Team access controls"]',
   'Create Free Account', 'Dismiss', 7),
  ('Second Visit Global', 'global', 'second_visit', '{}',
   'Welcome Back!',
   'You visited before — create a free account so your work is always saved.',
   '["Persistent history","Saved preferences","Continue where you left off"]',
   'Create Free Account', 'Maybe Later', 6);

-- SEED CTA CONFIGS
INSERT INTO cta_configs (name, page_context, cta_type, label, sub_label, icon, position, section_id)
VALUES
  ('Detector Sticky', 'detector', 'sticky', 'Save Scan History', 'Free account — no credit card', 'BookmarkPlus', 'bottom', null),
  ('Humanizer Sticky', 'humanizer', 'sticky', 'Continue Editing Later', 'Save your work for free', 'Save', 'bottom', null),
  ('API Inline After Features', 'api', 'embedded', 'Generate Free API Key', 'Start building in minutes', 'Key', 'after_section', 'features'),
  ('Chrome Inline', 'chrome', 'embedded', 'Sync Browser Activity', 'Free account syncs everything', 'Chrome', 'after_section', 'features'),
  ('WordPress Inline', 'wordpress', 'embedded', 'Manage Plugin Dashboard', 'Connect all your sites for free', 'LayoutDashboard', 'after_section', 'features'),
  ('Pricing Inline', 'pricing', 'embedded', 'Unlock Unlimited Usage', 'Start free — upgrade anytime', 'Zap', 'after_section', 'plans'),
  ('Global FAQ Embedded', 'global', 'embedded', 'Create Free Account', 'No credit card required', 'UserPlus', 'after_section', 'faq');

-- SEED A/B VARIANTS
INSERT INTO ab_test_variants (test_name, variant_name, weight, headline, cta_text, subheadline)
VALUES
  ('detector_exit_headline', 'control', 50, 'Save Your Scan History', 'Create Free Account', 'Create a free account to never lose your detection results.'),
  ('detector_exit_headline', 'variant_a', 50, 'Don''t Lose This Result', 'Save My Result Free', 'Your AI detection result will be gone when you leave — save it now.');
