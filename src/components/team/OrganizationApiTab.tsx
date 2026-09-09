import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getOrganizationWorkspaces, getWorkspaceApiQuota, updateWorkspaceApiQuota } from '@/lib/teamApi';
import type { Workspace, WorkspaceApiQuota } from '@/types/team';

export default function OrganizationApiTab({ organizationId }: { organizationId: string }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [quotas, setQuotas] = useState<Record<string, WorkspaceApiQuota>>({});

  useEffect(() => {
    getOrganizationWorkspaces(organizationId).then(setWorkspaces).catch(() => {});
  }, [organizationId]);

  useEffect(() => {
    workspaces.forEach(async (ws) => {
      const q = await getWorkspaceApiQuota(ws.id);
      if (q) setQuotas((prev) => ({ ...prev, [ws.id]: q }));
    });
  }, [workspaces]);

  const updateQuota = async (wsId: string, value: number) => {
    try {
      const q = await updateWorkspaceApiQuota(wsId, value);
      setQuotas((prev) => ({ ...prev, [wsId]: q }));
      toast.success('Quota updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update quota');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">API management</CardTitle>
        <CardDescription>Allocate API quota to each workspace.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {workspaces.map((ws) => (
          <div key={ws.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg">
            <div>
              <p className="font-medium">{ws.name}</p>
              <p className="text-xs text-muted-foreground">Used: {quotas[ws.id]?.used || 0}</p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor={`quota-${ws.id}`} className="sr-only">Quota</Label>
              <Input
                id={`quota-${ws.id}`}
                type="number"
                defaultValue={quotas[ws.id]?.quota || 0}
                onBlur={(e) => updateQuota(ws.id, parseInt(e.target.value || '0', 10))}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">requests / mo</span>
            </div>
          </div>
        ))}
        {workspaces.length === 0 && <p className="text-sm text-muted-foreground">Create a workspace to allocate API quota.</p>}
      </CardContent>
    </Card>
  );
}
