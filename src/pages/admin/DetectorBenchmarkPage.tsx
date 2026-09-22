import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { BarChart3, Play, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, Bot, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { runBenchmark, BUILTIN_SAMPLES, type BenchmarkMetrics, type BenchmarkPrediction } from '@/lib/detection/benchmark';

export default function DetectorBenchmarkPage() {
  const { user, profile, loading: authLoading, isAdmin: contextIsAdmin } = useAuth();
  const navigate = useNavigate();
  const isAdmin = contextIsAdmin || profile?.role === 'admin' || user?.email?.toLowerCase() === 'anikeaidetector@gmail.com';

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      navigate('/');
      toast.error('Admin access required');
    }
  }, [authLoading, user, isAdmin, navigate]);

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState<BenchmarkMetrics | null>(null);
  const [predictions, setPredictions] = useState<BenchmarkPrediction[] | null>(null);

  const handleRun = async () => {
    setRunning(true);
    setProgress(0);
    try {
      const { predictions: preds, metrics: m } = await runBenchmark(BUILTIN_SAMPLES, (done, total) => {
        setProgress(Math.round((done / total) * 100));
      });
      setPredictions(preds);
      setMetrics(m);
      toast.success(`Benchmark complete: ${(m.accuracy * 100).toFixed(1)}% accuracy`);
    } catch (e: any) {
      toast.error(e.message || 'Benchmark failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <MainLayout>
      <PageMeta title="Detector Benchmark | Admin" description="Internal benchmark for the multilingual AI detection engine." />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/detector-config')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" /> Detector Benchmark
            </h1>
            <p className="text-sm text-muted-foreground">Run the internal multilingual benchmark suite and inspect metrics by label, language, and content type.</p>
          </div>
        </div>

        <Card className="mb-6 border-border/50 shadow-premium rounded-2xl">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Built-in Benchmark Suite</h2>
              <p className="text-sm text-muted-foreground">{BUILTIN_SAMPLES.length} curated samples covering English, Spanish, French, Yoruba, code-switching, AI, human, mixed, and short text.</p>
            </div>
            <Button onClick={handleRun} disabled={running} className="shrink-0 font-bold rounded-xl">
              {running ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running...</> : <><Play className="w-4 h-4 mr-2" /> Run Benchmark</>}
            </Button>
          </CardContent>
          {running && (
            <div className="px-6 pb-6">
              <Progress value={progress} className="h-2" />
              <div className="text-xs text-muted-foreground mt-2 text-right">{progress}%</div>
            </div>
          )}
        </Card>

        {metrics && predictions && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              <TabsTrigger value="predictions">Predictions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Accuracy" value={`${(metrics.accuracy * 100).toFixed(1)}%`} icon={<CheckCircle2 className="w-4 h-4 text-success" />} />
                <MetricCard label="Precision" value={`${(metrics.precision * 100).toFixed(1)}%`} icon={<BarChart3 className="w-4 h-4 text-primary" />} />
                <MetricCard label="Recall" value={`${(metrics.recall * 100).toFixed(1)}%`} icon={<Bot className="w-4 h-4 text-destructive" />} />
                <MetricCard label="F1 Score" value={`${(metrics.f1 * 100).toFixed(1)}%`} icon={<BarChart3 className="w-4 h-4 text-primary" />} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard label="False Positive Rate" value={`${(metrics.falsePositiveRate * 100).toFixed(1)}%`} icon={<AlertTriangle className="w-4 h-4 text-warning" />} />
                <MetricCard label="False Negative Rate" value={`${(metrics.falseNegativeRate * 100).toFixed(1)}%`} icon={<AlertTriangle className="w-4 h-4 text-warning" />} />
                <MetricCard label="Calibration Error" value={`${(metrics.calibrationError * 100).toFixed(1)}%`} icon={<BarChart3 className="w-4 h-4 text-muted-foreground" />} />
              </div>
            </TabsContent>

            <TabsContent value="breakdown" className="space-y-6">
              <Card className="rounded-2xl border-border/50 shadow-premium">
                <CardHeader><CardTitle className="text-sm font-bold">By Label</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(metrics.byLabel).map(([label, data]) => (
                    <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="uppercase text-xs">{label}</Badge>
                        <span className="text-xs text-muted-foreground">n={data.count}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{(data.accuracy * 100).toFixed(0)}% acc</div>
                        <div className="text-xs text-muted-foreground">avg conf {(data.avgConfidence).toFixed(0)}%</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/50 shadow-premium">
                <CardHeader><CardTitle className="text-sm font-bold">By Language</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(metrics.byLanguage).map(([lang, data]) => (
                    <div key={lang} className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                      <Badge variant="outline" className="uppercase text-xs">{lang}</Badge>
                      <div className="text-sm font-bold">{(data.accuracy * 100).toFixed(0)}% acc <span className="text-muted-foreground font-normal">(n={data.count})</span></div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/50 shadow-premium">
                <CardHeader><CardTitle className="text-sm font-bold">By Content Type</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(metrics.byContentType).map(([ct, data]) => (
                    <div key={ct} className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                      <Badge variant="outline" className="uppercase text-xs">{ct}</Badge>
                      <div className="text-sm font-bold">{(data.accuracy * 100).toFixed(0)}% acc <span className="text-muted-foreground font-normal">(n={data.count})</span></div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="predictions" className="space-y-4">
              {predictions.map((p, i) => {
                const sample = BUILTIN_SAMPLES[i];
                const correct =
                  (sample.label === 'human' && (p.predictedVerdict === 'likely-human' || p.predictedVerdict === 'mostly-human-ai-assisted')) ||
                  (sample.label === 'ai' && (p.predictedVerdict === 'likely-ai' || p.predictedVerdict === 'mostly-ai-human-edited')) ||
                  ((sample.label === 'mixed' || sample.label === 'humanized-ai' || sample.label === 'translated') && (p.predictedVerdict === 'mixed' || p.predictedVerdict === 'mostly-ai-human-edited' || p.predictedVerdict === 'mostly-human-ai-assisted')) ||
                  (sample.label === 'short' && (p.predictedVerdict === 'insufficient-text' || p.predictedVerdict === 'inconclusive'));
                return (
                  <Card key={p.sampleId} className="rounded-2xl border-border/50 shadow-premium">
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={correct ? 'default' : 'destructive'} className="text-xs">
                            {correct ? 'Correct' : 'Incorrect'}
                          </Badge>
                          <Badge variant="outline" className="text-xs uppercase">{sample.languageCode}</Badge>
                          <Badge variant="outline" className="text-xs uppercase">{sample.contentType}</Badge>
                          <Badge variant="outline" className="text-xs uppercase">{sample.label}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{p.detectedLanguage ? `Detected: ${p.detectedLanguage}` : 'Language unknown'}</div>
                      </div>
                      <p className="text-sm text-foreground/80 line-clamp-2 mb-3">{sample.text}</p>
                      <div className="grid grid-cols-4 gap-2 text-xs text-center">
                        <div className="p-2 rounded-lg bg-muted/30"><div className="font-bold text-destructive">{p.aiProbability}%</div><div className="text-muted-foreground">AI</div></div>
                        <div className="p-2 rounded-lg bg-muted/30"><div className="font-bold text-success">{p.humanProbability}%</div><div className="text-muted-foreground">Human</div></div>
                        <div className="p-2 rounded-lg bg-muted/30"><div className="font-bold text-warning">{p.mixedProbability}%</div><div className="text-muted-foreground">Mixed</div></div>
                        <div className="p-2 rounded-lg bg-muted/30"><div className="font-bold">{p.confidence}%</div><div className="text-muted-foreground">Confidence</div></div>
                      </div>
                      <div className="mt-2 text-sm font-medium">Verdict: <span className="font-bold">{p.predictedVerdict.replace(/-/g, ' ')}</span></div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border-border/50 shadow-premium">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase">{label}</div>
          <div className="text-2xl font-black text-foreground mt-1">{value}</div>
        </div>
        <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center">{icon}</div>
      </CardContent>
    </Card>
  );
}
