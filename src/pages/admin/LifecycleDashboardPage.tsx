import { useEffect, useMemo, useState } from 'react';
import { Activity, Funnel, Heart, TrendingUp, Users } from 'lucide-react';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getAdminFeatureAdoption, getAdminFunnel, getLifecycleAnalytics } from '@/lib/lifecycleApi';

interface Analytics {
  lifecycle_distribution: { stage: string; count: number }[];
  activation_rate: number;
  dau: number;
  wau: number;
  mau: number;
  power_users: number;
  inactive_users: number;
  at_risk_users: number;
  average_activation_score: number;
  average_health_score: number;
}

interface FunnelData {
  stages: { stage_key: string; label: string; count: number; conversion_rate?: number }[];
}

interface FeatureData {
  features: { feature_key: string; total_users: number; active_users_week: number }[];
}

export default function LifecycleDashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [features, setFeatures] = useState<FeatureData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [a, f, feat] = await Promise.all([getLifecycleAnalytics(), getAdminFunnel(), getAdminFeatureAdoption()]);
      setAnalytics(a);
      setFunnel(f);
      setFeatures(feat);
      setLoading(false);
    })();
  }, []);

  const distribution = useMemo(() => analytics?.lifecycle_distribution || [], [analytics]);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Customer Lifecycle</h1>
          <p className="mt-1 text-muted-foreground">Activation, engagement, retention, and cross-product adoption.</p>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard title="Activation Rate" value={`${Math.round(analytics?.activation_rate || 0)}%`} icon={TrendingUp} />
              <MetricCard title="Avg Activation" value={Math.round(analytics?.average_activation_score || 0)} icon={Activity} />
              <MetricCard title="Avg Health" value={Math.round(analytics?.average_health_score || 0)} icon={Heart} />
              <MetricCard title="Power Users" value={analytics?.power_users || 0} icon={Users} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard title="DAU" value={analytics?.dau || 0} icon={Users} />
              <MetricCard title="WAU" value={analytics?.wau || 0} icon={Users} />
              <MetricCard title="MAU" value={analytics?.mau || 0} icon={Users} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <Funnel className="h-5 w-5 text-primary" />
                    Activation Funnel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {funnel?.stages?.map((s, index) => {
                    const prev = funnel.stages[index - 1];
                    const rate = prev ? Math.round((s.count / Math.max(prev.count, 1)) * 100) : 100;
                    return (
                      <div key={s.stage_key} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{s.label}</span>
                          <span className="text-muted-foreground">
                            {s.count.toLocaleString()} {index > 0 && `(${rate}%)`}
                          </span>
                        </div>
                        <Progress value={rate} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Lifecycle Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {distribution.map((d) => (
                      <div key={d.stage} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{d.stage.replace(/_/g, ' ')}</span>
                        <span className="text-sm font-medium tabular-nums">{d.count.toLocaleString()}</span>
                      </div>
                    ))}
                    {distribution.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Feature Adoption</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium">Feature</th>
                          <th className="pb-2 font-medium">Total Users</th>
                          <th className="pb-2 font-medium">Active This Week</th>
                        </tr>
                      </thead>
                      <tbody>
                        {features?.features?.map((f) => (
                          <tr key={f.feature_key} className="border-b last:border-0">
                            <td className="py-2 capitalize">{f.feature_key.replace(/_/g, ' ')}</td>
                            <td className="py-2 tabular-nums">{f.total_users.toLocaleString()}</td>
                            <td className="py-2 tabular-nums">{f.active_users_week.toLocaleString()}</td>
                          </tr>
                        ))}
                        {features?.features?.length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-4 text-muted-foreground">No adoption data available.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
