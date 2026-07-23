-- Drop leads table since we are replacing it with service_inquiries
DROP TABLE IF EXISTS public.leads CASCADE;

-- Create services table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  features JSONB,
  benefits JSONB,
  pricing_note TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service_inquiries table
CREATE TABLE IF NOT EXISTS public.service_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  budget TEXT,
  message TEXT,
  status TEXT DEFAULT 'New',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_inquiries ENABLE ROW LEVEL SECURITY;

-- Policies for services
CREATE POLICY "Public read services" ON public.services FOR SELECT TO public USING (status = 'Active');
CREATE POLICY "Admins manage services" ON public.services FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Policies for service_inquiries
CREATE POLICY "Anyone can insert service inquiries" ON public.service_inquiries FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins manage service inquiries" ON public.service_inquiries FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
