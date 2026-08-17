import { Activity, FileText, Gauge, Key, MousePointer, PenTool, Search, ShieldCheck, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLifecycle } from '@/contexts/LifecycleContext';

const STAT_ITEMS = [
  { key: 'ai_scans', label: 'AI Scans', icon: Search },
  { key: 'words_analyzed', label: 'Words Analyzed', icon: FileText },
  { key: 'words_humanized', label: 'Words Humanized', icon: PenTool },
  { key: 'plagiarism_checks', label: 'Plagiarism Checks', icon: ShieldCheck },
  { key: 'api_requests', label: 'API Requests', icon: Key },
  { key: 'extension_usage', label: 'Extension Usage', icon: MousePointer },
  { key: 'plugin_activity', label: 'Plugin Activity', icon: Activity },
  { key: 'documents_processed', label: 'Documents Processed', icon: FileText },
  { key: 'time_saved_minutes', label: 'Time Saved (min)', icon: Zap },
];

export function UsageStatsSection() {
  const { usageStats, loading } = useLifecycle();

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base md:text-lg">Usage Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STAT_ITEMS.map((item) => {
            const value = (usageStats as Record<string, number> | null)?.[item.key] ?? 0;
            return (
              <div key={item.key} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-lg font-semibold tabular-nums">{value.toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
