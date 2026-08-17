// StudentFeedbackPage — student-facing grade and feedback view.
// Route: /essay-studio/submissions/:submissionId/feedback
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { essayService } from '@/lib/essay/essayService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  ArrowLeft, Award, MessageSquare, BarChart2, Shield,
  FileText, Calendar, GraduationCap, CheckCircle2,
} from 'lucide-react';
import type {
  StudentSubmission, SubmissionReview, TeacherAssignment, AIUseVerdict,
} from '@/types/essay';
import { SUBMISSION_STATUS_LABELS, AI_VERDICT_LABELS } from '@/types/essay';

const VERDICT_COLORS: Record<AIUseVerdict, string> = {
  not_reviewed: 'text-muted-foreground',
  compliant: 'text-primary',
  minor_concern: 'text-muted-foreground',
  major_concern: 'text-destructive',
  violation: 'text-destructive',
};

const VERDICT_BG: Record<AIUseVerdict, string> = {
  not_reviewed: 'bg-muted text-muted-foreground',
  compliant: 'bg-primary/10 text-primary',
  minor_concern: 'bg-muted text-muted-foreground',
  major_concern: 'bg-destructive/10 text-destructive',
  violation: 'bg-destructive/10 text-destructive',
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

export default function StudentFeedbackPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [submission, setSubmission] = useState<StudentSubmission | null>(null);
  const [assignment, setAssignment] = useState<TeacherAssignment | null>(null);
  const [review, setReview] = useState<SubmissionReview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!submissionId) { navigate('/essay-studio'); return; }
    if (!user) { navigate('/login'); return; }

    setLoading(true);
    (async () => {
      try {
        const sub = await essayService.getSubmission(submissionId);
        if (!sub) { toast.error('Submission not found.'); navigate('/essay-studio'); return; }
        if (sub.student_id !== user.id) { toast.error('You can only view your own feedback.'); navigate('/essay-studio'); return; }
        setSubmission(sub);

        const [asgn, rev] = await Promise.all([
          essayService.getAssignment(sub.assignment_id),
          essayService.getReviewForSubmission(submissionId),
        ]);
        if (asgn) setAssignment(asgn);
        setReview(rev);
      } catch {
        toast.error('Failed to load feedback.');
      } finally {
        setLoading(false);
      }
    })();
  }, [submissionId, navigate, user]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!submission) return null;

  const hasFeedback = review && (submission.status === 'reviewed' || submission.status === 'returned' || submission.status === 'accepted');

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
          <h1 className="text-xl font-bold text-foreground">Your Feedback</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {assignment ? assignment.title : 'Assignment'}
          </p>
        </div>
      </div>

      {/* Status card */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2.5 rounded-xl bg-muted shrink-0">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{submission.title || 'Untitled Submission'}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Submitted {new Date(submission.submitted_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </span>
                <span>{submission.word_count.toLocaleString()} words</span>
              </p>
            </div>
          </div>
          <Badge variant={submission.status === 'accepted' ? 'secondary' : 'outline'} className="shrink-0">
            {SUBMISSION_STATUS_LABELS[submission.status]}
          </Badge>
        </CardContent>
      </Card>

      {/* No feedback yet */}
      {!hasFeedback && (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <div className="p-4 rounded-full bg-muted inline-flex">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Feedback not available yet</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Your submission is currently <strong>{SUBMISSION_STATUS_LABELS[submission.status].toLowerCase()}</strong>. Your teacher will publish feedback soon.
            </p>
            <Button variant="outline" asChild className="mt-2">
              <Link to="/essay-studio">Back to Essay Studio</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Grade & overall feedback */}
      {hasFeedback && review && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" /> Grade
              </CardTitle>
            </CardHeader>
            <CardContent>
              {review.grade ? (
                <p className="text-3xl font-bold">{review.grade}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No grade entered.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" /> Overall Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              {review.overall_comment ? (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{review.overall_comment}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No overall comment yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Rubric scores */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" /> Rubric Scores
              </CardTitle>
              <CardDescription className="text-xs">How your submission scored against the assignment criteria.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(review.rubric_scores).length === 0 ? (
                <p className="text-sm text-muted-foreground">No rubric scores entered.</p>
              ) : (
                Object.entries(review.rubric_scores).map(([criterion, score]) => (
                  <ScoreBar key={criterion} label={criterion} value={score} />
                ))
              )}
            </CardContent>
          </Card>

          {/* AI verdict */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> AI Use Verdict
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${VERDICT_BG[review.ai_use_verdict]}`}>
                <span className="h-2 w-2 rounded-full bg-current" />
                <span className={VERDICT_COLORS[review.ai_use_verdict]}>{AI_VERDICT_LABELS[review.ai_use_verdict]}</span>
              </span>
            </CardContent>
          </Card>

          {/* Essay content */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Your Submitted Essay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[360px] rounded-lg border border-border p-3">
                <p className="text-sm font-serif leading-relaxed whitespace-pre-wrap text-foreground/90">
                  {submission.content || <span className="text-muted-foreground italic">No content</span>}
                </p>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-2">
            <Button variant="outline" asChild>
              <Link to="/essay-studio"><CheckCircle2 className="h-4 w-4 mr-2" /> Done</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
