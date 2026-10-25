import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
const url=Deno.env.get('SUPABASE_URL')||'';
const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const admin=createClient(url,service,{auth:{persistSession:false}});
const json=(x:unknown,status=200)=>new Response(JSON.stringify(x),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
Deno.serve(async req=>{
 if(req.method!=='GET'&&req.method!=='POST')return json({error:'Method not allowed'},405);
 if(!url||!service)return json({error:'Unavailable'},503);
 const jwt=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
 if(!jwt)return json({error:'Sign in required'},401);
 const {data:{user},error}=await admin.auth.getUser(jwt);
 if(error||!user)return json({error:'Sign in required'},401);
 // The service-role RPC remains strictly server-side and always uses the
 // authenticated owner's user ID, never a user-controlled ID.
 const {data:info,error:infoError}=await admin.rpc('partner_api_owner_info',{p_owner:user.id});
 if(infoError)return json({error:'Unavailable'},503);
 if(!info)return json({error:'Partner API access not granted'},403);
 if(req.method==='GET')return json(info);
 if(!info.enabled)return json({error:'Partner API access pending activation'},403);
 const nonce=crypto.getRandomValues(new Uint8Array(32));
 const secret='aidp_'+Array.from(nonce).map(x=>x.toString(16).padStart(2,'0')).join('');
 const {data:success,error:rotateError}=await admin.rpc('partner_api_rotate_key',{
   p_owner:user.id,p_hash:await hash(secret),p_prefix:secret.slice(0,13)
 });
 if(rotateError||!success)return json({error:'Unable to rotate key'},503);
 return json({api_key:secret,warning:'Store this key now. It will not be displayed again. Previous keys were revoked.'});
});
