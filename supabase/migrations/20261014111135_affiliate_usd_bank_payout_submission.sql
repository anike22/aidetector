-- Bank details never enter the public payouts table or general list responses.
CREATE SCHEMA IF NOT EXISTS affiliate_private;
REVOKE ALL ON SCHEMA affiliate_private FROM PUBLIC, anon, authenticated;
CREATE TABLE affiliate_private.payout_bank_details (
 payout_id uuid PRIMARY KEY REFERENCES public.payouts(id) ON DELETE CASCADE,
 affiliate_user_id uuid NOT NULL REFERENCES auth.users(id),
 details jsonb NOT NULL,
 submitted_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE affiliate_private.payout_bank_details ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON affiliate_private.payout_bank_details FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_affiliate_payout_setup() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE u uuid:=auth.uid(); total numeric; debt numeric; reserved numeric; minimum numeric; holding integer;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 SELECT minimum_payout,hold_days INTO minimum,holding FROM affiliate_program_config WHERE id=true;
 SELECT coalesce(sum(amount),0) INTO total FROM commissions WHERE affiliate_user_id=u AND status='Approved' AND payout_id IS NULL;
 SELECT coalesce(amount,0) INTO debt FROM affiliate_recovery_balances WHERE affiliate_user_id=u;
 SELECT coalesce(sum(recovery_applied),0) INTO reserved FROM payouts WHERE affiliate_user_id=u AND status IN ('Pending','Approved','Processing');
 total:=greatest(total-greatest(coalesce(debt,0)-reserved,0),0);
 RETURN jsonb_build_object('available',total,'minimum',minimum,'hold_days',holding,'eligible',total>=minimum AND EXISTS(SELECT 1 FROM affiliate_applications WHERE user_id=u AND status='Approved'));
END $$;

CREATE OR REPLACE FUNCTION public.submit_usd_affiliate_payout(p_details jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE u uuid:=auth.uid(); setup jsonb; result jsonb; field text; clean jsonb:='{}'; value text;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(u::text));
 setup:=get_affiliate_payout_setup();
 IF NOT (setup->>'eligible')::boolean THEN RAISE EXCEPTION 'Approved payable balance must reach the minimum payout threshold'; END IF;
 IF jsonb_typeof(p_details) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Bank details required'; END IF;
 IF p_details->>'currency' IS DISTINCT FROM 'USD' OR p_details->>'method' IS DISTINCT FROM 'Bank Transfer' OR p_details->>'usd_confirmed' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'A confirmed USD account is required'; END IF;
 FOREACH field IN ARRAY ARRAY['account_holder','account_number','bank_name','bank_country','payout_country','swift_bic','bank_address'] LOOP
  value:=btrim(coalesce(p_details->>field,''));
  IF length(value)<2 OR length(value)>300 OR value ~ '[[:cntrl:]]' THEN RAISE EXCEPTION 'Missing or invalid bank field: %',field; END IF;
  clean:=clean||jsonb_build_object(field,value);
 END LOOP;
 IF upper(clean->>'swift_bic') !~ '^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$' THEN RAISE EXCEPTION 'Enter a valid 8 or 11 character SWIFT/BIC'; END IF;
 IF upper(clean->>'bank_country') !~ '^[A-Z]{2}$' OR upper(clean->>'payout_country') !~ '^[A-Z]{2}$' THEN RAISE EXCEPTION 'Use two-letter country codes'; END IF;
 value:=btrim(coalesce(p_details->>'routing_number',''));
 IF length(value)>50 OR value ~ '[[:cntrl:]]' THEN RAISE EXCEPTION 'Invalid routing number'; END IF;
 clean:=clean||jsonb_build_object('routing_number',value,'currency','USD','method','Bank Transfer','usd_confirmed',true);
 result:=request_affiliate_payout('Bank Transfer');
 IF NOT coalesce((result->>'created')::boolean,false) THEN RAISE EXCEPTION 'Payout request could not be created'; END IF;
 INSERT INTO affiliate_private.payout_bank_details(payout_id,affiliate_user_id,details) VALUES((result->>'payout_id')::uuid,u,clean);
 RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.admin_get_payout_bank_details(p_payout_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 RETURN (SELECT details FROM affiliate_private.payout_bank_details WHERE payout_id=p_payout_id);
END $$;
REVOKE ALL ON FUNCTION public.get_affiliate_payout_setup(),public.submit_usd_affiliate_payout(jsonb),public.admin_get_payout_bank_details(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_affiliate_payout_setup(),public.submit_usd_affiliate_payout(jsonb),public.admin_get_payout_bank_details(uuid) TO authenticated;
-- Prevent clients bypassing the validated bank submission. The checked wrapper calls this as owner.
REVOKE EXECUTE ON FUNCTION public.request_affiliate_payout(text) FROM PUBLIC,anon,authenticated;
