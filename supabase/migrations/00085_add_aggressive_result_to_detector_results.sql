-- Add nullable JSONB column for aggressive detector snapshot.
-- Existing rows remain valid — the column defaults to NULL.
-- No existing fields or indices are changed.
ALTER TABLE detector_results
  ADD COLUMN IF NOT EXISTS aggressive_result JSONB DEFAULT NULL;

COMMENT ON COLUMN detector_results.aggressive_result IS
  'Optional snapshot of the Aggressive Detector (SEO Assistant heuristic) result. NULL for scans predating dual-engine support. Schema: {ai, human, risk, recommendations, engineLabel, recordedAt}.';
