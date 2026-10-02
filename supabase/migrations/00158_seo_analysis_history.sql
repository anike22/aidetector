-- Cross-device SEO / AI Checker for Bloggers analysis history
create table if not exists public.seo_analysis_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_hash text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, content_hash)
);

create index if not exists seo_analysis_history_user_created_idx
  on public.seo_analysis_history (user_id, created_at desc);

alter table public.seo_analysis_history enable row level security;

drop policy if exists "Users can read own SEO history" on public.seo_analysis_history;
create policy "Users can read own SEO history"
  on public.seo_analysis_history for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own SEO history" on public.seo_analysis_history;
create policy "Users can insert own SEO history"
  on public.seo_analysis_history for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own SEO history" on public.seo_analysis_history;
create policy "Users can update own SEO history"
  on public.seo_analysis_history for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own SEO history" on public.seo_analysis_history;
create policy "Users can delete own SEO history"
  on public.seo_analysis_history for delete
  to authenticated
  using (auth.uid() = user_id);
