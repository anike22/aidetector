-- Service-only bridge: PostgREST exposes public, not the private partner_api schema.
create or replace function public.reserve_partner_scan(p_key_sha text,p_request uuid,p_input_hash text)
returns jsonb language sql security definer set search_path = partner_api,pg_temp
as $$ select partner_api.reserve_scan(p_key_sha,p_request,p_input_hash) $$;
revoke all on function public.reserve_partner_scan(text,uuid,text) from public,anon,authenticated;
grant execute on function public.reserve_partner_scan(text,uuid,text) to service_role;
-- Service-only completion, with ownership restricted by reserved UUID and state.
create or replace function public.complete_partner_scan(p_scan uuid,p_summary jsonb,p_detail jsonb,p_text text,p_access_sha text)
returns boolean language plpgsql security definer set search_path = partner_api,pg_temp as $$
begin
 if p_summary is null or p_access_sha is null then return false; end if;
 update partner_api.scans set state='complete', summary=p_summary,
 detail=p_detail,original_text=p_text,access_sha256=p_access_sha
 where id=p_scan and state='pending' and expires_at>now();
 return found;
end $$;
revoke all on function public.complete_partner_scan(uuid,jsonb,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.complete_partner_scan(uuid,jsonb,jsonb,text,text) to service_role;
create or replace function public.read_partner_scan(p_scan uuid,p_access_sha text)
returns jsonb language plpgsql security definer set search_path=partner_api,pg_temp as $$
declare v record;
begin
 select summary,expires_at into v from partner_api.scans
 where id=p_scan and state='complete' and expires_at>now()
 and access_sha256=p_access_sha;
 if not found then return null; end if;
 return jsonb_build_object('summary',v.summary,'expires_at',v.expires_at);
end $$;
revoke all on function public.read_partner_scan(uuid,text) from public,anon,authenticated;
grant execute on function public.read_partner_scan(uuid,text) to service_role;
-- Deliberately return summary only; detailed results require a separately audited
-- authenticated entitlement-aware result endpoint.
