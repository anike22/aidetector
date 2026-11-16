import { useMemo, useState } from 'react';
import { runBalancedDetector, type BalancedDetectorResult, AnalysisError } from '@/lib/detection/balancedDetectorService';

export default function StandaloneEmbedDetector() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<BalancedDetectorResult | null>(null);
  const [error, setError] = useState('');
  const [usage, setUsage] = useState<{ remaining: number; limit: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const words = useMemo(() => text.trim() ? text.trim().split(/\s+/).length : 0, [text]);

  const analyze = async () => {
    if (words < 20) {
      setError('Please enter at least 20 words to run an analysis.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const analysis = await runBalancedDetector(text, {
        onGuestUsage: setUsage,
        sentenceLevel: true,
        paragraphLevel: true,
      });
      setResult(analysis);
    } catch (cause) {
      if (cause instanceof AnalysisError && cause.code === 'UPGRADE_REQUIRED') {
        setError('Your free checks have been used. Create an account or sign in to continue.');
      } else if (cause instanceof AnalysisError && cause.code === 'AUTH_REQUIRED') {
        setError('Please sign in to continue.');
      } else {
        setError(cause instanceof Error ? cause.message : 'The detector could not analyze this text. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[760px] bg-white p-3 text-slate-900 sm:p-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <img src="/favicon.png" alt="" className="h-8 w-8 rounded-lg object-contain" />
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight">AIDetector.cx</p>
            <p className="text-xs text-slate-500">AI text checker</p>
          </div>
        </div>
        <a href="https://www.aidetector.cx/signup" target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">Start free</a>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <h1 className="text-sm font-semibold">Check your text for AI</h1>
          <span className="text-xs tabular-nums text-slate-500">{words.toLocaleString()} words</span>
        </div>
        <div className="p-3 sm:p-4">
          <textarea
            value={text}
            onChange={(event) => { setText(event.target.value); setError(''); setResult(null); }}
            placeholder="Paste your text here (minimum 20 words)..."
            aria-label="Text to check for AI"
            className="min-h-[170px] w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Your text is analyzed by the AIDetector.cx engine.</p>
            <button type="button" onClick={analyze} disabled={loading || words < 20} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Analyzing…' : 'Detect AI'}
            </button>
          </div>
          {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        </div>
      </section>

      {result && (
        <section aria-live="polite" className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold">Analysis result</h2>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold capitalize text-indigo-800">{result.verdict.replace(/-/g, ' ')}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-white p-3"><p className="text-xs text-slate-500">AI probability</p><p className="mt-1 text-2xl font-bold tabular-nums">{result.ai}%</p></div>
            <div className="rounded-lg bg-white p-3"><p className="text-xs text-slate-500">Human probability</p><p className="mt-1 text-2xl font-bold tabular-nums">{result.human}%</p></div>
            <div className="rounded-lg bg-white p-3"><p className="text-xs text-slate-500">Confidence</p><p className="mt-1 text-2xl font-bold tabular-nums">{result.confidence}%</p></div>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">Results are probabilistic indicators, not proof of authorship. Review the text and context before making decisions.</p>
        </section>
      )}

      {usage && <p className="mt-3 text-right text-xs text-slate-500">{usage.remaining} of {usage.limit} free checks remaining</p>}
      <footer className="mt-4 border-t border-slate-100 pt-3 text-center text-xs text-slate-500">
        AI scanning technology provided by <a href="https://www.aidetector.cx" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 underline">AIDetector.cx</a>
      </footer>
    </main>
  );
}
