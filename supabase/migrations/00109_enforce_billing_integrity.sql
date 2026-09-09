-- =====================================================================
-- Billing Integrity Enforcement (closes subscription/credit bypass)
-- 1. Registry: add missing feature slugs used by frontend/tools
-- =====================================================================
INSERT INTO credit_rate_table (feature_slug, feature_name, trial_eligible, base_credit_cost, billing_unit, min_plan, details)
VALUES
  ('seo_content_studio', 'SEO / Essay Content Studio', true, 2, 'operation', 'free', '{"description":"Content Studio generation steps and Essay Studio assistance"}'::jsonb),
  ('citation_verifier', 'Citation Verification', false, 1, 'references_5', 'pro', '{"description":"Citation Verification primary alias"}'::jsonb),
  ('hallucination_detector', 'Hallucination Detector', false, 2, 'words_1000', 'pro', '{"description":"Hallucination Detector primary alias"}'::jsonb)
ON CONFLICT (feature_slug) DO UPDATE
SET feature_name = EXCLUDED.feature_name,
    trial_eligible = EXCLUDED.trial_eligible,
    base_credit_cost = EXCLUDED.base_credit_cost,
    billing_unit = EXCLUDED.billing_unit,
    min_plan = EXCLUDED.min_plan,
    updated_at = now();

-- =====================================================================
-- 2. humanization_jobs: billing settlement columns
-- =====================================================================
ALTER TABLE humanization_jobs
  ADD COLUMN billing_reservation_id uuid,
  ADD COLUMN billing_status text;

-- =====================================================================
-- 3. server_guest_sessions: track merged trial usage (idempotent linking)
-- =====================================================================
ALTER TABLE server_guest_sessions
  ADD COLUMN merged_trial_used integer NOT NULL DEFAULT 0;

-- =====================================================================
-- 4. Reservation idempotency: unique key (race-safe duplicate protection)
-- =====================================================================
CREATE UNIQUE INDEX credit_reservations_idempotency_key_uniq
  ON credit_reservations(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- =====================================================================
-- 5. Pre-migration cleanup: dangling expired reservations from old
--    (deduct-at-finalize) semantics are released, never charged.
-- =====================================================================
UPDATE credit_reservations
SET status = 'released', finalized_at = now()
WHERE status IN ('reserved', 'pending') AND expires_at < now();

-- =====================================================================
-- 6. reserve_entitlement_and_credits v2
--    - Identity enforcement: authenticated callers can only reserve for
--      themselves; anon callers cannot reserve for any user.
--    - Atomic allowance/credit deduction AT RESERVE TIME (concurrency
--      safe: two parallel requests with one check left -> one wins).
--    - Guest sessions auto-created only with per-IP throttling for
--      direct client calls (service_role calls are trusted).
--    - Idempotency keys are race-safe via unique index.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.reserve_entitlement_and_credits(
  p_user_id uuid DEFAULT NULL::uuid,
  p_guest_id text DEFAULT NULL::text,
  p_feature_slug text DEFAULT 'text_detect_balanced'::text,
  p_credits_cost numeric DEFAULT 1,
  p_timezone text DEFAULT 'UTC'::text,
  p_idempotency_key text DEFAULT NULL::text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  allowed boolean, reservation_id uuid, plan text, credits_balance numeric,
  credits_reserved numeric, daily_remaining numeric, daily_limit numeric,
  is_trial_check boolean, trial_checks_remaining integer, trial_checks_total integer,
  reason text, error_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $function$
DECLARE
  v_role TEXT := COALESCE(current_setting('role', true), 'anon');
  v_auth_uid UUID := auth.uid();
  v_rate RECORD;
  v_effective_cost INTEGER;
  v_is_trial_eligible BOOLEAN;
  v_res_id UUID;
  v_existing_res RECORD;
  v_guest RECORD;
  v_profile RECORD;
  v_team_alloc RECORD;
  v_user_balance NUMERIC;
  v_canonical_slug TEXT;
  v_client_ip TEXT;
  v_ip_new_sessions INT;
  v_trial_remaining_after INT;
BEGIN
  -- ── 0. Identity enforcement ──────────────────────────────────────────
  IF v_role = 'service_role' THEN
    NULL; -- trusted server context (Edge Functions resolved identity)
  ELSIF v_auth_uid IS NOT NULL THEN
    p_user_id := v_auth_uid; -- authenticated callers can only bill themselves
  ELSE
    p_user_id := NULL;       -- anon callers can never bill a user account
  END IF;

  v_canonical_slug := p_feature_slug;

  -- ── 1. Resolve feature rate and trial eligibility ────────────────────
  SELECT * INTO v_rate FROM credit_rate_table WHERE feature_slug = v_canonical_slug;

  IF NOT FOUND THEN
    v_canonical_slug := CASE
      WHEN p_feature_slug LIKE 'image_%' OR p_feature_slug = 'ai_image_detector' THEN 'ai_image_detector'
      WHEN p_feature_slug LIKE 'video_%' OR p_feature_slug = 'ai_video_detector' THEN 'ai_video_detector'
      WHEN p_feature_slug IN ('citation_verifier', 'citation_check') THEN 'citation_verify'
      WHEN p_feature_slug IN ('hallucination_detector', 'hallucination_check') THEN 'hallucination_check'
      WHEN p_feature_slug IN ('humanizer_rewrite', 'run_humanizer') THEN 'ai_humanizer'
      WHEN p_feature_slug IN ('seo_content_studio', 'essay_studio') THEN 'seo_content_studio'
      WHEN p_feature_slug IN ('seo_assistant', 'seo_audit', 'seo_agent', 'keyword_research', 'keyword_intelligence', 'link_building', 'link_intelligence', 'semrush_report', 'technical_audit', 'aeo_optimizer', 'content_strategy', 'gsc_traffic', 'domain_analysis', 'seo_analyzer') THEN 'seo_assistant'
      ELSE 'ai_detector'
    END;
    SELECT * INTO v_rate FROM credit_rate_table WHERE feature_slug = v_canonical_slug;
  END IF;

  IF FOUND THEN
    v_effective_cost := COALESCE(v_rate.base_credit_cost, GREATEST(p_credits_cost::INTEGER, 1));
    v_is_trial_eligible := COALESCE(v_rate.trial_eligible, false);
  ELSE
    -- Missing configuration must NOT grant access (default-deny)
    RETURN QUERY SELECT
      FALSE, NULL::UUID, 'unknown'::TEXT, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
      FALSE, 0::INTEGER, 0::INTEGER,
      'This feature has no billing configuration and cannot run. Please contact support.'::TEXT,
      'MISSING_RATE_CONFIG'::TEXT;
    RETURN;
  END IF;

  -- ── 2. Idempotency check (race-safe via unique index) ────────────────
  IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) > 0 THEN
    SELECT * INTO v_existing_res
    FROM credit_reservations
    WHERE idempotency_key = p_idempotency_key
      AND status IN ('reserved', 'committed');

    IF FOUND THEN
      RETURN QUERY SELECT
        TRUE,
        v_existing_res.id,
        COALESCE(v_existing_res.plan, 'cached')::TEXT,
        0::NUMERIC,
        v_existing_res.credits_reserved::NUMERIC,
        1::NUMERIC,
        1::NUMERIC,
        (v_existing_res.reservation_type = 'trial_check'),
        0::INTEGER,
        1::INTEGER,
        'Existing reservation recovered'::TEXT,
        NULL::TEXT;
      RETURN;
    END IF;
  END IF;

  -- ── 3. GUEST FLOW (no user account) ──────────────────────────────────
  IF p_user_id IS NULL THEN
    IF p_guest_id IS NULL OR trim(p_guest_id) = '' THEN
      RETURN QUERY SELECT
        FALSE, NULL::UUID, 'guest'::TEXT, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 1::NUMERIC,
        FALSE, 0::INTEGER, 1::INTEGER,
        'Guest session identifier required'::TEXT, 'MISSING_GUEST_ID'::TEXT;
      RETURN;
    END IF;

    IF NOT v_is_trial_eligible THEN
      RETURN QUERY SELECT
        FALSE, NULL::UUID, 'guest'::TEXT, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 1::NUMERIC,
        FALSE, 0::INTEGER, 1::INTEGER,
        'This feature requires a paid subscription or registered free trial.'::TEXT, 'PAID_ONLY_FEATURE'::TEXT;
      RETURN;
    END IF;

    SELECT * INTO v_guest FROM server_guest_sessions WHERE guest_id = p_guest_id FOR UPDATE;

    IF NOT FOUND THEN
      -- Direct client calls: throttle new-session creation per IP.
      -- Service-role calls (Edge Functions) are trusted and pass a
      -- pre-validated guest id.
      IF v_role <> 'service_role' THEN
        v_client_ip := NULLIF(trim(split_part(
          COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', ''),
          ',', 1)), '');
        SELECT COUNT(*) INTO v_ip_new_sessions
        FROM server_guest_sessions
        WHERE ip_address = COALESCE(v_client_ip, 'unknown')
          AND created_at > now() - interval '24 hours';
        IF v_ip_new_sessions >= 10 THEN
          RETURN QUERY SELECT
            FALSE, NULL::UUID, 'guest'::TEXT, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 1::NUMERIC,
            FALSE, 0::INTEGER, 1::INTEGER,
            'Too many new guest sessions from this network. Please create a free account to continue.'::TEXT,
            'GUEST_SESSION_RATE_LIMITED'::TEXT;
          RETURN;
        END IF;
      END IF;

      INSERT INTO server_guest_sessions
        (guest_id, trial_checks_remaining, trial_checks_total, trial_checks_used, total_used, last_active_at)
      VALUES (p_guest_id, 1, 1, 0, 0, now())
      RETURNING * INTO v_guest;
    END IF;

    IF COALESCE(v_guest.trial_checks_remaining, 0) <= 0 THEN
      RETURN QUERY SELECT
        FALSE, NULL::UUID, 'guest'::TEXT, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 1::NUMERIC,
        FALSE, 0::INTEGER, 1::INTEGER,
        'You''ve used your free check. Register for 4 additional free checks.'::TEXT,
        'TRIAL_EXHAUSTED'::TEXT;
      RETURN;
    END IF;

    -- ATOMIC DEDUCTION at reserve time
    UPDATE server_guest_sessions
    SET trial_checks_remaining = trial_checks_remaining - 1,
        trial_checks_used = trial_checks_used + 1,
        total_used = COALESCE(total_used, 0) + 1,
        last_active_at = now(),
        updated_at = now()
    WHERE guest_id = p_guest_id
    RETURNING trial_checks_remaining INTO v_trial_remaining_after;

    v_res_id := gen_random_uuid();
    INSERT INTO credit_reservations (
      id, user_id, guest_id, feature_slug, credits_reserved, status, idempotency_key, metadata,
      reservation_type, trial_checks_reserved, expires_at
    ) VALUES (
      v_res_id, NULL, p_guest_id, v_canonical_slug, 0, 'reserved', p_idempotency_key, p_metadata,
      'trial_check', 1, now() + interval '15 minutes'
    );

    RETURN QUERY SELECT
      TRUE, v_res_id, 'guest'::TEXT, 0::NUMERIC, 0::NUMERIC, 1::NUMERIC, 1::NUMERIC,
      TRUE, COALESCE(v_trial_remaining_after, 0), 1,
      'Guest trial check reserved.'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- ── 4. REGISTERED USER FLOW ──────────────────────────────────────────
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      FALSE, NULL::UUID, 'unknown'::TEXT, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
      FALSE, 0::INTEGER, 0::INTEGER,
      'User profile not found'::TEXT, 'PROFILE_NOT_FOUND'::TEXT;
    RETURN;
  END IF;

  -- Registered free trial (shared introductory allowance, any plan with
  -- remaining introductory checks, trial-eligible features only)
  IF v_is_trial_eligible AND COALESCE(v_profile.trial_checks_remaining, 0) > 0 THEN
    UPDATE profiles
    SET trial_checks_remaining = trial_checks_remaining - 1,
        trial_checks_used = trial_checks_used + 1,
        updated_at = now()
    WHERE id = p_user_id
    RETURNING trial_checks_remaining INTO v_trial_remaining_after;

    v_res_id := gen_random_uuid();
    INSERT INTO credit_reservations (
      id, user_id, guest_id, feature_slug, credits_reserved, status, idempotency_key, metadata,
      reservation_type, trial_checks_reserved, expires_at
    ) VALUES (
      v_res_id, p_user_id, p_guest_id, v_canonical_slug, 0, 'reserved', p_idempotency_key, p_metadata,
      'trial_check', 1, now() + interval '15 minutes'
    );

    RETURN QUERY SELECT
      TRUE, v_res_id,
      COALESCE(v_profile.subscription_plan, 'free')::TEXT,
      COALESCE(v_profile.credits_balance, 0)::NUMERIC,
      0::NUMERIC,
      COALESCE(v_trial_remaining_after, 0)::NUMERIC,
      COALESCE(v_profile.trial_checks_total, 5)::NUMERIC,
      TRUE,
      COALESCE(v_trial_remaining_after, 0)::INTEGER,
      COALESCE(v_profile.trial_checks_total, 5)::INTEGER,
      'Free trial check reserved.'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Paid / credit balance flow
  v_user_balance := COALESCE(v_profile.credits_balance, 0);

  IF v_user_balance >= v_effective_cost THEN
    -- ATOMIC DEDUCTION at reserve time
    UPDATE profiles
    SET credits_balance = credits_balance - v_effective_cost,
        updated_at = now()
    WHERE id = p_user_id;

    v_res_id := gen_random_uuid();
    INSERT INTO credit_reservations (
      id, user_id, guest_id, feature_slug, credits_reserved, status, idempotency_key, metadata,
      reservation_type, expires_at
    ) VALUES (
      v_res_id, p_user_id, p_guest_id, v_canonical_slug, v_effective_cost, 'reserved', p_idempotency_key, p_metadata,
      'user_credit', now() + interval '15 minutes'
    );

    RETURN QUERY SELECT
      TRUE, v_res_id,
      COALESCE(v_profile.subscription_plan, 'pro')::TEXT,
      (v_user_balance - v_effective_cost)::NUMERIC,
      v_effective_cost::NUMERIC,
      (v_user_balance - v_effective_cost)::NUMERIC,
      v_user_balance,
      FALSE, 0::INTEGER, 0::INTEGER,
      'Credits reserved successfully.'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Team allocation fallback
  SELECT * INTO v_team_alloc
  FROM team_credit_allocations
  WHERE member_user_id = p_user_id AND is_active = true
  LIMIT 1
  FOR UPDATE;

  IF FOUND AND (v_team_alloc.allocated_credits - v_team_alloc.used_credits) >= v_effective_cost THEN
    UPDATE team_credit_allocations
    SET used_credits = used_credits + v_effective_cost,
        updated_at = now()
    WHERE id = v_team_alloc.id;

    v_res_id := gen_random_uuid();
    INSERT INTO credit_reservations (
      id, user_id, guest_id, feature_slug, credits_reserved, status, idempotency_key, metadata,
      reservation_type, team_allocation_id, team_owner_id, expires_at
    ) VALUES (
      v_res_id, p_user_id, p_guest_id, v_canonical_slug, v_effective_cost, 'reserved', p_idempotency_key, p_metadata,
      'team_credit', v_team_alloc.id, v_team_alloc.owner_user_id, now() + interval '15 minutes'
    );

    RETURN QUERY SELECT
      TRUE, v_res_id, 'team_member'::TEXT,
      (v_team_alloc.allocated_credits - v_team_alloc.used_credits)::NUMERIC,
      v_effective_cost::NUMERIC,
      (v_team_alloc.allocated_credits - v_team_alloc.used_credits)::NUMERIC,
      v_team_alloc.allocated_credits::NUMERIC,
      FALSE, 0::INTEGER, 0::INTEGER,
      'Team credit reserved'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    FALSE, NULL::UUID,
    COALESCE(v_profile.subscription_plan, 'free')::TEXT,
    v_user_balance, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
    FALSE,
    COALESCE(v_profile.trial_checks_remaining, 0)::INTEGER,
    COALESCE(v_profile.trial_checks_total, 5)::INTEGER,
    CASE
      WHEN v_profile.subscription_plan = 'free' THEN 'You''ve used your free checks. Choose a plan to continue.'
      ELSE 'Insufficient credits for this operation. Please top up or renew your plan to continue.'
    END::TEXT,
    'INSUFFICIENT_CREDITS'::TEXT;
END;
$function$;

-- =====================================================================
-- 7. finalize_credit_reservation v2
--    - Allowances/credits were deducted AT RESERVE; success keeps the
--      deduction (ledger + commit), failure RESTORES it.
--    - Caller authorization: service_role trusted; authenticated may
--      only settle own (or guest) reservations; anon only guest ones.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.finalize_credit_reservation(
  p_reservation_id uuid DEFAULT NULL::uuid,
  p_outcome text DEFAULT 'success'::text,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_error_reason text DEFAULT NULL::text,
  p_timezone text DEFAULT 'UTC'::text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $function$
DECLARE
  v_role TEXT := COALESCE(current_setting('role', true), 'anon');
  v_auth_uid UUID := auth.uid();
  v_res RECORD;
BEGIN
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
    ELSIF v_res.reservation_type = 'team_credit' AND v_res.team_allocation_id IS NOT NULL THEN
      UPDATE public.team_credit_allocations
      SET used_credits = GREATEST(0, used_credits - COALESCE(v_res.credits_reserved, 0)),
          updated_at = now()
      WHERE id = v_res.team_allocation_id;
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
      user_id, guest_id, team_owner_id, feature_slug, operation, credits_amount,
      outcome, reservation_id, error_reason, ledger_type, metadata
    ) VALUES (
      v_res.user_id, v_res.guest_id, v_res.team_owner_id, v_res.feature_slug, 'reservation_released',
      COALESCE(v_res.credits_reserved, 0), 'failed', p_reservation_id, p_error_reason, 'refund', p_metadata
    );
  END IF;

  RETURN true;
END;
$function$;

-- =====================================================================
-- 8. link_guest_to_registered_user v2
--    - Authorization: callers may only link to their own account
--      (service_role exempt). Prevents identity forgery.
--    - Idempotent and repeat-safe: only the not-yet-merged delta of the
--      guest's consumed checks is added to the account (total intro
--      allowance stays capped at 5, grants happen exactly once).
--    - A guest session can only ever be claimed by one account.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.link_guest_to_registered_user(
  p_guest_id text,
  p_user_id uuid,
  p_timezone text DEFAULT 'UTC'::text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $function$
DECLARE
  v_role TEXT := COALESCE(current_setting('role', true), 'anon');
  v_auth_uid UUID := auth.uid();
  v_guest RECORD;
  v_profile RECORD;
  v_delta INT;
  v_new_used INT;
BEGIN
  IF p_guest_id IS NULL OR p_user_id IS NULL THEN
    RETURN false;
  END IF;

  IF v_role <> 'service_role' AND (v_auth_uid IS NULL OR v_auth_uid <> p_user_id) THEN
    RAISE EXCEPTION 'Not authorized to link guest usage to this account';
  END IF;

  SELECT * INTO v_guest FROM public.server_guest_sessions WHERE guest_id = p_guest_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- A guest session may only be claimed by one account
  IF v_guest.linked_user_id IS NOT NULL AND v_guest.linked_user_id <> p_user_id THEN
    RETURN false;
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Idempotent repeat link: only merge the unmerged delta of guest usage
  v_delta := GREATEST(0, COALESCE(v_guest.trial_checks_used, 0) - COALESCE(v_guest.merged_trial_used, 0));
  IF v_guest.linked_user_id = p_user_id AND v_delta = 0 THEN
    RETURN true;
  END IF;

  v_new_used := LEAST(5, COALESCE(v_profile.trial_checks_used, 0) + v_delta);

  UPDATE public.profiles
  SET trial_checks_used = v_new_used,
      trial_checks_remaining = GREATEST(0, 5 - v_new_used),
      updated_at = now()
  WHERE id = p_user_id;

  UPDATE public.server_guest_sessions
  SET linked_user_id = p_user_id,
      merged_trial_used = COALESCE(v_guest.trial_checks_used, 0),
      updated_at = now()
  WHERE guest_id = p_guest_id;

  -- Re-attributing historical guest billing rows to the account
  UPDATE public.credit_reservations
  SET user_id = p_user_id
  WHERE guest_id = p_guest_id AND user_id IS NULL;

  UPDATE public.usage_ledger
  SET user_id = p_user_id
  WHERE guest_id = p_guest_id AND user_id IS NULL;

  RETURN true;
END;
$function$;

-- =====================================================================
-- 9. issue_or_validate_guest_session v2
--    - Per-IP throttle on NEW guest sessions (abuse control without
--      disqualifying shared networks: existing sessions unaffected).
-- =====================================================================
CREATE OR REPLACE FUNCTION public.issue_or_validate_guest_session(
  p_guest_id text,
  p_ip text,
  p_user_agent text,
  p_timezone text DEFAULT 'UTC'::text
)
RETURNS TABLE(guest_id text, trial_checks_remaining integer, trial_checks_used integer, total_used integer, is_blocked boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $function$
DECLARE
  v_session RECORD;
  v_effective_id TEXT;
  v_ip TEXT;
  v_ip_new_sessions INT;
BEGIN
  v_ip := NULLIF(trim(COALESCE(p_ip, '')), '');
  v_effective_id := COALESCE(NULLIF(trim(p_guest_id), ''), 'gst_' || replace(gen_random_uuid()::text, '-', ''));

  IF v_effective_id = p_guest_id AND p_guest_id IS NOT NULL AND trim(p_guest_id) <> '' THEN
    -- Existing visitor id: validate (upsert keeps counters intact)
    INSERT INTO public.server_guest_sessions (
      guest_id, trial_checks_remaining, trial_checks_total, trial_checks_used, total_used,
      ip_address, user_agent, created_at, updated_at, last_active_at
    ) VALUES (
      v_effective_id, 1, 1, 0, 0, v_ip, p_user_agent, NOW(), NOW(), NOW()
    )
    ON CONFLICT (guest_id) DO UPDATE
    SET last_active_at = NOW(),
        ip_address = COALESCE(EXCLUDED.ip_address, server_guest_sessions.ip_address),
        user_agent = COALESCE(EXCLUDED.user_agent, server_guest_sessions.user_agent),
        updated_at = NOW()
    RETURNING * INTO v_session;
  ELSE
    -- Server-issued new session: throttle per IP
    IF v_ip IS NOT NULL THEN
      SELECT COUNT(*) INTO v_ip_new_sessions
      FROM public.server_guest_sessions
      WHERE ip_address = v_ip AND created_at > NOW() - interval '24 hours';
      IF v_ip_new_sessions >= 10 THEN
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
$function$;

-- =====================================================================
-- 10. get_user_entitlement_summary v2 — identity enforcement
--     (authenticated can read own; anon only guest view; service full)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_user_entitlement_summary(
  p_user_id uuid DEFAULT NULL::uuid,
  p_guest_id text DEFAULT NULL::text,
  p_timezone text DEFAULT 'UTC'::text
)
RETURNS TABLE(
  plan text, status text, is_paid_active boolean, credits_balance integer,
  credits_used_total integer, trial_checks_remaining integer, trial_checks_used integer,
  trial_checks_total integer, monthly_credit_allocation integer,
  credits_refill_date timestamp with time zone, plan_end_date timestamp with time zone,
  warning_level text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $function$
DECLARE
  v_role TEXT := COALESCE(current_setting('role', true), 'anon');
  v_auth_uid UUID := auth.uid();
  v_plan TEXT := 'guest';
  v_status TEXT := 'Active';
  v_is_paid BOOLEAN := FALSE;
  v_credits_balance INT := 0;
  v_credits_used INT := 0;
  v_trial_remaining INT := 1;
  v_trial_used INT := 0;
  v_trial_total INT := 1;
  v_monthly_alloc INT := 0;
  v_refill_date TIMESTAMPTZ := NULL;
  v_plan_end_date TIMESTAMPTZ := NULL;
  v_warning_level TEXT := 'normal';
  v_profile RECORD;
  v_guest RECORD;
BEGIN
  -- Identity enforcement
  IF v_role <> 'service_role' THEN
    IF v_auth_uid IS NOT NULL THEN
      IF p_user_id IS NOT NULL AND p_user_id <> v_auth_uid THEN
        RAISE EXCEPTION 'Not authorized to view this entitlement summary';
      END IF;
      p_user_id := v_auth_uid;
    ELSE
      p_user_id := NULL;
    END IF;
  END IF;

  IF p_user_id IS NOT NULL THEN
    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
    IF FOUND THEN
      v_plan := COALESCE(v_profile.subscription_plan, 'free');
      v_status := COALESCE(v_profile.subscription_status, 'Active');
      v_plan_end_date := v_profile.plan_end_date;
      v_is_paid := (lower(v_plan) IN ('pro', 'pro_plus', 'pro+', 'business', 'enterprise')
        AND (lower(v_status) IN ('active', 'trialing') OR (v_plan_end_date IS NOT NULL AND v_plan_end_date > NOW())));
      v_credits_balance := COALESCE(v_profile.credits_balance, 0);
      v_monthly_alloc := COALESCE(v_profile.monthly_credit_allocation, 0);
      v_refill_date := v_profile.credits_refill_date;
      v_trial_remaining := COALESCE(v_profile.trial_checks_remaining, 5);
      v_trial_used := COALESCE(v_profile.trial_checks_used, 0);
      v_trial_total := COALESCE(v_profile.trial_checks_total, 5);

      SELECT COALESCE(SUM(credits_amount), 0) INTO v_credits_used
      FROM public.usage_ledger
      WHERE user_id = p_user_id AND outcome = 'success';

      IF v_is_paid THEN
        IF v_credits_balance <= 0 THEN
          v_warning_level := 'exhausted';
        ELSIF v_monthly_alloc > 0 AND (v_credits_balance::NUMERIC / v_monthly_alloc::NUMERIC) <= 0.05 THEN
          v_warning_level := 'warning_95';
        ELSIF v_monthly_alloc > 0 AND (v_credits_balance::NUMERIC / v_monthly_alloc::NUMERIC) <= 0.20 THEN
          v_warning_level := 'warning_80';
        ELSE
          v_warning_level := 'normal';
        END IF;
      ELSE
        IF v_trial_remaining <= 0 AND v_credits_balance <= 0 THEN
          v_warning_level := 'exhausted';
        ELSIF v_trial_remaining = 1 AND v_credits_balance <= 0 THEN
          v_warning_level := 'warning_80';
        ELSE
          v_warning_level := 'normal';
        END IF;
      END IF;
    END IF;
  ELSIF p_guest_id IS NOT NULL AND length(trim(p_guest_id)) > 0 THEN
    v_plan := 'guest';
    v_trial_total := 1;
    SELECT * INTO v_guest FROM public.server_guest_sessions WHERE guest_id = p_guest_id;
    IF FOUND THEN
      v_trial_remaining := COALESCE(v_guest.trial_checks_remaining, 0);
      v_trial_used := COALESCE(v_guest.trial_checks_used, 0);
    ELSE
      v_trial_remaining := 1;
      v_trial_used := 0;
    END IF;
    v_warning_level := CASE WHEN v_trial_remaining <= 0 THEN 'exhausted' ELSE 'normal' END;
  ELSE
    v_trial_remaining := 1;
    v_trial_total := 1;
  END IF;

  RETURN QUERY
  SELECT v_plan, v_status, v_is_paid, v_credits_balance, v_credits_used,
    v_trial_remaining, v_trial_used, v_trial_total, v_monthly_alloc,
    v_refill_date, v_plan_end_date, v_warning_level;
END;
$function$;

-- =====================================================================
-- 11. check_entitlement v2 — legacy signature preserved, v3 semantics:
--     one-time shared intro allowance (no daily reset), read-only.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.check_entitlement(
  p_user_id uuid,
  p_feature_slug text,
  p_timezone text DEFAULT 'UTC'::text
)
RETURNS TABLE(allowed boolean, reason text, remaining bigint, limit_value bigint, plan text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $function$
DECLARE
  v_role TEXT := COALESCE(current_setting('role', true), 'anon');
  v_auth_uid UUID := auth.uid();
  v_rate RECORD;
  v_profile RECORD;
  v_cost INT;
  v_trial_eligible BOOLEAN;
BEGIN
  IF v_role <> 'service_role' THEN
    IF v_auth_uid IS NOT NULL THEN
      IF p_user_id IS NOT NULL AND p_user_id <> v_auth_uid THEN
        RAISE EXCEPTION 'Not authorized';
      END IF;
      p_user_id := v_auth_uid;
    ELSE
      p_user_id := NULL;
    END IF;
  END IF;

  SELECT * INTO v_rate FROM credit_rate_table WHERE feature_slug = p_feature_slug;
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'This feature has no billing configuration.'::text, 0::bigint, 0::bigint, 'unknown'::text;
    RETURN;
  END IF;
  v_cost := COALESCE(v_rate.base_credit_cost, 1);
  v_trial_eligible := COALESCE(v_rate.trial_eligible, false);

  IF p_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Guest session required.'::text, 0::bigint, 1::bigint, 'guest'::text;
    RETURN;
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Profile not found.'::text, 0::bigint, 0::bigint, 'unknown'::text;
    RETURN;
  END IF;

  IF v_trial_eligible AND COALESCE(v_profile.trial_checks_remaining, 0) > 0 THEN
    RETURN QUERY SELECT TRUE, NULL::text,
      COALESCE(v_profile.trial_checks_remaining, 0)::bigint,
      COALESCE(v_profile.trial_checks_total, 5)::bigint,
      COALESCE(v_profile.subscription_plan, 'free')::text;
    RETURN;
  END IF;

  IF COALESCE(v_profile.credits_balance, 0) >= v_cost THEN
    RETURN QUERY SELECT TRUE, NULL::text,
      COALESCE(v_profile.credits_balance, 0)::bigint,
      COALESCE(v_profile.monthly_credit_allocation, 0)::bigint,
      COALESCE(v_profile.subscription_plan, 'free')::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT FALSE,
    CASE WHEN COALESCE(v_profile.subscription_plan, 'free') = 'free'
      THEN 'You''ve used your free checks. Choose a plan to continue.'
      ELSE 'Insufficient credits for this operation. Please top up or renew your plan to continue.' END::text,
    0::bigint, 0::bigint,
    COALESCE(v_profile.subscription_plan, 'free')::text;
END;
$function$;

-- =====================================================================
-- 12. increment_feature_usage v2 — DEPRECATED consumption path.
--     Daily-reset semantics removed; consumption is only valid through
--     reserve_entitlement_and_credits. Both overloads become read-only
--     status reporters so legacy callers cannot grant or reset anything.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.increment_feature_usage(
  p_user_id uuid,
  p_feature_slug text,
  p_timezone text DEFAULT 'UTC'::text
)
RETURNS TABLE(remaining bigint, limit_value bigint, used bigint, reset_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $function$
DECLARE
  v_role TEXT := COALESCE(current_setting('role', true), 'anon');
  v_auth_uid UUID := auth.uid();
  v_profile RECORD;
BEGIN
  IF v_role <> 'service_role' THEN
    IF v_auth_uid IS NOT NULL THEN
      IF p_user_id IS NOT NULL AND p_user_id <> v_auth_uid THEN
        RAISE EXCEPTION 'Not authorized';
      END IF;
      p_user_id := v_auth_uid;
    ELSE
      p_user_id := NULL;
    END IF;
  END IF;

  IF p_user_id IS NULL THEN
    RETURN QUERY SELECT 0::bigint, 1::bigint, 1::bigint, NULL::timestamptz;
    RETURN;
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::bigint, 0::bigint, 0::bigint, NULL::timestamptz;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    GREATEST(COALESCE(v_profile.trial_checks_remaining, 0), COALESCE(v_profile.credits_balance, 0))::bigint,
    COALESCE(v_profile.trial_checks_total, 5)::bigint,
    COALESCE(v_profile.trial_checks_used, 0)::bigint,
    NULL::timestamptz;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_feature_usage(
  p_user_id uuid,
  p_feature_slug text,
  p_timezone text DEFAULT 'UTC'::text,
  p_count integer DEFAULT 1
)
RETURNS TABLE(remaining bigint, limit_value bigint, used bigint, reset_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $function$
DECLARE
  v_role TEXT := COALESCE(current_setting('role', true), 'anon');
  v_auth_uid UUID := auth.uid();
  v_profile RECORD;
BEGIN
  IF v_role <> 'service_role' THEN
    IF v_auth_uid IS NOT NULL THEN
      IF p_user_id IS NOT NULL AND p_user_id <> v_auth_uid THEN
        RAISE EXCEPTION 'Not authorized';
      END IF;
      p_user_id := v_auth_uid;
    ELSE
      p_user_id := NULL;
    END IF;
  END IF;

  IF p_user_id IS NULL THEN
    RETURN QUERY SELECT 0::bigint, 1::bigint, 1::bigint, NULL::timestamptz;
    RETURN;
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::bigint, 0::bigint, 0::bigint, NULL::timestamptz;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    GREATEST(COALESCE(v_profile.trial_checks_remaining, 0), COALESCE(v_profile.credits_balance, 0))::bigint,
    COALESCE(v_profile.trial_checks_total, 5)::bigint,
    COALESCE(v_profile.trial_checks_used, 0)::bigint,
    NULL::timestamptz;
END;
$function$;

-- =====================================================================
-- 13. increment_guest_usage — fix date type cast (was 42804 runtime error)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.increment_guest_usage(
  p_guest_hash text,
  p_usage_date text,
  p_feature_slug text DEFAULT 'ai_detector'::text,
  p_count integer DEFAULT 1
)
RETURNS TABLE(used_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $function$
DECLARE
  v_used integer;
BEGIN
  INSERT INTO public.guest_usage (guest_hash, usage_date, feature_slug, used_count)
  VALUES (p_guest_hash, p_usage_date::date, p_feature_slug, GREATEST(p_count, 1))
  ON CONFLICT (guest_hash, usage_date, feature_slug)
  DO UPDATE SET used_count = public.guest_usage.used_count + GREATEST(p_count, 1)
  RETURNING public.guest_usage.used_count INTO v_used;

  RETURN QUERY SELECT v_used;
END;
$function$;

-- =====================================================================
-- 14. RLS lockdown: billing tables are service-only.
--     (service_role bypasses RLS; clients use SECURITY DEFINER RPCs)
-- =====================================================================
DROP POLICY "Allow server/admins to manage guest sessions" ON server_guest_sessions;
DROP POLICY "Service and functions can manage reservations" ON credit_reservations;
DROP POLICY "Service and functions can manage ledger" ON usage_ledger;
DROP POLICY "Service role can manage guest usage" ON guest_usage;
DROP POLICY "Users can manage their own humanization jobs" ON humanization_jobs;
DROP POLICY "Service role full access alternatives" ON humanization_alternatives;
DROP POLICY "Users can view their own alternatives" ON humanization_alternatives;

CREATE POLICY "Users can view own humanization jobs"
  ON humanization_jobs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own humanization alternatives"
  ON humanization_alternatives FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM humanization_jobs
    WHERE humanization_jobs.job_id = humanization_alternatives.job_id
      AND humanization_jobs.user_id = auth.uid()
  ));

-- =====================================================================
-- 15. profiles: block self-service writes to billing-sensitive columns
--     (subscription_plan, credits, trial counters, role, plan dates).
--     Allowed for service_role and admins; unchanged values pass.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.protect_billing_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $function$
DECLARE
  v_role TEXT := COALESCE(current_setting('role', true), 'anon');
  v_auth_uid UUID := auth.uid();
  v_is_admin BOOLEAN := FALSE;
BEGIN
  IF v_role = 'service_role' THEN
    RETURN NEW;
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
     OR NEW.monthly_credit_allocation IS DISTINCT FROM OLD.monthly_credit_allocation
     OR NEW.credits_refill_date IS DISTINCT FROM OLD.credits_refill_date
     OR NEW.trial_checks_remaining IS DISTINCT FROM OLD.trial_checks_remaining
     OR NEW.trial_checks_used IS DISTINCT FROM OLD.trial_checks_used
     OR NEW.trial_checks_total IS DISTINCT FROM OLD.trial_checks_total
     OR NEW.plan_start_date IS DISTINCT FROM OLD.plan_start_date
     OR NEW.plan_end_date IS DISTINCT FROM OLD.plan_end_date
     OR NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Billing fields can only be modified by the billing system';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER profiles_billing_guard
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_billing_columns();

-- =====================================================================
-- 16. Expired reservation sweeper: commit dangling reservations.
--     Deduction already happened atomically at reserve time; a
--     reservation that expires without an explicit success/failure
--     verdict is settled as charged (blocks skip-finalize abuse).
-- =====================================================================
CREATE OR REPLACE FUNCTION public.settle_expired_reservations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $function$
DECLARE
  v_res RECORD;
  v_count INT := 0;
BEGIN
  FOR v_res IN
    SELECT * FROM public.credit_reservations
    WHERE status IN ('reserved', 'pending') AND expires_at < now()
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.credit_reservations
    SET status = 'committed', finalized_at = now()
    WHERE id = v_res.id AND status IN ('reserved', 'pending');

    IF v_res.reservation_type = 'trial_check' THEN
      INSERT INTO public.usage_ledger (
        user_id, guest_id, feature_slug, operation, credits_amount, trial_checks_amount,
        outcome, reservation_id, ledger_type, metadata
      ) VALUES (
        v_res.user_id, v_res.guest_id, v_res.feature_slug, 'trial_check_settled', 0, 1,
        'success', v_res.id, 'trial',
        COALESCE(v_res.metadata, '{}'::jsonb) || '{"settled_by":"expiry_sweeper"}'::jsonb
      );
    ELSE
      INSERT INTO public.usage_ledger (
        user_id, guest_id, feature_slug, operation, credits_amount,
        outcome, reservation_id, ledger_type, metadata
      ) VALUES (
        v_res.user_id, v_res.guest_id, v_res.feature_slug, 'credit_deducted', COALESCE(v_res.credits_reserved, 0),
        'success', v_res.id, 'usage',
        COALESCE(v_res.metadata, '{}'::jsonb) || '{"settled_by":"expiry_sweeper"}'::jsonb
      );
    END IF;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$function$;

SELECT cron.schedule(
  'settle-expired-reservations',
  '*/5 * * * *',
  'SELECT public.settle_expired_reservations();'
);
