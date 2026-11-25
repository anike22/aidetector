-- Configure three daily checks for anonymous guests without changing
-- linked-user trial balances. Also set the free AI detector trial ceiling.
ALTER TABLE public.server_guest_sessions
  ALTER COLUMN daily_allowance SET DEFAULT 3;

UPDATE public.server_guest_sessions
SET daily_allowance = 3,
    trial_checks_total = 3,
    trial_checks_remaining = GREATEST(
      0,
      3 - CASE WHEN COALESCE(used_today, 0) > 0 THEN 1 ELSE 0 END
    ),
    trial_checks_used = CASE WHEN COALESCE(used_today, 0) > 0 THEN 1 ELSE 0 END,
    updated_at = NOW()
WHERE linked_user_id IS NULL;

CREATE OR REPLACE FUNCTION public.issue_or_validate_guest_session(
  p_guest_id text,
  p_ip text,
  p_user_agent text,
  p_timezone text DEFAULT 'UTC'
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

  SELECT * INTO v_session
  FROM public.server_guest_sessions sgs
  WHERE sgs.guest_id = v_effective_id
  FOR UPDATE;

  IF FOUND THEN
    UPDATE public.server_guest_sessions sgs
    SET trial_checks_remaining = CASE
          WHEN sgs.linked_user_id IS NULL
            AND COALESCE(sgs.usage_date, v_today_date) < v_today_date
          THEN 3
          ELSE sgs.trial_checks_remaining
        END,
        trial_checks_total = CASE
          WHEN sgs.linked_user_id IS NULL THEN 3
          ELSE sgs.trial_checks_total
        END,
        trial_checks_used = CASE
          WHEN sgs.linked_user_id IS NULL
            AND COALESCE(sgs.usage_date, v_today_date) < v_today_date
          THEN 0
          ELSE sgs.trial_checks_used
        END,
        daily_allowance = CASE
          WHEN sgs.linked_user_id IS NULL THEN 3
          ELSE sgs.daily_allowance
        END,
        used_today = CASE
          WHEN sgs.linked_user_id IS NOT NULL THEN sgs.used_today
          WHEN COALESCE(sgs.usage_date, v_today_date) < v_today_date THEN 0
          WHEN sgs.trial_checks_remaining <= 0 THEN 1
          ELSE 0
        END,
        usage_date = CASE
          WHEN sgs.linked_user_id IS NULL THEN v_today_date
          ELSE sgs.usage_date
        END,
        last_active_at = NOW(),
        ip_address = COALESCE(v_ip, sgs.ip_address),
        user_agent = COALESCE(p_user_agent, sgs.user_agent),
        updated_at = NOW()
    WHERE sgs.guest_id = v_effective_id
    RETURNING * INTO v_session;
  ELSE
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
      guest_id, trial_checks_remaining, trial_checks_total,
      trial_checks_used, total_used, daily_allowance, used_today,
      usage_date, ip_address, user_agent, created_at, updated_at, last_active_at
    ) VALUES (
      v_effective_id, 3, 3, 0, 0, 3, 0,
      v_today_date, v_ip, p_user_agent, NOW(), NOW(), NOW()
    )
    ON CONFLICT ON CONSTRAINT server_guest_sessions_pkey DO UPDATE
    SET trial_checks_remaining = CASE
          WHEN public.server_guest_sessions.linked_user_id IS NULL
            AND COALESCE(public.server_guest_sessions.usage_date, v_today_date) < v_today_date
          THEN 3
          ELSE public.server_guest_sessions.trial_checks_remaining
        END,
        trial_checks_total = CASE
          WHEN public.server_guest_sessions.linked_user_id IS NULL THEN 3
          ELSE public.server_guest_sessions.trial_checks_total
        END,
        trial_checks_used = CASE
          WHEN public.server_guest_sessions.linked_user_id IS NULL
            AND COALESCE(public.server_guest_sessions.usage_date, v_today_date) < v_today_date
          THEN 0
          ELSE public.server_guest_sessions.trial_checks_used
        END,
        daily_allowance = CASE
          WHEN public.server_guest_sessions.linked_user_id IS NULL THEN 3
          ELSE public.server_guest_sessions.daily_allowance
        END,
        used_today = CASE
          WHEN public.server_guest_sessions.linked_user_id IS NOT NULL
          THEN public.server_guest_sessions.used_today
          WHEN COALESCE(public.server_guest_sessions.usage_date, v_today_date) < v_today_date
          THEN 0
          WHEN public.server_guest_sessions.trial_checks_remaining <= 0 THEN 1
          ELSE 0
        END,
        usage_date = CASE
          WHEN public.server_guest_sessions.linked_user_id IS NULL THEN v_today_date
          ELSE public.server_guest_sessions.usage_date
        END,
        last_active_at = NOW(),
        updated_at = NOW()
    RETURNING * INTO v_session;
  END IF;

  RETURN QUERY
  SELECT v_session.guest_id, v_session.trial_checks_remaining,
         v_session.trial_checks_used, v_session.total_used,
         (v_session.trial_checks_remaining <= 0);
END;
$function$;

UPDATE public.credit_rate_table
SET details = COALESCE(details, '{}'::jsonb)
      || jsonb_build_object('trial_max_words', 20000),
    updated_at = NOW()
WHERE feature_slug = 'ai_detector';
