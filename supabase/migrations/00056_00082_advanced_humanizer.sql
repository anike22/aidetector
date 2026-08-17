-- Advanced Humanizer Schema Migration

-- ENUMS
CREATE TYPE public.humanization_status AS ENUM ('analyzing', 'planning', 'rewriting', 'verifying', 'completed', 'failed');
CREATE TYPE public.humanization_level AS ENUM ('light', 'balanced', 'strong', 'advanced', 'custom');

-- TABLES
CREATE TABLE IF NOT EXISTS public.humanization_jobs (
    job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    original_text TEXT NOT NULL,
    humanized_text TEXT,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    protected_facts JSONB NOT NULL DEFAULT '{}'::jsonb,
    transformation_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
    verification_results JSONB NOT NULL DEFAULT '{}'::jsonb,
    scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    sentence_changes JSONB NOT NULL DEFAULT '[]'::jsonb,
    version_number INTEGER NOT NULL DEFAULT 1,
    status humanization_status NOT NULL DEFAULT 'analyzing',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.humanization_versions (
    version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.humanization_jobs(job_id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    humanized_text TEXT NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    sentence_changes JSONB NOT NULL DEFAULT '[]'::jsonb,
    verification_results JSONB NOT NULL DEFAULT '{}'::jsonb,
    word_count INTEGER NOT NULL DEFAULT 0,
    change_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_humanization_jobs_user_id ON public.humanization_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_humanization_jobs_status ON public.humanization_jobs(status);
CREATE INDEX IF NOT EXISTS idx_humanization_jobs_created_at ON public.humanization_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_humanization_versions_job_id ON public.humanization_versions(job_id);

-- RLS POLICIES
ALTER TABLE public.humanization_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.humanization_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own humanization jobs"
    ON public.humanization_jobs
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own humanization versions"
    ON public.humanization_versions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.humanization_jobs
            WHERE job_id = public.humanization_versions.job_id
            AND user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.humanization_jobs
            WHERE job_id = public.humanization_versions.job_id
            AND user_id = auth.uid()
        )
    );

-- REALTIME
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'humanization_jobs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.humanization_jobs;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'humanization_versions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.humanization_versions;
  END IF;
END $$;
