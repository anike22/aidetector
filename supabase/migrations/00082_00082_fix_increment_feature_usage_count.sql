CREATE OR REPLACE FUNCTION public.increment_feature_usage(
  p_user_id uuid,
  p_feature_slug text,
  p_timezone text DEFAULT 'UTC',
  p_count integer DEFAULT 1
)
RETURNS TABLE (
  remaining bigint,
  limit_value bigint,
  used bigint,
  reset_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_limit integer;
  v_date date;
  v_used integer;
  v_remaining integer;
  v_plan text;
BEGIN
  v_plan := public.get_effective_plan(p_user_id);

  SELECT feature_limits.daily_limit INTO v_limit
  FROM public.feature_limits
  WHERE feature_limits.feature_slug = p_feature_slug
    AND feature_limits.plan = v_plan;

  IF NOT FOUND OR v_limit IS NULL THEN
    RETURN QUERY SELECT NULL::bigint, NULL::bigint, 0::bigint, NULL::timestamptz;
    RETURN;
  END IF;

  v_date := (current_timestamp AT TIME ZONE p_timezone)::date;

  INSERT INTO public.user_feature_usage (user_id, feature_slug, usage_date, used_count)
  VALUES (p_user_id, p_feature_slug, v_date, GREATEST(p_count, 1))
  ON CONFLICT (user_id, feature_slug, usage_date)
  DO UPDATE SET used_count = public.user_feature_usage.used_count + EXCLUDED.used_count
  RETURNING public.user_feature_usage.used_count INTO v_used;

  v_remaining := GREATEST(v_limit - v_used, 0);

  RETURN QUERY SELECT
    v_remaining::bigint,
    v_limit::bigint,
    v_used::bigint,
    (v_date + interval '1 day')::timestamptz;
END;
$$;