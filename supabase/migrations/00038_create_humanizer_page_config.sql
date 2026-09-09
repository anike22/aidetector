
-- Humanizer page admin-configurable content
CREATE TABLE IF NOT EXISTS humanizer_page_config (
  id          text PRIMARY KEY DEFAULT 'singleton',
  stats       jsonb  NOT NULL DEFAULT '[]',
  testimonials jsonb NOT NULL DEFAULT '[]',
  faqs        jsonb  NOT NULL DEFAULT '[]',
  examples    jsonb  NOT NULL DEFAULT '[]',
  benchmarks  jsonb  NOT NULL DEFAULT '[]',
  models      jsonb  NOT NULL DEFAULT '[]',
  use_cases   jsonb  NOT NULL DEFAULT '[]',
  features    jsonb  NOT NULL DEFAULT '[]',
  eeat        jsonb  NOT NULL DEFAULT '[]',
  version_history jsonb NOT NULL DEFAULT '[]',
  educational_content jsonb NOT NULL DEFAULT '[]',
  updated_at  timestamptz DEFAULT now(),
  updated_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Only admins can read/write
ALTER TABLE humanizer_page_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_humanizer_config" ON humanizer_page_config;
CREATE POLICY "admin_humanizer_config" ON humanizer_page_config
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Seed a singleton row so upsert always works
INSERT INTO humanizer_page_config (id)
VALUES ('singleton')
ON CONFLICT (id) DO NOTHING;
