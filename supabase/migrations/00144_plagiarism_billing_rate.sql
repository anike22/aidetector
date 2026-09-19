-- Ensure the canonical plagiarism billing rate required by the current
-- plagiarism-checker Edge Function exists. Idempotent and scoped only to
-- plagiarism billing metadata; no balances, subscriptions, usage, or results
-- are modified.
BEGIN;

INSERT INTO public.credit_rate_table (
  feature_slug,
  feature_name,
  trial_eligible,
  base_credit_cost,
  billing_unit,
  min_plan,
  details
)
VALUES (
  'plagiarism_check',
  'Plagiarism Checker',
  true,
  2,
  'words_1000',
  'free',
  '{"description":"2 credits per started 1,000 words"}'::jsonb
)
ON CONFLICT (feature_slug) DO UPDATE
SET
  feature_name = EXCLUDED.feature_name,
  trial_eligible = EXCLUDED.trial_eligible,
  base_credit_cost = EXCLUDED.base_credit_cost,
  billing_unit = EXCLUDED.billing_unit,
  min_plan = EXCLUDED.min_plan,
  details = EXCLUDED.details,
  updated_at = now();

-- Preserve the legacy slug as an exact compatibility alias while all callers
-- migrate to the canonical plagiarism_check slug.
INSERT INTO public.credit_rate_table (
  feature_slug,
  feature_name,
  trial_eligible,
  base_credit_cost,
  billing_unit,
  min_plan,
  details
)
SELECT
  'plagiarism_checker',
  feature_name,
  trial_eligible,
  base_credit_cost,
  billing_unit,
  min_plan,
  details
FROM public.credit_rate_table
WHERE feature_slug = 'plagiarism_check'
ON CONFLICT (feature_slug) DO UPDATE
SET
  feature_name = EXCLUDED.feature_name,
  trial_eligible = EXCLUDED.trial_eligible,
  base_credit_cost = EXCLUDED.base_credit_cost,
  billing_unit = EXCLUDED.billing_unit,
  min_plan = EXCLUDED.min_plan,
  details = EXCLUDED.details,
  updated_at = now();

COMMIT;
