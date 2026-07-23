import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ChevronRight, Link2, Wand2, SkipForward } from 'lucide-react';
import { streamLLM } from '@/lib/sse';
import { localInternalLinksFallback } from './localFallbacks';
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

export default function Step9InternalLinking({ state, onChange, onNext, onBack }: Props) {
  const [domain, setDomain] = useState('');
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(state.internalLinks.length > 0);
  const abortRef = useRef<AbortController | null>(null);

  const applyFallback = () => {
    const links = localInternalLinksFallback(state.keyword, state.fullContent).map((l) => ({
      ...l,
      accepted: true,
    }));
    onChange({ internalLinks: links });
    setDone(true);
  };

  const handleSkip = () => {
    applyFallback();
    toast.info('Used local link suggestions — toggle any to include/exclude.');
  };

  const handleGenerate = async () => {
    if (!domain.trim()) { toast.error('Please enter a website domain.'); return; }
    
    setGenerating(true);
    setDone(false);
    abortRef.current = new AbortController();
    let raw = '';
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    await streamLLM({
      contents: [{
        role: 'user',
        parts: [{
          text: `You have access to Google Search. You are an SEO internal linking specialist. Suggest internal links for an article about "${state.keyword}" on the website "${cleanDomain}".

Search the website "${cleanDomain}" to find actual existing pages that are relevant to this article topic.
Generate exactly 5 internal link suggestions that would be natural within this article content.

Return ONLY valid JSON (no markdown):
{
  "links": [
    {"anchorText": "<natural anchor text from article>", "url": "https://${cleanDomain}/<suggested-page-path>", "reason": "<why this link makes sense>"},
    ...5 items total
  ]
}`
        }]
      }],
      tools: [{ googleSearch: {} }],
      supabaseUrl,
      supabaseAnonKey,
      onChunk: (t) => { raw += t; },
      onComplete: () => {
        setGenerating(false);
        try {
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error('No JSON');
          const parsed = JSON.parse(jsonMatch[0]);
          const links = (parsed.links || []).map((l: { anchorText: string; url: string; reason: string }) => ({
            ...l,
            accepted: true,
          }));
          onChange({ internalLinks: links });
          setDone(true);
        } catch {
          toast.error('Failed to parse link suggestions — using local defaults.');
          applyFallback();
        }
      },
      onError: () => {
        setGenerating(false);
        toast.info('AI unavailable — using local link suggestions.');
        applyFallback();
      },
      signal: abortRef.current.signal,
    });
  };

  const toggleLink = (idx: number) => {
    onChange({
      internalLinks: state.internalLinks.map((l, i) =>
        i === idx ? { ...l, accepted: !l.accepted } : l
      ),
    });
  };

  const acceptedCount = state.internalLinks.filter((l) => l.accepted).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-navy mb-1">Internal Linking</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Provide your website domain. AI will pull your page URLs via Google Search to suggest relevant internal links, boosting PageRank flow.
        </p>
        <div className="max-w-md">
          <Input 
            placeholder="e.g. yoursite.com" 
            value={domain} 
            onChange={(e) => setDomain(e.target.value)}
            className="h-10 border-border"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          className="bg-primary text-primary-foreground gap-2 h-10"
          onClick={handleGenerate}
          disabled={generating || !domain.trim()}
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {generating ? 'Generating suggestions…' : done ? 'Regenerate' : 'Suggest Internal Links'}
        </Button>
        {!done && (
          <Button
            variant="outline"
            className="gap-2 h-10 border-border text-muted-foreground"
            onClick={handleSkip}
            disabled={generating}
          >
            <SkipForward className="w-4 h-4" /> Use Local Suggestions
          </Button>
        )}
      </div>

      {done && state.internalLinks.length > 0 && (
        <Card className="border-border shadow-card">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-navy">Link Suggestions</CardTitle>
              <Badge variant="outline" className="text-xs border-success/40 text-success bg-success/5">
                {acceptedCount} accepted
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex flex-col gap-3">
            {state.internalLinks.map((link, idx) => (
              <label
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer min-h-12 ${
                  link.accepted ? 'border-success/30 bg-success/5' : 'border-border bg-muted/20'
                }`}
              >
                <Checkbox
                  checked={link.accepted}
                  onCheckedChange={() => toggleLink(idx)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-primary hover:underline">{link.anchorText}</span>
                    <span className="text-xs text-muted-foreground font-mono">{link.url}</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-pretty">{link.reason}</p>
                </div>
                <Link2 className={`w-4 h-4 shrink-0 mt-0.5 ${link.accepted ? 'text-success' : 'text-muted-foreground/40'}`} />
              </label>
            ))}
          </CardContent>
        </Card>
      )}

      {done && (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm text-primary text-pretty">
            <strong>{acceptedCount}</strong> internal links will be added to your article, strengthening site architecture.
          </p>
        </div>
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
          Apply Links & Continue <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
