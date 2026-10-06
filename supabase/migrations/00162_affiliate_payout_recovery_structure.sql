-- Production-safe structural parity for affiliate commissions, payouts and chargeback recovery.
-- Deliberately excludes the owned-test-only admin promotion migration.

ALTER TABLE public.commissions
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS gross_amount numeric,
  ADD COLUMN IF NOT EXISTS currency text,
  ADD COLUMN IF NOT EXISTS commission_rate numeric,
  ADD COLUMN IF NOT EXISTS eligible_at timestamptz,
  ADD COLUMN IF NOT EXISTS payout_id uuid,
  ADD COLUMN IF NOT EXISTS reversed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reversal_reason text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_commissions_payment_reference_unique
  ON public.commissions(payment_reference) WHERE payment_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_commissions_payout_id ON public.commissions(payout_id);

ALTER TABLE public.payouts
  ADD COLUMN IF NOT EXISTS recovery_applied numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS provider_reference text,
  ADD COLUMN IF NOT EXISTS provider_transfer_code text,
  ADD COLUMN IF NOT EXISTS provider_recipient_code text,
  ADD COLUMN IF NOT EXISTS provider_status text,
  ADD COLUMN IF NOT EXISTS provider_updated_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS payouts_provider_reference_uidx
  ON public.payouts(provider,provider_reference) WHERE provider_reference IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS payouts_provider_transfer_code_uidx
  ON public.payouts(provider,provider_transfer_code) WHERE provider_transfer_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.affiliate_recovery_balances(
  affiliate_user_id uuid PRIMARY KEY,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.refresh_affiliate_commissions()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $function$
DECLARE v_count integer;
BEGIN
 IF auth.role()<>'service_role' THEN RAISE EXCEPTION 'service role required'; END IF;
 UPDATE public.commissions SET status='Approved',approved_at=coalesce(approved_at,now())
 WHERE status='Pending' AND eligible_at IS NOT NULL AND eligible_at<=now() AND payout_id IS NULL;
 GET DIAGNOSTICS v_count=ROW_COUNT;
 RETURN v_count;
END $function$;

CREATE OR REPLACE FUNCTION public.request_affiliate_payout(p_method text DEFAULT 'Bank Transfer')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $function$
DECLARE v_user uuid:=auth.uid(); v_min numeric; v_total numeric; v_debt numeric; v_reserved numeric;
v_available_debt numeric; v_recovery numeric; v_payable numeric; v_payout uuid;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(v_user::text));
 SELECT minimum_payout INTO v_min FROM public.affiliate_program_config WHERE id=true;
 SELECT coalesce(sum(amount),0) INTO v_total FROM public.commissions
 WHERE affiliate_user_id=v_user AND status='Approved' AND payout_id IS NULL;
 SELECT coalesce(amount,0) INTO v_debt FROM public.affiliate_recovery_balances
 WHERE affiliate_user_id=v_user FOR UPDATE;
 SELECT coalesce(sum(recovery_applied),0) INTO v_reserved FROM public.payouts
 WHERE affiliate_user_id=v_user AND status IN ('Pending','Approved','Processing');
 v_available_debt:=greatest(coalesce(v_debt,0)-coalesce(v_reserved,0),0);
 v_recovery:=least(v_total,v_available_debt);
 v_payable:=greatest(v_total-v_recovery,0);
 IF v_payable<v_min THEN
   RETURN jsonb_build_object('created',false,'reason','minimum_not_met','available',v_payable,
     'gross_approved',v_total,'recovery_balance',coalesce(v_debt,0),
     'recovery_reserved',coalesce(v_reserved,0),'minimum',v_min);
 END IF;
 INSERT INTO public.payouts(affiliate_user_id,amount,status,payout_method,recovery_applied)
 VALUES(v_user,v_payable,'Pending',nullif(trim(p_method),''),v_recovery) RETURNING id INTO v_payout;
 UPDATE public.commissions SET payout_id=v_payout,status='Held'
 WHERE affiliate_user_id=v_user AND status='Approved' AND payout_id IS NULL;
 RETURN jsonb_build_object('created',true,'payout_id',v_payout,'amount',v_payable,'recovery_applied',v_recovery);
END $function$;

CREATE OR REPLACE FUNCTION public.set_affiliate_payout_status(
 p_payout_id uuid,p_status payout_status,p_failed_reason text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $function$
DECLARE v_role text; v_payout public.payouts%rowtype; v_debt numeric;
BEGIN
 SELECT role::text INTO v_role FROM public.profiles WHERE id=auth.uid();
 IF auth.role()<>'service_role' AND coalesce(v_role,'')<>'admin' THEN RAISE EXCEPTION 'Admin access required'; END IF;
 SELECT * INTO v_payout FROM public.payouts WHERE id=p_payout_id FOR UPDATE;
 IF v_payout.id IS NULL THEN RAISE EXCEPTION 'Payout not found'; END IF;
 IF p_status='Approved' AND v_payout.status='Pending' THEN
   UPDATE public.payouts SET status='Approved',approved_at=now(),failed_reason=NULL WHERE id=p_payout_id;
 ELSIF p_status='Processing' AND v_payout.status='Approved' THEN
   UPDATE public.payouts SET status='Processing',failed_reason=NULL WHERE id=p_payout_id;
 ELSIF p_status='Paid' AND v_payout.status IN ('Approved','Processing') THEN
   IF v_payout.recovery_applied>0 THEN
     SELECT amount INTO v_debt FROM public.affiliate_recovery_balances
     WHERE affiliate_user_id=v_payout.affiliate_user_id FOR UPDATE;
     IF coalesce(v_debt,0)<v_payout.recovery_applied THEN
       RAISE EXCEPTION 'Recovery balance changed before payout settlement';
     END IF;
     IF v_debt=v_payout.recovery_applied THEN
       DELETE FROM public.affiliate_recovery_balances WHERE affiliate_user_id=v_payout.affiliate_user_id;
     ELSE
       UPDATE public.affiliate_recovery_balances SET amount=v_debt-v_payout.recovery_applied,updated_at=now()
       WHERE affiliate_user_id=v_payout.affiliate_user_id;
     END IF;
   END IF;
   UPDATE public.payouts SET status='Paid',paid_at=now(),failed_reason=NULL WHERE id=p_payout_id;
   UPDATE public.commissions SET status='Paid',paid_at=now() WHERE payout_id=p_payout_id AND status='Held';
 ELSIF p_status='Failed' AND v_payout.status IN ('Pending','Approved','Processing') THEN
   UPDATE public.payouts SET status='Failed',
     failed_reason=coalesce(nullif(trim(p_failed_reason),''),'Payout failed') WHERE id=p_payout_id;
   UPDATE public.commissions SET status='Approved',payout_id=NULL
   WHERE payout_id=p_payout_id AND status='Held';
 ELSE
   RAISE EXCEPTION 'Invalid payout status transition from % to %',v_payout.status,p_status;
 END IF;
 RETURN jsonb_build_object('updated',true,'payout_id',p_payout_id,'status',p_status,
   'recovery_applied',v_payout.recovery_applied);
END $function$;

CREATE OR REPLACE FUNCTION public.reverse_affiliate_commission(
 p_provider text,p_payment_reference text,p_reason text DEFAULT 'payment_reversed'
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $function$
DECLARE v public.commissions%rowtype; v_debt numeric;
BEGIN
 IF auth.role()<>'service_role' THEN RAISE EXCEPTION 'service role required'; END IF;
 IF lower(coalesce(p_provider,''))<>'paystack' OR nullif(trim(p_payment_reference),'') IS NULL THEN
   RETURN jsonb_build_object('reversed',false,'reason','invalid_reversal');
 END IF;
 SELECT * INTO v FROM public.commissions WHERE payment_reference=p_payment_reference FOR UPDATE;
 IF v.id IS NULL THEN RETURN jsonb_build_object('reversed',false,'reason','commission_not_found'); END IF;
 IF v.reversed_at IS NOT NULL THEN
   RETURN jsonb_build_object('reversed',false,'reason','already_reversed','commission_id',v.id);
 END IF;
 IF v.status='Paid' THEN
   INSERT INTO public.affiliate_recovery_balances(affiliate_user_id,amount,currency)
   VALUES(v.affiliate_user_id,v.amount,coalesce(v.currency,'USD'))
   ON CONFLICT(affiliate_user_id) DO UPDATE
     SET amount=public.affiliate_recovery_balances.amount+excluded.amount,updated_at=now();
   UPDATE public.commissions SET reversed_at=now(),
     reversal_reason=coalesce(nullif(trim(p_reason),''),'payment_reversed') WHERE id=v.id;
   SELECT amount INTO v_debt FROM public.affiliate_recovery_balances WHERE affiliate_user_id=v.affiliate_user_id;
   RETURN jsonb_build_object('reversed',true,'reason','paid_recovery_created',
     'commission_id',v.id,'recovery_balance',v_debt);
 END IF;
 IF v.payout_id IS NOT NULL THEN
   RETURN jsonb_build_object('reversed',false,'reason','payout_reserved','commission_id',v.id);
 END IF;
 UPDATE public.commissions SET status='Expired',reversed_at=now(),
   reversal_reason=coalesce(nullif(trim(p_reason),''),'payment_reversed') WHERE id=v.id;
 RETURN jsonb_build_object('reversed',true,'commission_id',v.id);
END $function$;

REVOKE ALL ON FUNCTION public.refresh_affiliate_commissions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_affiliate_commissions() TO service_role;
REVOKE ALL ON FUNCTION public.reverse_affiliate_commission(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reverse_affiliate_commission(text,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.request_affiliate_payout(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_affiliate_payout(text) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.set_affiliate_payout_status(uuid,payout_status,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_affiliate_payout_status(uuid,payout_status,text) TO authenticated,service_role;
