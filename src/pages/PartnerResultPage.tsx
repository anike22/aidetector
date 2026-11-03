import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/db/supabase';

type Summary = {
  balanced_ai_percent: number;
  strict_ai_percent: number;
  language?: string;
  verdict: string;
  disclaimer: string;
};
type FullResult = { detail: Record<string, unknown>; original_text?: string };

const labelFor = (key: string) => key
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .replace(/\b\w/g, c => c.toUpperCase());

function renderValue(value: unknown, key: string, depth = 0): ReactNode {
  if (value === null || value === undefined || value === '') return null;
  if (Array.isArray(value)) {
    if (!value.length) return <p className="text-sm text-slate-500">No data available.</p>;
    return <div className="space-y-3">{value.map((item, index) =>
      <div key={index} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
        {typeof item === 'object' && item !== null
          ? renderValue(item, `${key} item ${index + 1}`, depth + 1)
          : <p className="text-sm leading-6">{String(item)}</p>}
      </div>
    )}</div>;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== undefined && child !== null && child !== '');
    if (!entries.length) return null;
    return <div className={depth === 0 ? 'space-y-4' : 'space-y-3'}>
      {entries.map(([childKey, child]) => {
        const heading = labelFor(childKey);
        const nested = typeof child === 'object' && child !== null;
        return <section key={childKey} className={nested ? 'space-y-2' : 'grid grid-cols-1 gap-1 sm:grid-cols-[minmax(150px,0.35fr)_1fr]'}>
          <h3 className={nested ? 'text-sm font-semibold text-slate-800 dark:text-slate-100' : 'text-sm font-medium text-slate-500'}>{heading}</h3>
          <div className="min-w-0 text-sm leading-6 text-slate-700 dark:text-slate-200">{renderValue(child, childKey, depth + 1)}</div>
        </section>;
      })}
    </div>;
  }
  if (typeof value === 'boolean') return <span>{value ? 'Yes' : 'No'}</span>;
  if (typeof value === 'number') {
    const percentLike = /percent|probability|confidence|risk|score/i.test(key);
    return <span className="tabular-nums">{percentLike && value >= 0 && value <= 100 ? `${value}%` : value.toLocaleString()}</span>;
  }
  return <span className="whitespace-pre-wrap break-words">{String(value)}</span>;
}

export default function PartnerResultPage() {
  const { id } = useParams();
  const [result, setResult] = useState<{ summary: Summary; expires_at: string } | null>(null);
  const [error, setError] = useState('');
  const [full, setFull] = useState<FullResult | null>(null);
  const [fullError, setFullError] = useState('');
  const [loadingFull, setLoadingFull] = useState(false);
  const secretRef = useRef<string | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token');
    secretRef.current = token;
    if (!id || !token) { setError('This protected result link is incomplete.'); return; }
    window.history.replaceState(null, '', window.location.pathname);
    const controller = new AbortController();
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/partner-detector?id=${encodeURIComponent(id)}`, {
      method: 'GET', headers: { 'x-result-token': token }, signal: controller.signal, cache: 'no-store'
    }).then(async response => {
      if (!response.ok) throw new Error('This result is unavailable or has expired.');
      return response.json();
    }).then(setResult).catch(error => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Unable to load this result.');
    });
    return () => controller.abort();
  }, [id]);

  const loadFull = async () => {
    if (!id || !secretRef.current || loadingFull) return;
    setLoadingFull(true);
    setFullError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setFullError('Please sign in with an active paid account to view the full analysis.'); return; }
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/partner-results?id=${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${session.access_token}`, 'x-result-token': secretRef.current }, cache: 'no-store'
      });
      if (!response.ok) {
        setFullError(response.status === 403
          ? 'An active paid account is required, or this result has expired.'
          : 'Full analysis is temporarily unavailable. Please try again.');
        return;
      }
      setFull(await response.json());
    } catch {
      setFullError('Unable to load the full analysis. Please check your connection and try again.');
    } finally {
      setLoadingFull(false);
    }
  };

  return <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-8">
    <header className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">Secure partner report</p>
      <h1 className="text-3xl font-semibold tracking-tight">AI Detection Analysis</h1>
      <p className="text-sm text-slate-500">A concise result preview with access to the detailed AIDetector.cx report.</p>
    </header>
    {error && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
    {!result && !error && <p role="status" className="text-sm text-slate-500">Loading protected result…</p>}
    {result && <section className="space-y-5 rounded-xl border border-slate-200 p-5 shadow-sm dark:border-slate-700 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
          <p className="text-sm text-slate-500">Balanced analysis</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{result.summary.balanced_ai_percent}%</p>
          <p className="text-xs text-slate-500">AI signals</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
          <p className="text-sm text-slate-500">High-sensitivity analysis</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{result.summary.strict_ai_percent}%</p>
          <p className="text-xs text-slate-500">AI signals</p>
        </div>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div><dt className="text-xs uppercase tracking-wide text-slate-500">Language</dt><dd className="font-medium">{result.summary.language || 'Not identified'}</dd></div>
        <div><dt className="text-xs uppercase tracking-wide text-slate-500">Assessment</dt><dd className="font-medium">{labelFor(result.summary.verdict)}</dd></div>
      </dl>
      <p className="text-sm text-slate-600 dark:text-slate-300">{result.summary.disclaimer}</p>
      <p className="text-xs text-slate-500">This secure link expires: <time dateTime={result.expires_at}>{new Date(result.expires_at).toLocaleString()}</time></p>
      <div className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-700">
        <div>
          <h2 className="text-lg font-semibold">Detailed analysis</h2>
          <p className="text-sm text-slate-500">Sentence-level evidence, linguistic indicators and statistical findings are available to signed-in users with an active paid entitlement.</p>
        </div>
        <button type="button" disabled={loadingFull} onClick={() => void loadFull()} className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60">
          {loadingFull ? 'Loading full analysis…' : 'View Full Analysis'}
        </button>
        {fullError && <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">{fullError}</p>}
      </div>
      {full?.detail && <section className="space-y-6 border-t border-slate-200 pt-6 dark:border-slate-700">
        <h2 className="text-2xl font-semibold">Full Analysis Report</h2>
        {(['balanced', 'aggressive'] as const).map((mode) => {
          const section = full.detail?.[mode];
          if (!section) return null;
          return <section key={mode} className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700 sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">{mode === 'balanced' ? 'Balanced detector' : 'High-sensitivity detector'}</p>
              <h3 className="text-xl font-semibold">{mode === 'balanced' ? 'Balanced Analysis' : 'High-Sensitivity Analysis'}</h3>
            </div>
            {renderValue(section, mode)}
          </section>;
        })}
        {full.original_text && <details className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <summary className="cursor-pointer font-medium">View submitted text</summary>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">{full.original_text}</p>
        </details>}
      </section>}
    </section>}
    <footer className="border-t border-slate-200 pt-4 text-center text-xs text-slate-500 dark:border-slate-700">
      Powered by <a href="https://www.aidetector.cx/" className="font-semibold text-sky-600 hover:underline">AIDetector.cx</a> · AI Content Integrity Platform
    </footer>
  </main>;
}
