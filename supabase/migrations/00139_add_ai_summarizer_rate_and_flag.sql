-- AI Summarizer: credit rate entry (2 credits flat per summarization; trial-eligible; min_plan=free)
-- Rationale: comparable to plagiarism_check (2 credits/1k words); summarizer processes
-- up to ~2,000 input words per trial check, making 2 credits a fair flat trial rate.
-- Paid summaries up to 10,000 words also cost 2 credits to keep the UI predictable.
-- The RPC ignores the caller's p_credits_cost and uses base_credit_cost from this table.
INSERT INTO public.credit_rate_table
  (feature_slug, feature_name, trial_eligible, base_credit_cost, billing_unit, min_plan, details)
VALUES
  ('ai_summarizer', 'AI Summarizer', true, 2, 'operation', 'free',
   '{"description":"2 credits per summarization (flat rate, trial-eligible, up to 10k words)"}'::jsonb),
  ('text_summarizer', 'AI Summarizer (alias)', true, 2, 'operation', 'free',
   '{"description":"Alias for ai_summarizer"}'::jsonb)
ON CONFLICT (feature_slug) DO UPDATE
  SET feature_name   = EXCLUDED.feature_name,
      trial_eligible = EXCLUDED.trial_eligible,
      base_credit_cost = EXCLUDED.base_credit_cost,
      billing_unit   = EXCLUDED.billing_unit,
      min_plan       = EXCLUDED.min_plan,
      details        = EXCLUDED.details,
      updated_at     = now();

-- Feature flag row for /ai-summarizer
INSERT INTO public.feature_flags
  (feature_name, feature_slug, status, is_enabled,
   show_in_navigation, show_on_homepage, show_in_footer,
   allow_direct_access, is_indexable, required_plan)
VALUES
  ('AI Summarizer', 'ai-summarizer', 'active', true,
   true, true, true,
   true, true, 'free')
ON CONFLICT (feature_slug) DO UPDATE
  SET status             = EXCLUDED.status,
      is_enabled         = EXCLUDED.is_enabled,
      show_in_navigation = EXCLUDED.show_in_navigation,
      show_on_homepage   = EXCLUDED.show_on_homepage,
      show_in_footer     = EXCLUDED.show_in_footer,
      allow_direct_access = EXCLUDED.allow_direct_access,
      is_indexable       = EXCLUDED.is_indexable,
      required_plan      = EXCLUDED.required_plan,
      updated_at         = now();