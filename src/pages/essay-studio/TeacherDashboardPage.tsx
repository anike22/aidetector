// TeacherDashboardPage — full teacher control centre for Essay Studio.
// Route: /essay-studio/teacher
// Sections: Overview stats, Assignments (with per-assignment submission counts),
//           All Submissions (cross-assignment, filterable), Quick-review shortcuts.
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { essayService } from '@/lib/essay/essayService';
import { useAuth } from '@/contexts/AuthContext';
import type {
  TeacherAssignment, StudentSubmission, SubmissionStatus,
} from '@/types/essay';
import {
  ESSAY_TYPE_LABELS, SUBMISSION_STATUS_LABELS,
} from '@/types/essay';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  GraduationCap, ClipboardList, Users, FileText, CheckCircle2,
  Clock, AlertCircle, Eye, Plus, Search, ChevronRight,
  BarChart2, Settings, RefreshCw, Calendar, Award,
  BookOpen, TrendingUp, Filter, Download,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AssignmentWithStats extends TeacherAssignment {
  total: number;
  pending: number;
  reviewed: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<SubmissionStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  submitted: 'default',
  under_review: 'secondary',
  reviewed: 'secondary',
  returned: 'outline',
  accepted: 'secondary',
};

function StatusDot({ status }: { status: SubmissionStatus }) {
  const colors: Record<SubmissionStatus, string> = {
    submitted: 'bg-primary',
    under_review: 'bg-muted-foreground',
    reviewed: 'bg-primary',
    returned: 'bg-muted-foreground',
    accepted: 'bg-primary',
  };
  return <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${colors[status]}`} />;
}

function StatCard({
  icon: Icon, label, value, sub, accent,
}: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; accent?: boolean;
}) {
  return (
    <Card className={accent ? 'border-primary/30 bg-primary/5' : ''}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-2.5 rounded-xl shrink-0 ${accent ? 'bg-primary/15' : 'bg-muted'}`}>
          <Icon className={`h-5 w-5 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Nav tabs ─────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'assignments' | 'submissions' | 'analytics';
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'assignments', label: 'Assignments', icon: ClipboardList },
  { id: 'submissions', label: 'All Submissions', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>('overview');
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionsLoaded, setSubmissionsLoaded] = useState(false);

  // Filters
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const a = await essayService.listAssignments();
      setAssignments(a);
    } catch {
      toast.error('Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllSubmissions = useCallback(async (asgns: TeacherAssignment[]) => {
    if (submissionsLoaded) return;
    try {
      const results = await Promise.all(
        asgns.map((a) => essayService.listSubmissionsForAssignment(a.id))
      );
      setAllSubmissions(results.flat());
      setSubmissionsLoaded(true);
    } catch {
      toast.error('Failed to load submissions.');
    }
  }, [submissionsLoaded]);

  useEffect(() => { loadAssignments(); }, [loadAssignments]);

  // Load submissions when switching to tabs that need them
  useEffect(() => {
    if ((tab === 'submissions' || tab === 'overview' || tab === 'analytics') && assignments.length > 0) {
      loadAllSubmissions(assignments);
    }
  }, [tab, assignments, loadAllSubmissions]);

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalSubmissions = allSubmissions.length;
  const pendingReview = allSubmissions.filter(
    (s) => s.status === 'submitted' || s.status === 'under_review'
  ).length;
  const reviewed = allSubmissions.filter(
    (s) => s.status === 'reviewed' || s.status === 'accepted'
  ).length;
  const uniqueStudents = new Set(allSubmissions.map((s) => s.student_id)).size;
  const avgAiScore = allSubmissions.length
    ? Math.round(
        allSubmissions
          .filter((s) => s.balanced_ai_score !== null)
          .reduce((sum, s) => sum + (s.balanced_ai_score ?? 0), 0) /
          Math.max(1, allSubmissions.filter((s) => s.balanced_ai_score !== null).length)
      )
    : null;

  // Assignments enriched with counts
  const assignmentsWithStats: AssignmentWithStats[] = assignments.map((a) => {
    const subs = allSubmissions.filter((s) => s.assignment_id === a.id);
    return {
      ...a,
      total: subs.length,
      pending: subs.filter((s) => s.status === 'submitted' || s.status === 'under_review').length,
      reviewed: subs.filter((s) => s.status === 'reviewed' || s.status === 'accepted').length,
    };
  });

  // Filtered lists
  const filteredAssignments = assignmentsWithStats.filter(
    (a) => !assignmentSearch || a.title.toLowerCase().includes(assignmentSearch.toLowerCase())
  );

  const filteredSubmissions = allSubmissions.filter((s) => {
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchSearch = !submissionSearch || s.title.toLowerCase().includes(submissionSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Recent 10 pending for overview
  const recentPending = allSubmissions
    .filter((s) => s.status === 'submitted' || s.status === 'under_review')
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    .slice(0, 10);

  const assignmentTitle = (id: string) =>
    assignments.find((a) => a.id === id)?.title ?? '—';

  const exportCSV = () => {
    if (filteredSubmissions.length === 0) {
      toast.info('No submissions to export.');
      return;
    }
    const headers = ['Status', 'Title', 'Assignment', 'Student ID', 'Word Count', 'AI Score', 'Submitted At'];
    const rows = filteredSubmissions.map((s) => [
      SUBMISSION_STATUS_LABELS[s.status],
      s.title || 'Untitled',
      assignmentTitle(s.assignment_id),
      s.student_id,
      s.word_count,
      s.balanced_ai_score !== null ? s.balanced_ai_score : '',
      new Date(s.submitted_at).toLocaleString(),
    ]);
    const escape = (v: string | number) => {
      const str = String(v);
      if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
      return str;
    };
    const csv = [headers.join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/essay-studio" className="text-muted-foreground hover:text-foreground transition-colors">
              <BookOpen className="h-5 w-5" />
            </Link>
            <span className="text-muted-foreground">/</span>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary shrink-0" />
              <span className="font-bold text-foreground">Teacher Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSubmissionsLoaded(false); loadAssignments(); }}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
            </Button>
            <Button size="sm" asChild>
              <Link to="/essay-studio/teacher/assignments">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> New Assignment
              </Link>
            </Button>
          </div>
        </div>

        {/* Tab nav */}
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex gap-1 overflow-x-auto whitespace-nowrap pb-px">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors shrink-0 ${
                  tab === id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {id === 'submissions' && pendingReview > 0 && (
                  <Badge className="ml-1 text-[10px] px-1.5 py-0 h-4">{pendingReview}</Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* ── OVERVIEW ───────────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={ClipboardList} label="Assignments" value={assignments.length} accent />
              <StatCard icon={FileText} label="Total Submissions" value={totalSubmissions} />
              <StatCard
                icon={Clock}
                label="Needs Review"
                value={pendingReview}
                sub={pendingReview > 0 ? 'Action required' : 'All caught up'}
                accent={pendingReview > 0}
              />
              <StatCard icon={Users} label="Students" value={uniqueStudents} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Pending reviews */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> Needs Review
                    {pendingReview > 0 && (
                      <Badge className="ml-auto text-xs">{pendingReview}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {loading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
                    </div>
                  ) : recentPending.length === 0 ? (
                    <div className="py-8 text-center">
                      <CheckCircle2 className="h-8 w-8 text-primary/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">All submissions reviewed!</p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-72">
                      <div className="space-y-2 pr-2">
                        {recentPending.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border hover:border-primary/30 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <StatusDot status={s.status} />
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate">{s.title || 'Untitled'}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{assignmentTitle(s.assignment_id)}</p>
                              </div>
                            </div>
                            <Button size="sm" variant="outline" className="h-7 text-xs shrink-0 px-2" asChild>
                              <Link to={`/essay-studio/teacher/submissions/${s.id}/review`}>
                                <Eye className="h-3 w-3 mr-1" /> Review
                              </Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Active assignments quick-list */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" /> Active Assignments
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setTab('assignments')}>
                      View all <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {loading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
                    </div>
                  ) : assignmentsWithStats.filter((a) => a.is_active).length === 0 ? (
                    <div className="py-8 text-center">
                      <ClipboardList className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No active assignments.</p>
                      <Button size="sm" className="mt-3" asChild>
                        <Link to="/essay-studio/teacher/assignments"><Plus className="h-3.5 w-3.5 mr-1.5" /> Create one</Link>
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-72">
                      <div className="space-y-2 pr-2">
                        {assignmentsWithStats.filter((a) => a.is_active).map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border hover:border-primary/30 transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">{a.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-muted-foreground font-mono">{a.assignment_code}</span>
                                <span className="text-[11px] text-muted-foreground">{a.total} submission{a.total !== 1 ? 's' : ''}</span>
                                {a.pending > 0 && (
                                  <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">{a.pending} new</Badge>
                                )}
                              </div>
                            </div>
                            <Button size="sm" variant="outline" className="h-7 text-xs shrink-0 px-2" asChild>
                              <Link to={`/essay-studio/teacher/assignments/${a.id}/submissions`}>
                                <Eye className="h-3 w-3 mr-1" /> View
                              </Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* ── ASSIGNMENTS ────────────────────────────────────────────────────── */}
        {tab === 'assignments' && (
          <>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-base font-semibold">All Assignments</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search assignments…"
                    value={assignmentSearch}
                    onChange={(e) => setAssignmentSearch(e.target.value)}
                    className="pl-8 h-8 text-sm w-48"
                  />
                </div>
                <Button size="sm" asChild>
                  <Link to="/essay-studio/teacher/assignments">
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> New
                  </Link>
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
              </div>
            ) : filteredAssignments.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <ClipboardList className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No assignments found.</p>
                  <Button size="sm" className="mt-4" asChild>
                    <Link to="/essay-studio/teacher/assignments"><Plus className="h-3.5 w-3.5 mr-1.5" /> Create Assignment</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredAssignments.map((a) => (
                  <Card key={a.id} className="hover:border-primary/40 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm truncate">{a.title}</span>
                            <Badge variant={a.is_active ? 'default' : 'outline'} className="text-xs shrink-0">
                              {a.is_active ? 'Active' : 'Closed'}
                            </Badge>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {ESSAY_TYPE_LABELS[a.essay_type]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-muted-foreground">
                            <span className="font-mono">{a.assignment_code}</span>
                            <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{a.total} submissions</span>
                            {a.pending > 0 && (
                              <span className="text-primary font-medium flex items-center gap-1">
                                <Clock className="h-3 w-3" />{a.pending} pending
                              </span>
                            )}
                            {a.reviewed > 0 && (
                              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{a.reviewed} reviewed</span>
                            )}
                            {a.deadline && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Due {new Date(a.deadline).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/essay-studio/teacher/assignments/${a.id}/submissions`}>
                              <Eye className="h-3.5 w-3.5 mr-1.5" /> Submissions
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── ALL SUBMISSIONS ────────────────────────────────────────────────── */}
        {tab === 'submissions' && (
          <>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-base font-semibold">All Submissions</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by title…"
                    value={submissionSearch}
                    onChange={(e) => setSubmissionSearch(e.target.value)}
                    className="pl-8 h-8 text-sm w-48"
                  />
                </div>
                <select
                  className="text-sm rounded-md border border-input bg-background px-3 py-1.5 h-8 focus:outline-none focus:ring-2 focus:ring-ring"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as SubmissionStatus | 'all')}
                >
                  <option value="all">All statuses</option>
                  {(Object.keys(SUBMISSION_STATUS_LABELS) as SubmissionStatus[]).map((s) => (
                    <option key={s} value={s}>{SUBMISSION_STATUS_LABELS[s]}</option>
                  ))}
                </select>
                <Button variant="outline" size="sm" className="h-8" onClick={exportCSV}>
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
                </Button>
              </div>
            </div>

            {/* Status summary pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {(['submitted', 'under_review', 'reviewed', 'returned', 'accepted'] as SubmissionStatus[]).map((s) => {
                const count = allSubmissions.filter((sub) => sub.status === s).length;
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border transition-colors ${
                      statusFilter === s
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    <StatusDot status={s} />
                    {SUBMISSION_STATUS_LABELS[s]} ({count})
                  </button>
                );
              })}
            </div>

            {!submissionsLoaded && loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No submissions match your filter.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredSubmissions
                  .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
                  .map((s) => (
                    <Card key={s.id} className="hover:border-primary/40 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <StatusDot status={s.status} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{s.title || 'Untitled'}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                <span className="truncate max-w-[160px]">{assignmentTitle(s.assignment_id)}</span>
                                <span>·</span>
                                <Badge variant={STATUS_BADGE[s.status]} className="text-[10px] px-1.5 py-0 h-4">
                                  {SUBMISSION_STATUS_LABELS[s.status]}
                                </Badge>
                                <span>{s.word_count.toLocaleString()}w</span>
                                {s.balanced_ai_score !== null && (
                                  <span className={s.balanced_ai_score > 60 ? 'text-destructive' : ''}>
                                    AI {s.balanced_ai_score}%
                                  </span>
                                )}
                                <span>{new Date(s.submitted_at).toLocaleDateString(undefined, { dateStyle: 'short' })}</span>
                              </div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="h-7 text-xs shrink-0 px-2" asChild>
                            <Link to={`/essay-studio/teacher/submissions/${s.id}/review`}>
                              <Eye className="h-3 w-3 mr-1" /> Review
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </>
        )}

        {/* ── ANALYTICS ──────────────────────────────────────────────────────── */}
        {tab === 'analytics' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={FileText} label="Total Submissions" value={totalSubmissions} />
              <StatCard icon={CheckCircle2} label="Reviewed" value={reviewed} sub={`${totalSubmissions ? Math.round((reviewed / totalSubmissions) * 100) : 0}% completion`} accent />
              <StatCard icon={Clock} label="Pending Review" value={pendingReview} />
              <StatCard icon={Award} label="Avg AI Score" value={avgAiScore !== null ? `${avgAiScore}%` : '—'} sub="Balanced engine" />
            </div>

            {/* AI score distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-primary" /> AI Score Distribution
                </CardTitle>
                <CardDescription className="text-xs">Breakdown of balanced AI detection scores across all reviewed submissions.</CardDescription>
              </CardHeader>
              <CardContent>
                {[
                  { label: 'Low AI risk (0–30%)', range: [0, 30], color: 'bg-primary' },
                  { label: 'Moderate (31–60%)', range: [31, 60], color: 'bg-muted-foreground' },
                  { label: 'High AI risk (61–100%)', range: [61, 100], color: 'bg-destructive' },
                ].map(({ label, range, color }) => {
                  const count = allSubmissions.filter(
                    (s) => s.balanced_ai_score !== null &&
                      (s.balanced_ai_score ?? 0) >= range[0] &&
                      (s.balanced_ai_score ?? 0) <= range[1]
                  ).length;
                  const pct = totalSubmissions ? Math.round((count / totalSubmissions) * 100) : 0;
                  return (
                    <div key={label} className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Per-assignment breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" /> Per-Assignment Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assignmentsWithStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No assignments yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[500px]">
                      <thead>
                        <tr className="text-left border-b border-border">
                          <th className="pb-2 font-medium text-muted-foreground whitespace-nowrap pr-4">Assignment</th>
                          <th className="pb-2 font-medium text-muted-foreground whitespace-nowrap text-right pr-4">Submissions</th>
                          <th className="pb-2 font-medium text-muted-foreground whitespace-nowrap text-right pr-4">Pending</th>
                          <th className="pb-2 font-medium text-muted-foreground whitespace-nowrap text-right">Reviewed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignmentsWithStats.map((a) => (
                          <tr key={a.id} className="border-b border-border/50 last:border-0">
                            <td className="py-2 pr-4">
                              <Link
                                to={`/essay-studio/teacher/assignments/${a.id}/submissions`}
                                className="hover:text-primary transition-colors font-medium truncate block max-w-[220px]"
                              >
                                {a.title}
                              </Link>
                              <span className="text-xs text-muted-foreground font-mono">{a.assignment_code}</span>
                            </td>
                            <td className="py-2 text-right pr-4 whitespace-nowrap">{a.total}</td>
                            <td className="py-2 text-right pr-4 whitespace-nowrap">
                              {a.pending > 0 ? (
                                <span className="text-primary font-medium">{a.pending}</span>
                              ) : <span className="text-muted-foreground">0</span>}
                            </td>
                            <td className="py-2 text-right whitespace-nowrap">{a.reviewed}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
