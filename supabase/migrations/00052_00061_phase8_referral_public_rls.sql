BEGIN;
-- Public/anonymous referral click tracking
CREATE POLICY referral_links_select_public ON public.referral_links FOR SELECT TO anon USING (true);
CREATE POLICY referral_journeys_insert_public ON public.referral_journeys FOR INSERT TO anon WITH CHECK (true);

-- Allow authenticated users to update only their own public profile affiliate columns
CREATE POLICY profiles_update_referral_fields ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

COMMIT;