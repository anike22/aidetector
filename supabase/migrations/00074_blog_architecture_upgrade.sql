ALTER TABLE blog_posts
  ADD COLUMN hub text,
  ADD COLUMN scheduled_publish_at timestamp with time zone,
  ADD COLUMN canonical_url text,
  ADD COLUMN reading_time integer,
  ADD COLUMN toc_json jsonb,
  ADD COLUMN seo_score integer,
  ADD COLUMN schema_json jsonb,
  ADD COLUMN og_image text,
  ADD COLUMN twitter_image text,
  ADD COLUMN is_featured boolean DEFAULT false,
  ADD COLUMN related_article_ids uuid[],
  ADD COLUMN url text;

CREATE TABLE IF NOT EXISTS redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  old_url text UNIQUE NOT NULL,
  new_url text NOT NULL,
  redirect_type text NOT NULL CHECK (redirect_type IN ('301', '302', '410')),
  is_active boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read redirects" ON redirects FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated read redirects" ON redirects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin full access redirects" ON redirects FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role));

UPDATE blog_posts
SET hub = CASE slug
  WHEN 'best-ai-detector' THEN 'guides'
  WHEN 'how-ai-detection-works' THEN 'guides'
  WHEN 'ai-detection-accuracy-tests' THEN 'research'
  WHEN 'chatgpt-detector-comparison' THEN 'comparisons'
  WHEN 'gpt-5-vs-gemini-detection' THEN 'research'
  WHEN 'turnitin-vs-aidetector-cx' THEN 'comparisons'
  ELSE 'guides'
END,
url = '/' || CASE slug
  WHEN 'best-ai-detector' THEN 'guides'
  WHEN 'how-ai-detection-works' THEN 'guides'
  WHEN 'ai-detection-accuracy-tests' THEN 'research'
  WHEN 'chatgpt-detector-comparison' THEN 'comparisons'
  WHEN 'gpt-5-vs-gemini-detection' THEN 'research'
  WHEN 'turnitin-vs-aidetector-cx' THEN 'comparisons'
  ELSE 'guides'
END || '/' || slug;

INSERT INTO redirects (old_url, new_url, redirect_type, is_active)
VALUES
  ('/blog/1', '/guides', '410', false),
  ('/blog/2', '/guides', '410', false),
  ('/blog/3', '/guides', '410', false),
  ('/blog/5', '/guides', '410', false),
  ('/blog/6', '/guides', '410', false)
ON CONFLICT (old_url) DO NOTHING;