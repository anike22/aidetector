import { createClient } from 'npm:@supabase/supabase-js@2.103.1';
import { onboardingMessage, retryable } from './core.ts';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey);
const cors = {'Access-Control-Allow-Origin':'https://www.aidetector.cx','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info'};
const json = (body: unknown, status=200) => new Response(JSON.stringify(body), {status,headers:{...cors,'Content-Type':'application/json'}});
async function checked<T>(query: PromiseLike<{data:T,error:any}>) { const {data,error}=await query; if(error) throw new Error(error.message); return data; }
Deno.serve(async req => {
 if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
 if(req.method!=='POST') return json({error:'Method not allowed'},405);
 try {
  const bearer=req.headers.get('authorization') || '';
  const worker=req.headers.get('x-onboarding-worker');
  let authorized=bearer===`Bearer ${serviceKey}`;
  if(!authorized && worker) {
   authorized=await checked(db.rpc('affiliate_onboarding_worker_authorized',{p_token:worker}));
  }
  if(!authorized) return json({error:'Unauthorized'},401);
  const body=await req.json().catch(()=>({}));
  const key=Deno.env.get('RESEND_API_KEY');
  if(!key) return json({error:'Resend is not configured; approval emails remain queued'},503);
  const settings=await checked(db.from('email_settings').select('default_from_name,default_from_email,reply_to_email').limit(1).single());
  if(!settings?.default_from_email) return json({error:'Sender is not configured'},503);
  let accepted=0;
  for(let i=0;i<4;i++) {
   const item=await checked(db.rpc('claim_affiliate_onboarding',{p_application_id:body.applicationId || null}));
   if(!item) break;
   try {
    let message=item.message_json;
    if(!message) {
     const rendered=onboardingMessage(item.snapshot);
     message={from:`${settings.default_from_name || 'AIDetector'} <${settings.default_from_email}>`,to:[item.recipient],...rendered,reply_to:settings.reply_to_email || 'partnerships@aidetector.cx'};
     await checked(db.from('affiliate_onboarding_outbox').update({message_json:message}).eq('user_id',item.user_id));
    }
    // Recheck approval and suppression immediately before contacting the provider.
    const profile=await checked(db.from('profiles').select('affiliate_status').eq('id',item.user_id).single());
    const suppression=await checked(db.from('admin_outreach_suppressions').select('reason').eq('email',item.recipient.toLowerCase()).maybeSingle());
    if(profile?.affiliate_status!=='active' || suppression?.reason==='bounce') {
     await checked(db.from('affiliate_onboarding_outbox').update({state:'cancelled',last_error:'Inactive affiliate or bounced recipient'}).eq('user_id',item.user_id));
     continue;
    }
    const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':`affiliate-activation/${item.user_id}/v1`},body:JSON.stringify(message),signal:AbortSignal.timeout(20000)});
    if(!response.ok) {
     await response.text(); // Do not log credentials or provider response bodies.
     await checked(db.from('affiliate_onboarding_outbox').update({state:retryable(response.status)&&item.attempts<3?'pending':'failed',next_attempt_at:new Date(Date.now()+5*60*1000).toISOString(),last_error:`Email provider rejected request (${response.status})`}).eq('user_id',item.user_id));
     continue;
    }
    const result=await response.json();
    if(!result.id) throw new Error('Email acceptance could not be confirmed');
    await checked(db.from('affiliate_onboarding_outbox').update({state:'sent',provider_message_id:result.id,sent_at:new Date().toISOString(),last_error:null}).eq('user_id',item.user_id));
    accepted++;
    await db.from('email_logs').insert({recipient:item.recipient,recipient_email:item.recipient,user_id:item.user_id,subject:message.subject,template_name:'Affiliate Approval',email_type:'affiliate_approval',status:'sent',provider:'resend',provider_message_id:result.id,sent_at:new Date().toISOString(),metadata:{application_id:item.application_id,onboarding_version:1}});
   } catch {
    // The same stored request and idempotency key are retried only inside the 20h window.
    await checked(db.from('affiliate_onboarding_outbox').update({state:item.attempts<3?'pending':'uncertain',next_attempt_at:new Date(Date.now()+5*60*1000).toISOString(),last_error:'Send outcome uncertain; bounded idempotent retry or provider review required'}).eq('user_id',item.user_id));
   }
  }
  return json({success:true,accepted});
 } catch(error) {
  console.error('Affiliate onboarding failed',error instanceof Error ? error.message : 'Unknown error');
  return json({error:'Could not process activation queue'},500);
 }
});
