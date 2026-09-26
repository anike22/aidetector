
CREATE TABLE articles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title               text NOT NULL DEFAULT '',
  keyword             text NOT NULL DEFAULT '',
  country             text NOT NULL DEFAULT 'USA',
  search_intent       text NOT NULL DEFAULT 'Informational',
  secondary_keywords  text[] NOT NULL DEFAULT '{}',
  lsi_keywords        text[] NOT NULL DEFAULT '{}',
  target_word_count   integer NOT NULL DEFAULT 1200,
  meta_title          text NOT NULL DEFAULT '',
  meta_description    text NOT NULL DEFAULT '',
  slug                text NOT NULL DEFAULT '',
  outline             jsonb NOT NULL DEFAULT '[]',
  eeat_config         jsonb NOT NULL DEFAULT '{}',
  sections            jsonb NOT NULL DEFAULT '[]',
  full_content        text NOT NULL DEFAULT '',
  faq                 jsonb NOT NULL DEFAULT '[]',
  seo_assets          jsonb NOT NULL DEFAULT '{}',
  seo_score           integer,
  word_count          integer NOT NULL DEFAULT 0,
  current_step        integer NOT NULL DEFAULT 1,
  status              text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION articles_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION articles_set_updated_at();

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "articles_owner_select" ON articles FOR SELECT TO authenticated USING (author_id = auth.uid());
CREATE POLICY "articles_owner_insert" ON articles FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "articles_owner_update" ON articles FOR UPDATE TO authenticated USING (author_id = auth.uid());
CREATE POLICY "articles_owner_delete" ON articles FOR DELETE TO authenticated USING (author_id = auth.uid());
