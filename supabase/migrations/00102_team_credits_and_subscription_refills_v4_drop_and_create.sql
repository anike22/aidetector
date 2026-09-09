-- Drop existing functions before recreation
DROP FUNCTION IF EXISTS public.reserve_entitlement_and_credits(uuid,text,text,integer,text,text,jsonb);
DROP FUNCTION IF EXISTS public.finalize_credit_reservation(uuid,text,jsonb,text,text);
DROP FUNCTION IF EXISTS public.allocate_team_member_credits(uuid,text,integer,text,text);
DROP FUNCTION IF EXISTS public.get_team_credit_summary(uuid);
DROP FUNCTION IF EXISTS public.process_subscription_refill(text,text,text,text,text,timestamptz,timestamptz,integer,jsonb);

-- 1. Create team_credit_allocations table
CREATE TABLE IF NOT EXISTS public.team_credit_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_email text NOT NULL,
  member_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  seat_name text,
  role text NOT NULL DEFAULT 'member',
  allocated_credits integer NOT NULL DEFAULT 500,
  consumed_credits integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_team_credit_allocations_owner_email UNIQUE (owner_id, member_email)
);

CREATE INDEX IF NOT EXISTS idx_team_credit_allocations_owner ON public.team_credit_allocations(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_credit_allocations_member ON public.team_credit_allocations(member_user_id);
CREATE INDEX IF NOT EXISTS idx_team_credit_allocations_email ON public.team_credit_allocations(member_email);

-- Enable RLS on team_credit_allocations
ALTER TABLE public.team_credit_allocations ENABLE ROW LEVEL SECURITY;

-- Owner can read and write all allocations
DROP POLICY IF EXISTS "Team owners can manage allocations" ON public.team_credit_allocations;
CREATE POLICY "Team owners can manage allocations"
  ON public.team_credit_allocations
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Members can view their own allocation
DROP POLICY IF EXISTS "Team members can view own allocation" ON public.team_credit_allocations;
CREATE POLICY "Team members can view own allocation"
  ON public.team_credit_allocations
  FOR SELECT
  TO authenticated
  USING (member_user_id = auth.uid() OR member_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- Service role full access
DROP POLICY IF EXISTS "Service role full access on team_credit_allocations" ON public.team_credit_allocations;
CREATE POLICY "Service role full access on team_credit_allocations"
  ON public.team_credit_allocations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Add team tracking columns to credit_reservations and usage_ledger
ALTER TABLE public.credit_reservations
ADD COLUMN IF NOT EXISTS team_owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS team_allocation_id uuid REFERENCES public.team_credit_allocations(id) ON DELETE SET NULL;

ALTER TABLE public.usage_ledger
ADD COLUMN IF NOT EXISTS team_owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS team_member_email text;

-- 3. RPC: Allocate team member credits
CREATE OR REPLACE FUNCTION public.allocate_team_member_credits(
  p_owner_id uuid,
  p_member_email text,
  p_allocated_credits integer,
  p_seat_name text DEFAULT NULL,
  p_role text DEFAULT 'member'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_owner_credits integer;
  v_total_allocated integer;
  v_member_user_id uuid;
  v_new_total integer;
  v_result jsonb;
BEGIN
  -- Verify owner's plan is Business or Enterprise
  SELECT subscription_plan, COALESCE(credits_balance, 0)
  INTO v_plan, v_owner_credits
  FROM public.profiles
  WHERE id = p_owner_id;

  IF v_plan IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Owner account not found');
  END IF;

  IF v_plan NOT IN ('business', 'enterprise') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Team credit allocation is available only on Business and Enterprise plans');
  END IF;

  -- Check if member already has a registered account
  SELECT id INTO v_member_user_id
  FROM public.profiles
  WHERE lower(email) = lower(p_member_email)
  LIMIT 1;

  -- Check current total allocated excluding this member
  SELECT COALESCE(SUM(allocated_credits), 0)
  INTO v_total_allocated
  FROM public.team_credit_allocations
  WHERE owner_id = p_owner_id
    AND lower(member_email) != lower(p_member_email)
    AND status = 'active';

  v_new_total := v_total_allocated + GREATEST(0, p_allocated_credits);

  -- Ensure allocated sub-quotas do not exceed total pool
  IF v_new_total > v_owner_credits THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Total allocations (%s credits) cannot exceed shared credit pool (%s credits)', v_new_total, v_owner_credits),
      'available_unallocated', GREATEST(0, v_owner_credits - v_total_allocated)
    );
  END IF;

  -- Upsert allocation
  INSERT INTO public.team_credit_allocations (
    owner_id,
    member_email,
    member_user_id,
    seat_name,
    role,
    allocated_credits,
    status,
    updated_at
  )
  VALUES (
    p_owner_id,
    lower(p_member_email),
    v_member_user_id,
    COALESCE(p_seat_name, split_part(p_member_email, '@', 1)),
    COALESCE(p_role, 'member'),
    GREATEST(0, p_allocated_credits),
    'active',
    now()
  )
  ON CONFLICT (owner_id, member_email)
  DO UPDATE SET
    member_user_id = COALESCE(EXCLUDED.member_user_id, team_credit_allocations.member_user_id),
    seat_name = COALESCE(EXCLUDED.seat_name, team_credit_allocations.seat_name),
    role = EXCLUDED.role,
    allocated_credits = EXCLUDED.allocated_credits,
    status = 'active',
    updated_at = now()
  RETURNING to_jsonb(team_credit_allocations.*) INTO v_result;

  RETURN jsonb_build_object(
    'success', true,
    'allocation', v_result,
    'total_allocated', v_new_total,
    'remaining_unallocated', GREATEST(0, v_owner_credits - v_new_total)
  );
END;
$$;

-- 4. RPC: Get team credit summary for owner or member
CREATE OR REPLACE FUNCTION public.get_team_credit_summary(
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_credits_balance integer;
  v_user_email text;
  v_is_owner boolean := false;
  v_allocations jsonb := '[]'::jsonb;
  v_member_allocation record;
  v_total_allocated integer := 0;
  v_total_consumed integer := 0;
BEGIN
  SELECT email, subscription_plan, COALESCE(credits_balance, 0)
  INTO v_user_email, v_plan, v_credits_balance
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_plan IN ('business', 'enterprise') THEN
    v_is_owner := true;
  END IF;

  -- If user is owner
  IF v_is_owner THEN
    SELECT
      COALESCE(SUM(allocated_credits), 0),
      COALESCE(SUM(consumed_credits), 0),
      COALESCE(jsonb_agg(to_jsonb(t.*) ORDER BY t.created_at ASC), '[]'::jsonb)
    INTO v_total_allocated, v_total_consumed, v_allocations
    FROM public.team_credit_allocations t
    WHERE t.owner_id = p_user_id AND t.status != 'removed';

    RETURN jsonb_build_object(
      'is_team_account', true,
      'is_owner', true,
      'plan', v_plan,
      'total_pool', v_credits_balance,
      'total_allocated', v_total_allocated,
      'total_consumed', v_total_consumed,
      'unallocated_pool', GREATEST(0, v_credits_balance - v_total_allocated),
      'allocations', v_allocations
    );
  END IF;

  -- Check if user is a member under another owner
  SELECT t.*, p.subscription_plan as owner_plan, p.credits_balance as owner_pool
  INTO v_member_allocation
  FROM public.team_credit_allocations t
  JOIN public.profiles p ON p.id = t.owner_id
  WHERE (t.member_user_id = p_user_id OR lower(t.member_email) = lower(v_user_email))
    AND t.status = 'active'
  LIMIT 1;

  IF v_member_allocation.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'is_team_account', true,
      'is_owner', false,
      'owner_id', v_member_allocation.owner_id,
      'seat_name', v_member_allocation.seat_name,
      'role', v_member_allocation.role,
      'allocated_credits', v_member_allocation.allocated_credits,
      'consumed_credits', v_member_allocation.consumed_credits,
      'remaining_credits', GREATEST(0, v_member_allocation.allocated_credits - v_member_allocation.consumed_credits),
      'owner_shared_pool', v_member_allocation.owner_pool,
      'plan', v_member_allocation.owner_plan
    );
  END IF;

  RETURN jsonb_build_object(
    'is_team_account', false,
    'is_owner', false,
    'plan', COALESCE(v_plan, 'free'),
    'credits_balance', v_credits_balance
  );
END;
$$;

-- 5. RPC: Process Subscription Refill (Stripe & Paystack)
CREATE OR REPLACE FUNCTION public.process_subscription_refill(
  p_provider text,
  p_event_id text,
  p_customer_email text,
  p_plan_id text,
  p_billing_cycle text DEFAULT 'monthly',
  p_period_start timestamptz DEFAULT now(),
  p_period_end timestamptz DEFAULT (now() + interval '1 month'),
  p_credits_amount integer DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_current_plan text;
  v_effective_plan text;
  v_grant_credits integer;
  v_existing_entry record;
  v_new_balance integer;
BEGIN
  -- Idempotency check in usage_ledger
  SELECT id INTO v_existing_entry
  FROM public.usage_ledger
  WHERE ledger_type = 'subscription'
    AND metadata->>'event_id' = p_event_id
  LIMIT 1;

  IF v_existing_entry.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'idempotent_replay', true,
      'message', 'Event already processed'
    );
  END IF;

  -- Lookup user profile
  SELECT id, subscription_plan INTO v_user_id, v_current_plan
  FROM public.profiles
  WHERE lower(email) = lower(p_customer_email)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('User profile with email %s not found', p_customer_email)
    );
  END IF;

  v_effective_plan := COALESCE(p_plan_id, v_current_plan, 'pro');

  -- Authoritative plan monthly credits calculation
  IF p_credits_amount IS NOT NULL AND p_credits_amount > 0 THEN
    v_grant_credits := p_credits_amount;
  ELSE
    CASE v_effective_plan
      WHEN 'pro' THEN v_grant_credits := 300;
      WHEN 'pro_plus' THEN v_grant_credits := 1000;
      WHEN 'business' THEN v_grant_credits := 3000;
      WHEN 'enterprise' THEN v_grant_credits := 10000;
      ELSE v_grant_credits := 300;
    END CASE;
  END IF;

  -- Atomically add credits and update subscription status
  UPDATE public.profiles
  SET
    subscription_plan = v_effective_plan,
    subscription_status = 'active',
    billing_cycle = COALESCE(p_billing_cycle, 'monthly'),
    plan_start_date = COALESCE(p_period_start, now()),
    plan_end_date = COALESCE(p_period_end, now() + interval '1 month'),
    credits_refill_date = now(),
    monthly_credit_allocation = v_grant_credits,
    credits_balance = COALESCE(credits_balance, 0) + v_grant_credits,
    updated_at = now()
  WHERE id = v_user_id
  RETURNING credits_balance INTO v_new_balance;

  -- Reset consumed credits on team allocations if billing period reset for Business/Enterprise
  IF v_effective_plan IN ('business', 'enterprise') THEN
    UPDATE public.team_credit_allocations
    SET consumed_credits = 0, updated_at = now()
    WHERE owner_id = v_user_id;
  END IF;

  -- Write to usage_ledger
  INSERT INTO public.usage_ledger (
    user_id,
    feature_slug,
    operation,
    credits_amount,
    outcome,
    ledger_type,
    metadata
  )
  VALUES (
    v_user_id,
    'subscription_refill',
    format('Subscription credit grant (%s - %s)', p_provider, v_effective_plan),
    v_grant_credits,
    'success',
    'subscription',
    jsonb_build_object(
      'provider', p_provider,
      'event_id', p_event_id,
      'plan', v_effective_plan,
      'billing_cycle', p_billing_cycle,
      'granted_credits', v_grant_credits,
      'new_balance', v_new_balance,
      'period_start', p_period_start,
      'period_end', p_period_end,
      'raw_metadata', p_metadata
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'plan', v_effective_plan,
    'granted_credits', v_grant_credits,
    'new_balance', v_new_balance
  );
END;
$$;

-- 6. Recreate reserve_entitlement_and_credits
CREATE OR REPLACE FUNCTION public.reserve_entitlement_and_credits(
  p_user_id uuid DEFAULT NULL,
  p_guest_id text DEFAULT NULL,
  p_feature_slug text DEFAULT 'text_detect_balanced',
  p_credits_cost integer DEFAULT 1,
  p_timezone text DEFAULT 'UTC',
  p_idempotency_key text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  allowed boolean,
  reservation_id uuid,
  is_trial_check boolean,
  reason text,
  error_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res_id uuid;
  v_user_email text;
  v_plan text;
  v_credits_balance integer;
  v_trial_remaining integer;
  v_trial_used integer;
  v_is_trial_eligible boolean := false;
  v_team_alloc record;
  v_team_owner_id uuid := NULL;
  v_team_alloc_id uuid := NULL;
  v_owner_credits integer;
  v_member_remaining_quota integer;
BEGIN
  -- 1. Guest Handling
  IF p_user_id IS NULL THEN
    IF p_guest_id IS NULL OR length(trim(p_guest_id)) = 0 THEN
      RETURN QUERY SELECT false, NULL::uuid, false, 'Invalid guest session identifier'::text, 'INVALID_GUEST'::text;
      RETURN;
    END IF;

    IF p_feature_slug IN ('text_detect_balanced', 'humanizer_rewrite', 'plagiarism_check', 'seo_assistant', 'image_detect_standard', 'video_detect_balanced', 'voice_analysis') THEN
      v_is_trial_eligible := true;
    END IF;

    IF NOT v_is_trial_eligible THEN
      RETURN QUERY SELECT false, NULL::uuid, false, 'This feature requires a registered account or paid plan.'::text, 'PAID_FEATURE_REQUIRED'::text;
      RETURN;
    END IF;

    SELECT trial_checks_remaining, trial_checks_used
    INTO v_trial_remaining, v_trial_used
    FROM public.server_guest_sessions
    WHERE guest_id = p_guest_id;

    IF v_trial_remaining IS NULL THEN
      INSERT INTO public.server_guest_sessions (guest_id, trial_checks_remaining, trial_checks_used, created_at, updated_at)
      VALUES (p_guest_id, 1, 0, now(), now())
      ON CONFLICT (guest_id) DO NOTHING;
      v_trial_remaining := 1;
      v_trial_used := 0;
    END IF;

    IF v_trial_remaining <= 0 THEN
      RETURN QUERY SELECT false, NULL::uuid, true, 'Guest trial check used. Create a free account for 4 more checks!'::text, 'GUEST_TRIAL_EXHAUSTED'::text;
      RETURN;
    END IF;

    v_res_id := gen_random_uuid();
    INSERT INTO public.credit_reservations (
      id, guest_id, feature_slug, credits_cost, is_trial_check, status, idempotency_key, metadata, created_at
    ) VALUES (
      v_res_id, p_guest_id, p_feature_slug, p_credits_cost, true, 'pending', p_idempotency_key, p_metadata, now()
    );

    RETURN QUERY SELECT true, v_res_id, true, 'Guest trial check reserved'::text, NULL::text;
    RETURN;
  END IF;

  -- 2. Authenticated User Handling
  SELECT email, subscription_plan, COALESCE(credits_balance, 0), COALESCE(trial_checks_remaining, 4), COALESCE(trial_checks_used, 0)
  INTO v_user_email, v_plan, v_credits_balance, v_trial_remaining, v_trial_used
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_plan IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, false, 'User profile not found'::text, 'USER_NOT_FOUND'::text;
    RETURN;
  END IF;

  -- 2A. Check if user is a member of a Business/Enterprise Team
  SELECT t.*, p.credits_balance as owner_pool
  INTO v_team_alloc
  FROM public.team_credit_allocations t
  JOIN public.profiles p ON p.id = t.owner_id
  WHERE (t.member_user_id = p_user_id OR lower(t.member_email) = lower(v_user_email))
    AND t.status = 'active'
  LIMIT 1;

  IF v_team_alloc.id IS NOT NULL THEN
    v_team_owner_id := v_team_alloc.owner_id;
    v_team_alloc_id := v_team_alloc.id;
    v_owner_credits := COALESCE(v_team_alloc.owner_pool, 0);
    v_member_remaining_quota := GREATEST(0, v_team_alloc.allocated_credits - v_team_alloc.consumed_credits);

    IF v_member_remaining_quota < p_credits_cost THEN
      RETURN QUERY SELECT false, NULL::uuid, false, format('Member credit allocation exhausted (%s remaining, %s needed). Please contact your team admin.', v_member_remaining_quota, p_credits_cost)::text, 'TEAM_MEMBER_QUOTA_EXHAUSTED'::text;
      RETURN;
    END IF;

    IF v_owner_credits < p_credits_cost THEN
      RETURN QUERY SELECT false, NULL::uuid, false, 'Team shared credit pool is exhausted. Please contact your team owner to refill credits.'::text, 'TEAM_POOL_EXHAUSTED'::text;
      RETURN;
    END IF;

    v_res_id := gen_random_uuid();
    INSERT INTO public.credit_reservations (
      id, user_id, feature_slug, credits_cost, is_trial_check, status, idempotency_key, team_owner_id, team_allocation_id, metadata, created_at
    ) VALUES (
      v_res_id, p_user_id, p_feature_slug, p_credits_cost, false, 'pending', p_idempotency_key, v_team_owner_id, v_team_alloc_id, p_metadata, now()
    );

    RETURN QUERY SELECT true, v_res_id, false, 'Team credits reserved'::text, NULL::text;
    RETURN;
  END IF;

  -- 2B. Direct Paid Plan User
  IF v_plan IN ('pro', 'pro_plus', 'business', 'enterprise') THEN
    IF v_credits_balance < p_credits_cost THEN
      RETURN QUERY SELECT false, NULL::uuid, false, format('Insufficient credits (%s available, %s needed). Please upgrade or purchase credits.', v_credits_balance, p_credits_cost)::text, 'INSUFFICIENT_CREDITS'::text;
      RETURN;
    END IF;

    v_res_id := gen_random_uuid();
    INSERT INTO public.credit_reservations (
      id, user_id, feature_slug, credits_cost, is_trial_check, status, idempotency_key, metadata, created_at
    ) VALUES (
      v_res_id, p_user_id, p_feature_slug, p_credits_cost, false, 'pending', p_idempotency_key, p_metadata, now()
    );

    RETURN QUERY SELECT true, v_res_id, false, 'Credits reserved'::text, NULL::text;
    RETURN;
  END IF;

  -- 2C. Free Tier Account (Trial Check Model)
  IF p_feature_slug IN ('text_detect_balanced', 'humanizer_rewrite', 'plagiarism_check', 'seo_assistant', 'image_detect_standard', 'video_detect_balanced', 'voice_analysis') THEN
    v_is_trial_eligible := true;
  END IF;

  IF NOT v_is_trial_eligible THEN
    RETURN QUERY SELECT false, NULL::uuid, false, 'This feature requires a paid subscription plan.'::text, 'PAID_FEATURE_REQUIRED'::text;
    RETURN;
  END IF;

  IF v_trial_remaining <= 0 THEN
    RETURN QUERY SELECT false, NULL::uuid, true, 'All 5 trial checks used. Please upgrade to a Pro plan for 300 monthly credits!'::text, 'TRIAL_CHECKS_EXHAUSTED'::text;
    RETURN;
  END IF;

  v_res_id := gen_random_uuid();
  INSERT INTO public.credit_reservations (
    id, user_id, feature_slug, credits_cost, is_trial_check, status, idempotency_key, metadata, created_at
  ) VALUES (
    v_res_id, p_user_id, p_feature_slug, p_credits_cost, true, 'pending', p_idempotency_key, p_metadata, now()
  );

  RETURN QUERY SELECT true, v_res_id, true, 'Trial check reserved'::text, NULL::text;
  RETURN;
END;
$$;

-- 7. Recreate finalize_credit_reservation
CREATE OR REPLACE FUNCTION public.finalize_credit_reservation(
  p_reservation_id uuid,
  p_outcome text DEFAULT 'success',
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_error_reason text DEFAULT NULL,
  p_timezone text DEFAULT 'UTC'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res record;
  v_user_id uuid;
  v_guest_id text;
  v_team_owner_id uuid;
  v_team_alloc_id uuid;
  v_cost integer;
  v_is_trial boolean;
BEGIN
  SELECT * INTO v_res
  FROM public.credit_reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF v_res IS NULL OR v_res.status != 'pending' THEN
    RETURN false;
  END IF;

  v_user_id := v_res.user_id;
  v_guest_id := v_res.guest_id;
  v_cost := v_res.credits_cost;
  v_is_trial := v_res.is_trial_check;
  v_team_owner_id := v_res.team_owner_id;
  v_team_alloc_id := v_res.team_allocation_id;

  IF p_outcome = 'success' THEN
    IF v_is_trial THEN
      IF v_user_id IS NOT NULL THEN
        UPDATE public.profiles
        SET trial_checks_remaining = GREATEST(0, trial_checks_remaining - 1),
            trial_checks_used = trial_checks_used + 1,
            updated_at = now()
        WHERE id = v_user_id;
      ELSIF v_guest_id IS NOT NULL THEN
        UPDATE public.server_guest_sessions
        SET trial_checks_remaining = GREATEST(0, trial_checks_remaining - 1),
            trial_checks_used = trial_checks_used + 1,
            updated_at = now()
        WHERE guest_id = v_guest_id;
      END IF;

      INSERT INTO public.usage_ledger (
        user_id, guest_id, feature_slug, operation, credits_amount, trial_checks_amount, outcome, reservation_id, ledger_type, metadata
      ) VALUES (
        v_user_id, v_guest_id, v_res.feature_slug, 'trial_check_settled', 0, 1, 'success', p_reservation_id, 'trial', p_metadata
      );

    ELSIF v_team_owner_id IS NOT NULL AND v_team_alloc_id IS NOT NULL THEN
      UPDATE public.profiles
      SET credits_balance = GREATEST(0, credits_balance - v_cost),
          updated_at = now()
      WHERE id = v_team_owner_id;

      UPDATE public.team_credit_allocations
      SET consumed_credits = consumed_credits + v_cost,
          updated_at = now()
      WHERE id = v_team_alloc_id;

      INSERT INTO public.usage_ledger (
        user_id, team_owner_id, feature_slug, operation, credits_amount, outcome, reservation_id, ledger_type, metadata
      ) VALUES (
        v_user_id, v_team_owner_id, v_res.feature_slug, 'team_credit_deducted', v_cost, 'success', p_reservation_id, 'team', p_metadata
      );

    ELSE
      UPDATE public.profiles
      SET credits_balance = GREATEST(0, credits_balance - v_cost),
          updated_at = now()
      WHERE id = v_user_id;

      INSERT INTO public.usage_ledger (
        user_id, feature_slug, operation, credits_amount, outcome, reservation_id, ledger_type, metadata
      ) VALUES (
        v_user_id, v_res.feature_slug, 'credit_deducted', v_cost, 'success', p_reservation_id, 'usage', p_metadata
      );
    END IF;

    UPDATE public.credit_reservations
    SET status = 'committed', updated_at = now()
    WHERE id = p_reservation_id;

  ELSE
    UPDATE public.credit_reservations
    SET status = 'released', updated_at = now()
    WHERE id = p_reservation_id;

    INSERT INTO public.usage_ledger (
      user_id, guest_id, team_owner_id, feature_slug, operation, credits_amount, outcome, reservation_id, error_reason, ledger_type, metadata
    ) VALUES (
      v_user_id, v_guest_id, v_team_owner_id, v_res.feature_slug, 'reservation_released', 0, 'failed', p_reservation_id, p_error_reason, 'refund', p_metadata
    );
  END IF;

  RETURN true;
END;
$$;