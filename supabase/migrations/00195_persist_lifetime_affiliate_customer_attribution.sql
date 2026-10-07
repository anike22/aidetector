-- Persist the affiliate/customer relationship after the first qualifying paid conversion.
-- The 30-day attribution window applies only to acquisition. Once acquired, later Paystack
-- renewals continue to credit the same affiliate for the lifetime of that customer relationship.

CREATE TABLE IF NOT EXISTS public.affiliate_customer_attributions (
  referred_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_link_id uuid NOT NULL REFERENCES public.referral_links(id) ON DELETE RESTRICT,
  source_journey_id uuid REFERENCES public.referral_journeys(id) ON DELETE SET NULL,
  commission_rate numeric NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  acquired_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (affiliate_user_id <> referred_user_id)
);

ALTER TABLE public.affiliate_customer_attributions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.affiliate_customer_attributions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.affiliate_customer_attributions TO service_role;

DROP POLICY IF EXISTS deny_client_access ON public.affiliate_customer_attributions;
CREATE POLICY deny_client_access
ON public.affiliate_customer_attributions
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE INDEX IF NOT EXISTS affiliate_customer_attributions_affiliate_idx
  ON public.affiliate_customer_attributions(affiliate_user_id);

-- Backfill established relationships from the earliest recorded commission for each customer.
INSERT INTO public.affiliate_customer_attributions(
  referred_user_id,
  affiliate_user_id,
  referral_link_id,
  source_journey_id,
  commission_rate,
  acquired_at
)
SELECT DISTINCT ON (c.referred_user_id)
  c.referred_user_id,
  c.affiliate_user_id,
  c.referral_link_id,
  (
    SELECT rj.id
    FROM public.referral_journeys rj
    WHERE rj.referred_user_id=c.referred_user_id
      AND rj.referral_link_id=c.referral_link_id
    ORDER BY rj.occurred_at ASC, rj.id ASC
    LIMIT 1
  ),
  COALESCE(c.commission_rate, cfg.commission_rate),
  c.created_at
FROM public.commissions c
CROSS JOIN public.affiliate_program_config cfg
WHERE cfg.id=true
  AND c.referred_user_id IS NOT NULL
  AND c.affiliate_user_id IS NOT NULL
  AND c.referral_link_id IS NOT NULL
  AND c.affiliate_user_id <> c.referred_user_id
ORDER BY c.referred_user_id, c.created_at ASC, c.id ASC
ON CONFLICT (referred_user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.create_verified_affiliate_commission(
  p_provider text,
  p_payment_reference text,
  p_referred_user_id uuid,
  p_plan text,
  p_amount_minor bigint,
  p_currency text,
  p_paid_at timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','auth'
AS $$
DECLARE
  v_journey public.referral_journeys%rowtype;
  v_attr public.affiliate_customer_attributions%rowtype;
  v_affiliate uuid;
  v_affiliate_status text;
  v_rate numeric;
  v_hold integer;
  v_gross numeric;
  v_amount numeric;
  v_id uuid;
  v_is_renewal boolean := false;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'service role required';
  END IF;

  IF lower(coalesce(p_provider,'')) <> 'paystack' THEN
    RETURN jsonb_build_object('created',false,'reason','unsupported_provider');
  END IF;

  IF nullif(trim(p_payment_reference),'') IS NULL
     OR p_referred_user_id IS NULL
     OR p_amount_minor IS NULL
     OR p_amount_minor <= 0
     OR p_paid_at IS NULL THEN
    RETURN jsonb_build_object('created',false,'reason','invalid_payment');
  END IF;

  -- Payment reference is globally idempotent for affiliate commissions.
  SELECT id INTO v_id
  FROM public.commissions
  WHERE payment_reference=p_payment_reference;

  IF v_id IS NOT NULL THEN
    RETURN jsonb_build_object('created',false,'reason','duplicate','commission_id',v_id);
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('affiliate-customer:'||p_referred_user_id::text,0));

  SELECT * INTO v_attr
  FROM public.affiliate_customer_attributions
  WHERE referred_user_id=p_referred_user_id
  FOR UPDATE;

  IF FOUND THEN
    v_affiliate:=v_attr.affiliate_user_id;
    v_rate:=v_attr.commission_rate;
    v_is_renewal:=true;
  ELSE
    -- First paid conversion must still fall inside the configured acquisition window.
    SELECT rj.* INTO v_journey
    FROM public.referral_journeys rj
    JOIN public.referral_links rl ON rl.id=rj.referral_link_id
    WHERE rj.referred_user_id=p_referred_user_id
      AND rj.occurred_at <= p_paid_at
      AND rj.occurred_at >= p_paid_at - make_interval(days=>rl.attribution_window_days)
    ORDER BY rj.occurred_at ASC, rj.id ASC
    LIMIT 1;

    IF v_journey.id IS NULL THEN
      RETURN jsonb_build_object('created',false,'reason','no_attribution');
    END IF;

    SELECT rl.user_id INTO v_affiliate
    FROM public.referral_links rl
    WHERE rl.id=v_journey.referral_link_id;

    IF v_affiliate IS NULL OR v_affiliate=p_referred_user_id THEN
      RETURN jsonb_build_object('created',false,'reason','invalid_affiliate');
    END IF;

    SELECT commission_rate INTO v_rate
    FROM public.affiliate_program_config
    WHERE id=true;

    INSERT INTO public.affiliate_customer_attributions(
      referred_user_id,affiliate_user_id,referral_link_id,source_journey_id,commission_rate,acquired_at
    )
    VALUES(
      p_referred_user_id,v_affiliate,v_journey.referral_link_id,v_journey.id,v_rate,p_paid_at
    )
    ON CONFLICT (referred_user_id) DO NOTHING;

    SELECT * INTO v_attr
    FROM public.affiliate_customer_attributions
    WHERE referred_user_id=p_referred_user_id
    FOR UPDATE;

    IF v_attr.referred_user_id IS NULL THEN
      RAISE EXCEPTION 'Affiliate attribution persistence failed';
    END IF;

    v_affiliate:=v_attr.affiliate_user_id;
    v_rate:=v_attr.commission_rate;
  END IF;

  IF v_affiliate=p_referred_user_id THEN
    RETURN jsonb_build_object('created',false,'reason','self_referral');
  END IF;

  SELECT affiliate_status INTO v_affiliate_status
  FROM public.profiles
  WHERE id=v_affiliate;

  IF coalesce(v_affiliate_status,'') <> 'active' THEN
    RETURN jsonb_build_object('created',false,'reason','affiliate_inactive');
  END IF;

  SELECT hold_days INTO v_hold
  FROM public.affiliate_program_config
  WHERE id=true;

  IF v_hold IS NULL OR v_rate IS NULL THEN
    RAISE EXCEPTION 'Affiliate program configuration unavailable';
  END IF;

  v_gross:=round((p_amount_minor::numeric/100),2);
  v_amount:=round(v_gross*(v_rate/100),2);

  INSERT INTO public.commissions(
    affiliate_user_id,referred_user_id,referral_link_id,commission_type,amount,status,
    eligible_plan,payment_reference,gross_amount,currency,commission_rate,eligible_at
  )
  VALUES(
    v_affiliate,
    p_referred_user_id,
    v_attr.referral_link_id,
    'Percentage',
    v_amount,
    'Pending',
    p_plan,
    p_payment_reference,
    v_gross,
    upper(p_currency),
    v_rate,
    p_paid_at+make_interval(days=>v_hold)
  )
  ON CONFLICT (payment_reference) WHERE payment_reference IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    SELECT id INTO v_id
    FROM public.commissions
    WHERE payment_reference=p_payment_reference;

    RETURN jsonb_build_object('created',false,'reason','duplicate','commission_id',v_id);
  END IF;

  UPDATE public.referral_journeys
  SET stage=CASE WHEN v_is_renewal THEN 'renewal'::referral_journey_stage ELSE 'subscription'::referral_journey_stage END
  WHERE id=v_attr.source_journey_id;

  RETURN jsonb_build_object(
    'created',true,
    'commission_id',v_id,
    'amount',v_amount,
    'currency',upper(p_currency),
    'rate',v_rate,
    'recurring',v_is_renewal,
    'attribution_persisted',true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_verified_affiliate_commission(text,text,uuid,text,bigint,text,timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_verified_affiliate_commission(text,text,uuid,text,bigint,text,timestamptz)
  TO service_role;
