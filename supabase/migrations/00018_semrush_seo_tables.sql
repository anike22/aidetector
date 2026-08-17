CREATE TABLE IF NOT EXISTS seo_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  domain TEXT NOT NULL,
  report_type TEXT DEFAULT 'domain_overview',
  country TEXT DEFAULT 'US',
  device TEXT DEFAULT 'desktop',
  data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_keywords (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_id UUID REFERENCES seo_reports(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  intent TEXT,
  position INTEGER,
  volume INTEGER,
  cpc NUMERIC(10,2),
  difficulty INTEGER,
  traffic_percent NUMERIC(5,2),
  url TEXT,
  serp_features JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS seo_competitors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_id UUID REFERENCES seo_reports(id) ON DELETE CASCADE,
  competitor_domain TEXT NOT NULL,
  authority_score INTEGER,
  organic_traffic INTEGER,
  organic_keywords INTEGER,
  backlinks INTEGER,
  ai_visibility INTEGER
);

CREATE TABLE IF NOT EXISTS seo_backlinks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_id UUID REFERENCES seo_reports(id) ON DELETE CASCADE,
  source_domain TEXT NOT NULL,
  target_url TEXT,
  anchor_text TEXT,
  authority_score INTEGER,
  link_type TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS seo_ai_visibility (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_id UUID REFERENCES seo_reports(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  visibility_score INTEGER,
  mentions INTEGER,
  cited_pages INTEGER,
  sample_queries JSONB DEFAULT '[]'::jsonb
);

-- RLS
ALTER TABLE seo_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_backlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_ai_visibility ENABLE ROW LEVEL SECURITY;

-- Policies (Public select for anon if needed, or by user_id)
CREATE POLICY "Users can manage their own seo_reports" ON seo_reports FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can manage their own seo_keywords" ON seo_keywords FOR ALL USING (EXISTS (SELECT 1 FROM seo_reports WHERE id = seo_keywords.report_id AND (auth.uid() = user_id OR user_id IS NULL)));
CREATE POLICY "Users can manage their own seo_competitors" ON seo_competitors FOR ALL USING (EXISTS (SELECT 1 FROM seo_reports WHERE id = seo_competitors.report_id AND (auth.uid() = user_id OR user_id IS NULL)));
CREATE POLICY "Users can manage their own seo_backlinks" ON seo_backlinks FOR ALL USING (EXISTS (SELECT 1 FROM seo_reports WHERE id = seo_backlinks.report_id AND (auth.uid() = user_id OR user_id IS NULL)));
CREATE POLICY "Users can manage their own seo_ai_visibility" ON seo_ai_visibility FOR ALL USING (EXISTS (SELECT 1 FROM seo_reports WHERE id = seo_ai_visibility.report_id AND (auth.uid() = user_id OR user_id IS NULL)));