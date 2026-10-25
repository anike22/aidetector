-- Safe service-only replay metadata. Never returns raw text or detailed analysis.
create or replace function public.partner_api_scan_status(p_scan uuid)
returns jsonb language plpgsql security definer set search_path=partner_api,pg_temp as $$
declare v record;
begin
 select state,summary,expires_at into v from partner_api.scans
 where id=p_scan and expires_at>now();
 if not found then return null; end if;
 return jsonb_build_object('state',v.state,'summary',v.summary,'expires_at',v.expires_at);
end $$;
revoke all on function public.partner_api_scan_status(uuid) from public,anon,authenticated;
grant execute on function public.partner_api_scan_status(uuid) to service_role;
