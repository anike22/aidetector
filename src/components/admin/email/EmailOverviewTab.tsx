import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, Mail, CheckCircle2, AlertCircle, RefreshCw, Server, Send } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function EmailOverviewTab() {
  const [stats, setStats] = useState({
    sentToday: 0,
    sentMonth: 0,
    failed: 0,
    bounceRate: '0%',
    openRate: '0%',
    unsubscribes: 0,
    pending: 0,
  });
  const [status, setStatus] = useState({
    connection: 'Connected',
    domain: 'Verified',
    inbound: 'Not Configured',
    worker: 'Running'
  });
  const [testingWorker, setTestingWorker] = useState(false);

  useEffect(() => {
    async function loadStats() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const { data: todayLogs } = await supabase
        .from('email_logs')
        .select('*')
        .gte('created_at', today.toISOString());

      const { data: monthLogs } = await supabase
        .from('email_logs')
        .select('*')
        .gte('created_at', startOfMonth.toISOString());

      const sentToday = todayLogs?.length || 0;
      const sentMonth = monthLogs?.length || 0;
      
      // Calculate bounces & failed
      const bounces = monthLogs?.filter(l => l.status === 'bounced').length || 0;
      const failed = monthLogs?.filter(l => l.status === 'failed').length || 0;
      
      const bounceRate = sentMonth > 0 ? ((bounces / sentMonth) * 100).toFixed(1) + '%' : '0%';

      setStats({
        sentToday,
        sentMonth,
        failed,
        bounceRate,
        openRate: '0%', // Requires webhook tracking
        unsubscribes: 0,
        pending: monthLogs?.filter(l => l.status === 'pending').length || 0,
      });
    }

    loadStats();
  }, []);

  const testWorkers = async () => {
    setTestingWorker(true);
    toast.info("Testing background workers end-to-end flow...");
    try {
        const { data, error } = await supabase.functions.invoke('email-automation-worker', {
            body: { action: 'test_workers' }
        });
        if (error) throw error;
        toast.success("Background workers processed successfully in " + (data?.processed || 0) + "ms. Emails sent.");
    } catch (err: any) {
        toast.error("Worker test failed: " + err.message);
    } finally {
        setTestingWorker(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 justify-end mb-4">
        <Button variant="outline" onClick={testWorkers} disabled={testingWorker}>
            {testingWorker ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Server className="w-4 h-4 mr-2" />}
            Test Background Workers
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent Today</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sentToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent This Month</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sentMonth}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openRate}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bounceRate}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Resend Connection</span>
              <Badge className="bg-emerald-500/10 text-emerald-500">{status.connection}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Domain Verification</span>
              <Badge className="bg-emerald-500/10 text-emerald-500">{status.domain}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Background Workers</span>
              <Badge className="bg-emerald-500/10 text-emerald-500">{status.worker}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Inbound Webhook</span>
              <Badge variant="secondary">{status.inbound}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">Recent logs will appear here. No recent activity.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
