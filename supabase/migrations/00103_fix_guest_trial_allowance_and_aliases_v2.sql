-- 1. Ensure all canonical and alias slugs exist in credit_rate_table
INSERT INTO public.credit_rate_table (feature_slug, feature_name, trial_eligible, base_credit_cost, billing_unit, min_plan, details)
VALUES
  ('text_detect_balanced', 'AI Text Detection (Balanced)', true, 1, 'words_1000', 'guest', '{"description":"1 credit per 1,000 words per engine"}'::jsonb),
  ('ai_detector', 'AI Text Detector', true, 1, 'words_1000', 'guest', '{"description":"AI Text Detector primary alias"}'::jsonb),
  ('text_detect_aggressive', 'AI Text Detection (Aggressive)', false, 1, 'words_1000', 'pro', '{"description":"1 credit per 1,000 words per engine, paid only"}'::jsonb),
  ('image_detect_standard', 'AI Image Detection (Standard)', true, 2, 'image', 'guest', '{"description":"2 credits per image, trial eligible"}'::jsonb),
  ('ai_image_detector', 'AI Image Detector', true, 2, 'image', 'guest', '{"description":"AI Image Detector primary alias"}'::jsonb),
  ('image_detect_advanced', 'AI Image / Deepfake Analysis (Advanced)', false, 4, 'image', 'pro', '{"description":"4 credits per image, paid only"}'::jsonb),
  ('video_detect_balanced', 'AI Video Detection (Balanced)', true, 2, 'video_30s', 'guest', '{"description":"2 credits per started 30s, trial eligible"}'::jsonb),
  ('ai_video_detector', 'AI Video Detector', true, 2, 'video_30s', 'guest', '{"description":"AI Video Detector primary alias"}'::jsonb),
  ('video_detect_high_sensitivity', 'AI Video Detection (High-Sensitivity)', false, 3, 'video_30s', 'pro', '{"description":"3 credits per started 30s, paid only"}'::jsonb),
  ('video_detect_forensic', 'AI Video Detection (Forensic)', false, 6, 'video_30s', 'pro_plus', '{"description":"6 credits per started 30s, paid only"}'::jsonb),
  ('voice_analysis', 'AI Voice / Audio Analysis', true, 2, 'audio_min', 'guest', '{"description":"2 credits per audio minute, trial eligible"}'::jsonb),
  ('humanizer_rewrite', 'Humanizer Rewrite', true, 3, 'words_1000', 'free', '{"description":"3 credits per 1,000 words, trial eligible standard"}'::jsonb),
  ('ai_humanizer', 'AI Humanizer', true, 3, 'words_1000', 'free', '{"description":"AI Humanizer primary alias"}'::jsonb),
  ('plagiarism_check', 'Plagiarism Checker', true, 2, 'words_1000', 'free', '{"description":"2 credits per 1,000 words, trial eligible standard"}'::jsonb),
  ('plagiarism_checker', 'Plagiarism Checker Alias', true, 2, 'words_1000', 'free', '{"description":"Plagiarism Checker primary alias"}'::jsonb),
  ('seo_assistant', 'SEO Assistant Report', true, 3, 'words_1000', 'free', '{"description":"3 credits per 1,000 words, trial eligible standard"}'::jsonb),
  ('citation_verify', 'Citation Verification', false, 1, 'references_5', 'pro', '{"description":"1 credit per 5 references, paid only"}'::jsonb),
  ('hallucination_check', 'Hallucination Detector', false, 2, 'words_1000', 'pro', '{"description":"2 credits per 1,000 words, paid only"}'::jsonb),
  ('verified_authorship_register', 'Verified Authorship Registration', false, 5, 'operation', 'pro', '{"description":"5 credits per verified authorship registration, paid only"}'::jsonb),
  ('bulk_processing', 'Bulk Batch Processing', false, 1, 'operation', 'pro_plus', '{"description":"Bulk processing jobs, paid only"}'::jsonb),
  ('api_access', 'API Endpoint Request', false, 1, 'operation', 'pro', '{"description":"Direct API access, paid only"}'::jsonb),
  ('team_usage', 'Team Shared Pool Usage', false, 1, 'operation', 'business', '{"description":"Team workspace shared credit deduction"}'::jsonb)
ON CONFLICT (feature_slug) DO UPDATE SET
  feature_name = EXCLUDED.feature_name,
  trial_eligible = EXCLUDED.trial_eligible,
  base_credit_cost = EXCLUDED.base_credit_cost,
  billing_unit = EXCLUDED.billing_unit,
  min_plan = EXCLUDED.min_plan,
  details = EXCLUDED.details,
  updated_at = now();

-- Drop existing functions before recreating
DROP FUNCTION IF EXISTS public.get_user_entitlement_summary(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.reserve_entitlement_and_credits(UUID, TEXT, TEXT, INT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.link_guest_to_registered_user(TEXT, UUID, TEXT);

-- 2. Enhanced get_user_entitlement_summary with accurate guest status
CREATE OR REPLACE FUNCTION public.get_user_entitlement_summary(
  p_user_id UUID DEFAULT NULL,
  p_guest_id TEXT DEFAULT NULL,
  p_timezone TEXT DEFAULT 'UTC'
)
RETURNS TABLE (
  plan TEXT,
  status TEXT,
  is_paid_active BOOLEAN,
  credits_balance INT,
  credits_used_total INT,
  trial_checks_remaining INT,
  trial_checks_used INT,
  trial_checks_total INT,
  monthly_credit_allocation INT,
  credits_refill_date TIMESTAMPTZ,
  plan_end_date TIMESTAMPTZ,
  warning_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
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
  IF p_user_id IS NOT NULL THEN
    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
    IF FOUND THEN
      v_plan := COALESCE(v_profile.subscription_plan, 'free');
      v_status := COALESCE(v_profile.subscription_status, 'Active');
      v_plan_end_date := v_profile.plan_end_date;
      v_is_paid := (lower(v_plan) IN ('pro', 'pro_plus', 'pro+', 'business', 'enterprise') AND (lower(v_status) IN ('active', 'trialing') OR (v_plan_end_date IS NOT NULL AND v_plan_end_date > NOW())));
      v_credits_balance := COALESCE(v_profile.credits_balance, 0);
      v_monthly_alloc := COALESCE(v_profile.monthly_credit_allocation, 0);
      v_refill_date := v_profile.credits_refill_date;
      v_trial_remaining := COALESCE(v_profile.trial_checks_remaining, 5);
      v_trial_used := COALESCE(v_profile.trial_checks_used, 0);
      v_trial_total := 5;

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
        -- Free user
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
    v_status := 'Active';
    v_is_paid := FALSE;
    v_credits_balance := 0;
    v_credits_used := 0;
    v_trial_total := 1;

    SELECT * INTO v_guest FROM public.server_guest_sessions WHERE guest_id = p_guest_id;
    IF FOUND THEN
      v_trial_remaining := COALESCE(v_guest.trial_checks_remaining, 0);
      v_trial_used := COALESCE(v_guest.trial_checks_used, 0);
    ELSE
      -- Brand new guest session defaults to 1 trial check available
      v_trial_remaining := 1;
      v_trial_used := 0;
    END IF;

    IF v_trial_remaining <= 0 THEN
      v_warning_level := 'exhausted';
    ELSE
      v_warning_level := 'normal';
    END IF;
  ELSE
    v_plan := 'guest';
    v_status := 'Active';
    v_is_paid := FALSE;
    v_credits_balance := 0;
    v_credits_used := 0;
    v_trial_remaining := 1;
    v_trial_used := 0;
    v_trial_total := 1;
    v_warning_level := 'normal';
  END IF;

  RETURN QUERY
  SELECT
    v_plan,
    v_status,
    v_is_paid,
    v_credits_balance,
    v_credits_used,
    v_trial_remaining,
    v_trial_used,
    v_trial_total,
    v_monthly_alloc,
    v_refill_date,
    v_plan_end_date,
    v_warning_level;
END;
$$;

-- 3. Enhanced reserve_entitlement_and_credits with exact slug and plan mapping
CREATE OR REPLACE FUNCTION public.reserve_entitlement_and_credits(
  p_user_id UUID DEFAULT NULL,
  p_guest_id TEXT DEFAULT NULL,
  p_feature_slug TEXT DEFAULT 'text_detect_balanced',
  p_credits_cost INT DEFAULT 1,
  p_timezone TEXT DEFAULT 'UTC',
  p_idempotency_key TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  allowed BOOLEAN,
  reservation_id UUID,
  reason TEXT,
  error_code TEXT,
  plan TEXT,
  remaining_credits INT,
  trial_checks_remaining INT,
  trial_checks_total INT,
  reset_at TIMESTAMPTZ,
  is_trial_check BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan TEXT := 'guest';
  v_status TEXT := 'Active';
  v_is_paid BOOLEAN := FALSE;
  v_credits_balance INT := 0;
  v_trial_remaining INT := 0;
  v_trial_total INT := 1;
  v_reservation_id UUID;
  v_rate RECORD;
  v_profile RECORD;
  v_guest RECORD;
  v_existing_res RECORD;
  v_is_trial_eligible BOOLEAN := FALSE;
  v_min_plan TEXT := 'guest';
  v_calculated_cost INT := 1;
BEGIN
  -- 1. Look up authoritative rate & eligibility
  SELECT * INTO v_rate FROM public.credit_rate_table WHERE feature_slug = p_feature_slug;
  IF FOUND THEN
    v_is_trial_eligible := v_rate.trial_eligible;
    v_min_plan := v_rate.min_plan;
    v_calculated_cost := GREATEST(1, COALESCE(p_credits_cost, v_rate.base_credit_cost));
  ELSE
    -- Default fallback for unspecified slugs
    v_is_trial_eligible := (p_feature_slug IN ('text_detect_balanced', 'ai_detector', 'image_detect_standard', 'ai_image_detector', 'video_detect_balanced', 'ai_video_detector', 'humanizer_rewrite', 'ai_humanizer', 'plagiarism_check', 'plagiarism_checker', 'seo_assistant', 'voice_analysis'));
    IF p_feature_slug IN ('humanizer_rewrite', 'ai_humanizer', 'plagiarism_check', 'plagiarism_checker', 'seo_assistant') THEN
      v_min_plan := 'free';
    ELSIF p_feature_slug IN ('text_detect_aggressive', 'image_detect_advanced', 'video_detect_high_sensitivity', 'citation_verify', 'hallucination_check', 'api_access') THEN
      v_min_plan := 'pro';
    ELSE
      v_min_plan := 'guest';
    END IF;
    v_calculated_cost := GREATEST(1, COALESCE(p_credits_cost, 1));
  END IF;

  -- 2. Idempotency Check
  IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) > 0 THEN
    SELECT * INTO v_existing_res
    FROM public.credit_reservations
    WHERE idempotency_key = p_idempotency_key AND status = 'pending'
    LIMIT 1;

    IF FOUND THEN
      RETURN QUERY
      SELECT
        TRUE,
        v_existing_res.id,
        'Idempotent reservation restored'::TEXT,
        NULL::TEXT,
        'existing'::TEXT,
        0::INT,
        0::INT,
        0::INT,
        NULL::TIMESTAMPTZ,
        (v_existing_res.reservation_type = 'trial_check');
      RETURN;
    END IF;
  END IF;

  -- 3. Authenticated User Flow
  IF p_user_id IS NOT NULL THEN
    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN
      RETURN QUERY SELECT FALSE, NULL::UUID, 'User profile not found'::TEXT, 'PROFILE_NOT_FOUND'::TEXT, 'free'::TEXT, 0, 0, 5, NULL::TIMESTAMPTZ, FALSE;
      RETURN;
    END IF;

    v_plan := COALESCE(v_profile.subscription_plan, 'free');
    v_status := COALESCE(v_profile.subscription_status, 'Active');
    v_is_paid := (lower(v_plan) IN ('pro', 'pro_plus', 'pro+', 'business', 'enterprise') AND (lower(v_status) IN ('active', 'trialing') OR (v_profile.plan_end_date IS NOT NULL AND v_profile.plan_end_date > NOW())));
    v_credits_balance := COALESCE(v_profile.credits_balance, 0);
    v_trial_remaining := COALESCE(v_profile.trial_checks_remaining, 5);
    v_trial_total := 5;

    -- Paid user execution
    IF v_is_paid THEN
      IF v_credits_balance >= v_calculated_cost THEN
        -- Atomically reserve credits
        UPDATE public.profiles
        SET credits_balance = credits_balance - v_calculated_cost,
            updated_at = NOW()
        WHERE id = p_user_id;

        INSERT INTO public.credit_reservations (
          user_id, feature_slug, credits_reserved, reservation_type, trial_checks_reserved, status, idempotency_key, metadata, expires_at
        ) VALUES (
          p_user_id, p_feature_slug, v_calculated_cost, 'credit', 0, 'pending', p_idempotency_key, p_metadata, NOW() + INTERVAL '15 minutes'
        ) RETURNING id INTO v_reservation_id;

        RETURN QUERY
        SELECT
          TRUE,
          v_reservation_id,
          NULL::TEXT,
          NULL::TEXT,
          v_plan,
          v_credits_balance - v_calculated_cost,
          0,
          v_trial_total,
          NULL::TIMESTAMPTZ,
          FALSE;
        RETURN;
      ELSE
        -- Paid user out of credits
        RETURN QUERY
        SELECT
          FALSE,
          NULL::UUID,
          'Monthly credits exhausted. Please upgrade your plan or add credits.'::TEXT,
          'CREDITS_EXHAUSTED'::TEXT,
          v_plan,
          v_credits_balance,
          0,
          v_trial_total,
          NULL::TIMESTAMPTZ,
          FALSE;
        RETURN;
      END IF;
    END IF;

    -- Free user execution
    -- Check if feature requires paid plan (e.g. aggressive mode, forensic video, live deepfake, bulk, API)
    IF v_min_plan IN ('pro', 'pro_plus', 'business', 'enterprise') AND NOT v_is_paid THEN
      RETURN QUERY
      SELECT
        FALSE,
        NULL::UUID,
        'This advanced feature requires a Pro or Business plan. Please upgrade to access.'::TEXT,
        'UPGRADE_REQUIRED'::TEXT,
        v_plan,
        v_credits_balance,
        v_trial_remaining,
        v_trial_total,
        NULL::TIMESTAMPTZ,
        FALSE;
      RETURN;
    END IF;

    -- If trial-eligible and free user has trial checks remaining
    IF v_is_trial_eligible AND v_trial_remaining > 0 THEN
      -- Reserve 1 trial check (without touching paid credit balance)
      INSERT INTO public.credit_reservations (
        user_id, feature_slug, credits_reserved, reservation_type, trial_checks_reserved, status, idempotency_key, metadata, expires_at
      ) VALUES (
        p_user_id, p_feature_slug, 0, 'trial_check', 1, 'pending', p_idempotency_key, p_metadata, NOW() + INTERVAL '15 minutes'
      ) RETURNING id INTO v_reservation_id;

      RETURN QUERY
      SELECT
        TRUE,
        v_reservation_id,
        NULL::TEXT,
        NULL::TEXT,
        v_plan,
        v_credits_balance,
        v_trial_remaining,
        v_trial_total,
        NULL::TIMESTAMPTZ,
        TRUE;
      RETURN;
    END IF;

    -- If free user has purchased credits balance
    IF v_credits_balance >= v_calculated_cost THEN
      UPDATE public.profiles
      SET credits_balance = credits_balance - v_calculated_cost,
          updated_at = NOW()
      WHERE id = p_user_id;

      INSERT INTO public.credit_reservations (
        user_id, feature_slug, credits_reserved, reservation_type, trial_checks_reserved, status, idempotency_key, metadata, expires_at
      ) VALUES (
        p_user_id, p_feature_slug, v_calculated_cost, 'credit', 0, 'pending', p_idempotency_key, p_metadata, NOW() + INTERVAL '15 minutes'
      ) RETURNING id INTO v_reservation_id;

      RETURN QUERY
      SELECT
        TRUE,
        v_reservation_id,
        NULL::TEXT,
        NULL::TEXT,
        v_plan,
        v_credits_balance - v_calculated_cost,
        0,
        v_trial_total,
        NULL::TIMESTAMPTZ,
        FALSE;
      RETURN;
    END IF;

    -- Blocked: Out of trial checks and out of credits
    RETURN QUERY
    SELECT
      FALSE,
      NULL::UUID,
      'Trial checks used (5 total introductory checks). Please upgrade to Pro for monthly credits and unlimited full analyses.'::TEXT,
      'TRIAL_EXHAUSTED'::TEXT,
      v_plan,
      v_credits_balance,
      0,
      v_trial_total,
      NULL::TIMESTAMPTZ,
      FALSE;
    RETURN;

  -- 4. Guest User Flow
  ELSIF p_guest_id IS NOT NULL AND length(trim(p_guest_id)) > 0 THEN
    v_plan := 'guest';
    v_trial_total := 1;

    -- Paid-only feature attempted by guest
    IF v_min_plan IN ('pro', 'pro_plus', 'business', 'enterprise') OR NOT v_is_trial_eligible THEN
      RETURN QUERY
      SELECT
        FALSE,
        NULL::UUID,
        'This feature requires a paid subscription. Please sign in and upgrade.'::TEXT,
        'UPGRADE_REQUIRED'::TEXT,
        'guest'::TEXT,
        0,
        0,
        1,
        NULL::TIMESTAMPTZ,
        FALSE;
      RETURN;
    END IF;

    -- Registered-account-required feature attempted by guest (e.g. humanizer, plagiarism, SEO)
    IF v_min_plan = 'free' AND NOT (p_feature_slug IN ('text_detect_balanced', 'ai_detector', 'image_detect_standard', 'ai_image_detector', 'video_detect_balanced', 'ai_video_detector', 'voice_analysis')) THEN
      RETURN QUERY
      SELECT
        FALSE,
        NULL::UUID,
        'This feature requires a free registered account. Please sign up to get 4 additional free checks.'::TEXT,
        'REGISTER_REQUIRED'::TEXT,
        'guest'::TEXT,
        0,
        0,
        1,
        NULL::TIMESTAMPTZ,
        FALSE;
      RETURN;
    END IF;

    SELECT * INTO v_guest FROM public.server_guest_sessions WHERE guest_id = p_guest_id FOR UPDATE;
    IF NOT FOUND THEN
      -- Create guest session with 1 trial check
      INSERT INTO public.server_guest_sessions (
        guest_id, trial_checks_remaining, trial_checks_used, total_used, created_at, updated_at, last_active_at
      ) VALUES (
        p_guest_id, 1, 0, 0, NOW(), NOW(), NOW()
      ) RETURNING * INTO v_guest;
    END IF;

    v_trial_remaining := COALESCE(v_guest.trial_checks_remaining, 0);

    IF v_trial_remaining > 0 THEN
      -- Reserve 1 guest trial check
      INSERT INTO public.credit_reservations (
        guest_id, feature_slug, credits_reserved, reservation_type, trial_checks_reserved, status, idempotency_key, metadata, expires_at
      ) VALUES (
        p_guest_id, p_feature_slug, 0, 'trial_check', 1, 'pending', p_idempotency_key, p_metadata, NOW() + INTERVAL '15 minutes'
      ) RETURNING id INTO v_reservation_id;

      RETURN QUERY
      SELECT
        TRUE,
        v_reservation_id,
        NULL::TEXT,
        NULL::TEXT,
        'guest'::TEXT,
        0,
        v_trial_remaining,
        1,
        NULL::TIMESTAMPTZ,
        TRUE;
      RETURN;
    ELSE
      -- Guest trial check exhausted
      RETURN QUERY
      SELECT
        FALSE,
        NULL::UUID,
        'Guest trial check used (1 check). Create a free account to get 4 additional trial checks!'::TEXT,
        'TRIAL_EXHAUSTED'::TEXT,
        'guest'::TEXT,
        0,
        0,
        1,
        NULL::TIMESTAMPTZ,
        FALSE;
      RETURN;
    END IF;

  ELSE
    RETURN QUERY
    SELECT
      FALSE,
      NULL::UUID,
      'Invalid session identifier.'::TEXT,
      'INVALID_SESSION'::TEXT,
      'guest'::TEXT,
      0,
      0,
      1,
      NULL::TIMESTAMPTZ,
      FALSE;
    RETURN;
  END IF;
END;
$$;

-- 4. Enhanced link_guest_to_registered_user to grant 4 additional checks
CREATE OR REPLACE FUNCTION public.link_guest_to_registered_user(
  p_guest_id TEXT,
  p_user_id UUID,
  p_timezone TEXT DEFAULT 'UTC'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_guest RECORD;
  v_guest_used INT := 0;
BEGIN
  IF p_guest_id IS NULL OR p_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO v_guest FROM public.server_guest_sessions WHERE guest_id = p_guest_id FOR UPDATE;
  IF FOUND THEN
    v_guest_used := GREATEST(0, COALESCE(v_guest.trial_checks_used, 0));

    UPDATE public.server_guest_sessions
    SET linked_user_id = p_user_id,
        updated_at = now()
    WHERE guest_id = p_guest_id;

    -- Update unlinked reservations and ledger
    UPDATE public.credit_reservations
    SET user_id = p_user_id
    WHERE guest_id = p_guest_id AND user_id IS NULL;

    UPDATE public.usage_ledger
    SET user_id = p_user_id
    WHERE guest_id = p_guest_id AND user_id IS NULL;

    -- Transfer guest trial check consumption to registered user:
    -- User gets 5 checks lifetime total minus guest checks already used (e.g., 5 - 1 = 4 remaining)
    UPDATE public.profiles
    SET trial_checks_used = GREATEST(COALESCE(profiles.trial_checks_used, 0), v_guest_used),
        trial_checks_remaining = GREATEST(0, 5 - GREATEST(COALESCE(profiles.trial_checks_used, 0), v_guest_used)),
        updated_at = now()
    WHERE id = p_user_id;

    RETURN true;
  END IF;

  RETURN false;
END;
$$;