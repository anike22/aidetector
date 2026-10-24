import { createClient } from "npm:@supabase/supabase-js@2.103.1";
const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
const headers={"content-type":"application/json","access-control-allow-origin":"*","access-control-allow-headers":"authorization,content-type,apikey","access-control-allow-methods":"POST,OPTIONS"};
const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,"0")).join("");
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("",{headers});
 if(req.method!=="POST")return respond({error:"method_not_allowed"},405);
 const bearer=req.headers.get("authorization")?.replace(/^Bearer /i,"").trim()||"";
 if(!bearer.startsWith("aidp_"))return respond({error:"unauthorized"},401);
 const body=await req.json().catch(()=>({}));
 if(typeof body.text!=="string"||body.text.trim().split(/\s+/).length>5000||body.text.trim().length<80)return respond({error:"text_must_be_80_chars_to_5000_words"},400);
 const idem=body.idempotency_key;
 if(typeof idem!=="string"||!/^[a-zA-Z0-9-]{16,100}$/.test(idem))return respond({error:"idempotency_key_required"},400);
 const ticket=crypto.randomUUID(), access=crypto.randomUUID()+crypto.randomUUID();
 const {data:reserved,error:e}=await db.rpc("partner_api_reserve",{p_hash:await hash(bearer),p_idempotency:idem,p_access_hash:await hash(access),p_text:body.text});
 if(e)return respond({error:e.message.includes("quota_exceeded")?"quota_exceeded":"invalid_credentials_or_request"},403);
 const row=reserved?.[0];
 if(!row)return respond({error:"reservation_failed"},503);
 if(row.previous){return respond({error:"idempotency_key_already_used",message:"Existing scan must be retrieved through its original result URL"},409);}
 try{
 // Run the exact production engine through the existing detector function with the partner's user JWT not exposed.
 // Integration is deliberately fail-closed until a private engine adapter is configured.
 const adapter=Deno.env.get("PARTNER_DETECTOR_ADAPTER_URL");
 const secret=Deno.env.get("PARTNER_DETECTOR_ADAPTER_SECRET");
 if(!adapter||!secret)throw Error("private_detector_adapter_not_configured");
 const response=await fetch(adapter,{method:"POST",headers:{"authorization":"Bearer "+secret,"content-type":"application/json"},body:JSON.stringify({text:body.text,mode:"balanced"})});
 if(!response.ok)throw Error("detector_adapter_failed");
 const out=await response.json();
 const result=out.data;
 if(!result?.overall)throw Error("invalid_detector_response");
 await db.from("partner_api_results").update({status:"complete",result}).eq("id",row.result_id);
 const url="https://www.aidetector.cx/partner-results/"+row.result_id+"#"+access;
 return respond({request_id:row.result_id,summary:{balanced_ai_percent:result.overall.aiProbability,verdict:result.overall.verdict,language:result.language?.primary?.name},result_url:url});
 }catch(_err){await db.from("partner_api_results").update({status:"failed",text_input:""}).eq("id",row.result_id);return respond({error:"analysis_unavailable"},503);}
});
