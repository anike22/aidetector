-- Platform-admin agency workspace controls.
-- Agency subscription records here are administrative contract records only; they do not bypass Paystack verification
-- or grant product entitlements. Existing profile subscription and credit rules remain authoritative.

CREATE POLICY "app_admin_update_agency_organizations"
ON public.organizations
FOR UPDATE
TO authenticated
USING (public.is_app_admin() AND type = 'agency')
WITH CHECK (public.is_app_admin() AND type = 'agency');

CREATE POLICY "app_admin_read_agency_members"
ON public.organization_members
FOR SELECT
TO authenticated
USING (public.is_app_admin());

CREATE POLICY "app_admin_read_usage_ledger"
ON public.usage_ledger
FOR SELECT
TO authenticated
USING (public.is_app_admin());

CREATE OR REPLACE FUNCTION public.admin_manage_agency_workspace(
  p_org_id uuid,
  p_action text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_org public.organizations%ROWTYPE;
  v_old jsonb;
  v_new jsonb;
  v_trial jsonb;
  v_subscription jsonb;
  v_ends_at timestamptz;
  v_member_limit integer;
  v_plan public.organization_plan;
  v_status public.organization_status;
  v_actor uuid := auth.uid();
  v_log_action text;
BEGIN
  IF v_actor IS NULL OR NOT public.is_app_admin() THEN
    RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_org
  FROM public.organizations
  WHERE id = p_org_id AND type = 'agency'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agency workspace not found';
  END IF;

  CASE p_action
    WHEN 'suspend' THEN
      v_old := jsonb_build_object('status', v_org.status);
      UPDATE public.organizations SET status = 'suspended', updated_at = now() WHERE id = p_org_id
      RETURNING jsonb_build_object('status', status) INTO v_new;
      v_log_action := 'agency_suspended';

    WHEN 'activate' THEN
      v_old := jsonb_build_object('status', v_org.status);
      UPDATE public.organizations SET status = 'active', updated_at = now() WHERE id = p_org_id
      RETURNING jsonb_build_object('status', status) INTO v_new;
      v_log_action := 'agency_activated';

    WHEN 'set_plan' THEN
      BEGIN
        v_plan := (p_payload->>'plan')::public.organization_plan;
      EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Invalid agency workspace plan';
      END;
      IF v_plan NOT IN ('team','business','enterprise') THEN
        RAISE EXCEPTION 'Invalid agency workspace plan';
      END IF;
      v_old := jsonb_build_object('plan', v_org.plan);
      UPDATE public.organizations SET plan = v_plan, updated_at = now() WHERE id = p_org_id
      RETURNING jsonb_build_object('plan', plan) INTO v_new;
      v_log_action := 'agency_plan_changed';

    WHEN 'set_member_limit' THEN
      v_member_limit := (p_payload->>'max_members')::integer;
      IF v_member_limit IS NULL OR v_member_limit < 1 OR v_member_limit > 500 THEN
        RAISE EXCEPTION 'Member limit must be between 1 and 500';
      END IF;
      v_old := jsonb_build_object('max_members', v_org.max_members);
      UPDATE public.organizations SET max_members = v_member_limit, updated_at = now() WHERE id = p_org_id
      RETURNING jsonb_build_object('max_members', max_members) INTO v_new;
      v_log_action := 'agency_member_limit_changed';

    WHEN 'extend_trial' THEN
      v_trial := COALESCE(v_org.settings->'agency_trial', '{}'::jsonb);
      IF v_trial = '{}'::jsonb OR v_trial->>'status' = 'not_eligible' THEN
        RAISE EXCEPTION 'This workspace has no eligible trial to extend';
      END IF;
      v_ends_at := (p_payload->>'ends_at')::timestamptz;
      IF v_ends_at IS NULL OR v_ends_at <= now() OR v_ends_at > now() + interval '90 days' THEN
        RAISE EXCEPTION 'Trial end date must be in the next 90 days';
      END IF;
      v_old := v_trial;
      v_trial := v_trial || jsonb_build_object(
        'status','trialing',
        'ends_at',v_ends_at,
        'extended_at',now(),
        'extended_by',v_actor
      );
      UPDATE public.organizations
      SET settings = COALESCE(settings,'{}'::jsonb) || jsonb_build_object('agency_trial',v_trial),
          updated_at = now()
      WHERE id = p_org_id;
      v_new := v_trial;
      v_log_action := 'agency_trial_extended';

    WHEN 'end_trial' THEN
      v_trial := COALESCE(v_org.settings->'agency_trial', '{}'::jsonb);
      IF v_trial = '{}'::jsonb THEN RAISE EXCEPTION 'No agency trial exists'; END IF;
      v_old := v_trial;
      v_trial := v_trial || jsonb_build_object('status','expired','ended_at',now(),'ended_by',v_actor);
      UPDATE public.organizations
      SET settings = COALESCE(settings,'{}'::jsonb) || jsonb_build_object('agency_trial',v_trial),
          updated_at = now()
      WHERE id = p_org_id;
      v_new := v_trial;
      v_log_action := 'agency_trial_ended';

    WHEN 'set_subscription' THEN
      IF COALESCE(p_payload->>'status','') NOT IN ('pending','active','paused','cancelled','expired') THEN
        RAISE EXCEPTION 'Invalid agency subscription status';
      END IF;
      IF p_payload->>'status' = 'active' THEN
        IF NULLIF(trim(p_payload->>'payment_reference'),'') IS NULL THEN
          RAISE EXCEPTION 'A verified payment reference is required before marking an agency contract active';
        END IF;
        v_ends_at := (p_payload->>'ends_at')::timestamptz;
        IF v_ends_at IS NULL OR v_ends_at <= now() THEN
          RAISE EXCEPTION 'Active agency contract must have a future end date';
        END IF;
      ELSE
        v_ends_at := NULLIF(p_payload->>'ends_at','')::timestamptz;
      END IF;
      v_old := COALESCE(v_org.settings->'agency_subscription','{}'::jsonb);
      v_subscription := jsonb_build_object(
        'status',p_payload->>'status',
        'plan',COALESCE(NULLIF(p_payload->>'plan',''),'agency_unlimited_monthly'),
        'billing_cycle',COALESCE(NULLIF(p_payload->>'billing_cycle',''),'monthly'),
        'amount',NULLIF(p_payload->>'amount','')::numeric,
        'currency',upper(COALESCE(NULLIF(p_payload->>'currency',''),'NGN')),
        'payment_reference',NULLIF(trim(p_payload->>'payment_reference'),''),
        'starts_at',COALESCE(NULLIF(p_payload->>'starts_at','')::timestamptz,now()),
        'ends_at',v_ends_at,
        'notes',NULLIF(trim(p_payload->>'notes'),''),
        'updated_at',now(),
        'updated_by',v_actor
      );
      UPDATE public.organizations
      SET settings = COALESCE(settings,'{}'::jsonb) || jsonb_build_object('agency_subscription',v_subscription),
          updated_at = now()
      WHERE id = p_org_id;
      v_new := v_subscription;
      v_log_action := 'agency_subscription_' || (p_payload->>'status');

    ELSE
      RAISE EXCEPTION 'Unsupported agency admin action';
  END CASE;

  INSERT INTO public.admin_audit_logs(admin_id,user_id,action,feature_changed,old_value,new_value,notes)
  VALUES(v_actor,v_org.owner_id,v_log_action,'agency_workspace',v_old,v_new,
    NULLIF(trim(COALESCE(p_payload->>'notes','')),''));

  RETURN jsonb_build_object('success',true,'organization_id',p_org_id,'action',p_action,'value',v_new);
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_manage_agency_workspace(uuid,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_manage_agency_workspace(uuid,text,jsonb) TO authenticated;
