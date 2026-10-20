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

 await db.exec(`CREATE SCHEMA growth_private;
 CREATE TABLE growth_private.quotes(reference text,user_id uuid,plan text,currency text,amount_minor bigint,consumed boolean default false,expires_at timestamptz,access_url text,discounted boolean);
 CREATE TABLE growth_private.offers(user_id uuid,redeemed integer default 0);
 CREATE TABLE growth_private.campaign(id boolean,redeem_until timestamptz);
 CREATE FUNCTION public.has_affiliate_testing_grant(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
 CREATE UNIQUE INDEX plan_price_identity ON plan_prices(plan,billing_interval,currency);`);
 const migration=fs.readdirSync(path.join(root,'supabase/migrations')).find(n=>n.endsWith('_agency_unlimited_annual.sql'));
 await db.exec(fs.readFileSync(path.join(root,'supabase/migrations',migration),'utf8'));
 const seatMigration=fs.readdirSync(path.join(root,'supabase/migrations')).find(n=>n.endsWith('_agency_unlimited_seat_transition.sql'));
 await db.exec(fs.readFileSync(path.join(root,'supabase/migrations',seatMigration),'utf8'));
 const agencyGrant=async(ref='agency-good',amount=250000,interval='year',currency='usd',buyer=user)=>(await query(`SELECT apply_verified_subscription_payment('paystack',$1,$2,'agency_unlimited',$3,$4,$5,now()) AS result`,[ref,buyer,interval,amount,currency]))[0].result;
 await test('agency checkout rejects wrong price, currency, and monthly interval',async()=>{
   await assert.rejects(()=>agencyGrant('cheap',1),/amount or currency/);
   await assert.rejects(()=>agencyGrant('currency',250000,'year','ngn'),/amount or currency/);
   await assert.rejects(()=>agencyGrant('monthly',250000,'month'),/annual/);
 });
 await test('verified $2500 payment grants one year with zero credits and no refill',async()=>{
   assert.equal((await agencyGrant()).granted,true);
   const p=(await query(`SELECT * FROM profiles WHERE id=$1`,[user]))[0];
   assert.equal(p.subscription_plan,'agency_unlimited');assert.equal(p.credits_balance,0);assert.equal(p.credits_refill_date,null);
   assert.ok(new Date(p.plan_end_date)-new Date(p.plan_start_date)>=365*86400000);
 });
 await test('payment replay is idempotent and cannot activate another buyer',async()=>{
   assert.equal((await agencyGrant()).idempotent_replay,true);
   await assert.rejects(()=>agencyGrant('agency-good',250000,'year','usd',member),/identity/);
 });
 await test('agency website tools run without decrementing credits',async()=>{
   for(let i=0;i<20;i++) {const r=await reserve('ai_detector',10000,'agency-'+i);assert.equal(r.allowed,true);assert.equal(Number(r.credits_reserved),0);await query(`SELECT finalize_credit_reservation($1)`,[r.reservation_id]);}
   assert.equal((await reserve('video_detect_forensic',30,'agency-video')).allowed,true);
   for(const slug of ['citation_verifier','hallucination_detector','plagiarism_checker','ai_video_detector','seo_content_studio']) assert.equal((await reserve(slug,100,'alias-'+slug)).allowed,true,slug);
   const s=(await query(`SELECT * FROM get_user_entitlement_summary()`))[0];assert.equal(s.plan,'agency_unlimited');assert.equal(s.warning_level,'normal');assert.equal(s.credits_balance,0);
 });
 await test('unknown tools, duplicate requests, API and bulk remain blocked',async()=>{
   assert.equal((await reserve('unknown')).allowed,false);
   assert.equal((await reserve('ai_detector',10000,'agency-0')).allowed,false);
   assert.equal((await reserve('ai_detector',100,'agency-api',null,{is_api_key:true})).error_code,'AGENCY_FEATURE_EXCLUDED');
   assert.equal((await reserve('api_access',1,'api')).allowed,false);
   await db.exec(`INSERT INTO credit_rate_table(feature_slug,feature_name,base_credit_cost,billing_unit,trial_eligible,min_plan) VALUES('bulk_processing','Bulk',1,'fixed',false,'pro_plus')`);
   assert.equal((await reserve('bulk_processing',1,'bulk')).error_code,'AGENCY_FEATURE_EXCLUDED');
 });
 await test('five-user seat cap includes owner; no credit pool needed',async()=>{
   await query(`SELECT allocate_team_member_credits($1,'member@example.invalid',1)`,[user]);
   for(let i=1;i<=3;i++) await query(`SELECT allocate_team_member_credits($1,$2,1)`,[user,`agency${i}@example.invalid`]);
   await assert.rejects(()=>query(`SELECT allocate_team_member_credits($1,'sixth@example.invalid',1)`,[user]),/five users total/);
 });
 await test('free-profile team member inherits agency access before trial gating',async()=>{
   await db.exec(`SELECT set_config('test.user_id','${member}',false)`);
   const r=await reserve('video_detect_forensic',30,'member-video');assert.equal(r.allowed,true);assert.equal(Number(r.credits_reserved),0);
   await query(`SELECT finalize_credit_reservation($1,'failed')`,[r.reservation_id]);
   const s=(await query(`SELECT * FROM get_user_entitlement_summary()`))[0];assert.equal(s.plan,'agency_unlimited');assert.equal(s.is_paid_active,true);
 });
 await test('removed members immediately lose agency access',async()=>{
   await db.exec(`UPDATE team_credit_allocations SET status='suspended' WHERE member_user_id='${member}'`);
   assert.equal((await reserve('video_detect_forensic',30,'removed')).allowed,false);
   await db.exec(`UPDATE team_credit_allocations SET status='active' WHERE member_user_id='${member}'`);
 });
 await test('cancelled agency retains access until period end, then owner and members stop',async()=>{
   await db.exec(`UPDATE profiles SET subscription_status='cancelled' WHERE id='${user}'`);
   assert.equal((await reserve('video_detect_forensic',30,'cancelled')).allowed,true);
   await db.exec(`UPDATE profiles SET plan_end_date=now()-interval '1 second' WHERE id='${user}'`);
   assert.equal((await reserve('video_detect_forensic',30,'expired-member')).allowed,false);
   await db.exec(`SELECT set_config('test.user_id','${user}',false)`);
   assert.equal((await reserve('ai_detector',100,'expired-owner')).allowed,false);
 });
 await test('refunded agency stops both owner and team',async()=>{
   await db.exec(`UPDATE profiles SET subscription_status='refunded',plan_end_date=now()+interval '1 year' WHERE id='${user}'`);
   assert.equal((await reserve('ai_detector',100,'refund-owner')).allowed,false);
   await db.exec(`SELECT set_config('test.user_id','${member}',false)`);
   assert.equal((await reserve('video_detect_forensic',30,'refund-member')).allowed,false);
 });
 await test('Business-to-agency upgrade suspends seats beyond five total',async()=>{
   await db.exec(`SELECT set_config('test.user_id','${user}',false); UPDATE profiles SET subscription_plan='business',subscription_status='expired',credits_balance=0 WHERE id='${user}';
     INSERT INTO team_credit_allocations(owner_id,member_email,allocated_credits,status) VALUES('${user}','extra@example.invalid',1,'active');`);
   assert.equal((await agencyGrant('agency-seat-transition')).granted,true);
   const rows=await query(`SELECT count(*)::int AS seats FROM team_credit_allocations WHERE owner_id=$1 AND status='active'`,[user]);assert.equal(rows[0].seats,4);
 });
 console.log(`${count} agency checks passed`);await db.close();
})().catch(async e=>{console.error(e);if(db)await db.close();process.exitCode=1;});
