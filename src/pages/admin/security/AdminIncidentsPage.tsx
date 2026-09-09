import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Plus, Shield, Loader2 } from 'lucide-react';
import type { Incident, IncidentStatus, IncidentSeverity } from '@/types/security';
import { getIncidents, createIncident, updateIncidentStatus, addIncidentNote } from '@/lib/securityApi';

export default function AdminIncidentsPage() {
  const { profile } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    loadIncidents();
  }, []);

  async function loadIncidents() {
    setLoading(true);
    try {
      const data = await getIncidents();
      setIncidents(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load incidents.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateIncident() {
    if (!title) return;
    try {
      await createIncident({ title, description, severity });
      toast.success('Incident opened.');
      setTitle('');
      setDescription('');
      setSeverity('medium');
      await loadIncidents();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create incident.');
    }
  }

  async function handleStatusChange(id: string, status: IncidentStatus) {
    try {
      await updateIncidentStatus(id, status);
      toast.success('Incident status updated.');
      await loadIncidents();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status.');
    }
  }

  async function handleAddNote() {
    if (!selectedIncident || !note) return;
    try {
      await addIncidentNote(selectedIncident.id, note);
      toast.success('Note added.');
      setNote('');
      const updated = await getIncidents();
      setIncidents(updated);
      setSelectedIncident(updated.find((i) => i.id === selectedIncident.id) || null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add note.');
    }
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold">Admin Access Required</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Incident Management
          </h1>
          <p className="text-muted-foreground">Create, assign, and resolve security incidents.</p>
        </div>
        <Button variant="outline" onClick={loadIncidents} disabled={loading}>Refresh</Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Open Incident</CardTitle>
          <CardDescription>Record a new security investigation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Incident title" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the incident" />
          </div>
          <div className="space-y-2">
            <Label>Severity</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as IncidentSeverity)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreateIncident} disabled={!title || loading}><Plus className="h-4 w-4 mr-2" />Open Incident</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Incidents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <Loader2 className="h-6 w-6 animate-spin" />}
          {incidents.length === 0 && !loading && <p className="text-sm text-muted-foreground">No incidents found.</p>}
          {incidents.map((incident) => (
            <div key={incident.id} className="p-4 border rounded-md space-y-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={incident.severity === 'critical' ? 'destructive' : 'secondary'}>{incident.severity}</Badge>
                    <span className="text-xs text-muted-foreground uppercase">{incident.status}</span>
                  </div>
                  <p className="font-medium mt-1">{incident.title}</p>
                  <p className="text-sm text-muted-foreground">{incident.description}</p>
                </div>
                <Select value={incident.status} onValueChange={(v) => handleStatusChange(incident.id, v as IncidentStatus)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="contained">Contained</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Opened {formatDistanceToNow(new Date(incident.created_at))} ago</span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => setSelectedIncident(incident)}>Details</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>{selectedIncident?.title}</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-2">
                      <p className="text-sm text-muted-foreground">{selectedIncident?.description}</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {(selectedIncident?.notes || []).map((n) => (
                          <div key={n.id} className="p-2 border rounded-md text-sm">
                            <p>{n.note}</p>
                            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.created_at))} ago</p>
                          </div>
                        ))}
                        {!selectedIncident?.notes?.length && <p className="text-sm text-muted-foreground">No notes.</p>}
                      </div>
                      <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" />
                      <Button onClick={handleAddNote} disabled={!note}>Add Note</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
