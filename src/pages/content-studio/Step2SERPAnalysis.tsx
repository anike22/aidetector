import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Globe, ChevronRight, CheckCircle2, XCircle, SkipForward } from 'lucide-react';
import { streamLLM } from '@/lib/sse';
import { localSERPFallback } from './localFallbacks';
import type { WizardState } from './types';
import { toast } from 'sonner';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface Props {
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2SERPAnalysis({ state, onChange, onNext, onBack }: Props) {
  const [analyzing, setAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(state.competitorTopics.length > 0);
  const abortRef = useRef<AbortController | null>(null);

  const applyFallback = () => {
    const fb = localSERPFallback(state.keyword);
    onChange({
      serpHeadings: fb.serpHeadings,
      competitorTopics: [...fb.coveredTopics, ...fb.gapTopics],
    });
    setHasAnalyzed(true);
  };

  const handleSkip = () => {
    applyFallback();
    toast.info('Used local SERP analysis — you can edit topics below.');
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setHasAnalyzed(false);
    abortRef.current = new AbortController();
    let raw = '';

    await streamLLM({
      contents: [{
        role: 'user',
        parts: [{
          text: `You are an expert SERP analyst. Analyze top 10 ranking pages for the keyword "${state.keyword}" in ${state.country}.

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "serpHeadings": [<array of 10 strings: typical H1/H2 headings found across top ranking pages>],
  "coveredTopics": [<array of 8-10 strings: topics ALL top competitors cover>],
  "gapTopics": [<array of 5-7 strings: topics missing from top results that would give a competitive advantage>]
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
          if (!jsonMatch) throw new Error('No JSON');
          const parsed = JSON.parse(jsonMatch[0]);

          const covered = (parsed.coveredTopics || []).map((t: string) => ({
            topic: t, covered: true, isGap: false, selected: true,
          }));
          const gaps = (parsed.gapTopics || []).map((t: string) => ({
            topic: t, covered: false, isGap: true, selected: true,
          }));

          onChange({
            serpHeadings: parsed.serpHeadings || [],
            competitorTopics: [...covered, ...gaps],
          });
          setHasAnalyzed(true);
        } catch {
          toast.error('Failed to parse SERP results — using local analysis.');
          applyFallback();
        }
      },
      onError: () => {
        setAnalyzing(false);
        toast.info('AI unavailable — using local SERP analysis.');
        applyFallback();
      },
      signal: abortRef.current.signal,
    });
  };

  const toggleTopic = (idx: number) => {
    const updated = state.competitorTopics.map((t, i) =>
      i === idx ? { ...t, selected: !t.selected } : t
    );
    onChange({ competitorTopics: updated });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-navy mb-1">SERP Analysis</h2>
        <p className="text-sm text-muted-foreground">
          AI scans top 10 ranking pages for "<span className="font-medium text-navy">{state.keyword}</span>" to identify what to cover and where to win.
        </p>
      </div>

      {!hasAnalyzed ? (
        <Card className="border-border shadow-card">
          <CardContent className="p-10 flex flex-col items-center text-center gap-4">
            <Globe className="w-10 h-10 text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-navy mb-1">Analyze Top 10 Competitors</h3>
              <p className="text-sm text-muted-foreground text-pretty max-w-xs mx-auto">
                AI will extract headings, topics, and identify content gaps you can win with.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                className="bg-primary text-primary-foreground gap-2 h-10"
                onClick={handleAnalyze}
                disabled={analyzing}
              >
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                {analyzing ? 'Analyzing SERPs…' : 'Run SERP Analysis'}
              </Button>
              <Button
                variant="outline"
                className="gap-2 h-10 border-border text-muted-foreground"
                onClick={handleSkip}
                disabled={analyzing}
              >
                <SkipForward className="w-4 h-4" /> Use Local Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Competitor headings */}
          <Card className="border-border shadow-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold text-navy">Common Headings from Top Rankings</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-2">
              {state.serpHeadings.map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0 w-6">{i + 1}.</span>
                  <span className="text-pretty">{h}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Content gap analysis */}
          <Card className="border-border shadow-card">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-navy">Content Gap Analysis</CardTitle>
                <span className="text-xs text-muted-foreground">Check topics to include in your article</span>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                {/* Covered topics */}
                <div className="mb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Competitors Cover
                  </div>
                  {state.competitorTopics.filter((t) => !t.isGap).map((topic, idx) => {
                    const globalIdx = state.competitorTopics.indexOf(topic);
                    return (
                      <label
                        key={idx}
                        className="flex items-center gap-3 p-2.5 rounded-md hover:bg-muted/30 cursor-pointer min-h-10"
                      >
                        <Checkbox
                          checked={topic.selected}
                          onCheckedChange={() => toggleTopic(globalIdx)}
                          id={`topic-cov-${idx}`}
                        />
                        <span className="text-sm text-foreground/80 flex-1">{topic.topic}</span>
                        <Badge variant="outline" className="text-xs border-success/30 text-success bg-success/5 shrink-0">Covered</Badge>
                      </label>
                    );
                  })}
                </div>

                {/* Gap topics */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    <XCircle className="w-3.5 h-3.5 text-primary" /> Content Gaps (Opportunities)
                  </div>
                  {state.competitorTopics.filter((t) => t.isGap).map((topic, idx) => {
                    const globalIdx = state.competitorTopics.indexOf(topic);
                    return (
                      <label
                        key={idx}
                        className="flex items-center gap-3 p-2.5 rounded-md hover:bg-primary/5 cursor-pointer min-h-10 border border-primary/10 rounded-md mb-1"
                      >
                        <Checkbox
                          checked={topic.selected}
                          onCheckedChange={() => toggleTopic(globalIdx)}
                          id={`topic-gap-${idx}`}
                        />
                        <span className="text-sm text-foreground/80 flex-1">{topic.topic}</span>
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5 shrink-0">Gap 🎯</Badge>
                      </label>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <p className="text-sm text-primary text-pretty">
              <strong>{state.competitorTopics.filter((t) => t.selected).length}</strong> topics selected to cover in your article.
              Your article will target these gaps to outrank competitors.
            </p>
          </div>
        </>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" className="h-10 border-border" onClick={onBack}>Back</Button>
        <Button
          className="bg-primary text-primary-foreground gap-2 h-10 px-6"
          onClick={() => {
            if (!hasAnalyzed) { applyFallback(); }
            onNext();
          }}
        >
          Approve & Continue <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
