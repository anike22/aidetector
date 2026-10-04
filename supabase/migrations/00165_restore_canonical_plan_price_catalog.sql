-- Restore the canonical Paystack subscription price catalog during owned-Supabase migration.
CREATE TABLE IF NOT EXISTS public.plan_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan text NOT NULL,
  billing_interval text NOT NULL CHECK (billing_interval IN ('month','year')),
  currency text NOT NULL DEFAULT 'usd',
  amount_cents integer NOT NULL,
  credits integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan,billing_interval,currency)
);

INSERT INTO public.plan_prices(plan,billing_interval,currency,amount_cents,credits,is_active) VALUES
 ('pro','month','usd',1200,300,true),
 ('pro','year','usd',12000,3600,true),
 ('pro_plus','month','usd',2900,1000,true),
 ('pro_plus','year','usd',29000,12000,true),
 ('business','month','usd',7900,3000,true),
 ('business','year','usd',79000,36000,true)
ON CONFLICT (plan,billing_interval,currency) DO UPDATE
SET amount_cents=EXCLUDED.amount_cents,
    credits=EXCLUDED.credits,
    is_active=true,
    updated_at=now();

ALTER TABLE public.plan_prices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.plan_prices FROM anon,authenticated;
GRANT SELECT ON TABLE public.plan_prices TO service_role;
GRANT ALL ON TABLE public.plan_prices TO postgres;

CREATE OR REPLACE FUNCTION public.get_plan_price(p_plan text,p_interval text)
RETURNS TABLE(p_plan text,p_interval text,p_currency text,p_amount_cents integer,p_credits integer)
LANGUAGE sql SECURITY DEFINER SET search_path='public' AS $$
 SELECT plan,billing_interval,currency,amount_cents,credits
 FROM public.plan_prices
 WHERE lower(plan)=lower(p_plan)
   AND lower(billing_interval)=lower(p_interval)
   AND is_active=true;
$$;
REVOKE ALL ON FUNCTION public.get_plan_price(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_plan_price(text,text) TO service_role;
