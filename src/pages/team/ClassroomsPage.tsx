import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getClassrooms, createClassroom } from '@/lib/enterpriseApi';
import { getOrganizationMembers } from '@/lib/teamApi';
import type { OrganizationMember } from '@/types/team';
import type { Classroom } from '@/types/enterprise';
import { GraduationCap, Users } from 'lucide-react';

export default function ClassroomsPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const load = async () => {
    if (!orgId) return;
    const [c, m] = await Promise.all([getClassrooms(orgId), getOrganizationMembers(orgId)]);
    setClassrooms(c);
    setMembers(m);
  };

  useEffect(() => { load(); }, [orgId]);

  const save = async () => {
    if (!name.trim()) return;
    try {
      await createClassroom(orgId!, { name, teacher_user_id: teacherId || undefined });
      toast.success('Classroom created');
      setOpen(false);
      setName('');
      setDescription('');
      setTeacherId('');
      load();
    } catch (err: any) { toast.error(err.message || 'Failed to create classroom'); }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Classrooms</h1>
              <p className="text-sm text-muted-foreground">Manage classes, students, and assignments.</p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>Create classroom</Button></DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
              <DialogHeader><DialogTitle>New classroom</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                <div><Label>Teacher</Label>
                  <Select value={teacherId} onValueChange={setTeacherId}>
                    <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                    <SelectContent>
                      {members.map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.user?.display_name || m.user?.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={save}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((c) => (
            <Link to={`/classrooms/${c.id}`} key={c.id}>
              <Card className="h-full hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="text-base font-medium truncate">{c.name}</CardTitle>
                  <CardDescription className="truncate">Code: {c.enrollment_code}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>Teacher: {c.teacher?.display_name || c.teacher?.email}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        {classrooms.length === 0 && <p className="text-center text-muted-foreground py-12">No classrooms yet.</p>}
      </div>
    </MainLayout>
  );
}
