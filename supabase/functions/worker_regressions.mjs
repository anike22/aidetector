import { readFileSync, writeFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
const root=path.dirname(new URL(import.meta.url).pathname);
const auth=stripTypeScriptTypes(readFileSync(root+'/_shared/workerAuth.ts','utf8')).replaceAll('export ','');
const token='x'.repeat(64);const cutoff='2026-10-08T07:30:25.000Z';const now=Date.parse(cutoff);
const evidence=[];
function load(name, clientFactory, env={}) {
 let handler;
 class FixedDate extends Date { constructor(...args){super(...(args.length?args:[now]));}static now(){return now;} }
 const context={ Request,Response,Headers,console:{log(){},error(){}},Date:FixedDate,Set,Map,Error,Promise,JSON,Number,Boolean,String,
 Deno:{env:{get:key=>({BACKGROUND_WORKER_TOKEN:token,AUTOMATION_EVENT_PROCESSING_START_AT:cutoff,...env})[key]},serve:fn=>handler=fn},
 createServiceClient:clientFactory,createClient:clientFactory,corsHeaders:{},executeSingleExecution:()=>{throw Error('Unexpected workflow run');} };
 vm.createContext(context);vm.runInContext(auth,context);
 const code=stripTypeScriptTypes(readFileSync(root+'/'+name+'/index.ts','utf8').replace(/^import .*;\n/gm,''));
 vm.runInContext(code,context);return handler;
}
const names=['refresh-customer-insights','automation-event-processor','automation-scheduler','automation-time-event-generator','personalization','team-invitation-processor','team-analytics-aggregator'];
for(const name of names){
 let privilegedCalls=0;const handler=load(name,()=>{privilegedCalls++;throw Error('Unexpected privileged client');});
 for(const headers of [{},{'apikey':'sb_publishable_fake'},{Authorization:'Bearer ordinary_user_jwt'},{'x-background-worker-token':'y'.repeat(64)}]){
  const response=await handler(new Request('https://example.test',{method:'POST',headers}));assert.equal(response.status,401);
 }
 const options=await handler(new Request('https://example.test',{method:'OPTIONS'}));assert.equal(options.status,405);assert.equal(privilegedCalls,0);
 evidence.push({case:name+' rejects missing/publishable/user/wrong credentials before privileged access',pass:true});
}
function fakeClient({processError=null,updateError=null,noWorkflows=false,profileError=null}={}){
 const calls=[];const client={calls,rpc:async(name,args)=>{calls.push(['rpc',name,args]);return {data:[],error:processError};},from(table){
  let kind='select';const chain={};for(const method of ['select','eq','gte','order','limit','not','or','update','insert','delete'])chain[method]=(...args)=>{calls.push([table,method,...args]);if(['update','insert','delete'].includes(method))kind=method;return chain;};
  chain.then=(resolve,reject)=>Promise.resolve(table==='automation_workflows'?{count:noWorkflows?0:1,error:null}:table==='automation_events'?(kind==='select'?{data:[{id:'event-1',user_id:'user-1',event_type:'example',event_data:{}}],error:null}:{data:null,error:updateError}):table==='customer_profiles'?{data:[{user_id:'user-1'}],error:profileError}:{data:[],error:null}).then(resolve,reject);return chain;
 }};return client;
}
const request=()=>new Request('https://example.test',{method:'POST',headers:{'x-background-worker-token':token,'content-type':'application/json'},body:'{}'});
for(const processError of [{message:'database failed'},null]){
 const client=fakeClient({processError});const h=load('automation-event-processor',()=>client);const response=await h(request());const body=await response.json();
 assert.equal(body.processed,processError?0:1);assert.equal(body.failed,processError?1:0);assert.equal(client.calls.filter(x=>x[1]==='update').length,processError?0:1);assert.equal(client.calls.filter(x=>x[1]==='delete').length,0);
 assert(client.calls.some(x=>x[0]==='automation_events'&&x[1]==='gte'&&x[2]==='created_at'&&x[3]===cutoff));
 evidence.push({case:processError?'failed processing retains event':'successful processing retains processed audit row',pass:true});
}
{
 const client=fakeClient({noWorkflows:true});const body=await (await load('automation-event-processor',()=>client)(request())).json();assert.equal(body.held,'no_active_workflows');assert(!client.calls.some(x=>x[0]==='automation_events'));evidence.push({case:'no workflows leaves queue untouched',pass:true});
}
{
 const client=fakeClient();const response=await load('automation-event-processor',()=>client,{AUTOMATION_EVENT_PROCESSING_START_AT:undefined})(request());assert.equal(response.status,503);assert.equal(client.calls.length,0);evidence.push({case:'unset history cutoff fails closed',pass:true});
}
{
 const client=fakeClient();const response=await load('automation-time-event-generator',()=>client)(request());assert.equal(response.status,200);assert(!client.calls.some(x=>x[0]==='rpc'));
 const filters=client.calls.filter(x=>x[0]==='customer_profiles'&&x[1]==='or').map(x=>x[2]);assert.equal(filters.length,2);
 for(let i=0;i<2;i++){const days=i?30:7;const upper=new Date(now-days*86400000).toISOString();const lower=new Date(now-(days+1)*86400000).toISOString();assert.equal(filters[i],`and(last_login_at.lt.${upper},last_login_at.gte.${lower}),and(last_login_at.is.null,signup_at.lt.${upper},signup_at.gte.${lower})`);}
 evidence.push({case:'distinct bounded 7/8 and 30/31 day windows with signup fallback and no run_sql dependency',pass:true});
}
{
 const client=fakeClient({profileError:{message:'read failed'}});const response=await load('automation-time-event-generator',()=>client)(request());assert.equal(response.status,500);const body=await response.json();assert.equal(body.success,false);assert.equal(body.failed,2);evidence.push({case:'inactivity query failures produce failed status',pass:true});
}
writeFileSync(root+'/worker_regression_results.json',JSON.stringify({tests:evidence.length,passed:evidence.length,evidence},null,2));console.log(JSON.stringify({tests:evidence.length,passed:evidence.length}));
