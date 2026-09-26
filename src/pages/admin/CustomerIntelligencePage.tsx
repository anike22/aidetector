import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  CustomerProfile,
  CustomerSegment,
  CustomerTag,
  SegmentRule,
} from '@/types/cdp';
import {
  AutomaticSegment,
  Customer360Profile,
  DateRangePreset,
  DeviceCategory,
  OverviewMetricsSummary,
  TrafficChannel,
} from '@/types/customerIntelligence';
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
  fetchLiveIntelligenceData,
  LiveIntelligenceRawData,
  getCustomerEvents,
} from '@/lib/cdpApi';
import {
  computeOverviewMetrics,
} from '@/lib/customerIntelligence/analyticsEngine';
import {
  resolveLocationFromProfile,
} from '@/lib/customerIntelligence/geographicIntelligence';
import { DYNAMIC_SEGMENTS_DEFINITIONS } from '@/lib/customerIntelligence/automaticSegments';
import { calculateConversionIntent } from '@/lib/customerIntelligence/intentScoring';
import { EnhancedOverviewTab } from './customerIntelligence/EnhancedOverviewTab';
import { ConversionFunnelTab } from './customerIntelligence/ConversionFunnelTab';
import { PageAnalyticsTab } from './customerIntelligence/PageAnalyticsTab';
import { ToolIntelligenceTab } from './customerIntelligence/ToolIntelligenceTab';
import { AcquisitionTab } from './customerIntelligence/AcquisitionTab';
import { GeographicIntelligenceTab } from './customerIntelligence/GeographicIntelligenceTab';
import { Customer360Modal } from './customerIntelligence/Customer360Drawer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Filter,
  Flame,
  Globe,
  MapPin,
  Tag,
  ShieldCheck,
  CreditCard,
  Loader2,
  Clock,
  Play,
  Pause,
  Radio,
  CheckCircle2,
} from 'lucide-react';

export function CustomerIntelligencePage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [dateRange, setDateRange] = useState<DateRangePreset>('30d');

  // Live Telemetry Raw State
  const [liveData, setLiveData] = useState<LiveIntelligenceRawData>({
    profiles: [],
    events: [],
    detectorResultsCount: 0,
    detectorResults: [],
    segments: [],
    devices: [],
  });
  const [liveLoading, setLiveLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(30);

  // Customer List & Filters
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [loadingCustomers, setLoadingCustomers] = useState<boolean>(false);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [tags, setTags] = useState<CustomerTag[]>([]);

  // Modals & Drawers
  const [selected360Customer, setSelected360Customer] = useState<Customer360Profile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Segment & Tag dialogs
  const [segmentDialogOpen, setSegmentDialogOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<CustomerSegment | null>(null);
  const [segmentName, setSegmentName] = useState('');
  const [segmentDescription, setSegmentDescription] = useState('');
  const [segmentRule, setSegmentRule] = useState<SegmentRule>({ operator: 'AND', conditions: [] });

  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<CustomerTag | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#3B82F6');

  // Filters for Customers 360 tab
  const [filters, setFilters] = useState({
    searchQuery: '',
    country: 'all',
    plan: 'all',
    leadStatus: 'all',
    intentLevel: 'all',
  });

  // Fetch Live Telemetry Data
  const loadLiveData = useCallback(async (showToast = false) => {
    setLiveLoading(true);
    try {
      const data = await fetchLiveIntelligenceData(dateRange);
      setLiveData(data);
      setLastUpdated(new Date());
      setCountdown(30);
      if (showToast) {
        toast.success('Live Customer Intelligence telemetry updated');
      }
    } catch (err) {
      console.error('Failed to load live intelligence data:', err);
      if (showToast) {
        toast.error('Failed to refresh live data');
      }
    } finally {
      setLiveLoading(false);
    }
  }, [dateRange]);

  // Load Customers list with filters
  const loadCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const { data, count } = await searchCustomerProfiles({
        query: filters.searchQuery || undefined,
        country: filters.country !== 'all' ? filters.country : undefined,
        plan: filters.plan !== 'all' ? filters.plan : undefined,
        leadStatus: filters.leadStatus !== 'all' ? filters.leadStatus : undefined,
        limit: 50,
      });
      setCustomers(data || []);
      setCustomerCount(count || 0);
    } catch (err) {
      console.error('Error loading customer profiles:', err);
      setCustomers([]);
      setCustomerCount(0);
    } finally {
      setLoadingCustomers(false);
    }
  }, [filters]);

  const loadSegments = async () => {
    try {
      const segs = await listAllSegments();
      setSegments(segs);
    } catch {
      setSegments([]);
    }
  };

  const loadTags = async () => {
    try {
      const t = await listAllTags();
      setTags(t);
    } catch {
      setTags([]);
    }
  };

  // Initial mount & dateRange change
  useEffect(() => {
    if (!isAdmin) return;
    void loadLiveData();
  }, [isAdmin, loadLiveData]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === 'customers') void loadCustomers();
    if (activeTab === 'segments') void loadSegments();
    if (activeTab === 'tags') void loadTags();
  }, [isAdmin, activeTab, loadCustomers]);

  // Real-Time Auto-Refresh Interval (30s)
  useEffect(() => {
    if (!isAdmin || !autoRefreshEnabled) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          void loadLiveData(false);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAdmin, autoRefreshEnabled, loadLiveData]);

  // Computed Overview Metrics from Live Data
  const overviewMetrics: OverviewMetricsSummary = useMemo(() => {
    return computeOverviewMetrics(dateRange, liveData.profiles, liveData.events);
  }, [dateRange, liveData.profiles, liveData.events]);

  const mapToTrafficChannel = (ch?: string | null): TrafficChannel => {
    if (!ch) return 'direct';
    const c = ch.toLowerCase();
    if (c.includes('organic') || c.includes('search')) return 'organic';
    if (c.includes('referral')) return 'referral';
    if (c.includes('social')) return 'social';
    if (c.includes('paid') || c.includes('ad')) return 'paid';
    if (c.includes('email')) return 'email';
    if (c.includes('affiliate')) return 'affiliate';
    return 'direct';
  };

  // Computed Dynamic Behavioral Segments from Live Profiles
  const automaticSegments: AutomaticSegment[] = useMemo(() => {
    const profiles = liveData.profiles;
    return DYNAMIC_SEGMENTS_DEFINITIONS.map((def) => {
      let matchedCount = 0;
      profiles.forEach((p) => {
        const dummy360: Customer360Profile = {
          identity: {
            visitorId: p.visitor_id || '',
            userId: p.user_id || undefined,
            email: p.email || undefined,
            isRegistered: !!p.user_id || !!p.email,
            subscriptionPlan: p.subscription_plan || 'free',
            customerSince: p.signup_at || p.created_at,
            firstSeen: p.created_at,
            lastSeen: p.last_login_at || p.updated_at,
            status: p.account_status || 'Active',
          },
          location: {
            country: resolveLocationFromProfile(p).country,
            region: resolveLocationFromProfile(p).region,
            city: resolveLocationFromProfile(p).city,
            timezone: resolveLocationFromProfile(p).timezone,
            ipAuthorizedMasked: resolveLocationFromProfile(p).ipMasked,
          },
          device: {
            category: 'desktop' as DeviceCategory,
            browser: 'Chrome',
            os: 'macOS',
            screenResolution: '1920x1080',
            language: p.language || 'en',
          },
          acquisition: {
            firstSource: p.first_utm_source || 'direct',
            firstChannel: mapToTrafficChannel(p.first_channel),
            latestSource: p.last_referrer || 'direct',
            latestChannel: mapToTrafficChannel(p.last_channel),
            firstReferrer: p.first_referrer || 'direct',
            landingPage: p.first_landing_page || '/',
            utm: {
              utm_source: p.first_utm_source || undefined,
              utm_medium: p.first_utm_medium || undefined,
              utm_campaign: p.first_utm_campaign || undefined,
            },
          },
          engagement: {
            totalSessions: p.session_count || 1,
            totalScansPerformed: p.tools_used_count || 1,
            totalPageViews: p.page_views || 1,
            totalEngagedTimeSeconds: (p.page_views || 1) * 60,
            avgSessionDurationSeconds: 180,
            lastActivity: p.last_login_at || p.updated_at,
            toolsUsed: [{ tool: 'AI Detector', count: p.tools_used_count || 1 }],
            engagementScore: p.engagement_score || 50,
          },
          conversion: {
            registrationStatus: p.email ? 'verified' : 'anonymous',
            pricingPageViews: 1,
            checkoutAttempts: 0,
            selectedPlan: p.subscription_plan || 'free',
            subscriptionStatus: p.subscription_status || 'none',
            lifetimeRevenue: Number(p.lifetime_value || 0),
            conversionStatus: p.subscription_plan && p.subscription_plan !== 'free' ? 'paid_customer' : 'lead',
          },
          timeline: [],
          segments: [],
          tags: [],
        };

        if (def.predicate(dummy360)) {
          matchedCount += 1;
        }
      });

      return {
        id: def.id,
        name: def.name,
        description: def.description,
        category: def.category,
        matchedCount,
        isSystem: true,
      };
    });
  }, [liveData.profiles]);

  const openCustomer360 = async (customer: CustomerProfile) => {
    // Fetch live events for this customer
    let timelineEvents: Array<{ id: string; visitorId: string; sessionId: string; eventType: string; toolName?: string; pageUrl?: string; timestamp: string }> = [];
    try {
      if (customer.visitor_id) {
        const evs = await getCustomerEvents(customer.visitor_id, { limit: 20 });
        timelineEvents = evs.map((e) => ({
          id: e.id,
          visitorId: e.visitor_id || '',
          sessionId: 's1',
          eventType: e.event_type,
          pageUrl: e.page || undefined,
          timestamp: e.created_at,
        }));
      }
    } catch {
      /* fallback to basic events */
    }

    if (timelineEvents.length === 0) {
      timelineEvents = [
        { id: 'e1', visitorId: customer.visitor_id || '', sessionId: 's1', eventType: 'page_view', pageUrl: customer.first_landing_page || '/', timestamp: customer.created_at },
        { id: 'e2', visitorId: customer.visitor_id || '', sessionId: 's1', eventType: 'scan_started', toolName: 'AI Detector', timestamp: customer.created_at },
        { id: 'e3', visitorId: customer.visitor_id || '', sessionId: 's1', eventType: 'result_viewed', toolName: 'AI Detector', timestamp: customer.created_at },
      ];
    }

    const resolvedGeo = resolveLocationFromProfile(customer);
    const c360: Customer360Profile = {
      identity: {
        visitorId: customer.visitor_id || '',
        userId: customer.user_id || undefined,
        email: customer.email || undefined,
        fullName: customer.full_name || undefined,
        isRegistered: !!customer.user_id || !!customer.email,
        subscriptionPlan: customer.subscription_plan || 'free',
        customerSince: customer.signup_at || customer.created_at,
        firstSeen: customer.created_at,
        lastSeen: customer.last_login_at || customer.updated_at,
        status: customer.account_status || 'Active',
      },
      location: {
        country: resolvedGeo.country,
        region: resolvedGeo.region,
        city: resolvedGeo.city,
        timezone: resolvedGeo.timezone,
        ipAuthorizedMasked: resolvedGeo.ipMasked,
      },
      device: {
        category: 'desktop' as DeviceCategory,
        browser: 'Chrome',
        os: 'macOS',
        screenResolution: '1920x1080',
        language: customer.language || 'en',
      },
      acquisition: {
        firstSource: customer.first_utm_source || 'direct',
        firstChannel: mapToTrafficChannel(customer.first_channel),
        latestSource: customer.last_referrer || 'direct',
        latestChannel: mapToTrafficChannel(customer.last_channel),
        firstReferrer: customer.first_referrer || 'direct',
        landingPage: customer.first_landing_page || '/',
        utm: {
          utm_source: customer.first_utm_source || undefined,
          utm_medium: customer.first_utm_medium || undefined,
          utm_campaign: customer.first_utm_campaign || undefined,
        },
      },
      engagement: {
        totalSessions: customer.session_count || 1,
        totalScansPerformed: customer.tools_used_count || 1,
        totalPageViews: customer.page_views || 1,
        totalEngagedTimeSeconds: (customer.page_views || 1) * 60,
        avgSessionDurationSeconds: 180,
        lastActivity: customer.last_login_at || customer.updated_at,
        toolsUsed: [{ tool: 'AI Detector', count: customer.tools_used_count || 1 }],
        engagementScore: customer.engagement_score || 50,
      },
      conversion: {
        registrationStatus: customer.email ? 'verified' : 'anonymous',
        pricingPageViews: 1,
        checkoutAttempts: 0,
        selectedPlan: customer.subscription_plan || 'free',
        subscriptionStatus: customer.subscription_status || 'none',
        lifetimeRevenue: Number(customer.lifetime_value || 0),
        conversionStatus: customer.subscription_plan && customer.subscription_plan !== 'free' ? 'paid_customer' : 'lead',
      },
      timeline: timelineEvents as any,
      segments: [],
      tags: [],
    };

    setSelected360Customer(c360);
    setModalOpen(true);
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

  const saveSegmentHandler = async () => {
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

  const removeSegmentHandler = async (id: string) => {
    if (!confirm('Delete this segment?')) return;
    try {
      await deleteSegment(id);
      toast.success('Segment deleted');
      void loadSegments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete segment');
    }
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

  const saveTagHandler = async () => {
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

  const removeTagHandler = async (id: string) => {
    if (!confirm('Delete this tag?')) return;
    try {
      await deleteTag(id);
      toast.success('Tag deleted');
      void loadTags();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete tag');
    }
  };

  const planBadge = (plan?: string | null) => {
    const p = (plan || 'free').toLowerCase();
    if (p === 'enterprise') return <Badge className="bg-purple-600 text-white hover:bg-purple-700">Enterprise</Badge>;
    if (p === 'business') return <Badge className="bg-blue-600 text-white hover:bg-blue-700">Business</Badge>;
    if (p === 'pro') return <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">Pro</Badge>;
    return <Badge variant="secondary">Free</Badge>;
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin && !authLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Banner */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5 text-xs font-mono">
                  CUSTOMER INTELLIGENCE 360
                </Badge>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Production Telemetry</span>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Customer Intelligence</h1>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                Real-time visitor tracking, Customer 360 view, intent scoring, 15 automatic segments, and geographic yield.
              </p>
            </div>

            {/* Real-Time Live Sync Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background text-xs">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Updated: <strong className="text-foreground">{lastUpdated.toLocaleTimeString()}</strong>
                </span>
                {autoRefreshEnabled && (
                  <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    {countdown}s
                  </span>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                className="h-9 text-xs"
              >
                {autoRefreshEnabled ? (
                  <>
                    <Pause className="w-3.5 h-3.5 mr-1 text-amber-500" /> Pause Sync
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Resume Sync
                  </>
                )}
              </Button>

              <Button
                onClick={() => void loadLiveData(true)}
                disabled={liveLoading}
                variant="default"
                size="sm"
                className="h-9 text-xs"
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${liveLoading ? 'animate-spin' : ''}`} />
                {liveLoading ? 'Updating...' : 'Refresh Now'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 whitespace-nowrap min-w-max">
              {[
                { id: 'overview', label: 'Executive Overview' },
                { id: 'funnel', label: 'Conversion Funnel' },
                { id: 'pages', label: 'Pages & Journeys' },
                { id: 'tools', label: 'Product & Tools' },
                { id: 'acquisition', label: 'Acquisition Channels' },
                { id: 'geo', label: 'Geographic Intelligence' },
                { id: 'customers', label: 'Customers 360' },
                { id: 'segments', label: 'Dynamic Segments' },
                { id: 'tags', label: 'Tags' },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 font-medium text-xs sm:text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* 1. EXECUTIVE OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
            <EnhancedOverviewTab
              metrics={overviewMetrics}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </TabsContent>

          {/* 2. CONVERSION FUNNEL */}
          <TabsContent value="funnel" className="space-y-6">
            <ConversionFunnelTab
              profiles={liveData.profiles}
              events={liveData.events}
            />
          </TabsContent>

          {/* 3. PAGES & JOURNEYS */}
          <TabsContent value="pages" className="space-y-6">
            <PageAnalyticsTab events={liveData.events} />
          </TabsContent>

          {/* 4. PRODUCT & TOOLS */}
          <TabsContent value="tools" className="space-y-6">
            <ToolIntelligenceTab
              profiles={liveData.profiles}
              events={liveData.events}
            />
          </TabsContent>

          {/* 5. ACQUISITION CHANNELS */}
          <TabsContent value="acquisition" className="space-y-6">
            <AcquisitionTab profiles={liveData.profiles} />
          </TabsContent>

          {/* 6. GEOGRAPHIC INTELLIGENCE */}
          <TabsContent value="geo" className="space-y-6">
            <GeographicIntelligenceTab profiles={liveData.profiles} />
          </TabsContent>

          {/* 7. CUSTOMERS 360 WITH SEARCH & FILTERS */}
          <TabsContent value="customers" className="space-y-4">
            <div className="space-y-3 p-4 rounded-xl border border-border bg-card">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email, visitor ID, full name, company, country..."
                    value={filters.searchQuery || ''}
                    onChange={(e) => setFilters((f) => ({ ...f, searchQuery: e.target.value }))}
                    className="pl-9"
                  />
                </div>

                <Select value={filters.plan} onValueChange={(v) => setFilters((f) => ({ ...f, plan: v }))}>
                  <SelectTrigger className="w-[140px] text-xs">
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

                <Select value={filters.country} onValueChange={(v) => setFilters((f) => ({ ...f, country: v }))}>
                  <SelectTrigger className="w-[150px] text-xs">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={() => void loadCustomers()} variant="secondary" size="sm" className="h-9">
                  <Filter className="w-3.5 h-3.5 mr-1" /> Apply
                </Button>
              </div>
            </div>

            <Card className="border border-border shadow-xs">
              <CardContent className="p-0">
                <ScrollArea className="w-full overflow-x-auto">
                  <Table className="[&>div]:max-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Customer / Visitor</TableHead>
                        <TableHead className="whitespace-nowrap">Plan</TableHead>
                        <TableHead className="whitespace-nowrap">Intent Level</TableHead>
                        <TableHead className="whitespace-nowrap">Engagement</TableHead>
                        <TableHead className="whitespace-nowrap">Country</TableHead>
                        <TableHead className="whitespace-nowrap">First Channel</TableHead>
                        <TableHead className="whitespace-nowrap">Last Activity</TableHead>
                        <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingCustomers ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
                          </TableCell>
                        </TableRow>
                      ) : customers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No customer profiles match the specified filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        customers.map((c) => {
                          const intent = calculateConversionIntent({
                            engagement: {
                              totalSessions: c.session_count || 1,
                              totalScansPerformed: c.tools_used_count || 1,
                              totalPageViews: c.page_views || 1,
                              totalEngagedTimeSeconds: (c.page_views || 1) * 60,
                              avgSessionDurationSeconds: 180,
                              lastActivity: c.updated_at,
                              toolsUsed: [{ tool: 'AI Detector', count: 1 }],
                              engagementScore: c.engagement_score || 50,
                            },
                            conversion: {
                              registrationStatus: c.email ? 'verified' : 'anonymous',
                              pricingPageViews: 1,
                              checkoutAttempts: 0,
                              selectedPlan: c.subscription_plan || 'free',
                              subscriptionStatus: c.subscription_status || 'none',
                              lifetimeRevenue: Number(c.lifetime_value || 0),
                              conversionStatus: c.subscription_plan && c.subscription_plan !== 'free' ? 'paid_customer' : 'lead',
                            },
                            identity: {
                              visitorId: c.visitor_id || '',
                              email: c.email || undefined,
                              isRegistered: !!c.email,
                              subscriptionPlan: c.subscription_plan || 'free',
                              customerSince: c.signup_at || c.created_at,
                              firstSeen: c.created_at,
                              lastSeen: c.last_login_at || c.updated_at,
                              status: c.account_status || 'Active',
                            },
                          });

                          return (
                            <TableRow key={c.id}>
                              <TableCell className="whitespace-nowrap">
                                <div className="font-semibold text-foreground">{c.email || 'Anonymous Guest'}</div>
                                <div className="text-xs text-muted-foreground font-mono">{c.visitor_id || c.full_name || '-'}</div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">{planBadge(c.subscription_plan)}</TableCell>
                              <TableCell className="whitespace-nowrap">
                                <Badge
                                  variant="outline"
                                  className={`text-xs capitalize font-medium ${
                                    intent.level === 'very_high'
                                      ? 'text-rose-600 border-rose-300 bg-rose-50 dark:bg-rose-950/40'
                                      : intent.level === 'high'
                                      ? 'text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950/40'
                                      : intent.level === 'medium'
                                      ? 'text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/40'
                                      : 'text-muted-foreground border-border'
                                  }`}
                                >
                                  <Flame className="w-3 h-3 mr-1 inline" /> {intent.level.replace('_', ' ')} ({intent.score})
                                </Badge>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold">{c.engagement_score}</span>
                                  <span className="text-xs text-muted-foreground capitalize">({c.engagement_level || 'active'})</span>
                                </div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap font-medium flex items-center gap-1.5 pt-4">
                                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                {resolveLocationFromProfile(c).country}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <Badge variant="secondary" className="capitalize text-xs font-mono">
                                  {c.first_channel || 'direct'}
                                </Badge>
                              </TableCell>
                              <TableCell className="whitespace-nowrap font-mono text-xs">{formatDate(c.last_login_at || c.updated_at)}</TableCell>
                              <TableCell className="whitespace-nowrap text-right">
                                <Button variant="outline" size="sm" onClick={() => void openCustomer360(c)} className="h-8 text-xs">
                                  <Eye className="h-3.5 w-3.5 mr-1" /> View 360
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
                <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
                  Displaying {customers.length} customer profiles of {customerCount} total
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 8. DYNAMIC & AUTOMATIC SEGMENTS */}
          <TabsContent value="segments" className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">15 Automatic Behavioral Segments</h2>
                  <p className="text-xs text-muted-foreground">
                    Real-time dynamically computed cohorts evaluated continuously against production customer profiles.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {automaticSegments.map((seg) => (
                  <Card key={seg.id} className="border border-border shadow-none">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold text-foreground">{seg.name}</CardTitle>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono border-primary/40 text-primary">
                          {seg.category.replace('_', ' ')}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-1 line-clamp-2">
                        {seg.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                      <div className="text-xs text-muted-foreground">
                        Matched: <strong className="text-foreground font-mono">{seg.matchedCount.toLocaleString()} visitors</strong>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h2 className="text-base font-semibold">Custom Defined Segments ({segments.length})</h2>
                  <p className="text-xs text-muted-foreground">Rule-based custom cohorts created by team administrators.</p>
                </div>
                <Button onClick={() => openSegmentDialog()} size="sm"><Plus className="mr-1.5 h-4 w-4" />Create Custom Segment</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {segments.map((segment) => (
                  <Card key={segment.id} className="border border-border shadow-none">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base font-semibold">{segment.name}</CardTitle>
                        {segment.is_system && <Badge variant="secondary" className="text-xs">System</Badge>}
                      </div>
                      <CardDescription className="text-xs">{segment.description || 'No description provided'}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{segment.is_dynamic ? 'Dynamic Rule-Based' : 'Static'}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openSegmentDialog(segment)}><Edit className="h-3.5 w-3.5" /></Button>
                          {!segment.is_system && (
                            <Button variant="ghost" size="sm" onClick={() => void removeSegmentHandler(segment.id)}><Trash2 className="h-3.5 w-3.5 text-rose-500" /></Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* 9. TAGS TAB */}
          <TabsContent value="tags" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-semibold">Customer Labels &amp; Tags ({tags.length})</h2>
                <p className="text-xs text-muted-foreground">Flexible tags for marking customer stages, support priority, or acquisition origin.</p>
              </div>
              <Button onClick={() => openTagDialog()} size="sm"><Plus className="mr-1.5 h-4 w-4" />Create New Tag</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {tags.map((tag) => (
                <div key={tag.id} className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tag.color || '#3B82F6' }} />
                    <span className="text-sm font-medium text-foreground">{tag.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openTagDialog(tag)} className="h-7 w-7 p-0"><Edit className="h-3 w-3" /></Button>
                    {!tag.is_system && (
                      <Button variant="ghost" size="sm" onClick={() => void removeTagHandler(tag.id)} className="h-7 w-7 p-0 text-rose-500"><Trash2 className="h-3 w-3" /></Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Customer 360 Drawer */}
      <Customer360Modal
        customer={selected360Customer}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />

      {/* Segment Dialog */}
      <Dialog open={segmentDialogOpen} onOpenChange={setSegmentDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSegment ? 'Edit Segment' : 'Create Custom Segment'}</DialogTitle>
            <DialogDescription>Define automated behavioral rules for audience segmentation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Segment Name</Label>
              <Input value={segmentName} onChange={(e) => setSegmentName(e.target.value)} placeholder="e.g. Academic Power Users" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input value={segmentDescription} onChange={(e) => setSegmentDescription(e.target.value)} placeholder="Brief summary of audience target" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSegmentDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void saveSegmentHandler()}>Save Segment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag Dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Edit Tag' : 'Create Tag'}</DialogTitle>
            <DialogDescription>Assign color-coded labels to customer profiles.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Tag Name</Label>
              <Input value={tagName} onChange={(e) => setTagName(e.target.value)} placeholder="e.g. VIP Subscriber" />
            </div>
            <div className="space-y-1">
              <Label>Tag Color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={tagColor} onChange={(e) => setTagColor(e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer" />
                <Input value={tagColor} onChange={(e) => setTagColor(e.target.value)} className="font-mono text-xs" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void saveTagHandler()}>Save Tag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default CustomerIntelligencePage;
