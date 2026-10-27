-- Server-only detailed partner results, requiring both capability token and current paid entitlement.
create or replace function public.partner_full_result(p_scan uuid,p_access_sha text,p_user uuid)
returns jsonb language plpgsql security definer set search_path=partner_api,public,pg_temp as $$
declare v_result record; v_ent record;
begin
 if p_user is null then return null; end if;
 select s.detail,s.original_text,s.expires_at into v_result
 from partner_api.scans s where s.id=p_scan and s.access_sha256=p_access_sha
 and s.expires_at>now() and s.state='complete';
 if not found then return null; end if;
 select * into v_ent from public.get_user_entitlement_summary(p_user,null,'UTC') limit 1;
 if v_ent.is_paid_active is distinct from true then return null; end if;
 return jsonb_build_object('detail',v_result.detail,'original_text',v_result.original_text,'expires_at',v_result.expires_at);
end $$;
revoke all on function public.partner_full_result(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.partner_full_result(uuid,text,uuid) to service_role;
