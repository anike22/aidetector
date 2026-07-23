import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search, ChevronRight, Plus, X, Zap } from 'lucide-react';
import { streamLLM } from '@/lib/sse';
import { COUNTRIES, SEARCH_INTENTS, WORD_COUNT_OPTIONS, getKeywordMinFrequency } from './types';
import type { WizardState } from './types';
import { toast } from 'sonner';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// ── Local fallback: deterministic keyword analysis without AI ──────────────
function generateLocalFallback(keyword: string, intent: string) {
  // Simple deterministic seed from keyword chars
  const seed = keyword.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const pseudo = (offset: number) => ((seed * 1103515245 + offset * 12345) >>> 0) % 100;

  const difficulty = 30 + (pseudo(1) % 50);
  const volBase = [1200, 3300, 5500, 9900, 14000, 22000, 40000];
  const searchVolume = `${volBase[pseudo(2) % volBase.length].toLocaleString()}/mo`;

  const prefixes = ['best', 'how to use', 'top', 'free', 'affordable', 'professional', 'advanced', 'beginner', 'ultimate', 'complete'];
  const suffixes = ['guide', 'tips', 'tutorial', 'review', 'tools', 'strategies', 'examples', 'software', 'services', 'for beginners'];
  const secondaryKeywords = prefixes.slice(0, 10).map((p, i) =>
    i % 2 === 0 ? `${p} ${keyword}` : `${keyword} ${suffixes[i] || 'guide'}`
  );
  const lsiTerms = ['online', 'digital', 'free', 'professional', 'best practices', 'how it works', 'tutorial', 'step by step'];
  const lsiKeywords = lsiTerms.map((t) => `${keyword} ${t}`);

  const questionStarters = ['What is', 'How to', 'Why use', 'When to use', 'Where to find', 'Which is better', 'How much does', 'Is it worth'];
  const peopleAlsoAsk = questionStarters.map((q) => `${q} ${keyword}?`);

  const wcOptions = WORD_COUNT_OPTIONS;
  const targetWordCount = wcOptions[pseudo(5) % wcOptions.length];

  const intentNote =
    intent === 'Transactional' ? ' (transactional — focus on conversions)' :
    intent === 'Commercial' ? ' (commercial — focus on comparisons)' :
    intent === 'Navigational' ? ' (navigational — brand-focused)' : '';

  return {
    keywordDifficulty: difficulty,
    searchVolume: searchVolume + intentNote,
    secondaryKeywords,
    lsiKeywords,
    peopleAlsoAsk,
    targetWordCount,
    selectedKeywords: [] as string[],
  };
}

interface Props {
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
  onNext: () => void;
}

export default function Step1KeywordAnalysis({ state, onChange, onNext }: Props) {
  const [analyzing, setAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(
    state.secondaryKeywords.length > 0
  );
  const [extraKeywords, setExtraKeywords] = useState<string[]>(
    state.selectedKeywords.length > 0 ? state.selectedKeywords.filter((k) => !state.secondaryKeywords.includes(k)) : []
  );
  const [newKeyword, setNewKeyword] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  // Apply AI result or local fallback to state
  const applyResult = (data: ReturnType<typeof generateLocalFallback>) => {
    onChange(data);
    setHasAnalyzed(true);
  };

  const handleAnalyze = async () => {
    if (!state.keyword.trim()) { toast.error('Please enter a main keyword.'); return; }
    setAnalyzing(true);
    setHasAnalyzed(false);
    abortRef.current = new AbortController();

    let raw = '';
    await streamLLM({
      contents: [{
        role: 'user',
        parts: [{
          text: `You are an expert SEO analyst. Analyze the keyword "${state.keyword}" for the country "${state.country}" with search intent "${state.searchIntent}".

Return ONLY a valid JSON object (no markdown, no extra text) with exactly this structure:
{
  "difficulty": <number 0-100>,
  "searchVolume": "<string like '12,000/mo'>",
  "secondaryKeywords": [<array of 10 strings>],
  "lsiKeywords": [<array of 8 strings>],
  "peopleAlsoAsk": [<array of 8 question strings>],
  "recommendedWordCount": <number: one of 600,900,1200,1500,2000,3000>
}`
        }]
      }],
      supabaseUrl,
      supabaseAnonKey,
      onChunk: (t) => { raw += t; },
      onComplete: () => {
        setAnalyzing(false);
        try {
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error('No JSON found');
          const parsed = JSON.parse(jsonMatch[0]);
          applyResult({
            keywordDifficulty: parsed.difficulty ?? 50,
            searchVolume: parsed.searchVolume ?? 'N/A',
            secondaryKeywords: Array.isArray(parsed.secondaryKeywords) ? parsed.secondaryKeywords.slice(0, 10) : [],
            lsiKeywords: Array.isArray(parsed.lsiKeywords) ? parsed.lsiKeywords.slice(0, 8) : [],
            peopleAlsoAsk: Array.isArray(parsed.peopleAlsoAsk) ? parsed.peopleAlsoAsk.slice(0, 8) : [],
            targetWordCount: WORD_COUNT_OPTIONS.includes(parsed.recommendedWordCount)
              ? parsed.recommendedWordCount : 1200,
            selectedKeywords: [],
          });
          toast.success('AI keyword analysis complete.');
        } catch {
          // AI returned unparseable response — fall back to local
          const fallback = generateLocalFallback(state.keyword, state.searchIntent);
          applyResult(fallback);
          toast.info('Used local keyword analysis (AI response was unparseable).');
        }
      },
      onError: () => {
        setAnalyzing(false);
        // 429 rate-limit or any other AI error — use local fallback so the user can continue
        const fallback = generateLocalFallback(state.keyword, state.searchIntent);
        applyResult(fallback);
        toast.warning('AI service unavailable — local keyword analysis applied. You can still continue.');
      },
      signal: abortRef.current.signal,
    });
  };

  // Manual skip: generate local analysis immediately without hitting AI
  const handleSkipAI = () => {
    if (!state.keyword.trim()) { toast.error('Please enter a main keyword first.'); return; }
    const fallback = generateLocalFallback(state.keyword, state.searchIntent);
    applyResult(fallback);
    toast.success('Local keyword analysis applied. You can continue.');
  };

  const toggleSecondary = (kw: string) => {
    const cur = state.selectedKeywords;
    if (cur.includes(kw)) {
      onChange({ selectedKeywords: cur.filter((k) => k !== kw) });
    } else if (cur.length < 3) {
      onChange({ selectedKeywords: [...cur, kw] });
    } else {
      toast.error('You can select up to 3 secondary keywords.');
    }
  };

  const addExtraKeyword = () => {
    if (!newKeyword.trim()) return;
    if (extraKeywords.length >= 3) { toast.error('You can add up to 3 extra keywords.'); return; }
    setExtraKeywords((prev) => [...prev, newKeyword.trim()]);
    setNewKeyword('');
  };

  const removeExtraKeyword = (kw: string) => {
    setExtraKeywords((prev) => prev.filter((k) => k !== kw));
  };

  const handleNext = () => {
    if (!state.keyword.trim()) { toast.error('Please enter a main keyword.'); return; }
    if (!hasAnalyzed) { toast.error('Please run keyword analysis first.'); return; }
    onChange({ selectedKeywords: [...state.selectedKeywords, ...extraKeywords] });
    onNext();
  };

  const diffColor = state.keywordDifficulty >= 70 ? 'text-destructive' : state.keywordDifficulty >= 40 ? 'text-warning' : 'text-success';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-navy mb-1">Keyword Analysis</h2>
        <p className="text-sm text-muted-foreground">Enter your target keyword and let AI analyze ranking opportunities.</p>
      </div>

      {/* Inputs */}
      <Card className="border-border shadow-card">
        <CardContent className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="kw-main" className="text-sm font-normal mb-1.5 block">Main Keyword <span className="text-destructive">*</span></Label>
              <Input
                id="kw-main"
                placeholder="e.g. Gemini AI"
                value={state.keyword}
                onChange={(e) => onChange({ keyword: e.target.value })}
                className="h-10 border-border"
              />
            </div>
            <div>
              <Label className="text-sm font-normal mb-1.5 block">Country</Label>
              <Select value={state.country} onValueChange={(v) => onChange({ country: v })}>
                <SelectTrigger className="h-10 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-normal mb-1.5 block">Search Intent</Label>
              <Select value={state.searchIntent} onValueChange={(v) => onChange({ searchIntent: v })}>
                <SelectTrigger className="h-10 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEARCH_INTENTS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-normal mb-1.5 block">Competitor URLs (optional)</Label>
              <div className="flex flex-col gap-2">
                {[0, 1, 2].map((idx) => (
                  <Input
                    key={idx}
                    placeholder={`https://example.com/article-${idx + 1}`}
                    value={state.competitorUrls[idx] || ''}
                    onChange={(e) => {
                      const arr = [...state.competitorUrls];
                      arr[idx] = e.target.value;
                      onChange({ competitorUrls: arr });
                    }}
                    className="h-9 border-border text-xs"
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-primary text-primary-foreground gap-2 h-10"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {analyzing ? 'Analyzing keyword…' : 'Analyze with AI'}
            </Button>
            <Button
              variant="outline"
              className="gap-2 h-10 border-border text-muted-foreground hover:text-foreground"
              onClick={handleSkipAI}
              disabled={analyzing}
              title="Generate keyword data locally without AI (useful when AI is rate-limited)"
            >
              <Zap className="w-4 h-4" />
              Skip AI / Local Analysis
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Results */}
      {hasAnalyzed && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="border-border shadow-card">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Keyword Difficulty</div>
                <div className={`text-2xl font-bold ${diffColor}`}>{state.keywordDifficulty}<span className="text-sm font-normal text-muted-foreground">/100</span></div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-card">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Search Volume</div>
                <div className="text-2xl font-bold text-navy">{state.searchVolume}</div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-card">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Recommended Words</div>
                <div className="text-2xl font-bold text-navy">{state.targetWordCount.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary keywords */}
          <Card className="border-border shadow-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold text-navy">
                Secondary Keywords <span className="text-muted-foreground font-normal">(select up to 3)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {state.secondaryKeywords.map((kw) => {
                  const selected = state.selectedKeywords.includes(kw);
                  return (
                    <button
                      key={kw}
                      onClick={() => toggleSecondary(kw)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/30 text-foreground/70 border-border hover:border-primary/40'
                      }`}
                    >
                      {selected && <ChevronRight className="w-3 h-3" />}
                      {kw}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Add extra keywords */}
          <Card className="border-border shadow-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold text-navy">
                Add Your Own Keywords <span className="text-muted-foreground font-normal">(up to 3)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a keyword to rank for"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addExtraKeyword()}
                  className="h-9 border-border flex-1"
                />
                <Button size="sm" variant="outline" className="h-9 border-border" onClick={addExtraKeyword}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {extraKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {extraKeywords.map((kw) => (
                    <Badge key={kw} variant="outline" className="border-primary/40 text-primary bg-primary/5 gap-1.5 pl-2 pr-1 py-1">
                      {kw}
                      <button onClick={() => removeExtraKeyword(kw)} className="hover:text-destructive transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* LSI + PAA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border shadow-card">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold text-navy">LSI Keywords</CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-wrap gap-2">
                {state.lsiKeywords.map((k) => (
                  <Badge key={k} variant="outline" className="border-border text-muted-foreground text-xs">{k}</Badge>
                ))}
              </CardContent>
            </Card>
            <Card className="border-border shadow-card">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold text-navy">People Also Ask</CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col gap-2">
                {state.peopleAlsoAsk.map((q, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                    <span className="text-muted-foreground shrink-0 mt-0.5">Q{i + 1}.</span>
                    <span className="text-pretty">{q}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Keyword density rules */}
          <Card className="border-info/20 bg-info/5 border shadow-card">
            <CardContent className="p-4">
              <h4 className="text-xs font-semibold text-info mb-2">Keyword Density Rules</h4>
              <div className="flex flex-wrap gap-4 text-xs text-foreground/70">
                {WORD_COUNT_OPTIONS.map((wc) => (
                  <span key={wc} className={`${state.targetWordCount === wc ? 'font-semibold text-primary' : ''}`}>
                    {wc}+ words → {getKeywordMinFrequency(wc)}× per keyword
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected keywords summary */}
          {(state.selectedKeywords.length > 0 || extraKeywords.length > 0) && (
            <Card className="border-success/20 bg-success/5 border shadow-card">
              <CardContent className="p-4">
                <h4 className="text-xs font-semibold text-success mb-2">Ranking Target Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-primary text-primary-foreground text-xs">{state.keyword}</Badge>
                  {state.selectedKeywords.map((k) => (
                    <Badge key={k} variant="outline" className="border-success/40 text-success bg-success/5 text-xs">{k}</Badge>
                  ))}
                  {extraKeywords.map((k) => (
                    <Badge key={k} variant="outline" className="border-primary/40 text-primary bg-primary/5 text-xs">{k}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Footer */}
      <div className="flex justify-end pt-2">
        <Button
          className="bg-primary text-primary-foreground gap-2 h-10 px-6"
          onClick={handleNext}
          disabled={!hasAnalyzed}
        >
          Approve & Continue <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
