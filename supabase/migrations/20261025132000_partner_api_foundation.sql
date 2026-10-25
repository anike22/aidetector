-- AIEVERYDAY limited partner API: private, opt-in, fail-closed.
-- Apply to production ONLY after schema and authorization review.
create schema if not exists partner_api;
revoke all on schema partner_api from public, anon, authenticated;
create table if not exists partner_api.partners (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null,
 enabled boolean not null default false,
 quota integer not null default 100 check (quota between 0 and 10000),
 used integer not null default 0 check (used >= 0),
 created_at timestamptz not null default now(),
 unique(owner_id,name)
);
create table if not exists partner_api.keys (
 id uuid primary key default gen_random_uuid(),
 partner_id uuid not null references partner_api.partners(id) on delete cascade,
 secret_sha256 text not null unique check (length(secret_sha256)=64),
 prefix text not null,
 revoked_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists partner_api.scans (
 id uuid primary key default gen_random_uuid(),
 partner_id uuid not null references partner_api.partners(id) on delete cascade,
 idempotency_key uuid not null,
 input_hash text not null,
 state text not null default 'pending' check (state in ('pending','complete','failed')),
 summary jsonb,
 detail jsonb,
 original_text text,
 access_sha256 text,
 expires_at timestamptz not null default(now()+ interval '24 hours'),
 created_at timestamptz not null default now(),
 unique(partner_id,idempotency_key)
);
create index if not exists partner_scans_expiry_idx on partner_api.scans(expires_at);
alter table partner_api.partners enable row level security;
alter table partner_api.keys enable row level security;
alter table partner_api.scans enable row level security;
revoke all on all tables in schema partner_api from public, anon, authenticated;
-- Use service-role credentials only from the Edge Function. This RPC is not exposed to users.
create or replace function partner_api.reserve_scan(p_key_sha text,p_request uuid,p_input_hash text)
returns jsonb language plpgsql security invoker set search_path = partner_api, pg_temp as $$
declare v_partner partner_api.partners%rowtype; v_scan partner_api.scans%rowtype;
begin
 select p.* into v_partner from partner_api.keys k join partner_api.partners p on p.id=k.partner_id
 where k.secret_sha256=p_key_sha and k.revoked_at is null and p.enabled
 for update of p;
 if not found then return jsonb_build_object('status','unauthorized'); end if;
 select * into v_scan from partner_api.scans where partner_id=v_partner.id and idempotency_key=p_request;
 if found then
   if v_scan.input_hash <> p_input_hash then return jsonb_build_object('status','conflict'); end if;
   return jsonb_build_object('status',v_scan.state,'scan_id',v_scan.id,'remaining',greatest(0,v_partner.quota-v_partner.used));
 end if;
 if v_partner.used >= v_partner.quota then return jsonb_build_object('status','quota'); end if;
 insert into partner_api.scans(partner_id,idempotency_key,input_hash)
 values(v_partner.id,p_request,p_input_hash) returning * into v_scan;
 update partner_api.partners set used=used+1 where id=v_partner.id;
 return jsonb_build_object('status','reserved','scan_id',v_scan.id,'remaining',v_partner.quota-v_partner.used-1);
end $$;
revoke all on function partner_api.reserve_scan(text,uuid,text) from public,anon,authenticated;
grant usage on schema partner_api to service_role;
grant all on all tables in schema partner_api to service_role;
grant execute on function partner_api.reserve_scan(text,uuid,text) to service_role;
-- Keys must be generated securely, hashed before storage, and revealed once.
-- Neither this migration nor initial deployment creates or enables a live partner key.
