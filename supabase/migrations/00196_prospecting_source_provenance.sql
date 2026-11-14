-- Add source provenance to prospecting records and explicitly quarantine known demo rows.
ALTER TABLE public.prospecting_companies
  ADD COLUMN IF NOT EXISTS source_provider TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_retrieved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.prospecting_decision_makers
  ADD COLUMN IF NOT EXISTS source_provider TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_retrieved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

-- These signatures are created by the legacy demo code in this application.
-- Preserve the rows for audit/history; do not delete them.
UPDATE public.prospecting_companies
SET is_demo = TRUE
WHERE COALESCE(score_reason, '') = 'Demo Data Match'
   OR name ILIKE 'Demo %';

UPDATE public.prospecting_decision_makers
SET is_demo = TRUE
WHERE name IN ('Sarah Johnson', 'Michael Chen')
  AND (
    COALESCE(phone, '') LIKE '%555%'
    OR COALESCE(linkedin_profile, '') IN ('linkedin.com/in/sarahj', 'linkedin.com/in/mchen')
  );

CREATE INDEX IF NOT EXISTS prospecting_companies_user_source_idx
  ON public.prospecting_companies (user_id, source_provider, source_retrieved_at DESC);

CREATE INDEX IF NOT EXISTS prospecting_decision_makers_user_source_idx
  ON public.prospecting_decision_makers (user_id, source_provider, source_retrieved_at DESC);
