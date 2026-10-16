CREATE FUNCTION outreach_private.cross_mailbox_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE other_queue text; other_contacts text; seen boolean; d text;
BEGIN
 IF NEW.status<>'sending' OR OLD.status='sending' THEN RETURN NEW; END IF;
 d:=split_part(NEW.email,'@',2);
 PERFORM pg_advisory_xact_lock(hashtextextended('outreach-recipient:'||CASE WHEN d IN ('gmail.com','outlook.com','yahoo.com','qq.com') THEN NEW.email ELSE d END,0));
 other_queue:=CASE WHEN TG_TABLE_NAME='admin_outreach_queue' THEN 'growth_outreach_queue' ELSE 'admin_outreach_queue' END;
 other_contacts:=CASE WHEN TG_TABLE_NAME='admin_outreach_queue' THEN 'growth_outreach_contacts' ELSE 'admin_outreach_contacts' END;
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE email=$1 OR ($2 NOT IN (''gmail.com'',''outlook.com'',''yahoo.com'',''qq.com'') AND split_part(email,''@'',2)=$2))',other_contacts) INTO seen USING NEW.email,d;
 IF NOT seen THEN
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE (sent_at IS NOT NULL OR status IN (''sending'',''uncertain'')) AND (email=$1 OR ($2 NOT IN (''gmail.com'',''outlook.com'',''yahoo.com'',''qq.com'') AND split_part(email,''@'',2)=$2)))',other_queue) INTO seen USING NEW.email,d;
 END IF;
 IF seen AND NEW.kind='initial' THEN NEW.status:='blocked'; NEW.last_error:='Prior contact in another outreach mailbox'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION outreach_private.cross_mailbox_guard() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER outreach_cross_mailbox BEFORE UPDATE ON public.admin_outreach_queue FOR EACH ROW EXECUTE FUNCTION outreach_private.cross_mailbox_guard();
CREATE TRIGGER growth_cross_mailbox BEFORE UPDATE ON public.growth_outreach_queue FOR EACH ROW EXECUTE FUNCTION outreach_private.cross_mailbox_guard();

DO $$ DECLARE d text; BEGIN SELECT pg_get_functiondef('public.outreach_claim()'::regprocedure) INTO d; d:=replace(d,'INSERT INTO admin_outreach_attempts(queue_id,email)', 'IF q.status<>''sending'' THEN RETURN NULL; END IF; INSERT INTO admin_outreach_attempts(queue_id,email)'); EXECUTE d; END $$;
