ALTER TABLE link_building_reports RENAME TO link_building_reports_old;

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