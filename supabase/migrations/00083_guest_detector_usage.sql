-- Guest detector free trial tracking
-- Allows anonymous visitors to run a limited number of AI detector scans
-- before requiring sign-up. Usage is capped per IP address per day.

CREATE TABLE IF NOT EXISTS public.guest_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_hash text NOT NULL,
  usage_date date NOT NULL,
  used_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (guest_hash, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_guest_usage_hash_date
  ON public.guest_usage (guest_hash, usage_date);

ALTER TABLE public.guest_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage guest usage"
  ON public.guest_usage FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE TRIGGER guest_usage_updated_at
  BEFORE UPDATE ON public.guest_usage
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Atomic guest usage increment. Returns the new used_count for the day.
CREATE OR REPLACE FUNCTION public.increment_guest_usage(
  p_guest_hash text,
  p_usage_date date
)
RETURNS TABLE(used_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_used integer;
BEGIN
  INSERT INTO public.guest_usage (guest_hash, usage_date, used_count)
  VALUES (p_guest_hash, p_usage_date, 1)
  ON CONFLICT (guest_hash, usage_date)
  DO UPDATE SET used_count = public.guest_usage.used_count + 1
  RETURNING public.guest_usage.used_count INTO v_used;

  RETURN QUERY SELECT v_used;
END;
$$;
