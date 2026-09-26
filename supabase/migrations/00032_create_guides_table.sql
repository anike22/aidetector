CREATE TABLE IF NOT EXISTS guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  featured_image_url TEXT,
  content TEXT NOT NULL,
  table_of_contents JSONB,
  related_guides UUID[],
  seo_title TEXT,
  seo_description TEXT,
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for published guides"
  ON guides FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admin full access to guides"
  ON guides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
