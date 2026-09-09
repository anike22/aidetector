import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  getClassroom,
  getClassroomEnrollments,
  enrollStudent,
  removeEnrollment,
  getClassroomAssignments,
  createAssignment,
  getSubmissions,
  createSubmission,
  updateSubmission,
} from '@/lib/enterpriseApi';
import { getOrganizationMembers } from '@/lib/teamApi';
import type { Classroom, ClassroomEnrollment, Assignment, Submission } from '@/types/enterprise';
import type { OrganizationMember } from '@/types/team';
import { Users, BookOpen, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ClassroomDetailPage() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [enrollments, setEnrollments] = useState<ClassroomEnrollment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const load = async () => {
    if (!classroomId) return;
    const [room, e, a] = await Promise.all([
      getClassroom(classroomId),
      getClassroomEnrollments(classroomId),
      getClassroomAssignments(classroomId),
    ]);
    setClassroom(room);
    setEnrollments(e);
    setAssignments(a);
    if (room) {
      const m = await getOrganizationMembers(room.organization_id);
      setMembers(m);
    }
  };

  useEffect(() => { load(); }, [classroomId]);

  const [studentId, setStudentId] = useState('');
  const enroll = async () => {
    if (!studentId) return;
    try { await enrollStudent(classroomId!, studentId); toast.success('Student enrolled'); setStudentId(''); load(); } catch (err: any) { toast.error(err.message || 'Failed'); }
  };

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [dueDate, setDueDate] = useState('');
  const createAssign = async () => {
    try {
      await createAssignment(classroomId!, { title, description: desc, due_date: dueDate || undefined });
      toast.success('Assignment created'); setTitle(''); setDesc(''); setDueDate(''); load();
    } catch (err: any) { toast.error(err.message || 'Failed'); }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{classroom?.name}</h1>
            <p className="text-sm text-muted-foreground">Enrollment code: <span className="font-mono">{classroom?.enrollment_code}</span></p>
          </div>
          <p className="text-sm text-muted-foreground">Teacher: {classroom?.teacher?.display_name || classroom?.teacher?.email}</p>
        </div>
        <Tabs defaultValue="students">
          <TabsList className="mb-6">
            <TabsTrigger value="students"><Users className="h-4 w-4 mr-1" />Students</TabsTrigger>
            <TabsTrigger value="assignments"><BookOpen className="h-4 w-4 mr-1" />Assignments</TabsTrigger>
          </TabsList>
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Enrolled students</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild><Button size="sm">Enroll student</Button></DialogTrigger>
                    <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                      <DialogHeader><DialogTitle>Enroll student</DialogTitle></DialogHeader>
                      <div className="space-y-4 pt-2">
                        <Select value={studentId} onValueChange={setStudentId}>
                          <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                          <SelectContent>
                            {members.map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.user?.display_name || m.user?.email}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button onClick={enroll}>Enroll</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {enrollments.map((e) => (
                    <div key={e.id} className="flex items-center justify-between border rounded-lg p-3">
                      <span className="text-sm font-medium">{e.student?.display_name || e.student?.email}</span>
                      <Button variant="ghost" size="sm" onClick={async () => { await removeEnrollment(e.id); toast.success('Removed'); load(); }}>Remove</Button>
                    </div>
                  ))}
                  {enrollments.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No students enrolled.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Assignments</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild><Button size="sm">Create assignment</Button></DialogTrigger>
                    <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                      <DialogHeader><DialogTitle>New assignment</DialogTitle></DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                        <div><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
                        <div><Label>Due date</Label><Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
                        <Button onClick={createAssign}>Create</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  {assignments.map((a) => (
                    <button key={a.id} onClick={() => setSelectedAssignment(a)} className="w-full text-left border rounded-lg p-3 hover:border-primary transition-colors">
                      <div className="font-medium">{a.title}</div>
                      <div className="text-xs text-muted-foreground">Due {a.due_date ? new Date(a.due_date).toLocaleString() : '—'}</div>
                    </button>
                  ))}
                </div>
                {selectedAssignment && <AssignmentSubmissions assignment={selectedAssignment} members={members} onRefresh={load} />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

function AssignmentSubmissions({ assignment, members, onRefresh }: { assignment: Assignment; members: OrganizationMember[]; onRefresh: () => void }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [content, setContent] = useState('');
  const [studentId, setStudentId] = useState('');

  const load = async () => {
    const data = await getSubmissions(assignment.id);
    setSubmissions(data);
  };

  useEffect(() => { load(); }, [assignment.id]);

  const submit = async () => {
    try {
      await createSubmission(assignment.id, { student_user_id: studentId, content });
      toast.success('Submission created');
      setContent('');
      load();
      onRefresh();
    } catch (err: any) { toast.error(err.message || 'Failed'); }
  };

  const grade = async (id: string, gradeVal: string, feedback: string) => {
    try { await updateSubmission(id, { grade: gradeVal, feedback }); toast.success('Graded'); load(); onRefresh(); } catch (err: any) { toast.error(err.message); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Submissions for {assignment.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Student" /></SelectTrigger>
            <SelectContent>
              {members.map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.user?.display_name || m.user?.email}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Submission content" className="flex-1" />
          <Button onClick={submit}>Submit</Button>
        </div>
        <div className="space-y-2">
          {submissions.map((s) => (
            <div key={s.id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{s.student?.display_name || s.student?.email}</span>
                <div className="flex items-center gap-2">
                  <Input defaultValue={s.grade || ''} placeholder="Grade" className="w-20" onBlur={(e) => grade(s.id, e.target.value, s.feedback || '')} />
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{s.content}</p>
              <Input defaultValue={s.feedback || ''} placeholder="Feedback" className="mt-2" onBlur={(e) => grade(s.id, s.grade || '', e.target.value)} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
