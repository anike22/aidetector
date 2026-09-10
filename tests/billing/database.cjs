// Isolated PostgreSQL execution of the shipped billing functions and migrations.
// No network, real credentials, or production rows are used.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {PGlite}=require('@electric-sql/pglite');
const root=path.resolve(__dirname,'../..');
const schema=fs.readFileSync(path.join(root,'supabase/schema.sql'),'utf8');
function statement(prefix,end) {const a=schema.indexOf(prefix);assert(a>=0,prefix);return schema.slice(a,schema.indexOf(end,a)+end.length);}
const user='10000000-0000-4000-8000-000000000001', member='10000000-0000-4000-8000-000000000002';
const freeUser='10000000-0000-4000-8000-000000000003', guest='guest-regression-0001';
let db; let count=0;
async function test(name,fn){await fn();console.log('PASS '+name);count++;}
(async()=>{
 db=new PGlite();
 await db.exec(`CREATE ROLE service_role; CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth; CREATE SCHEMA extensions;
 CREATE TYPE public.user_role AS ENUM ('user','admin');
 CREATE TYPE public.order_status AS ENUM ('pending','completed','cancelled','refunded');
 CREATE TYPE public.api_key_environment AS ENUM ('production','staging','development');
 CREATE FUNCTION extensions.uuid_generate_v4() RETURNS uuid LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.user_id',true),'')::uuid $$;
 CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;`);
 for(const name of ['profiles','credit_rate_table','credit_reservations','server_guest_sessions','team_credit_allocations','usage_ledger','orders','plan_prices','api_keys']) {
  await db.exec(statement('CREATE TABLE IF NOT EXISTS "public"."'+name+'"','\n);'));
 }
 await db.exec(`ALTER TABLE profiles ADD PRIMARY KEY(id);
 CREATE UNIQUE INDEX orders_paystack_reference_unique ON orders(paystack_reference) WHERE paystack_reference IS NOT NULL AND status='completed';
 CREATE UNIQUE INDEX rates_slug ON credit_rate_table(feature_slug);
 CREATE UNIQUE INDEX reservations_key ON credit_reservations(idempotency_key) WHERE idempotency_key IS NOT NULL;
 CREATE UNIQUE INDEX teams_member ON team_credit_allocations(owner_id,member_email);`);
 for(const file of ['00142_billing_expiry_and_metering.sql','00143_verified_payment_grants.sql']) await db.exec(fs.readFileSync(path.join(root,'supabase/migrations',file),'utf8'));
 await db.exec(`CREATE TRIGGER profiles_billing_guard BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION protect_billing_columns();
 INSERT INTO profiles(id,email,subscription_plan,subscription_status,plan_start_date,plan_end_date,credits_balance,monthly_credit_allocation,trial_checks_remaining)
 VALUES('${user}','test@example.invalid','pro','active',now(),now()+interval '30 days',300,300,5),
 ('${member}','member@example.invalid','free','active',null,null,0,0,0),
 ('${freeUser}','free@example.invalid','free','active',null,null,0,0,5);
 INSERT INTO server_guest_sessions(guest_id,trial_checks_remaining,trial_checks_used,trial_checks_total)
 VALUES('${guest}',1,0,1);
 INSERT INTO credit_rate_table(feature_slug,feature_name,base_credit_cost,billing_unit,trial_eligible,min_plan)
 VALUES('ai_detector','Detector',1,'words_1000',true,'guest'),('video_detect_forensic','Forensic',6,'video_30s',false,'pro_plus');
 INSERT INTO plan_prices(plan,billing_interval,currency,amount_cents,credits) VALUES('pro','month','usd',1200,300),('pro','year','usd',12000,3600),('business','month','usd',7900,3000);
 SELECT set_config('test.user_id','${user}',false);`);
 const query=async(sql,args)=> (await db.query(sql,args)).rows;
 const reserve=async(slug='ai_detector',qty=100,key=null,guestId=null,metadata={})=> (await query(
   `SELECT * FROM reserve_entitlement_and_credits(p_guest_id:=$4,p_feature_slug:=$1,p_unit_quantity:=$2,p_idempotency_key:=$3,p_metadata:=$5::jsonb)`,
   [slug,qty,key,guestId,JSON.stringify(metadata)]))[0];
 await test('visitor receives one configured check, then stops',async()=>{
   await db.exec(`SELECT set_config('test.user_id','',false)`);
   const first=await reserve('ai_detector',100,'guest-first',guest);assert.equal(first.allowed,true);assert.equal(first.trial_checks_remaining,0);
   assert.equal((await reserve('ai_detector',100,'guest-second',guest)).allowed,false);
   const wrong=(await query(`SELECT * FROM settle_client_reservation($1,'success','{}'::jsonb,$2)`,[first.reservation_id,'wrong-guest']))[0];
   assert.equal(wrong.settled,false);
   const right=(await query(`SELECT * FROM settle_client_reservation($1,'success','{}'::jsonb,$2)`,[first.reservation_id,guest]))[0];
   assert.equal(right.settled,true);
   await db.exec(`SELECT set_config('test.user_id','${user}',false)`);
 });
 await test('free account receives exactly five configured checks',async()=>{
   await db.exec(`SELECT set_config('test.user_id','${freeUser}',false)`);
   for(let i=0;i<5;i++) assert.equal((await reserve('ai_detector',100,'free-'+i)).allowed,true);
   assert.equal((await reserve('ai_detector',100,'free-exhausted')).allowed,false);
   await db.exec(`SELECT set_config('test.user_id','${user}',false)`);
 });
 await test('paid scan debits credits before leftover trial checks',async()=>{
   const r=await reserve();assert.equal(r.allowed,true);assert.equal(r.is_trial_check,false);assert.equal(Number(r.credits_balance),299);
 });
 await test('word count is rounded up',async()=>{const r=await reserve('ai_detector',2500);assert.equal(Number(r.credits_reserved),3);});
 await test('metered requests without quantities fail closed',async()=>{await assert.rejects(()=>reserve('ai_detector',null),/word count required/);});
 await test('minimum plan enforced',async()=>{const r=await reserve('video_detect_forensic',30);assert.equal(r.allowed,false);});
 await test('unknown feature fails closed',async()=>{const r=await reserve('unregistered_cheap_alias');assert.equal(r.allowed,false);});
 await test('duplicate submissions never process or charge twice',async()=>{
   assert.equal((await reserve('ai_detector',100,'duplicate')).allowed,true);
   assert.equal((await reserve('ai_detector',100,'duplicate')).allowed,false);
 });
 await test('idempotency cannot borrow another user reservation',async()=>{
   await db.exec(`SELECT set_config('test.user_id','${member}',false)`);
   assert.equal((await reserve('ai_detector',100,'duplicate')).allowed,false);
   await db.exec(`SELECT set_config('test.user_id','${user}',false)`);
 });
 await test('expiry overrides active status and stops spending',async()=>{
   await db.exec(`UPDATE profiles SET plan_end_date=now()-interval '1 second' WHERE id='${user}'`);
   const s=(await query('SELECT * FROM get_user_entitlement_summary()'))[0];assert.equal(s.is_paid_active,false);assert.equal(s.credits_balance,0);
   assert.equal((await reserve()).allowed,false);
 });
 const grant=async(ref='payment-1',interval='month',amount=1200,currency='usd')=>(await query(`SELECT apply_verified_subscription_payment('paystack',$1,$2,'pro',$3,$4,$5,now()) AS result`,[ref,user,interval,amount,currency]))[0].result;
 await test('verified monthly payment allocates 300 credits and exactly 30 days',async()=>{
   assert.equal((await grant()).granted,true);
   const p=(await query(`SELECT credits_balance,monthly_credit_allocation,trial_checks_remaining,extract(epoch from plan_end_date-plan_start_date)/86400 days FROM profiles WHERE id=$1`,[user]))[0];
   assert.equal(p.credits_balance,300);assert.equal(p.monthly_credit_allocation,300);assert.equal(p.trial_checks_remaining,0);assert.equal(Number(p.days),30);
 });
 await test('callback, duplicate webhook, and webhook retry grant only once',async()=>{await reserve();assert.equal((await grant()).idempotent_replay,true);assert.equal((await query(`SELECT credits_balance FROM profiles WHERE id=$1`,[user]))[0].credits_balance,299);});
 await test('failed or tampered payment grants nothing',async()=>{
   const before=(await query(`SELECT credits_balance FROM profiles WHERE id=$1`,[user]))[0].credits_balance;
   await assert.rejects(()=>grant('bad','month',1),/amount or currency/);await assert.rejects(()=>grant('currency','month',1200,'ngn'),/amount or currency/);
   assert.equal((await query(`SELECT credits_balance FROM profiles WHERE id=$1`,[user]))[0].credits_balance,before);
 });
 await test('grant ledger is not counted as usage',async()=>{const r=await reserve();await query('SELECT finalize_credit_reservation($1)',[r.reservation_id]);const s=(await query('SELECT * FROM get_user_entitlement_summary()'))[0];assert.equal(s.credits_used_total,1);});
 await test('annual purchase grants a month, not a year of credits',async()=>{await grant('annual','year',12000);assert.equal((await query(`SELECT credits_balance FROM profiles WHERE id=$1`,[user]))[0].credits_balance,300);});
 await test('annual monthly refill happens once on read/spend',async()=>{
   await db.exec(`UPDATE profiles SET plan_start_date=now()-interval '2 months',billing_credit_period_start=now()-interval '2 months',credits_balance=12 WHERE id='${user}'`);
   await query('SELECT * FROM get_user_entitlement_summary()');assert.equal((await reserve()).credits_balance,'299');
   await query('SELECT * FROM get_user_entitlement_summary()');assert.equal((await query(`SELECT credits_balance FROM profiles WHERE id=$1`,[user]))[0].credits_balance,299);
 });
 await test('renewal starts a fresh paid period and monthly entitlement',async()=>{
   await db.exec(`UPDATE profiles SET plan_end_date=now()-interval '1 second',subscription_status='expired',credits_balance=0 WHERE id='${user}'`);
   assert.equal((await grant('renewal')).granted,true);
   const p=(await query(`SELECT subscription_status,credits_balance,monthly_credit_allocation,plan_end_date>now() active FROM profiles WHERE id=$1`,[user]))[0];
   assert.equal(p.subscription_status,'active');assert.equal(p.credits_balance,300);assert.equal(p.monthly_credit_allocation,300);assert.equal(p.active,true);
 });
 await test('cancelled subscriptions retain access only through their paid period',async()=>{
   await db.exec(`UPDATE profiles SET subscription_status='cancelled',plan_end_date=now()+interval '1 day',credits_balance=2 WHERE id='${user}'`);
   assert.equal((await reserve()).allowed,true);
   await db.exec(`UPDATE profiles SET plan_end_date=now()-interval '1 second' WHERE id='${user}'`);
   assert.equal((await reserve()).allowed,false);
 });
 await test('upgrade grants Business API; downgrade preserves access until period end',async()=>{
   const grantFor=async(ref,plan,target=freeUser)=>(await query(
     `SELECT apply_verified_subscription_payment('stripe',$1,$2,$3,'month',$4,'usd',now()) AS result`,
     [ref,target,plan,plan==='business'?7900:1200]))[0].result;
   assert.equal((await grantFor('upgrade-business','business')).granted,true);
   await db.exec(`SELECT set_config('test.user_id','${freeUser}',false)`);
   assert.equal((await reserve('api_access',1,'api-business',null,{is_api_key:true})).allowed,true);
   await assert.rejects(()=>grantFor('early-downgrade','pro'),/current paid period ends/);
   assert.equal((await query(`SELECT subscription_plan FROM profiles WHERE id=$1`,[freeUser]))[0].subscription_plan,'business');
   await db.exec(`UPDATE profiles SET plan_end_date=now()-interval '1 second',subscription_status='expired',credits_balance=0 WHERE id='${freeUser}'`);
   assert.equal((await grantFor('period-end-downgrade','pro')).granted,true);
   const downgraded=await reserve('api_access',1,'api-pro',null,{is_api_key:true});
   assert.equal(downgraded.allowed,false);assert.equal(downgraded.error_code,'UPGRADE_REQUIRED');
   await db.exec(`SELECT set_config('test.user_id','${user}',false)`);
 });
 await test('team spend debits both the pool and quota; refund restores both once',async()=>{
   await db.exec(`UPDATE profiles SET subscription_plan='business',subscription_status='active',billing_cycle='monthly',plan_start_date=now(),plan_end_date=now()+interval '30 days',billing_credit_period_start=now(),credits_balance=10 WHERE id='${user}';
   INSERT INTO team_credit_allocations(owner_id,member_user_id,member_email,allocated_credits) VALUES('${user}','${member}','member@example.invalid',10);
   SELECT set_config('test.user_id','${member}',false);`);
   const r=await reserve();assert.equal(r.allowed,true);
   assert.equal((await query(`SELECT credits_balance FROM profiles WHERE id=$1`,[user]))[0].credits_balance,9);
   await query(`SELECT finalize_credit_reservation($1,'failed')`,[r.reservation_id]);
   assert.equal((await query(`SELECT credits_balance FROM profiles WHERE id=$1`,[user]))[0].credits_balance,10);
   assert.equal((await query('SELECT consumed_credits FROM team_credit_allocations'))[0].consumed_credits,0);
   assert.equal((await query(`SELECT finalize_credit_reservation($1,'failed') AS done`,[r.reservation_id]))[0].done,false);
 });
 await test('team members can use Business API entitlement and debit the owner pool',async()=>{
   await db.exec(`SELECT set_config('test.user_id','${member}',false)`);
   const r=await reserve('api_access',1,'team-api',null,{is_api_key:true});assert.equal(r.allowed,true);
   await query(`SELECT finalize_credit_reservation($1,'success')`,[r.reservation_id]);
   assert.equal((await query(`SELECT credits_balance FROM profiles WHERE id=$1`,[user]))[0].credits_balance,9);
   assert.equal((await query(`SELECT consumed_credits FROM team_credit_allocations WHERE member_user_id=$1`,[member]))[0].consumed_credits,1);
   await db.exec(`SELECT set_config('test.user_id','${user}',false)`);
 });
 await test('team management enforces owner identity, plan pool, and Business seat cap',async()=>{
   await db.exec(`SET ROLE authenticated; SELECT set_config('test.user_id','${member}',false)`);
   await assert.rejects(()=>query(`SELECT allocate_team_member_credits($1,'intruder@example.invalid',10)`,[user]),/Not authorized/);
   await db.exec(`RESET ROLE; SELECT set_config('test.user_id','${user}',false)`);
   for(let i=1;i<=4;i++) await query(`SELECT allocate_team_member_credits($1,$2,10)`,[user,`seat${i}@example.invalid`]);
   await assert.rejects(()=>query(`SELECT allocate_team_member_credits($1,'seat6@example.invalid',10)`,[user]),/at most 5/);
   await assert.rejects(()=>query(`SELECT allocate_team_member_credits($1,'member@example.invalid',4000)`,[user]),/exceed/);
   const s=(await query(`SELECT get_team_credit_summary($1) AS result`,[user]))[0].result;
   assert.equal(s.total_pool,300);assert.equal(s.remaining_pool,9);assert.equal(s.allocations.length,5);
 });
 await test('concurrent deductions cannot spend the same final credit twice',async()=>{
   await db.exec(`UPDATE profiles SET subscription_status='active',plan_end_date=now()+interval '30 days',credits_balance=1 WHERE id='${user}'`);
   const attempts=await Promise.all([reserve('ai_detector',100,'race-a'),reserve('ai_detector',100,'race-b')]);
   assert.equal(attempts.filter(r=>r.allowed).length,1);
   assert.equal((await query(`SELECT credits_balance FROM profiles WHERE id=$1`,[user]))[0].credits_balance,0);
   assert.equal((await reserve('ai_detector',100,'race-exhausted')).allowed,false);
 });
 await test('expired owner blocks team spending',async()=>{await db.exec(`UPDATE profiles SET plan_end_date=now()-interval '1 second' WHERE id='${user}'`);assert.equal((await reserve()).allowed,false);});
 console.log(`${count} billing database regression checks passed`);await db.close();
})().catch(async e=>{console.error(e);if(db)await db.close();process.exitCode=1;});
