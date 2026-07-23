CREATE TABLE IF NOT EXISTS keyword_intelligence_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  seed_keyword TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  language TEXT DEFAULT 'en',
  data_source TEXT DEFAULT 'Sample Data',
  status TEXT DEFAULT 'pending',
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE keyword_intelligence_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own keyword_intelligence_reports" ON keyword_intelligence_reports FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);