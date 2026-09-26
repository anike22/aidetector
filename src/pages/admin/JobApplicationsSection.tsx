import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Search, Trash2, FileText, Download, ExternalLink, Calendar, MapPin, Mail, Phone, Briefcase } from 'lucide-react';
import { format } from 'date-fns';

type JobApplication = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  experience_years: string;
  location: string;
  linkedin_url: string;
  portfolio_url: string;
  cover_letter: string;
  resume_url: string;
  status: string;
  created_at: string;
};

export default function JobApplicationsSection() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  
  const uniqueRoles = Array.from(new Set(applications.map(a => a.position)));

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load job applications');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setApplications(apps => 
        apps.map(a => a.id === id ? { ...a, status: newStatus } : a)
      );
      if (selectedApp?.id === id) {
        setSelectedApp({ ...selectedApp, status: newStatus });
      }
      toast.success('Status updated successfully');
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const deleteApplication = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    try {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setApplications(apps => apps.filter(a => a.id !== id));
      setSelectedApp(null);
      toast.success('Application deleted');
    } catch (err: any) {
      toast.error('Failed to delete application');
    }
  };

  const handleDownloadResume = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from('resumes').download(path);
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = path.split('/').pop() || 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      toast.error('Failed to download resume');
    }
  };

  const filteredApps = applications.filter(a => {
    const matchesSearch = 
      a.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || a.position === filterRole;
    return matchesSearch && matchesRole;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-500/10 text-blue-500';
      case 'Reviewed': return 'bg-yellow-500/10 text-yellow-500';
      case 'Shortlisted': return 'bg-purple-500/10 text-purple-500';
      case 'Rejected': return 'bg-red-500/10 text-red-500';
      case 'Hired': return 'bg-green-500/10 text-green-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-navy">Job Applications</h2>
          <p className="text-muted-foreground">Manage and review candidates</p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-full sm:w-64">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {uniqueRoles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold rounded-tl-lg">Candidate</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Applied</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Loading applications...</td></tr>
                ) : filteredApps.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No applications found</td></tr>
                ) : (
                  filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-navy">{app.full_name}</div>
                        <div className="text-xs text-muted-foreground">{app.email}</div>
                      </td>
                      <td className="px-4 py-3 text-navy font-medium">{app.position}</td>
                      <td className="px-4 py-3 text-muted-foreground">{format(new Date(app.created_at), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={`${getStatusColor(app.status)} border-0`}>
                          {app.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedApp(app)}>
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Application Detail Modal */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto">
          {selectedApp && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl">{selectedApp.full_name}</DialogTitle>
                    <DialogDescription className="mt-1">{selectedApp.position}</DialogDescription>
                  </div>
                  <Badge variant="secondary" className={`${getStatusColor(selectedApp.status)} border-0 text-sm px-3 py-1`}>
                    {selectedApp.status}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <a href={`mailto:${selectedApp.email}`} className="text-primary hover:underline">{selectedApp.email}</a>
                  </div>
                  {selectedApp.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>{selectedApp.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{selectedApp.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{selectedApp.experience_years} years exp.</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>Applied {format(new Date(selectedApp.created_at), 'PPP')}</span>
                  </div>
                </div>

                {/* Links */}
                {(selectedApp.linkedin_url || selectedApp.portfolio_url) && (
                  <div className="flex flex-wrap gap-4">
                    {selectedApp.linkedin_url && (
                      <a href={selectedApp.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline bg-primary/5 px-3 py-2 rounded-lg">
                        <ExternalLink className="w-4 h-4" /> LinkedIn Profile
                      </a>
                    )}
                    {selectedApp.portfolio_url && (
                      <a href={selectedApp.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline bg-primary/5 px-3 py-2 rounded-lg">
                        <ExternalLink className="w-4 h-4" /> Portfolio / GitHub
                      </a>
                    )}
                  </div>
                )}

                {/* Resume Download */}
                <div className="p-4 border border-border/50 rounded-xl flex items-center justify-between bg-card shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-navy text-sm">Resume / CV</h4>
                      <p className="text-xs text-muted-foreground">Stored securely</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDownloadResume(selectedApp.resume_url)}>
                    <Download className="w-4 h-4 mr-2" /> Download
                  </Button>
                </div>

                {/* Cover Letter */}
                {selectedApp.cover_letter && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-navy">Cover Letter / Message</h4>
                    <div className="bg-muted/20 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
                      {selectedApp.cover_letter}
                    </div>
                  </div>
                )}

                <div className="border-t border-border pt-6 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-navy">Update Status:</span>
                    <Select value={selectedApp.status} onValueChange={(val) => updateStatus(selectedApp.id, val)}>
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Reviewed">Reviewed</SelectItem>
                        <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="Hired">Hired</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button variant="destructive" size="sm" onClick={() => deleteApplication(selectedApp.id)} className="bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600 border-0">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}