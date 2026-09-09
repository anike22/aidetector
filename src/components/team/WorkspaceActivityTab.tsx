import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getActivityFeed } from '@/lib/enterpriseApi';
import type { ActivityFeed } from '@/types/enterprise';
import { formatDistanceToNow } from 'date-fns';

export default function WorkspaceActivityTab({ workspaceId }: { workspaceId: string }) {
  const [items, setItems] = useState<ActivityFeed[]>([]);

  useEffect(() => {
    getActivityFeed({ workspace_id: workspaceId }).then(setItems);
  }, [workspaceId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Activity feed</CardTitle>
        <CardDescription>Recent collaboration events in this workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm"><span className="font-medium">{a.user?.display_name || a.user?.email || 'System'}</span> {a.action} {a.resource_type} {a.resource_id}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{a.resource_type} • {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</p>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No activity yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
