import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  getPersonalizationConfig,
  updatePersonalizationConfig,
  getRecommendationAnalytics,
  getIntelligenceProfile,
  getRecommendations,
  getPredictions,
  batchProcessPersonalization,
} from '@/lib/personalizationApi';
import type { PersonalizationConfig, RecommendationAnalyticsRow } from '@/types/personalization';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { RefreshCw, Play, BarChart3, Settings, BrainCircuit, Activity } from 'lucide-react';

const RECOMMENDATION_MODELS = ['product', 'upgrade', 'content', 'action'];
const PREDICTION_MODELS = ['upgrade', 'churn', 'renewal', 'clv', 'feature_adoption', 'support_risk', 'api_growth', 'high_value'];

export default function AIPersonalizationCenterPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [config, setConfig] = useState<PersonalizationConfig | null>(null);
  const [analytics, setAnalytics] = useState<RecommendationAnalyticsRow[]>([]);
  const [previewProfile, setPreviewProfile] = useState<any>(null);
  const [previewRecs, setPreviewRecs] = useState<any[]>([]);
  const [previewPreds, setPreviewPreds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recomputing, setRecomputing] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadData();
  }, [user, profile]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cfg, ana, selfProfile, recs, preds] = await Promise.all([
        getPersonalizationConfig(),
        getRecommendationAnalytics(),
        getIntelligenceProfile(),
        getRecommendations(10),
        getPredictions(),
      ]);
      setConfig(cfg);
      setAnalytics(ana);
      setPreviewProfile(selfProfile);
      setPreviewRecs(recs);
      setPreviewPreds(preds);
    } catch (e: any) {
      toast.error('Failed to load personalization center');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateModel = (kind: 'recommendation' | 'prediction', key: string, enabled: boolean) => {
    if (!config) return;
    const field = kind === 'recommendation' ? 'recommendation_models' : 'prediction_models';
    const updated = {
      ...config,
      model_settings: {
        ...config.model_settings,
        [field]: {
          ...(config.model_settings as Record<string, Record<string, boolean>>)[field],
          [key]: enabled,
        },
      },
    };
    setConfig(updated as PersonalizationConfig);
  };

  const updateThreshold = (key: keyof PersonalizationConfig['thresholds'], value: string) => {
    if (!config) return;
    const num = value === '' ? 0 : parseFloat(value);
    setConfig({
      ...config,
      thresholds: { ...config.thresholds, [key]: num },
    });
  };

  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await updatePersonalizationConfig({
        model_settings: config.model_settings,
        thresholds: config.thresholds,
      });
      toast.success('Configuration saved');
    } catch (e: any) {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const recompute = async () => {
    setRecomputing(true);
    try {
      await batchProcessPersonalization(user?.id ? [user.id] : undefined);
      await loadData();
      toast.success('Recomputed recommendations and predictions');
    } catch (e: any) {
      toast.error('Recompute failed');
    } finally {
      setRecomputing(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-8 md:px-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <BrainCircuit className="h-6 w-6 text-primary" /> AI Personalization Center
            </h1>
            <p className="text-sm text-muted-foreground">Manage models, thresholds, analytics, and preview recommendations.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={recompute} disabled={recomputing}>
              <Play className="h-4 w-4 mr-2" /> {recomputing ? 'Running…' : 'Replay logic'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="models" className="space-y-6">
          <TabsList>
            <TabsTrigger value="models"><Settings className="h-4 w-4 mr-2" /> Models & Thresholds</TabsTrigger>
            <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 mr-2" /> Analytics</TabsTrigger>
            <TabsTrigger value="preview"><Activity className="h-4 w-4 mr-2" /> Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="models" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Recommendation models</CardTitle>
                <CardDescription>Toggle which recommendation types are generated.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {RECOMMENDATION_MODELS.map((key) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <Label htmlFor={`rec-${key}`} className="capitalize">{key} recommendations</Label>
                    <Switch
                      id={`rec-${key}`}
                      checked={config?.model_settings?.recommendation_models?.[key] ?? true}
                      onCheckedChange={(v) => updateModel('recommendation', key, v)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Prediction models</CardTitle>
                <CardDescription>Enable or disable prediction scoring for each objective.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PREDICTION_MODELS.map((key) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <Label htmlFor={`pred-${key}`} className="capitalize">{key.replace('_', ' ')}</Label>
                    <Switch
                      id={`pred-${key}`}
                      checked={config?.model_settings?.prediction_models?.[key] ?? true}
                      onCheckedChange={(v) => updateModel('prediction', key, v)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Thresholds</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(config?.thresholds || {}).map(([key, value]) => (
                  <div key={key}>
                    <Label htmlFor={`threshold-${key}`} className="capitalize">{key.replace(/_/g, ' ')}</Label>
                    <Input
                      id={`threshold-${key}`}
                      type="number"
                      value={value ?? ''}
                      onChange={(e) => updateThreshold(key as keyof PersonalizationConfig['thresholds'], e.target.value)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={saveConfig} disabled={saving}>{saving ? 'Saving…' : 'Save configuration'}</Button>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Recommendation analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="impressions" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="clicks" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="accepts" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Profile preview</CardTitle>
              </CardHeader>
              <CardContent>
                {previewProfile ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-muted-foreground">Plan</span> <p>{previewProfile.subscription_plan || 'free'}</p></div>
                    <div><span className="text-muted-foreground">AI confidence</span> <p>{previewProfile.ai_confidence_score}%</p></div>
                    <div><span className="text-muted-foreground">Organization</span> <p>{previewProfile.organization_type || 'unknown'}</p></div>
                    <div><span className="text-muted-foreground">Lifecycle</span> <p>{previewProfile.lifecycle_stage || 'unknown'}</p></div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No profile found.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Generated recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                {previewRecs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recommendations.</p>
                ) : (
                  <div className="space-y-2">
                    {previewRecs.map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{r.title}</p>
                          <p className="text-xs text-muted-foreground">{r.reason}</p>
                        </div>
                        <Badge>{r.score}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                {previewPreds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No predictions.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {previewPreds.map((p) => (
                      <div key={p.id} className="p-3 border rounded-lg">
                        <p className="text-sm font-medium capitalize">{p.prediction_type.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground">Score: {p.score}/100 · Confidence: {p.confidence}%</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
