import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronRight, Wand2, ArrowRight, RefreshCw, SkipForward } from 'lucide-react';
import { streamLLM } from '@/lib/sse';
import { localHumanizationFallback } from './localFallbacks';
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

function calcReadability(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(Boolean).length || 1;
  const words = text.split(/\s+/).filter(Boolean).length || 1;
  const syllables = text.replace(/[^aeiouAEIOU]/g, '').length || 1;
  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  return Math.min(100, Math.max(0, Math.round(score)));
}

export default function Step7Humanization({ state, onChange, onNext, onBack }: Props) {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(!!(state.humanizedContent));
  const abortRef = useRef<AbortController | null>(null);

  const scoreBefore = state.readabilityBefore || calcReadability(state.fullContent);
  const scoreAfter = state.readabilityAfter || 0;

  const applyFallback = () => {
    const humanized = localHumanizationFallback(state.fullContent);
    const after = calcReadability(humanized);
    onChange({ humanizedContent: humanized, readabilityAfter: after, fullContent: humanized });
    setDone(true);
  };

  const handleSkip = () => {
    applyFallback();
    toast.info('Skipped AI humanization — applied local text improvements.');
  };

  const handleRun = async () => {
    setRunning(true);
    setDone(false);
    abortRef.current = new AbortController();
    let result = '';
    const before = calcReadability(state.fullContent);
    onChange({ readabilityBefore: before, humanizedContent: '' });

    await streamLLM({
      contents: [{
        role: 'user',
        parts: [{
          text: `You are an expert content editor specializing in humanizing AI-generated text. Humanize the following article:

TASKS:
1. Remove repetitive phrases
2. Vary sentence lengths (mix short punchy sentences with longer ones)
3. Add natural transitions between paragraphs
4. Add relatable examples or comparisons where appropriate
5. Target Grade 7-9 reading level (Flesch-Kincaid)
6. Keep all headings (## markers) intact
7. Maintain all keywords from the original
8. Do NOT change the meaning or structure

ARTICLE:
${state.fullContent.slice(0, 8000)}

Return ONLY the humanized article text with ## headings preserved:`
        }]
      }],
      supabaseUrl,
      supabaseAnonKey,
      onChunk: (t) => {
        result += t;
        onChange({ humanizedContent: result });
      },
      onComplete: () => {
        setRunning(false);
        setDone(true);
        const after = calcReadability(result);
        onChange({ humanizedContent: result, readabilityAfter: after, fullContent: result });
      },
      onError: () => {
        setRunning(false);
        toast.info('AI unavailable — applying local humanization.');
        applyFallback();
      },
      signal: abortRef.current.signal,
    });
  };

  const gradeLabel = (score: number) => {
    if (score >= 70) return { label: 'Grade 7-9 ✓', color: 'text-success' };
    if (score >= 50) return { label: 'Grade 10-12', color: 'text-warning' };
    return { label: 'College Level', color: 'text-destructive' };
  };

  const beforeGrade = gradeLabel(scoreBefore);
  const afterGrade = gradeLabel(scoreAfter);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-navy mb-1">Humanization Layer</h2>
        <p className="text-sm text-muted-foreground">
          AI refines the article to sound natural, varied, and readable at Grade 7-9 level.
        </p>
      </div>

      {/* Readability scores */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border shadow-card">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Before Humanization</div>
            <div className={`text-2xl font-bold ${beforeGrade.color}`}>{scoreBefore}</div>
            <div className={`text-xs font-medium ${beforeGrade.color}`}>{beforeGrade.label}</div>
          </CardContent>
        </Card>
        <Card className={`border shadow-card ${done ? 'border-success/30 bg-success/5' : 'border-border'}`}>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">After Humanization</div>
            {done ? (
              <>
                <div className={`text-2xl font-bold ${afterGrade.color}`}>{scoreAfter}</div>
                <div className={`text-xs font-medium ${afterGrade.color}`}>{afterGrade.label}</div>
              </>
            ) : (
              <div className="text-2xl font-bold text-muted-foreground/40">—</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          className="bg-primary text-primary-foreground gap-2 h-10"
          onClick={handleRun}
          disabled={running}
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {running ? 'Humanizing…' : done ? 'Re-run Humanization' : 'Run Humanization'}
        </Button>
        {!done && (
          <Button
            variant="outline"
            className="gap-2 h-10 border-border text-muted-foreground"
            onClick={handleSkip}
            disabled={running}
          >
            <SkipForward className="w-4 h-4" /> Skip (Use Local)
          </Button>
        )}
      </div>

      {(running || done) && state.humanizedContent && (
        <Card className="border-border shadow-card max-h-80 overflow-y-auto">
          <CardHeader className="pb-3 border-b border-border sticky top-0 bg-card z-10">
            <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
              Humanized Article Preview
              {running && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <pre className="text-xs text-foreground/70 whitespace-pre-wrap font-sans leading-relaxed">
              {state.humanizedContent}
              {running && <span className="inline-block w-0.5 h-3 bg-primary animate-pulse ml-0.5 align-text-bottom" />}
            </pre>
          </CardContent>
        </Card>
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
