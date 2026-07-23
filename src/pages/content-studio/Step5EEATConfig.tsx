import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ChevronRight, User, BookOpen, Star, Quote, X, Plus } from 'lucide-react';
import type { WizardState, EEATConfig } from './types';

interface Props {
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step5EEATConfig({ state, onChange, onNext, onBack }: Props) {
  const cfg = state.eeatConfig;

  const update = (patch: Partial<EEATConfig>) => {
    onChange({ eeatConfig: { ...cfg, ...patch } });
  };

  const updateCitation = (idx: number, val: string) => {
    const arr = [...(cfg.citations ?? [])];
    arr[idx] = val;
    update({ citations: arr });
  };

  const addCitation = () => {
    if ((cfg.citations ?? []).length >= 5) return;
    update({ citations: [...(cfg.citations ?? []), ''] });
  };

  const removeCitation = (idx: number) => {
    update({ citations: (cfg.citations ?? []).filter((_, i) => i !== idx) });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-navy mb-1">EEAT Layer</h2>
        <p className="text-sm text-muted-foreground">
          Configure Experience, Expertise, Authoritativeness & Trustworthiness signals that Google rewards.
        </p>
      </div>

      {/* Experience */}
      <Card className="border-border shadow-card">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
            <Star className="w-4 h-4 text-warning" /> Experience
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between min-h-10">
            <div>
              <div className="text-sm font-medium text-navy">Include real examples</div>
              <div className="text-xs text-muted-foreground">Add practical use cases and real-world applications</div>
            </div>
            <Switch checked={cfg.includeExamples} onCheckedChange={(v) => update({ includeExamples: v })} />
          </div>
          <div className="flex items-center justify-between min-h-10">
            <div>
              <div className="text-sm font-medium text-navy">Include case study</div>
              <div className="text-xs text-muted-foreground">Add a concrete case study or success story</div>
            </div>
            <Switch checked={cfg.includeCaseStudy} onCheckedChange={(v) => update({ includeCaseStudy: v })} />
          </div>
        </CardContent>
      </Card>

      {/* Expertise */}
      <Card className="border-border shadow-card">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" /> Expertise
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between min-h-10">
            <div>
              <div className="text-sm font-medium text-navy">Include statistics & research</div>
              <div className="text-xs text-muted-foreground">Add data, statistics, and research findings</div>
            </div>
            <Switch checked={cfg.includeStats} onCheckedChange={(v) => update({ includeStats: v })} />
          </div>
          <div className="flex items-center justify-between min-h-10">
            <div>
              <div className="text-sm font-medium text-navy">Add citations</div>
              <div className="text-xs text-muted-foreground">Link to official sources, studies, and company websites</div>
            </div>
            <Switch checked={cfg.includeCitations} onCheckedChange={(v) => update({ includeCitations: v })} />
          </div>
          {cfg.includeCitations && (
            <div className="flex flex-col gap-2 pt-1">
              <Label className="text-sm font-normal mb-0.5">Citation URLs (up to 5)</Label>
              {(cfg.citations ?? []).map((url, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder={`https://source-${idx + 1}.com`}
                    value={url}
                    onChange={(e) => updateCitation(idx, e.target.value)}
                    className="h-9 border-border flex-1 text-xs"
                  />
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeCitation(idx)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
              {(cfg.citations ?? []).length < 5 && (
                <Button size="sm" variant="outline" className="h-8 text-xs border-border w-fit gap-1" onClick={addCitation}>
                  <Plus className="w-3 h-3" /> Add Citation
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Author attribution */}
      <Card className="border-border shadow-card">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
            <User className="w-4 h-4 text-success" /> Author Attribution
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="author-name" className="text-sm font-normal mb-1.5 block">Author Name</Label>
              <Input id="author-name" placeholder="Jane Smith" value={cfg.authorName} onChange={(e) => update({ authorName: e.target.value })} className="h-10 border-border" />
            </div>
            <div>
              <Label htmlFor="author-title" className="text-sm font-normal mb-1.5 block">Author Title / Role</Label>
              <Input id="author-title" placeholder="Senior Content Strategist" value={cfg.authorTitle} onChange={(e) => update({ authorTitle: e.target.value })} className="h-10 border-border" />
            </div>
          </div>
          <div>
            <Label htmlFor="author-bio" className="text-sm font-normal mb-1.5 block">Author Bio (optional)</Label>
            <Textarea id="author-bio" placeholder="Brief bio that establishes expertise…" value={cfg.authorBio} onChange={(e) => update({ authorBio: e.target.value })} className="border-border resize-none min-h-20" rows={3} />
          </div>
          <div>
            <Label htmlFor="reviewer-name" className="text-sm font-normal mb-1.5 block">Reviewed by (optional)</Label>
            <Input id="reviewer-name" placeholder="Dr. John Expert" value={cfg.reviewerName} onChange={(e) => update({ reviewerName: e.target.value })} className="h-10 border-border" />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
        <h4 className="text-xs font-semibold text-success mb-2 flex items-center gap-1.5">
          <Quote className="w-3.5 h-3.5" /> EEAT Configuration Summary
        </h4>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {cfg.includeExamples && <span className="text-success">✓ Real Examples</span>}
          {cfg.includeCaseStudy && <span className="text-success">✓ Case Study</span>}
          {cfg.includeStats && <span className="text-success">✓ Statistics</span>}
          {cfg.includeCitations && <span className="text-success">✓ Citations ({(cfg.citations ?? []).filter(Boolean).length})</span>}
          {cfg.authorName && <span className="text-success">✓ Author: {cfg.authorName}</span>}
          {cfg.reviewerName && <span className="text-success">✓ Reviewer: {cfg.reviewerName}</span>}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" className="h-10 border-border" onClick={onBack}>Back</Button>
        <Button className="bg-primary text-primary-foreground gap-2 h-10 px-6" onClick={onNext}>
          Save & Continue <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
