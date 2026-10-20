-- Restore failed complimentary affiliate reservations under the same billing-period guard.
-- Keep existing authorization, row locking, paid/team behavior and settlement idempotency.
CREATE OR REPLACE FUNCTION public.finalize_credit_reservation(p_reservation_id uuid DEFAULT NULL::uuid, p_outcome text DEFAULT 'success'::text, p_metadata jsonb DEFAULT '{}'::jsonb, p_error_reason text DEFAULT NULL::text, p_timezone text DEFAULT 'UTC'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_role TEXT := COALESCE(current_setting('role', true), 'anon');
  v_auth_uid UUID := auth.uid();
  v_res RECORD;
  v_billable boolean;
  v_owner_id uuid;
BEGIN
  IF p_outcome NOT IN ('success','failed') THEN RAISE EXCEPTION 'Invalid outcome'; END IF;
  SELECT * INTO v_res FROM public.credit_reservations WHERE id = p_reservation_id FOR UPDATE;

  IF v_res IS NULL OR v_res.status NOT IN ('reserved', 'pending') THEN
    RETURN false;
  END IF;

  -- Caller authorization
  IF v_role = 'service_role' THEN
    NULL;
  ELSIF v_auth_uid IS NOT NULL THEN
    IF v_res.user_id IS NOT NULL AND v_res.user_id <> v_auth_uid THEN
      RAISE EXCEPTION 'Not authorized to settle this reservation';
    END IF;
  ELSE
    IF v_res.user_id IS NOT NULL THEN
      RAISE EXCEPTION 'Not authorized to settle this reservation';
    END IF;
  END IF;

  v_owner_id:=COALESCE(v_res.team_owner_id,v_res.user_id);
  SELECT (
      billing_paid_active(subscription_plan,subscription_status,plan_end_date)
      OR (
        v_res.reservation_type = 'user_credit'
        AND v_res.team_owner_id IS NULL
        AND public.has_affiliate_testing_grant(v_res.user_id)
      )
    )
    AND (v_res.metadata->>'billing_period') IS NOT DISTINCT FROM to_jsonb(COALESCE(billing_credit_period_start,plan_start_date))#>>'{}'
    INTO v_billable FROM profiles WHERE id=v_owner_id FOR UPDATE;
  IF p_outcome = 'success' THEN
    -- Deduction already happened at reserve time; settle the ledger.
    IF v_res.reservation_type = 'trial_check' THEN
      INSERT INTO public.usage_ledger (
        user_id, guest_id, feature_slug, operation, credits_amount, trial_checks_amount,
        outcome, reservation_id, ledger_type, metadata
      ) VALUES (
        v_res.user_id, v_res.guest_id, v_res.feature_slug, 'trial_check_settled', 0, 1,
        'success', p_reservation_id, 'trial', p_metadata
      );
    ELSIF v_res.reservation_type = 'team_credit' AND v_res.team_owner_id IS NOT NULL THEN
      INSERT INTO public.usage_ledger (
        user_id, team_owner_id, feature_slug, operation, credits_amount,
        outcome, reservation_id, ledger_type, metadata
      ) VALUES (
        v_res.user_id, v_res.team_owner_id, v_res.feature_slug, 'team_credit_deducted', COALESCE(v_res.credits_reserved, 0),
        'success', p_reservation_id, 'team', p_metadata
      );
    ELSE
      INSERT INTO public.usage_ledger (
        user_id, feature_slug, operation, credits_amount,
        outcome, reservation_id, ledger_type, metadata
      ) VALUES (
        v_res.user_id, v_res.feature_slug, 'credit_deducted', COALESCE(v_res.credits_reserved, 0),
        'success', p_reservation_id, 'usage', p_metadata
      );
    END IF;

    UPDATE public.credit_reservations
    SET status = 'committed', finalized_at = now()
    WHERE id = p_reservation_id;
  ELSE
    -- GENUINE FAILURE: restore what was deducted at reserve time.
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
    ELSIF COALESCE(v_billable,false) THEN
      UPDATE profiles SET credits_balance=credits_balance+v_res.credits_reserved,updated_at=now() WHERE id=v_owner_id;
      IF v_res.reservation_type='team_credit' THEN
        UPDATE team_credit_allocations SET consumed_credits=GREATEST(0,consumed_credits-v_res.credits_reserved),updated_at=now() WHERE id=v_res.team_allocation_id;
      END IF;
    END IF;

    UPDATE public.credit_reservations
    SET status = 'released', finalized_at = now()
    WHERE id = p_reservation_id;

    INSERT INTO public.usage_ledger (
      user_id, guest_id, team_owner_id, feature_slug, operation, credits_amount,
      outcome, reservation_id, error_reason, ledger_type, metadata
    ) VALUES (
      v_res.user_id, v_res.guest_id, v_res.team_owner_id, v_res.feature_slug, 'reservation_released',
      COALESCE(v_res.credits_reserved, 0), 'failed', p_reservation_id, p_error_reason, 'refund', p_metadata
    );
  END IF;

  RETURN true;
END;
$function$
