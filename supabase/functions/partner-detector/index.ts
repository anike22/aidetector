// Dedicated partner API. Disabled until production migration, key provisioning and E2E tests.
// Never call run-detector from here: it consumes website entitlements.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { analyzeAdvancedText } from '../_shared/detection/engine.ts';
import { runAggressiveDetector } from '../_shared/detection/aggressiveDetector.ts';

const origin = 'https://www.aidetector.cx';
const url = Deno.env.get('SUPABASE_URL') ?? '';
const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const db = createClient(url, service, {auth:{persistSession:false}});
const sha=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const resultSecret=Deno.env.get('PARTNER_RESULT_SIGNING_KEY')||'';
const resultToken=async(id:string)=>{
  if(resultSecret.length<32)throw new Error('Result signing is not configured');
  const cryptoKey=await crypto.subtle.importKey('raw',new TextEncoder().encode(resultSecret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',cryptoKey,new TextEncoder().encode(id)));
  return Array.from(bytes).map(x=>x.toString(16).padStart(2,'0')).join('');
};
const cors=(req:Request)=>{const origin=req.headers.get('origin')||''; return ['https://www.aidetector.cx','https://aidetector.cx'].includes(origin)?{'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'authorization,content-type,x-result-token,idempotency-key','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}:{'Access-Control-Allow-Headers':'authorization,content-type,x-result-token,idempotency-key','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};};
Deno.serve(async req=>{
  const response=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...cors(req)}});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(req)});
  if (req.method!=='POST' && req.method!=='GET') return response({error:'Method not allowed'},405);
  if (!url || !service || resultSecret.length<32) return response({error:'Unavailable'},503);
  try {
    if(req.method==='GET'){
      const u=new URL(req.url);
      const id=u.searchParams.get('id')||'';
      const token=req.headers.get('x-result-token')||'';
      if(!/^[a-f0-9-]{36}$/i.test(id)||! /^[a-f0-9]{64}$/.test(token))return response({error:'Not found'},404);
      const {data,error}=await db.rpc('read_partner_scan',{p_scan:id,p_access_sha:await sha(token)});
      if(error||!data)return response({error:'Not found or expired'},404);
      return response(data);
    }
    // Limit size before parsing and avoid mirroring raw text in errors/logs.
    const raw=await req.text();
    if(raw.length>60000)return response({error:'Too large'},413);
    let body:any;try{body=JSON.parse(raw)}catch{return response({error:'Malformed JSON'},400)}
    const text=body?.text;
    if(typeof text!=='string'||text.trim().length<150||text.length>40000||text.trim().split(/\s+/).length>5000)return response({error:'Text must be 150–40000 characters and at most 5000 words'},400);
    const key=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
    const requestId=req.headers.get('idempotency-key');
    if(!/^aidp_[a-f0-9]{64}$/.test(key)||!requestId||! /^[a-f0-9-]{36}$/i.test(requestId))return response({error:'Unauthorized or missing request id'},401);
    const inputHash=await sha(text);
    const {data:reservation,error:reserveError}=await db.rpc('reserve_partner_scan',{p_key_sha:await sha(key),p_request:requestId,p_input_hash:inputHash});
    if(reserveError)return response({error:'Service unavailable'},503);
    if(reservation?.status==='unauthorized')return response({error:'Unauthorized'},401);
    if(reservation?.status==='conflict')return response({error:'Idempotency conflict'},409);
    if(reservation?.status==='quota')return response({error:'Pilot quota exhausted'},429);
    if(reservation?.status==='pending')return response({error:'Request already processing; retry shortly'},409);
    if(reservation?.status==='failed')return response({error:'Previous request failed; use a new idempotency key'},409);
    // Replays return a stable status only until a safely persisted response replay is implemented.
    if(reservation?.status==='complete'){
      const {data:old,error:oldError}=await db.rpc('partner_api_scan_status',{p_scan:reservation.scan_id});
      if(oldError||old?.state!=='complete'||!old.summary)return response({error:'Previously completed result expired'},410);
      return response({request_id:reservation.scan_id,summary:old.summary,
        result_url:`${origin}/partner-result/${reservation.scan_id}#token=${await resultToken(reservation.scan_id)}`,
        remaining_requests:reservation.remaining,expires_at:old.expires_at});
    }
    if(reservation?.status!=='reserved')return response({error:'Unavailable'},503);
    const scanId=reservation.scan_id;
    const balanced=await analyzeAdvancedText(text);
    const aggressive=await runAggressiveDetector(text,{
      ai:balanced.overall.aiProbability,human:balanced.overall.humanProbability,
      mixed:balanced.overall.mixedProbability,verdict:balanced.overall.verdict,
      risk:balanced.overall.riskLevel,confidence:balanced.overall.confidence,
      confidenceLevel:balanced.overall.confidenceLevel,
      language:balanced.language.primary?.name||'Unknown',full:balanced
    });
    const token=await resultToken(scanId);
    const summary={
      balanced_ai_percent:balanced.overall.aiProbability,
      strict_ai_percent:aggressive.ai,
      language:balanced.language.primary?.name||'Unknown',
      verdict:balanced.overall.verdict,
      disclaimer:'AI-detection scores are estimates, not proof of authorship.'
    };
    const {data:saved,error:saveError}=await db.rpc('complete_partner_scan',{
      p_scan:scanId,p_summary:summary,p_detail:{balanced,aggressive},p_text:text,p_access_sha:await sha(token)
    });
    if(saveError||!saved)return response({error:'Unable to save scan'},503);
    return response({
      request_id:scanId,summary,
      result_url:`${origin}/partner-result/${scanId}#token=${token}`,
      remaining_requests:reservation.remaining,
      expires_at:new Date(Date.now()+86400000).toISOString()
    });
  }catch{
    return response({error:'Analysis unavailable'},503);
  }
});
