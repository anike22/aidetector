-- Authoritative AIDetector.cx feature credit schedule.
-- Reconciles the owned Supabase with the current application billing policy.
INSERT INTO public.credit_rate_table
  (feature_slug, feature_name, trial_eligible, base_credit_cost, billing_unit, min_plan, details)
VALUES
  ('ai_detector','AI Text Detector',true,1,'fixed','guest','{"description":"1 credit per AI Detector check"}'::jsonb),
  ('ai_humanizer','Humanizer',false,10,'fixed','free','{"description":"10 credits per Humanizer operation"}'::jsonb),
  ('plagiarism_check','Plagiarism Checker',false,10,'fixed','free','{"description":"10 credits per plagiarism check"}'::jsonb),
  ('image_detect_standard','AI Image Detector',false,5,'fixed','free','{"description":"5 credits per image detection"}'::jsonb),
  ('voice_analysis','AI Voice Detector',false,5,'fixed','free','{"description":"5 credits per voice analysis"}'::jsonb),
  ('deepfake_detector','Deepfake Detector',false,10,'fixed','free','{"description":"10 credits per deepfake detection"}'::jsonb),
  ('video_detect_balanced','AI Video Detector',false,15,'fixed','free','{"description":"15 credits per video detection"}'::jsonb),
  ('citation_verify','Citation / Hallucination Verifier',false,5,'fixed','free','{"description":"5 credits per citation or hallucination verification"}'::jsonb),
  ('ai_checker_for_bloggers','AI Checker for Bloggers',false,30,'fixed','pro','{"description":"30 credits per AI Checker for Bloggers analysis"}'::jsonb)
ON CONFLICT (feature_slug) DO UPDATE SET
  feature_name = EXCLUDED.feature_name,
  trial_eligible = EXCLUDED.trial_eligible,
  base_credit_cost = EXCLUDED.base_credit_cost,
  billing_unit = EXCLUDED.billing_unit,
  min_plan = EXCLUDED.min_plan,
  details = EXCLUDED.details,
  updated_at = now();
