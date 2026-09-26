CREATE TABLE IF NOT EXISTS humanizer_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- For anonymous tracking
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS humanizer_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  humanized_text TEXT NOT NULL,
  mode TEXT,
  level TEXT,
  word_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE humanizer_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own humanizer_usage" ON humanizer_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own humanizer_usage" ON humanizer_usage FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE humanizer_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own humanizer_history" ON humanizer_history FOR ALL USING (auth.uid() = user_id);