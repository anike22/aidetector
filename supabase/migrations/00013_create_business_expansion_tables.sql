-- Leads & CRM
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  industry TEXT,
  monthly_traffic TEXT,
  monthly_revenue TEXT,
  business_size TEXT,
  current_challenge TEXT,
  budget TEXT,
  timeline TEXT,
  message TEXT,
  source TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'New', -- New, Contacted, Qualified, Proposal Sent, Negotiation, Won, Lost
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case Studies
CREATE TABLE IF NOT EXISTS case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  client_name TEXT,
  industry TEXT,
  service_type TEXT,
  challenge TEXT,
  solution TEXT,
  results JSONB,
  featured_image TEXT,
  testimonial TEXT,
  status TEXT DEFAULT 'Draft',
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Experts
CREATE TABLE IF NOT EXISTS experts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  bio TEXT,
  hourly_rate NUMERIC,
  rating NUMERIC DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  skills TEXT[],
  status TEXT DEFAULT 'Pending Review',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES experts(id),
  client_id UUID REFERENCES profiles(id),
  service_type TEXT NOT NULL,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'Confirmed', -- Confirmed, Completed, Cancelled
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate System
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  affiliate_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'Active',
  total_earnings NUMERIC DEFAULT 0,
  pending_payout NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id),
  referred_user_id UUID REFERENCES profiles(id),
  plan TEXT,
  commission_earned NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Orders
CREATE TABLE IF NOT EXISTS service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES profiles(id),
  expert_id UUID REFERENCES experts(id),
  service_type TEXT NOT NULL,
  package TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'Pending', -- Pending, In Progress, Completed, Cancelled
  payment_status TEXT DEFAULT 'Pending',
  milestones JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

-- Admins can read all leads
CREATE POLICY "Admins can manage leads" ON leads FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
-- Anyone can insert leads
CREATE POLICY "Anyone can insert leads" ON leads FOR INSERT TO public WITH CHECK (true);

-- Case studies are public
CREATE POLICY "Public read case studies" ON case_studies FOR SELECT TO public USING (status = 'Published');
CREATE POLICY "Admins manage case studies" ON case_studies FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Experts public read
CREATE POLICY "Public read experts" ON experts FOR SELECT TO public USING (status = 'Active');
CREATE POLICY "Admins manage experts" ON experts FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Users can update their own expert profile" ON experts FOR UPDATE TO authenticated USING (profile_id = auth.uid());

-- Appointments
CREATE POLICY "Users see their own appointments" ON appointments FOR SELECT TO authenticated USING (client_id = auth.uid() OR expert_id IN (SELECT id FROM experts WHERE profile_id = auth.uid()));
CREATE POLICY "Users insert appointments" ON appointments FOR INSERT TO authenticated WITH CHECK (client_id = auth.uid());
CREATE POLICY "Admins manage appointments" ON appointments FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Affiliates
CREATE POLICY "Users see their own affiliate profile" ON affiliates FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "Admins manage affiliates" ON affiliates FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Users insert affiliate profile" ON affiliates FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

-- Service orders
CREATE POLICY "Users see their own orders" ON service_orders FOR SELECT TO authenticated USING (client_id = auth.uid() OR expert_id IN (SELECT id FROM experts WHERE profile_id = auth.uid()));
CREATE POLICY "Admins manage orders" ON service_orders FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
