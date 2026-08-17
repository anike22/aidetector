
-- Safe increment function for api_keys.requests_this_month
CREATE OR REPLACE FUNCTION increment_api_key_usage(key_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE api_keys
  SET
    requests_this_month = COALESCE(requests_this_month, 0) + 1,
    last_used_at        = now()
  WHERE id = key_id;
END;
$$;

-- Ensure api_usage_logs has all columns v1-detect needs
ALTER TABLE api_usage_logs
  ADD COLUMN IF NOT EXISTS api_key_id    uuid          REFERENCES api_keys(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS endpoint      text,
  ADD COLUMN IF NOT EXISTS method        text          DEFAULT 'POST',
  ADD COLUMN IF NOT EXISTS status_code   int           DEFAULT 200,
  ADD COLUMN IF NOT EXISTS processing_ms int,
  ADD COLUMN IF NOT EXISTS request_metadata jsonb;
