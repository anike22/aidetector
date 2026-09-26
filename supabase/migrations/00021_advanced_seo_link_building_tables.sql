CREATE TABLE IF NOT EXISTS link_building_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  domain TEXT NOT NULL,
  data_source TEXT DEFAULT 'Sample Data',
  status TEXT DEFAULT 'pending',
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE link_building_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own link_building_reports" ON link_building_reports FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE TABLE IF NOT EXISTS advanced_seo_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  keyword TEXT NOT NULL,
  domain TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  data_source TEXT DEFAULT 'Sample Data',
  status TEXT DEFAULT 'pending',
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE advanced_seo_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own advanced_seo_plans" ON advanced_seo_plans FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);