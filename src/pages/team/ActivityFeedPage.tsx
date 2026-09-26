import { useEffect, useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { getActivityFeed } from '@/lib/enterpriseApi';
import type { ActivityFeed } from '@/types/enterprise';
import { formatDistanceToNow } from 'date-fns';

export default function ActivityFeedPage() {
  const [items, setItems] = useState<ActivityFeed[]>([]);

  useEffect(() => {
    getActivityFeed().then(setItems);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('activity-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_feeds' }, () => {
        getActivityFeed().then(setItems);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 md:px-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Activity feed</h1>
            <p className="text-sm text-muted-foreground">Global collaboration and system events.</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Recent activity</CardTitle>
            <CardDescription>All events from your organizations and workspaces.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm"><span className="font-medium">{a.user?.display_name || a.user?.email || 'System'}</span> {a.action} {a.resource_type} {a.resource_id}</p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">{a.resource_type} • {a.organization_id ? 'Organization' : 'Workspace'} • {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No activity yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
