import { useEffect, useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { usePersonalization } from '@/contexts/PersonalizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/db/supabase';
import {
  Bot, Wand2, FileSearch, BarChart3, TrendingUp, Award, Clock,
  Zap, AlertTriangle, CheckCircle2, Sparkles, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AIInsightsPage() {
  const { profile, recommendations, predictions, loading } = usePersonalization();
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setActivities(data || []);
        setActivitiesLoading(false);
      });
  }, [user]);

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

  const signals = (profile?.behavioral_signals as Record<string, number>) || {};
  const detector = signals['tool_detector'] || 0;
  const humanizer = signals['tool_humanizer'] || 0;
  const grammar = signals['tool_grammar'] || 0;
  const plagiarism = signals['tool_plagiarism'] || 0;
  const api = signals['tool_api'] || 0;
  const totalToolsUsed = [detector, humanizer, grammar, plagiarism, api].filter(Boolean).length;
  const totalActions = detector + humanizer + grammar + plagiarism + api;
  const wordsAnalyzed = (signals['words_analyzed'] || 0) + activities.reduce((sum, a) => sum + (a.metadata?.word_count || 0), 0);
  const reportsGenerated = activities.length;

  const writingImprovement = Math.min(100, Math.round((humanizer + grammar) * 4));
  const detectionTrend = Math.min(100, Math.round(detector * 5));
  const timeSaved = Math.round(totalActions * 1.5);

  const topPrediction = predictions.sort((a, b) => b.score - a.score)[0];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> AI Insights
          </h1>
          <p className="text-sm text-muted-foreground">Personalized view of your productivity, progress, and next best actions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <MetricCard icon={Bot} label="AI Detections" value={detector} sub="total scans" />
          <MetricCard icon={Wand2} label="Humanizations" value={humanizer} sub="text rewrites" />
          <MetricCard icon={FileSearch} label="Originality Checks" value={plagiarism} sub="plagiarism scans" />
          <MetricCard icon={BarChart3} label="Words Analyzed" value={wordsAnalyzed} sub="across tools" />
          <MetricCard icon={Award} label="Reports Generated" value={reportsGenerated} sub="saved results" />
          <MetricCard icon={Clock} label="Time Saved" value={`${timeSaved}m`} sub="estimated" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Writing improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={writingImprovement} className="h-2 mb-2" />
              <p className="text-sm text-muted-foreground">{writingImprovement}/100 based on humanizer and grammar usage.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" /> Detection trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={detectionTrend} className="h-2 mb-2" />
              <p className="text-sm text-muted-foreground">{detectionTrend}/100 activity score from detector usage.</p>
            </CardContent>
          </Card>
        </div>

        {topPrediction && (
          <Card className="mb-6 border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> Prediction highlight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium capitalize">{topPrediction.prediction_type.replace('_', ' ')} probability</p>
                  <p className="text-xs text-muted-foreground">Score: {topPrediction.score}/100 · Confidence: {topPrediction.confidence}%</p>
                </div>
                <Badge variant={topPrediction.score > 60 ? 'default' : 'secondary'}>
                  {topPrediction.score > 60 ? 'High' : 'Moderate'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Active recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            {recommendations.filter((r) => !r.dismissed && !r.accepted).length === 0 ? (
              <p className="text-sm text-muted-foreground">No active recommendations. Use more tools to get suggestions.</p>
            ) : (
              <div className="space-y-3">
                {recommendations
                  .filter((r) => !r.dismissed && !r.accepted)
                  .slice(0, 5)
                  .map((rec) => (
                    <div key={rec.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{rec.title}</p>
                        <p className="text-xs text-muted-foreground">{rec.reason}</p>
                      </div>
                      {rec.context_path ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link to={rec.context_path}>Try it <ArrowRight className="h-3 w-3 ml-1" /></Link>
                        </Button>
                      ) : null}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Achievement icon={CheckCircle2} title="Explorer" description="Used 3+ tools" unlocked={totalToolsUsed >= 3} />
          <Achievement icon={Zap} title="Power User" description="50+ total actions" unlocked={totalActions >= 50} />
          <Achievement icon={Award} title="Insightful" description="Viewed AI Insights" unlocked />
        </div>
      </div>
    </MainLayout>
  );
}

function MetricCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: number | string; sub: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Achievement({ icon: Icon, title, description, unlocked }: { icon: React.ElementType; title: string; description: string; unlocked: boolean }) {
  return (
    <Card className={unlocked ? '' : 'opacity-60'}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${unlocked ? 'bg-primary/10' : 'bg-muted'}`}>
          <Icon className={`h-5 w-5 ${unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
