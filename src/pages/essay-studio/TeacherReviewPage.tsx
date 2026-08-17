// TeacherReviewPage — teacher reads a submission and writes a review.
// Route: /essay-studio/teacher/submissions/:submissionId/review
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { essayService } from '@/lib/essay/essayService';
import { useAuth } from '@/contexts/AuthContext';
import type {
  StudentSubmission, SubmissionReview, SubmissionStatus, AIUseVerdict, TeacherAssignment,
} from '@/types/essay';
import { SUBMISSION_STATUS_LABELS, AI_VERDICT_LABELS } from '@/types/essay';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  ArrowLeft, CheckCircle2, AlertCircle, Shield, FileText,
  Calendar, Loader2, Save, ChevronDown, ChevronUp,
  BarChart2, MessageSquare, Award, Users,
} from 'lucide-react';

const VERDICT_COLORS: Record<AIUseVerdict, string> = {
  not_reviewed: 'text-muted-foreground',
  compliant: 'text-primary',
  minor_concern: 'text-muted-foreground',
  major_concern: 'text-destructive',
  violation: 'text-destructive',
};

const VERDICT_BADGE: Record<AIUseVerdict, 'secondary' | 'outline' | 'destructive' | 'default'> = {
  not_reviewed: 'outline',
  compliant: 'secondary',
  minor_concern: 'outline',
  major_concern: 'destructive',
  violation: 'destructive',
};

function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 75 ? 'bg-primary' : pct >= 50 ? 'bg-muted-foreground' : 'bg-destructive'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function TeacherReviewPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [submission, setSubmission] = useState<StudentSubmission | null>(null);
  const [assignment, setAssignment] = useState<TeacherAssignment | null>(null);
  const [existingReview, setExistingReview] = useState<SubmissionReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contentExpanded, setContentExpanded] = useState(true);

  // Review form state
  const [grade, setGrade] = useState('');
  const [overallComment, setOverallComment] = useState('');
  const [aiVerdict, setAiVerdict] = useState<AIUseVerdict>('not_reviewed');
  const [newStatus, setNewStatus] = useState<SubmissionStatus>('under_review');

  // Rubric criteria from assignment + saved scores
  interface RubricCriterion {
    id: string;
    title: string;
    description: string;
    max_score: number;
  }
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>([]);
  const [rubricScores, setRubricScores] = useState<Record<string, string>>({});

  const wordCount = submission?.word_count ?? 0;

  const load = useCallback(async () => {
    if (!submissionId) { navigate('/essay-studio/teacher/assignments'); return; }
    setLoading(true);
    try {
      const sub = await essayService.getSubmission(submissionId);
      if (!sub) { toast.error('Submission not found.'); navigate('/essay-studio/teacher/assignments'); return; }
      setSubmission(sub);
      setNewStatus(sub.status === 'submitted' ? 'under_review' : sub.status);

      const [asgn, review] = await Promise.all([
        essayService.getAssignment(sub.assignment_id),
        essayService.getReviewForSubmission(submissionId),
      ]);
      if (asgn) {
        setAssignment(asgn);
        let criteria: RubricCriterion[] = [];
        try {
          const parsed = JSON.parse(asgn.rubric || '[]');
          if (Array.isArray(parsed)) criteria = parsed;
        } catch {
          // leave empty
        }
        if (criteria.length === 0) {
          criteria = [
            { id: 'thesis', title: 'Thesis & Argument', description: 'Clear thesis and logical argument', max_score: 100 },
            { id: 'evidence', title: 'Evidence & Support', description: 'Relevant evidence and support', max_score: 100 },
            { id: 'organization', title: 'Organization', description: 'Logical structure and flow', max_score: 100 },
            { id: 'writing', title: 'Writing Quality', description: 'Grammar, clarity, style', max_score: 100 },
            { id: 'citation', title: 'Citation & Sources', description: 'Proper citations and sources', max_score: 100 },
          ];
        }
        setRubricCriteria(criteria);
        // Initialise empty scores map
        const empty: Record<string, string> = {};
        criteria.forEach(c => { empty[c.id] = ''; });
        setRubricScores(empty);
      }
      if (review) {
        setExistingReview(review);
        setGrade(review.grade ?? '');
        setOverallComment(review.overall_comment);
        setAiVerdict(review.ai_use_verdict);
        // Restore rubric scores
        const savedScores: Record<string, string> = {};
        for (const [k, v] of Object.entries(review.rubric_scores)) {
          savedScores[k] = String(v);
        }
        if (Object.keys(savedScores).length > 0) {
          setRubricScores(prev => ({ ...prev, ...savedScores }));
        }
      }
    } catch {
      toast.error('Failed to load submission.');
    } finally {
      setLoading(false);
    }
  }, [submissionId, navigate]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (finalise = false) => {
    if (!submission || !user) return;
    setSaving(true);
    try {
      const numericRubric: Record<string, number> = {};
      for (const c of rubricCriteria) {
        const v = rubricScores[c.id];
        if (v !== undefined && v !== '') {
          const n = parseFloat(v);
          if (!isNaN(n)) numericRubric[c.title] = n;
        }
      }
      await essayService.saveReview({
        submission_id: submission.id,
        teacher_id: user.id,
        grade: grade.trim() || null,
        overall_comment: overallComment.trim(),
        rubric_scores: numericRubric,
        inline_comments: existingReview?.inline_comments ?? [],
        ai_use_verdict: aiVerdict,
      });

      const statusToSet: SubmissionStatus = finalise ? 'reviewed' : newStatus;
      await essayService.updateSubmissionStatus(submission.id, statusToSet);
      setSubmission((s) => s ? { ...s, status: statusToSet } : s);

      toast.success(finalise ? 'Review published to student.' : 'Review saved.');
      if (finalise) navigate(`/essay-studio/teacher/assignments/${submission.assignment_id}/submissions`);
    } catch {
      toast.error('Failed to save review.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-[500px] rounded-xl" />
          <Skeleton className="h-[500px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!submission) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/essay-studio/teacher/assignments/${submission.assignment_id}/submissions`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Submissions
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <h1 className="text-lg font-bold truncate max-w-xs md:max-w-md">{submission.title || 'Untitled'}</h1>
          <Badge variant={submission.status === 'reviewed' ? 'secondary' : 'default'} className="text-xs shrink-0">
            {SUBMISSION_STATUS_LABELS[submission.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            Save Draft
          </Button>
          <Button size="sm" onClick={() => handleSave(true)} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
            Publish Review
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {/* ── Left: Submission content ─────────────────────────────── */}
        <div className="space-y-4">
          {/* Submission meta */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{wordCount.toLocaleString()} words</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(submission.submitted_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                {assignment && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{assignment.title}</span>}
              </div>
              {/* AI scores */}
              {(submission.balanced_ai_score !== null || submission.aggressive_ai_score !== null) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-muted-foreground" /> AI Detection Scores
                    </p>
                    {submission.balanced_ai_score !== null && (
                      <ScoreBar label="Balanced Engine AI %" value={submission.balanced_ai_score} />
                    )}
                    {submission.aggressive_ai_score !== null && (
                      <ScoreBar label="Strict Engine AI %" value={submission.aggressive_ai_score} />
                    )}
                    {submission.quality_score !== null && (
                      <ScoreBar label="Quality Score" value={submission.quality_score} />
                    )}
                  </div>
                </>
              )}
              {submission.student_note && (
                <>
                  <Separator />
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground italic">{submission.student_note}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Essay text */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Essay Content</CardTitle>
                <button onClick={() => setContentExpanded((v) => !v)} className="p-1 text-muted-foreground hover:text-foreground">
                  {contentExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </CardHeader>
            {contentExpanded && (
              <CardContent className="pt-0">
                <ScrollArea className="h-[480px]">
                  <div className="pr-3">
                    <p className="text-sm font-serif leading-relaxed whitespace-pre-wrap text-foreground/90">
                      {submission.content || <span className="text-muted-foreground italic">No content</span>}
                    </p>
                  </div>
                </ScrollArea>
              </CardContent>
            )}
          </Card>
        </div>

        {/* ── Right: Review form ────────────────────────────────────── */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" /> Grade & Feedback
              </CardTitle>
              {existingReview && (
                <CardDescription className="text-xs">
                  Last saved {new Date(existingReview.updated_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Grade */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Grade</label>
                <Input
                  placeholder="e.g. A, 88/100, Distinction…"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Overall comment */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overall Feedback</label>
                <Textarea
                  placeholder="Write your overall feedback for the student…"
                  value={overallComment}
                  onChange={(e) => setOverallComment(e.target.value)}
                  className="min-h-[140px] text-sm resize-y"
                />
              </div>

              <Separator />

              {/* Rubric scores */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <BarChart2 className="h-3.5 w-3.5" /> Rubric Scores
                </label>
                {rubricCriteria.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Loading rubric…</p>
                ) : (
                  <div className="space-y-2">
                    {rubricCriteria.map((c) => (
                      <div key={c.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate" title={c.description}>
                            {c.title} <span className="text-[10px] text-muted-foreground/70">(max {c.max_score})</span>
                          </span>
                          <Input
                            type="number"
                            min={0}
                            max={c.max_score}
                            placeholder="—"
                            value={rubricScores[c.id] ?? ''}
                            onChange={(e) => setRubricScores((prev) => ({ ...prev, [c.id]: e.target.value }))}
                            className="h-8 text-sm w-20 shrink-0"
                          />
                        </div>
                        {rubricScores[c.id] !== '' && !isNaN(Number(rubricScores[c.id])) && (
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${Math.min(100, Math.max(0, (Number(rubricScores[c.id]) / c.max_score) * 100))}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* AI use verdict */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> AI Use Verdict
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {(Object.keys(AI_VERDICT_LABELS) as AIUseVerdict[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setAiVerdict(v)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-colors text-sm ${
                        aiVerdict === v
                          ? 'border-primary bg-primary/5 font-medium'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full shrink-0 ${
                        v === 'compliant' ? 'bg-primary' :
                        v === 'minor_concern' ? 'bg-muted-foreground' :
                        v === 'major_concern' || v === 'violation' ? 'bg-destructive' :
                        'bg-border'
                      }`} />
                      <span className={VERDICT_COLORS[v]}>{AI_VERDICT_LABELS[v]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Status update */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Update Status</label>
                <select
                  className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as SubmissionStatus)}
                >
                  {(Object.keys(SUBMISSION_STATUS_LABELS) as SubmissionStatus[]).map((s) => (
                    <option key={s} value={s}>{SUBMISSION_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => handleSave(false)} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Save Draft
            </Button>
            <Button className="flex-1" onClick={() => handleSave(true)} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
              Publish Review
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
