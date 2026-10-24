import {createClient} from "npm:@supabase/supabase-js@2.103.1";
const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,"0")).join("");
Deno.serve(async(req)=>{
 const headers={"content-type":"application/json","access-control-allow-origin":"https://www.aidetector.cx","access-control-allow-headers":"authorization,apikey,content-type","access-control-allow-methods":"POST,OPTIONS"};
 if(req.method==="OPTIONS")return new Response("",{headers});
 if(req.method!=="POST")return new Response("{}",{status:405,headers});
 const {id,access_token}=await req.json().catch(()=>({}));
 if(typeof id!=="string"||typeof access_token!=="string")return new Response("{}",{status:400,headers});
 const {data}=await db.from("partner_api_results").select("result,status,expires_at").eq("id",id).eq("access_hash",await hash(access_token)).gt("expires_at",new Date().toISOString()).maybeSingle();
 if(!data)return new Response(JSON.stringify({error:"not_found_or_expired"}),{status:404,headers});
 return new Response(JSON.stringify({status:data.status,result:data.status==="complete"?data.result:null}),{headers});
});