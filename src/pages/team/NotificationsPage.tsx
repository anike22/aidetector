import { useEffect, useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/enterpriseApi';
import type { Notification } from '@/types/enterprise';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);

  const load = async () => {
    const data = await getMyNotifications();
    setItems(data);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel('user-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const markRead = async (id: string) => {
    await markNotificationRead(id);
    load();
  };

  const markAll = async () => {
    await markAllNotificationsRead();
    load();
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Notifications</h1>
              <p className="text-sm text-muted-foreground">Stay updated on mentions, tasks, approvals, and alerts.</p>
            </div>
          </div>
          <Button variant="outline" onClick={markAll}><Check className="h-4 w-4 mr-2" />Mark all read</Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {items.map((n) => (
                <div key={n.id} className={`p-4 flex items-start gap-3 ${n.is_read ? 'opacity-70' : 'bg-primary/5'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm capitalize">{n.type}</span>
                      {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{n.content}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="outline" className="capitalize">{n.resource_type || 'General'}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  {!n.is_read && <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>Mark read</Button>}
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No notifications yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
