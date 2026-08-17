// EssayPlanPage — guided setup: essay type, level, topic, instructions, etc.
import { useState, useEffect } from 'react';
import { useEssayStudio } from '@/contexts/EssayStudioContext';
import { essayService } from '@/lib/essay/essayService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ChevronRight, Target, BookOpen, Settings } from 'lucide-react';
import type { EssayType, AcademicLevel, CitationStyle } from '@/types/essay';
import {
  ESSAY_TYPE_LABELS, ACADEMIC_LEVEL_LABELS, CITATION_STYLE_LABELS
} from '@/types/essay';

export default function EssayPlanPage() {
  const { essay, setEssay, goToPhase } = useEssayStudio();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: essay?.title || '',
    essay_type: (essay?.essay_type || 'argumentative') as EssayType,
    academic_level: (essay?.academic_level || 'undergraduate') as AcademicLevel,
    topic: essay?.topic || '',
    assignment_instructions: essay?.assignment_instructions || '',
    research_question: essay?.research_question || '',
    target_word_count: essay?.target_word_count || 1000,
    citation_style: (essay?.citation_style || 'apa') as CitationStyle,
    language: essay?.language || 'English',
    deadline: essay?.deadline ? new Date(essay.deadline).toISOString().slice(0, 10) : '',
    required_sources: essay?.required_sources || 0,
  });

  useEffect(() => {
    if (essay) {
      setForm({
        title: essay.title,
        essay_type: essay.essay_type,
        academic_level: essay.academic_level,
        topic: essay.topic || '',
        assignment_instructions: essay.assignment_instructions || '',
        research_question: essay.research_question || '',
        target_word_count: essay.target_word_count,
        citation_style: essay.citation_style,
        language: essay.language,
        deadline: essay.deadline ? new Date(essay.deadline).toISOString().slice(0, 10) : '',
        required_sources: essay.required_sources,
      });
    }
  }, [essay?.id]);

  const handleSave = async (proceed = false) => {
    if (!essay) return;
    if (!form.title.trim()) { toast.error('Please enter an essay title'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        status: 'planning' as const,
      };
      await essayService.updateEssay(essay.id, payload);
      setEssay({ ...essay, ...payload });
      toast.success('Plan saved');
      if (proceed) {
        await essayService.logEvent(essay.id, 'phase_change', 'Moved to outline phase');
        goToPhase('outline');
      }
    } catch {
      toast.error('Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: string | number) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" /> Plan Your Essay
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Set up your essay — type, topic, requirements, and citation style. You can always return to update this.
        </p>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Essay Basics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Essay Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="Enter a working title for your essay"
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="essay-type">Essay Type</Label>
                <Select value={form.essay_type} onValueChange={(v) => update('essay_type', v)}>
                  <SelectTrigger id="essay-type" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(ESSAY_TYPE_LABELS) as [EssayType, string][]).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="academic-level">Academic Level</Label>
                <Select value={form.academic_level} onValueChange={(v) => update('academic_level', v)}>
                  <SelectTrigger id="academic-level" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(ACADEMIC_LEVEL_LABELS) as [AcademicLevel, string][]).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="topic">Topic / Subject</Label>
              <Input
                id="topic"
                value={form.topic}
                onChange={(e) => update('topic', e.target.value)}
                placeholder="What is your essay about?"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="research-question">Research Question (optional)</Label>
              <Input
                id="research-question"
                value={form.research_question}
                onChange={(e) => update('research_question', e.target.value)}
                placeholder="What central question does your essay address?"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="instructions">Assignment Instructions (optional)</Label>
              <Textarea
                id="instructions"
                value={form.assignment_instructions}
                onChange={(e) => update('assignment_instructions', e.target.value)}
                placeholder="Paste your assignment prompt or teacher instructions here…"
                className="mt-1.5 min-h-24 resize-y"
              />
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" /> Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="word-count">Target Word Count</Label>
                <Input
                  id="word-count"
                  type="number"
                  min={100}
                  max={50000}
                  value={form.target_word_count}
                  onChange={(e) => update('target_word_count', parseInt(e.target.value) || 1000)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="required-sources">Required Sources</Label>
                <Input
                  id="required-sources"
                  type="number"
                  min={0}
                  max={100}
                  value={form.required_sources}
                  onChange={(e) => update('required_sources', parseInt(e.target.value) || 0)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="citation-style">Citation Style</Label>
                <Select value={form.citation_style} onValueChange={(v) => update('citation_style', v)}>
                  <SelectTrigger id="citation-style" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(CITATION_STYLE_LABELS) as [CitationStyle, string][]).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="language">Language</Label>
                <Select value={form.language} onValueChange={(v) => update('language', v)}>
                  <SelectTrigger id="language" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian', 'Arabic', 'Chinese', 'Japanese', 'Other'].map(l => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="deadline">Deadline (optional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(e) => update('deadline', e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-3 justify-between">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            Save Plan
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            {saving ? 'Saving…' : 'Save & Build Outline'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
