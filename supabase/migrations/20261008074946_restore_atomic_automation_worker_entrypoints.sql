-- Additive repair: service-only entrypoints. Existing public RPCs remain unchanged.
CREATE OR REPLACE FUNCTION public.process_queued_automation_event(p_event_id uuid, p_not_before timestamptz)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE
 e public.automation_events%ROWTYPE;
 w public.automation_workflows%ROWTYPE;
 execution_id uuid;
 execution_ids uuid[] := ARRAY[]::uuid[];
 start_node text;
BEGIN
 IF current_user NOT IN ('service_role','postgres') THEN RAISE EXCEPTION 'Service caller required' USING ERRCODE='42501'; END IF;
 IF p_not_before IS NULL THEN RAISE EXCEPTION 'History cutoff required'; END IF;
 SELECT * INTO e FROM public.automation_events WHERE id=p_event_id AND NOT processed AND created_at>=p_not_before FOR UPDATE SKIP LOCKED;
 IF NOT FOUND THEN RETURN jsonb_build_object('processed',false,'reason','not_claimable'); END IF;
 IF NOT EXISTS(SELECT 1 FROM public.automation_workflows WHERE status='active') THEN
  RETURN jsonb_build_object('processed',false,'reason','no_active_workflows');
 END IF;
 FOR w IN SELECT * FROM public.automation_workflows WHERE status='active' AND trigger_type=e.event_type ORDER BY id LOOP
  IF w.trigger_config ? 'conditions' AND jsonb_array_length(w.trigger_config->'conditions')>0 THEN
   IF NOT COALESCE(public.evaluate_workflow_condition(w.trigger_config,e.user_id),false) THEN CONTINUE; END IF;
  END IF;
  IF EXISTS(SELECT 1 FROM public.automation_executions WHERE workflow_id=w.id AND trigger_event_id=e.id AND user_id=e.user_id) THEN CONTINUE; END IF;
  SELECT n->>'id' INTO start_node FROM jsonb_array_elements(w.workflow_definition->'nodes') n WHERE n->>'type'='trigger' LIMIT 1;
  IF start_node IS NULL THEN RAISE EXCEPTION 'Workflow % has no trigger',w.id; END IF;
  INSERT INTO public.automation_executions(workflow_id,user_id,trigger_event,trigger_event_id,status,current_node_id,context)
  VALUES(w.id,e.user_id,e.event_type,e.id,'running',start_node,jsonb_build_object('event_data',e.event_data)) RETURNING id INTO execution_id;
  execution_ids := array_append(execution_ids,execution_id);
 END LOOP;
 UPDATE public.automation_events SET processed=true WHERE id=e.id;
 RETURN jsonb_build_object('processed',true,'execution_ids',execution_ids);
END;
$$;
REVOKE ALL ON FUNCTION public.process_queued_automation_event(uuid,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.process_queued_automation_event(uuid,timestamptz) TO service_role;

CREATE OR REPLACE FUNCTION public.advance_automation_execution(p_execution_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE
 e public.automation_executions%ROWTYPE;
 w public.automation_workflows%ROWTYPE;
 profile public.profiles%ROWTYPE;
 reservation public.credit_reservations%ROWTYPE;
 ent record;
 reservation_id uuid;
 node jsonb;
 next_id text;
 branch text;
 node_type text;
 result jsonb;
 nodes jsonb;
 edges jsonb;
 step_count int:=0;
 delay_minutes numeric;
 resume_at timestamptz;
 outcome text:='completed';
 error_text text;
BEGIN
 IF current_user NOT IN ('service_role','postgres') THEN RAISE EXCEPTION 'Service caller required' USING ERRCODE='42501'; END IF;
 SELECT * INTO e FROM public.automation_executions WHERE id=p_execution_id AND (status='running' OR (status='delayed' AND scheduled_resume_at<=now())) FOR UPDATE SKIP LOCKED;
 IF NOT FOUND THEN RETURN jsonb_build_object('processed',false,'reason','not_claimable'); END IF;
 -- All step writes, billing and progress commit together. A crash rolls all back.
 BEGIN
  SELECT * INTO w FROM public.automation_workflows WHERE id=e.workflow_id;
  IF NOT FOUND OR w.status<>'active' THEN RAISE EXCEPTION 'Workflow is missing or inactive'; END IF;
  nodes:=w.workflow_definition->'nodes'; edges:=COALESCE(w.workflow_definition->'edges','[]'::jsonb);
  IF jsonb_typeof(nodes) IS DISTINCT FROM 'array' OR jsonb_array_length(nodes)=0 THEN RAISE EXCEPTION 'Missing workflow definition'; END IF;
  SELECT n INTO node FROM jsonb_array_elements(nodes) n WHERE n->>'id'=e.current_node_id LIMIT 1;
  IF node IS NULL THEN RAISE EXCEPTION 'Missing current workflow node'; END IF;
  -- Never grant expired paid access on delayed resumes.
  PERFORM public.refresh_billing_account(e.user_id);
  SELECT * INTO profile FROM public.profiles WHERE id=e.user_id FOR UPDATE;
  IF NOT FOUND OR NOT COALESCE(public.billing_paid_active(profile.subscription_plan,profile.subscription_status,profile.plan_end_date),false)
   OR public.billing_plan_rank(profile.subscription_plan)<public.billing_plan_rank('business') THEN RAISE EXCEPTION 'Active Business entitlement required'; END IF;
  reservation_id:=NULLIF(e.context->>'_billing_reservation_id','')::uuid;
  IF reservation_id IS NULL THEN
   SELECT * INTO ent FROM public.reserve_entitlement_and_credits(p_user_id=>e.user_id,p_feature_slug=>'automation_run',p_credits_cost=>1,p_unit_quantity=>1,p_timezone=>'UTC',p_idempotency_key=>'automation-execution:'||e.id::text,p_metadata=>jsonb_build_object('execution_id',e.id));
   IF NOT COALESCE(ent.allowed,false) OR ent.reservation_id IS NULL THEN RAISE EXCEPTION 'Automation reservation denied: %',COALESCE(ent.error_code,ent.reason); END IF;
   reservation_id:=ent.reservation_id;
  ELSE
   SELECT * INTO reservation FROM public.credit_reservations WHERE id=reservation_id AND user_id=e.user_id AND feature_slug='automation_run' FOR UPDATE;
   IF NOT FOUND OR reservation.status NOT IN ('reserved','pending','committed') THEN RAISE EXCEPTION 'Saved billing reservation is invalid'; END IF;
  END IF;
  WHILE node IS NOT NULL LOOP
   step_count:=step_count+1;
   IF step_count>50 THEN RAISE EXCEPTION 'Exceeded maximum workflow steps'; END IF;
   node_type:=node->>'type'; branch:='yes'; result:='{}'::jsonb;
   IF node_type='condition' THEN
    IF NOT COALESCE(public.evaluate_workflow_condition(node->'data',e.user_id),false) THEN branch:='no'; END IF;
    result:=jsonb_build_object('passed',branch='yes');
   ELSIF node_type='action' THEN
    -- Only transaction-local database actions. External delivery needs an outbox.
    IF COALESCE(node->'data'->>'type','') NOT IN ('in_app_notification','dashboard_announcement','add_tag','remove_tag','add_to_segment','remove_from_segment','update_lifecycle_stage','mark_milestone','recommendation','admin_notification','internal_note') THEN RAISE EXCEPTION 'Unsupported transactional action'; END IF;
    result:=public.execute_workflow_action(p_user_id=>e.user_id,p_action=>node->'data');
    IF COALESCE((result->>'success')::boolean,false)=false OR COALESCE((result->>'noop')::boolean,false) THEN RAISE EXCEPTION 'Workflow action failed'; END IF;
   ELSIF node_type='delay' THEN
    delay_minutes:=COALESCE((node->'data'->>'delayMinutes')::numeric,0);
    IF delay_minutes<0 OR delay_minutes>525600 THEN RAISE EXCEPTION 'Invalid delay duration'; END IF;
    resume_at:=now()+make_interval(secs=>(delay_minutes*60)::double precision);
    result:=jsonb_build_object('resume_at',resume_at);
   ELSIF node_type NOT IN ('trigger','end') THEN RAISE EXCEPTION 'Unknown workflow node type'; END IF;
   PERFORM public.log_execution_step(e.id,node->>'id',node_type,COALESCE(node->'data','{}'::jsonb),'completed',result,NULL);
   IF node_type='end' THEN EXIT; END IF;
   SELECT edge->>'target' INTO next_id FROM jsonb_array_elements(edges) edge WHERE edge->>'source'=node->>'id' AND COALESCE(edge->>'sourceHandle','yes')=branch LIMIT 1;
   IF node_type='delay' AND next_id IS NOT NULL THEN outcome:='delayed'; EXIT; END IF;
   IF next_id IS NULL THEN node:=NULL;
   ELSE SELECT n INTO node FROM jsonb_array_elements(nodes) n WHERE n->>'id'=next_id LIMIT 1;
    IF node IS NULL THEN RAISE EXCEPTION 'Workflow edge references a missing node'; END IF;
   END IF;
  END LOOP;
  -- Charge at the first successful advancement, matching the old worker's
  -- successful delayed chunk, but never reserve/charge again on resumption.
  SELECT * INTO reservation FROM public.credit_reservations WHERE id=reservation_id FOR UPDATE;
  IF reservation.status IN ('reserved','pending') THEN
   IF NOT public.finalize_credit_reservation(reservation_id,'success',jsonb_build_object('execution_id',e.id),NULL,'UTC') THEN RAISE EXCEPTION 'Billing settlement was not applied'; END IF;
  ELSIF reservation.status<>'committed' THEN RAISE EXCEPTION 'Unexpected reservation state'; END IF;
  UPDATE public.automation_executions SET status=outcome,
   current_node_id=CASE WHEN outcome='delayed' THEN next_id ELSE NULL END,
   scheduled_resume_at=CASE WHEN outcome='delayed' THEN resume_at ELSE NULL END,
   completed_at=CASE WHEN outcome='completed' THEN now() ELSE NULL END,error_message=NULL,
   context=context||jsonb_build_object('_billing_reservation_id',reservation_id)
  WHERE id=e.id;
  RETURN jsonb_build_object('processed',true,'status',outcome,'reservation_id',reservation_id,'steps',step_count);
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS error_text=MESSAGE_TEXT;
  -- The subtransaction already reverted steps, new reservations and charges.
  -- Prior successful chunks stay committed and are not billed again.
  UPDATE public.automation_executions SET status='failed',completed_at=now(),error_message=error_text WHERE id=e.id;
  RETURN jsonb_build_object('processed',false,'status','failed','error',error_text);
 END;
END;
$$;
REVOKE ALL ON FUNCTION public.advance_automation_execution(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.advance_automation_execution(uuid) TO service_role;
