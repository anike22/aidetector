import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

type Summary = {balanced_ai_percent:number;strict_ai_percent:number;language?:string;verdict:string;disclaimer:string};
export default function PartnerResultPage(){
  const {id}=useParams();
  const [result,setResult]=useState<{summary:Summary;expires_at:string}|null>(null);
  const [error,setError]=useState('');
  useEffect(()=>{
    const token=new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token');
    if(!id||!token){setError('This protected result link is incomplete.');return;}
    // Remove the capability token from address bar and browser history after reading it.
    window.history.replaceState(null,'',window.location.pathname);
    const controller=new AbortController();
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/partner-detector?id=${encodeURIComponent(id)}`,{
      method:'GET',headers:{'x-result-token':token},signal:controller.signal,cache:'no-store'
    }).then(async r=>{if(!r.ok)throw new Error('Result unavailable or expired');return r.json();})
      .then(setResult).catch(e=>{if(!controller.signal.aborted)setError(e.message)});
    return ()=>controller.abort();
  },[id]);
  return <main className="mx-auto max-w-2xl p-8 space-y-5">
    <h1 className="text-3xl font-semibold">AI detection summary</h1>
    {error&&<p role="alert">{error}</p>}
    {!result&&!error&&<p>Loading protected result…</p>}
    {result&&<section className="space-y-4 rounded-lg border p-6">
      <p>Balanced analysis: <strong>{result.summary.balanced_ai_percent}% AI signals</strong></p>
      <p>High-sensitivity analysis: <strong>{result.summary.strict_ai_percent}% AI signals</strong></p>
      <p>Language: {result.summary.language||'Not identified'}</p>
      <p>Assessment: {result.summary.verdict}</p>
      <p className="text-sm">{result.summary.disclaimer}</p>
      <p className="text-sm">This link expires: {new Date(result.expires_at).toLocaleString()}</p>
      <p className="text-sm">Detailed passage analysis requires sign-in and an entitlement check and is not available from this guest preview.</p>
      <a href="/signup" className="underline">Create an account to explore detailed analysis</a>
    </section>}
  </main>;
}
