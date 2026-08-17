// Teacher Assignments — create and manage essay assignments
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { essayService } from '@/lib/essay/essayService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Plus, Trash2, Edit2, Copy, GraduationCap, Calendar,
  ArrowLeft, Info, Clock, GripVertical, X, CalendarClock,
} from 'lucide-react';
import type { TeacherAssignment, EssayType, CitationStyle } from '@/types/essay';
import { ESSAY_TYPE_LABELS, ACADEMIC_LEVEL_LABELS, CITATION_STYLE_LABELS } from '@/types/essay';
import MainLayout from '@/components/layouts/MainLayout';

interface RubricCriterion {
  id: string;
  title: string;
  description: string;
  max_score: number;
}

const DEFAULT_RUBRIC: RubricCriterion[] = [
  { id: 'thesis', title: 'Thesis & Argument', description: 'Clear thesis and logical argument development', max_score: 100 },
  { id: 'evidence', title: 'Evidence & Support', description: 'Relevant evidence, examples, and research support', max_score: 100 },
  { id: 'organization', title: 'Organization', description: 'Logical structure, transitions, and flow', max_score: 100 },
  { id: 'writing', title: 'Writing Quality', description: 'Grammar, clarity, style, and academic tone', max_score: 100 },
  { id: 'citation', title: 'Citation & Sources', description: 'Proper citations and integration of sources', max_score: 100 },
];

const EMPTY_FORM = {
  title: '',
  instructions: '',
  essay_type: 'argumentative' as EssayType,
  min_word_count: 500,
  max_word_count: 2000,
  citation_style: 'apa' as CitationStyle,
  required_sources: 3,
  rubric: '',
  rubric_criteria: DEFAULT_RUBRIC as RubricCriterion[],
  ai_use_policy: '',
  deadline: '',
};

export default function TeacherAssignmentsPage() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TeacherAssignment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deadlineAssignment, setDeadlineAssignment] = useState<TeacherAssignment | null>(null);
  const [newDeadline, setNewDeadline] = useState('');
  const [updatingDeadline, setUpdatingDeadline] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const a = await essayService.listAssignments();
      setAssignments(a);
    } catch {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditingAssignment(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (a: TeacherAssignment) => {
    setEditingAssignment(a);
    setForm({
      title: a.title,
      instructions: a.instructions,
      essay_type: a.essay_type,
      min_word_count: a.min_word_count,
      max_word_count: a.max_word_count,
      citation_style: a.citation_style,
      required_sources: a.required_sources,
      rubric: a.rubric,
      rubric_criteria: parseRubricCriteria(a.rubric),
      ai_use_policy: a.ai_use_policy,
      deadline: a.deadline ? new Date(a.deadline).toISOString().slice(0, 10) : '',
    });
    setDialogOpen(true);
  };

  const parseRubricCriteria = (raw: string | null): RubricCriterion[] => {
    if (!raw) return DEFAULT_RUBRIC;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].title && parsed[0].max_score) {
        return parsed;
      }
    } catch {
      // fall back to text mode
    }
    return DEFAULT_RUBRIC;
  };

  const handleCriterionChange = (id: string, key: keyof RubricCriterion, value: string | number) => {
    setForm(f => ({
      ...f,
      rubric_criteria: f.rubric_criteria.map(c => c.id === id ? { ...c, [key]: value } : c),
    }));
  };

  const addCriterion = () => {
    setForm(f => ({
      ...f,
      rubric_criteria: [...f.rubric_criteria, {
        id: `c-${Date.now()}`,
        title: '',
        description: '',
        max_score: 100,
      }],
    }));
  };

  const removeCriterion = (id: string) => {
    setForm(f => ({ ...f, rubric_criteria: f.rubric_criteria.filter(c => c.id !== id) }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        rubric: JSON.stringify(form.rubric_criteria),
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      };
      if (editingAssignment) {
        await essayService.updateAssignment(editingAssignment.id, payload);
        setAssignments(prev => prev.map(a => a.id === editingAssignment.id ? { ...a, ...payload } as TeacherAssignment : a));
        toast.success('Assignment updated');
      } else {
        const created = await essayService.createAssignment(payload);
        setAssignments(prev => [created, ...prev]);
        toast.success('Assignment created');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await essayService.deleteAssignment(deleteId);
      setAssignments(prev => prev.filter(a => a.id !== deleteId));
      toast.success('Assignment archived');
    } catch {
      toast.error('Failed to delete assignment');
    } finally {
      setDeleteId(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => toast.success('Assignment code copied!'));
  };

  const openDeadlineDialog = (a: TeacherAssignment) => {
    setDeadlineAssignment(a);
    setNewDeadline(a.deadline ? new Date(a.deadline).toISOString().slice(0, 10) : '');
  };

  const handleDeadlineSave = async () => {
    if (!deadlineAssignment) return;
    setUpdatingDeadline(true);
    try {
      const payload = {
        deadline: newDeadline ? new Date(newDeadline).toISOString() : null,
      };
      await essayService.updateAssignment(deadlineAssignment.id, payload);
      setAssignments(prev => prev.map(a => a.id === deadlineAssignment.id ? { ...a, ...payload } as TeacherAssignment : a));
      toast.success(newDeadline ? 'Deadline updated' : 'Deadline cleared');
      setDeadlineAssignment(null);
    } catch {
      toast.error('Failed to update deadline');
    } finally {
      setUpdatingDeadline(false);
    }
  };

  const update = (key: string, value: string | number) => setForm(f => ({ ...f, [key]: value }));

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/essay-studio')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" /> Teacher Assignments
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create assignments that students can link to their essays using an assignment code.
            </p>
          </div>
          <Button onClick={openNew} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" /> New Assignment
          </Button>
        </div>

        <Alert className="mb-6 border-primary/20 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <strong>Phase 1 Teacher Mode:</strong> Create assignments and share codes with students.
            Full student submission review, rubric scoring, and classroom management are coming in a future phase.
            Never use AI detection scores alone to evaluate student work.
          </AlertDescription>
        </Alert>

        {loading ? (
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <GraduationCap className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No assignments yet. Create your first assignment.</p>
              <Button onClick={openNew} className="mt-4">
                <Plus className="h-4 w-4 mr-2" /> Create Assignment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assignments.map(a => (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{a.title}</CardTitle>
                      <CardDescription className="text-sm mt-0.5 line-clamp-2">{a.instructions}</CardDescription>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDeadlineDialog(a)} title="Change deadline">
                        <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(a.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <Badge variant="secondary" className="text-xs">{ESSAY_TYPE_LABELS[a.essay_type]}</Badge>
                    <Badge variant="secondary" className="text-xs">{a.min_word_count}–{a.max_word_count} words</Badge>
                    <Badge variant="secondary" className="text-xs uppercase">{a.citation_style}</Badge>
                    {a.deadline && (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {new Date(a.deadline).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Assignment Code</p>
                      <p className="font-mono font-bold tracking-widest text-lg">{a.assignment_code}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto" onClick={() => copyCode(a.assignment_code)}>
                      <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                    </Button>
                  </div>
                  {a.ai_use_policy && (
                    <p className="text-xs text-muted-foreground mt-2">
                      AI Policy: {a.ai_use_policy.slice(0, 100)}{a.ai_use_policy.length > 100 ? '…' : ''}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create / Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingAssignment ? 'Edit Assignment' : 'Create Assignment'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
              <div>
                <Label htmlFor="asn-title">Assignment Title *</Label>
                <Input id="asn-title" value={form.title} onChange={(e) => update('title', e.target.value)} className="mt-1.5" placeholder="e.g., Argumentative Essay: Climate Policy" />
              </div>
              <div>
                <Label htmlFor="asn-instructions">Instructions</Label>
                <Textarea id="asn-instructions" value={form.instructions} onChange={(e) => update('instructions', e.target.value)} className="mt-1.5 min-h-24" placeholder="Full assignment prompt and instructions…" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Essay Type</Label>
                  <Select value={form.essay_type} onValueChange={(v) => update('essay_type', v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(ESSAY_TYPE_LABELS) as [EssayType, string][]).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Citation Style</Label>
                  <Select value={form.citation_style} onValueChange={(v) => update('citation_style', v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(CITATION_STYLE_LABELS) as [CitationStyle, string][]).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Min Words</Label>
                  <Input type="number" min={50} value={form.min_word_count} onChange={(e) => update('min_word_count', parseInt(e.target.value) || 500)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Max Words</Label>
                  <Input type="number" min={50} value={form.max_word_count} onChange={(e) => update('max_word_count', parseInt(e.target.value) || 2000)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Required Sources</Label>
                  <Input type="number" min={0} value={form.required_sources} onChange={(e) => update('required_sources', parseInt(e.target.value) || 0)} className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label>Deadline (optional)</Label>
                <Input type="date" value={form.deadline} onChange={(e) => update('deadline', e.target.value)} className="mt-1.5" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Rubric Builder</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCriterion}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Criterion
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Define the criteria teachers will use to score submissions. Each criterion can be scored out of the maximum points you set.
                </p>
                <div className="space-y-2">
                  {form.rubric_criteria.map((c, idx) => (
                    <div key={c.id} className="rounded-lg border border-border p-3 bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Criterion {idx + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-auto"
                          onClick={() => removeCriterion(c.id)}
                          disabled={form.rubric_criteria.length === 1}
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-4">
                          <Input
                            placeholder="Criterion title"
                            value={c.title}
                            onChange={(e) => handleCriterionChange(c.id, 'title', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="md:col-span-6">
                          <Input
                            placeholder="Description (what students should demonstrate)"
                            value={c.description}
                            onChange={(e) => handleCriterionChange(c.id, 'description', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Input
                            type="number"
                            min={1}
                            max={1000}
                            placeholder="Max pts"
                            value={c.max_score}
                            onChange={(e) => handleCriterionChange(c.id, 'max_score', parseInt(e.target.value) || 0)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>AI Use Policy</Label>
                <Textarea value={form.ai_use_policy} onChange={(e) => update('ai_use_policy', e.target.value)} className="mt-1.5 min-h-16" placeholder="Describe your policy on AI writing tools for this assignment…" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editingAssignment ? 'Update' : 'Create Assignment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Deadline edit dialog */}
        <Dialog open={!!deadlineAssignment} onOpenChange={() => setDeadlineAssignment(null)}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
            <DialogHeader>
              <DialogTitle>Change Deadline</DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-3">
              <p className="text-sm text-muted-foreground">
                Update the deadline for <strong>{deadlineAssignment?.title}</strong>.
              </p>
              <div>
                <Label>Deadline</Label>
                <Input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} className="mt-1.5" />
              </div>
              <p className="text-xs text-muted-foreground">
                Leave blank to remove the deadline. Students will see a warning if the deadline is near or past.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeadlineAssignment(null)}>Cancel</Button>
              <Button onClick={handleDeadlineSave} disabled={updatingDeadline}>
                {updatingDeadline ? 'Saving…' : 'Save Deadline'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Archive Assignment</AlertDialogTitle>
              <AlertDialogDescription>This assignment will be deactivated and hidden from students. Your data is preserved.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Archive</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
