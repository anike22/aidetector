
-- Forum posts table
CREATE TABLE forum_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 200),
  content     text NOT NULL CHECK (char_length(content) >= 10),
  category    text NOT NULL DEFAULT 'General',
  replies     integer NOT NULL DEFAULT 0,
  views       integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER forum_posts_updated_at
  BEFORE UPDATE ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read posts
CREATE POLICY "forum_posts_public_read"
  ON forum_posts FOR SELECT
  USING (true);

-- Authenticated users can insert their own posts
CREATE POLICY "forum_posts_auth_insert"
  ON forum_posts FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Authors can update their own posts
CREATE POLICY "forum_posts_author_update"
  ON forum_posts FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

-- Authors can delete their own posts
CREATE POLICY "forum_posts_author_delete"
  ON forum_posts FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE forum_posts;
