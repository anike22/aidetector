import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, RefreshCw, Calendar, Mail, FileText, Send, Edit2, Link as LinkIcon, DollarSign, Clock } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

export default function WebsiteCRMSection() {
  const [requests, setRequests] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const load = useCallback(async () => {
    setLoading(true);
    const [reqRes, meetRes] = await Promise.all([
      supabase.from('website_development_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('meetings').select('*').order('created_at', { ascending: false })
    ]);
    if (!reqRes.error && reqRes.data) setRequests(reqRes.data);
    if (!meetRes.error && meetRes.data) setMeetings(meetRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateRequestStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('website_development_requests').update({ status: newStatus }).eq('id', id);
    if (error) return toast.error('Failed to update status');
    toast.success('Status updated');
    load();
  };

  const updateMeetingStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('meetings').update({ status: newStatus }).eq('id', id);
    if (error) return toast.error('Failed to update status');
    toast.success('Status updated');
    load();
  };

  const filteredRequests = requests.filter(r => 
    (r.business_name || '').toLowerCase().includes(search.toLowerCase()) || 
    (r.contact_email || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'new': return 'default';
      case 'contacted': return 'secondary';
      case 'in progress': return 'outline';
      case 'completed': return 'success';
      case 'cancelled': case 'lost': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-navy">Service Leads CRM</h2>
          <p className="text-sm text-muted-foreground">Manage website development requests and consultations.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search leads by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="requests">Web Dev Requests ({requests.length})</TabsTrigger>
          <TabsTrigger value="meetings">Consultations ({meetings.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="requests" className="pt-4">
          <Card className="border-border shadow-sm">
            <div className="overflow-x-auto w-full max-w-full">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Business / Contact</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Project Details</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Budget / Date</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRequests.map(r => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-semibold text-navy">{r.business_name || 'No Business Name'}</div>
                        <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1"><Mail className="w-3 h-3"/> {r.contact_email}</div>
                        <div className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="capitalize font-medium text-navy">{r.project_type?.replace('_', ' ') || 'Not specified'}</div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2 max-w-xs" title={r.notes}>{r.notes || 'No extra notes'}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-navy font-medium"><DollarSign className="w-3 h-3 text-muted-foreground"/> {r.budget_range?.replace('_', ' ')}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1"><Clock className="w-3 h-3"/> {r.launch_date ? new Date(r.launch_date).toLocaleDateString() : 'Flexible'}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Select value={r.status} onValueChange={v => updateRequestStatus(r.id, v)}>
                          <SelectTrigger className="h-8 text-xs w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Contacted">Contacted</SelectItem>
                            <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No requests found.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="meetings" className="pt-4">
          <Card className="border-border shadow-sm">
            <div className="overflow-x-auto w-full max-w-full">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Client / Company</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Meeting Time</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Details</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {meetings.filter(m => (m.client_name||'').toLowerCase().includes(search.toLowerCase()) || (m.client_email||'').toLowerCase().includes(search.toLowerCase())).map(m => (
                    <tr key={m.id} className="hover:bg-muted/30">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-semibold text-navy">{m.client_name}</div>
                        <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1"><Mail className="w-3 h-3"/> {m.client_email}</div>
                        {m.company_name && <div className="text-xs text-muted-foreground mt-1">{m.company_name}</div>}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-medium text-navy"><Calendar className="w-3 h-3 text-muted-foreground"/> {new Date(m.meeting_date).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground mt-1">{m.meeting_time} ({m.timezone})</div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="outline" className="mb-1 capitalize">{m.meeting_type} • {m.meeting_method}</Badge>
                        <div className="text-xs text-muted-foreground line-clamp-2 max-w-xs">{m.notes}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Select value={m.status} onValueChange={v => updateMeetingStatus(m.id, v)}>
                          <SelectTrigger className="h-8 text-xs w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Scheduled">Scheduled</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                            <SelectItem value="No-Show">No-Show</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                  {meetings.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No meetings booked yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
