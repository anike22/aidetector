-- Prevent authenticated callers from reading another user's effective plan.
CREATE OR REPLACE FUNCTION public.get_effective_plan(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','auth'
AS $function$
DECLARE
  v_user_plan text;
  v_org_plan text;
BEGIN
  IF current_setting('role', true) NOT IN ('service_role','postgres')
     AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized to view this plan';
  END IF;

  SELECT COALESCE(subscription_plan, 'free') INTO v_user_plan
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_user_plan IS NULL THEN v_user_plan := 'free'; END IF;

  SELECT o.plan INTO v_org_plan
  FROM public.organization_members om
  JOIN public.organizations o ON om.organization_id = o.id
  WHERE om.user_id = p_user_id AND o.status = 'active'
  LIMIT 1;

  IF v_org_plan = 'enterprise' THEN
    RETURN 'enterprise';
  END IF;

  RETURN v_user_plan;
END;
$function$;
