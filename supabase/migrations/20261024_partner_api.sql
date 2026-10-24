create table if not exists public.partner_api_keys (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 key_hash text not null unique, key_prefix text not null, active boolean not null default true,
 created_at timestamptz not null default now(), revoked_at timestamptz,
 limit_total int not null default 100 check(limit_total between 0 and 10000),
 used int not null default 0 check(used >= 0), last_used_at timestamptz
);
create table if not exists public.partner_api_results (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
 api_key_id uuid not null references public.partner_api_keys(id), text_input text not null,
 result jsonb, status text not null default 'processing', idempotency_key text not null,
 access_hash text not null, created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '24 hours'),
 unique(api_key_id,idempotency_key)
);
create index if not exists partner_results_expiry on public.partner_api_results(expires_at);
alter table public.partner_api_keys enable row level security;
alter table public.partner_api_results enable row level security;
revoke all on public.partner_api_keys,public.partner_api_results from anon,authenticated;
create or replace function public.partner_api_reserve(p_hash text,p_idempotency text,p_access_hash text,p_text text)
returns table(result_id uuid, owner_id uuid, api_key_id uuid, previous boolean)
language plpgsql security definer set search_path = '' as $$
declare k public.partner_api_keys%rowtype; existing public.partner_api_results%rowtype; rid uuid;
begin
 select * into k from public.partner_api_keys where key_hash=p_hash and active=true and revoked_at is null for update;
 if not found then raise exception 'invalid_api_key'; end if;
 select * into existing from public.partner_api_results where api_key_id=k.id and idempotency_key=p_idempotency;
 if found then
   result_id:=existing.id;owner_id:=k.user_id;api_key_id:=k.id;previous:=true;return next;return;
 end if;
 if k.used>=k.limit_total then raise exception 'quota_exceeded'; end if;
 insert into public.partner_api_results(user_id,api_key_id,idempotency_key,access_hash,text_input)
 values(k.user_id,k.id,p_idempotency,p_access_hash,p_text) returning id into rid;
 update public.partner_api_keys set used=used+1,last_used_at=now() where id=k.id;
 result_id:=rid;owner_id:=k.user_id;api_key_id:=k.id;previous:=false;return next;
end $$;
revoke all on function public.partner_api_reserve(text,text,text,text) from public,anon,authenticated;
grant execute on function public.partner_api_reserve(text,text,text,text) to service_role;
