-- Policy-aware SECURITY DEFINER hardening validated against aidetector-repair-test.
-- Keeps existing RLS signatures stable while preventing arbitrary-user role/membership probing
-- and unauthorized audit-log writes. Also removes unnecessary anon RPC access and hardens
-- the public video-appeal endpoint.

CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public','auth'
AS $$
  SELECT CASE
    WHEN current_setting('role',true) IN ('service_role','postgres') THEN (SELECT role FROM public.profiles WHERE id=uid)
    WHEN auth.uid() IS NOT NULL AND uid = auth.uid() THEN (SELECT role FROM public.profiles WHERE id=uid)
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public','auth'
AS $$
  SELECT CASE
    WHEN current_setting('role',true) IN ('service_role','postgres')
      THEN EXISTS(SELECT 1 FROM public.profiles WHERE id=user_uuid AND role::text='admin')
    WHEN auth.uid() IS NOT NULL AND user_uuid=auth.uid()
      THEN EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role::text='admin')
    ELSE FALSE
  END;
$$;

CREATE OR REPLACE FUNCTION public.is_authorship_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public','auth'
AS $$
  SELECT CASE
    WHEN current_setting('role',true) IN ('service_role','postgres')
      THEN EXISTS(SELECT 1 FROM public.profiles WHERE id=user_id AND role='admin')
    WHEN auth.uid() IS NOT NULL AND user_id=auth.uid()
      THEN EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='admin')
    ELSE FALSE
  END;
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','auth'
AS $$
BEGIN
  IF current_setting('role',true) NOT IN ('service_role','postgres')
     AND (auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid()) THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id=p_org_id AND user_id=p_user_id AND status='active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','auth'
AS $$
BEGIN
  IF current_setting('role',true) NOT IN ('service_role','postgres')
     AND (auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid()) THEN
    RETURN FALSE;
  END IF;
  RETURN COALESCE(public.get_org_role(p_org_id,p_user_id),'') IN ('owner','admin');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','auth'
AS $$
BEGIN
  IF current_setting('role',true) NOT IN ('service_role','postgres')
     AND (auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid()) THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id=p_workspace_id AND user_id=p_user_id AND status='active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_admin(p_workspace_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','auth'
AS $$
BEGIN
  IF current_setting('role',true) NOT IN ('service_role','postgres')
     AND (auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid()) THEN
    RETURN FALSE;
  END IF;
  RETURN COALESCE(public.get_workspace_role(p_workspace_id,p_user_id),'') IN ('admin','owner');
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_workspace_document(p_document_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','auth'
AS $$
BEGIN
  IF current_setting('role',true) NOT IN ('service_role','postgres')
     AND (auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid()) THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.workspace_documents d
    JOIN public.workspaces w ON d.workspace_id=w.id
    LEFT JOIN public.workspace_members wm
      ON wm.workspace_id=w.id AND wm.user_id=p_user_id AND wm.status='active'
    LEFT JOIN public.organization_members om
      ON om.organization_id=w.organization_id AND om.user_id=p_user_id AND om.status='active'
    WHERE d.id=p_document_id
      AND (
        w.created_by=p_user_id
        OR wm.id IS NOT NULL
        OR (om.id IS NOT NULL AND (w.shared_department_ids='[]'::jsonb OR om.department_ids ?| ARRAY(SELECT jsonb_array_elements_text(w.shared_department_ids))))
        OR (om.id IS NOT NULL AND (w.shared_team_ids='[]'::jsonb OR om.team_ids ?| ARRAY(SELECT jsonb_array_elements_text(w.shared_team_ids))))
      )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.can_view_report(p_report_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','auth'
AS $$
BEGIN
  IF current_setting('role',true) NOT IN ('service_role','postgres')
     AND (auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid()) THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.collaboration_reports r
    WHERE r.id=p_report_id
      AND (
        public.is_workspace_member(r.workspace_id,p_user_id)
        OR EXISTS (
          SELECT 1 FROM public.report_shares s
          WHERE s.report_id=p_report_id AND s.user_id=p_user_id
        )
      )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_organization_id uuid,
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','auth'
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF current_setting('role',true) NOT IN ('service_role','postgres') THEN
    IF v_uid IS NULL THEN
      RAISE EXCEPTION 'Authentication required';
    END IF;
    IF p_organization_id IS NULL OR NOT public.is_org_member(p_organization_id,v_uid) THEN
      RAISE EXCEPTION 'Not authorized to write this audit event';
    END IF;
  END IF;

  IF p_action IS NULL OR length(trim(p_action))=0 OR length(p_action)>120 THEN
    RAISE EXCEPTION 'Invalid audit action';
  END IF;

  INSERT INTO public.audit_logs(organization_id,user_id,action,resource_type,resource_id,details)
  VALUES(p_organization_id,v_uid,trim(p_action),NULLIF(trim(p_resource_type),''),p_resource_id,COALESCE(p_details,'{}'::jsonb));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.is_app_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_app_admin() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.is_lifecycle_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_lifecycle_admin() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid,uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid,uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.is_workspace_admin(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin(uuid,uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid,uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.can_access_workspace_document(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_workspace_document(uuid,uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.can_view_report(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_report(uuid,uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.log_audit_event(uuid,text,text,uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_audit_event(uuid,text,text,uuid,jsonb) TO authenticated, service_role;

-- These two are referenced by PUBLIC RLS policies. Keep callable but bind them to auth.uid().
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.is_authorship_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_authorship_admin(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_essay_user_id(p_essay_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public','auth'
AS $$
  SELECT CASE
    WHEN current_setting('role',true) IN ('service_role','postgres') THEN e.user_id
    WHEN auth.uid() IS NOT NULL AND e.user_id=auth.uid() THEN e.user_id
    ELSE NULL
  END
  FROM public.essays e
  WHERE e.id=p_essay_id;
$$;

REVOKE EXECUTE ON FUNCTION public.get_essay_user_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_essay_user_id(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.can_manage_seller_product(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_seller_product(uuid) TO authenticated, service_role;

-- Guest settlement must use settle_client_reservation, which binds the reservation to the caller.
REVOKE EXECUTE ON FUNCTION public.finalize_credit_reservation(uuid,text,jsonb,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finalize_credit_reservation(uuid,text,jsonb,text,text) TO authenticated, service_role;

-- Pure calculation helper does not need definer privileges.
ALTER FUNCTION public.organization_storage_quota(text) SECURITY INVOKER;
REVOKE EXECUTE ON FUNCTION public.organization_storage_quota(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.organization_storage_quota(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.submit_video_appeal(
  p_job_id text,
  p_reason text,
  p_evidence_notes text DEFAULT NULL,
  p_original_file_url text DEFAULT NULL,
  p_guest_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','auth','pg_temp'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_job public.video_analysis_jobs%ROWTYPE;
  v_appeal_id uuid;
  v_recent integer;
  v_existing uuid;
BEGIN
  IF p_job_id IS NULL OR length(trim(p_job_id))=0 OR length(p_job_id)>200 THEN
    RETURN jsonb_build_object('success',false,'reason','invalid_job');
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason))<10 OR length(p_reason)>2000 THEN
    RETURN jsonb_build_object('success',false,'reason','invalid_reason');
  END IF;
  IF p_evidence_notes IS NOT NULL AND length(p_evidence_notes)>5000 THEN
    RETURN jsonb_build_object('success',false,'reason','evidence_too_long');
  END IF;
  IF p_original_file_url IS NOT NULL AND length(p_original_file_url)>2048 THEN
    RETURN jsonb_build_object('success',false,'reason','url_too_long');
  END IF;

  SELECT * INTO v_job FROM public.video_analysis_jobs WHERE id=trim(p_job_id);
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success',false,'reason','job_not_found');
  END IF;

  IF v_user_id IS NOT NULL THEN
    IF v_job.user_id IS DISTINCT FROM v_user_id THEN
      RETURN jsonb_build_object('success',false,'reason','not_authorized');
    END IF;
    p_guest_id := NULL;
  ELSE
    IF p_guest_id IS NULL OR length(trim(p_guest_id))<8 OR length(p_guest_id)>200 THEN
      RETURN jsonb_build_object('success',false,'reason','invalid_guest');
    END IF;
    IF v_job.user_id IS NOT NULL OR v_job.guest_id IS DISTINCT FROM p_guest_id THEN
      RETURN jsonb_build_object('success',false,'reason','not_authorized');
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.server_guest_sessions s
      WHERE s.guest_id=p_guest_id AND s.linked_user_id IS NULL
    ) THEN
      RETURN jsonb_build_object('success',false,'reason','invalid_guest');
    END IF;
  END IF;

  SELECT id INTO v_existing
  FROM public.video_appeals
  WHERE job_id=v_job.id AND status='pending'
    AND (
      (v_user_id IS NOT NULL AND user_id=v_user_id)
      OR (v_user_id IS NULL AND user_id IS NULL AND guest_id=p_guest_id)
    )
  ORDER BY created_at DESC LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success',true,'appealId',v_existing,'status','pending','message','An appeal is already pending for this video analysis.');
  END IF;

  SELECT count(*) INTO v_recent
  FROM public.video_appeals
  WHERE created_at > now()-interval '24 hours'
    AND (
      (v_user_id IS NOT NULL AND user_id=v_user_id)
      OR (v_user_id IS NULL AND user_id IS NULL AND guest_id=p_guest_id)
    );

  IF v_recent >= 3 THEN
    RETURN jsonb_build_object('success',false,'reason','rate_limited');
  END IF;

  INSERT INTO public.video_appeals(job_id,user_id,guest_id,reason,evidence_notes,original_file_url,status)
  VALUES(
    v_job.id,
    v_user_id,
    CASE WHEN v_user_id IS NULL THEN p_guest_id ELSE NULL END,
    trim(p_reason),
    NULLIF(trim(p_evidence_notes),''),
    NULLIF(trim(p_original_file_url),''),
    'pending'
  )
  RETURNING id INTO v_appeal_id;

  RETURN jsonb_build_object(
    'success',true,'appealId',v_appeal_id,'status','pending',
    'message','Your appeal and supporting production evidence have been submitted for human forensic review.'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_video_appeal(text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_video_appeal(text,text,text,text,text) TO anon, authenticated, service_role;
