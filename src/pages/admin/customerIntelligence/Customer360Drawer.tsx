import React, { useState } from 'react';
import { Customer360Profile, JourneyEventType } from '@/types/customerIntelligence';
import { calculateConversionIntent } from '@/lib/customerIntelligence/intentScoring';
import { evaluateCustomerDynamicSegments } from '@/lib/customerIntelligence/automaticSegments';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  User,
  MapPin,
  Compass,
  Laptop,
  Activity,
  CreditCard,
  History,
  ShieldAlert,
  ArrowRight,
  Clock,
  Sparkles,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
  Lock,
  Flame,
  Zap,
} from 'lucide-react';

interface Customer360ModalProps {
  customer: Customer360Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Customer360Modal({ customer, open, onOpenChange }: Customer360ModalProps) {
  const [timelineFilter, setTimelineFilter] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'journey'>('profile');

  if (!customer) return null;

  const intent = calculateConversionIntent(customer);
  const dynamicSegments = evaluateCustomerDynamicSegments(customer);

  const filteredTimeline = customer.timeline.filter((ev) => {
    if (timelineFilter === 'all') return true;
    if (timelineFilter === 'scans') return ev.eventType.includes('scan') || ev.eventType.includes('tool');
    if (timelineFilter === 'conversion') return ev.eventType.includes('checkout') || ev.eventType.includes('plan') || ev.eventType.includes('pricing') || ev.eventType.includes('subscription');
    if (timelineFilter === 'auth') return ev.eventType.includes('registration') || ev.eventType.includes('login');
    if (timelineFilter === 'navigation') return ev.eventType === 'page_view';
    return true;
  });

  const getEventIcon = (type: JourneyEventType) => {
    if (type.includes('checkout') || type.includes('subscription')) return <CreditCard className="w-4 h-4 text-emerald-500" />;
    if (type.includes('scan') || type.includes('tool')) return <Sparkles className="w-4 h-4 text-primary" />;
    if (type.includes('registration') || type.includes('login')) return <User className="w-4 h-4 text-blue-500" />;
    if (type === 'page_view') return <Eye className="w-4 h-4 text-muted-foreground" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  const planColor = (plan: string) => {
    const p = plan.toLowerCase();
    if (p.includes('enterprise')) return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300';
    if (p.includes('business')) return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300';
    if (p.includes('pro')) return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300';
    return 'bg-muted text-muted-foreground border-border';
  };

  const intentColor = (level: string) => {
    if (level === 'very_high') return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300';
    if (level === 'high') return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300';
    if (level === 'medium') return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300';
    return 'bg-muted text-muted-foreground border-border';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-4xl max-h-[90dvh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                {customer.identity.fullName ? customer.identity.fullName[0] : (customer.identity.email ? customer.identity.email[0].toUpperCase() : 'G')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-bold">
                    {customer.identity.fullName || customer.identity.email || 'Anonymous Guest'}
                  </DialogTitle>
                  <Badge variant="outline" className={planColor(customer.identity.subscriptionPlan)}>
                    {customer.identity.subscriptionPlan.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className={`flex items-center gap-1 ${intentColor(intent.level)}`}>
                    <Flame className="w-3 h-3" /> INTENT: {intent.level.toUpperCase().replace('_', ' ')} ({intent.score})
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground font-mono mt-0.5">
                  ID: {customer.identity.visitorId} {customer.identity.userId ? `• User: ${customer.identity.userId}` : ''}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as any)}>
                <TabsList className="h-9">
                  <TabsTrigger value="profile" className="text-xs px-3">
                    <User className="w-3.5 h-3.5 mr-1.5" /> Customer 360
                  </TabsTrigger>
                  <TabsTrigger value="journey" className="text-xs px-3">
                    <History className="w-3.5 h-3.5 mr-1.5" /> Journey Timeline ({customer.timeline.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {activeSubTab === 'profile' ? (
            <div className="space-y-6">
              {/* ── 1. CONVERSION INTENT EXPLAINABILITY BREAKDOWN ── */}
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-foreground">
                      Transparent Conversion Intent Scoring ({intent.score} / 100)
                    </span>
                  </div>
                  <Badge className={intentColor(intent.level)}>
                    {intent.level.toUpperCase().replace('_', ' ')} INTENT
                  </Badge>
                </div>

                <div className="space-y-1.5 pt-1">
                  {intent.factors.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 px-2.5 rounded-md bg-background/80 border border-border/40">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{f.points}</span>
                        <span className="font-semibold text-foreground">{f.name}:</span>
                        <span className="text-muted-foreground">{f.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 2. IDENTITY & CONVERSION HIGHLIGHTS ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground block">Customer Status</span>
                  <span className="text-sm font-semibold text-foreground capitalize mt-0.5 block">
                    {customer.identity.status}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground block">Engagement Score</span>
                  <span className="text-sm font-semibold text-primary mt-0.5 block">
                    {customer.engagement.engagementScore} / 100
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground block">Total Scans Done</span>
                  <span className="text-sm font-semibold text-foreground mt-0.5 block">
                    {customer.engagement.totalScansPerformed} checks
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground block">Lifetime Revenue</span>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    ${customer.conversion.lifetimeRevenue.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ── 3. IDENTITY & LOCATION ── */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <User className="w-4 h-4 text-primary" />
                    Identity &amp; Location
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Email</span>
                      <span className="font-medium text-foreground">{customer.identity.email || 'Anonymous'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Registered</span>
                      <span className="font-medium text-foreground">{customer.identity.isRegistered ? 'Yes (Verified)' : 'No (Guest)'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">First Seen</span>
                      <span className="font-medium text-foreground">{new Date(customer.identity.firstSeen).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Last Seen</span>
                      <span className="font-medium text-foreground">{new Date(customer.identity.lastSeen).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Location</span>
                      <span className="font-medium text-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-primary shrink-0" />
                        {customer.location.city && customer.location.city !== 'Unknown'
                          ? `${customer.location.city}, ${customer.location.region && customer.location.region !== 'Unknown' ? `${customer.location.region}, ` : ''}${customer.location.country}`
                          : customer.location.region && customer.location.region !== 'Unknown'
                          ? `${customer.location.region}, ${customer.location.country}`
                          : customer.location.country || 'United States'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Timezone</span>
                      <span className="font-medium text-foreground font-mono text-xs">{customer.location.timezone || 'America/New_York (UTC-4)'}</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-border/60 flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-500" /> Admin Authorized IP:
                      </span>
                      <code className="text-[11px] bg-muted px-2 py-0.5 rounded font-mono">
                        {customer.location.ipAuthorizedMasked}
                      </code>
                    </div>
                  </div>
                </div>

                {/* ── 4. ACQUISITION & ATTRIBUTION ── */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Compass className="w-4 h-4 text-primary" />
                    Acquisition &amp; Attribution
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block">First Source (Original)</span>
                      <Badge variant="outline" className="mt-0.5 capitalize">{customer.acquisition.firstSource}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Latest Channel</span>
                      <Badge variant="outline" className="mt-0.5 capitalize">{customer.acquisition.latestChannel}</Badge>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground block">Landing Page</span>
                      <code className="text-foreground text-[11px] block truncate">{customer.acquisition.landingPage}</code>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground block">Original Referrer</span>
                      <span className="text-foreground text-[11px] truncate block text-muted-foreground/80">
                        {customer.acquisition.firstReferrer || 'Direct Traffic'}
                      </span>
                    </div>
                    {customer.acquisition.utm.utm_campaign && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground block">UTM Campaign</span>
                        <span className="text-foreground text-[11px] font-mono">
                          {customer.acquisition.utm.utm_campaign} ({customer.acquisition.utm.utm_medium})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 5. DEVICE & ENVIRONMENT ── */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Laptop className="w-4 h-4 text-primary" />
                    Device &amp; Environment
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Device Category</span>
                      <span className="font-medium text-foreground capitalize">{customer.device.category}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Browser</span>
                      <span className="font-medium text-foreground">{customer.device.browser}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Operating System</span>
                      <span className="font-medium text-foreground">{customer.device.os}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Language</span>
                      <span className="font-medium text-foreground">{customer.device.language}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground block">Screen Resolution</span>
                      <span className="font-medium text-foreground font-mono">{customer.device.screenResolution}</span>
                    </div>
                  </div>
                </div>

                {/* ── 6. ENGAGEMENT & TOOLS USED ── */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Activity className="w-4 h-4 text-primary" />
                    Engagement &amp; Product Usage
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Total Sessions</span>
                      <span className="font-medium text-foreground">{customer.engagement.totalSessions}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Page Views</span>
                      <span className="font-medium text-foreground">{customer.engagement.totalPageViews}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Engaged Time</span>
                      <span className="font-medium text-foreground">
                        {Math.round(customer.engagement.totalEngagedTimeSeconds / 60)} minutes
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Avg Session Time</span>
                      <span className="font-medium text-foreground">{customer.engagement.avgSessionDurationSeconds}s</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/60">
                    <span className="text-xs text-muted-foreground block mb-1.5">Tools Utilized</span>
                    <div className="flex flex-wrap gap-1.5">
                      {customer.engagement.toolsUsed.map((t) => (
                        <Badge key={t.tool} variant="secondary" className="text-xs">
                          {t.tool} ({t.count})
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Qualified Segments & Tags */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Automatic Behavioral Cohorts &amp; Assigned Tags
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dynamicSegments.map((seg) => (
                    <Badge key={seg} variant="outline" className="border-primary/40 text-primary bg-primary/5">
                      Auto: {seg}
                    </Badge>
                  ))}
                  {customer.tags.map((tag) => (
                    <Badge key={tag.id} style={{ backgroundColor: tag.color || '#3B82F6', color: '#fff' }}>
                      Tag: {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── 7. CHRONOLOGICAL JOURNEY TIMELINE ── */
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  Step-by-step chronological record of visitor touchpoints, tool operations, and conversion events.
                </p>
                <Select value={timelineFilter} onValueChange={setTimelineFilter}>
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue placeholder="Filter Events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="scans">Scans &amp; Tools</SelectItem>
                    <SelectItem value="conversion">Conversion &amp; Billing</SelectItem>
                    <SelectItem value="auth">Auth &amp; Signup</SelectItem>
                    <SelectItem value="navigation">Page Views</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {filteredTimeline.map((ev, index) => (
                  <div key={ev.id || index} className="relative flex items-start gap-4">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-card border-2 border-primary flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>

                    <div className="flex-1 p-3.5 rounded-xl border border-border bg-card shadow-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getEventIcon(ev.eventType)}
                          <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                            {ev.eventType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {new Date(ev.timestamp).toLocaleTimeString()} • {new Date(ev.timestamp).toLocaleDateString()}
                        </span>
                      </div>

                      {ev.page && (
                        <div className="text-xs text-muted-foreground">
                          Page: <code className="text-foreground font-medium">{ev.page}</code>
                        </div>
                      )}
                      {ev.toolName && (
                        <div className="text-xs text-primary font-medium">
                          Tool: {ev.toolName}
                        </div>
                      )}
                      {ev.planName && (
                        <div className="text-xs text-emerald-600 font-medium">
                          Plan: {ev.planName}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
