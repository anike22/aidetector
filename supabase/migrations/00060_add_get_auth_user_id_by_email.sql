create or replace function public.get_auth_user_id_by_email(p_email text)
returns table(id uuid, email_confirmed_at timestamptz) as $$
begin
  return query select au.id, au.email_confirmed_at from auth.users au where au.email = p_email;
end;
$$ language plpgsql security definer;

grant execute on function public.get_auth_user_id_by_email(text) to service_role;
grant execute on function public.get_auth_user_id_by_email(text) to anon;
