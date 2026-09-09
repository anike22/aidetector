CREATE TABLE IF NOT EXISTS gmail_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_expiry TIMESTAMPTZ,
  email_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE gmail_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own gmail_tokens" ON gmail_tokens FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS outreach_emails (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id UUID,
  target_domain TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  gmail_message_id TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE outreach_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own outreach_emails" ON outreach_emails FOR ALL USING (auth.uid() = user_id);

-- Also add a policy for link_building_crm and link_building_reports if not there.
