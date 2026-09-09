
CREATE OR REPLACE FUNCTION classify_traffic_channel(
  p_referrer text,
  p_utm_source text,
  p_utm_medium text
) RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_utm_medium ILIKE '%email%' THEN 'Email Campaign'
    WHEN p_utm_source ILIKE '%google%' AND p_utm_medium ILIKE ANY(ARRAY['%cpc%', '%ppc%', '%paid%']) THEN 'Google Ads'
    WHEN p_utm_source ILIKE '%bing%' AND p_utm_medium ILIKE ANY(ARRAY['%cpc%', '%ppc%', '%paid%']) THEN 'Bing Ads'
    WHEN p_utm_source ILIKE '%facebook%' OR p_referrer ILIKE '%facebook.com%' THEN 'Facebook'
    WHEN p_utm_source ILIKE '%linkedin%' OR p_referrer ILIKE '%linkedin.com%' THEN 'LinkedIn'
    WHEN p_utm_source ILIKE '%twitter%' OR p_referrer ILIKE ANY(ARRAY['%twitter.com%', '%x.com%']) THEN 'Twitter/X'
    WHEN p_utm_source ILIKE '%reddit%' OR p_referrer ILIKE '%reddit.com%' THEN 'Reddit'
    WHEN p_referrer IS NULL OR p_referrer = '' THEN 'Direct'
    WHEN p_referrer ILIKE '%google.%' OR p_referrer ILIKE '%bing.%' OR p_referrer ILIKE '%duckduckgo.%' THEN 'Organic Search'
    WHEN p_referrer NOT ILIKE '%aidetector.cx%' THEN 'Referral Website'
    ELSE 'Direct'
  END;
$$;

CREATE OR REPLACE FUNCTION get_or_create_customer_profile(
  p_visitor_id text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id uuid;
  v_visitor anonymous_visitors%ROWTYPE;
  v_user profiles%ROWTYPE;
BEGIN
  IF p_user_id IS NOT NULL THEN
    SELECT id INTO v_profile_id FROM customer_profiles WHERE user_id = p_user_id;
    IF FOUND THEN RETURN v_profile_id; END IF;
  END IF;

  IF p_visitor_id IS NOT NULL THEN
    SELECT id INTO v_profile_id FROM customer_profiles WHERE visitor_id = p_visitor_id;
    IF FOUND THEN RETURN v_profile_id; END IF;
  END IF;

  IF p_visitor_id IS NOT NULL THEN
    SELECT * INTO v_visitor FROM anonymous_visitors WHERE visitor_id = p_visitor_id;
  END IF;

  IF p_user_id IS NOT NULL THEN
    SELECT * INTO v_user FROM profiles WHERE id = p_user_id;
  END IF;

  INSERT INTO customer_profiles (
    user_id, visitor_id, email, full_name, username, role, country, language,
    first_landing_page, first_referrer, first_channel,
    first_utm_source, first_utm_medium, first_utm_campaign, first_utm_content, first_utm_term,
    last_referrer, last_channel,
    last_utm_source, last_utm_medium, last_utm_campaign, last_utm_content, last_utm_term,
    signup_at, last_login_at, session_count, subscription_plan, account_status, subscription_status
  ) VALUES (
    p_user_id,
    p_visitor_id,
    COALESCE(v_user.email, NULL),
    COALESCE(v_user.full_name, NULL),
    COALESCE(v_user.email, NULL),
    COALESCE(v_user.role::text, 'user'),
    COALESCE(v_visitor.country, NULL),
    COALESCE(v_visitor.language, NULL),
    COALESCE(v_visitor.landing_page, NULL),
    COALESCE(v_visitor.referrer_url, NULL),
    classify_traffic_channel(v_visitor.referrer_url, v_visitor.utm_source, v_visitor.utm_medium),
    v_visitor.utm_source, v_visitor.utm_medium, v_visitor.utm_campaign, v_visitor.utm_content, v_visitor.utm_term,
    v_visitor.referrer_url,
    classify_traffic_channel(v_visitor.referrer_url, v_visitor.utm_source, v_visitor.utm_medium),
    v_visitor.utm_source, v_visitor.utm_medium, v_visitor.utm_campaign, v_visitor.utm_content, v_visitor.utm_term,
    COALESCE(v_user.created_at, NULL),
    COALESCE(v_user.last_login_date, NULL),
    COALESCE(v_visitor.session_count, 0),
    COALESCE(v_user.subscription_plan, 'free'),
    COALESCE(v_user.account_status, 'active'),
    COALESCE(v_user.subscription_status, 'active')
  )
  RETURNING id INTO v_profile_id;

  RETURN v_profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION resolve_customer_profile_id(
  p_visitor_id text,
  p_user_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  IF p_user_id IS NOT NULL THEN
    SELECT id INTO v_profile_id FROM customer_profiles WHERE user_id = p_user_id;
    IF FOUND THEN RETURN v_profile_id; END IF;
  END IF;

  IF p_visitor_id IS NOT NULL THEN
    SELECT id INTO v_profile_id FROM customer_profiles WHERE visitor_id = p_visitor_id;
    IF FOUND THEN RETURN v_profile_id; END IF;
  END IF;

  RETURN get_or_create_customer_profile(p_visitor_id, p_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION trg_lead_events_customer_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  v_profile_id := resolve_customer_profile_id(NEW.visitor_id, NEW.user_id);
  NEW.customer_profile_id := v_profile_id;

  IF NEW.event_type = 'page_view' THEN
    UPDATE customer_profiles SET page_views = page_views + 1, updated_at = now() WHERE id = v_profile_id;
  ELSIF NEW.event_type = 'cta_click' THEN
    UPDATE customer_profiles SET cta_clicks = cta_clicks + 1, updated_at = now() WHERE id = v_profile_id;
  ELSIF NEW.event_type = 'popup_conversion' THEN
    UPDATE customer_profiles SET popup_conversions = popup_conversions + 1, updated_at = now() WHERE id = v_profile_id;
  ELSIF NEW.event_type = 'signup' THEN
    UPDATE customer_profiles SET signup_at = COALESCE(signup_at, NEW.created_at), updated_at = now() WHERE id = v_profile_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lead_events_set_customer_profile ON lead_events;
CREATE TRIGGER lead_events_set_customer_profile
BEFORE INSERT ON lead_events
FOR EACH ROW
EXECUTE FUNCTION trg_lead_events_customer_profile();

CREATE OR REPLACE FUNCTION merge_visitor_to_customer_profile(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_visitor_id text;
  v_anon_profile_id uuid;
  v_user_profile_id uuid;
BEGIN
  SELECT visitor_id INTO v_visitor_id FROM anonymous_visitors WHERE merged_user_id = p_user_id ORDER BY merged_at DESC LIMIT 1;
  IF v_visitor_id IS NULL THEN RETURN; END IF;

  SELECT id INTO v_anon_profile_id FROM customer_profiles WHERE visitor_id = v_visitor_id;
  SELECT id INTO v_user_profile_id FROM customer_profiles WHERE user_id = p_user_id;

  IF v_anon_profile_id IS NULL THEN RETURN; END IF;

  IF v_user_profile_id IS NULL THEN
    UPDATE customer_profiles SET
      user_id = p_user_id,
      visitor_id = NULL,
      email = COALESCE(email, (SELECT email FROM profiles WHERE id = p_user_id)),
      full_name = COALESCE(full_name, (SELECT full_name FROM profiles WHERE id = p_user_id)),
      username = COALESCE(username, (SELECT email FROM profiles WHERE id = p_user_id)),
      role = COALESCE(role, (SELECT role::text FROM profiles WHERE id = p_user_id), 'user'),
      signup_at = COALESCE(signup_at, now()),
      subscription_plan = COALESCE(subscription_plan, (SELECT subscription_plan FROM profiles WHERE id = p_user_id), 'free'),
      account_status = COALESCE(account_status, (SELECT account_status FROM profiles WHERE id = p_user_id), 'active'),
      subscription_status = COALESCE(subscription_status, (SELECT subscription_status FROM profiles WHERE id = p_user_id), 'active')
    WHERE id = v_anon_profile_id;
    v_user_profile_id := v_anon_profile_id;
  ELSE
    UPDATE customer_profiles SET
      page_views = customer_profiles.page_views + anon.page_views,
      cta_clicks = customer_profiles.cta_clicks + anon.cta_clicks,
      popup_conversions = customer_profiles.popup_conversions + anon.popup_conversions,
      session_count = GREATEST(customer_profiles.session_count, anon.session_count),
      first_landing_page = COALESCE(customer_profiles.first_landing_page, anon.first_landing_page),
      first_referrer = COALESCE(customer_profiles.first_referrer, anon.first_referrer),
      first_channel = COALESCE(customer_profiles.first_channel, anon.first_channel),
      first_utm_source = COALESCE(customer_profiles.first_utm_source, anon.first_utm_source),
      first_utm_medium = COALESCE(customer_profiles.first_utm_medium, anon.first_utm_medium),
      first_utm_campaign = COALESCE(customer_profiles.first_utm_campaign, anon.first_utm_campaign),
      first_utm_content = COALESCE(customer_profiles.first_utm_content, anon.first_utm_content),
      first_utm_term = COALESCE(customer_profiles.first_utm_term, anon.first_utm_term),
      updated_at = now()
    FROM (SELECT * FROM customer_profiles WHERE id = v_anon_profile_id) AS anon
    WHERE customer_profiles.id = v_user_profile_id;

    DELETE FROM customer_profiles WHERE id = v_anon_profile_id;
  END IF;

  UPDATE lead_events SET customer_profile_id = v_user_profile_id, user_id = p_user_id WHERE visitor_id = v_visitor_id;
  UPDATE customer_devices SET customer_profile_id = v_user_profile_id WHERE customer_profile_id = v_anon_profile_id;
  UPDATE customer_segment_memberships SET customer_profile_id = v_user_profile_id WHERE customer_profile_id = v_anon_profile_id;
  UPDATE customer_tag_assignments SET customer_profile_id = v_user_profile_id WHERE customer_profile_id = v_anon_profile_id;
  UPDATE customer_interests SET customer_profile_id = v_user_profile_id WHERE customer_profile_id = v_anon_profile_id;
  UPDATE privacy_consents SET customer_profile_id = v_user_profile_id WHERE customer_profile_id = v_anon_profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION trg_profiles_customer_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_profile_id := get_or_create_customer_profile(NULL, NEW.id);
  ELSE
    SELECT id INTO v_profile_id FROM customer_profiles WHERE user_id = NEW.id;
  END IF;

  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.email IS NULL AND NEW.email IS NOT NULL) THEN
    UPDATE customer_profiles SET
      email = COALESCE(customer_profiles.email, NEW.email),
      full_name = COALESCE(customer_profiles.full_name, NEW.full_name),
      username = COALESCE(customer_profiles.username, NEW.email),
      role = COALESCE(customer_profiles.role, NEW.role::text, 'user'),
      signup_at = COALESCE(customer_profiles.signup_at, NEW.created_at),
      last_login_at = COALESCE(customer_profiles.last_login_at, NEW.last_login_date),
      subscription_plan = COALESCE(customer_profiles.subscription_plan, NEW.subscription_plan, 'free'),
      account_status = COALESCE(customer_profiles.account_status, NEW.account_status, 'active'),
      subscription_status = COALESCE(customer_profiles.subscription_status, NEW.subscription_status, 'active'),
      updated_at = now()
    WHERE id = v_profile_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE customer_profiles SET
      email = COALESCE(NEW.email, customer_profiles.email),
      full_name = COALESCE(NEW.full_name, customer_profiles.full_name),
      role = COALESCE(NEW.role::text, customer_profiles.role),
      last_login_at = COALESCE(NEW.last_login_date, customer_profiles.last_login_at),
      subscription_plan = COALESCE(NEW.subscription_plan, customer_profiles.subscription_plan),
      account_status = COALESCE(NEW.account_status, customer_profiles.account_status),
      subscription_status = COALESCE(NEW.subscription_status, customer_profiles.subscription_status),
      updated_at = now()
    WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_customer_profile ON profiles;
CREATE TRIGGER profiles_customer_profile
AFTER INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION trg_profiles_customer_profile();

CREATE OR REPLACE FUNCTION upsert_customer_device(
  p_profile_id uuid,
  p_device_type text,
  p_browser text,
  p_os text,
  p_screen_resolution text,
  p_language text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO customer_devices (customer_profile_id, device_type, browser, os, screen_resolution, language)
  VALUES (p_profile_id, p_device_type, p_browser, p_os, p_screen_resolution, p_language)
  ON CONFLICT (customer_profile_id, device_type, browser, os, screen_resolution)
  DO UPDATE SET last_seen_at = now(), session_count = customer_devices.session_count + 1;
END;
$$;

CREATE OR REPLACE FUNCTION anonymize_customer_profile(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE customer_profiles SET
    email = NULL, full_name = NULL, username = NULL, company = NULL,
    visitor_id = NULL, is_anonymized = true, anonymized_at = now(), gdpr_opt_out_tracking = true
  WHERE id = p_profile_id;

  DELETE FROM customer_devices WHERE customer_profile_id = p_profile_id;
  DELETE FROM customer_interests WHERE customer_profile_id = p_profile_id;
  DELETE FROM privacy_consents WHERE customer_profile_id = p_profile_id;
  DELETE FROM customer_tag_assignments
  WHERE customer_profile_id = p_profile_id AND tag_id IN (SELECT id FROM customer_tags WHERE is_system = false);
END;
$$;

CREATE OR REPLACE FUNCTION get_customer_overview_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'total_profiles', (SELECT count(*) FROM customer_profiles WHERE is_anonymized = false),
    'anonymous_profiles', (SELECT count(*) FROM customer_profiles WHERE user_id IS NULL AND is_anonymized = false),
    'registered_profiles', (SELECT count(*) FROM customer_profiles WHERE user_id IS NOT NULL AND is_anonymized = false),
    'active_today', (SELECT count(*) FROM customer_profiles WHERE updated_at >= now() - interval '1 day' AND is_anonymized = false),
    'active_this_week', (SELECT count(*) FROM customer_profiles WHERE updated_at >= now() - interval '7 days' AND is_anonymized = false),
    'pro_users', (SELECT count(*) FROM customer_profiles WHERE subscription_plan IN ('pro','business','enterprise') AND is_anonymized = false),
    'churn_risk', (SELECT count(*) FROM customer_profiles WHERE lead_status = 'churn_risk' AND is_anonymized = false)
  );
$$;
