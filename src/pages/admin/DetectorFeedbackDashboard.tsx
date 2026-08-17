import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { BarChart2, MessageSquare, AlertTriangle, ThumbsDown, Languages, GitCompare, Activity } from 'lucide-react';
import {
  fetchFeedbackMetrics,
  fetchPerformanceByLanguage,
  fetchPerformanceByVersion,
  fetchProblematicContentTypes,
  fetchRecentFeedback,
  type FeedbackMetrics,
  type PerformanceByLanguage,
  type PerformanceByVersion,
  type ProblematicContentType,
  type RecentFeedbackItem,
} from '@/lib/detection/feedbackAnalytics';

function Loading() {
  return <div className="p-8 text-center text-muted-foreground">Loading feedback analytics...</div>;
}

export default function DetectorFeedbackDashboard() {
  const [metrics, setMetrics] = useState<FeedbackMetrics | null>(null);
  const [byLanguage, setByLanguage] = useState<PerformanceByLanguage[]>([]);
  const [byVersion, setByVersion] = useState<PerformanceByVersion[]>([]);
  const [byContentType, setByContentType] = useState<ProblematicContentType[]>([]);
  const [recent, setRecent] = useState<RecentFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [m, l, v, c, r] = await Promise.all([
        fetchFeedbackMetrics(),
        fetchPerformanceByLanguage(),
        fetchPerformanceByVersion(),
        fetchProblematicContentTypes(),
        fetchRecentFeedback(100),
      ]);
      setMetrics(m);
      setByLanguage(l);
      setByVersion(v);
      setByContentType(c);
      setRecent(r);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load feedback analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) return <Loading />;

  const metricCards = [
    { label: 'Total Feedback', value: metrics.totalFeedback, icon: MessageSquare, color: 'text-primary' },
    { label: 'False Positives', value: metrics.falsePositives, icon: AlertTriangle, color: 'text-destructive' },
    { label: 'False Negatives', value: metrics.falseNegatives, icon: ThumbsDown, color: 'text-warning' },
    { label: 'Unreviewed', value: metrics.unverified, icon: Activity, color: 'text-muted-foreground' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Detector Feedback & Quality</h1>
        <p className="text-sm text-muted-foreground mt-1">Review user feedback, false-positive/negative signals, and per-language/version performance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-border/50 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase">{card.label}</div>
                  <div className="text-3xl font-black text-foreground mt-1">{card.value}</div>
                </div>
                <Icon className={`w-8 h-8 ${card.color}`} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="language" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="language" className="flex items-center gap-1.5"><Languages className="w-3.5 h-3.5" /> By Language</TabsTrigger>
          <TabsTrigger value="version" className="flex items-center gap-1.5"><GitCompare className="w-3.5 h-3.5" /> By Version</TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5" /> Content Types</TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Recent</TabsTrigger>
        </TabsList>

        <TabsContent value="language" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-bold">Performance by Language</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground font-bold">
                    <tr><th className="px-4 py-3 text-left">Language</th><th className="px-4 py-3 text-right">Results</th><th className="px-4 py-3 text-right">Avg AI%</th><th className="px-4 py-3 text-right">Feedback</th><th className="px-4 py-3 text-right">Incorrect</th></tr>
                  </thead>
                  <tbody>
                    {byLanguage.map((row) => (
                      <tr key={row.language_code} className="border-t border-border/50">
                        <td className="px-4 py-3 font-medium">{row.language_code}</td>
                        <td className="px-4 py-3 text-right">{row.result_count}</td>
                        <td className="px-4 py-3 text-right">{row.avg_ai_probability}%</td>
                        <td className="px-4 py-3 text-right">{row.feedback_count}</td>
                        <td className="px-4 py-3 text-right">{row.incorrect_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="version" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-bold">Performance by Detector Version</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground font-bold">
                    <tr><th className="px-4 py-3 text-left">Version</th><th className="px-4 py-3 text-right">Results</th><th className="px-4 py-3 text-right">Avg AI%</th><th className="px-4 py-3 text-right">Confidence</th><th className="px-4 py-3 text-right">Feedback</th></tr>
                  </thead>
                  <tbody>
                    {byVersion.map((row) => (
                      <tr key={row.detector_version} className="border-t border-border/50">
                        <td className="px-4 py-3 font-medium">{row.detector_version}</td>
                        <td className="px-4 py-3 text-right">{row.result_count}</td>
                        <td className="px-4 py-3 text-right">{row.avg_ai_probability}%</td>
                        <td className="px-4 py-3 text-right">{row.avg_confidence}%</td>
                        <td className="px-4 py-3 text-right">{row.feedback_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-bold">Most Problematic Content Types</CardTitle></CardHeader>
            <CardContent className="space-y-4 p-6">
              {byContentType.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
              {byContentType.map((row) => {
                const rate = row.result_count > 0 ? Math.round((row.incorrect_count / row.result_count) * 100) : 0;
                return (
                  <div key={row.content_type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium capitalize">{row.content_type}</span>
                      <span className="text-muted-foreground">{row.incorrect_count} incorrect / {row.result_count} results</span>
                    </div>
                    <Progress value={rate} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-bold">Recent Feedback</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground font-bold">
                    <tr><th className="px-4 py-3 text-left">Type</th><th className="px-4 py-3 text-left">User Label</th><th className="px-4 py-3 text-left">Verdict</th><th className="px-4 py-3 text-right">AI%</th><th className="px-4 py-3 text-left">Comment</th><th className="px-4 py-3 text-center">Reviewed</th></tr>
                  </thead>
                  <tbody>
                    {recent.map((row) => (
                      <tr key={row.id} className="border-t border-border/50">
                        <td className="px-4 py-3 capitalize">{row.feedback_type.replace(/-/g, ' ')}</td>
                        <td className="px-4 py-3 capitalize">{row.user_label || '-'}</td>
                        <td className="px-4 py-3 capitalize">{row.verdict.replace(/-/g, ' ')}</td>
                        <td className="px-4 py-3 text-right">{row.ai_probability}%</td>
                        <td className="px-4 py-3 max-w-xs truncate">{row.comment || '-'}</td>
                        <td className="px-4 py-3 text-center">{row.reviewed ? <Badge variant="default">Yes</Badge> : <Badge variant="outline">No</Badge>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
