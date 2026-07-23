import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ChevronRight, Wand2, ChevronDown, ChevronUp, SkipForward } from 'lucide-react';
import { streamLLM } from '@/lib/sse';
import { localSEOAssetsFallback } from './localFallbacks';
import type { WizardState, SEOAssets } from './types';
import { toast } from 'sonner';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface Props {
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step11SEOAssets({ state, onChange, onNext, onBack }: Props) {
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(!!(state.seoAssets?.metaTitle));
  const [showSchema, setShowSchema] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const assets = state.seoAssets;

  const applyFallback = () => {
    const fb = localSEOAssetsFallback(
      state.keyword,
      state.brief || { title: '', metaTitle: '', metaDescription: '', slug: '' },
    );
    onChange({ seoAssets: fb });
    setDone(true);
  };

  const handleSkip = () => {
    applyFallback();
    toast.info('Used local SEO assets — edit any field before confirming.');
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setDone(false);
    abortRef.current = new AbortController();
    let raw = '';

    await streamLLM({
      contents: [{
        role: 'user',
        parts: [{
          text: `Generate complete SEO meta assets for this article:
Title: "${state.brief?.title}"
Primary keyword: "${state.keyword}"
Meta description already drafted: "${state.brief?.metaDescription}"
Slug: "${state.brief?.slug}"

Return ONLY valid JSON (no markdown):
{
  "metaTitle": "<optimized meta title, max 60 chars>",
  "metaDescription": "<optimized meta description, max 160 chars>",
  "ogTitle": "<Open Graph title>",
  "ogDescription": "<Open Graph description, 1-2 sentences>",
  "ogImageSuggestion": "<describe ideal featured image for this article>",
  "twitterTitle": "<Twitter card title>",
  "twitterDescription": "<Twitter card description>",
  "canonicalUrl": "https://aidetector.cx/blog/${state.brief?.slug || state.keyword.toLowerCase().replace(/\s+/g, '-')}",
  "schemaJson": "<Article JSON-LD schema as string, double-escape inner quotes>"
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
          onChange({ seoAssets: parsed as SEOAssets });
          setDone(true);
        } catch {
          toast.error('Failed to parse SEO assets — using local defaults.');
          applyFallback();
        }
      },
      onError: () => {
        setGenerating(false);
        toast.info('AI unavailable — using local SEO assets.');
        applyFallback();
      },
      signal: abortRef.current.signal,
    });
  };

  const update = (patch: Partial<SEOAssets>) => {
    onChange({ seoAssets: { ...assets, ...patch } as SEOAssets });
  };

  const metaTitleLen = assets?.metaTitle?.length || 0;
  const metaDescLen = assets?.metaDescription?.length || 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-navy mb-1">SEO Assets</h2>
        <p className="text-sm text-muted-foreground">
          AI generates all meta tags, Open Graph, Twitter Card, and structured data markup.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          className="bg-primary text-primary-foreground gap-2 h-10"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {generating ? 'Generating assets…' : done ? 'Regenerate Assets' : 'Generate SEO Assets'}
        </Button>
        {!done && (
          <Button
            variant="outline"
            className="gap-2 h-10 border-border text-muted-foreground"
            onClick={handleSkip}
            disabled={generating}
          >
            <SkipForward className="w-4 h-4" /> Use Local Assets
          </Button>
        )}
      </div>

      {done && (
        <div className="flex flex-col gap-5">
          <Card className="border-border shadow-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold text-navy">Meta Tags</CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-sm font-normal">Meta Title</Label>
                  <span className={`text-xs ${metaTitleLen > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>{metaTitleLen}/60</span>
                </div>
                <Input value={assets?.metaTitle || ''} onChange={(e) => update({ metaTitle: e.target.value })} className="h-10 border-border" maxLength={70} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-sm font-normal">Meta Description</Label>
                  <span className={`text-xs ${metaDescLen > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>{metaDescLen}/160</span>
                </div>
                <Textarea value={assets?.metaDescription || ''} onChange={(e) => update({ metaDescription: e.target.value })} className="border-border resize-none" rows={3} maxLength={180} />
              </div>
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Canonical URL</Label>
                <Input value={assets?.canonicalUrl || ''} onChange={(e) => update({ canonicalUrl: e.target.value })} className="h-10 border-border" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold text-navy">Open Graph</CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-4">
              <div>
                <Label className="text-sm font-normal mb-1.5 block">og:title</Label>
                <Input value={assets?.ogTitle || ''} onChange={(e) => update({ ogTitle: e.target.value })} className="h-10 border-border" />
              </div>
              <div>
                <Label className="text-sm font-normal mb-1.5 block">og:description</Label>
                <Textarea value={assets?.ogDescription || ''} onChange={(e) => update({ ogDescription: e.target.value })} className="border-border resize-none" rows={2} />
              </div>
              <div>
                <Label className="text-sm font-normal mb-1.5 block">og:image suggestion</Label>
                <Input value={assets?.ogImageSuggestion || ''} onChange={(e) => update({ ogImageSuggestion: e.target.value })} className="h-10 border-border" placeholder="Describe or provide image URL" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold text-navy">Twitter Card</CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-4">
              <div>
                <Label className="text-sm font-normal mb-1.5 block">twitter:title</Label>
                <Input value={assets?.twitterTitle || ''} onChange={(e) => update({ twitterTitle: e.target.value })} className="h-10 border-border" />
              </div>
              <div>
                <Label className="text-sm font-normal mb-1.5 block">twitter:description</Label>
                <Textarea value={assets?.twitterDescription || ''} onChange={(e) => update({ twitterDescription: e.target.value })} className="border-border resize-none" rows={2} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-card">
            <CardHeader className="pb-0">
              <Button
                variant="ghost"
                className="text-sm font-semibold text-navy justify-between h-auto p-0 hover:bg-transparent"
                onClick={() => setShowSchema(!showSchema)}
              >
                <span>Article JSON-LD Schema</span>
                {showSchema ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CardHeader>
            {showSchema && (
              <CardContent className="p-4">
                <pre className="text-xs bg-muted/30 rounded-lg p-4 overflow-x-auto text-foreground/70 font-mono leading-relaxed">
                  {assets?.schemaJson || '{}'}
                </pre>
              </CardContent>
            )}
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" className="h-10 border-border" onClick={onBack}>Back</Button>
        <Button
          className="bg-primary text-primary-foreground gap-2 h-10 px-6"
          onClick={() => {
            if (!done) { applyFallback(); }
            const curAssets = state.seoAssets;
            if ((curAssets?.metaTitle?.length || 0) > 60) { toast.error('Meta title must be 60 chars or less.'); return; }
            if ((curAssets?.metaDescription?.length || 0) > 160) { toast.error('Meta description must be 160 chars or less.'); return; }
            onNext();
          }}
        >
          Confirm Assets <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
