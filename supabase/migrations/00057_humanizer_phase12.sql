-- Migration: humanizer_phase12
-- Description: Add fields for alternatives, feedback, domain awareness, model routing

-- 1. Add domain_type to humanization_jobs
ALTER TABLE public.humanization_jobs
ADD COLUMN domain_type text DEFAULT 'General',
ADD COLUMN alternatives jsonb DEFAULT '[]'::jsonb,
ADD COLUMN selected_alternative text,
ADD COLUMN warnings jsonb DEFAULT '[]'::jsonb,
ADD COLUMN model_used text,
ADD COLUMN input_length integer,
ADD COLUMN output_length integer,
ADD COLUMN processing_time integer,
ADD COLUMN usage_charged boolean DEFAULT false,
ADD COLUMN retry_count integer DEFAULT 0,
ADD COLUMN saved boolean DEFAULT false,
ADD COLUMN user_rating integer,
ADD COLUMN user_feedback text,
ADD COLUMN file_url text;

-- 2. Create feedback table
CREATE TABLE IF NOT EXISTS public.humanization_feedback (
    feedback_id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    job_id uuid REFERENCES public.humanization_jobs(job_id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    overall_quality integer CHECK (overall_quality BETWEEN 1 AND 5),
    meaning_preservation integer CHECK (meaning_preservation BETWEEN 1 AND 5),
    naturalness integer CHECK (naturalness BETWEEN 1 AND 5),
    usefulness integer CHECK (usefulness BETWEEN 1 AND 5),
    issue_type text,
    issue_description text,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Create model execution records table
CREATE TABLE IF NOT EXISTS public.model_execution_records (
    execution_id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    job_id uuid REFERENCES public.humanization_jobs(job_id) ON DELETE CASCADE,
    model_name text,
    provider text,
    input_tokens integer,
    output_tokens integer,
    latency integer,
    success boolean,
    error_message text,
    created_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_humanization_feedback_job ON public.humanization_feedback(job_id);
CREATE INDEX IF NOT EXISTS idx_model_executions_job ON public.model_execution_records(job_id);

-- RLS
ALTER TABLE public.humanization_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_execution_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own feedback" ON public.humanization_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own feedback" ON public.humanization_feedback FOR SELECT USING (auth.uid() = user_id);

-- Allow service role access for backend processing
CREATE POLICY "Service role full access feedback" ON public.humanization_feedback FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access executions" ON public.model_execution_records FOR ALL USING (auth.jwt()->>'role' = 'service_role');