
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = user_uuid AND role::text = 'admin');
$$;

ALTER TABLE lead_events ADD COLUMN IF NOT EXISTS customer_profile_id uuid;

CREATE TABLE IF NOT EXISTS customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
  visitor_id text UNIQUE,
  email text,
  full_name text,
  username text,
  company text,
  role text DEFAULT 'user',
  country text,
  language text,
  timezone text,
  first_landing_page text,
  first_referrer text,
  first_channel text,
  first_utm_source text,
  first_utm_medium text,
  first_utm_campaign text,
  first_utm_content text,
  first_utm_term text,
  last_referrer text,
  last_channel text,
  last_utm_source text,
  last_utm_medium text,
  last_utm_campaign text,
  last_utm_content text,
  last_utm_term text,
  registration_source text,
  signup_at timestamptz,
  last_login_at timestamptz,
  engagement_score integer NOT NULL DEFAULT 0,
  engagement_level text DEFAULT 'low',
  lead_status text DEFAULT 'new',
  lifetime_value numeric(12,2) DEFAULT 0,
  total_spend numeric(12,2) DEFAULT 0,
  subscription_plan text DEFAULT 'free',
  account_status text DEFAULT 'active',
  subscription_status text DEFAULT 'active',
  session_count integer NOT NULL DEFAULT 0,
  page_views integer NOT NULL DEFAULT 0,
  cta_clicks integer NOT NULL DEFAULT 0,
  popup_conversions integer NOT NULL DEFAULT 0,
  api_requests integer NOT NULL DEFAULT 0,
  tools_used_count integer NOT NULL DEFAULT 0,
  gdpr_opt_out_tracking boolean NOT NULL DEFAULT false,
  gdpr_opt_out_marketing boolean NOT NULL DEFAULT false,
  is_anonymized boolean NOT NULL DEFAULT false,
  anonymized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_profile_id uuid NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  device_type text,
  browser text,
  os text,
  screen_resolution text,
  language text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  session_count integer NOT NULL DEFAULT 0,
  UNIQUE(customer_profile_id, device_type, browser, os, screen_resolution)
);

CREATE TABLE IF NOT EXISTS customer_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  is_dynamic boolean NOT NULL DEFAULT true,
  rules_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_segment_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_profile_id uuid NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  segment_id uuid NOT NULL REFERENCES customer_segments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(customer_profile_id, segment_id)
);

CREATE TABLE IF NOT EXISTS customer_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_profile_id uuid NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES customer_tags(id) ON DELETE CASCADE,
  assigned_by text DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(customer_profile_id, tag_id)
);

CREATE TABLE IF NOT EXISTS customer_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_profile_id uuid NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  interest text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  inferred_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(customer_profile_id, interest)
);

CREATE TABLE IF NOT EXISTS privacy_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_profile_id uuid NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  consent_type text NOT NULL,
  granted boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(customer_profile_id, consent_type)
);

CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_profile_id uuid NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  admin_notes text
);

CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_visitor_id ON customer_profiles(visitor_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON customer_profiles(email);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_engagement_score ON customer_profiles(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_lead_status ON customer_profiles(lead_status);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_subscription_plan ON customer_profiles(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_country ON customer_profiles(country);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_updated_at ON customer_profiles(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_devices_customer_profile_id ON customer_devices(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment_memberships_customer_profile_id ON customer_segment_memberships(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment_memberships_segment_id ON customer_segment_memberships(segment_id);
CREATE INDEX IF NOT EXISTS idx_customer_tag_assignments_customer_profile_id ON customer_tag_assignments(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_customer_tag_assignments_tag_id ON customer_tag_assignments(tag_id);
CREATE INDEX IF NOT EXISTS idx_customer_interests_customer_profile_id ON customer_interests(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_customer_profile_id ON lead_events(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_visitor_id ON lead_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_user_id ON lead_events(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_event_type ON lead_events(event_type);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_at ON lead_events(created_at DESC);
