-- Configure three anonymous guest checks per rolling 24-hour window.
-- Linked-user sessions and registered-user trial balances are not modified.
ALTER TABLE public.server_guest_sessions
  ADD COLUMN IF NOT EXISTS allowance_reset_at timestamptz;

ALTER TABLE public.server_guest_sessions
  ALTER COLUMN daily_allowance SET DEFAULT 3,
  ALTER COLUMN trial_checks_remaining SET DEFAULT 3,
  ALTER COLUMN trial_checks_total SET DEFAULT 3;

-- Start the first 24-hour window for existing anonymous sessions at migration time.
-- Preserve checks already consumed in their current window.
UPDATE public.server_guest_sessions
SET allowance_reset_at = COALESCE(allowance_reset_at, NOW()),
    daily_allowance = 3,
    trial_checks_total = 3,
    trial_checks_used = LEAST(3, GREATEST(0, COALESCE(trial_checks_used, 0))),
    trial_checks_remaining = GREATEST(
      0,
      3 - LEAST(3, GREATEST(0, COALESCE(trial_checks_used, 0)))
    ),
    updated_at = NOW()
WHERE linked_user_id IS NULL;

-- The reservation RPC can create a missing guest row directly. Normalize that
-- insert too, so its subsequent reservation consumes one of the same three checks.
CREATE OR REPLACE FUNCTION public.initialize_anonymous_guest_allowance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.linked_user_id IS NULL THEN
    NEW.daily_allowance := 3;
    NEW.trial_checks_total := 3;
    NEW.trial_checks_remaining := 3;
    NEW.trial_checks_used := 0;
    NEW.allowance_reset_at := COALESCE(NEW.allowance_reset_at, NOW());
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS initialize_anonymous_guest_allowance
  ON public.server_guest_sessions;
CREATE TRIGGER initialize_anonymous_guest_allowance
BEFORE INSERT ON public.server_guest_sessions
FOR EACH ROW
EXECUTE FUNCTION public.initialize_anonymous_guest_allowance();

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
BEGIN
  v_ip := NULLIF(trim(COALESCE(p_ip, '')), '');
  v_effective_id := COALESCE(NULLIF(trim(p_guest_id), ''), 'gst_' || replace(gen_random_uuid()::text, '-', ''));

  SELECT * INTO v_session
  FROM public.server_guest_sessions sgs
  WHERE sgs.guest_id = v_effective_id
  FOR UPDATE;

  IF NOT FOUND THEN
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
        RETURN QUERY SELECT v_effective_id, 0, 3, 3, TRUE;
        RETURN;
      END IF;
    END IF;

    INSERT INTO public.server_guest_sessions (
      guest_id, trial_checks_remaining, trial_checks_total,
      trial_checks_used, total_used, daily_allowance, used_today,
      allowance_reset_at, usage_date, ip_address, user_agent,
      created_at, updated_at, last_active_at
    ) VALUES (
      v_effective_id, 3, 3, 0, 0, 3, 0,
      NOW(), CURRENT_DATE, v_ip, p_user_agent,
      NOW(), NOW(), NOW()
    )
    ON CONFLICT ON CONSTRAINT server_guest_sessions_pkey DO NOTHING;

    SELECT * INTO v_session
    FROM public.server_guest_sessions sgs
    WHERE sgs.guest_id = v_effective_id
    FOR UPDATE;
  END IF;

  IF v_session.linked_user_id IS NULL THEN
    UPDATE public.server_guest_sessions sgs
    SET trial_checks_remaining = CASE
          WHEN sgs.allowance_reset_at IS NULL
            OR sgs.allowance_reset_at <= NOW() - interval '24 hours'
          THEN 3
          ELSE sgs.trial_checks_remaining
        END,
        trial_checks_total = 3,
        trial_checks_used = CASE
          WHEN sgs.allowance_reset_at IS NULL
            OR sgs.allowance_reset_at <= NOW() - interval '24 hours'
          THEN 0
          ELSE sgs.trial_checks_used
        END,
        daily_allowance = 3,
        used_today = CASE
          WHEN sgs.allowance_reset_at IS NULL
            OR sgs.allowance_reset_at <= NOW() - interval '24 hours'
          THEN 0
          ELSE sgs.used_today
        END,
        allowance_reset_at = CASE
          WHEN sgs.allowance_reset_at IS NULL
            OR sgs.allowance_reset_at <= NOW() - interval '24 hours'
          THEN NOW()
          ELSE sgs.allowance_reset_at
        END,
        usage_date = CURRENT_DATE,
        last_active_at = NOW(),
        ip_address = COALESCE(v_ip, sgs.ip_address),
        user_agent = COALESCE(p_user_agent, sgs.user_agent),
        updated_at = NOW()
    WHERE sgs.guest_id = v_effective_id
    RETURNING * INTO v_session;
  ELSE
    UPDATE public.server_guest_sessions sgs
    SET last_active_at = NOW(),
        ip_address = COALESCE(v_ip, sgs.ip_address),
        user_agent = COALESCE(p_user_agent, sgs.user_agent),
        updated_at = NOW()
    WHERE sgs.guest_id = v_effective_id
    RETURNING * INTO v_session;
  END IF;

  RETURN QUERY
  SELECT v_session.guest_id, v_session.trial_checks_remaining,
         v_session.trial_checks_used, v_session.total_used,
         (v_session.trial_checks_remaining <= 0);
END;
$function$;

-- Keep the 20,000-word free-trial ceiling for the AI text detector.
UPDATE public.credit_rate_table
SET details = COALESCE(details, '{}'::jsonb)
      || jsonb_build_object('trial_max_words', 20000),
    updated_at = NOW()
WHERE feature_slug = 'ai_detector';
