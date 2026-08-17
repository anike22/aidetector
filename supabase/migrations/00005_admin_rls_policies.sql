
-- ─── Admin helper ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ─── profiles: admin can read/update any profile ────────────────
CREATE POLICY "Admin can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admin can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ─── seller_products: admin can read/update/delete any product ──
CREATE POLICY "Admin can read all seller products"
  ON public.seller_products FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admin can update any seller product"
  ON public.seller_products FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can delete any seller product"
  ON public.seller_products FOR DELETE
  TO authenticated
  USING (is_admin());

-- ─── forum_posts: admin full access ─────────────────────────────
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read forum posts"
  ON public.forum_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can insert forum posts"
  ON public.forum_posts FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own posts"
  ON public.forum_posts FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Admin can update any forum post"
  ON public.forum_posts FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can delete any forum post"
  ON public.forum_posts FOR DELETE
  TO authenticated
  USING (is_admin() OR author_id = auth.uid());

-- ─── articles: admin can see/manage all ─────────────────────────
CREATE POLICY "Admin can read all articles"
  ON public.articles FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admin can update any article"
  ON public.articles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can delete any article"
  ON public.articles FOR DELETE
  TO authenticated
  USING (is_admin());

-- ─── Promote first user to admin for initial setup ──────────────
-- (This is a helper RPC callable from the admin bootstrap)
CREATE OR REPLACE FUNCTION promote_to_admin(target_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE profiles SET role = 'admin' WHERE email = target_email;
END;
$$;
