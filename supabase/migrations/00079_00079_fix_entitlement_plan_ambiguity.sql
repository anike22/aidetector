CREATE OR REPLACE FUNCTION public.get_feature_remaining(
  p_user_id uuid,
  p_feature_slug text,
  p_timezone text DEFAULT 'UTC'
)
RETURNS TABLE (
  remaining bigint,
  limit_value bigint,
  plan text,
  reset_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_plan text;
  v_active boolean := false;
  v_limit integer;
  v_date date;
  v_used bigint;
BEGIN
  v_user_plan := public.get_effective_plan(p_user_id);

  IF v_user_plan IN ('pro', 'business', 'enterprise') THEN
    SELECT (
      subscription_status IN ('Active', 'trialing', 'Cancelled', 'canceled')
      AND (plan_end_date IS NULL OR plan_end_date > now())
    ) INTO v_active
    FROM public.profiles
    WHERE id = p_user_id;
    IF NOT v_active THEN
      v_user_plan := 'free';
    END IF;
  END IF;

  SELECT feature_limits.daily_limit INTO v_limit
  FROM public.feature_limits
  WHERE feature_limits.feature_slug = p_feature_slug
    AND feature_limits.plan = v_user_plan;

  IF NOT FOUND THEN
    RETURN QUERY SELECT (-1)::bigint, (-1)::bigint, v_user_plan, NULL::timestamptz;
    RETURN;
  END IF;

  IF v_limit IS NULL THEN
    RETURN QUERY SELECT NULL::bigint, NULL::bigint, v_user_plan, NULL::timestamptz;
    RETURN;
  END IF;

  v_date := (current_timestamp AT TIME ZONE p_timezone)::date;

  SELECT COALESCE(used_count, 0) INTO v_used
  FROM public.user_feature_usage
  WHERE user_id = p_user_id
    AND feature_slug = p_feature_slug
    AND usage_date = v_date;

  RETURN QUERY SELECT
    GREATEST(v_limit - v_used, 0)::bigint,
    v_limit::bigint,
    v_user_plan,
    (v_date + interval '1 day')::timestamptz;
END;
$$;