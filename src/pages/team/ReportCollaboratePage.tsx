import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  getReport,
  getWorkspaceWorkflows,
  getReportComments,
  createReportComment,
  submitReportForApproval,
  getReportApprovals,
  decideApprovalStep,
} from '@/lib/teamApi';
import type { CollaborationReport, ApprovalWorkflow, ReportComment, ReportApproval, Workspace } from '@/types/team';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, CheckCircle, XCircle, Send } from 'lucide-react';

export default function ReportCollaboratePage() {
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<CollaborationReport | null>(null);
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [comments, setComments] = useState<ReportComment[]>([]);
  const [approvals, setApprovals] = useState<ReportApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [decisionComment, setDecisionComment] = useState('');

  useEffect(() => {
    if (!reportId) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const found = await getReport(reportId);
        if (!mounted) return;
        setReport(found);
        const [cm, ap] = await Promise.all([
          getReportComments(reportId),
          getReportApprovals(reportId),
        ]);
        setComments(cm);
        setApprovals(ap);
        if (found) {
          const wfs = await getWorkspaceWorkflows(found.workspace_id);
          setWorkflows(wfs);
        }
      } catch (err: any) {
        toast.error('Failed to load report');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [reportId]);

  const submitComment = async () => {
    if (!reportId || !comment.trim()) return;
    try {
      const c = await createReportComment(reportId, comment.trim());
      setComments((prev) => [...prev, c]);
      setComment('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to post comment');
    }
  };

  const submitForApproval = async () => {
    if (!reportId || !selectedWorkflow) return;
    try {
      await submitReportForApproval(reportId, selectedWorkflow);
      toast.success('Submitted for approval');
      const ap = await getReportApprovals(reportId);
      setApprovals(ap);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit');
    }
  };

  const decide = async (approvalId: string, stepOrder: number, action: 'approved' | 'rejected') => {
    try {
      await decideApprovalStep(approvalId, stepOrder, action, decisionComment);
      toast.success(`Step ${action}`);
      setDecisionComment('');
      const ap = await getReportApprovals(reportId!);
      setApprovals(ap);
    } catch (err: any) {
      toast.error(err.message || 'Failed to decide');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto px-4 py-8 md:px-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{report?.title}</h1>
            <p className="text-sm text-muted-foreground">{report?.tool_type} report</p>
          </div>
          <Badge variant="outline" className="capitalize text-base">{report?.approval_status || 'none'}</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Report snapshot</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Detailed results and content are stored as a snapshot. Use comments and approvals to collaborate.</p>
                {report?.result_snapshot && (
                  <pre className="mt-4 p-4 bg-muted rounded-lg text-xs overflow-auto max-h-64">{JSON.stringify(report.result_snapshot, null, 2)}</pre>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Comments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {comments.map((c) => (
                    <div key={c.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{c.user?.display_name || c.user?.email}</span>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                      </div>
                      <p className="text-sm whitespace-pre-line">{c.content}</p>
                    </div>
                  ))}
                  {comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>}
                </div>
                <div className="flex gap-2">
                  <Textarea placeholder="Add a comment…" value={comment} onChange={(e) => setComment(e.target.value)} className="min-h-0 h-20" />
                  <Button className="shrink-0" onClick={submitComment}><Send className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Approval workflow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {report?.approval_status === 'none' && (
                  <>
                    <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                      <SelectTrigger><SelectValue placeholder="Select workflow" /></SelectTrigger>
                      <SelectContent>
                        {workflows.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button className="w-full" onClick={submitForApproval} disabled={!selectedWorkflow}>Submit for approval</Button>
                  </>
                )}
                {approvals.map((a) => (
                  <div key={a.id} className="space-y-2 text-sm">
                    <p className="font-medium capitalize">{a.status}</p>
                    <p className="text-xs text-muted-foreground">Current step: {a.current_step + 1}</p>
                    {a.status === 'pending' && (
                      <>
                        <Textarea placeholder="Decision comment (optional)" value={decisionComment} onChange={(e) => setDecisionComment(e.target.value)} className="h-20" />
                        <div className="flex gap-2">
                          <Button className="flex-1" onClick={() => decide(a.id, a.current_step + 1, 'approved')}><CheckCircle className="h-4 w-4 mr-1" /> Approve</Button>
                          <Button variant="outline" className="flex-1" onClick={() => decide(a.id, a.current_step + 1, 'rejected')}><XCircle className="h-4 w-4 mr-1" /> Reject</Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {approvals.length === 0 && report?.approval_status === 'none' && workflows.length === 0 && (
                  <p className="text-sm text-muted-foreground">No workflows configured in this workspace.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
