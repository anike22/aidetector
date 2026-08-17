// EssayOutlinePage — editable outline builder with AI section generation
import { useState, useEffect, useCallback } from 'react';
import { useEssayStudio } from '@/contexts/EssayStudioContext';
import { essayService } from '@/lib/essay/essayService';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Plus, Trash2, ChevronUp, ChevronDown, ChevronRight,
  RefreshCw, Wand2, GripVertical, FileText, Loader2,
} from 'lucide-react';
import type { EssayOutlineSection } from '@/types/essay';

interface SectionItem extends Omit<EssayOutlineSection, 'id' | 'essay_id' | 'parent_id' | 'created_at' | 'updated_at' | 'children'> {
  id: string;
  isNew?: boolean;
}

export default function EssayOutlinePage() {
  const { essay, outlineSections, setOutlineSections, goToPhase } = useEssayStudio();
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);

  useEffect(() => {
    if (outlineSections.length > 0) {
      setSections(outlineSections.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        notes: s.notes,
        position: s.position,
        depth: s.depth,
      })));
    }
  }, [outlineSections]);

  const generateFullOutline = useCallback(async () => {
    if (!essay) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('essay-assist', {
        body: {
          action: 'generate_outline',
          text: essay.topic || essay.title,
          context: {
            essay_type: essay.essay_type,
            academic_level: essay.academic_level,
            citation_style: essay.citation_style,
            target_word_count: essay.target_word_count,
          },
        },
      });
      if (error) throw error;

      let parsed: { title: string; description: string; position: number }[] = [];
      try {
        const jsonMatch = (data?.result || '').match(/\[[\s\S]*\]/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : data?.result || '[]');
      } catch {
        toast.error('Could not parse outline from AI. Please add sections manually.');
        return;
      }

      const newSections: SectionItem[] = parsed.map((s, i) => ({
        id: `new-${i}-${Date.now()}`,
        title: s.title || `Section ${i + 1}`,
        description: s.description || '',
        notes: '',
        position: i,
        depth: 0,
        isNew: true,
      }));
      setSections(newSections);
      toast.success('Outline generated — review and edit before saving');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate outline. Please try again or add sections manually.');
    } finally {
      setGenerating(false);
    }
  }, [essay]);

  const regenerateSection = async (idx: number) => {
    if (!essay) return;
    setRegeneratingIdx(idx);
    try {
      const section = sections[idx];
      const { data, error } = await supabase.functions.invoke('essay-assist', {
        body: {
          action: 'brainstorm',
          text: section.title,
          context: {
            essay_type: essay.essay_type,
            academic_level: essay.academic_level,
            topic: essay.topic,
          },
        },
      });
      if (error) throw error;
      const suggestion = data?.result?.split('\n').slice(0, 3).join(' ') || '';
      setSections(prev => prev.map((s, i) => i === idx ? { ...s, description: suggestion } : s));
      toast.success('Section description updated');
    } catch {
      toast.error('Failed to regenerate section');
    } finally {
      setRegeneratingIdx(null);
    }
  };

  const addSection = (afterIdx: number) => {
    const newSection: SectionItem = {
      id: `new-${Date.now()}`,
      title: 'New Section',
      description: '',
      notes: '',
      position: afterIdx + 1,
      depth: 0,
      isNew: true,
    };
    setSections(prev => {
      const copy = [...prev];
      copy.splice(afterIdx + 1, 0, newSection);
      return copy.map((s, i) => ({ ...s, position: i }));
    });
  };

  const removeSection = (idx: number) => {
    setSections(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, position: i })));
  };

  const moveSection = (idx: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= sections.length) return;
    setSections(prev => {
      const copy = [...prev];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy.map((s, i) => ({ ...s, position: i }));
    });
  };

  const updateSection = (idx: number, field: 'title' | 'description' | 'notes', value: string) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const handleSave = async (proceed = false) => {
    if (!essay) return;
    if (sections.length === 0) { toast.error('Add at least one section'); return; }
    setSaving(true);
    try {
      await essayService.upsertOutlineSections(essay.id, sections.map((s, i) => ({
        essay_id: essay.id,
        parent_id: null,
        title: s.title,
        description: s.description,
        notes: s.notes,
        position: i,
        depth: 0,
      })));
      await essayService.logEvent(essay.id, 'outline_created', `Outline saved: ${sections.length} sections`);
      // Reload sections
      const updated = await essayService.listOutlineSections(essay.id);
      setOutlineSections(updated);
      toast.success('Outline saved');
      if (proceed) goToPhase('write');
    } catch {
      toast.error('Failed to save outline');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Outline Builder
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Structure your essay. Add, edit, reorder, and regenerate sections individually.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={generateFullOutline}
          disabled={generating}
          className="shrink-0"
        >
          {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
          {generating ? 'Generating…' : 'Generate Outline'}
        </Button>
      </div>

      {generating ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {sections.map((section, idx) => (
            <Card key={section.id} className="group">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div className="flex flex-col gap-0.5 shrink-0 mt-0.5">
                    <button
                      onClick={() => moveSection(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-muted disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <GripVertical className="h-4 w-4 text-muted-foreground mx-auto" />
                    <button
                      onClick={() => moveSection(idx, 'down')}
                      disabled={idx === sections.length - 1}
                      className="p-1 rounded hover:bg-muted disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">{idx + 1}</Badge>
                      <Input
                        value={section.title}
                        onChange={(e) => updateSection(idx, 'title', e.target.value)}
                        className="font-medium text-sm h-8 px-2"
                        placeholder="Section title"
                      />
                    </div>
                    <Textarea
                      value={section.description}
                      onChange={(e) => updateSection(idx, 'description', e.target.value)}
                      className="text-xs text-muted-foreground min-h-[52px] resize-none px-2 py-1.5"
                      placeholder="Description, guidance, key points for this section…"
                    />
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => regenerateSection(idx)}
                      disabled={regeneratingIdx === idx}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      aria-label="Regenerate section"
                      title="Regenerate description"
                    >
                      {regeneratingIdx === idx
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <RefreshCw className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => removeSection(idx)}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                      aria-label="Delete section"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Add section after this one */}
                <button
                  onClick={() => addSection(idx)}
                  className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity py-0.5"
                >
                  <Plus className="h-3 w-3" /> Add section here
                </button>
              </CardContent>
            </Card>
          ))}

          {/* Add first section if empty */}
          <button
            onClick={() => addSection(-1)}
            className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add Section
          </button>
        </div>
      )}

      <div className="mt-6 flex flex-col md:flex-row gap-3 justify-between">
        <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
          Save Outline
        </Button>
        <Button onClick={() => handleSave(true)} disabled={saving || sections.length === 0}>
          {saving ? 'Saving…' : 'Save & Start Writing'}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
