-- Fix agency creation for authenticated owners.
-- INSERT ... RETURNING can evaluate the SELECT policy before the AFTER INSERT
-- trigger has created the owner membership row. Permit the owner to read only
-- their own organization row, while retaining member/admin access.
DROP POLICY IF EXISTS orgs_insert ON public.organizations;
CREATE POLICY orgs_insert ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS orgs_select_members ON public.organizations;
CREATE POLICY orgs_select_members ON public.organizations
  FOR SELECT TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR public.is_org_member(id)
    OR public.is_app_admin()
  );
