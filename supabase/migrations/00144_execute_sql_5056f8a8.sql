CREATE OR REPLACE FUNCTION public.issue_or_validate_guest_session(
  p_guest_id text,
  p_ip text,
  p_user_agent text,
  p_timezone text DEFAULT 'UTC'::text
) RETURNS TABLE (
  guest_id text,
  trial_checks_remaining int,
  trial_checks_used int,
  total_used int,
  is_blocked boolean
) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, auth AS $$
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
  WHERE sgs.guest_id = v_effective_id;

  IF FOUND THEN
    -- Returning visitor: touch, keep authoritative counters.
    UPDATE public.server_guest_sessions sgs
    SET last_active_at = NOW(),
        ip_address = COALESCE(v_ip, sgs.ip_address),
        user_agent = COALESCE(p_user_agent, sgs.user_agent),
        updated_at = NOW()
    WHERE sgs.guest_id = v_effective_id
    RETURNING * INTO v_session;
  ELSE
    -- New session (client- or server-supplied id): apply per-IP throttle.
    -- Edge functions running as service_role pass a validated IP; direct
    -- client RPC calls fall back to the request's forwarded IP.
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
      guest_id, trial_checks_remaining, trial_checks_total, trial_checks_used, total_used,
      ip_address, user_agent, created_at, updated_at, last_active_at
    ) VALUES (
      v_effective_id, 1, 1, 0, 0, v_ip, p_user_agent, NOW(), NOW(), NOW()
    )
    ON CONFLICT (guest_id) DO UPDATE
    SET last_active_at = NOW(), updated_at = NOW()
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
$$;