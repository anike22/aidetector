import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus, BookOpen, FileText, GraduationCap, Clock, ChevronRight,
  Search, LayoutGrid, List, Archive, Trash2, Copy, Edit2, MoreVertical,
  CheckCircle, Pencil, BookMarked, ClipboardList, Loader2, ArrowRight,
  AlertCircle, Calendar, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { essayService } from '@/lib/essay/essayService';
import type { Essay, EssayType, EssayTemplate, TeacherAssignment, StudentSubmission } from '@/types/essay';
import { ESSAY_TYPE_LABELS, PHASE_LABELS, SUBMISSION_STATUS_LABELS } from '@/types/essay';
import type { SubmissionStatus } from '@/types/essay';
import MainLayout from '@/components/layouts/MainLayout';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  planning: 'bg-info/10 text-info',
  writing: 'bg-primary/10 text-primary',
  verifying: 'bg-warning/10 text-warning',
  improving: 'bg-warning/10 text-warning',
  submitting: 'bg-success/10 text-success',
  archived: 'bg-muted text-muted-foreground',
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-0">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{value}/{max}w</span>
    </div>
  );
}

function EssayCard({ essay, onRename, onDuplicate, onArchive, onDelete, onContinue }: {
  essay: Essay;
  onRename: (e: Essay) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onContinue: (id: string) => void;
}) {
  return (
    <Card className="group hover:shadow-md transition-shadow cursor-pointer" onClick={() => onContinue(essay.id)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{essay.title}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-muted-foreground">{ESSAY_TYPE_LABELS[essay.essay_type as EssayType]}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <Badge className={`text-xs px-1.5 py-0 ${STATUS_COLORS[essay.status] || ''}`} variant="secondary">
                {PHASE_LABELS[essay.current_phase]}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onContinue(essay.id); }}>
                <Pencil className="h-3.5 w-3.5 mr-2" /> Continue
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(essay); }}>
                <Edit2 className="h-3.5 w-3.5 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(essay.id); }}>
                <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(essay.id); }}>
                <Archive className="h-3.5 w-3.5 mr-2" /> Archive
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(essay.id); }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <ProgressBar value={essay.word_count} max={essay.target_word_count} />

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> {formatRelativeTime(essay.last_edited_at)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs px-2"
            onClick={(e) => { e.stopPropagation(); onContinue(essay.id); }}
          >
            Open <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateCard({ template, onUse }: { template: EssayTemplate; onUse: () => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={onUse}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm">{template.name}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
          </div>
          <BookMarked className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Badge variant="secondary" className="text-xs">
            {ESSAY_TYPE_LABELS[template.essay_type as EssayType]}
          </Badge>
          <Badge variant="secondary" className="text-xs uppercase">{template.citation_style}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EssayStudioHomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [essays, setEssays] = useState<Essay[]>([]);
  const [templates, setTemplates] = useState<EssayTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renameEssay, setRenameEssay] = useState<Essay | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [creating, setCreating] = useState(false);

  // ── My Submissions ────────────────────────────────────────────────────────
  const [mySubmissions, setMySubmissions] = useState<StudentSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // ── Assignment code lookup ───────────────────────────────────────────────────
  const [assignmentCode, setAssignmentCode] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [foundAssignment, setFoundAssignment] = useState<TeacherAssignment | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleLookupCode = async () => {
    const code = assignmentCode.trim().toUpperCase();
    if (!code) return;
    setLookingUp(true);
    setFoundAssignment(null);
    setLookupError(null);
    try {
      const a = await essayService.getAssignmentByCode(code);
      if (!a || !a.is_active) {
        setLookupError('No active assignment found for that code. Double-check with your teacher.');
      } else {
        setFoundAssignment(a);
      }
    } catch {
      setLookupError('Failed to look up assignment. Please try again.');
    } finally {
      setLookingUp(false);
    }
  };

  const handleJoinAssignment = () => {
    if (!foundAssignment) return;
    if (!user) { navigate('/login'); return; }
    navigate(`/essay-studio/submit-to/${foundAssignment.id}`);
  };  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [e, t] = await Promise.all([
        essayService.listEssays({ search: search || undefined }),
        essayService.listTemplates(),
      ]);
      setEssays(e);
      setTemplates(t);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load essays');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  // Load student's own submissions when user is available
  useEffect(() => {
    if (!user) return;
    setSubmissionsLoading(true);
    essayService.listMySubmissions(user.id)
      .then(setMySubmissions)
      .catch(() => {/* silent — non-critical */})
      .finally(() => setSubmissionsLoading(false));
  }, [user]);

  const handleNew = async () => {
    if (!user) { navigate('/login'); return; }
    setCreating(true);
    try {
      const essay = await essayService.createEssay({ title: 'Untitled Essay', status: 'draft', current_phase: 'plan' });
      await essayService.logEvent(essay.id, 'essay_created', 'Essay created');
      navigate(`/essay-studio/${essay.id}/plan`);
    } catch {
      toast.error('Failed to create essay');
    } finally {
      setCreating(false);
    }
  };

  const handleUseTemplate = async (template: EssayTemplate) => {
    if (!user) { navigate('/login'); return; }
    try {
      const essay = await essayService.createEssay({
        title: `${template.name}`,
        essay_type: template.essay_type,
        academic_level: template.academic_level,
        citation_style: template.citation_style,
        status: 'draft',
        current_phase: 'plan',
      });
      // Pre-seed outline sections from template
      if (Array.isArray(template.outline_structure) && template.outline_structure.length > 0) {
        await essayService.upsertOutlineSections(essay.id,
          template.outline_structure.map((s, i) => ({
            essay_id: essay.id,
            parent_id: null,
            title: s.title,
            description: s.description,
            notes: '',
            position: i,
            depth: 0,
          }))
        );
      }
      await essayService.logEvent(essay.id, 'essay_created', `Essay created from template: ${template.name}`);
      navigate(`/essay-studio/${essay.id}/plan`);
    } catch {
      toast.error('Failed to start from template');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const copy = await essayService.duplicateEssay(id);
      toast.success('Essay duplicated');
      navigate(`/essay-studio/${copy.id}/plan`);
    } catch {
      toast.error('Failed to duplicate essay');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await essayService.archiveEssay(id);
      setEssays(prev => prev.filter(e => e.id !== id));
      toast.success('Essay archived');
    } catch {
      toast.error('Failed to archive essay');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await essayService.deleteEssay(deleteId);
      setEssays(prev => prev.filter(e => e.id !== deleteId));
      toast.success('Essay deleted');
    } catch {
      toast.error('Failed to delete essay');
    } finally {
      setDeleteId(null);
    }
  };

  const handleRename = async () => {
    if (!renameEssay || !renameTitle.trim()) return;
    try {
      await essayService.renameEssay(renameEssay.id, renameTitle.trim());
      setEssays(prev => prev.map(e => e.id === renameEssay.id ? { ...e, title: renameTitle.trim() } : e));
      toast.success('Essay renamed');
    } catch {
      toast.error('Failed to rename essay');
    } finally {
      setRenameEssay(null);
    }
  };

  const recent = essays.slice(0, 3);
  const filtered = essays.filter(e =>
    !search || e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-primary" />
              Essay Studio
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Plan, write, verify, and improve your academic work.
            </p>
          </div>
          <Button onClick={handleNew} disabled={creating} size="lg" className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            {creating ? 'Creating…' : 'New Essay'}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: FileText, label: 'New Essay', desc: 'Start from scratch', action: handleNew },
            { icon: BookMarked, label: 'Templates', desc: '12 essay types', action: () => document.getElementById('templates-section')?.scrollIntoView({ behavior: 'smooth' }) },
            { icon: GraduationCap, label: 'Assignments', desc: 'Teacher mode', action: () => navigate('/essay-studio/teacher') },
            { icon: Archive, label: 'Archived', desc: 'Past essays', action: () => navigate('/essay-studio/archived') },
          ].map(({ icon: Icon, label, desc, action }) => (
            <button
              key={label}
              onClick={action}
              className="flex flex-col items-start p-3 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all text-left"
            >
              <Icon className="h-5 w-5 text-primary mb-2" />
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{desc}</span>
            </button>
          ))}
        </div>

        {/* Assignment Code Lookup */}
        <section className="mb-8">
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                Join an Assignment
              </CardTitle>
              <CardDescription className="text-xs">
                Enter the assignment code your teacher shared to submit your essay.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Code input row */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="e.g. ENG-4A2X"
                  value={assignmentCode}
                  onChange={(e) => {
                    setAssignmentCode(e.target.value.toUpperCase());
                    setFoundAssignment(null);
                    setLookupError(null);
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLookupCode(); }}
                  className="font-mono text-sm max-w-[200px]"
                  maxLength={12}
                />
                <Button
                  onClick={handleLookupCode}
                  disabled={lookingUp || !assignmentCode.trim()}
                  variant="outline"
                  size="sm"
                >
                  {lookingUp
                    ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Looking up…</>
                    : <><Search className="h-3.5 w-3.5 mr-1.5" /> Look Up</>
                  }
                </Button>
              </div>

              {/* Error */}
              {lookupError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {lookupError}
                </div>
              )}

              {/* Found assignment preview */}
              {foundAssignment && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{foundAssignment.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {ESSAY_TYPE_LABELS[foundAssignment.essay_type as EssayType]}
                        </Badge>
                        {foundAssignment.min_word_count || foundAssignment.max_word_count ? (
                          <span>
                            {foundAssignment.min_word_count ?? '—'}–{foundAssignment.max_word_count ?? '—'} words
                          </span>
                        ) : null}
                        {foundAssignment.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due {new Date(foundAssignment.deadline).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" onClick={handleJoinAssignment}>
                      Submit Essay <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </div>
                  {foundAssignment.instructions && (
                    <>
                      <Separator />
                      <p className="text-xs text-muted-foreground line-clamp-2">{foundAssignment.instructions}</p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* My Submissions */}
        {user && (
          <section className="mb-8">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" /> My Submissions
                {mySubmissions.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{mySubmissions.length}</Badge>
                )}
              </h2>
            </div>

            {submissionsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
              </div>
            ) : mySubmissions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <ClipboardList className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No submissions yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter an assignment code above to submit your essay to a teacher.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {mySubmissions.slice(0, 6).map((sub) => {
                  const statusColors: Record<SubmissionStatus, string> = {
                    submitted: 'bg-primary/10 text-primary',
                    under_review: 'bg-muted text-muted-foreground',
                    reviewed: 'bg-primary/10 text-primary',
                    returned: 'bg-muted text-muted-foreground',
                    accepted: 'bg-primary/10 text-primary',
                  };
                  return (
                    <Card key={sub.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-semibold truncate flex-1 min-w-0">
                            {sub.title || 'Untitled Submission'}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColors[sub.status as SubmissionStatus]}`}>
                            {SUBMISSION_STATUS_LABELS[sub.status as SubmissionStatus]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(sub.submitted_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </span>
                          <span>{sub.word_count.toLocaleString()} words</span>
                        </div>
                        {(sub.status === 'reviewed' || sub.status === 'returned' || sub.status === 'accepted') && (
                          <div className="mt-2 pt-2 border-t border-border">
                            <Link
                              to={`/essay-studio/submissions/${sub.id}/feedback`}
                              className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                            >
                              <Eye className="h-3 w-3" /> View feedback
                            </Link>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Recent Work */}
        {recent.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" /> Recent Work
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recent.map(essay => (
                <EssayCard
                  key={essay.id}
                  essay={essay}
                  onRename={(e) => { setRenameEssay(e); setRenameTitle(e.title); }}
                  onDuplicate={handleDuplicate}
                  onArchive={handleArchive}
                  onDelete={(id) => setDeleteId(id)}
                  onContinue={(id) => navigate(`/essay-studio/${id}/${essays.find(e => e.id === id)?.current_phase || 'write'}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* My Essays */}
        <section className="mb-10">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" /> My Essays
              {essays.length > 0 && <Badge variant="secondary" className="text-xs">{essays.length}</Badge>}
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search essays…"
                  className="pl-8 h-8 text-sm w-48"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}>
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  {search ? 'No essays match your search.' : 'No essays yet. Create your first essay to get started.'}
                </p>
                {!search && (
                  <Button onClick={handleNew} className="mt-4" disabled={creating}>
                    <Plus className="h-4 w-4 mr-2" /> Create Essay
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-3 gap-3'
              : 'flex flex-col gap-2'
            }>
              {filtered.map(essay => (
                <EssayCard
                  key={essay.id}
                  essay={essay}
                  onRename={(e) => { setRenameEssay(e); setRenameTitle(e.title); }}
                  onDuplicate={handleDuplicate}
                  onArchive={handleArchive}
                  onDelete={(id) => setDeleteId(id)}
                  onContinue={(id) => navigate(`/essay-studio/${id}/${essay.current_phase || 'write'}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Templates */}
        <section id="templates-section">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <BookMarked className="h-4 w-4 text-muted-foreground" /> Templates
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/essay-studio/templates')}>
              View all <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
          {templates.length === 0 && loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {templates.slice(0, 8).map(t => (
                <TemplateCard key={t.id} template={t} onUse={() => handleUseTemplate(t)} />
              ))}
            </div>
          )}
        </section>

        {/* Feature highlights for new users */}
        {essays.length === 0 && !loading && (
          <section className="mt-10">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Plan → Write → Verify → Improve → Cite → Submit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {[
                    { title: 'Intelligent Outline Builder', desc: 'Generate type-specific outlines you can edit, reorder, and regenerate section by section.' },
                    { title: 'Dual Detector Verification', desc: 'Run both Balanced and Strict AI analysis inside your essay workspace — no copy-pasting needed.' },
                    { title: 'Essay Quality Score', desc: 'Get scored on 11 academic dimensions with specific, actionable recommendations for each weakness.' },
                  ].map(f => (
                    <div key={f.title} className="p-3 rounded-lg bg-background border border-border">
                      <p className="font-medium mb-1">{f.title}</p>
                      <p className="text-muted-foreground text-xs">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Essay</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the essay and all its data — outline, versions, sources, citations, and history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameEssay} onOpenChange={() => setRenameEssay(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Rename Essay</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="rename-input">Title</Label>
            <Input
              id="rename-input"
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
              className="mt-1.5"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameEssay(null)}>Cancel</Button>
            <Button onClick={handleRename} disabled={!renameTitle.trim()}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
