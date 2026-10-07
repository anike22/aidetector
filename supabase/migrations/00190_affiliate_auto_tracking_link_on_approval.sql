-- Ensure every approved affiliate immediately has a usable tracking link.
-- Existing affiliate links are preserved; this only creates a first link when none exists.

CREATE OR REPLACE FUNCTION public.admin_set_affiliate_application_status(
  p_application_id uuid,
  p_status affiliate_application_status,
  p_tier affiliate_tier DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path='public'
AS $function$
DECLARE
  v_role text;
  v_app public.affiliate_applications%rowtype;
  v_profile_status text;
  v_affiliate_link_id uuid;
BEGIN
  SELECT role::text INTO v_role FROM public.profiles WHERE id=auth.uid();
  IF auth.role()<>'service_role' AND coalesce(v_role,'')<>'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_app
  FROM public.affiliate_applications
  WHERE id=p_application_id
  FOR UPDATE;

  IF v_app.id IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  UPDATE public.affiliate_applications
  SET status=p_status,
      tier=coalesce(p_tier,tier),
      reviewed_at=CASE WHEN p_status IN ('Approved','Rejected','Suspended','Terminated') THEN now() ELSE reviewed_at END,
      reviewed_by=CASE WHEN auth.uid() IS NOT NULL THEN auth.uid() ELSE reviewed_by END,
      updated_at=now()
  WHERE id=p_application_id
  RETURNING * INTO v_app;

  v_profile_status:=CASE p_status
    WHEN 'Approved' THEN 'active'
    WHEN 'Rejected' THEN 'none'
    WHEN 'Suspended' THEN 'suspended'
    WHEN 'Terminated' THEN 'terminated'
    ELSE NULL
  END;

  IF v_profile_status IS NOT NULL THEN
    UPDATE public.profiles
    SET affiliate_status=v_profile_status,
        affiliate_tier=v_app.tier
    WHERE id=v_app.user_id;
  END IF;

  IF p_status='Approved' THEN
    SELECT id INTO v_affiliate_link_id
    FROM public.affiliate_links
    WHERE affiliate_user_id=v_app.user_id
    ORDER BY created_at
    LIMIT 1;

    IF v_affiliate_link_id IS NULL THEN
      INSERT INTO public.affiliate_links(affiliate_user_id, link_type)
      VALUES(v_app.user_id, 'Tracking')
      RETURNING id INTO v_affiliate_link_id;
    END IF;

    PERFORM public.resolve_affiliate_tracking_link(v_affiliate_link_id);
  END IF;

  RETURN jsonb_build_object(
    'updated', true,
    'application_id', v_app.id,
    'user_id', v_app.user_id,
    'status', v_app.status,
    'tier', v_app.tier,
    'affiliate_link_id', v_affiliate_link_id
  );
END
$function$;

REVOKE ALL ON FUNCTION public.admin_set_affiliate_application_status(uuid,affiliate_application_status,affiliate_tier) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_affiliate_application_status(uuid,affiliate_application_status,affiliate_tier) TO authenticated,service_role;
