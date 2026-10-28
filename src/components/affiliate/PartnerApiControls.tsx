import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type ApiInfo={enabled:boolean;used:number;quota:number;keys:Array<{id:string;prefix:string;created_at:string;revoked_at:string|null}>};
export default function PartnerApiControls(){
  const [info,setInfo]=useState<ApiInfo|null>(null);
  const [key,setKey]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);
  const base=`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/partner-credentials`;
  const load=async()=>{
    const {data:{session}}=await supabase.auth.getSession();
    if(!session)return;
    const r=await fetch(base,{headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store'});
    if(r.ok)setInfo(await r.json());
  };
  useEffect(()=>{void load()},[]);
  const rotate=async()=>{
    if(!info?.enabled||!window.confirm('Generate a new API key? Any previous key will stop working immediately.'))return;
    setLoading(true);
    try{
      const {data:{session}}=await supabase.auth.getSession();
      if(!session)throw new Error('Please sign in');
      const r=await fetch(base,{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`}});
      const body=await r.json();
      if(!r.ok)throw new Error(body.error||'Unable to rotate key');
      setKey(body.api_key);
      await load();
      toast.success('New key generated; store it securely now');
    }catch(e){toast.error(e instanceof Error?e.message:'Unable to rotate key')}
    finally{setLoading(false)}
  };
  return <div className="space-y-3 border rounded-lg p-4">
    <h3 className="font-medium">API credentials and pilot usage</h3>
    {!info?<p className="text-sm">Credentials not yet enabled for this account.</p>:<>
      <p className="text-sm">Status: {info.enabled?'Enabled':'Pending activation'} · Usage: {info.used}/{info.quota} requests</p>
      <p className="text-sm">Endpoint: /functions/v1/partner-detector</p>
      <ul className="text-sm">{info.keys.map(k=><li key={k.id}>Key {k.prefix}… — {k.revoked_at?'Revoked':'Active'}</li>)}</ul>
      <Button onClick={rotate} disabled={!info.enabled||loading}>{loading?'Working…':'Generate / rotate API key'}</Button>
      {key&&<div className="space-y-2"><p className="font-semibold">Copy this key now. It will not appear again.</p>
        <textarea aria-label="One-time API key" readOnly className="w-full border rounded p-2" value={key}/>
        <Button variant="outline" onClick={()=>{void navigator.clipboard.writeText(key);toast.success('Copied')}}>Copy key</Button>
        <Button variant="outline" onClick={()=>setKey(null)}>Hide key</Button>
      </div>}
    </>}
  </div>;
}
