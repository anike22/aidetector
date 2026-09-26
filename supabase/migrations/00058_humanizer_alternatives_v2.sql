-- Migration: humanizer_alternatives_v2
-- Description: Add separate alternatives table, partial status, execution tracking

-- 1. Add partial status to humanization_status enum
ALTER TYPE public.humanization_status ADD VALUE 'partial';

-- 2. Add job tracking columns
ALTER TABLE public.humanization_jobs
ADD COLUMN IF NOT EXISTS expected_alternatives integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS completed_alternatives integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS failed_alternatives integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS request_id uuid;

-- 3. Create alternatives table
CREATE TABLE IF NOT EXISTS public.humanization_alternatives (
    alternative_id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    job_id uuid REFERENCES public.humanization_jobs(job_id) ON DELETE CASCADE,
    alternative_type text NOT NULL CHECK (alternative_type IN ('Most Faithful', 'Most Natural', 'Most Concise')),
    status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Generating', 'Completed', 'Validation Failed', 'Provider Failed', 'Retrying')),
    text text,
    summary text,
    scores jsonb DEFAULT '{}'::jsonb,
    similarity_to_original double precision,
    meaning_integrity double precision,
    provider text,
    model text,
    attempt_count integer DEFAULT 0,
    error_code text,
    error_message text,
    processing_time integer,
    warnings jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    UNIQUE(job_id, alternative_type)
);

-- 4. Extend model execution records
ALTER TABLE public.model_execution_records
ADD COLUMN IF NOT EXISTS alternative_id uuid REFERENCES public.humanization_alternatives(alternative_id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS attempt_number integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS wait_time integer,
ADD COLUMN IF NOT EXISTS retry_after integer,
ADD COLUMN IF NOT EXISTS error_code text,
ADD COLUMN IF NOT EXISTS status text;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_humanization_alternatives_job ON public.humanization_alternatives(job_id);
CREATE INDEX IF NOT EXISTS idx_model_executions_alternative ON public.model_execution_records(alternative_id);

-- 6. RLS
ALTER TABLE public.humanization_alternatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alternatives" ON public.humanization_alternatives
FOR SELECT USING (EXISTS (SELECT 1 FROM public.humanization_jobs j WHERE j.job_id = job_id AND j.user_id = auth.uid()));

CREATE POLICY "Service role full access alternatives" ON public.humanization_alternatives
FOR ALL USING (auth.jwt()->>'role' = 'service_role');