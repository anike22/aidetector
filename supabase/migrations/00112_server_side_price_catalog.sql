-- =====================================================================
-- Server-side price catalog: checkout amounts can no longer be supplied
-- by the client. All checkout + verify functions must look prices up
-- here and verify the actually-paid amount against this catalog.
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.plan_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan text NOT NULL,
  billing_interval text NOT NULL CHECK (billing_interval IN ('month', 'year')),
  currency text NOT NULL DEFAULT 'usd',
  amount_cents integer NOT NULL,
  credits integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan, billing_interval, currency)
);

-- Canonical prices (must match the pricing page exactly).
INSERT INTO public.plan_prices (plan, billing_interval, currency, amount_cents, credits) VALUES
  ('pro', 'month', 'usd', 1200, 300),
  ('pro', 'year', 'usd', 12000, 3600),
  ('pro_plus', 'month', 'usd', 2900, 1000),
  ('pro_plus', 'year', 'usd', 29000, 12000),
  ('business', 'month', 'usd', 7900, 3000),
  ('business', 'year', 'usd', 79000, 36000)
ON CONFLICT (plan, billing_interval, currency) DO UPDATE
  SET amount_cents = EXCLUDED.amount_cents,
      credits = EXCLUDED.credits,
      updated_at = now();

-- Service-role only: prices are never client-writable.
ALTER TABLE public.plan_prices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.plan_prices FROM anon, authenticated;
GRANT SELECT ON TABLE public.plan_prices TO service_role;
GRANT ALL ON TABLE public.plan_prices TO postgres;

-- Helper: authorize a checkout request (plan + interval -> catalog row).
CREATE OR REPLACE FUNCTION public.get_plan_price(p_plan text, p_interval text)
RETURNS TABLE(p_plan text, p_interval text, p_currency text, p_amount_cents integer, p_credits integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT plan, billing_interval, currency, amount_cents, credits
  FROM public.plan_prices
  WHERE lower(plan) = lower(p_plan)
    AND lower(billing_interval) = lower(p_interval)
    AND is_active = true;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_plan_price(text, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_plan_price(text, text) TO service_role;

-- Track external Paystack references on orders for idempotent grants.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paystack_reference text;

-- Allow only one completed order per external payment reference (blocks
-- double grants from repeated verify calls / webhook + verify races).
CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_session_unique
  ON public.orders (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL AND status = 'completed';

CREATE UNIQUE INDEX IF NOT EXISTS orders_paystack_reference_unique
  ON public.orders (paystack_reference)
  WHERE paystack_reference IS NOT NULL AND status = 'completed';
