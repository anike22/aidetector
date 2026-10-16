CREATE FUNCTION public.growth_claim() RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE s growth_outreach_settings%ROWTYPE; q growth_outreach_queue%ROWTYPE; day_start timestamptz; attempts integer; local_hour integer;
BEGIN
 IF current_setting('role',true)<>'service_role' THEN RAISE EXCEPTION 'Service only'; END IF;
 PERFORM pg_advisory_xact_lock(83419355);
 SELECT * INTO s FROM growth_outreach_settings WHERE id=true;
 IF NOT s.enabled OR NOT s.history_ready OR s.mailbox_email IS DISTINCT FROM s.sender_email OR s.last_synced_at IS NULL OR s.last_synced_at<now()-interval '30 minutes' THEN RETURN NULL; END IF;
 local_hour:=extract(hour FROM now() AT TIME ZONE 'Africa/Lagos');
 IF local_hour<8 OR local_hour>=21 THEN RETURN NULL; END IF;
 -- Never automatically reclaim a send whose provider outcome might be unknown.
 UPDATE growth_outreach_queue SET status='uncertain',last_error='Interrupted send; reconcile Gmail Sent before any further action' WHERE status='sending' AND claimed_at<now()-interval '30 minutes';
 SELECT * INTO q FROM growth_outreach_queue WHERE status='approved' AND due_at<=now() ORDER BY due_at,created_at LIMIT 1 FOR UPDATE;
 IF q.id IS NULL THEN RETURN NULL; END IF;
 IF EXISTS(SELECT 1 FROM admin_outreach_suppressions WHERE email=q.email) THEN UPDATE growth_outreach_queue SET status='blocked',last_error='Suppressed address' WHERE id=q.id; RETURN NULL; END IF;
 SELECT count(*) INTO attempts FROM growth_outreach_attempts a WHERE email=q.email AND NOT EXISTS(SELECT 1 FROM growth_outreach_mail m WHERE m.id=a.gmail_message_id);
 attempts:=attempts+coalesce((SELECT prior_sent FROM growth_outreach_contacts WHERE email=q.email),0);
 IF attempts>=3 OR (q.kind='initial' AND (attempts>0 OR coalesce((SELECT prior_draft FROM growth_outreach_contacts WHERE email=q.email),false))) THEN UPDATE growth_outreach_queue SET status='blocked',last_error='Prior contact or attempt limit' WHERE id=q.id; RETURN NULL; END IF;
 day_start:=date_trunc('day',now() AT TIME ZONE 'Africa/Lagos') AT TIME ZONE 'Africa/Lagos';
 IF q.kind='initial' AND (SELECT count(*) FROM growth_outreach_attempts a JOIN growth_outreach_queue x ON x.id=a.queue_id WHERE a.created_at>=day_start AND x.kind='initial')>=s.daily_cap THEN RETURN NULL; END IF;
 UPDATE growth_outreach_queue SET status='sending',claimed_at=now(),rfc_message_id=coalesce(rfc_message_id,gen_random_uuid()::text||'@aidetector.cx') WHERE id=q.id RETURNING * INTO q;
 IF q.status<>'sending' THEN RETURN NULL; END IF;
 INSERT INTO growth_outreach_attempts(queue_id,email) VALUES(q.id,q.email);
 RETURN to_jsonb(q);
END $$;
REVOKE ALL ON FUNCTION public.growth_claim() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.growth_claim() TO service_role;

