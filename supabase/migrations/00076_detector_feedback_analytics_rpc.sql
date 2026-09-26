CREATE OR REPLACE FUNCTION detector_perf_by_language()
RETURNS TABLE(
  language_code text,
  result_count bigint,
  avg_ai_probability numeric,
  avg_confidence numeric,
  feedback_count bigint,
  incorrect_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT
    COALESCE(r.language_code, 'unknown') AS language_code,
    COUNT(r.id) AS result_count,
    ROUND(AVG(r.ai_probability)::numeric, 2) AS avg_ai_probability,
    ROUND(AVG(r.confidence)::numeric, 2) AS avg_confidence,
    COUNT(f.id) AS feedback_count,
    COUNT(f.id) FILTER (WHERE f.feedback_type = 'incorrect') AS incorrect_count
  FROM detector_results r
  LEFT JOIN detector_feedback f ON f.result_id = r.id
  GROUP BY r.language_code;
$$;

CREATE OR REPLACE FUNCTION detector_perf_by_version()
RETURNS TABLE(
  detector_version text,
  result_count bigint,
  avg_ai_probability numeric,
  avg_confidence numeric,
  feedback_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT
    r.detector_version,
    COUNT(r.id) AS result_count,
    ROUND(AVG(r.ai_probability)::numeric, 2) AS avg_ai_probability,
    ROUND(AVG(r.confidence)::numeric, 2) AS avg_confidence,
    COUNT(f.id) AS feedback_count
  FROM detector_results r
  LEFT JOIN detector_feedback f ON f.result_id = r.id
  GROUP BY r.detector_version;
$$;

CREATE OR REPLACE FUNCTION detector_problematic_content_types()
RETURNS TABLE(
  content_type text,
  result_count bigint,
  feedback_count bigint,
  incorrect_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT
    COALESCE(r.content_type, 'unknown') AS content_type,
    COUNT(r.id) AS result_count,
    COUNT(f.id) AS feedback_count,
    COUNT(f.id) FILTER (WHERE f.feedback_type = 'incorrect') AS incorrect_count
  FROM detector_results r
  LEFT JOIN detector_feedback f ON f.result_id = r.id
  GROUP BY r.content_type;
$$;

-- Allow authenticated users to execute these RPCs (RLS already restricts underlying tables)
GRANT EXECUTE ON FUNCTION detector_perf_by_language() TO authenticated;
GRANT EXECUTE ON FUNCTION detector_perf_by_version() TO authenticated;
GRANT EXECUTE ON FUNCTION detector_problematic_content_types() TO authenticated;
