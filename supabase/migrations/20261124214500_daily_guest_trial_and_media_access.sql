-- Give anonymous visitors one shared guest trial check per local calendar day.
-- Registered free accounts retain their existing five one-time introductory checks.
-- Standard image and balanced video detection share those same trial allowances.

ALTER TABLE public.server_guest_sessions
  ALTER COLUMN daily_allowance SET DEFAULT 1;

UPDATE public.server_guest_sessions
SET daily_allowance = 1,
    trial_checks_total = 1,
    used_today = CASE WHEN trial_checks_remaining <= 0 THEN 1 ELSE 0 END;

CREATE OR REPLACE FUNCTION public.issue_or_validate_guest_session(
  p_guest_id text,
  p_ip text,
  p_user_agent text,
  p_timezone text DEFAULT 'UTC'::text
)
RETURNS TABLE(
  guest_id text,
  trial_checks_remaining integer,
  trial_checks_used integer,
  total_used integer,
  is_blocked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_session RECORD;
  v_effective_id TEXT;
  v_ip TEXT;
  v_ip_new_sessions INT;
  v_role TEXT := COALESCE(current_setting('role', true), 'anon');
  v_ip_daily_cap INT := 10;
  v_timezone TEXT;
  v_today_date DATE;
BEGIN
  v_ip := NULLIF(trim(COALESCE(p_ip, '')), '');
  v_effective_id := COALESCE(NULLIF(trim(p_guest_id), ''), 'gst_' || replace(gen_random_uuid()::text, '-', ''));

  v_timezone := COALESCE(NULLIF(trim(p_timezone), ''), 'UTC');
  BEGIN
    v_today_date := (NOW() AT TIME ZONE v_timezone)::date;
  EXCEPTION WHEN OTHERS THEN
    v_timezone := 'UTC';
    v_today_date := (NOW() AT TIME ZONE 'UTC')::date;
  END;

  -- Lock the row so simultaneous requests cannot both refresh or spend
  -- the same daily guest allowance.
  SELECT * INTO v_session
  FROM public.server_guest_sessions sgs
  WHERE sgs.guest_id = v_effective_id
  FOR UPDATE;

  IF FOUND THEN
    UPDATE public.server_guest_sessions sgs
    SET trial_checks_remaining = CASE
          WHEN sgs.linked_user_id IS NULL
            AND COALESCE(sgs.usage_date, v_today_date) < v_today_date
          THEN 1
          ELSE sgs.trial_checks_remaining
        END,
        trial_checks_total = 1,
        trial_checks_used = CASE
          WHEN sgs.linked_user_id IS NULL
            AND COALESCE(sgs.usage_date, v_today_date) < v_today_date
          THEN 0
          ELSE sgs.trial_checks_used
        END,
        daily_allowance = 1,
        used_today = CASE
          WHEN sgs.linked_user_id IS NULL
            AND COALESCE(sgs.usage_date, v_today_date) < v_today_date
          THEN 0
          WHEN sgs.trial_checks_remaining <= 0 THEN 1
          ELSE 0
        END,
        usage_date = v_today_date,
        last_active_at = NOW(),
        ip_address = COALESCE(v_ip, sgs.ip_address),
        user_agent = COALESCE(p_user_agent, sgs.user_agent),
        updated_at = NOW()
    WHERE sgs.guest_id = v_effective_id
    RETURNING * INTO v_session;
  ELSE
    -- New session (client- or server-supplied id): retain the existing
    -- per-IP throttle so creating new browser IDs is not unlimited.
    IF v_role <> 'service_role' THEN
      v_ip := COALESCE(v_ip, NULLIF(trim(split_part(
        COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', ''),
        ',', 1)), ''));
    END IF;

    IF v_ip IS NOT NULL THEN
      SELECT COUNT(*) INTO v_ip_new_sessions
      FROM public.server_guest_sessions sgs
      WHERE sgs.ip_address = v_ip
        AND sgs.created_at > NOW() - interval '24 hours';

      IF v_ip_new_sessions >= v_ip_daily_cap THEN
        RETURN QUERY SELECT v_effective_id, 0, 1, 1, TRUE;
        RETURN;
      END IF;
    END IF;

    INSERT INTO public.server_guest_sessions (
      guest_id,
      trial_checks_remaining,
      trial_checks_total,
      trial_checks_used,
      total_used,
      daily_allowance,
      used_today,
      usage_date,
      ip_address,
      user_agent,
      created_at,
      updated_at,
      last_active_at
    ) VALUES (
      v_effective_id,
      1,
      1,
      0,
      0,
      1,
      0,
      v_today_date,
      v_ip,
      p_user_agent,
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT ON CONSTRAINT server_guest_sessions_pkey DO UPDATE
    SET trial_checks_remaining = CASE
          WHEN public.server_guest_sessions.linked_user_id IS NULL
            AND COALESCE(public.server_guest_sessions.usage_date, v_today_date) < v_today_date
          THEN 1
          ELSE public.server_guest_sessions.trial_checks_remaining
        END,
        trial_checks_total = 1,
        trial_checks_used = CASE
          WHEN public.server_guest_sessions.linked_user_id IS NULL
            AND COALESCE(public.server_guest_sessions.usage_date, v_today_date) < v_today_date
          THEN 0
          ELSE public.server_guest_sessions.trial_checks_used
        END,
        daily_allowance = 1,
        used_today = CASE
          WHEN public.server_guest_sessions.linked_user_id IS NULL
            AND COALESCE(public.server_guest_sessions.usage_date, v_today_date) < v_today_date
          THEN 0
          WHEN public.server_guest_sessions.trial_checks_remaining <= 0 THEN 1
          ELSE 0
        END,
        usage_date = v_today_date,
        last_active_at = NOW(),
        updated_at = NOW()
    RETURNING * INTO v_session;
  END IF;

  RETURN QUERY
  SELECT
    v_session.guest_id,
    v_session.trial_checks_remaining,
    v_session.trial_checks_used,
    v_session.total_used,
    (v_session.trial_checks_remaining <= 0);
END;
$function$;

-- Standard image and balanced video scans use the same free trial pool as
-- balanced text detection. Advanced image/video modes remain unchanged.
INSERT INTO public.credit_rate_table (
  feature_slug,
  feature_name,
  trial_eligible,
  base_credit_cost,
  billing_unit,
  min_plan,
  details
)
VALUES
  ('ai_image_detector', 'AI Image Detector (Standard)', TRUE, 5, 'fixed', 'guest',
    jsonb_build_object('description', 'Standard image detection; one shared guest/free trial check per scan')),
  ('image_detect_standard', 'Image Detection (Standard)', TRUE, 5, 'fixed', 'guest',
    jsonb_build_object('description', 'Standard image detection; one shared guest/free trial check per scan')),
  ('video_detect_balanced', 'AI Video Detector (Balanced)', TRUE, 15, 'fixed', 'guest',
    jsonb_build_object('description', 'Balanced video detection; one shared guest/free trial check per scan')),
  ('ai_video_detector', 'AI Video Detector (Balanced)', TRUE, 15, 'fixed', 'guest',
    jsonb_build_object('description', 'Balanced video detection; one shared guest/free trial check per scan'))
ON CONFLICT (feature_slug) DO UPDATE
SET feature_name = EXCLUDED.feature_name,
    trial_eligible = TRUE,
    base_credit_cost = EXCLUDED.base_credit_cost,
    billing_unit = EXCLUDED.billing_unit,
    min_plan = 'guest',
    details = COALESCE(public.credit_rate_table.details, '{}'::jsonb) || EXCLUDED.details,
    updated_at = NOW();
