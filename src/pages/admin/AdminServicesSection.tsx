import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Plus, Edit, Trash2, Power, Filter } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Service {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  pricing_note: string;
  created_at: string;
}

interface Inquiry {
  id: string;
  service_id: string | null;
  name: string;
  email: string;
  company: string;
  website: string;
  budget: string;
  status: string;
  message: string;
  created_at: string;
}

export function AdminServicesSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingInquiries, setLoadingInquiries] = useState(true);

  // Inquiries Filters
  const [searchInquiries, setSearchInquiries] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const loadServices = useCallback(async () => {
    setLoadingServices(true);
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) setServices(data);
    setLoadingServices(false);
  }, []);

  const loadInquiries = useCallback(async () => {
    setLoadingInquiries(true);
    const { data, error } = await supabase
      .from('service_inquiries')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setInquiries(data);
    setLoadingInquiries(false);
  }, []);

  useEffect(() => {
    loadServices();
    loadInquiries();
  }, [loadServices, loadInquiries]);

  // Handle Services
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);

  const handleSaveService = async () => {
    if (!editingService?.title || !editingService?.slug) {
      toast.error('Title and Slug are required');
      return;
    }

    const payload = {
      title: editingService.title,
      slug: editingService.slug,
      description: editingService.description || '',
      category: editingService.category || '',
      pricing_note: editingService.pricing_note || '',
      status: editingService.status || 'Active',
    };

    try {
      if (editingService.id) {
        const { error } = await supabase.from('services').update(payload).eq('id', editingService.id);
        if (error) throw error;
        toast.success('Service updated successfully');
      } else {
        const { error } = await supabase.from('services').insert([payload]);
        if (error) throw error;
        toast.success('Service created successfully');
      }
      setServiceDialogOpen(false);
      loadServices();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      toast.success('Service deleted');
      loadServices();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleToggleServiceStatus = async (service: Service) => {
    const newStatus = service.status === 'Active' ? 'Disabled' : 'Active';
    try {
      const { error } = await supabase.from('services').update({ status: newStatus }).eq('id', service.id);
      if (error) throw error;
      toast.success(`Service ${newStatus.toLowerCase()}`);
      loadServices();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Handle Inquiries
  const updateInquiryStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('service_inquiries').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      toast.success('Inquiry status updated');
      loadInquiries();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredInquiries = inquiries.filter(inq => {
    const matchesSearch = 
      inq.name?.toLowerCase().includes(searchInquiries.toLowerCase()) || 
      inq.email?.toLowerCase().includes(searchInquiries.toLowerCase()) ||
      inq.company?.toLowerCase().includes(searchInquiries.toLowerCase());
    
    const matchesService = filterService === 'all' || inq.service_id === filterService;
    const matchesStatus = filterStatus === 'all' || inq.status === filterStatus;
    
    return matchesSearch && matchesService && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold">Services & Leads</h2>
        <p className="text-muted-foreground text-sm">Manage your service offerings and track incoming inquiries.</p>
      </div>

      <Tabs defaultValue="inquiries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inquiries">Inquiries ({inquiries.length})</TabsTrigger>
          <TabsTrigger value="services">Services Management</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">All Services</h3>
            <Button onClick={() => { setEditingService({}); setServiceDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Service
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingServices ? (
              <div className="col-span-full py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : services.length === 0 ? (
              <div className="col-span-full py-10 text-center text-muted-foreground border border-dashed rounded-lg">No services found. Add one to get started.</div>
            ) : (
              services.map(service => (
                <Card key={service.id} className={service.status === 'Disabled' ? 'opacity-70 grayscale' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                      <Badge variant={service.status === 'Active' ? 'default' : 'secondary'}>{service.status}</Badge>
                    </div>
                    <CardDescription>/{service.slug}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{service.description || 'No description provided.'}</p>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleToggleServiceStatus(service)}>
                        <Power className="w-4 h-4 mr-1" /> {service.status === 'Active' ? 'Disable' : 'Enable'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setEditingService(service); setServiceDialogOpen(true); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteService(service.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="inquiries" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-lg border">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, email, or company..." 
                className="pl-9"
                value={searchInquiries}
                onChange={(e) => setSearchInquiries(e.target.value)}
              />
            </div>
            <Select value={filterService} onValueChange={setFilterService}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="null">General Inquiry</SelectItem>
                {services.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Contacted">Contacted</SelectItem>
                <SelectItem value="Qualified">Qualified</SelectItem>
                <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                <SelectItem value="Won">Won</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => loadInquiries()} size="icon" title="Refresh">
              <Loader2 className={`h-4 w-4 ${loadingInquiries ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="space-y-4">
            {loadingInquiries ? (
              <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : filteredInquiries.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground border border-dashed rounded-lg">No inquiries match your filters.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInquiries.map(inq => {
                  const srv = services.find(s => s.id === inq.service_id);
                  return (
                    <Card key={inq.id} className="flex flex-col">
                      <CardHeader className="pb-3 border-b">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{inq.name}</h4>
                          <Badge variant={inq.status === 'New' ? 'default' : inq.status === 'Won' ? 'secondary' : 'outline'}>
                            {inq.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{inq.email}</div>
                        <div className="text-xs text-muted-foreground mt-1">{new Date(inq.created_at).toLocaleString()}</div>
                      </CardHeader>
                      <CardContent className="pt-4 flex-1 flex flex-col">
                        <div className="space-y-2 text-sm flex-1">
                          {inq.company && <div className="flex"><span className="w-20 text-muted-foreground">Company:</span> <span className="font-medium">{inq.company}</span></div>}
                          {inq.budget && <div className="flex"><span className="w-20 text-muted-foreground">Budget:</span> <span className="font-medium">{inq.budget}</span></div>}
                          <div className="flex"><span className="w-20 text-muted-foreground">Service:</span> <span className="font-medium">{srv ? srv.title : 'General'}</span></div>
                          
                          <div className="mt-4 pt-4 border-t">
                            <span className="block text-xs text-muted-foreground mb-1">Message:</span>
                            <p className="text-sm line-clamp-3 bg-muted/50 p-2 rounded">{inq.message || 'No message provided.'}</p>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t">
                          <Label className="text-xs mb-2 block text-muted-foreground">Update Status</Label>
                          <Select value={inq.status} onValueChange={(val) => updateInquiryStatus(inq.id, val)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="New">New</SelectItem>
                              <SelectItem value="Contacted">Contacted</SelectItem>
                              <SelectItem value="Qualified">Qualified</SelectItem>
                              <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                              <SelectItem value="Won">Won</SelectItem>
                              <SelectItem value="Lost">Lost</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Service Dialog */}
      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService?.id ? 'Edit Service' : 'Add New Service'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Service Title *</Label>
              <Input value={editingService?.title || ''} onChange={e => setEditingService({...editingService, title: e.target.value})} placeholder="e.g. SEO Consulting" />
            </div>
            <div className="space-y-2">
              <Label>URL Slug *</Label>
              <Input value={editingService?.slug || ''} onChange={e => setEditingService({...editingService, slug: e.target.value})} placeholder="e.g. seo-consulting" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={editingService?.category || ''} onChange={e => setEditingService({...editingService, category: e.target.value})} placeholder="e.g. Marketing" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editingService?.description || ''} onChange={e => setEditingService({...editingService, description: e.target.value})} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Pricing Note</Label>
              <Input value={editingService?.pricing_note || ''} onChange={e => setEditingService({...editingService, pricing_note: e.target.value})} placeholder="e.g. Starts at $5,000/mo" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editingService?.status || 'Active'} onValueChange={(val) => setEditingService({...editingService, status: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveService}>Save Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
