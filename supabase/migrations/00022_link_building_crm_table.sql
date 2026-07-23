CREATE TABLE IF NOT EXISTS link_building_crm (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_domain TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  publication TEXT,
  link_type TEXT,
  status TEXT DEFAULT 'New',
  open_rate INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE link_building_crm ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own link_building_crm" 
ON link_building_crm 
FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);