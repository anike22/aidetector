BEGIN;

-- Add guest tracking to humanizer jobs
ALTER TABLE public.humanization_jobs
  ADD COLUMN IF NOT EXISTS guest_id text;

CREATE INDEX IF NOT EXISTS idx_humanization_jobs_guest_id
  ON public.humanization_jobs (guest_id);

ALTER TABLE public.humanization_jobs
  ALTER COLUMN user_id DROP NOT NULL;

-- Support multiple feature quotas per guest
ALTER TABLE public.guest_usage
  ADD COLUMN IF NOT EXISTS feature_slug text NOT NULL DEFAULT 'ai_detector';

ALTER TABLE public.guest_usage
  DROP CONSTRAINT IF EXISTS guest_usage_guest_hash_usage_date_key;

ALTER TABLE public.guest_usage
  ADD CONSTRAINT guest_usage_guest_hash_feature_date_key
    UNIQUE (guest_hash, usage_date, feature_slug);

CREATE INDEX IF NOT EXISTS idx_guest_usage_feature_slug
  ON public.guest_usage (feature_slug);

-- Atomic guest usage increment with feature slug and count
CREATE OR REPLACE FUNCTION public.increment_guest_usage(
  p_guest_hash text,
  p_usage_date text,
  p_feature_slug text DEFAULT 'ai_detector',
  p_count integer DEFAULT 1
)
RETURNS TABLE(used_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_used integer;
BEGIN
  INSERT INTO public.guest_usage (guest_hash, usage_date, feature_slug, used_count)
  VALUES (p_guest_hash, p_usage_date, p_feature_slug, p_count)
  ON CONFLICT (guest_hash, usage_date, feature_slug)
  DO UPDATE SET used_count = public.guest_usage.used_count + p_count
  RETURNING public.guest_usage.used_count INTO v_used;

  RETURN QUERY SELECT v_used;
END;
$$;

COMMIT;
