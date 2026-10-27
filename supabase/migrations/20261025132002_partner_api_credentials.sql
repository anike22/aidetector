-- Owner-scoped partner key metadata and atomic rotation, service-only entry points.
create or replace function public.partner_api_owner_info(p_owner uuid)
returns jsonb language plpgsql security definer set search_path=partner_api,pg_temp as $$
declare v jsonb;
begin
 select jsonb_build_object('enabled',p.enabled,'used',p.used,'quota',p.quota,
 'keys',coalesce((select jsonb_agg(jsonb_build_object('id',k.id,'prefix',k.prefix,'created_at',k.created_at,'revoked_at',k.revoked_at))
 from partner_api.keys k where k.partner_id=p.id),'[]'::jsonb))
 into v from partner_api.partners p where p.owner_id=p_owner and p.name='AIEVERYDAY';
 return v;
end $$;
revoke all on function public.partner_api_owner_info(uuid) from public,anon,authenticated;
grant execute on function public.partner_api_owner_info(uuid) to service_role;
create or replace function public.partner_api_rotate_key(p_owner uuid,p_hash text,p_prefix text)
returns boolean language plpgsql security definer set search_path=partner_api,pg_temp as $$
declare v_id uuid;
begin
 if length(p_hash)<>64 or length(p_prefix)>20 then return false; end if;
 select id into v_id from partner_api.partners
 where owner_id=p_owner and name='AIEVERYDAY' and enabled for update;
 if not found then return false; end if;
 update partner_api.keys set revoked_at=now() where partner_id=v_id and revoked_at is null;
 insert into partner_api.keys(partner_id,secret_sha256,prefix) values(v_id,p_hash,p_prefix);
 return true;
end $$;
revoke all on function public.partner_api_rotate_key(uuid,text,text) from public,anon,authenticated;
grant execute on function public.partner_api_rotate_key(uuid,text,text) to service_role;
