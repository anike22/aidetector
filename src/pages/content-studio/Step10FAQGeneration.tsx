import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, ChevronRight, Wand2, Check, Trash2, Edit3, ChevronDown, ChevronUp, SkipForward,
} from 'lucide-react';
import { streamLLM } from '@/lib/sse';
import { localFAQFallback } from './localFallbacks';
import type { WizardState, FAQItem } from './types';
import { toast } from 'sonner';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface Props {
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step10FAQGeneration({ state, onChange, onNext, onBack }: Props) {
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(state.faqItems.length > 0);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editQ, setEditQ] = useState('');
  const [editA, setEditA] = useState('');
  const [showSchema, setShowSchema] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const applyFallback = () => {
    const items = localFAQFallback(state.keyword);
    onChange({ faqItems: items });
    setDone(true);
  };

  const handleSkip = () => {
    applyFallback();
    toast.info('Used local FAQ — edit questions and answers below.');
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setDone(false);
    abortRef.current = new AbortController();
    let raw = '';

    const paaQuestions = state.peopleAlsoAsk.slice(0, 5).join('; ');

    await streamLLM({
      contents: [{
        role: 'user',
        parts: [{
          text: `Generate an FAQ section for an article about "${state.keyword}".

People Also Ask questions to include: ${paaQuestions}

Requirements:
- Generate 6-8 FAQ pairs
- Each answer: 40-80 words, direct and informative
- Include keyword "${state.keyword}" naturally in some answers

Return ONLY valid JSON (no markdown):
{
  "faqs": [
    {"id": "faq1", "question": "<question>", "answer": "<answer>"},
    ...
  ]
}`
        }]
      }],
      supabaseUrl,
      supabaseAnonKey,
      onChunk: (t) => { raw += t; },
      onComplete: () => {
        setGenerating(false);
        try {
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error('No JSON');
          const parsed = JSON.parse(jsonMatch[0]);
          const items: FAQItem[] = (parsed.faqs || []).map((f: { id?: string; question: string; answer: string }) => ({
            id: f.id || `faq-${Date.now()}-${Math.random()}`,
            question: f.question,
            answer: f.answer,
            keep: true,
          }));
          onChange({ faqItems: items });
          setDone(true);
        } catch {
          toast.error('Failed to parse FAQ — using local defaults.');
          applyFallback();
        }
      },
      onError: () => {
        setGenerating(false);
        toast.info('AI unavailable — using local FAQ.');
        applyFallback();
      },
      signal: abortRef.current.signal,
    });
  };

  const updateItem = (idx: number, patch: Partial<FAQItem>) => {
    onChange({ faqItems: state.faqItems.map((f, i) => i === idx ? { ...f, ...patch } : f) });
  };

  const removeItem = (idx: number) => {
    onChange({ faqItems: state.faqItems.filter((_, i) => i !== idx) });
  };

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditQ(state.faqItems[idx].question);
    setEditA(state.faqItems[idx].answer);
  };

  const saveEdit = (idx: number) => {
    updateItem(idx, { question: editQ, answer: editA });
    setEditingIdx(null);
  };

  const keptItems = state.faqItems.filter((f) => f.keep);

  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': keptItems.map((f) => ({
      '@type': 'Question',
      'name': f.question,
      'acceptedAnswer': { '@type': 'Answer', 'text': f.answer },
    })),
  }, null, 2);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-navy mb-1">FAQ Generation</h2>
        <p className="text-sm text-muted-foreground">
          AI generates FAQ from People Also Ask data. Schema markup is auto-generated.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          className="bg-primary text-primary-foreground gap-2 h-10"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {generating ? 'Generating FAQ…' : done ? 'Regenerate FAQ' : 'Generate FAQ'}
        </Button>
        {!done && (
          <Button
            variant="outline"
            className="gap-2 h-10 border-border text-muted-foreground"
            onClick={handleSkip}
            disabled={generating}
          >
            <SkipForward className="w-4 h-4" /> Use Local FAQ
          </Button>
        )}
      </div>

      {done && state.faqItems.length > 0 && (
        <>
          <div className="flex flex-col gap-3">
            {state.faqItems.map((item, idx) => (
              <Card
                key={item.id}
                className={`border shadow-card transition-all ${item.keep ? 'border-border' : 'border-border/30 opacity-50'}`}
              >
                <CardContent className="p-4">
                  {editingIdx === idx ? (
                    <div className="flex flex-col gap-3">
                      <div>
                        <Label className="text-xs font-normal mb-1 block">Question</Label>
                        <Input value={editQ} onChange={(e) => setEditQ(e.target.value)} className="h-9 border-border text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs font-normal mb-1 block">Answer</Label>
                        <Textarea value={editA} onChange={(e) => setEditA(e.target.value)} className="border-border resize-none min-h-20 text-sm" rows={3} />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8 text-xs bg-primary text-primary-foreground gap-1" onClick={() => saveEdit(idx)}>
                          <Check className="w-3.5 h-3.5" /> Save
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs border-border" onClick={() => setEditingIdx(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-navy mb-1 text-balance">{item.question}</p>
                        <p className="text-sm text-muted-foreground text-pretty">{item.answer}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary" onClick={() => startEdit(idx)}>
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeItem(idx)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant={item.keep ? 'ghost' : 'outline'}
                          className={`h-7 text-xs ${item.keep ? 'text-success hover:text-destructive' : 'border-border text-muted-foreground hover:text-success'}`}
                          onClick={() => updateItem(idx, { keep: !item.keep })}
                        >
                          {item.keep ? <Check className="w-3 h-3" /> : 'Include'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-border shadow-card">
            <CardHeader className="pb-3 border-b border-border">
              <Button
                variant="ghost"
                className="text-sm font-semibold text-navy justify-between h-auto p-0 hover:bg-transparent"
                onClick={() => setShowSchema(!showSchema)}
              >
                <span>JSON-LD Schema Markup ({keptItems.length} FAQs)</span>
                {showSchema ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CardHeader>
            {showSchema && (
              <CardContent className="p-4">
                <pre className="text-xs bg-muted/30 rounded-lg p-4 overflow-x-auto text-foreground/70 font-mono leading-relaxed">
                  {schema}
                </pre>
              </CardContent>
            )}
          </Card>

          <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
            <p className="text-sm text-success text-pretty">
              <strong>{keptItems.length}</strong> FAQ items ready with JSON-LD schema markup.
            </p>
          </div>
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
          Approve FAQ <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
