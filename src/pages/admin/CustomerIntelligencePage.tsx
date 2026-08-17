import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import type { CustomerProfile, CustomerSegment, CustomerTag, SegmentRule, LeadEvent } from '@/types/cdp';
import {
  searchCustomerProfiles,
  listAllSegments,
  listAllTags,
  createSegment,
  updateSegment,
  deleteSegment,
  createTag,
  updateTag,
  deleteTag,
  getCustomerEvents,
  refreshCustomerInsights,
} from '@/lib/cdpApi';
import {
  Search, Users, RefreshCw, Plus, Trash2, Edit, Eye,
  TrendingUp, Activity, Globe, MousePointer,
} from 'lucide-react';

interface OverviewStats {
  total_profiles: number;
  anonymous_profiles: number;
  registered_profiles: number;
  active_today: number;
  active_this_week: number;
  pro_users: number;
  churn_risk: number;
}

const FIELD_OPTIONS = [
  { value: 'subscription_plan', label: 'Subscription Plan' },
  { value: 'role', label: 'Role' },
  { value: 'country', label: 'Country' },
  { value: 'engagement_score', label: 'Engagement Score' },
  { value: 'page_views', label: 'Page Views' },
  { value: 'session_count', label: 'Session Count' },
  { value: 'days_since_login', label: 'Days Since Login' },
  { value: 'days_since_signup', label: 'Days Since Signup' },
  { value: 'visited_page', label: 'Visited Page' },
  { value: 'used_tool', label: 'Used Tool' },
];

const OP_OPTIONS = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'not equals' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'in', label: 'in' },
  { value: 'contains', label: 'contains' },
];

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

function planBadge(plan: string | null) {
  const p = (plan || 'free').toLowerCase();
  if (p === 'enterprise') return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Enterprise</Badge>;
  if (p === 'business') return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Business</Badge>;
  if (p === 'pro') return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Pro</Badge>;
  return <Badge variant="secondary">Free</Badge>;
}

export default function CustomerIntelligencePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [tags, setTags] = useState<CustomerTag[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{ country?: string; plan?: string; leadStatus?: string }>({});

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [customerEvents, setCustomerEvents] = useState<LeadEvent[]>([]);
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([]);
  const [customerTags, setCustomerTags] = useState<CustomerTag[]>([]);

  const [segmentDialogOpen, setSegmentDialogOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<CustomerSegment | null>(null);
  const [segmentName, setSegmentName] = useState('');
  const [segmentDescription, setSegmentDescription] = useState('');
  const [segmentRule, setSegmentRule] = useState<SegmentRule>({
    operator: 'AND',
    conditions: [{ field: 'subscription_plan', operator_value: 'eq', value: 'free' }],
  });

  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<CustomerTag | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#3B82F6');

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Admin access required');
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const loadStats = async () => {
    const { data, error } = await supabase.rpc('get_customer_overview_stats');
    if (error) {
      toast.error(error.message);
      return;
    }
    setStats(data as OverviewStats);
  };

  const loadCustomers = async () => {
    setLoading(true);
    const { data, count } = await searchCustomerProfiles({
      query: searchQuery,
      ...filters,
      limit: 50,
    });
    setCustomers(data);
    setCustomerCount(count);
    setLoading(false);
  };

  const loadSegments = async () => {
    const segs = await listAllSegments();
    setSegments(segs);
  };

  const loadTags = async () => {
    const t = await listAllTags();
    setTags(t);
  };

  useEffect(() => {
    if (!isAdmin) return;
    void loadStats();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === 'customers') void loadCustomers();
    if (activeTab === 'segments') void loadSegments();
    if (activeTab === 'tags') void loadTags();
  }, [activeTab, isAdmin, searchQuery, filters]);

  const onTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  const openCustomer = async (customer: CustomerProfile) => {
    setSelectedCustomer(customer);
    const [events, segs, tgs] = await Promise.all([
      getCustomerEvents(customer.id, { limit: 50 }),
      supabase
        .from('customer_segment_memberships')
        .select('customer_segments(*)')
        .eq('customer_profile_id', customer.id)
        .then(({ data }) =>
          (data || [])
            .map((row: Record<string, unknown>) => row.customer_segments as CustomerSegment)
            .filter(Boolean)
        ),
      supabase
        .from('customer_tag_assignments')
        .select('customer_tags(*)')
        .eq('customer_profile_id', customer.id)
        .then(({ data }) =>
          (data || [])
            .map((row: Record<string, unknown>) => row.customer_tags as CustomerTag)
            .filter(Boolean)
        ),
    ]);
    setCustomerEvents(events);
    setCustomerSegments(segs);
    setCustomerTags(tgs);
  };

  const onRefreshInsights = async () => {
    toast.info('Refreshing customer insights...');
    await refreshCustomerInsights();
    toast.success('Customer insights refreshed');
    void loadStats();
    void loadCustomers();
  };

  const openSegmentDialog = (segment?: CustomerSegment) => {
    if (segment) {
      setEditingSegment(segment);
      setSegmentName(segment.name);
      setSegmentDescription(segment.description || '');
      setSegmentRule(segment.rules_json);
    } else {
      setEditingSegment(null);
      setSegmentName('');
      setSegmentDescription('');
      setSegmentRule({
        operator: 'AND',
        conditions: [{ field: 'subscription_plan', operator_value: 'eq', value: 'free' }],
      });
    }
    setSegmentDialogOpen(true);
  };

  const saveSegment = async () => {
    try {
      const payload = {
        name: segmentName,
        description: segmentDescription,
        rules_json: segmentRule,
      };
      if (editingSegment) {
        await updateSegment(editingSegment.id, payload);
      } else {
        await createSegment(payload);
      }
      toast.success('Segment saved');
      setSegmentDialogOpen(false);
      void loadSegments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save segment');
    }
  };

  const removeSegment = async (id: string) => {
    if (!confirm('Delete this segment?')) return;
    await deleteSegment(id);
    toast.success('Segment deleted');
    void loadSegments();
  };

  const openTagDialog = (tag?: CustomerTag) => {
    if (tag) {
      setEditingTag(tag);
      setTagName(tag.name);
      setTagColor(tag.color || '#3B82F6');
    } else {
      setEditingTag(null);
      setTagName('');
      setTagColor('#3B82F6');
    }
    setTagDialogOpen(true);
  };

  const saveTag = async () => {
    try {
      if (editingTag) {
        await updateTag(editingTag.id, tagName, tagColor);
      } else {
        await createTag(tagName, tagColor);
      }
      toast.success('Tag saved');
      setTagDialogOpen(false);
      void loadTags();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save tag');
    }
  };

  const removeTag = async (id: string) => {
    if (!confirm('Delete this tag?')) return;
    await deleteTag(id);
    toast.success('Tag deleted');
    void loadTags();
  };

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Total Profiles', value: stats.total_profiles, icon: Users },
      { label: 'Registered', value: stats.registered_profiles, icon: Activity },
      { label: 'Anonymous', value: stats.anonymous_profiles, icon: Eye },
      { label: 'Active Today', value: stats.active_today, icon: TrendingUp },
      { label: 'Active This Week', value: stats.active_this_week, icon: RefreshCw },
      { label: 'Paid Users', value: stats.pro_users, icon: Globe },
      { label: 'Churn Risk', value: stats.churn_risk, icon: MousePointer },
    ];
  }, [stats]);

  const addCondition = () => {
    setSegmentRule((prev) => ({
      ...prev,
      conditions: [...(prev.conditions || []), { field: 'subscription_plan', operator_value: 'eq', value: 'free' }],
    }));
  };

  const updateCondition = (index: number, patch: Partial<SegmentRule>) => {
    setSegmentRule((prev) => {
      const conditions = [...(prev.conditions || [])];
      conditions[index] = { ...conditions[index], ...patch };
      return { ...prev, conditions };
    });
  };

  const removeCondition = (index: number) => {
    setSegmentRule((prev) => ({
      ...prev,
      conditions: (prev.conditions || []).filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Customer Intelligence</h1>
              <p className="text-muted-foreground mt-1">Unified customer profiles, dynamic segments, and behavioral analytics.</p>
            </div>
            <Button onClick={onRefreshInsights} variant="outline" className="shrink-0">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Insights
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
          <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0">
            {['overview', 'customers', 'segments', 'tags'].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 capitalize"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {statCards.map((card) => (
                <Card key={card.label} className="border border-border shadow-none">
                  <CardContent className="p-4">
                    <card.icon className="h-4 w-4 text-muted-foreground mb-2" />
                    <div className="text-2xl font-semibold">{card.value.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">{card.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border border-border shadow-none md:col-span-2">
                <CardHeader>
                  <CardTitle>Growth Trends</CardTitle>
                  <CardDescription>New profiles over the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-md">
                    Trend visualization available via future analytics integration
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border shadow-none">
                <CardHeader>
                  <CardTitle>Lead Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['new', 'engaged', 'qualified', 'sales_ready', 'customer', 'churn_risk', 'cancelled'].map((status) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="capitalize text-sm">{status.replace('_', ' ')}</span>
                        <Badge variant="outline">
                          {customers.filter((c) => c.lead_status === status).length}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, name, company, country..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filters.plan} onValueChange={(v) => setFilters((f) => ({ ...f, plan: v === 'all' ? undefined : v }))}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.leadStatus} onValueChange={(v) => setFilters((f) => ({ ...f, leadStatus: v === 'all' ? undefined : v }))}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Lead Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {['new', 'engaged', 'qualified', 'sales_ready', 'customer', 'churn_risk', 'cancelled'].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card className="border border-border shadow-none">
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email / Name</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Engagement</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
                      ) : customers.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No customers found</TableCell></TableRow>
                      ) : (
                        customers.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell>
                              <div className="font-medium">{c.email || 'Anonymous'}</div>
                              <div className="text-xs text-muted-foreground">{c.full_name || c.username || c.visitor_id || '-'}</div>
                            </TableCell>
                            <TableCell>{planBadge(c.subscription_plan)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">{c.lead_status?.replace('_', ' ') || 'new'}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{c.engagement_score}</span>
                                <span className="text-xs text-muted-foreground capitalize">{c.engagement_level}</span>
                              </div>
                            </TableCell>
                            <TableCell>{c.country || '-'}</TableCell>
                            <TableCell>{formatDate(c.last_login_at)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => openCustomer(c)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
                <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground">
                  Showing {customers.length} of {customerCount} customers
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="segments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Segments ({segments.length})</h2>
              <Button onClick={() => openSegmentDialog()}><Plus className="mr-2 h-4 w-4" />Create Segment</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {segments.map((segment) => (
                <Card key={segment.id} className="border border-border shadow-none">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{segment.name}</CardTitle>
                      {segment.is_system && <Badge variant="secondary">System</Badge>}
                    </div>
                    <CardDescription>{segment.description || 'No description'}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{segment.is_dynamic ? 'Dynamic' : 'Static'}</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openSegmentDialog(segment)}><Edit className="h-4 w-4" /></Button>
                        {!segment.is_system && (
                          <Button variant="ghost" size="sm" onClick={() => removeSegment(segment.id)}><Trash2 className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tags" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Tags ({tags.length})</h2>
              <Button onClick={() => openTagDialog()}><Plus className="mr-2 h-4 w-4" />Create Tag</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              {tags.map((tag) => (
                <Card key={tag.id} className="border border-border shadow-none inline-flex items-center gap-3 px-4 py-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color || '#999' }} />
                  <span className="font-medium">{tag.name}</span>
                  {tag.is_system && <Badge variant="secondary" className="text-xs">System</Badge>}
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openTagDialog(tag)}><Edit className="h-3 w-3" /></Button>
                  {!tag.is_system && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeTag(tag.id)}><Trash2 className="h-3 w-3" /></Button>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-3xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <div className="font-medium">{selectedCustomer.email || 'Anonymous'}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <div className="font-medium">{selectedCustomer.full_name || '-'}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Plan</Label>
                  <div className="mt-1">{planBadge(selectedCustomer.subscription_plan)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Lead Status</Label>
                  <div className="font-medium capitalize">{selectedCustomer.lead_status?.replace('_', ' ') || 'new'}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Engagement Score</Label>
                  <div className="font-medium">{selectedCustomer.engagement_score} ({selectedCustomer.engagement_level})</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">First Channel</Label>
                  <div className="font-medium">{selectedCustomer.first_channel || '-'}</div>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Segments</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {customerSegments.map((s) => (
                    <Badge key={s.id} variant="outline">{s.name}</Badge>
                  ))}
                  {customerSegments.length === 0 && <span className="text-sm text-muted-foreground">None</span>}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {customerTags.map((t) => (
                    <Badge key={t.id} style={{ backgroundColor: t.color || '#999', color: '#fff' }}>{t.name}</Badge>
                  ))}
                  {customerTags.length === 0 && <span className="text-sm text-muted-foreground">None</span>}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Recent Activity</Label>
                <ScrollArea className="h-64 mt-2 border border-border rounded-md">
                  <div className="p-4 space-y-3">
                    {customerEvents.map((ev) => (
                      <div key={String(ev.id)} className="flex items-start justify-between text-sm border-b border-border pb-2 last:border-0">
                        <div>
                          <span className="font-medium capitalize">{String(ev.event_type).replace('_', ' ')}</span>
                          {ev.page && <span className="text-muted-foreground ml-2">{String(ev.page)}</span>}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(String(ev.created_at))}</span>
                      </div>
                    ))}
                    {customerEvents.length === 0 && <span className="text-sm text-muted-foreground">No recent events</span>}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={segmentDialogOpen} onOpenChange={setSegmentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSegment ? 'Edit Segment' : 'Create Segment'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={segmentName} onChange={(e) => setSegmentName(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={segmentDescription} onChange={(e) => setSegmentDescription(e.target.value)} />
            </div>
            <div>
              <Label>Match Operator</Label>
              <Select value={segmentRule.operator} onValueChange={(v) => setSegmentRule((r) => ({ ...r, operator: v as 'AND' | 'OR' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">All conditions (AND)</SelectItem>
                  <SelectItem value="OR">Any condition (OR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              {(segmentRule.conditions || []).map((cond, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end border border-border rounded-md p-3">
                  <div className="col-span-4">
                    <Label className="text-xs">Field</Label>
                    <Select value={cond.field} onValueChange={(v) => updateCondition(idx, { field: v })}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">Operator</Label>
                    <Select value={cond.operator_value} onValueChange={(v) => updateCondition(idx, { operator_value: v })}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OP_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4">
                    <Label className="text-xs">Value</Label>
                    <Input
                      value={String(cond.value ?? '')}
                      onChange={(e) => updateCondition(idx, { value: e.target.value })}
                      className="h-8"
                      placeholder={cond.field === 'used_tool' || cond.field === 'visited_page' ? 'tool/page' : 'value'}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="sm" onClick={() => removeCondition(idx)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addCondition}><Plus className="mr-2 h-4 w-4" />Add Condition</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSegmentDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveSegment}>Save Segment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Edit Tag' : 'Create Tag'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={tagName} onChange={(e) => setTagName(e.target.value)} />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2">
                <Input type="color" value={tagColor} onChange={(e) => setTagColor(e.target.value)} className="w-16 p-1" />
                <Input value={tagColor} onChange={(e) => setTagColor(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveTag}>Save Tag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
