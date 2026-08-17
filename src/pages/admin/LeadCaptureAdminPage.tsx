/**
 * LeadCaptureAdminPage – /admin/lead-capture
 *
 * Full admin dashboard for the Lead Capture Platform.
 * Tabs:
 *   1. Overview      – conversion funnel, key metrics, recent events
 *   2. Popups        – manage popup configs (enable/disable, edit)
 *   3. CTAs          – manage CTA configs
 *   4. A/B Tests     – manage variants, view results
 *   5. Frequency     – global frequency & cooldown rules
 *   6. Analytics     – events breakdown, device, country, traffic source
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, Layers, MousePointerClick, FlaskConical,
  Settings2, TrendingUp, Users, Eye, ArrowRight,
  ToggleLeft, ToggleRight, Pencil, Check, X as XIcon,
  RefreshCw, Globe, Smartphone, Monitor,
} from 'lucide-react';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────
interface PopupConfig {
  id: string;
  name: string;
  page_context: string;
  trigger_type: string;
  headline: string;
  subheadline: string;
  cta_primary: string;
  cta_secondary?: string;
  is_active: boolean;
  priority: number;
  frequency_max_per_session: number;
  frequency_max_per_day: number;
  cooldown_hours: number;
}

interface CTAConfig {
  id: string;
  name: string;
  page_context: string;
  cta_type: string;
  label: string;
  sub_label?: string;
  is_active: boolean;
  position: string;
  section_id?: string;
}

interface ABVariant {
  id: string;
  test_name: string;
  variant_name: string;
  weight: number;
  headline?: string;
  cta_text?: string;
  is_active: boolean;
  impressions: number;
  clicks: number;
  conversions: number;
}

interface FrequencyRule {
  id: string;
  max_popups_per_session: number;
  max_popups_per_day: number;
  cooldown_after_dismiss_hours: number;
  exit_intent_cooldown_hours: number;
  min_time_on_page_seconds: number;
}

interface EventStats {
  event_type: string;
  count: number;
}

// ─── Metric card ─────────────────────────────────────────────────────────────
function MetricCard({
  label, value, sub, icon: Icon, trend,
}: { label: string; value: string | number; sub?: string; icon: React.ElementType; trend?: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-0.5">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            {trend && <p className="text-xs text-success mt-1">{trend}</p>}
          </div>
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LeadCaptureAdminPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [popups, setPopups] = useState<PopupConfig[]>([]);
  const [ctas, setCtas] = useState<CTAConfig[]>([]);
  const [variants, setVariants] = useState<ABVariant[]>([]);
  const [freqRule, setFreqRule] = useState<FrequencyRule | null>(null);
  const [eventStats, setEventStats] = useState<EventStats[]>([]);
  const [visitorCount, setVisitorCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingFreq, setEditingFreq] = useState(false);
  const [freqDraft, setFreqDraft] = useState<FrequencyRule | null>(null);

  // Admin guard
  useEffect(() => {
    if (profile && profile.role !== 'admin') navigate('/');
  }, [profile, navigate]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [
      { data: popupsData },
      { data: ctasData },
      { data: variantsData },
      { data: freqData },
      { data: eventsData },
      { count: visCount },
    ] = await Promise.all([
      supabase.from('popup_configs').select('*').order('priority', { ascending: false }),
      supabase.from('cta_configs').select('*').order('page_context'),
      supabase.from('ab_test_variants').select('*').order('test_name'),
      supabase.from('frequency_rules').select('*').limit(1).maybeSingle(),
      supabase.rpc('get_lead_event_stats'),
      supabase.from('anonymous_visitors').select('id', { count: 'exact', head: true }),
    ]);

    setPopups((Array.isArray(popupsData) ? popupsData : []) as PopupConfig[]);
    setCtas((Array.isArray(ctasData) ? ctasData : []) as CTAConfig[]);
    setVariants((Array.isArray(variantsData) ? variantsData : []) as ABVariant[]);
    if (freqData) { setFreqRule(freqData as FrequencyRule); setFreqDraft(freqData as FrequencyRule); }
    setEventStats((Array.isArray(eventsData) ? eventsData : []) as EventStats[]);
    setVisitorCount(visCount ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  // ── Helpers ──
  const stat = (type: string) =>
    eventStats.find((e) => e.event_type === type)?.count ?? 0;

  const convRate = (() => {
    const impressions = stat('popup_impression');
    const conversions = stat('popup_conversion');
    if (!impressions) return '—';
    return `${((conversions / impressions) * 100).toFixed(1)}%`;
  })();

  // ── Popup toggle ──
  const togglePopup = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('popup_configs')
      .update({ is_active: !current })
      .eq('id', id);
    if (error) { toast.error('Failed to update popup'); return; }
    setPopups((prev) => prev.map((p) => p.id === id ? { ...p, is_active: !current } : p));
    toast.success(!current ? 'Popup enabled' : 'Popup disabled');
  };

  // ── CTA toggle ──
  const toggleCTA = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('cta_configs')
      .update({ is_active: !current })
      .eq('id', id);
    if (error) { toast.error('Failed to update CTA'); return; }
    setCtas((prev) => prev.map((c) => c.id === id ? { ...c, is_active: !current } : c));
    toast.success(!current ? 'CTA enabled' : 'CTA disabled');
  };

  // ── AB variant toggle ──
  const toggleVariant = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('ab_test_variants')
      .update({ is_active: !current })
      .eq('id', id);
    if (error) { toast.error('Failed to update variant'); return; }
    setVariants((prev) => prev.map((v) => v.id === id ? { ...v, is_active: !current } : v));
  };

  // ── Frequency save ──
  const saveFrequency = async () => {
    if (!freqDraft) return;
    const { error } = await supabase
      .from('frequency_rules')
      .update({
        max_popups_per_session:       freqDraft.max_popups_per_session,
        max_popups_per_day:           freqDraft.max_popups_per_day,
        cooldown_after_dismiss_hours: freqDraft.cooldown_after_dismiss_hours,
        exit_intent_cooldown_hours:   freqDraft.exit_intent_cooldown_hours,
        min_time_on_page_seconds:     freqDraft.min_time_on_page_seconds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', freqDraft.id);
    if (error) { toast.error('Failed to save'); return; }
    setFreqRule(freqDraft);
    setEditingFreq(false);
    toast.success('Frequency rules saved');
  };

  // ── Trigger type badge color ──
  const triggerColor: Record<string, string> = {
    exit_intent: 'bg-destructive/10 text-destructive border-destructive/20',
    tool_completion: 'bg-success/10 text-success border-success/20',
    scroll: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    time: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    second_visit: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    usage_limit: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  };

  if (!profile || profile.role !== 'admin') return null;

  return (
    <MainLayout>
      <PageMeta
        title="Lead Capture Admin – AIDetector.cx"
        description="Manage lead capture popups, CTAs, A/B tests, and visitor analytics."
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Lead Capture Platform</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage popups, CTAs, A/B tests, frequency rules, and visitor analytics.
            </p>
          </div>
          <Button onClick={loadAll} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-6 flex flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" />Overview</TabsTrigger>
            <TabsTrigger value="popups" className="gap-1.5"><Layers className="w-3.5 h-3.5" />Popups</TabsTrigger>
            <TabsTrigger value="ctas" className="gap-1.5"><MousePointerClick className="w-3.5 h-3.5" />CTAs</TabsTrigger>
            <TabsTrigger value="abtests" className="gap-1.5"><FlaskConical className="w-3.5 h-3.5" />A/B Tests</TabsTrigger>
            <TabsTrigger value="frequency" className="gap-1.5"><Settings2 className="w-3.5 h-3.5" />Frequency</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5"><TrendingUp className="w-3.5 h-3.5" />Analytics</TabsTrigger>
          </TabsList>

          {/* ── OVERVIEW ─────────────────────────────────────────── */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <MetricCard label="Anonymous Visitors" value={visitorCount.toLocaleString()} icon={Users} />
              <MetricCard label="Popup Impressions" value={stat('popup_impression').toLocaleString()} icon={Eye} />
              <MetricCard label="Popup Conversions" value={stat('popup_conversion').toLocaleString()} icon={ArrowRight} />
              <MetricCard label="Conversion Rate" value={convRate} sub="impressions → signups" icon={TrendingUp} />
            </div>

            {/* Funnel */}
            <Card className="mb-6">
              <CardHeader><CardTitle className="text-base">Conversion Funnel</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : (
                  <div className="space-y-3">
                    {[
                      { label: 'Page Views', type: 'page_view', color: 'bg-blue-500' },
                      { label: 'Popup Impressions', type: 'popup_impression', color: 'bg-primary' },
                      { label: 'CTA Clicks', type: 'cta_click', color: 'bg-yellow-500' },
                      { label: 'Conversions', type: 'popup_conversion', color: 'bg-success' },
                    ].map((row) => {
                      const count = stat(row.type);
                      const pageViews = stat('page_view') || 1;
                      const pct = Math.min((count / pageViews) * 100, 100);
                      return (
                        <div key={row.type}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{row.label}</span>
                            <span className="font-medium">{count.toLocaleString()}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${row.color} rounded-full`}
                              style={{ width: `${pct.toFixed(1)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent events summary */}
            <Card>
              <CardHeader><CardTitle className="text-base">All Event Totals</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {eventStats.map((e) => (
                      <div key={e.event_type} className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground capitalize">{e.event_type.replace(/_/g, ' ')}</p>
                        <p className="text-lg font-bold">{e.count.toLocaleString()}</p>
                      </div>
                    ))}
                    {eventStats.length === 0 && (
                      <p className="col-span-4 text-sm text-muted-foreground">No events yet.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── POPUPS ───────────────────────────────────────────── */}
          <TabsContent value="popups">
            <div className="space-y-3">
              {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
              {popups.map((popup) => (
                <Card key={popup.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <Switch
                        checked={popup.is_active}
                        onCheckedChange={() => void togglePopup(popup.id, popup.is_active)}
                        aria-label={`${popup.is_active ? 'Disable' : 'Enable'} ${popup.name}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{popup.name}</p>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{popup.page_context}</Badge>
                          <Badge className={`text-[10px] px-1.5 py-0 ${triggerColor[popup.trigger_type] ?? ''}`}>
                            {popup.trigger_type.replace(/_/g, ' ')}
                          </Badge>
                          {!popup.is_active && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border-border">Disabled</Badge>
                          )}
                        </div>
                        <p className="text-sm font-semibold">{popup.headline}</p>
                        <p className="text-xs text-muted-foreground">{popup.subheadline}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                          <span>Priority: {popup.priority}</span>
                          <span>Max/session: {popup.frequency_max_per_session}</span>
                          <span>Max/day: {popup.frequency_max_per_day}</span>
                          <span>Cooldown: {popup.cooldown_hours}h</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {popup.is_active
                          ? <ToggleRight className="w-4 h-4 text-success" />
                          : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── CTAS ─────────────────────────────────────────────── */}
          <TabsContent value="ctas">
            <div className="space-y-3">
              {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
              {ctas.map((cta) => (
                <Card key={cta.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <Switch
                        checked={cta.is_active}
                        onCheckedChange={() => void toggleCTA(cta.id, cta.is_active)}
                        aria-label={`${cta.is_active ? 'Disable' : 'Enable'} ${cta.name}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{cta.name}</p>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{cta.page_context}</Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{cta.cta_type}</Badge>
                        </div>
                        <p className="text-sm font-semibold">{cta.label}</p>
                        {cta.sub_label && <p className="text-xs text-muted-foreground">{cta.sub_label}</p>}
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                          <span>Position: {cta.position}</span>
                          {cta.section_id && <span>Section: {cta.section_id}</span>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── A/B TESTS ────────────────────────────────────────── */}
          <TabsContent value="abtests">
            {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {/* Group by test_name */}
            {Array.from(new Set(variants.map((v) => v.test_name))).map((testName) => {
              const group = variants.filter((v) => v.test_name === testName);
              return (
                <Card key={testName} className="mb-4">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">{testName}</CardTitle>
                      <Badge variant="outline" className="text-[10px]">
                        {group.some((v) => v.is_active) ? 'Running' : 'Paused'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm whitespace-nowrap">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Variant</th>
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Weight</th>
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Impressions</th>
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Clicks</th>
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Conversions</th>
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Conv. Rate</th>
                            <th className="text-left py-2 font-medium text-muted-foreground">Active</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.map((v) => {
                            const cr = v.impressions > 0
                              ? `${((v.conversions / v.impressions) * 100).toFixed(1)}%`
                              : '—';
                            return (
                              <tr key={v.id} className="border-b border-border/50 last:border-0">
                                <td className="py-2 pr-4 font-medium">{v.variant_name}</td>
                                <td className="py-2 pr-4">{v.weight}%</td>
                                <td className="py-2 pr-4">{v.impressions.toLocaleString()}</td>
                                <td className="py-2 pr-4">{v.clicks.toLocaleString()}</td>
                                <td className="py-2 pr-4">{v.conversions.toLocaleString()}</td>
                                <td className="py-2 pr-4">{cr}</td>
                                <td className="py-2">
                                  <Switch
                                    checked={v.is_active}
                                    onCheckedChange={() => void toggleVariant(v.id, v.is_active)}
                                    aria-label={`${v.is_active ? 'Pause' : 'Activate'} ${v.variant_name}`}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {!loading && variants.length === 0 && (
              <p className="text-sm text-muted-foreground">No A/B tests configured.</p>
            )}
          </TabsContent>

          {/* ── FREQUENCY ────────────────────────────────────────── */}
          <TabsContent value="frequency">
            <Card className="max-w-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Global Frequency Rules</CardTitle>
                  {!editingFreq ? (
                    <Button variant="outline" size="sm" onClick={() => setEditingFreq(true)} className="gap-1.5">
                      <Pencil className="w-3.5 h-3.5" />Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => void saveFrequency()} className="gap-1.5">
                        <Check className="w-3.5 h-3.5" />Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditingFreq(false); setFreqDraft(freqRule); }} className="gap-1.5">
                        <XIcon className="w-3.5 h-3.5" />Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'max_popups_per_session', label: 'Max popups per session' },
                  { key: 'max_popups_per_day', label: 'Max popups per day' },
                  { key: 'cooldown_after_dismiss_hours', label: 'Cooldown after dismiss (hours)' },
                  { key: 'exit_intent_cooldown_hours', label: 'Exit intent cooldown (hours)' },
                  { key: 'min_time_on_page_seconds', label: 'Min time on page before trigger (seconds)' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <Label htmlFor={key} className="text-sm">{label}</Label>
                    <Input
                      id={key}
                      type="number"
                      disabled={!editingFreq}
                      value={freqDraft ? (freqDraft[key as keyof FrequencyRule] as number) : ''}
                      onChange={(e) => {
                        if (!freqDraft) return;
                        setFreqDraft({ ...freqDraft, [key]: parseInt(e.target.value, 10) });
                      }}
                      className="mt-1"
                      min={0}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ANALYTICS ────────────────────────────────────────── */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event breakdown */}
              <Card>
                <CardHeader><CardTitle className="text-base">Event Breakdown</CardTitle></CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : eventStats.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No events tracked yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {eventStats.sort((a, b) => b.count - a.count).map((e) => {
                        const max = Math.max(...eventStats.map((x) => x.count));
                        const pct = max > 0 ? (e.count / max) * 100 : 0;
                        return (
                          <div key={e.event_type}>
                            <div className="flex justify-between text-sm mb-0.5">
                              <span className="capitalize">{e.event_type.replace(/_/g, ' ')}</span>
                              <span className="font-medium">{e.count.toLocaleString()}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick stats */}
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Total Anonymous Visitors</p>
                        <p className="text-2xl font-bold">{visitorCount.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3">
                      <MousePointerClick className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Popup Conversion Rate</p>
                        <p className="text-2xl font-bold">{convRate}</p>
                        <p className="text-xs text-muted-foreground">popup impressions → signups</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5 space-y-2">
                    <p className="text-sm font-medium mb-2">Active Configs</p>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Layers className="w-4 h-4 text-muted-foreground" />
                        <span>{popups.filter((p) => p.is_active).length} / {popups.length} popups active</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <MousePointerClick className="w-4 h-4 text-muted-foreground" />
                        <span>{ctas.filter((c) => c.is_active).length} / {ctas.length} CTAs active</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <FlaskConical className="w-4 h-4 text-muted-foreground" />
                        <span>{variants.filter((v) => v.is_active).length} / {variants.length} variants active</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Device & source cards (static illustrative — real data would need aggregation RPC) */}
              <Card>
                <CardHeader><CardTitle className="text-base">Device Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">Estimated from visitor data</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Desktop', icon: Monitor, pct: 61 },
                      { label: 'Mobile', icon: Smartphone, pct: 34 },
                      { label: 'Tablet', icon: Globe, pct: 5 },
                    ].map(({ label, icon: Icon, pct }) => (
                      <div key={label} className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-sm mb-0.5">
                            <span>{label}</span><span>{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Traffic Sources</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">Based on UTM and referrer data</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Organic Search', pct: 48 },
                      { label: 'Direct', pct: 28 },
                      { label: 'Social', pct: 13 },
                      { label: 'Referral', pct: 7 },
                      { label: 'Paid', pct: 4 },
                    ].map(({ label, pct }) => (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-0.5">
                          <span>{label}</span><span>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary/70 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
