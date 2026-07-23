CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  feature_name TEXT NOT NULL,
  feature_slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'coming_soon', -- active, coming_soon, hidden, maintenance
  public_message TEXT,
  requires_login BOOLEAN DEFAULT false,
  show_in_navigation BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feature_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  feature_slug TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active/coming_soon/maintenance features" 
  ON feature_flags FOR SELECT USING (true); -- the frontend needs to know everything
CREATE POLICY "Only admins can insert feature_flags" 
  ON feature_flags FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Only admins can update feature_flags" 
  ON feature_flags FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert feature requests" 
  ON feature_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Only admins can read feature requests" 
  ON feature_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Insert initial features
INSERT INTO feature_flags (feature_name, feature_slug, status, show_in_navigation) VALUES
  ('AI Text Detector', 'ai-detector', 'active', true),
  ('AI Humanizer', 'humanizer', 'active', true),
  ('Plagiarism Checker', 'plagiarism-checker', 'active', true),
  ('Contact', 'contact', 'active', true),
  ('Pricing', 'pricing', 'active', true),
  ('Blog', 'blog', 'active', true),
  ('SEO Assistant', 'seo-assistant', 'coming_soon', true),
  ('Technical SEO', 'technical-seo', 'coming_soon', true),
  ('AEO Optimizer', 'aeo-optimizer', 'coming_soon', true),
  ('Link Building CRM', 'link-building', 'coming_soon', true),
  ('Keyword Intelligence', 'keyword-research', 'coming_soon', true),
  ('SEO Agent', 'seo-agent', 'coming_soon', true),
  ('AI Tools Directory', 'tools', 'coming_soon', true),
  ('Marketplace', 'marketplace', 'coming_soon', true),
  ('Content Studio', 'content-studio', 'coming_soon', true),
  ('Community', 'community', 'hidden', false),
  ('SEO Audit', 'seo-audit', 'coming_soon', true),
  ('SEO Dashboard', 'seo-dashboard', 'hidden', false)
ON CONFLICT (feature_slug) DO NOTHING;
