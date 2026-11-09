create table if not exists public.agency_outreach_prospects (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text,
  organization text not null,
  website text,
  source_url text,
  status text not null default 'draft' check (status in ('draft','approved','sent','replied','interested','not_interested','blocked')),
  notes text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists agency_outreach_prospects_email_lower_uidx
  on public.agency_outreach_prospects (lower(email));
alter table public.agency_outreach_prospects enable row level security;
drop policy if exists "Agency outreach admins can manage prospects" on public.agency_outreach_prospects;
create policy "Agency outreach admins can manage prospects"
  on public.agency_outreach_prospects
  for all to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());
grant select, insert, update, delete on public.agency_outreach_prospects to authenticated;
