import { createClient } from "npm:@supabase/supabase-js@2.103.1";
import { analyzeAdvancedText } from "../_shared/detection/engine.ts";
import { runAggressiveDetector } from "../_shared/detection/aggressiveDetector.ts";
const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
const headers={"content-type":"application/json","access-control-allow-origin":"https://www.aidetector.cx","access-control-allow-headers":"authorization,content-type,apikey","access-control-allow-methods":"POST,OPTIONS"};
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
 const access=crypto.randomUUID()+crypto.randomUUID();
 const {data:reserved,error:e}=await db.rpc("partner_api_reserve",{p_hash:await hash(bearer),p_idempotency:idem,p_access_hash:await hash(access),p_text:body.text});
 if(e)return respond({error:e.message.includes("quota_exceeded")?"quota_exceeded":"invalid_credentials_or_request"},403);
 const row=reserved?.[0];
 if(!row)return respond({error:"reservation_failed"},503);
 if(row.previous){return respond({error:"idempotency_key_already_used",message:"Existing scan must be retrieved through its original result URL"},409);}
 try{
 // Reuse production analysis libraries; do not alter their scoring.
 const result=await analyzeAdvancedText(body.text,{
   contentType:"auto",detectorVersion:"2.6.0",confidenceThreshold:0.5,
   language:"auto",sentenceLevel:true,paragraphLevel:true
 });
 const strict=await runAggressiveDetector(body.text,{
   ai:result.overall.aiProbability,human:result.overall.humanProbability,
   mixed:result.overall.mixedProbability,verdict:result.overall.verdict,
   risk:result.overall.riskLevel,confidence:result.overall.confidence,
   confidenceLevel:result.overall.confidenceLevel,
   language:result.language.primary?.name||"English",full:result
 });
 const saved={balanced:result,aggressive:strict};
 const {error:saveError}=await db.from("partner_api_results").update({status:"complete",result:saved,text_input:""}).eq("id",row.result_id);
 if(saveError)throw Error("result_save_failed");
 const url="https://www.aidetector.cx/partner-results/"+row.result_id+"#"+access;
 return respond({request_id:row.result_id,summary:{balanced_ai_percent:result.overall.aiProbability,strict_ai_percent:strict?.aiScore ?? null,verdict:result.overall.verdict,language:result.language?.primary?.name},result_url:url});
 }catch(_err){await db.from("partner_api_results").update({status:"failed",text_input:""}).eq("id",row.result_id);return respond({error:"analysis_unavailable"},503);}
});
