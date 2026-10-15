CREATE OR REPLACE FUNCTION affiliate_private.on_approval() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE p profiles%ROWTYPE; link_id uuid; config affiliate_program_config%ROWTYPE; grant_exists boolean;
BEGIN
 IF NEW.status<>'Approved' OR (TG_OP='UPDATE' AND OLD.status='Approved') THEN RETURN NEW; END IF;
 IF auth.uid() IS NOT NULL AND auth.role()<>'service_role' AND NOT EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin') THEN
   RAISE EXCEPTION 'Admin approval required';
 END IF;
 SELECT * INTO STRICT p FROM profiles WHERE id=NEW.user_id FOR UPDATE;
 IF p.email IS NULL OR p.email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RAISE EXCEPTION 'Affiliate email is invalid'; END IF;
 SELECT EXISTS(SELECT 1 FROM usage_ledger WHERE user_id=p.id AND operation='affiliate_testing_credit_grant' AND outcome='success') INTO grant_exists;
 IF NOT grant_exists THEN
   UPDATE profiles SET credits_balance=coalesce(credits_balance,0)+300,updated_at=now() WHERE id=p.id;
   INSERT INTO usage_ledger(user_id,feature_slug,operation,credits_amount,outcome,ledger_type,metadata)
   VALUES(p.id,'affiliate_testing','affiliate_testing_credit_grant',300,'success','credit',
     jsonb_build_object('grant_code','affiliate_test_300_2026_10','reason','One-time complimentary credits for approved affiliate product testing','granted_by','admin-approval','application_id',NEW.id));
 END IF;
 SELECT id INTO link_id FROM affiliate_links WHERE affiliate_user_id=p.id ORDER BY created_at LIMIT 1;
 IF link_id IS NULL THEN INSERT INTO affiliate_links(affiliate_user_id,link_type) VALUES(p.id,'Tracking') RETURNING id INTO link_id; END IF;
 PERFORM resolve_affiliate_tracking_link(link_id);
 SELECT * INTO config FROM affiliate_program_config LIMIT 1;
 INSERT INTO affiliate_onboarding_outbox(user_id,application_id,recipient,snapshot)
 VALUES(p.id,NEW.id,p.email,jsonb_build_object('name',p.full_name,'email',p.email,'link_id',link_id,'credits',300,'commission_rate',coalesce(config.commission_rate,0.30),'attribution_days',coalesce(config.attribution_window_days,30),'hold_days',coalesce(config.hold_days,30),'minimum_payout',coalesce(config.minimum_payout,50),'currency',coalesce(config.currency,'USD')))
 ON CONFLICT(user_id) DO NOTHING;
 -- Dispatch failure must not undo approval/credits; cron will drain the durable outbox.
 BEGIN PERFORM affiliate_private.dispatch_onboarding(); EXCEPTION WHEN OTHERS THEN NULL; END;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION affiliate_private.on_approval() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER affiliate_approval_onboarding AFTER INSERT OR UPDATE OF status ON affiliate_applications
 FOR EACH ROW EXECUTE FUNCTION affiliate_private.on_approval();

