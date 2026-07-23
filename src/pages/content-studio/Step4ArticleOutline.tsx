import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, ChevronRight, Wand2, Plus, Trash2, GripVertical, ChevronDown,
  ChevronRight as ChevRight, SkipForward,
} from 'lucide-react';
import { streamLLM } from '@/lib/sse';
import { localOutlineFallback } from './localFallbacks';
import type { WizardState, OutlineSection } from './types';
import { toast } from 'sonner';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface Props {
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

function SectionRow({
  section, depth, onEdit, onDelete, onAddChild,
}: {
  section: OutlineSection;
  depth: number;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string, type: 'h2' | 'h3') => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(section.text);

  const typeColors: Record<string, string> = {
    h1: 'border-primary/40 text-primary bg-primary/5',
    h2: 'border-info/40 text-info bg-info/5',
    h3: 'border-success/40 text-success bg-success/5',
    intro: 'border-warning/40 text-warning bg-warning/5',
    faq: 'border-warning/40 text-warning bg-warning/5',
    conclusion: 'border-muted-foreground/40 text-muted-foreground bg-muted/30',
  };

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l border-border pl-3' : ''}`}>
      <div className="flex items-center gap-2 py-1.5 group">
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 cursor-grab" />
        <Badge variant="outline" className={`text-xs shrink-0 uppercase font-mono ${typeColors[section.type] || ''}`}>
          {section.type}
        </Badge>
        {editing ? (
          <Input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={() => { onEdit(section.id, val); setEditing(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { onEdit(section.id, val); setEditing(false); } }}
            className="h-7 text-sm border-primary flex-1"
            autoFocus
          />
        ) : (
          <span
            className="text-sm text-foreground/80 flex-1 cursor-text hover:text-navy transition-colors"
            onClick={() => setEditing(true)}
          >
            {section.text || <span className="text-muted-foreground italic">Click to edit</span>}
          </span>
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {(section.type === 'h2') && (
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-primary" onClick={() => onAddChild(section.id, 'h3')}>
              <Plus className="w-3 h-3" />
            </Button>
          )}
          {!['h1', 'intro', 'faq', 'conclusion'].includes(section.type) && (
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => onDelete(section.id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
      {section.children?.map((child) => (
        <SectionRow
          key={child.id}
          section={child}
          depth={depth + 1}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
        />
      ))}
    </div>
  );
}

function flatEditSection(sections: OutlineSection[], id: string, text: string): OutlineSection[] {
  return sections.map((s) => ({
    ...s,
    text: s.id === id ? text : s.text,
    children: s.children ? flatEditSection(s.children, id, text) : s.children,
  }));
}

function deleteSection(sections: OutlineSection[], id: string): OutlineSection[] {
  return sections
    .filter((s) => s.id !== id)
    .map((s) => ({ ...s, children: s.children ? deleteSection(s.children, id) : s.children }));
}

function addChildToSection(sections: OutlineSection[], parentId: string, child: OutlineSection): OutlineSection[] {
  return sections.map((s) => {
    if (s.id === parentId) return { ...s, children: [...(s.children || []), child] };
    return { ...s, children: s.children ? addChildToSection(s.children, parentId, child) : s.children };
  });
}

export default function Step4ArticleOutline({ state, onChange, onNext, onBack }: Props) {
  const [generating, setGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(state.outline.length > 0);
  const abortRef = useRef<AbortController | null>(null);

  const applyFallback = () => {
    const topics = state.competitorTopics.filter((t) => t.selected).map((t) => t.topic);
    const outline = localOutlineFallback(state.keyword, topics, state.searchIntent);
    onChange({ outline });
    setHasGenerated(true);
  };

  const handleSkip = () => {
    applyFallback();
    toast.info('Used local outline — edit any section before continuing.');
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
          text: `You are an expert SEO content architect. Generate a detailed article outline for:
Title: "${state.brief?.title}"
Primary keyword: "${state.keyword}"
Topics to cover: ${selectedTopics.join(', ')}
Target word count: ${state.targetWordCount}

Return ONLY a valid JSON object (no markdown):
{
  "sections": [
    {"id": "s1", "type": "h1", "text": "<H1 title>", "children": []},
    {"id": "s2", "type": "intro", "text": "Introduction: <brief description>", "children": []},
    {"id": "s3", "type": "h2", "text": "<H2 section title>", "children": [
      {"id": "s3a", "type": "h3", "text": "<H3 subsection>", "children": []},
      {"id": "s3b", "type": "h3", "text": "<H3 subsection>", "children": []}
    ]},
    ...more H2 sections with H3 children...,
    {"id": "sfaq", "type": "faq", "text": "FAQ: Frequently Asked Questions", "children": []},
    {"id": "scon", "type": "conclusion", "text": "Conclusion", "children": []}
  ]
}

Include at least 4 H2 sections, each with 2-3 H3 subsections.`
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
          if (!Array.isArray(parsed.sections)) throw new Error('Bad structure');
          onChange({ outline: parsed.sections });
          setHasGenerated(true);
        } catch {
          toast.error('Failed to parse outline — using local generation.');
          applyFallback();
        }
      },
      onError: () => {
        setGenerating(false);
        toast.info('AI unavailable — using local outline.');
        applyFallback();
      },
      signal: abortRef.current.signal,
    });
  };

  const handleEdit = (id: string, text: string) => {
    onChange({ outline: flatEditSection(state.outline, id, text) });
  };

  const handleDelete = (id: string) => {
    onChange({ outline: deleteSection(state.outline, id) });
  };

  const handleAddH2 = () => {
    const newId = `h2-${Date.now()}`;
    onChange({
      outline: [
        ...state.outline.slice(0, -2), // insert before FAQ and Conclusion
        { id: newId, type: 'h2', text: 'New Section', children: [] },
        ...state.outline.slice(-2),
      ],
    });
  };

  const handleAddChild = (parentId: string, type: 'h2' | 'h3') => {
    const child: OutlineSection = { id: `${type}-${Date.now()}`, type, text: `New ${type.toUpperCase()}`, children: [] };
    onChange({ outline: addChildToSection(state.outline, parentId, child) });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-navy mb-1">Article Structure</h2>
        <p className="text-sm text-muted-foreground">
          AI generates the full outline. Click any heading to edit, add sections, or reorder before writing begins.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          className="bg-primary text-primary-foreground gap-2 h-10"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {generating ? 'Generating outline…' : hasGenerated ? 'Regenerate Outline' : 'Generate Outline'}
        </Button>
        {!hasGenerated && (
          <Button
            variant="outline"
            className="gap-2 h-10 border-border text-muted-foreground"
            onClick={handleSkip}
            disabled={generating}
          >
            <SkipForward className="w-4 h-4" /> Use Local Outline
          </Button>
        )}
      </div>

      {hasGenerated && (
        <Card className="border-border shadow-card">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-navy">Article Outline — Click to edit headings</CardTitle>
              <Button size="sm" variant="outline" className="h-7 text-xs border-border gap-1" onClick={handleAddH2}>
                <Plus className="w-3 h-3" /> Add H2
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-col gap-0.5">
              {state.outline.map((section) => (
                <SectionRow
                  key={section.id}
                  section={section}
                  depth={0}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddChild={handleAddChild}
                />
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
            onNext();
          }}
        >
          Approve Outline <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
