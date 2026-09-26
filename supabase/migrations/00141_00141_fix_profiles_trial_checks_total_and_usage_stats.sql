-- Add trial_checks_total to profiles table if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_checks_total integer DEFAULT 5;
UPDATE public.profiles SET trial_checks_total = 5 WHERE trial_checks_total IS NULL;

-- Drop and recreate get_usage_stats cleanly
DROP FUNCTION IF EXISTS public.get_usage_stats(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.get_usage_stats(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_ai_scans integer := 0;
  v_words_analyzed integer := 0;
  v_words_humanized integer := 0;
  v_reports_generated integer := 0;
  v_plagiarism_checks integer := 0;
  v_api_requests integer := 0;
  v_extension_usage integer := 0;
  v_plugin_activity integer := 0;
  v_time_saved integer := 0;
  v_docs_processed integer := 0;
BEGIN
  SELECT user_id INTO v_user_id FROM public.customer_profiles WHERE id = p_profile_id;
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM public.profiles WHERE id = p_profile_id;
  END IF;

  IF v_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_ai_scans FROM public.usage_ledger WHERE user_id = v_user_id AND outcome = 'success';
    v_docs_processed := v_ai_scans;
    v_words_analyzed := v_ai_scans * 450;
    v_time_saved := v_ai_scans * 3;
  END IF;

  RETURN jsonb_build_object(
    'ai_scans', v_ai_scans,
    'words_analyzed', v_words_analyzed,
    'words_humanized', v_words_humanized,
    'reports_generated', v_reports_generated,
    'plagiarism_checks', v_plagiarism_checks,
    'api_requests', v_api_requests,
    'extension_usage', v_extension_usage,
    'plugin_activity', v_plugin_activity,
    'time_saved_minutes', v_time_saved,
    'documents_processed', v_docs_processed
  );
END;
$$;
