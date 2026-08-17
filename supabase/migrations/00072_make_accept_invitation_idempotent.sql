CREATE OR REPLACE FUNCTION public.accept_organization_invitation(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_invite public.organization_invitations%ROWTYPE;
  v_membership public.organization_members%ROWTYPE;
BEGIN
  SELECT * INTO v_invite FROM public.organization_invitations WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF v_invite.status = 'accepted' THEN
    IF v_invite.accepted_by = auth.uid() THEN
      RETURN v_invite.organization_id;
    ELSE
      RAISE EXCEPTION 'Invitation already accepted';
    END IF;
  END IF;

  IF v_invite.status IN ('revoked','expired','declined') THEN
    RAISE EXCEPTION 'Invitation is no longer valid';
  END IF;

  IF v_invite.expires_at < now() THEN
    UPDATE public.organization_invitations SET status = 'expired' WHERE id = v_invite.id;
    RAISE EXCEPTION 'Invitation expired';
  END IF;

  INSERT INTO public.organization_members (
    organization_id, user_id, role, status, invited_by, invited_at, joined_at,
    department_ids, team_ids, last_login_at
  ) VALUES (
    v_invite.organization_id, auth.uid(), v_invite.role, 'active', v_invite.invited_by,
    v_invite.created_at, now(),
    CASE WHEN v_invite.department_id IS NOT NULL THEN jsonb_build_array(v_invite.department_id) ELSE '[]'::jsonb END,
    CASE WHEN v_invite.team_id IS NOT NULL THEN jsonb_build_array(v_invite.team_id) ELSE '[]'::jsonb END,
    now()
  )
  ON CONFLICT (organization_id, user_id) DO UPDATE SET
    status = 'active',
    role = v_invite.role,
    department_ids = CASE WHEN v_invite.department_id IS NOT NULL THEN jsonb_build_array(v_invite.department_id) ELSE EXCLUDED.department_ids END,
    team_ids = CASE WHEN v_invite.team_id IS NOT NULL THEN jsonb_build_array(v_invite.team_id) ELSE EXCLUDED.team_ids END,
    invited_by = COALESCE(organization_members.invited_by, v_invite.invited_by),
    invited_at = COALESCE(organization_members.invited_at, v_invite.created_at),
    joined_at = COALESCE(organization_members.joined_at, now()),
    removed_at = NULL,
    removed_by = NULL,
    updated_at = now();

  SELECT * INTO v_membership FROM public.organization_members
  WHERE organization_id = v_invite.organization_id AND user_id = auth.uid();

  IF v_invite.workspace_id IS NOT NULL THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role, status, added_by, added_at)
    VALUES (v_invite.workspace_id, auth.uid(), 'contributor', 'active', v_invite.invited_by, now())
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
  END IF;

  UPDATE public.organization_invitations
  SET status = 'accepted', accepted_at = now(), accepted_by = auth.uid()
  WHERE id = v_invite.id;

  INSERT INTO public.audit_logs (organization_id, user_id, action, resource_type, resource_id, details, category, severity)
  VALUES (
    v_invite.organization_id, auth.uid(), 'invitation_accepted', 'organization_invitation', v_invite.id,
    jsonb_build_object('email', v_invite.email, 'role', v_invite.role, 'department_id', v_invite.department_id, 'team_id', v_invite.team_id),
    'user_management', 'info'
  );

  INSERT INTO public.activity_feeds (organization_id, user_id, action, resource_type, resource_id, metadata)
  VALUES (
    v_invite.organization_id, auth.uid(), 'member_joined', 'organization_member', v_membership.id,
    jsonb_build_object('email', v_invite.email, 'role', v_invite.role)
  );

  RETURN v_invite.organization_id;
END;
$function$;