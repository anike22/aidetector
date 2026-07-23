import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronRight, TrendingUp, Wand2, SkipForward } from 'lucide-react';
import type { WizardState } from './types';
import { streamLLM } from '@/lib/sse';
import { localKeywordDensityFallback } from './localFallbacks';
import { toast } from 'sonner';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface Props {
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

function computeDensity(text: string, keyword: string): number {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean).length || 1;
  const kws = keyword.toLowerCase().split(/\s+/);
  let count = 0;
  const textLow = text.toLowerCase();
  let idx = 0;
  while ((idx = textLow.indexOf(kws[0], idx)) !== -1) { count++; idx++; }
  return parseFloat(((count / words) * 100).toFixed(2));
}

export default function Step8SEOOptimization({ state, onChange, onNext, onBack }: Props) {
  const [analyzing, setAnalyzing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [done, setDone] = useState(state.keywordDensityReport.length > 0);

  const keywords = [state.keyword, ...state.selectedKeywords].filter(Boolean);

  const applyFallback = () => {
    const report = localKeywordDensityFallback(state.fullContent, keywords).map((r) => ({
      keyword: r.keyword,
      count: r.count,
      density: r.density,
      status: (r.status === 'ok' ? 'good' : r.status === 'low' ? 'low' : 'over') as 'good' | 'low' | 'over',
    }));
    onChange({ keywordDensityReport: report });
    setDone(true);
  };

  const handleAnalyze = () => {
    setAnalyzing(true);
    const report = keywords.map((kw) => {
      const density = computeDensity(state.fullContent, kw);
      const count = Math.round((density / 100) * state.fullContent.split(/\s+/).length);
      const status: 'good' | 'low' | 'over' =
        density >= 0.8 && density <= 1.5 ? 'good' : density < 0.8 ? 'low' : 'over';
      return { keyword: kw, count, density, status };
    });
    onChange({ keywordDensityReport: report });
    setDone(true);
    setAnalyzing(false);
  };

  const handleAutoOptimize = async () => {
    setOptimizing(true);
    const lowKeywords = state.keywordDensityReport.filter((r) => r.status !== 'good');
    if (lowKeywords.length === 0) { toast.success('Keyword density is already optimal.'); setOptimizing(false); return; }

    let raw = '';
    await streamLLM({
      contents: [{
        role: 'user',
        parts: [{
          text: `Optimize the keyword density in this article.

Keywords needing adjustment: ${lowKeywords.map((k) => `"${k.keyword}" (current: ${k.density}%, target: 0.8-1.5%)`).join(', ')}

Rules:
- For "low" keywords: naturally incorporate them more into the text
- For "over" keywords: replace some occurrences with synonyms or LSI variants
- Preserve all headings (## markers)
- Keep the same structure and meaning
- Do not add new sections

ARTICLE:
${state.fullContent.slice(0, 8000)}

Return ONLY the optimized article text:`
        }]
      }],
      supabaseUrl,
      supabaseAnonKey,
      onChunk: (t) => { raw += t; },
      onComplete: () => {
        setOptimizing(false);
        onChange({ fullContent: raw });
        const report = keywords.map((kw) => {
          const density = computeDensity(raw, kw);
          const count = Math.round((density / 100) * raw.split(/\s+/).length);
          const status: 'good' | 'low' | 'over' = density >= 0.8 && density <= 1.5 ? 'good' : density < 0.8 ? 'low' : 'over';
          return { keyword: kw, count, density, status };
        });
        onChange({ keywordDensityReport: report });
        toast.success('Keyword density optimized.');
      },
      onError: () => {
        setOptimizing(false);
        toast.info('AI unavailable — density report retained as-is.');
      },
    });
  };

  const statusConfig = {
    good: { label: 'Good', class: 'border-success/40 text-success bg-success/10' },
    low: { label: 'Too Low', class: 'border-warning/40 text-warning bg-warning/10' },
    over: { label: 'Too High', class: 'border-destructive/40 text-destructive bg-destructive/10' },
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-navy mb-1">SEO Optimization</h2>
        <p className="text-sm text-muted-foreground">
          Check keyword density targets (0.8%–1.5%) and auto-optimize if needed.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          className="bg-primary text-primary-foreground gap-2 h-10"
          onClick={handleAnalyze}
          disabled={analyzing}
        >
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
          {done ? 'Re-analyze' : 'Analyze Keyword Density'}
        </Button>
        {done && (
          <Button
            variant="outline"
            className="border-border gap-2 h-10"
            onClick={handleAutoOptimize}
            disabled={optimizing}
          >
            {optimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {optimizing ? 'Optimizing…' : 'Auto-optimize'}
          </Button>
        )}
      </div>

      {done && state.keywordDensityReport.length > 0 && (
        <>
          <Card className="border-border shadow-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold text-navy">Keyword Density Report</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Keyword</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Count</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Density</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Target</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.keywordDensityReport.map((row) => (
                      <tr key={row.keyword} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3 text-navy font-medium whitespace-nowrap">{row.keyword}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">{row.count}×</td>
                        <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">{row.density}%</td>
                        <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">0.8–1.5%</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <Badge variant="outline" className={`text-xs ${statusConfig[row.status].class}`}>
                            {statusConfig[row.status].label}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* NLP keyword hints */}
          <Card className="border-info/20 bg-info/5 border shadow-card">
            <CardContent className="p-4">
              <h4 className="text-xs font-semibold text-info mb-2">NLP / Semantic Keywords to Include</h4>
              <div className="flex flex-wrap gap-2">
                {[...state.lsiKeywords.slice(0, 6)].map((k) => (
                  <Badge key={k} variant="outline" className="border-info/30 text-info text-xs">{k}</Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                These semantic terms improve topical authority. Verify they appear naturally in your content.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" className="h-10 border-border" onClick={onBack}>Back</Button>
        <Button
          className="bg-primary text-primary-foreground gap-2 h-10 px-6"
          onClick={() => {
            if (!done) { applyFallback(); }
            onNext();
          }}
        >
          Continue <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
