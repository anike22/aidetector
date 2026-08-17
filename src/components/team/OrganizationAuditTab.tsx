import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getOrganizationAuditLogs } from '@/lib/teamApi';
import type { AuditLogEntry } from '@/types/team';
import { formatDistanceToNow } from 'date-fns';

const CATEGORIES = ['user_management', 'workspace', 'billing', 'api', 'security', 'compliance', 'integration', 'automation'];
const SEVERITIES = ['info', 'warning', 'critical'];

export default function OrganizationAuditTab({ organizationId }: { organizationId: string }) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [severity, setSeverity] = useState<string>('all');

  useEffect(() => {
    getOrganizationAuditLogs(organizationId, 200).then(setLogs).catch(() => {});
  }, [organizationId]);

  const filtered = logs.filter((l) => (category === 'all' || l.category === category) && (severity === 'all' || l.severity === severity));

  const severityClass = (s?: string) => {
    if (s === 'critical') return 'bg-destructive text-destructive-foreground';
    if (s === 'warning') return 'bg-orange-500/20 text-orange-700';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Audit logs</CardTitle>
        <CardDescription>Recent security-relevant actions with filtering.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              {SEVERITIES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {filtered.map((log) => (
              <div key={log.id} className="p-3 border rounded-lg text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium capitalize">{log.action.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {log.category && <Badge variant="outline" className="capitalize">{log.category.replace(/_/g, ' ')}</Badge>}
                    {log.severity && <Badge className={`capitalize ${severityClass(log.severity)}`}>{log.severity}</Badge>}
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{log.user?.display_name || log.user?.email || 'System'}</p>
                {log.resource_type && <p className="text-xs text-muted-foreground">{log.resource_type} {log.resource_id}</p>}
              </div>
            ))}
            {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No audit entries match your filters.</p>}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
