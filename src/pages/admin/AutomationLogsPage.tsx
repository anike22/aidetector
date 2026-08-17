import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getExecutionLogs, listExecutions } from '@/lib/automationApi';
import type { AutomationExecution, AutomationExecutionLog } from '@/types/automation';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

export default function AutomationLogsPage() {
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<Record<string, AutomationExecutionLog[]>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await listExecutions({ limit: 100 });
      setExecutions(data);
    } catch (e) {
      toast.error('Failed to load execution logs');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleExpand = async (id: string) => {
    const next = { ...expanded, [id]: !expanded[id] };
    setExpanded(next);
    if (next[id] && !logs[id]) {
      try {
        const data = await getExecutionLogs(id);
        setLogs((prev) => ({ ...prev, [id]: data }));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default' as const;
      case 'failed':
        return 'destructive' as const;
      case 'delayed':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <MainLayout showFooter={false}>
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Automation Execution Logs</h1>
            <p className="text-sm text-muted-foreground">Trace workflow runs and individual step outcomes.</p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-medium">Executions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {executions.length === 0 && (
              <p className="p-6 text-sm text-muted-foreground">No executions yet.</p>
            )}
            <div className="divide-y divide-border">
              {executions.map((e) => (
                <div key={e.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{e.workflow?.name || e.workflow_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.trigger_event} • {new Date(e.created_at).toLocaleString()}
                      </p>
                      {e.error_message && (
                        <p className="text-xs text-destructive mt-1">{e.error_message}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusVariant(e.status)}>{e.status}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleExpand(e.id)}>
                        {expanded[e.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {expanded[e.id] && (
                    <div className="mt-3 pl-4 border-l border-border space-y-2">
                      {(logs[e.id] || []).length === 0 && (
                        <p className="text-xs text-muted-foreground">No step logs found.</p>
                      )}
                      {(logs[e.id] || []).map((log) => (
                        <div key={log.id} className="text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant={log.status === 'completed' ? 'default' : log.status === 'skipped' ? 'outline' : 'destructive'}>
                              {log.step_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          {log.error_message && <p className="text-xs text-destructive">{log.error_message}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex gap-4">
          <Link to="/admin/automation" className="text-sm text-primary hover:underline">Automation Center</Link>
          <Link to="/admin/automation/analytics" className="text-sm text-primary hover:underline">Analytics</Link>
        </div>
      </div>
    </MainLayout>
  );
}
