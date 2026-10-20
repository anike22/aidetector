-- Run against a seeded test database. Every test mutation is rolled back.
begin;
set local role service_role;
do $test$
declare u uuid; b integer; r record; after_balance integer; settled boolean;
begin
select id into u from profiles where subscription_plan='free' and credits_balance>=20 and public.has_affiliate_testing_grant(id) order by id limit 1;
if u is null then raise exception 'Seed a free affiliate testing account with at least 20 credits before running this regression'; end if;
select credits_balance into b from profiles where id=u for update;
select * into r from reserve_entitlement_and_credits(p_user_id=>u,p_feature_slug=>'plagiarism_check',p_unit_quantity=>100,p_idempotency_key=>'refund-regression-'||gen_random_uuid()::text);
if not r.allowed or r.credits_reserved<>10 then raise exception 'Affiliate reserve failed'; end if;
select credits_balance into after_balance from profiles where id=u;
if after_balance<>b-10 then raise exception 'Reserve deduction mismatch'; end if;
settled:=finalize_credit_reservation(r.reservation_id,'failed','{}','regression_test');
select credits_balance into after_balance from profiles where id=u;
if not settled or after_balance<>b then raise exception 'Failed reservation refund mismatch'; end if;
if finalize_credit_reservation(r.reservation_id,'failed','{}','regression_test') then raise exception 'Double finalize unexpectedly accepted'; end if;
select credits_balance into after_balance from profiles where id=u;
if after_balance<>b then raise exception 'Double refund detected'; end if;
select * into r from reserve_entitlement_and_credits(p_user_id=>u,p_feature_slug=>'plagiarism_check',p_unit_quantity=>100,p_idempotency_key=>'settle-regression-'||gen_random_uuid()::text);
if not r.allowed then raise exception 'Success reserve failed'; end if;
perform finalize_credit_reservation(r.reservation_id,'success');
select credits_balance into after_balance from profiles where id=u;
if after_balance<>b-10 then raise exception 'Successful charge changed'; end if;
if finalize_credit_reservation(r.reservation_id,'failed') then raise exception 'Committed reservation refunded'; end if;
end $test$;
rollback;
select 'Affiliate reservation, failure refund, duplicate-refund prevention and successful-charge tests passed; test mutations rolled back' result;