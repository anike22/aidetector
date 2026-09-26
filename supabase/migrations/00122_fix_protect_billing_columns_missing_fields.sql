-- =====================================================================
-- FIX: protect_billing_columns referenced columns that do not exist on
-- profiles (trial_checks_total, monthly_credit_allocation). PL/pgSQL
-- resolves record fields at runtime, so ANY non-admin/non-service
-- profile UPDATE crashed with 42703 ("record new has no field"), even
-- when no billing field changed. This broke user profile self-edits
-- and authenticated-context billing updates.
-- Guard now checks only columns that actually exist on profiles.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.protect_billing_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $function$
DECLARE
  v_role TEXT := COALESCE(NULLIF(current_setting('role', true), ''), 'none');
  v_auth_uid UUID := auth.uid();
  v_is_admin BOOLEAN := FALSE;
BEGIN
  -- Trusted server context (Edge Functions use the service role key).
  IF v_role = 'service_role' OR pg_has_role(session_user, 'service_role', 'member') THEN
    RETURN NEW;
  END IF;

  -- Table owner / migrations run unrestricted.
  IF session_user = 'postgres' AND v_role = 'none' THEN
    -- Distinguish migration consoles (no auth context) from user sessions:
    -- user sessions always carry a JWT claim.
    IF v_auth_uid IS NULL AND current_setting('request.jwt.claims', true) IS NULL THEN
      RETURN NEW;
    END IF;
  END IF;

  IF v_auth_uid IS NOT NULL THEN
    SELECT (role::text = 'admin') INTO v_is_admin FROM public.profiles WHERE id = v_auth_uid;
  END IF;

  IF COALESCE(v_is_admin, false) THEN
    RETURN NEW;
  END IF;

  IF NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan
     OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
     OR NEW.credits_balance IS DISTINCT FROM OLD.credits_balance
     OR NEW.credits_refill_date IS DISTINCT FROM OLD.credits_refill_date
     OR NEW.trial_checks_remaining IS DISTINCT FROM OLD.trial_checks_remaining
     OR NEW.trial_checks_used IS DISTINCT FROM OLD.trial_checks_used
     OR NEW.plan_start_date IS DISTINCT FROM OLD.plan_start_date
     OR NEW.plan_end_date IS DISTINCT FROM OLD.plan_end_date
     OR NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Billing fields can only be modified by the billing system';
  END IF;

  RETURN NEW;
END;
$function$;
