
-- RPC: aggregate lead event counts by type
CREATE OR REPLACE FUNCTION get_lead_event_stats()
RETURNS TABLE(event_type text, count bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT event_type, COUNT(*) AS count
  FROM lead_events
  GROUP BY event_type
  ORDER BY count DESC;
$$;
