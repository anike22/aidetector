import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Plus, Trash2, Save, RefreshCw, Settings, BarChart3, Star,
  Users, Award, ArrowLeft, Loader2, CheckCircle2
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ConfigRow {
  id: string;
  config_key: string;
  config_value: unknown;
  updated_at: string;
}

interface StatItem { label: string; value: string; icon: string; color: string }
interface BenchmarkItem { model: string; accuracy: number; fp: number; fn: number; sample: string; tested: string; bar: number }
interface TestimonialItem { name: string; role: string; org: string; rating: number; avatar: string; color: string; quote: string }
interface ModelItem { name: string; maker: string; badge: string; color: string; letter: string; desc: string }

// ─────────────────────────────────────────────────────────────────────────────

export default function DetectorAdminPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (profile && !isAdmin) {
      navigate('/');
      toast.error('Admin access required');
    }
  }, [profile, isAdmin, navigate]);

  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Config data state
  const [stats, setStats] = useState<StatItem[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkItem[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);

  // ── Load all config ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    loadConfig();
  }, [isAdmin]);

  async function loadConfig() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('detector_page_config')
        .select('id, config_key, config_value, updated_at')
        .order('config_key');

      if (error) throw error;

      for (const row of (data as ConfigRow[]) ?? []) {
        if (row.config_key === 'stats') setStats(row.config_value as StatItem[]);
        if (row.config_key === 'benchmarks') setBenchmarks(row.config_value as BenchmarkItem[]);
        if (row.config_key === 'testimonials') setTestimonials(row.config_value as TestimonialItem[]);
        if (row.config_key === 'models') setModels(row.config_value as ModelItem[]);
      }
    } catch (e: any) {
      toast.error('Failed to load config: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig(key: string, value: unknown) {
    setSaving(key);
    try {
      const { error } = await supabase
        .from('detector_page_config')
        .upsert({ config_key: key, config_value: value }, { onConflict: 'config_key' });

      if (error) throw error;
      toast.success(`${key} saved successfully`);
    } catch (e: any) {
      toast.error('Save failed: ' + e.message);
    } finally {
      setSaving(null);
    }
  }

  if (!isAdmin) return null;

  return (
    <MainLayout>
      <PageMeta title="Admin: Detector Page Config | AIDetector.cx" description="Admin panel to edit detector page statistics, benchmarks, models and testimonials." />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-bold text-foreground">Detector Page Config</h1>
                <Badge variant="secondary" className="text-xs">Admin</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Edit stats, benchmarks, models, and testimonials displayed on /detector</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadConfig} className="gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="stats" className="space-y-6">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="stats" className="gap-2"><BarChart3 className="w-3.5 h-3.5" />Stats</TabsTrigger>
              <TabsTrigger value="benchmarks" className="gap-2"><Award className="w-3.5 h-3.5" />Benchmarks</TabsTrigger>
              <TabsTrigger value="testimonials" className="gap-2"><Star className="w-3.5 h-3.5" />Testimonials</TabsTrigger>
              <TabsTrigger value="models" className="gap-2"><Users className="w-3.5 h-3.5" />AI Models</TabsTrigger>
            </TabsList>

            {/* ── Stats Tab ───────────────────────────────────────────── */}
            <TabsContent value="stats">
              <Card className="border-border/50">
                <CardHeader className="border-b border-border/50">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <CardTitle className="text-base">Live Statistics</CardTitle>
                      <CardDescription>The 6 stats shown in the "Trusted at Scale" section.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-2" onClick={() =>
                        setStats(prev => [...prev, { label: 'New Stat', value: '0', icon: 'Activity', color: 'text-primary' }])
                      }>
                        <Plus className="w-3.5 h-3.5" /> Add Stat
                      </Button>
                      <Button size="sm" className="gap-2" disabled={saving === 'stats'} onClick={() => saveConfig('stats', stats)}>
                        {saving === 'stats' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save Stats
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {stats.map((stat, i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-xl border border-border/40">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Label</Label>
                        <Input value={stat.label} onChange={e => setStats(prev => prev.map((s, j) => j === i ? { ...s, label: e.target.value } : s))} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Value</Label>
                        <Input value={stat.value} onChange={e => setStats(prev => prev.map((s, j) => j === i ? { ...s, value: e.target.value } : s))} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Icon (lucide name)</Label>
                        <Input value={stat.icon} onChange={e => setStats(prev => prev.map((s, j) => j === i ? { ...s, icon: e.target.value } : s))} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Color class</Label>
                        <div className="flex gap-2">
                          <Input value={stat.color} onChange={e => setStats(prev => prev.map((s, j) => j === i ? { ...s, color: e.target.value } : s))} />
                          <Button variant="outline" size="icon" className="shrink-0" onClick={() => setStats(prev => prev.filter((_, j) => j !== i))}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {stats.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No stats yet. Click "Add Stat" to get started.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Benchmarks Tab ──────────────────────────────────────── */}
            <TabsContent value="benchmarks">
              <Card className="border-border/50">
                <CardHeader className="border-b border-border/50">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <CardTitle className="text-base">Detection Benchmarks</CardTitle>
                      <CardDescription>Model accuracy, false positive/negative rates shown in the benchmark section.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-2" onClick={() =>
                        setBenchmarks(prev => [...prev, { model: 'New Model', accuracy: 90.0, fp: 2.0, fn: 2.0, sample: '5,000', tested: 'Jun 2025', bar: 90 }])
                      }>
                        <Plus className="w-3.5 h-3.5" /> Add Model
                      </Button>
                      <Button size="sm" className="gap-2" disabled={saving === 'benchmarks'} onClick={() => saveConfig('benchmarks', benchmarks)}>
                        {saving === 'benchmarks' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save Benchmarks
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {benchmarks.map((b, i) => (
                    <div key={i} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 p-4 bg-muted/30 rounded-xl border border-border/40 items-end">
                      {[
                        { label: 'Model', field: 'model', type: 'text' },
                        { label: 'Accuracy %', field: 'accuracy', type: 'number' },
                        { label: 'FP Rate %', field: 'fp', type: 'number' },
                        { label: 'FN Rate %', field: 'fn', type: 'number' },
                        { label: 'Sample Size', field: 'sample', type: 'text' },
                        { label: 'Last Tested', field: 'tested', type: 'text' },
                      ].map(({ label, field, type }) => (
                        <div key={field} className="flex flex-col gap-1">
                          <Label className="text-xs">{label}</Label>
                          <Input
                            type={type}
                            value={(b as any)[field]}
                            step={type === 'number' ? '0.1' : undefined}
                            onChange={e => setBenchmarks(prev => prev.map((item, j) => j === i
                              ? { ...item, [field]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }
                              : item
                            ))}
                          />
                        </div>
                      ))}
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs invisible">Del</Label>
                        <Button variant="outline" size="icon" onClick={() => setBenchmarks(prev => prev.filter((_, j) => j !== i))}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {benchmarks.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No benchmarks yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Testimonials Tab ────────────────────────────────────── */}
            <TabsContent value="testimonials">
              <Card className="border-border/50">
                <CardHeader className="border-b border-border/50">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <CardTitle className="text-base">Testimonials</CardTitle>
                      <CardDescription>Professional reviews displayed on the detector page.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-2" onClick={() =>
                        setTestimonials(prev => [...prev, { name: 'New User', role: 'Role', org: 'Organization', rating: 5, avatar: 'NU', color: 'bg-primary', quote: 'Quote text here.' }])
                      }>
                        <Plus className="w-3.5 h-3.5" /> Add Testimonial
                      </Button>
                      <Button size="sm" className="gap-2" disabled={saving === 'testimonials'} onClick={() => saveConfig('testimonials', testimonials)}>
                        {saving === 'testimonials' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save Testimonials
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {testimonials.map((t, i) => (
                    <div key={i} className="p-4 bg-muted/30 rounded-xl border border-border/40 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { label: 'Full Name', field: 'name' },
                          { label: 'Role / Title', field: 'role' },
                          { label: 'Organization', field: 'org' },
                          { label: 'Avatar Initials', field: 'avatar' },
                          { label: 'Avatar Color (bg-*)', field: 'color' },
                          { label: 'Rating (1-5)', field: 'rating' },
                        ].map(({ label, field }) => (
                          <div key={field} className="flex flex-col gap-1">
                            <Label className="text-xs">{label}</Label>
                            <Input
                              type={field === 'rating' ? 'number' : 'text'}
                              min={1} max={5}
                              value={(t as any)[field]}
                              onChange={e => setTestimonials(prev => prev.map((item, j) => j === i
                                ? { ...item, [field]: field === 'rating' ? parseInt(e.target.value) || 5 : e.target.value }
                                : item
                              ))}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Quote</Label>
                        <div className="flex gap-2 items-start">
                          <Textarea
                            rows={3}
                            value={t.quote}
                            onChange={e => setTestimonials(prev => prev.map((item, j) => j === i ? { ...item, quote: e.target.value } : item))}
                            className="resize-none"
                          />
                          <Button variant="outline" size="icon" className="shrink-0 mt-0.5" onClick={() => setTestimonials(prev => prev.filter((_, j) => j !== i))}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {testimonials.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No testimonials yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── AI Models Tab ───────────────────────────────────────── */}
            <TabsContent value="models">
              <Card className="border-border/50">
                <CardHeader className="border-b border-border/50">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <CardTitle className="text-base">Supported AI Models</CardTitle>
                      <CardDescription>The model cards shown in the "Detects All Major AI Models" section.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-2" onClick={() =>
                        setModels(prev => [...prev, { name: 'New Model', maker: 'Maker', badge: '', color: 'bg-gray-500', letter: 'N', desc: 'Description here.' }])
                      }>
                        <Plus className="w-3.5 h-3.5" /> Add Model
                      </Button>
                      <Button size="sm" className="gap-2" disabled={saving === 'models'} onClick={() => saveConfig('models', models)}>
                        {saving === 'models' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save Models
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {models.map((m, i) => (
                    <div key={i} className="p-4 bg-muted/30 rounded-xl border border-border/40 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { label: 'Model Name', field: 'name' },
                          { label: 'Maker', field: 'maker' },
                          { label: 'Badge (e.g. Latest)', field: 'badge' },
                          { label: 'Color class (bg-*)', field: 'color' },
                          { label: 'Letter / Initials', field: 'letter' },
                        ].map(({ label, field }) => (
                          <div key={field} className="flex flex-col gap-1">
                            <Label className="text-xs">{label}</Label>
                            <Input
                              value={(m as any)[field]}
                              onChange={e => setModels(prev => prev.map((item, j) => j === i ? { ...item, [field]: e.target.value } : item))}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Description</Label>
                        <div className="flex gap-2 items-start">
                          <Textarea
                            rows={2}
                            value={m.desc}
                            onChange={e => setModels(prev => prev.map((item, j) => j === i ? { ...item, desc: e.target.value } : item))}
                            className="resize-none"
                          />
                          <Button variant="outline" size="icon" className="shrink-0 mt-0.5" onClick={() => setModels(prev => prev.filter((_, j) => j !== i))}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {models.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No models yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}
