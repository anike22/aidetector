-- Restore the AI Summarizer billing seed expected by migration 00140.
-- 2 credits per started 1,000 input words; free-trial input capped at 2,000 words.
INSERT INTO public.credit_rate_table
(feature_slug,feature_name,trial_eligible,base_credit_cost,billing_unit,min_plan,details,created_at,updated_at)
VALUES
('ai_summarizer','AI Summarizer',true,2,'words_1000','free',
 jsonb_build_object('description','2 credits per started 1,000 input words','trial_max_words',2000),
 now(),now())
ON CONFLICT (feature_slug) DO UPDATE SET
 feature_name=EXCLUDED.feature_name,
 trial_eligible=EXCLUDED.trial_eligible,
 base_credit_cost=EXCLUDED.base_credit_cost,
 billing_unit=EXCLUDED.billing_unit,
 min_plan=EXCLUDED.min_plan,
 details=EXCLUDED.details,
 updated_at=now();
