-- Apply each provider payment once, regardless of webhook/return-page order.
BEGIN;
CREATE TABLE public.billing_payments (
  provider text NOT NULL CHECK(provider IN ('stripe','paystack')),
  payment_reference text NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  plan text NOT NULL,
  billing_interval text NOT NULL CHECK(billing_interval IN ('month','year')),
  amount_minor bigint NOT NULL,
  currency text NOT NULL,
  paid_at timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(provider,payment_reference)
);
ALTER TABLE public.billing_payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.billing_payments FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.billing_payments TO service_role;

CREATE OR REPLACE FUNCTION public.apply_verified_subscription_payment(
 p_provider text,p_payment_reference text,p_user_id uuid,p_plan text,p_interval text,
 p_amount_minor bigint,p_currency text,p_paid_at timestamptz,p_order_id uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE price record; monthly record; prior record; p record; period_end timestamptz; old_grant boolean;
BEGIN
 IF current_setting('role',true)<>'service_role' AND session_user<>'postgres' THEN RAISE EXCEPTION 'Service role required'; END IF;
 IF p_provider NOT IN ('stripe','paystack') OR p_payment_reference IS NULL OR length(p_payment_reference) NOT BETWEEN 1 AND 200
 OR p_interval NOT IN ('month','year') OR p_paid_at IS NULL OR p_paid_at>now()+interval '5 minutes' THEN
   RAISE EXCEPTION 'Invalid verified payment';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_provider||':'||p_payment_reference,0));
 SELECT * INTO prior FROM billing_payments WHERE provider=p_provider AND payment_reference=p_payment_reference;
 IF FOUND THEN
   IF prior.user_id<>p_user_id OR prior.plan<>p_plan OR prior.billing_interval<>p_interval OR prior.amount_minor<>p_amount_minor OR prior.currency<>lower(p_currency) THEN
     RAISE EXCEPTION 'Payment identity or amount mismatch';
   END IF;
   RETURN jsonb_build_object('success',true,'granted',true,'idempotent_replay',true,'plan',prior.plan,'period_end',prior.period_end);
 END IF;
 SELECT * INTO p FROM profiles WHERE id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Billing account not found'; END IF;
 IF billing_paid_active(p.subscription_plan,p.subscription_status,p.plan_end_date)
   AND billing_plan_rank(p_plan)<billing_plan_rank(p.subscription_plan) THEN
   RAISE EXCEPTION 'Downgrades can take effect only after the current paid period ends';
 END IF;
 SELECT * INTO price FROM plan_prices WHERE plan=p_plan AND billing_interval=p_interval AND currency=lower(p_currency) AND is_active;
 SELECT * INTO monthly FROM plan_prices WHERE plan=p_plan AND billing_interval='month' AND currency=lower(p_currency) AND is_active;
 IF price IS NULL OR monthly IS NULL OR price.amount_cents<>p_amount_minor THEN RAISE EXCEPTION 'Paid amount or currency does not match plan'; END IF;
 period_end:=CASE WHEN p_interval='year' THEN p_paid_at+interval '1 year' ELSE p_paid_at+interval '30 days' END;
 -- Do not issue new credits for an old payment that was already fulfilled before this migration.
 SELECT EXISTS(SELECT 1 FROM usage_ledger WHERE user_id=p_user_id AND outcome='success'
   AND (ledger_type='subscription' OR operation='grant') AND (
     metadata->>'reference'=p_payment_reference OR metadata->>'session_id'=p_payment_reference
     OR metadata->>'event_id'=p_payment_reference
     OR (p_order_id IS NOT NULL AND metadata->>'order_id'=p_order_id::text))) INTO old_grant;
 IF NOT old_grant AND period_end<=now() THEN RAISE EXCEPTION 'Paid period has already ended; manual reconciliation required'; END IF;
 INSERT INTO billing_payments(provider,payment_reference,user_id,plan,billing_interval,amount_minor,currency,paid_at,period_end)
 VALUES(p_provider,p_payment_reference,p_user_id,p_plan,p_interval,p_amount_minor,lower(p_currency),p_paid_at,period_end);
 IF NOT old_grant THEN
   -- Older deliveries never overwrite a more recent paid period.
   IF p.plan_start_date IS NOT NULL AND p.plan_start_date>p_paid_at THEN RAISE EXCEPTION 'Out-of-order payment requires reconciliation'; END IF;
   UPDATE profiles SET subscription_plan=p_plan,subscription_status='active',
     billing_cycle=CASE WHEN p_interval='year' THEN 'annual' ELSE 'monthly' END,
     plan_start_date=p_paid_at,plan_end_date=period_end,
     billing_credit_period_start=p_paid_at,
     credits_refill_date=CASE WHEN p_interval='year' THEN p_paid_at+interval '1 month' ELSE period_end END,
     monthly_credit_allocation=monthly.credits,credits_balance=monthly.credits,
     trial_checks_remaining=0,updated_at=now() WHERE id=p_user_id;
   UPDATE team_credit_allocations SET consumed_credits=0,updated_at=now() WHERE owner_id=p_user_id;
   INSERT INTO usage_ledger(user_id,feature_slug,operation,credits_amount,outcome,ledger_type,metadata)
   VALUES(p_user_id,'subscription_refill','verified_payment_grant',monthly.credits,'success','subscription',
     jsonb_build_object('provider',p_provider,'payment_reference',p_payment_reference,'period_start',p_paid_at,'period_end',period_end,'plan',p_plan));
 END IF;
 -- Order completion and entitlement grant commit together. Never mark an ungranted payment fulfilled.
 IF p_order_id IS NOT NULL THEN
   UPDATE orders SET status='completed',completed_at=now() WHERE id=p_order_id AND user_id=p_user_id;
   IF NOT FOUND THEN RAISE EXCEPTION 'Payment order ownership mismatch'; END IF;
 ELSIF p_provider='paystack' THEN
   INSERT INTO orders(user_id,items,total_amount,currency,status,paystack_reference,completed_at,metadata)
   VALUES(p_user_id,jsonb_build_array(jsonb_build_object('plan',p_plan,'interval',p_interval)),p_amount_minor/100.0,
     upper(p_currency),'completed',p_payment_reference,now(),jsonb_build_object('plan',p_plan,'interval',p_interval,'type','subscription'))
   ON CONFLICT (paystack_reference) WHERE paystack_reference IS NOT NULL AND status='completed' DO NOTHING;
 END IF;
 RETURN jsonb_build_object('success',true,'granted',true,'plan',p_plan,'period_end',period_end,'legacy_payment',old_grant);
END;
$$;
REVOKE ALL ON FUNCTION public.apply_verified_subscription_payment(text,text,uuid,text,text,bigint,text,timestamptz,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_verified_subscription_payment(text,text,uuid,text,text,bigint,text,timestamptz,uuid) TO service_role;

-- Legacy grant entrypoint has no verified price/currency/user binding. Disable it;
-- both providers now call apply_verified_subscription_payment after API verification.
CREATE OR REPLACE FUNCTION public.process_subscription_refill(p_provider text,p_event_id text,p_customer_email text,p_plan_id text,
 p_billing_cycle text DEFAULT 'monthly',p_period_start timestamptz DEFAULT now(),p_period_end timestamptz DEFAULT(now()+interval '1 month'),
 p_credits_amount integer DEFAULT NULL,p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN RAISE EXCEPTION 'Use the verified payment grant endpoint'; END;
$$;
REVOKE ALL ON FUNCTION public.process_subscription_refill(text,text,text,text,text,timestamptz,timestamptz,integer,jsonb) FROM PUBLIC,anon,authenticated;

-- Scheduled housekeeping is optional for correctness: reads and spends also refresh.
CREATE OR REPLACE FUNCTION public.refresh_due_billing_accounts() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE account record;
BEGIN
 FOR account IN SELECT id FROM profiles WHERE billing_plan_rank(subscription_plan)>=2
   AND ((plan_end_date<=now() AND (credits_balance>0 OR subscription_status<>'expired'))
     OR billing_cycle IN ('annual','year') AND credits_refill_date<=now() AND plan_end_date>now())
 LOOP PERFORM refresh_billing_account(account.id); END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.refresh_due_billing_accounts() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_due_billing_accounts() TO service_role;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
   PERFORM cron.schedule('billing-period-refresh','*/5 * * * *','SELECT public.refresh_due_billing_accounts();');
 END IF;
END $$;
COMMIT;
