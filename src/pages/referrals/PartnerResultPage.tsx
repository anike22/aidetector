import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PartnerResultPage() {
 const { id } = useParams();
 const [state,setState] = useState<'loading'|'complete'|'error'>('loading');
 const [result,setResult] = useState<any>(null);
 const [summary,setSummary] = useState<any>(null);
 const [locked,setLocked] = useState(false);
 useEffect(() => {
   const access_token = window.location.hash.slice(1);
   if(!id || !access_token){setState('error');return;}
   // Remove token from address history after capturing it.
   window.history.replaceState(null,'',window.location.pathname);
   let canceled=false;
   supabase.functions.invoke('partner-result',{body:{id,access_token}}).then(({data,error})=>{
     if(canceled)return;
     if(error || data?.status!=='complete'){setState('error');return;}
     setSummary(data.summary);setResult(data.result);setLocked(Boolean(data.details_locked));setState('complete');
   }).catch(()=>{if(!canceled)setState('error');});
   return()=>{canceled=true;};
 },[id]);
 return <main className="max-w-4xl mx-auto p-6 space-y-6">
  <h1 className="text-2xl font-semibold">AIDetector.cx — Full Analysis</h1>
  {state==='loading' && <p>Loading your secure analysis…</p>}
  {state==='error' && <p>This analysis is unavailable or its secure link has expired.</p>}
  {state==='complete' && summary && <>
    <Card><CardHeader><CardTitle>Balanced analysis</CardTitle></CardHeader><CardContent className="space-y-3">
      <p>AI signal: {summary.balanced_ai_percent ?? 'N/A'}%</p>
      <p>Verdict: {summary.verdict || 'N/A'}</p>
      <p>Language: {summary.language || 'Unknown'}</p>
      <p className="text-sm text-muted-foreground">Detection is probabilistic and does not establish authorship.</p>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>High-sensitivity analysis</CardTitle></CardHeader><CardContent><p>AI signal: {summary.strict_ai_percent ?? 'N/A'}%</p></CardContent></Card>
    {locked && <Card><CardHeader><CardTitle>Unlock full analysis</CardTitle></CardHeader><CardContent><p className="mb-3">Sign in with an eligible paid account to see sentence-level details and supporting evidence.</p><a href="/pricing" className="underline text-primary">View plans</a></CardContent></Card>}
    {result && <Card><CardHeader><CardTitle>Detailed analysis evidence</CardTitle></CardHeader><CardContent>
      <pre className="text-xs whitespace-pre-wrap break-words max-h-[600px] overflow-auto">{JSON.stringify(result.balanced?.paragraphs ?? result.balanced?.sentences ?? result.balanced?.passages ?? result.balanced?.explanations ?? {},null,2)}</pre>
    </CardContent></Card>}
  </>}
 </main>;
}
