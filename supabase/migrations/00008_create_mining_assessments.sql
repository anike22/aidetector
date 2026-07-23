CREATE TABLE public.mining_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_name text NOT NULL,
  platform_type text,
  target_url text,
  trust_score integer NOT NULL,
  risk_classification text NOT NULL,
  report_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mining_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mining assessments"
  ON public.mining_assessments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mining assessments"
  ON public.mining_assessments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mining assessments"
  ON public.mining_assessments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION set_mining_assessments_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER mining_assessments_updated_at
  BEFORE UPDATE ON public.mining_assessments
  FOR EACH ROW EXECUTE FUNCTION set_mining_assessments_updated_at();

-- Public can view specific reports by ID
CREATE POLICY "Public can view any mining assessment"
  ON public.mining_assessments FOR SELECT
  USING (true);