
-- Enum for product status
CREATE TYPE public.product_status AS ENUM ('draft', 'published', 'archived');

-- Seller products table
CREATE TABLE public.seller_products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text NOT NULL,
  category      text NOT NULL,
  price         numeric(10, 2) NOT NULL CHECK (price >= 0),
  image_url     text,
  demo_url      text,
  tags          text[] DEFAULT '{}',
  status        public.product_status NOT NULL DEFAULT 'draft',
  sales_count   integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_seller_products_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER seller_products_updated_at
  BEFORE UPDATE ON public.seller_products
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_products_updated_at();

-- Enable RLS
ALTER TABLE public.seller_products ENABLE ROW LEVEL SECURITY;

-- Helper: check if caller owns a product
CREATE OR REPLACE FUNCTION can_manage_seller_product(product_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM seller_products WHERE id = product_id AND seller_id = auth.uid()
  );
$$;

-- Policies
-- Anyone can view published products
CREATE POLICY "Public can view published products"
  ON public.seller_products FOR SELECT
  USING (status = 'published');

-- Authenticated sellers can view their own products (any status)
CREATE POLICY "Sellers can view own products"
  ON public.seller_products FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- Authenticated users can insert their own products
CREATE POLICY "Sellers can insert own products"
  ON public.seller_products FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

-- Sellers can update their own products
CREATE POLICY "Sellers can update own products"
  ON public.seller_products FOR UPDATE
  TO authenticated
  USING (can_manage_seller_product(id))
  WITH CHECK (seller_id = auth.uid());

-- Sellers can delete their own products
CREATE POLICY "Sellers can delete own products"
  ON public.seller_products FOR DELETE
  TO authenticated
  USING (can_manage_seller_product(id));

-- Enable realtime for seller_products
ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_products;
