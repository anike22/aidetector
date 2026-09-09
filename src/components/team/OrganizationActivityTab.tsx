import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { getOrganizationActivity } from '@/lib/enterpriseApi';
import { getOrganizationMembers } from '@/lib/teamApi';
import { supabase } from '@/db/supabase';
import type { ActivityFeed } from '@/types/enterprise';
import type { OrganizationMember } from '@/types/team';
import { formatDistanceToNow } from 'date-fns';
import EmptyState from './EmptyState';

const EVENT_TYPES = [
  'all',
  'user_invited',
  'invitation_accepted',
  'invitation_declined',
  'invitation_revoked',
  'member_joined',
  'member_removed',
  'role_changed',
  'role_updated',
  'department_changed',
  'department_created',
  'member_status_changed',
  'workspace_created',
  'workspace_deleted',
  'team_created',
  'team_deleted',
  'api_key_created',
  'api_key_revoked',
  'subscription_upgraded',
  'billing_updated',
];

const PAGE_SIZE = 10;

export default function OrganizationActivityTab({ organizationId }: { organizationId: string }) {
  const [items, setItems] = useState<ActivityFeed[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [eventType, setEventType] = useState('all');
  const [userId, setUserId] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (eventType !== 'all') filters.event_type = eventType;
      if (userId !== 'all') filters.user_id = userId;
      if (startDate) filters.start_date = new Date(startDate).toISOString();
      if (endDate) filters.end_date = new Date(endDate).toISOString();
      const [activity, orgMembers] = await Promise.all([
        getOrganizationActivity(organizationId, filters),
        getOrganizationMembers(organizationId),
      ]);
      setItems(activity);
      setMembers(orgMembers);
      setPage(1);
    } catch (err: any) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [organizationId, eventType, userId]);

  useEffect(() => {
    const channel = supabase
      .channel(`org-activity-${organizationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_feeds', filter: `organization_id=eq.${organizationId}` },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organizationId]);

  const filtered = useMemo(() => items, [items]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Activity Feed</CardTitle>
        <CardDescription>Live stream of organization events.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row flex-wrap gap-3">
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Event type" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">
                  {t.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger className="w-full md:w-56">
              <SelectValue placeholder="User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.user_id} value={m.user_id}>
                  {m.user?.full_name || m.user?.display_name || m.user?.email || m.user_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full md:w-44" placeholder="Start date" />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full md:w-44" placeholder="End date" />
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Apply'}
          </Button>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activity yet"
            description="Organization events will appear here as members invite users, create workspaces, and manage resources."
          />
        ) : (
          <div className="space-y-3">
            {pageItems.map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-3 border rounded-lg text-sm hover:bg-muted/30 transition-colors">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={a.user?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{(a.user?.display_name || a.user?.full_name || a.user?.email || 'S').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {a.user?.display_name || a.user?.full_name || a.user?.email || 'System'}
                    </span>
                    <ActivityStatusBadge action={a.action} />
                  </div>
                  <p className="text-muted-foreground truncate">
                    <span className="capitalize">{a.action.replace(/_/g, ' ')}</span>
                    {a.resource_type && <span> {a.resource_type.replace(/_/g, ' ')}</span>}
                    {a.metadata?.target_name ? <span className="font-medium text-foreground"> {String(a.metadata.target_name)}</span> : null}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}

            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityStatusBadge({ action }: { action: string }) {
  const lower = action.toLowerCase();
  if (lower.includes('created') || lower.includes('accepted') || lower.includes('joined') || lower.includes('added')) {
    return <Badge variant="default" className="capitalize text-[10px]">{action.replace(/_/g, ' ')}</Badge>;
  }
  if (lower.includes('deleted') || lower.includes('removed') || lower.includes('revoked') || lower.includes('failed') || lower.includes('declined')) {
    return <Badge variant="destructive" className="capitalize text-[10px]">{action.replace(/_/g, ' ')}</Badge>;
  }
  return <Badge variant="outline" className="capitalize text-[10px]">{action.replace(/_/g, ' ')}</Badge>;
}
