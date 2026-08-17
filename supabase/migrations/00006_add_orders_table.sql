-- Order status enum
create type order_status as enum ('pending', 'completed', 'cancelled', 'refunded');

-- Orders table
create table public.orders (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id),
    items jsonb not null,
    total_amount numeric(12,2) not null,
    currency text not null default 'usd',
    status order_status not null default 'pending'::order_status,
    stripe_session_id text unique,
    stripe_payment_intent_id text,
    customer_email text,
    customer_name text,
    metadata jsonb,
    completed_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Indexes for faster lookups
create index idx_orders_user_id on public.orders(user_id);
create index idx_orders_stripe_session_id on public.orders(stripe_session_id);
create index idx_orders_status on public.orders(status);

-- RLS Policies
alter table public.orders enable row level security;

-- Users can view their own orders
create policy "Users can view own orders"
    on public.orders for select
    using (auth.uid() = user_id);

-- Only edge functions (service role) can insert/update orders
create policy "Service role can manage orders"
    on public.orders for all
    using (auth.jwt()->>'role' = 'service_role');
