-- Harden the public profile projection so it never bypasses underlying RLS.
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Client roles only need to read the public projection.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.public_profiles FROM anon, authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated;
