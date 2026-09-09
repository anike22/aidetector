-- =====================================================================
-- Client-facing settlement hardening
--
-- Problem: finalize_credit_reservation was executable by anon. A guest
-- who learns their reservation id could call it with outcome='failed'
-- to restore their own consumed check repeatedly — unlimited free
-- processing. Same for increment_guest_usage (free usage inflation).
--
-- Fix: finalize + increment_guest_usage become service_role-only (all
-- edge functions use the service client). Frontend paths use a new,
-- tightly-scoped settle_client_reservation RPC:
--   - success: commits the already-made deduction (idempotent, safe).
--   - failed: restores the deduction ONLY within a 10-minute window and
--     under a small per-identity daily refund cap (3); beyond the cap
--     the reservation is released WITHOUT restoration (logged).
-- =====================================================================

CREATE OR REPLACE FUNCTION public.settle_client_reservation(
  p_reservation_id uuid,
  p_outcome text DEFAULT 'success'::text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(settled boolean, refunded boolean, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $function$
DECLARE
  v_role TEXT := COALESCE(current_setting('role', true), 'anon');
  v_auth_uid UUID := auth.uid();
  v_res RECORD;
  v_identity_key TEXT;
  v_recent_releases INT;
  v_refund_cap INT := 3;
  v_age_limit INTERVAL := interval '10 minutes';
BEGIN
  IF p_outcome NOT IN ('success', 'failed') THEN
    RETURN QUERY SELECT FALSE, FALSE, 'invalid_outcome'::TEXT;
    RETURN;
  END IF;

  SELECT * INTO v_res FROM public.credit_reservations
  WHERE id = p_reservation_id AND status IN ('reserved', 'pending')
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Already settled or unknown: idempotent success no-op.
    RETURN QUERY SELECT TRUE, FALSE, 'already_settled'::TEXT;
    RETURN;
  END IF;

  -- Authorization: the caller must own the reservation.
  IF v_role <> 'service_role' THEN
    IF v_auth_uid IS NOT NULL THEN
      IF v_res.user_id IS NOT NULL AND v_res.user_id <> v_auth_uid THEN
        RETURN QUERY SELECT FALSE, FALSE, 'not_authorized'::TEXT;
        RETURN;
      END IF;
      v_identity_key := 'user:' || v_auth_uid::TEXT;
    ELSE
      IF v_res.user_id IS NOT NULL THEN
        RETURN QUERY SELECT FALSE, FALSE, 'not_authorized'::TEXT;
        RETURN;
      END IF;
      v_identity_key := 'guest:' || COALESCE(v_res.guest_id, 'unknown');
    END IF;
  ELSE
    v_identity_key := 'user:' || COALESCE(v_res.user_id::TEXT, v_res.guest_id);
  END IF;

  IF p_outcome = 'success' THEN
    -- Deduction already happened at reserve time; just settle.
    IF v_res.reservation_type = 'trial_check' THEN
      INSERT INTO public.usage_ledger (
        user_id, guest_id, feature_slug, operation, credits_amount, trial_checks_amount,
        outcome, reservation_id, ledger_type, metadata
      ) VALUES (
        v_res.user_id, v_res.guest_id, v_res.feature_slug, 'trial_check_settled', 0, 1,
        'success', p_reservation_id, 'trial', p_metadata || '{"settled_by":"client"}'::jsonb
      );
    ELSE
      INSERT INTO public.usage_ledger (
        user_id, guest_id, feature_slug, operation, credits_amount,
        outcome, reservation_id, ledger_type, metadata
      ) VALUES (
        v_res.user_id, v_res.guest_id, v_res.feature_slug, 'credit_deducted', COALESCE(v_res.credits_reserved, 0),
        'success', p_reservation_id, 'usage', p_metadata || '{"settled_by":"client"}'::jsonb
      );
    END IF;

    UPDATE public.credit_reservations
    SET status = 'committed', finalized_at = now()
    WHERE id = p_reservation_id;

    RETURN QUERY SELECT TRUE, FALSE, NULL::TEXT;
    RETURN;
  END IF;

  -- ── outcome = 'failed': refund under window + daily cap ────────────────
  SELECT COUNT(*) INTO v_recent_releases
  FROM public.usage_ledger
  WHERE operation = 'client_release'
    AND metadata->>'identity' = v_identity_key
    AND created_at > now() - interval '24 hours';

  IF now() - v_res.created_at <= v_age_limit AND v_recent_releases < v_refund_cap THEN
    -- Genuine recent failure: restore the deduction.
    IF v_res.reservation_type = 'trial_check' THEN
      IF v_res.user_id IS NOT NULL THEN
        UPDATE public.profiles
        SET trial_checks_remaining = LEAST(COALESCE(trial_checks_total, 5), COALESCE(trial_checks_remaining, 0) + 1),
            trial_checks_used = GREATEST(0, COALESCE(trial_checks_used, 0) - 1),
            updated_at = now()
        WHERE id = v_res.user_id;
      ELSIF v_res.guest_id IS NOT NULL THEN
        UPDATE public.server_guest_sessions
        SET trial_checks_remaining = LEAST(COALESCE(trial_checks_total, 1), COALESCE(trial_checks_remaining, 0) + 1),
            trial_checks_used = GREATEST(0, COALESCE(trial_checks_used, 0) - 1),
            updated_at = now()
        WHERE guest_id = v_res.guest_id;
      END IF;
    ELSE
      UPDATE public.profiles
      SET credits_balance = COALESCE(credits_balance, 0) + COALESCE(v_res.credits_reserved, 0),
          updated_at = now()
      WHERE id = v_res.user_id;
    END IF;

    UPDATE public.credit_reservations
    SET status = 'released', finalized_at = now()
    WHERE id = p_reservation_id;

    INSERT INTO public.usage_ledger (
      user_id, guest_id, feature_slug, operation, credits_amount,
      outcome, reservation_id, ledger_type, metadata
    ) VALUES (
      v_res.user_id, v_res.guest_id, v_res.feature_slug, 'client_release',
      COALESCE(v_res.credits_reserved, 0), 'failed', p_reservation_id, 'refund',
      p_metadata || jsonb_build_object('identity', v_identity_key, 'refunded', true)
    );

    RETURN QUERY SELECT TRUE, TRUE, NULL::TEXT;
    RETURN;
  END IF;

  -- Outside window or over the cap: release WITHOUT restoration.
  UPDATE public.credit_reservations
  SET status = 'released', finalized_at = now()
  WHERE id = p_reservation_id;

  INSERT INTO public.usage_ledger (
    user_id, guest_id, feature_slug, operation, credits_amount,
    outcome, reservation_id, ledger_type, metadata
  ) VALUES (
    v_res.user_id, v_res.guest_id, v_res.feature_slug, 'client_release',
    0, 'failed', p_reservation_id, 'refund',
    p_metadata || jsonb_build_object('identity', v_identity_key, 'refunded', false,
      'reason', CASE WHEN now() - v_res.created_at > v_age_limit THEN 'window_expired' ELSE 'cap_exceeded' END)
  );

  RETURN QUERY SELECT TRUE, FALSE,
    CASE WHEN now() - v_res.created_at > v_age_limit THEN 'refund_window_expired' ELSE 'refund_cap_exceeded' END::TEXT;
END;
$function$;

-- Revoke direct balance-restoring functions from public roles: only edge
-- functions (service client) may restore balances.
REVOKE EXECUTE ON FUNCTION public.finalize_credit_reservation(uuid, text, jsonb, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_guest_usage(text, date) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_guest_usage(text, text, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_guest_usage(text, text, text, integer) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.settle_client_reservation(uuid, text, jsonb) TO anon, authenticated;
