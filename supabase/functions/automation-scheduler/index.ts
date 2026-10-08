import { createClient } from 'npm:@supabase/supabase-js@2.103.1';
const expectedHash = "65b14c45e215e3ce17328a5314c32047368399ad2a1ef40f943c040f05045f61";
async function authorize(req: Request) {
 if(req.method!=='POST') return Response.json({error:'Method not allowed'},{status:405});
 const token=req.headers.get('x-background-worker-token')||'';
 if(token.length<32||token.length>256) return Response.json({error:'Unauthorized'},{status:401});
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
 const actual=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
 let mismatch=0;for(let i=0;i<actual.length;i++) mismatch|=actual.charCodeAt(i)^expectedHash.charCodeAt(i);
 return mismatch?Response.json({error:'Unauthorized'},{status:401}):null;
}
function client(){
 const url=Deno.env.get('SUPABASE_URL')!;
 if(new URL(url).hostname!=='opivtrfgurwndilnbfmm.supabase.co') throw Error('Destination project mismatch');
 return createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
}

Deno.serve(async(req)=>{
 const denied=await authorize(req);if(denied)return denied;
 try{
 const db=client(),now=new Date().toISOString();
 const {data,error}=await db.from('automation_executions').select('id').or(`and(status.eq.delayed,scheduled_resume_at.lte.${now}),status.eq.running`).order('created_at').limit(100);
 if(error)throw error;
 let processed=0,failed=0;
 for(const execution of data||[]){
 try{const {data:result,error}=await db.rpc('advance_automation_execution',{p_execution_id:execution.id});if(error)throw error;if(result?.processed)processed++;else if(result?.status==='failed')failed++;}
 catch{failed++;}
 }
 return Response.json({success:failed===0,processed,failed},{status:failed?500:200});
 }catch{return Response.json({success:false,error:'Worker operation failed'},{status:500});}
});
