BEGIN;

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS whitelabel_config jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS allowed_integrations text[] DEFAULT '{}'::text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS developer_profile jsonb DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='marketplace_app_type') THEN
    CREATE TYPE marketplace_app_type AS ENUM ('template','prompt_collection','style','humanization_preset','detection_policy','grammar_rule','classroom_template','workflow','extension','plugin','integration','ai_model');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='marketplace_app_pricing') THEN
    CREATE TYPE marketplace_app_pricing AS ENUM ('free','paid','subscription','freemium');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='marketplace_app_status') THEN
    CREATE TYPE marketplace_app_status AS ENUM ('pending_review','approved','rejected','suspended');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='webhook_event_type') THEN
    CREATE TYPE webhook_event_type AS ENUM ('user_registered','subscription_created','subscription_renewed','subscription_cancelled','scan_completed','humanization_completed','api_quota_reached','organization_created','referral_converted','payment_completed','security_alert');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='webhook_delivery_status') THEN
    CREATE TYPE webhook_delivery_status AS ENUM ('pending','delivered','failed','retrying');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='integration_type') THEN
    CREATE TYPE integration_type AS ENUM ('oauth','api_key','webhook','plugin','zapier','make','n8n','power_automate','native');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='partner_application_status') THEN
    CREATE TYPE partner_application_status AS ENUM ('pending','approved','rejected');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.marketplace_apps (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  app_type marketplace_app_type NOT NULL DEFAULT 'template',
  pricing marketplace_app_pricing NOT NULL DEFAULT 'free',
  price numeric(12,2) DEFAULT 0,
  status marketplace_app_status NOT NULL DEFAULT 'pending_review',
  publisher_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text,
  tags text[] DEFAULT '{}'::text[],
  icon_url text,
  download_url text,
  version text DEFAULT '1.0.0',
  permissions jsonb DEFAULT '{}'::jsonb,
  rating numeric(3,2) DEFAULT 0,
  downloads integer DEFAULT 0,
  revenue_share_percent integer DEFAULT 70,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id uuid NOT NULL REFERENCES public.marketplace_apps(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_installs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id uuid NOT NULL REFERENCES public.marketplace_apps(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  installed_at timestamptz NOT NULL DEFAULT now(),
  settings jsonb DEFAULT '{}'::jsonb,
  UNIQUE(app_id, user_id, organization_id)
);

CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  url text NOT NULL,
  secret text,
  events webhook_event_type[] DEFAULT '{}'::webhook_event_type[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint_id uuid NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event_type webhook_event_type NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  status webhook_delivery_status NOT NULL DEFAULT 'pending',
  http_status integer,
  response_body text,
  attempts integer DEFAULT 0,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partner_applications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_name text NOT NULL,
  website text,
  application_type text NOT NULL,
  description text,
  status partner_application_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sdk_downloads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  language text NOT NULL,
  version text NOT NULL,
  download_url text NOT NULL,
  docs_url text,
  release_notes text,
  is_latest boolean DEFAULT false,
  download_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integration_catalog (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  integration_type integration_type NOT NULL DEFAULT 'native',
  category text,
  icon_url text,
  docs_url text,
  install_url text,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_apps_status ON public.marketplace_apps(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_apps_type ON public.marketplace_apps(app_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_apps_publisher ON public.marketplace_apps(publisher_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_app ON public.marketplace_reviews(app_id);
CREATE INDEX IF NOT EXISTS idx_app_installs_user ON public.app_installs(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_user ON public.webhook_endpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint ON public.webhook_deliveries(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_partner_applications_user ON public.partner_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_applications_status ON public.partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_integration_catalog_slug ON public.integration_catalog(slug);

ALTER TABLE public.marketplace_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_installs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdk_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_catalog ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY marketplace_apps_select_public ON public.marketplace_apps FOR SELECT TO authenticated USING (status = 'approved' OR publisher_id = auth.uid() OR is_app_admin());
CREATE POLICY marketplace_apps_insert_publisher ON public.marketplace_apps FOR INSERT TO authenticated WITH CHECK (publisher_id = auth.uid());
CREATE POLICY marketplace_apps_update_owner_or_admin ON public.marketplace_apps FOR UPDATE TO authenticated USING (publisher_id = auth.uid() OR is_app_admin()) WITH CHECK (publisher_id = auth.uid() OR is_app_admin());

CREATE POLICY marketplace_reviews_select_public ON public.marketplace_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY marketplace_reviews_insert_own ON public.marketplace_reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY app_installs_select_own_or_admin ON public.app_installs FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_app_admin());
CREATE POLICY app_installs_insert_own ON public.app_installs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY app_installs_delete_own ON public.app_installs FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY webhook_endpoints_select_own_or_admin ON public.webhook_endpoints FOR SELECT TO authenticated USING (user_id = auth.uid() OR organization_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid()) OR is_app_admin());
CREATE POLICY webhook_endpoints_insert_own ON public.webhook_endpoints FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY webhook_endpoints_update_own_or_admin ON public.webhook_endpoints FOR UPDATE TO authenticated USING (user_id = auth.uid() OR is_app_admin()) WITH CHECK (user_id = auth.uid() OR is_app_admin());
CREATE POLICY webhook_endpoints_delete_own_or_admin ON public.webhook_endpoints FOR DELETE TO authenticated USING (user_id = auth.uid() OR is_app_admin());

CREATE POLICY webhook_deliveries_select_admin ON public.webhook_deliveries FOR SELECT TO authenticated USING (is_app_admin());
CREATE POLICY webhook_deliveries_insert_admin ON public.webhook_deliveries FOR INSERT TO authenticated WITH CHECK (is_app_admin());

CREATE POLICY partner_applications_select_own_or_admin ON public.partner_applications FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_app_admin());
CREATE POLICY partner_applications_insert_own ON public.partner_applications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY partner_applications_update_admin ON public.partner_applications FOR UPDATE TO authenticated USING (is_app_admin()) WITH CHECK (is_app_admin());

CREATE POLICY sdk_downloads_select_public ON public.sdk_downloads FOR SELECT TO authenticated USING (true);
CREATE POLICY sdk_downloads_insert_admin ON public.sdk_downloads FOR INSERT TO authenticated WITH CHECK (is_app_admin());
CREATE POLICY sdk_downloads_update_admin ON public.sdk_downloads FOR UPDATE TO authenticated USING (is_app_admin()) WITH CHECK (is_app_admin());

CREATE POLICY integration_catalog_select_public ON public.integration_catalog FOR SELECT TO authenticated USING (is_active = true OR is_app_admin());
CREATE POLICY integration_catalog_insert_admin ON public.integration_catalog FOR INSERT TO authenticated WITH CHECK (is_app_admin());
CREATE POLICY integration_catalog_update_admin ON public.integration_catalog FOR UPDATE TO authenticated USING (is_app_admin()) WITH CHECK (is_app_admin());

COMMIT;