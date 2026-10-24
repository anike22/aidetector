import {createClient} from "npm:@supabase/supabase-js@2.103.1";
const url=Deno.env.get("SUPABASE_URL")!,key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db=createClient(url,key,{auth:{persistSession:false}});
const h={"access-control-allow-methods":"POST,OPTIONS","content-type":"application/json","access-control-allow-origin":"https://www.aidetector.cx","access-control-allow-headers":"authorization,apikey,content-type"};
const respond=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers:h});
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,"0")).join("");
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("",{headers:h});
 const jwt=req.headers.get("authorization")?.replace(/^Bearer /i,"")||"";
 const {data:{user}}=await db.auth.getUser(jwt);if(!user)return respond({error:"unauthorized"},401);
 const {data:application}=await db.from("affiliate_applications").select("status").eq("user_id",user.id).maybeSingle();
 if(application?.status!=="Approved")return respond({error:"affiliate_not_approved"},403);
 const {data:grant}=await db.from("partner_api_grants").select("enabled").eq("user_id",user.id).maybeSingle();
 if(!grant?.enabled)return respond({error:"partner_api_not_enabled"},403);
 const body=await req.json().catch(()=>({}));
 if(body.action==="status"){const {data}=await db.from("partner_api_keys").select("id,key_prefix,active,used,limit_total,created_at,last_used_at,revoked_at").eq("user_id",user.id);return respond({keys:data||[]});}
 if(body.action==="revoke"&&typeof body.key_id==="string"){await db.from("partner_api_keys").update({active:false,revoked_at:new Date().toISOString()}).eq("id",body.key_id).eq("user_id",user.id);return respond({ok:true});}
 if(body.action!=="create")return respond({error:"unknown_action"},400);
 const {count}=await db.from("partner_api_keys").select("id",{count:"exact",head:true}).eq("user_id",user.id).eq("active",true);
 if((count??0)>0)return respond({error:"revoke_existing_key_before_creating_new_one"},409);
 const raw="aidp_"+crypto.randomUUID().replaceAll("-","")+crypto.randomUUID().replaceAll("-","");
 const {error}=await db.from("partner_api_keys").insert({user_id:user.id,key_hash:await hash(raw),key_prefix:raw.slice(0,13),limit_total:100});
 if(error)return respond({error:"key_creation_failed"},500);
 return respond({api_key:raw,note:"Store securely. This key will not be displayed again."});
});
