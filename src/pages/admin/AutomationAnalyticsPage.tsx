import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAutomationAnalytics, listWorkflows } from '@/lib/automationApi';
import type { AutomationAnalyticsRow, AutomationWorkflow } from '@/types/automation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, CheckCircle2, XCircle, TrendingUp, RefreshCw } from 'lucide-react';

export default function AutomationAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AutomationAnalyticsRow[]>([]);
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [workflowId, setWorkflowId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [rows, wfs] = await Promise.all([
        getAutomationAnalytics({ workflowId: workflowId === 'all' ? undefined : workflowId }),
        listWorkflows(),
      ]);
      setAnalytics(rows);
      setWorkflows(wfs);
    } catch (e) {
      toast.error('Failed to load analytics');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [workflowId]);

  const totals = useMemo(() => {
    return analytics.reduce(
      (acc, row) => {
        acc.starts += row.starts;
        acc.completions += row.completions;
        acc.failures += row.failures;
        acc.conversions += row.conversion_count;
        acc.notifications += row.notification_count;
        return acc;
      },
      { starts: 0, completions: 0, failures: 0, conversions: 0, notifications: 0 }
    );
  }, [analytics]);

  const chartData = useMemo(() => {
    const byDate: Record<string, { date: string; starts: number; completions: number; failures: number }> = {};
    for (const row of analytics) {
      if (!byDate[row.date]) byDate[row.date] = { date: row.date, starts: 0, completions: 0, failures: 0 };
      byDate[row.date].starts += row.starts;
      byDate[row.date].completions += row.completions;
      byDate[row.date].failures += row.failures;
    }
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [analytics]);

  return (
    <MainLayout showFooter={false}>
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Automation Analytics</h1>
            <p className="text-sm text-muted-foreground">Measure workflow starts, completions, failures, and conversions.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={workflowId} onValueChange={setWorkflowId}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All workflows</SelectItem>
                {workflows.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Activity className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Starts</span>
              </div>
              <p className="text-2xl font-semibold">{totals.starts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Completions</span>
              </div>
              <p className="text-2xl font-semibold">{totals.completions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <XCircle className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Failures</span>
              </div>
              <p className="text-2xl font-semibold">{totals.failures}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Conversions</span>
              </div>
              <p className="text-2xl font-semibold">{totals.conversions}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-medium">Activity over time</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No analytics data yet.</p>
            ) : (
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="starts" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completions" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="failures" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Link to="/admin/automation" className="text-sm text-primary hover:underline">Automation Center</Link>
          <Link to="/admin/automation/logs" className="text-sm text-primary hover:underline">Execution logs</Link>
        </div>
      </div>
    </MainLayout>
  );
}
