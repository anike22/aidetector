-- Keep SEO Assistant aligned with the current product billing policy:
-- one completed SEO Assistant analysis costs 30 credits.
INSERT INTO public.credit_rate_table
  (feature_slug, feature_name, trial_eligible, base_credit_cost, billing_unit, min_plan, details)
VALUES
  ('seo_assistant','SEO Assistant Report',false,30,'fixed','pro','{"description":"30 credits per SEO Assistant analysis"}'::jsonb)
ON CONFLICT (feature_slug) DO UPDATE SET
  feature_name = EXCLUDED.feature_name,
  trial_eligible = EXCLUDED.trial_eligible,
  base_credit_cost = EXCLUDED.base_credit_cost,
  billing_unit = EXCLUDED.billing_unit,
  min_plan = EXCLUDED.min_plan,
  details = EXCLUDED.details,
  updated_at = now();
