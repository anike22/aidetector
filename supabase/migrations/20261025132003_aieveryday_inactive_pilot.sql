-- Provision an inactive AIEVERYDAY pilot record only if the registered account exists.
-- Do not activate access or issue credentials during schema deployment.
insert into partner_api.partners(owner_id,name,enabled,quota,used)
select u.id,'AIEVERYDAY',false,100,0
from auth.users u where u.id='28703673-8b82-4d93-aa3f-ff82d5fe99b5'::uuid
on conflict (owner_id,name) do nothing;
