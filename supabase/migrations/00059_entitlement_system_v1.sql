-- Production-ready subscription & entitlement system

-- Seed feature limits for free/pro/enterprise plans.
-- daily_limit = NULL means unlimited; daily_limit = 0 means not available.
INSERT INTO public.feature_limits (feature_slug, plan, daily_limit, monthly_limit) VALUES
  -- Free plan: limited tools
  ('ai_detector', 'free', 5, NULL),
  ('seo_assistant', 'free', 5, NULL),
  ('seo_content_studio', 'free', 5, NULL),
  -- Free plan: pro-only tools blocked
  ('ai_humanizer', 'free', 0, NULL),
  ('ai_image_detector', 'free', 0, NULL),
  ('plagiarism_checker', 'free', 0, NULL),
  ('hallucination_detector', 'free', 0, NULL),
  ('citation_verifier', 'free', 0, NULL),
  -- Pro plan: all tools unlimited
  ('ai_detector', 'pro', NULL, NULL),
  ('seo_assistant', 'pro', NULL, NULL),
  ('seo_content_studio', 'pro', NULL, NULL),
  ('ai_humanizer', 'pro', NULL, NULL),
  ('ai_image_detector', 'pro', NULL, NULL),
  ('plagiarism_checker', 'pro', NULL, NULL),
  ('hallucination_detector', 'pro', NULL, NULL),
  ('citation_verifier', 'pro', NULL, NULL),
  -- Enterprise plan: all tools unlimited
  ('ai_detector', 'enterprise', NULL, NULL),
  ('seo_assistant', 'enterprise', NULL, NULL),
  ('seo_content_studio', 'enterprise', NULL, NULL),
  ('ai_humanizer', 'enterprise', NULL, NULL),
  ('ai_image_detector', 'enterprise', NULL, NULL),
  ('plagiarism_checker', 'enterprise', NULL, NULL),
  ('hallucination_detector', 'enterprise', NULL, NULL),
  ('citation_verifier', 'enterprise', NULL, NULL)
ON CONFLICT (feature_slug, plan) DO UPDATE SET
  daily_limit = EXCLUDED.daily_limit,
  monthly_limit = EXCLUDED.monthly_limit;

-- Daily usage tracking per user per feature per date (in user's timezone)
CREATE TABLE public.user_feature_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_slug text NOT NULL,
  usage_date date NOT NULL,
  used_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature_slug, usage_date)
);

ALTER TABLE public.user_feature_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feature usage"
  ON public.user_feature_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage feature usage"
  ON public.user_feature_usage FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_feature_usage_updated_at
BEFORE UPDATE ON public.user_feature_usage
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Returns the user's effective plan considering organization license
CREATE OR REPLACE FUNCTION public.get_effective_plan(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_plan text;
  v_org_plan text;
BEGIN
  SELECT COALESCE(subscription_plan, 'free') INTO v_user_plan
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_user_plan IS NULL THEN v_user_plan := 'free'; END IF;

  SELECT o.plan INTO v_org_plan
  FROM public.organization_members om
  JOIN public.organizations o ON om.organization_id = o.id
  WHERE om.user_id = p_user_id AND o.status = 'active'
  LIMIT 1;

  IF v_org_plan = 'enterprise' THEN
    RETURN 'enterprise';
  END IF;

  RETURN v_user_plan;
END;
$$;

-- Remaining usage for a feature on the current day in the user's timezone
CREATE OR REPLACE FUNCTION public.get_feature_remaining(
  p_user_id uuid,
  p_feature_slug text,
  p_timezone text DEFAULT 'UTC'
)
RETURNS TABLE(remaining bigint, limit_value bigint, plan text, reset_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan text;
  v_active boolean := false;
  v_limit integer;
  v_date date;
  v_used bigint;
BEGIN
  v_plan := public.get_effective_plan(p_user_id);

  -- Determine whether the paid subscription is still active.
  IF v_plan IN ('pro', 'enterprise') THEN
    SELECT (
      subscription_status IN ('Active', 'trialing')
      AND (plan_end_date IS NULL OR plan_end_date > now())
    ) INTO v_active
    FROM public.profiles
    WHERE id = p_user_id;
    IF NOT v_active THEN
      v_plan := 'free';
    END IF;
  END IF;

  SELECT daily_limit INTO v_limit
  FROM public.feature_limits
  WHERE feature_slug = p_feature_slug AND plan = v_plan;

  IF NOT FOUND THEN
    -- Feature not configured for this plan => deny
    RETURN QUERY SELECT (-1)::bigint, (-1)::bigint, v_plan, NULL::timestamptz;
    RETURN;
  END IF;

  IF v_limit IS NULL THEN
    -- Unlimited
    RETURN QUERY SELECT NULL::bigint, NULL::bigint, v_plan, NULL::timestamptz;
    RETURN;
  END IF;

  v_date := (current_timestamp AT TIME ZONE p_timezone)::date;

  SELECT COALESCE(used_count, 0) INTO v_used
  FROM public.user_feature_usage
  WHERE user_id = p_user_id
    AND feature_slug = p_feature_slug
    AND usage_date = v_date;

  RETURN QUERY SELECT
    GREATEST(v_limit - v_used, 0)::bigint,
    v_limit::bigint,
    v_plan,
    (v_date + interval '1 day')::timestamptz;
END;
$$;

-- Atomic usage increment
CREATE OR REPLACE FUNCTION public.increment_feature_usage(
  p_user_id uuid,
  p_feature_slug text,
  p_timezone text DEFAULT 'UTC'
)
RETURNS TABLE(remaining bigint, limit_value bigint, used bigint, reset_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_limit integer;
  v_date date;
  v_used integer;
  v_remaining integer;
BEGIN
  SELECT daily_limit INTO v_limit
  FROM public.feature_limits
  WHERE feature_slug = p_feature_slug AND plan = public.get_effective_plan(p_user_id);

  IF NOT FOUND OR v_limit IS NULL THEN
    -- Unlimited or not configured; nothing to track
    RETURN QUERY SELECT NULL::bigint, NULL::bigint, 0::bigint, NULL::timestamptz;
    RETURN;
  END IF;

  v_date := (current_timestamp AT TIME ZONE p_timezone)::date;

  INSERT INTO public.user_feature_usage (user_id, feature_slug, usage_date, used_count)
  VALUES (p_user_id, p_feature_slug, v_date, 1)
  ON CONFLICT (user_id, feature_slug, usage_date)
  DO UPDATE SET used_count = public.user_feature_usage.used_count + 1
  RETURNING public.user_feature_usage.used_count INTO v_used;

  v_remaining := GREATEST(v_limit - v_used, 0);

  RETURN QUERY SELECT
    v_remaining::bigint,
    v_limit::bigint,
    v_used::bigint,
    (v_date + interval '1 day')::timestamptz;
END;
$$;

-- Central entitlement check
CREATE OR REPLACE FUNCTION public.check_entitlement(
  p_user_id uuid,
  p_feature_slug text,
  p_timezone text DEFAULT 'UTC'
)
RETURNS TABLE(allowed boolean, reason text, remaining bigint, limit_value bigint, plan text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining bigint;
  v_limit bigint;
  v_plan text;
BEGIN
  SELECT r.remaining, r.limit_value, r.plan
  INTO v_remaining, v_limit, v_plan
  FROM public.get_feature_remaining(p_user_id, p_feature_slug, p_timezone) r;

  IF v_limit IS NULL THEN
    RETURN QUERY SELECT true, NULL::text, NULL::bigint, NULL::bigint, v_plan;
  ELSIF v_limit = -1 THEN
    RETURN QUERY SELECT false, 'This feature is not available on your current plan'::text, (-1)::bigint, (-1)::bigint, v_plan;
  ELSIF v_remaining > 0 THEN
    RETURN QUERY SELECT true, NULL::text, v_remaining, v_limit, v_plan;
  ELSE
    RETURN QUERY SELECT false, 'Daily limit reached. Upgrade to Pro for unlimited access.'::text, 0::bigint, v_limit, v_plan;
  END IF;
END;
$$;
