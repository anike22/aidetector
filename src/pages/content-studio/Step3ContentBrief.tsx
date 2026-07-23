import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronRight, Wand2, SkipForward } from 'lucide-react';
import { streamLLM } from '@/lib/sse';
import { localBriefFallback } from './localFallbacks';
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

export default function Step3ContentBrief({ state, onChange, onNext, onBack }: Props) {
  const [generating, setGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(
    !!(state.brief?.title)
  );
  const abortRef = useRef<AbortController | null>(null);

  const applyFallback = () => {
    const fb = localBriefFallback(state.keyword, state.searchIntent, state.targetWordCount);
    onChange({ brief: fb });
    setHasGenerated(true);
  };

  const handleSkip = () => {
    applyFallback();
    toast.info('Used local brief — edit any field below before continuing.');
  };

  const handleGenerate = async () => {
    setGenerating(true);
    abortRef.current = new AbortController();
    let raw = '';

    const selectedTopics = state.competitorTopics.filter((t) => t.selected).map((t) => t.topic);

    await streamLLM({
      contents: [{
        role: 'user',
        parts: [{
          text: `You are an expert SEO content strategist. Generate an SEO content brief for the keyword "${state.keyword}" targeting ${state.country} with ${state.searchIntent} intent.

Topics to cover: ${selectedTopics.join(', ')}
Secondary keywords: ${state.selectedKeywords.join(', ')}
Target word count: ${state.targetWordCount}

Return ONLY a valid JSON object (no markdown):
{
  "title": "<compelling article title with keyword>",
  "metaTitle": "<SEO meta title, max 60 chars>",
  "metaDescription": "<SEO meta description, max 160 chars>",
  "slug": "<url-friendly-slug-with-keyword>"
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
          onChange({
            brief: {
              title: parsed.title || '',
              metaTitle: (parsed.metaTitle || '').slice(0, 60),
              metaDescription: (parsed.metaDescription || '').slice(0, 160),
              slug: parsed.slug || '',
            },
          });
          setHasGenerated(true);
        } catch {
          toast.error('Failed to parse brief — using local generation.');
          applyFallback();
        }
      },
      onError: () => {
        setGenerating(false);
        toast.info('AI unavailable — using local brief generation.');
        applyFallback();
      },
      signal: abortRef.current.signal,
    });
  };

  const brief = state.brief || { title: '', metaTitle: '', metaDescription: '', slug: '' };
  const metaTitleLen = brief.metaTitle?.length || 0;
  const metaDescLen = brief.metaDescription?.length || 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-navy mb-1">SEO Content Brief</h2>
        <p className="text-sm text-muted-foreground">AI generates your content blueprint — edit any field before proceeding.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          className="bg-primary text-primary-foreground gap-2 h-10"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {generating ? 'Generating brief…' : hasGenerated ? 'Regenerate Brief' : 'Generate Brief'}
        </Button>
        {!hasGenerated && (
          <Button
            variant="outline"
            className="gap-2 h-10 border-border text-muted-foreground"
            onClick={handleSkip}
            disabled={generating}
          >
            <SkipForward className="w-4 h-4" /> Use Local Brief
          </Button>
        )}
      </div>

      {hasGenerated && (
        <Card className="border-border shadow-card">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold text-navy">Content Brief — Edit as needed</CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col gap-5">
            {/* Title */}
            <div>
              <Label htmlFor="brief-title" className="text-sm font-normal mb-1.5 block">Article Title</Label>
              <Input
                id="brief-title"
                value={brief.title}
                onChange={(e) => onChange({ brief: { ...brief, title: e.target.value } })}
                className="h-10 border-border"
              />
            </div>

            {/* Meta title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="brief-meta-title" className="text-sm font-normal">Meta Title</Label>
                <span className={`text-xs ${metaTitleLen > 60 ? 'text-destructive' : metaTitleLen > 50 ? 'text-warning' : 'text-muted-foreground'}`}>
                  {metaTitleLen}/60
                </span>
              </div>
              <Input
                id="brief-meta-title"
                value={brief.metaTitle}
                onChange={(e) => onChange({ brief: { ...brief, metaTitle: e.target.value } })}
                className="h-10 border-border"
                maxLength={70}
              />
            </div>

            {/* Meta description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="brief-meta-desc" className="text-sm font-normal">Meta Description</Label>
                <span className={`text-xs ${metaDescLen > 160 ? 'text-destructive' : metaDescLen > 145 ? 'text-warning' : 'text-muted-foreground'}`}>
                  {metaDescLen}/160
                </span>
              </div>
              <Textarea
                id="brief-meta-desc"
                value={brief.metaDescription}
                onChange={(e) => onChange({ brief: { ...brief, metaDescription: e.target.value } })}
                className="border-border resize-none min-h-20"
                rows={3}
                maxLength={180}
              />
            </div>

            {/* Slug */}
            <div>
              <Label htmlFor="brief-slug" className="text-sm font-normal mb-1.5 block">URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">aidetector.cx/blog/</span>
                <Input
                  id="brief-slug"
                  value={brief.slug}
                  onChange={(e) => onChange({ brief: { ...brief, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') } })}
                  className="h-10 border-border flex-1"
                />
              </div>
            </div>

            {/* Summary info */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                Keyword: {state.keyword}
              </Badge>
              <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                Target: {state.targetWordCount.toLocaleString()} words
              </Badge>
              {state.selectedKeywords.slice(0, 3).map((k) => (
                <Badge key={k} variant="outline" className="border-primary/30 text-primary bg-primary/5 text-xs">{k}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" className="h-10 border-border" onClick={onBack}>Back</Button>
        <Button
          className="bg-primary text-primary-foreground gap-2 h-10 px-6"
          onClick={() => {
            if (!hasGenerated) { applyFallback(); }
            const brief = state.brief || { title: '', metaTitle: '', metaDescription: '', slug: '' };
            if ((brief.metaTitle?.length || 0) > 60) { toast.error('Meta title must be 60 chars or less.'); return; }
            if ((brief.metaDescription?.length || 0) > 160) { toast.error('Meta description must be 160 chars or less.'); return; }
            onNext();
          }}
        >
          Approve Brief <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
