-- Prospecting Projects
CREATE TABLE IF NOT EXISTS prospecting_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_country TEXT NOT NULL,
    business_type TEXT NOT NULL,
    company_size TEXT NOT NULL,
    decision_maker_role JSONB NOT NULL,
    goal TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE prospecting_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own prospecting projects" 
    ON prospecting_projects FOR ALL USING (auth.uid() = user_id);

-- Prospecting Companies
CREATE TABLE IF NOT EXISTS prospecting_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES prospecting_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    website TEXT,
    industry TEXT,
    employees TEXT,
    revenue_estimate TEXT,
    location TEXT,
    social_profiles JSONB,
    contact_page TEXT,
    lead_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE prospecting_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own prospecting companies" 
    ON prospecting_companies FOR ALL USING (auth.uid() = user_id);

-- Prospecting Decision Makers
CREATE TABLE IF NOT EXISTS prospecting_decision_makers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES prospecting_companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    job_title TEXT,
    level INTEGER,
    linkedin_profile TEXT,
    email TEXT,
    phone TEXT,
    buying_intent_score INTEGER,
    buying_intent_label TEXT,
    investment_probability INTEGER,
    opportunity_detection TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE prospecting_decision_makers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own decision makers" 
    ON prospecting_decision_makers FOR ALL USING (auth.uid() = user_id);

-- Prospecting Outreach Messages
CREATE TABLE IF NOT EXISTS prospecting_outreach_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_maker_id UUID REFERENCES prospecting_decision_makers(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    outreach_type TEXT NOT NULL,
    tone TEXT,
    key_points TEXT,
    generated_message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE prospecting_outreach_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own outreach messages" 
    ON prospecting_outreach_messages FOR ALL USING (auth.uid() = user_id);

-- Prospecting CRM Leads
CREATE TABLE IF NOT EXISTS prospecting_crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    decision_maker_name TEXT,
    lead_score INTEGER,
    stage TEXT NOT NULL DEFAULT 'New Lead',
    last_activity TEXT,
    next_action TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE prospecting_crm_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own CRM leads" 
    ON prospecting_crm_leads FOR ALL USING (auth.uid() = user_id);
