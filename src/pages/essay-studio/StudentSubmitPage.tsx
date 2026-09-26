// StudentSubmitPage — student submits an essay to a teacher assignment.
// Route: /essay-studio/submit-to/:assignmentId
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { essayService } from '@/lib/essay/essayService';
import { useAuth } from '@/contexts/AuthContext';
import type { TeacherAssignment, Essay } from '@/types/essay';
import { ESSAY_TYPE_LABELS } from '@/types/essay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ArrowLeft, GraduationCap, ClipboardList, Calendar,
  FileText, Loader2, CheckCircle2, AlertCircle, Upload, Clock,
} from 'lucide-react';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-muted-foreground w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm flex-1 min-w-0">{value}</span>
    </div>
  );
}

/** Returns 'past' | 'soon' (within 24 h) | 'ok' | null (no deadline) */
function deadlineStatus(deadline: string | null | undefined): 'past' | 'soon' | 'ok' | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff < 0) return 'past';
  if (diff < 24 * 60 * 60 * 1000) return 'soon';
  return 'ok';
}

export default function StudentSubmitPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState<TeacherAssignment | null>(null);
  const [myEssays, setMyEssays] = useState<Essay[]>([]);
  const [loadingAssignment, setLoadingAssignment] = useState(true);

  // Submission form state
  const [selectedEssayId, setSelectedEssayId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [studentNote, setStudentNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const dlStatus = useMemo(() => deadlineStatus(assignment?.deadline), [assignment?.deadline]);

  useEffect(() => {
    if (!assignmentId) { navigate('/essay-studio'); return; }
    setLoadingAssignment(true);
    Promise.all([
      essayService.getAssignment(assignmentId),
      essayService.listEssays({ status: 'writing', limit: 100 }),
    ])
      .then(([a, essays]) => {
        if (!a) { toast.error('Assignment not found.'); navigate('/essay-studio'); return; }
        setAssignment(a);
        setMyEssays(essays);
      })
      .catch(() => { toast.error('Failed to load assignment.'); navigate('/essay-studio'); })
      .finally(() => setLoadingAssignment(false));
  }, [assignmentId, navigate]);

  // When an essay is selected, pre-fill title + content
  const handleEssaySelect = async (essayId: string) => {
    setSelectedEssayId(essayId);
    if (!essayId) { setTitle(''); setContent(''); return; }
    try {
      const essay = await essayService.getEssay(essayId);
      if (essay) {
        setTitle(essay.title || '');
        setContent(essay.content || '');
      }
    } catch {
      toast.error('Failed to load essay content.');
    }
  };

  const handleSubmit = async () => {
    if (!assignment || !user) return;
    if (!title.trim()) { toast.error('Please enter a title for your submission.'); return; }
    if (wordCount < 10) { toast.error('Submission content is too short.'); return; }

    setSubmitting(true);
    try {
      await essayService.submitEssay({
        assignment_id: assignment.id,
        student_id: user.id,
        essay_id: selectedEssayId || null,
        title: title.trim(),
        content,
        word_count: wordCount,
        student_note: studentNote.trim(),
        status: 'submitted',
      });
      setSubmitted(true);
      toast.success('Submission sent successfully!');
    } catch (err) {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingAssignment) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-primary/10">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Submission Received</h1>
        <p className="text-muted-foreground">
          Your essay has been submitted to <span className="font-medium text-foreground">{assignment?.title}</span>.
          Your teacher will review it and provide feedback.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button variant="outline" asChild>
            <Link to="/essay-studio">Back to Essay Studio</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!assignment) return null;

  const meetsWordMin = !assignment.min_word_count || wordCount >= assignment.min_word_count;
  const meetsWordMax = !assignment.max_word_count || wordCount <= assignment.max_word_count;
  const wordCountOk = meetsWordMin && meetsWordMax;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/essay-studio"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
      </div>

      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground">Submit to Assignment</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Fill in your submission details below.</p>
        </div>
      </div>

      {/* Deadline warning banner */}
      {dlStatus === 'past' && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Deadline has passed</p>
            <p className="text-xs text-destructive/80 mt-0.5">
              This assignment was due{' '}
              {new Date(assignment.deadline!).toLocaleDateString(undefined, { dateStyle: 'long' })}.
              Late submissions may not be accepted — check with your teacher before submitting.
            </p>
          </div>
        </div>
      )}
      {dlStatus === 'soon' && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3">
          <Clock className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Due soon</p>
            <p className="text-xs text-yellow-700/80 dark:text-yellow-400/80 mt-0.5">
              This assignment is due{' '}
              {new Date(assignment.deadline!).toLocaleString(undefined, {
                dateStyle: 'medium', timeStyle: 'short',
              })}. Submit before the deadline.
            </p>
          </div>
        </div>
      )}

      {/* Assignment info card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary shrink-0" />
                {assignment.title}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Assignment code: <span className="font-mono font-medium">{assignment.assignment_code}</span>
              </CardDescription>
            </div>
            <Badge variant="secondary" className="shrink-0 text-xs">{ESSAY_TYPE_LABELS[assignment.essay_type]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {assignment.instructions && (
            <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
              {assignment.instructions}
            </p>
          )}
          <Separator className="my-2" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(assignment.min_word_count || assignment.max_word_count) && (
              <InfoRow
                label="Word count"
                value={`${assignment.min_word_count ?? '—'} – ${assignment.max_word_count ?? '—'} words`}
              />
            )}
            {assignment.required_sources > 0 && (
              <InfoRow label="Min sources" value={`${assignment.required_sources} sources`} />
            )}
            {assignment.citation_style && (
              <InfoRow label="Citation style" value={assignment.citation_style.toUpperCase()} />
            )}
            {assignment.deadline && (
              <InfoRow
                label="Due date"
                value={
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {new Date(assignment.deadline).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                }
              />
            )}
          </div>
          {assignment.ai_use_policy && (
            <div className="mt-2 flex items-start gap-2 p-2 rounded-lg bg-muted/50">
              <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">AI Policy: </span>{assignment.ai_use_policy}</p>
            </div>
          )}
          {assignment.rubric && (
            <details className="mt-1">
              <summary className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground">
                View Rubric
              </summary>
              <p className="text-xs text-muted-foreground mt-1.5 whitespace-pre-wrap pl-2 border-l border-border">{assignment.rubric}</p>
            </details>
          )}
        </CardContent>
      </Card>

      {/* Submission form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" /> Your Submission
          </CardTitle>
          <CardDescription className="text-xs">
            Import from an existing essay or paste your text directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Link from existing essay */}
          {myEssays.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Import from Essay Studio</label>
              <select
                className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                value={selectedEssayId}
                onChange={(e) => handleEssaySelect(e.target.value)}
              >
                <option value="">— Paste text manually —</option>
                {myEssays.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} ({e.word_count ?? 0} words)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Essay Title <span className="text-destructive">*</span></label>
            <Input
              placeholder="Enter your essay title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Essay Content <span className="text-destructive">*</span></label>
              <span className={`text-xs ${!wordCountOk && wordCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {wordCount.toLocaleString()} words
                {assignment.min_word_count ? ` / min ${assignment.min_word_count}` : ''}
                {assignment.max_word_count ? ` / max ${assignment.max_word_count}` : ''}
              </span>
            </div>
            <Textarea
              placeholder="Paste or type your essay content here…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[280px] font-serif text-sm leading-relaxed resize-y"
            />
            {!meetsWordMin && wordCount > 0 && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Minimum {assignment.min_word_count} words required ({assignment.min_word_count - wordCount} more needed)
              </p>
            )}
            {!meetsWordMax && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Maximum {assignment.max_word_count} words allowed ({wordCount - assignment.max_word_count} over limit)
              </p>
            )}
          </div>

          {/* Note to teacher */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Note to Teacher <span className="text-xs">(optional)</span></label>
            <Textarea
              placeholder="Any context or notes for your teacher…"
              value={studentNote}
              onChange={(e) => setStudentNote(e.target.value)}
              className="min-h-[80px] text-sm resize-none"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" asChild>
              <Link to="/essay-studio">Cancel</Link>
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !title.trim() || wordCount < 10 || !wordCountOk}
            >
              {submitting
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</>
                : <><Upload className="h-4 w-4 mr-2" /> Submit Essay</>
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
