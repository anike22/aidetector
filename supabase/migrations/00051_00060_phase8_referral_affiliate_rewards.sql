BEGIN;

-- Extend profiles and organizations for referral/affiliate/rewards
ALTER TABLE public.profiles
  ADD COLUMN referral_code text UNIQUE,
  ADD COLUMN affiliate_tier text DEFAULT 'Standard',
  ADD COLUMN affiliate_status text DEFAULT 'none',
  ADD COLUMN points_balance integer DEFAULT 0,
  ADD COLUMN credits_balance integer DEFAULT 0;

ALTER TABLE public.organizations
  ADD COLUMN referral_program_enabled boolean DEFAULT false,
  ADD COLUMN affiliate_program_enabled boolean DEFAULT false;

CREATE UNIQUE INDEX idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX idx_profiles_affiliate_status ON public.profiles(affiliate_status);

-- Backfill referral codes for existing profiles
DO $$
DECLARE
  rec RECORD;
  code text;
BEGIN
  FOR rec IN SELECT id FROM public.profiles WHERE referral_code IS NULL LOOP
    LOOP
      code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = code) THEN
        UPDATE public.profiles SET referral_code = code WHERE id = rec.id;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Custom enums for Phase 8
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='referral_link_type') THEN
    CREATE TYPE referral_link_type AS ENUM ('direct','email','qr','social','team','classroom','api');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='referral_journey_stage') THEN
    CREATE TYPE referral_journey_stage AS ENUM ('visitor','signup','email_verified','first_scan','subscription','renewal');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='affiliate_tier') THEN
    CREATE TYPE affiliate_tier AS ENUM ('Standard','Verified','Professional','Agency','Enterprise_Partner');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='affiliate_application_status') THEN
    CREATE TYPE affiliate_application_status AS ENUM ('Pending','Approved','Rejected','Suspended','Terminated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='affiliate_link_type') THEN
    CREATE TYPE affiliate_link_type AS ENUM ('Tracking','Deep','Campaign');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='commission_type') THEN
    CREATE TYPE commission_type AS ENUM ('Fixed','Percentage','Recurring','OneTime');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='commission_status') THEN
    CREATE TYPE commission_status AS ENUM ('Pending','Approved','Held','Expired','Paid');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='reward_type') THEN
    CREATE TYPE reward_type AS ENUM ('Points','Credits','Badge','Achievement','FreeScan','ExtraAIWords','PremiumTrial','FeatureUnlock','ExclusiveTemplate');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='achievement_type') THEN
    CREATE TYPE achievement_type AS ENUM ('FirstScan','100Scans','FirstHumanization','FirstAPICall','FirstReferral','10Referrals','TeamCreator','PowerUser','Educator','APIExpert','EarlyAdopter');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='marketing_asset_type') THEN
    CREATE TYPE marketing_asset_type AS ENUM ('Logo','BrandGuideline','BannerAd','Screenshot','DemoVideo','EmailTemplate','SocialGraphic','LandingPageTemplate','ProductDescription');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='fraud_type') THEN
    CREATE TYPE fraud_type AS ENUM ('SelfReferral','DuplicateAccount','FakeEmail','VPNAbuse','AutomatedSignup','ReferralLoop','MultipleRewards','SuspiciousPattern');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='fraud_review_status') THEN
    CREATE TYPE fraud_review_status AS ENUM ('Pending','Approved','Rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='payout_status') THEN
    CREATE TYPE payout_status AS ENUM ('Pending','Approved','Processing','Paid','Failed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='leaderboard_type') THEN
    CREATE TYPE leaderboard_type AS ENUM ('TopReferrers','TopAffiliates','MonthlyChallenge','SeasonalCampaign');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='challenge_type') THEN
    CREATE TYPE challenge_type AS ENUM ('Monthly','Seasonal');
  END IF;
END $$;

-- Core tables
CREATE TABLE IF NOT EXISTS public.referral_links (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  code text NOT NULL UNIQUE,
  link_type referral_link_type NOT NULL DEFAULT 'direct',
  attribution_window_days integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.referral_journeys (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_link_id uuid NOT NULL REFERENCES public.referral_links(id) ON DELETE CASCADE,
  visitor_id text,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  stage referral_journey_stage NOT NULL DEFAULT 'visitor',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.affiliate_applications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status affiliate_application_status NOT NULL DEFAULT 'Pending',
  tier affiliate_tier NOT NULL DEFAULT 'Standard',
  website text,
  social_profiles text,
  marketing_experience text,
  application_data jsonb DEFAULT '{}'::jsonb,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  link_type affiliate_link_type NOT NULL DEFAULT 'Tracking',
  campaign_name text,
  coupon_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.commissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_link_id uuid REFERENCES public.referral_links(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  transaction_id uuid REFERENCES public.user_transactions(id) ON DELETE SET NULL,
  commission_type commission_type NOT NULL DEFAULT 'Percentage',
  amount numeric(12,2) NOT NULL DEFAULT 0,
  status commission_status NOT NULL DEFAULT 'Pending',
  eligible_plan text,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  paid_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.rewards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type reward_type NOT NULL,
  amount integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  earned_at timestamptz NOT NULL DEFAULT now(),
  redeemed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type achievement_type NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketing_assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_type marketing_asset_type NOT NULL,
  name text NOT NULL,
  file_url text NOT NULL,
  description text,
  uploaded_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referral_analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_link_id uuid NOT NULL REFERENCES public.referral_links(id) ON DELETE CASCADE,
  date date NOT NULL,
  clicks integer NOT NULL DEFAULT 0,
  signups integer NOT NULL DEFAULT 0,
  verified_users integer NOT NULL DEFAULT 0,
  active_users integer NOT NULL DEFAULT 0,
  trial_starts integer NOT NULL DEFAULT 0,
  paid_subscriptions integer NOT NULL DEFAULT 0,
  renewals integer NOT NULL DEFAULT 0,
  revenue numeric(12,2) NOT NULL DEFAULT 0,
  ltv numeric(12,2) NOT NULL DEFAULT 0,
  conversion_rate numeric(5,4) NOT NULL DEFAULT 0,
  UNIQUE(referral_link_id, date)
);

CREATE TABLE IF NOT EXISTS public.fraud_reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_link_id uuid REFERENCES public.referral_links(id) ON DELETE SET NULL,
  affiliate_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fraud_type fraud_type NOT NULL,
  status fraud_review_status NOT NULL DEFAULT 'Pending',
  notes text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  status payout_status NOT NULL DEFAULT 'Pending',
  payout_method text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  paid_at timestamptz,
  failed_reason text
);

CREATE TABLE IF NOT EXISTS public.leaderboards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  leaderboard_type leaderboard_type NOT NULL,
  period text NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  rank integer,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(leaderboard_type, period, user_id)
);

CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_type challenge_type NOT NULL,
  name text NOT NULL,
  description text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  reward jsonb DEFAULT '{}'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Helper functions
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text AS $$
DECLARE
  code text;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    IF NOT EXISTS (SELECT 1 FROM public.referral_links WHERE code = code) THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.generate_unique_referral_code_for_user()
RETURNS trigger AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    LOOP
      NEW.referral_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = NEW.referral_code AND id <> NEW.id) THEN
        RETURN NEW;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_profile_referral_code ON public.profiles;
CREATE TRIGGER set_profile_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_unique_referral_code_for_user();

-- Storage bucket for marketing assets
INSERT INTO storage.buckets (id, name, public) VALUES ('marketing_assets', 'marketing_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referral_links_user_id ON public.referral_links(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON public.referral_links(code);
CREATE INDEX IF NOT EXISTS idx_referral_links_org_id ON public.referral_links(organization_id);
CREATE INDEX IF NOT EXISTS idx_referral_journeys_link_id ON public.referral_journeys(referral_link_id);
CREATE INDEX IF NOT EXISTS idx_referral_journeys_referred_user ON public.referral_journeys(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_apps_user ON public.affiliate_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_apps_status ON public.affiliate_applications(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_user ON public.affiliate_links(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_affiliate ON public.commissions(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commissions(status);
CREATE INDEX IF NOT EXISTS idx_rewards_user ON public.rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_status ON public.fraud_reviews(status);
CREATE INDEX IF NOT EXISTS idx_payouts_user ON public.payouts(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);
CREATE INDEX IF NOT EXISTS idx_leaderboards_type_period ON public.leaderboards(leaderboard_type, period);

-- RLS
ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY referral_links_select_own ON public.referral_links FOR SELECT TO authenticated USING (user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY referral_links_insert_own ON public.referral_links FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY referral_links_update_own ON public.referral_links FOR UPDATE TO authenticated USING (user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY referral_links_delete_own ON public.referral_links FOR DELETE TO authenticated USING (user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY referral_journeys_select_owner ON public.referral_journeys FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.referral_links WHERE id = referral_link_id AND user_id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY referral_journeys_insert_service ON public.referral_journeys FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY referral_journeys_update_owner ON public.referral_journeys FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.referral_links WHERE id = referral_link_id AND user_id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY affiliate_apps_select_own_or_admin ON public.affiliate_applications FOR SELECT TO authenticated USING (user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY affiliate_apps_insert_own ON public.affiliate_applications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY affiliate_apps_update_admin ON public.affiliate_applications FOR UPDATE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY affiliate_links_select_own ON public.affiliate_links FOR SELECT TO authenticated USING (affiliate_user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY affiliate_links_insert_own ON public.affiliate_links FOR INSERT TO authenticated WITH CHECK (affiliate_user_id = auth.uid());
CREATE POLICY affiliate_links_update_own ON public.affiliate_links FOR UPDATE TO authenticated USING (affiliate_user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY affiliate_links_delete_own ON public.affiliate_links FOR DELETE TO authenticated USING (affiliate_user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY commissions_select_affiliate_or_admin ON public.commissions FOR SELECT TO authenticated USING (affiliate_user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY commissions_insert_admin ON public.commissions FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY commissions_update_admin ON public.commissions FOR UPDATE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY rewards_select_own ON public.rewards FOR SELECT TO authenticated USING (user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY rewards_insert_system_or_admin ON public.rewards FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY rewards_update_admin ON public.rewards FOR UPDATE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY achievements_select_own ON public.achievements FOR SELECT TO authenticated USING (user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY achievements_insert_system_or_admin ON public.achievements FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY achievements_update_admin ON public.achievements FOR UPDATE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY marketing_assets_select_all ON public.marketing_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY marketing_assets_insert_admin ON public.marketing_assets FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY marketing_assets_update_admin ON public.marketing_assets FOR UPDATE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY marketing_assets_delete_admin ON public.marketing_assets FOR DELETE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY referral_analytics_select_owner ON public.referral_analytics FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.referral_links WHERE id = referral_link_id AND user_id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY fraud_reviews_select_admin ON public.fraud_reviews FOR SELECT TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY fraud_reviews_insert_admin_or_system ON public.fraud_reviews FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY fraud_reviews_update_admin ON public.fraud_reviews FOR UPDATE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY payouts_select_own_or_admin ON public.payouts FOR SELECT TO authenticated USING (affiliate_user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY payouts_insert_own ON public.payouts FOR INSERT TO authenticated WITH CHECK (affiliate_user_id = auth.uid());
CREATE POLICY payouts_update_admin ON public.payouts FOR UPDATE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY leaderboards_select_all ON public.leaderboards FOR SELECT TO authenticated USING (true);
CREATE POLICY leaderboards_insert_admin ON public.leaderboards FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY leaderboards_update_admin ON public.leaderboards FOR UPDATE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY challenges_select_all ON public.challenges FOR SELECT TO authenticated USING (true);
CREATE POLICY challenges_insert_admin ON public.challenges FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY challenges_update_admin ON public.challenges FOR UPDATE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY challenges_delete_admin ON public.challenges FOR DELETE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

COMMIT;