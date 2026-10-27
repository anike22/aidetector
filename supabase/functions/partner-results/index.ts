import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.39.3';
const url=Deno.env.get('SUPABASE_URL')||'';
const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const db=createClient(url,service,{auth:{persistSession:false}});
const sha=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
function cors(req:Request){
 const origin=req.headers.get('origin')||'';
 return {'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-result-token','Access-Control-Allow-Methods':'GET,OPTIONS',...(['https://www.aidetector.cx','https://aidetector.cx'].includes(origin)?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{})};
}
Deno.serve(async req=>{
 const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...cors(req)}});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(req)});
 if(req.method!=='GET')return respond({error:'Method not allowed'},405);
 if(!url||!service)return respond({error:'Unavailable'},503);
 const auth=req.headers.get('authorization')||'';
 const {data:{user},error:authError}=await db.auth.getUser(auth.replace(/^Bearer\\s+/i,''));
 if(authError||!user)return respond({error:'Sign in to view full analysis'},401);
 const id=new URL(req.url).searchParams.get('id')||'';
 const token=req.headers.get('x-result-token')||'';
 if(!/^[0-9a-f-]{36}$/i.test(id)||!/^[0-9a-f]{64}$/.test(token))return respond({error:'Invalid or expired result'},404);
 const {data,error}=await db.rpc('partner_full_result',{p_scan:id,p_access_sha:await sha(token),p_user:user.id});
 if(error)return respond({error:'Unable to authorize result'},503);
 if(!data)return respond({error:'Result expired or an active paid account is required'},403);
 return respond(data);
});