import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getClientWorkspaces, createClientWorkspace, updateClientWorkspace } from '@/lib/enterpriseApi';
import type { ClientWorkspace } from '@/types/enterprise';
import { Briefcase } from 'lucide-react';

export default function ClientWorkspacesPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const [clients, setClients] = useState<ClientWorkspace[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('');

  const load = async () => {
    if (!orgId) return;
    const data = await getClientWorkspaces(orgId);
    setClients(data);
  };

  useEffect(() => { load(); }, [orgId]);

  const save = async () => {
    if (!name.trim()) return;
    try {
      await createClientWorkspace(orgId!, { client_name: name, notes, branding: { primary_color: color } });
      toast.success('Client workspace created');
      setOpen(false);
      setName('');
      setNotes('');
      setColor('');
      load();
    } catch (err: any) { toast.error(err.message || 'Failed'); }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Briefcase className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Client workspaces</h1>
              <p className="text-sm text-muted-foreground">Manage agency clients, branding, and usage.</p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>New client workspace</Button></DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
              <DialogHeader><DialogTitle>New client workspace</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Client name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
                <div><Label>Primary brand color</Label><Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#3b82f6" /></div>
                <Button onClick={save}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => (
            <Card key={c.id} className="h-full border-t-4" style={{ borderTopColor: c.branding?.primary_color || 'hsl(var(--primary))' }}>
              <CardHeader>
                <CardTitle className="text-base font-medium">{c.client_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{c.notes || 'No notes'}</p>
                <p className="text-xs text-muted-foreground mt-2">Team allocations: {c.allocated_team_ids?.length || 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        {clients.length === 0 && <p className="text-center text-muted-foreground py-12">No client workspaces yet.</p>}
      </div>
    </MainLayout>
  );
}
