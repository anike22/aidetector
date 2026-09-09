-- Video Analysis Jobs and Forensic Architecture Schema
CREATE TABLE IF NOT EXISTS public.video_analysis_jobs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_id TEXT,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  duration_seconds NUMERIC(8,2) DEFAULT 0,
  sha256 TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'balanced',
  status TEXT NOT NULL DEFAULT 'queued',
  progress_percent INT NOT NULL DEFAULT 0,
  current_stage_label TEXT DEFAULT 'Queued for processing',
  credit_reservation_id UUID,
  credits_charged INT DEFAULT 0,
  result JSONB,
  error_message TEXT,
  retention_days INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Video Appeals & Human Review Requests
CREATE TABLE IF NOT EXISTS public.video_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL REFERENCES public.video_analysis_jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_id TEXT,
  reason TEXT NOT NULL,
  evidence_notes TEXT,
  original_file_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, under_review, resolved, rejected
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_notes TEXT,
  revised_verdict TEXT,
  revised_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Known Generator Registry & Shadow Mode Monitoring
CREATE TABLE IF NOT EXISTS public.video_generator_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generator_name TEXT NOT NULL,
  generator_family TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, deprecated, shadow_eval
  first_evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  known_weaknesses TEXT[] DEFAULT '{}',
  watermark_support BOOLEAN NOT NULL DEFAULT false,
  attribution_reliability NUMERIC(5,2) NOT NULL DEFAULT 90.0,
  shadow_mode BOOLEAN NOT NULL DEFAULT false,
  metadata_signatures TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Known Generators
INSERT INTO public.video_generator_registry 
(generator_name, generator_family, version, status, known_weaknesses, watermark_support, attribution_reliability, shadow_mode, metadata_signatures)
VALUES
('OpenAI Sora', 'OpenAI', 'v1.0-alpha', 'active', ARRAY['Fluid dynamics consistency', 'Complex physical collisions', 'High-frequency finger kinematics'], true, 94.5, false, ARRAY['sora', 'openai-video']),
('Kling AI', 'Kuaishou Kling', '1.5-pro', 'active', ARRAY['Eye blink cadence under low light', 'Background text persistence'], true, 92.0, false, ARRAY['kling', 'kuaishou']),
('Runway Gen-3', 'Runway', 'Gen-3 Alpha', 'active', ARRAY['Camera rotation trajectory consistency', 'Subtle micro-expressions'], true, 93.0, false, ARRAY['gen-3', 'runway']),
('Luma Dream Machine', 'Luma AI', 'v1.2', 'active', ARRAY['Object permanence during rapid motion', 'Hair boundary antialiasing'], false, 89.5, false, ARRAY['luma', 'dream-machine']),
('Pika Labs', 'Pika', '2.0', 'active', ARRAY['Lip closure pressure dynamics', 'Specular reflections on eyewear'], true, 88.0, false, ARRAY['pika']),
('Hedra', 'Hedra Character-1', 'v1.0', 'active', ARRAY['Phoneme-viseme temporal delay under 60fps', 'Teeth texture uniformity'], false, 86.5, false, ARRAY['hedra']),
('DeepFaceLab', 'Open-Source Deepfake', '2.0', 'active', ARRAY['Boundary warping at jawline', 'Color transfer boundary seam', 'Sensor noise mismatch between face and background'], false, 96.0, false, ARRAY['dfl', 'deepfacelab'])
ON CONFLICT DO NOTHING;

-- RLS Policies
ALTER TABLE public.video_analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_generator_registry ENABLE ROW LEVEL SECURITY;

-- video_analysis_jobs policies
DROP POLICY IF EXISTS "Users can read own video jobs" ON public.video_analysis_jobs;
CREATE POLICY "Users can read own video jobs" ON public.video_analysis_jobs
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (guest_id IS NOT NULL AND guest_id = current_setting('request.headers', true)::json->>'x-guest-id')
  );

DROP POLICY IF EXISTS "Users can insert video jobs" ON public.video_analysis_jobs;
CREATE POLICY "Users can insert video jobs" ON public.video_analysis_jobs
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL)
  );

DROP POLICY IF EXISTS "Users can update own video jobs" ON public.video_analysis_jobs;
CREATE POLICY "Users can update own video jobs" ON public.video_analysis_jobs
  FOR UPDATE USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL)
  );

-- video_appeals policies
DROP POLICY IF EXISTS "Users can read own appeals" ON public.video_appeals;
CREATE POLICY "Users can read own appeals" ON public.video_appeals
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (guest_id IS NOT NULL AND guest_id = current_setting('request.headers', true)::json->>'x-guest-id')
  );

DROP POLICY IF EXISTS "Users can submit appeals" ON public.video_appeals;
CREATE POLICY "Users can submit appeals" ON public.video_appeals
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL)
  );

-- video_generator_registry policy (public read)
DROP POLICY IF EXISTS "Public can view generator registry" ON public.video_generator_registry;
CREATE POLICY "Public can view generator registry" ON public.video_generator_registry
  FOR SELECT USING (true);

-- RPC for submitting an appeal
CREATE OR REPLACE FUNCTION public.submit_video_appeal(
  p_job_id TEXT,
  p_reason TEXT,
  p_evidence_notes TEXT DEFAULT NULL,
  p_original_file_url TEXT DEFAULT NULL,
  p_guest_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_appeal_id UUID;
BEGIN
  INSERT INTO public.video_appeals (
    job_id,
    user_id,
    guest_id,
    reason,
    evidence_notes,
    original_file_url,
    status
  ) VALUES (
    p_job_id,
    v_user_id,
    COALESCE(p_guest_id, CASE WHEN v_user_id IS NULL THEN 'guest' ELSE NULL END),
    p_reason,
    p_evidence_notes,
    p_original_file_url,
    'pending'
  ) RETURNING id INTO v_appeal_id;

  RETURN jsonb_build_object(
    'success', true,
    'appealId', v_appeal_id,
    'status', 'pending',
    'message', 'Your appeal and supporting production evidence have been submitted for human forensic review.'
  );
END;
$$;
