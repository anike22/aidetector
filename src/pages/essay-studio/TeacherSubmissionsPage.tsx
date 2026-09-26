// TeacherSubmissionsPage — teacher views all submissions for one assignment.
// Route: /essay-studio/teacher/assignments/:assignmentId/submissions
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { essayService } from '@/lib/essay/essayService';
import type { TeacherAssignment, StudentSubmission, SubmissionStatus } from '@/types/essay';
import { SUBMISSION_STATUS_LABELS } from '@/types/essay';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ArrowLeft, ClipboardList, Search, Users, FileText,
  Calendar, Eye, CheckCircle2, AlertCircle, Clock,
} from 'lucide-react';

const STATUS_BADGE: Record<SubmissionStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  submitted: 'default',
  under_review: 'secondary',
  reviewed: 'secondary',
  returned: 'outline',
  accepted: 'secondary',
};

function StatusIcon({ status }: { status: SubmissionStatus }) {
  if (status === 'accepted') return <CheckCircle2 className="h-3.5 w-3.5 text-primary" />;
  if (status === 'under_review') return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  if (status === 'reviewed') return <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />;
  if (status === 'returned') return <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />;
  return <FileText className="h-3.5 w-3.5 text-primary" />;
}

export default function TeacherSubmissionsPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<TeacherAssignment | null>(null);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<SubmissionStatus | 'all'>('all');

  useEffect(() => {
    if (!assignmentId) { navigate('/essay-studio/teacher/assignments'); return; }
    setLoading(true);
    Promise.all([
      essayService.getAssignment(assignmentId),
      essayService.listSubmissionsForAssignment(assignmentId),
    ])
      .then(([a, subs]) => {
        if (!a) { toast.error('Assignment not found.'); navigate('/essay-studio/teacher/assignments'); return; }
        setAssignment(a);
        setSubmissions(subs);
      })
      .catch(() => toast.error('Failed to load submissions.'))
      .finally(() => setLoading(false));
  }, [assignmentId, navigate]);

  const filtered = submissions.filter((s) => {
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchesSearch = !search || s.title.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const counts = submissions.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full rounded-xl" />
        {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/essay-studio/teacher/assignments">
            <ArrowLeft className="h-4 w-4 mr-1" /> Assignments
          </Link>
        </Button>
      </div>

      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">{assignment?.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''} · Code:{' '}
            <span className="font-mono font-medium">{assignment?.assignment_code}</span>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['submitted','under_review','reviewed','accepted'] as SubmissionStatus[]).map((s) => (
          <Card
            key={s}
            className={`cursor-pointer transition-colors ${filterStatus === s ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <StatusIcon status={s} />
              <div className="min-w-0">
                <p className="text-lg font-bold">{counts[s] ?? 0}</p>
                <p className="text-xs text-muted-foreground truncate">{SUBMISSION_STATUS_LABELS[s]}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by essay title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          className="text-sm rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring shrink-0"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as SubmissionStatus | 'all')}
        >
          <option value="all">All statuses</option>
          {(Object.keys(SUBMISSION_STATUS_LABELS) as SubmissionStatus[]).map((s) => (
            <option key={s} value={s}>{SUBMISSION_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Submissions list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {submissions.length === 0 ? 'No submissions yet' : 'No submissions match your filter'}
            </p>
            {submissions.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Share assignment code <span className="font-mono font-medium">{assignment?.assignment_code}</span> with students.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub) => (
            <Card key={sub.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold truncate">{sub.title || 'Untitled Submission'}</span>
                      <Badge variant={STATUS_BADGE[sub.status]} className="text-xs shrink-0">
                        {SUBMISSION_STATUS_LABELS[sub.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" /> {sub.word_count.toLocaleString()} words
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(sub.submitted_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </span>
                      {sub.balanced_ai_score !== null && (
                        <span className={`text-xs flex items-center gap-1 ${
                          (sub.balanced_ai_score ?? 0) > 60 ? 'text-destructive' :
                          (sub.balanced_ai_score ?? 0) > 30 ? 'text-muted-foreground' : 'text-primary'
                        }`}>
                          AI: {sub.balanced_ai_score}%
                        </span>
                      )}
                      {sub.quality_score !== null && (
                        <span className="text-xs text-muted-foreground">
                          Quality: {sub.quality_score}/100
                        </span>
                      )}
                    </div>
                    {sub.student_note && (
                      <p className="text-xs text-muted-foreground mt-1.5 italic line-clamp-1">
                        Note: {sub.student_note}
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/essay-studio/teacher/submissions/${sub.id}/review`}>
                      <Eye className="h-3.5 w-3.5 mr-1.5" /> Review
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
